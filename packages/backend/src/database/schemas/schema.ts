import { integer, sqliteTable as table } from 'drizzle-orm/sqlite-core';


export const schema = table('empty', { id: integer('id').primaryKey({ autoIncrement: true }) });
