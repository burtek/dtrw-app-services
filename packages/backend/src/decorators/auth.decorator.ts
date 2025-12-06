import type { FastifyInstance } from 'fastify';


export interface AutheliaAuthInfo {
    username: string;
    groups: string[];
}

declare module 'fastify' {
    interface FastifyRequest {
        user: AutheliaAuthInfo;
    }
}

export function decorateRequestUser(app: FastifyInstance) {
    app.addHook('preHandler', (request, reply, done) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const username = request.headers['remote-user'] as string | undefined;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const groupsHeader = request.headers['remote-groups'] as string | undefined;

        request.user = {
            username: username ?? '',
            groups: groupsHeader?.split(',').map(g => g.trim()) ?? []
        };

        done();
    });
}
