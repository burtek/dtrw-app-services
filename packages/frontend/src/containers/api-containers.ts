import { createSelector } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from '../consts';
import type { MaybeWithId, Container, WithId } from '../types';


const TYPE = 'CONTAINER';
export const containersApi = createApi({
    reducerPath: 'containers',
    baseQuery,
    tagTypes: [TYPE],
    endpoints: builder => ({
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getContainers: builder.query<WithId<Container>[], void>({
            query: () => 'containers',
            providesTags: (result = []) => [
                ...result.map(({ id }) => ({ type: TYPE, id } as const)),
                { type: TYPE, id: 'LIST' }
            ]
        }),
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getContainerTypes: builder.query<Container['type'][], void>({ query: () => 'containers/types' }),
        saveContainer: builder.mutation<WithId<Container>, MaybeWithId<Container>>({
            query: ({ id, ...body }) => ({
                url: typeof id === 'number'
                    ? `containers/${id}`
                    : 'containers',
                method: 'POST',
                body
            }),
            invalidatesTags: result => (result ? [{ type: TYPE, id: 'LIST' }, { type: TYPE, id: result.id }] : []),
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                try {
                    const { data: container } = await queryFulfilled;

                    dispatch(
                        containersApi.util.updateQueryData('getContainers', undefined, draft => {
                            const index = draft.findIndex(l => l.id === container.id);
                            if (index === -1) {
                                draft.push(container);
                            } else {
                                draft.splice(index, 1, container);
                            }
                        })
                    );
                } catch {
                }
            },
            extraOptions: { maxRetries: 0 }
        }),
        deleteContainer: builder.mutation<boolean, WithId<unknown>>({
            query: ({ id }) => ({
                url: `containers/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: (result, _, { id }) => (result ? [{ type: TYPE, id: 'LIST' }, { type: TYPE, id }] : []),
            onQueryStarted: async ({ id }, { dispatch, queryFulfilled }) => {
                try {
                    const { data: deleted } = await queryFulfilled;

                    if (deleted) {
                        dispatch(
                            containersApi.util.updateQueryData('getContainers', undefined, draft => {
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
        })
    })
});

export const {
    getContainers: { useQuery: useGetContainersQuery },
    getContainerTypes: { useQuery: useGetContainerTypesQuery },
    saveContainer: { useMutation: useSaveContainerMutation },
    deleteContainer: { useMutation: useDeleteContainerMutation }
} = containersApi.endpoints;

export const selectContainers = createSelector(
    containersApi.endpoints.getContainers.select(),
    state => state.data
);
