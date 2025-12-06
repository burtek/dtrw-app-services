import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from 'src/errors';


function errorHandler(error: Error, request: FastifyRequest, reply: FastifyReply) {
    if (error instanceof AppError) {
        reply.code(error.type).send({ success: false, error: error.message });
    } else {
        reply.send(error);
    }
}

export function decorateErrorHandler(app: FastifyInstance) {
    app.setErrorHandler(errorHandler);
}
