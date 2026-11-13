// Какие секции страницы включены: src/data/config.json → "sections".
//   "enabled": ["hero", …] — список включённых (нет списка — включено всё).
// Шапка и заставка включены всегда. Отключённая секция остаётся в index.html и скрывается ещё при сборке
// (build/i18n-prerender.js → disableSections): атрибутом `hidden` у секции и у пунктов навигации со ссылкой на неё.
// main.js не зовёт init отключённой секции и убирает её узел из DOM до старта движения — её анимации, ScrollTrigger,
// canvas и бегущие строки не создаются. Блоки возвращаются по одному — строкой в "enabled".
export const ALWAYS_ON = ['header', 'preloader'];

/** Список включённых секций: массив имён или null (= всё). */
export function sectionList(config) {
  const list = config?.sections?.enabled;
  return Array.isArray(list) ? list : null;
}

/** true — секцию с data-section="name" показывать и инициализировать. */
export function isSectionEnabled(name, config) {
  if (ALWAYS_ON.includes(name)) return true;
  const list = sectionList(config);
  return !list || list.includes(name);
}

const SECTION_TAG = /<(section|footer|div|aside|nav)\b([^>]*\sdata-section="([\w-]+)"[^>]*)>/g;
const ANCHOR_ITEM = /<li\b([^>]*)>(\s*<a\b[^>]*\shref="#([\w-]+)")/g;
const HEADER_LINK = /<a class="header__link"([^>]*)\shref="#([\w-]+)"/g;
const HAS_HIDDEN = /\shidden(\s|=|$)/;

const hide = (attrs) => (HAS_HIDDEN.test(attrs) ? attrs : `${attrs} hidden`);

/** html → html. Выключенная секция — `hidden`; пункт меню и ссылка шапки на неё — тоже `hidden`. */
export function disableSections(html, config) {
  const off = new Set(); // id выключенных секций
  const out = html.replace(SECTION_TAG, (tag, name, attrs, section) => {
    if (isSectionEnabled(section, config)) return tag;
    const id = attrs.match(/\sid="([\w-]+)"/)?.[1];
    if (id) off.add(id);
    return `<${name}${hide(attrs)}>`;
  });
  if (!off.size) return out;
  return out
    .replace(ANCHOR_ITEM, (item, attrs, link, id) => (off.has(id) ? `<li${hide(attrs)}>${link}` : item))
    .replace(HEADER_LINK, (link, attrs, id) => (off.has(id) ? `<a class="header__link"${hide(attrs)} href="#${id}"` : link));
}
