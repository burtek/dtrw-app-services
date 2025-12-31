/* eslint-disable @typescript-eslint/naming-convention */
import { z } from 'zod/v4';


export const AccessControlPolicySchema = z.enum(['deny', 'bypass', 'one_factor', 'two_factor']);
export const AccessControlSubject = z.templateLiteral([z.enum(['user', 'group', 'oauth2:client']), ':', z.string()]);
export const AccessControlMethod = z.enum(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH', 'PROPFIND', 'PROPPATCH', 'MKCOL', 'COPY', 'MOVE', 'LOCK', 'UNLOCK']);
export const AccessControlRule = z.object({
    domain: z.union([z.string().nonempty(), z.array(z.string().nonempty()).nonempty()]).optional(),
    domain_regex: z.union([z.string().nonempty(), z.array(z.string().nonempty()).nonempty()]).optional(),
    policy: AccessControlPolicySchema,
    subject: z.union([
        AccessControlSubject,
        z.array(
            z.union([AccessControlSubject, z.array(AccessControlSubject).nonempty()])
        ).nonempty()
    ]).optional(),
    methods: z.array(AccessControlMethod).nonempty().optional(),
    networks: z.any().optional(), // leave unhandled for now
    resources: z.array(z.string()).nonempty().optional(),
    query: z.any().optional() // leave unhandled for now
}).refine(
    data => !!data.domain || !!data.domain_regex,
    {
        error: 'Either domain or domain_regex must be provided',
        path: ['domain']
    }
).refine(
    data => !(data.policy === 'bypass' && !!data.subject),
    {
        error: 'bypass policy can\'t be used with subject filter',
        path: ['policy']
    }
);
export const AccessControlRulesSchema = z.array(AccessControlRule);
export const AccessControlSchema = z.looseObject({
    default_policy: AccessControlPolicySchema.optional(),
    rules: AccessControlRulesSchema
});

export const AutheliaConfigSchema = z.looseObject({
    server: z.any(),
    authentication_backend: z.any(),
    access_control: AccessControlSchema
});

export type AccessControl = z.infer<typeof AccessControlSchema>;
export type AccessControlPolicy = z.infer<typeof AccessControlPolicySchema>;
export type AccessControlRules = z.infer<typeof AccessControlRulesSchema>;
export type AutheliaConfig = z.infer<typeof AutheliaConfigSchema>;
