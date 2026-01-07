import { createSelector } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import { toast } from 'react-toastify';

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
                    toast.error(
                        'Projects fetch failed',
                        { autoClose: false }
                    );
                }
            }
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

                    toast.success('Project saved');
                } catch {
                    toast.error('Project save failed');
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
                        toast.success('Project removed');
                    }
                } catch {
                    toast.error('Project could not be removed');
                }
            }
        })
    })
});

export const {
    getProjects: {
        useQuery: useGetProjectsQuery,
        useQueryState: useGetProjectsState
    },
    saveProject: { useMutation: useSaveProjectMutation },
    deleteProject: { useMutation: useDeleteProjectMutation }
} = projectsApi.endpoints;

export const selectProjects = createSelector(
    projectsApi.endpoints.getProjects.select(),
    state => state.data
);
