/* eslint-disable @typescript-eslint/naming-convention */

import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';


export const Prefix = Object.freeze({
    CONTAINER_TYPE: '#',
    PROJECT_SLUG: '/',
    USERNAME: '@',
    USERGROUP: '$'
});

export const baseQuery = fetchBaseQuery({ baseUrl: new URL('/api', location.origin).href });
