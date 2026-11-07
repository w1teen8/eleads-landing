// F1: правило брифа «движется только transform и opacity» там, где ревью нашло нарушения,
// и меню, которое прокручивается при остановленном Lenis.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('меню: Lenis не гасит в нём колесо и тач (data-lenis-prevent) — иначе при lockScroll до .menu__cta не докрутить', () => {
  const menu = read('index.html').match(/<div class="menu"[^>]*>/)[0];
  assert.match(menu, /\sid="menu"/);
  assert.match(menu, /\sdata-lenis-prevent(\s|>|=)/);
});

test('процесс: прогресс линии — transform слоя, а не stroke-dashoffset', () => {
  const js = strip(read('src/sections/process.js'));
  const css = strip(read('src/styles/sections/process.css'));
  assert.doesNotMatch(js, /strokeDashoffset|stroke-dashoffset|strokeDasharray/);
  assert.doesNotMatch(css, /stroke-dash/);
  assert.match(js, /scaleX\(/);
  assert.match(js, /scaleY\(/);
});

// T13: у ниш курсорной подсветки больше нет — там орбита (tests/aether-sections.test.js)
test('свечение материалов: курсор двигает слой transform-ом, позиция градиента от переменных не зависит', () => {
  for (const [file, vars] of [
    ['src/styles/sections/materials.css', ['--gx', '--gy']],
  ]) {
    const css = strip(read(file));
    for (const [, value] of css.matchAll(/background(?:-image|-position)?:\s*([^;]+);/g)) {
      for (const v of vars) assert.ok(!value.includes(`var(${v})`), `${file}: ${v} в background — градиент перерисовывается на каждый pointermove`);
    }
    for (const v of vars) {
      const uses = [...css.matchAll(new RegExp(`([a-z-]+):[^;]*var\\(${v}\\)`, 'g'))].map((m) => m[1]);
      assert.ok(uses.length > 0, `${file}: ${v} не используется`);
      assert.deepEqual([...new Set(uses)], ['transform'], `${file}: ${v} меняет не только transform`);
    }
  }
});
