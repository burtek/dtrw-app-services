import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { withErrorBoundary } from './withErrorBoundary';


const Child = withErrorBoundary(() => <div>Child</div>);
const ErrorChild = withErrorBoundary(() => {
    throw new Error();
});
const Parent = ({ children }: PropsWithChildren) => (
    <div>
        Parent
        {children}
    </div>
);

describe('components/withErrorBoundary', () => {
    const noop = vitest.fn();

    const spies = [
        vitest.spyOn(console, 'warn').mockImplementation(noop),
        vitest.spyOn(console, 'error').mockImplementation(noop),
        vitest.spyOn(console, 'log').mockImplementation(noop)
    ];

    afterAll(() => {
        spies.forEach(spy => {
            spy.mockRestore();
        });
    });

    it('should render correctly', () => {
        render(
            <Parent>
                <Child />
            </Parent>
        );

        expect(screen.getByText('Child')).toBeInTheDocument();
        expect(screen.getByText('Parent')).toBeInTheDocument();
        expect(screen.queryByText('An error occured')).not.toBeInTheDocument();
    });

    it('should catch error', () => {
        render(
            <Parent>
                <ErrorChild />
            </Parent>
        );

        expect(screen.getByText('Parent')).toBeInTheDocument();
        expect(screen.getByText('An error occured:')).toBeInTheDocument();
    });
});
