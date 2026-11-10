// 10 Відгуки (T35): данные кружков без DOM — аватар клиента из кейса и признак заглушки «уточнити».

/** Шаг автолистания отзывов, мс («раз в 10 секунд», как диск блока 09). */
export const STEP_MS = 10000;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Аватар отзыва по id кейса (reviews.items.*.case → cases.json). Фото — только у кейса с avatar: true; retina-файл —
 * если не avatarRetina: false. path(id, retina) строит адрес (на сайте — publicUrl(avatarPath(…))).
 * Нет кейса или фото → null: кружок показывает первую букву имени.
 */
export function reviewAvatar(caseId, cases, path) {
  const id = String(caseId ?? '').trim();
  const item = id && Array.isArray(cases) ? cases.find((c) => c?.id === id) : null;
  if (!item || item.avatar !== true) return null;
  const src = path(id, false);
  return {
    src,
    srcset: item.avatarRetina === false ? null : `${src} 1x, ${path(id, true)} 2x`,
    accent: typeof item.accent === 'string' && HEX.test(item.accent) ? item.accent : null,
  };
}

/** «уточнити» / «TBD» — текста от клиента ещё нет: показывается приглушённо. */
export const isTbd = (value) => /^(уточнити|tbd)$/i.test(String(value ?? '').trim());
