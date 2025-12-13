import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { DockerService } from './docker.service';


export const dockerController: FastifyPluginCallback = (instance, options, done) => {
    const dockerService = new DockerService(instance);

    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/containers',
        async () => await dockerService.getContainers()
    );

    done();
};
