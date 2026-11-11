// Тексты сайта → список полей формы админки и обратно: правки → изменённые файлы.
// Поле — одна строка формы: подпись, путь ключа и «слоты» (UA и EN, у config.json — один общий).
// Слот — одно строковое значение в одном файле: { id, file, path, lang, value }.
import { FILES } from './config.js';
import { getAt, locateStrings, pathKey, replaceStrings } from './json-text.js';

/** Разделы в порядке страницы; названия — как их видит владелец сайта, а не ключи. */
export const SECTIONS = [
  ['preloader', 'Заставка'],
  ['nav', 'Шапка і меню'],
  ['hero', 'Перший екран'],
  ['ribbons', 'Стрічки'],
  ['stats', 'Telegram у цифрах'],
  ['niches', 'Ніші'],
  ['formats', 'Формати реклами'],
  ['calculator', 'Калькулятор'],
  ['cases', 'Кейси'],
  ['process', 'Процес роботи'],
  ['geo', 'GEO'],
  ['targeting', 'Таргетинг'],
  ['reviews', 'Відгуки'],
  ['ecosystem', 'Екосистема'],
  ['materials', 'Матеріали'],
  ['faq', 'FAQ'],
  ['cta', 'Контакт'],
  ['footer', 'Підвал'],
  ['common', 'Загальне'],
  ['meta', 'Пошук і соцмережі'],
  ['other', 'Інше'],
].map(([id, title]) => ({ id, title }));

const SECTION_IDS = new Set(SECTIONS.map((s) => s.id));
// ключи словаря, которые живут на экране другого раздела (founder.* убран вместе с блоком засновника — T42)
const SECTION_ALIAS = {};

// слова в путях ключей → подписи по-украински; чего нет — показывается как есть
const WORDS = {
  title: 'Заголовок', titleAccent: 'Акцент заголовка', titleLine1: 'Заголовок, рядок 1', titleLine2: 'Заголовок, рядок 2',
  subtitle: 'Підзаголовок', eyebrow: 'Надзаголовок', lead: 'Вступ', text: 'Текст', label: 'Підпис', value: 'Значення',
  cta: 'Кнопка', button: 'Кнопка', name: 'Назва', alt: 'Опис фото', photoAlt: 'Опис фото', items: 'Пункти',
  q: 'Питання', a: 'Відповідь', note: 'Примітка', tag: 'Мітка', description: 'Опис', badge: 'Значок',
  niche: 'Ніша', budget: 'Бюджет', result: 'Результат', cpa: 'CPA', task: 'Завдання', geo: 'GEO',
  done: 'Що зроблено', review: 'Відгук', step: 'Крок', video: 'Файл відео', link: 'Посилання',
  ogTitle: 'Заголовок для соцмереж', ogDescription: 'Опис для соцмереж', ogImageAlt: 'Опис картинки для соцмереж',
  telegramUrl: 'Посилання на Telegram', telegramHandle: 'Нік у Telegram',
  facts: 'Факти', stats: 'Цифри', trusted: 'Нам довіряють', ad: 'Рекламний пост', photo: 'Фото', sections: 'Пункти меню',
  tabs: 'Вкладки', top: 'Верхня стрічка', chat: 'Чат',
  goal: 'Ціль кампанії', metrics: 'Ключові показники', cover: 'Обкладинка', channel: 'Канал',
  image: 'Зображення (файл)', channelImage: 'Фото каналу (файл)', url: 'Посилання на пост',
  // T42: GEO — цифри регіонів, відгуки — відеокружок, екосистема — кроки
  regions: 'Регіони', users: 'Користувачів Telegram', usersLabel: 'Підпис до користувачів', ukrainians: 'З них українців',
  ukrainiansLabel: 'Підпис до українців', more: 'Інша статистика', moreLabel: 'Підпис до статистики',
  player: 'Відеокружок', soon: 'Підпис, поки відео немає', play: 'Кнопка «Відтворити»', sound: 'Кнопка «Звук»',
  pause: 'Кнопка «Пауза»', case: 'Кейс (аватар)', steps: 'Кроки', role: 'Роль', quote: 'Цитата',
};

