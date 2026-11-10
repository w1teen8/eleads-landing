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
  'Скільки потрібно для старту?', 'Скільки коштують послуги?', 'Чи підійде Telegram Ads моїй ніші?',
  'Чи можна рекламувати сайт?', 'Які країни доступні?', 'Як швидко можна запуститися?',
  'Чи можете створити канал з нуля?', 'Чи працюєте з міжнародними проєктами?', 'Чи є гарантія результату?',
];

test('faq.json: 9 питань брифа по порядку, відповідь на перше — €650, у кожного UA та EN', () => {
  assert.deepEqual(faq.items.map((i) => i.q.ua), QUESTIONS_UA);
  assert.match(faq.items[0].a.ua, /€650/);
  assert.match(faq.items[0].a.en, /€650/);
  for (const item of faq.items) {
    assert.ok(item.a.ua && item.a.en && item.q.en, item.id);
  }
  // чего нет у клиента — заглушка, а не выдумка
  assert.equal(faq.items[8].a.ua, 'уточнити');
  assert.equal(faq.items[8].a.en, 'TBD');
});

test('geo-dots.json: сетка суши согласована с размерами, 7 регионов внутри карты', () => {
  assert.equal(geo.rowsData.length, geo.rows);
  for (const row of geo.rowsData) assert.equal(row.length, geo.cols);
  const land = geo.rowsData.join('').split('1').length - 1;
  assert.ok(land > 600 && land < 3000, `точек суши: ${land}`);
  assert.deepEqual(geo.regions.map((r) => r.id), ['ukraine', 'europe', 'uk', 'usa', 'canada', 'australia', 'asia']);
  for (const r of geo.regions) {
    const col = Math.floor((r.lon - geo.lon0) / geo.step);
    const row = Math.floor((geo.lat0 - r.lat) / geo.step);
    assert.ok(col >= 0 && col < geo.cols && row >= 0 && row < geo.rows, r.id);
  }
});

// T29: карта GEO — точки SVG из общего модуля блока 02 (tests/blocks-06-08.test.js), <canvas> на странице больше нет.
// T30: бегущего импульса в блоке 11 больше нет (лента showcase — tests/blocks-09-11.test.js).
test('на странице нет <canvas>: карта GEO — SVG из stats-dots.js, который сам останавливается вне экрана', () => {
  assert.equal(count(html, /<canvas\b/g), 0);
  assert.match(read('src/sections/geo.js'), /createDotMap\(/);
  assert.match(read('src/sections/stats-dots.js'), /IntersectionObserver/);
});

test('раскладка секций: 8 ниш, 3 формата, 7 шагов, 7 регионов, 6 таргетингов, 6 этапов и 9 услуг', () => {
  assert.equal(count(section('niches'), /class="niches__item"/g), 8);
  assert.equal(count(section('formats'), /class="formats__item"/g), 3);
  assert.equal(count(section('process'), /class="process__step[ "]/g), 7);
  assert.equal(count(section('geo'), /data-region="/g), 7);
  assert.equal(count(section('targeting'), /class="tg__item"/g), 6);
  assert.equal(count(section('ecosystem'), /class="eco__tile /g), 6);
  assert.equal(count(section('ecosystem'), /class="eco__service"/g), 9);
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
  assert.deepEqual(places('cta'), ['final_cta']);
  assert.match(section('cta'), /\{\{config\.telegramHandle\}\}/);
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
  assert.equal(ua.ecosystem.services.length, 9);
  assert.deepEqual(ua.ecosystem.flow, ['Traffic', 'Telegram', 'Content', 'Funnel', 'Lead', 'Sale']);
  assert.equal(ua.targeting.items.length, 6);
  assert.equal(ua.cta.title, 'Обговоримо ваш проєкт?');
  assert.equal(ua.geo.regions.europe.figure, '4.43M');
  assert.equal(en.draft, true);
  assert.notEqual(en.stats.ua.main.label, ua.stats.ua.main.label);
});

test('нет выдуманных фактов: отзывы и посты без клиентского текста — заглушки', () => {
  for (const item of ua.reviews.items) assert.equal(item.quote, 'уточнити');
  for (const item of en.reviews.items) assert.equal(item.quote, 'TBD');
  assert.deepEqual(ua.materials.items.slice(1).map((i) => i.title), ['уточнити', 'уточнити', 'уточнити']);
  assert.equal(ua.reviews.items[2].name, 'Відгук 3');
});

// T27: лайтбокс форматов убран по правке пользователя — телефон не кликабелен (tests/formats-phone.test.js)

// T29: закрепление и прорисовка линии процесса сняты (H11 — переходов по прокрутке нет): tests/blocks-06-08.test.js
