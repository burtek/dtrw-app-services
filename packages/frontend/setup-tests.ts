import '@testing-library/jest-dom/vitest';


// Mock the ResizeObserver
const ResizeObserverMock = vitest.fn((roCallback: ResizeObserverCallback) => {
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
