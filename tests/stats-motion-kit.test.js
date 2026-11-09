// Задача 3 (H10): единый язык движения — три общих помощника в src/core/motion-kit.js.
// В node нет window — motion.js считает это reduced-motion: помощники обязаны быть no-op и оставлять всё видимым.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const kit = await import('../src/core/motion-kit.js');

// H11: «убери все переходы которые сейчас есть» — наезд (stackReveal) и лесенка (stagger) больше нигде не вызываются;
// flipSwap остаётся только как ответ на действие (вкладки, смена значения).
test('H11: ни один блок не зовёт stackReveal и stagger', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const dir = new URL('../src/sections/', import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const js = readFileSync(new URL(file, dir), 'utf8');
    for (const fn of ['stackReveal', 'stagger']) assert.doesNotMatch(js, new RegExp(`\\b${fn}\\(`), `${file}: ${fn}()`);
  }
});

// минимальный «узел»: запоминает, что с ним делали
function fakeNode(text = '') {
  const calls = [];
  return {
    textContent: text,
    style: new Proxy({}, { set: (o, k, v) => (calls.push(`style.${String(k)}`), (o[k] = v), true) }),
    classList: { add: (c) => calls.push(`add ${c}`), remove: () => {}, contains: () => false, toggle: () => {} },
    setAttribute: (k) => calls.push(`attr ${k}`),
    animate: () => calls.push('animate'),
    appendChild: () => calls.push('append'),
    append: () => calls.push('append'),
    replaceChildren: () => calls.push('replace'),
    calls,
  };
}

test('motion-kit: stackReveal, flipSwap, stagger экспортированы; шаг лесенки 80 мс, сдвиг 24px, 0.6 с', () => {
  for (const name of ['stackReveal', 'flipSwap', 'stagger']) assert.equal(typeof kit[name], 'function', name);
  assert.equal(kit.STAGGER.step, 0.08);
  assert.equal(kit.STAGGER.y, 24);
  assert.equal(kit.STAGGER.duration, 0.6);
  assert.equal(kit.STAGGER.ease, 'power3.out');
});

test('reduced-motion: flipSwap просто ставит новый текст, без анимации и обёрток', async () => {
  const node = fakeNode('81%');
  await kit.flipSwap(node, '1B+');
  assert.equal(node.textContent, '1B+');
  assert.deepEqual(node.calls, []);
});

test('reduced-motion: stagger не прячет карточки, но onEach зовётся по порядку — цифры встают сразу', async () => {
  const items = [fakeNode('a'), fakeNode('b'), fakeNode('c')];
  const seen = [];
  await kit.stagger(items, { onEach: (node, i) => seen.push(i) });
  assert.deepEqual(seen, [0, 1, 2]);
  for (const node of items) assert.deepEqual(node.calls, [], 'узел не тронут');
});

test('reduced-motion: stackReveal ничего не закрепляет и не добавляет', () => {
  const prev = fakeNode();
  const section = { ...fakeNode(), previousElementSibling: prev };
  assert.doesNotThrow(() => kit.stackReveal(section));
  assert.deepEqual(section.calls, []);
  assert.deepEqual(prev.calls, []);
  assert.doesNotThrow(() => kit.stackReveal(null));
});
