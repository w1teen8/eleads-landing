// T38 (H51): логика админки текстов без сети — JSON → поля, правки → JSON как в репозитории, проверка значений,
// base64 UTF-8, разделы, поиск, токен в хранилище.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';
import { FILES, MAX_LENGTH } from '../src/admin/config.js';
import { getAt, locateStrings, pathKey, replaceStrings } from '../src/admin/json-text.js';
import {
  SECTIONS,
  buildFields,
  commitMessage,
  contentFields,
  currentValue,
  groupBySection,
  pendingFiles,
  rebaseEdits,
  search,
  setEdit,
} from '../src/admin/fields.js';
import { validate } from '../src/admin/validate.js';
import { fromBase64Utf8, toBase64Utf8 } from '../src/admin/github.js';
import { clearToken, isTokenShape, loadToken, saveToken } from '../src/admin/token.js';

// тексты как на GitHub: в рабочей копии Windows файлы могут лежать с CRLF, в репозитории — LF
const texts = Object.fromEntries(FILES.map((f) => [f.path, read(f.path).replace(/\r\n/g, '\n')]));
const fields = buildFields(texts);
const slots = fields.flatMap((f) => f.slots);
const fieldOf = (keyPath, file) => fields.find((f) => f.keyPath === keyPath && (!file || f.slots[0].file === file));

function stringPaths(obj, path = [], out = []) {
  if (typeof obj === 'string') out.push(path);
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) stringPaths(v, [...path, Array.isArray(obj) ? Number(k) : k], out);
  return out;
}

test('locateStrings: каждая строка-значение найдена по пути, ключи и числа — нет', () => {
  const text = '{\n  "a": "x",\n  "n": 1.5,\n  "b": [ "y", { "c": "q\\"\\\\\\u0410" } ],\n  "t": true\n}\n';
  const spots = locateStrings(text);
  assert.deepEqual([...spots.keys()], [pathKey(['a']), pathKey(['b', 0]), pathKey(['b', 1, 'c'])]);
  const c = spots.get(pathKey(['b', 1, 'c']));
  assert.equal(c.value, 'q"\\А');
  assert.equal(text.slice(c.start, c.end), '"q\\"\\\\\\u0410"');
  assert.throws(() => locateStrings('{"a": }'));
  assert.throws(() => locateStrings('{"a": "x"} junk'));
});

test('locateStrings совпадает с JSON.parse на всех файлах текстов', () => {
  for (const f of FILES) {
    const json = JSON.parse(texts[f.path]);
    const spots = locateStrings(texts[f.path]);
    const expected = stringPaths(json);
    assert.equal(spots.size, expected.length, f.path);
    for (const p of expected) assert.equal(spots.get(pathKey(p))?.value, getAt(json, p), `${f.path}: ${p.join('.')}`);
  }
});

test('replaceStrings: без правок — файл байт в байт; с правкой — меняется только эта строка, формат как в репо', () => {
  for (const f of FILES) assert.equal(replaceStrings(texts[f.path], []), texts[f.path], f.path);

  // content.*.json и faq.json в репозитории — ровно JSON.stringify(…, null, 2) + перевод строки
  const ua = 'src/data/content.ua.json';
  const next = replaceStrings(texts[ua], [{ path: ['hero', 'subtitle'], value: 'Новий "підзаголовок" \\ з лапками — ’' }]);
  const expected = JSON.parse(texts[ua]);
  expected.hero.subtitle = 'Новий "підзаголовок" \\ з лапками — ’';
  assert.equal(next, `${JSON.stringify(expected, null, 2)}\n`);
  assert.ok(next.endsWith('}\n'));
  const before = texts[ua].split('\n');
  const after = next.split('\n');
  assert.equal(after.length, before.length);
  assert.equal(after.filter((line, i) => line !== before[i]).length, 1, 'изменилась одна строка файла');

  // config.json / calculator.json свёрстаны вручную (массивы в строку) — форма сохраняется
  const cfg = 'src/data/config.json';
  const cfgNext = replaceStrings(texts[cfg], [{ path: ['telegramHandle'], value: '@NewHandle' }]);
  assert.equal(cfgNext, texts[cfg].replace('"@Kucherflow"', '"@NewHandle"'));
  const calc = 'src/data/calculator.json';
  const calcNext = replaceStrings(texts[calc], [{ path: ['geos', 0, 'label', 'en'], value: 'Ukraine (UA)' }]);
  assert.equal(calcNext, texts[calc].replace('"en": "Ukraine"', '"en": "Ukraine (UA)"'));
});

