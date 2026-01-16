export interface Project {
    slug: string;
    name: string;
    github: string;
    jira: string;
    url: string;
    additionalUrls: string[];
    planned: boolean;
}

export interface Container {
    name: string;
    projectId: number;
    type: 'frontend' | 'backend' | 'database' | 'docker-proxy' | 'standalone';
}

export interface DockerContainer {
    names: string[];
    image: string;
    command: string;
    ports: {
        ip: string;
        privatePort: number;
        publicPort: number;
        type: string;
    }[];
    labels: Record<string, string>;
    state: string;
    status: string;
    networks: Record<string, {
        name: string;
        mac: string;
        networkID: string;
        endpointID: string;
        gateway: string;
        ipAddress: string;
    }>;
    mounts: {
        type: string;
        source: string;
        destination: string;
        mode: string;
        rw: boolean;
    }[];
}

export interface GetUser {
    displayname: string;
    groups: string[];
    disabled: boolean;
    email?: string | null;
}
export interface CreateUser extends GetUser {
    password?: string;
    username: string;
}
export type UpdateUser = Partial<CreateUser>;

export interface Workflow {
    id: number;
    name: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    html_url: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    head_commit: {
        id: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        tree_id: string;
        message: string;
        timestamp: string;
        author: {
            name: string;
            email: string;
        };
        committer: {
            name: string;
            email: string;
        };
    };
}
export interface ProjecktWorkflows {
    projectId: number;
    workflows: Record<string, Workflow>;
    error: null;
}

export type WithId<T, ID = number> = T & { id: ID };
export type MaybeWithId<T, ID = number> = T & { id?: ID | null };
