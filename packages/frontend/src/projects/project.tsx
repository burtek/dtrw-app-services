import { Cross1Icon, ExternalLinkIcon, GitHubLogoIcon, Link1Icon, Pencil2Icon } from '@radix-ui/react-icons';
import { Badge, Box, Button, Card, Flex, Link, Text } from '@radix-ui/themes';
import { memo, useCallback } from 'react';
import { toast } from 'react-toastify';

import { DeleteConfirmButton } from '../components/deleteConfirmButton';
import { useGetContainersState } from '../containers/api-containers';
import type { Project, WithId } from '../types';

import { useDeleteProjectMutation } from './api';
import styles from './projects.module.scss';


const Component = ({ project, openEdit }: Props) => {
    const { data: containers } = useGetContainersState();

    const handleEdit = useCallback(
        () => {
            openEdit(project.id);
        },
        [openEdit, project.id]
    );

    const [deleteProject, { isLoading }] = useDeleteProjectMutation();
    const handleDelete = useCallback(
        async () => {
            const response = await deleteProject({ id: project.id });

            if (typeof response.data === 'boolean') {
                return;
            }
            if ('status' in response.error) {
                toast.error(String(response.error.data));
            } else {
                toast.error(String(response.error.message ?? response.error.name));
            }
        },
        [deleteProject, project.id]
    );

    const containersForProject = containers?.filter(c => c.projectId === project.id).map(c => c.name) ?? [];

    return (
        <Box style={{ opacity: isLoading ? 0.4 : 1 }}>
            <Card className={styles.project}>
                <Flex
                    gap="2"
                    align="center"
                >
                    <Text
                        as="div"
                        weight="bold"
                    >
                        {project.name}
                    </Text>
                    <Badge
                        color="blue"
                        variant="surface"
                    >
                        {project.slug}
                    </Badge>
                    <Link
                        href={project.url}
                        title={project.url}
                    >
                        <ExternalLinkIcon />
                    </Link>
                    <Link
                        href={project.github}
                        title={project.github}
                    >
                        <GitHubLogoIcon />
                    </Link>
                </Flex>
                {[project.url, ...project.additionalUrls].map(url => (
                    <Flex
                        key={url}
                        gap="1"
                        align="center"
                    >
                        <Link1Icon />
                        <Text>{url}</Text>
                    </Flex>
                ))}
                <Flex
                    gap="1"
                    align="center"
                >
                    <GitHubLogoIcon />
                    <Text>{project.github.replace('https://github.com/', '').replace(/\/$/, '')}</Text>
                </Flex>
                <Text as="div">
                    {'Containers: '}
                    {containersForProject.length > 0 ? containersForProject.join(', ') : <i>None</i>}
                </Text>
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
                        header={<>Remove: <i>{project.name}</i></>}
                        description="Are you sure? This project will be removed and will need to be recreated"
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
Component.displayName = 'ProjectCard';

interface Props {
    project: WithId<Project>;
    openEdit: (id: number) => void;
}

export const ProjectCard = memo(Component);
