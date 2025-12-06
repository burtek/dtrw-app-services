// @ts-check
import { prepareConfig, config } from '@dtrw/eslint-config';


export default config(
    ...prepareConfig({
        jest: true,
        node: true,
        json: { additionalFiles: { jsonc: ['tsconfig.*.json'] } }
    }),
    {
        files: ['**/*.{mjs,js,jsx,ts,tsx,mts}'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        settings: { 'import/resolver': { typescript: true } }
    },
    { rules: { 'new-cap': 'off' } }, // for nestjs decorators
    { ignores: ['dist', 'node_modules'] }
);
