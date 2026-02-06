import type { ComponentType, ErrorInfo, FC, PropsWithChildren } from 'react';
import { PureComponent } from 'react';


class ErrorBoundary extends PureComponent<PropsWithChildren, { error?: Error; errorInfo?: ErrorInfo }> {
    static displayName = 'ErrorBoundary';

    constructor(thisProps: PropsWithChildren) {
        super(thisProps);
        this.state = {};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // eslint-disable-next-line no-console
        console.log(error, errorInfo);
        this.setState({ error, errorInfo });
    }

    private resetState() {
        this.setState({ error: undefined, errorInfo: undefined });
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    render() {
        if (this.state.error || this.state.errorInfo) {
            return (
                <>
                    <p>
                        An error occured:
                        {this.state.error?.message}
                    </p>
                    <button
                        onClick={this.resetState.bind(this)}
                        type="button"
                    >
                        Reset
                    </button>
                </>
            );
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
