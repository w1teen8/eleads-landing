// F1: первый экран не может остаться невидимым — whenIntroDone() не ждёт сломанный прелоадер вечно.
import { test } from 'node:test';
import assert from 'node:assert/strict';

function fakeDocument() {
  const doc = new EventTarget();
  const classes = new Set(['js-anim', 'js-preload']);
  doc.documentElement = {
    dataset: {},
    classList: { remove: (c) => classes.delete(c), contains: (c) => classes.has(c), add: (c) => classes.add(c) },
  };
  return doc;
}

test('прелоадер не подал сигнал (упал) — whenIntroDone всё равно резолвится до 3 с от старта страницы и снимает шторку', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  globalThis.document = fakeDocument();
  const { whenIntroDone } = await import(`../src/core/intro.js?case=timeout`);
  let outcome = null;
  whenIntroDone().then((v) => (outcome = v));
  // 3 с от навигации: даже если модуль позвали поздно, срок отсчитывается от старта страницы
  t.mock.timers.tick(3000 - Math.min(3000, performance.now()));
  await new Promise((r) => setImmediate(r));
  assert.equal(outcome, 'timeout', 'whenIntroDone не резолвится без сигнала прелоадера');
  assert.equal(document.documentElement.dataset.intro, 'done');
  assert.equal(document.documentElement.classList.contains('js-preload'), false, 'шторка прелоадера осталась');
});

test('сигнал прелоадера вовремя — резолвится как «done», без таймаута', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  globalThis.document = fakeDocument();
  const { whenIntroDone, signalIntroDone } = await import(`../src/core/intro.js?case=ok`);
  let outcome = null;
  whenIntroDone().then((v) => (outcome = v));
  signalIntroDone();
  await new Promise((r) => setImmediate(r));
  assert.equal(outcome, 'done');
  assert.equal(document.documentElement.classList.contains('js-preload'), true, 'шторку снимает сам прелоадер');
});
