import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod/v4';

import { routeFp } from '../helpers/route-plugin';


const githubController: FastifyPluginCallbackZod = (instance, options, done) => {
    instance.get(
        '/workflow-runs',
        () => instance.githubService.getProjectsGithubWorkflows()
    );

    instance.post(
        '/webhook',
        {
            config: { rawBody: true },
            schema: { body: z.looseObject({}) }
        },
        async (req, res) => {
            if (!instance.githubService.validateSignature(req.headers['x-hub-signature-256'], req.rawBody)) {
                return await res.code(401).send();
            }

            const type = req.headers['x-github-event'];
            if (typeof type !== 'string') {
                return await res.code(400).send({ message: 'Missing X-GitHub-Event header' });
            }

            return await res.code(202).send(instance.githubService.processWebhook(type, req.body));
        }
    );

    // isntance.post(
    //     '/cancel/:repoId/:runId',
    //     { schema: { params: z.object({ id: z.string().nonempty() }) } },
    //     async req => {
    //         await dockerService.requestRestart(req.params.id);
    //     }
    // );

    done();
};

export default routeFp(githubController, {
    dependencies: ['github-service'],
    decorators: { fastify: ['githubService'] }
});
