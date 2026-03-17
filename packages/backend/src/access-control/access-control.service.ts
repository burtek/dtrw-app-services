import { readFile, rename, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { Writable } from 'node:stream';

import { eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { dump, load } from 'js-yaml';

import type { AccessControlPolicy, AccessControlRules, AutheliaConfig } from '../_schemas/authelia/configuration.schema';
import { AutheliaConfigSchema } from '../_schemas/authelia/configuration.schema';
import { env } from '../config';
import { autheliaConfigs } from '../database/schemas';
import { AppError } from '../errors';

import type { AccessControlConfigInput } from './access-control.schema';


class AccessControlService {
    constructor(private readonly fastifyContext: FastifyInstance) {
    }

    async applyConfig() {
        const rules = await this.getExpectedConfig();
        const caddyRoutes = await this.fastifyContext.database.db.query.caddyConfigs.findMany();
        const config = await this.getAutheliaConfig();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        config.access_control.rules = this.buildRules(rules, caddyRoutes) as AccessControlRules;

        await this.writeConfig(config);

        return true;
    }

    async deleteRule(id: number) {
        await this.fastifyContext.database.db
            .delete(autheliaConfigs)
            .where(eq(autheliaConfigs.id, id));

        return true;
    }

    async getActualConfig() {
        return (await this.getAutheliaConfig()).access_control;
    }

    async getExpectedConfig() {
        return await this.fastifyContext.database.db.query.autheliaConfigs.findMany({
            orderBy: (fields, { asc }) => [asc(fields.order)],
            with: {
                project: true,
                container: true
            }
        });
    }

    async getExpectedConfigAsApplied() {
        const rules = await this.getExpectedConfig();
        const caddyRoutes = await this.fastifyContext.database.db.query.caddyConfigs.findMany();
        const actualConfig = await this.getAutheliaConfig();

        const generatedRules = this.buildRules(rules, caddyRoutes);

        return {
            ...actualConfig.access_control,
            rules: generatedRules
        };
    }

    async reorderRules(ids: number[]) {
        if (ids.length !== new Set(ids).size) {
            throw AppError.badRequest('Duplicate IDs in reorder list');
        }

        const configs = await this.fastifyContext.database.db.query.autheliaConfigs
            .findMany({ orderBy: (fields, { asc }) => [asc(fields.order)] });

        if (ids.length !== configs.length) {
            throw AppError.badRequest(`Reorder list has ${ids.length} entries but there are ${configs.length} existing rules`);
        }

        if (!ids.every(id => configs.some(c => c.id === id))) {
            throw AppError.badRequest('Reorder list contains rule IDs that do not exist');
        }

        await this.fastifyContext.database.transaction(async tx => {
            await Promise.all(ids.map((id, index) => tx
                .update(autheliaConfigs)
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                .set({ order: -(index + 1) })
                .where(eq(autheliaConfigs.id, id))));

            await tx
                .update(autheliaConfigs)
                .set({ order: sql`-${autheliaConfigs.order}` });
        });
    }

    async saveDefaultPolicy(policy: AccessControlPolicy) {
        const config = await this.getAutheliaConfig();
        config.access_control.default_policy = policy;
        await this.writeConfig(config);
    }

    async saveRule(data: AccessControlConfigInput, id?: number) {
        if (id !== undefined) {
            await this.fastifyContext.database.db
                .update(autheliaConfigs)
                .set(data)
                .where(eq(autheliaConfigs.id, id));

            const updated = await this.fastifyContext.database.db.query.autheliaConfigs
                .findFirst({ where: (fields, { eq: eqOp }) => eqOp(fields.id, id) });

            return updated;
        }

        const [inserted] = await this.fastifyContext.database.db
            .insert(autheliaConfigs)
            .values(data)
            .returning();

        return inserted;
    }

    private buildRules(
        rules: Awaited<ReturnType<AccessControlService['getExpectedConfig']>>,
        caddyRoutes: Array<{ projectId: number | null; standaloneContainerId: number | null; standaloneContainerDomain: string | null }>
    ) {
        return rules.flatMap(rule => {
            let domain: string | string[] | undefined;

            if (rule.project) {
                const urls = [rule.project.url, ...rule.project.additionalUrls];
                const hostnames = urls.map(url => new URL(url).hostname);
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                domain = hostnames.length === 1 ? hostnames[0] : hostnames;
            } else if (rule.standaloneContainerId !== null) {
                const caddyRoute = caddyRoutes.find(r => r.standaloneContainerId === rule.standaloneContainerId);
                if (caddyRoute?.standaloneContainerDomain) {
                    domain = caddyRoute.standaloneContainerDomain;
                }
            }

            if (!domain) {
                return [];
            }

            return [
                {
                    domain,
                    policy: rule.policy,
                    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                    ...rule.subject && rule.subject.length > 0 ? { subject: rule.subject } : {},
                    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                    ...rule.resources && rule.resources.length > 0 ? { resources: rule.resources } : {}
                }
            ];
        });
    }

    private async getAutheliaConfig() {
        const yaml = await readFile(env.AUTHELIA_CONFIG, { encoding: 'utf8', flag: 'r' });
        const json = AutheliaConfigSchema.parse(load(yaml));

        return json;
    }

    private async writeConfig(config: AutheliaConfig) {
        const tmp = `${env.AUTHELIA_CONFIG}.tmp`;
        await writeFile(tmp, dump(config));

        if (!this.fastifyContext.dockerProxy) {
            await rename(tmp, env.AUTHELIA_CONFIG);
            return;
        }

        try {
            const exec = await this.fastifyContext.dockerProxy.authelia.exec({
                /* eslint-disable @typescript-eslint/naming-convention */
                AttachStdin: false,
                AttachStdout: true,
                AttachStderr: true,
                Tty: false,
                Cmd: ['authelia', 'config', 'validate', '--config', basename(tmp)]
                /* eslint-enable @typescript-eslint/naming-convention */
            });

            // eslint-disable-next-line @typescript-eslint/naming-convention
            const stream = await exec.start({ Detach: false, Tty: false });

            const stdoutChunks: Buffer[] = [];
            const stderrChunks: Buffer[] = [];

            /* eslint-disable promise/prefer-await-to-callbacks */
            const out = new Writable({
                write(chunk: Buffer, _enc, cb) {
                    stdoutChunks.push(Buffer.from(chunk));
                    cb();
                }
            });
            const err = new Writable({
                write(chunk: Buffer, _enc, cb) {
                    stderrChunks.push(Buffer.from(chunk));
                    cb();
                }
            });
            /* eslint-enable promise/prefer-await-to-callbacks */
            this.fastifyContext.dockerProxy.modem.demuxStream(stream, out, err);

            await new Promise<void>((resolve, reject) => {
                stream.on('end', resolve);
                stream.on('close', resolve);
                stream.on('error', reject);
            });

            const inspect = await exec.inspect();
            const exitCode = typeof inspect.ExitCode === 'number' ? inspect.ExitCode : null;
            const stdout = Buffer.concat(stdoutChunks).toString('utf8');
            const stderr = Buffer.concat(stderrChunks).toString('utf8');

            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (exitCode !== 0) {
                throw AppError.badRequest(`Authelia validate failed (exit ${exitCode}):\n${stderr || stdout}`);
            }
        } catch (e) {
            if (e instanceof AppError) {
                throw e;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const error = e as {
                statusCode?: number;
                json?: { message?: string };
                message?: string;
                toString: () => string;
            } | undefined;
            if (error?.statusCode) {
                const code = error.statusCode;
                const message: string = error.json?.message ?? error.message ?? String(error);
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                if (code === 404 || code === 409 || code === 503) {
                    throw AppError.serviceUnavailable(`Authelia container problem: ${message}`);
                }
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                if (code >= 500) {
                    throw AppError.badGateway(`Docker error: ${message}`);
                }
                throw AppError.badGateway(`Docker returned ${code}: ${message}`);
            }

            throw AppError.badGateway(`Failed to contact Docker: ${error?.message ?? String(error)}`);
        }

        await rename(tmp, env.AUTHELIA_CONFIG);

        try {
            await this.fastifyContext.dockerProxy.authelia.restart();
        } catch (restartErr) {
            this.fastifyContext.log.warn(`Config written but Authelia restart failed – restart it manually: ${String(restartErr)}`);
        }
    }
}

export default fp((app, opts, done) => {
    const accessControlService = new AccessControlService(app);

    app.decorate('accessControlService', accessControlService);

    done();
}, {
    name: 'access-control-service',
    dependencies: ['database-plugin', 'docker-proxy'],
    decorators: { fastify: ['database', 'dockerProxy'] }
});

declare module 'fastify' {
    interface FastifyInstance {
        accessControlService: AccessControlService;
    }
}
