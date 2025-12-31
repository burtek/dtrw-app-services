import { PlusIcon } from '@radix-ui/react-icons';
import { Box, Button, Card, Flex, Text } from '@radix-ui/themes';
import { memo, useCallback } from 'react';

import type { DockerContainer, WithId } from '../types';

import styles from './containers.module.scss';


const Component = ({ dockerContainer, openAdd }: Props) => {
    const [mainName] = dockerContainer.names;
    const handleAdd = useCallback(
        () => {
            openAdd(mainName.replace(/^\/+/, ''));
        },
        [openAdd, mainName]
    );

    return (
        <Box>
            <Card className={styles.container}>
                <Text
                    as="div"
                    weight="bold"
                >
                    {mainName}
                </Text>
                <Text as="div">
                    {dockerContainer.id}
                </Text>
                <Text as="div">
                    {dockerContainer.image}
                </Text>
                <Text as="div">
                    {dockerContainer.status}
                </Text>
                <Text as="div">
                    {dockerContainer.state}
                </Text>
                <Flex
                    m="2"
                    gap="2"
                    className={styles.actions}
                >
                    <Button
                        onClick={handleAdd}
                        variant="ghost"
                    >
                        <PlusIcon />
                    </Button>
                </Flex>
            </Card>
        </Box>
    );
};
Component.displayName = 'UnknownContainerCard';

interface Props {
    dockerContainer: WithId<DockerContainer>;
    openAdd: (name: string) => void;
}

export const UnknownContainerCard = memo(Component);
