import { useCallback, useState } from 'react';


export function useDialogId<T extends string | number = number>(config?: { withNewParam?: false }): [
    dialogId: T | null | false,
    openEditDialog: (value: T) => void,
    openNewDialog: () => void,
    closeDialog: () => void
];
export function useDialogId<Param, T extends string | number = number>(config: { withNewParam: true }): [
    dialogId: T | null | false,
    openEditDialog: (value: T) => void,
    openNewDialog: (param: Param) => void,
    closeDialog: () => void,
    param: Param
];
export function useDialogId({ withNewParam = false }: { withNewParam?: boolean } = {}): [
    dialogId: string | number | null | false,
    openEditDialog: (value: string | number) => void,
    openNewDialog: (param: unknown) => void,
    closeDialog: () => void,
    param?: unknown
] {
    const [dialogId, setDialogId] = useState<string | number | null | false>(false);
    const [param, setParam] = useState<unknown>(undefined);
    const closeDialog = useCallback(() => {
        setDialogId(false);
        setParam(undefined);
    }, []);
    const openNewDialog = useCallback((arg?: unknown) => {
        setDialogId(null);
        if (withNewParam) {
            setParam(arg);
        }
    }, [withNewParam]);
    const openEditDialog = useCallback((value: string | number) => {
        setDialogId(value);
        setParam(undefined);
    }, []);

    return withNewParam
        ? [dialogId, openEditDialog, openNewDialog, closeDialog, param]
        : [dialogId, openEditDialog, openNewDialog, closeDialog];
}
