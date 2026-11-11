// 08 GEO (T33): математика точечного глобуса — без DOM, её проверяют тесты (tests/geo-globe.test.js).
// Точки суши — сетка src/data/geo-dots.json (шаг 2.5°): строки широт как в сетке, но по долготе точек в строке тем
// меньше, чем ближе к полюсу (∝ cos φ), — на шаре они ложатся ровно, без сгущения у полюсов. Проекция ортографическая:
// вид = { lon, lat } — точка шара в центре круга; x вправо, y вверх, z — к зрителю (z ≤ 0 — невидимая полусфера).

const RAD = Math.PI / 180;

/** Ориентиры поведения: автовращение, наклон при повороте к региону, инерция, пауза после выбора. */
export const GLOBE = {
  // автовращение — медленное покачивание вокруг выбранного региона: он всегда остаётся к зрителю лицом, подсветка
  // справа не спорит с картинкой (пользователь: «выбрана Європа, а глобус повёрнут к Америкам» — так нельзя)
  swayAmp: 18, // ± градусов долготы
  swayPeriod: 26000, // мс на полный цикл (пик ≈ 4.3°/с)
  swayRamp: 2000, // разгон покачивания после остановки, мс
  tiltMax: 40, // наклон вида по широте не больше ±40°
  focusTilt: 0.6, // поворот к региону: центр — его долгота и 0.6 его широты (видно и регион, и экватор)
  focusMs: 1300, // плавный поворот к региону
  idleMs: 6000, // выбранный регион держит глобус, через 6 с бездействия автовращение продолжается
  inertia: 420, // постоянная затухания инерции после перетаскивания, мс
  dragDeg: 0.9, // во сколько раз долгота под пальцем отстаёт от пальца (1 — точка «прилипает»)
  regionDeg: 9, // точки суши ближе этого к метке региона — его цвета
  swell: 0.16, // радиус «вспухания» у курсора — доля радиуса шара
  spin: 0.006, // Worldwide: непрерывное автовращение, °/мс (оборот за минуту)
};

/** Долгота в (-180, 180]. */
export function wrapLon(lon) {
  const l = ((((lon + 180) % 360) + 360) % 360) - 180;
  return l === -180 ? 180 : l;
}

