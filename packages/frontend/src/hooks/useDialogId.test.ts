import { renderHook, act } from '@testing-library/react';

import { useDialogId } from './useDialogId';


describe('useDialogId hook', () => {
    describe('initialization', () => {
        it('initializes with dialogId false', () => {
            const { result } = renderHook(() => useDialogId());

            expect(result.current).toStrictEqual([false, expect.any(Function), expect.any(Function), expect.any(Function)]);
        });

        it('initializes with dialogId false and undefined param', () => {
            const { result } = renderHook(() => useDialogId({ withNewParam: true }));

            expect(result.current).toStrictEqual([false, expect.any(Function), expect.any(Function), expect.any(Function), undefined]);
        });
    });

    describe('openEditDialog', () => {
        it('openEditDialog sets dialogId', () => {
            const { result } = renderHook(() => useDialogId({ withNewParam: true }));
            const [, openEditDialog] = result.current;
            act(() => {
                openEditDialog(123);
            });

            expect(result.current[0]).toBe(123);
        });

        it('openEditDialog sets dialogId and clears param', () => {
            const { result } = renderHook(() => useDialogId({ withNewParam: true }));
            const [, openEditDialog, openNewDialog] = result.current;
            act(() => {
                openNewDialog('param');
            });
            act(() => {
                openEditDialog(123);
            });

            expect(result.current[0]).toBe(123);
            expect(result.current[4]).toBeUndefined();
        });
    });

    describe('openNewDialog', () => {
        it('openNewDialog sets dialogId to null', () => {
            const { result } = renderHook(() => useDialogId());
            const [, , openNewDialog] = result.current;
            act(() => {
                openNewDialog();
            });

            expect(result.current[0]).toBeNull();
        });

        it('openNewDialog sets dialogId to null and sets param', () => {
            const { result } = renderHook(() => useDialogId({ withNewParam: true }));
            const [, , openNewDialog] = result.current;
            act(() => {
                openNewDialog('param');
            });

            expect(result.current[0]).toBeNull();
            expect(result.current[4]).toBe('param');
        });
    });

    describe('closeDialog', () => {
        it('closeDialog resets dialogId to false after edit dialog', () => {
            const { result } = renderHook(() => useDialogId());
            const [, openEditDialog, , closeDialog] = result.current;

            act(() => {
                openEditDialog(123);
            });
            act(() => {
                closeDialog();
            });

            expect(result.current[0]).toBe(false);
        });

        it('closeDialog resets dialogId to false after new dialog', () => {
            const { result } = renderHook(() => useDialogId());
            const [, , openNewDialog, closeDialog] = result.current;
            act(() => {
                openNewDialog();
            });
            act(() => {
                closeDialog();
            });

            expect(result.current[0]).toBe(false);
        });

        it('closeDialog resets dialogId to false and clears param', () => {
            const { result } = renderHook(() => useDialogId({ withNewParam: true }));
            const [, , openNewDialog, closeDialog] = result.current;
            act(() => {
                openNewDialog('param');
            });
            act(() => {
                closeDialog();
            });

            expect(result.current[0]).toBe(false);
            expect(result.current[4]).toBeUndefined();
        });
    });
});
