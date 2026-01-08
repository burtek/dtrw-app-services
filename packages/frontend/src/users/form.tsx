import { Button, Dialog, Flex } from '@radix-ui/themes';
import { memo, useCallback, useMemo } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { CheckboxField } from '../components/form/fields/checkboxField';
import { TagsField } from '../components/form/fields/tagsField';
import { TextField } from '../components/form/fields/textField';
import { withErrorBoundary } from '../components/withErrorBoundary';
import { useAppSelector } from '../redux/store';
import type { CreateUser } from '../types';

import { selectUsers, useCreateUserMutation, useUpdateUserMutation } from './api';


const Component = ({ close, id }: { close: () => void; id: string | null }) => {
    const user = useAppSelector(state => (id ? selectUsers(state)?.[id] : undefined));

    const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

    const { control, handleSubmit, setError } = useForm<Partial<CreateUser>>({
        defaultValues: useMemo(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            () => (user ? { ...user, username: id as string } : { groups: [], disabled: false }),
            []
        )
    });

    const onSubmit: SubmitHandler<Partial<CreateUser>> = async data => {
        const allGroups = data.groups?.filter(g => !!g) ?? [];
        let groupError = false;
        allGroups.forEach((group, index) => {
            if (allGroups.indexOf(group) !== index) {
                setError(`groups.${index}`, { message: 'Duplicate group' });
                groupError = true;
            }
        });
        if (groupError as boolean) { // required because TS thinks groupError is always false here
            return;
        }

        const response = id
            ? await updateUser({ username: id, data })
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            : await createUser(data as CreateUser);

        if (!response.error) {
            close();
        } else if ('status' in response.error) {
            let message: string;
            if (typeof response.error.data === 'object' && response.error.data !== null && 'message' in response.error.data && typeof response.error.data.message === 'string') {
                // eslint-disable-next-line @typescript-eslint/prefer-destructuring
                message = response.error.data.message;
            } else {
                message = JSON.stringify(response.error.data);
            }
            setError('username', { message });
        } else {
            setError('username', { message: String(response.error.message ?? response.error.name) });
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
                <Dialog.Title>{id === null ? 'New user' : 'Edit user'}</Dialog.Title>

                <Dialog.Description mb="4">Enter user&apos;s data.</Dialog.Description>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Flex
                        direction="column"
                        gap="3"
                    >
                        <TextField
                            label="Username"
                            control={control}
                            name="username"
                            rules={{ required: true, minLength: 3, pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/ }}
                        />

                        <TextField
                            label="Display Name"
                            control={control}
                            name="displayname"
                            rules={{ required: true, minLength: 3 }}
                        />

                        <TextField
                            label="Email"
                            control={control}
                            name="email"
                            type="email"
                        />

                        <TagsField
                            label="User groups"
                            control={control}
                            name="groups"
                            type="text"
                        />

                        <TextField
                            label="Password"
                            control={control}
                            name="password"
                            type="password"
                        />

                        <CheckboxField
                            label="Disabled"
                            control={control}
                            name="disabled"
                        />

                        <Flex
                            gap="3"
                            justify="end"
                        >
                            <Button
                                loading={isCreating || isUpdating}
                                type="submit"
                            >
                                Save
                            </Button>
                            <Button
                                onClick={close}
                                type="button"
                                variant="soft"
                                disabled={isCreating || isUpdating}
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
Component.displayName = 'UserFormDialog';

export const UserFormDialog = memo(withErrorBoundary(Component));
