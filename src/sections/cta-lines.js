// 14 Фінальний CTA — фон «Топографічні лінії з переливом» (выбор пользователя 2026-11-11: вариант 1 из четырёх живых;
// образец — его скрин с тонкими контурами за фигурой). Тонкие контурные линии (как на карте высот) едва видны; по ним
// медленно проходит мягкая жёлто-оранжевая волна света слева направо. Чистые функции — шум и контуры (marching
// squares); рисование и анимация — в cta.js.

/** Насколько заметны линии и волна (пользователь: «Давай линии менее заметными сделаем»). */
export const LINES = { base: 0.05, wave: 0.38, cell: 7, levels: 22, scale: 3.6, z: 1.7, speed: 0.12 };

// value noise 3D с фиксированной перестановкой: картинка линий одна и та же при каждом заходе
const P = new Uint8Array(512);
{
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = 7;
  for (let i = 255; i > 0; i -= 1) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i += 1) P[i] = p[i & 255];
}
const fade = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const hash = (x, y, z) => P[(P[(P[x & 255] + y) & 255] + z) & 255] / 255;

function vnoise(x, y, z) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = fade(x - xi);
  const yf = fade(y - yi);
  const zf = fade(z - zi);
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
}

/** Рельеф 0…1: три октавы шума. */
export function relief(x, y, z) {
  return vnoise(x, y, z) * 0.6 + vnoise(x * 2.1, y * 2.1, z * 1.7) * 0.3 + vnoise(x * 4.3, y * 4.3, z * 2.3) * 0.1;
}

// какие рёбра клетки соединить для каждого из 16 случаев (0 — верх, 1 — право, 2 — низ, 3 — лево)
const CASES = [[], [[3, 0]], [[0, 1]], [[3, 1]], [[1, 2]], [[3, 0], [1, 2]], [[0, 2]], [[3, 2]], [[2, 3]], [[0, 2]], [[0, 1], [2, 3]], [[1, 2]], [[1, 3]], [[0, 1]], [[0, 3]], []];

/**
 * Отрезки изолиний рельефа на холсте w×h (marching squares): массив [x1, y1, x2, y2, …].
 * cell — шаг сетки в пикселях, levels — сколько уровней, scale — сколько «холмов» на длинную сторону.
 */
export function contourSegments(w, h, { cell = LINES.cell, levels = LINES.levels, scale = LINES.scale, z = LINES.z } = {}) {
  const out = [];
  if (!(w > 0 && h > 0 && cell > 0)) return out;
  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  const k = (scale / Math.max(w, h)) * cell;
  const v = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j += 1) for (let i = 0; i < cols; i += 1) v[j * cols + i] = relief(i * k, j * k, z);
  for (let L = 1; L <= levels; L += 1) {
    const t = L / (levels + 1);
    for (let j = 0; j < rows - 1; j += 1) {
      for (let i = 0; i < cols - 1; i += 1) {
        const a = v[j * cols + i];
        const b = v[j * cols + i + 1];
        const c = v[(j + 1) * cols + i + 1];
        const d = v[(j + 1) * cols + i];
        const seg = CASES[(a > t) | ((b > t) << 1) | ((c > t) << 2) | ((d > t) << 3)];
        if (!seg.length) continue;
        const x = i * cell;
        const y = j * cell;
        const e = [
          [x + (cell * (t - a)) / (b - a), y],
          [x + cell, y + (cell * (t - b)) / (c - b)],
          [x + (cell * (t - d)) / (c - d), y + cell],
          [x, y + (cell * (t - a)) / (d - a)],
        ];
        for (const [p, q] of seg) out.push(e[p][0], e[p][1], e[q][0], e[q][1]);
      }
    }
  }
  return out;
}

/** Положение волны света по ширине (доли): идёт слева направо и уходит за край, затем снова. */
export function wavePos(seconds, speed = LINES.speed) {
  return ((seconds * speed) % 1.6) - 0.3;
}

/** '#RRGGBB' / '#RGB' → [r, g, b]; иначе null. */
export function hexRgb(value) {
  const m = String(value ?? '').trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
