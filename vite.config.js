import { defineConfig } from 'vite';
import i18nPrerender from './build/i18n-prerender.js';

export default defineConfig({
  plugins: [i18nPrerender()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 4096,
  },
});
