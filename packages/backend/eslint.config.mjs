// @ts-check
import { prepareConfig, config } from '@dtrw/eslint-config';


export default config(
    ...prepareConfig({
        jest: true,
        node: true,
        json: { additionalFiles: { jsonc: ['tsconfig.*.json'] } }
    }),
    {
        files: ['**/*.{js,jsx,ts,tsx,mts}'],
        languageOptions: { parserOptions: { projectService: true } },
        settings: { 'import/resolver': { typescript: true } }
    },
    { rules: { 'new-cap': 'off' } }, // for nestjs decorators
    { ignores: ['dist', 'node_modules'] }
);
