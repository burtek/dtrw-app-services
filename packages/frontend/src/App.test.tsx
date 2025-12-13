import { act, render, screen } from '@testing-library/react';

import App from './App';


test('App renders', async () => {
    vitest.stubGlobal('fetch', vitest.fn().mockRejectedValue({})); // will render defaults, but need proper tests here

    const { container } = render(<App />);

    await act(async () => {
        await Promise.resolve();
    });

    expect(container).not.toBeEmptyDOMElement();

    expect(screen.getByText(/Użytkownicy/)).toBeInTheDocument();
});
