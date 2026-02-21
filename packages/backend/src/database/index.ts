/* eslint-disable import-x/no-named-as-default */
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { FastifyBaseLogger } from 'fastify';
import fp from 'fastify-plugin';

import { env } from '../config';

import type { DB } from './utils';
import { makeDb } from './utils';


export class DatabaseWrapper {
    private readonly dbInstance: Database.Database;
    private readonly drizzleDb: DB;

    constructor(private readonly log: FastifyBaseLogger) {
        this.log.info('Opening database...');
        this.dbInstance = new Database(env.DB_FILE_NAME, { readonly: false });
        this.drizzleDb = makeDb(this.dbInstance);
    }

    get db() {
        return this.drizzleDb;
    }

    close() {
        this.log.info('Closing database...');
        this.dbInstance.close();
        this.log.info('Database closed');
    }

    runMigrations() {
        this.log.info('Running migrations...');
        migrate(this.drizzleDb, { migrationsFolder: env.DB_MIGRATIONS_FOLDER });
        this.log.info('Migrations complete');
    }

    async transaction<T>(worker: (txDb: DB) => Promise<T>, mode: 'deferred' | 'immediate' | 'exclusive' = 'deferred'): Promise<T> {
        this.dbInstance.exec(`BEGIN ${mode.toUpperCase()};`);
        try {
            const result = await worker(this.drizzleDb);
            this.dbInstance.exec('COMMIT;');
            return result;
        } catch (error) {
            this.dbInstance.exec('ROLLBACK;');
            throw error;
        }
    }
}

export default fp((app, options: { runMigrations?: boolean } = {}, done) => {
    const dbWrapper = new DatabaseWrapper(app.log);

    if (options.runMigrations) {
        dbWrapper.runMigrations();
    }

    app.decorate('database', dbWrapper);
    app.addHook('onClose', () => {
        dbWrapper.close();
    });

    done();
}, { name: 'database-plugin' });

declare module 'fastify' {
    interface FastifyInstance {
        database: DatabaseWrapper;
    }
}
