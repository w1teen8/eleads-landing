// Инлайн-скрипты <head>: заставка не чаще раза в сутки (G12). Тем и вариантов первого экрана больше нет (сборка 3, T18).
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

test('один облик и один первый экран: ни data-theme, ни data-hero; ?theme= и ?hero= ничего не меняют', () => {
  for (const search of ['', '?theme=aether', '?hero=3', '?hero=2&theme=brand', '?hero=4']) {
    const r = runHead({ search });
    assert.equal(r.theme, null, `${search}: data-theme`);
    assert.equal(r.hero, null, `${search}: data-hero`);
    assert.equal(r.planeIntro, false, `${search}: интро самолётика`);
    assert.equal(r.preload, true, `${search}: заставка-поиск`);
    assert.equal(r.session.map.size, 0, `${search}: sessionStorage не трогается`);
  }
  assert.doesNotMatch(head, /eleads-theme|eleads-hero|data-theme|data-hero|js-plane-intro/);
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
