import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from '../consts';
import type { CaddyConfig, MaybeWithId, WithId } from '../types';


/* eslint-disable @typescript-eslint/naming-convention */
const TYPES = {
    ROUTES: 'CADDY_ROUTES',
    ROUTES_AS_CADDYFILE: 'CADDY_ROUTES_AS_CADDYFILE',
    CADDYFILE: 'CADDY_CADDYFILE',
    CADDYFILE_AS_API: 'CADDY_CADDYFILE_AS_API',
    CADDYAPI: 'CADDY_API'
} as const;
/* eslint-enable @typescript-eslint/naming-convention */

export const caddyApi = createApi({
    reducerPath: 'caddy',
    baseQuery,
    tagTypes: Object.values(TYPES),
    endpoints: builder => ({
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getAppConfig: builder.query<WithId<CaddyConfig>[], void>({
            query: () => 'caddy/routes/config?as=config',
            providesTags: (result = []) => [
                ...result.map(r => ({ type: TYPES.ROUTES, id: r.id } as const)),
                { type: TYPES.ROUTES, id: 'LIST' }
            ]
        }),
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getAppConfigConverted: builder.query<string, void>({
            query: () => ({
                url: 'caddy/routes/config?as=caddyfile',
                responseHandler: 'text'
            }),
            providesTags: [TYPES.ROUTES_AS_CADDYFILE]
        }),
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getCaddyfile: builder.query<string, void>({
            query: () => ({
                url: 'caddy/routes/caddyfile?as=caddyfile',
                responseHandler: 'text'
            }),
            providesTags: [TYPES.CADDYFILE]
        }),
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getCaddyfileAdapted: builder.query<CaddyAPIJSON, void>({
            query: () => 'caddy/routes/caddyfile?as=api',
            providesTags: [TYPES.CADDYFILE_AS_API]
        }),
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getCaddyAPI: builder.query<CaddyAPIJSON, void>({
            query: () => 'caddy/routes/api',
            providesTags: [TYPES.CADDYAPI]
        }),

        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        writeCaddyfile: builder.mutation<boolean, void>({
            query: () => ({
                url: 'caddy/trigger/write-caddyfile',
                method: 'POST'
            }),
            invalidatesTags: result => (result ? [TYPES.CADDYFILE, TYPES.CADDYFILE_AS_API] : [])
        }),
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        applyCaddyfile: builder.mutation<boolean, void>({
            query: () => ({
                url: 'caddy/trigger/apply-caddyfile',
                method: 'POST'
            }),
            invalidatesTags: result => (result ? [TYPES.CADDYAPI] : [])
        }),

        saveRoute: builder.mutation<WithId<CaddyConfig>, MaybeWithId<CaddyConfig>>({
            query: ({ id, ...body }) => ({
                url: typeof id === 'number'
                    ? `caddy/route/${id}`
                    : 'caddy/route',
                method: 'POST',
                body
            }),
            invalidatesTags: result => (result ? [{ type: TYPES.ROUTES, id: 'LIST' }, { type: TYPES.ROUTES, id: result.id }, TYPES.ROUTES_AS_CADDYFILE] : []),
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                try {
                    const { data: route } = await queryFulfilled;

                    dispatch(
                        caddyApi.util.updateQueryData('getAppConfig', undefined, draft => {
                            const index = draft.findIndex(l => l.id === route.id);
                            if (index === -1) {
                                draft.push(route);
                            } else {
                                draft.splice(index, 1, route);
                            }
                        })
                    );
                } catch {
                }
            },
            extraOptions: { maxRetries: 0 }
        }),
        reorderRoutes: builder.mutation<boolean, { ids: number[] }>({
            query: ({ ids }) => ({
                url: 'caddy/routes/config/reorder',
                method: 'POST',
                body: { ids }
            }),
            invalidatesTags: (result, _, { ids }) => (result ? [{ type: TYPES.ROUTES, id: 'LIST' }, ...ids.map(id => ({ type: TYPES.ROUTES, id })), TYPES.ROUTES_AS_CADDYFILE] : []),
            onQueryStarted: async ({ ids }, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;

                    dispatch(
                        caddyApi.util.updateQueryData(
                            'getAppConfig',
                            undefined,
                            draft => ids.map(id => draft.find(r => r.id === id)).filter(r => !!r)
                        )
                    );
                } catch {
                }
            },
            extraOptions: { maxRetries: 0 }
        }),
        deleteProject: builder.mutation<boolean, WithId<unknown>>({
            query: ({ id }) => ({
                url: `caddy/route/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: (result, _, { id }) => (result ? [{ type: TYPES.ROUTES, id: 'LIST' }, { type: TYPES.ROUTES, id }, TYPES.ROUTES_AS_CADDYFILE] : []),
            onQueryStarted: async ({ id }, { dispatch, queryFulfilled }) => {
                try {
                    const { data: deleted } = await queryFulfilled;

                    if (deleted) {
                        dispatch(
                            caddyApi.util.updateQueryData('getAppConfig', undefined, draft => {
                                const index = draft.findIndex(l => l.id === id);
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

        forceReloadAll: builder.mutation<null, unknown>({
            queryFn: () => ({ data: null }),
            invalidatesTags: [TYPES.ROUTES, TYPES.ROUTES_AS_CADDYFILE, TYPES.CADDYFILE, TYPES.CADDYFILE_AS_API, TYPES.CADDYAPI]
        })
    })
});

export interface CaddyAPIJSON {
    apps: Record<string, unknown>;
}

export const {
    getAppConfig: { useQuery: useGetAppConfigQuery },
    getAppConfigConverted: { useQuery: useGetAppConfigConvertedQuery },
    getCaddyfile: { useQuery: useGetCaddyfileQuery },
    getCaddyfileAdapted: { useQuery: useGetCaddyfileAdaptedQuery },
    getCaddyAPI: { useQuery: useGetCaddyAPIQuery },
    writeCaddyfile: { useMutation: useWriteCaddyfileMutation },
    applyCaddyfile: { useMutation: useApplyCaddyfileMutation },
    saveRoute: { useMutation: useSaveRouteMutation },
    reorderRoutes: { useMutation: useReorderRoutesMutation },
    deleteProject: { useMutation: useDeleteProjectMutation },
    forceReloadAll: { useMutation: useForceReloadAllTrigger }
} = caddyApi.endpoints;
