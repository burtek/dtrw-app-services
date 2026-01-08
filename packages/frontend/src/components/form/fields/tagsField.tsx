import { Cross2Icon } from '@radix-ui/react-icons';
import { Badge, Button, TextField as Input } from '@radix-ui/themes';
import { deepEqual } from 'fast-equals';
import type { ChangeEventHandler, KeyboardEventHandler } from 'react';
import { memo, useCallback, useState } from 'react';
import type { Control, Validate } from 'react-hook-form';
import { useController } from 'react-hook-form';

import { FieldWrapper } from './_wrapper';


function checkValueType(value: unknown): asserts value is string[] | undefined | null {
    if (value === null || value === undefined) {
        return;
    }
    if (!Array.isArray(value) || value.some((item: unknown) => typeof item !== 'string')) {
        throw new TypeError(`value should be string[]|undefined|null, ${typeof value} given instead`);
    }
}

const Component = <C extends Control>({ label, control, name, rules, onChange: onChangeProp, type = 'text' }: Props<C>) => {
    const {
        field: { value: v, onChange, disabled },
        fieldState: { error },
        formState: { isSubmitting }
    } = useController({ control, name, rules });
    const value = v as unknown;
    checkValueType(value);

    const [inputValue, setInputValue] = useState('');

    const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(event => {
        if (event.target.value.includes(',')) {
            const newTags = event.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            const newValue = value ?? [];
            let changed = false;
            newTags.forEach(tag => {
                if (!newValue.includes(tag)) {
                    newValue.push(tag);
                    changed = true;
                }
            });
            if (changed as boolean) {
                onChange(newValue);
                onChangeProp?.(newValue);
            }
            setInputValue('');
            return;
        }
        setInputValue(event.target.value);
    }, [onChange, onChangeProp, value]);

    const handleKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>(event => {
        const isEnter = event.key === 'Enter' && inputValue.trim() !== '';
        if (!isEnter) {
            return;
        }
        event.preventDefault();
        const newTag = inputValue.trim();
        const newValue = value ?? [];
        if (!newValue.includes(newTag)) {
            newValue.push(newTag);
            onChange(newValue);
            onChangeProp?.(newValue);
        }
        setInputValue('');
    }, [inputValue, onChange, onChangeProp, value]);

    const removeTag = useCallback((tagToRemove: string) => {
        const newValue = (value ?? []).filter(tag => tag !== tagToRemove);
        onChange(newValue);
        onChangeProp?.(newValue);
    }, [onChange, onChangeProp, value]);

    return (
        <FieldWrapper
            label={label}
            error={error}
        >
            <Input.Root
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting || disabled}
                variant="soft"
                color={error ? 'red' : undefined}
                type={type}
            >
                {!!value
                    && value.map(tag => (
                        <Input.Slot
                            key={tag}
                            side="left"
                            pl="1"
                            pr="0"
                        >
                            <Badge>
                                {tag}
                                <Button
                                    size="1"
                                    mx="0"
                                    my="0"
                                    variant="ghost"
                                    onClick={() => {
                                        removeTag(tag);
                                    }}
                                >
                                    <Cross2Icon />
                                </Button>
                            </Badge>
                        </Input.Slot>
                    ))}
            </Input.Root>
        </FieldWrapper>
    );
};
Component.displayName = 'TagsField';

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const TagsField = memo(
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
        validate?: C extends Control<infer Values> ? Validate<string[] | undefined, Values> : never;
    };
    type?: 'text' | 'password' | 'email';

    onChange?: (value: string[]) => void;
}
