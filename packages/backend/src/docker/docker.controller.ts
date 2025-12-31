import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod/v4';

import { DockerService } from './docker.service';


export const dockerController: FastifyPluginCallback = (instance, options, done) => {
    const dockerService = new DockerService(instance);

    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/containers',
        async () => await dockerService.getContainers()
    );

    f.post(
        '/restart/:id',
        { schema: { params: z.object({ id: z.string().nonempty() }) } },
        async req => {
            await dockerService.requestRestart(req.params.id);
        }
    );

    done();
};
