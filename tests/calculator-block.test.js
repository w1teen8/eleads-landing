// Блок 05 «Калькулятор» (T22): синее продолжение первого экрана, белая панель параметров, тёмно-синяя панель
// прогноза. Расчёт, аналитика и доступность — прежние (T02); переходов по прокрутке нет (H11), на ввод — табло.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { disableSections } from '../src/core/sections.js';

const html = read('index.html');
const config = readJson('src/data/config.json');
const calc = html.split(/<section\b[^>]*\sid="calculator"/)[1].split('</section>')[0];
const js = read('src/sections/calculator.js');
const css = read('src/styles/sections/calculator.css');
const count = (s, re) => (s.match(re) || []).length;

test('блок 05 включён после 02–04 по порядку страницы; секция и пункт меню #calculator видны после сборки', () => {
  const list = config.sections.enabled;
  assert.ok(list.includes('calculator'), 'calculator нет в sections.enabled');
  for (const before of ['hero', 'stats', 'niches', 'formats']) {
    if (list.includes(before)) assert.ok(list.indexOf(before) < list.indexOf('calculator'), `${before} — раньше calculator`);
  }
  const out = disableSections(html, config);
  assert.doesNotMatch(out.match(/<section\b[^>]*\sid="calculator"[^>]*>/)[0], /\shidden/);
  const item = out.match(/<li\b([^>]*)>\s*<a\b[^>]*href="#calculator"/);
  assert.ok(item, 'нет пункта навигации на #calculator');
  assert.doesNotMatch(item[1], /\shidden/);
});

test('разметка по вайрфрейму: метка, H2, параметры, прогноз — воронка из трёх ступеней и шесть показателей', () => {
  assert.match(calc, /data-i18n="calculator\.eyebrow"/);
  assert.match(calc, /<h2 id="calculator-title"[^>]*data-i18n="calculator\.title"/);
  for (const group of ['niche', 'geo', 'goal']) assert.match(calc, new RegExp(`data-calc-group="${group}"`));
  assert.match(calc, /type="range"[^>]*data-calc-budget/);
  assert.deepEqual([...calc.matchAll(/data-calc-step="(\w+)"/g)].map((m) => m[1]), ['impressions', 'clicks', 'conversions']);
  for (const key of ['impressions', 'ctr', 'clicks', 'conversions', 'cpc', 'cpa']) {
    assert.equal(count(calc, new RegExp(`data-calc-lo="${key}"`, 'g')), 1, `lo ${key}`);
    assert.equal(count(calc, new RegExp(`data-calc-hi="${key}"`, 'g')), 1, `hi ${key}`);
  }
  assert.match(calc, /aria-live="polite"[^>]*data-calc-live/);
  assert.match(calc, /data-place="calculator" data-calc-cta/);
  assert.match(calc, /data-place="calculator_note"/);
  assert.match(calc, /data-i18n="calculator\.disclaimer"/);
});

test('H11: переходов по прокрутке нет — без наезда, лесенки и ревилов; на ввод показатели меняет табло', () => {
  assert.match(js, /from '\.\.\/core\/motion-kit\.js'/);
  assert.match(js, /\bflipSwap\(/);
  for (const fn of ['stackReveal', 'stagger', 'reveal']) assert.doesNotMatch(js, new RegExp(`\\b${fn}\\(`), fn);
  assert.equal(count(calc, /data-reveal/g), 0, 'содержимое блока видно сразу');
  assert.doesNotMatch(js, /gsap|ScrollTrigger|IntersectionObserver|countTo/);
  // воронка по-прежнему меняет ширину только через scaleX
  assert.match(js, /scaleX\(/);
  assert.doesNotMatch(js, /\.style\.(width|height|left|top)\s*=/);
});

test('расчёт и аналитика прежние: forecast() из модели, calculator_change с дебаунсом, calculator_cta_click', () => {
  assert.match(js, /from '\.\/calculator-model\.js'/);
  assert.match(js, /track\('calculator_change', payload\(\)\)/);
  assert.match(js, /track\('calculator_cta_click', payload\(\)\)/);
  assert.match(js, /TRACK_MS = 600/);
});

test('палитра: синий фон первого экрана, белая панель параметров, прогноз — тёмно-синий #070C18 (--bg)', () => {
  assert.match(css, /\.section--calculator\s*\{[^}]*var\(--v4-bg/);
  assert.match(css, /\.calc__params\s*\{[^}]*background:\s*var\(--paper\)/);
  assert.match(css, /\.calc__forecast\s*\{[^}]*background:\s*var\(--bg\)/);
});
