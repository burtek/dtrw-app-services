import { integer, sqliteTable as table, text } from 'drizzle-orm/sqlite-core';


export const projects = table('projects', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').unique().notNull(), // slug id
    name: text('name').unique().notNull(), // name or description
    github: text('github').notNull(),
    url: text('main_url').notNull(),
    additionalUrls: text('more_urls', { mode: 'json' })
        .$type<string[]>()
        .default([])
        .notNull()
});

export type Project = typeof projects.$inferSelect;
