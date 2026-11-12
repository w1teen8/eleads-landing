// T03: десять секций с настоящим текстом: данные FAQ и карты, разметка, места клика в Telegram, правила движения.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const faq = readJson('src/data/faq.json');
const geo = readJson('src/data/geo-dots.json');

const section = (id) => html.split(new RegExp(`<section\\b[^>]*\\sid="${id}"`))[1].split('</section>')[0];
const count = (s, re) => (s.match(re) || []).length;

const QUESTIONS_UA = [
  // 2026-11-11: формулировки — дословно со страницы клиента «Часті питання»
  'Який мінімальний рекламний бюджет?', 'Скільки коштують послуги?', 'Чи підійде Telegram для моєї ніші?',
  'Чи можна рекламувати сайт?', 'Які країни доступні для реклами?', 'Як швидко можна запустити рекламу?',
  'Чи можете створити Telegram-канал з нуля?', 'Чи працюєте з міжнародними проєктами?',
];

test('faq.json: 8 питань клієнта по порядку, відповідь на перше — €650–780, у кожного UA та EN', () => {
  assert.deepEqual(faq.items.map((i) => i.q.ua), QUESTIONS_UA);
  assert.match(faq.items[0].a.ua, /€650/);
  assert.match(faq.items[0].a.en, /€650/);
  for (const item of faq.items) {
    assert.ok(item.a.ua && item.a.en && item.q.en, item.id);
  }
  // клиент прислал все ответы — заглушек больше нет
  for (const item of faq.items) assert.ok(item.a.ua !== 'уточнити' && item.a.en !== 'TBD', item.id);
});

test('geo-dots.json: сетка суши согласована с размерами, 4 региона (T42) и их метки внутри карты', () => {
  assert.equal(geo.rowsData.length, geo.rows);
  for (const row of geo.rowsData) assert.equal(row.length, geo.cols);
  const land = geo.rowsData.join('').split('1').length - 1;
  assert.ok(land > 600 && land < 3000, `точек суши: ${land}`);
  assert.deepEqual(geo.regions.map((r) => r.id), ['ukraine', 'europe', 'america', 'worldwide']);
  for (const r of [...geo.regions, ...geo.regions.flatMap((x) => x.pins ?? [])]) {
    const col = Math.floor((r.lon - geo.lon0) / geo.step);
    const row = Math.floor((geo.lat0 - r.lat) / geo.step);
    assert.ok(col >= 0 && col < geo.cols && row >= 0 && row < geo.rows, r.id);
  }
});

// T33: единственный <canvas> на странице — точечный глобус GEO (правило 5 interfaces.md); останавливается вне экрана
// (подробно — tests/geo-globe.test.js). T30: бегущего импульса в блоке 11 больше нет (tests/blocks-09-11.test.js).
test('на странице один <canvas> — глобус GEO, который сам останавливается вне экрана', () => {
  assert.equal(count(html, /<canvas\b/g), 1);
  assert.equal(count(section('geo'), /<canvas\b/g), 1);
  assert.match(read('src/sections/geo.js'), /IntersectionObserver/);
});

test('раскладка секций: 8 ниш, 3 формата, 7 шагов, 4 региона, 3 способа таргетинга, 5 этапов и 10 услуг', () => {
  assert.equal(count(section('niches'), /class="niches__item"/g), 8);
  assert.equal(count(section('formats'), /class="formats__item"/g), 3);
  assert.equal(count(section('process'), /class="process__step[ "]/g), 7);
  assert.equal(count(section('geo'), /data-region="/g), 4);
  assert.equal(count(section('targeting'), /class="tg__item"/g), 3);
  assert.equal(count(section('ecosystem'), /class="eco__step[ "]/g), 5);
  assert.equal(count(section('ecosystem'), /class="eco__service"/g), 10);
  assert.equal(count(section('materials'), /class="mat__item"/g), 4);
});

test('вкладки статистики — role=tablist/tab/tabpanel с aria-controls', () => {
  const s = section('stats');
  assert.match(s, /role="tablist"/);
  assert.equal(count(s, /role="tab"/g), 2);
  assert.equal(count(s, /role="tabpanel"/g), 2);
  assert.match(s, /aria-controls="stats-panel-ua"/);
});

test('ссылки в Telegram этих секций размечены местом клика', () => {
  const places = (id) => [...section(id).matchAll(/data-place="([a-z_]+)"/g)].map((m) => m[1]);
  assert.deepEqual(places('niches'), ['niches_other']);
  assert.deepEqual(places('materials'), ['materials', 'materials', 'materials', 'materials']);
  // T41: телефон с чатом (вторая ссылка, final_cta_chat) заменён фото — в блоке одна кнопка в Telegram
  assert.deepEqual(places('cta'), ['final_cta']);
});

test('тексты: ключевые дословные строки UA и EN-черновик заполнены', () => {
  assert.equal(ua.stats.ua.main.value, '81%');
  assert.equal(ua.stats.ww.main.value, '1B+');
  assert.equal(ua.stats.footnote, undefined, 'сноску блока 02 клиент убрал (T25)');
  assert.equal(ua.niches.items.length, 7);
  assert.equal(ua.niches.other.name, 'Інша ніша?');
  assert.equal(ua.process.steps.length, 7);
  // T29: текст о подходе — не подпись под блоком, а текст рядом с заголовком (process.lead вместо process.note)
  assert.match(ua.process.lead, /^Клієнту не потрібно самостійно розбиратися в Telegram Ads/);
  assert.equal(ua.process.note, undefined);
  // T42: шлях клієнта — пять шагов из документа клиента
  assert.deepEqual(ua.ecosystem.steps.map((s) => s.name), ['Трафік', 'Посадкові', 'Контент', 'Лід', 'Sales']);
  assert.equal(ua.targeting.items.length, 3);
  assert.equal(ua.cta.title, 'Обговоримо ваш проєкт?');
  assert.equal(ua.geo.regions.worldwide.users, '1B+ MAU');
  assert.equal(en.draft, true);
  assert.notEqual(en.stats.ua.main.label, ua.stats.ua.main.label);
});

test('нет выдуманных фактов: отзывы и посты — тексты клиента (2026-11-12), заглушек не осталось', () => {
  for (const item of [...ua.reviews.items, ...en.reviews.items]) assert.ok(item.quote && !/^(уточнити|TBD)$/.test(item.quote));
  // 2026-11-12: клиент прислал 4 поста (ссылки /107 и /196 он перепутал местами — сверено по текстам постов в канале)
  assert.deepEqual(ua.materials.items.map((i) => i.url), ['https://t.me/eleads_marketing/193', 'https://t.me/eleads_marketing/196', 'https://t.me/eleads_marketing/107', 'https://t.me/eleads_marketing/197']);
  assert.ok(ua.materials.items.every((i) => i.title !== 'уточнити' && i.text !== 'уточнити'));
  // T42: два слота видео-отзывов (клиент: «Додати два відеовідгуки») — третьего нет, видео пока нет
  assert.equal(ua.reviews.items.length, 2);
  // видео прислал пользователь (2026-11-11) — путь к реальному файлу, не заглушка
  for (const item of [...ua.reviews.items, ...en.reviews.items]) assert.match(item.video, /^video\/reviews\/[a-z]+\.mp4$/);
});

// T27: лайтбокс форматов убран по правке пользователя — телефон не кликабелен (tests/formats-phone.test.js)

// T29: закрепление и прорисовка линии процесса сняты (H11 — переходов по прокрутке нет): tests/blocks-06-08.test.js
