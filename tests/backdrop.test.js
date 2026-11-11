// 2026-11-11 «на фон добавить пятна или анимации… как на 3duva-studio.com, но по-своему» → «Оставляем только пыль»:
// живой фон за всей страницей — светящаяся пыль (src/core/backdrop.js), без пятен и волны из точек.
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

test('«Оставляем только пыль»: ни пятен, ни волны из точек', () => {
  assert.doesNotMatch(css + js, /backdrop__glow|backdrop__spot|backdrop__waves|SCENES|heightAt/);
  assert.match(js, /class="backdrop__dust"/);
  assert.doesNotMatch(css, /filter\s*:|@keyframes/);
});

test('пыль: цвета из CSS-переменных, 30 кадров, пауза на скрытой вкладке, при reduced — один кадр', () => {
  for (const v of ['--text', '--accent']) assert.match(js, new RegExp(`getPropertyValue\\('${v}'\\)`), v);
  assert.match(js, /const FPS = 30;/);
  assert.match(js, /visibilitychange/);
  assert.match(js, /if \(reduced\) \{[\s\S]*?draw\([^)]*\);[\s\S]*?return root;/);
  assert.match(js, /aria-hidden', 'true'/);
  assert.doesNotMatch(js, /\.style\.\w+\s*=/, 'стили элементов не трогает — всё на холсте');
});

test('пыль: одна и та же, всплывает, при прокрутке ближняя уходит быстрее дальней', async () => {
  const { makeDust, dustY } = await import('../src/core/backdrop.js');
  const d = makeDust(50);
  assert.equal(d.length, 50);
  assert.deepEqual(makeDust(50), d);
  for (const [x, y, , v, depth] of d) assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1 && v > 0 && depth >= 0.3 && depth <= 1);
  assert.ok(dustY(0.5, 0.01, 0.5, 1, 0) < 0.5, 'всплывает');
  const near = 0.5 - dustY(0.5, 0, 1, 0, 0.5), far = 0.5 - dustY(0.5, 0, 0.3, 0, 0.5);
  assert.ok(near > far, 'параллакс');
  for (const t of [0, 3, 100]) { const y = dustY(0.2, 0.012, 0.9, t, 7); assert.ok(y >= 0 && y < 1); }
});

test('фон подключён в main.js до секций, с признаком reduced-motion из motion.js', () => {
  assert.match(main, /import \{ initBackdrop \} from '\.\/core\/backdrop\.js';/);
  assert.match(main, /'\.\/styles\/backdrop\.css'/);
  assert.match(main, /initBackdrop\(\{ reduced \}\)/);
  assert.ok(main.indexOf('initBackdrop({ reduced })') < main.indexOf('await initSections()'));
});
