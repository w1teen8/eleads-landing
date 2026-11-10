// T30 (H41, H07, H11, H15, H18): блоки 09 «Таргетинг», 10 «Відгуки + засновник», 11 «Екосистема» в облике блоков 02–05.
// Без «нижних надписей» и появления по прокрутке; единственный переход по прокрутке — лента карточек блока 11
// (showcaseScroll из motion-kit); aria-expanded карточек отражает только открытое тапом состояние.
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
    assert.equal(dict.founder.photoCaption, undefined, 'founder.photoCaption');
  }
});

test('H11: появления по прокрутке нет — в разметке блоков нет data-reveal, в JS — reveal/stagger/stackReveal', () => {
  for (const id of IDS) {
    assert.doesNotMatch(section(id), /data-reveal|class="[^"]*\breveal\b/, `${id}: data-reveal`);
    assert.doesNotMatch(js(id), /\b(reveal|stagger|stackReveal|parallax)\(/, `${id}.js`);
  }
  // закрепление — только у ленты блока 11, и только через общий помощник
  for (const id of ['targeting', 'reviews']) assert.doesNotMatch(js(id), /pin|ScrollTrigger|showcaseScroll/, `${id}.js: pin`);
  assert.match(js('ecosystem'), /import \{ showcaseScroll \} from '\.\.\/core\/motion-kit\.js'/);
  assert.doesNotMatch(js('ecosystem'), /ScrollTrigger|pinSection|pin:\s*true/, 'pin — только внутри showcaseScroll');
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

test('10: карточка засновника с фото и «50+ проєктів», отзывы — карусель с кнопками и точками, без выдуманного', () => {
  const s = section('reviews');
  assert.ok(s.indexOf('class="founder"') < s.indexOf('data-slider'), 'засновник — первым (слева)');
  assert.match(s, /\/img\/photo\/volodymyr-founder-480\.jpg/);
  assert.match(s, /data-i18n-attr="alt:founder\.photoAlt"/);
  assert.match(ua.founder.text, /50\+ проєктів/);
  assert.match(en.founder.text, /50\+ projects/);
  assert.match(s, /data-i18n="hero\.stats\.projects\.value"/);
  assert.equal(count(s, /class="reviews__slide"/g), ua.reviews.items.length);
  for (const attr of ['data-slider-prev', 'data-slider-next', 'data-slider-dots', 'data-slider-viewport']) assert.match(s, new RegExp(attr));
  assert.match(s, /aria-roledescription="carousel"/);
  // текстов отзывов у клиента нет — в словаре заглушки, в разметке ни одного текста мимо словаря
  for (const item of ua.reviews.items) assert.equal(item.quote, 'уточнити');
  for (const item of en.reviews.items) assert.equal(item.quote, 'TBD');
  assert.doesNotMatch(s.replace(/<svg[\s\S]*?<\/svg>/g, ''), />\s*[^\s<{][^<]*</, 'текст в разметке мимо словаря');
  assert.match(css('reviews'), /scroll-snap-type:\s*x mandatory/, 'свайп на тач — scroll-snap по горизонтали');
});

test('11: шлях клієнта и лента из девяти карточек услуг; лента едет через showcaseScroll, без движения — прокрутка пальцем', () => {
  const s = section('ecosystem');
  assert.equal(count(s, /class="eco__tile /g), 6);
  assert.equal(count(s, /class="eco__service"/g), 9);
  assert.equal(count(s, /class="eco__row" aria-expanded="false"/g), 9);
  assert.match(s, /data-eco-track/);
  const src = js('ecosystem');
  assert.match(src, /showcaseScroll\(root, track/);
  assert.match(src, /classList\.toggle\('is-static', !ok\)/, 'запасной режим, когда лента не едет');
  assert.doesNotMatch(src, /mouseenter|mouseleave|'focus'|'blur'/, 'aria-expanded от наведения');
  const c = css('ecosystem');
  assert.match(c, /\.eco__window\s*\{[^}]*overflow-x:\s*auto/, 'узкий экран: горизонтальная прокрутка');
  assert.match(c, /\.section--ecosystem\.is-static \.eco__window\s*\{[^}]*overflow-x:\s*auto/);
  assert.doesNotMatch(c, /@keyframes/, 'бегущего импульса больше нет');
});

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
