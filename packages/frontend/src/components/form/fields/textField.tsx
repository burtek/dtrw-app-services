import { TextField as Input } from '@radix-ui/themes';
import { deepEqual } from 'fast-equals';
import type { ChangeEventHandler } from 'react';
import { memo, useCallback } from 'react';
import type { Control, Validate } from 'react-hook-form';
import { useController } from 'react-hook-form';

import { FieldWrapper } from './_wrapper';


function checkValueType(value: unknown): asserts value is string | undefined | null {
    if (!['string', 'undefined'].includes(typeof value) && value !== null) {
        throw new TypeError(`value should be string|undefined|null, ${typeof value} given instead`);
    }
}

const Component = <C extends Control>({ label, control, name, rules, onChange: onChangeProp, type = 'text' }: Props<C>) => {
    const {
        field: { value: v, onChange, onBlur, disabled, ref },
        fieldState: { error },
        formState: { isSubmitting }
    } = useController({ control, name, rules });
    const value = v as unknown;
    checkValueType(value);

    const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(event => {
        onChange(event.target.value);
        onChangeProp?.(event.target.value);
    }, [onChange, onChangeProp]);

    return (
        <FieldWrapper
            label={label}
            error={error}
        >
            <Input.Root
                ref={ref}
                required={rules?.required}
                value={value ?? undefined}
                onBlur={onBlur}
                onChange={handleChange}
                disabled={isSubmitting || disabled}
                variant="soft"
                color={error ? 'red' : undefined}
                type={type}
            />
        </FieldWrapper>
    );
};
Component.displayName = 'TextField';

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const TextField = memo(
    Component,
    (prevProps, nextProps) => deepEqual(prevProps, nextProps)
) as typeof Component;

type NestedKeys<Values>
    = Values extends Array<infer R>
        ? `${number}` | `${number}.${NestedKeys<R>}`
        : Values extends object
            ? {
                [K in keyof Values & (string | number)]: K | `${K}.${NestedKeys<Values[K]>}`;
            }[keyof Values & (string | number)]
            : never;

interface Props<C extends Control> {
    label?: string;

    control: C;
    name: C extends Control<infer Values> ? NestedKeys<Values> : string;
    rules?: {
        pattern?: RegExp;
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        validate?: C extends Control<infer Values> ? Validate<string | undefined, Values> : never;
    };
    type?: 'text' | 'password' | 'email';

    onChange?: (value: string) => void;
}
