// Расчёт калькулятора — чистые функции без DOM (шов №1 в interfaces.md).
// Формулы: impressions = budget / cpm * 1000, clicks = impressions * ctr, cpc = budget / clicks,
// conversions = clicks * cr, cpa = budget / conversions.
// Диапазон каждого показателя — медиана × (1 ∓ spread); CPC и CPA — от противоположных концов
// (меньше кликов → дороже клик). Битый коэффициент даёт null по тем показателям, что от него зависят.

const DEFAULT_SPREAD = 0.15;

const positive = (n) => typeof n === 'number' && Number.isFinite(n) && n > 0;

const band = (mid, spread) => ({ lo: mid * (1 - spread), hi: mid * (1 + spread) });

/** budget / {lo,hi}: дешевле при большем знаменателе — поэтому концы меняются местами. */
const inverse = (budget, range) => (range && range.lo > 0 ? { lo: budget / range.hi, hi: budget / range.lo } : null);

function rate(table, key, name, issues) {
  const value = table && typeof table === 'object' ? table[key] : undefined;
  if (positive(value)) return value;
  issues.push(`${name}[${key}] = ${JSON.stringify(value)} — нужен положительный коэффициент`);
  return null;
}

/**
 * input: { niche, geo, goal, budget } · rates: содержимое calculator.json
 * → { impressions, ctr, clicks, cpc, conversions, cpa } — каждый {lo, hi} или null; issues — причины null.
 */
export function forecast(input = {}, rates = {}) {
  const issues = [];
  const { niche, geo, goal, budget } = input || {};
  const r = rates || {};

  let spread = r.spread;
  if (!(typeof spread === 'number' && Number.isFinite(spread) && spread >= 0 && spread < 1)) {
    issues.push(`spread = ${JSON.stringify(spread)} — нужен разброс от 0 до 1, взят ${DEFAULT_SPREAD}`);
    spread = DEFAULT_SPREAD;
  }

  const money = positive(budget) ? budget : null;
  if (money === null) issues.push(`budget = ${JSON.stringify(budget)} — нужен положительный бюджет`);
  const cpm = rate(r.cpm, geo, 'cpm', issues);
  const ctr = rate(r.ctr, niche, 'ctr', issues);
  const cr = rate(r.cr, goal, 'cr', issues);
  if (ctr !== null && ctr > 1) issues.push(`ctr[${niche}] = ${ctr} — доля больше 1, проверьте: 1.2% пишется как 0.012`);
  if (cr !== null && cr > 1) issues.push(`cr[${goal}] = ${cr} — доля больше 1, проверьте: 35% пишется как 0.35`);

  const impressionsMid = money !== null && cpm !== null ? (money / cpm) * 1000 : null;
  const clicksMid = impressionsMid !== null && ctr !== null ? impressionsMid * ctr : null;
  const conversionsMid = clicksMid !== null && cr !== null ? clicksMid * cr : null;

  const impressions = impressionsMid !== null ? band(impressionsMid, spread) : null;
  const clicks = clicksMid !== null ? band(clicksMid, spread) : null;
  const conversions = conversionsMid !== null ? band(conversionsMid, spread) : null;

  return {
    impressions,
    ctr: ctr !== null ? band(ctr, spread) : null,
    clicks,
    cpc: money !== null ? inverse(money, clicks) : null,
    conversions,
    cpa: money !== null ? inverse(money, conversions) : null,
    issues,
  };
}

/**
 * Значения слайдера бюджета: { min, max, scale: [{ upTo, step }] } → [650, 700, … 2000, 2250, … 10000].
 * Позиция ползунка — индекс в этом массиве: так низ диапазона не сжат.
 */
export function budgetScale({ min = 650, max = 10000, scale = [{ upTo: Infinity, step: 50 }] } = {}) {
  const out = [min];
  let value = min;
  const zones = [...scale].filter((z) => positive(z?.step)).sort((a, b) => a.upTo - b.upTo);
  for (const { upTo, step } of zones) {
    const limit = Math.min(upTo ?? max, max);
    while (value + step <= limit + 1e-9) {
      value += step;
      out.push(value);
    }
  }
  if (out.at(-1) !== max) out.push(max);
  return out;
}

const mid = (range) => (range ? (range.lo + range.hi) / 2 : null);

/**
 * Ширины трёх ступеней воронки (доли 0…1): логарифм значения, нормированный так, что Покази = 1.
 * floor — «ноль» логарифмической шкалы, чтобы ступени заметно менялись с бюджетом;
 * min — нижняя граница, чтобы ступень не исчезала.
 */
export function funnelWidths(fc, { floor = 100, min = 0.14 } = {}) {
  const top = mid(fc?.impressions);
  const scale = (value) => {
    if (!positive(top) || !positive(value) || top <= floor) return min;
    const w = Math.log(Math.max(value, floor) / floor) / Math.log(top / floor);
    return Math.min(1, Math.max(min, w));
  };
  return [positive(top) ? 1 : min, scale(mid(fc?.clicks)), scale(mid(fc?.conversions))];
}
