import { createHmac, timingSafeEqual } from 'node:crypto';

import { Octokit } from '@octokit/core';
import type { components } from '@octokit/openapi-types';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { env } from '../config';
import type { Project } from '../database/schemas/projects';


class GithubProjectsRepo {
    constructor(private readonly fastifyContext: FastifyInstance) {
    }

    protected async getBySlug(githubSlug: string) {
        return await this.fastifyContext.database.db.query.projects.findFirst({
            where(fields, operators) {
                return operators.eq(fields.github, `https://github.com/${githubSlug}`);
            }
        });
    }

    protected async getProjectsGithubUrls(githubSlug?: string) {
        return await this.fastifyContext.database.db.query.projects.findMany({
            columns: { id: true, github: true },
            where(fields, operators) {
                const coditions = [operators.eq(fields.planned, false)];

                if (githubSlug) {
                    coditions.push(operators.like(fields.github, `%${githubSlug}%`));
                }
                return operators.and(...coditions);
            }
        });
    }
}

export class GithubService extends GithubProjectsRepo {
    private readonly closeAbortController: AbortController = new AbortController();
    private data: WorkflowItem[] = [];
    private readonly octokit = new Octokit({ auth: env.GITHUB_ACTIONS_PAT });
    private refetchTimeout: NodeJS.Timeout | undefined;

    constructor(fastifyContext: FastifyInstance) {
        super(fastifyContext);

        void this.refetchProjectsGithubWorkflows();

        fastifyContext.addHook('onClose', () => {
            this.closeAbortController.abort();
            clearTimeout(this.refetchTimeout);
        });
    }

    getProjectsGithubWorkflows() {
        return this.data;
    }

    async processWebhook(type: string, payload: Record<string, unknown>) {
        if (type === 'ping') {
            return { status: 'pong' };
        }
        if (type !== 'workflow_run') {
            return { status: 'ignored', reason: 'only workflow_run event is handled now' };
        }
        const repositorySlug = typeof payload.repository === 'object'
            && payload.repository !== null
            && 'full_name' in payload.repository
            && typeof payload.repository.full_name === 'string'
            ? payload.repository.full_name
            : undefined;

        if (!repositorySlug) {
            return { status: 'ignored', reason: 'missing_repository_slug' };
        }

        const project = await this.getBySlug(repositorySlug);

        if (!project) {
            return { status: 'ignored', reason: 'unknown_repository' };
        }

        this.processWorkflowRunWebhookPayload(project, payload);

        return { status: 'accepted' };
    }

    validateSignature(sig: unknown, rawBody: unknown): boolean {
        if (!Buffer.isBuffer(rawBody)) {
            throw new Error('rawBody is required for webhook signature verification');
        }
        const expected = `sha256=${
            createHmac('sha256', env.GITHUB_WEBHOOK_SECRET)
                .update(rawBody)
                .digest('hex')
        }`;

        return timingSafeEqual(
            Buffer.from(typeof sig === 'string' ? sig : ''),
            Buffer.from(expected)
        );
    }

    private async getWorkflowStatusesForProject(projectUrl: string) {
        const { owner, repo } = this.githubUrlToSlug(projectUrl);
        const response = await this.octokit.request(
            'GET /repos/{owner}/{repo}/actions/runs',
            {
                owner,
                repo,
                signal: this.closeAbortController.signal
            }
        );

        const grouped = Object.fromEntries(
            Object.entries(
                Object.groupBy(
                    response.data.workflow_runs
                        .filter(run => run.conclusion !== 'skipped' && run.event !== 'dynamic'),
                    run => run.name ?? run.path
                )
            ).flatMap(([name, runs]) => (runs?.[0] ? [[name, runs[0]]] : []))
        );

        return grouped;
    }

    private githubUrlToSlug(url: string) {
        const [owner, repo] = new URL(url).pathname.split('/').slice(1, 3);
        if (!owner || !repo) {
            throw new Error(`Invalid GitHub URL: ${url}`);
        }
        return {
            slug: `${owner}/${repo}`,
            owner,
            repo
        };
    }

