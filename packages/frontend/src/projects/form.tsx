import { Button, Dialog, Flex } from '@radix-ui/themes';
import { memo, useCallback, useMemo } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { CheckboxField } from '../components/form/fields/checkboxField';
import { ListField } from '../components/form/fields/listField';
import { TextField } from '../components/form/fields/textField';
import { withErrorBoundary } from '../components/withErrorBoundary';
import { handleQueryError } from '../query-error-handler';
import type { Project } from '../types';

import { useGetProjectsState, useSaveProjectMutation } from './api-projects';


const Component = ({ close, id }: { close: () => void; id: number | null }) => {
    const { data: projects = [] } = useGetProjectsState();

    const [saveProject, { isLoading }] = useSaveProjectMutation();

    const { control, handleSubmit } = useForm<Partial<Project>>({
        defaultValues: useMemo(
            () => projects.find(project => project.id === id) ?? { additionalUrls: [], planned: false },
            []
        )
    });

    const onSubmit: SubmitHandler<Partial<Project>> = async data => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const response = await saveProject({ id, ...data as Project });

        if (response.error) {
            toast.error(`Project save failed: ${handleQueryError(response.error)}`);
        } else {
            toast.success('Project saved');
            close();
        }
    };

    const handleClose = useCallback((newState: boolean) => {
        if (!newState) {
            close();
        }
    }, [close]);

    return (
        <Dialog.Root
            open
            onOpenChange={handleClose}
        >
            <Dialog.Content maxWidth="450px">
                <Dialog.Title>{id === null ? 'New project' : 'Edit project'}</Dialog.Title>

                <Dialog.Description mb="4">Enter project&apos;s data.</Dialog.Description>

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
                        />

                        <TextField
                            label="Slug"
                            control={control}
                            name="slug"
                            rules={{ required: true, minLength: 3 }}
                        />

                        <TextField
                            label="Github URL"
                            control={control}
                            name="github"
                            rules={{ required: true }}
                        />

                        <TextField
                            label="Jira URL"
                            control={control}
                            name="jira"
                        />

                        <TextField
                            label="Project URL"
                            control={control}
                            name="url"
                            rules={{ required: true }}
                        />

                        <ListField
                            label="Additional urls"
                            control={control}
                            name="additionalUrls"
                            type="text"
                        />

                        <CheckboxField
                            label="Planned"
                            control={control}
                            name="planned"
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
Component.displayName = 'ProjectFormDialog';

export const ProjectFormDialog = memo(withErrorBoundary(Component));
