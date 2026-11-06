// Язык и тексты. Украинский уже вписан в HTML при сборке (build/i18n-prerender.js),
// здесь — загрузка словаря, подстановка в [data-i18n] / [data-i18n-attr] и переключение без перезагрузки.

const STORAGE_KEY = 'eleads-lang';
const LANGS = ['ua', 'en'];
const HTML_LANG = { ua: 'uk', en: 'en' };

const loaders = {
  ua: () => import('../data/content.ua.json'),
  en: () => import('../data/content.en.json'),
};

const dicts = {};
const listeners = new Set();
const warned = new Set();
let current = 'ua';

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(value) ? value : null;
  } catch {
    return null;
  }
}

function store(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* приватный режим — выбор живёт до перезагрузки */
  }
}

async function load(lang) {
  if (dicts[lang]) return dicts[lang];
  try {
    const mod = await loaders[lang]();
    dicts[lang] = mod.default || mod;
  } catch (err) {
    console.error(`[i18n] не удалось загрузить src/data/content.${lang}.json — проверьте синтаксис JSON. ${err.message}`);
    dicts[lang] = {};
  }
  return dicts[lang];
}

function lookup(dict, path) {
  return path.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);
}

function syncHtml() {
  const html = document.documentElement;
  html.lang = HTML_LANG[current];
  html.dataset.lang = current;
}

/** Читает localStorage → <html lang> → грузит словарь; если язык не украинский — перерисовывает. */
export async function initI18n() {
  const fromHtml = document.documentElement.lang === 'en' ? 'en' : 'ua';
  current = readStored() || fromHtml;
  await load(current);
  if (current !== 'ua') applyTranslations(document.documentElement);
  syncHtml();
}

/** "hero.title" → строка/массив/объект; нет ключа → возвращает сам path и пишет в консоль. */
export function t(path) {
  const value = lookup(dicts[current], path);
  if (value === undefined) {
    if (!warned.has(`${current}:${path}`)) {
      warned.add(`${current}:${path}`);
      console.warn(`[i18n] нет ключа «${path}» в content.${current}.json`);
    }
    return path;
  }
  return value;
}

export function getLang() {
  return current;
}

/** Грузит словарь, перерисовывает тексты на месте, пишет localStorage, меняет <html lang>. */
export async function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  await load(lang);
  const changed = lang !== current;
  current = lang;
  store(lang);
  syncHtml();
  if (!changed) return;
  applyTranslations(document.documentElement);
  for (const fn of listeners) {
    try {
      fn(lang);
    } catch (err) {
      console.error('[i18n] ошибка в подписчике onLangChange', err);
    }
  }
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Проходит по [data-i18n] и [data-i18n-attr] внутри root (включая сам root). */
export function applyTranslations(root) {
  if (!root) return;
  const pick = (sel) => [...(root.matches?.(sel) ? [root] : []), ...root.querySelectorAll(sel)];

  for (const node of pick('[data-i18n]')) {
    const value = t(node.dataset.i18n);
    if (typeof value === 'string' && node.textContent !== value) node.textContent = value;
  }

  for (const node of pick('[data-i18n-attr]')) {
    for (const pair of node.dataset.i18nAttr.split(';')) {
      const [attr, path] = pair.split(':').map((s) => s && s.trim());
      if (!attr || !path) continue;
      const value = t(path);
      if (typeof value === 'string') node.setAttribute(attr, value);
    }
  }
}
