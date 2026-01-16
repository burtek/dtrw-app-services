import type { FastifyInstance } from 'fastify';

import { env } from '../config';
import { BaseRepo } from '../database/repo';


const WEBOOK_THROTTLE_MS = 5 * 1000; // 5 seconds // env?

export class GithubService extends BaseRepo {
    private readonly closeAbortController: AbortController = new AbortController();
    private data: WokflowItem[] = [];
    private refetchTimeout: NodeJS.Timeout | undefined;
    private readonly throttleData = new Map<string, {
        lastCallTime: number;
        timeoutHandle: NodeJS.Timeout | null;
    }>();

    constructor(fastifyContext: FastifyInstance) {
        super(fastifyContext);

        void this.refetchProjectsGithubWorkflows();

        fastifyContext.addHook('onClose', () => {
            this.closeAbortController.abort();
            clearInterval(this.refetchTimeout);
        });
    }

    getProjectsGithubWorkflows() {
        return this.data;
    }

    processWebhook(type: string, payload: unknown) {
        if (type === 'workflow_run' || type === 'workflow_job') {
            const repositorySlug = typeof payload === 'object'
                && payload !== null
                && 'repository' in payload
                && typeof payload.repository === 'object'
                && payload.repository !== null
                && 'full_name' in payload.repository
                && typeof payload.repository.full_name === 'string'
                ? payload.repository.full_name
                : undefined;

            if (repositorySlug) {
                return this.throttleWebhookRefetch(repositorySlug);
            }
            return { status: 'ignored', reason: 'missing_repository_slug' };
        }
        return { status: 'ignored', reason: 'unsupported_event_type' };
    }

    private async getProjectsGithubUrls(githubSlug?: string) {
        return await this.db.query.projects.findMany({
            columns: { id: true, github: true },
            where(fields, operators) {
                if (githubSlug) {
                    return operators.like(fields.github, `%${githubSlug}%`);
                }
                return operators.eq(fields.planned, false);
            }
        });
    }

    private async getWorkflowStatusesForProject(projectUrl: string) {
        const slug = new URL(projectUrl).pathname.split('/').slice(1, 3).join('/'); // owner/repo
        const url = `https://api.github.com/repos/${slug}/actions/runs`;

        const response = await fetch(url, {
            headers: {
                authorization: `Bearer ${env.GITHUB_ACTIONS_PAT}`,
                accept: 'application/vnd.github+json'
            },
            signal: this.closeAbortController.signal
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch workflow statuses for project ${projectUrl}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!isGithubWorkflowRunsResponse(data)) {
            throw new Error(`Invalid response format when fetching workflow statuses for project ${projectUrl}`);
        }

        const grouped = Object.fromEntries(
            Object.entries(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                Object.groupBy(
                    data.workflow_runs.filter(run => run.conclusion !== 'skipped' && run.event !== 'dynamic'),
                    run => run.name
                ) as Record<string, typeof data.workflow_runs>
            ).map(([name, [run]]) => [name, run])
        );

        return grouped;
    }

    /** @throws never */
    private async refetchProjectsGithubWorkflows(githubSlug?: string, setupRefetch = true) {
        const projects = await this.getProjectsGithubUrls(githubSlug);

        const data = await Promise.all(
            projects.map<Promise<WokflowItem>>(async project => {
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

    private throttleWebhookRefetch(slug: string) {
        const now = Date.now();
        const throttleInfo = this.throttleData.get(slug);

        if (!throttleInfo) {
            this.throttleData.set(slug, {
                lastCallTime: now,
                timeoutHandle: null
            });
            void this.refetchProjectsGithubWorkflows(slug, false);
            return { status: 'initiated', reason: 'first_call' };
        }

        const timeSinceLastCall = now - throttleInfo.lastCallTime;

        if (timeSinceLastCall >= WEBOOK_THROTTLE_MS) {
            throttleInfo.lastCallTime = now;
            void this.refetchProjectsGithubWorkflows(slug, false);
            return { status: 'initiated', reason: 'enough_time_passed' };
        }
        if (throttleInfo.timeoutHandle === null) {
            const waitTime = WEBOOK_THROTTLE_MS - timeSinceLastCall;
            throttleInfo.timeoutHandle = setTimeout(() => {
                throttleInfo.lastCallTime = Date.now();
                throttleInfo.timeoutHandle = null;
                void this.refetchProjectsGithubWorkflows(slug, false);
            }, waitTime);
            return { status: 'scheduled', reason: 'within_throttle_period' };
        }
        return { status: 'skipped', reason: 'already_scheduled' };
    }
}

function isGithubWorkflowRunsResponse(obj: unknown): obj is GithubWorkflowRunsResponse {
    return typeof obj === 'object' && obj !== null && 'total_count' in obj && 'workflow_runs' in obj && Array.isArray(obj.workflow_runs);
}

/* eslint-disable @typescript-eslint/naming-convention */
interface GithubWorkflowRun {
    id: number;
    name: string;
    head_branch: string;
    head_sha: string;
    display_title: string;
    run_number: number;
    event: string;
    status: string;
    conclusion: string | null;
    url: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    jobs_url: string;
    logs_url: string;
    check_suite_url: string;
    artifacts_url: string;
    cancel_url: string;
    rerun_url: string;
    workflow_url: string;
    head_commit: {
        id: string;
        tree_id: string;
        message: string;
        timestamp: string;
    };
    repository: {
        id: number;
        name: string;
        full_name: string;
        html_url: string;
    };
}

interface GithubWorkflowRunsResponse {
    total_count: number;
    workflow_runs: GithubWorkflowRun[];
}

type WokflowItem = {
    projectId: number;
    workflows: Record<string, GithubWorkflowRun>;
    error: null;
} | {
    projectId: number;
    workflows: null;
    error: string;
};
