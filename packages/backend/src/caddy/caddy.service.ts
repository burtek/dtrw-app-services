import { copyFile, readFile, rename, writeFile } from 'node:fs/promises';

import { eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { env } from '../config';
import { caddyConfigs, ContainerType } from '../database/schemas';
import { AppError } from '../errors';

import type { CaddyConfigInput } from './caddy.schema';
import type { Route } from './caddy.template';
import { compileTemplate } from './caddy.template';


class CaddyService {
    constructor(private readonly fastifyContext: FastifyInstance) {
    }

    async getCaddyApi({ signal }: { signal?: AbortSignal } = {}) {
        if (!env.DOCKER_CADDY_ADMIN_HOST) {
            this.fastifyContext.log.warn('DOCKER_CADDY_ADMIN_HOST env is not set. Caddy API will not be fetched');
            return {};
        }

        const response = await fetch(`${env.DOCKER_CADDY_ADMIN_HOST}/config/`, { signal });
        return await response.json();
    }

    async getCaddyfile() {
        return await readFile(env.CADDY_CADDYFILE_PATH, 'utf-8');
    }

    async getCaddyfileAsApi({ signal }: { signal?: AbortSignal } = {}) {
        if (!env.DOCKER_CADDY_ADMIN_HOST) {
            this.fastifyContext.log.warn('DOCKER_CADDY_ADMIN_HOST env is not set. Caddy API will not be fetched');
            return {};
        }

        const response = await fetch(`${env.DOCKER_CADDY_ADMIN_HOST}/adapt/`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/caddyfile' },
            body: await this.getCaddyfile(),
            signal
        });
        return await response.json();
    }

    async getRoutes() {
        return await this.fastifyContext.database.db.query.caddyConfigs.findMany({ orderBy: (fields, { asc }) => [asc(fields.order)] });
    }

    async getRoutesAsCaddyfile() {
        const configs = await this.fastifyContext.database.db.query.caddyConfigs
            .findMany({
                orderBy: (fields, { asc }) => [asc(fields.order)],
                with: {
                    project: { with: { containers: true } },
                    container: true
                }
            });

        const mapped = await Promise.all(configs.map(async (config): Promise<Route | undefined> => {
            if (!config.project && config.container && config.standaloneContainerDomain) {
                const container = env.NODE_ENV === 'development'
                    ? {
                        ports: [
                            {
                                privatePort: {
                                    authelia: 9091,
                                    'uptime-kuma': 3001
                                }[config.container.name] ?? 80
                            }
                        ]
                    } // Dev shortcut
                    : await this.fastifyContext.dockerService.getContainerByName(config.container.name);

                if (!container) {
                    return undefined;
                }

                return {
                    urls: [config.standaloneContainerDomain] satisfies [string],
                    mode: 'standalone',
                    auth: config.auth,
                    target: `${config.container.name}:${container.ports[0]?.privatePort}` // authelia is on 9091, so we still need to pull from docker-proxy
                };
            }
            if (!config.container && config.project) {
                const backendContainer = config.project.containers.find(c => c.type === ContainerType.BACKEND);
                const frontendContainer = config.project.containers.find(c => c.type === ContainerType.FRONTEND);

                // eslint-disable-next-line no-nested-ternary
                const backendDockerContainer = backendContainer
                    ? env.NODE_ENV === 'development'
                        ? { ports: [{ privatePort: 4000 }] } // Dev shortcut
                        : await this.fastifyContext.dockerService.getContainerByName(backendContainer.name)
                    : undefined;
                // eslint-disable-next-line no-nested-ternary
                const frontendDockerContainer = frontendContainer
                    ? env.NODE_ENV === 'development'
                        ? { ports: [{ privatePort: 80 }] } // Dev shortcut
                        : await this.fastifyContext.dockerService.getContainerByName(frontendContainer.name)
                    : undefined;

                if (!backendContainer || !frontendContainer || !backendDockerContainer || !frontendDockerContainer) {
                    return undefined;
                }

                if (config.auth === 'provider') {
                    this.fastifyContext.log.warn(`Route for project ${config.project.name} has auth set to 'provider' enabled, but this is not allowed. Skipping route.`);
                    return undefined;
                }

                return {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    urls: [config.project.url, ...config.project.additionalUrls].map(url => new URL(url).hostname) as [string, ...string[]],
                    mode: 'project',
                    auth: config.auth,
                    backend: `${backendContainer.name}:${backendDockerContainer.ports[0]?.privatePort}`,
                    frontend: `${frontendContainer.name}:${frontendDockerContainer.ports[0]?.privatePort}`
                };
            }
            return undefined;
        }));

        return compileTemplate(mapped.filter(x => !!x));
    }

    async reorderRoutes(ids: number[]) {
        if (ids.length !== new Set(ids).size) {
            throw AppError.badRequest('Duplicate IDs in reorder list');
        }

        const configs = await this.fastifyContext.database.db.query.caddyConfigs
            .findMany({ orderBy: (fields, { asc }) => [asc(fields.order)] });

        if (ids.length !== configs.length || !ids.every(id => configs.some(c => c.id === id))) {
            throw AppError.badRequest('Reorder list does not match existing routes');
        }

        await this.fastifyContext.database.transaction(async tx => {
            await Promise.all(ids.map((id, index) => tx
                .update(caddyConfigs)
                .set({ order: -(index + 1) })
                .where(eq(caddyConfigs.id, id))));

            await tx
                .update(caddyConfigs)
                .set({ order: sql`-${caddyConfigs.order}` });
        });
    }

    async saveRoute(caddyRoute: CaddyConfigInput, configId: number | null = null) {
        if (configId === null) {
            return await this.fastifyContext.database.db
                .insert(caddyConfigs)
                .values(caddyRoute);
        }

        return await this.fastifyContext.database.db
            .update(caddyConfigs)
            .set(caddyRoute)
            .where(eq(caddyConfigs.id, configId));
    }

    async triggerApplyCaddyfile() {
        if (!env.DOCKER_CADDY_ADMIN_HOST) {
            this.fastifyContext.log.warn('DOCKER_CADDY_ADMIN_HOST env is not set. Caddyfile will not be applied');
            return false;
        }

        await fetch(`${env.DOCKER_CADDY_ADMIN_HOST}/load`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/caddyfile' },
            body: await this.getCaddyfile()
        });

        return true;
    }

    async triggerWriteCaddyfile() {
        try {
            await Promise.all([
                copyFile(env.CADDY_CADDYFILE_PATH, `${env.CADDY_CADDYFILE_PATH}.bak`),
                this.getRoutesAsCaddyfile().then(
                    contents => writeFile(`${env.CADDY_CADDYFILE_PATH}.tmp`, contents, 'utf-8')
                )
            ]);
            await rename(`${env.CADDY_CADDYFILE_PATH}.tmp`, env.CADDY_CADDYFILE_PATH);
            return true;
        } catch {
            return false;
        }
    }
}

export default fp((app, opts, done) => {
    const caddyService = new CaddyService(app);

    app.decorate('caddyService', caddyService);

    done();
}, {
    name: 'caddy-service',
    dependencies: ['database-plugin', 'docker-service', 'docker-proxy'],
    decorators: { fastify: ['database', 'dockerService', 'dockerProxy'] }
});

declare module 'fastify' {
    interface FastifyInstance {
        caddyService: CaddyService;
    }
}
