import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod/v4';

import { AccessControlPolicySchema } from '../_schemas/authelia/configuration.schema';
import { routeFp } from '../helpers/route-plugin';

import { AccessControlConfigSchema } from './access-control.schema';


const accessControlController: FastifyPluginCallbackZod = (instance, opts, done) => {
    instance.get(
        '/config',
        async () => await instance.accessControlService.getExpectedConfig()
    );

    instance.get(
        '/actual',
        async () => await instance.accessControlService.getActualConfig()
    );

    instance.get(
        '/expected',
        async () => await instance.accessControlService.getExpectedConfigAsApplied()
    );

    instance.post(
        '/config/:id?',
        {
            schema: {
                params: z.object({ id: z.coerce.number().optional() }),
                body: AccessControlConfigSchema
            }
        },
        async request => await instance.accessControlService.saveRule(request.body, request.params.id)
    );

    instance.delete(
        '/config/:id',
        { schema: { params: z.object({ id: z.coerce.number() }) } },
        async request => await instance.accessControlService.deleteRule(request.params.id)
    );

    instance.post(
        '/config/reorder',
        { schema: { body: z.object({ ids: z.array(z.number()) }) } },
        async request => {
            await instance.accessControlService.reorderRules(request.body.ids);
            return true;
        }
    );

    instance.post(
        '/default_policy',
        { schema: { body: z.object({ policy: AccessControlPolicySchema }) } },
        async request => {
            await instance.accessControlService.saveDefaultPolicy(request.body.policy);
        }
    );

    instance.post(
        '/trigger/apply',
        async () => await instance.accessControlService.applyConfig()
    );

    done();
};

export default routeFp(accessControlController, {
    dependencies: ['access-control-service'],
    decorators: { fastify: ['accessControlService'] }
});
