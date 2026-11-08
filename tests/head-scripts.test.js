// Сборка 2: инлайн-скрипты <head> — тема до первой отрисовки (G11) и заставка не чаще раза в сутки (G12).
// Скрипты берутся из index.html как есть и выполняются в песочнице с подставными location и хранилищами.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { read } from './helpers.js';

const html = read('index.html');
const head = html.split('</head>')[0];
const inline = [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 6, 12);

function storage(initial = {}, { broken = false } = {}) {
  const map = new Map(Object.entries(initial));
  const guard = () => {
    if (broken) throw new Error('SecurityError');
  };
  return {
    map,
    getItem: (k) => (guard(), map.has(k) ? map.get(k) : null),
    setItem: (k, v) => (guard(), map.set(k, String(v))),
    removeItem: (k) => (guard(), map.delete(k)),
  };
}

/** Прогоняет все инлайн-скрипты <head>; возвращает <html> после них. */
function runHead({ search = '', session = storage(), local = storage(), reduced = false } = {}) {
  const classes = new Set();
  const documentElement = {
    dataset: {},
    attrs: {},
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c) },
    setAttribute(name, value) {
      this.attrs[name] = String(value);
    },
    getAttribute(name) {
      return name in this.attrs ? this.attrs[name] : null;
    },
  };
  const DateFixed = class extends Date {
    static now() {
      return NOW;
    }
  };
  const sandbox = {
    document: { documentElement },
    location: { search },
    sessionStorage: session,
    localStorage: local,
    matchMedia: () => ({ matches: reduced }),
    setTimeout: () => 0,
    URLSearchParams,
    Date: DateFixed,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const code of inline) vm.runInContext(code, sandbox);
  return { theme: documentElement.getAttribute('data-theme'), hero: documentElement.getAttribute('data-hero'), preload: classes.has('js-preload'), planeIntro: classes.has('js-plane-intro'), session, local };
}

test('тема: без параметра и хранилища — brand', () => {
  assert.equal(runHead().theme, 'brand');
});

test('тема: ?theme= ставит версию и запоминает её в sessionStorage', () => {
  for (const name of ['brand', 'aether']) {
    const r = runHead({ search: `?theme=${name}` });
    assert.equal(r.theme, name);
    assert.equal(r.session.map.get('eleads-theme'), name);
  }
});

test('тема: без параметра берётся из sessionStorage, параметр важнее хранилища', () => {
  assert.equal(runHead({ session: storage({ 'eleads-theme': 'aether' }) }).theme, 'aether');
  assert.equal(runHead({ search: '?theme=brand', session: storage({ 'eleads-theme': 'aether' }) }).theme, 'brand');
});

test('тема: старые версии overtake (brand-light, brand-dark, overtake) ведут на brand', () => {
  for (const old of ['brand-light', 'brand-dark', 'overtake']) {
    assert.equal(runHead({ search: `?theme=${old}` }).theme, 'brand', `?theme=${old}`);
    assert.equal(runHead({ session: storage({ 'eleads-theme': old }) }).theme, 'brand', `session ${old}`);
  }
});

test('тема: неизвестное значение и сломанное хранилище — brand', () => {
  assert.equal(runHead({ search: '?theme=pink' }).theme, 'brand');
  assert.equal(runHead({ session: storage({ 'eleads-theme': '<x>' }) }).theme, 'brand');
  assert.equal(runHead({ search: '?theme=aether', session: storage({}, { broken: true }) }).theme, 'aether');
  assert.equal(runHead({ session: storage({}, { broken: true }) }).theme, 'brand');
});

test('тема ставится и при reduced-motion (скрипт анимаций выходит раньше)', () => {
  assert.equal(runHead({ search: '?nomotion=1&theme=aether' }).theme, 'aether');
});

test('заставка: первый заход — показывается', () => {
  assert.equal(runHead().preload, true);
});

test('заставка: показанная меньше суток назад — в новой вкладке нет', () => {
  const local = storage({ 'eleads-intro': String(NOW - DAY + 60_000) });
  assert.equal(runHead({ local }).preload, false);
  assert.equal(runHead({ local: storage({ 'eleads-intro': String(NOW - 60_000) }) }).preload, false);
});

test('заставка: старше суток, мусор в метке или старый флаг «1» — показывается снова', () => {
  assert.equal(runHead({ local: storage({ 'eleads-intro': String(NOW - DAY - 1) }) }).preload, true);
  assert.equal(runHead({ local: storage({ 'eleads-intro': 'abc' }) }).preload, true);
  assert.equal(runHead({ local: storage({ 'eleads-intro': '1' }) }).preload, true);
});

