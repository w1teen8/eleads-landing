// Ленты (G16 → T23, H13; 2026-11-11 — две в ряд, P1) на стыке первого экрана и блока 02: две полосы бегут в разные
// стороны — акцентная («Мені довіряють» и имена) влево, тёмная (коротко о eLeads) вправо.
// «Полоски еще выше поставь»: на широком экране ленты поднимаются на низ фото — на столько, сколько свободно под
// кнопкой и карточкой первого экрана, минус LIFT_GAP (их ленты не закрывают). Свободное место от экрана к экрану
// разное (33–100 px), поэтому подъём считается здесь (--rb-lift), а не числом в CSS.
// Движение — motion.marquee (translateX дорожки; пауза при наведении, вне экрана и при скрытой вкладке).
// marquee крутит дорожку только влево; для обратного хода скорость отрицательная, а дорожка заранее
// сдвинута влево на ширину группы (--ribbon-shift) — слева не остаётся пустоты.
// При reduced-motion marquee — no-op: полосы стоят, текст виден.
import { $, $$ } from '../core/dom.js';
import { marquee, reduced } from '../core/motion.js';

const SPEED = { accent: 70, muted: -55 };
/** Зазор между лентами и нижним краем кнопки / карточки первого экрана, px. */
export const LIFT_GAP = 20;
/** Доля свободного места, на которую ленты поднимаются («По ниже опусти» → «давай еще чуть ниже» → «еще чуть-чуть» → «еще капельку ниже» — 0: ленты ровно на срезе фото, нижнем крае первого экрана; число оставлено, чтобы можно было снова поднять). */
export const LIFT_SHARE = 0;
const WIDE = '(min-width: 900px) and (orientation: landscape)';

/** Подъём лент: доля LIFT_SHARE свободного места под самыми нижними элементами первого экрана за вычетом
 *  зазора; не меньше 0. */
export function liftFor(heroBottom, bottoms, gap = LIFT_GAP, share = LIFT_SHARE) {
  const free = Math.min(...bottoms.map((b) => heroBottom - b));
  return Number.isFinite(free) ? Math.max(0, Math.round((free - gap) * share)) : 0;
}

function lift(root) {
  const hero = root.previousElementSibling?.matches?.('.hero') ? root.previousElementSibling : document.querySelector('.hero');
  if (!hero) return;
  const update = () => {
    if (!window.matchMedia?.(WIDE).matches) {
      root.style.setProperty('--rb-lift', '0px');
      return;
    }
    const keep = [...hero.querySelectorAll('.hero__cta, .hero__side')];
    const px = liftFor(hero.getBoundingClientRect().bottom, keep.map((el) => el.getBoundingClientRect().bottom));
    root.style.setProperty('--rb-lift', `${px}px`);
  };
  update();
  addEventListener('resize', update, { passive: true });
  addEventListener('load', update, { once: true });
  setTimeout(update, 1600); // после появления первого экрана (элементы въезжают снизу)
  document.fonts?.ready?.then(update);
}

export function init(root) {
  lift(root);
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
