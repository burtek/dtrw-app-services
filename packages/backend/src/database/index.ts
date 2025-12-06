import { createRequire } from 'node:module';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { FastifyBaseLogger } from 'fastify';

import { env } from '../config';

import * as schema from './schemas';


const nodeRequire = createRequire(import.meta.url);

const makeDb = (database: Database.Database) => drizzle(database, { schema });
export type DB = ReturnType<typeof makeDb>;

let dbInstance: Database.Database | null = null;
let drizzleDb: DB | null = null;

export function getDb(log: FastifyBaseLogger): DB {
    if (drizzleDb) {
        return drizzleDb;
    }

    const options: Database.Options = { readonly: false };

    try {
        if (env.USE_BS3_BIN) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            options.nativeBinding = nodeRequire('../assets/better_sqlite3.node24-alpine.node');
        } else if (env.NODE_ENV !== 'production') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            options.nativeBinding = nodeRequire('../assets/better_sqlite3.node24-lmde6-amd64.node');
        }
    } catch (error) {
        if (env.NODE_ENV === 'production') {
            throw error;
        }
        log.error(error);
    }

    dbInstance = new Database(env.DB_FILE_NAME, options);
    drizzleDb = makeDb(dbInstance);

    return drizzleDb;
}

export function runMigrations(log: FastifyBaseLogger) {
    const db = getDb(log);

    log.info('Database open, migrating...');
    migrate(db, { migrationsFolder: env.DB_MIGRATIONS_FOLDER });
    log.info('Database migrated');
}

export function closeDb() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}
