import { Button, Flex } from '@radix-ui/themes';
import { memo, useCallback, useEffect, useState } from 'react';

import { useDialogId } from '../hooks/useDialogId';
import type { CaddyConfig, WithId } from '../types';

import { useGetAppConfigQuery, useReorderRoutesMutation } from './api';
import { RouteConfigForm } from './form';
import { RoutingEntry } from './routing-entry';


const DEFAULT_ARRAY: WithId<CaddyConfig>[] = [];
const Component = () => {
    const { data: config = DEFAULT_ARRAY, isFetching } = useGetAppConfigQuery();
    const [reorderRoutes, { isLoading: isReordering }] = useReorderRoutesMutation();

    const [dialogId, openEditDialog, openNewDialog, closeDialog] = useDialogId();

    const [configDraft, setConfigDraft] = useState(config);
    useEffect(() => {
        setConfigDraft(config);
    }, [config]);

    const handleMove = useCallback(
        (index: number, newIndex: number) => {
            setConfigDraft(old => {
                if (index === -1) {
                    return old;
                }
                const newArray = [...old];
                const [movedItem] = newArray.splice(index, 1);
                newArray.splice(newIndex, 0, movedItem);
                return newArray;
            });
        },
        []
    );
    const submitMove = useCallback(
        async () => {
            const currentData = await new Promise<WithId<CaddyConfig>[]>(
                resolve => {
                    setConfigDraft(old => {
                        resolve(old);
                        return old;
                    });
                }
            );

            await reorderRoutes({ ids: currentData.map(item => item.id) });
        },
        [reorderRoutes]
    );

    return (
        <Flex
            direction="column"
            gap="1"
        >
            {configDraft.map((entry, index) => (
                <RoutingEntry
                    key={entry.id}
                    entry={entry}
                    openEdit={openEditDialog}
                    onDrag={handleMove}
                    onDrop={submitMove}
                    index={index}
                />
            ))}
            <Button
                size="1"
                variant="soft"
                style={{ width: '100%' }}
                onClick={openNewDialog}
                disabled={isFetching || isReordering}
            >
                New Container
            </Button>
            {dialogId !== false && (
                <RouteConfigForm
                    id={dialogId}
                    close={closeDialog}
                />
            )}
        </Flex>
    );
};
Component.displayName = 'RoutingConfig';

export const RoutingConfig = memo(Component);
