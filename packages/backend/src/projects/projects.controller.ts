import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { ProjectSchema } from './projects.schema';
import { ProjectsService } from './projects.service';


export const projectsController: FastifyPluginCallback = (instance, options, done) => {
    const projectsService = new ProjectsService(instance);

    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/',
        () => projectsService.getProjects()
    );

    f.post(
        '/',
        { schema: { body: ProjectSchema } },
        async request => await projectsService.create(request.body)
    );

    f.post(
        '/:id',
        {
            schema: {
                body: ProjectSchema,
                params: z.object({ id: z.coerce.number().positive().refine(val => Number.isInteger(val)) })
            }
        },
        async request => await projectsService.update(request.params.id, request.body)
    );

    f.delete(
        '/:id',
        { schema: { params: z.object({ id: z.coerce.number().positive().refine(val => Number.isInteger(val)) }) } },
        async request => {
            await projectsService.delete(request.params.id);
            return true;
        }
    );

    done();
};
