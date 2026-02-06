import type { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';
import type { PluginMetadata } from 'fastify-plugin';
import fp from 'fastify-plugin';


export const routeFp = (
    controller: FastifyPluginCallback | FastifyPluginAsync,
    opts: PluginMetadata
) => fp((app, { prefix }: { prefix: string }, done) => {
    app.register(controller, { prefix });
    done();
}, opts);
