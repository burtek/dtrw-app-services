/* eslint no-warning-comments: 1 */
import { argon2, randomBytes, randomInt } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';

import { dump, load } from 'js-yaml';

import type { User, UsersConfig } from '../_schemas/authelia/user.schema';
import { UsersConfigSchema } from '../_schemas/authelia/user.schema';
import { env } from '../config';
import { BaseRepo } from '../database/repo';
import { AppError, ErrorType } from '../errors';


export class UsersService extends BaseRepo {
    async createUser(username: string, body: User) {
        const config = await this.getUsersRaw();
        if (username in config.users) {
            throw new AppError(ErrorType.BAD_REQUEST, 'Another user exists with that username');
        }

        config.users[username] = body;

        await this.writeUsersConfig(config);
    }

    async deleteUser(username: string) {
        const config = await this.getUsersRaw();
        if (!(username in config.users)) {
            throw new AppError(ErrorType.BAD_REQUEST, 'User does not exist');
        }

        delete config.users[username];

        await this.writeUsersConfig(config);
    }

    async getUsers() {
        const { users: allUsers } = await this.getUsersRaw();
        return Object.keys(allUsers).reduce<Record<string, Omit<User, 'password'>>>((users, username) => {
            const { password, ...user } = allUsers[username];
            return {
                ...users,
                [username]: user
            };
        }, {});
    }

    async getUsersRaw() {
        const yaml = await readFile(env.AUTHELIA_USERS, { encoding: 'utf8', flag: 'r' });
        return UsersConfigSchema.parse(load(yaml));
    }

    async resetUserPassword(username: string) {
        const config = await this.getUsersRaw();
        if (!(username in config.users)) {
            throw new AppError(ErrorType.BAD_REQUEST, 'User does not exist');
        }
        // TODO: verify user has email

        const newPassword = this.generateRandomPassword();

        // TODO: email the password?

        config.users[username].password = await this.generatePasswordHash(newPassword);
        await this.writeUsersConfig(config);
    }

    async updateUser(username: string, body: Partial<User>) {
        const config = await this.getUsersRaw();
        if (!(username in config.users)) {
            throw new AppError(ErrorType.BAD_REQUEST, 'User does not exist');
        }

        if (body.disabled !== undefined) {
            config.users[username].disabled = body.disabled;
        }
        if (body.displayname !== undefined) {
            config.users[username].displayname = body.displayname;
        }
        if (body.email !== undefined) {
            config.users[username].email = body.email;
        }
        if (body.groups !== undefined) {
            config.users[username].groups = body.groups;
        }
        if (body.password !== undefined) {
            config.users[username].password = await this.generatePasswordHash(body.password);
        }

        await this.writeUsersConfig(config);
    }

    private async generatePasswordHash(password: string) {
        const parameters = {
            nonce: randomBytes(16),
            parallelism: 4,
            tagLength: 64,
            memory: 65536,
            passes: 3,
            message: password
        };
        return await new Promise<string>(
            (resolve, reject) => {
                argon2('argon2id', parameters, (err, response) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const b64Salt = parameters.nonce.toString('base64').replace(/[=]*$/, '');
                    const b64Hash = response.toString('base64').replace(/[=]*$/, '');
                    const argon2idString = `$argon2id$v=19$m=${parameters.memory},t=${parameters.passes},p=${parameters.parallelism}$${b64Salt}$${b64Hash}`;
                    resolve(argon2idString);
                });
            }
        );
    }

    private generateRandomPassword() {
        function random(characters: string) {
            return characters[randomInt(0, characters.length)];
        }

        const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
        const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const specialChars = '!@#$%^&*';

        const newPasswordArray = [
            random(lowerCase),
            random(upperCase),
            random(numbers),
            random(specialChars)
        ];

        const allChars = lowerCase + upperCase + numbers + specialChars;

        while (newPasswordArray.length < 12) {
            newPasswordArray.push(random(allChars));
        }

        for (let i = newPasswordArray.length - 1; i > 0; i--) {
            const j = randomInt(0, i + 1);
            [newPasswordArray[i], newPasswordArray[j]] = [newPasswordArray[j], newPasswordArray[i]];
        }

        return newPasswordArray.join('');
    }

    private async writeUsersConfig(config: UsersConfig) {
        const tmp = `${env.AUTHELIA_USERS}.tmp`;
        await writeFile(tmp, dump(config));
        await rename(tmp, env.AUTHELIA_USERS);

        // validate schema manually?
        // no authelia CLI to validate
        // authelia in watch mode - no need to reload
    }
}
