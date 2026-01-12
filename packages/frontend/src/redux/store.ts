import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { createLogger } from 'redux-logger';

import { containersApi } from '../containers/api-containers';
import { dockerApi } from '../containers/api-docker';
import { projectsApi } from '../projects/api';
import { usersApi } from '../users/api';


declare global {
    interface Window {
        forceLog?: boolean;
    }
}

const rootReducer = combineSlices(projectsApi, containersApi, dockerApi, usersApi);

export const createStore = () => configureStore({
    devTools: true,
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(
            projectsApi.middleware,
            containersApi.middleware,
            dockerApi.middleware,
            usersApi.middleware,
            createLogger({
                predicate() {
                    return (import.meta.env.DEV && !import.meta.env.TEST) || !!window.forceLog;
                }
            })
        )
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
