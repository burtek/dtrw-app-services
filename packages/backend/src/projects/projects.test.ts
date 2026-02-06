import { setupAppWithDb } from 'tests/setup-app';

import  projectsController from './projects.controller';
import projectsService from './projects.service';


describe('ProjectsController', async () => {
    const app = await setupAppWithDb();
    app.register(projectsService);
    app.register(projectsController, { prefix: '/projects' });

    afterEach(() => {
        vitest.clearAllMocks();
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
