// F1: первый экран не может остаться невидимым, но и не обрывает живую заставку.
// Крайний срок whenIntroDone() считается от старта прелоадера и не раньше его потолка + выхода шторки;
// упавший прелоадер сообщает об этом сразу ('failed').
import { test } from 'node:test';
import assert from 'node:assert/strict';

let seq = 0;

function fakeDom() {
  const classSet = (initial = []) => {
    const set = new Set(initial);
    return { add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c) };
  };
  const curtain = { classList: classSet(), hidden: false, addEventListener() {} };
  const doc = new EventTarget();
  doc.documentElement = { dataset: {}, classList: classSet(['js-anim', 'js-preload']) };
  doc.readyState = 'loading';
  doc.querySelector = (sel) => (sel === '.preloader' ? curtain : null);
  globalThis.document = doc;
  globalThis.window = { addEventListener() {} };
  globalThis.sessionStorage = { setItem() {} };
  globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(performance.now()), 16);
  return { doc, curtain };
}

const load = (path) => import(`${path}?case=${++seq}`);
const flush = () => new Promise((r) => setImmediate(r));
const silence = (t) => t.mock.method(console, 'error', () => {});

test('медленная, но живая заставка: крайний срок не наступает раньше потолка прелоадера + выхода шторки', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc, curtain } = fakeDom();
  const intro = await load('../src/core/intro.js');
  intro.markIntroStart(); // прелоадер стартовал поздно — отсчёт от него, а не от навигации
  let outcome = null;
  intro.whenIntroDone().then((v) => (outcome = v));
  t.mock.timers.tick(intro.PRELOADER_MAX_MS + intro.PRELOADER_SAFETY_MS + intro.INTRO_EXIT_MS);
  await flush();
  assert.equal(outcome, null, 'крайний срок сработал, пока заставка ещё уходит сама');
  assert.equal(doc.documentElement.classList.contains('js-preload'), true);
  assert.equal(curtain.classList.contains('is-leaving'), false);
});

test('крайний срок: сначала уход шторки (is-leaving), потом снимается js-preload', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc, curtain } = fakeDom();
  const intro = await load('../src/core/intro.js');
  intro.markIntroStart();
  let outcome = null;
  intro.whenIntroDone().then((v) => (outcome = v));
  t.mock.timers.tick(intro.INTRO_DEADLINE_MS + 50);
  await flush();
  assert.equal(outcome, 'timeout');
  assert.equal(curtain.classList.contains('is-leaving'), true, 'шторка не проиграла выход');
  assert.equal(doc.documentElement.classList.contains('js-preload'), true, 'js-preload снят до конца выхода');
  t.mock.timers.tick(intro.INTRO_EXIT_MS);
  assert.equal(doc.documentElement.classList.contains('js-preload'), false);
});

test('прелоадер бросает в кадре — первый экран узнаёт об этом сразу (failed), до 3 с, шторка уходит', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  silence(t);
  const { doc, curtain } = fakeDom();
  const intro = await load('../src/core/intro.js');
  const preloader = await load('../src/sections/preloader.js');
  // узлов процентов и полосы нет — tick падает на первом кадре
  preloader.init({ querySelector: () => null, classList: curtain.classList, addEventListener() {} });
  let outcome = null;
  intro.whenIntroDone().then((v) => (outcome = v));
  t.mock.timers.tick(100);
  await flush();
  assert.equal(outcome, 'failed');
  assert.equal(curtain.classList.contains('is-leaving'), true);
  t.mock.timers.tick(intro.INTRO_EXIT_MS);
  assert.equal(doc.documentElement.classList.contains('js-preload'), false);
});

test('сигнал прелоадера вовремя — «done», шторку снимает сам прелоадер', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc } = fakeDom();
  const intro = await load('../src/core/intro.js');
  let outcome = null;
  intro.whenIntroDone().then((v) => (outcome = v));
  intro.signalIntroDone();
  await flush();
  assert.equal(outcome, 'done');
  assert.equal(doc.documentElement.classList.contains('js-preload'), true);
});
