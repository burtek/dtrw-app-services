import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import nock from 'nock';

import type { GetUser } from '../types';
import { Wrapper } from '../wrapper';

import { UserGroups } from './user-groups';


const usersMock: Record<string, GetUser> = {
    johndoe: {
        displayname: 'John Doe',
        email: 'johndoe@example.com',
        groups: ['admins', 'users'],
        disabled: false
    },
    janedoe: {
        displayname: 'Jane Doe',
        email: 'janedoe@example.com',
        groups: ['users'],
        disabled: false
    }
};

describe('user groups module', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    it('should render', async () => {
        const scope = nock('http://localhost')
            .get('/api/users')
            .reply(200, usersMock);

        const { container } = render(
            <UserGroups />,
            { wrapper: Wrapper }
        );

        expect(screen.getByText(/User Groups/)).toHaveTextContent('User Groups (0)');
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.querySelector('.rt-Spinner')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/User Groups/)).toHaveTextContent('User Groups (2)');
        });

        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.querySelector('.rt-Spinner')).not.toBeInTheDocument();

        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);

        ['admins', 'users'].forEach(group => {
            expect(screen.getByText(group, { selector: 'h3' })).toBeInTheDocument();
        });

        expect(screen.getAllByText('@johndoe')).toHaveLength(2); // johndoe is in both groups
        expect(screen.getByText('@janedoe')).toBeInTheDocument();

        scope.done();
    });

    it('should handle fetch error', async () => {
        const scope = nock('http://localhost')
            .get('/api/users')
            .reply(404, {});

        render(
            <UserGroups />,
            { wrapper: Wrapper }
        );

        expect(screen.getByText(/User Groups/)).toHaveTextContent('User Groups (0)');

        await waitFor(() => {
            expect(screen.getByText(/Users fetch failed/)).toBeInTheDocument();
        });

        expect(screen.getByText('User Groups (0)')).toBeInTheDocument();

        scope.done();
    });

    it('should handle list reload', async () => {
        const scope = nock('http://localhost')
            .get('/api/users')
            .reply(200, usersMock)
            .get('/api/users')
            .reply(200, {
                ...usersMock,
                newuser: {
                    displayname: 'New User',
                    groups: ['newgroup'],
                    disabled: false
                }
            });

        const { container } = render(
            <UserGroups />,
            { wrapper: Wrapper }
        );

        expect(screen.getByText(/User Groups/)).toHaveTextContent('User Groups (0)');
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.querySelector('.rt-Spinner')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/User Groups/)).toHaveTextContent('User Groups (2)');
        });

        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.querySelector('.rt-Spinner')).not.toBeInTheDocument();

        await userEvent.click(screen.getByLabelText('Reload user groups list'));

        await waitFor(() => {
            expect(screen.getByText(/User Groups/)).toHaveTextContent('User Groups (3)');
        });

        scope.done();
    });
});
