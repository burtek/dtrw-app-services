import type { FastifyInstance } from 'fastify';
import z from 'zod/v4';

import { env } from '../config';
import { BaseRepo } from '../database/repo';


export class CaddyService extends BaseRepo {
    private readonly abortController = new AbortController();
    private nextFetch: undefined | NodeJS.Timeout;
    private routes: unknown[] = [];

    constructor(fastifyContext: FastifyInstance) {
        super(fastifyContext);

        void this.fetchRoutes();

        fastifyContext.addHook('onClose', () => {
            this.abortController.abort();
            if (this.nextFetch) {
                clearTimeout(this.nextFetch);
            }
        });
    }

    getRoutes() {
        return this.routes;
    }

    private async fetchRoutes() {
        if (!env.DOCKER_CADDY_ADMIN_HOST) {
            this.fastifyContext.log.warn('DOCKER_CADDY_ADMIN_HOST env is not set. Caddy routes will not be fetched');
            return;
        }

        try {
            const url = new URL(
                '/apps/http/servers/srv0/routes/',
                env.DOCKER_CADDY_ADMIN_HOST
            );
            const response = await fetch(url, { signal: this.abortController.signal });

            if (!response.ok) {
                throw new Error(`Error fetching current caddy routes: ${response.status}: ${response.statusText}`);
            }

            this.routes = z.array(z.unknown()).parse(await response.json());
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            this.fastifyContext.log.error(error as Error);
        } finally {
            this.scheduleNextFetch();
        }
    }

    private scheduleNextFetch() {
        this.nextFetch = setTimeout(() => {
            void this.fetchRoutes();
        }, env.CADDY_FETCH_INTERVAL * 1000);
    }
}
