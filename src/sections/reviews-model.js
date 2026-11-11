// 10 Відгуки (T35, T42): данные кружков без DOM — аватар клиента из кейса, файл видео-отзыва и признак заглушки «уточнити».

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

/**
 * Файл видео-отзыва из словаря (reviews.items.*.video → public/video/reviews/<id>.mp4). Тот же формат, что проверяет
 * админка текстов (validate.js, вид поля «file»): путь внутри public/, .mp4 или .webm, без «..». Пусто или не путь к видео — '':
 * круг показывает аватар клиента и «відео-відгук скоро».
 */
export function reviewVideo(value) {
  const path = String(value ?? '').trim();
  return /^\/?(?!.*\.\.)[A-Za-z0-9_\-/.]+\.(?:mp4|webm)$/i.test(path) ? path : '';
}
