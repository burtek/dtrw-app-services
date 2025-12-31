import { act, render, screen } from '@testing-library/react';

import App from './App';
import { Wrapper } from './wrapper';


test('App renders', async () => {
    vitest.stubGlobal('fetch', vitest.fn().mockRejectedValue([])); // will render defaults, but need proper tests here

    const { container } = render(<App />, { wrapper: Wrapper });

    await act(async () => {
        await Promise.resolve();
    });

    expect(container).not.toBeEmptyDOMElement();

    expect(screen.getByText('Projects', { selector: 'h2' })).toBeInTheDocument();
});
