/* eslint-disable @typescript-eslint/method-signature-style */

declare global {
    interface Array<T> {
        includes<U>(searchElement: T extends U ? U : never, fromIndex?: number): boolean;
    }
}

export {};
