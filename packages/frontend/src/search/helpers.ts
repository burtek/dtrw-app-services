import type { Container, DockerContainer, Project, WithId } from '../types';


export const projectMatchesStringSearch = (project: WithId<Project> | undefined, query: string) => {
    if (!project) {
        return false;
    }
    const queryLower = query.toLowerCase();

    return [
        project.name,
        project.slug,
        project.url,
        project.github,
        ...project.additionalUrls
    ].some(field => field.toLowerCase().includes(queryLower));
};

export const containerMatchesStringSearch = (container: WithId<Container> | undefined, query: string) => {
    if (!container) {
        return false;
    }
    const queryLower = query.toLowerCase();

    return [container.name, container.type].some(field => field.toLowerCase().includes(queryLower));
};

export const dockerContainerMatchesStringSearch = (container: WithId<DockerContainer, string> | undefined, query: string) => {
    if (!container) {
        return false;
    }
    const queryLower = query.toLowerCase();

    return [
        container.image,
        ...container.names,
        ...Object.values(container.labels),
        container.state,
        container.status,
        container.command
    ].some(field => field.toLowerCase().includes(queryLower));
};
