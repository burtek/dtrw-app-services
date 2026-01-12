import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Wrapper } from '../wrapper';

import type { SearchContextValues } from './context';
import { SearchWrapper, useSearchContext, useSearchSetterContext } from './context';


describe('Search', () => {
    it('should render', () => {
        const { result } = renderHook(
            () => useSearchContext(),
            {
                wrapper: ({ children }) => (
                    <Wrapper>
                        <SearchWrapper>
                            {children}
                        </SearchWrapper>
                    </Wrapper>
                )
            }
        );

        expect(screen.getByRole('searchbox')).toBeInTheDocument();
        expect(screen.getByRole('searchbox')).toHaveValue('');
        expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', expect.stringContaining('Search... (helpers: '));

        expect(result.current).toHaveLength(0);
    });

    it('should provide search values', async () => {
        const user = userEvent.setup();

        const { result } = renderHook(
            () => useSearchContext(),
            {
                wrapper: ({ children }) => (
                    <Wrapper>
                        <SearchWrapper>
                            {children}
                        </SearchWrapper>
                    </Wrapper>
                )
            }
        );

        expect(screen.getByRole('searchbox')).toHaveValue('');

        await user.type(screen.getByRole('searchbox'), '/abc #def @ghi $jkl opq');

        expect(result.current).toHaveLength(5);

        expect(result.current[0]).toStrictEqual({ queryType: 'project_slug', query: 'abc' });
        expect(result.current[1]).toStrictEqual({ queryType: 'container_type', query: 'def' });
        expect(result.current[2]).toStrictEqual({ queryType: 'username', query: 'ghi' });
        expect(result.current[3]).toStrictEqual({ queryType: 'usergroup', query: 'jkl' });
        expect(result.current[4]).toStrictEqual({ queryType: 'string', query: 'opq' });
    });

    it.each<{ query: SearchContextValues[number]; expected: string }>([
        {
            query: { query: 'xyz', queryType: 'username' as const },
            expected: '@xyz'
        },
        {
            query: { query: 'xyz', queryType: 'project_slug' as const },
            expected: '/xyz'
        },
        {
            query: { query: 'xyz', queryType: 'container_type' as const },
            expected: '#xyz'
        },
        {
            query: { query: 'xyz', queryType: 'usergroup' as const },
            expected: '$xyz'
        },
        {
            query: { query: 'someword', queryType: 'string' as const },
            expected: 'someword'
        }
    ])('should react to setter call for $query.queryType', async ({ query, expected }) => {
        const user = userEvent.setup();

        const { result } = renderHook(
            () => ({
                add: useSearchSetterContext().add,
                values: useSearchContext()
            }),
            {
                wrapper: ({ children }) => (
                    <Wrapper>
                        <SearchWrapper>
                            {children}
                        </SearchWrapper>
                    </Wrapper>
                )
            }
        );

        expect(screen.getByRole('searchbox')).toHaveValue('');

        // setting new
        act(() => {
            result.current.add(query);
        });

        expect(screen.getByRole('searchbox')).toHaveValue(expected);
        expect(result.current.values).toHaveLength(1);
        expect(result.current.values[0]).toStrictEqual(query);

        await user.clear(screen.getByRole('searchbox'));
        await user.type(screen.getByRole('searchbox'), 'simplesearch');

        expect(result.current.values).toHaveLength(1);
        expect(result.current.values[0]).toStrictEqual({ queryType: 'string', query: 'simplesearch' });

        // adding to existing
        act(() => {
            result.current.add(query);
        });

        expect(screen.getByRole('searchbox')).toHaveValue(`simplesearch ${expected}`);
        expect(result.current.values).toHaveLength(2);
        expect(result.current.values[0]).toStrictEqual({ queryType: 'string', query: 'simplesearch' });
        expect(result.current.values[1]).toStrictEqual(query);
    });
});
