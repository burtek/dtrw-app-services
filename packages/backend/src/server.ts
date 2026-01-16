import { createApp } from './app';
import { env } from './config';
import { runMigrations } from './database';


async function bootstrap() {
    const { app, shutdown } = await createApp({ logger: true });

    runMigrations(app.log);

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    try {
        await app.listen({
            port: env.PORT,
            host: '0.0.0.0'
        });
    } catch (error: unknown) {
        app.log.error(error);
        // eslint-disable-next-line n/no-process-exit
        process.exit(1);
    }
}

void bootstrap();
