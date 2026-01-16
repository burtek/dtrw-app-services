import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import nock from 'nock';

import type { GetUser } from '../types';
import { Wrapper } from '../wrapper';

import { Users } from '.';


const usersMock: Record<string, GetUser> = {
    johndoe: {
        displayname: 'John Doe',
        email: 'johndoe@example.com',
        groups: ['admins'],
        disabled: false
    },
    janedoe: {
        displayname: 'Jane Doe',
        email: 'janedoe@example.com',
        groups: ['users'],
        disabled: false
    }
};

describe('users module', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    it('should render', async () => {
        const scope = nock('http://localhost')
            .get('/api/users')
            .reply(200, usersMock);

        const { container } = render(
            <Users />,
            { wrapper: Wrapper }
        );

        expect(screen.getByText(/Users/)).toHaveTextContent('Users (0)');
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.querySelector('.rt-Spinner')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /New User/ })).toBeDisabled();

        await waitFor(() => {
            expect(screen.getByText(/Users/)).toHaveTextContent('Users (2)');
        });

        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.querySelector('.rt-Spinner')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /New User/ })).toBeEnabled();

        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);

        ['John Doe', '@johndoe', '$admins', 'johndoe@example.com'].forEach(text => {
            expect(screen.getByText(text)).toBeInTheDocument();
        });
        ['Jane Doe', '@janedoe', '$users', 'janedoe@example.com'].forEach(text => {
            expect(screen.getByText(text)).toBeInTheDocument();
        });

        scope.done();
    });

    it('should handle fetch error', async () => {
        const scope = nock('http://localhost')
            .get('/api/users')
            .reply(404, {});

        const { container } = render(
            <Users />,
            { wrapper: Wrapper }
        );

        expect(screen.getByText(/Users/)).toHaveTextContent('Users (0)');
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.querySelector('.rt-Spinner')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /New User/ })).toBeDisabled();

        await waitFor(() => {
            expect(screen.getByText(/Users fetch failed/)).toBeInTheDocument();
        });

        expect(screen.getByText('Users (0)')).toBeInTheDocument();

        scope.done();
    });

    it('should handle user modification', async () => {
        const postBody = vitest.fn().mockReturnValue(true);

        const user = userEvent.setup();
        const scope = nock('http://localhost')
            .get('/api/users')
            .reply(200, usersMock);

        render(
            <Users />,
            { wrapper: Wrapper }
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /New User/ })).toBeEnabled();
        });

        await user.click(screen.getByLabelText('Edit johndoe'));

        expect(screen.getByRole('dialog')).toBeInTheDocument();

        expect(screen.getByLabelText('Display Name')).toHaveValue('John Doe');
        expect(screen.getByLabelText('Email')).toHaveValue('johndoe@example.com');
        expect(screen.getByLabelText('Username')).toHaveValue('johndoe');
        expect(screen.getByLabelText('Password')).toHaveValue('');
        expect(screen.getByLabelText('User groups')).toHaveValue('');
        expect(within(screen.getByRole('dialog')).getByText('admins')).toBeInTheDocument();

        await user.clear(screen.getByLabelText('Display Name'));
        await user.type(screen.getByLabelText('Display Name'), 'Johnathan Doe');
        await user.click(screen.getByLabelText('Remove tag admins'));
        await user.type(screen.getByLabelText('User groups'), 'superadmins,');

        expect(screen.getByLabelText('User groups')).toHaveValue('');
        expect(within(screen.getByRole('dialog')).getByText('superadmins')).toBeInTheDocument();

        scope.post('/api/users/johndoe', postBody)
            .reply(200, { ...usersMock.johndoe, displayname: 'Johnathan Doe' })
            .get('/api/users')
            .reply(200, {
                ...usersMock,
                johndoe: { ...usersMock.johndoe, displayname: 'Johnathan Doe' }
            });

        await user.click(screen.getByRole('button', { name: /Save/ }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('Johnathan Doe')).toBeInTheDocument();
        });

        expect(postBody).toHaveBeenCalledWith({
            displayname: 'Johnathan Doe',
            email: 'johndoe@example.com',
            groups: ['superadmins'],
            disabled: false,
            username: 'johndoe'
        });

        scope.done();
    });

    it.todo('should handle user modification error');

    it.todo('should handle new user creation');

    it.todo('should handle new user creation error');

    it.todo('should handle user deletion');

    it.todo('should handle user deletion error');

    it('should handle list reload', async () => {
        const scope = nock('http://localhost')
            .get('/api/users')
            .reply(200, usersMock)
            .get('/api/users')
            .reply(200, {
                ...usersMock,
                newuser: {
                    displayname: 'New User',
                    groups: [],
                    disabled: false
                }
            });

        const { container } = render(
            <Users />,
            { wrapper: Wrapper }
        );

        expect(screen.getByText(/Users/)).toHaveTextContent('Users (0)');
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.querySelector('.rt-Spinner')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /New User/ })).toBeDisabled();

        await waitFor(() => {
            expect(screen.getByText(/Users/)).toHaveTextContent('Users (2)');
        });

        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.querySelector('.rt-Spinner')).not.toBeInTheDocument();

        await userEvent.click(screen.getByLabelText('Reload users list'));

        await waitFor(() => {
            expect(screen.getByText(/Users/)).toHaveTextContent('Users (3)');
        });

        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        expect(container.querySelector('.rt-Spinner')).not.toBeInTheDocument();

        scope.done();
    });
});