test('replaceStrings не меняет структуру: нет пути или там не строка — ошибка', () => {
  const calc = texts['src/data/calculator.json'];
  assert.throws(() => replaceStrings(calc, [{ path: ['spread'], value: '1' }]), /нет строки/);
  assert.throws(() => replaceStrings(calc, [{ path: ['nope'], value: 'x' }]), /нет строки/);
  assert.throws(() => replaceStrings(calc, [{ path: ['geos', 0, 'id'], value: 5 }]), /не строка/);
});

test('поля: все строки словарей UA/EN — парами по одному пути; флаги и числа не попадают', () => {
  const ua = JSON.parse(texts['src/data/content.ua.json']);
  const en = JSON.parse(texts['src/data/content.en.json']);
  const content = fields.filter((f) => f.id.startsWith('content|'));
  const keys = new Set([...stringPaths(ua), ...stringPaths(en)].map(pathKey));
  assert.equal(content.length, keys.size);
  const title = fieldOf('hero.subtitle');
  assert.deepEqual(title.slots.map((s) => s.lang), ['ua', 'en']);
  assert.equal(title.slots[0].value, ua.hero.subtitle);
  assert.equal(title.slots[1].value, en.hero.subtitle);
  assert.equal(title.section, 'hero');
  assert.equal(title.label, 'Підзаголовок');
  assert.ok(!fields.some((f) => f.keyPath === 'draft'), 'флаг draft — не текст');
});

test('поля: FAQ, кейсы, калькулятор — только пары {ua, en}; id, цвета, пути картинок, заметки — нет', () => {
  const faq = JSON.parse(texts['src/data/faq.json']);
  const faqFields = fields.filter((f) => f.slots[0].file === 'src/data/faq.json');
  assert.equal(faqFields.length, faq.items.length * 2);
  assert.ok(faqFields.every((f) => f.section === 'faq' && f.slots.length === 2));
  assert.equal(faqFields[0].group, 'Питання 1');
  assert.equal(faqFields[0].label, 'Питання');
  assert.equal(faqFields[1].label, 'Відповідь');

  const caseFields = fields.filter((f) => f.slots[0].file === 'src/data/cases.json');
  const casePaths = caseFields.map((f) => f.keyPath);
  assert.ok(casePaths.includes('cases.0.name') && casePaths.includes('cases.0.done.0') && casePaths.includes('cases.0.task'));
  assert.ok(!casePaths.some((p) => /\.(id|accent|screenshot)$|^_note/.test(p)), casePaths.join(' '));
  assert.match(caseFields[0].group, /^Кейс: /);

  const calcFields = fields.filter((f) => f.slots[0].file === 'src/data/calculator.json');
  assert.ok(calcFields.length > 0 && calcFields.every((f) => /\.(label|step)$/.test(f.keyPath)), calcFields.map((f) => f.keyPath).join(' '));

  const cfg = fields.filter((f) => f.slots[0].file === 'src/data/config.json');
  assert.deepEqual(cfg.map((f) => [f.keyPath, f.kind, f.slots.length, f.slots[0].lang]), [
    ['telegramUrl', 'url', 1, 'all'],
    ['telegramHandle', 'handle', 1, 'all'],
  ]);
});

