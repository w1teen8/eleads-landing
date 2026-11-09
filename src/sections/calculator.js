// 05 Калькулятор (T22; T28 — «Повідомлення від бота» по образцу reference/run3/calc-G-chosen.png): слева клавиши
// бота (ниша / GEO / цель) и строка бюджета с ползунком, справа прогноз как сообщение от бота — вступительная фраза
// из текущих параметров (шаблон calculator.intro с {budget} {niche} {geo}), сетка цифр, inline-кнопка.
// Расчёт — чистая функция в calculator-model.js; здесь только DOM, движение и события.
// Ниши, GEO, цели, коэффициенты и шкала бюджета — только в src/data/calculator.json.
// Движение (H11): переходов по прокрутке нет — блок и все числа видны сразу, без наезда и лесенки.
// Двигается только ответ на ввод: цифры перекручиваются барабанами (rollTo из stats-odometer.js — тот же модуль,
// что в блоке 02), название строки цели — табло (flipSwap из core/motion-kit.js). Пока узел крутится, новое
// значение ждёт очереди: при протяжке ползунка барабан докручивается и сразу идёт к последнему значению — хвостов
// нет. Фраза, бюджет и заливка ползунка (scaleX) меняются сразу — это ввод, а не показатель.
import { $, $$, el, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, getLang, onLangChange } from '../core/i18n.js';
import { formatInt, formatMoney, formatRange } from '../core/format.js';
import { track } from '../core/analytics.js';
import { flipSwap } from '../core/motion-kit.js';
import { rollTo } from './stats-odometer.js';
import rates from '../data/calculator.json';
import { forecast, budgetScale } from './calculator-model.js';

const LIVE_MS = 500; // aria-live — одной фразой после остановки
const TRACK_MS = 600; // дебаунс calculator_change
const GROUPS = { niche: 'niches', geo: 'geos', goal: 'goals' };
const METRICS = ['impressions', 'ctr', 'clicks', 'conversions', 'cpc', 'cpa'];

const label = (opt, lang) => opt?.label?.[lang] ?? opt?.label?.ua ?? opt?.id ?? '';
const pick = (options, id) => (options.some((o) => o.id === id) ? id : options[0]?.id);

// очередь смен: узел → { busy, pending, shown }; shown — текст, который узел показывает или к которому идёт
const boards = new WeakMap();
const MOVES = { roll: (node, text) => rollTo(node, text), flip: (node, text) => flipSwap(node, text) };

