/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { setupAppWithDb } from 'tests/setup-app';

import packageJson from '../../package.json';

import healthController from './health.controller';
import healthService from './health.service';


describe('HealthController', async () => {
    const app = await setupAppWithDb();

    afterEach(() => {
        vitest.clearAllMocks();
    });

    it('should return correct data', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health'
        });

        expect(response.json()).toStrictEqual({
            status: 'ok',
            errors: [],
            timestamp: expect.stringMatching(/\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/),
            uptime: expect.any(Number),
            commit: 'dev',
            version: packageJson.version,
            nodeVersion: expect.any(String),
            memoryUsage: expect.anything(),
            cpuUsage: expect.anything(),
            platform: expect.any(String),
            arch: expect.any(String),
            freeMemory: expect.any(Number)
        });
    });
});
