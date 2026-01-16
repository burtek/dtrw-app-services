import { Cross1Icon, ExternalLinkIcon, GitHubLogoIcon, Link1Icon, Pencil2Icon } from '@radix-ui/react-icons';
import { Badge, Box, Button, Card, Flex, Link, Text } from '@radix-ui/themes';
import classNames from 'classnames';
import { memo, useCallback } from 'react';
import { toast } from 'react-toastify';

import { ClickableBadge } from '../components/clickableBadge';
import { DeleteConfirmButton } from '../components/deleteConfirmButton';
import { selectContainers } from '../containers/api-containers';
import { JiraIcon } from '../icons/jira.svg';
import { handleQueryError } from '../query-error-handler';
import { useAppSelector } from '../redux/store';
import type { Project, WithId } from '../types';

import { selectGithubWorkflowStatuses } from './api-github';
import { useDeleteProjectMutation } from './api-projects';
import { GithubStatusBadge } from './github-status-badge';
import styles from './projects.module.scss';


const Component = ({ project, openEdit }: Props) => {
    const containers = useAppSelector(state => selectContainers(state)?.filter(c => c.projectId === project.id) ?? []);
    const githubStatus = useAppSelector(state => {
        const statuses = selectGithubWorkflowStatuses(state);
        return statuses ? statuses.find(g => g.projectId === project.id) : null;
    });

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

            if (response.error) {
                toast.error(`Password reset failed: ${handleQueryError(response.error)}`);
            } else {
                toast.success('Password reset initiated');
            }
        },
        [deleteProject, project.id]
    );

    return (
        <Box style={{ opacity: isLoading ? 0.4 : 1 }}>
            <Card className={classNames(styles.project, project.planned && styles.planned)}>
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
                    <ClickableBadge
                        type="project_slug"
                        slug={project.slug}
                        planned={project.planned}
                    />
                    <Link
                        href={project.url}
                        title={project.url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <ExternalLinkIcon />
                    </Link>
                    <Link
                        href={project.github}
                        title={project.github}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <GitHubLogoIcon />
                    </Link>
                    {!!project.jira && (
                        <Link
                            href={project.jira}
                            title={project.jira}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <JiraIcon />
                        </Link>
                    )}
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
                    {githubStatus?.error ? '⚠️' : null}
                </Flex>
                {(githubStatus === null || Object.keys(githubStatus?.workflows ?? {}).length > 0) && (
                    <Flex
                        gap="2"
                        align="center"
                        ml="4"
                        mb="1"
                    >
                        {githubStatus === null && (
                            <Link style={{ textDecoration: 'none' }}>
                                <Badge color="blue">⏳ Loading...</Badge>
                            </Link>
                        )}
                        {Object.entries(githubStatus?.workflows ?? {}).map(([workflowName, workflow]) => (
                            <GithubStatusBadge
                                key={workflowName}
                                workflow={workflow}
                            />
                        ))}
                    </Flex>
                )}
                {!project.planned && (
                    <Flex
                        gap="1"
                        wrap="wrap"
                        align="center"
                    >
                        <Text as="div">Containers:</Text>
                        {containers.length === 0 && <Text style={{ fontStyle: 'italic' }}>None</Text>}
                        {containers.map(container => (
                            <ClickableBadge
                                key={container.id}
                                type="container_type"
                                containerType={container.type}
                                label={container.name}
                            />
                        ))}
                    </Flex>
                )}
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
