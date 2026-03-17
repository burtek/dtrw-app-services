import { Button, Checkbox, Dialog, Flex, Text } from '@radix-ui/themes';
import { memo, useCallback, useMemo, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { FieldWrapper } from '../components/form/fields/_wrapper';
import { TextField } from '../components/form/fields/textField';
import { withErrorBoundary } from '../components/withErrorBoundary';
import { handleQueryError } from '../query-error-handler';
import { useAppSelector } from '../redux/store';

import { selectUsers, useUpdateUserMutation } from './api';


interface GroupFormData {
    groupName?: string;
}

const Component = ({ close, groupName }: Props) => {
    const users = useAppSelector(selectUsers);

    const existingGroupNames = useMemo(() => {
        const names = new Set<string>();

        Object.values(users ?? {}).forEach(user => {
            user.groups.forEach(g => names.add(g));
        });
        return names;
    }, [users]);

    const [selectedUsernames, setSelectedUsernames] = useState(() => {
        if (groupName === null) {
            return new Set<string>();
        }
        return new Set(
            Object.entries(users ?? {})
                .filter(([, user]) => user.groups.includes(groupName))
                .map(([username]) => username)
        );
    });

    const toggleUser = useCallback((username: string, checked: boolean) => {
        setSelectedUsernames(prev => {
            const next = new Set(prev);

            if (checked) {
                next.add(username);
            } else {
                next.delete(username);
            }
            return next;
        });
    }, []);

    const [updateUser, { isLoading }] = useUpdateUserMutation();

    const { control, handleSubmit } = useForm<GroupFormData>({
        defaultValues: useMemo(
            () => ({ groupName: groupName ?? '' }),
            // eslint-disable-next-line react-hooks/exhaustive-deps
            []
        )
    });

    const sortedUsers = useMemo(
        () => Object.entries(users ?? {}).sort(([a], [b]) => a.localeCompare(b)),
        [users]
    );

    const onSubmit: SubmitHandler<GroupFormData> = useCallback(async ({ groupName: newGroupName }) => {
        const trimmedName = (newGroupName ?? '').trim();
        const toUpdate: Array<{ username: string; groups: string[] }> = [];

        Object.entries(users ?? {}).forEach(([username, user]) => {
            const wasInGroup = groupName !== null && user.groups.includes(groupName);
            const isNowInGroup = selectedUsernames.has(username);

            // Skip if nothing changed
            if (wasInGroup === isNowInGroup && (groupName === trimmedName || !wasInGroup)) {
                return;
            }

            let newGroups = [...user.groups];

            // Remove old group name if user was in the group (handles both removal and rename)
            if (wasInGroup) {
                newGroups = newGroups.filter(g => g !== groupName);
            }

            // Add new group name if user should be in the group
            if (isNowInGroup) {
                newGroups = [...newGroups, trimmedName];
            }

            toUpdate.push({ username, groups: newGroups });
        });

        if (toUpdate.length > 0) {
            const responses = await Promise.all(
                toUpdate.map(({ username, groups }) => updateUser({ username, data: { groups } }))
            );

            for (const response of responses) {
                if (response.error) {
                    toast.error(`Group update failed: ${handleQueryError(response.error)}`);
                    return;
                }
            }
        }

        toast.success(groupName === null ? 'Group created' : 'Group updated');
        close();
    }, [close, groupName, selectedUsernames, updateUser, users]);

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
                <Dialog.Title>{groupName === null ? 'New group' : 'Edit group'}</Dialog.Title>

                <Dialog.Description mb="4">
                    {groupName === null
                        ? 'Enter a group name and select users to assign.'
                        : 'Edit the group name and manage user assignments.'}
                </Dialog.Description>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Flex
                        direction="column"
                        gap="3"
                    >
                        <TextField
                            label="Group Name"
                            control={control}
                            name="groupName"
                            rules={{
                                required: true,
                                validate: value => {
                                    const trimmed = value?.trim() ?? '';

                                    if (!trimmed) {
                                        return 'Group name is required';
                                    }
                                    if (trimmed !== groupName && existingGroupNames.has(trimmed)) {
                                        return 'Group name already exists';
                                    }
                                    return true;
                                }
                            }}
                        />

                        <FieldWrapper
                            label="Users"
                            as="div"
                        >
                            <Flex
                                direction="column"
                                gap="1"
                                style={{ maxHeight: '300px', overflowY: 'auto' }}
                            >
                                {sortedUsers.map(([username, user]) => (
                                    <label key={username}>
                                        <Flex
                                            gap="2"
                                            align="center"
                                        >
                                            <Checkbox
                                                checked={selectedUsernames.has(username)}
                                                onCheckedChange={checked => {
                                                    toggleUser(username, checked === true);
                                                }}
                                                variant="soft"
                                                disabled={isLoading}
                                                aria-label={`${user.displayname} ${username}`}
                                            />
                                            <Text size="2">
                                                {user.displayname}
                                                {' '}
                                                <Text
                                                    size="2"
                                                    color="gray"
                                                >
                                                    {`@${username}`}
                                                </Text>
                                            </Text>
                                        </Flex>
                                    </label>
                                ))}
                            </Flex>
                        </FieldWrapper>

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
Component.displayName = 'UserGroupFormDialog';

interface Props {
    close: () => void;
    groupName: string | null;
}

export const UserGroupFormDialog = memo(withErrorBoundary(Component));
