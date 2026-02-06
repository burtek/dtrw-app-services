import fp from 'fastify-plugin';


export interface AutheliaAuthInfo {
    username: string;
    groups: string[];
}

export default fp((app, options, done) => {
    app.addHook('preHandler', (request, reply, handlerDone) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const username = request.headers['remote-user'] as string | undefined;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const groupsHeader = request.headers['remote-groups'] as string | undefined;

        request.user = username
            ? {
                username,
                groups: groupsHeader?.split(',').map(g => g.trim()) ?? []
            }
            : undefined;

        handlerDone();
    });

    done();
}, { name: 'auth-plugin' });

declare module 'fastify' {
    interface FastifyRequest {
        user?: AutheliaAuthInfo;
    }
}
