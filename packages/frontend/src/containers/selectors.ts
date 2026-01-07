/* eslint no-warning-comments: 1 */
import { createSelector } from '@reduxjs/toolkit';

import { selectProjects } from '../projects/api';
import type { SearchContextValues } from '../search/context';
import { containerMatchesStringSearch, dockerContainerMatchesStringSearch, projectMatchesStringSearch } from '../search/helpers';
import type { Container, DockerContainer, WithId } from '../types';

import { selectContainers } from './api-containers';
import { selectDockerContainers } from './api-docker';


export const selectContainersCombined = createSelector(
    selectContainers,
    selectDockerContainers,
    selectProjects,
    (_: unknown, searchParams: SearchContextValues) => searchParams,
    (containers = [], dockerContainers = [], projects = [], searchParams) => {
        const knownDockerContainers: [WithId<DockerContainer, string>[], WithId<Container>][]
            = containers.map(container => [[], container]);
        const unknownDockerContainers: WithId<DockerContainer, string>[] = [];

        dockerContainers.forEach(dockerContainer => {
            for (const knownContainer of knownDockerContainers) {
                if (dockerContainer.names.some(name => knownContainer[1].name === name.replace(/^\/+/, ''))) {
                    knownContainer[0].push(dockerContainer);
                    return; // goto next forEach
                }
            }
            // definition not found (return not called)
            unknownDockerContainers.push(dockerContainer);
        });

        knownDockerContainers.sort(([dockersA, defA], [dockersB, defB]) => {
            // move non-running to the beginning
            const aIssue = dockersA.length !== 1 || dockersA.some(dc => dc.state !== 'running');
            const bIssue = dockersB.length !== 1 || dockersB.some(dc => dc.state !== 'running');
            if (aIssue && !bIssue) {
                return -1;
            }
            if (!aIssue && bIssue) {
                return 1;
            }
            // both running or both not running - sort by name
            return defA.name.localeCompare(defB.name);
        });
        unknownDockerContainers.sort((a, b) => a.names[0].localeCompare(b.names[0]));

        const filteredKnownDockerContainers = knownDockerContainers.filter(([dockerCnts, container]) => {
            if (searchParams.length === 0) {
                return true;
            }
            const project = projects.find(p => p.id === container.projectId);
            return searchParams.every(param => {
                switch (param.queryType) {
                    case 'container_type':
                        return container.type.toLowerCase().startsWith(param.query.toLowerCase());
                    case 'project_slug':
                        return project?.slug.toLowerCase().startsWith(param.query.toLowerCase());
                    case 'string':
                        return projectMatchesStringSearch(project, param.query)
                            || containerMatchesStringSearch(container, param.query)
                            || dockerCnts.some(dc => dockerContainerMatchesStringSearch(dc, param.query));
                    case 'username':
                    case 'usergroup':
                        return false; // TODO: implement based on project's ACL
                }
                return true;
            });
        });
        const filteredUnknownDockerContainers = unknownDockerContainers.filter(dockerContainer => {
            if (searchParams.length === 0) {
                return true;
            }
            return searchParams.every(param => {
                switch (param.queryType) {
                    case 'container_type':
                    case 'project_slug':
                    case 'username':
                    case 'usergroup':
                        return false;
                    case 'string':
                        return dockerContainerMatchesStringSearch(dockerContainer, param.query);
                }
                return true;
            });
        });

        return {
            knownDockerContainers: filteredKnownDockerContainers,
            unknownDockerContainers: filteredUnknownDockerContainers,
            total: knownDockerContainers.length + unknownDockerContainers.length
        };
    }
);
