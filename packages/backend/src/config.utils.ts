import { accessSync, constants as fsConstants, lstatSync } from 'node:fs';
import { resolve } from 'node:path';

import { z } from 'zod/v4';
import type { $RefinementCtx } from 'zod/v4/core';


export const filePath = () => z.string()
    .regex(/^\/.+$/, { error: 'Must be an absolute Unix path', abort: true })
    .transform(path => resolve(path))
    .refine(path => {
        try {
            accessSync(path, fsConstants.R_OK | fsConstants.W_OK);
            return true;
        } catch {
            return false;
        }
    }, { error: 'File must exist and be readable and writable by the application', abort: true })
    .refine(path => {
        try {
            return lstatSync(path).isFile();
        } catch {
            return false;
        }
    }, 'Path must point to a file');

/**
 * Sets property as required if condition is set
 */
export const refineOptionalCondition = <T extends Partial<Record<`DOCKER_${string}`, string>>>(
    condition: `DOCKER_${string}` & keyof T,
    property: `DOCKER_${string}` & keyof T
) => (data: T, ctx: $RefinementCtx<T>) => {
    if (data[condition] && !data[property]) {
        ctx.addIssue({
            code: 'invalid_type',
            expected: 'string',
            path: [property],
            input: data[property],
            message: 'Invalid input'
        });
    }
};
