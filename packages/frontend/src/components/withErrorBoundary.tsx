import type { ComponentType, ErrorInfo, FC, PropsWithChildren } from 'react';
import { PureComponent } from 'react';


class ErrorBoundary extends PureComponent<PropsWithChildren, { hasCaught: boolean }> {
    static displayName = 'ErrorBoundary';

    constructor(thisProps: PropsWithChildren) {
        super(thisProps);
        this.state = { hasCaught: false };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // eslint-disable-next-line no-console
        console.log(error, errorInfo);
        this.setState({ hasCaught: true });
    }

    render() {
        if (this.state.hasCaught) {
            return <p>An error occured</p>;
        }

        return this.props.children;
    }
}

export const withErrorBoundary = <P,>(Component: ComponentType<P>): FC<P> => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const WithErrorBoundary: FC<P> = props => (
        <ErrorBoundary>
            {/* @ts-expect-error-error WTF */}
            <Component {...props} />
        </ErrorBoundary>
    );
    WithErrorBoundary.displayName = Component.displayName ? `WithErrorBoundary(${Component.displayName})` : 'WithErrorBoundary';
    return WithErrorBoundary;
};
