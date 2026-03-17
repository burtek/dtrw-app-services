import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from '../consts';
import type { AccessControl, AccessControlPolicy, AccessControlRule, AccessControlRuleWithRelations, MaybeWithId } from '../types';


/* eslint-disable @typescript-eslint/naming-convention */
const TYPES = {
    CONFIG: 'AC_CONFIG',
    ACTUAL: 'AC_ACTUAL',
    EXPECTED: 'AC_EXPECTED'
} as const;
/* eslint-enable @typescript-eslint/naming-convention */

export const accessControlApi = createApi({
    reducerPath: 'accessControl',
    baseQuery,
    tagTypes: Object.values(TYPES),
    endpoints: builder => ({
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getConfig: builder.query<AccessControlRuleWithRelations[], void>({
            query: () => 'access-control/config',
            providesTags: (result = []) => [
                ...result.map(r => ({ type: TYPES.CONFIG, id: r.id } as const)),
                { type: TYPES.CONFIG, id: 'LIST' }
            ]
        }),
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getActualConfig: builder.query<AccessControl, void>({
            query: () => 'access-control/actual',
            providesTags: [TYPES.ACTUAL]
        }),
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getExpectedConfig: builder.query<AccessControl, void>({
            query: () => 'access-control/expected',
            providesTags: [TYPES.EXPECTED]
        }),

        saveRule: builder.mutation<AccessControlRule, MaybeWithId<Omit<AccessControlRule, 'id'>>>({
            query: ({ id, ...body }) => ({
                url: typeof id === 'number' ? `access-control/config/${id}` : 'access-control/config',
                method: 'POST',
                body
            }),
            invalidatesTags: result => (result
                ? [{ type: TYPES.CONFIG, id: 'LIST' }, { type: TYPES.CONFIG, id: result.id }, TYPES.EXPECTED]
                : []),
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                try {
                    const { data: rule } = await queryFulfilled;

                    dispatch(
                        accessControlApi.util.updateQueryData('getConfig', undefined, draft => {
                            const index = draft.findIndex(r => r.id === rule.id);
                            if (index === -1) {
                                draft.push({ ...rule, project: null, container: null });
                            } else {
                                const existing = draft[index] as AccessControlRuleWithRelations;
                                draft.splice(index, 1, { ...existing, ...rule });
                            }
                        })
                    );
                } catch {
                }
            },
            extraOptions: { maxRetries: 0 }
        }),

        deleteRule: builder.mutation<boolean, { id: number }>({
            query: ({ id }) => ({
                url: `access-control/config/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: (result, _, { id }) => (result
                ? [{ type: TYPES.CONFIG, id: 'LIST' }, { type: TYPES.CONFIG, id }, TYPES.EXPECTED]
                : []),
            onQueryStarted: async ({ id }, { dispatch, queryFulfilled }) => {
                try {
                    if ((await queryFulfilled).data) {
                        dispatch(
                            accessControlApi.util.updateQueryData('getConfig', undefined, draft => {
                                const index = draft.findIndex(r => r.id === id);
                                if (index >= 0) {
                                    draft.splice(index, 1);
                                }
                            })
                        );
                    }
                } catch {
                }
            }
        }),

        reorderRules: builder.mutation<boolean, { ids: number[] }>({
            query: ({ ids }) => ({
                url: 'access-control/config/reorder',
                method: 'POST',
                body: { ids }
            }),
            invalidatesTags: (result, _, { ids }) => (result
                ? [{ type: TYPES.CONFIG, id: 'LIST' }, ...ids.map(id => ({ type: TYPES.CONFIG, id })), TYPES.EXPECTED]
                : []),
            onQueryStarted: async ({ ids }, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;

                    dispatch(
                        accessControlApi.util.updateQueryData(
                            'getConfig',
                            undefined,
                            draft => ids.map(id => draft.find(r => r.id === id)).filter(r => !!r)
                        )
                    );
                } catch {
                }
            },
            extraOptions: { maxRetries: 0 }
        }),

        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        saveDefaultPolicy: builder.mutation<void, { policy: AccessControlPolicy }>({
            query: ({ policy }) => ({
                url: 'access-control/default_policy',
                method: 'POST',
                body: { policy }
            }),
            invalidatesTags: [TYPES.ACTUAL, TYPES.EXPECTED]
        }),

        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        applyConfig: builder.mutation<boolean, void>({
            query: () => ({
                url: 'access-control/trigger/apply',
                method: 'POST'
            }),
            invalidatesTags: result => (result ? [TYPES.ACTUAL] : [])
        }),

        forceReloadAll: builder.mutation<null, unknown>({
            queryFn: () => ({ data: null }),
            invalidatesTags: [TYPES.CONFIG, TYPES.ACTUAL, TYPES.EXPECTED]
        })
    })
});

export const {
    getConfig: { useQuery: useGetConfigQuery },
    getActualConfig: { useQuery: useGetActualConfigQuery },
    getExpectedConfig: { useQuery: useGetExpectedConfigQuery },
    saveRule: { useMutation: useSaveRuleMutation },
    deleteRule: { useMutation: useDeleteRuleMutation },
    reorderRules: { useMutation: useReorderRulesMutation },
    saveDefaultPolicy: { useMutation: useSaveDefaultPolicyMutation },
    applyConfig: { useMutation: useApplyConfigMutation },
    forceReloadAll: { useMutation: useForceReloadAllTrigger }
} = accessControlApi.endpoints;
