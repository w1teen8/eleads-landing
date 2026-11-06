// Чистая математика карты GEO — без DOM, чтобы проверяться в node.

/** Фаза пульса 0..1 для региона. Долгота бывает отрицательной (Америка): % в JS даёт отрицательный остаток, а он ломал ctx.arc. */
export function pulsePhase(now, lon, periodMs) {
  const raw = (now + lon * 11) % periodMs;
  return (raw + periodMs) % periodMs / periodMs;
}
