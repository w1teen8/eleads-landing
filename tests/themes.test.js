// Сборка 2 (G09–G11): три версии оформления на семантических переменных, шрифты overtake с кириллицей,
// компоненты и перекрашенные шапка / hero / загрузка / подвал.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { read, root } from './helpers.js';

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = strip(read('src/styles/tokens.css'));

// interfaces.md → «Сборка 2 — оформление и темы»
const SEMANTIC = [
  '--bg', '--surface', '--surface-2', '--block', '--block-2', '--text', '--text-muted', '--text-on-block',
  '--text-on-block-muted', '--accent', '--accent-2', '--accent-ink', '--tag-1', '--tag-2', '--line', '--line-strong', '--grad',
];
// палитра канала: секциям после перекраски её имена не нужны
const PALETTE_NAMES = /var\(--(ink|navy|card|fg|muted|sun|ember|tg|fg-soft|ember-glow|sun-glow|ink-veil)\)/;
const LITERAL = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;

/** Тело правила, у которого селектор содержит sel (первое совпадение). */
function block(css, sel) {
  for (const [, s, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (s.split(',').some((part) => part.trim() === sel)) return body;
  }
  return null;
}

const THEMES = {
  'brand-light': block(tokens, "[data-theme='brand-light']"),
  'brand-dark': block(tokens, "[data-theme='brand-dark']"),
  overtake: block(tokens, "[data-theme='overtake']"),
};

test('три версии оформления, brand-light — та же, что :root', () => {
  for (const [name, body] of Object.entries(THEMES)) assert.ok(body, `нет набора ${name}`);
  assert.match(tokens, /:root,\s*\[data-theme='brand-light'\]\s*\{/);
});

test('каждая версия задаёт весь семантический слой', () => {
  for (const [name, body] of Object.entries(THEMES)) {
    for (const v of SEMANTIC) assert.match(body, new RegExp(`${v}:\\s*[^;]+;`), `${name}: нет ${v}`);
  }
});

test('бренд-версии: только палитра канала — ни литералов, ни цветов overtake (ни салатового, ни розового)', () => {
  for (const name of ['brand-light', 'brand-dark']) {
    const body = THEMES[name];
    assert.deepEqual(body.match(LITERAL), null, `${name}: литерал цвета`);
    assert.doesNotMatch(body, /--ot-/, `${name}: цвет overtake`);
    assert.match(body, /--grad:\s*linear-gradient\(100deg,\s*var\(--sun\),\s*var\(--ember\)\)/, `${name}: акцент не жёлто-оранжевый`);
  }
});

test('версия overtake: их палитра (reference.md) через свои переменные', () => {
  const body = THEMES.overtake;
  assert.deepEqual(body.match(LITERAL), null, 'литералы — только в палитре --ot-*');
  for (const v of ['--ot-lime', '--ot-ink', '--ot-paper']) assert.match(body, new RegExp(`var\\(${v}\\)`));
});

test('шрифты: заголовки Onest, текст Inter, цифры JetBrains Mono; Oswald не грузится нигде', () => {
  const html = read('index.html');
  const fontLinks = [...html.matchAll(/href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/g)].map((m) => m[1]);
  assert.ok(fontLinks.length > 0);
  for (const href of fontLinks) {
    for (const family of ['family=Onest', 'family=Inter', 'family=JetBrains+Mono']) assert.ok(href.includes(family), `${family} в ${href}`);
    assert.doesNotMatch(href, /Oswald/);
  }
  assert.match(tokens, /--font-display:\s*'Onest'/);
  assert.match(tokens, /--font-body:\s*'Inter'/);
  assert.match(tokens, /--font-mono:\s*'JetBrains Mono'/);
  const all = cssFiles().map((f) => read(f)).join('\n') + read('index.html');
  assert.doesNotMatch(all, /Oswald/);
});

test('заголовки — обычный регистр, плотный трекинг', () => {
  const base = strip(read('src/styles/base.css'));
  const h = [...base.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, sel, body]) => /\bh1\b/.test(sel) && /font-family/.test(body))?.[2];
  assert.ok(h, 'нет правила шрифта заголовков h1, h2, h3');
  assert.doesNotMatch(h, /text-transform:\s*uppercase/);
  assert.match(h, /letter-spacing:\s*var\(--tracking-tight\)/);
  assert.match(tokens, /--tracking-tight:\s*-0\.0[2-4]em/);
});

test('components.css: компоненты overtake на семантических переменных', () => {
  const css = strip(read('src/styles/components.css'));
  for (const cls of ['.pill-label', '.btn', '.btn--primary', '.btn--ghost', '.btn__arrow', '.chip', '.panel', '.panel--block', '.stat-card', '.inline-pill']) {
    assert.match(css, new RegExp(`\\${cls}[\\s,{:.]`), `нет ${cls}`);
  }
  assert.doesNotMatch(css, PALETTE_NAMES);
});

test('шапка, hero, загрузка с полосой, подвал и фото — только семантические переменные', () => {
  for (const f of ['header', 'hero', 'preloader', 'footer', 'photos']) {
    const css = strip(read(`src/styles/sections/${f}.css`));
    const hit = css.match(PALETTE_NAMES);
    assert.equal(hit, null, `${f}.css: ${hit}`);
  }
});

test('панель версий подключается только под import.meta.env.DEV', () => {
  const main = read('src/main.js');
  assert.match(main, /if\s*\(\s*import\.meta\.env\.DEV\s*\)[^]*?import\(\s*'\.\/dev\/theme-switcher\.js'\s*\)/);
  assert.doesNotMatch(main, /^import[^\n]*theme-switcher/m);
});

test('hero: метка-пилюля, иконка-пилюля в заголовке, две кнопки-пилюли', () => {
  const html = read('index.html');
  const hero = html.split(/<section\b[^>]*\sid="hero"/)[1].split('</section>')[0];
  assert.match(hero, /class="[^"]*\bpill-label\b[^"]*"[^>]*data-i18n="hero\.eyebrow"/);
  const h1 = hero.match(/<h1\b[\s\S]*?<\/h1>/)[0];
  assert.match(h1, /class="[^"]*\binline-pill\b/);
  assert.match(hero, /class="btn btn--primary[^"]*"[^>]*data-place="hero"/);
  assert.match(hero, /class="btn btn--ghost[^"]*"/);
});

function cssFiles(dir = 'src/styles') {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? cssFiles(`${dir}/${e.name}`) : e.name.endsWith('.css') ? [`${dir}/${e.name}`] : [],
  );
}
