import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { UserWithUsernameSchema } from '../_schemas/authelia/user.schema';

import { UsersService } from './users.service';


export const usersController: FastifyPluginCallback = (instance, options, done) => {
    const usersService = new UsersService(instance);

    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/',
        async () => await usersService.getUsers()
    );

    f.post(
        '/',
        { schema: { body: UserWithUsernameSchema.partial({ password: true }) } },
        async request => {
            await usersService.createUser({ password: undefined, ...request.body });
        }
    );

    f.post(
        '/:username',
        {
            schema: {
                body: UserWithUsernameSchema.partial(),
                params: z.object({ username: z.string().nonempty() })
            }
        },
        async request => {
            await usersService.updateUser(request.params.username, request.body);
        }
    );

    f.post(
        '/:username/reset-password',
        { schema: { params: z.object({ username: z.string().nonempty() }) } },
        async request => {
            await usersService.resetUserPassword(request.params.username);
        }
    );

    f.delete(
        '/:username',
        { schema: { params: z.object({ username: z.string().nonempty() }) } },
        async request => {
            await usersService.deleteUser(request.params.username);
            return true;
        }
    );

    done();
};
