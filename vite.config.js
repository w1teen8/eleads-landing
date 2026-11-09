import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import i18nPrerender from './build/i18n-prerender.js';
import publicBase from './build/public-base.js';

// Корень — папка этого файла, а не process.cwd(). На Windows cwd может прийти с буквой диска
// в нижнем регистре (`c:\…` из VS Code / Git Bash), а модули Vite резолвит с заглавной (`C:/…`):
// ключи html-proxy расходятся, и сборка падает с «No matching HTML proxy module».
export const projectRoot = fileURLToPath(new URL('.', import.meta.url))
  .replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`)
  .replace(/[\\/]$/, '');

// GitHub Pages отдаёт сайт из подпапки: BASE_PATH=/eleads-landing/ в workflow. Локально и в `npm run check` — «/».
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  root: projectRoot,
  base,
  plugins: [i18nPrerender(), publicBase()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 4096,
  },
});
