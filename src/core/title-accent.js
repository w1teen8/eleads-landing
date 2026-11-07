// Заголовок секции облика Aether: вторая строка — акцентом («BUILT FOR / LOW GRAVITY»).
// Текст заголовка не меняется: <h2 data-i18n="x.title" data-title-accent="x.titleAccent"> пре-рендерится целиком,
// а здесь хвост, совпадающий с x.titleAccent, оборачивается в .display__accent. Без JS — обычный заголовок.
import { t, onLangChange } from './i18n.js';

/** «Обговоримо ваш проєкт?», «ваш проєкт?» → { lead: 'Обговоримо', accent: 'ваш проєкт?' }; не хвост → null. */
export function splitTitle(full, tail) {
  if (typeof full !== 'string' || typeof tail !== 'string') return null;
  const accent = tail.trim();
  const text = full.trim();
  if (!accent || accent.length >= text.length || !text.endsWith(accent)) return null;
  const lead = text.slice(0, text.length - accent.length).trimEnd();
  return lead ? { lead, accent } : null;
}

function apply(heading) {
  const key = heading.dataset.titleAccent;
  const titleKey = heading.dataset.i18n;
  const full = titleKey ? t(titleKey) : heading.textContent;
  const parts = splitTitle(typeof full === 'string' ? full : heading.textContent, t(key));
  if (!parts) return;
  const accent = document.createElement('span');
  accent.className = 'display__accent';
  accent.textContent = parts.accent;
  heading.replaceChildren(document.createTextNode(`${parts.lead} `), accent);
}

/** Все [data-title-accent] внутри root; после смены языка i18n переписывает текст — делим заново. */
export function accentTitles(root) {
  const headings = [...root.querySelectorAll('[data-title-accent]')];
  headings.forEach(apply);
  onLangChange(() => headings.forEach(apply));
}
