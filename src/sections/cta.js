// 14 Фінальний CTA (T37; T41 — документ клиента, стр. 14; 2026-11-11): слева заголовок, текст и кнопка в Telegram,
// справа — вырезанная фигура Володимира с тёплым свечением за головой. Фон всего блока — «Silk» (выбор пользователя
// «silk сделай на весь блок»): тонкие линии складываются в шёлковую ткань, которая медленно волнуется, по ней
// пробегает тёплый отблеск (cta-silk.js). Холст создаётся здесь (в HTML его нет — без JS блок просто без ткани).
// Рисует только пока блок виден и вкладка открыта; reduced-motion / ?nomotion=1 — ткань стоит, один кадр.
import { accentTitles } from '../core/title-accent.js';
import { reduced } from '../core/motion.js';
import { SILK, UNIT_H, silkY, sheenOf, lineCount, hexRgb } from './cta-silk.js';

export function init(root) {
  accentTitles(root);
  silk(root);
}

function silk(root) {
  const canvas = document.createElement('canvas');
  canvas.className = 'cta__silk';
  canvas.setAttribute('aria-hidden', 'true');
  root.prepend(canvas);
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return;

  const css = getComputedStyle(document.documentElement);
  const rgb = (name, fallback) => hexRgb(css.getPropertyValue(name)) ?? fallback;
  const sun = rgb('--accent', [255, 210, 63]);
  const ember = rgb('--accent-2', [255, 138, 31]);
  const n = lineCount();

  let unit = 1; // пикселей холста на единицу блока
  let widthU = 0; // ширина блока в единицах
  let visible = false;
  let raf = 0;
  const start = performance.now();

  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return false;
    canvas.width = w;
    canvas.height = h;
    unit = h / UNIT_H;
    widthU = w / unit;
    return true;
  }

  function draw(now) {
    if (!widthU) return;
    const t = reduced ? 4 : (now - start) / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(unit, 0, 0, unit, 0, 0);
    ctx.lineWidth = SILK.width;
    for (let i = 0; i < n; i += 1) {
      const s = sheenOf(i, t);
      // цвет линии — от тёплого оранжевого (в тени) к жёлтому (на отблеске)
      const c = ember.map((v, k) => Math.round(v + (sun[k] - v) * s));
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${SILK.base + SILK.sheen * s * s})`;
      ctx.beginPath();
      for (let x = 0; x <= widthU + SILK.step; x += SILK.step) {
        const y = silkY(i, x, t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function loop(now) {
    raf = 0;
    if (!visible || document.hidden || reduced) return;
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  const kick = () => {
    if (!raf && visible && !document.hidden && !reduced) raf = requestAnimationFrame(loop);
  };

  let resizeTimer = 0;
  const rebuild = () => size() && draw(performance.now());
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 120);
    }).observe(canvas);
  }
  rebuild();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        kick();
      },
      { threshold: 0.05 },
    ).observe(root);
  } else {
    visible = true;
    kick();
  }
  document.addEventListener('visibilitychange', kick);
}
