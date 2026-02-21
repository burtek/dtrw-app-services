import { createApp } from './app';
import { env } from './config';


async function bootstrap() {
    const { app, shutdown } = await createApp({ logger: env.NODE_ENV === 'development' });

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    try {
        await app.listen({
            port: env.PORT,
            host: '0.0.0.0'
        });
    } catch (error: unknown) {
        app.log.error(error);
        await shutdown('ERROR');
    }
}

void bootstrap();
