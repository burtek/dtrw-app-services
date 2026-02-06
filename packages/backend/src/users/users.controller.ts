import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { UserWithUsernameSchema } from '../_schemas/authelia/user.schema';
import { routeFp } from '../helpers/route-plugin';


const usersController: FastifyPluginCallbackZod = (instance, options, done) => {
    instance.get(
        '/',
        async () => await instance.usersService.getUsersWithooutPasswords()
    );

    instance.post(
        '/',
        { schema: { body: UserWithUsernameSchema.partial({ password: true }) } },
        async request => {
            await instance.usersService.createUser({ password: undefined, ...request.body });
        }
    );

    instance.post(
        '/:username',
        {
            schema: {
                body: UserWithUsernameSchema.partial(),
                params: z.object({ username: z.string().nonempty() })
            }
        },
        async request => {
            await instance.usersService.updateUser(request.params.username, request.body);
        }
    );

    instance.post(
        '/:username/reset-password',
        { schema: { params: z.object({ username: z.string().nonempty() }) } },
        async request => {
            await instance.usersService.resetUserPassword(request.params.username);
        }
    );

    instance.delete(
        '/:username',
        { schema: { params: z.object({ username: z.string().nonempty() }) } },
        async request => {
            await instance.usersService.deleteUser(request.params.username);
            return true;
        }
    );

    done();
};

export default routeFp(usersController, {
    dependencies: ['users-service'],
    decorators: { fastify: ['usersService'] }
});
