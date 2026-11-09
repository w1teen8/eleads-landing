// GitHub Pages: сайт живёт в подпапке (/eleads-landing/). Сборка с BASE_PATH не должна оставить ни одной
// корневой ссылки на файл из public/ — ни в атрибутах (в т.ч. data-*), ни в JS/JSON, ни в CSS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { root } from './helpers.js';

const BASE = '/eleads-landing/';

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

// Верхний уровень public/: папки и файлы, на которые могут ссылаться страницы.
const publicEntries = readdirSync(join(root, 'public'))
  .filter((name) => !name.startsWith('.'))
  .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
// Корневая ссылка: кавычка / скобка / пробел / запятая, затем «/» и имя из public/ (или fonts/assets).
const rootAbsolute = new RegExp(`["'(\\s,=]/(?:${[...publicEntries, 'fonts', 'assets'].join('|')})(?=[/"'?#)\\s,]|$)`, 'g');

test('сборка с BASE_PATH: нет корневых ссылок на файлы public/', { timeout: 180_000 }, async () => {
  const { build } = await import('vite');
  const outDir = mkdtempSync(join(tmpdir(), 'eleads-base-'));
  const prev = process.env.BASE_PATH;
  process.env.BASE_PATH = BASE;
  try {
    await build({
      configFile: join(root, 'vite.config.js'),
      logLevel: 'silent',
      build: { outDir, emptyOutDir: true },
    });
    const files = walk(outDir).filter((f) => /\.(html|js|css|json)$/.test(f));
    assert.ok(files.some((f) => f.endsWith('.js')), 'сборка без js');
    const offenders = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      for (const m of text.matchAll(rootAbsolute)) {
        offenders.push(`${f.slice(outDir.length)}: …${text.slice(Math.max(0, m.index - 30), m.index + 50)}…`);
      }
    }
    assert.deepEqual(offenders, [], 'корневые ссылки без base');
    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    assert.match(html, /\/eleads-landing\/assets\/[^"]+\.js/, 'бандл подключён через base');
    assert.match(html, /data-src-desktop="\/eleads-landing\/video\//, 'видео hero через base');
  } finally {
    if (prev === undefined) delete process.env.BASE_PATH;
    else process.env.BASE_PATH = prev;
    rmSync(outDir, { recursive: true, force: true });
  }
});
