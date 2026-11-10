// 08 GEO (T29): карта мира из точек — тот же модуль, что у блока 02 (stats-dots.js → createDotMap, сетка
// src/data/geo-dots.json, прореживание WORLD_STRIDE как у карты Worldwide): волны от курсора, клика и тапа,
// расталкивание точек у курсора. Поверх точек — метки регионов из geo.regions (второй <g> в svg); наведение на строку
// списка или клик по метке / строке подсвечивает регион и ставит над ним карточку с названием и текстом (Европа —
// с цифрой). Появления по прокрутке нет (H11); пульс меток — CSS (transform/opacity), при reduced-motion статичен.
import { $, $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, onLangChange } from '../core/i18n.js';
import { WORLD_STRIDE } from './stats-model.js';
import { createDotMap } from './stats-dots.js';
import geo from '../data/geo-dots.json';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Регион по умолчанию — с цифрой. */
const DEFAULT = 'europe';
/** Радиусы метки в шагах сетки: кольцо пульса и сама точка. */
const PIN = { ring: 1.35, dot: 0.62 };
/** Карточка не ближе этого к краю карты, px; выше этой доли высоты карты — карточка под меткой, а не над ней. */
const TIP_EDGE = 8;
const TIP_FLIP = 0.42;

/** Положение (lon, lat) в координатах карты createDotMap: шаг сетки = 1, сетка прорежена в stride раз. */
export function pinPoint(grid, lon, lat, stride = WORLD_STRIDE) {
  return { x: (lon - grid.lon0) / grid.step / stride, y: (grid.lat0 - lat) / grid.step / stride };
}

export function init(root) {
  accentTitles(root);
  const box = $('[data-geo-map]', root);
  const pinsLayer = $('[data-geo-pins]', root);
  const tip = $('[data-geo-tip]', root);
  const regions = Array.isArray(geo?.regions) ? geo.regions : [];
  if (!box || !pinsLayer || !tip || !regions.length) return;

  const map = createDotMap(box, geo, { stride: WORLD_STRIDE });
  if (!map) return;
  const { width, height } = { width: map.svg.viewBox.baseVal.width, height: map.svg.viewBox.baseVal.height };

  /* ——— метки регионов ——— */
  const pins = new Map();
  for (const region of regions) {
    const { x, y } = pinPoint(geo, region.lon, region.lat);
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'geo__pin');
    g.dataset.region = region.id;
    for (const [cls, r] of [
      ['geo__pin-ring', PIN.ring],
      ['geo__pin-dot', PIN.dot],
    ]) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('class', cls);
      c.setAttribute('cx', String(x));
      c.setAttribute('cy', String(y));
      c.setAttribute('r', String(r));
      g.append(c);
    }
    pinsLayer.append(g);
    pins.set(region.id, { g, x: x / width, y: y / height });
  }

  const buttons = $$('.geo__region', root);
  let active = DEFAULT;
  let hovered = null;
  const shown = () => hovered || active;

  function paintTip() {
    const id = shown();
    const base = `geo.regions.${id}`;
    $('[data-geo-name]', tip).textContent = t(`${base}.name`);
    const figure = $('[data-geo-figure]', tip);
    const figureValue = t(`${base}.figure`);
    const hasFigure = typeof figureValue === 'string' && figureValue !== `${base}.figure`;
    figure.hidden = !hasFigure;
    figure.textContent = hasFigure ? figureValue : '';
    $('[data-geo-text]', tip).textContent = hasFigure ? t(`${base}.figureText`) : t(`${base}.text`);
    tip.dataset.region = id;
  }

  function placeTip() {
    const pin = pins.get(shown());
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (!pin || !w || !h) return;
    const tw = tip.offsetWidth || 220;
    const left = Math.max(TIP_EDGE, Math.min(w - tw - TIP_EDGE, pin.x * w - tw / 2));
    tip.style.left = `${left}px`;
    tip.style.top = `${pin.y * h}px`;
    tip.classList.toggle('is-below', pin.y < TIP_FLIP);
  }

  function paintPins() {
    const id = shown();
    for (const [rid, { g }] of pins) g.classList.toggle('is-active', rid === id);
    for (const b of buttons) {
      const isActive = b.dataset.region === active;
      b.classList.toggle('is-active', isActive);
      b.classList.toggle('is-hovered', b.dataset.region === hovered);
      b.setAttribute('aria-pressed', String(isActive));
    }
  }

  function render() {
    paintTip();
    paintPins();
    placeTip();
  }

  function select(id) {
    if (!pins.has(id)) return;
    active = id;
    hovered = null;
    render();
  }

  function hover(id) {
    hovered = id && pins.has(id) ? id : null;
    render();
  }

  for (const b of buttons) {
    on(b, 'click', () => select(b.dataset.region));
    on(b, 'pointerenter', (e) => {
      if (e.pointerType === 'mouse') hover(b.dataset.region);
    });
    on(b, 'pointerleave', () => hover(null));
    on(b, 'focus', () => hover(b.dataset.region));
    on(b, 'blur', () => hover(null));
  }
  for (const [id, { g }] of pins) {
    on(g, 'click', () => select(id));
    on(g, 'pointerenter', (e) => {
      if (e.pointerType === 'mouse') hover(id);
    });
    on(g, 'pointerleave', () => hover(null));
  }

  onLangChange(render);
  if ('ResizeObserver' in window) new ResizeObserver(placeTip).observe(box);
  else on(window, 'resize', placeTip);

  render();
}
