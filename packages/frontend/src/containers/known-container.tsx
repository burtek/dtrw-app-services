import { Cross1Icon, Pencil2Icon } from '@radix-ui/react-icons';
import { Badge, Box, Button, Card, Flex, Grid, Text } from '@radix-ui/themes';
import { Fragment, memo, useCallback } from 'react';
import { toast } from 'react-toastify';

import { DeleteConfirmButton } from '../components/deleteConfirmButton';
import { selectProjects } from '../projects/api';
import { useAppSelector } from '../redux/store';
import type { Container, DockerContainer, WithId } from '../types';

import { useDeleteContainerMutation } from './api-containers';
import { containerConfigByType } from './containers-types';
import styles from './containers.module.scss';


const Component = ({ container, dockerContainers, openEdit }: Props) => {
    const containerProject = useAppSelector(state => selectProjects(state)?.find(p => p.id === container.projectId));

    const handleEdit = useCallback(
        () => {
            openEdit(container.id);
        },
        [openEdit, container.id]
    );

    const [deleteContainer, { isLoading }] = useDeleteContainerMutation();
    const handleDelete = useCallback(
        async () => {
            const response = await deleteContainer({ id: container.id });

            if (typeof response.data === 'boolean') {
                return;
            }
            if ('status' in response.error) {
                toast.error(String(response.error.data));
            } else {
                toast.error(String(response.error.message ?? response.error.name));
            }
        },
        [deleteContainer, container.id]
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
        <Box style={{ opacity: isLoading ? 0.4 : 1 }}>
            <Card className={styles.container}>
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
                    <Badge
                        color="orange"
                        variant="surface"
                    >
                        {containerProject?.slug}
                    </Badge>
                    <Badge
                        color={containerConfigByType(container.type)?.color ?? 'gray'}
                        variant="surface"
                    >
                        {container.type}
                    </Badge>
                    {renderDockerContainersBadge()}
                </Flex>
                <Grid
                    columns="repeat(3, min-content)"
                    gap="1"
                    ml="2"
                >
                    {dockerContainers.map(c => {
                        const color = { running: 'green' as const, exited: 'red' as const, dead: 'red' as const }[c.state] ?? 'yellow' as const;

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
    dockerContainers: WithId<DockerContainer>[];
    openEdit: (id: number) => void;
}

export const KnownContainerCard = memo(Component);
