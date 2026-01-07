import { createPreDecoratedApp } from '../app-base';

import { projectsController } from './projects.controller';


vitest.mock('../database/index', () => ({ getDb() {} }));
vitest.mock('../config', () => ({ env: {} }));

describe('UsersController', () => {
    const app = createPreDecoratedApp();
    app.register(projectsController, { prefix: '/projects' });

    afterEach(() => {
        vitest.clearAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /projects', () => {
        it.todo('should return list of projects');
    });

    describe('POST /projects', () => {
        it.todo('should create a new project');
        it.todo('should throw if slug exists');
    });

    describe('POST /projects/:id', () => {
        it.todo('should update an existing project');
        it.todo('should throw if project does not exist');
    });

    describe('DELETE /projects/:id', () => {
        it.todo('should delete an existing project');
        it.todo('should throw if project does not exist');
    });
});
