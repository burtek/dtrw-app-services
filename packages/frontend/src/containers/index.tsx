import { ReloadIcon } from '@radix-ui/react-icons';
import { Button, Flex, Heading, Separator } from '@radix-ui/themes';
import { memo, useCallback } from 'react';

import { useDialogId } from '../hooks/useDialogId';
import { useMinDivWidth } from '../hooks/useMinDivWidth';
import { useAppSelector } from '../redux/store';
import { useSearchContext } from '../search/context';

import { useGetContainersQuery } from './api-containers';
import { DockerRefetchController } from './docker-refetch-controller';
import { ContainerFormDialog } from './form';
import { KnownContainerCard } from './known-container';
import { selectContainersCombined } from './selectors';
import { UnknownContainerCard } from './unknown-container';


const Component = () => {
    const { refetch, isFetching } = useGetContainersQuery();

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
            {...useMinDivWidth()}
        >
            <DockerRefetchController />
            <Flex
                justify="between"
                align="center"
                px="2"
            >
                <Heading as="h2">
                    Containers (
                    {knownDockerContainers.length}
                    {unknownDockerContainers.length > 0 ? ` + ${unknownDockerContainers.length}` : ''}
                    )
                </Heading>
                <Button
                    variant="ghost"
                    onClick={refetch}
                    loading={isFetching}
                    mx="2"
                    size="4"
                >
                    <ReloadIcon />
                </Button>
            </Flex>
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
