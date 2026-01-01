import type { Badge } from '@radix-ui/themes';
import type { ComponentProps } from 'react';

import type { Container } from '../types';


export const CONTAINERS_CONFIGS: { type: Container['type']; prefix?: string; color: ComponentProps<typeof Badge>['color'] }[] = [
    { type: 'backend', prefix: 'backend', color: 'blue' },
    { type: 'frontend', prefix: 'frontend', color: 'green' },
    { type: 'database', prefix: 'db', color: 'yellow' },
    { type: 'docker-proxy', prefix: 'dproxy', color: 'red' },
    { type: 'standalone', color: 'gray' }
];

export const containerTypeByPrefix = (prefix: string): Container['type'] | null => {
    const config = CONTAINERS_CONFIGS.find(c => c.prefix === prefix);
    return config ? config.type : null;
};
export const containerConfigByType = (type: Container['type']) => CONTAINERS_CONFIGS.find(c => c.type === type) ?? null;
