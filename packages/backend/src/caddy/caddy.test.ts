import { setupAppWithDb } from 'tests/setup-app';

import caddyController from './caddy.controller';
import caddyService from './caddy.service';


describe('CaddyController', async () => {
    const app = await setupAppWithDb();
    app.register(caddyService);
    app.register(caddyController, { prefix: '/caddy' });

    afterEach(() => {
        vitest.clearAllMocks();
    });

    describe('GET /routes/config', () => {
        it('should return config', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/caddy/routes/config'
            });
            
            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual([
                { id: 1, projectId: 1, standaloneContainerId: null, order: 1, auth: true },
                { id: 2, projectId: 2, standaloneContainerId: null, order: 2, auth: false },
                { id: 4, projectId: null, standaloneContainerId: 8, order: 3, auth: true },
                { id: 3, projectId: 3, standaloneContainerId: null, order: 4, auth: true }
            ]);
        });
    });

    describe('GET /routes/caddyfile', () => {
        it.todo('should return current caddyfile');
    });

    describe('GET /routes/api', () => {
        it.todo('should return response from API');
        it.todo('should handle abort signal');
    });
});
