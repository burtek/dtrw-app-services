import { Button, Dialog, Flex, Select } from '@radix-ui/themes';
import { memo, useCallback, useEffect, useMemo } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { SelectField } from '../components/form/fields/selectField';
import { TextField } from '../components/form/fields/textField';
import { withErrorBoundary } from '../components/withErrorBoundary';
import { useGetProjectsState } from '../projects/api';
import { handleQueryError } from '../query-error-handler';
import type { Container, Project, WithId } from '../types';

import { useGetContainersState, useGetContainerTypesQuery, useSaveContainerMutation } from './api-containers';
import { containerTypeByPrefix } from './containers-types';


const Component = ({ close, id, newContainerName = '' }: { close: () => void; id: number | null; newContainerName?: string }) => {
    const { data: projects = [] } = useGetProjectsState();
    const { data: containers = [] } = useGetContainersState();
    const { data: containerTypes, error } = useGetContainerTypesQuery();

    useEffect(() => {
        if (error) {
            toast.error(`Container types fetch failed: ${handleQueryError(error)}`);
        }
    }, [error]);

    const getDefaults = useCallback((name: string): Partial<Container> => {
        const parts = name.split('_');
        if (parts.length !== 2) {
            return {};
        }
        const project = projects.find(p => p.slug === parts[0]);
        const type = containerTypes?.find(t => containerTypeByPrefix(parts[1]) === t);

        return { projectId: project?.id, type };
    }, [containerTypes, projects]);

    const [saveContainer, { isLoading }] = useSaveContainerMutation();

    const { control, handleSubmit, setError, setValue } = useForm<Partial<Container>>({
        defaultValues: useMemo(
            () => containers.find(container => container.id === id) ?? { name: newContainerName, ...getDefaults(newContainerName) },
            []
        )
    });

    const onSubmit: SubmitHandler<Partial<Container>> = async data => {
        if (!data.projectId && data.type !== 'standalone') {
            setError('projectId', { message: 'Project is required for this container type' });
            return;
        } else if (data.projectId && data.type === 'standalone') {
            setError('type', { message: 'Standalone containers cannot be assigned to a project' });
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const response = await saveContainer({ id, ...data as Container });

        if (response.error) {
            toast.error(`Container save failed: ${handleQueryError(response.error)}`);
        } else {
            toast.success('Container saved');
            close();
        }
    };

    const handleClose = useCallback((newState: boolean) => {
        if (!newState) {
            close();
        }
    }, [close]);

    const renderProjectSelectItem = useCallback((project: WithId<Project>) => (
        <Select.Item
            key={project.id}
            value={project.id.toString()}
        >
            {`${project.name} (${project.slug})`}
        </Select.Item>
    ), []);

    const renderTypeSelectItem = useCallback((type: string) => (
        <Select.Item
            key={type}
            value={type}
        >
            {type}
        </Select.Item>
    ), []);

    const handleContainerNameChange = useCallback(
        (value: string) => {
            const { projectId, type } = getDefaults(value);

            if (projectId) {
                setValue('projectId', projectId);
            }
            if (type) {
                setValue('type', type);
            }
        },
        [getDefaults, setValue]
    );

    return (
        <Dialog.Root
            open
            onOpenChange={handleClose}
        >
            <Dialog.Content maxWidth="450px">
                <Dialog.Title>{id === null ? 'New container' : 'Edit container'}</Dialog.Title>

                <Dialog.Description mb="4">Enter container&apos;s data.</Dialog.Description>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Flex
                        direction="column"
                        gap="3"
                    >
                        <TextField
                            label="Name"
                            control={control}
                            name="name"
                            rules={{ required: true, minLength: 3 }}
                            onChange={handleContainerNameChange}
                        />

                        <SelectField
                            label="Project"
                            control={control}
                            name="projectId"
                            items={projects}
                            renderItem={renderProjectSelectItem}
                            placeholder="Choose project"
                            parseIntValue
                        />

                        <SelectField
                            label="Container type"
                            control={control}
                            name="type"
                            rules={{ required: true }}
                            items={containerTypes ?? []}
                            renderItem={renderTypeSelectItem}
                            placeholder="Choose project"
                            disabled={!containerTypes}
                        />

                        <Flex
                            gap="3"
                            justify="end"
                        >
                            <Button
                                loading={isLoading}
                                type="submit"
                                disabled={!containerTypes}
                            >
                                Save
                            </Button>
                            <Button
                                onClick={close}
                                type="button"
                                variant="soft"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </Flex>
                    </Flex>
                </form>

            </Dialog.Content>
        </Dialog.Root>
    );
};
Component.displayName = 'ContainerFormDialog';

export const ContainerFormDialog = memo(withErrorBoundary(Component));
