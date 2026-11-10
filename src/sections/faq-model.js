// 13 FAQ: чистая раскладка вопросов по колонкам (без DOM — проверяется тестом).

/** items → колонки: первая получает лишний элемент при нечётном числе ([5, 4] для девяти). */
export function splitColumns(items, cols = 2) {
  const out = Array.from({ length: cols }, () => []);
  const per = Math.ceil(items.length / cols);
  items.forEach((item, i) => out[Math.min(Math.floor(i / per), cols - 1)].push(item));
  return out;
}
