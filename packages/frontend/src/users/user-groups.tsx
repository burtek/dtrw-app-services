import { ReloadIcon } from '@radix-ui/react-icons';
import { Box, Button, Card, Flex, Heading } from '@radix-ui/themes';
import { memo, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

import { ClickableBadge } from '../components/clickableBadge';
import { useMinDivWidth } from '../hooks/useMinDivWidth';
import { handleQueryError } from '../query-error-handler';
import { useSearchContext } from '../search/context';

import { useGetUsersQuery } from './api';


const Component = () => {
    const { data: users, refetch, isFetching, error } = useGetUsersQuery();

    useEffect(() => {
        if (error) {
            toast.error(`Users fetch failed: ${handleQueryError(error)}`);
        }
    }, [error]);

    const groups = useMemo(() => {
        const groupMap = new Map<string, string[]>();

        Object.entries(users ?? {}).forEach(([username, user]) => {
            user.groups.forEach(group => {
                const existing = groupMap.get(group);

                if (existing) {
                    existing.push(username);
                } else {
                    groupMap.set(group, [username]);
                }
            });
        });

        return Array.from(groupMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [users]);

    const searchParams = useSearchContext();
    const filteredGroups = useMemo(() => {
        if (searchParams.length === 0) {
            return groups;
        }
        return groups.filter(([group, usernames]) => searchParams.every(param => {
            switch (param.queryType) {
                case 'container_type':
                case 'project_slug':
                    return false;
                case 'usergroup':
                    return group.toLowerCase().startsWith(param.query.toLowerCase());
                case 'username':
                    return usernames.some(u => u.toLowerCase().startsWith(param.query.toLowerCase()));
                case 'string':
                    return group.toLowerCase().includes(param.query.toLowerCase())
                        || usernames.some(u => u.toLowerCase().includes(param.query.toLowerCase()));
            }
            return true;
        }));
    }, [groups, searchParams]);

    return (
        <Flex
            gap="1"
            direction="column"
            overflowY="auto"
            height="100%"
            {...useMinDivWidth()}
            aria-labelledby="user-groups-heading"
        >
            <Flex
                justify="between"
                align="center"
                px="2"
            >
                <Heading
                    as="h2"
                    id="user-groups-heading"
                >
                    User Groups (
                    {groups.length}
                    )
                </Heading>
                <Button
                    variant="ghost"
                    onClick={refetch}
                    loading={isFetching}
                    mx="2"
                    size="4"
                    aria-label="Reload user groups list"
                >
                    <ReloadIcon />
                </Button>
            </Flex>
            {filteredGroups.map(([group, usernames]) => (
                <Box key={group}>
                    <Card>
                        <Flex
                            direction="column"
                            gap="1"
                        >
                            <Heading
                                as="h3"
                                size="3"
                            >
                                {group}
                            </Heading>
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
            ))}
        </Flex>
    );
};
Component.displayName = 'UserGroups';

export const UserGroups = memo(Component);
