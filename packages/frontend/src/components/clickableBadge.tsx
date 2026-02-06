import { memo, useCallback } from 'react';

import { useSearchSetterContext } from '../search/context';

import type { BadgeProps } from './badge';
import { Badge } from './badge';


const Component = (props: ClickableBadgeProps) => {
    const { add: addToSearch } = useSearchSetterContext();

    const handleClick = useCallback(() => {
        switch (props.type) {
            case 'project_slug':
                addToSearch({ queryType: 'project_slug', query: props.slug });
                break;
            case 'container_type':
                addToSearch({ queryType: 'container_type', query: props.containerType });
                break;
            case 'username':
                addToSearch({ queryType: 'username', query: props.name });
                break;
            case 'usergroup':
                addToSearch({ queryType: 'usergroup', query: props.group });
                break;
        }
    }, [addToSearch, props]);

    return (
        <Badge
            {...props}
            onClick={handleClick}
        />
    );
};
Component.displayName = 'ClickableBadge';

type ClickableBadgeProps = BadgeProps & { onClick?: never };

export const ClickableBadge = memo(Component);
