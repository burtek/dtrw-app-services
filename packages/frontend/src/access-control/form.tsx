import { Button, Dialog, Flex, Select } from '@radix-ui/themes';
import { memo, useCallback, useMemo } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';

import { SelectField } from '../components/form/fields/selectField';
import { TagsField } from '../components/form/fields/tagsField';
import { withErrorBoundary } from '../components/withErrorBoundary';
import { useGetContainersQuery } from '../containers/api-containers';
import { useGetProjectsQuery } from '../projects/api-projects';
import { handleQueryError } from '../query-error-handler';
import type { AccessControlPolicy } from '../types';

import { useGetConfigQuery, useSaveRuleMutation } from './api';


interface FormValues {
    projectId?: number | null;
    standaloneContainerId?: number | null;
    order?: number;
    policy?: AccessControlPolicy;
    subjects?: string[];
    resources?: string[];
}

const POLICY_OPTIONS: Array<{ value: AccessControlPolicy; label: string }> = [
    { value: 'one_factor', label: 'One Factor (Username + Password)' },
    { value: 'two_factor', label: 'Two Factor (2FA)' },
    { value: 'bypass', label: 'Bypass (Public access)' },
    { value: 'deny', label: 'Deny' }
];

const Component = ({ close, id }: { close: () => void; id: number | null }) => {
    const { data: projects } = useGetProjectsQuery(undefined, {
        selectFromResult({ data = [] }): { data: Array<{ value: string; label: string }> } {
            return {
                data: data.filter(p => !p.planned).map(p => ({
                    value: p.id.toString(),
                    label: `Project: ${p.name} (${p.slug})`
                }))
            };
        }
    });

    const { data: containers } = useGetContainersQuery(undefined, {
        selectFromResult({ data = [] }): { data: Array<{ value: string; label: string }> } {
            return {
                data: data.filter(c => c.type === 'standalone').map(c => ({
                    value: c.id.toString(),
                    label: `Container: ${c.name}`
                }))
            };
        }
    });

    const { data: configs } = useGetConfigQuery();
    const [saveRule, { isLoading }] = useSaveRuleMutation();

    const { control, handleSubmit, setValue } = useForm<FormValues>({
        defaultValues: useMemo(
            () => {
                const found = configs?.find(item => item.id === id);
                if (found) {
                    return {
                        projectId: found.projectId ?? undefined,
                        standaloneContainerId: found.standaloneContainerId ?? undefined,
                        order: found.order,
                        policy: found.policy,
                        subjects: found.subject?.flat() ?? [],
                        resources: found.resources ?? []
                    };
                }
                const maxOrder = configs && configs.length > 0 ? Math.max(...configs.map(c => c.order)) : 0;
                return {
                    order: maxOrder + 1,
                    policy: 'one_factor',
                    subjects: [],
                    resources: []
                };
            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            []
        )
    });

    const onSubmit: SubmitHandler<FormValues> = async data => {
        const subject = data.subjects && data.subjects.length > 0 ? data.subjects.map(s => [s]) : null;
        const resources = data.resources && data.resources.length > 0 ? data.resources : null;

        if (data.order === undefined || data.policy === undefined) {
            toast.error('Order and Policy are required');
            return;
        }

        const response = await saveRule({
            id,
            projectId: data.projectId ?? null,
            standaloneContainerId: data.standaloneContainerId ?? null,
            order: data.order,
            policy: data.policy,
            subject,
            resources
        });

        if (response.error) {
            toast.error(`Rule save failed: ${handleQueryError(response.error)}`);
        } else {
            toast.success('Rule saved');
            close();
        }
    };

    const handleClose = useCallback((newState: boolean) => {
        if (!newState) {
            close();
        }
    }, [close]);

    const renderSelectItem = useCallback((item: SelectOption) => (
        <Select.Item
            key={item.value}
            value={item.value}
        >
            {item.label}
        </Select.Item>
    ), []);

    const handleSelectProject = useCallback(
        () => {
            setValue('standaloneContainerId', undefined);
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
            <Dialog.Content maxWidth="500px">
                <Dialog.Title>{id === null ? 'New access control rule' : 'Edit access control rule'}</Dialog.Title>

                <Dialog.Description mb="4">Configure who can access this resource.</Dialog.Description>

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
                            label="Standalone Container"
                            control={control}
                            name="standaloneContainerId"
                            items={containers}
                            renderItem={renderSelectItem}
                            placeholder="Choose container"
                            onChange={handleSelectContainer}
                            rules={{ required: useWatch({ control, name: 'projectId' }) === undefined }}
                            parseIntValue
                        />

                        <SelectField
                            label="Policy"
                            control={control}
                            name="policy"
                            items={POLICY_OPTIONS}
                            renderItem={renderSelectItem}
                            placeholder="Select policy"
                            rules={{ required: true }}
                        />

                        <TagsField
                            label="Subjects (user:name or group:name, leave empty to allow all)"
                            control={control}
                            name="subjects"
                        />

                        <TagsField
                            label="Resources (URL patterns, leave empty to match all)"
                            control={control}
                            name="resources"
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
Component.displayName = 'AccessControlRuleForm';

interface SelectOption {
    value: string;
    label: string;
}

export const AccessControlRuleForm = memo(withErrorBoundary(Component));
