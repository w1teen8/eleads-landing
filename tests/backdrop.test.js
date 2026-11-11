// 2026-11-11 «на фон добавить пятна или анимации… как на 3duva-studio.com, но по-своему»: живой фон —
// тёплые пятна (backdrop.css) и волна из точек (src/core/backdrop.js) за всей страницей.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const css = strip(read('src/styles/backdrop.css'));
const js = strip(read('src/core/backdrop.js'));
const main = read('src/main.js');

test('фон: слой закреплён за страницей, под контентом и не ловит курсор', () => {
  const rule = css.match(/\.backdrop\s*\{([^}]*)\}/)?.[1] || '';
  assert.match(rule, /position:\s*fixed/);
  assert.match(rule, /z-index:\s*-1/);
  assert.match(rule, /pointer-events:\s*none/);
});

test('фон: пятна — градиенты в цветах канала через переменные, без filter; движение — только transform', () => {
  assert.doesNotMatch(css, /filter\s*:/);
  for (const v of ['--accent', '--accent-2']) assert.match(css, new RegExp(`var\\(${v}\\)`), v);
  for (const [, body] of css.matchAll(/@keyframes\s+[\w-]+\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)) {
    for (const [, prop] of body.matchAll(/([a-z-]+)\s*:/g)) assert.equal(prop, 'transform');
  }
  // дрейф пятен — только когда движение разрешено (класс js-anim ставит index.html)
  assert.match(css, /\.js-anim \.backdrop__glow--sun\s*\{[^}]*animation:/);
});

test('волна: цвета из CSS-переменных, 30 кадров, пауза на скрытой вкладке, при reduced — один кадр', () => {
  for (const v of ['--text', '--accent', '--accent-2']) assert.match(js, new RegExp(`getPropertyValue\\('${v}'\\)`), v);
  assert.match(js, /const FPS = 30;/);
  assert.match(js, /visibilitychange/);
  assert.match(js, /if \(reduced\) \{[\s\S]*?draw\([^)]*\);[\s\S]*?return root;/);
  assert.match(js, /aria-hidden', 'true'/);
  for (const [, prop] of js.matchAll(/\.style\.(\w+)\s*=/g)) assert.equal(prop, 'transform', `style.${prop}`);
});

test('фон подключён в main.js до секций, с признаком reduced-motion из motion.js', () => {
  assert.match(main, /import \{ initBackdrop \} from '\.\/core\/backdrop\.js';/);
  assert.match(main, /'\.\/styles\/backdrop\.css'/);
  assert.match(main, /initBackdrop\(\{ reduced \}\)/);
  assert.ok(main.indexOf('initBackdrop({ reduced })') < main.indexOf('await initSections()'));
});
