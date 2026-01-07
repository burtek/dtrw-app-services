import type { FastifyServerOptions } from 'fastify';
import { fastify } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { decorateErrorHandler } from './decorators/error.decorator';


export const createPreDecoratedApp = (opts: FastifyServerOptions = {}) => {
    const app = fastify(opts);
    decorateErrorHandler(app);
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    return app;
};