const word = (part) => (typeof part === 'number' ? `№${part + 1}` : WORDS[part] || part);
const humanize = (parts) => parts.map(word).join(' · ') || '—';

const slotId = (file, path) => `${file}|${pathKey(path)}`;
const slot = (file, path, lang, value) => ({ id: slotId(file, path), file, path, lang, value });

function kindOf(path) {
  const last = path[path.length - 1];
  if (last === 'telegramUrl') return 'url';
  if (last === 'telegramHandle') return 'handle';
  if (last === 'video') return 'file';
  if (last === 'url') return 'post';
  if (last === 'image' || last === 'channelImage') return 'image';
  return 'text';
}

/** content.ua.json + content.en.json → поля «UA | EN» по одинаковым путям, в порядке украинского файла. */
export function contentFields(uaFile, uaText, enFile, enText) {
  const ua = locateStrings(uaText);
  const en = locateStrings(enText);
  const keys = [...ua.keys(), ...[...en.keys()].filter((k) => !ua.has(k))];
  return keys.map((key) => {
    const path = JSON.parse(key);
    const top = String(path[0]);
    const section = SECTION_ALIAS[top] || (SECTION_IDS.has(top) ? top : 'other');
    const inGroup = path.length > 2 && typeof path[1] === 'string';
    const slots = [];
    if (ua.has(key)) slots.push(slot(uaFile, path, 'ua', ua.get(key).value));
    if (en.has(key)) slots.push(slot(enFile, path, 'en', en.get(key).value));
    return {
      id: `content|${key}`,
      section,
      group: inGroup ? word(path[1]) : '',
      label: humanize(path.slice(inGroup ? 2 : 1)),
      keyPath: path.join('.'),
      kind: kindOf(path),
      slots,
    };
  });
}

// подзаголовок группы для файлов-списков: «Кейс: Monolit», «Питання 3», «Ніші»
function bilingualGroup(section, path, json) {
  if (section === 'cases' && path[0] === 'cases') {
    const name = getAt(json, ['cases', path[1], 'name', 'ua']);
    return { group: `Кейс: ${name || path[1] + 1}`, rest: path.slice(2) };
  }
  if (section === 'faq' && path[0] === 'items') return { group: `Питання ${path[1] + 1}`, rest: path.slice(2) };
  if (section === 'calculator') {
    const names = { niches: 'Варіанти: ніші', geos: 'Варіанти: регіони', goals: 'Варіанти: цілі' };
    return { group: names[path[0]] || word(path[0]), rest: path.slice(1) };
  }
  return { group: '', rest: path };
}

/** Файл со значениями вида { "ua": "…", "en": "…" } → поле на каждую такую пару. Прочие строки (id, цвета, пути) — не тексты. */
export function bilingualFields(file, text, section) {
  const json = JSON.parse(text);
  const spots = locateStrings(text);
  const fields = new Map();
  for (const [key, spot] of spots) {
    const path = JSON.parse(key);
    const lang = path[path.length - 1];
    if (lang !== 'ua' && lang !== 'en') continue;
    const owner = path.slice(0, -1);
    const node = getAt(json, owner);
    if (!node || Array.isArray(node) || !Object.keys(node).every((k) => k === 'ua' || k === 'en')) continue;
    const ownerKey = pathKey(owner);
    if (!fields.has(ownerKey)) {
      const { group, rest } = bilingualGroup(section, owner, json);
      fields.set(ownerKey, {
        id: `${file}|${ownerKey}`,
        section,
        group,
        label: humanize(rest),
        keyPath: owner.join('.'),
        kind: 'text',
        slots: [],
      });
    }
    fields.get(ownerKey).slots.push(slot(file, path, lang, spot.value));
  }
  for (const field of fields.values()) field.slots.sort((a, b) => (a.lang === 'ua' ? -1 : b.lang === 'ua' ? 1 : 0));
  return [...fields.values()];
}

