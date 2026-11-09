// Блок 03 «Ніші» (T20, с T23 — в палитре канала): восемь карточек. Движение (H11): переходов по
// прокрутке нет — только hover-наклон карточки к курсору.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { disableSections } from '../src/core/sections.js';

const html = read('index.html');
const config = readJson('src/data/config.json');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const niches = html.split(/<section\b[^>]*\sid="niches"/)[1].split('</section>')[0];
const count = (s, re) => (s.match(re) || []).length;

test('блок 03 включён сразу после блока 02; секция и пункт меню #niches видны после сборки', () => {
  const list = config.sections.enabled;
  assert.equal(list.indexOf('niches'), list.indexOf('stats') + 1, 'niches — сразу после stats');
  const out = disableSections(html, config);
  assert.doesNotMatch(out.match(/<section\b[^>]*\sid="niches"[^>]*>/)[0], /\shidden/);
});

test('восемь карточек по порядку брифа; восьмая — тёмная «Інша ніша?», ссылка в Telegram', () => {
  assert.equal(count(niches, /class="niches__item"/g), 8);
  const keys = [...niches.matchAll(/data-i18n="(niches\.(?:items\.\d|other)\.name)"/g)].map((m) => m[1]);
  assert.deepEqual(keys, [0, 1, 2, 3, 4, 5, 6].map((i) => `niches.items.${i}.name`).concat('niches.other.name'));
  assert.match(niches, /<a class="niches__card niches__card--other"[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="niches_other"/);
  for (const dict of [ua, en]) {
    assert.deepEqual(
      dict.niches.items.map((n) => n.examples),
      ['Finmap', dict === ua ? 'eLeads · Мухін · Домбовецький' : 'eLeads · Mukhin · Dombovetskyi', 'Cryptonite', 'Anna Haustova', 'Global Auto Logistic', 'Monolit', 'Trackdesk'],
    );
  }
  assert.doesNotMatch(niches, /niches__orbit|class="planet"|data-reveal/, 'орбита и собственные ревилы убраны');
});

// H11: «убери все переходы которые сейчас есть» — блок идёт обычной прокруткой, карточки видны сразу
test('движение: ни наезда, ни лесенки, ни табло при появлении; только hover-наклон transform-ом', () => {
  const js = read('src/sections/niches.js');
  for (const fn of ['stackReveal', 'stagger', 'flipSwap']) assert.doesNotMatch(js, new RegExp(`\\b${fn}\\b`), fn);
  assert.doesNotMatch(js, /gsap|ScrollTrigger|requestAnimationFrame|\.animate\(|textContent\s*=/);
  assert.match(js, /pointermove/);
  assert.match(read('src/styles/sections/niches.css'), /transform:\s*rotateX\(var\(--tilt-x\)\)/);
});

// T23 (H14): палитра канала — тёмные карточки с тонкой границей, «Інша ніша?» — акцентная с тёмным текстом
test('облик: тёмные карточки с тонкой границей, «Інша ніша?» — жёлто-оранжевая; переходы только transform/opacity', () => {
  const css = read('src/styles/sections/niches.css');
  assert.match(css, /\.niches__card\s*\{[^}]*background:\s*var\(--surface\);[^}]*border:\s*1px solid var\(--line\)/);
  assert.match(css, /\.niches__card--other\s*\{[^}]*background:\s*var\(--grad\);[^}]*color:\s*var\(--accent-ink\)/);
  for (const [, value] of css.matchAll(/transition:\s*([^;]+);/g)) {
    for (const part of value.split(',')) assert.match(part.trim(), /^(transform|opacity)\b/, `transition: ${value}`);
  }
});
