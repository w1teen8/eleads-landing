// vite-plugin-public-base — сайт в подпапке (GitHub Pages: base = /eleads-landing/).
// Vite сам переписывает src / srcset / href / poster на файлы public/, но не data-* (data-src, data-srcset,
// data-poster, data-src-desktop …), по которым JS грузит медиа позже. Этот плагин после Vite проходит
// по всем атрибутам index.html и добавляет base к корневым ссылкам на файлы public/. При base «/» — ничего.
import { readdirSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Чистая функция: html + base + имена верхнего уровня public/ (`img`, `video`, `favicon.svg` …) → html.
 * Переписывает начало значения атрибута и элементы srcset после запятой; уже переписанные
 * (`/eleads-landing/img/…`), внешние (`https://…`) и якоря (`#cases`) не трогает.
 */
export function rebasePublicUrls(html, base, entries) {
  if (!base || base === '/' || !entries.length) return html;
  const prefix = base.endsWith('/') ? base : `${base}/`;
  const names = entries.map(escapeRe).join('|');
  const url = new RegExp(`(=\\s*["']|,\\s*)/(?=(?:${names})(?:[/"'?#\\s,]))`, 'g');
  return html.replace(/<[a-zA-Z][^>]*>/g, (tag) => tag.replace(url, `$1${prefix}`));
}

export default function publicBase() {
  let base = '/';
  let publicDir = '';
  return {
    name: 'vite-plugin-public-base',
    configResolved(resolved) {
      base = resolved.base;
      publicDir = resolved.publicDir || resolvePath(resolved.root, 'public');
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        let entries = [];
        try {
          entries = readdirSync(publicDir).filter((name) => !name.startsWith('.'));
        } catch {
          return html;
        }
        return rebasePublicUrls(html, base, entries);
      },
    },
  };
}
