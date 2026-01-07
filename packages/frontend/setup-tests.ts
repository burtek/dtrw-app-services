import '@testing-library/jest-dom/vitest';


// Mock the ResizeObserver
// eslint-disable-next-line prefer-arrow-callback
const ResizeObserverMock = vitest.fn(function ResizeObserverMock(roCallback: ResizeObserverCallback) {
    const ro = {
        observe: vitest.fn(_target => {
            roCallback([], ro);
        }),
        unobserve: vitest.fn(),
        disconnect: vitest.fn()
    } satisfies ResizeObserver;

    return ro;
});

// Stub the global ResizeObserver
vitest.stubGlobal('ResizeObserver', ResizeObserverMock);
