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

// Палитра брифа, дословно (2026-11-06-brief.md → «Бренд»).
const BRIEF = {
  '--ink': '#070C18',
  '--navy': '#0D1528',
  '--card': '#131D36',
  '--line': 'rgba(255,255,255,.08)',
  '--fg': '#F4F2EC',
  '--muted': '#93A0BB',
  '--sun': '#FFD23F',
  '--ember': '#FF8A1F',
  '--tg': '#3B8CFF',
};

// --paper и палитра overtake (reference.md): фон, белый, почти чёрный, изумрудный, салатовый, розовый, жёлтый,
// оранжевый, приглушённый текст
const EXTRA = ['#FFFFFF', '#F0F0F0', '#FFFFFF', '#0B0B0C', '#122020', '#9EFC65', '#FFBCFC', '#FDE589', '#FF742E', '#6A6E6E'];

test('tokens.css: цвета брифа как есть и --grad = --sun → --ember', () => {
  const css = strip(read('src/styles/tokens.css'));
  for (const [name, value] of Object.entries(BRIEF)) {
    const m = css.match(new RegExp(`${name}:\\s*([^;]+);`));
    assert.ok(m, `нет ${name}`);
    assert.equal(m[1].replace(/\s/g, '').toLowerCase(), value.replace(/\s/g, '').toLowerCase(), name);
  }
  assert.match(css, /--grad:\s*linear-gradient\(100deg,\s*var\(--sun\),\s*var\(--ember\)\)/);
  // сборка 2: кроме палитры канала — один нейтральный белый и палитра overtake (reference.md, версия «Overtake · оригинал»)
  const norm = (v) => v.replace(/\s/g, '').toLowerCase();
  const allowed = new Set([...Object.values(BRIEF), ...EXTRA].map(norm));
  const literals = css.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi) || [];
  const extra = literals.filter((l) => !allowed.has(norm(l)));
  assert.deepEqual(extra, [], `лишние цвета: ${extra.join(' ')}`);
  assert.equal(literals.length, Object.keys(BRIEF).length + EXTRA.length, 'каждый цвет объявлен один раз');
});

test('вне tokens.css нет ни одного литерала цвета', () => {
  for (const f of files.filter((f) => !f.endsWith('tokens.css'))) {
    const found = strip(read(f)).match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(purple|violet|blue|indigo)\b/gi);
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
