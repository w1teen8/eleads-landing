// Проверка значения перед сохранением. Возвращает текст ошибки для человека или null.
import { MAX_LENGTH } from './config.js';

// управляющие символы (в т.ч. перевод строки и табуляция), DEL, разделители строк U+2028/U+2029,
// невидимые символы смены направления текста (U+202A–U+202E, U+2066–U+2069)
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/;

// у полей особого вида — свой формат (kind ставит src/admin/fields.js)
const FORMATS = {
  url: { re: /^https:\/\/t\.me\/[A-Za-z0-9_]{3,64}\/?$/, hint: 'Посилання має бути таким: https://t.me/імʼя' },
  handle: { re: /^@[A-Za-z0-9_]{3,64}$/, hint: 'Нік має бути таким: @імʼя (латиниця, цифри, _)' },
  file: { re: /^\/?(?!.*\.\.)[A-Za-z0-9_\-/.]+\.(?:mp4|webm)$/, hint: 'Шлях до відео з public/, наприклад video/reviews/mukhin.mp4' },
  // T40, блок 12: ссылка на пост канала и картинка из public/ (те же правила — в src/sections/materials.js)
  post: { re: /^https:\/\/t\.me\/[A-Za-z0-9_]{3,64}(?:\/\d{1,10})?\/?$/, hint: 'Посилання на пост: https://t.me/канал/123' },
  image: { re: /^(?!\/\/)\/?(?!.*\.\.)[A-Za-z0-9_\-/.]+\.(?:webp|avif|jpe?g|png)$/i, hint: 'Шлях до картинки з public/, наприклад img/posts/8-sposobiv.webp' },
};

/**
 * value — новое значение; original — значение из репозитория; kind — 'text' | 'url' | 'handle' | 'file' | 'post' | 'image'.
 * Пустое нельзя (страница осталась бы без текста), кроме полей, которые пустые и сейчас (например, видео ещё нет).
 */
export function validate(value, { original = '', kind = 'text' } = {}) {
  if (typeof value !== 'string') return 'Значення має бути текстом';
  if (/[\r\n]/.test(value)) return 'Без переносу рядка: текст — одним рядком';
  if (CONTROL.test(value)) return 'Є невидимі службові символи — видаліть їх';
  if (value.length > MAX_LENGTH) return `Задовго: ${value.length} із ${MAX_LENGTH} символів`;
  // путь к видео можно и очистить: видео-отзыв убран — на сайте снова аватар и «відео-відгук скоро» (T42)
  if (!value.trim()) return value === '' && (kind === 'file' || !String(original).trim()) ? null : 'Порожнім залишати не можна';
  const format = FORMATS[kind];
  if (format && !format.re.test(value)) return format.hint;
  return null;
}
