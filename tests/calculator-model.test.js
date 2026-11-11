// Шов №1 из interfaces.md: forecast() — чистая функция расчёта калькулятора.
// T39: расчёт по таблице клиента «ниша × GEO» — показы, клики и подписчики на 1 € бюджета; разброс ±20%;
// счётчики — Math.floor, цены — 3 знака, CTR — одно среднее. Комбинации без данных — nodata, цифр не выдумываем.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forecast, unitRates, budgetScale, clampBudget } from '../src/sections/calculator-model.js';
import { readJson } from './helpers.js';

const rates = readJson('src/data/calculator.json');
const near = (actual, expected, eps, msg) =>
  assert.ok(Math.abs(actual - expected) <= eps, `${msg}: ${actual} ≠ ${expected} ± ${eps}`);
const SAMPLE = { niche: 'crypto', geo: 'ua', goal: 'subscribers', budget: 1993 };
const COUNTS = ['impressions', 'clicks', 'conversions'];
const PRICES = ['cpc', 'cpa'];

test('данные клиента на 1 €: CTR, CPC, CPS по каждой строке таблицы — как в его сверке', () => {
  // [ниша, GEO, CTR %, CPC €, CPS €] — из таблицы клиента; Business = строка «SaaS / B2B»
  const table = [
    ['crypto', 'ua', 0.8053, 0.0831, 1.3472],
    ['crypto', 'worldwide', 1.1, 0.0178, 0.9935],
    ['business', 'ua', 0.2586, 0.2043, 2.3434],
    ['business', 'worldwide', 0.6182, 0.0721, 2.134],
    ['auto', 'ua', 0.4704, 0.2315, 0.9038],
    ['education', 'ua', 0.4012, 0.1814, 1.9426],
  ];
  const tol = (v) => Math.max(0.00005, v * 1e-4); // половина 4-го знака или 0,01% — что больше
  // допуск: сверка клиента округлена до 4 знаков; коэффициенты на 1 € тоже округлены, а сверка посчитана до их
  // округления (CPS Business · UA: 2.3434 у клиента, 1 / 0.4267 = 2.34357 у нас)
  for (const [niche, geo, ctr, cpc, cps] of table) {
    const u = unitRates({ niche, geo }, rates);
    assert.ok(u, `${niche}·${geo}: нет данных`);
    near(u.ctr * 100, ctr, tol(ctr), `${niche}·${geo} CTR`);
    near(u.cpc, cpc, tol(cpc), `${niche}·${geo} CPC`);
    near(u.cps, cps, tol(cps), `${niche}·${geo} CPS`);
  }
  // Finance / Investments · UA — как Crypto · UA, но подписчик втрое дороже
  const fin = unitRates({ niche: 'finance', geo: 'ua' }, rates);
  const cry = unitRates({ niche: 'crypto', geo: 'ua' }, rates);
  assert.equal(fin.imp, cry.imp);
  assert.equal(fin.clk, cry.clk);
  near(fin.cps, cry.cps * 3, 1e-9, 'Finance CPS = 3 × Crypto CPS');
});

test('образец (Crypto · Україна · Підписники, €1 993): все значения — floor для счётчиков, 3 знака для цен', () => {
  const f = forecast(SAMPLE, rates);
  assert.equal(f.nodata, false);
  // источник истины — таблица: 1993 × 1493.70 показов, 1993 × 12.0289 кликов, 1993 × 0.7423 подписчиков
  assert.deepEqual(f.impressions, { lo: 2381555, hi: 3572332, mid: 2976944 });
  assert.deepEqual(f.clicks, { lo: 19178, hi: 28768, mid: 23973 });
  assert.deepEqual(f.conversions, { lo: 1183, hi: 1775, mid: 1479 }); // как на образце
  assert.deepEqual(f.ctr, { mid: 0.0081 }); // 0,81%
  assert.deepEqual(f.cpc, { lo: 0.069, hi: 0.104, mid: 0.083 }); // как на образце
  assert.deepEqual(f.cpa, { lo: 1.123, hi: 1.684, mid: 1.347 }); // как на образце
  assert.deepEqual(f.issues, []);
});

test('разброс ±20%: счётчики mid × 0,8 … × 1,2 вниз до целого, цены mid / 1,2 … / 0,8', () => {
  assert.equal(rates.spread, 0.2);
  for (const budget of [1, 7, 650, 1993, 9999, 10000]) {
    for (const niche of ['crypto', 'business', 'auto', 'education', 'finance']) {
      const input = { niche, geo: 'ua', goal: 'subscribers', budget };
      const u = unitRates(input, rates);
      const f = forecast(input, rates);
      const raw = { impressions: budget * u.imp, clicks: budget * u.clk, conversions: budget * u.sub };
      for (const k of COUNTS) {
        assert.deepEqual(f[k], { lo: Math.floor(raw[k] * 0.8), hi: Math.floor(raw[k] * 1.2), mid: Math.floor(raw[k]) }, `${niche} ${budget} ${k}`);
      }
      const r3 = (n) => Math.round(n * 1000) / 1000;
      assert.deepEqual(f.cpc, { lo: r3(u.cpc / 1.2), hi: r3(u.cpc / 0.8), mid: r3(u.cpc) });
      assert.deepEqual(f.cpa, { lo: r3(u.cps / 1.2), hi: r3(u.cps / 0.8), mid: r3(u.cps) });
      for (const k of [...COUNTS, ...PRICES]) assert.ok(f[k].lo <= f[k].mid && f[k].mid <= f[k].hi, `${k}: lo ≤ mid ≤ hi`);
    }
  }
});

