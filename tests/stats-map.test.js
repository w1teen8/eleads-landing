// Блок 02 (T25, H22): Украина из точек — 81% горит; Worldwide — карта мира из точек. Образец: reference/run3/stats-E-chosen.png.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { read, readJson, root } from './helpers.js';
import { parseShare, litCount, litSet, hasDot, gridDots, WORLD_STRIDE } from '../src/sections/stats-model.js';

const html = read('index.html');
const stats = html.split(/<section\b[^>]*\sid="stats"/)[1].split('</section>')[0];
const [, panelUa, panelWw] = stats.split(/role="tabpanel"/);
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const grid = readJson('src/data/ua-dots.json');
const world = readJson('src/data/geo-dots.json');
const js = read('src/sections/stats.js');
const css = read('src/styles/sections/stats.css').replace(/\/\*[\s\S]*?\*\//g, '');
const count = (s, re) => (s.match(re) || []).length;
const dotsIn = (g) => g.rowsData.join('').split('1').length - 1;

test('ua-dots.json: формат как у geo-dots.json плюс шахматный сдвиг; точек 350–450', () => {
  for (const key of ['step', 'lon0', 'lat0', 'cols', 'rows', 'rowsData']) assert.ok(key in grid && key in world, key);
  assert.equal(grid.rowsData.length, grid.rows);
  for (const line of grid.rowsData) assert.match(line, new RegExp(`^[01]{${grid.cols}}$`));
  assert.equal(grid.shift, 0.5, 'нечётные строки сдвинуты на полшага');
  assert.ok(grid.lonStep > grid.step, 'шаг по долготе растянут на косинус широты — на экране сетка квадратная');
  assert.equal(grid.total, dotsIn(grid));
  assert.ok(grid.total >= 350 && grid.total <= 450, `точек ${grid.total}`);
});

// Международно признанные границы: Крым и весь Донбасс — Украина; соседние города и моря — нет.
test('контур Украины точный: Крым, Донецк, Луганск, Львов, Киев — в сетке; соседи и моря — нет', () => {
  const inside = {
    'Крым': [34.1, 45.0],
    'Донецк': [37.8, 48.0],
    'Луганск': [39.3, 48.6],
    'Львов': [24.0, 49.8],
    'Киев': [30.5, 50.45],
    'Харьков': [36.23, 49.99],
    'Днепр': [35.05, 48.46],
    'Керченский полуостров': [35.9, 45.25],
  };
  for (const [name, [lon, lat]] of Object.entries(inside)) assert.equal(hasDot(grid, lon, lat), true, name);
  const outside = {
    'Минск': [27.56, 53.9],
    'Кишинёв': [28.86, 47.0],
    'Ростов-на-Дону': [39.7, 47.23],
    'Белгород': [36.6, 50.6],
    'Краснодар': [38.97, 45.04],
    'Чёрное море': [31.5, 45.0],
    'Азовское море': [36.5, 46.2],
    'Люблин': [22.57, 51.25],
  };
  for (const [name, [lon, lat]] of Object.entries(outside)) assert.equal(hasDot(grid, lon, lat), false, name);
});

test('в репозитории только сетка и скрипт сборки: источник и лицензия названы, GeoJSON не лежит', () => {
  const script = read('scripts/ua-dots.js');
  assert.match(script, /Natural Earth/);
  assert.match(script, /ne_10m_admin_0_countries_ukr/, 'вариант с точкой зрения Украины — в обычном Крым не у Украины');
  assert.match(script, /public domain|общественное достояние/i);
  for (const [lon, lat] of [[34.1, 45.0], [37.8, 48.0], [39.3, 48.6], [24.0, 49.8], [30.5, 50.45]]) {
    assert.match(script, new RegExp(`lon:\\s*${lon.toFixed(1)}\\b.*lat:\\s*${lat.toFixed(2).replace(/0$/, '0?')}`), `скрипт проверяет ${lon} ${lat}`);
  }
  const readme = read('README.md');
  assert.match(readme, /ua-dots\.json/);
  assert.match(readme, /Natural Earth/);
  assert.match(readme, /scripts\/ua-dots\.js/);
  assert.match(grid.source, /Natural Earth/);
  assert.doesNotMatch(html, /\.geojson/);
  for (const dir of ['src/data', 'scripts', 'public', 'build']) {
    assert.equal(existsSync(join(root, dir, 'ne_ukr.geojson')), false, dir);
    assert.equal(existsSync(join(root, dir, 'ne_10m_admin_0_countries_ukr.geojson')), false, dir);
  }
});

test('доля горящих точек — из stats.ua.main.value: ровно 81% с округлением до целой точки, набор один и тот же', () => {
  assert.equal(parseShare(ua.stats.ua.main.value), 0.81);
  assert.equal(parseShare(en.stats.ua.main.value), 0.81);
  assert.equal(parseShare('1B+'), null, 'не доля — горят все');
  assert.equal(parseShare('7,5 %'), 0.075);
  const total = gridDots(grid).dots.length;
  assert.equal(total, grid.total);
  const lit = litSet(total, parseShare(ua.stats.ua.main.value));
  assert.equal(lit.size, Math.round(total * 0.81));
  assert.equal(lit.size, litCount(total, 0.81));
  assert.ok(Math.abs(lit.size / total - 0.81) <= 0.5 / total);
  assert.deepEqual([...litSet(total, 0.81)].sort((a, b) => a - b), [...lit].sort((a, b) => a - b), 'детерминированно');
  for (const i of lit) assert.ok(Number.isInteger(i) && i >= 0 && i < total);
  assert.equal(litSet(10, 0).size, 0);
  assert.equal(litSet(10, 1).size, 10);
  // доля не зашита в код
  const code = (js + read('src/sections/stats-model.js')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(code, /0\.81|\b81\b/);
  assert.match(js, /parseShare\(t\('stats\.ua\.main\.value'\)\)/);
});

test('точки карт: Украина — шахматная сетка, мир — из geo-dots.json; рамка совпадает с viewBox разметки', () => {
  const u = gridDots(grid);
  assert.ok(u.dots.some((d) => d.x % 1 === 0.5) && u.dots.some((d) => d.x % 1 === 0), 'чётные и нечётные строки сдвинуты');
  assert.deepEqual([u.width, u.height], [grid.cols + 0.5, grid.rows]);
  const w = gridDots(world, { stride: WORLD_STRIDE });
  assert.ok(w.dots.length > 300, `точек суши ${w.dots.length}`);
  for (const d of [...u.dots, ...w.dots]) assert.ok(d.x > 0 && d.y > 0);
  for (const d of u.dots) assert.ok(d.x < u.width && d.y < u.height);
  for (const d of w.dots) assert.ok(d.x < w.width && d.y < w.height);
  assert.match(panelUa, new RegExp(`<svg[^>]*viewBox="0 0 ${u.width} ${u.height}"`));
  assert.match(panelWw, new RegExp(`<svg[^>]*viewBox="0 0 ${w.width} ${w.height}"`));
});

test('раскладка по образцу: карточка с цифрой и картой; справа две строки и акцентная плашка', () => {
  for (const panel of [panelUa, panelWw]) {
    const cards = [...panel.matchAll(/<article class="([^"]*)"/g)].map((m) => m[1]);
    assert.equal(cards.length, 4);
    assert.match(cards[0], /stats__card--main/);
    assert.match(cards[1], /stats__row/);
    assert.match(cards[2], /stats__row/);
    assert.match(cards[3], /stats__card--accent/);
    assert.equal(count(panel, /data-stats-map=/g), 1);
    assert.deepEqual([...panel.matchAll(/data-flip="(\d)"/g)].map((m) => m[1]), ['0', '1', '2', '3', '4', '5', '6', '7']);
  }
  // дополнение 2: «Нижние надписи в блоках не нужны» — легенды под «81%» и сноски нет, звёздочки у «200+ GEO» тоже
  assert.doesNotMatch(stats, /legend|footnote/);
  for (const dict of [ua, en]) {
    assert.equal(dict.stats.ua.legend, undefined);
    assert.equal(dict.stats.footnote, undefined);
    assert.doesNotMatch(JSON.stringify(dict.stats), /\*/, 'звёздочка-сноска');
  }
  assert.equal(ua.stats.ww.geo.label, 'робота з міжнародними рекламними кампаніями');
  assert.doesNotMatch(css, /legend|footnote/);
  // строки справа — без рамок и фона, с тонкой линией сверху
  const row = css.match(/\.stats__row\s*\{([^}]*)\}/)[1];
  assert.match(row, /border-top:\s*1px solid var\(--line-strong\)/);
  assert.doesNotMatch(row, /background/);
});

test('доступность: карта — role="img" с подписью из словаря (81 из 100), точки от скринридера скрыты', () => {
  assert.match(panelUa, /<div class="stats__map"[^>]*role="img"[^>]*data-i18n-attr="aria-label:stats\.ua\.mapLabel"/);
  assert.match(panelWw, /<div class="stats__map"[^>]*role="img"[^>]*data-i18n-attr="aria-label:stats\.ww\.mapLabel"/);
  for (const panel of [panelUa, panelWw]) assert.match(panel, /<svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
  assert.match(ua.stats.ua.mapLabel, /81 зі 100/);
  assert.match(en.stats.ua.mapLabel, /81 (out )?of (every )?100/);
  assert.ok(ua.stats.ww.mapLabel && en.stats.ww.mapLabel);
  assert.doesNotMatch(ua.stats.ww.mapLabel + en.stats.ww.mapLabel, /\d/, 'у карты мира цифр нет');
});

// Движение карт и блока (волны, барабаны, появление) — tests/stats-motion.test.js. Здесь — смена карт на вкладках.
test('вкладки: одна карта сменяет другую через opacity — прежняя гаснет поверх новой', () => {
  assert.match(js, /toSvg\.animate\(\{ opacity: \[0, 1\] \}/);
  assert.match(js, /ghost\.animate\(\{ opacity: \[1, 0\] \}/);
  assert.match(js, /if \(reduced \|\| !fromSvg/, 'reduced-motion — карта меняется сразу');
  assert.match(css, /\.stats__map \.stats__ghost\s*\{[^}]*position:\s*absolute/);
});

// Дополнение 2026-11-09 — правки текста от Володимира: «вместо «року» — «дня»», «№1 … — вместо 4500 и тот мелкий текст»
test('правки клиента: «протягом дня»; вместо «4 500» — «№1 месенджер в Україні…»', () => {
  assert.equal(ua.stats.ua.main.label, 'користувачів месенджерів 18–70 використовували Telegram протягом дня');
  assert.match(en.stats.ua.main.label, /used Telegram within a day$/);
  assert.deepEqual(ua.stats.ua.rank, { value: '№1', label: 'месенджер в Україні за популярністю серед користувачів' });
  assert.deepEqual(en.stats.ua.rank, { value: '#1', label: 'messenger in Ukraine by popularity among users' });
  assert.equal(ua.stats.ua.sample, undefined);
  assert.equal(en.stats.ua.sample, undefined);
  assert.doesNotMatch(JSON.stringify(ua.stats.ua) + JSON.stringify(en.stats.ua), /Gradus|протягом року|during the year/);
  assert.match(panelUa, /class="stats__value" data-flip="4" data-i18n="stats\.ua\.rank\.value"/, '«№1» — тем же шрифтом и цветом, что «18–70»');
  assert.match(panelUa, /data-flip="5" data-i18n="stats\.ua\.rank\.label"/);
  assert.doesNotMatch(stats, /stats\.ua\.sample/);
});
