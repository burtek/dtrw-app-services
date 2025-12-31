import { Flex, Text } from '@radix-ui/themes';
import type { PropsWithChildren } from 'react';
import { forwardRef } from 'react';
import type { FieldError } from 'react-hook-form';


export function getErrorMessage(error: FieldError) {
    if (error.message) {
        return error.message;
    }

    return `Błąd walidacji: ${error.type}`;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const FieldWrapper = forwardRef<HTMLLabelElement & HTMLDivElement, PropsWithChildren<FieldWrapperProps>>(({ as: Wrapper = 'label', children, error, label, row = false }, ref) => (
    <Wrapper ref={ref}>
        <Flex
            direction={row ? 'row' : 'column'}
            gap={row ? '4' : '1'}
        >
            <Text
                size="2"
                weight="bold"
            >
                {label}
            </Text>
            {children}
            {error
                ? (
                    <Text
                        size="2"
                        color="red"
                    >
                        {getErrorMessage(error)}
                    </Text>
                )
                : null}
        </Flex>
    </Wrapper>
));
FieldWrapper.displayName = 'FieldWrapper';

export interface FieldWrapperProps {
    error?: FieldError;
    label: string;
    as?: 'div' | 'label';
    row?: boolean;
}
