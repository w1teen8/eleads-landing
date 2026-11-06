// 08 GEO: точечная карта мира на единственном <canvas> страницы (сетка из src/data/geo-dots.json, без карт-библиотек).
// Регионы пульсируют; hover (мышь) и tap (тач) по точке или клик по списку справа открывают карточку региона.
// Цикл отрисовки стоит на паузе вне экрана и при скрытой вкладке; при reduced-motion карта статична.
import { $, $$, on } from '../core/dom.js';
import { t, getLang, onLangChange } from '../core/i18n.js';
import { reduced } from '../core/motion.js';
import { pulsePhase } from './geo-model.js';
import geo from '../data/geo-dots.json';

const HIT = 28; // радиус попадания по точке, px
const PULSE_MS = 2600;

export function init(root) {
  const map = $('[data-geo-map]', root);
  const canvas = $('[data-geo-canvas]', root);
  const card = $('[data-geo-card]', root);
  if (!map || !canvas || !card || !geo?.rowsData) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { cols, rows, step, lon0, lat0, regions } = geo;
  const style = getComputedStyle(root);
  const color = (name) => style.getPropertyValue(name).trim() || '#fff';
  const palette = { land: color('--muted'), sun: color('--sun'), ember: color('--ember') };

  const land = [];
  geo.rowsData.forEach((line, r) => {
    for (let c = 0; c < cols; c++) if (line[c] === '1') land.push([c, r]);
  });

  let w = 0;
  let h = 0;
  let dpr = 1;
  let active = 'europe';
  let hovered = null;
  let running = false;
  let inView = false;
  let raf = 0;

  const pos = (region) => ({
    x: ((region.lon - lon0) / 360) * w,
    y: ((lat0 - region.lat) / (rows * step)) * h,
  });

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    draw(performance.now());
    placeCard();
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cell = w / cols;
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = palette.land;
    ctx.beginPath();
    for (const [c, r] of land) {
      const x = (c + 0.5) * cell;
      const y = (r + 0.5) * cell;
      ctx.moveTo(x + cell * 0.27, y);
      ctx.arc(x, y, cell * 0.27, 0, Math.PI * 2);
    }
    ctx.fill();

    for (const region of regions) {
      const { x, y } = pos(region);
      const on_ = region.id === active || region.id === hovered;
      const phase = reduced ? 0.35 : pulsePhase(now, region.lon, PULSE_MS);
      // пульс-кольца: два, со сдвигом
      for (const shift of [0, 0.5]) {
        const p = (phase + shift) % 1;
        ctx.globalAlpha = (1 - p) * (on_ ? 0.7 : 0.4);
        ctx.strokeStyle = palette.ember;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 4 + p * (on_ ? 22 : 16), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = on_ ? palette.sun : palette.ember;
      ctx.beginPath();
      ctx.arc(x, y, on_ ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  function sync() {
    const shouldRun = !reduced && inView && !document.hidden;
    if (shouldRun && !running) {
      running = true;
      raf = requestAnimationFrame(loop);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  /* ——— карточка региона ——— */
  const find = (id) => regions.find((r) => r.id === id);

  function fillCard() {
    const id = hovered || active;
    const base = `geo.regions.${id}`;
    $('[data-geo-name]', card).textContent = t(`${base}.name`);
    const text = t(`${base}.text`);
    const figure = $('[data-geo-figure]', card);
    const hasFigure = id === 'europe';
    figure.hidden = !hasFigure;
    if (hasFigure) figure.textContent = t(`${base}.figure`);
    $('[data-geo-text]', card).textContent = hasFigure ? t(`${base}.figureText`) : text;
    const sub = $('.geo__card-sub', card);
    if (sub) sub.textContent = hasFigure ? text : '';
  }

  function placeCard() {
    const region = find(hovered || active);
    if (!region || !w) return;
    const { x, y } = pos(region);
    const cw = card.offsetWidth || 220;
    const left = Math.max(8, Math.min(w - cw - 8, x - cw / 2));
    card.style.left = `${left}px`;
    card.style.top = `${y}px`;
    card.classList.toggle('is-below', y < (card.offsetHeight || 120) + 36);
  }

  function select(id, { fromList = false } = {}) {
    active = id;
    hovered = null;
    fillCard();
    placeCard();
    $$('.geo__region', root).forEach((b) => {
      const on_ = b.dataset.region === id;
      b.classList.toggle('is-active', on_);
      b.setAttribute('aria-pressed', String(on_));
    });
    if (reduced || !running) draw(performance.now());
    card.classList.add('is-shown');
    if (fromList) card.dataset.source = 'list';
  }

  function nearest(e) {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    let best = null;
    let bestD = HIT;
    for (const region of regions) {
      const { x, y } = pos(region);
      const d = Math.hypot(x - px, y - py);
      if (d < bestD) {
        best = region.id;
        bestD = d;
      }
    }
    return best;
  }

  on(canvas, 'pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const id = nearest(e);
    canvas.style.cursor = id ? 'pointer' : '';
    if (id && id !== active) select(id);
  });
  on(canvas, 'pointerdown', (e) => {
    const id = nearest(e);
    if (id) select(id);
  });

  for (const button of $$('.geo__region', root)) {
    on(button, 'click', () => select(button.dataset.region, { fromList: true }));
    on(button, 'mouseenter', () => {
      hovered = button.dataset.region;
      fillCard();
      placeCard();
    });
    on(button, 'mouseleave', () => {
      hovered = null;
      fillCard();
      placeCard();
    });
  }

  onLangChange(() => {
    fillCard();
    placeCard();
  });

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(canvas);
  document.addEventListener('visibilitychange', sync);

  getLang();
  select(active);
  resize();
}
