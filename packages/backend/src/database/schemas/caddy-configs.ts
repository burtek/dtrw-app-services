import type { SQL } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable as table, text } from 'drizzle-orm/sqlite-core';

import { containers } from './containers';
import { projects } from './projects';


export const caddyConfigs = table('caddy_config', {
    id: integer('id').primaryKey({ autoIncrement: true }),

    projectId: integer('project_id')
        .references(() => projects.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade'
        })
        .unique(),
    standaloneContainerId: integer('standalone_container_id')
        .references(() => containers.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade'
        })
        .unique(),

    order: integer('order').unique().notNull(),

    auth: text('auth', { enum: ['enabled', 'disabled', 'own', 'provider'] }).notNull(),
    isProvider: integer('is_provider', { mode: 'boolean' })
        .generatedAlwaysAs(
            (): SQL => sql`CASE WHEN ${caddyConfigs.auth} = 'provider' THEN 1 ELSE NULL END`,
            { mode: 'virtual' }
        )
        .unique(),

    standaloneContainerDomain: text('standalone_container_domain')
}, t => [
    check(
        'xor_project_container',
        sql`(${t.projectId} IS NOT NULL AND ${t.standaloneContainerId} IS NULL) OR (${t.projectId} IS NULL AND ${t.standaloneContainerId} IS NOT NULL)`
    ),
    check(
        'standalone_container_has_domain',
        sql`(${t.standaloneContainerId} IS NULL AND ${t.standaloneContainerDomain} IS NULL) OR (${t.standaloneContainerId} IS NOT NULL AND ${t.standaloneContainerDomain} IS NOT NULL)`
    )
]);

export type CaddyConfig = typeof caddyConfigs.$inferSelect;
