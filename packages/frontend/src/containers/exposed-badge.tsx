import { GlobeIcon } from '@radix-ui/react-icons';
import { Tooltip, Badge } from '@radix-ui/themes';
import { memo } from 'react';


const Component = ({ text }: { text: string }) => (
    <Tooltip content={text}>
        <Badge
            color="red"
            variant="surface"
        >
            <GlobeIcon />
            {' '}
            EXPOSED
        </Badge>
    </Tooltip>
);
Component.displayName = 'ExposedBadge';

export const ExposedBadge = memo(Component);
