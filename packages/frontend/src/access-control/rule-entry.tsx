import { Cross1Icon, Pencil2Icon } from '@radix-ui/react-icons';
import { Badge, Box, Button, Card, Flex } from '@radix-ui/themes';
import { memo, useCallback } from 'react';

import { DeleteConfirmButton } from '../components/deleteConfirmButton';
import { useGetContainersQuery } from '../containers/api-containers';
import { useGetProjectsQuery } from '../projects/api-projects';
import type { AccessControlRuleWithRelations } from '../types';

import styles from './access-control.module.scss';
import { useDeleteRuleMutation } from './api';


/* eslint-disable @typescript-eslint/naming-convention */
const POLICY_LABELS: Record<string, string> = {
    one_factor: 'One Factor',
    two_factor: 'Two Factor',
    bypass: 'Public',
    deny: 'Deny'
};

const POLICY_COLORS: Record<string, 'green' | 'blue' | 'gray' | 'red'> = {
    one_factor: 'green',
    two_factor: 'blue',
    bypass: 'gray',
    deny: 'red'
};
/* eslint-enable @typescript-eslint/naming-convention */

const Component = ({ rule, openEdit }: Props) => {
    const { project } = useGetProjectsQuery(undefined, { //
        selectFromResult: ({ data }) => ({ project: data?.find(p => p.id === rule.projectId) })
    });

    const { container } = useGetContainersQuery(undefined, { //
        selectFromResult: ({ data }) => ({ container: data?.find(c => c.id === rule.standaloneContainerId) })
    });

    const [deleteRule, { isLoading: isDeleting }] = useDeleteRuleMutation();

    const handleEdit = useCallback(() => {
        openEdit(rule.id);
    }, [openEdit, rule.id]);

    const handleDelete = useCallback(async () => {
        await deleteRule({ id: rule.id });
    }, [deleteRule, rule.id]);

    const policyColor = POLICY_COLORS[rule.policy] ?? 'gray';
    const policyLabel = POLICY_LABELS[rule.policy] ?? rule.policy;

    const displayName = project?.name ?? container?.name ?? '— Global Rule —';
    const subjects = rule.subject?.flat() ?? [];

    const typeLabel = project ? 'project' : container ? 'container' : 'global';
    const typeColor: 'blue' | 'orange' | 'gray' = project ? 'blue' : container ? 'orange' : 'gray';

    return (
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        <Box style={{ opacity: isDeleting ? 0.4 : 1 }}>
            <Card className={styles.ruleCard}>
                <Flex
                    gap="2"
                    align="center"
                    wrap="wrap"
                    style={{ whiteSpace: 'nowrap' }}
                >
                    <span>{`${rule.order}: `}</span>
                    <Badge color={typeColor}>
                        {typeLabel}
                    </Badge>
                    <span>{displayName}</span>
                    <Badge color={policyColor}>
                        {policyLabel}
                    </Badge>
                    {/* eslint-disable-next-line @typescript-eslint/no-magic-numbers */}
                    {subjects.length > 0 && subjects.map(s => (
                        <Badge
                            key={s}
                            variant="outline"
                        >
                            {s}
                        </Badge>
                    ))}
                    {/* eslint-disable-next-line @typescript-eslint/no-magic-numbers */}
                    {subjects.length === 0 && (
                        <Badge
                            color="gray"
                            variant="outline"
                        >
                            all users
                        </Badge>
                    )}
                    <Flex
                        ml="auto"
                        gap="2"
                        className={styles.actions}
                    >
                        <Button
                            onClick={handleEdit}
                            variant="ghost"
                            size="1"
                        >
                            <Pencil2Icon />
                        </Button>
                        <DeleteConfirmButton
                            // eslint-disable-next-line @stylistic/jsx-one-expression-per-line, react/jsx-one-expression-per-line
                            header={<>Remove access control rule for: <i>{displayName}</i></>}
                            description="Are you sure? This access control rule will be removed."
                            onConfirm={handleDelete}
                        >
                            <Button
                                variant="ghost"
                                size="1"
                            >
                                <Cross1Icon />
                            </Button>
                        </DeleteConfirmButton>
                    </Flex>
                </Flex>
            </Card>
        </Box>
    );
};
Component.displayName = 'AccessControlRuleEntry';

interface Props {
    rule: AccessControlRuleWithRelations;
    openEdit: (id: number) => void;
}

export const AccessControlRuleEntry = memo(Component);
