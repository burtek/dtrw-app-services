import { env } from '../config';

import type { CaddyConfigProject, CaddyConfigStandalone } from './caddy.schema';


export const compileTemplate = (routes: Route[]) => render([
    block(null,
        dir('email', env.CADDYFILE_ADMIN),
        dir('acme_dns', 'cloudflare', '{env.CLOUDFLARE_API_TOKEN}'),
        block('servers',
            dir('trusted_proxies', 'static', 'private_ranges')),
        dir('admin', ':2019')),
    ...routes.filter(route => route.mode === 'standalone')
        .flatMap<CaddyNode>(route => [
            { type: 'emptyline' },
            standaloneBlock({
                hosts: route.urls,
                target: route.target,
                auth: route.auth === 'enabled'
            })
        ]),
    { type: 'emptyline' },
    block('(withauth)',
        block(`forward_auth ${routes.find((route): route is StandaloneRoute => route.mode === 'standalone' && route.auth === 'provider')?.target}`,
            dir('uri', '/api/authz/forward-auth'),
            dir('copy_headers', 'Remote-User', 'Remote-Groups', 'Remote-Email', 'Remote-Name'))),
    { type: 'emptyline' },
    block('(service)',
        dir('encode', 'zstd', 'gzip'),
        { type: 'emptyline' },
        block('handle_path /api/*',
            dir('reverse_proxy', '{args[1]}')),
        { type: 'emptyline' },
        block('handle',
            dir('reverse_proxy', '{args[0]}'))),
    { type: 'emptyline' },
    ...routes.flatMap<CaddyNode>(route => {
        switch (route.mode) {
            case 'standalone':
                return { type: 'noop' }; // handled earlier
            case 'project':
                return projectBlock({
                    hosts: route.urls,
                    frontend: route.frontend,
                    backend: route.backend,
                    auth: route.auth === 'enabled'
                });
        }
        return { type: 'noop' };
    })
]);

interface StandaloneRoute {
    urls: [string, ...string[]];
    mode: 'standalone';
    auth: CaddyConfigStandalone['auth'];
    target: string;
}
interface ProjectRoute {
    urls: [string, ...string[]];
    mode: 'project';
    auth: CaddyConfigProject['auth'];
    backend: string;
    frontend: string;
}

export type Route = StandaloneRoute | ProjectRoute;

// INTERNALS

type CaddyNode = Directive | Block | { type: 'noop' } | { type: 'emptyline' };

interface Directive {
    type: 'directive';
    name: string;
    args?: string[];
}

interface Block {
    type: 'block';
    header: string | null;
    body: CaddyNode[];
}

function dir(name: string, ...args: string[]): Directive {
    return { type: 'directive', name, args };
}
function block(header: string | null, ...body: CaddyNode[]): Block {
    return { type: 'block', header, body };
}

function projectBlock(cfg: {
    hosts: string[];
    frontend: string;
    backend: string;
    auth: boolean;
}): Block {
    return block(
        cfg.hosts.join(' '),
        ...cfg.auth ? [dir('import', 'withauth')] : [],
        dir('import', 'service', cfg.frontend, cfg.backend)
    );
}
function standaloneBlock(cfg: {
    hosts: string[];
    target: string;
    auth: boolean;
}): Block {
    return block(
        cfg.hosts.join(' '),
        ...cfg.auth ? [dir('import', 'withauth')] : [],
        dir('reverse_proxy', cfg.target)
    );
}

function render(nodes: CaddyNode[], indent = 0): string {
    const pad = '  '.repeat(indent);

    return nodes.map(node => {
        switch (node.type) {
            case 'directive':
                return `${pad}${node.name}${node.args?.length ? ` ${node.args.join(' ')}` : ''}`;
            case 'block':
                return `${pad}${node.header === null ? '' : `${node.header} `}{\n${render(node.body, indent + 1)}\n${pad}}`;
            case 'emptyline':
                return '';
            case 'noop':
                return null;
        }
        return null;
    }).filter(x => x !== null).join('\n');
}
