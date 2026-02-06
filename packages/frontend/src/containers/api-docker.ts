import { createApi } from '@reduxjs/toolkit/query/react';
import { deepEqual } from 'fast-equals';

import { baseQuery } from '../consts';
import type { DockerContainer, WithId } from '../types';


const areArraysEqualOrderInsensitive = <T>(a: T[], b: T[]) => {
    if (a.length !== b.length) {
        return false;
    }
    const usedIndices = new Set<number>();
    for (const itemA of a) {
        let found = false;
        for (let i = 0; i < b.length; i++) {
            if (!usedIndices.has(i) && deepEqual(itemA, b[i])) {
                usedIndices.add(i);
                found = true;
                break;
            }
        }
        if (!found) {
            return false;
        }
    }
    return true;
};

const TYPE = 'DOCKER';
export const dockerApi = createApi({
    reducerPath: 'docker',
    baseQuery,
    tagTypes: [TYPE],
    endpoints: builder => ({
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        getDockerContainers: builder.query<WithId<DockerContainer, string>[], void>({
            query: () => 'docker/containers',
            providesTags: (result = []) => [
                ...result.map(({ id }) => ({ type: TYPE, id } as const)),
                { type: TYPE, id: 'LIST' }
            ]
        }),
        requestRestart: builder.mutation<boolean, { id: string }>({
            query: ({ id }) => ({
                url: `docker/restart/${id}`,
                method: 'POST'
            }),
            invalidatesTags: (_result, _, { id }) => [{ type: TYPE, id: 'LIST' }, { type: TYPE, id }]
        })
    })
});

export const {
    getDockerContainers: { useQuery: useGetDockerContainersQuery },
    requestRestart: { useMutation: useRequestRestartMutation }
} = dockerApi.endpoints;

export const selectDockerContainers$Stable = (() => {
    let lastGoodValue: WithId<DockerContainer, string>[] | undefined;

    const selector = dockerApi.endpoints.getDockerContainers.select();

    return (state: Parameters<typeof selector>[0]) => {
        const { data: currentValue } = selector(state);
        if (!currentValue) {
            return lastGoodValue;
        }
        if (!lastGoodValue) {
            lastGoodValue = currentValue;
            return lastGoodValue;
        }
        if (deepEqual(lastGoodValue, currentValue)) {
            return lastGoodValue;
        }
        let allSame = lastGoodValue.length === currentValue.length;
        // we could already return early if lengths differ,
        // but we want to keep references to at least some items
        // so that some components don't re-render unnecessarily
        const byId = new Map(lastGoodValue.map(c => [c.id, c]));
        const mapped = currentValue
            .map(item => {
                const existing = byId.get(item.id);
                if (existing) {
                    // check deep equality except for ports and mounts
                    // which can be in different order - checked separately below
                    const { ports: ePorts, mounts: eMounts, ...eRest } = existing;
                    const { ports: iPorts, mounts: iMounts, ...iRest } = item;

                    if (deepEqual(eRest, iRest)
                        && areArraysEqualOrderInsensitive(ePorts, iPorts)
                        && areArraysEqualOrderInsensitive(eMounts, iMounts)
                    ) {
                        return existing;
                    }
                }

                allSame = false;
                return item;
            });
        if (!allSame) {
            lastGoodValue = mapped;
        }
        return lastGoodValue;
    };
})();
