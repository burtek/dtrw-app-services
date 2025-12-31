import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { ContainerSchema } from './containers.schema';
import { ContainersService } from './containers.service';


export const containersController: FastifyPluginCallback = (instance, options, done) => {
    const containersService = new ContainersService(instance);

    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/',
        () => containersService.getContainers()
    );

    f.get(
        '/types',
        () => containersService.getAllowedContainerTypes()
    );

    f.post(
        '/',
        { schema: { body: ContainerSchema } },
        async request => await containersService.create(request.body)
    );

    f.post(
        '/:id',
        {
            schema: {
                body: ContainerSchema,
                params: z.object({ id: z.coerce.number().positive().refine(val => Number.isInteger(val)) })
            }
        },
        async request => await containersService.update(request.params.id, request.body)
    );

    f.delete(
        '/:id',
        { schema: { params: z.object({ id: z.coerce.number().positive().refine(val => Number.isInteger(val)) }) } },
        async request => {
            await containersService.delete(request.params.id);
            return true;
        }
    );

    done();
};
