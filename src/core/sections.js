// Какие секции страницы включены: src/data/config.json → "sections": { "enabled": ["hero", …] }.
// Шапка и заставка включены всегда. Нет списка — включено всё. Отключённая секция остаётся в index.html, но
// получает `hidden` ещё при сборке (build/i18n-prerender.js → disableSections), main.js не зовёт её init и убирает
// узел из DOM до старта движения — её анимации, ScrollTrigger, canvas и бегущие строки не создаются.
// Включить обратно — дописать имя в "enabled".
export const ALWAYS_ON = ['header', 'preloader'];

/** true — секцию с data-section="name" показывать и инициализировать. */
export function isSectionEnabled(name, config) {
  if (ALWAYS_ON.includes(name)) return true;
  const list = config?.sections?.enabled;
  return !Array.isArray(list) || list.includes(name);
}

const SECTION_TAG = /<(section|footer|div|aside|nav)\b([^>]*\sdata-section="([\w-]+)"[^>]*)>/g;
const ANCHOR_ITEM = /<li\b([^>]*)>(\s*<a\b[^>]*\shref="#([\w-]+)")/g;

/** html → html: у отключённых секций `hidden`, пункты навигации со ссылкой на них — тоже `hidden`. */
export function disableSections(html, config) {
  const off = new Set();
  const out = html.replace(SECTION_TAG, (tag, name, attrs, section) => {
    if (isSectionEnabled(section, config)) return tag;
    const id = attrs.match(/\sid="([\w-]+)"/)?.[1];
    if (id) off.add(id);
    return /\shidden(\s|=|$)/.test(attrs) ? tag : `<${name}${attrs} hidden>`;
  });
  if (!off.size) return out;
  return out.replace(ANCHOR_ITEM, (item, attrs, link, id) =>
    off.has(id) && !/\shidden(\s|=|$)/.test(attrs) ? `<li${attrs} hidden>${link}` : item,
  );
}
