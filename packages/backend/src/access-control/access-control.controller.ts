import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { AccessControlRulesSchema } from 'src/_schemas/authelia/configuration.schema';

import { AccessControlService } from './access-control.service';


export const accessControlController: FastifyPluginCallback = (instance, options, done) => {
    const accessControlService = new AccessControlService(instance);

    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/',
        async () => await accessControlService.getRules()
    );

    f.post(
        '/',
        { schema: { body: AccessControlRulesSchema } },
        async request => {
            await accessControlService.saveRules(request.body);
        }
    );

    done();
};
