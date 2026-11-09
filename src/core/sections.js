// Какие секции страницы включены: src/data/config.json → "sections".
//   "enabled": ["hero", …]          — список по умолчанию (нет списка — включено всё);
//   "byHero": { "plane": "all" }    — свой список для варианта первого экрана (data-hero на <html>): массив имён или "all".
// Шапка и заставка включены всегда. Отключённая секция остаётся в index.html и скрывается ещё при сборке
// (build/i18n-prerender.js → disableSections): выключенная во всех вариантах — атрибутом `hidden`, включённая только
// в части вариантов — атрибутом data-hero-on="plane …" и правилом <style data-hero-sections> в <head>, которое прячет
// её до первой отрисовки, как только инлайн-скрипт поставил data-hero. main.js не зовёт init отключённой секции и
// убирает её узел из DOM до старта движения — её анимации, ScrollTrigger, canvas и бегущие строки не создаются.
export const ALWAYS_ON = ['header', 'preloader'];
/** Варианты первого экрана — те же значения data-hero, что ставит инлайн-скрипт <head> (и hero.js → HERO_VARIANTS). */
export const HERO_VARIANTS = ['mockup', 'plane', 'blue'];

/** Список включённых секций для варианта: массив имён или null (= всё). */
export function sectionList(config, hero) {
  const sections = config?.sections;
  const own = hero != null ? sections?.byHero?.[hero] : undefined;
  const list = own !== undefined ? own : sections?.enabled;
  return Array.isArray(list) ? list : null;
}

/** true — секцию с data-section="name" показывать и инициализировать (hero — вариант первого экрана, необязателен). */
export function isSectionEnabled(name, config, hero) {
  if (ALWAYS_ON.includes(name)) return true;
  const list = sectionList(config, hero);
  return !list || list.includes(name);
}

/** В каких вариантах первого экрана секция включена. */
export function heroesFor(name, config) {
  return HERO_VARIANTS.filter((hero) => isSectionEnabled(name, config, hero));
}

const SECTION_TAG = /<(section|footer|div|aside|nav)\b([^>]*\sdata-section="([\w-]+)"[^>]*)>/g;
const ANCHOR_ITEM = /<li\b([^>]*)>(\s*<a\b[^>]*\shref="#([\w-]+)")/g;
const HAS_HIDDEN = /\shidden(\s|=|$)/;

/** Правило, которое прячет секции чужих вариантов до первой отрисовки. */
export function heroGateCss() {
  const rules = HERO_VARIANTS.map((hero) => `html[data-hero="${hero}"] [data-hero-on]:not([data-hero-on~="${hero}"])`);
  return `${rules.join(',')}{display:none!important}`;
}

/**
 * html → html. Секция, выключенная во всех вариантах, — `hidden`; включённая только в части — data-hero-on="…"
 * и одно правило <style data-hero-sections> перед </head>. Пункты навигации со ссылкой на секцию — так же.
 */
export function disableSections(html, config) {
  const gate = new Map(); // id секции → 'off' | 'v1 v2'
  const mark = (attrs, heroes) => {
    if (heroes.length === HERO_VARIANTS.length) return null;
    if (!heroes.length) return HAS_HIDDEN.test(attrs) ? attrs : `${attrs} hidden`;
    return `${attrs} data-hero-on="${heroes.join(' ')}"`;
  };
  let out = html.replace(SECTION_TAG, (tag, name, attrs, section) => {
    const heroes = heroesFor(section, config);
    const next = mark(attrs, heroes);
    if (next === null) return tag;
    const id = attrs.match(/\sid="([\w-]+)"/)?.[1];
    if (id) gate.set(id, heroes);
    return `<${name}${next}>`;
  });
  if (!gate.size) return out;
  out = out.replace(ANCHOR_ITEM, (item, attrs, link, id) => {
    if (!gate.has(id)) return item;
    return `<li${mark(attrs, gate.get(id))}>${link}`;
  });
  if (/\sdata-hero-on="/.test(out)) {
    out = out.replace(/<\/head>/, `<style data-hero-sections>${heroGateCss()}</style>\n</head>`);
  }
  return out;
}
