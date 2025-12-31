import { AlertDialog, Button, Flex } from '@radix-ui/themes';
import type { PropsWithChildren } from 'react';


export const DeleteConfirmButton = ({ header, children, description, onConfirm, cancelText = 'Cancel', confirmText = 'Remove' }: Props) => (
    <AlertDialog.Root>
        <AlertDialog.Trigger>{children}</AlertDialog.Trigger>
        <AlertDialog.Content maxWidth="450px">
            <AlertDialog.Title>{header}</AlertDialog.Title>
            <AlertDialog.Description size="2">{description}</AlertDialog.Description>

            <Flex
                gap="3"
                mt="4"
                justify="end"
            >
                <AlertDialog.Cancel>
                    <Button
                        variant="soft"
                        color="gray"
                    >
                        {cancelText}
                    </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action onClick={onConfirm}>
                    <Button
                        variant="solid"
                        color="red"
                    >
                        {confirmText}
                    </Button>
                </AlertDialog.Action>
            </Flex>
        </AlertDialog.Content>
    </AlertDialog.Root>
);

DeleteConfirmButton.displayName = 'DeleteConfirmButton';

interface Props extends PropsWithChildren {
    header: PropsWithChildren['children'];
    description: string;
    onConfirm: () => void;
    cancelText?: string;
    confirmText?: string;
}
