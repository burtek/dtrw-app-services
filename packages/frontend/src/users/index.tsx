import { ReloadIcon } from '@radix-ui/react-icons';
import { Button, Flex, Heading } from '@radix-ui/themes';
import { memo, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

import { useDialogId } from '../hooks/useDialogId';
import { useMinDivWidth } from '../hooks/useMinDivWidth';
import { handleQueryError } from '../query-error-handler';
import { useSearchContext } from '../search/context';
import { userMatchesStringSearch } from '../search/helpers';

import { useGetUsersQuery } from './api';
import { UserFormDialog } from './form';
import { UserCard } from './user';


const Component = () => {
    const { data: users, refetch, isFetching, error } = useGetUsersQuery();

    useEffect(() => {
        if (error) {
            toast.error(`Users fetch failed: ${handleQueryError(error)}`);
        }
    }, [error]);

    const searchParams = useSearchContext();
    const filteredUsers = useMemo(() => Object.entries(users ?? {}).filter(([username, user]) => {
        if (searchParams.length === 0) {
            return true;
        }
        const result = searchParams.every(param => {
            switch (param.queryType) {
                case 'container_type':
                case 'project_slug':
                    return false;
                case 'username':
                    return username.toLowerCase().startsWith(param.query.toLowerCase());
                case 'usergroup':
                    return user.groups.some(group => group.toLowerCase().startsWith(param.query.toLowerCase()));
                case 'string':
                    return userMatchesStringSearch(user, username, param.query);
            }
            return true;
        });
        return result;
    }), [users, searchParams]);

    const [dialogId, openEditDialog, openNewDialog, closeDialog] = useDialogId<string>();

    return (
        <Flex
            gap="1"
            direction="column"
            overflowY="auto"
            height="100%"
            {...useMinDivWidth()}
            aria-labelledby="users-heading"
        >
            <Flex
                justify="between"
                align="center"
                px="2"
            >
                <Heading
                    as="h2"
                    id="users-heading"
                >
                    Users (
                    {Object.keys(users ?? {}).length}
                    )
                </Heading>
                <Button
                    variant="ghost"
                    onClick={refetch}
                    loading={isFetching}
                    mx="2"
                    size="4"
                    aria-label="Reload users list"
                >
                    <ReloadIcon />
                </Button>
            </Flex>
            {filteredUsers.map(([username, user]) => (
                <UserCard
                    key={username}
                    username={username}
                    user={user}
                    openEdit={openEditDialog}
                />
            ))}
            <Button
                size="1"
                variant="soft"
                style={{ width: '100%' }}
                onClick={openNewDialog}
                disabled={isFetching}
            >
                New User
            </Button>
            {dialogId !== false && (
                <UserFormDialog
                    id={dialogId}
                    close={closeDialog}
                />
            )}
        </Flex>
    );
};
Component.displayName = 'Users';

export const Users = memo(Component);
