import type { FastifyRequest } from 'fastify';


export const handleAbort = ({ raw }: FastifyRequest): AbortSignal => {
    const abortController = new AbortController();
    raw.on('close', () => {
        // using deprecated property 'aborted' on purpose here because
        // https://fastify.dev/docs/latest/Guides/Detecting-When-Clients-Abort/#overview:~:text=Whilst%20the%20aborted%20property%20has%20been%20deprecated
        // also, it's doc-only deprecation to point at the correct use of .aborted vs .destroyed (DEP0156)
        if (raw.aborted) {
            abortController.abort();
        }
    });
    return abortController.signal;
};
