// Правка JSON-файла как текста: меняются только строковые значения, всё остальное — байт в байт как в репозитории
// (отступы, порядок ключей, однострочные массивы config.json / calculator.json, перевод строки в конце).
// Поэтому файл не пересобирается через JSON.stringify целиком: находим в тексте позицию нужной строки и подменяем её.

/** Ключ пути для Map: ['hero', 'facts', 0] → '["hero","facts",0]'. */
export const pathKey = (path) => JSON.stringify(path);

/**
 * Текст JSON → Map(pathKey → { start, end, value }) для каждого строкового значения (не ключа).
 * start/end — границы токена в тексте вместе с кавычками. Битый JSON — исключение.
 */
export function locateStrings(text) {
  const out = new Map();
  let i = 0;
  const fail = (what) => {
    throw new SyntaxError(`JSON: ${what} на позиции ${i}`);
  };
  const space = () => {
    while (i < text.length && (text[i] === ' ' || text[i] === '\n' || text[i] === '\r' || text[i] === '\t')) i++;
  };
  const expect = (ch) => {
    space();
    if (text[i] !== ch) fail(`ожидался «${ch}»`);
    i++;
  };
  const string = () => {
    const start = i;
    i++;
    while (i < text.length && text[i] !== '"') i += text[i] === '\\' ? 2 : 1;
    if (i >= text.length) fail('незакрытая строка');
    i++;
    return { start, end: i, value: JSON.parse(text.slice(start, i)) };
  };
  const value = (path) => {
    space();
    const ch = text[i];
    if (ch === '{') {
      i++;
      space();
      if (text[i] === '}') return void i++;
      for (;;) {
        space();
        if (text[i] !== '"') fail('ожидался ключ');
        const key = string().value;
        expect(':');
        value([...path, key]);
        space();
        if (text[i] === ',') {
          i++;
          continue;
        }
        expect('}');
        return;
      }
    }
    if (ch === '[') {
      i++;
      space();
      if (text[i] === ']') return void i++;
      for (let n = 0; ; n++) {
        value([...path, n]);
        space();
        if (text[i] === ',') {
          i++;
          continue;
        }
        expect(']');
        return;
      }
    }
    if (ch === '"') {
      out.set(pathKey(path), string());
      return;
    }
    const literal = /^(?:-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(text.slice(i, i + 64));
    if (!literal) fail('неизвестное значение');
    i += literal[0].length;
  };
  if (text.charCodeAt(0) === 0xfeff) i = 1;
  value([]);
  space();
  if (i !== text.length) fail('лишний текст после JSON');
  return out;
}

/**
 * Текст JSON + правки [{ path, value }] → новый текст. Правка возможна только там, где уже лежит строка:
 * ключи, структура, числа и флаги не меняются. Путь не найден — исключение (файл на сервере успел поменяться).
 */
export function replaceStrings(text, edits) {
  const spots = locateStrings(text);
  const patches = edits.map(({ path, value }) => {
    const spot = spots.get(pathKey(path));
    if (!spot) throw new Error(`нет строки по пути ${path.join('.')}`);
    if (typeof value !== 'string') throw new TypeError(`значение ${path.join('.')} — не строка`);
    return { ...spot, next: JSON.stringify(value) };
  });
  patches.sort((a, b) => b.start - a.start);
  let out = text;
  for (const p of patches) out = out.slice(0, p.start) + p.next + out.slice(p.end);
  JSON.parse(out); // страховка: результат обязан остаться валидным JSON
  return out;
}

/** Значение по пути внутри разобранного JSON. */
export function getAt(obj, path) {
  return path.reduce((node, part) => (node == null ? undefined : node[part]), obj);
}
