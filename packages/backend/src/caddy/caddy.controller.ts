import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { CaddyService } from './caddy.service';


export const caddyController: FastifyPluginCallback = (instance, options, done) => {
    const caddyService = new CaddyService(instance);

    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/routes',
        () => caddyService.getRoutes()
    );

    done();
};
