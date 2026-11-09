// Жёсткие правила брифа для CSS: палитра только в tokens.css, backdrop-filter только в шапке,
// анимируются только transform и opacity, зависимости — только vite, gsap, lenis.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { read, readJson, root } from './helpers.js';

function cssFiles(dir = 'src/styles') {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? cssFiles(`${dir}/${e.name}`) : e.name.endsWith('.css') ? [`${dir}/${e.name}`] : [],
  );
}
const files = cssFiles();
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

// Палитра канала от пользователя (сборка 3, T18), дословно: «Тёмно-синий фон: #070C18 · Жёлтый: #FFD23F ·
// Оранжевый: #FF8A1F · Белый (текст): #F4F2EC». Остальные цвета канала — производные от этих четырёх.
const CHANNEL = { '--ink': '#070C18', '--sun': '#FFD23F', '--ember': '#FF8A1F', '--fg': '#F4F2EC' };
// T23 (H14): «Перекрась весь сайт сразу в его палитру» — своих цветов первого экрана («Синий», --v4-*) больше нет
const SCREEN = [];

test('tokens.css: четыре цвета канала как есть, производные — смеси от них, --grad = --sun → --ember', () => {
  const css = strip(read('src/styles/tokens.css'));
  const norm = (v) => v.replace(/\s/g, '').toLowerCase();
  for (const [name, value] of Object.entries(CHANNEL)) {
    const m = css.match(new RegExp(`${name}:\\s*([^;]+);`));
    assert.ok(m, `нет ${name}`);
    assert.equal(norm(m[1]), norm(value), name);
  }
  for (const name of ['--navy', '--card', '--muted']) {
    assert.match(css, new RegExp(`${name}:\\s*color-mix\\(in srgb, var\\(--fg\\) \\d+%, var\\(--ink\\)\\);`), `${name} — производная`);
  }
  assert.match(css, /--grad:\s*linear-gradient\(100deg,\s*var\(--sun\),\s*var\(--ember\)\)/);
  assert.doesNotMatch(css, /--tg:|--ae-/, 'второго синего акцента и палитры Aether нет');
  const allowed = new Set([...Object.values(CHANNEL), ...SCREEN].map(norm));
  const literals = css.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi) || [];
  const extra = literals.filter((l) => !allowed.has(norm(l)));
  assert.deepEqual(extra, [], `лишние цвета: ${extra.join(' ')}`);
  assert.equal(literals.length, Object.keys(CHANNEL).length + SCREEN.length, 'каждый цвет объявлен один раз');
  // семантический слой будущих блоков — на палитре канала, без синих цветов первого экрана
  const semantic = css.slice(css.indexOf('color-scheme'));
  assert.doesNotMatch(semantic, /--v4-|--paper/, 'синие цвета первого экрана');
  assert.match(semantic, /--bg:\s*var\(--ink\);/);
  assert.match(semantic, /--accent:\s*var\(--sun\);/);
});

test('вне tokens.css нет ни одного литерала цвета', () => {
  for (const f of files.filter((f) => !f.endsWith('tokens.css'))) {
    const css = strip(read(f));
    const found = css.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(purple|violet|blue|indigo)\b/gi);
    assert.equal(found, null, `${f}: ${found}`);
  }
});

test('backdrop-filter есть только в header.css', () => {
  const offenders = files.filter((f) => !f.endsWith('sections/header.css') && /backdrop-filter/.test(strip(read(f))));
  assert.deepEqual(offenders, []);
});

test('transition и @keyframes трогают только transform и opacity', () => {
  const allowed = new Set(['transform', 'opacity', 'none']);
  for (const f of files) {
    const css = strip(read(f));
    for (const [, value] of css.matchAll(/transition(?:-property)?:\s*([^;}]+)/g)) {
      for (const part of value.split(',')) {
        const prop = part.trim().split(/\s+/)[0];
        if (prop.startsWith('var(')) continue;
        assert.ok(allowed.has(prop), `${f}: transition ${prop}`);
      }
    }
    for (const [, body] of css.matchAll(/@keyframes\s+[\w-]+\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)) {
      for (const [, prop] of body.matchAll(/([a-z-]+)\s*:/g)) {
        assert.ok(allowed.has(prop), `${f}: @keyframes ${prop}`);
      }
    }
    assert.doesNotMatch(css, /transition:\s*all\b/, `${f}: transition all`);
  }
});

test('зависимости — только vite, gsap, lenis', () => {
  const pkg = readJson('package.json');
  assert.deepEqual(Object.keys(pkg.dependencies || {}).sort(), ['gsap', 'lenis']);
  assert.deepEqual(Object.keys(pkg.devDependencies || {}).sort(), ['vite']);
});
