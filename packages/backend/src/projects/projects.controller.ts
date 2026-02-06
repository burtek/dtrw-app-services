import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { routeFp } from '../helpers/route-plugin';

import { ProjectSchema } from './projects.schema';


const projectsController: FastifyPluginCallbackZod = (instance, options, done) => {
    instance.get(
        '/',
        () => instance.projectsService.getProjects()
    );

    instance.post(
        '/',
        { schema: { body: ProjectSchema } },
        async request => await instance.projectsService.create(request.body)
    );

    instance.post(
        '/:id',
        {
            schema: {
                body: ProjectSchema,
                params: z.object({ id: z.coerce.number().positive().refine(val => Number.isInteger(val)) })
            }
        },
        async request => await instance.projectsService.update(request.params.id, request.body)
    );

    instance.delete(
        '/:id',
        { schema: { params: z.object({ id: z.coerce.number().positive().refine(val => Number.isInteger(val)) }) } },
        async request => {
            await instance.projectsService.delete(request.params.id);
            return true;
        }
    );

    done();
};

export default routeFp(projectsController, {
    dependencies: ['projects-service'],
    decorators: { fastify: ['projectsService'] }
});
