import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { createLogger } from 'redux-logger';

import { containersApi } from '../containers/api-containers';
import { dockerApi } from '../containers/api-docker';
import { projectsApi } from '../projects/api';


declare global {
    interface Window {
        forceLog?: boolean;
    }
}

export const store = configureStore({
    devTools: true,
    reducer: combineSlices(projectsApi, containersApi, dockerApi),
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(
            projectsApi.middleware,
            containersApi.middleware,
            dockerApi.middleware,
            createLogger({
                predicate() {
                    return (import.meta.env.DEV && !import.meta.env.TEST) || !!window.forceLog;
                }
            })
        )
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
