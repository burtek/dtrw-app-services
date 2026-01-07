import 'dotenv/config';
import { z } from 'zod/v4';

import { filePath, refineOptionalCondition } from './config.utils';


const DEFAULT_PORT = 4000;

/* eslint-disable @typescript-eslint/naming-convention */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).nonoptional(),
    PORT: z.coerce.number().default(DEFAULT_PORT),
    DB_FILE_NAME: z.string().nonempty(),
    DB_MIGRATIONS_FOLDER: z.string().nonempty(),
    AUTHELIA_CONFIG: filePath(),
    AUTHELIA_USERS: filePath(),
    AUTHELIA_USERS_SCHEMA_URL: z.url(),
    CADDY_FETCH_INTERVAL: z.coerce.number().positive(),
    CF_TOKEN: z.string().optional(),
    LOGS_FILE: z.string().optional(),
    DOCKER_PROXY: z.url({ protocol: /^(tcp|http)$/ }).optional(),
    DOCKER_AUTHELIA_CONTAINER_NAME: z.string().nonempty().optional(),
    DOCKER_CADDY_ADMIN_HOST: z.url({ protocol: /^(http|https)$/ }).optional()
})
    .superRefine(refineOptionalCondition('DOCKER_PROXY', 'DOCKER_AUTHELIA_CONTAINER_NAME'))
    .superRefine(refineOptionalCondition('DOCKER_PROXY', 'DOCKER_CADDY_ADMIN_HOST'));
/* eslint-enable @typescript-eslint/naming-convention */

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    throw new Error(`Environment validation failed\n${z.prettifyError(parsedEnv.error)}`);
}

type Identity<T> = T extends object ? {} & {
    [P in keyof T]: T[P]
} : T;
type DockerKeys = Extract<keyof typeof parsedEnv.data, `DOCKER_${string}`>;

export type DockerlessEnv = Identity<(
    Omit<typeof parsedEnv.data, DockerKeys>
    & Partial<Record<DockerKeys, undefined>>
)>;
export type DockeredEnv = Identity<(
    Omit<typeof parsedEnv.data, DockerKeys>
    & Required<Pick<typeof parsedEnv.data, DockerKeys>>
)>;

type RefinedEnv = DockerlessEnv | DockeredEnv;

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const env = parsedEnv.data as RefinedEnv;
