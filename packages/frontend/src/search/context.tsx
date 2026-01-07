import { MagnifyingGlassIcon, QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { Box, TextField, Tooltip } from '@radix-ui/themes';
import classnames from 'classnames';
import type { ChangeEventHandler, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';

import { Prefix } from '../consts';

import styles from './styles.module.scss';


interface SearchContextValue {
    query: string;
    queryType: 'container_type' | 'project_slug' | 'username' | 'usergroup' | 'string';
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
            } else if (query.startsWith(Prefix.USERNAME)) {
                queryType = 'username';
                query = query.slice(1);
            } else if (query.startsWith(Prefix.USERGROUP)) {
                queryType = 'usergroup';
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

    /* eslint-disable @stylistic/jsx-one-expression-per-line, react/jsx-one-expression-per-line */
    const renderTooltip = () => (
        <div>
            <div>Available helpers:</div>
            <ul>
                <li>
                    <code>{Prefix.PROJECT_SLUG}slug</code> - search by project slug
                </li>
                <li>
                    <code>{Prefix.CONTAINER_TYPE}container_type</code> - search by container type
                </li>
                <li>
                    <code>{Prefix.USERNAME}username</code> - search by username
                </li>
                <li>
                    <code>{Prefix.USERGROUP}user_group</code> - search by user group
                </li>
            </ul>
        </div>
    );
    /* eslint-enable @stylistic/jsx-one-expression-per-line, react/jsx-one-expression-per-line */

    return (
        <SearchContext.Provider value={searchParams}>
            <Box className={classnames(styles.box, classNames?.fieldWrapper)}>
                <TextField.Root
                    type="text"
                    placeholder={`Search... (helpers: ${Prefix.PROJECT_SLUG}slug, ${Prefix.CONTAINER_TYPE}container_type, ${Prefix.USERNAME}username, ${Prefix.USERGROUP}user_group)`}
                    onChange={onSearchChange}
                    className={classnames(styles['search-input'], classNames?.field)}
                >
                    <TextField.Slot>
                        <MagnifyingGlassIcon
                            height="16"
                            width="16"
                        />
                    </TextField.Slot>

                    <TextField.Slot>
                        <Tooltip content={renderTooltip()}>
                            <QuestionMarkCircledIcon
                                height="14"
                                width="14"
                            />
                        </Tooltip>

                    </TextField.Slot>
                </TextField.Root>
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
