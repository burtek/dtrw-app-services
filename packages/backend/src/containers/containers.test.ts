import { createPreDecoratedApp } from '../app-base';

import { containersController } from './containers.controller';


vitest.mock('../database/index', () => ({ getDb() {} }));
vitest.mock('../config', () => ({ env: {} }));

describe('UsersController', () => {
    const app = createPreDecoratedApp();
    app.register(containersController, { prefix: '/containers' });

    afterEach(() => {
        vitest.clearAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /containers', () => {
        it.todo('should return list of containers');
    });

    describe('GET /containers/types', () => {
        it.todo('should return list of allowed container types');
    });

    describe('POST /containers', () => {
        it.todo('should create a new project');
        it.todo('should throw if slug exists');
    });

    describe('POST /containers/:id', () => {
        it.todo('should update an existing project');
        it.todo('should throw if project does not exist');
    });

    describe('DELETE /containers/:id', () => {
        it.todo('should delete an existing project');
        it.todo('should throw if project does not exist');
    });
});
