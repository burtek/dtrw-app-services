import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { routeFp } from '../helpers/route-plugin';

import { ContainerSchema } from './containers.schema';


const containersController: FastifyPluginCallbackZod = (instance, options, done) => {
    instance.get(
        '/',
        () => instance.containersService.getContainers()
    );

    instance.get(
        '/types',
        () => instance.containersService.getAllowedContainerTypes()
    );

    instance.post(
        '/',
        { schema: { body: ContainerSchema } },
        async (request, reply) => {
            const created = await instance.containersService.create(request.body);
            return await reply.status(201).send(created);
        }
    );

    instance.post(
        '/:id',
        {
            schema: {
                body: ContainerSchema,
                params: z.object({ id: z.coerce.number().positive().refine(val => Number.isInteger(val)) })
            }
        },
        async request => await instance.containersService.update(request.params.id, request.body)
    );

    instance.delete(
        '/:id',
        { schema: { params: z.object({ id: z.coerce.number().positive().refine(val => Number.isInteger(val)) }) } },
        async request => {
            await instance.containersService.delete(request.params.id);
            return true;
        }
    );

    done();
};

export default routeFp(containersController, {
    dependencies: ['containers-service'],
    decorators: { fastify: ['containersService'] }
});
