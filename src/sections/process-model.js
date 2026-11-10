// 07 Процес (T32): математика роста ступеней — без DOM, чтобы проверять тестами.
// Экран закреплён под шапкой (pinScrub из motion-kit), пока прокрутка проходит путь PIN.length() высот окна; прогресс
// p (0…1) привязан к позиции прокрутки. Ступени растут шаг за шагом: у каждой свой отрезок пути, рост занимает его
// первые PIN.grow, остальное — пауза перед следующей; после седьмой — пауза PIN.tail, и экран отпускается. На своём
// отрезке фон ступени вырастает из основания (scaleY от низа), номер едет за верхним краем фона, номер и подпись
// проявляются. Номер и подпись не масштабируются.

/** Путь закрепления в высотах окна: step — на ступень, grow — доля отрезка на рост, tail — пауза после последней. */
export const PIN = { step: 0.35, grow: 0.7, tail: 0.2 };
/** Фон ступени до роста — тонкая полоска на основании одной высоты у всех ступеней, px (а не пустое место). */
export const GROW_MIN_PX = 8;
/** Та же полоска долей высоты — для основания и когда высота ступени ещё неизвестна. */
export const GROW_MIN = 0.05;
/** Непрозрачность номера и подписи до роста ступени: текст угадывается, но «не горит». */
export const DIM = 0.18;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Длина закрепления для n ступеней, в высотах окна. */
export function pinLength(n, { step, tail } = PIN) {
  return Math.max(0, n) * step + tail;
}

/** Отрезок общего прогресса, на котором растёт ступень i из n: { from, to }. */
export function stepWindow(i, n, pin = PIN) {
  const total = pinLength(n, pin);
  if (!(total > 0)) return { from: 0, to: 1 };
  const from = (i * pin.step) / total;
  return { from, to: from + (pin.grow * pin.step) / total };
}

/** Прогресс ступени i (0…1) при общем прогрессе p. */
export function stepProgress(p, i, n, pin = PIN) {
  const { from, to } = stepWindow(i, n, pin);
  return clamp01((p - from) / (to - from));
}

/** Плавный старт и мягкая остановка, без выхода за 0…1. */
export function smooth(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/**
 * Положение ступени при её прогрессе t:
 *   scale — масштаб фона по высоте, от основания: от полоски GROW_MIN_PX (у всех ступеней одной высоты) до 1;
 *   numY  — сдвиг номера вниз, px: номер идёт за верхним краем фона (height — полная высота ступени), но не дальше
 *           room — свободного места между номером и подписью в конечном виде (на подпись не наезжает);
 *   glow  — непрозрачность номера и подписи (DIM … 1).
 */
export function stepPose(t, { height = 0, room = 0 } = {}) {
  const k = smooth(t);
  const min = height > 0 ? Math.min(1, GROW_MIN_PX / height) : GROW_MIN;
  const scale = min + (1 - min) * k;
  const numY = Math.max(0, Math.min((1 - scale) * height, room));
  const glow = DIM + (1 - DIM) * k;
  return { scale, numY, glow };
}
