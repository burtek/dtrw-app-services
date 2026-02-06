import { relations } from 'drizzle-orm';

import { autheliaConfigs } from './authelia-configs';
import { caddyConfigs } from './caddy-configs';
import { containers } from './containers';
import { projects } from './projects';


export const containerRelations = relations(containers, ({ one }) => ({
    project: one(projects, {
        fields: [containers.projectId],
        references: [projects.id]
    })
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
    containers: many(containers),
    caddyConfig: one(caddyConfigs),
    autheliaConfigs: many(autheliaConfigs)
}));

export const caddyRoutingRelations = relations(caddyConfigs, ({ one }) => ({
    project: one(projects, {
        fields: [caddyConfigs.projectId],
        references: [projects.id]
    }),
    container: one(containers, {
        fields: [caddyConfigs.standaloneContainerId],
        references: [containers.id]
    })
}));

export const autheliaConfigRelations = relations(autheliaConfigs, ({ one }) => ({
    project: one(projects, {
        fields: [autheliaConfigs.projectId],
        references: [projects.id]
    })
}));
