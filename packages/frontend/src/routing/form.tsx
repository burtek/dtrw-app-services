import { Button, Dialog, Flex, Select } from '@radix-ui/themes';
import { memo, useCallback, useMemo } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';

import { SelectField } from '../components/form/fields/selectField';
import { TextField } from '../components/form/fields/textField';
import { withErrorBoundary } from '../components/withErrorBoundary';
import { useGetContainersQuery } from '../containers/api-containers';
import { useGetProjectsQuery } from '../projects/api-projects';
import { handleQueryError } from '../query-error-handler';
import type { CaddyConfig } from '../types';

import { useGetAppConfigQuery, useSaveRouteMutation } from './api';


const Component = ({ close, id }: { close: () => void; id: number | null }) => {
    const { data: projects } = useGetProjectsQuery(undefined, {
        selectFromResult({ data = [] }): { data: SelectOption[] } {
            return {
                data: data.filter(p => !p.planned).map(p => ({
                    value: p.id.toString(),
                    label: `Project: ${p.name} (${p.slug})`
                }))
            };
        }
    });
    const { data: containers } = useGetContainersQuery(undefined, {
        selectFromResult({ data = [] }): { data: SelectOption[] } {
            return {
                data: data.filter(c => c.type === 'standalone').map(c => ({
                    value: c.id.toString(),
                    label: `Container: ${c.name}`
                }))
            };
        }
    });

    const { data: configs } = useGetAppConfigQuery();

    const [saveRoute, { isLoading }] = useSaveRouteMutation();

    const { control, handleSubmit, setValue, setError } = useForm<Partial<CaddyConfig>>({
        defaultValues: useMemo(
            () => {
                const found = configs?.find(item => item.id === id);
                if (found) {
                    return {
                        ...found,
                        projectId: found.projectId ?? undefined,
                        standaloneContainerId: found.standaloneContainerId ?? undefined,
                        standaloneContainerDomain: found.standaloneContainerDomain ?? undefined
                    };
                }
                const maxOrder = configs && configs.length > 0 ? Math.max(...configs.map(c => c.order)) : 0;
                return { order: maxOrder + 1 };
            },
            []
        )
    });

    const onSubmit: SubmitHandler<Partial<CaddyConfig>> = async data => {
        if (typeof data.projectId === 'number' && data.auth === 'provider') {
            setError('auth', { type: 'value', message: 'Project cannot be an authentication provider' });
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const response = await saveRoute({ id, ...data as CaddyConfig });

        if (response.error) {
            toast.error(`Route save failed: ${handleQueryError(response.error)}`);
        } else {
            toast.success('Route saved');
            close();
        }
    };

    const handleClose = useCallback((newState: boolean) => {
        if (!newState) {
            close();
        }
    }, [close]);

    const renderSelectItem = useCallback(({ value, label, disabled }: SelectOption) => (
        <Select.Item
            key={value}
            value={value}
            disabled={disabled}
        >
            {label}
        </Select.Item>
    ), []);

    const handleSelectProject = useCallback(
        () => {
            setValue('standaloneContainerId', undefined);
            setValue('standaloneContainerDomain', undefined);
        },
        [setValue]
    );

    const handleSelectContainer = useCallback(
        () => {
            setValue('projectId', undefined);
        },
        [setValue]
    );

    return (
        <Dialog.Root
            open
            onOpenChange={handleClose}
        >
            <Dialog.Content maxWidth="450px">
                <Dialog.Title>{id === null ? 'New routing entry' : 'Edit routing entry'}</Dialog.Title>

                <Dialog.Description mb="4">Enter routing configuration.</Dialog.Description>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Flex
                        direction="column"
                        gap="3"
                    >
                        <SelectField
                            label="Project"
                            control={control}
                            name="projectId"
                            items={projects}
                            renderItem={renderSelectItem}
                            placeholder="Choose project"
                            onChange={handleSelectProject}
                            rules={{ required: useWatch({ control, name: 'standaloneContainerId' }) === undefined }}
                            parseIntValue
                        />

                        <SelectField
                            label="Container"
                            control={control}
                            name="standaloneContainerId"
                            items={containers}
                            renderItem={renderSelectItem}
                            placeholder="Choose container"
                            onChange={handleSelectContainer}
                            rules={{ required: useWatch({ control, name: 'projectId' }) === undefined }}
                            parseIntValue
                        />

                        <TextField
                            label="Standalone container domain"
                            type="text"
                            control={control}
                            name="standaloneContainerDomain"
                            rules={{ required: useWatch({ control, name: 'standaloneContainerId' }) !== undefined }}
                            disabled={useWatch({ control, name: 'standaloneContainerId' }) === undefined}
                        />

                        <SelectField
                            label="Authentication"
                            control={control}
                            name="auth"
                            items={[
                                { value: 'enabled', label: 'Enabled' },
                                { value: 'disabled', label: 'Disabled' },
                                { value: 'own', label: 'Own' },
                                { value: 'provider', label: 'Provider', disabled: typeof useWatch({ control, name: 'projectId' }) === 'number' }
                            ]}
                            renderItem={renderSelectItem}
                            placeholder="Select auth mode"
                            rules={{ required: true }}
                        />

                        <Flex
                            gap="3"
                            justify="end"
                        >
                            <Button
                                loading={isLoading}
                                type="submit"
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
Component.displayName = 'RouteConfigForm';

/* eslint-disable react/no-unused-prop-types -- false positive */
interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
/* eslint-enable react/no-unused-prop-types */

export const RouteConfigForm = memo(withErrorBoundary(Component));
