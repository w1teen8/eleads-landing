// Клиент 2026-11-11: «Пройтись по сайту и зафиксировать сетку шрифтов и придерживаться ее. А то в одном блоке один
// размер, во второй — другой, в третьем — третий». Семь ступеней в tokens.css; секции берут размеры из них.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';

const tokens = read('src/styles/tokens.css');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const css = (n) => strip(read(`src/styles/sections/${n}.css`));
const SECTIONS = ['stats', 'niches', 'formats', 'calculator', 'cases', 'process', 'geo', 'targeting', 'reviews', 'ecosystem', 'materials', 'faq'];

test('сетка шрифтов: семь ступеней в tokens.css', () => {
  for (const t of ['h2', 'h3', 'lead', 'title', 'body', 'small', 'label']) assert.match(tokens, new RegExp(`--t-${t}:`), t);
});

test('заголовки разделов 02–13 — одна ступень --t-h2', () => {
  for (const n of SECTIONS) {
    for (const [, body] of css(n).matchAll(/\.section__title\s*\{([^}]*)\}/g)) {
      const fs = body.match(/font-size:\s*([^;]+);/);
      if (fs) assert.equal(fs[1].trim(), 'var(--t-h2)', n);
    }
  }
});

test('тексты карточек, вводные и названия пунктов — из сетки', () => {
  const pick = (n, cls) => [...css(n).matchAll(new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`, 'g'))].map((m) => m[1].match(/font-size:\s*([^;]+);/)?.[1]).filter(Boolean);
  const cases = [['formats', 'formats__text', 'body'], ['targeting', 'tg__text', 'body'], ['ecosystem', 'eco__service-text', 'body'], ['materials', 'mat__text', 'body'],
    ['formats', 'formats__lead', 'lead'], ['process', 'process__lead', 'lead'], ['calculator', 'calc__intro', 'lead'],
    ['targeting', 'tg__name', 'title'], ['materials', 'mat__title', 'title'], ['process', 'process__label', 'title'],
    ['formats', 'formats__title', 'h3'], ['ecosystem', 'eco__name', 'h3'], ['faq', 'faq__ask-title', 'h3'], ['calculator', 'calc__panel-title', 'h3']];
  for (const [n, cls, t] of cases) {
    const v = pick(n, cls);
    assert.ok(v.length, `${cls}: есть размер`);
    for (const x of v) assert.equal(x.trim(), `var(--t-${t})`, cls);
  }
});
