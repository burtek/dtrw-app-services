import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod/v4';

import { GithubService } from './github.service';


export const githubController: FastifyPluginCallback = (instance, options, done) => {
    const githubService = new GithubService(instance);

    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/workflow-runs',
        () => githubService.getProjectsGithubWorkflows()
    );

    f.post(
        '/webhook',
        {
            config: { rawBody: true },
            schema: { body: z.looseObject({}) }
        },
        async (req, res) => {
            if (!githubService.validateSignature(req.headers['x-hub-signature-256'], req.rawBody)) {
                return await res.code(401).send();
            }

            const type = req.headers['x-github-event'];
            if (typeof type !== 'string') {
                return await res.code(400).send({ message: 'Missing X-GitHub-Event header' });
            }

            return await res.code(202).send(githubService.processWebhook(type, req.body));
        }
    );

    // f.post(
    //     '/cancel/:repoId/:runId',
    //     { schema: { params: z.object({ id: z.string().nonempty() }) } },
    //     async req => {
    //         await dockerService.requestRestart(req.params.id);
    //     }
    // );

    done();
};
