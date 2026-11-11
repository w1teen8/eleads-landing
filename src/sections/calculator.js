// 05 Калькулятор (T22; T28 — облик G по образцу reference/run3/calc-G-chosen.png; T39 — формулы клиента).
// Слева три выпадающих списка (Тематика / GEO / Ціль), строка бюджета с ползунком и поле «Вказати суму (€)»;
// справа прогноз — вступительная фраза из текущих параметров (шаблон calculator.intro с {budget} {niche} {geo}),
// сетка цифр: диапазоны, под ними «Середнє / Середня», CTR одним значением, плашка ±20%, кнопка.
// Расчёт — чистая функция в calculator-model.js по таблице клиента из src/data/calculator.json; здесь только DOM,
// движение и события. Для пары «ниша × GEO» без данных — сообщение со ссылкой в Telegram вместо цифр.
// Движение (H11): переходов по прокрутке нет — блок и все числа видны сразу, без наезда и лесенки.
// Двигается только ответ на ввод: цифры перекручиваются барабанами (rollTo из stats-odometer.js — тот же модуль,
// что в блоке 02), название строки цели — табло (flipSwap из core/motion-kit.js). Пока узел крутится, новое
// значение ждёт очереди: при протяжке ползунка барабан докручивается и сразу идёт к последнему значению — хвостов
// нет. Фраза, бюджет и заливка ползунка (scaleX) меняются сразу — это ввод, а не показатель.
import { $, el, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, getLang, onLangChange } from '../core/i18n.js';
import { formatInt } from '../core/format.js';
import { track } from '../core/analytics.js';
import { flipSwap } from '../core/motion-kit.js';
import { rollTo } from './stats-odometer.js';
import rates from '../data/calculator.json';
import { forecast, budgetScale, clampBudget } from './calculator-model.js';

const LIVE_MS = 500; // aria-live — одной фразой после остановки
const TRACK_MS = 600; // дебаунс calculator_change
const AMOUNT_MS = 300; // ввод суммы с клавиатуры — пересчёт после короткой паузы
const GROUPS = { niche: 'niches', geo: 'geos', goal: 'goals' };
const RANGES = ['impressions', 'clicks', 'conversions', 'cpc', 'cpa']; // диапазон + среднее
const COUNTS = new Set(['impressions', 'clicks', 'conversions']);

const label = (opt, lang) => opt?.label?.[lang] ?? opt?.label?.ua ?? opt?.id ?? '';
const pick = (options, id) => (options.some((o) => o.id === id) ? id : options[0]?.id);
const decimal = (text, lang) => (lang === 'en' ? text : text.replace('.', ','));
/** Цена — евро до 3 знаков: «€0,083» (UA) / «€0.083» (EN). */
const price = (n, lang) => `€${decimal(n.toFixed(3), lang)}`;
/** CTR — доля → проценты до 2 знаков: «0,81%». */
const percent = (n, lang) => `${decimal((n * 100).toFixed(2), lang)}%`;

// очередь смен: узел → { busy, pending, shown }; shown — текст, который узел показывает или к которому идёт
const boards = new WeakMap();
const MOVES = { roll: (node, text) => rollTo(node, text), flip: (node, text) => flipSwap(node, text) };

/**
 * Ставит text в node. move — 'roll' (барабаны: цифры) | 'flip' (табло: подпись) | null (сразу: первый показ,
 * смена языка, возврат из «нет данных»). Пока идёт движение, значение ждёт очереди и ставится одним ходом.
 */
function board(node, text, move) {
  let slot = boards.get(node);
  if (!slot) boards.set(node, (slot = { busy: false, pending: null, shown: node.textContent }));
  if (slot.busy) {
    slot.pending = text;
    return;
  }
  if (!move || slot.shown === text) {
    slot.shown = text;
    node.textContent = text;
    return;
  }
  slot.busy = true;
  slot.shown = text;
  MOVES[move](node, text).then(() => {
    slot.busy = false;
    const next = slot.pending;
    slot.pending = null;
    if (next != null && next !== slot.shown) board(node, next, move);
  });
}

function nearestIndex(scale, value) {
  let best = 0;
  scale.forEach((v, i) => {
    if (Math.abs(v - value) < Math.abs(scale[best] - value)) best = i;
  });
  return best;
}

