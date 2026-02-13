import { setupAppWithDb } from 'tests/setup-app';

import { ContainerType, containerTypes } from '../database/schemas';

import containersController from './containers.controller';
import containersService from './containers.service';


describe('UsersController', async () => {
    const app = await setupAppWithDb();

    afterEach(() => {
        vitest.clearAllMocks();
    });

    describe('GET /containers', () => {
        it('should return list of containers', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/containers'
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual([
                { id: 1, name: 'proj1-cont1', type: 'backend', projectId: 1 },
                { id: 2, name: 'proj1-cont2', type: 'frontend', projectId: 1 },
                { id: 3, name: 'proj1-cont3', type: 'database', projectId: 1 },
                { id: 4, name: 'proj2-cont1', type: 'backend', projectId: 2 },
                { id: 5, name: 'proj2-cont2', type: 'frontend', projectId: 2 },
                { id: 6, name: 'proj3-cont1', type: 'backend', projectId: 3 },
                { id: 7, name: 'proj3-cont2', type: 'frontend', projectId: 3 },
                { id: 8, name: 'standalone-1', type: 'standalone', projectId: null }
            ]);
        });
    });

    describe('GET /containers/types', () => {
        it('should return list of allowed container types', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/containers/types'
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveLength(containerTypes.length);
            containerTypes.forEach(type => {
                expect(response.json()).toContain(type);
            });
        });
    });

    describe('POST /containers', () => {
        it('should create a new project', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/containers',
                payload: {
                    name: 'proj1-dproxy',
                    type: ContainerType.DOCKER_PROXY,
                    projectId: 1
                }
            });

            expect(response.statusCode).toBe(201);
            expect(response.json()).toEqual({
                id: expect.any(Number),
                name: 'proj1-dproxy',
                type: ContainerType.DOCKER_PROXY,
                projectId: 1
            });

            const getResponse = await app.inject({
                method: 'GET',
                url: '/containers'
            });

            expect(getResponse.statusCode).toBe(200);
            expect(getResponse.json()).toContainEqual({
                id: expect.any(Number),
                name: 'proj1-dproxy',
                type: ContainerType.DOCKER_PROXY,
                projectId: 1
            });
        });

        it.each([{
            _: 'name exists',
            payload: {
                name: 'proj1-cont1',
                type: ContainerType.DOCKER_PROXY,
                projectId: 1
            },
            expected: {
                code: 400,
                message: 'UNIQUE constraint failed: containers.name'
            }
        }, {
            _: 'project-type combo exists',
            payload: {
                name: 'proj1-cont4',
                type: ContainerType.FRONTEND,
                projectId: 1
            },
            expected: {
                code: 400,
                message: 'UNIQUE constraint failed: containers.project_id, containers.type'
            }
        }, {
            _: 'has project and is standalone',
            payload: {
                name: 'proj1-cont4',
                type: ContainerType.STANDALONE,
                projectId: 1
            },
            expected: {
                code: 400,
                message: 'CHECK constraint failed: standalone_without_project'
            }
        }, {
            _: 'has no project and is not standalone',
            payload: {
                name: 'proj1-cont4',
                type: ContainerType.FRONTEND,
                projectId: null
            },
            expected: {
                code: 400,
                message: 'CHECK constraint failed: project_required_for_non_standalone'
            }
        }])('should throw if $_', async ({ payload, expected }) => {
            const response = await app.inject({
                method: 'POST',
                url: '/containers',
                payload
            });

            expect(response.statusCode).toBe(expected.code);
            expect(response.json()).toEqual({
                error: expected.message,
                success: false
            });
        });
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
