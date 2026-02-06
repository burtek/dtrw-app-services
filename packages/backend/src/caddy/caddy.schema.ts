import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

import { caddyConfigs } from '../database/schemas';


export const CaddySchema = createInsertSchema(caddyConfigs).omit({ id: true }).strict()
    .extend({ order: z.number().int().positive() });

export type CaddyConfig = z.infer<typeof CaddySchema>;

export const CaddySchemaProject = CaddySchema.extend({
    projectId: z.number().int().positive(),
    standaloneContainerId: z.null().optional(),
    standaloneContainerDomain: z.null().optional(),
    auth: z.enum(['enabled', 'disabled', 'own']) // 'provider' is not allowed for project configs
});

export type CaddyConfigProject = z.infer<typeof CaddySchemaProject>;

export const CaddySchemaStandalone = CaddySchema.extend({
    standaloneContainerId: z.number().int().positive(),
    standaloneContainerDomain: z.string().nonempty(),
    projectId: z.null().optional()
});

export type CaddyConfigStandalone = z.infer<typeof CaddySchemaStandalone>;

export const CaddyConfigInputSchema = z.union([
    CaddySchemaProject,
    CaddySchemaStandalone
]);

export type CaddyConfigInput = CaddyConfigProject | CaddyConfigStandalone;

export type AuthOptions = CaddyConfig['auth'];
