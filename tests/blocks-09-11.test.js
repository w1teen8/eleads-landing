// T30 (H41, H07, H11, H15, H18): блоки 09 «Таргетинг», 10 «Відгуки + засновник», 11 «Екосистема» в облике блоков 02–05.
// Без «нижних надписей» и появления по прокрутке. Блок 11 с T36 — шлях клієнта с бегущим импульсом
// (tests/ecosystem-materials.test.js), ленты showcaseScroll в нём больше нет.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const config = readJson('src/data/config.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const section = (id) => html.split(new RegExp(`<section\\b[^>]*\\sid="${id}"`))[1].split('</section>')[0];
const count = (s, re) => (s.match(re) || []).length;
const css = (name) => strip(read(`src/styles/sections/${name}.css`));
const js = (name) => strip(read(`src/sections/${name}.js`));
const IDS = ['targeting', 'reviews', 'ecosystem'];

test('блоки 09–11 включены по порядку страницы, сразу после geo', () => {
  const on = config.sections.enabled;
  const i = on.indexOf('targeting');
  assert.ok(i > 0, 'targeting не включён');
  assert.deepEqual(on.slice(i, i + 3), IDS);
  assert.equal(on[i - 1], 'geo');
});

test('правила клиента: нет меток блоков, подсказок, сносок и подписей — ни в разметке, ни в словарях', () => {
  for (const id of IDS) {
    const s = section(id);
    assert.doesNotMatch(s, /eyebrow|pill-label|mono-label/, `${id}: метка блока`);
    assert.doesNotMatch(s, /data-i18n="[\w.]*\.(hint|note|footnote|caption|shotCaption|photoCaption)"/, `${id}: нижняя надпись`);
  }
  for (const dict of [ua, en]) {
    for (const key of ['hint', 'note']) assert.equal(dict.targeting[key], undefined, `targeting.${key}`);
    for (const key of ['shot', 'shotCaption']) assert.equal(dict.reviews[key], undefined, `reviews.${key}`);
    assert.equal(dict.ecosystem.caption, undefined, 'ecosystem.caption');
    assert.equal(dict.founder, undefined, 'founder.* — фото и текст засновника клиент убрал (T42)');
  }
});

test('H11: появления по прокрутке нет — в разметке блоков нет data-reveal, в JS — reveal/stagger/stackReveal', () => {
  for (const id of IDS) {
    assert.doesNotMatch(section(id), /data-reveal|class="[^"]*\breveal\b/, `${id}: data-reveal`);
    assert.doesNotMatch(js(id), /\b(reveal|stagger|stackReveal|parallax)\(/, `${id}.js`);
  }
  // T36: лента showcase-scroll в блоке 11 убрана (шлях клієнта с бегущим импульсом) — закрепления нет ни в одном из трёх
  for (const id of IDS) assert.doesNotMatch(js(id), /pin|ScrollTrigger|showcaseScroll/, `${id}.js: pin`);
});

test('H18/H15: заголовки — шрифт канала заглавными; размеры от высоты окна; своего фона и hex нет', () => {
  for (const id of IDS) {
    const c = css(id);
    assert.match(
      c,
      new RegExp(`\\.section--${id} \\.display\\.section__title\\s*\\{[^}]*font-family:\\s*var\\(--font-head\\)[^}]*text-transform:\\s*uppercase`),
      `${id}: заголовок`,
    );
    assert.match(c, /\d(?:\.\d+)?svh/, `${id}.css: размеры не от высоты окна`);
    assert.doesNotMatch(c, new RegExp(`\\.section--${id}\\s*\\{[^}]*background\\s*:`), `${id}.css: свой фон`);
    assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i, `${id}.css: литерал цвета`);
    assert.doesNotMatch(c, /font-family:\s*var\(--font-display\)/, `${id}.css: Unbounded`);
  }
});

// T34: сетка 3×2 блока 09 заменена диском, который сам листает способы, — tests/targeting-dial.test.js

// T35: слайдер отзывов блока 10 заменён кружками, как видео-сообщения Telegram, — tests/reviews-circles.test.js
// T42: клиент — «Прибрати мою фотографію та текст поруч із нею»: засновника в блоке 10 нет, цифры остались
test('10: без фото и текста засновника; цифры блока — из первого экрана', () => {
  const s = section('reviews');
  assert.doesNotMatch(s, /volodymyr|founder/);
  assert.match(s, /data-i18n="hero\.stats\.projects\.value"/);
  assert.equal(count(s, /class="reviews__tab"/g), ua.reviews.items.length);
});

// T36: лента карточек услуг блока 11 заменена шляхом клієнта с услугами под шагами и бегущим импульсом —
// tests/ecosystem-materials.test.js

test('motion-kit: showcaseScroll — общий помощник (секция, дорожка, опции), pin + scrub, только transform', () => {
  const kit = read('src/core/motion-kit.js');
  assert.match(kit, /export const SHOWCASE_MEDIA = '\(min-width: 900px\) and \(orientation: landscape\)'/);
  const fn = strip(kit.slice(kit.indexOf('export function showcaseScroll')));
  assert.match(fn, /^export function showcaseScroll\(section, track, \{ viewport, media = SHOWCASE_MEDIA, offset, speed = 1, onProgress \} = \{\}\)/);
  assert.match(fn, /if \(reduced \|\| !section \|\| !track\)/, 'reduced-motion — no-op');
  assert.match(fn, /gsap\.matchMedia\(\)/, 'закрепление пересоздаётся при смене ширины');
  assert.match(fn, /pin: true/);
  assert.match(fn, /scrub: true/);
  assert.match(fn, /invalidateOnRefresh: true/);
  assert.match(fn, /x: \(\) => -distance\(\)/, 'едет transform-ом на величину переполнения');
  assert.doesNotMatch(fn, /eco__|cases__|mat__|querySelector/, 'помощник не знает о разметке блоков');
  for (const key of ['ready', 'refresh', 'destroy']) assert.match(fn, new RegExp(`\\b${key}\\b`), key);
});
