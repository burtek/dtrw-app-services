import { SqliteError } from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { containers, containerTypes } from '../database/schemas';
import { AppError } from '../errors';

import type { Container } from './containers.schema';


class ContainersService {
    constructor(private readonly fastifyContext: FastifyInstance) {
    }

    async create(container: Container) {
        try {
            const [newContainer] = await this.fastifyContext.database.db.insert(containers).values(container).returning();

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            return newContainer as NonNullable<typeof newContainer>;
        } catch (error) {
            if (error instanceof SqliteError) {
                this.fastifyContext.log.error(`SQLite Error Code: ${error.code}`);
                if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === 'SQLITE_CONSTRAINT_CHECK') {
                    throw AppError.badRequest(error.message);
                } else {
                    throw error;
                }
            }
            throw error;
        }
    }

    async delete(id: number) {
        return await this.fastifyContext.database.db.delete(containers).where(eq(containers.id, id));
    }

    getAllowedContainerTypes() {
        return containerTypes;
    }

    async getContainers() {
        return await this.fastifyContext.database.db.query.containers.findMany({
            orderBy(c, { asc }) {
                return [asc(c.name)];
            }
        });
    }

    async update(id: number, container: Container) {
        const [updated] = await this.fastifyContext.database.db
            .update(containers)
            .set(container)
            .where(eq(containers.id, id))
            .returning();

        return updated;
    }
}

export default fp((app, opts, done) => {
    const containersService = new ContainersService(app);

    app.decorate('containersService', containersService);

    done();
}, {
    name: 'containers-service',
    dependencies: ['database-plugin'],
    decorators: { fastify: ['database'] }
});

declare module 'fastify' {
    interface FastifyInstance {
        containersService: ContainersService;
    }
}
