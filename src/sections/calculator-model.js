// Расчёт калькулятора — чистые функции без DOM (шов №1 в interfaces.md).
// T39: по таблице клиента «ниша × GEO» (src/data/calculator.json → table): imp, clk, sub — показы, клики и
// подписчики на 1 € бюджета. Ниша калькулятора указывает на строку таблицы через segments (Business → saas_b2b).
// Средние: показы = бюджет × imp, клики = бюджет × clk, подписчики = бюджет × sub; CTR = clk / imp,
// CPC = 1 / clk, CPS = 1 / sub. Разброс spread (0,2): счётчики mid × (1 ∓ spread), цены mid / (1 ± spread) —
// меньше кликов → дороже клик. Счётчики — вниз до целого (Math.floor), цены — до 3 знаков, CTR — одно среднее
// (доля до 4 знаков = проценты до 2). Строки таблицы нет — nodata: цифр не выдумываем.

const DEFAULT_SPREAD = 0.2;

const positive = (n) => typeof n === 'number' && Number.isFinite(n) && n > 0;
const round = (n, digits) => Math.round(n * 10 ** digits) / 10 ** digits;

/** Счётчик: { lo, hi, mid } вниз до целого. */
const count = (raw, spread) => ({ lo: Math.floor(raw * (1 - spread)), hi: Math.floor(raw * (1 + spread)), mid: Math.floor(raw) });
/** Цена: { lo, hi, mid } до 3 знаков; дешевле — когда результата больше. */
const price = (raw, spread) => ({ lo: round(raw / (1 + spread), 3), hi: round(raw / (1 - spread), 3), mid: round(raw, 3) });

function rowOf(input, rates) {
  const { niche, geo } = input || {};
  const r = rates || {};
  const segments = r.segments && typeof r.segments === 'object' ? r.segments : {};
  const table = r.table && typeof r.table === 'object' ? r.table : {};
  const segment = segments[niche] ?? niche;
  const row = table[segment]?.[geo];
  return row && typeof row === 'object' ? { row, name: `table.${segment}.${geo}` } : null;
}

/**
 * Коэффициенты строки таблицы на 1 € и средние цены: { imp, clk, sub, ctr, cpc, cps } (битое поле — null),
 * либо null, если для пары «ниша × GEO» данных нет.
 */
export function unitRates(input = {}, rates = {}) {
  const found = rowOf(input, rates);
  if (!found) return null;
  const pick = (key) => (positive(found.row[key]) ? found.row[key] : null);
  const imp = pick('imp');
  const clk = pick('clk');
  const sub = pick('sub');
  return {
    imp,
    clk,
    sub,
    ctr: imp !== null && clk !== null ? clk / imp : null,
    cpc: clk !== null ? 1 / clk : null,
    cps: sub !== null ? 1 / sub : null,
  };
}

/**
 * input: { niche, geo, goal, budget } · rates: содержимое calculator.json
 * → { impressions, clicks, conversions, cpc, cpa: {lo, hi, mid} | null, ctr: {mid} | null, nodata, issues }.
 */
export function forecast(input = {}, rates = {}) {
  const issues = [];
  const r = rates || {};
  const empty = { impressions: null, ctr: null, clicks: null, cpc: null, conversions: null, cpa: null };

  let spread = r.spread;
  if (!(typeof spread === 'number' && Number.isFinite(spread) && spread >= 0 && spread < 1)) {
    issues.push(`spread = ${JSON.stringify(spread)} — нужен разброс от 0 до 1, взят ${DEFAULT_SPREAD}`);
    spread = DEFAULT_SPREAD;
  }

  const found = rowOf(input, r);
  if (!found) return { ...empty, nodata: true, issues };

  const budget = input?.budget;
  const money = positive(budget) ? budget : null;
  if (money === null) issues.push(`budget = ${JSON.stringify(budget)} — нужен положительный бюджет`);
  const u = unitRates(input, r);
  for (const key of ['imp', 'clk', 'sub']) {
    if (u[key] === null) issues.push(`${found.name}.${key} = ${JSON.stringify(found.row[key])} — нужен положительный коэффициент`);
  }
  if (u.ctr !== null && u.ctr > 1) issues.push(`${found.name}: кликов больше, чем показов — проверьте clk и imp`);

  return {
    impressions: money !== null && u.imp !== null ? count(money * u.imp, spread) : null,
    ctr: u.ctr !== null ? { mid: round(u.ctr, 4) } : null,
    clicks: money !== null && u.clk !== null ? count(money * u.clk, spread) : null,
    cpc: money !== null && u.cpc !== null ? price(u.cpc, spread) : null,
    conversions: money !== null && u.sub !== null ? count(money * u.sub, spread) : null,
    cpa: money !== null && u.cps !== null ? price(u.cps, spread) : null,
    nodata: false,
    issues,
  };
}

/**
 * Значения ползунка бюджета: { min, max, scale: [{ upTo, step }] } → [1, 50, 100, … 2000, 2250, … 10000].
 * Каждое следующее — ближайшее кратное шагу зоны; позиция ползунка — индекс в этом массиве.
 */
export function budgetScale({ min = 1, max = 10000, scale = [{ upTo: Infinity, step: 50 }] } = {}) {
  const out = [min];
  let value = min;
  const zones = [...scale].filter((z) => positive(z?.step)).sort((a, b) => a.upTo - b.upTo);
  for (const { upTo, step } of zones) {
    const limit = Math.min(upTo ?? max, max);
    for (let next = (Math.floor(value / step) + 1) * step; next <= limit + 1e-9; next += step) {
      value = next;
      out.push(value);
    }
  }
  if (out.at(-1) !== max) out.push(max);
  return out;
}

/** Сумма из поля ввода → целое евро в пределах [min, max]; пусто и мусор — null (ввод игнорируется). */
export function clampBudget(raw, { min = 1, max = 10000 } = {}) {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.floor(n)));
}
