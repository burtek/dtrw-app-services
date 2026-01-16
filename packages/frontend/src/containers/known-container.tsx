import { Cross1Icon, Pencil2Icon, ReloadIcon } from '@radix-ui/react-icons';
import { Badge, Box, Button, Card, Flex, Grid, Text } from '@radix-ui/themes';
import classNames from 'classnames';
import { Fragment, memo, useCallback } from 'react';
import { toast } from 'react-toastify';

import { ClickableBadge } from '../components/clickableBadge';
import { DeleteConfirmButton } from '../components/deleteConfirmButton';
import { selectProjects } from '../projects/api';
import { handleQueryError } from '../query-error-handler';
import { useAppSelector } from '../redux/store';
import type { Container, DockerContainer, WithId } from '../types';

import { useDeleteContainerMutation } from './api-containers';
import { useRequestRestartMutation } from './api-docker';
import styles from './containers.module.scss';


const Component = ({ container, dockerContainers, openEdit, widthProps }: Props) => {
    const containerProject = useAppSelector(state => selectProjects(state)?.find(p => p.id === container.projectId));

    const handleEdit = useCallback(
        () => {
            openEdit(container.id);
        },
        [openEdit, container.id]
    );

    const [deleteContainer, { isLoading: isDeleting }] = useDeleteContainerMutation();
    const handleDelete = useCallback(
        async () => {
            const response = await deleteContainer({ id: container.id });

            if (response.error) {
                toast.error(`Container could not be deleted: ${handleQueryError(response.error)}`);
            } else {
                toast.success('Container deleted');
            }
        },
        [deleteContainer, container.id]
    );

    const [requestRestart, { isLoading: isRequestingRestart }] = useRequestRestartMutation();
    const handleRequestRestart = useCallback(
        async (id: string) => {
            const response = await requestRestart({ id });

            if (response.error) {
                toast.error(`Restart request failed: ${handleQueryError(response.error)}`);
            } else {
                toast.success('Restart requested');
            }
        },
        [requestRestart]
    );

    const renderDockerContainersBadge = () => {
        const color = { 0: 'red' as const, 1: 'green' as const }[dockerContainers.length] ?? 'orange' as const;
        return (
            <Badge
                color={color}
                variant="surface"
            >
                {`${dockerContainers.length} found`}
            </Badge>
        );
    };

    return (
        <Box style={{ opacity: isDeleting ? 0.4 : 1 }}>
            <Card className={classNames(styles.container, (dockerContainers.length !== 1 || dockerContainers[0].state !== 'running') && styles.warning)}>
                <Flex
                    gap="2"
                    align="center"
                >
                    <Text
                        as="div"
                        weight="bold"
                    >
                        {container.name}
                    </Text>
                    {containerProject?.slug !== undefined && (
                        <ClickableBadge
                            type="project_slug"
                            slug={containerProject.slug}
                            planned={containerProject.planned}
                        />
                    )}
                    <ClickableBadge
                        type="container_type"
                        containerType={container.type}
                    />
                    {renderDockerContainersBadge()}
                </Flex>
                <Grid
                    columns={`${widthProps?.maxImageWidth ?? 2}fr ${widthProps?.maxStatusWidth ?? 1}fr min-content min-content`}
                    gap="1"
                    ml="2"
                >
                    {dockerContainers.map(c => {
                        const color = { running: 'green' as const, exited: 'red' as const, dead: 'red' as const }[c.state] ?? 'yellow' as const;
                        const onRequestRestart = () => handleRequestRestart(c.id);

                        return (
                            <Fragment key={c.id}>
                                <Text as="div">{c.image}</Text>
                                <Text as="div">{c.status}</Text>
                                <Badge
                                    variant="surface"
                                    color={color}
                                >
                                    {c.state}
                                </Badge>
                                <Button
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={onRequestRestart}
                                    variant="ghost"
                                    loading={isRequestingRestart}
                                >
                                    <ReloadIcon />
                                </Button>
                            </Fragment>
                        );
                    })}
                </Grid>
                <Flex
                    m="2"
                    gap="2"
                    className={styles.actions}
                >
                    <Button
                        onClick={handleEdit}
                        variant="ghost"
                    >
                        <Pencil2Icon />
                    </Button>
                    <DeleteConfirmButton
                        // eslint-disable-next-line @stylistic/jsx-one-expression-per-line, react/jsx-one-expression-per-line
                        header={<>Remove: <i>{container.name}</i></>}
                        description="Are you sure? This container will be removed and associated docker container will appear as unknown"
                        onConfirm={handleDelete}
                    >
                        <Button variant="ghost">
                            <Cross1Icon />
                        </Button>
                    </DeleteConfirmButton>
                </Flex>
            </Card>
        </Box>
    );
};
Component.displayName = 'KnownContainerCard';

interface Props {
    container: WithId<Container>;
    dockerContainers: WithId<DockerContainer, string>[];
    openEdit: (id: number) => void;
    widthProps?: {
        maxImageWidth: number;
        maxStatusWidth: number;
    };
}

export const KnownContainerCard = memo(Component);
