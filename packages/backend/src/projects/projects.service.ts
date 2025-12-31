import { eq } from 'drizzle-orm';

import { BaseRepo } from '../database/repo';
import { projects } from '../database/schemas';

import type { Project } from './projects.schema';


export class ProjectsService extends BaseRepo {
    async create(project: Project) {
        const [newProject] = await this.db.insert(projects).values(project).returning();

        return newProject;
    }

    async delete(id: number) {
        return await this.db.delete(projects).where(eq(projects.id, id));
    }

    async getProjects() {
        return await this.db.query.projects.findMany({
            orderBy(p, { asc }) {
                return [asc(p.slug)];
            }
        });
    }

    async update(id: number, project: Project) {
        const [updated] = await this.db
            .update(projects)
            .set(project)
            .where(eq(projects.id, id))
            .returning();

        return updated;
    }
}
