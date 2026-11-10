// 12 Матеріали (T31): посты канала — лента карточек в духе showcase-scroll (H07): на широком экране блок закрепляется
// под шапкой, карточки едут влево по мере прокрутки страницы (showcaseScroll из motion-kit — тот же приём, что в
// блоке 11; единственный разрешённый переход по прокрутке, H11). На узком экране и при reduced-motion — горизонтальная
// прокрутка пальцем (CSS). Свечение карточки следует за курсором (CSS-переменные → transform).
import { $, $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { showcaseScroll } from '../core/motion-kit.js';

export function init(root) {
  accentTitles(root);

  const track = $('[data-mat-track]', root);
  const progress = $('[data-mat-progress]', root);
  if (track) {
    const ride = showcaseScroll(root, track, {
      onProgress: (p) => {
        if (progress) progress.style.transform = `scaleX(${p})`;
      },
    });
    // лента не поедет (reduced-motion, ?nomotion=1, GSAP не загрузился) — запасная горизонтальная прокрутка
    ride.ready.then((ok) => root.classList.toggle('is-static', !ok));
  }

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  for (const card of $$('.mat__card', root)) {
    on(card, 'pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  }
}
