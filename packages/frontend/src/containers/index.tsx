import { Button, Flex, Heading, Separator } from '@radix-ui/themes';
import { createSelector } from '@reduxjs/toolkit';
import { memo, useCallback } from 'react';

import { useDialogId } from '../hooks/useDialogId';
import { useAppSelector } from '../redux/store';
import type { Container, DockerContainer, WithId } from '../types';

import { selectContainers, useGetContainersQuery } from './api-containers';
import { selectDockerContainers, useGetDockerContainersQuery } from './api-docker';
import { ContainerFormDialog } from './form';
import { KnownContainerCard } from './known-container';
import { UnknownContainerCard } from './unknown-container';


const selectContainersCombined = createSelector(
    selectContainers,
    selectDockerContainers,
    (containers = [], dockerContainers = []) => {
        const knownDockerContainers: [WithId<DockerContainer>[], WithId<Container>][]
            = containers.map(container => [[], container]);
        const unknownDockerContainers: WithId<DockerContainer>[] = [];

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

        return {
            knownDockerContainers,
            unknownDockerContainers
        };
    }
);

const Component = () => {
    useGetContainersQuery();
    useGetDockerContainersQuery(undefined, { pollingInterval: 10_000 });
    const {
        knownDockerContainers,
        unknownDockerContainers
    } = useAppSelector(selectContainersCombined);

    const [dialogId, openEditDialog, openNewDialog, closeDialog, newContainerName] = useDialogId<string>({ withNewParam: true });

    const handleCreateNew = useCallback(() => {
        openNewDialog('');
    }, [openNewDialog]);

    return (
        <Flex
            gap="1"
            direction="column"
            overflowY="auto"
            height="100%"
        >
            <Heading as="h2">Containers</Heading>
            {knownDockerContainers.map(([dockerContainers, container]) => (
                <KnownContainerCard
                    key={container.id}
                    container={container}
                    dockerContainers={dockerContainers}
                    openEdit={openEditDialog}
                />
            ))}
            <Button
                size="1"
                variant="soft"
                style={{ width: '100%' }}
                onClick={handleCreateNew}
            >
                New Container
            </Button>
            <Separator
                my="3"
                size="4"
            />
            {unknownDockerContainers.map(dockerContainer => (
                <UnknownContainerCard
                    key={dockerContainer.id}
                    dockerContainer={dockerContainer}
                    openAdd={openNewDialog}
                />
            ))}
            {dialogId !== false && (
                <ContainerFormDialog
                    id={dialogId}
                    close={closeDialog}
                    newContainerName={newContainerName}
                />
            )}
        </Flex>
    );
};
Component.displayName = 'Containers';

export const Containers = memo(Component);
