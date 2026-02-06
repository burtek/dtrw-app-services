import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import { routeFp } from '../helpers/route-plugin';


const healthController: FastifyPluginCallbackZod = (instance, options, done) => {
    instance.get(
        '/',
        { logLevel: 'silent' },
        () => ({
            status: 'ok',
            errors: [],
            timestamp: new Date().toISOString(),
            uptime: process.uptime(), // seconds
            commit: process.env.COMMIT_SHA ?? 'dev',
            version: instance.healthService.getVersion(),
            nodeVersion: process.version,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            platform: process.platform,
            arch: process.arch,
            freeMemory: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed
        })
    );

    done();
};

export default routeFp(healthController, {
    dependencies: ['health-service'],
    decorators: { fastify: ['healthService'] }
});
