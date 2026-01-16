import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';


function handleStatusCode(status: number, details?: string): string {
    const withDetails = (error: string) => (details ? `${error}: ${details}` : error);

    switch (status) {
        case 400:
            return withDetails('Bad Request');
        case 401:
            return withDetails('Unauthorized');
        case 403:
            return withDetails('Forbidden');
        case 404:
            return withDetails('Not Found');
        case 500:
            return withDetails('Internal Server Error');
        case 502:
            return withDetails('Bad Gateway - retry later');
        case 503:
            return withDetails('Service Unavailable - retry later');
        case 504:
            return withDetails('Gateway Timeout');
        default:
            return withDetails(`Error ${status}`);
    }
}

export const handleQueryError = (responseError: FetchBaseQueryError | SerializedError): string => {
    // eslint-disable-next-line no-console
    console.error('Query error:', responseError);

    if (!('status' in responseError)) {
        return String(responseError.message ?? responseError.name);
    }

    if (typeof responseError.status === 'number') {
        let details: string | undefined;

        if (typeof responseError.data === 'object'
            && responseError.data !== null
            && 'message' in responseError.data
            && typeof responseError.data.message === 'string'
        ) {
            details = responseError.data.message;
        } else if (typeof responseError.data === 'object'
            && responseError.data !== null
            && 'error' in responseError.data
            && typeof responseError.data.error === 'string'
        ) {
            details = responseError.data.error;
        } else if (typeof responseError.data === 'string') {
            details = responseError.data;
        } else {
            details = responseError.data ? JSON.stringify(responseError.data) : undefined;
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
