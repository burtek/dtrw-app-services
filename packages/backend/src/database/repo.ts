import type { FastifyInstance } from 'fastify';

import { getDb } from '.';


export abstract class BaseRepo {
    constructor(private readonly fastifyContext: FastifyInstance) {
    }

    protected get db() {
        return getDb(this.fastifyContext.log);
    }
}
