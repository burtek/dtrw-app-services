import { integer, sqliteTable as table, text } from 'drizzle-orm/sqlite-core';

import type { AccessControlPolicy } from 'src/_schemas/authelia/configuration.schema';

import { containers } from './containers';
import { projects } from './projects';


export const autheliaConfigs = table('authelia_config', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id')
        .references(() => projects.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade'
        }), // null if standalone container or global rule
    standaloneContainerId: integer('standalone_container_id')
        .references(() => containers.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade'
        }), // null if project rule or global rule
    order: integer('order').notNull(),
    policy: text('policy').$type<AccessControlPolicy>().notNull(),
    resources: text('resources', { mode: 'json' }).$type<string[]>(),
    subject: text('subject', { mode: 'json' }).$type<string[][]>()
});

export type AutheliaConfig = typeof autheliaConfigs.$inferSelect;
