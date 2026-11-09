// Блок 02 «Telegram у цифрах» (T19; T25 — раскладка с картой из точек, см. tests/stats-map.test.js): включён,
// собран из общих помощников движения.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { disableSections } from '../src/core/sections.js';

const html = read('index.html');
const config = readJson('src/data/config.json');
const stats = html.split(/<section\b[^>]*\sid="stats"/)[1].split('</section>')[0];
const count = (s, re) => (s.match(re) || []).length;

test('блок 02 включён сразу после первого экрана и лент на стыке (T23, H13); пункт меню #stats виден после сборки', () => {
  assert.deepEqual(config.sections.enabled.slice(0, 3), ['hero', 'ribbons', 'stats']);
  const out = disableSections(html, config);
  assert.doesNotMatch(out.match(/<section\b[^>]*\sid="stats"[^>]*>/)[0], /\shidden/);
  const item = out.match(/<li\b([^>]*)>\s*<a\b[^>]*href="#stats"/);
  assert.ok(item, 'нет пункта навигации на #stats');
  assert.doesNotMatch(item[1], /\shidden/);
});

test('в каждой вкладке карточка с главной цифрой, две строки и акцентная плашка последней', () => {
  const panels = stats.split(/role="tabpanel"/).slice(1);
  assert.equal(panels.length, 2);
  for (const panel of panels) {
    const cards = [...panel.matchAll(/<article class="([^"]*)"/g)].map((m) => m[1]);
    assert.equal(cards.length, 4);
    assert.match(cards[0], /stats__card--main/);
    assert.match(cards[3], /stats__card--accent/);
  }
  assert.doesNotMatch(stats, /footnote|legend/, 'сноски и легенды нет — правка клиента (T25, дополнение 2)');
});

// H11: «убери все переходы которые сейчас есть» — наезда блока на блок нет. T25 (дополнение 3): для блока 02
// пользователь выбрал своё появление («Для появления тоже какие-то анимации нужны») — лесенка разрешена только здесь;
// подробно — tests/stats-motion.test.js
test('движение блока: табло и барабаны на вкладках, лесенка появления; без наезда блока на блок', () => {
  const js = read('src/sections/stats.js');
  assert.match(js, /from '\.\.\/core\/motion-kit\.js'/);
  assert.match(js, /\bflipSwap\(/);
  assert.match(js, /\bstagger\(/);
  for (const fn of ['stackReveal', 'countTo']) assert.doesNotMatch(js, new RegExp(`\\b${fn}\\(`), fn);
  assert.equal(count(stats, /data-reveal|data-stats-step|data-count/g), 0);
  assert.doesNotMatch(js.replace(/^\s*\/\/.*$/gm, ''), /\bgsap\b|ScrollTrigger/);
});

// T23 (H14): палитра канала — тёмные карточки с тонкой светлой границей, цифры жёлтый → оранжевый,
// одна акцентная карточка — жёлто-оранжевая с тёмным текстом
test('палитра канала: тёмные карточки с тонкой границей, цифры — акцентом, акцентная карточка с тёмным текстом', () => {
  const css = read('src/styles/sections/stats.css');
  // T25: поверхность карточки — как на образце stats-E: светлая плёнка 5.5% поверх фона
  assert.match(css, /\.stats__card\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--text\) 5\.5%, transparent\);[^}]*border:\s*1px solid var\(--line\)/);
  assert.match(css, /\.stats__value\s*\{[^}]*background:\s*var\(--grad\)/);
  assert.match(css, /\.stats__card--accent\s*\{[^}]*background:\s*var\(--grad\);[^}]*color:\s*var\(--accent-ink\)/);
});
