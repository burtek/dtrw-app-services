import { Button, Flex, Heading, Separator } from '@radix-ui/themes';
import { memo, useCallback } from 'react';

import { useDialogId } from '../hooks/useDialogId';
import { useAppSelector } from '../redux/store';
import { useSearchContext } from '../search/context';

import { useGetContainersQuery } from './api-containers';
import { useGetDockerContainersQuery } from './api-docker';
import { ContainerFormDialog } from './form';
import { KnownContainerCard } from './known-container';
import { selectContainersCombined } from './selectors';
import { UnknownContainerCard } from './unknown-container';


const Component = () => {
    useGetContainersQuery();
    useGetDockerContainersQuery(undefined, { pollingInterval: 10_000 });

    const searchParams = useSearchContext();

    const {
        knownDockerContainers,
        unknownDockerContainers
    } = useAppSelector(state => selectContainersCombined(state, searchParams));

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
            <Heading as="h2">
                Containers (
                {knownDockerContainers.length}
                {unknownDockerContainers.length > 0 ? ` + ${unknownDockerContainers.length}` : ''}
                )
            </Heading>
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
            {unknownDockerContainers.length > 0 && (
                <>
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
                </>
            )}
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
