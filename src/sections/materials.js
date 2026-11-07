// 12 Матеріали: карточки-обложки; свечение следует за курсором (CSS-переменные), остальное — ревил из разметки.
import { $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';

export function init(root) {
  accentTitles(root);
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  for (const card of $$('.mat__card', root)) {
    on(card, 'pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  }
}
