import { defineConfig } from 'vitest/config';


// https://vite.dev/config/
export default defineConfig({
    resolve: { alias: { tests: '/tests' } },
    test: {
        globals: true,
        environment: 'node',
        env: {
            DB_FILE_NAME: ":memory:"
        }
    }
});