test('нет данных (Auto / Education / Finance · Worldwide) — nodata, все показатели null, без предупреждений', () => {
  for (const niche of ['auto', 'education', 'finance']) {
    const f = forecast({ niche, geo: 'worldwide', goal: 'subscribers', budget: 1993 }, rates);
    assert.equal(f.nodata, true, niche);
    for (const k of [...COUNTS, ...PRICES, 'ctr']) assert.equal(f[k], null, `${niche} ${k}`);
    assert.deepEqual(f.issues, []);
  }
});

test('calculator.json: пять ниш, два GEO, одна цель; Business ↔ «SaaS / B2B» одной строкой; заметка о данных', () => {
  assert.deepEqual(rates.niches.map((n) => n.id), ['business', 'crypto', 'education', 'auto', 'finance']);
  assert.deepEqual(rates.geos.map((g) => g.id), ['ua', 'worldwide']);
  assert.deepEqual(rates.goals.map((g) => g.id), ['subscribers']);
  assert.deepEqual(rates.defaults, { niche: 'crypto', geo: 'ua', goal: 'subscribers' });
  assert.equal(rates.segments.business, 'saas_b2b');
  for (const n of rates.niches) assert.ok(rates.segments[n.id] in rates.table, `${n.id}: нет строки таблицы`);
  assert.match(rates._note, /SaaS \/ B2B/);
  assert.match(rates._note, /0\.7423 \/ 3/);
  assert.equal(rates.niches.find((n) => n.id === 'finance').label.ua, 'Finance / Investments');
  assert.deepEqual({ min: rates.budget.min, max: rates.budget.max, default: rates.budget.default }, { min: 1, max: 10000, default: 1993 });
});

test('битые данные → null по затронутым показателям и причина в issues, без NaN и Infinity', () => {
  const broken = (row) => ({ ...rates, table: { ...rates.table, crypto: { ua: row } } });
  const cases = [
    [{ imp: 0, clk: 12, sub: 0.7 }, ['impressions', 'ctr'], ['clicks', 'conversions', 'cpc', 'cpa']],
    [{ imp: 1500, clk: 'x', sub: 0.7 }, ['clicks', 'ctr', 'cpc'], ['impressions', 'conversions', 'cpa']],
    [{ imp: 1500, clk: 12, sub: -1 }, ['conversions', 'cpa'], ['impressions', 'clicks', 'ctr', 'cpc']],
  ];
  for (const [row, nulls, alive] of cases) {
    const f = forecast(SAMPLE, broken(row));
    for (const k of nulls) assert.equal(f[k], null, `${k} должен быть null`);
    for (const k of alive) assert.ok(f[k] && Object.values(f[k]).every(Number.isFinite), `${k} должен считаться`);
    assert.ok(f.issues.length > 0, 'причина в issues');
  }
  for (const budget of [0, -5, Number.NaN, 'abc', undefined]) {
    const f = forecast({ ...SAMPLE, budget }, rates);
    for (const k of COUNTS) assert.equal(f[k], null, `${budget}: ${k}`);
    assert.ok(f.issues.length > 0);
  }
  const bad = forecast(SAMPLE, { spread: 'q', table: null, segments: 5 });
  for (const k of [...COUNTS, ...PRICES, 'ctr']) assert.equal(bad[k], null, k);
});

test('forecast не трогает входные объекты', () => {
  const deep = (o) => (o && typeof o === 'object' ? Object.freeze(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, deep(v)]))) : o);
  assert.doesNotThrow(() => forecast(Object.freeze({ ...SAMPLE }), deep(rates)));
});

test('шкала ползунка: €1, затем €50, €100 … по €50 до €2 000, дальше по €250 до €10 000', () => {
  const s = budgetScale(rates.budget);
  assert.equal(s[0], 1);
  assert.equal(s[1], 50);
  assert.equal(s.at(-1), 10000);
  assert.equal(s.length, 1 + 40 + 32);
  for (let i = 2; i < s.length; i++) assert.equal(s[i] - s[i - 1], s[i] <= 2000 ? 50 : 250, `шаг у ${s[i]}`);
  // старая шкала (€650 …) строится как раньше
  const old = budgetScale({ min: 650, max: 10000, scale: [{ upTo: 2000, step: 50 }, { upTo: 10000, step: 250 }] });
  assert.equal(old.length, 28 + 32);
});

test('сумма из поля: целое 1…10 000, вне диапазона — к краю, мусор — null', () => {
  const b = rates.budget;
  assert.equal(clampBudget('1993', b), 1993);
  assert.equal(clampBudget('0', b), 1);
  assert.equal(clampBudget('-40', b), 1);
  assert.equal(clampBudget('99999', b), 10000);
  assert.equal(clampBudget('12.7', b), 12);
  assert.equal(clampBudget(' 250 ', b), 250);
  for (const junk of ['', 'abc', null, undefined, Number.NaN, '1e999', '--']) assert.equal(clampBudget(junk, b), null, String(junk));
});
