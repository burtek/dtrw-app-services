import type { FastifyServerOptions } from 'fastify';

import { accessControlController } from './access-control/access-control.controller';
import { createPreDecoratedApp } from './app-base';
import { caddyController } from './caddy/caddy.controller';
import { containersController } from './containers/containers.controller';
import { getDb } from './database';
import { decorateRequestUser } from './decorators/auth.decorator';
import { decorateDockerProvider } from './decorators/docker.decorator';
import { decorateErrorHandler } from './decorators/error.decorator';
import { decorateMailerHandler } from './decorators/mailer.decorator';
import { dockerController } from './docker/docker.controller';
import { healthController } from './health/health.controller';
import { projectsController } from './projects/projects.controller';
import { usersController } from './users/users.controller';


export function createApp(opts: FastifyServerOptions = {}) {
    const app = createPreDecoratedApp(opts);

    app.register(healthController, { prefix: '/health' });

    decorateErrorHandler(app);
    decorateRequestUser(app);
    decorateDockerProvider(app);
    decorateMailerHandler(app);

    app.register(projectsController, { prefix: '/projects' });
    app.register(containersController, { prefix: '/containers' });
    app.register(dockerController, { prefix: '/docker' });
    app.register(usersController, { prefix: '/users' });

    app.register(accessControlController, { prefix: '/access-control' });
    app.register(caddyController, { prefix: '/caddy' });

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
