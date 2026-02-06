/* eslint-disable no-warning-comments */
import { Pencil2Icon, Cross1Icon, CrossCircledIcon, ExclamationTriangleIcon, LockClosedIcon, Link2Icon, LockOpen1Icon, QuestionMarkIcon } from '@radix-ui/react-icons';
import { Box, Button, Callout, Card, Flex, Badge as RadixBadge } from '@radix-ui/themes';
import classNames from 'classnames';
import type { Identifier } from 'dnd-core';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { Badge } from '../components/badge';
import { DeleteConfirmButton } from '../components/deleteConfirmButton';
import { useGetContainersQuery } from '../containers/api-containers';
import { useGetProjectsQuery } from '../projects/api-projects';
import type { WithId, CaddyConfig } from '../types';

import styles from './routing.module.scss';


const Warning = ({ text, error }: { text: string; error?: boolean }) => (
    <Callout.Root color={error ? 'red' : 'orange'}>
        <Callout.Icon>
            {error ? <ExclamationTriangleIcon /> : <CrossCircledIcon />}
        </Callout.Icon>
        <Callout.Text>
            {`-- ${text} --`}
        </Callout.Text>
    </Callout.Root>
);
Warning.displayName = 'RoutingEntry.Warning';

const Component = ({ entry, openEdit, index, onDrag, onDrop }: Props) => {
    const { project } = useGetProjectsQuery(undefined, { //
        selectFromResult: ({ data }) => ({ project: data?.find(p => p.id === entry.projectId) })
    });
    const { container } = useGetContainersQuery(undefined, { //
        selectFromResult: ({ data }) => ({ container: data?.find(c => c.id === entry.standaloneContainerId) })
    });
    const { projectContainers } = useGetContainersQuery(undefined, { //
        selectFromResult: ({ data }) => ({ projectContainers: data?.filter(c => !!project && c.projectId === project.id) })
    });

    const isDeleting = false as boolean; // TODO: implement delete loading state
    const handleEdit = useCallback(
        () => {
            openEdit(entry.id);
        },
        [openEdit, entry.id]
    );
    // eslint-disable-next-line -- TODO: implement delete loading state
    const handleDelete = () => {};

    const entryIssues = useMemo(() => {
        const issues: Array<{ error: boolean; text: string }> = [];

        if (entry.projectId === null && entry.standaloneContainerId === null) {
            issues.push({ error: true, text: 'Invalid entry: neither project nor container assigned' });
        }
        if (entry.projectId !== null && entry.standaloneContainerId !== null) {
            issues.push({ error: true, text: 'Invalid entry: both project and container assigned' });
        }
        if (entry.projectId !== null && !project) {
            issues.push({ error: true, text: 'Missing data: assigned project not found' });
        }
        if (entry.standaloneContainerId !== null && !container) {
            issues.push({ error: true, text: 'Missing data: assigned container not found' });
        }
        if (container && container.type !== 'standalone') {
            issues.push({ error: true, text: 'Invalid entry: assigned container is not standalone' });
        }
        if (!!project && !projectContainers?.filter(c => ['frontend', 'backend'].includes(c.type)).length) {
            issues.push({ error: true, text: 'Missing data: project has no backend or frontend containers' });
        }
        if (entry.projectId !== null && entry.auth === 'provider') {
            issues.push({ error: true, text: 'Invalid entry: project cannot be auth provider' });
        }

        return issues.length ? issues : null;
    }, [entry, project, container, projectContainers]);

    const ref = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
        accept: 'ROUTE',
        collect(monitor) {
            return { handlerId: monitor.getHandlerId() };
        },
        hover(item: DragItem, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex) {
                return;
            }

            const hoverBoundingRect = ref.current.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            const hoverClientY = clientOffset ? clientOffset.y - hoverBoundingRect.top : 0;

            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }

            onDrag(dragIndex, hoverIndex);
            item.index = hoverIndex;
        }
    });
    const [{ isDragging }, drag] = useDrag({
        type: 'ROUTE',
        item: () => ({ id: entry.id, index }),
        collect: monitor => ({ isDragging: monitor.isDragging() }),
        end: () => {
            onDrop();
        }
    });

    // eslint-disable-next-line react-hooks/refs
    drag(drop(ref));

    const authBadge = useMemo(() => {
        switch (entry.auth) {
            case 'enabled':
                return (
                    <RadixBadge color="green">
                        <LockClosedIcon />
                        Auth enabled
                    </RadixBadge>
                );
            case 'disabled':
                return (
                    <RadixBadge color="red">
                        <LockOpen1Icon />
                        Public access
                    </RadixBadge>
                );
            case 'own':
                return (
                    <RadixBadge color="blue">
                        <LockClosedIcon />
                        Own auth
                    </RadixBadge>
                );
            case 'provider':
                return (
                    <RadixBadge color="gray">
                        <LockClosedIcon />
                        Auth provider
                    </RadixBadge>
                );
        }
        return (
            <RadixBadge color="red">
                <QuestionMarkIcon />
                {`Unknown auth mode: ${String(entry.auth)}`}
            </RadixBadge>
        );
    }, [entry.auth]);

    let opacity = 1;
    if (isDeleting) {
        opacity = 0.4;
    } else if (isDragging) {
        opacity = 0;
    }

    return (
        <Box
            style={{ opacity, cursor: isDragging ? 'grabbing' : 'grab' }}
            ref={ref}
            data-handler-id={handlerId}
        >
            <Card className={classNames(styles.container)}>
                {entryIssues?.map(props => (
                    <Warning
                        key={props.text}
                        {...props}
                    />
                ))}

                {!!project && (
                    <Flex
                        gap="1"
                        align="center"
                        wrap="wrap"
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {`${entry.order}: `}
                        <Badge
                            type="project_slug"
                            slug={project.slug}
                            planned={project.planned}
                        />
                        {project.name}
                        <div style={{ marginLeft: 'auto' }}>{authBadge}</div>
                    </Flex>
                )}
                {!!container && (
                    <Flex
                        gap="1"
                        align="center"
                        wrap="wrap"
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {`${entry.order}: `}
                        <Badge
                            type="container_type"
                            containerType={container.type}
                        />
                        {container.name}
                        <RadixBadge color="gray">
                            <Link2Icon />
                            {entry.standaloneContainerDomain}
                        </RadixBadge>
                        <div style={{ marginLeft: 'auto' }}>{authBadge}</div>
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
                        header={<>Remove entry for: <i>{project?.name ?? container?.name ?? '--Invalid entry--'}</i></>}
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
Component.displayName = 'RoutingEntry';

interface Props {
    entry: WithId<CaddyConfig>;
    openEdit: (value: number) => void;

    index: number;
    onDrag: (index: number, newIndex: number) => void;
    onDrop: () => void;
}

interface DragItem {
    index: number;
    id: string;
    type: string;
}

export const RoutingEntry = memo(Component);
