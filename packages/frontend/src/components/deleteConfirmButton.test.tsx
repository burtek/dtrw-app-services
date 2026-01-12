import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DeleteConfirmButton } from './deleteConfirmButton';


describe('deleteConfirmButton', () => {
    it('should render button', () => {
        const handleDelete = vitest.fn();
        render(
            <DeleteConfirmButton
                header="modal header"
                description="modal description"
                onConfirm={handleDelete}
            >
                <span>Delete</span>
            </DeleteConfirmButton>
        );

        expect(screen.getByText('Delete')).toBeInTheDocument();
        expect(screen.queryByText('modal header')).not.toBeInTheDocument();
        expect(screen.queryByText('modal description')).not.toBeInTheDocument();
        expect(handleDelete).not.toHaveBeenCalled();
    });

    it('should show confirmation dialog on click', async () => {
        const user = userEvent.setup();

        const handleDelete = vitest.fn();
        render(
            <DeleteConfirmButton
                header="modal header"
                description="modal description"
                onConfirm={handleDelete}
            >
                <span>Delete</span>
            </DeleteConfirmButton>
        );

        await user.click(screen.getByText('Delete'));

        expect(screen.getByText('modal header')).toBeInTheDocument();
        expect(screen.getByText('modal description')).toBeInTheDocument();
        expect(handleDelete).not.toHaveBeenCalled();
    });

    it('should call delete function on confirm', async () => {
        const user = userEvent.setup();

        const handleDelete = vitest.fn();
        render(
            <DeleteConfirmButton
                header="modal header"
                description="modal description"
                onConfirm={handleDelete}
                confirmText="Remove"
            >
                <span>Delete</span>
            </DeleteConfirmButton>
        );

        await user.click(screen.getByText('Delete'));
        await user.click(screen.getByText('Remove'));

        expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it('should not call delete function on cancel', async () => {
        const user = userEvent.setup();

        const handleDelete = vitest.fn();
        render(
            <DeleteConfirmButton
                header="modal header"
                description="modal description"
                onConfirm={handleDelete}
                cancelText="Cancel"
            >
                <span>Delete</span>
            </DeleteConfirmButton>
        );

        await user.click(screen.getByText('Delete'));
        await user.click(screen.getByText('Cancel'));

        expect(handleDelete).not.toHaveBeenCalled();
    });
});
