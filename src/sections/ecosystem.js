// 11 Екосистема (T30): шлях клієнта — статичные плитки; услуги — лента карточек в духе showcase-scroll (H07):
// на широком экране блок закрепляется под шапкой, карточки едут влево по мере прокрутки страницы
// (showcaseScroll из motion-kit — единственный разрешённый переход по прокрутке, H11). На узком экране и при
// reduced-motion — горизонтальная прокрутка пальцем (CSS). Описание карточки раскрывается по hover / focus-visible
// (CSS), на тач — по тапу; aria-expanded отражает только открытое тапом состояние.
import { $, $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { showcaseScroll } from '../core/motion-kit.js';

export function init(root) {
  accentTitles(root);

  const track = $('[data-eco-track]', root);
  const progress = $('[data-eco-progress]', root);
  if (progress) progress.style.transform = 'scaleX(0)';
  if (track) {
    const ride = showcaseScroll(root, track, {
      onProgress: (p) => {
        if (progress) progress.style.transform = `scaleX(${p})`;
      },
    });
    // лента не поедет (reduced-motion, ?nomotion=1, GSAP не загрузился) — запасная горизонтальная прокрутка пальцем
    ride.ready.then((ok) => root.classList.toggle('is-static', !ok));
  }

  const rows = $$('.eco__row', root);
  const set = (row, open) => {
    row.classList.toggle('is-open', open);
    row.setAttribute('aria-expanded', String(open));
  };
  for (const row of rows) {
    on(row, 'click', () => {
      const open = !row.classList.contains('is-open');
      for (const other of rows) if (other !== row) set(other, false);
      set(row, open);
    });
    on(row, 'keydown', (e) => {
      if (e.key === 'Escape' && row.classList.contains('is-open')) set(row, false);
    });
  }
}
