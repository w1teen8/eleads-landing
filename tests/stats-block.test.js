// Блок 02 «Telegram у цифрах» (T19): включён, bento по вайрфрейму, собран из общих помощников движения.
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

test('bento: в каждой вкладке главная цифра, две карточки и тёмная акцентная последней', () => {
  const panels = stats.split(/role="tabpanel"/).slice(1);
  assert.equal(panels.length, 2);
  for (const panel of panels) {
    const cards = [...panel.matchAll(/<article class="([^"]*)"/g)].map((m) => m[1]);
    assert.equal(cards.length, 4);
    assert.match(cards[0], /stats__card--main/);
    assert.match(cards[3], /stats__card--accent/);
  }
  assert.match(stats, /data-i18n="stats\.footnote"/);
});

// H11: «убери все переходы которые сейчас есть» — без наезда на первый экран и без лесенки; табло — только на вкладках
test('движение блока: табло на вкладках; без наезда, лесенки, докрутки и ревилов — карточки видны сразу', () => {
  const js = read('src/sections/stats.js');
  assert.match(js, /from '\.\.\/core\/motion-kit\.js'/);
  assert.match(js, /\bflipSwap\(/);
  for (const fn of ['stackReveal', 'stagger', 'countTo']) assert.doesNotMatch(js, new RegExp(`\\b${fn}\\(`), fn);
  assert.equal(count(stats, /data-reveal|data-stats-step|data-count/g), 0);
  assert.doesNotMatch(js, /gsap|ScrollTrigger/);
});

// T23 (H14): палитра канала — тёмные карточки с тонкой светлой границей, цифры жёлтый → оранжевый,
// одна акцентная карточка — жёлто-оранжевая с тёмным текстом
test('палитра канала: тёмные карточки с тонкой границей, цифры — акцентом, акцентная карточка с тёмным текстом', () => {
  const css = read('src/styles/sections/stats.css');
  assert.match(css, /\.stats__card\s*\{[^}]*background:\s*var\(--surface\);[^}]*border:\s*1px solid var\(--line\)/);
  assert.match(css, /\.stats__value\s*\{[^}]*background:\s*var\(--grad\)/);
  assert.match(css, /\.stats__card--accent\s*\{[^}]*background:\s*var\(--grad\);[^}]*color:\s*var\(--accent-ink\)/);
});
