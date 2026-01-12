import { Cross1Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Box, Button, TextField, Tooltip } from '@radix-ui/themes';
import classnames from 'classnames';
import type { ChangeEventHandler, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { Prefix } from '../consts';

import styles from './styles.module.scss';


interface SearchContextValue {
    query: string;
    queryType: 'container_type' | 'project_slug' | 'username' | 'usergroup' | 'string';
}
export type SearchContextValues = SearchContextValue[];

const SearchContext = createContext<SearchContextValues>([]);
SearchContext.displayName = 'SearchContext';

// eslint-disable-next-line @typescript-eslint/no-empty-function, @stylistic/curly-newline
const SearchSetterContext = createContext<{ add: (value: SearchContextValue) => void }>({ add() {} });
SearchSetterContext.displayName = 'SearchSetterContext';

const queryTypeConfig = {
    [Prefix.CONTAINER_TYPE]: {
        type: 'container_type' as const,
        description: 'search by container type'
    },
    [Prefix.PROJECT_SLUG]: {
        type: 'project_slug' as const,
        description: 'search by project slug'
    },
    [Prefix.USERNAME]: {
        type: 'username' as const,
        description: 'search by username'
    },
    [Prefix.USERGROUP]: {
        type: 'usergroup' as const,
        description: 'search by user group'
    }
};

const updateSearchParams = (searchValue: string, setSearchParams: React.Dispatch<React.SetStateAction<SearchContextValues>>) => {
    const values = searchValue.trim().split(' ').filter(v => v.length > 0)
        .map(v => v.trim());

    const newSearchParams: SearchContextValues = values.map(value => {
        let queryType: SearchContextValue['queryType'] = 'string';
        let query = value;

        Object.entries(queryTypeConfig).forEach(([prefix, config]) => {
            if (query.startsWith(prefix)) {
                queryType = config.type;
                query = query.slice(prefix.length);
            }
        });

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
};

export const SearchWrapper = ({ children, classNames }: SearchWrapperProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [searchParams, setSearchParams] = useState<SearchContextValues>([]);

    const onSearchChange = useCallback<ChangeEventHandler<HTMLInputElement>>(event => {
        setSearchValue(event.target.value);
        updateSearchParams(event.target.value, setSearchParams);
    }, []);

    const onAddParam = useCallback((value: SearchContextValue) => {
        setSearchValue(old => {
            const prefix = Object.keys(queryTypeConfig)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                .find(key => queryTypeConfig[key as keyof typeof queryTypeConfig].type === value.queryType) ?? '';
            const newParam = `${prefix}${value.query}`;
            if (old.length === 0) {
                return newParam;
            }
            return `${old} ${newParam}`;
        });
        setSearchParams(old => [...old, value]);
    }, []);

    const searchSetterParams = useMemo(() => ({ add: onAddParam }), [onAddParam]);

    /* eslint-disable @stylistic/jsx-one-expression-per-line, react/jsx-one-expression-per-line */
    const renderTooltip = () => (
        <div>
            <div>Available helpers:</div>
            <ul>
                {Object.entries(queryTypeConfig).map(([prefix, config]) => (
                    <li key={prefix}>
                        <code>{prefix}value</code> - {config.description}
                    </li>
                ))}
            </ul>
        </div>
    );
    /* eslint-enable @stylistic/jsx-one-expression-per-line, react/jsx-one-expression-per-line */

    const placeholder = Object.entries(queryTypeConfig)
        .map(([prefix, { type }]) => `${prefix}${type}`)
        .join(', ');

    const clearSearch = useCallback(() => {
        setSearchValue('');
        setSearchParams([]);
    }, []);

    return (
        <SearchContext.Provider value={searchParams}>
            <SearchSetterContext.Provider value={searchSetterParams}>
                <Box className={classnames(styles.box, classNames?.fieldWrapper)}>
                    <TextField.Root
                        type="text"
                        placeholder={`Search... (helpers: ${placeholder})`}
                        onChange={onSearchChange}
                        className={classnames(styles['search-input'], classNames?.field)}
                        value={searchValue}
                        role="searchbox"
                    >
                        <TextField.Slot>
                            <Tooltip content={renderTooltip()}>
                                <MagnifyingGlassIcon
                                    height="16"
                                    width="16"
                                    style={{ cursor: 'help' }}
                                />
                            </Tooltip>
                        </TextField.Slot>

                        <TextField.Slot>
                            <Button
                                variant="ghost"
                                size="1"
                                onClick={clearSearch}
                                mx="0"
                            >
                                <Cross1Icon
                                    height="14"
                                    width="14"
                                />
                            </Button>
                        </TextField.Slot>
                    </TextField.Root>
                </Box>
                {children}
            </SearchSetterContext.Provider>
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
export const useSearchSetterContext = () => useContext(SearchSetterContext);
