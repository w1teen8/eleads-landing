import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import i18nPrerender from './build/i18n-prerender.js';

// Корень — папка этого файла, а не process.cwd(). На Windows cwd может прийти с буквой диска
// в нижнем регистре (`c:\…` из VS Code / Git Bash), а модули Vite резолвит с заглавной (`C:/…`):
// ключи html-proxy расходятся, и сборка падает с «No matching HTML proxy module».
export const projectRoot = fileURLToPath(new URL('.', import.meta.url))
  .replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`)
  .replace(/[\\/]$/, '');

export default defineConfig({
  root: projectRoot,
  plugins: [i18nPrerender()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 4096,
  },
});
