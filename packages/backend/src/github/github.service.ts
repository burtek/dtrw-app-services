import { env } from '../config';
import { BaseRepo } from '../database/repo';


export class GithubService extends BaseRepo {
    async getProjectsGithubWorkflows() {
        const projects = await this.getProjectsGithubUrls();

        const workflows = await Promise.all(
            projects.map(async project => {
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

        return workflows;
    }

    private async getProjectsGithubUrls() {
        return await this.db.query.projects.findMany({ columns: { id: true, github: true } });
    }

    private async getWorkflowStatusesForProject(projectUrl: string) {
        const slug = new URL(projectUrl).pathname.split('/').slice(1, 3).join('/'); // owner/repo
        const url = `https://api.github.com/repos/${slug}/actions/runs`;

        const response = await fetch(url, {
            headers: {
                authorization: `Bearer ${env.GITHUB_ACTIONS_PAT}`,
                accept: 'application/vnd.github+json'
            }
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
}

function isGithubWorkflowRunsResponse(obj: unknown): obj is GithubWorkflowRunsResponse {
    return typeof obj === 'object' && obj !== null && 'total_count' in obj && 'workflow_runs' in obj && Array.isArray(obj.workflow_runs);
}

/* eslint-disable @typescript-eslint/naming-convention */
interface GithubWorkflowRunsResponse {
    total_count: number;
    workflow_runs: Array<{
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
    }>;
}
