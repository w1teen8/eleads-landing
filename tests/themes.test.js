// Оформление: один семантический слой на палитре канала (сборка 3, T18 — тем, переключателя и Aether больше нет),
// шрифты облика с кириллицей, общие компоненты, шапка / загрузка / подвал / ленты на переменных.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { read, root } from './helpers.js';

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = strip(read('src/styles/tokens.css'));

// interfaces.md → «Сборка 2 — оформление и темы» (семантический слой остаётся тем же)
const SEMANTIC = [
  '--bg', '--surface', '--surface-2', '--block', '--block-2', '--text', '--text-muted', '--text-on-block',
  '--text-on-block-muted', '--accent', '--accent-2', '--accent-ink', '--tag-1', '--tag-2', '--line', '--line-strong', '--grad',
];
// палитра канала: секциям после перекраски её имена не нужны
const PALETTE_NAMES = /var\(--(ink|navy|card|fg|muted|sun|ember|tg|fg-soft|ember-glow|sun-glow|ink-veil|ae-[\w-]+)\)/;
const LITERAL = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;

/** Тело правила :root, где объявлен семантический слой. */
const semantic = [...tokens.matchAll(/:root\s*\{([^{}]*)\}/g)].map((m) => m[1]).find((body) => /--bg:/.test(body));

test('одна версия оформления: семантический слой на :root, тем и их переключения нет нигде', () => {
  assert.ok(semantic, 'нет семантического слоя');
  assert.doesNotMatch(tokens, /data-theme|--ae-|brand-light|brand-dark|'overtake'|--ot-/);
  const all = cssFiles().map((f) => read(f)).join('\n') + read('index.html') + read('src/main.js');
  assert.doesNotMatch(all, /data-theme|eleads-theme|theme-switcher/);
});

test('семантический слой задан целиком', () => {
  for (const v of SEMANTIC) assert.match(semantic, new RegExp(`${v}:\\s*[^;]+;`), `нет ${v}`);
});

test('семантика — только палитра канала: фон --ink, текст --fg, акцент жёлтый→оранжевый', () => {
  assert.deepEqual(semantic.match(LITERAL), null, 'литерал цвета');
  assert.match(semantic, /--bg:\s*var\(--ink\);/);
  assert.match(semantic, /--text:\s*var\(--fg\);/);
  assert.match(semantic, /--accent:\s*var\(--sun\);/);
  assert.match(semantic, /--accent-2:\s*var\(--ember\);/);
  assert.match(semantic, /--grad:\s*linear-gradient\(100deg,\s*var\(--sun\),\s*var\(--ember\)\)/);
});

test('шрифты: Unbounded (заголовки), Onest (текст), JetBrains Mono (подписи); Inter и Oswald не грузятся', () => {
  const html = read('index.html');
  const fontLinks = [...html.matchAll(/href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/g)].map((m) => m[1]);
  assert.ok(fontLinks.length > 0);
  for (const href of fontLinks) {
    for (const family of ['family=Unbounded', 'family=Onest', 'family=JetBrains+Mono']) assert.ok(href.includes(family), `${family} в ${href}`);
    assert.doesNotMatch(href, /Inter|Oswald/);
  }
  assert.match(tokens, /--font-display:\s*'Unbounded'/);
  assert.match(tokens, /--font-body:\s*'Onest'/);
  assert.match(tokens, /--font-mono:\s*'JetBrains Mono'/);
  const all = cssFiles().map((f) => read(f)).join('\n') + html;
  assert.doesNotMatch(all, /'Inter'|Oswald/);
});

test('заголовки — широкий капс Unbounded', () => {
  const base = strip(read('src/styles/base.css'));
  const h = [...base.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, sel, body]) => /\bh1\b/.test(sel) && /font-family/.test(body))?.[2];
  assert.ok(h, 'нет правила шрифта заголовков h1, h2, h3');
  assert.match(h, /font-family:\s*var\(--font-display\)/);
  assert.match(h, /text-transform:\s*uppercase/);
});

// T23 (H14): «фон всей страницы #070C18 одним слоем» — звёзды облика Aether убраны, как на выбранном первом экране B
test('фон: один слой --bg и зерно; звёзд нет; зерно движется только transform-ом статичной текстуры', () => {
  const base = strip(read('src/styles/base.css'));
  assert.doesNotMatch(base, /var\(--star\)/, 'звёзды');
  assert.match(base, /body\s*\{[^}]*background:\s*var\(--bg\)/);
  const grain = [...base.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)].find(([, name]) => /grain/.test(name));
  assert.ok(grain, 'нет анимации зерна');
  for (const [, prop] of grain[2].matchAll(/([a-z-]+)\s*:/g)) assert.equal(prop, 'transform');
  assert.doesNotMatch(base, /filter:\s*(blur|url)/);
});

test('components.css: общие компоненты Aether на семантических переменных', () => {
  const css = strip(read('src/styles/components.css'));
  for (const cls of ['.mono-label', '.display', '.display__accent', '.btn', '.btn--pill', '.btn--primary', '.planet', '.planet__body', '.planet__ring']) {
    assert.match(css, new RegExp(`\\${cls}[\\s,{:.]`), `нет ${cls}`);
  }
  assert.doesNotMatch(css, PALETTE_NAMES);
  // планета параметризуется переменными
  for (const v of ['--planet-size', '--planet-tilt']) assert.match(css, new RegExp(`var\\(${v}`), `.planet без ${v}`);
});

test('шапка, загрузка с полосой, подвал и ленты — только семантические переменные', () => {
  for (const f of ['header', 'preloader', 'footer', 'ribbons']) {
    const css = strip(read(`src/styles/sections/${f}.css`));
    const hit = css.match(PALETTE_NAMES);
    assert.equal(hit, null, `${f}.css: ${hit}`);
  }
});

// T23 (H16): «И не надо подписывать это все» — ссылок-разделов в шапке нет, разделы — в меню-бургере
test('шапка: слева логотип, справа UA/EN и пилюля «Написати» в Telegram; ссылок-разделов нет', () => {
  const html = read('index.html');
  const header = html.match(/<header\b[\s\S]*?<\/header>/)[0];
  const bar = header.split(/<div class="menu"/)[0];
  const order = ['logo', 'lang-switch', 'header__cta'].map((cls) => bar.search(new RegExp(`class="[^"]*\\b${cls}\\b`)));
  for (const i of order) assert.ok(i > -1);
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'порядок: логотип → язык → кнопка');
  assert.doesNotMatch(bar, /header__nav|header__link/);
  assert.match(bar, /class="btn btn--pill[^"]*header__cta"[^>]*href="\{\{config\.telegramUrl\}\}"/);
});

function cssFiles(dir = 'src/styles') {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? cssFiles(`${dir}/${e.name}`) : e.name.endsWith('.css') ? [`${dir}/${e.name}`] : [],
  );
}
