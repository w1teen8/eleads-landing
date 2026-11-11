// T36 (H49): блок 11 «Екосистема» — шлях клієнта з послугами під кожним кроком и бегущим импульсом
// (reference/run3/ecosystem-A-chosen.png); блок 12 «Матеріали» — картки-пости, як у каналі Telegram
// (reference/run3/materials-A-chosen.png), лента по прокрутке — общий showcaseScroll.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { PULSE_MS, nextStep } from '../src/sections/ecosystem-model.js';

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

// T42 (правка клиента, reference/client-feedback/page-11.png): «Послідовність: Трафік → Посадкові → Контент → Лід →
// Sales» и услуги под шагами — дословно; привязка услуг к шагам — в данных (ecosystem.steps[].{ name, items[] })
test('11: шаги и услуги — дословно из документа клиента, привязка к шагам в словаре; прежних flow/services нет', () => {
  const doc = [
    ['Трафік', ['Telegram Ads', 'Meta Ads', 'посіви / закупи реклами', 'органічний / UBT-трафік']],
    ['Посадкові', ['упаковка й оформлення Telegram-каналу під цілі просування', 'Telegram-боти та воронки', 'сайти / лендинги']],
    ['Контент', ['матеріали, які прогрівають підписників у Telegram-каналі або боті']],
    ['Лід', ['заявка з сайту, з боту або звернення в особисті повідомлення Telegram']],
    ['Sales', ['консультації щодо обробки лідів та знайомство зі спеціалістами, які допоможуть налагодити роботу з ними']],
  ];
  assert.deepEqual(ua.ecosystem.steps.map((st) => [st.name, st.items]), doc);
  assert.deepEqual(en.ecosystem.steps.map((st) => st.name), ['Traffic', 'Landing', 'Content', 'Lead', 'Sales']);
  en.ecosystem.steps.forEach((st, i) => {
    assert.deepEqual(Object.keys(st), ['name', 'items']);
    assert.equal(st.items.length, doc[i][1].length, `EN шаг ${i}: столько же услуг`);
    for (const item of st.items) assert.ok(typeof item === 'string' && item.trim());
  });
  for (const dict of [ua, en]) {
    assert.equal(dict.ecosystem.flow, undefined, 'flow заменён steps');
    assert.equal(dict.ecosystem.services, undefined, 'services заменён steps');
  }
  assert.doesNotMatch(read('src/sections/ecosystem-model.js'), /STEP_SERVICES/);
});

