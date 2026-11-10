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
    assert.doesNotMatch(js(id), /\b(reveal|stagger|stackReveal|parallax|pinSection|IntersectionObserver)\b/, `${id}.js`);
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

test('13 FAQ: две колонки из faq.json, один открытый ответ, ссылка в Telegram с местом клика', async () => {
  const s = section('faq');
  assert.equal((s.match(/data-faq-list="/g) || []).length, 2);
  assert.match(s, /<a class="faq__ask"[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="faq"/);
  for (const dict of [ua, en]) assert.ok(dict.faq.ask.title && dict.faq.ask.text);
  const { splitColumns } = await import('../src/sections/faq-model.js');
  const nine = Array.from({ length: 9 }, (_, i) => i);
  assert.deepEqual(splitColumns(nine, 2), [[0, 1, 2, 3, 4], [5, 6, 7, 8]]);
  assert.deepEqual(splitColumns([1, 2], 2), [[1], [2]]);
  assert.deepEqual(splitColumns([], 2), [[], []]);
  assert.match(js('faq'), /if \(other !== row\) setOpen\(other, false\)/);
});

test('14 CTA: кнопка в Telegram, @handle и фото Володимира из public/img/photo', () => {
  const s = section('cta');
  assert.match(s, /class="btn btn--primary[^"]*cta__btn"[^>]*data-place="final_cta"/);
  assert.match(s, /\/img\/photo\/volodymyr-cta-480\.jpg/);
  assert.match(s, /data-i18n-attr="alt:founder\.photoAlt"/);
  assert.doesNotMatch(s, /cta__glow/);
});
