import { readFile, rename, writeFile } from 'node:fs/promises'

import { createPreDecoratedApp } from '../app-base';

import { usersController } from './users.controller';
import { UsersService } from './users.service';


vitest.mock('../database/index', () => ({ getDb() {} }));
vitest.mock('node:fs/promises');
vitest.mock('../config', () => ({ env: { AUTHELIA_USERS: '/path/to/users.yaml' } }));

UsersService.prototype['generatePasswordHash'] = (plainPassword: string) => Promise.resolve(plainPassword.replace('plain_', 'hashed_'));

const usersYamlMock = `
users:
  alice:
    password: hashed_password_1
    displayname: Alice Doe
    email: alice@example.com
    groups:
      - admins
      - alice_fanclub
    disabled: false
  bob:
    password: hashed_password_2
    displayname: Bob Smith
    email: bob@example.com
    groups:
      - users
      - alice_fanclub
      - bob_fanclub
    disabled: true
`;

describe('UsersController', () => {
    const app = createPreDecoratedApp();
    app.register(usersController, { prefix: '/users' });

    const readFileMock = vitest.mocked(readFile).mockResolvedValue(usersYamlMock);
    const writeFileMock = vitest.mocked(writeFile).mockResolvedValue();
    const renameMock = vitest.mocked(rename).mockResolvedValue();

    afterEach(() => {
        vitest.clearAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /users', () => {
        it('should return expected data', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/users'
            });

            expect(response.json()).toStrictEqual({
                alice: {
                    displayname: 'Alice Doe',
                    email: 'alice@example.com',
                    groups: ['admins', 'alice_fanclub'],
                    disabled: false
                },
                bob: {
                    displayname: 'Bob Smith',
                    email: 'bob@example.com',
                    groups: ['users', 'alice_fanclub', 'bob_fanclub'],
                    disabled: true
                }
            });

            expect(writeFileMock).not.toHaveBeenCalled();
            expect(renameMock).not.toHaveBeenCalled();
        });
    })

    describe('POST /users', () => {
        it('should save data expected data', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/users',
                body: {
                    username: 'charlie',
                    displayname: 'Charlie Brown',
                    email: 'charlie@example.com',
                    groups: ['users', 'charlie_fanclub'],
                    password: 'plain_password_3',
                    disabled: false
                }
            });

            expect(writeFileMock).toHaveBeenCalledWith(
                '/path/to/users.yaml.tmp',
                `
${usersYamlMock.trim()}
  charlie:
    password: hashed_password_3
    displayname: Charlie Brown
    email: charlie@example.com
    groups:
      - users
      - charlie_fanclub
    disabled: false
`.trimStart(),

            );

            expect(renameMock).toHaveBeenCalledWith('/path/to/users.yaml.tmp', '/path/to/users.yaml');
        });

        it('should throw if user exists', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/users',
                body: {
                    username: 'alice',
                    displayname: 'Alice Brown',
                    email: 'alice2@example.com',
                    groups: ['users', 'alice_fanclub'],
                    password: 'plain_password_4',
                    disabled: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(response.json()).toStrictEqual({
                error: 'Another user exists with that username',
                success: false
            });

            expect(writeFileMock).not.toHaveBeenCalled();
            expect(renameMock).not.toHaveBeenCalled();
        });
    })

    describe('POST /users/:username', () => {
        it.todo('should update user');
        it.todo('should throw if user does not exist');
        it.todo('should throw if updating to an existing username');
    });

    describe('DELETE /users/:username', () => {
        it.todo('should delete user');
        it.todo('should throw if user does not exist');
    });

    describe('POST /users/:username/reset-password', () => {
        it.todo('should reset user password');
        it.todo('should throw if user does not exist');
    })
});