test('разделы: в порядке страницы, с человеческими названиями; видео-отзывы — в «Відгуках», незнакомый ключ — в «Інше»', () => {
  const sections = groupBySection(fields);
  const ids = sections.map((s) => s.id);
  const order = SECTIONS.map((s) => s.id);
  assert.deepEqual(ids, order.filter((id) => ids.includes(id)), 'порядок как в SECTIONS');
  for (const id of ['hero', 'stats', 'niches', 'cases', 'faq', 'cta', 'footer', 'common']) assert.ok(ids.includes(id), id);
  assert.ok(ids.indexOf('hero') < ids.indexOf('faq') && ids.indexOf('faq') < ids.indexOf('footer'));
  assert.equal(sections.find((s) => s.id === 'hero').title, 'Перший екран');
  assert.equal(sections.reduce((n, s) => n + s.fields.length, 0), fields.length, 'каждое поле — ровно в одном разделе');
  // T42: блока засновника нет — founder.* удалён; видео-отзыв клиента — путь к файлу, правится в «Відгуках»
  assert.ok(!fields.some((f) => f.keyPath.startsWith('founder.')), 'founder.* нет');
  assert.equal(sections.find((s) => s.id === 'reviews').title, 'Відгуки');
  for (const i of [0, 1]) {
    const video = fieldOf(`reviews.items.${i}.video`);
    assert.equal(video.section, 'reviews');
    assert.equal(video.kind, 'file');
    const file = ['video/reviews/mukhin.mp4', 'video/reviews/dombovetskyi.mp4'][i]; // 2026-11-11: видео подключены
    assert.deepEqual(video.slots.map((s) => [s.lang, s.value]), [['ua', file], ['en', file]]);
  }
  // T42: цифры GEO и шаги экосистемы — строки словарей, админка их показывает
  for (const key of ['geo.regions.europe.users', 'geo.regions.europe.ukrainians', 'geo.regions.america.ukrainians', 'geo.regions.worldwide.users']) {
    assert.equal(fieldOf(key).section, 'geo', key);
  }
  assert.equal(fieldOf('ecosystem.steps.4.items.0').section, 'ecosystem');
  assert.equal(fieldOf('geo.regions.europe.users').group, 'Регіони');
  assert.equal(fieldOf('geo.regions.europe.users').label, 'europe · Користувачів Telegram');
  const extra = contentFields('ua', '{"zzz": {"x": "a"}}\n', 'en', '{"zzz": {"x": "b"}}\n');
  assert.equal(extra[0].section, 'other');
});

test('правки: два поля в двух файлах → два файла, остальное как было; совпало с исходным — не правка', () => {
  const edits = new Map();
  const subtitle = fieldOf('hero.subtitle').slots[0];
  const faqQ = fieldOf('items.0.q', 'src/data/faq.json').slots[1];
  setEdit(edits, subtitle, 'Новий підзаголовок');
  setEdit(edits, faqQ, 'New question?');
  assert.equal(edits.size, 2);
  assert.equal(currentValue(edits, subtitle), 'Новий підзаголовок');
  const files = pendingFiles(fields, edits, texts);
  assert.deepEqual(files.map((f) => [f.path, f.count]), [
    ['src/data/content.ua.json', 1],
    ['src/data/faq.json', 1],
  ]);
  const faq = JSON.parse(files[1].text);
  const original = JSON.parse(texts['src/data/faq.json']);
  original.items[0].q.en = 'New question?';
  assert.deepEqual(faq, original);
  assert.deepEqual(Object.keys(faq.items[0]), Object.keys(original.items[0]), 'порядок ключей');

  setEdit(edits, subtitle, subtitle.value);
  assert.equal(edits.size, 1, 'вернули исходное — правка снята');
  assert.equal(commitMessage(1), 'Тексти: правка через адмінку (1 поле)');
  assert.equal(commitMessage(2), 'Тексти: правка через адмінку (2 поля)');
  assert.equal(commitMessage(5), 'Тексти: правка через адмінку (5 полів)');
  assert.equal(commitMessage(11), 'Тексти: правка через адмінку (11 полів)');
  assert.equal(commitMessage(22), 'Тексти: правка через адмінку (22 поля)');
});

test('rebaseEdits: после обновления правки переносятся по пути; исчезнувший ключ и совпавшее значение отпадают', () => {
  const edits = new Map([
    [slots[0].id, 'інше'],
    [slots[1].id, slots[1].value],
    ['src/data/content.ua.json|["gone"]', 'x'],
  ]);
  const { edits: next, dropped } = rebaseEdits(edits, fields);
  assert.deepEqual([...next.keys()], [slots[0].id]);
  assert.equal(dropped, 1);
});

test('поиск: по UA и EN, без учёта регистра, по пути ключа и по ещё не сохранённой правке', () => {
  const ua = JSON.parse(texts['src/data/content.ua.json']);
  const en = JSON.parse(texts['src/data/content.en.json']);
  assert.ok(search(fields, ua.hero.subtitle.slice(0, 12).toUpperCase()).some((f) => f.keyPath === 'hero.subtitle'));
  assert.ok(search(fields, en.faq.title).some((f) => f.keyPath === 'faq.title'));
  assert.ok(search(fields, 'hero.ad.button').some((f) => f.keyPath === 'hero.ad.button'));
  assert.deepEqual(search(fields, '   '), []);
  const edits = new Map([[fieldOf('hero.ad.title').slots[0].id, 'Унікальнийтекстzz']]);
  assert.deepEqual(search(fields, 'унікальнийтекстZZ', edits).map((f) => f.keyPath), ['hero.ad.title']);
});

