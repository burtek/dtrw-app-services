import fp from 'fastify-plugin';

import packageJson from '../../package.json' with { type: 'json' };


class HealthService {
    getVersion(): string {
        return packageJson.version;
    }
}

export default fp((app, opts, done) => {
    const healthService = new HealthService();

    app.decorate('healthService', healthService);

    done();
}, {
    name: 'health-service',
    dependencies: ['database-plugin'],
    decorators: { fastify: ['database'] }
});

declare module 'fastify' {
    interface FastifyInstance {
        healthService: HealthService;
    }
}
