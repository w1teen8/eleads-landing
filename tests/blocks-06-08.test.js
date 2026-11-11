// T29 (H41): блоки 06 «Кейси», 07 «Процес», 08 «GEO» включены и оформлены в облике блоков 02–05.
// Кейсы — tests/cases-gallery.test.js; здесь — включение, процесс, GEO и общие правила клиента (без нижних надписей).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const config = readJson('src/data/config.json');
const geo = readJson('src/data/geo-dots.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const section = (id) => html.split(new RegExp(`<section\\b[^>]*\\sid="${id}"`))[1].split('</section>')[0];
const css = (name) => strip(read(`src/styles/sections/${name}.css`));
const js = (name) => strip(read(`src/sections/${name}.js`));
const IDS = ['cases', 'process', 'geo'];

test('блоки 06–08 включены сразу после калькулятора, по порядку', () => {
  const on = config.sections.enabled;
  const i = on.indexOf('calculator');
  assert.deepEqual(on.slice(i + 1, i + 4), IDS);
});

test('правила клиента: без меток, сносок и нижних надписей; без появления по прокрутке', () => {
  for (const id of IDS) {
    const block = section(id);
    assert.doesNotMatch(block, /data-reveal/, `${id}: появление по прокрутке`);
    assert.doesNotMatch(block, /eyebrow|footnote|__note|__hint|__caption|section--alt/, `${id}: метка или нижняя надпись`);
    for (const dict of [ua, en]) {
      for (const key of ['eyebrow', 'footnote', 'note', 'hint', 'caption']) assert.equal(dict[id][key], undefined, `${id}.${key}`);
    }
  }
  for (const dict of [ua, en]) {
    assert.equal(dict.geo.mapLabel, undefined, 'подпись «Інтерактивна карта»');
    assert.doesNotMatch(JSON.stringify(dict.geo.regions), /\*/, 'звёздочка без сноски');
  }
});

test('облик и формат: шрифт канала у H2, размеры от высоты окна, своего фона и hex нет, только transform/opacity', () => {
  for (const id of IDS) {
    const c = css(id);
    assert.match(c, new RegExp(`\\.section--${id} \\.display\\.section__title\\s*\\{[^}]*font-family:\\s*var\\(--font-head\\)[^}]*text-transform:\\s*uppercase`), id);
    assert.match(c, /\d(?:\.\d+)?svh/, `${id}: размеры не от высоты окна`);
    assert.match(c, new RegExp(`@media \\(min-width: 900px\\) and \\(orientation: landscape\\)\\s*\\{\\s*\\.section--${id}\\s*\\{\\s*padding-block:\\s*calc\\(var\\(--block-gap\\) / 2\\)`), `${id}: поля — половина общего промежутка между блоками`);
    assert.doesNotMatch(c, new RegExp(`\\.section--${id}\\s*\\{[^}]*background\\s*:`), `${id}: свой фон`);
    assert.doesNotMatch(c, /--font-display|--font-mono/, `${id}: прежние шрифты`);
    assert.match(section(id), new RegExp(`<h2\\b[^>]*data-title-accent="${id}\\.titleAccent"`), `${id}: акцентная строка`);
  }
});

// T32 сменил облик 07 на ступени с ростом по прокрутке — подробные проверки в tests/process-stairs.test.js
test('07 Процес: семь шагов списком <ol>, крупный номер 01–07, последний — акцентный; текст о подходе рядом с заголовком', () => {
  const block = section('process');
  assert.match(block, /<ol class="process__steps"/);
  const nums = [...block.matchAll(/class="process__num" aria-hidden="true">(\d\d)</g)].map((m) => m[1]);
  assert.deepEqual(nums, ['01', '02', '03', '04', '05', '06', '07']);
  ua.process.steps.forEach((_, i) => assert.match(block, new RegExp(`data-i18n="process\\.steps\\.${i}"`)));
  assert.equal((block.match(/process__step--accent/g) || []).length, 1);
  assert.match(block, /class="process__lead" data-i18n="process\.lead"/);
  assert.ok(block.indexOf('process__lead') < block.indexOf('process__steps'), 'текст — в шапке блока, не под шагами');
  assert.doesNotMatch(block, /process__line|process__draw|<svg/, 'линии прорисовки нет');
  const c = css('process');
  assert.match(c, /\.process__num\s*\{[^}]*font-family:\s*var\(--font-head\)/);
  assert.match(c, /grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/, 'на широком экране — один ряд');
  assert.match(c, /\.process__step--accent\s*\{[^}]*color:\s*var\(--accent-ink\)/);
  assert.match(c, /\.process__step--accent \.process__bg\s*\{[^}]*background:\s*var\(--grad\)/);
  // T32: закрепление — только общим помощником pinScrub из motion-kit, своей копии ScrollTrigger нет
  assert.doesNotMatch(js('process'), /stagger|reveal|stackReveal|ScrollTrigger|gsap/, 'без появления и своего закрепления');
});

// T33 сменил облик 08 на точечный 3D-глобус на <canvas> со списком регионов — проверки в tests/geo-globe.test.js
