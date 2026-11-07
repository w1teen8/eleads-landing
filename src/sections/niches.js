// 03 Ніші — орбита Aether («BUILT FOR LOW GRAVITY»): планета по центру, восемь круглых карточек
// медленно вращаются по эллипсу (только transform/opacity; стоп вне экрана, на скрытой вкладке и при
// reduced-motion), по бокам — пункты с названием ниши и примерами. Наведение на пункт подсвечивает его кружок.
import { $, $$, on } from '../core/dom.js';
import { reduced } from '../core/motion.js';
import { accentTitles } from '../core/title-accent.js';

const TURN_MS = 72000; // полный оборот
const START = Math.PI / 8; // совпадает с раскладкой без JS в niches.css (--i × 45° + 22.5°)
const RY = 0.38; // сплющенность орбиты: ry = rx × RY

/** Точка орбиты: угол → смещение от центра, масштаб и прозрачность по глубине; front — перед планетой. */
export function orbitPoint(angle, rx, ry) {
  const s = Math.sin(angle);
  const depth = (s + 1) / 2;
  return {
    x: Math.cos(angle) * rx,
    y: s * ry,
    scale: 0.62 + 0.38 * depth,
    opacity: s >= 0 ? 1 : 0.45 + 0.55 * (1 + s),
    front: s >= 0,
  };
}

export function init(root) {
  accentTitles(root);
  const orbit = $('[data-niches-orbit]', root);
  if (!orbit) return;
  const sats = $$('[data-niches-sat]', orbit);
  const step = (Math.PI * 2) / sats.length;
  let rx = 0;
  let ry = 0;
  let theta = START;

  const measure = () => {
    rx = Math.max(0, (orbit.clientWidth - (sats[0]?.offsetWidth || 0)) / 2);
    ry = rx * RY;
  };

  const place = () => {
    sats.forEach((sat, i) => {
      const p = orbitPoint(theta + i * step, rx, ry);
      sat.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) scale(${p.scale.toFixed(3)})`;
      sat.style.opacity = p.opacity.toFixed(3);
      const layer = p.front ? '3' : '1';
      if (sat.style.zIndex !== layer) sat.style.zIndex = layer;
    });
  };

  measure();
  place();
  new ResizeObserver(() => {
    measure();
    place();
  }).observe(orbit);

  // пункт списка ↔ кружок орбиты
  for (const item of $$('[data-niches-item]', root)) {
    const sat = sats[Number(item.dataset.nichesItem)];
    if (!sat) continue;
    const lit = (v) => () => sat.classList.toggle('is-lit', v);
    on(item, 'pointerenter', lit(true));
    on(item, 'pointerleave', lit(false));
    on(item, 'focusin', lit(true));
    on(item, 'focusout', lit(false));
  }

  if (reduced) return;

  let visible = false;
  let raf = 0;
  let last = 0;
  const tick = (now) => {
    const dt = last ? Math.min(now - last, 64) : 0;
    last = now;
    theta += (dt / TURN_MS) * Math.PI * 2;
    place();
    raf = requestAnimationFrame(tick);
  };
  const sync = () => {
    const run = visible && !document.hidden;
    if (run && !raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    } else if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    sync();
  }).observe(orbit);
  on(document, 'visibilitychange', sync);
}
