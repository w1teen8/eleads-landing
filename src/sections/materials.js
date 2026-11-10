// 12 Матеріали (T36, H49): картки-пости, як у каналі Telegram — выбор пользователя, вариант A
// (reference/run3/materials-A-chosen.png). Четыре превью постов: обложка, строка канала, заголовок, «Читати в Telegram».
// Лента в духе showcase-scroll (H07): на широком экране блок закрепляется под шапкой, карточки едут влево по мере
// прокрутки страницы (showcaseScroll из motion-kit — единственный переход по прокрутке, H11). На узком экране и при
// reduced-motion — горизонтальная прокрутка пальцем (CSS, .is-static).
import { $ } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { showcaseScroll } from '../core/motion-kit.js';

export function init(root) {
  accentTitles(root);

  const track = $('[data-mat-track]', root);
  const progress = $('[data-mat-progress]', root);
  if (!track) return;
  const ride = showcaseScroll(root, track, {
    onProgress: (p) => {
      if (progress) progress.style.transform = `scaleX(${p})`;
    },
  });
  // лента не поедет (reduced-motion, ?nomotion=1, GSAP не загрузился) — запасная горизонтальная прокрутка
  ride.ready.then((ok) => root.classList.toggle('is-static', !ok));
}
