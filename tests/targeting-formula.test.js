// T43: блок 09 «Таргетинг» — «Велика формула» (выбор пользователя 9-F, «берем это»; тексты клиента из Telegram).
// Формула выбранного способа «части + … = ваш клієнт» и три способа-вкладки; листаются сами раз в 10 с.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const s = html.split(/<section\b[^>]*\sid="targeting"/)[1].split('</section>')[0];
const css = strip(read('src/styles/sections/targeting.css'));
const js = strip(read('src/sections/targeting.js'));
const count = (str, re) => (str.match(re) || []).length;

test('прежнего диска и сетки нет — ни в разметке, ни в CSS, ни в JS', () => {
  for (const src of [s, css, js]) assert.doesNotMatch(src, /tg__dial|tg__node|tg__orbit|tg__card|tg__grid|data-icon/);
});

test('тексты клиента дословно: три способа — формула, название, описание', () => {
  const items = ua.targeting.items;
  assert.deepEqual(items.map((i) => i.label), ['GEO + мова + інтереси', 'Мова + тематики', 'Розміщення у вибраних каналах']);
  assert.deepEqual(items.map((i) => i.name), ['Широкий таргетинг на аудиторію', 'Точне тематичне охоплення', 'Точкове розміщення']);
  assert.equal(items[0].text, 'Показуємо рекламу аудиторії тематичних Telegram-каналів з урахуванням країни, мови та інтересів користувачів.');
  assert.equal(items[1].text, 'Показуємо рекламу в Telegram-каналах конкретних тематик з урахуванням мови.');
  assert.equal(items[2].text, 'Викупляємо рекламні покази в конкретних Telegram-каналах, які вручну підбираємо під вашу цільову аудиторію.');
  assert.deepEqual(items.map((i) => i.parts), [['GEO', 'Мова', 'Інтереси'], ['Мова', 'Тематики'], ['Вибрані канали']]);
  for (const dict of [ua, en]) {
    assert.equal(dict.targeting.items.length, 3);
    assert.ok(dict.targeting.result && dict.targeting.listLabel);
    for (const item of dict.targeting.items) {
      for (const f of ['label', 'name', 'text']) assert.ok(typeof item[f] === 'string' && item[f].trim(), f);
      assert.ok(Array.isArray(item.parts) && item.parts.length > 0);
    }
    // шестого (и любых прежних) способов больше нет
    for (const key of ['kicker', 'hint', 'note']) assert.equal(dict.targeting[key], undefined, key);
  }
});

test('разметка: формула способа 0 видна без JS, три вкладки с таймером', () => {
  assert.match(s, /class="tg__formula" id="tg-panel" role="tabpanel"/);
  for (const n of [0, 1, 2]) assert.match(s, new RegExp(`data-i18n="targeting\\.items\\.0\\.parts\\.${n}"`));
  assert.match(s, /data-i18n="targeting\.result"/);
  assert.equal(count(s, /class="tg__item" role="tab"/g), 3);
  for (const i of [0, 1, 2]) {
    for (const f of ['label', 'name', 'text']) assert.match(s, new RegExp(`data-i18n="targeting\\.items\\.${i}\\.${f}"`));
  }
  assert.equal(count(s, /class="tg__bar"/g), 3);
  assert.match(s, /aria-selected="true" tabindex="0"[^>]*data-tg-tab="0"/);
});

test('автолистание раз в 10 с, пауза на вкладках, вне окна и на скрытой вкладке; без анимаций — статично', async () => {
  assert.match(js, /export const STEP_MS = 10000;/);
  assert.match(js, /pointerenter/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /visibilitychange/);
  assert.match(js, /if \(reduced\) return;/);
  assert.match(css, /\.is-static \.tg__bar/);
});

test('части формулы: из массива словаря, между ними «+»; пустые пропускаются', async () => {
  const { partsOf } = await import('../src/sections/targeting.js');
  const dict = { 'targeting.items.0.parts': ['GEO', ' ', 'Мова'], 'targeting.items.1.parts': 'не массив' };
  const read = (k) => dict[k] ?? k;
  assert.deepEqual(partsOf(read, 0), ['GEO', 'Мова']);
  assert.deepEqual(partsOf(read, 1), []);
  assert.deepEqual(partsOf(read, 5), []);
});

test('CSS: анимируются только transform и opacity; формула и вкладки на шрифте канала', () => {
  assert.doesNotMatch(css, /transition:[^;]*(width|height|left|top|margin)/);
  assert.doesNotMatch(js, /\b(width|height|left|top)\s*:/);
  assert.match(css, /\.tg__formula\s*\{[^}]*font-family: var\(--font-head\)/);
  assert.match(css, /\.tg__part\s*\{[^}]*background: var\(--grad\)/);
});