test('заставка: флаг sessionStorage больше не прячет её', () => {
  assert.equal(runHead({ session: storage({ 'eleads-intro': '1' }) }).preload, true);
});

test('заставка: ?intro=1 показывает принудительно, даже если была минуту назад', () => {
  const local = storage({ 'eleads-intro': String(NOW - 60_000) });
  assert.equal(runHead({ search: '?intro=1', local }).preload, true);
});

test('заставка: без доступа к localStorage — показывается; при reduced-motion — нет', () => {
  assert.equal(runHead({ local: storage({}, { broken: true }) }).preload, true);
  assert.equal(runHead({ reduced: true }).preload, false);
  assert.equal(runHead({ search: '?nomotion=1&intro=1' }).preload, false);
});

test('заставка: метка, которую пишет preloader.js, прячет заставку в следующей вкладке', async () => {
  globalThis.window ??= { location: { search: '' }, addEventListener() {} };
  const { rememberIntro, INTRO_KEY } = await import('../src/sections/preloader.js');
  assert.equal(INTRO_KEY, 'eleads-intro');
  const local = storage();
  rememberIntro(local, NOW - 5 * 60_000);
  assert.equal(runHead({ local }).preload, false);
  // сломанное хранилище не роняет заставку
  assert.doesNotThrow(() => rememberIntro(storage({}, { broken: true }), NOW));
});

test('вариант первого экрана: по умолчанию mockup; ?hero=2 → mockup; ?hero=1 (удалённый orbit) и неизвестное → mockup', () => {
  assert.equal(runHead().hero, 'mockup');
  const r1 = runHead({ search: '?hero=1' });
  assert.equal(r1.hero, 'mockup');
  assert.notEqual(r1.session.map.get('eleads-hero'), 'orbit');
  assert.equal(runHead({ search: '?hero=orbit' }).hero, 'mockup');
  assert.equal(runHead({ session: storage({ 'eleads-hero': 'orbit' }) }).hero, 'mockup', 'старый выбор orbit → mockup');
  assert.equal(runHead({ search: '?hero=2', session: storage({ 'eleads-hero': 'plane' }) }).hero, 'mockup');
  assert.equal(runHead({ search: '?hero=mockup', session: storage({ 'eleads-hero': 'blue' }) }).hero, 'mockup');
  assert.equal(runHead({ search: '?hero=9', session: storage({ 'eleads-hero': '<x>' }) }).hero, 'mockup');
});

test('вариант 4: ?hero=4 и ?hero=blue → blue, держится в sessionStorage; заставка — поиск, как в варианте 2', () => {
  const r = runHead({ search: '?hero=4' });
  assert.equal(r.hero, 'blue');
  assert.equal(r.session.map.get('eleads-hero'), 'blue');
  assert.equal(runHead({ search: '?hero=blue' }).hero, 'blue');
  assert.equal(runHead({ session: storage({ 'eleads-hero': 'blue' }) }).hero, 'blue');
  assert.equal(runHead({ search: '?hero=4', session: storage({}, { broken: true }) }).hero, 'blue');
  assert.equal(runHead({ search: '?nomotion=1&hero=4' }).hero, 'blue', 'и при reduced-motion');
  assert.equal(r.preload, true, 'первый заход — заставка-поиск');
  assert.equal(r.planeIntro, false);
});

test('вариант 3: ?hero=3 → plane и держится в sessionStorage; вместо заставки-поиска — интро самолётика по тем же правилам', () => {
  const r = runHead({ search: '?hero=3' });
  assert.equal(r.hero, 'plane');
  assert.equal(r.session.map.get('eleads-hero'), 'plane');
  assert.equal(runHead({ session: storage({ 'eleads-hero': 'plane' }) }).hero, 'plane');
  assert.equal(r.planeIntro, true, 'первый заход — интро');
  assert.equal(r.preload, false, 'поиска нет');
  const seen = storage({ 'eleads-intro': String(NOW - 60_000) });
  assert.deepEqual([runHead({ search: '?hero=3', local: seen }).planeIntro, runHead({ search: '?hero=3', local: seen }).preload], [false, false], 'за сутки второй раз нет');
  assert.equal(runHead({ search: '?hero=3&intro=1', local: seen }).planeIntro, true, '?intro=1 — принудительно');
  assert.equal(runHead({ search: '?hero=3&nomotion=1&intro=1' }).planeIntro, false, 'reduced-motion — сразу главный экран');
  assert.equal(runHead({ search: '?hero=2' }).planeIntro, false, 'в других вариантах — заставка-поиск');
  assert.equal(runHead({ search: '?hero=2' }).preload, true);
});
