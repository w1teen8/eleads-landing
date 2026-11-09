// Путь к файлу из public/ с учётом base сборки (GitHub Pages: /eleads-landing/, локально «/»).
// Внешние адреса (http:, data:, blob:, //) и пустая строка возвращаются как есть.
const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';

export function publicUrl(path, base = BASE) {
  if (!path || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return path;
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return prefix + path.replace(/^\/+/, '');
}
