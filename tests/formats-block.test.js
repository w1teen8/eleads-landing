// Блок 04 «Як виглядає реклама» (T21): включён по порядку, три формата с примерами MONOLIT (HTML/CSS по вайрфрейму),
// лайтбокс, движение — только общий набор motion-kit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { disableSections } from '../src/core/sections.js';

const html = read('index.html');
const config = readJson('src/data/config.json');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const formats = html.split(/<section\b[^>]*\sid="formats"/)[1].split('</section>')[0];
const count = (s, re) => (s.match(re) || []).length;
const ORDER = ['hero', 'stats', 'niches', 'formats', 'calculator'];

test('блок 04 включён и стоит в списке по порядку страницы; пункт меню #formats виден', () => {
  const list = config.sections.enabled;
  assert.ok(list.includes('formats'), 'formats нет в sections.enabled');
  const known = list.filter((name) => ORDER.includes(name));
  assert.deepEqual(known, ORDER.filter((name) => known.includes(name)), 'порядок блоков');
  const out = disableSections(html, config);
  assert.doesNotMatch(out.match(/<section\b[^>]*\sid="formats"[^>]*>/)[0], /\shidden/);
});

// T27: три формата — вкладки, примеры — на экране одного телефона, лайтбокс — одна кнопка на экране (tests/formats-phone.test.js)
test('три формата 01–03 с подписями из вайрфрейма; примеры канал / медиа / бот и кнопка лайтбокса', () => {
  assert.deepEqual(ua.formats.items.map((i) => i.title), ['У Telegram-каналах', 'У відео / медіаконтенті', 'У ботах']);
  assert.equal(ua.formats.eyebrow, undefined, 'метки-номера блока нет (правка клиента, T25)');
  assert.equal(ua.formats.title, 'Як ваша реклама виглядатиме в Telegram');
  assert.equal(count(formats, /class="formats__item"/g), 3);
  assert.equal(count(formats, /data-lightbox-open/g), 1);
  for (const kind of ['channel', 'video', 'bot']) assert.match(formats, new RegExp(`class="tg-ad tg-ad--${kind}[ "]`), kind);
  assert.doesNotMatch(formats, /formats\.placeholder/, 'пример собран, плашки «placeholder» нет');
});

test('реклама MONOLIT — тексты вайрфрейма в словаре, UA и EN', () => {
  const m = ua.formats.mock;
  assert.equal(m.title, 'Обмін валют MONOLIT Софія-Київ');
  const body = `${m.body} ${m.brand}${m.bodyEnd}`; // в разметке между началом и брендом — пробел
  for (const part of ['Плануєте обмін?', 'Тоді вам в MONOLIT', 'ЖК Софія та ЖК Софія Резиденс', 'Житня, 12 та Молодіжна, 8', 'Анонімно та швидко', 'Актуальний курс в каналі']) {
    assert.ok(body.includes(part), part);
  }
  assert.equal(m.button, 'ПЕРЕГЛЯНУТИ');
  for (const key of ['cover', 'coverAccent']) assert.ok(m[key] && en.formats.mock[key], key);
  // обложка медиа и все части текста — из словаря
  for (const key of ['title', 'body', 'brand', 'bodyEnd', 'button', 'cover']) {
    assert.match(formats, new RegExp(`data-i18n="formats\\.mock\\.${key}"`), key);
  }
});

test('H11: у блока нет переходов по прокрутке — ни наезда, ни лесенки, ни ревилов; лайтбокс по клику остаётся', () => {
  const js = read('src/sections/formats.js');
  for (const fn of ['stackReveal', 'stagger']) assert.doesNotMatch(js, new RegExp(`\\b${fn}\\(`), fn);
  assert.equal(count(formats, /data-reveal/g), 0, 'содержимое видно сразу');
  assert.doesNotMatch(js, /gsap|ScrollTrigger/);
  assert.doesNotMatch(read('src/styles/sections/formats.css'), /\.section--formats\s*\{[^}]*border-radius/, 'скругление «карточки стопки» снято');
  assert.match(js, /showModal/);
});

// T23 (H14), T27: телефон и экран — в палитре канала (тёмный экран, поверхности чуть светлее, акценты вместо синего),
// сами макеты остаются похожими на Telegram
test('облик: рамка и экран телефона — тёмные поверхности палитры; макеты похожи на Telegram', () => {
  const css = read('src/styles/sections/formats.css');
  assert.match(css, /\.phone\s*\{[^}]*background:\s*var\(--surface/);
  assert.match(css, /\.phone__screen\s*\{[^}]*background:\s*var\(--bg\)/);
  assert.doesNotMatch(css, /\.formats__shot\b/, 'прежних рамок-скриншотов нет');
  for (const part of ['tg-ad__card', 'tg-ad__ad', 'tg-ad__title', 'tg-ad__btn']) assert.match(css, new RegExp(`\\.${part}\\b`), part);
});
