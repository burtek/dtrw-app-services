import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import copy from 'rollup-plugin-copy';
import sourcemaps from 'rollup-plugin-sourcemaps2';
import typescript2 from 'rollup-plugin-typescript2';


export default defineConfig({
    input: {
        index: 'index.ts'
        // 'drizzle.config': 'drizzle.config.ts'
    },
    output: {
        dir: 'dist',
        format: 'cjs',
        sourcemap: true,
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        preserveModules: true,
        preserveModulesRoot: '.'
    },
    plugins: [
        alias({
            entries: [
                // pdf-lib esm version get transpilled to cjs with breaking circular dependency tree
                // { find: 'pdf-lib', replacement: 'pdf-lib/cjs' }
            ]
        }),
        sourcemaps(),
        resolve({
            extensions: ['.mjs', '.js', '.json', '.ts', '.node'],
            moduleDirectories: ['node_modules'],
            browser: false,
            preferBuiltins: true
        }),
        commonjs({
            include: /node_modules/,
            requireReturnsDefault: 'auto'
        }),
        json(),
        typescript2({
            tsconfig: './tsconfig.build.json',
            clean: true
        }),
        copy({
            targets: [
                // { src: 'src/assets/*', dest: 'dist/src/assets' },
                {
                    src: 'package.json',
                    dest: 'dist',
                    transform: contents => {
                        const pkg = JSON.parse(contents.toString());
                        return JSON.stringify({ ...pkg, type: 'commonjs' }, null, 2);
                    }
                }
            ]
        })
    ]
});
