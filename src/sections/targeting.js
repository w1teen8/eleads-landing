// 09 Таргетинг: пояснение раскрывается по hover и фокусу (CSS), на тач — по тапу (aria-expanded).
import { $$, on } from '../core/dom.js';

export function init(root) {
  const cards = $$('.tg__card', root);
  const expanded = (card, value) => card.setAttribute('aria-expanded', String(value));
  for (const card of cards) {
    on(card, 'click', () => {
      const open = !card.classList.contains('is-open');
      cards.forEach((c) => {
        c.classList.remove('is-open');
        expanded(c, false);
      });
      card.classList.toggle('is-open', open);
      expanded(card, open);
    });
    const show = () => expanded(card, true);
    const hide = () => expanded(card, card.classList.contains('is-open'));
    on(card, 'mouseenter', show);
    on(card, 'focus', show);
    on(card, 'mouseleave', hide);
    on(card, 'blur', hide);
  }
}
