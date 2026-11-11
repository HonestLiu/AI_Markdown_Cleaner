import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: [{
            find: /^mermaid$/,
            replacement: decodeURIComponent(new URL('./node_modules/mermaid/dist/mermaid.core.mjs', import.meta.url).pathname),
        }],
    },
    build: { target: 'es2022' },
});
