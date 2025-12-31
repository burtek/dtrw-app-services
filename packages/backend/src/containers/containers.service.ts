import { eq } from 'drizzle-orm';

import { BaseRepo } from '../database/repo';
import { containers, containerTypes } from '../database/schemas';

import type { Container } from './containers.schema';


export class ContainersService extends BaseRepo {
    async create(container: Container) {
        const [newContainer] = await this.db.insert(containers).values(container).returning();

        return newContainer;
    }

    async delete(id: number) {
        return await this.db.delete(containers).where(eq(containers.id, id));
    }

    getAllowedContainerTypes() {
        return containerTypes;
    }

    async getContainers() {
        return await this.db.query.containers.findMany({
            orderBy(c, { asc }) {
                return [asc(c.name)];
            }
        });
    }

    async update(id: number, container: Container) {
        const [updated] = await this.db
            .update(containers)
            .set(container)
            .where(eq(containers.id, id))
            .returning();

        return updated;
    }
}
