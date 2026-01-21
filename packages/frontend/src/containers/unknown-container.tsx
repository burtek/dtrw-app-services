import { PlusIcon } from '@radix-ui/react-icons';
import { Box, Button, Card, Flex, Grid, Text, Tooltip } from '@radix-ui/themes';
import { memo, useCallback } from 'react';

import type { DockerContainer, WithId } from '../types';

import { getTooltipContent } from './container-details-tooltip';
import styles from './containers.module.scss';
import { ExposedBadge } from './exposed-badge';


const Component = ({ dockerContainer, openAdd }: Props) => {
    const [mainName] = dockerContainer.names;
    const handleAdd = useCallback(
        () => {
            openAdd(mainName.replace(/^\/+/, ''));
        },
        [openAdd, mainName]
    );

    const exposed = dockerContainer.ports.some(p => !!p.publicPort);

    return (
        <Box>
            <Card className={styles.container}>
                <Flex gap="1">
                    <Text
                        as="div"
                        weight="bold"
                    >
                        {mainName}
                    </Text>
                    {exposed ? <ExposedBadge text="Container is exposed to the world" /> : null}
                </Flex>
                <Grid
                    gap="1"
                    columns="3fr 2fr 1fr"
                >
                    <Tooltip
                        content={getTooltipContent(dockerContainer)}
                        maxWidth="800px"
                    >
                        <Text as="div">{dockerContainer.image}</Text>
                    </Tooltip>
                    <Text as="div">
                        {dockerContainer.status}
                    </Text>
                    <Text as="div">
                        {dockerContainer.state}
                    </Text>
                </Grid>
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
    dockerContainer: WithId<DockerContainer, string>;
    openAdd: (name: string) => void;
}

export const UnknownContainerCard = memo(Component);
