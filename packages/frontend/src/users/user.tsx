import { Cross1Icon, EnvelopeClosedIcon, Pencil2Icon } from '@radix-ui/react-icons';
import { Badge, Box, Button, Card, Flex, Text } from '@radix-ui/themes';
import classNames from 'classnames';
import { memo, useCallback } from 'react';
import { toast } from 'react-toastify';

import { DeleteConfirmButton } from '../components/deleteConfirmButton';
import { Prefix } from '../consts';
import type { GetUser } from '../types';

import { useDeleteUserMutation } from './api';
import styles from './users.module.scss';


const Component = ({ username, user, openEdit }: Props) => {
    const handleEdit = useCallback(
        () => {
            openEdit(username);
        },
        [openEdit, username]
    );

    const [deleteUser, { isLoading }] = useDeleteUserMutation();
    const handleDelete = useCallback(
        async () => {
            const response = await deleteUser({ username });

            if (typeof response.data === 'boolean') {
                return;
            }
            if ('status' in response.error) {
                toast.error(String(response.error.data));
            } else {
                toast.error(String(response.error.message ?? response.error.name));
            }
        },
        [deleteUser, username]
    );

    return (
        <Box style={{ opacity: isLoading ? 0.4 : 1 }}>
            <Card className={classNames(styles.user, user.disabled && styles.disabled)}>
                <Flex
                    gap="2"
                    align="center"
                >
                    <Text
                        as="div"
                        weight="bold"
                    >
                        {user.displayname}
                    </Text>
                    <Badge
                        color={user.disabled ? 'gray' : 'orange'}
                        variant="surface"
                    >
                        {`${Prefix.USERNAME}${username}`}
                    </Badge>
                    {user.groups.length === 1 && (
                        <Badge
                            color={user.disabled ? 'gray' : 'gold'}
                            variant="surface"
                        >
                            {`${Prefix.USERGROUP}${user.groups[0]}`}
                        </Badge>
                    )}
                </Flex>
                {user.groups.length > 1
                    && (
                        <Flex
                            gap="1"
                            align="center"
                        >
                            {user.groups.map(group => (
                                <Badge
                                    key={group}
                                    color={user.disabled ? 'gray' : 'gold'}
                                    variant="surface"
                                >
                                    {`${Prefix.USERGROUP}${group}`}
                                </Badge>
                            ))}
                        </Flex>
                    )}
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
                    <Button
                        onClick={handleEdit}
                        variant="ghost"
                    >
                        <Pencil2Icon />
                    </Button>
                    <DeleteConfirmButton
                        // eslint-disable-next-line @stylistic/jsx-one-expression-per-line, react/jsx-one-expression-per-line
                        header={<>Remove: <i>{username}</i></>}
                        description="Are you sure? This user will be removed and will need to be recreated"
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
Component.displayName = 'UserCard';

interface Props {
    username: string;
    user: GetUser;
    openEdit: (id: string) => void;
}

export const UserCard = memo(Component);
