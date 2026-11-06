// Шов №1 из interfaces.md: forecast() — чистая функция расчёта калькулятора.
// Эталон из критериев приёмки таска 02: €650, Україна (CPM 2.50), Business (CTR 1.2%), Підписники (CR 35%).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forecast, budgetScale, funnelWidths } from '../src/sections/calculator-model.js';
import { readJson } from './helpers.js';

const rates = readJson('src/data/calculator.json');
const REF = { niche: 'business', geo: 'ua', goal: 'subscribers', budget: 650 };
const near = (actual, expected, eps, msg) =>
  assert.ok(Math.abs(actual - expected) <= eps, `${msg}: ${actual} ≠ ${expected} ± ${eps}`);

// Таблица с эталонными коэффициентами, не зависящая от демо-значений в JSON.
const refRates = {
  spread: 0.15,
  cpm: { ua: 2.5 },
  ctr: { business: 0.012 },
  cr: { subscribers: 0.35 },
};

const METRICS = ['impressions', 'ctr', 'clicks', 'cpc', 'conversions', 'cpa'];

test('эталон: медианы 260 000 показов, 3 120 кликов, 1 092 конверсии, CPC ≈ €0.21, CPA ≈ €0.60', () => {
  const f = forecast(REF, refRates);
  const mid = (r) => (r.lo / 0.85 + r.hi / 1.15) / 2;
  near(mid(f.impressions), 260000, 0.5, 'показы');
  near(mid(f.clicks), 3120, 0.01, 'клики');
  near(mid(f.conversions), 1092, 0.01, 'конверсии');
  near(mid(f.ctr), 0.012, 1e-9, 'CTR');
});

test('границы = медиана × (1 ∓ 0.15)', () => {
  const f = forecast(REF, refRates);
  near(f.impressions.lo, 221000, 0.5, 'показы lo');
  near(f.impressions.hi, 299000, 0.5, 'показы hi');
  near(f.clicks.lo, 2652, 0.01, 'клики lo');
  near(f.clicks.hi, 3588, 0.01, 'клики hi');
  near(f.conversions.lo, 928.2, 0.01, 'конверсии lo');
  near(f.conversions.hi, 1255.8, 0.01, 'конверсии hi');
  near(f.ctr.lo, 0.0102, 1e-9, 'CTR lo');
  near(f.ctr.hi, 0.0138, 1e-9, 'CTR hi');
});

test('CPC и CPA считаются от противоположных концов: меньше кликов → дороже клик', () => {
  const f = forecast(REF, refRates);
  near(f.cpc.lo, 650 / 3588, 1e-9, 'CPC lo = бюджет / клики hi');
  near(f.cpc.hi, 650 / 2652, 1e-9, 'CPC hi = бюджет / клики lo');
  near(f.cpa.lo, 650 / 1255.8, 1e-9, 'CPA lo = бюджет / конверсии hi');
  near(f.cpa.hi, 650 / 928.2, 1e-9, 'CPA hi = бюджет / конверсии lo');
  assert.ok(f.cpc.lo < 0.21 && 0.21 < f.cpc.hi, 'медиана CPC ≈ €0.21 внутри диапазона');
  assert.ok(f.cpa.lo < 0.6 && 0.6 < f.cpa.hi, 'медиана CPA ≈ €0.60 внутри диапазона');
});

test('calculator.json даёт тот же эталон для Business / Україна / Підписники', () => {
  assert.equal(rates.demo, true);
  assert.equal(rates.spread, 0.15);
  assert.equal(rates.cpm.ua, 2.5);
  assert.equal(rates.ctr.business, 0.012);
  assert.equal(rates.cr.subscribers, 0.35);
  assert.deepEqual(forecast(REF, rates).impressions, forecast(REF, refRates).impressions);
  assert.equal(Object.keys(rates.cpm).length, 2);
  assert.equal(Object.keys(rates.ctr).length, 4);
  assert.equal(Object.keys(rates.cr).length, 2);
  assert.deepEqual(
    { min: rates.budget.min, max: rates.budget.max, default: rates.budget.default },
    { min: 650, max: 10000, default: 1500 },
  );
  // у каждой опции интерфейса есть коэффициент
  for (const n of rates.niches) assert.ok(n.id in rates.ctr, n.id);
  for (const g of rates.geos) assert.ok(g.id in rates.cpm, g.id);
  for (const g of rates.goals) assert.ok(g.id in rates.cr, g.id);
});

