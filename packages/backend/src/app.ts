import type { FastifyServerOptions } from 'fastify';
import { fastify } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { getDb } from './database';
import { decorateRequestUser } from './decorators/auth.decorator';
import { decorateErrorHandler } from './decorators/error.decorator';
import { healthController } from './health/health.controller';
import { helloWorldController } from './helloworld/helloworld.controller';


export function createApp(opts: FastifyServerOptions = {}) {
    const app = fastify(opts);

    decorateErrorHandler(app);

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.register(healthController, { prefix: '/health' });

    decorateRequestUser(app);

    app.register(helloWorldController, { prefix: '/hello' });

    app.addHook('onClose', instance => {
        instance.log.info('Closing database...');
        getDb(instance.log).$client.close();
        instance.log.info('Database closed');
    });

    return {
        app,
        async shutdown(signal: string) {
            app.log.info(`Received ${signal}, shutting down gracefully...`);
            try {
                await app.close();
                app.log.info('Fastify closed. Bye!');
                // eslint-disable-next-line n/no-process-exit
                process.exit(0);
            } catch (err) {
                app.log.error(err, 'Error during shutdown');
                throw err;
            }
        }
    };
}
