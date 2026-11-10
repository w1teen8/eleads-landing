// 13 FAQ (T31): аккордеон из src/data/faq.json в двух независимых колонках (ряды не выравниваются друг по другу —
// раскрытый ответ не двигает соседнюю колонку). Открыт один вопрос за раз — блок остаётся в один экран.
// Появлений по прокрутке нет (H11): всё видно сразу; смена языка перерисовывает тексты на месте.
import { $$, el, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, getLang, onLangChange } from '../core/i18n.js';
import { splitColumns } from './faq-model.js';
import data from '../data/faq.json';

const pick = (v, lang) => (v && typeof v === 'object' ? (v[lang] ?? v.ua ?? '') : String(v ?? ''));
const isTbd = (s) => s === 'уточнити' || s === 'TBD' || s === t('common.tbd');

export function init(root) {
  accentTitles(root);
  const lists = $$('[data-faq-list]', root);
  const items = Array.isArray(data?.items) ? data.items : [];
  if (!lists.length || !items.length) return;

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
    return { item, q, a, li, btn };
  });

  const setOpen = (row, open) => {
    row.btn.setAttribute('aria-expanded', String(open));
    row.li.classList.toggle('is-open', open);
  };
  for (const row of rows) {
    on(row.btn, 'click', () => {
      const open = row.btn.getAttribute('aria-expanded') !== 'true';
      for (const other of rows) if (other !== row) setOpen(other, false);
      setOpen(row, open);
    });
  }

  const columns = splitColumns(rows, lists.length);
  lists.forEach((list, i) => list.replaceChildren(...columns[i].map((r) => r.li)));

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
