import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod/v4';

import { AppError } from '../errors';
import { handleAbort } from '../helpers/handle-abort';
import { routeFp } from '../helpers/route-plugin';

import { CaddyConfigInputSchema } from './caddy.schema';


const caddyController: FastifyPluginCallbackZod = (instance, opts, done) => {
    instance.get(
        '/routes/config',
        { schema: { querystring: z.object({ as: z.enum(['config', 'caddyfile']).default('config') }) } },
        request => {
            switch (request.query.as) {
                case 'config':
                    return instance.caddyService.getRoutes();
                case 'caddyfile':
                    return instance.caddyService.getRoutesAsCaddyfile();
            }
            throw AppError.badRequest('Invalid format requested');
        }
    );

    instance.get(
        '/routes/caddyfile',
        { schema: { querystring: z.object({ as: z.enum(['caddyfile', 'api']).default('caddyfile') }) } },
        request => {
            switch (request.query.as) {
                case 'caddyfile':
                    return instance.caddyService.getCaddyfile();
                case 'api':
                    return instance.caddyService.getCaddyfileAsApi({ signal: handleAbort(request) });
            }
            throw AppError.badRequest('Invalid format requested');
        }
    );

    instance.get(
        '/routes/api',
        request => instance.caddyService.getCaddyApi({ signal: handleAbort(request) })
    );

    instance.post(
        '/trigger/write-caddyfile',
        async () => await instance.caddyService.triggerWriteCaddyfile()
    );

    instance.post(
        '/trigger/apply-caddyfile',
        async () => await instance.caddyService.triggerApplyCaddyfile()
    );

    instance.post(
        '/route/:id?',
        {
            schema: {
                params: z.object({ id: z.coerce.number().optional() }),
                body: CaddyConfigInputSchema
            }
        },
        async request => await instance.caddyService.saveRoute(request.body, request.params.id)
    );

    instance.post(
        '/routes/config/reorder',
        {
            schema: {
                //
                body: z.object({ ids: z.array(z.number()) })
            }
        },
        async request => {
            await instance.caddyService.reorderRoutes(request.body.ids);
            return true;
        }
    );

    done();
};

export default routeFp(caddyController, {
    dependencies: ['caddy-service'],
    decorators: { fastify: ['caddyService'] }
});
