import { Cross1Icon, Pencil2Icon } from '@radix-ui/react-icons';
import { Box, Button, Card, Flex, Heading } from '@radix-ui/themes';
import { memo, useCallback } from 'react';
import { toast } from 'react-toastify';

import { ClickableBadge } from '../components/clickableBadge';
import { DeleteConfirmButton } from '../components/deleteConfirmButton';
import { handleQueryError } from '../query-error-handler';
import { useSearchSetterContext } from '../search/context';
import type { GetUser } from '../types';

import { useBatchUpdateUsersGroupsMutation } from './api';
import styles from './users.module.scss';


const Component = ({ group, usernames, users, openEdit }: Props) => {
    const { add: addToSearch } = useSearchSetterContext();
    const [batchUpdateUsersGroups] = useBatchUpdateUsersGroupsMutation();

    const handleGroupClick = useCallback(() => {
        addToSearch({ queryType: 'usergroup', query: group });
    }, [addToSearch, group]);

    const handleEdit = useCallback(() => {
        openEdit(group);
    }, [openEdit, group]);

    const handleDelete = useCallback(async () => {
        const updates = usernames.map(username => ({
            username,
            groups: (users?.[username]?.groups ?? []).filter(g => g !== group)
        }));
        const response = await batchUpdateUsersGroups(updates);

        if (response.error) {
            toast.error(`Group deletion failed: ${handleQueryError(response.error)}`);
            return;
        }

        toast.success('Group deleted');
    }, [batchUpdateUsersGroups, usernames, users, group]);

    return (
        <Box>
            <Card className={styles.group}>
                <Flex
                    direction="column"
                    gap="1"
                >
                    <Flex
                        justify="between"
                        align="center"
                    >
                        <Heading
                            as="h3"
                            size="3"
                            style={{ cursor: 'pointer' }}
                            onClick={handleGroupClick}
                        >
                            {group}
                        </Heading>
                        <Flex
                            gap="1"
                            m="2"
                            className={styles.actions}
                        >
                            <Button
                                variant="ghost"
                                onClick={handleEdit}
                                aria-label={`Edit group ${group}`}
                            >
                                <Pencil2Icon />
                            </Button>
                            <DeleteConfirmButton
                                /* eslint-disable-next-line @stylistic/jsx-one-expression-per-line, react/jsx-one-expression-per-line */
                                header={<>Remove: <i>{group}</i></>}
                                description="Are you sure? This group will be removed from all users."
                                onConfirm={handleDelete}
                            >
                                <Button
                                    variant="ghost"
                                    aria-label={`Delete group ${group}`}
                                >
                                    <Cross1Icon />
                                </Button>
                            </DeleteConfirmButton>
                        </Flex>
                    </Flex>
                    <Flex
                        gap="1"
                        wrap="wrap"
                    >
                        {usernames.map(username => (
                            <ClickableBadge
                                key={username}
                                type="username"
                                name={username}
                                disabled={users?.[username]?.disabled}
                            />
                        ))}
                    </Flex>
                </Flex>
            </Card>
        </Box>
    );
};
Component.displayName = 'UserGroupCard';

interface Props {
    group: string;
    usernames: string[];
    users: Record<string, GetUser> | undefined;
    openEdit: (group: string) => void;
}

export const UserGroupCard = memo(Component);
