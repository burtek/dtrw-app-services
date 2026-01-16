import { useEffect } from 'react';
import { toast } from 'react-toastify';

import { handleQueryError } from '../query-error-handler';

import { useGetDockerContainersQuery } from './api-docker';


export const DockerRefetchController = () => {
    const { error } = useGetDockerContainersQuery(undefined, { pollingInterval: 10_000 });

    useEffect(() => {
        if (error) {
            toast.error(`Docker containers status fetch failed: ${handleQueryError(error)}`);
        }
    }, [error]);

    return null;
};
DockerRefetchController.displayName = 'DockerRefetchController';
