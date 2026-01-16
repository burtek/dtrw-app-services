import { Cross1Icon, EnvelopeClosedIcon, LockClosedIcon, Pencil2Icon } from '@radix-ui/react-icons';
import { Box, Button, Card, Flex, Heading, Text } from '@radix-ui/themes';
import classNames from 'classnames';
import { memo, useCallback } from 'react';
import { toast } from 'react-toastify';

import { ClickableBadge } from '../components/clickableBadge';
import { DeleteConfirmButton } from '../components/deleteConfirmButton';
import { handleQueryError } from '../query-error-handler';
import type { GetUser } from '../types';

import { useDeleteUserMutation, useResetUserPasswordMutation } from './api';
import styles from './users.module.scss';


const Component = ({ username, user, openEdit }: Props) => {
    const handleEdit = useCallback(
        () => {
            openEdit(username);
        },
        [openEdit, username]
    );

    const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();
    const handleDelete = useCallback(
        async () => {
            const response = await deleteUser({ username });

            if (response.error) {
                toast.error(`User deletion failed: ${handleQueryError(response.error)}`);
            } else {
                toast.success('User deleted');
            }
        },
        [deleteUser, username]
    );

    const [resetUserPassword, { isLoading: isResettingPassword }] = useResetUserPasswordMutation();
    const handleResetPassword = useCallback(
        async () => {
            const response = await resetUserPassword({ username });

            if (response.error) {
                toast.error(`Password reset failed: ${handleQueryError(response.error)}`);
            } else {
                toast.success('Password reset initiated');
            }
        },
        [resetUserPassword, username]
    );

    return (
        <Box style={{ opacity: isDeletingUser ? 0.4 : 1 }}>
            <Card className={classNames(styles.user, user.disabled && styles.disabled)}>
                <Flex
                    gap="2"
                    align="center"
                >
                    <Heading
                        as="h3"
                        size="3"
                    >
                        {user.displayname}
                    </Heading>
                    <ClickableBadge
                        type="username"
                        name={username}
                        disabled={user.disabled}
                    />
                </Flex>
                <Flex
                    gap="1"
                    align="center"
                >
                    {user.groups.map(group => (
                        <ClickableBadge
                            key={group}
                            type="usergroup"
                            group={group}
                            userDisabled={user.disabled}
                        />
                    ))}
                </Flex>
                {!!user.email && (
                    <Flex
                        gap="1"
                        align="center"
                    >
                        <EnvelopeClosedIcon />
                        <Text>{user.email}</Text>
                    </Flex>
                )}
                <Flex
                    m="2"
                    gap="2"
                    className={styles.actions}
                >
                    {user.email
                        ? (
                            <Button
                                onClick={handleResetPassword}
                                variant="ghost"
                                loading={isResettingPassword}
                                title="Reset Password"
                            >
                                <LockClosedIcon aria-label={`Reset password for ${username}`} />
                            </Button>
                        )
                        : null}
                    <Button
                        onClick={handleEdit}
                        variant="ghost"
                    >
                        <Pencil2Icon aria-label={`Edit ${username}`} />
                    </Button>
                    <DeleteConfirmButton
                        // eslint-disable-next-line @stylistic/jsx-one-expression-per-line, react/jsx-one-expression-per-line
                        header={<>Remove: <i>{username}</i></>}
                        description="Are you sure? This user will be removed and will need to be recreated"
                        onConfirm={handleDelete}
                    >
                        <Button
                            variant="ghost"
                            loading={isDeletingUser}
                        >
                            <Cross1Icon aria-label={`Delete ${username}`} />
                        </Button>
                    </DeleteConfirmButton>
                </Flex>
            </Card>
        </Box>
    );
};
Component.displayName = 'UserCard';

interface Props {
    username: string;
    user: GetUser;
    openEdit: (id: string) => void;
}

export const UserCard = memo(Component);
