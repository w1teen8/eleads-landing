// 13 FAQ: чистые помощники переписки (без DOM — проверяются тестом).

/** Значение из faq.json: { ua, en } → строка нужного языка (запасной — украинский); строка — как есть. */
export function pickText(value, lang) {
  if (value && typeof value === 'object') return String(value[lang] ?? value.ua ?? '');
  return String(value ?? '');
}

/** Ответа ещё нет — заглушка «уточнити» / «TBD» (или подпись common.tbd текущего языка). */
export function isTbd(text, label) {
  return text === 'уточнити' || text === 'TBD' || (Boolean(label) && text === label);
}

/** Следующий вопрос автолистания: по кругу. */
export function nextIndex(i, total) {
  return total > 0 ? (i + 1) % total : 0;
}