export function init(root) {
  accentTitles(root);
  const form = $('[data-calc-form]', root);
  const range = $('[data-calc-budget]', root);
  if (!form || !range) return;
  const amount = $('[data-calc-amount]', root);

  const scale = budgetScale(rates.budget);
  const limits = { min: scale[0], max: scale.at(-1) };
  const options = Object.fromEntries(Object.entries(GROUPS).map(([key, list]) => [key, rates[list] || []]));
  const defaults = rates.defaults || {};
  const state = {
    niche: pick(options.niche, defaults.niche),
    geo: pick(options.geo, defaults.geo),
    goal: pick(options.goal, defaults.goal),
    budget: clampBudget(rates.budget?.default, limits) ?? scale[0],
  };

  const nodes = {
    bubble: $('.calc__bubble', root),
    budgetValue: $('[data-calc-budget-value]', root),
    fill: $('[data-calc-fill]', root),
    intro: $('[data-calc-intro]', root),
    goalStep: $('[data-calc-goal-step]', root),
    spread: $('[data-calc-spread]', root),
    nodata: $('[data-calc-nodata]', root),
    live: $('[data-calc-live]', root),
    cta: $('[data-calc-cta]', root),
    ctr: $('[data-calc-mid="ctr"]', root),
    lo: Object.fromEntries(RANGES.map((k) => [k, $(`[data-calc-lo="${k}"]`, root)])),
    hi: Object.fromEntries(RANGES.map((k) => [k, $(`[data-calc-hi="${k}"]`, root)])),
    mid: Object.fromEntries(RANGES.map((k) => [k, $(`[data-calc-mid="${k}"]`, root)])),
  };
  const selects = Object.fromEntries(Object.keys(GROUPS).map((key) => [key, $(`[data-calc-select="${key}"]`, form)]));

  buildOptions(selects, options, state);
  range.min = '0';
  range.max = String(scale.length - 1);
  range.step = '1';
  range.value = String(nearestIndex(scale, state.budget));
  if (amount) {
    amount.min = String(limits.min);
    amount.max = String(limits.max);
    amount.value = String(state.budget);
  }
  if (nodes.spread) nodes.spread.textContent = `±${Math.round(rates.spread * 100)}%`;

  const shown = new WeakMap(); // узел → число, которое в нём сейчас стоит
  let lastIssues = '';
  let frame = 0;
  let liveTimer = 0;
  let trackTimer = 0;
  let amountTimer = 0;
  let touched = false; // пользователь уже менял параметры — aria-live говорит и после смены языка

  const payload = () => ({ niche: state.niche, geo: state.geo, goal: state.goal, budget: state.budget });
  const goalOption = () => options.goal.find((o) => o.id === state.goal);
  const budgetText = (lang) => `€${formatInt(state.budget, lang)}`; // бюджет — целые евро: «€1», «€1 993»

  function format(key, n, lang) {
    return COUNTS.has(key) ? formatInt(n, lang) : price(n, lang);
  }

  /** Вступительная фраза: шаблон calculator.intro, {budget} — жирным, {niche} и {geo} — текущие параметры. */
  function paintIntro(lang) {
    if (!nodes.intro) return;
    const values = {
      budget: budgetText(lang),
      niche: label(options.niche.find((o) => o.id === state.niche), lang),
      geo: t(`calculator.introGeo.${state.geo}`),
    };
    if (values.geo === `calculator.introGeo.${state.geo}`) values.geo = label(options.geo.find((o) => o.id === state.geo), lang);
    const parts = String(t('calculator.intro'))
      .split(/\{(\w+)\}/)
      .map((part, i) => (i % 2 ? el(part === 'budget' ? 'b' : 'span', { class: 'calc__intro-val', text: values[part] ?? '' }) : part));
    nodes.intro.replaceChildren(...parts);
  }

  /** mode: 'flip' — ответ на ввод (цифры барабанами), 'set' — сразу (первый показ, смена языка). */
  function paint(node, value, text, mode) {
    if (!node) return;
    const from = shown.get(node);
    if (value == null) {
      shown.delete(node);
      board(node, '—', null);
      return;
    }
    shown.set(node, value);
    board(node, text, mode === 'flip' && from != null ? 'roll' : null);
  }

  /** Бюджет — сразу (это ввод): крупная цифра, aria-valuetext ползунка, заливка, фраза. */
  function paintBudget(lang) {
    const text = budgetText(lang);
    if (nodes.budgetValue) nodes.budgetValue.textContent = text;
    range.setAttribute('aria-valuetext', text);
    const progress = scale.length > 1 ? Number(range.value) / (scale.length - 1) : 0;
    if (nodes.fill) nodes.fill.style.transform = `scaleX(${progress})`;
    paintIntro(lang);
  }

  /** Пересчитывает и перерисовывает всё; mode — как меняются числа (см. paint). */
  function render(mode = 'flip') {
    frame = 0;
    const lang = getLang();
    const fc = forecast(payload(), rates);

    const issues = fc.issues.join('; ');
    if (issues && issues !== lastIssues) console.warn(`[calculator] src/data/calculator.json: ${issues}`);
    lastIssues = issues;

    paintBudget(lang);

    // строка цели называется по цели («Підписники») — табло
    if (nodes.goalStep) board(nodes.goalStep, label(goalOption(), lang), mode === 'flip' ? 'flip' : null);

    // нет данных для пары «ниша × GEO»: сообщение вместо цифр, барабаны не крутятся; место сетки сохраняется
    nodes.bubble?.classList.toggle('is-nodata', fc.nodata);
    if (nodes.nodata) nodes.nodata.hidden = !fc.nodata;
    if (fc.nodata) {
      for (const group of [nodes.lo, nodes.hi, nodes.mid]) for (const node of Object.values(group)) if (node) shown.delete(node);
      if (nodes.ctr) shown.delete(nodes.ctr);
      return fc;
    }

    // пять показателей: диапазон и среднее; CTR — одно среднее
    for (const key of RANGES) {
      const value = fc[key];
      paint(nodes.lo[key], value?.lo, value && format(key, value.lo, lang), mode);
      paint(nodes.hi[key], value?.hi, value && format(key, value.hi, lang), mode);
      paint(nodes.mid[key], value?.mid, value && format(key, value.mid, lang), mode);
      nodes.lo[key]?.parentElement.classList.toggle('is-empty', value == null);
    }
    paint(nodes.ctr, fc.ctr?.mid, fc.ctr && percent(fc.ctr.mid, lang), mode);
    return fc;
  }

  function speak() {
    const lang = getLang();
    const fc = forecast(payload(), rates);
    if (fc.nodata) {
      if (nodes.live) nodes.live.textContent = `${t('calculator.nodata.lead')} ${t('calculator.nodata.link')}`;
      return;
    }
    const rangeOf = (key) => (fc[key] ? `${format(key, fc[key].lo, lang)} – ${format(key, fc[key].hi, lang)}` : '—');
    const values = {
      budget: budgetText(lang),
      impressions: rangeOf('impressions'),
      clicks: rangeOf('clicks'),
      conversions: rangeOf('conversions'),
      cpc: rangeOf('cpc'),
      cpa: rangeOf('cpa'),
      goal: String(goalOption()?.step?.[lang] ?? '').toLowerCase(),
    };
    const phrase = String(t('calculator.live')).replace(/\{(\w+)\}/g, (m, k) => values[k] ?? m);
    if (nodes.live) nodes.live.textContent = phrase;
  }

  function changed() {
    touched = true;
    if (!frame) frame = requestAnimationFrame(() => render('flip'));
    clearTimeout(liveTimer);
    liveTimer = setTimeout(speak, LIVE_MS);
    clearTimeout(trackTimer);
    trackTimer = setTimeout(() => track('calculator_change', payload()), TRACK_MS);
  }

  /** Сумма с клавиатуры: точная, в пределах шкалы; ползунок — на ближайшее значение. Мусор и пусто — без изменений. */
  function applyAmount() {
    const value = clampBudget(amount.value, limits);
    if (value === null) return;
    if (String(value) !== amount.value.trim()) amount.value = String(value); // 0 → 1, 99999 → 10000, 12.7 → 12
    if (value === state.budget) return;
    state.budget = value;
    range.value = String(nearestIndex(scale, value));
    changed();
  }

  on(form, 'submit', (e) => {
    e.preventDefault();
    if (amount) {
      clearTimeout(amountTimer);
      applyAmount();
    }
  });
  for (const [key, select] of Object.entries(selects)) {
    if (!select) continue;
    on(select, 'change', () => {
      if (!options[key].some((o) => o.id === select.value)) return;
      state[key] = select.value;
      changed();
    });
  }
  on(range, 'input', () => {
    const index = Number(range.value);
    if (!Number.isInteger(index)) return;
    const value = scale[Math.min(scale.length - 1, Math.max(0, index))];
    if (amount) amount.value = String(value);
    if (value === state.budget) return;
    state.budget = value;
    changed();
  });
  if (amount) {
    on(amount, 'input', () => {
      clearTimeout(amountTimer);
      amountTimer = setTimeout(applyAmount, AMOUNT_MS);
    });
    // ушли из поля: применить сразу и показать итоговую сумму (пусто или «abc» → текущий бюджет)
    on(amount, 'change', () => {
      clearTimeout(amountTimer);
      applyAmount();
      if (clampBudget(amount.value, limits) === null) amount.value = String(state.budget);
    });
    on(amount, 'blur', () => {
      if (clampBudget(amount.value, limits) === null) amount.value = String(state.budget);
    });
  }
  if (nodes.cta) on(nodes.cta, 'click', () => track('calculator_cta_click', payload()));

  // первый показ — сразу итоговые числа: переходов по прокрутке нет (H11)
  render('set');

  onLangChange((lang) => {
    for (const [key, select] of Object.entries(selects)) {
      for (const option of select?.options || []) option.textContent = label(options[key].find((o) => o.id === option.value), lang);
    }
    render('set');
    if (touched) speak();
  });
}

/** Варианты списков — из calculator.json; выбранный — по состоянию. Один вариант — список всё равно виден. */
function buildOptions(selects, options, state) {
  const lang = getLang();
  for (const [key, select] of Object.entries(selects)) {
    if (!select) continue;
    select.replaceChildren(...options[key].map((opt) => el('option', { text: label(opt, lang), attrs: { value: opt.id } })));
    select.value = state[key];
  }
}
