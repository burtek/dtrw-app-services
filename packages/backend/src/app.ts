import type { FastifyServerOptions } from 'fastify';
import { fastify } from 'fastify';
import { fastifyRawBody } from 'fastify-raw-body';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';


// import { accessControlController } from './access-control/access-control.controller';
import caddyController from './caddy/caddy.controller';
import caddyService from './caddy/caddy.service';
import containersController from './containers/containers.controller';
import containersService from './containers/containers.service';
import databasePlugin from './database';
import dockerController from './docker/docker.controller';
import dockerService from './docker/docker.service';
import githubController from './github/github.controller';
import githubService from './github/github.service';
import healthController from './health/health.controller';
import healthService from './health/health.service';
import authPlugin from './plugins/auth.plugin';
import dockerProxyPlugin from './plugins/docker-proxy.plugin';
import { errorHandler } from './plugins/error.handler';
import mailerPlugin from './plugins/mailer.plugin';
import projectsController from './projects/projects.controller';
import projectsService from './projects/projects.service';
import { createPluginRegistry } from './services-registry';
import usersController from './users/users.controller';
import usersService from './users/users.service';


export async function createApp(opts: FastifyServerOptions = {}) {
    const app = fastify(opts);

    await app.register(fastifyRawBody, {
        field: 'rawBody',
        global: false,
        encoding: false,
        runFirst: true
    });

    app.setErrorHandler(errorHandler);

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    //  Decorators
    app.register(authPlugin);
    app.register(databasePlugin);
    app.register(dockerProxyPlugin);
    app.register(mailerPlugin);

    // Services
    createPluginRegistry(app)
        .use(caddyService)
        .use(containersService)
        .use(dockerService)
        .use(githubService)
        .use(healthService)
        .use(projectsService)
        .use(usersService)
        .registerAll();

    // Controllers
    app.register(caddyController, { prefix: '/caddy' });
    app.register(containersController, { prefix: '/containers' });
    app.register(dockerController, { prefix: '/docker' });
    app.register(githubController, { prefix: '/github' });
    app.register(healthController, { prefix: '/health' });
    app.register(projectsController, { prefix: '/projects' });
    app.register(usersController, { prefix: '/users' });

    // Controllers todo
    // app.register(accessControlController, { prefix: '/access-control' });

    await app.ready();

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
        },
        runMigrations() {
            app.database.runMigrations();
        }
    };
}
