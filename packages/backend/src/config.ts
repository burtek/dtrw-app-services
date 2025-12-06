import 'dotenv/config';
import { z } from 'zod/v4';


const DEFAULT_PORT = 4000;

/* eslint-disable @typescript-eslint/naming-convention */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).nonoptional(),
    PORT: z.coerce.number().default(DEFAULT_PORT),
    DB_FILE_NAME: z.string().nonempty(),
    DB_MIGRATIONS_FOLDER: z.string().nonempty(),
    LOGS_FILE: z.string().optional(),
    USE_BS3_BIN: z.coerce.boolean().optional()
});
/* eslint-enable @typescript-eslint/naming-convention */

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    throw new Error('Environment validation failed', { cause: parsedEnv.error });
}

export const env = parsedEnv.data;
