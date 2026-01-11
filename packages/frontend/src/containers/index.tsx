import { ReloadIcon } from '@radix-ui/react-icons';
import { Button, Flex, Heading, Separator } from '@radix-ui/themes';
import { memo, useCallback, useMemo } from 'react';

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


const measureTextWidth = (text: string) => {
    const el = document.createElement('span');
    el.style.position = 'absolute';
    el.style.visibility = 'hidden';
    el.style.whiteSpace = 'nowrap';
    el.style.left = '-9999px';
    el.style.font = 'inherit';
    el.textContent = text;
    document.body.appendChild(el);
    const w = el.offsetWidth;
    document.body.removeChild(el);
    return w;
};

const Component = () => {
    const { refetch, isFetching } = useGetContainersQuery();

    const searchParams = useSearchContext();

    const {
        knownDockerContainers,
        unknownDockerContainers
    } = useAppSelector(state => selectContainersCombined(state, searchParams));

    const widthProps = useMemo(() => knownDockerContainers
        .flatMap(([dockerContainers]) => dockerContainers)
        .reduce((acc, cur) => {
            acc.maxImageWidth = Math.max(acc.maxImageWidth, measureTextWidth(cur.image));
            acc.maxStatusWidth = Math.max(acc.maxStatusWidth, measureTextWidth(cur.status));
            return acc;
        }, { maxImageWidth: 0, maxStatusWidth: 0 }), [knownDockerContainers]);

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
                    widthProps={widthProps}
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
