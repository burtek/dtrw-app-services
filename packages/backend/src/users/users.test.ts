import { readFile, rename, writeFile } from 'node:fs/promises'

import usersController from './users.controller';
import usersService from './users.service';
import { setupAppWithDb } from 'tests/setup-app';
import { env } from '../config';
import { argon2, randomBytes } from 'node:crypto';


vitest.mock('node:fs/promises');
vitest.mock(import('node:crypto'), async importOriginal => ({
    ...await importOriginal(),
    argon2: vitest.fn(),
    randomBytes: vitest.fn().mockReturnValue(Buffer.from('random_salt_12345')),
}));

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

describe('UsersController', async () => {
    const app = await setupAppWithDb();
    app.register(usersService);
    app.register(usersController, { prefix: '/users' });

    const readFileMock = vitest.mocked(readFile).mockResolvedValue(usersYamlMock);
    const writeFileMock = vitest.mocked(writeFile).mockResolvedValue();
    const renameMock = vitest.mocked(rename).mockResolvedValue();

    afterEach(() => {
        vitest.clearAllMocks();
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
            vitest.mocked(argon2).mockImplementation(async (type, params, cb) => {
                cb(null, Buffer.from('hashed_password_3'));
            });

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

            expect(argon2).toHaveBeenCalledWith('argon2id', expect.objectContaining({
                message: 'plain_password_3'
            }), expect.any(Function));

            expect(writeFileMock).toHaveBeenCalledWith(
                `${env.AUTHELIA_USERS}.tmp`,
                `
${usersYamlMock.trim()}
  charlie:
    password: $argon2id$v=19$m=65536,t=3,p=4$cmFuZG9tX3NhbHRfMTIzNDU$aGFzaGVkX3Bhc3N3b3JkXzM
    displayname: Charlie Brown
    email: charlie@example.com
    groups:
      - users
      - charlie_fanclub
    disabled: false
`.trimStart(),

            );

            expect(renameMock).toHaveBeenCalledWith(
                `${env.AUTHELIA_USERS}.tmp`,
                env.AUTHELIA_USERS
            );
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
