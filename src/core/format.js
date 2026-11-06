// Числа: разряды, деньги, диапазоны, докрутка.
import { reduced } from './motion.js';

const NARROW_NBSP = ' ';
const DASH = '—';

const valid = (n) => typeof n === 'number' && Number.isFinite(n);

/** 260000 → "260 000" (узкий неразрывный пробел) для ua, "260,000" для en. Нечисло → "—". */
export function formatInt(n, lang = 'ua') {
  if (!valid(n)) return DASH;
  const sign = n < 0 ? '-' : '';
  const digits = String(Math.round(Math.abs(n)));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : NARROW_NBSP);
}

/** 0.21 → "€0.21"; от 10 и выше — целые с разрядами: 1500 → "€1 500". Нечисло → "—". */
export function formatMoney(n, lang = 'ua') {
  if (!valid(n)) return DASH;
  if (Math.abs(n) < 10) return `€${n.toFixed(2)}`;
  return `€${formatInt(n, lang)}`;
}

/** "928 – 1 256"; если любой конец — нечисло, весь диапазон "—". */
export function formatRange(lo, hi, fmt = (n) => formatInt(n)) {
  if (!valid(lo) || !valid(hi)) return DASH;
  return `${fmt(lo)} – ${fmt(hi)}`;
}

const running = new WeakMap();
const easeOutCubic = (p) => 1 - (1 - p) ** 3;

/** Докрутка числа в узле через rAF. При reduced-motion — сразу итог. */
export function countTo(node, from, to, { duration = 350, format = (n) => formatInt(n) } = {}) {
  if (!node) return;
  cancelAnimationFrame(running.get(node));
  if (reduced || duration <= 0 || !valid(from) || !valid(to)) {
    node.textContent = format(to);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, Math.max(0, (now - start) / duration));
    node.textContent = format(from + (to - from) * easeOutCubic(p));
    if (p < 1) running.set(node, requestAnimationFrame(step));
    else running.delete(node);
  };
  running.set(node, requestAnimationFrame(step));
}
