import { Box, TextField } from '@radix-ui/themes';
import classnames from 'classnames';
import type { ChangeEventHandler, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';

import { Prefix } from '../consts';

import styles from './styles.module.scss';


interface SearchContextValue {
    query: string;
    queryType: 'container_type' | 'project_slug' | 'string';
}
export type SearchContextValues = SearchContextValue[];

const SearchContext = createContext<SearchContextValues>([]);
SearchContext.displayName = 'SearchContext';

export const SearchWrapper = ({ children, classNames }: SearchWrapperProps) => {
    const [searchParams, setSearchParams] = useState<SearchContextValues>([]);

    const onSearchChange = useCallback<ChangeEventHandler<HTMLInputElement>>(event => {
        const values = event.target.value.trim().split(' ').filter(v => v.length > 0)
            .map(v => v.trim());

        const newSearchParams: SearchContextValues = values.map(value => {
            let queryType: SearchContextValue['queryType'] = 'string';
            let query = value;

            if (query.startsWith(Prefix.CONTAINER_TYPE)) {
                queryType = 'container_type';
                query = query.slice(1);
            } else if (query.startsWith(Prefix.PROJECT_SLUG)) {
                queryType = 'project_slug';
                query = query.slice(1);
            }

            return { query, queryType };
        });

        setSearchParams(old => {
            const oldString = old.map(v => `${v.queryType}:${v.query}`).join('|');
            const newString = newSearchParams.map(v => `${v.queryType}:${v.query}`).join('|');

            if (oldString === newString) {
                return old;
            }

            return newSearchParams;
        });
    }, []);

    return (
        <SearchContext.Provider value={searchParams}>
            <Box className={classnames(styles.box, classNames?.fieldWrapper)}>
                <TextField.Root
                    type="text"
                    placeholder="Search... (helpers: /slug, #container_type)"
                    onChange={onSearchChange}
                    className={classnames(styles['search-input'], classNames?.field)}
                />
            </Box>
            {children}
        </SearchContext.Provider>
    );
};
SearchWrapper.displayName = 'SearchWrapper';
interface SearchWrapperProps extends PropsWithChildren {
    classNames?: {
        fieldWrapper?: string;
        field?: string;
    };
}

export const useSearchContext = () => useContext(SearchContext);
