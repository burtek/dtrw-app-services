import { integer, sqliteTable as table, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { projects } from './projects';


export enum ContainerType {
    FRONTEND = 'frontend',
    BACKEND = 'backend',
    DATABASE = 'database',
    DOCKER_PROXY = 'docker-proxy'
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const containerTypes = Object.values(ContainerType) as [ContainerType, ...ContainerType[]];

export const containers = table('containers', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id').references(() => projects.id, {
        onDelete: 'cascade', // just unbinding it from a project
        onUpdate: 'cascade'
    }).notNull(),
    name: text('name').unique().notNull(),
    type: text('type', { enum: containerTypes })
        .notNull() // default calculated by UI based on container name
}, t => [
    //
    uniqueIndex('unique_container_type_per_project').on(t.projectId, t.type)
]);

export type Container = typeof containers.$inferSelect;
