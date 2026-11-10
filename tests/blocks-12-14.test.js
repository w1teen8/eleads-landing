// T31: блоки 12 «Матеріали», 13 «FAQ», 14 «Фінальний CTA» в облике блоков 02–05 (подвал — tests/aether-shell.test.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const config = readJson('src/data/config.json');
const section = (id) => html.split(new RegExp(`<section\\b[^>]*\\sid="${id}"`))[1].split('</section>')[0];
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const css = (name) => strip(read(`src/styles/sections/${name}.css`));
const js = (name) => strip(read(`src/sections/${name}.js`));
const BLOCKS = ['materials', 'faq', 'cta'];

test('блоки 12–14 и подвал включены, по порядку страницы', () => {
  assert.deepEqual(config.sections.enabled.slice(-4), ['materials', 'faq', 'cta', 'footer']);
});

test('правила клиента: без нижних надписей, меток блоков и появления по прокрутке', () => {
  for (const id of BLOCKS) {
    assert.doesNotMatch(section(id), /data-reveal|eyebrow|pill-label|__note|__sign|__caption|__hint/, id);
    // T37: в 13 и 14 IntersectionObserver нужен чату в телефоне (автолистание вопросов, приход сообщения), не появлению блока
    const observer = ['faq', 'cta'].includes(id) ? '' : '|IntersectionObserver';
    assert.doesNotMatch(js(id), new RegExp(`\\b(reveal|stagger|stackReveal|parallax|pinSection${observer})\\b`), `${id}.js`);
  }
  for (const dict of [ua, en]) {
    assert.equal(dict.faq.note, undefined, 'faq.note убрана');
    assert.equal(dict.cta.sign, undefined, 'cta.sign убрана');
    assert.equal(dict.cta.photoCaption, undefined, 'cta.photoCaption убрана');
  }
});

test('облик: заголовки шрифтом канала, блок — экран (screen-pad), только семантические переменные, без hex', () => {
  for (const id of BLOCKS) {
    const c = css(id);
    assert.match(c, new RegExp(`\\.section--${id} \\.display\\.section__title\\s*\\{[^}]*font-family:\\s*var\\(--font-head\\)`), `${id}: заголовок`);
    assert.match(c, /@media \(min-width: 900px\) and \(orientation: landscape\)[\s\S]*padding-block:\s*var\(--screen-pad\)/, `${id}: экран`);
    assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b/i, `${id}: hex`);
    assert.doesNotMatch(c, /font-display/, `${id}: Unbounded`);
  }
  assert.doesNotMatch(strip(read('src/styles/sections/footer.css')), /#[0-9a-f]{3,8}\b|font-display/i);
});

test('12 «Матеріали»: лента showcase — общий помощник motion-kit, окно и полоса, запасная прокрутка', () => {
  const s = section('materials');
  assert.match(s, /class="mat__window"[\s\S]*<ul class="mat__grid" data-mat-track>/);
  assert.match(s, /data-mat-progress/);
  const code = js('materials');
  assert.match(code, /import\s*\{\s*showcaseScroll\s*\}\s*from\s*'\.\.\/core\/motion-kit\.js'/);
  assert.doesNotMatch(code, /ScrollTrigger|gsap/, 'своей копии приёма нет');
  assert.match(code, /is-static/);
  const c = css('materials');
  assert.match(c, /\.section--materials\.is-static \.mat__window\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(c, /\.mat__title\.is-tbd/, 'заглушка «уточнити» видима');
});

// 13 FAQ и 14 CTA с T37 — чаты в общем телефоне: tests/phone-chat.test.js
