import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';


export const helloWorldController: FastifyPluginCallback = (instance, options, done) => {
    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/',
        () => 'Hello world'
    );

    done();
};
