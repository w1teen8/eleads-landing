// T32 (H44): блок 07 «Процес» — ступени вверх (образец reference/run3/process-A-chosen.png) и рост ступеней
// по прокрутке в духе Framer «Scroll Steps» (выбор пользователя «А с скролл степс»). Уточнение пользователя:
// «Я должен застыть на этом экране, скролить вниз и ждать пока появятся все 7 столбов» — экран закрепляется
// (pinScrub из motion-kit), прокрутка выращивает ступени по одной.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { PIN, pinLength, stepWindow, stepProgress, stepPose, smooth, GROW_MIN, GROW_MIN_PX, DIM } from '../src/sections/process-model.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const css = strip(read('src/styles/sections/process.css'));
const js = strip(read('src/sections/process.js'));
const kit = strip(read('src/core/motion-kit.js'));
const section = html.split(/<section\b[^>]*\sid="process"/)[1].split('</section>')[0];
const WIDE = /@media \(min-width: 900px\) and \(orientation: landscape\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/;
const wide = css.match(WIDE)[1];
const base = css.replace(WIDE, '');

test('разметка: обёртка [data-process] — список из 7 ступеней и основание рядом; у ступени — слой фона, номер, подпись', () => {
  assert.match(section, /<div class="process__stairs" data-process>\s*<ol class="process__steps">/);
  const items = section.split('<li class="process__step').slice(1);
  assert.equal(items.length, 7, 'основание — не пункт списка');
  items.forEach((it, i) => {
    assert.match(it, new RegExp(`^(?: process__step--accent)?">\\s*<span class="process__bg" aria-hidden="true"></span>\\s*<span class="process__num" aria-hidden="true">0${i + 1}</span>\\s*<span class="process__label" data-i18n="process\\.steps\\.${i}"></span>`), `ступень ${i + 1}`);
  });
  assert.match(items[6], /^ process__step--accent"/, '07 — акцентная');
  assert.match(section, /<\/ol>\s*<span class="process__base" aria-hidden="true"><\/span>\s*<\/div>/);
  assert.doesNotMatch(section, /style="|data-reveal|eyebrow|footnote|__note/, 'без инлайн-стилей, появления и нижних надписей');
  for (const dict of [ua, en]) assert.equal(dict.process.steps.length, 7);
});

test('модель: путь закрепления ≈ 7 × 30–40% окна + пауза ~20%; ступени по одной, рост — ~70% своего отрезка', () => {
  assert.ok(PIN.step >= 0.3 && PIN.step <= 0.4, `на ступень ${PIN.step} окна`);
  assert.ok(Math.abs(PIN.grow - 0.7) < 1e-9);
  assert.ok(Math.abs(PIN.tail - 0.2) < 1e-9);
  assert.ok(Math.abs(pinLength(7) - (7 * PIN.step + PIN.tail)) < 1e-12);
  const n = 7;
  const w = [...Array(n)].map((_, i) => stepWindow(i, n));
  assert.equal(w[0].from, 0, 'первая растёт сразу, как экран застыл');
  for (let i = 1; i < n; i++) {
    assert.ok(w[i].from >= w[i - 1].to, 'по одной: следующая начинает после того, как выросла предыдущая');
    assert.ok(Math.abs(w[i].from - w[i - 1].from - PIN.step / pinLength(n)) < 1e-12, 'отрезки равные');
  }
  const pause = 1 - w[6].to;
  assert.ok(Math.abs(pause - ((1 - PIN.grow) * PIN.step + PIN.tail) / pinLength(n)) < 1e-12, 'после седьмой — пауза, потом отпускание');
  assert.deepEqual(stepWindow(0, 0, { step: 0, grow: 0.7, tail: 0 }), { from: 0, to: 1 }, 'пустой путь — без деления на ноль');
  // до закрепления — у основания, после — все выросли; прогресс монотонен и в 0…1; назад — опускаются в обратном порядке
  for (let i = 0; i < n; i++) {
    let prev = -1;
    for (let p = -0.2; p <= 1.2; p += 0.01) {
      const t = stepProgress(p, i, n);
      assert.ok(t >= 0 && t <= 1 && t >= prev - 1e-12, `ступень ${i}: p=${p}`);
      prev = t;
    }
    assert.equal(stepProgress(0, i, n), 0);
    assert.equal(stepProgress(1, i, n), 1);
  }
  // в любой момент растёт не больше одной ступени
  for (let p = 0; p <= 1; p += 0.002) {
    const growing = [...Array(n)].filter((_, i) => { const t = stepProgress(p, i, n); return t > 0 && t < 1; });
    assert.ok(growing.length <= 1, `p=${p.toFixed(3)}`);
  }
});

test('модель: поза — фон от полоски 8px до 1, номер за верхним краем фона, но не на подпись; текст проявляется', () => {
  assert.equal(smooth(-1), 0);
  assert.equal(smooth(2), 1);
  assert.equal(smooth(0.5), 0.5);
  const size = { height: 450, room: 260 };
  const start = stepPose(0, size);
  assert.ok(Math.abs(start.scale * 450 - GROW_MIN_PX) < 1e-9, 'полоска у основания — 8px у любой ступени');
  assert.ok(Math.abs(stepPose(0, { height: 150, room: 0 }).scale * 150 - GROW_MIN_PX) < 1e-9);
  assert.equal(stepPose(0, {}).scale, GROW_MIN, 'высота ещё неизвестна');
  assert.equal(start.numY, 260, 'в начале номер у подписи: свободное место кончилось');
  assert.equal(start.glow, DIM);
  assert.deepEqual(stepPose(1, size), { scale: 1, numY: 0, glow: 1 }, 'в конце — конечный вид');
  const mid = stepPose(0.6, size);
  assert.ok(Math.abs(mid.numY - (1 - mid.scale) * 450) < 1e-9, 'номер едет ровно за верхним краем фона');
  assert.equal(stepPose(0.3, { height: 150, room: 0 }).numY, 0, 'самая низкая: номер стоит, растёт только фон');
  let prev = stepPose(0, size);
  for (let t = 0.05; t <= 1; t += 0.05) {
    const pose = stepPose(t, size);
    assert.ok(pose.scale >= prev.scale && pose.glow >= prev.glow && pose.numY <= prev.numY, `t=${t}`);
    prev = pose;
  }
});

test('motion-kit: pinScrub — общий помощник: pin + pinSpacing + scrub под шапкой, только на media, no-op при reduced', () => {
  const fn = kit.slice(kit.indexOf('export function pinScrub'));
  assert.match(fn, /^export function pinScrub\(section, \{ length, media = SHOWCASE_MEDIA, offset, onProgress, onRefresh, onRevert \} = \{\}\)/);
  assert.match(fn, /if \(reduced \|\| !section \|\| typeof length !== 'function'\)/);
  assert.match(fn, /gsap\.matchMedia\(\)/);
  assert.match(fn, /start: \(\) => `top \$\{top\(\)\}px`/, 'закрепляется, когда блок встал под шапку');
  assert.match(fn, /const top = \(\) => offset \?\? pinTop\(section\)/);
  assert.match(fn, /end: \(\) => `\+=\$\{Math\.max\(1, Math\.round\(length\(\)\)\)\}`/);
  for (const opt of ['pin: true', 'pinSpacing: true', 'scrub: true', 'invalidateOnRefresh: true']) assert.ok(fn.includes(opt), opt);
  assert.match(fn, /onRevert\?\.\(\)/, 'вне media блок встаёт в конечный вид');
  assert.doesNotMatch(fn.slice(0, fn.indexOf('\n}\n')), /querySelector|process__/, 'помощник не знает о разметке блока');
  for (const key of ['ready', 'refresh', 'destroy']) assert.match(fn, new RegExp(`\\b${key}\\b`), key);
});

test('блок 07: закрепление выключено (PINNED = false); если включить — pinScrub на путь pinLength(7) окна', () => {
  assert.match(js, /export const PINNED = false;/);
  assert.match(js, /if \(!PINNED\) return;\n  pinScrub\(/);
  assert.match(js, /import \{ pinScrub \} from '\.\.\/core\/motion-kit\.js'/);
  assert.match(js, /pinScrub\(root, \{\s*length: \(\) => window\.innerHeight \* pinLength\(n\),/);
  assert.match(js, /onProgress: paint,/);
  assert.match(js, /onRevert: revert,/);
  assert.doesNotMatch(js, /ScrollTrigger|gsap|motionReady|stagger|stackReveal/, 'своего закрепления и появления нет');
  assert.match(js, /stepPose\(stepProgress\(p, i, n\), sizes\[i\]\)/);
  assert.match(js, /scaleY\(/);
  assert.match(js, /scaleX\(/, 'основание прочерчивается слева направо');
  for (const [, prop] of js.matchAll(/set\(\w+, '(\w+)'/g)) assert.ok(['transform', 'opacity'].includes(prop), prop);
  assert.doesNotMatch(js, /(?:num|label)[^;\n]*scale/, 'номер и подпись не масштабируются');
});

test('без JS, reduced-motion, ?nomotion=1 и узкий экран — конечный вид: CSS ничего не прячет и не двигает', () => {
  assert.match(base, /\.process__bg\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*z-index:\s*-1/);
  assert.match(base, /\.process__step\s*\{[^}]*isolation:\s*isolate/, 'фон под текстом, но внутри ступени');
  assert.match(wide, /\.process__bg\s*\{[^}]*transform-origin:\s*50% 100%/, 'растёт от основания');
  assert.doesNotMatch(css, /opacity:\s*0[;.]|scale[XY]?\(0/, 'начальное состояние ставит только JS после загрузки GSAP');
  assert.doesNotMatch(css, /transition|animation|@keyframes/, 'движение — только от прокрутки');
});

test('облик по образцу A: ступени в ряд на основании, +5.34svh на шаг (≈50px на 1903×937), верхние углы скруглены', () => {
  assert.match(wide, /\.process__steps\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\);[^}]*align-items:\s*end/);
  assert.match(wide, /--step-dh:\s*5\.34svh/);
  assert.match(wide, /--step-h0:\s*clamp\([^)]*16svh[^)]*\)/);
  assert.match(wide, /\.process__step\s*\{[^}]*height:\s*calc\(var\(--step-h0\) \+ var\(--i\) \* var\(--step-dh\)\)/);
  for (let i = 2; i <= 7; i++) assert.match(css, new RegExp(`\\.process__step:nth-child\\(${i}\\) \\{ --i: ${i - 1}; \\}`));
  assert.match(wide, /\.process__bg\s*\{[^}]*border-bottom:\s*0;[^}]*border-radius:\s*var\(--r-card\) var\(--r-card\) 0 0/);
  assert.match(css, /\.process__base\s*\{[^}]*background:\s*var\(--grad\)/);
  assert.match(css, /\.process__num\s*\{[^}]*font-family:\s*var\(--font-head\)[^}]*background:\s*var\(--grad\)/);
  assert.match(css, /\.process__step--accent \.process__bg\s*\{[^}]*background:\s*var\(--grad\)/);
  assert.match(wide, /\.process__num\s*\{[^}]*font-size:\s*clamp\([^)]*svh[^)]*\)/);
  // телефон: вертикальный список полос от 60% до 100% ширины от вертикального основания
  assert.match(base, /\.process__step\s*\{[^}]*width:\s*calc\(60% \+ var\(--i\) \* 40% \/ 6\)/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'цвета — только переменные');
});
