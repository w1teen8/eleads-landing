// 13 FAQ: аккордеон из src/data/faq.json на <button aria-expanded>; смена языка перерисовывает тексты на месте.
import { $, el, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, getLang, onLangChange } from '../core/i18n.js';
import data from '../data/faq.json';

const pick = (v, lang) => (v && typeof v === 'object' ? (v[lang] ?? v.ua ?? '') : String(v ?? ''));
const isTbd = (s) => s === 'уточнити' || s === 'TBD' || s === t('common.tbd');

export function init(root) {
  accentTitles(root);
  const list = $('[data-faq-list]', root);
  const items = Array.isArray(data?.items) ? data.items : [];
  if (!list || !items.length) return;

  const rows = items.map((item, i) => {
    const q = el('span', { class: 'faq__q' });
    const a = el('p', { class: 'faq__a-text' });
    const btn = el(
      'button',
      { class: 'faq__btn', attrs: { type: 'button', id: `faq-q-${i}`, 'aria-expanded': 'false', 'aria-controls': `faq-a-${i}` } },
      el('span', { class: 'faq__num', text: String(i + 1).padStart(2, '0') }),
      q,
      el('span', { class: 'faq__icon', attrs: { 'aria-hidden': 'true' } }),
    );
    const panel = el(
      'div',
      { class: 'faq__a', attrs: { id: `faq-a-${i}`, role: 'region', 'aria-labelledby': `faq-q-${i}` } },
      el('div', { class: 'faq__a-inner' }, a),
    );
    const li = el('li', { class: 'faq__item' }, btn, panel);
    on(btn, 'click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      li.classList.toggle('is-open', open);
    });
    return { item, q, a, li };
  });
  list.replaceChildren(...rows.map((r) => r.li));
  list.dataset.reveal = 'stagger';

  const paint = (lang) => {
    for (const { item, q, a } of rows) {
      q.textContent = pick(item.q, lang);
      const text = pick(item.a, lang);
      a.textContent = text;
      a.classList.toggle('is-tbd', isTbd(text));
    }
  };
  paint(getLang());
  onLangChange(paint);
}
