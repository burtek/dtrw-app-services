import { argon2, randomBytes, randomInt } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';

import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { dump, load } from 'js-yaml';

import type { User, UsersConfig, UserWithUsername } from '../_schemas/authelia/user.schema';
import { UsersConfigSchema } from '../_schemas/authelia/user.schema';
import { env } from '../config';
import { AppError } from '../errors';


type CreateUser = { [K in keyof UserWithUsername]: K extends 'password' ? string | undefined : UserWithUsername[K] };

const DEFAULT_PASSWORD_LENGTH = 12;

class UsersService {
    constructor(private readonly fastifyContext: FastifyInstance) {
    }

    async createUser({ username, ...user }: CreateUser) {
        const password = user.password ?? this.generateRandomPassword();
        const hashedPassword = await this.generatePasswordHash(password);

        const config = await this.getUsersRaw();
        if (username in config.users) {
            throw AppError.badRequest('Another user exists with that username');
        }

        config.users[username] = { ...user, password: hashedPassword };

        await this.writeUsersConfig(config);

        if (!user.password && user.email) {
            await this.fastifyContext.mailerProvider?.sendMail({
                to: user.email,
                subject: 'Your new account',
                text: `Hello ${user.displayname || username},\n\nYour account has been created. Your temporary password is: ${password}\n\nPlease change your password after logging in for the first time.\n\nBest regards,\nDTRW Services Management`
            });
        }
    }

    async deleteUser(username: string) {
        const config = await this.getUsersRaw();
        if (!(username in config.users)) {
            throw AppError.badRequest('User does not exist');
        }

        delete config.users[username];

        await this.writeUsersConfig(config);
    }

    async getUsersWithooutPasswords() {
        const { users: allUsers } = await this.getUsersRaw();

        return Object.fromEntries(
            Object.entries(allUsers)
                .map(([username, { password, ...user }]) => [username, user as Omit<User, 'password'>])
        );
    }

    async resetUserPassword(username: string) {
        const newPassword = this.generateRandomPassword();
        const hashedPassword = await this.generatePasswordHash(newPassword);

        const config = await this.getUsersRaw();
        if (!(username in config.users) || !config.users[username]) {
            throw AppError.badRequest('User does not exist');
        }

        if (!config.users[username].email) {
            throw AppError.badRequest('User does not have an email set');
        }

        config.users[username].password = hashedPassword;
        await this.writeUsersConfig(config);

        await this.fastifyContext.mailerProvider?.sendMail({
            to: config.users[username].email,
            subject: 'Your password has been reset',
            text: `Hello ${config.users[username].displayname || username},\n\nYour password has been reset. Your new temporary password is: ${newPassword}\n\nPlease change your password after logging in for the first time.\n\nBest regards,\nDTRW Services Management`
        });
    }

    async updateUser(username: string, body: Partial<UserWithUsername>) {
        const config = await this.getUsersRaw();
        if (!(username in config.users) || !config.users[username]) {
            throw AppError.badRequest('User does not exist');
        }
        if (!!body.username && body.username !== username && body.username in config.users) {
            throw AppError.badRequest('Username in use');
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
        if (body.username !== undefined && username !== body.username) {
            config.users[body.username] = config.users[username];
            delete config.users[username];
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            return characters[randomInt(0, characters.length)] as string;
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
        while (newPasswordArray.length < DEFAULT_PASSWORD_LENGTH) {
            newPasswordArray.push(random(allChars));
        }

        for (let i = newPasswordArray.length - 1; i > 0; i--) {
            const j = randomInt(0, i + 1);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            [newPasswordArray[i] as string, newPasswordArray[j] as string] = [newPasswordArray[j] as string, newPasswordArray[i] as string];
        }

        return newPasswordArray.join('');
    }

    private async getUsersRaw() {
        const yaml = await readFile(env.AUTHELIA_USERS, { encoding: 'utf8', flag: 'r' });
        return UsersConfigSchema.parse(load(yaml));
    }

    private async writeUsersConfig(config: UsersConfig) {
        const tmp = `${env.AUTHELIA_USERS}.tmp`;
        await writeFile(tmp, dump(config, { lineWidth: 300, quotingType: '"' }));
        await rename(tmp, env.AUTHELIA_USERS);

        // validate schema manually using AUTHELIA_USERS_SCHEMA_URL
        // no authelia CLI to validate
        // authelia in watch mode - no need to reload
    }
}

export default fp((app, opts, done) => {
    const usersService = new UsersService(app);

    app.decorate('usersService', usersService);

    done();
}, {
    name: 'users-service',
    dependencies: ['database-plugin', 'mailer-plugin'],
    decorators: { fastify: ['database', 'mailerProvider'] }
});

declare module 'fastify' {
    interface FastifyInstance {
        usersService: UsersService;
    }
}
