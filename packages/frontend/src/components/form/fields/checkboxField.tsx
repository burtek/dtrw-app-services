import { Checkbox } from '@radix-ui/themes';
import { shallowEqual } from 'fast-equals';
import type { ComponentProps } from 'react';
import { memo, useCallback, useMemo } from 'react';
import type { Control, Validate } from 'react-hook-form';
import { useController } from 'react-hook-form';

import { FieldWrapper } from './_wrapper';


function checkValueType(value: unknown): asserts value is boolean | undefined {
    if (!['boolean', 'undefined'].includes(typeof value)) {
        throw new TypeError(`value should be boolean|undefined, ${typeof value} given instead`);
    }
}

const Component = <C extends Control>({ label, control, name, rules, overwriteValues: ov }: Props<C>) => {
    const overwriteValues = useMemo(
        () => ({
            true: !!ov && 'true' in ov ? ov.true : true,
            false: !!ov && 'false' in ov ? ov.false : false
        }),
        [ov]
    );
    const reverseOverwriteValues: Record<string, boolean | undefined> = Object.fromEntries(
        Object.entries(overwriteValues)
            .map(([key, val]) => [String(val), key === 'true' ? true : key === 'false' ? false : undefined])
    );
    const {
        field: { value: v, onChange, onBlur, disabled, ref },
        fieldState: { error },
        formState: { isSubmitting }
    } = useController({ control, name, rules });
    const value = reverseOverwriteValues[v as string] ?? undefined;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    checkValueType(value);

    const handleChange = useCallback<NonNullable<ComponentProps<typeof Checkbox>['onCheckedChange']>>(newValue => {
        checkValueType(newValue);

        onChange(overwriteValues[`${newValue}`]);
    }, [onChange, overwriteValues]);

    return (
        <FieldWrapper
            label={label}
            error={error}
            row
        >
            <Checkbox
                ref={ref}
                required={rules?.required}
                checked={value}
                onCheckedChange={handleChange}
                onBlur={onBlur}
                disabled={isSubmitting || disabled}
                variant="soft"
                color={error ? 'red' : undefined}
            />
        </FieldWrapper>
    );
};
Component.displayName = 'CheckboxField';

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const CheckboxField = memo(
    Component,
    (
        { rules: prevRules, ...prevProps },
        { rules: nextRules, ...nextProps }
    ) => shallowEqual(prevRules, nextRules) && shallowEqual(prevProps, nextProps)
) as typeof Component;

interface Props<C extends Control> {
    label: string;

    control: C;
    name: C extends Control<infer Values> ? keyof Values : string;
    rules?: {
        required?: boolean;
        validate?: C extends Control<infer Values> ? Validate<string | undefined, Values> : never;
    };

    overwriteValues?: Partial<Record<'true' | 'false', unknown>>;
}
