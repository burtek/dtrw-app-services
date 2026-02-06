import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { projects } from '../database/schemas';

import type { Project } from './projects.schema';


class ProjectsService {
    constructor(private readonly fastifyContext: FastifyInstance) {
    }

    async create(project: Project) {
        const [newProject] = await this.fastifyContext.database.db.insert(projects).values(project).returning();

        return newProject;
    }

    async delete(id: number) {
        return await this.fastifyContext.database.db.delete(projects).where(eq(projects.id, id));
    }

    async getProjects() {
        return await this.fastifyContext.database.db.query.projects.findMany({
            orderBy(p, { asc }) {
                return [asc(p.slug)];
            }
        });
    }

    async update(id: number, project: Project) {
        const [updated] = await this.fastifyContext.database.db
            .update(projects)
            .set(project)
            .where(eq(projects.id, id))
            .returning();

        return updated;
    }
}

export default fp((app, opts, done) => {
    const projectsService = new ProjectsService(app);

    app.decorate('projectsService', projectsService);

    done();
}, {
    name: 'projects-service',
    dependencies: ['database-plugin'],
    decorators: { fastify: ['database'] }
});

declare module 'fastify' {
    interface FastifyInstance {
        projectsService: ProjectsService;
    }
}
