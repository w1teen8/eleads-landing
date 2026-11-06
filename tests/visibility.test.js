// Ревью T01: контент не прячется навсегда, шапка не прячется вовсе.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

// Правила, которые ставят начальное opacity:0 ревила. Каждый селектор обязан отпускать
// уже проявленное (.is-revealed) — иначе узел, вставленный после твина, остаётся невидимым.
test('начальное состояние ревила снимается классом .is-revealed', () => {
  const css = strip(read('src/styles/base.css'));
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, sel, body]) => /reveal/.test(sel) && /opacity:\s*0\s*;/.test(body));
  assert.ok(rules.length > 0, 'нет правила начального состояния ревила');
  for (const [, sel] of rules) {
    for (const part of sel.split(',').map((s) => s.trim())) {
      assert.match(part, /:not\(\.is-revealed\)/, `селектор без выхода: ${part}`);
    }
  }
});

test('motion.js помечает проявленное и подхватывает узлы, вставленные позже', () => {
  const src = read('src/core/motion.js');
  assert.match(src, /classList\.add\('is-revealed'\)/);
  assert.match(src, /MutationObserver/);
});

test('шапка не прячется ни при какой прокрутке', () => {
  const css = strip(read('src/styles/sections/header.css'));
  const js = read('src/sections/header.js');
  assert.doesNotMatch(css, /\.header[^{]*\.header__bar\s*\{[^}]*translate[^}]*-100%/);
  assert.doesNotMatch(css, /is-hidden/);
  assert.doesNotMatch(js, /is-hidden/);
});
