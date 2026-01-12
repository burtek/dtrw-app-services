import { Theme } from '@radix-ui/themes';
import type { FC, PropsWithChildren } from 'react';
import { StrictMode, useState } from 'react';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';

import { createStore } from './redux/store.ts';
import styles from './wrapper.module.scss';


export const Wrapper: FC<PropsWithChildren> = ({ children }) => {
    // eslint-disable-next-line react/hook-use-state
    const [store] = useState(createStore);

    return (
        <StrictMode>
            <Theme className={styles.wrapper}>
                <Provider store={store}>
                    {children}
                </Provider>
            </Theme>
            <ToastContainer
                position="bottom-right"
                newestOnTop
                style={{ marginTop: 32 }}
            />
        </StrictMode>
    );
};
Wrapper.displayName = 'RootWrapper';
