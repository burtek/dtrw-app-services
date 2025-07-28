// @ts-check
import { prepareConfig, config } from '@dtrw/eslint-config';


export default config(
    ...prepareConfig({
        jest: { mode: 'vitest' },
        json: { additionalFiles: { jsonc: ['tsconfig.*.json'] } },
        react: true,
        testingLibrary: true
    }),
    {
        files: ['**/*.{js,jsx,ts,tsx,mts}'],
        languageOptions: {
            globals: { JSX: 'readonly' },
            parserOptions: { projectService: true }
        },
        settings: { 'import/resolver': { typescript: true } }
    },
    { ignores: ['dist', 'node_modules'] }
);
