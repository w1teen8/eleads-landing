// T34 (H47): блок 09 «Таргетинг» — диск, который сам листает способы (выбор пользователя: «давай М, но он должен сам
// перелистываться … справа пусто получается» → «3 давай»; образец reference/run3/targeting-dial-chosen.png).
// Слева — текущий способ крупно и описание, в центре — диск с шестью иконками и номером, справа — список с таймером.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { ICONS, inlineIcons } from '../src/core/icons.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const s = html.split(/<section\b[^>]*\sid="targeting"/)[1].split('</section>')[0];
const css = strip(read('src/styles/sections/targeting.css'));
const js = strip(read('src/sections/targeting.js'));
const count = (str, re) => (str.match(re) || []).length;

const DIAL_ICONS = ['pin', 'globe', 'heart', 'hash', 'megaphone', 'people'];

test('прежней сетки 3×2 нет — ни в разметке, ни в CSS, ни в JS', () => {
  for (const src of [s, css, js]) assert.doesNotMatch(src, /tg__card|tg__grid|tg__more|tg__plus|aria-expanded/);
});

test('три колонки: текущий способ (метка, название, описание) · диск · список шести', () => {
  const order = ['tg__now', 'tg__dial', 'tg__list'].map((cls) => s.search(new RegExp(`class="${cls}\\b`)));
  for (const i of order) assert.ok(i > -1, 'нет колонки');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'порядок: текст → диск → список');
  assert.match(s, /data-i18n="targeting\.kicker"/);
  // без JS видно первый способ: название и описание из словаря
  for (const f of ['name', 'text', 'more']) assert.match(s, new RegExp(`data-tg-${f} data-i18n="targeting\\.items\\.0\\.${f}"`));
  assert.match(s, /class="tg__num" data-tg-num>01</, 'номер в центре диска');
  for (const dict of [ua, en]) {
    assert.ok(dict.targeting.kicker && dict.targeting.listLabel, 'kicker и listLabel в обоих словарях');
    assert.equal(dict.targeting.items.length, 6);
    for (const item of dict.targeting.items) for (const f of ['num', 'name', 'text', 'more']) assert.ok(item[f], f);
  }
});

test('диск: шесть кнопок-иконок по кругу через общий модуль иконок; существующие иконки не тронуты', () => {
  const nodes = [...s.matchAll(/<button type="button" class="tg__node(?: is-active)?"[^>]*data-tg-node="(\d)"[^>]*>\s*<svg class="tg__icon" data-icon="([a-z]+)"><\/svg>/g)];
  assert.deepEqual(nodes.map((m) => [Number(m[1]), m[2]]), DIAL_ICONS.map((k, i) => [i, k]));
  for (const k of DIAL_ICONS) assert.ok(ICONS[k], `иконка ${k}`);
  for (const k of ['briefcase', 'person', 'coin', 'cap', 'car', 'chart', 'cloud', 'plane']) assert.ok(ICONS[k], `иконка блока 03 ${k}`);
  assert.equal(count(inlineIcons(s), /<svg class="tg__icon" data-icon="[a-z]+" viewBox="0 0 24 24"/g), 6);
  // кнопки диска — дубли вкладок для мыши: скринридер и Tab ходят по списку
  for (const m of s.matchAll(/<button type="button" class="tg__node[^"]*"[^>]*>/g)) {
    assert.match(m[0], /tabindex="-1"/);
    assert.match(m[0], /aria-hidden="true"/);
  }
  // кольцо прогресса — две половины, крутятся transform-ом
  assert.equal(count(s, /class="tg__arc tg__arc--[rl]"/g), 2);
});

