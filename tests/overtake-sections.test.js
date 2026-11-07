// T07: секции 02–14 в оформлении overtake — только семантические переменные тем, стопка кейсов.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';

const SECTIONS = [
  'stats', 'niches', 'formats', 'calculator', 'cases', 'process', 'geo',
  'targeting', 'reviews', 'ecosystem', 'materials', 'faq', 'cta',
];
// Палитра канала живёт только в tokens.css и питает темы; секции её напрямую не берут.
const PALETTE = ['ink', 'navy', 'card', 'fg', 'fg-soft', 'muted', 'sun', 'ember', 'tg', 'sun-glow', 'ember-glow', 'ink-veil'];
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const paletteRe = new RegExp(`--(?:${PALETTE.join('|')})(?![\\w-])`, 'g');

test('CSS секций 02–14 не использует старые имена палитры', () => {
  for (const name of SECTIONS) {
    const found = strip(read(`src/styles/sections/${name}.css`)).match(paletteRe);
    assert.equal(found, null, `${name}.css: ${found}`);
  }
});

test('JS секций 02–14 не читает старые имена палитры (карта GEO берёт цвета темы)', () => {
  for (const name of SECTIONS) {
    const found = strip(read(`src/sections/${name}.js`)).match(paletteRe);
    assert.equal(found, null, `${name}.js: ${found}`);
  }
});

test('кейсы складываются стопкой: sticky + scale только на широком экране', () => {
  const css = strip(read('src/styles/sections/cases.css'));
  const wide = css.split(/@media\s*\(min-width:\s*\d+px\)/).slice(1).join('');
  assert.match(wide, /position:\s*sticky/, 'sticky только внутри min-width');
  const base = css.split(/@media/)[0];
  assert.doesNotMatch(base, /position:\s*sticky/, 'на мобильном стопки нет');
  const js = strip(read('src/sections/cases.js'));
  assert.match(js, /scale/, 'уходящая карточка уменьшается через transform: scale');
});
