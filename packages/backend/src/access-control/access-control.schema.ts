import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

import { AccessControlPolicySchema } from '../_schemas/authelia/configuration.schema';
import { autheliaConfigs } from '../database/schemas';


export const AccessControlConfigSchema = createInsertSchema(autheliaConfigs).omit({ id: true }).strict()
    .extend({
        order: z.number().int().positive(),
        policy: AccessControlPolicySchema
    });

export type AccessControlConfigInput = z.infer<typeof AccessControlConfigSchema>;
