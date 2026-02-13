import { resolve } from 'node:path';

import { config } from 'dotenv';
import { z } from 'zod/v4';

import { realPath, refineOptionalCondition } from './config.utils';


const DEFAULT_PORT = 4000;

/* eslint-disable @typescript-eslint/naming-convention */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).nonoptional(),
    PORT: z.coerce.number().default(DEFAULT_PORT),
    DB_FILE_NAME: z.union([z.literal(':memory:'), realPath()]),
    DB_MIGRATIONS_FOLDER: realPath({ directory: true, writable: false }),
    AUTHELIA_CONFIG: realPath(),
    AUTHELIA_USERS: realPath(),
    AUTHELIA_USERS_SCHEMA_URL: z.url(),
    CADDY_FETCH_INTERVAL: z.coerce.number().positive(),
    CADDY_CADDYFILE_PATH: realPath(),
    CADDYFILE_ADMIN: z.email(),
    CF_TOKEN: z.string().optional(),
    LOGS_FILE: z.string().optional(),
    DOCKER_PROXY: z.url({ protocol: /^(tcp|http)$/ }).optional(),
    DOCKER_AUTHELIA_CONTAINER_NAME: z.string().nonempty().optional(),
    DOCKER_CADDY_ADMIN_HOST: z.url({ protocol: /^(http|https)$/ }).optional(),
    DOCKER_CADDY_CONTAINER_NAME: z.string().nonempty().optional(),
    GITHUB_ACTIONS_PAT: z.string().regex(/^github_pat_/).nonempty(),
    GITHUB_POLLING_INTERVAL: z.coerce.number().positive().default(5 * 60 * 1000), // 5 minutes
    GITHUB_WEBHOOK_SECRET: z.string().nonempty(),
    EMAIL_SMTP_USER: z.email(),
    EMAIL_SMTP_PASS: z.string().nonempty(),
    EMAIL_FROM: z.templateLiteral([z.string().nonempty(), ' <', z.email(), '>'])
})
    .superRefine(refineOptionalCondition(/* condition */'DOCKER_PROXY', /* property */'DOCKER_AUTHELIA_CONTAINER_NAME'))
    .superRefine(refineOptionalCondition(/* condition */'DOCKER_PROXY', /* property */'DOCKER_CADDY_ADMIN_HOST'))
    .superRefine(refineOptionalCondition(/* condition */'DOCKER_PROXY', /* property */'DOCKER_CADDY_CONTAINER_NAME'));
/* eslint-enable @typescript-eslint/naming-convention */

config({
    path: [resolve(import.meta.dirname, '..', `.env.${process.env.NODE_ENV}`), resolve(import.meta.dirname, '..', '.env')],
    quiet: true
});

console.log(`Received NODE_ENV=${process.env.NODE_ENV}, parsing env variables...`);
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