test('доступность: список — tablist из шести вкладок, описание — tabpanel, aria-live включается только при ручном выборе', () => {
  assert.match(s, /<ol class="tg__list" role="tablist" aria-orientation="vertical" data-i18n-attr="aria-label:targeting\.listLabel"/);
  const tabs = [...s.matchAll(/<button type="button" class="tg__tab" role="tab"[^>]*>/g)].map((m) => m[0]);
  assert.equal(tabs.length, 6);
  assert.equal(count(s, /class="tg__item"/g), 6);
  tabs.forEach((tab, i) => {
    assert.match(tab, new RegExp(`aria-selected="${i === 0}"`));
    assert.match(tab, new RegExp(`tabindex="${i === 0 ? 0 : -1}"`));
    assert.match(tab, /aria-controls="tg-panel"/);
  });
  assert.match(s, /id="tg-panel" role="tabpanel" aria-live="off"/);
  assert.match(js, /setAttribute\('aria-live', manual \? 'polite' : 'off'\)/);
  for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) assert.match(js, new RegExp(`\\b${key}\\b`));
  assert.match(s, /class="tg__node is-active"[^>]*data-tg-node="0"/, 'без JS активна первая иконка');
});

test('автолистание: шаг 10 с («раз в 10 секунд»), пауза при наведении и фокусе, только в окне и при видимой вкладке; без движения — выключено', () => {
  const step = Number(js.match(/export const STEP_MS = (\d+);/)?.[1]);
  assert.equal(step, 10000, `шаг ${step}`);
  for (const ev of ['pointerenter', 'pointerleave', 'focusin', 'focusout', 'visibilitychange']) assert.match(js, new RegExp(`'${ev}'`));
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /if \(reduced\)/, 'reduced-motion / ?nomotion=1 — без автолистания');
  assert.match(js, /\.pause\(\)/);
  assert.match(js, /\.play\(\)/);
  // смены — общий язык движения: номер барабаном, название и описание табло
  assert.match(js, /import \{ rollTo \} from '\.\/stats-odometer\.js'/);
  assert.match(js, /import \{ flipSwap \} from '\.\.\/core\/motion-kit\.js'/);
  assert.doesNotMatch(js, /ScrollTrigger|stagger\(|reveal\(/, 'появления по прокрутке нет');
});

test('поворот диска: кратчайшим путём, иконки остаются вертикальными; движение — только transform и opacity', async () => {
  const { turnTo } = await import('../src/sections/targeting-model.js');
  // активный пункт i встаёт слева: угол диска −60°·i с точностью до оборота, путь не длиннее 180°
  assert.equal(turnTo(0, 1), -60);
  assert.equal(turnTo(-60, 2), -120);
  assert.equal(turnTo(-300, 0), -360, '6 → 1 — вперёд, а не назад через весь круг');
  assert.equal(turnTo(0, 5), 60, '1 → 6 — на шаг назад');
  assert.equal(turnTo(-360, 3), -540);
  for (let from = -720; from <= 720; from += 60) {
    for (let i = 0; i < 6; i++) {
      const to = turnTo(from, i);
      assert.ok(Math.abs(to - from) <= 180, `${from} → ${i}: ${to}`);
      assert.equal((((to + 60 * i) % 360) + 360) % 360, 0, `${from} → ${i}: пункт не слева`);
    }
  }
  assert.match(css, /\.tg__orbit\s*\{[^}]*transform:\s*rotate\(var\(--tg-turn\)\)/);
  assert.match(css, /\.tg__node\s*\{[^}]*rotate\(calc\(-1 \* var\(--tg-turn\)\)\)/, 'иконка поворачивается обратно — стоит вертикально');
  assert.doesNotMatch(css, /stroke-dash/);
  assert.doesNotMatch(js, /strokeDash|stroke-dash/);
});

test('облик и формат: заголовок и название — шрифт канала, название жёлто-оранжевое; на телефоне диск сверху ≈300px', () => {
  assert.match(css, /\.tg__name\s*\{[^}]*font-family:\s*var\(--font-head\)[^}]*text-transform:\s*uppercase/);
  assert.match(css, /\.tg__name\s*\{[^}]*background:\s*var\(--grad\)/);
  assert.match(css, /\.tg__num\s*\{[^}]*font-family:\s*var\(--font-head\)/);
  assert.match(css, /@media \(min-width: 1000px\)[^{]*\{\s*\.tg__body\s*\{[^}]*grid-template-columns/);
  assert.match(css, /\.tg__dial\s*\{[^}]*--tg-d:\s*min\(/, 'диаметр диска — переменная');
  assert.match(css, /\d(?:\.\d+)?svh/, 'на десктопе — от высоты окна');
});
