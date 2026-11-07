// Ленты крест-накрест после первого экрана (G16): две наклонённые полосы бегут в разные стороны.
// Движение — motion.marquee (translateX дорожки; пауза при наведении, вне экрана и при скрытой вкладке).
// marquee крутит дорожку только влево; для обратного хода скорость отрицательная, а дорожка заранее
// сдвинута влево на ширину группы (--ribbon-shift) — слева не остаётся пустоты.
// При reduced-motion marquee — no-op: полосы стоят, текст виден.
import { $, $$ } from '../core/dom.js';
import { marquee, reduced } from '../core/motion.js';

const SPEED = { top: 70, bottom: -55 };

export function init(root) {
  if (reduced) return;
  for (const band of $$('[data-ribbon]', root)) {
    const track = $('.ribbons__track', band);
    const group = track?.firstElementChild;
    if (!group) continue;
    const speed = SPEED[band.dataset.ribbon] ?? 60;
    if (speed < 0) {
      const shift = () => track.style.setProperty('--ribbon-shift', `${group.getBoundingClientRect().width}px`);
      shift();
      if ('ResizeObserver' in window) new ResizeObserver(shift).observe(group);
      band.classList.add('is-reverse');
    }
    marquee(track, { speed });
  }
}
