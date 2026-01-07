/* eslint no-warning-comments: 1 */
import { Button, Flex, Heading } from '@radix-ui/themes';
import { memo, useMemo } from 'react';

import { useGetContainersState } from '../containers/api-containers';
import { useDialogId } from '../hooks/useDialogId';
import { useMinDivWidth } from '../hooks/useMinDivWidth';
import { useSearchContext } from '../search/context';
import { containerMatchesStringSearch, projectMatchesStringSearch } from '../search/helpers';

import { useGetProjectsQuery } from './api';
import { ProjectFormDialog } from './form';
import { ProjectCard } from './project';


const Component = () => {
    const { data: projects } = useGetProjectsQuery();
    const { data: containers } = useGetContainersState();

    const searchParams = useSearchContext();
    const filteredProjects = useMemo(() => projects?.filter(project => {
        if (searchParams.length === 0) {
            return true;
        }
        const result = searchParams.every(param => {
            switch (param.queryType) {
                case 'container_type':
                    return containers?.some(c => c.projectId === project.id && c.type.toLowerCase().startsWith(param.query.toLowerCase()));
                case 'project_slug':
                    return project.slug.toLowerCase().startsWith(param.query.toLowerCase());
                case 'string':
                    return projectMatchesStringSearch(project, param.query)
                        || containers?.some(c => c.projectId === project.id && containerMatchesStringSearch(c, param.query));
                case 'username':
                case 'usergroup':
                    return false; // TODO: implement based on ACL
            }
            return true;
        });
        return result;
    }), [projects, searchParams, containers]);

    const [dialogId, openEditDialog, openNewDialog, closeDialog] = useDialogId();

    return (
        <Flex
            gap="1"
            direction="column"
            overflowY="auto"
            height="100%"
            {...useMinDivWidth()}
        >
            <Heading as="h2">
                Projects (
                {projects?.length ?? 0}
                )
            </Heading>
            {filteredProjects?.map(project => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    openEdit={openEditDialog}
                />
            ))}
            <Button
                size="1"
                variant="soft"
                style={{ width: '100%' }}
                onClick={openNewDialog}
            >
                New Project
            </Button>
            {dialogId !== false && (
                <ProjectFormDialog
                    id={dialogId}
                    close={closeDialog}
                />
            )}
        </Flex>
    );
};
Component.displayName = 'Projects';

export const Projects = memo(Component);
