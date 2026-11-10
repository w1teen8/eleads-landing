// T36 (H49): блок 11 «Екосистема» — шлях клієнта з послугами під кожним кроком и бегущим импульсом
// (reference/run3/ecosystem-A-chosen.png); блок 12 «Матеріали» — картки-пости, як у каналі Telegram
// (reference/run3/materials-A-chosen.png), лента по прокрутке — общий showcaseScroll.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { STEP_SERVICES, PULSE_MS, nextStep } from '../src/sections/ecosystem-model.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const section = (id) => html.split(new RegExp(`<section\\b[^>]*\\sid="${id}"`))[1].split('</section>')[0];
const count = (s, re) => (s.match(re) || []).length;
const eco = section('ecosystem');
const mat = section('materials');
const ecoJs = strip(read('src/sections/ecosystem.js'));
const ecoCss = strip(read('src/styles/sections/ecosystem.css'));
const matJs = strip(read('src/sections/materials.js'));
const matCss = strip(read('src/styles/sections/materials.css'));

/* ——— 11 Екосистема ——— */

test('11: раскладка услуг по шагам — каждая из девяти ровно под одним шагом, по порядку словаря', () => {
  assert.equal(STEP_SERVICES.length, ua.ecosystem.flow.length);
  assert.deepEqual(STEP_SERVICES.flat(), ua.ecosystem.services.map((_, i) => i));
  // раскладка из макета: Traffic — три рекламы, Telegram — упаковка, … Sale — консультации
  assert.deepEqual(STEP_SERVICES, [[0, 1, 2], [3], [4], [5, 6], [7], [8]]);
  assert.equal(ua.ecosystem.services[3].name, 'Упаковка каналу');
  assert.equal(ua.ecosystem.services[8].name, 'Консультації');
});

test('11: шесть шагов 01–06 в ряд, под каждым — его услуги (название + текст); первый горит без JS', () => {
  const steps = eco.split(/<li class="eco__step[^"]*" data-eco-step="/).slice(1);
  assert.equal(steps.length, 6);
  steps.forEach((step, i) => {
    assert.ok(step.startsWith(`${i}"`), `шаг ${i}: data-eco-step`);
    assert.match(step, new RegExp(`<h3 class="eco__face"><span class="eco__num">0${i + 1}</span> <span class="eco__name" data-i18n="ecosystem\\.flow\\.${i}">`));
    // горящая грань — дубль для глаза, скринридер её не читает
    assert.match(step, new RegExp(`<span class="eco__face eco__face--on" aria-hidden="true"><span class="eco__num">0${i + 1}</span> <span class="eco__name" data-i18n="ecosystem\\.flow\\.${i}">`));
    const services = [...step.matchAll(/data-i18n="ecosystem\.services\.(\d)\.name"><\/span> <span class="eco__service-text" data-i18n="ecosystem\.services\.\1\.text"/g)].map((m) => Number(m[1]));
    assert.deepEqual(services, STEP_SERVICES[i], `шаг ${i}: услуги`);
  });
  assert.match(eco, /<li class="eco__step is-on" data-eco-step="0">/);
  assert.equal(count(eco, /is-on/g), 1);
  assert.match(eco, /<ol class="eco__path" data-eco-path data-i18n-attr="aria-label:ecosystem\.flowLabel">/);
});

test('11: прежней ленты нет — ни плиток, ни карточек-кнопок, ни showcaseScroll, ни ключей ленты в словарях', () => {
  assert.doesNotMatch(eco, /eco__tile|eco__row|eco__window|data-eco-track|data-eco-progress|aria-expanded/);
  assert.doesNotMatch(ecoJs, /showcaseScroll|motion-kit|ScrollTrigger|gsap/);
  assert.doesNotMatch(ecoCss, /eco__tile|eco__row|eco__window|eco__progress/);
  for (const dict of [ua, en]) assert.equal(dict.ecosystem.servicesLabel, undefined, 'servicesLabel — подпись ленты');
});

test('11: бегущий импульс — шаг за шагом слева направо, ~2,5 с на шаг, по кругу', () => {
  assert.ok(PULSE_MS >= 2000 && PULSE_MS <= 3000, `PULSE_MS = ${PULSE_MS}`);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((i) => nextStep(i, 6)), [1, 2, 3, 4, 5, 0]);
  assert.match(ecoJs, /import \{ PULSE_MS, nextStep \} from '\.\/ecosystem-model\.js'/);
  assert.match(ecoJs, /setTimeout\(/);
  assert.match(ecoJs, /classList\.toggle\('is-on', n === i\)/);
});

