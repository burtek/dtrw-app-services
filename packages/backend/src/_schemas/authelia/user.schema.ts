import { z } from 'zod/v4';


export const UserSchema = z.looseObject({ // loose as there is more that we ignore/don't handle
    password: z.string().nonempty(),
    displayname: z.string().nonempty(),
    email: z.union([z.email(), z.null()]).optional(),
    groups: z.array(z.string().nonempty()),
    disabled: z.boolean().default(false)
});

export const UsersConfigSchema = z.looseObject({ users: z.record(z.string().nonempty(), UserSchema) });

export type User = z.infer<typeof UserSchema>;
export type UsersConfig = z.infer<typeof UsersConfigSchema>;
