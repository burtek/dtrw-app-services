import { createSelector } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { toast } from 'react-toastify';

import type { DockerContainer, WithId } from '../types';


const TYPE = 'DOCKER';
export const dockerApi = createApi({
    reducerPath: 'docker',
    baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
    tagTypes: [TYPE],
    endpoints: builder => ({
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getDockerContainers: builder.query<WithId<DockerContainer>[], void>({
            query: () => 'docker/containers',
            providesTags: result =>
                (result
                    ? [
                        ...result.map(({ id }) => ({ type: TYPE, id } as const)),
                        { type: TYPE, id: 'LIST' }
                    ]
                    : [{ type: TYPE, id: 'LIST' }]),
            onQueryStarted: async (_arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch {
                    toast.error('Docker containers fetch failed');
                }
            }
        })
    })
});

export const {
    getDockerContainers: {
        useQuery: useGetDockerContainersQuery,
        useQueryState: useGetDockerContainersState
    }
} = dockerApi.endpoints;

export const selectDockerContainers = createSelector(
    dockerApi.endpoints.getDockerContainers.select(),
    state => state.data
);
