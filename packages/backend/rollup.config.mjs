import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import { cleandir } from 'rollup-plugin-cleandir';
import copy from 'rollup-plugin-copy';
import sourcemaps from 'rollup-plugin-sourcemaps2';
import typescript2 from 'rollup-plugin-typescript2';

import { nodeBinaryResolver } from './node-binary-resolver.mjs';


const OUT_DIR = 'dist';

export default defineConfig({
    input: {
        index: 'index.ts',
        'drizzle.config': 'drizzle.config.ts'
    },
    output: {
        dir: OUT_DIR,
        format: 'cjs',
        sourcemap: true,
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        preserveModules: true,
        preserveModulesRoot: '.'
    },
    // external: (id, importer) => {
    //     if (!id.endsWith('.node')) {
    //         return false;
    //     }
    //     const binaryPath = pathResolve(importer, id);
    //     console.log(binaryPath);
    //     return true;
    // },
    plugins: [
        cleandir(OUT_DIR),
        alias({
            // pdf-lib esm version get transpilled to cjs with breaking circular dependency tree
            // { find: 'pdf-lib', replacement: 'pdf-lib/cjs' }
            entries: []
        }),
        sourcemaps(),
        resolve({
            extensions: ['.mjs', '.js', '.json', '.ts'],
            moduleDirectories: ['node_modules'],
            browser: false,
            preferBuiltins: true
        }),
        nodeBinaryResolver(),
        commonjs({
            include: /node_modules/,
            requireReturnsDefault: 'auto',
            ignoreDynamicRequires: true
        }),
        json(),
        typescript2({
            tsconfig: './tsconfig.build.json',
            clean: true
        }),
        copy({
            targets: [
                { src: 'src/assets/*', dest: 'dist/src/assets' },
                { src: 'drizzle/*', dest: 'dist/drizzle' },
                {
                    src: 'package.json',
                    dest: 'dist',
                    transform: contents => {
                        const pkg = JSON.parse(contents.toString());
                        return JSON.stringify({ ...pkg, type: 'commonjs' }, null, 2);
                    }
                },
                ...copyFilesForLibrary('better-sqlite3', ['build', 'package.json']),
                ...copyFilesForLibrary('bindings', ['package.json'])
            ]
        })
    ]
});

function copyFilesForLibrary(library, files) {
    let libraryPath = import.meta.resolve(library).replace('file://', '');
    do {
        libraryPath = dirname(libraryPath);
    } while (!existsSync(join(libraryPath, 'package.json')));

    return files.map(file => ({
        src: join(libraryPath, file),
        dest: join('dist', 'node_modules', file && library)
    }));
}
