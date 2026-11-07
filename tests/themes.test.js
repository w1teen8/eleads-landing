// Сборка 2 — Aether (G10, G11, G13): две версии оформления на семантических переменных, шрифты облика
// с кириллицей, общие компоненты, шапка / загрузка / подвал / ленты только на семантических переменных.
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

/** Тело правила, у которого селектор содержит sel (первое совпадение). */
function block(css, sel) {
  for (const [, s, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (s.split(',').some((part) => part.trim() === sel)) return body;
  }
  return null;
}

const THEMES = {
  brand: block(tokens, "[data-theme='brand']"),
  aether: block(tokens, "[data-theme='aether']"),
};

test('две версии оформления — brand (она же :root) и aether; наборов overtake больше нет', () => {
  for (const [name, body] of Object.entries(THEMES)) assert.ok(body, `нет набора ${name}`);
  assert.match(tokens, /:root,\s*\[data-theme='brand'\]\s*\{/);
  assert.doesNotMatch(tokens, /brand-light|brand-dark|'overtake'|--ot-/);
});

test('каждая версия задаёт весь семантический слой', () => {
  for (const [name, body] of Object.entries(THEMES)) {
    for (const v of SEMANTIC) assert.match(body, new RegExp(`${v}:\\s*[^;]+;`), `${name}: нет ${v}`);
  }
});

test('brand: только палитра канала, фон --ink, акцент жёлтый→оранжевый, красного нет', () => {
  const body = THEMES.brand;
  assert.deepEqual(body.match(LITERAL), null, 'литерал цвета');
  assert.doesNotMatch(body, /--ae-/, 'цвет образца Aether');
  assert.match(body, /--bg:\s*var\(--ink\);/);
  assert.match(body, /--text:\s*var\(--fg\);/);
  assert.match(body, /--grad:\s*linear-gradient\(100deg,\s*var\(--sun\),\s*var\(--ember\)\)/);
});

test('aether: палитра образца через --ae-*, акцент красный', () => {
  const body = THEMES.aether;
  assert.deepEqual(body.match(LITERAL), null, 'литералы — только в палитре --ae-*');
  assert.match(body, /--accent:\s*var\(--ae-red\);/);
  assert.match(body, /--bg:\s*var\(--ae-bg\);/);
  // красный образца — действительно красный: R высокий, G и B низкие
  const hex = tokens.match(/--ae-red:\s*#([0-9a-f]{6})/i)[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  assert.ok(r > 220 && g < 90 && b < 90, `--ae-red не красный: #${hex}`);
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

test('фон: звёзды и зерно; зерно движется только transform-ом статичной текстуры', () => {
  const base = strip(read('src/styles/base.css'));
  assert.match(base, /var\(--star\)/, 'нет звёзд');
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

test('панель версий подключается только под import.meta.env.DEV и знает ровно brand и aether', () => {
  const main = read('src/main.js');
  assert.match(main, /if\s*\(\s*import\.meta\.env\.DEV\s*\)[^]*?import\(\s*'\.\/dev\/theme-switcher\.js'\s*\)/);
  assert.doesNotMatch(main, /^import[^\n]*theme-switcher/m);
  const dev = read('src/dev/theme-switcher.js');
  const ids = [...dev.matchAll(/\[\s*'([\w-]+)'\s*,\s*'[^']+'\s*\]/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['brand', 'aether']);
});

test('шапка как у Aether: ссылки слева, логотип по центру, справа UA/EN и пилюля «Написати» в Telegram', () => {
  const html = read('index.html');
  const header = html.match(/<header\b[\s\S]*?<\/header>/)[0];
  const bar = header.split(/<div class="menu"/)[0];
  const order = ['header__nav', 'logo', 'lang-switch', 'header__cta'].map((cls) => bar.search(new RegExp(`class="[^"]*\\b${cls}\\b`)));
  for (const i of order) assert.ok(i > -1);
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'порядок: ссылки → логотип → язык → кнопка');
  assert.match(bar, /class="btn btn--pill[^"]*header__cta"[^>]*href="\{\{config\.telegramUrl\}\}"/);
});

function cssFiles(dir = 'src/styles') {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? cssFiles(`${dir}/${e.name}`) : e.name.endsWith('.css') ? [`${dir}/${e.name}`] : [],
  );
}
