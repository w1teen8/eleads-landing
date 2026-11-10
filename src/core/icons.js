// Контурные иконки ниш — один источник для плиток блока 03 и карточек кейсов блока 06 (пути не копируются).
// Чистый модуль без DOM: его читают и браузер (cases.js), и сборка (build/i18n-prerender.js вписывает иконки
// в разметку, чтобы плитки ниш были с иконками и без JS).
//
// В разметке:  <svg class="niches__icon" data-icon="car"></svg>   → при сборке получает атрибуты и содержимое.
// В коде:      iconSvg('car', 'cases__icon-svg')                    → строка с готовым <svg>.

/** Содержимое <svg viewBox="0 0 24 24"> по ключу иконки. */
export const ICONS = {
  briefcase: '<path d="M3 7h18v13H3zM9 7V4h6v3M3 12h18" />',
  person: '<circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />',
  coin: '<circle cx="12" cy="12" r="9" /><path d="M9.5 7.5h4a2.2 2.2 0 0 1 0 4.5h-4zm0 4.5h4.7a2.2 2.2 0 0 1 0 4.5H9.5zM11.5 5.5v2m0 9v2" />',
  cap: '<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5" />',
  car: '<path d="M1.8 15.8v-2.3c0-.7.5-1.3 1.2-1.4l3-.5 2.3-3.5c.3-.5.8-.7 1.3-.7h5.2c.5 0 1 .2 1.3.6l2.9 3.6 2.2.5c.8.2 1.4.9 1.4 1.7v2c0 .4-.3.7-.7.7H20.3M3.7 16.5H1.8v-.7M8.7 16.5h6.6" /><path d="M6.3 11.5h12.4M11.8 7.5v4" /><circle cx="6.2" cy="16.5" r="2.2" /><circle cx="17.8" cy="16.5" r="2.2" />',
  chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" />',
  cloud: '<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 18 18z" />',
  plane: '<path d="M21 4 3 11l6 2 2 6 3-4 5 4z" />',
};

/** Иконка, когда ключ не задан или неизвестен. */
export const FALLBACK_ICON = 'briefcase';

/** Общие атрибуты контурной иконки: цвет — currentColor, прозрачность задаёт CSS на весь svg, не на обводку. */
export const ICON_ATTRS =
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

/** Ключ, который точно есть в ICONS: неизвестный и пустой → FALLBACK_ICON. */
export function iconKey(key) {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(ICONS, key) ? key : FALLBACK_ICON;
}

/** Готовый <svg> строкой: iconSvg('car', 'cases__icon-svg'). className — только буквы, цифры, дефис, подчёркивание, пробел. */
export function iconSvg(key, className = '') {
  const cls = /^[\w\- ]+$/.test(className) ? ` class="${className}"` : '';
  return `<svg${cls} ${ICON_ATTRS}>${ICONS[iconKey(key)]}</svg>`;
}

const PLACEHOLDER = /<svg\b([^>]*?)\sdata-icon="([^"]*)"([^>]*)>\s*<\/svg>/g;

/**
 * Разметка: пустой <svg … data-icon="ключ"></svg> получает общие атрибуты и содержимое иконки (data-icon остаётся).
 * Неизвестный ключ — ошибка со списком: опечатка в разметке не должна молча стать портфелем.
 */
export function inlineIcons(html) {
  const unknown = [];
  const out = html.replace(PLACEHOLDER, (tag, before, key, after) => {
    if (!Object.prototype.hasOwnProperty.call(ICONS, key)) {
      unknown.push(key);
      return tag;
    }
    return `<svg${before} data-icon="${key}"${after} ${ICON_ATTRS}>${ICONS[key]}</svg>`;
  });
  if (unknown.length) throw new Error(`[icons] нет иконки с ключом: ${[...new Set(unknown)].join(', ')}`);
  return out;
}
