import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

import { containers } from '../database/schemas';


export const ContainerSchema = createInsertSchema(containers).omit({ id: true }).strict();

export type Container = z.infer<typeof ContainerSchema>;
