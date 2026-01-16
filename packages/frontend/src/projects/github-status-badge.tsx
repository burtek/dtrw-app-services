import { Badge, Link } from '@radix-ui/themes';
import { memo, useMemo } from 'react';

import type { Workflow } from '../types';


const getConfig = (status: Workflow['status'], conclusion: Workflow['conclusion']): { color: React.ComponentProps<typeof Badge>['color']; icon: string } => {
    if (status === 'in_progress') {
        return { color: 'blue', icon: '⏳' };
    }
    if (status === 'queued') {
        return { color: 'orange', icon: '⏳' };
    }
    switch (conclusion) {
        case 'success':
            return { color: 'green', icon: '✅' };
        case 'failure':
            return { color: 'red', icon: '❌' };
        case 'timed_out':
            return { color: 'red', icon: '⏳' };
        case 'cancelled':
            return { color: 'gray', icon: '🚫' };
        case 'action_required':
            return { color: 'orange', icon: '⚠️' };
        case 'neutral':
            return { color: 'gray', icon: '➖' };
        case 'skipped':
            return { color: 'gray', icon: '⏭️' };
        case null:
            return { color: 'gray', icon: '❓' };
    }
    return { color: 'gray', icon: '❓' };
};

const Component = ({ workflow }: GithubStatusBadgeProps) => {
    const config = useMemo(() => getConfig(workflow.status, workflow.conclusion), [workflow.status, workflow.conclusion]);

    return (
        <Link
            href={workflow.html_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
        >
            <Badge color={config.color}>
                {config.icon}
                {' '}
                {workflow.name}
            </Badge>
        </Link>
    );
};
Component.displayName = 'GithubStatusBadge';

export const GithubStatusBadge = memo(Component);

interface GithubStatusBadgeProps {
    workflow: Workflow;
}
