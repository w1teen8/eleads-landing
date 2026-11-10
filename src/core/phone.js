// Общий телефон (T37): рамка, «островок», строка состояния, блик и кнопки на торцах — один шаблон на весь сайт.
// В index.html телефон пишется коротко: <phone-frame class="faq__phone" data-faq-phone> …экран… </phone-frame>.
// Сборка (build/i18n-prerender.js) разворачивает его в полную разметку раньше подстановки текстов — время на экране
// берётся из словаря (formats.phone.time). Внутри — только содержимое экрана под строкой состояния
// (панели блока 04 или .phone__view с чатом в блоках 13, 14). Стили — src/styles/phone.css.

const STATUS_ICONS = [
  '<svg class="phone__icon" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="0.8" /><rect x="5" y="5.5" width="3" height="6.5" rx="0.8" /><rect x="10" y="3" width="3" height="9" rx="0.8" /><rect x="15" y="0" width="3" height="12" rx="0.8" /></svg>',
  '<svg class="phone__icon" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0L8 11.5Zm-4.1-4.2L2.2 5.6a8.2 8.2 0 0 1 11.6 0l-1.7 1.7a5.8 5.8 0 0 0-8.2 0ZM.5 3.9 0 3.4a11.3 11.3 0 0 1 16 0l-1.7 1.7a8.9 8.9 0 0 0-12.6 0L.5 3.9Z" /></svg>',
  '<svg class="phone__icon phone__icon--battery" viewBox="0 0 27 12" fill="none" stroke="currentColor" aria-hidden="true"><rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke-opacity="0.45" /><rect x="2" y="2" width="19" height="8" rx="1.8" fill="currentColor" stroke="none" /><path d="M25 4v4" stroke-opacity="0.45" stroke-width="1.6" stroke-linecap="round" /></svg>',
];

const KEYS = ['mute', 'up', 'down', 'power'];

/** Тег шаблона в index.html. Вложенные телефоны не поддерживаются. */
export const PHONE_TAG = /<phone-frame\b([^>]*)>([\s\S]*?)<\/phone-frame>/g;

/** Атрибуты шаблона → атрибуты корня: класс «phone» всегда первым, свои классы — после него. */
function rootAttrs(attrs) {
  const own = attrs.match(/\sclass="([^"]*)"/);
  const rest = attrs.replace(/\sclass="[^"]*"/, '');
  const cls = ['phone', ...(own ? own[1].split(/\s+/).filter(Boolean) : [])].join(' ');
  return ` class="${cls}"${rest.replace(/\s+$/, '')}`;
}

/** Полная разметка телефона: attrs — строка атрибутов шаблона, screen — содержимое экрана под строкой состояния. */
export function phoneFrame(attrs = '', screen = '') {
  return [
    `<div${rootAttrs(attrs)}>`,
    '<div class="phone__screen">',
    '<span class="phone__island" aria-hidden="true"></span>',
    '<div class="phone__status" aria-hidden="true">',
    '<span class="phone__time" data-i18n="formats.phone.time"></span>',
    `<span class="phone__icons">${STATUS_ICONS.join('')}</span>`,
    '</div>',
    screen.trim(),
    '<span class="phone__glare" aria-hidden="true"></span>',
    '</div>',
    ...KEYS.map((k) => `<span class="phone__key phone__key--${k}" aria-hidden="true"></span>`),
    '</div>',
  ].join('\n');
}

/** html с шаблонами <phone-frame> → html с полной разметкой телефонов. */
export function expandPhones(html) {
  return html.replace(PHONE_TAG, (_, attrs, screen) => phoneFrame(attrs, screen));
}
