import { Theme } from '@radix-ui/themes';
import type { FC, PropsWithChildren } from 'react';
import { StrictMode } from 'react';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';

import { store } from './redux/store.ts';
import styles from './wrapper.module.scss';


export const Wrapper: FC<PropsWithChildren> = ({ children }) => (
    <StrictMode>
        <Theme className={styles.wrapper}>
            <Provider store={store}>
                {children}
            </Provider>
        </Theme>
        <ToastContainer style={{ marginTop: 32 }} />
    </StrictMode>
);
Wrapper.displayName = 'RootWrapper';
