import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';


function handleStatusCode(status: number, details?: string): string {
    const withDetails = (error: string) => (details ? `${error}: ${details}` : error);

    switch (status) {
        case 401:
            return withDetails('Unauthorized');
        case 403:
            return withDetails('Forbidden');
        case 404:
            return withDetails('Not Found');
        case 500:
            return withDetails('Internal Server Error');
        default:
            return withDetails(`Error ${status}`);
    }
}

export const handleQueryError = (responseError: FetchBaseQueryError | SerializedError): string => {
    if (!('status' in responseError)) {
        return String(responseError.message ?? responseError.name);
    }

    if (typeof responseError.status === 'number') {
        let details: string;

        if (typeof responseError.data === 'object'
            && responseError.data !== null
            && 'error' in responseError.data
            && typeof responseError.data.error === 'string'
        ) {
            details = responseError.data.error;
        } else {
            details = typeof responseError.data === 'string' ? responseError.data : JSON.stringify(responseError.data);
        }

        return handleStatusCode(responseError.status, details);
    }

    if (typeof responseError.status === 'string') {
        switch (responseError.status) {
            case 'FETCH_ERROR':
                return 'Network error';
            case 'PARSING_ERROR':
                if (responseError.originalStatus >= 400) {
                    return handleStatusCode(responseError.originalStatus);
                }
                return 'Response parsing error';
            case 'TIMEOUT_ERROR':
                return 'Request timeout';
            case 'CUSTOM_ERROR':
                return typeof responseError.error;
        }
    }

    return 'Unknown error';
};
