import { readFile, rename, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { Writable } from 'node:stream';

import Docker from 'dockerode';
import { dump, load } from 'js-yaml';

import type { AccessControlRules, AutheliaConfig } from 'src/_schemas/authelia/configuration.schema';
import { AutheliaConfigSchema } from 'src/_schemas/authelia/configuration.schema';

import { env } from '../config';
import { BaseRepo } from '../database/repo';
import { AppError, ErrorType } from '../errors';


export class AccessControlService extends BaseRepo {
    async getRules() {
        return (await this.getConfig()).access_control.rules;
    }

    async saveRules(rules: AccessControlRules) {
        const config = await this.getConfig();
        config.access_control.rules = rules;
        await this.writeConfig(config);
    }

    private async getConfig() {
        const yaml = await readFile(env.AUTHELIA_CONFIG, { encoding: 'utf8', flag: 'r' });
        const json = AutheliaConfigSchema.parse(load(yaml));

        return json;
    }

    private async writeConfig(config: AutheliaConfig) {
        const tmp = `${env.AUTHELIA_CONFIG}.tmp`;
        await writeFile(tmp, dump(config));

        if (env.DOCKER_PROXY) {
            const url = new URL(env.DOCKER_PROXY);
            const docker = new Docker({
                protocol: 'http',
                host: url.hostname,
                port: Number(url.port)
            });
            try {
                const exec = await docker.getContainer(env.DOCKER_AUTHELIA_NAME).exec({
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
                docker.modem.demuxStream(stream, out, err);

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

            await docker.getContainer(env.DOCKER_AUTHELIA_NAME).restart();
        }
    }
}
