import { createSelector } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from '../consts';
import type { MaybeWithId, Project, WithId } from '../types';


const TYPE = 'PROJECT';
export const projectsApi = createApi({
    reducerPath: 'projects',
    baseQuery,
    tagTypes: [TYPE],
    endpoints: builder => ({
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getProjects: builder.query<WithId<Project>[], void>({
            query: () => 'projects',
            providesTags: (result = []) => [
                ...result.map(({ id }) => ({ type: TYPE, id } as const)),
                { type: TYPE, id: 'LIST' }
            ]
        }),
        saveProject: builder.mutation<WithId<Project>, MaybeWithId<Project>>({
            query: ({ id, ...body }) => ({
                url: typeof id === 'number'
                    ? `projects/${id}`
                    : 'projects',
                method: 'POST',
                body
            }),
            invalidatesTags: result => (result ? [{ type: TYPE, id: 'LIST' }, { type: TYPE, id: result.id }] : []),
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                try {
                    const { data: project } = await queryFulfilled;

                    dispatch(
                        projectsApi.util.updateQueryData('getProjects', undefined, draft => {
                            const index = draft.findIndex(l => l.id === project.id);
                            if (index === -1) {
                                draft.push(project);
                            } else {
                                draft.splice(index, 1, project);
                            }
                        })
                    );
                } catch {
                }
            },
            extraOptions: { maxRetries: 0 }
        }),
        deleteProject: builder.mutation<boolean, WithId<unknown>>({
            query: ({ id }) => ({
                url: `projects/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: (result, _, { id }) => (result ? [{ type: TYPE, id: 'LIST' }, { type: TYPE, id }] : []),
            onQueryStarted: async ({ id }, { dispatch, queryFulfilled }) => {
                try {
                    const { data: deleted } = await queryFulfilled;

                    if (deleted) {
                        dispatch(
                            projectsApi.util.updateQueryData('getProjects', undefined, draft => {
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
    getProjects: { useQuery: useGetProjectsQuery },
    saveProject: { useMutation: useSaveProjectMutation },
    deleteProject: { useMutation: useDeleteProjectMutation }
} = projectsApi.endpoints;

export const selectProjects = createSelector(
    projectsApi.endpoints.getProjects.select(),
    state => state.data
);
