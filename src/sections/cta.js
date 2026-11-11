// 14 Фінальний CTA (T37; T41 — документ клиента, стр. 14; 2026-11-11 — живой фон, выбор пользователя «1»): слева
// заголовок, текст и кнопка в Telegram, справа — Володимир крупно: вырезанная фигура поверх исходного кадра с улицей,
// который притемнён и плавно растворяется в фон. За всем — тонкие топографические линии, по ним медленно проходит
// мягкая жёлто-оранжевая волна света (cta-lines.js). Холст создаётся здесь (в HTML его нет — без JS блок просто без
// линий). Рисует только пока блок виден и вкладка открыта; reduced-motion / ?nomotion=1 — линии стоят, без волны.
import { accentTitles } from '../core/title-accent.js';
import { reduced } from '../core/motion.js';
import { LINES, contourSegments, wavePos, hexRgb } from './cta-lines.js';

export function init(root) {
  accentTitles(root);
  lines(root);
}

function lines(root) {
  const canvas = document.createElement('canvas');
  canvas.className = 'cta__lines';
  canvas.setAttribute('aria-hidden', 'true');
  root.prepend(canvas);
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return;

  const css = getComputedStyle(document.documentElement);
  const rgb = (name, fallback) => hexRgb(css.getPropertyValue(name)) ?? fallback;
  const sun = rgb('--accent', [255, 210, 63]);
  const ember = rgb('--accent-2', [255, 138, 31]);
  const fg = rgb('--text', [244, 242, 236]);
  const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`;

  let w = 0;
  let h = 0;
  let layer = null; // линии один раз — белым на прозрачном
  let glow = null; // слой волны: линии, окрашенные градиентом
  let visible = false;
  let raf = 0;
  const start = performance.now();

  function build() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.round(canvas.clientWidth * dpr);
    h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return;
    canvas.width = w;
    canvas.height = h;
    layer = document.createElement('canvas');
    layer.width = w;
    layer.height = h;
    const lc = layer.getContext('2d');
    lc.strokeStyle = rgba(fg, 1);
    lc.lineWidth = 1.1 * dpr;
    const seg = contourSegments(w, h, { cell: LINES.cell * dpr });
    lc.beginPath();
    for (let i = 0; i < seg.length; i += 4) {
      lc.moveTo(seg[i], seg[i + 1]);
      lc.lineTo(seg[i + 2], seg[i + 3]);
    }
    lc.stroke();
    glow = document.createElement('canvas');
    glow.width = w;
    glow.height = h;
    draw(performance.now());
  }

  function draw(now) {
    if (!layer) return;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = LINES.base;
    ctx.drawImage(layer, 0, 0);
    ctx.globalAlpha = 1;
    if (reduced) return;
    const gc = glow.getContext('2d');
    gc.globalCompositeOperation = 'source-over';
    gc.clearRect(0, 0, w, h);
    gc.drawImage(layer, 0, 0);
    gc.globalCompositeOperation = 'source-in';
    const p = wavePos((now - start) / 1000);
    const g = gc.createLinearGradient(w * (p - 0.25), 0, w * (p + 0.25), h * 0.6);
    const a = LINES.wave;
    g.addColorStop(0, rgba(ember, 0));
    g.addColorStop(0.4, rgba(ember, a * 0.47));
    g.addColorStop(0.5, rgba(sun, a));
    g.addColorStop(0.6, rgba(ember, a * 0.47));
    g.addColorStop(1, rgba(ember, 0));
    gc.fillStyle = g;
    gc.fillRect(0, 0, w, h);
    ctx.drawImage(glow, 0, 0);
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
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 120);
    }).observe(canvas);
  }
  build();
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
