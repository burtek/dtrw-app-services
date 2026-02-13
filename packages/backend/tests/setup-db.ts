import { caddyConfigs, containers, ContainerType, projects } from '../src/database/schemas';
import type { makeDb } from '../src/database/utils';


export async function seedData(db: ReturnType<typeof makeDb>) {
    await Promise.all([
        { id: 1, name: 'Project 1', github: 'https://github.com/burtek/dtrw-app-project1', slug: 'proj1', url: 'https://project1.dtrw.ovh' },
        { id: 2, name: 'Project 2', github: 'https://github.com/burtek/dtrw-app-project2', slug: 'proj2', url: 'https://project2.dtrw.ovh' },
        { id: 3, name: 'Project 3', github: 'https://github.com/burtek/dtrw-app-project3', slug: 'proj3', url: 'https://project3.dtrw.ovh' },
        { id: 4, name: 'Project 4', github: 'https://github.com/burtek/dtrw-app-project4', slug: 'proj4', url: 'https://project4.dtrw.ovh', planned: true },
        { id: 5, name: 'Project 5', github: 'https://github.com/burtek/dtrw-app-project5', slug: 'proj5', url: 'https://project5.dtrw.ovh', planned: true }
    ].map(async project => {
        await db.insert(projects).values(project);
    }));

    await Promise.all([
        { id: 1, name: 'proj1-cont1', type: ContainerType.BACKEND, projectId: 1 },
        { id: 2, name: 'proj1-cont2', type: ContainerType.FRONTEND, projectId: 1 },
        { id: 3, name: 'proj1-cont3', type: ContainerType.DATABASE, projectId: 1 },
        { id: 4, name: 'proj2-cont1', type: ContainerType.BACKEND, projectId: 2 },
        { id: 5, name: 'proj2-cont2', type: ContainerType.FRONTEND, projectId: 2 },
        { id: 6, name: 'proj3-cont1', type: ContainerType.BACKEND, projectId: 3 },
        { id: 7, name: 'proj3-cont2', type: ContainerType.FRONTEND, projectId: 3 },
        { id: 8, name: 'standalone-1', type: ContainerType.STANDALONE, projectId: null }
    ].map(async container => {
        await db.insert(containers).values(container);
    }));

    await Promise.all([
        { id: 1, projectId: 1, standaloneContainerId: null, order: 1, auth: 'enabled' as const },
        { id: 2, projectId: 2, standaloneContainerId: null, order: 2, auth: 'disabled' as const },
        { id: 3, projectId: 3, standaloneContainerId: null, order: 4, auth: 'enabled' as const },
        { id: 4, projectId: null, standaloneContainerId: 8, order: 3, auth: 'enabled' as const, standaloneContainerDomain: 'standalone.dtrw.ovh' }
    ].map(async config => {
        await db.insert(caddyConfigs).values(config);
    }));
}