test('validate: пусто, пробелы, переносы, служебные символы, длина, форматы ссылки, ника и видео', () => {
  assert.equal(validate('Текст', { original: 'x' }), null);
  assert.match(validate('', { original: 'x' }), /Порожнім/);
  assert.match(validate('   ', { original: 'x' }), /Порожнім/);
  assert.equal(validate('', { original: '' }), null, 'поле было пустым — может остаться пустым');
  assert.match(validate('a\nb'), /переносу/);
  assert.match(validate('a\u0007b'), /службові/);
  assert.match(validate('a\u202eb'), /службові/);
  assert.match(validate('a\u2028b'), /службові/);
  assert.equal(validate('я'.repeat(MAX_LENGTH)), null);
  assert.match(validate('я'.repeat(MAX_LENGTH + 1)), /Задовго/);
  assert.equal(validate('<b>&amp;</b> "лапки"'), null, 'теги — просто текст: сайт выводит их как текст');

  assert.equal(validate('https://t.me/Kucherflow', { kind: 'url' }), null);
  assert.match(validate('javascript:alert(1)', { kind: 'url' }), /t\.me/);
  assert.match(validate('https://evil.example/t.me/x', { kind: 'url' }), /t\.me/);
  assert.equal(validate('@Kucherflow', { kind: 'handle' }), null);
  assert.match(validate('Kucherflow', { kind: 'handle' }), /@/);
  assert.equal(validate('/video/founder.mp4', { kind: 'file' }), null);
  assert.equal(validate('video/reviews/mukhin.mp4', { kind: 'file', original: '' }), null);
  assert.equal(validate('', { kind: 'file', original: '' }), null);
  assert.equal(validate('', { kind: 'file', original: 'video/reviews/mukhin.mp4' }), null, 'видео-отзыв можно убрать');
  assert.match(validate('   ', { kind: 'file', original: 'video/reviews/mukhin.mp4' }), /Порожнім/);
  assert.match(validate('https://evil.example/a.mp4', { kind: 'file' }), /public/);
  assert.match(validate('/video/../../x.mp4', { kind: 'file' }), /public/);
});

test('base64 UTF-8: кириллица, апострофы, эмодзи — туда и обратно, как у GitHub (с переносами строк)', () => {
  const text = 'Привіт, Telegram Ads — ’ «лапки» € 🚀\n';
  const b64 = toBase64Utf8(text);
  assert.equal(b64, Buffer.from(text, 'utf8').toString('base64'));
  assert.equal(fromBase64Utf8(b64), text);
  const wrapped = b64.replace(/(.{20})/g, '$1\n');
  assert.equal(fromBase64Utf8(wrapped), text);
  const big = texts['src/data/content.ua.json'];
  assert.equal(fromBase64Utf8(toBase64Utf8(big)), big);
  assert.throws(() => fromBase64Utf8(Buffer.from([0xff, 0xfe]).toString('base64')));
});

test('токен: sessionStorage по умолчанию, localStorage — по галочке, «Вийти» стирает оба; чужое — не токен', () => {
  const store = () => {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
  };
  const stores = { session: store(), local: store() };
  const token = `github_pat_${'A1b2'.repeat(20)}`;
  assert.ok(isTokenShape(token) && isTokenShape(`ghp_${'x'.repeat(36)}`));
  assert.ok(!isTokenShape('github_pat_ with space') && !isTokenShape('') && !isTokenShape('<script>'));
  saveToken(token, false, stores);
  assert.equal(stores.session.m.size, 1);
  assert.equal(stores.local.m.size, 0);
  assert.equal(loadToken(stores), token);
  saveToken(token, true, stores);
  assert.equal(stores.session.m.size, 0, 'при «Запамʼятати» копии в сессии нет');
  assert.equal(stores.local.m.size, 1);
  assert.equal(loadToken(stores), token);
  clearToken(stores);
  assert.equal(stores.local.m.size + stores.session.m.size, 0);
  assert.equal(loadToken(stores), '');
  const broken = { session: { getItem: () => { throw new Error('denied'); } }, local: null };
  assert.equal(loadToken(broken), '', 'недоступное хранилище — не ошибка');
});
