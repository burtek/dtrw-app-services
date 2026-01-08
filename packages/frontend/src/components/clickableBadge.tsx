import { Badge } from '@radix-ui/themes';
import { memo, useCallback } from 'react';

import { Prefix } from '../consts';
import { containerConfigByType } from '../containers/containers-types';
import { useSearchSetterContext } from '../search/context';
import type { Container } from '../types';


export const Component = (props: ClickableBadgeProps) => {
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

    const makeProps = (
        color: React.ComponentProps<typeof Badge>['color'] = 'gray',
        variant: React.ComponentProps<typeof Badge>['variant'] = 'surface'
    ) => ({
        color,
        variant,
        style: { cursor: 'context-menu' },
        onClick: handleClick
    });

    switch (props.type) {
        case 'project_slug':
            return (
                <Badge {...makeProps(props.planned ? 'gray' : 'blue')}>
                    {`${Prefix.PROJECT_SLUG}${props.slug}`}
                </Badge>
            );
        case 'container_type':
            return (
                <Badge {...makeProps(containerConfigByType(props.containerType)?.color, props.containerType === 'standalone' ? 'soft' : undefined)}>
                    {props.label ?? props.containerType}
                </Badge>
            );
        case 'username':
            return (
                <Badge {...makeProps(props.disabled ? 'gray' : 'orange')}>
                    {`${Prefix.USERNAME}${props.name}`}
                </Badge>
            );
        case 'usergroup':
            return (
                <Badge {...makeProps(props.userDisabled ? 'gray' : 'gold')}>
                    {`${Prefix.USERGROUP}${props.group}`}
                </Badge>
            );
    }

    return null;
};
Component.displayName = 'ClickableBadge';

interface SlugProps {
    type: 'project_slug';
    slug: string;
    planned?: boolean;
}

interface ContainerProps {
    type: 'container_type';
    containerType: Container['type'];
    label?: string;
}

interface UserProps {
    type: 'username';
    name: string;
    disabled?: boolean;
}

interface UserGroupProps {
    type: 'usergroup';
    group: string;
    userDisabled?: boolean;
}

type ClickableBadgeProps = SlugProps | ContainerProps | UserProps | UserGroupProps;

export const ClickableBadge = memo(Component);