test('11: пауза — только наведение мышью на сам шаг; вне окна и на скрытой вкладке импульс стоит; reduced — без импульса', () => {
  // слушатели наведения — на шагах, не на всём блоке (урок блока 09)
  assert.match(ecoJs, /steps\.forEach\(\(step, i\) => \{\s*on\(step, 'pointerenter'/);
  assert.doesNotMatch(ecoJs, /on\(root, 'pointer(enter|leave|over|out|move)'/);
  assert.doesNotMatch(ecoJs, /mouseenter|mouseover/);
  assert.match(ecoJs, /e\.pointerType !== 'mouse'/, 'тап на телефоне не замораживает импульс');
  assert.match(ecoJs, /state\.hovered \|\| !state\.inView \|\| state\.hidden/);
  assert.match(ecoJs, /IntersectionObserver/);
  assert.match(ecoJs, /visibilitychange/);
  assert.match(ecoJs, /import \{ reduced \} from '\.\.\/core\/motion\.js'/);
  assert.match(ecoJs, /if \(reduced \|\|/, 'reduced-motion / ?nomotion=1 — таймер не заводится');
});

test('11: свечение шага — только opacity слоёв (грань карточки, рамка услуг); стрелки между карточками', () => {
  assert.match(ecoCss, /\.eco__face--on\s*\{[^}]*background:\s*var\(--grad\)[^}]*opacity:\s*0;[^}]*transition:\s*opacity/);
  assert.match(ecoCss, /\.eco__step\.is-on \.eco__face--on\s*\{\s*opacity:\s*1;\s*\}/);
  assert.match(ecoCss, /\.eco__service::before\s*\{[^}]*opacity:\s*0;[^}]*transition:\s*opacity/);
  assert.match(ecoCss, /\.eco__step\.is-on \.eco__service::before\s*\{\s*opacity:\s*1;\s*\}/);
  for (const [, prop] of ecoCss.matchAll(/transition:\s*([a-z-]+)/g)) assert.ok(['opacity', 'transform'].includes(prop), `transition ${prop}`);
  assert.doesNotMatch(ecoCss, /@keyframes|animation:/);
  assert.match(ecoCss, /\.eco__card::after\s*\{/, 'стрелка к следующему шагу');
  assert.match(ecoCss, /\.eco__step:last-child \.eco__card::after\s*\{\s*display:\s*none/);
  assert.match(ecoCss, /grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/, 'шесть шагов в ряд');
});

/* ——— 12 Матеріали ——— */

test('12: четыре карточки-поста — обложка, строка канала, заголовок, «Читати в Telegram ↗» с местом клика', () => {
  const posts = mat.split('<li class="mat__item">').slice(1);
  assert.equal(posts.length, 4);
  posts.forEach((post, i) => {
    assert.match(post, new RegExp(`<article class="mat__card mat__card--${i === 0 ? 'accent' : 'dark'}">`));
    const cover = i === 0 ? 'materials\\.items\\.0\\.cover' : 'materials\\.post';
    assert.match(post, new RegExp(`<div class="mat__cover" aria-hidden="true"><span class="mat__cover-title" data-i18n="${cover}">`));
    assert.match(post, /<p class="mat__channel"><span class="mat__avatar" aria-hidden="true"><\/span><span class="mat__channel-name" data-i18n="materials\.channel"><\/span><span class="mat__kind" data-i18n="materials\.post"><\/span><\/p>/);
    assert.match(post, new RegExp(`<h3 class="mat__title${i === 0 ? '' : ' is-tbd'}" data-i18n="materials\\.items\\.${i}\\.title">`));
    assert.match(post, /<a class="mat__link" href="\{\{config\.telegramUrl\}\}" target="_blank" rel="noopener" data-place="materials"><span data-i18n="materials\.read"><\/span><svg/);
  });
  // свечения за курсором и самолётиков прежнего облика нет
  assert.doesNotMatch(mat, /mat__glow|mat__icon|mat__badge|mat__arrow/);
  assert.doesNotMatch(matJs, /pointermove|--gx|--gy/);
});

test('12: тексты обложек и строки канала — из словарей, без выдуманного: обложка первого — начало его заголовка', () => {
  for (const dict of [ua, en]) {
    const m = dict.materials;
    assert.equal(m.channel, 'eLeads');
    assert.ok(m.post && m.read);
    assert.ok(m.items[0].title.startsWith(m.items[0].cover), `${m.items[0].cover} ⊂ ${m.items[0].title}`);
    for (const item of m.items.slice(1)) assert.equal(item.cover, undefined, 'у постов без данных обложка — «Пост»');
  }
  assert.equal(ua.materials.items[0].cover, '8 способів');
});

test('12: лента едет по прокрутке через showcaseScroll; без движения — четыре поста в ряд во всю ширину', () => {
  assert.match(matJs, /showcaseScroll\(root, track, \{/);
  assert.match(matJs, /classList\.toggle\('is-static', !ok\)/);
  assert.match(matCss, /\.section--materials\.is-static \.mat__item\s*\{[^}]*flex:\s*1 1 0/);
  assert.match(matCss, /\.mat__card--accent \.mat__cover\s*\{[^}]*background:\s*var\(--grad\)/);
  assert.match(matCss, /\.mat__title\.is-tbd\s*\{[^}]*color:\s*var\(--text-muted\)/, '«уточнити» — приглушённо');
  for (const [, prop] of matCss.matchAll(/transition:\s*([a-z-]+)/g)) assert.ok(['opacity', 'transform'].includes(prop), `transition ${prop}`);
  assert.doesNotMatch(matCss, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i, 'цвета — только переменные');
  assert.doesNotMatch(ecoCss, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i, 'цвета — только переменные');
});
