import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';


// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        // development only
        proxy: {
            '/api/docker/containers': {
                target: 'https://services.dtrw.ovh/',
                changeOrigin: true
            },
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api/, '')
            }
        },
        port: 3000
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './setup-tests.ts',
        environmentOptions: { jsdom: { url: 'http://localhost/' } }
    }
});
