import { Badge as RadixBadge } from '@radix-ui/themes';
import { memo } from 'react';

import { Prefix } from '../consts';
import { containerConfigByType } from '../containers/containers-types';
import type { Container } from '../types';


const Component = (props: BadgeProps) => {
    const makeProps = (
        color: React.ComponentProps<typeof RadixBadge>['color'] = 'gray',
        variant: React.ComponentProps<typeof RadixBadge>['variant'] = 'surface'
    ) => ({
        color,
        variant,
        style: { cursor: 'context-menu' },
        onClick: props.onClick
    });

    switch (props.type) {
        case 'project_slug':
            return (
                <RadixBadge {...makeProps(props.planned ? 'gray' : 'blue')}>
                    {`${Prefix.PROJECT_SLUG}${props.slug}`}
                </RadixBadge>
            );
        case 'container_type':
            return (
                <RadixBadge {...makeProps(containerConfigByType(props.containerType)?.color, props.containerType === 'standalone' ? 'soft' : undefined)}>
                    {props.label ?? props.containerType}
                </RadixBadge>
            );
        case 'username':
            return (
                <RadixBadge {...makeProps(props.disabled ? 'gray' : 'orange')}>
                    {`${Prefix.USERNAME}${props.name}`}
                </RadixBadge>
            );
        case 'usergroup':
            return (
                <RadixBadge {...makeProps(props.userDisabled ? 'gray' : 'gold')}>
                    {`${Prefix.USERGROUP}${props.group}`}
                </RadixBadge>
            );
    }

    return null;
};
Component.displayName = 'Badge';

interface SlugProps {
    type: 'project_slug';
    slug: string;
    planned?: boolean;
    onClick?: () => void;
}

interface ContainerProps {
    type: 'container_type';
    containerType: Container['type'];
    label?: string;
    onClick?: () => void;
}

interface UserProps {
    type: 'username';
    name: string;
    disabled?: boolean;
    onClick?: () => void;
}

interface UserGroupProps {
    type: 'usergroup';
    group: string;
    userDisabled?: boolean;
    onClick?: () => void;
}

export type BadgeProps = SlugProps | ContainerProps | UserProps | UserGroupProps;

export const Badge = memo(Component);
