// 14 Фінальний CTA (T31): заголовок шрифтом канала с акцентным хвостом, кнопка в Telegram, фото Володимира.
// Переходов и появлений по прокрутке нет (H11); единственное движение — лёгкий наклон фото за курсором (мышь).
import { $, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { reduced } from '../core/motion.js';

const TILT = 3; // градусов на край карточки

export function init(root) {
  accentTitles(root);
  if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const photo = $('[data-cta-photo]', root);
  if (!photo) return;
  on(photo, 'pointermove', (e) => {
    const r = photo.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    photo.style.setProperty('--tilt-y', `${(x * TILT * 2).toFixed(2)}deg`);
    photo.style.setProperty('--tilt-x', `${(-y * TILT * 2).toFixed(2)}deg`);
  });
  on(photo, 'pointerleave', () => {
    photo.style.setProperty('--tilt-y', '0deg');
    photo.style.setProperty('--tilt-x', '0deg');
  });
}
