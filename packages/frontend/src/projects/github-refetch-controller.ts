import { useEffect } from 'react';
import { toast } from 'react-toastify';

import { handleQueryError } from '../query-error-handler';

import { useGetWorkflowStatusesQuery } from './api-github';


export const GithubRefetchController = () => {
    const { error } = useGetWorkflowStatusesQuery(undefined, { pollingInterval: 5_000 });

    useEffect(() => {
        if (error) {
            toast.error(`Github status fetch failed: ${handleQueryError(error)}`);
        }
    }, [error]);

    return null;
};
GithubRefetchController.displayName = 'GithubRefetchController';
