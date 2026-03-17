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

    it('should handle group deletion', async () => {
        const user = userEvent.setup();
        const scope = nock('http://localhost')
            .get('/api/users')
            .reply(200, usersMock);

        render(
            <UserGroups />,
            { wrapper: Wrapper }
        );

        await waitFor(() => {
            expect(screen.getByText(/User Groups/)).toHaveTextContent('User Groups (2)');
        });

        // Mock the PATCH calls for removing 'admins' group from johndoe
        scope
            .post('/api/users/johndoe', { groups: ['users'] })
            .reply(200, { ...usersMock.johndoe, groups: ['users'] })
            .get('/api/users')
            .reply(200, { ...usersMock, johndoe: { ...usersMock.johndoe, groups: ['users'] } });

        await user.click(screen.getByLabelText('Delete group admins'));

        // confirm the dialog
        await user.click(screen.getByRole('button', { name: 'Remove' }));

        await waitFor(() => {
            expect(screen.getByText('Group deleted')).toBeInTheDocument();
        });

        scope.done();
    });

    it('should open new group dialog', async () => {
        const user = userEvent.setup();
        const scope = nock('http://localhost')
            .get('/api/users')
            .reply(200, usersMock);

        render(
            <UserGroups />,
            { wrapper: Wrapper }
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /New Group/ })).toBeEnabled();
        });

        await user.click(screen.getByRole('button', { name: /New Group/ }));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toHaveTextContent('New group');
        expect(screen.getByLabelText('Group Name')).toHaveValue('');

        // All users should be listed with unchecked checkboxes
        expect(screen.getByRole('checkbox', { name: /johndoe/ })).not.toBeChecked();
        expect(screen.getByRole('checkbox', { name: /janedoe/ })).not.toBeChecked();

        scope.done();
    });

    it('should handle new group creation', async () => {
        const postBody = vitest.fn().mockReturnValue(true);
        const user = userEvent.setup();

        nock('http://localhost')
            .get('/api/users')
            .reply(200, usersMock)
            .post('/api/users/johndoe', postBody)
            .reply(200, { ...usersMock.johndoe, groups: ['admins', 'users', 'superadmins'] })
            .post('/api/users/janedoe', postBody)
            .reply(200, { ...usersMock.janedoe, groups: ['users', 'superadmins'] })
            .get('/api/users')
            .reply(200, {
                johndoe: { ...usersMock.johndoe, groups: ['admins', 'users', 'superadmins'] },
                janedoe: { ...usersMock.janedoe, groups: ['users', 'superadmins'] }
            });

        render(
            <UserGroups />,
            { wrapper: Wrapper }
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /New Group/ })).toBeEnabled();
        });

        await user.click(screen.getByRole('button', { name: /New Group/ }));

        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await user.type(screen.getByLabelText('Group Name'), 'superadmins');
        await user.click(screen.getByRole('checkbox', { name: /johndoe/ }));
        await user.click(screen.getByRole('checkbox', { name: /janedoe/ }));

        await user.click(screen.getByRole('button', { name: /Save/ }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('Group created')).toBeInTheDocument();
        });

        expect(postBody).toHaveBeenCalledWith(
            expect.objectContaining({ groups: expect.arrayContaining(['superadmins']) })
        );
    });

    it('should open edit group dialog with pre-selected users', async () => {
        const user = userEvent.setup();
        const scope = nock('http://localhost')
            .get('/api/users')
            .reply(200, usersMock);

        render(
            <UserGroups />,
            { wrapper: Wrapper }
        );

        await waitFor(() => {
            expect(screen.getByText(/User Groups/)).toHaveTextContent('User Groups (2)');
        });

        await user.click(screen.getByLabelText('Edit group users'));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toHaveTextContent('Edit group');
        expect(screen.getByLabelText('Group Name')).toHaveValue('users');

        // Both users are in 'users' group so both should be checked
        expect(screen.getByRole('checkbox', { name: /johndoe/ })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /janedoe/ })).toBeChecked();

        scope.done();
    });
});
