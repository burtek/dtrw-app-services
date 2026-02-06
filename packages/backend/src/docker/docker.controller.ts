import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod/v4';

import { routeFp } from '../helpers/route-plugin';


const dockerController: FastifyPluginCallbackZod = (instance, options, done) => {
    instance.get(
        '/containers',
        async () => await instance.dockerService.getContainers()
    );

    instance.post(
        '/restart/:id',
        { schema: { params: z.object({ id: z.string().nonempty() }) } },
        async req => {
            await instance.dockerService.requestRestart(req.params.id);
        }
    );

    done();
};

export default routeFp(dockerController, {
    dependencies: ['docker-service'],
    decorators: { fastify: ['dockerService'] }
});
