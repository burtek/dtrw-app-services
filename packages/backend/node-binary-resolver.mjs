// import { existsSync } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';


/**
 * @returns {import('rollup').Plugin}
 */
export function nodeBinaryResolver() {
    const PREFIX = '\0node-binary-resolver:';

    return {
        name: 'node-binary-resolver',

        resolveId(source, importer) {
            if (!source || !source.endsWith('.node')) {
                return null;
            }

            const resolved = importer ? resolve(dirname(importer), source) : resolve(source);
            // Mark with a null-prefixed ID so Rollup won't try to load from FS directly
            // console.log({ importer, source, resolved });
            return PREFIX + resolved;
        },

        async load(id) {
            if (!id.startsWith(PREFIX)) {
                return null;
            }

            const resolved = id.slice(PREFIX.length);
            try {
                await access(resolved); // throw if not accessible
            } catch (err) {
                for (let i = 0, path = dirname(resolved); i < 5; i++, path = dirname(path)) {
                    // console.log({ path, exists: existsSync(path) });
                }
                throw err;
            }
            const base = basename(resolved);

            // Emit into `bin/` under the output directory (e.g. dist/bin/<name>)
            // Using fileName ensures the asset will be written to `dist/bin/<base>`
            this.emitFile({
                type: 'asset',
                fileName: `bin/${base}`,
                source: await readFile(resolved)
            });

            // Return a small CommonJS module that, at runtime, searches upward
            // from __dirname for a `bin/<base>` file (works with preserveModules).
            // It exports the resolved path as module.exports and exports.default.
            const code = `
const { join } = require('path');
const { existsSync } = require('fs');

function findBin(filename) {
  let dir = __dirname;
  for (let i = 0; i < 15; i++) {
    const candidate = join(dir, 'bin', filename);
    if (existsSync(candidate)) return candidate;
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return join(__dirname, 'bin', filename);
}

const BINARY_PATH = findBin(${JSON.stringify(base)});
const _binding = require(BINARY_PATH);
module.exports = _binding;
try { module.exports.default = _binding; } catch (e) {}
try { module.exports.__esModule = true; } catch (e) {}
`;

            return code;
        }
    };
}
