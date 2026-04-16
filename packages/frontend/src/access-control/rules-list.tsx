import { Button, Flex } from '@radix-ui/themes';
import { memo } from 'react';

import { useDialogId } from '../hooks/useDialogId';

import { useGetConfigQuery } from './api';
import { AccessControlRuleForm } from './form';
import { AccessControlRuleEntry } from './rule-entry';


const DEFAULT_ARRAY: never[] = [];

const Component = () => {
    const { data: rules = DEFAULT_ARRAY, isFetching } = useGetConfigQuery();
    const [dialogId, openEditDialog, openNewDialog, closeDialog] = useDialogId();

    return (
        <Flex
            direction="column"
            gap="1"
        >
            {rules.map(rule => (
                <AccessControlRuleEntry
                    key={rule.id}
                    rule={rule}
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
                New Rule
            </Button>
            {dialogId !== false && (
                <AccessControlRuleForm
                    id={dialogId}
                    close={closeDialog}
                />
            )}
        </Flex>
    );
};
Component.displayName = 'AccessControlRules';

export const AccessControlRules = memo(Component);
