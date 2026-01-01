export interface Project {
    slug: string;
    name: string;
    github: string;
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

export type WithId<T, ID = number> = T & { id: ID };
export type MaybeWithId<T, ID = number> = T & { id?: ID | null };
