import type { WritableDraft } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import { toast } from 'react-toastify';

import { baseQuery } from '../consts';
import type { CreateUser, GetUser, UpdateUser } from '../types';


const TYPE = 'USER';
export const usersApi = createApi({
    reducerPath: 'users',
    baseQuery,
    tagTypes: [TYPE],
    endpoints: builder => ({
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getUsers: builder.query<Record<string, GetUser>, void>({
            query: () => 'users',
            providesTags: result =>
                (result
                    ? [
                        ...Object.keys(result).map(username => ({ type: TYPE, username } as const)),
                        { type: TYPE, id: 'LIST' }
                    ]
                    : [{ type: TYPE, id: 'LIST' }]),
            onQueryStarted: async (_arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch {
                    toast.error(
                        'Users fetch failed',
                        { autoClose: false }
                    );
                }
            }
        }),
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        createUser: builder.mutation<void, CreateUser>({
            query: body => ({
                url: 'users',
                method: 'POST',
                body
            }),
            invalidatesTags: [{ type: TYPE, id: 'LIST' }],
            onQueryStarted: async (newUser, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;

                    dispatch(
                        usersApi.util.updateQueryData('getUsers', undefined, draft => {
                            const { username, password, ...user } = newUser;
                            draft[username] = user;
                        })
                    );

                    toast.success('User saved');
                } catch {
                    toast.error('User save failed');
                }
            }
        }),
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        updateUser: builder.mutation<void, { username: string; data: UpdateUser }>({
            query: ({ username, data }) => ({
                url: `users/${username}`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: (_, __, { username }) => [{ type: TYPE, id: 'LIST' }, { type: TYPE, username }],
            onQueryStarted: async ({ username, data }, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;

                    dispatch(
                        usersApi.util.updateQueryData('getUsers', undefined, draft => {
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (!draft[username]) {
                                return;
                            }
                            const user = draft[username] as WritableDraft<GetUser>;
                            if (data.disabled !== undefined) {
                                user.disabled = data.disabled;
                            }
                            if (data.displayname !== undefined) {
                                user.displayname = data.displayname;
                            }
                            if (data.email !== undefined) {
                                user.email = data.email;
                            }
                            if (data.groups !== undefined) {
                                user.groups = data.groups;
                            }
                            if (data.username !== undefined && username !== data.username) {
                                draft[data.username] = user;
                                delete draft[username];
                            }
                        })
                    );

                    toast.success('User saved');
                } catch {
                    toast.error('User save failed');
                }
            }
        }),
        deleteUser: builder.mutation<boolean, { username: string }>({
            query: ({ username }) => ({
                url: `users/${username}`,
                method: 'DELETE'
            }),
            invalidatesTags: (_, __, { username }) => [{ type: TYPE, id: 'LIST' }, { type: TYPE, username }],
            onQueryStarted: async ({ username }, { dispatch, queryFulfilled }) => {
                try {
                    if ((await queryFulfilled).data) {
                        dispatch(
                            usersApi.util.updateQueryData('getUsers', undefined, draft => {
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                if (!draft[username]) {
                                    return;
                                }
                                delete draft[username];
                            })
                        );
                    }

                    toast.success('User deleted');
                } catch {
                    toast.error('User could not be deleted');
                }
            }
        })
        // resetPassword: todo
    })
});

export const {
    getUsers: {
        useQuery: useGetUsersQuery,
        useQueryState: useGetUsersState
    },
    createUser: { useMutation: useCreateUserMutation },
    updateUser: { useMutation: useUpdateUserMutation },
    deleteUser: { useMutation: useDeleteUserMutation }
} = usersApi.endpoints;

export const selectUsers = createSelector(
    usersApi.endpoints.getUsers.select(),
    state => state.data
);
