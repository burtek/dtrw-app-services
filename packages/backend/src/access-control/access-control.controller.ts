import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod/v4';

import { AccessControlPolicySchema, AccessControlRulesSchema } from '../_schemas/authelia/configuration.schema';

import { AccessControlService } from './access-control.service';


export const accessControlController: FastifyPluginCallback = (instance, options, done) => {
    const accessControlService = new AccessControlService(instance);

    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/',
        async () => await accessControlService.getConfig()
    );

    f.post(
        '/rules',
        { schema: { body: AccessControlRulesSchema } },
        async request => {
            await accessControlService.saveRules(request.body);
        }
    );

    f.post(
        '/default_policy',
        { schema: { body: z.object({ policy: AccessControlPolicySchema }) } },
        async request => {
            await accessControlService.saveDefaultPolicy(request.body.policy);
        }
    );

    done();
};
