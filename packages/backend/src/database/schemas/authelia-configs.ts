import { integer, sqliteTable as table, text } from 'drizzle-orm/sqlite-core';

import type { AccessControlPolicy } from 'src/_schemas/authelia/configuration.schema';

import { projects } from './projects';


export const autheliaConfigs = table('authelia_config', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id')
        .references(() => projects.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade'
        }), // null => *.dtrw.ovh; not unique
    order: integer('order').notNull(),
    policy: text('policy').$type<AccessControlPolicy>().notNull(),
    resources: text('resources', { mode: 'json' }).$type<string[]>(),
    subject: text('subject', { mode: 'json' }).$type<string[][]>()
});

export type AutheliaConfig = typeof autheliaConfigs.$inferSelect;
