// T38 (H51): страница /admin/ — вторая точка входа сборки, noindex, CSP, сайт на неё не ссылается;
// тексты нигде не выводятся как HTML; в коде админки нет токенов, адресов почты и логов.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { read, root } from './helpers.js';

const admin = read('admin/index.html');
const adminSources = readdirSync(join(root, 'src/admin')).map((f) => [`src/admin/${f}`, read(`src/admin/${f}`)]);
const strip = (js) => js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('admin/index.html: noindex, CSP — запросы только к себе и api.github.com, скрипты только свои', () => {
  assert.match(admin, /<meta name="robots" content="noindex,nofollow"/);
  assert.match(admin, /<meta name="referrer" content="no-referrer"/);
  const csp = admin.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1];
  assert.ok(csp, 'нет CSP');
  const rules = Object.fromEntries(csp.split(';').map((r) => r.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
  assert.deepEqual(rules['connect-src'], ["'self'", 'https://api.github.com']);
  assert.deepEqual(rules['script-src'], ["'self'"]);
  assert.deepEqual(rules['default-src'], ["'self'"]);
  assert.deepEqual(rules['object-src'], ["'none'"]);
  assert.deepEqual(rules['base-uri'], ["'none'"]);
  assert.doesNotMatch(admin, /<script(?![^>]*\ssrc=)[^>]*>/, 'встроенных скриптов нет');
  assert.match(admin, /<script type="module" src="\/src\/admin\/main\.js"><\/script>/);
});

test('сайт на админку не ссылается', () => {
  assert.doesNotMatch(read('index.html'), /admin/i);
  for (const f of readdirSync(join(root, 'src/sections'))) assert.doesNotMatch(read(`src/sections/${f}`), /\/admin\b/, f);
});

test('админка: значения только через textContent / value — без innerHTML, eval, document.write; без логов', () => {
  for (const [file, src] of adminSources) {
    const code = strip(src);
    assert.doesNotMatch(code, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function|setHTML|createContextualFragment/, file);
    assert.doesNotMatch(code, /console\.(log|info|debug|warn|error)/, `${file}: логов нет — токен не может в них попасть`);
  }
  const fetchers = adminSources.filter(([, src]) => /\bfetch\(/.test(strip(src))).map(([f]) => f);
  assert.deepEqual(fetchers, ['src/admin/github.js'], 'сеть — только в клиенте GitHub');
  assert.match(read('src/admin/config.js'), /export const API = 'https:\/\/api\.github\.com';/);
});

test('в коде и разметке админки нет токенов и адресов почты', () => {
  const token = /\b(?:github_pat_|gh[pousr]_)[A-Za-z0-9_]{20,}/;
  const email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/;
  for (const [file, src] of [...adminSources, ['admin/index.html', admin]]) {
    assert.doesNotMatch(src, token, file);
    assert.doesNotMatch(src, email, file);
  }
});

test('сайт выводит тексты как текст: i18n — textContent / setAttribute, без innerHTML', () => {
  const i18n = strip(read('src/core/i18n.js'));
  assert.doesNotMatch(i18n, /innerHTML|outerHTML|insertAdjacentHTML/);
  assert.match(i18n, /node\.textContent = value/);
  assert.match(i18n, /node\.setAttribute\(attr, value\)/);
});

test('пре-рендер: любой текст из админки — буквально и экранирован, «$1», «$&», «$`» в атрибутах не ломают HTML', async () => {
  const { prerender } = await import('../build/i18n-prerender.js');
  const value = 'від $10K і $& $` $\' "лапки" <b>&';
  const html = '<meta name="d" content="" data-i18n-attr="content:a" /><img data-i18n-attr="alt:a"><p data-i18n="a"></p>';
  const out = prerender(html, { a: value }, {});
  const attr = 'від $10K і $&amp; $` $\' &quot;лапки&quot; &lt;b&gt;&amp;';
  assert.equal(out, `<meta name="d" content="${attr}" data-i18n-attr="content:a" /><img alt="${attr}" data-i18n-attr="alt:a"><p data-i18n="a">від $10K і $&amp; $\` $' "лапки" &lt;b&gt;&amp;</p>`);
});

test('vite.config: вторая точка входа admin/index.html', () => {
  const cfg = read('vite.config.js');
  assert.match(cfg, /input:\s*\{[\s\S]*main:[^,]*index\.html[\s\S]*admin:[^,]*admin\/index\.html/);
});

test('сборка с BASE_PATH: dist/index.html и dist/admin/index.html, пути через base', { timeout: 180_000 }, async () => {
  const { build } = await import('vite');
  const outDir = mkdtempSync(join(tmpdir(), 'eleads-admin-'));
  const prev = process.env.BASE_PATH;
  process.env.BASE_PATH = '/eleads-landing/';
  try {
    await build({ configFile: join(root, 'vite.config.js'), logLevel: 'silent', build: { outDir, emptyOutDir: true } });
    assert.ok(existsSync(join(outDir, 'index.html')));
    const page = readFileSync(join(outDir, 'admin/index.html'), 'utf8');
    assert.match(page, /noindex,nofollow/);
    assert.match(page, /connect-src 'self' https:\/\/api\.github\.com/);
    assert.match(page, /<script type="module" crossorigin src="\/eleads-landing\/assets\/admin-[^"]+\.js"><\/script>/);
    assert.match(page, /<link rel="stylesheet" crossorigin href="\/eleads-landing\/assets\/admin-[^"]+\.css">/);
    assert.match(page, /href="\/eleads-landing\/favicon\.svg"/);
    const site = readFileSync(join(outDir, 'index.html'), 'utf8');
    assert.doesNotMatch(site, /admin-[\w-]+\.(js|css)/, 'код админки не грузится на сайте');
  } finally {
    if (prev === undefined) delete process.env.BASE_PATH;
    else process.env.BASE_PATH = prev;
    rmSync(outDir, { recursive: true, force: true });
  }
});
