// G11: панель версий — инструмент заказчика, в собранном сайте её нет ни кодом, ни разметкой;
// а ?theme= работает и в сборке (инлайн-скрипт в <head>). Собирает проект во временную папку.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { root } from './helpers.js';

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

test('dist: нет панели версий, есть выбор темы по ?theme=', { timeout: 120_000 }, async () => {
  const { build } = await import('vite');
  const outDir = mkdtempSync(join(tmpdir(), 'eleads-dist-'));
  try {
    await build({
      configFile: join(root, 'vite.config.js'),
      logLevel: 'silent',
      build: { outDir, emptyOutDir: true },
    });
    const files = walk(outDir).filter((f) => /\.(js|css|html)$/.test(f));
    assert.ok(files.some((f) => f.endsWith('.js')), 'сборка без js');
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      // маркеры панели: имя модуля, её класс и атрибут — в dev-коде они есть (см. src/dev/theme-switcher.js)
      assert.doesNotMatch(text, /theme-switcher|dev-theme|data-dev-themes/, `${f}: код панели версий`);
    }
    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    assert.match(html, /eleads-theme/);
    assert.match(html, /setAttribute\('data-theme'/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
