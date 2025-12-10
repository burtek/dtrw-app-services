/* eslint-disable import-x/no-named-as-default */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { FastifyBaseLogger } from 'fastify';

import { env } from '../config';

import * as schema from './schemas';


const makeDb = (database: Database.Database) => drizzle(database, { schema });
export type DB = ReturnType<typeof makeDb>;

let dbInstance: Database.Database | null = null;
let drizzleDb: DB | null = null;

export function getDb(_log: FastifyBaseLogger): DB {
    if (drizzleDb) {
        return drizzleDb;
    }

    dbInstance = new Database(env.DB_FILE_NAME, { readonly: false });
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
