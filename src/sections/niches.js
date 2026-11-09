// 03 Ніші (T20) — восемь карточек на синем продолжении первого экрана; восьмая «Інша ніша?» — ссылка в Telegram.
// Движение (H11): переходов по прокрутке нет — блок идёт обычной прокруткой, карточки видны сразу.
// Только локальное hover-микродвижение: карточка чуть наклоняется к курсору (transform через CSS-переменные).
import { $$, on } from '../core/dom.js';
import { reduced } from '../core/motion.js';
import { accentTitles } from '../core/title-accent.js';

/** Наклон к курсору, градусы. */
const TILT = 5;

function tilt(card) {
  on(card, 'pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--tilt-x', `${(-y * TILT).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${(x * TILT).toFixed(2)}deg`);
  });
  on(card, 'pointerleave', () => {
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
  });
}

export function init(root) {
  accentTitles(root);
  if (reduced || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return;
  $$('[data-niches-card]', root).forEach(tilt);
}
