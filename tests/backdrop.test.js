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
  for (const [, prop] of js.matchAll(/\.style\.(\w+)\s*=/g)) assert.ok(['transform', 'opacity'].includes(prop), `style.${prop}`);
});

test('фон подключён в main.js до секций, с признаком reduced-motion из motion.js', () => {
  assert.match(main, /import \{ initBackdrop \} from '\.\/core\/backdrop\.js';/);
  assert.match(main, /'\.\/styles\/backdrop\.css'/);
  assert.match(main, /initBackdrop\(\{ reduced \}\)/);
  assert.ok(main.indexOf('initBackdrop({ reduced })') < main.indexOf('await initSections()'));
});

// «На протяжении всей страницы должно меняться» → «Пятна + пыль»
test('пятна меняют место и яркость по ходу страницы; пыль — по всему экрану', async () => {
  const { SCENES, sceneAt, makeDust } = await import('../src/core/backdrop.js');
  assert.ok(SCENES.length >= 5, 'сцен на всю страницу');
  for (const sc of SCENES) assert.equal(sc.length, 3, 'три пятна');
  assert.deepEqual(sceneAt(0), SCENES[0]);
  assert.deepEqual(sceneAt(1), SCENES[SCENES.length - 1]);
  assert.deepEqual(sceneAt(-5), SCENES[0]);
  const mid = sceneAt(0.5);
  assert.notDeepEqual(mid, SCENES[0], 'посередине страницы — другая сцена');
  for (const [, , o] of mid) assert.ok(o >= 0 && o <= 1);
  const d = makeDust(50);
  assert.equal(d.length, 50);
  assert.deepEqual(makeDust(50), d, 'одна и та же пыль');
  for (const [x, y, , v, depth] of d) assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1 && v > 0 && depth >= 0.3 && depth <= 1);
  assert.match(js, /drawDust\(t, scroll\)/);
  assert.match(css, /\.backdrop__spot\s*\{[^}]*will-change:\s*transform, opacity/);
});