/**
 * Ставит text в node. move — 'roll' (барабаны: цифры) | 'flip' (табло: подпись) | null (сразу: первый показ,
 * смена языка). Пока идёт движение, значение ждёт очереди и после остановки ставится одним следующим ходом.
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

  const scale = budgetScale(rates.budget);
  const options = Object.fromEntries(Object.entries(GROUPS).map(([key, list]) => [key, rates[list] || []]));
  const defaults = rates.defaults || {};
  const state = {
    niche: pick(options.niche, defaults.niche),
    geo: pick(options.geo, defaults.geo),
    goal: pick(options.goal, defaults.goal),
    index: nearestIndex(scale, rates.budget?.default ?? scale[0]),
  };

  const nodes = {
    budgetValue: $('[data-calc-budget-value]', root),
    fill: $('[data-calc-fill]', root),
    intro: $('[data-calc-intro]', root),
    goalStep: $('[data-calc-goal-step]', root),
    live: $('[data-calc-live]', root),
    demo: $('[data-calc-demo]', root),
    cta: $('[data-calc-cta]', root),
    lo: Object.fromEntries(METRICS.map((k) => [k, $(`[data-calc-lo="${k}"]`, root)])),
    hi: Object.fromEntries(METRICS.map((k) => [k, $(`[data-calc-hi="${k}"]`, root)])),
  };
  if (nodes.demo) nodes.demo.hidden = rates.demo !== true;

  buildPills(form, options, state);
  range.min = '0';
  range.max = String(scale.length - 1);
  range.step = '1';
  range.value = String(state.index);

  const shown = new WeakMap(); // узел → число, которое в нём сейчас стоит
  let lastIssues = '';
  let frame = 0;
  let liveTimer = 0;
  let trackTimer = 0;
  let touched = false; // пользователь уже менял параметры — aria-live говорит и после смены языка

  const budget = () => scale[state.index];
  const payload = () => ({ niche: state.niche, geo: state.geo, goal: state.goal, budget: budget() });
  const goalOption = () => options.goal.find((o) => o.id === state.goal);

  function budgetText(lang) {
    const value = budget();
    const text = formatMoney(value, lang);
    return state.index === scale.length - 1 ? `${text}+` : text;
  }

  /** Вступительная фраза бота: шаблон calculator.intro, {budget} — жирным, {niche} и {geo} — текущие параметры. */
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

  function formatters(lang) {
    const int = (n) => formatInt(n, lang);
    const money = (n) => formatMoney(n, lang);
    return {
      impressions: [int, int],
      clicks: [int, int],
      conversions: [int, int],
      ctr: [(n) => (n * 100).toFixed(1), (n) => `${(n * 100).toFixed(1)}%`],
      cpc: [money, money],
      cpa: [money, money],
    };
  }

  /** mode: 'flip' — ответ на ввод (цифры барабанами), 'set' — сразу (первый показ, смена языка). */
  function paint(node, value, format, mode) {
    if (!node) return;
    const from = shown.get(node);
    if (value == null) {
      shown.delete(node);
      board(node, '—', mode === 'flip' ? 'roll' : null);
      return;
    }
    shown.set(node, value);
    board(node, format(value), mode === 'flip' && from != null ? 'roll' : null);
  }

  /** Пересчитывает и перерисовывает всё; mode — как меняются числа (см. paint). */
  function render(mode = 'flip') {
    frame = 0;
    const lang = getLang();
    const fc = forecast({ ...payload() }, rates);

    const issues = fc.issues.join('; ');
    if (issues && issues !== lastIssues) console.warn(`[calculator] src/data/calculator.json: ${issues}`);
    lastIssues = issues;

    // бюджет и ползунок — сразу: это ввод, а не показатель
    const text = budgetText(lang);
    if (nodes.budgetValue) nodes.budgetValue.textContent = text;
    range.setAttribute('aria-valuetext', text);
    const progress = scale.length > 1 ? state.index / (scale.length - 1) : 0;
    if (nodes.fill) nodes.fill.style.transform = `scaleX(${progress})`;
    paintIntro(lang);

    // строка цели называется по цели: «Підписники» / «Користувачі бота» — табло
    if (nodes.goalStep) board(nodes.goalStep, label(goalOption(), lang), mode === 'flip' ? 'flip' : null);

    // шесть показателей диапазонами
    const fmt = formatters(lang);
    for (const key of METRICS) {
      const value = fc[key];
      const [fLo, fHi] = fmt[key];
      paint(nodes.lo[key], value?.lo, fLo, mode);
      paint(nodes.hi[key], value?.hi ?? null, fHi, mode);
      nodes.lo[key]?.parentElement.classList.toggle('is-empty', value == null);
    }
    return fc;
  }

  function speak() {
    const lang = getLang();
    const fc = forecast(payload(), rates);
    const fmt = formatters(lang);
    const rangeOf = (key) => formatRange(fc[key]?.lo, fc[key]?.hi, fmt[key][1]);
    const goal = String(goalOption()?.step?.[lang] ?? '').toLowerCase();
    const values = {
      budget: budgetText(lang),
      impressions: rangeOf('impressions'),
      clicks: rangeOf('clicks'),
      conversions: rangeOf('conversions'),
      cpc: rangeOf('cpc'),
      cpa: rangeOf('cpa'),
      goal,
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

  on(form, 'submit', (e) => e.preventDefault());
  on(form, 'change', (e) => {
    const name = e.target?.dataset?.calcKey;
    if (!name || !e.target.checked) return;
    state[name] = e.target.value;
    changed();
  });
  on(range, 'input', () => {
    const index = Number(range.value);
    if (!Number.isInteger(index) || index === state.index) return;
    state.index = Math.min(scale.length - 1, Math.max(0, index));
    changed();
  });
  if (nodes.cta) on(nodes.cta, 'click', () => track('calculator_cta_click', payload()));

  // первый показ — сразу итоговые числа: переходов по прокрутке нет (H11)
  render('set');

  onLangChange((lang) => {
    for (const input of $$('.calc__pill-input', form)) {
      const opt = options[input.dataset.calcKey]?.find((o) => o.id === input.value);
      const textNode = input.parentElement?.querySelector('.calc__pill-text');
      if (textNode) textNode.textContent = label(opt, lang);
    }
    render('set');
    if (touched) speak();
  });
}

function buildPills(form, options, state) {
  const lang = getLang();
  for (const [key, list] of Object.entries(options)) {
    const box = $(`[data-calc-group="${key}"] [data-calc-options]`, form);
    if (!box) continue;
    box.replaceChildren(
      ...list.map((opt) => {
        const input = el('input', {
          class: 'calc__pill-input',
          dataset: { calcKey: key },
          attrs: { type: 'radio', name: `calc-${key}`, value: opt.id },
        });
        input.checked = opt.id === state[key];
        return el(
          'label',
          { class: 'calc__pill' },
          input,
          el('span', { class: 'calc__pill-face' }, el('span', { class: 'calc__pill-text', text: label(opt, lang) })),
        );
      }),
    );
  }
}
