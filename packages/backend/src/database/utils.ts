import type { Database } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3/driver';

import * as schema from './schemas';


export const makeDb = (database: Database) => drizzle(database, { schema });
export type DB = ReturnType<typeof makeDb>;
