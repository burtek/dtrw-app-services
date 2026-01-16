import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { GithubService } from './github.service';


export const githubController: FastifyPluginCallback = (instance, options, done) => {
    const githubService = new GithubService(instance);

    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/workflow-runs',
        async () => await githubService.getProjectsGithubWorkflows()
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
