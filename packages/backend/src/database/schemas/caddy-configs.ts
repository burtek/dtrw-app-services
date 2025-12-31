import { integer, sqliteTable as table } from 'drizzle-orm/sqlite-core';

import { projects } from './projects';


export const caddyConfigs = table('caddy_config', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id')
        .references(() => projects.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade'
        })
        .unique()
        .notNull(),
    order: integer('order').notNull(),

    auth: integer('auth', { mode: 'boolean' }).notNull()
    // ui and api containers will be picked up from project containers by type
});

export type CaddyConfig = typeof caddyConfigs.$inferSelect;
