import Dockerode from 'dockerode';
import type { FastifyInstance } from 'fastify';

import type { DockeredEnv } from '../config';
import { env } from '../config';


class DockerProxyProvider {
    private readonly instance: Dockerode;

    constructor(private readonly verifiedEnv: DockeredEnv) {
        const url = new URL(verifiedEnv.DOCKER_PROXY);
        this.instance = new Dockerode({
            protocol: 'http',
            host: url.hostname,
            port: Number(url.port)
        });
    }

    get authelia() {
        return this.instance.getContainer(this.verifiedEnv.DOCKER_AUTHELIA_CONTAINER_NAME);
    }

    get containers() {
        return this.instance.listContainers();
    }

    get modem() {
        return this.instance.modem;
    }
}

export function decorateDockerProvider(app: FastifyInstance) {
    const proxy = env.DOCKER_PROXY
        ? new DockerProxyProvider(env)
        : undefined;

    app.decorate('dockerProxy', proxy);
}

declare module 'fastify' {
    interface FastifyInstance {
        dockerProxy?: DockerProxyProvider;
    }
}
