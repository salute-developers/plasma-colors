import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// GitHub Pages project sites are served at https://<user>.github.io/<repo>/
const base = process.env.GITHUB_REPOSITORY ?
    `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/';
export default defineConfig({
    base,
    plugins: [react()],
});
