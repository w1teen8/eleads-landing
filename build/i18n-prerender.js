// vite-plugin-i18n-prerender — вписывает украинский текст из content.ua.json в узлы [data-i18n]
// и атрибуты [data-i18n-attr] прямо в index.html, при `dev` и при `build`.
// Итог: страница читается без JS и индексируется, а в исходнике разметки фраз нет.
//
// Разметка:
//   <h2 data-i18n="stats.title"></h2>                      → текст узла
//   <button data-i18n-attr="aria-label:nav.menuOpen">       → атрибуты, пары через «;»
//   href="{{config.telegramUrl}}"                            → значение из config.json
//   <phone-frame class="x">экран</phone-frame>               → общий телефон (src/core/phone.js)
import { existsSync, readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { disableSections } from '../src/core/sections.js';
import { inlineIcons } from '../src/core/icons.js';
import { expandPhones } from '../src/core/phone.js';

const TEXT_NODE = /<([a-zA-Z][\w-]*)((?:\s[^>]*?)?)(\sdata-i18n=")([^"]+)("[^>]*)>([^<]*)<\/\1>/g;
const ATTR_TAG = /<[a-zA-Z][^>]*\sdata-i18n-attr="([^"]+)"[^>]*>/g;
const CONFIG_TOKEN = /\{\{\s*config\.([a-zA-Z0-9_.]+)\s*\}\}/g;

/** "hero.stats.years.value" → значение из словаря или undefined. Числовые сегменты — индексы массива. */
export function lookup(dict, path) {
  return path.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);
}

const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => escapeText(s).replace(/"/g, '&quot;');

/**
 * Чистая функция: html + словарь + конфиг → html с текстами.
 * strict: true — отсутствующий ключ или нестроковое значение = ошибка со списком ключей (сборка).
 * strict: false — ключ остаётся видимым текстом, предупреждение через warn (dev).
 */
export function prerender(html, dict, config = {}, { strict = false, warn = console.warn } = {}) {
  const missing = [];
  const text = (path) => {
    const value = lookup(dict, path);
    if (typeof value === 'string') return value;
    missing.push(path);
    return path;
  };

  // иконки ниш: пустой <svg data-icon="ключ"></svg> получает содержимое из src/core/icons.js
  // телефоны: короткий шаблон <phone-frame> → рамка, строка состояния, блик (src/core/phone.js) — до текстов
  html = expandPhones(html);
  let out = inlineIcons(html).replace(CONFIG_TOKEN, (token, path) => {
    const value = lookup(config, path);
    if (typeof value === 'string') return escapeAttr(value);
    missing.push(`config.${path}`);
    return token;
  });

  out = out.replace(ATTR_TAG, (tag, spec) => {
    let result = tag;
    for (const pair of spec.split(';')) {
      const [attr, path] = pair.split(':').map((s) => s && s.trim());
      if (!attr || !path) continue;
      const value = escapeAttr(text(path));
      const existing = new RegExp(`(\\s${attr}=)"[^"]*"`);
      if (existing.test(result)) {
        result = result.replace(existing, `$1"${value}"`);
      } else {
        result = result.replace(/\sdata-i18n-attr=/, ` ${attr}="${value}" data-i18n-attr=`);
      }
    }
    return result;
  });

  out = out.replace(TEXT_NODE, (node, tagName, before, attrStart, key, after) =>
    `<${tagName}${before}${attrStart}${key}${after}>${escapeText(text(key))}</${tagName}>`,
  );

  if (missing.length) {
    const message = `[i18n-prerender] нет строкового значения для ключей: ${[...new Set(missing)].join(', ')}`;
    if (strict) throw new Error(message);
    warn(message);
  }
  return out;
}

function readJson(file) {
  const raw = readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`[i18n-prerender] битый JSON в ${file}: ${err.message}`);
  }
}

export default function i18nPrerender({
  dict = 'src/data/content.ua.json',
  config = 'src/data/config.json',
} = {}) {
  let root = process.cwd();
  let isBuild = false;
  let logger = console;

  return {
    name: 'vite-plugin-i18n-prerender',
    configResolved(resolved) {
      root = resolved.root;
      isBuild = resolved.command === 'build';
      logger = resolved.logger;
    },
    handleHotUpdate({ file, server }) {
      const norm = (p) => p.split('\\').join('/');
      const watched = [dict, config].map((f) => norm(resolvePath(root, f)));
      if (watched.includes(norm(file))) server.ws.send({ type: 'full-reload' });
    },
    // Без robots.txt хостинг отдаёт index.html, и Lighthouse/поисковики читают разметку как «ошибки robots». Файл — разрешить всё, без выдуманного домена.
    generateBundle() {
      if (!existsSync(resolvePath(root, 'public/robots.txt'))) {
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: 'User-agent: *\nAllow: /\n' });
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        try {
          const strings = readJson(resolvePath(root, dict));
          const settings = readJson(resolvePath(root, config));
          return prerender(disableSections(html, settings), strings, settings, {
            strict: isBuild,
            warn: (msg) => logger.warn(msg),
          });
        } catch (err) {
          if (isBuild) throw err;
          logger.error(err.message);
          return html;
        }
      },
    },
  };
}
