// 14 Фінальний CTA — фон «Silk» на весь блок (выбор пользователя 2026-11-11: «silk сделай на весь блок»; образец —
// компонент Silk Background с Framer Marketplace, поведение повторено своим кодом). Десятки тонких линий лежат одна
// под другой и вместе складываются в шёлковую ткань: каждая изгибается суммой двух медленных волн, а по «ткани»
// пробегает тёплый отблеск. Чистые функции — форма линии и яркость отблеска; рисование и анимация — в cta.js.

/** Параметры ткани в «единицах блока» (высота блока = 877 единиц). */
export const SILK = { gap: 16, step: 20, a1: 60, k1: 0.004, v1: 0.35, a2: 28, k2: 0.009, v2: -0.28, base: 0.05, sheen: 0.3, width: 1.4 };

/** Высота блока в единицах: всё масштабируется от неё, рисунок одинаковый на любом экране. */
export const UNIT_H = 877;

/** y линии i в точке x на секунде t. */
export function silkY(i, x, t, s = SILK) {
  const y0 = -60 + i * s.gap;
  return y0 + s.a1 * Math.sin(x * s.k1 + t * s.v1 + i * 0.12) + s.a2 * Math.sin(x * s.k2 + t * s.v2 + i * 0.05);
}

/** Отблеск линии i (0…1): волна, что медленно катится поперёк ткани. */
export function sheenOf(i, t) {
  return Math.max(0, Math.sin(i * 0.22 + t * 0.7));
}

/** Сколько линий нужно, чтобы закрыть высоту с запасом на изгибы. */
export function lineCount(s = SILK) {
  return Math.ceil((UNIT_H + 120) / s.gap) + 1;
}

/** '#RRGGBB' / '#RGB' → [r, g, b]; иначе null. */
export function hexRgb(value) {
  const m = String(value ?? '').trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