/** Кратчайшая разница долгот to − from в (-180, 180]. */
export function lonDelta(from, to) {
  return wrapLon(to - from);
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Точки суши на шаре: [{ lon, lat }] — строки сетки, по долготе ∝ cos φ. */
export function landDots(grid) {
  const { step, lon0, lat0, cols, rows, rowsData } = grid;
  const out = [];
  for (let r = 0; r < rows; r += 1) {
    const lat = lat0 - (r + 0.5) * step;
    const n = Math.max(1, Math.round(cols * Math.cos(lat * RAD)));
    const row = rowsData[r];
    for (let j = 0; j < n; j += 1) {
      const lon = -180 + ((j + 0.5) * 360) / n;
      const c = Math.floor((lon - lon0) / step);
      if (row[c] === '1') out.push({ lon, lat });
    }
  }
  return out;
}

/** (lon, lat) → единичный вектор: x — к 90° в.д., y — к северному полюсу, z — к (0°, 0°). */
export function toVector(lon, lat) {
  const l = lon * RAD;
  const f = lat * RAD;
  return [Math.cos(f) * Math.sin(l), Math.sin(f), Math.cos(f) * Math.cos(l)];
}

/** Поворот вида: синусы и косинусы считаются раз на кадр. */
export function viewBasis(view) {
  const l = view.lon * RAD;
  const f = view.lat * RAD;
  return { sl: Math.sin(l), cl: Math.cos(l), sf: Math.sin(f), cf: Math.cos(f) };
}

/** Вектор → { x, y, z } на единичном круге (ортографическая проекция с центром в view). */
export function project(v, basis) {
  const { sl, cl, sf, cf } = basis;
  const x = v[0] * cl - v[2] * sl;
  const zr = v[0] * sl + v[2] * cl;
  return { x, y: v[1] * cf - zr * sf, z: v[1] * sf + zr * cf };
}

/** Видна ли точка: передняя полусфера (z > 0). */
export const isVisible = (z) => z > 0;

/** Куда повернуть глобус, чтобы регион встал к центру: его долгота и наклон к нему, не больше tiltMax. */
export function focusView(region) {
  return { lon: wrapLon(region.lon), lat: clamp(region.lat * GLOBE.focusTilt, -GLOBE.tiltMax, GLOBE.tiltMax) };
}

/**
 * Метки регионов (T42): у региона свои pins — у «Америка/Канада» две, США и Канада, подсвечиваются вместе; без pins —
 * одна метка в центре региона; у Worldwide (world: true, pins: []) своей метки нет — он показывает весь мир.
 * → [{ id, region (индекс региона), lon, lat }]; по ним же красятся точки суши (nearestRegion).
 */
export function regionPins(regions) {
  return regions.flatMap((r, region) => (Array.isArray(r.pins) ? r.pins : [r]).map((p) => ({ id: r.id, region, lon: p.lon, lat: p.lat })));
}

/** Worldwide: непрерывное автовращение — вид через dt мс (поверхность едет на восток, вправо); k — разгон 0…1. */
export function spinView(view, dt, k = 1) {
  return { lon: wrapLon(view.lon - GLOBE.spin * clamp(k, 0, 1) * dt), lat: view.lat };
}

/** Ближайший регион к точке суши в пределах maxDeg (широта весит 1.2, как в макете), иначе -1. */
export function nearestRegion(lon, lat, regions, maxDeg = GLOBE.regionDeg) {
  let best = -1;
  let bestD = maxDeg;
  regions.forEach((r, i) => {
    const d = Math.hypot(lonDelta(r.lon, lon), (r.lat - lat) * 1.2);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** Метка под курсором: points — [{ id, x, y, z }] в px; ближайшая видимая в пределах radius, иначе null. */
export function regionAt(points, px, py, radius) {
  let best = null;
  let bestD = radius;
  for (const p of points) {
    if (!isVisible(p.z)) continue;
    const d = Math.hypot(p.x - px, p.y - py);
    if (d <= bestD) {
      bestD = d;
      best = p.id;
    }
  }
  return best;
}

/** Плавный поворот: ease-in-out (кубическая). */
export function easeInOut(t) {
  const k = clamp(t, 0, 1);
  return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
}

/** Вид на доле t пути from → to; по долготе — кратчайшей дорогой. */
export function tweenView(from, to, t) {
  const e = easeInOut(t);
  return { lon: wrapLon(from.lon + lonDelta(from.lon, to.lon) * e), lat: from.lat + (to.lat - from.lat) * e };
}

/** Автовращение: вид через ms после начала покачивания вокруг home; k — разгон 0…1 (0 — стоит ровно на home). */
export function swayView(home, ms, k = 1) {
  const phase = (2 * Math.PI * ms) / GLOBE.swayPeriod;
  return { lon: wrapLon(home.lon + GLOBE.swayAmp * clamp(k, 0, 1) * Math.sin(phase)), lat: home.lat };
}

/** Перетаскивание: сдвиг указателя в px → новый вид (вправо — шар вправо, вниз — к северу). */
export function dragView(view, dx, dy, radius) {
  const k = (GLOBE.dragDeg / Math.max(radius, 1)) / RAD;
  return { lon: wrapLon(view.lon - dx * k), lat: clamp(view.lat + dy * k, -GLOBE.tiltMax, GLOBE.tiltMax) };
}

/** Инерция: скорость через dt мс (экспоненциальное затухание). */
export function decay(velocity, dt, tau = GLOBE.inertia) {
  return velocity * Math.exp(-dt / tau);
}

/** «Вспухание» у курсора: 1 в точке курсора, 0 на радиусе и дальше, плавно (smoothstep). */
export function swell(distance, radius) {
  if (!(radius > 0) || distance >= radius) return 0;
  const k = 1 - distance / radius;
  return k * k * (3 - 2 * k);
}
