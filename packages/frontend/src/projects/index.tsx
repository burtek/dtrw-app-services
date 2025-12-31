import { Button, Flex, Heading } from '@radix-ui/themes';
import { memo } from 'react';

import { useDialogId } from '../hooks/useDialogId';

import { useGetProjectsQuery } from './api';
import { ProjectFormDialog } from './form';
import { ProjectCard } from './project';


const Component = () => {
    const { data: projects } = useGetProjectsQuery();

    const [dialogId, openEditDialog, openNewDialog, closeDialog] = useDialogId();

    return (
        <Flex
            gap="1"
            direction="column"
            overflowY="auto"
            height="100%"
        >
            <Heading as="h2">Projects</Heading>
            {projects?.map(project => (
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
