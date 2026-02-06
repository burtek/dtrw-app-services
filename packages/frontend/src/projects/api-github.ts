import { createSelector } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from '../consts';
import type { ProjecktWorkflows } from '../types';


const TYPE = 'GITHUB';
export const githubApi = createApi({
    reducerPath: 'github',
    baseQuery,
    tagTypes: [TYPE],
    endpoints: builder => ({
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getWorkflowStatuses: builder.query<ProjecktWorkflows[], void>({
            query: () => 'github/workflow-runs',
            providesTags: (result = []) => [
                ...result.map(({ projectId }) => ({ type: TYPE, id: projectId } as const)),
                { type: TYPE, id: 'LIST' }
            ]
        })
    })
});

export const { getWorkflowStatuses: { useQuery: useGetWorkflowStatusesQuery } } = githubApi.endpoints;

export const selectGithubWorkflowStatuses = createSelector(
    githubApi.endpoints.getWorkflowStatuses.select(),
    state => state.data
);
