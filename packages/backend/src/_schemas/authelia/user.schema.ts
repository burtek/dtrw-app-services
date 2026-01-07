import { z } from 'zod/v4';


export const UserSchema = z.looseObject({ // loose as there is more that we ignore/don't handle
    password: z.string().nonempty(),
    displayname: z.string().nonempty(),
    email: z.union([z.email(), z.null()]).optional(),
    groups: z.array(z.string().nonempty()),
    disabled: z.boolean().default(false)
});
export const UserWithUsernameSchema = UserSchema.extend({
    //
    username: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/).nonempty()
});

export const UsersConfigSchema = z.looseObject({ users: z.record(z.string().nonempty(), UserSchema) });

export type User = z.infer<typeof UserSchema>;
export type UserWithUsername = z.infer<typeof UserWithUsernameSchema>;
export type UsersConfig = z.infer<typeof UsersConfigSchema>;
