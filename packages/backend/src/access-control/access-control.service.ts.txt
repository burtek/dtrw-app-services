import { readFile, rename, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { Writable } from 'node:stream';

import { dump, load } from 'js-yaml';

import type { AccessControlPolicy, AccessControlRules, AutheliaConfig } from '../_schemas/authelia/configuration.schema';
import { AutheliaConfigSchema } from '../_schemas/authelia/configuration.schema';
import { env } from '../config';
import { BaseRepo } from '../database/repo';
import { AppError, ErrorType } from '../errors';


export class AccessControlService extends BaseRepo {
    async getActualConfig() {
        return (await this.getAutheliaConfig()).access_control;
    }

    async getExpectedConfigRules() {
        return await this.db.query.autheliaConfigs.findMany({
            orderBy(autheliaConfig, { asc }) {
                return [asc(autheliaConfig.order)];
            }
        });
    }

    async saveDefaultPolicy(policy: AccessControlPolicy) {
        const config = await this.getAutheliaConfig();
        config.access_control.default_policy = policy;
        await this.writeConfig(config);
    }

    async saveRules(rules: AccessControlRules) {
        const config = await this.getAutheliaConfig();
        config.access_control.rules = rules;
        await this.writeConfig(config);
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

            if (exitCode !== 0) {
                throw new AppError(ErrorType.BAD_REQUEST, `Authelia validate failed (exit ${exitCode}):\n${stderr || stdout}`);
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
                if (code === 404 || code === 409 || code === 503) {
                    throw new AppError(ErrorType.SERVICE_UNAVAILABLE, `Authelia container problem: ${message}`);
                }
                if (code >= 500) {
                    throw new AppError(ErrorType.BAD_GATEWAY, `Docker error: ${message}`);
                }
                throw new AppError(ErrorType.BAD_GATEWAY, `Docker returned ${code}: ${message}`);
            }

            // network / other failures
            throw new AppError(ErrorType.BAD_GATEWAY, `Failed to contact Docker: ${error?.message ?? String(error)}`);
        }

        await rename(tmp, env.AUTHELIA_CONFIG);

        await this.fastifyContext.dockerProxy.authelia.restart();
    }
}
