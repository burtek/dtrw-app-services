import type { FastifyInstance, FastifyPluginCallback } from 'fastify';


const kPluginMeta = Symbol.for('plugin-meta');

interface PluginEntry {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugin: FastifyPluginCallback<any>;
    opts?: unknown;
    name: string;
    dependencies: string[];
}

interface PluginMeta {
    name: string;
    dependencies: string[];
}

function assertHasMeta(plugin: object): asserts plugin is { [kPluginMeta]: PluginMeta } {
    if (!(kPluginMeta in plugin)
        || typeof plugin[kPluginMeta] !== 'object'
        || plugin[kPluginMeta] === null
        || !('name' in plugin[kPluginMeta])
        || typeof plugin[kPluginMeta].name !== 'string'
        || !('dependencies' in plugin[kPluginMeta])
        || !Array.isArray(plugin[kPluginMeta].dependencies)
        || !plugin[kPluginMeta].dependencies.every(dep => typeof dep === 'string')
    ) {
        throw new Error('Fastify plugin is missing metadata. Did you forget to wrap it with fp()?');
    }
}
function getPluginMeta<T extends Record<string, unknown>>(plugin: FastifyPluginCallback<T>) {
    assertHasMeta(plugin);
    return plugin[kPluginMeta];
}

function topoSort(entries: PluginEntry[]): PluginEntry[] {
    const byName = new Map<string, PluginEntry>();
    const graph = new Map<string, Set<string>>(); // name -> deps

    for (const e of entries) {
        byName.set(e.name, e);
    }

    for (const e of entries) {
        const deps = e.dependencies.filter(d => byName.has(d));
        graph.set(e.name, new Set(deps));
    }

    const result: PluginEntry[] = [];
    const ready = [...graph.entries()]
        .filter(([, deps]) => deps.size === 0)
        .map(([name]) => name);

    while (ready.length) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const name = ready.pop() as string;
        const entry = byName.get(name);
        if (entry) {
            result.push(entry);
        }

        for (const [n, deps] of graph) {
            if (deps.delete(name) && deps.size === 0) {
                ready.push(n);
            }
        }
    }

    const unresolved = [...graph.values()].some(d => d.size > 0);
    if (unresolved) {
        throw new Error('Fastify plugin dependency cycle detected');
    }

    return result;
}

export function createPluginRegistry(fastify: FastifyInstance) {
    let registered = false;
    const entries: PluginEntry[] = [];

    const registry = {
        use<T extends Record<string, unknown>>(plugin: FastifyPluginCallback<T>, opts?: T) {
            if (registered) {
                throw new Error('Cannot add new plugins after registerAll has been called');
            }

            const { name, dependencies } = getPluginMeta(plugin);

            entries.push({ plugin, opts, name, dependencies });

            return registry;
        },
        registerAll() {
            if (registered) {
                throw new Error('registerAll has already been called');
            }
            registered = true;
            const ordered = topoSort(entries);

            for (const { plugin, opts } of ordered) {
                fastify.register(plugin, opts);
            }
        }
    };

    return registry;
}
