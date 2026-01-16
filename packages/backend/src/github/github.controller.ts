import { createHmac, timingSafeEqual } from 'node:crypto';

import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { env } from '../config';

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
        { config: { rawBody: true } },
        async (req, res) => {
            const sig = req.headers['x-hub-signature-256'];

            if (!sig || typeof sig !== 'string') {
                return await res.code(401).send();
            }

            const { rawBody } = req;
            if (!Buffer.isBuffer(rawBody)) {
                throw new Error('rawBody is required for webhook signature verification');
            }
            const expected = `sha256=${
                createHmac('sha256', env.GITHUB_WEBHOOK_SECRET)
                    .update(rawBody)
                    .digest('hex')
            }`;

            if (!timingSafeEqual(
                Buffer.from(sig),
                Buffer.from(expected)
            )) {
                return await res.code(401).send();
            }

            const type = req.headers['x-github-event'];
            if (typeof type !== 'string') {
                return await res.code(400).send();
            }

            void githubService.processWebhook(type, req.body);

            return await res.code(204).send();
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
