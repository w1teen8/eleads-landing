// 03 Ніші: карточки появляются сами ([data-reveal]); здесь — подсветка по курсору (CSS-переменные).
import { $$, on } from '../core/dom.js';

export function init(root) {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  for (const card of $$('.niches__card', root)) {
    on(card, 'pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }
}