    private processWorkflowRunWebhookPayload(
        project: Project,
        payload: Record<string, unknown>
    ) {
        // eslint-disable-next-line -- for type checking only (would be nice to validate with zod, but idc)
        function fakeAssertType<T>(arg: unknown): asserts arg is T {}

        switch (payload.action) {
            case 'requested':
                fakeAssertType<components['schemas']['webhook-workflow-run-requested']>(payload);
                break;
            case 'in_progress':
                fakeAssertType<components['schemas']['webhook-workflow-run-in-progress']>(payload);
                break;
            case 'completed':
                fakeAssertType<components['schemas']['webhook-workflow-run-completed']>(payload);
                if (payload.workflow_run.conclusion === 'skipped') {
                    void this.refetchProjectsGithubWorkflows(this.githubUrlToSlug(project.github).slug, false);
                    return;
                }
                break;
            default:
                return;
        }

        if (!payload.workflow?.name) {
            return;
        }
        let projectData = this.data.find(d => d.projectId === project.id);
        if (!projectData) {
            this.data.push(projectData = { projectId: project.id, workflows: null, error: null });
        }
        projectData.workflows ??= {};

        const currentEntry = projectData.workflows[payload.workflow.name];
        if (currentEntry && currentEntry.id > payload.workflow_run.id) {
            return; // older run, ignore
        }

        projectData.workflows[payload.workflow.name] = {
            ...payload.workflow_run,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            head_commit: {
                ...payload.workflow_run.head_commit,
                author: {
                    ...payload.workflow_run.head_commit.author,
                    email: payload.workflow_run.head_commit.author.email ?? ''
                },
                committer: {
                    ...payload.workflow_run.head_commit.committer,
                    email: payload.workflow_run.head_commit.committer.email ?? ''
                }
            }
        };
    }

    /** @throws never */
    private async refetchProjectsGithubWorkflows(githubSlug?: string, setupRefetch = true) {
        const projects = await this.getProjectsGithubUrls(githubSlug);

        const data = await Promise.all(
            projects.map<Promise<WorkflowItem>>(async project => {
                try {
                    const statuses = await this.getWorkflowStatusesForProject(project.github);
                    return {
                        projectId: project.id,
                        workflows: statuses,
                        error: null
                    };
                } catch (error) {
                    return {
                        projectId: project.id,
                        workflows: null,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            })
        );

        data.forEach(item => {
            const existingIndex = this.data.findIndex(d => d.projectId === item.projectId);
            if (existingIndex >= 0) {
                this.data[existingIndex] = item;
            } else {
                this.data.push(item);
            }
        });

        if (setupRefetch) {
            this.setupRefetch();
        }
    }

    private setupRefetch() {
        if (this.closeAbortController.signal.aborted) {
            return undefined;
        }

        this.refetchTimeout = setTimeout(
            () => this.refetchProjectsGithubWorkflows(),
            env.GITHUB_POLLING_INTERVAL
        );
        return this.refetchTimeout;
    }
}

type Redefined = 'actor' | 'triggering_actor' | 'repository' | 'head_repository' | 'pull_requests' | 'display_title';
type WorkflowRun = Omit<components['schemas']['workflow-run'], Redefined> & {
    actor?: Partial<components['schemas']['workflow-run']['actor']> | null;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    triggering_actor?: Partial<components['schemas']['workflow-run']['triggering_actor']> | null;
    repository: Omit<components['schemas']['workflow-run']['repository'], 'owner'> & {
        //
        owner?: Partial<components['schemas']['workflow-run']['repository']['owner']> | null;
    };
    // eslint-disable-next-line @typescript-eslint/naming-convention
    head_repository: Omit<components['schemas']['workflow-run']['head_repository'], 'owner' | 'name'> & {
        owner?: Partial<components['schemas']['workflow-run']['head_repository']['owner']> | null;
        name?: string | null;
    };
    // eslint-disable-next-line @typescript-eslint/naming-convention
    display_title?: string | null;
};
interface WorkflowItem {
    projectId: number;
    workflows: Record<string, WorkflowRun> | null;
    error: string | null;
}

// ------------------- Fastify plugin wrapper ------------------ //

export default fp((app, opts, done) => {
    const githubService = new GithubService(app);

    app.decorate('githubService', githubService);

    done();
}, {
    name: 'github-service',
    dependencies: ['database-plugin'],
    decorators: { fastify: ['database'] }
});

declare module 'fastify' {
    interface FastifyInstance {
        githubService: GithubService;
    }
}
