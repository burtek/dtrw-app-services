import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

import { projects } from '../database/schemas';


export const ProjectSchema = createInsertSchema(projects, {
    slug: z.stringFormat('slug', /^[a-z][a-z0-9]+$/),
    github: z.url({
        protocol: /^https$/,
        hostname: /^github\.com$/
    }),
    url: z.url({ protocol: /^https?$/ }),
    additionalUrls: z.array(z.url({ protocol: /^https?$/ }))
}).omit({ id: true }).strict();

export type Project = z.infer<typeof ProjectSchema>;