test('11: пять шагов 01–05 в ряд, под каждым — его услуги из словаря; первый горит без JS', () => {
  const steps = eco.split(/<li class="eco__step[^"]*" data-eco-step="/).slice(1);
  assert.equal(steps.length, 5);
  steps.forEach((step, i) => {
    assert.ok(step.startsWith(`${i}"`), `шаг ${i}: data-eco-step`);
    assert.match(step, new RegExp(`<h3 class="eco__face"><span class="eco__num">0${i + 1}</span> <span class="eco__name" data-i18n="ecosystem\\.steps\\.${i}\\.name">`));
    // горящая грань — дубль для глаза, скринридер её не читает
    assert.match(step, new RegExp(`<span class="eco__face eco__face--on" aria-hidden="true"><span class="eco__num">0${i + 1}</span> <span class="eco__name" data-i18n="ecosystem\\.steps\\.${i}\\.name">`));
    const items = [...step.matchAll(/<li class="eco__service"><span class="eco__service-text" data-i18n="ecosystem\.steps\.(\d)\.items\.(\d)"><\/span><\/li>/g)];
    assert.ok(items.every((m) => Number(m[1]) === i), `шаг ${i}: только свои услуги`);
    assert.deepEqual(items.map((m) => Number(m[2])), ua.ecosystem.steps[i].items.map((_, j) => j), `шаг ${i}: услуги`);
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
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => nextStep(i, 5)), [1, 2, 3, 4, 0]);
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
  assert.match(ecoCss, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/, 'пять шагов в ряд');
  assert.doesNotMatch(ecoCss, /repeat\(6,|eco__service-name/, 'шести шагов и «название + текст» услуги больше нет');
  assert.match(ecoCss, /\.eco__service-text::first-letter\s*\{\s*text-transform:\s*uppercase/, 'текст услуги — с заглавной');
});

/* ——— 12 Матеріали ——— */

// T40 (документ клиента, блок 12): зображення, назва, опис, джерело — фото и название канала, «Читати в Telegram» на пост
test('12: четыре карточки-поста — обложка-слот картинки, строка канала с фото, заголовок, опис, «Читати в Telegram ↗» на пост', () => {
  const posts = mat.split('<li class="mat__item">').slice(1);
  assert.equal(posts.length, 4);
  posts.forEach((post, i) => {
    assert.match(post, new RegExp(`<article class="mat__card mat__card--${i === 0 ? 'accent' : 'dark'}">`));
    const cover = i === 0 ? 'materials\\.items\\.0\\.cover' : 'materials\\.post';
    assert.match(post, new RegExp(`<div class="mat__cover" aria-hidden="true" data-mat-image="${i}"><span class="mat__cover-title" data-i18n="${cover}">`));
    assert.match(post, /<p class="mat__channel"><span class="mat__avatar" aria-hidden="true" data-mat-channel-image><\/span><span class="mat__channel-name" data-i18n="materials\.channel"><\/span><span class="mat__kind" data-i18n="materials\.post"><\/span><\/p>/);
    assert.match(post, new RegExp(`<h3 class="mat__title${i === 0 ? '' : ' is-tbd'}" data-i18n="materials\\.items\\.${i}\\.title">`));
    assert.match(post, new RegExp(`<p class="mat__text is-tbd" data-i18n="materials\\.items\\.${i}\\.text">`));
    assert.match(post, new RegExp(`<a class="mat__link" href="\\{\\{config\\.telegramUrl\\}\\}" target="_blank" rel="noopener" data-place="materials" data-mat-url="${i}"><span data-i18n="materials\\.read"><\\/span><svg`));
    const order = ['mat__cover', 'mat__channel', 'mat__title', 'mat__text', 'mat__link'].map((c) => post.indexOf(`class="${c}`));
    assert.deepEqual([...order].sort((a, b) => a - b), order, 'порядок частей поста');
  });
  // свечения за курсором и самолётиков прежнего облика нет
  assert.doesNotMatch(mat, /mat__glow|mat__icon|mat__badge|mat__arrow/);
  assert.doesNotMatch(matJs, /pointermove|--gx|--gy/);
});

test('12: тексты обложек и строки канала — из словарей, без выдуманного: обложка первого — начало его заголовка', () => {
  for (const dict of [ua, en]) {
    const m = dict.materials;
    assert.equal(m.channel, 'єЛіди! → [маркетинг]', '«фото та назва Telegram-каналу «єЛіди! → [маркетинг]»»');
    assert.equal(m.channelImage, '', 'фото канала ещё нет — круг-заглушка');
    for (const item of m.items) {
      assert.equal(item.text, dict === ua ? 'уточнити' : 'TBD', 'опис поста — от клиента');
      assert.equal(item.image, '', 'зображення поста — от клиента (public/img/posts/)');
      assert.equal(item.url, '', 'ссылки на пост ещё нет — кнопка ведёт на общий telegramUrl');
    }
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
  assert.match(matCss, /\.mat__title\.is-tbd,\s*\.mat__text\.is-tbd\s*\{[^}]*color:\s*var\(--text-muted\)/, '«уточнити» — приглушённо');
  // T40: картинка поста и фото канала ложатся поверх заглушек только после загрузки; опис — не длиннее трёх строк
  assert.match(matCss, /\.mat__cover\.has-image \.mat__cover-img,\s*\.mat__avatar\.has-image \.mat__avatar-img\s*\{\s*opacity:\s*1/);
  assert.match(matCss, /\.mat__text\s*\{[^}]*-webkit-line-clamp:\s*3/);
  for (const [, prop] of matCss.matchAll(/transition:\s*([a-z-]+)/g)) assert.ok(['opacity', 'transform'].includes(prop), `transition ${prop}`);
  assert.doesNotMatch(matCss, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i, 'цвета — только переменные');
  assert.doesNotMatch(ecoCss, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i, 'цвета — только переменные');
});

// клиент 2026-11-11: «Тут предлагаю убрать автоматическую смену подсветки блока» (телефон)
test('11: на узком экране импульс сам не бежит, шаг загорается по нажатию', () => {
  const eco = read('src/sections/ecosystem.js');
  assert.match(eco, /export const NARROW_MEDIA = '\(max-width: 899px\)';/);
  assert.match(eco, /if \(reduced \|\| narrow\?\.matches \|\|/);
  assert.match(eco, /on\(step, 'click', \(\) => narrow\?\.matches && light\(i\)\)/);
});