/** config.json → только перечисленные ключи (ссылка и ник Telegram), одно значение на оба языка. */
export function configFields(file, text, keys) {
  const spots = locateStrings(text);
  return keys
    .filter((k) => spots.has(pathKey([k])))
    .map((k) => ({
      id: `${file}|${pathKey([k])}`,
      section: 'common',
      group: 'Telegram',
      label: word(k),
      keyPath: k,
      kind: kindOf([k]),
      slots: [slot(file, [k], 'all', spots.get(pathKey([k])).value)],
    }));
}

/** { [path]: text } (тексты файлов из репозитория) → все поля админки. */
export function buildFields(texts, files = FILES) {
  const fields = [];
  const content = files.filter((f) => f.kind === 'content');
  const ua = content.find((f) => f.lang === 'ua');
  const en = content.find((f) => f.lang === 'en');
  if (ua && en) fields.push(...contentFields(ua.path, texts[ua.path], en.path, texts[en.path]));
  for (const f of files) {
    if (f.kind === 'bilingual') fields.push(...bilingualFields(f.path, texts[f.path], f.section));
    if (f.kind === 'config') fields.push(...configFields(f.path, texts[f.path], f.keys));
  }
  return fields;
}

/** Поля → разделы в порядке страницы; пустые разделы не показываются. Внутри — порядок файлов. */
export function groupBySection(fields) {
  return SECTIONS.map((s) => ({ ...s, fields: fields.filter((f) => f.section === s.id) })).filter((s) => s.fields.length);
}

/* ——— правки: Map(slot.id → новое значение); значение, равное исходному, правкой не считается ——— */

export function setEdit(edits, s, value) {
  if (value === s.value) edits.delete(s.id);
  else edits.set(s.id, value);
}

export const currentValue = (edits, s) => (edits.has(s.id) ? edits.get(s.id) : s.value);

const norm = (s) => String(s).toLocaleLowerCase('uk').replace(/[’ʼ']/g, "'").replace(/\s+/g, ' ');

/** Поиск по всем текстам (исходным и правленым), подписям и путям ключей. Регистр не важен. */
export function search(fields, query, edits = new Map()) {
  const q = norm(query).trim();
  if (!q) return [];
  return fields.filter((f) =>
    [f.label, f.keyPath, f.group, ...f.slots.flatMap((s) => [s.value, currentValue(edits, s)])].some((v) => norm(v).includes(q)),
  );
}

/** Правки → файлы с новым текстом: [{ path, text, count }]. Тексты — как в репозитории, кроме правленых строк. */
export function pendingFiles(fields, edits, texts) {
  const byFile = new Map();
  for (const f of fields) {
    for (const s of f.slots) {
      if (!edits.has(s.id)) continue;
      if (!byFile.has(s.file)) byFile.set(s.file, []);
      byFile.get(s.file).push({ path: s.path, value: edits.get(s.id) });
    }
  }
  return [...byFile].map(([path, list]) => ({ path, text: replaceStrings(texts[path], list), count: list.length }));
}

/** «Тексти: правка через адмінку (2 поля)» — с украинским склонением. */
export function commitMessage(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const noun = mod10 === 1 && mod100 !== 11 ? 'поле' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'поля' : 'полів';
  return `Тексти: правка через адмінку (${n} ${noun})`;
}

/**
 * После «Оновити»: правки переносятся на свежие поля по id слота. Слот исчез (ключ удалили) — правка теряется;
 * совпала с новым значением на сервере — тоже не нужна. Возвращает { edits, dropped }.
 */
export function rebaseEdits(edits, fields) {
  const slots = new Map(fields.flatMap((f) => f.slots).map((s) => [s.id, s]));
  const next = new Map();
  let dropped = 0;
  for (const [id, value] of edits) {
    const s = slots.get(id);
    if (!s) dropped++;
    else if (s.value !== value) next.set(id, value);
  }
  return { edits: next, dropped };
}