test('ноль, минус и мусор в коэффициенте → null по затронутым показателям, без NaN и Infinity', () => {
  const cases = [
    [{ ...refRates, cpm: { ua: 0 } }, ['impressions', 'clicks', 'cpc', 'conversions', 'cpa'], ['ctr']],
    [{ ...refRates, ctr: { business: 'abc' } }, ['ctr', 'clicks', 'cpc', 'conversions', 'cpa'], ['impressions']],
    [{ ...refRates, cr: { subscribers: -0.2 } }, ['conversions', 'cpa'], ['impressions', 'ctr', 'clicks', 'cpc']],
    [{ ...refRates, ctr: {} }, ['ctr', 'clicks', 'cpc', 'conversions', 'cpa'], ['impressions']],
  ];
  for (const [r, nulls, alive] of cases) {
    const f = forecast(REF, r);
    for (const k of nulls) assert.equal(f[k], null, `${k} должен быть null`);
    for (const k of alive) assert.ok(f[k] && Number.isFinite(f[k].lo) && Number.isFinite(f[k].hi), `${k} должен считаться`);
    assert.ok(Array.isArray(f.issues) && f.issues.length > 0, 'причина в issues');
  }
  const broken = forecast({ ...REF, budget: Number.NaN }, refRates);
  for (const k of ['impressions', 'clicks', 'cpc', 'conversions', 'cpa']) assert.equal(broken[k], null, k);
  const bad = forecast({ ...REF, budget: 'x' }, { cpm: null, ctr: 5, cr: undefined, spread: 'q' });
  for (const k of METRICS) {
    const v = bad[k];
    if (v !== null) assert.ok(Number.isFinite(v.lo) && Number.isFinite(v.hi), k);
  }
  assert.equal(forecast(REF, refRates).issues.length, 0);
});

test('forecast не трогает входные объекты', () => {
  const input = Object.freeze({ ...REF });
  const frozen = Object.freeze({
    spread: 0.15,
    cpm: Object.freeze({ ua: 2.5 }),
    ctr: Object.freeze({ business: 0.012 }),
    cr: Object.freeze({ subscribers: 0.35 }),
  });
  assert.doesNotThrow(() => forecast(input, frozen));
});

test('шкала бюджета: €650 → €10 000, шаг €50 до €2 000 и €250 выше', () => {
  const s = budgetScale(rates.budget);
  assert.equal(s[0], 650);
  assert.equal(s.at(-1), 10000);
  assert.ok(s.includes(2000) && s.includes(1500));
  assert.equal(s.length, 28 + 32);
  for (let i = 1; i < s.length; i++) {
    assert.equal(s[i] - s[i - 1], s[i] <= 2000 ? 50 : 250, `шаг у ${s[i]}`);
  }
});

test('воронка: Покази — 100%, ступени не растут вниз, нижняя не уже 14%, ширина меняется с бюджетом', () => {
  const small = funnelWidths(forecast(REF, refRates));
  const big = funnelWidths(forecast({ ...REF, budget: 10000 }, refRates));
  assert.equal(small.length, 3);
  assert.equal(small[0], 1);
  assert.ok(small[0] >= small[1] && small[1] >= small[2]);
  assert.ok(small[2] >= 0.14);
  assert.ok(big[2] > small[2] && big[1] > small[1], 'с ростом бюджета нижние ступени шире');
  const tiny = funnelWidths(forecast({ ...REF, budget: 650 }, { ...refRates, cr: { subscribers: 0.0001 } }));
  assert.ok(tiny[2] >= 0.14, 'почти нулевая конверсия не схлопывает ступень');
  const dead = funnelWidths(forecast(REF, { ...refRates, cpm: { ua: 0 } }));
  for (const w of dead) assert.ok(Number.isFinite(w) && w >= 0.14 && w <= 1);
});
