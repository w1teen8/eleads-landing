// 09 Таргетинг (T30): шесть карточек; пояснение выезжает по hover и focus-visible (CSS), на тач — по тапу.
// aria-expanded отражает только открытое тапом/кликом состояние (is-open): наведение мышью панель показывает,
// но состояние кнопки не меняет — иначе у закрытой панели оставалось aria-expanded="true" (баг T03).
import { $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';

export function init(root) {
  accentTitles(root);
  const cards = $$('.tg__card', root);
  const set = (card, open) => {
    card.classList.toggle('is-open', open);
    card.setAttribute('aria-expanded', String(open));
  };
  for (const card of cards) {
    on(card, 'click', () => {
      const open = !card.classList.contains('is-open');
      for (const other of cards) if (other !== card) set(other, false);
      set(card, open);
    });
    // Esc закрывает открытую карточку с клавиатуры
    on(card, 'keydown', (e) => {
      if (e.key === 'Escape' && card.classList.contains('is-open')) set(card, false);
    });
  }
  // тап мимо карточек — закрыть
  on(root, 'click', (e) => {
    if (e.target.closest('.tg__card')) return;
    for (const card of cards) if (card.classList.contains('is-open')) set(card, false);
  });
}
