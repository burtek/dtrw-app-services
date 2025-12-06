import { act, render, waitFor, screen } from '@testing-library/react';

import App from './App';


test('App renders', async () => {
    let resolve: ((value: Response) => void) | undefined;

    vitest.stubGlobal('fetch', vitest.fn(() => new Promise<Response>(res => {
        resolve = res;
    })));

    const { container } = render(<App />);

    expect(container).not.toBeEmptyDOMElement();

    expect(screen.getByText(/Loading/)).toBeInTheDocument();

    act(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        resolve?.({
            ok: true,
            text: () => Promise.resolve('Hello, world!')
        } as unknown as Response);
    });

    await waitFor(() => {
        expect(screen.getByText(/Hello, world!/)).toBeInTheDocument();
    });
});
