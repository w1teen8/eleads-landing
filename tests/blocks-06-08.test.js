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
    assert.doesNotMatch(dict.geo.regions.europe.figureText, /\*/, 'звёздочка без сноски');
  }
});

test('облик и формат: шрифт канала у H2, размеры от высоты окна, своего фона и hex нет, только transform/opacity', () => {
  for (const id of IDS) {
    const c = css(id);
    assert.match(c, new RegExp(`\\.section--${id} \\.display\\.section__title\\s*\\{[^}]*font-family:\\s*var\\(--font-head\\)[^}]*text-transform:\\s*uppercase`), id);
    assert.match(c, /\d(?:\.\d+)?svh/, `${id}: размеры не от высоты окна`);
    assert.match(c, new RegExp(`@media \\(min-width: 900px\\) and \\(orientation: landscape\\)\\s*\\{\\s*\\.section--${id}\\s*\\{\\s*padding-block:\\s*var\\(--screen-pad\\)`), `${id}: поля экрана`);
    assert.doesNotMatch(c, new RegExp(`\\.section--${id}\\s*\\{[^}]*background\\s*:`), `${id}: свой фон`);
    assert.doesNotMatch(c, /--font-display|--font-mono/, `${id}: прежние шрифты`);
    assert.match(section(id), new RegExp(`<h2\\b[^>]*data-title-accent="${id}\\.titleAccent"`), `${id}: акцентная строка`);
  }
});

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
  assert.match(c, /\.process__step--accent\s*\{[^}]*background:\s*var\(--grad\)[^}]*color:\s*var\(--accent-ink\)/);
  assert.doesNotMatch(js('process'), /pin|scrub|ScrollTrigger|stagger|reveal/, 'движения по прокрутке нет');
});

test('08 GEO: карта — createDotMap из stats-dots.js на сетке geo-dots.json, своей копии рисования нет', () => {
  const src = js('geo');
  assert.match(src, /import \{ createDotMap \} from '\.\/stats-dots\.js'/);
  assert.match(src, /createDotMap\(box, geo, \{ stride: WORLD_STRIDE \}\)/);
  assert.doesNotMatch(src, /getContext|canvas|requestAnimationFrame|stagger|ScrollTrigger/);
  const block = section('geo');
  assert.doesNotMatch(block, /<canvas/);
  const svg = block.match(/<svg viewBox="0 0 ([\d.]+) ([\d.]+)"[^>]*>\s*<g class="geo__dots"><\/g><g class="geo__pins" data-geo-pins><\/g>/);
  assert.ok(svg, 'первый <g> — точки, второй — метки');
  // рамка совпадает с тем, что даёт gridDots при WORLD_STRIDE = 2
  assert.equal(Number(svg[1]), Math.ceil(geo.cols / 2) + 0.5);
  assert.equal(Number(svg[2]), Math.ceil(geo.rows / 2));
  assert.match(block, /class="geo__map" role="img" data-geo-map data-i18n-attr="aria-label:geo\.mapAlt"/);
});

test('08 GEO: метки и строки списка — по geo.regions; метки внутри рамки карты', async () => {
  const block = section('geo');
  const ids = geo.regions.map((r) => r.id);
  assert.deepEqual([...block.matchAll(/class="geo__region" data-region="([a-z]+)" aria-pressed="false"/g)].map((m) => m[1]), ids);
  for (const id of ids) {
    for (const dict of [ua, en]) assert.ok(dict.geo.regions[id].name && dict.geo.regions[id].text, id);
    assert.match(block, new RegExp(`data-i18n="geo\\.regions\\.${id}\\.name"`));
  }
  // pinPoint — чистая функция; берём её из исходника, чтобы не тянуть DOM-модуль
  const src = read('src/sections/geo.js');
  const body = src.match(/export function pinPoint\(grid, lon, lat, stride = WORLD_STRIDE\) \{\s*(return [^\n]+)\s*\}/)[1];
  const pinPoint = new Function('grid', 'lon', 'lat', 'stride', body);
  const w = Math.ceil(geo.cols / 2) + 0.5;
  const h = Math.ceil(geo.rows / 2);
  for (const r of geo.regions) {
    const p = pinPoint(geo, r.lon, r.lat, 2);
    assert.ok(p.x > 1 && p.x < w - 1 && p.y > 1 && p.y < h - 1, `${r.id}: ${p.x}, ${p.y}`);
  }
  assert.deepEqual(pinPoint(geo, geo.lon0, geo.lat0, 2), { x: 0, y: 0 });
  assert.match(src, /setAttribute\('aria-pressed'/);
});

test('08 GEO: пульс меток — только transform и opacity и только при живых анимациях', () => {
  const c = css('geo');
  const frames = c.match(/@keyframes geo-pulse\s*\{((?:[^{}]*\{[^{}]*\})*)[^{}]*\}/)[1];
  for (const [, prop] of frames.matchAll(/([a-z-]+)\s*:/g)) assert.ok(['transform', 'opacity'].includes(prop), prop);
  assert.match(c, /\.js-anim \.geo__pin-ring\s*\{[^}]*animation:\s*geo-pulse/);
  assert.doesNotMatch(c.replace(/\.js-anim \.geo__pin-ring\s*\{[^}]*\}/, ''), /animation:/, 'без .js-anim (reduced-motion, ?nomotion=1) кольцо стоит');
});
