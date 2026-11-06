// 05 Калькулятор: пилюли ниши/GEO/цели и ползунок бюджета → живая воронка и табло денег.
// Расчёт — чистая функция в calculator-model.js; здесь только DOM, докрутка и события.
// Ниши, GEO, цели, коэффициенты и шкала бюджета — только в src/data/calculator.json.
import { $, $$, el, on } from '../core/dom.js';
import { t, getLang, onLangChange } from '../core/i18n.js';
import { countTo, formatInt, formatMoney, formatRange } from '../core/format.js';
import { track } from '../core/analytics.js';
import rates from '../data/calculator.json';
import { forecast, budgetScale, funnelWidths } from './calculator-model.js';

const ROLL_MS = 350; // докрутка при изменении
const ENTER_MS = 1100; // докрутка при первом входе в экран
const LIVE_MS = 500; // aria-live — одной фразой после остановки
const TRACK_MS = 600; // дебаунс calculator_change
const GROUPS = { niche: 'niches', geo: 'geos', goal: 'goals' };
const METRICS = ['impressions', 'ctr', 'clicks', 'conversions', 'cpc', 'cpa'];

const label = (opt, lang) => opt?.label?.[lang] ?? opt?.label?.ua ?? opt?.id ?? '';
const pick = (options, id) => (options.some((o) => o.id === id) ? id : options[0]?.id);

function nearestIndex(scale, value) {
  let best = 0;
  scale.forEach((v, i) => {
    if (Math.abs(v - value) < Math.abs(scale[best] - value)) best = i;
  });
  return best;
}

export function init(root) {
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
    min: $('[data-calc-min]', root),
    max: $('[data-calc-max]', root),
    glow: $('.calc__glow', root),
    goalStep: $('[data-calc-goal-step]', root),
    live: $('[data-calc-live]', root),
    demo: $('[data-calc-demo]', root),
    cta: $('[data-calc-cta]', root),
    bars: ['impressions', 'clicks', 'conversions'].map((k) => $(`[data-calc-step="${k}"] .calc__step-bar`, root)),
    lo: Object.fromEntries(METRICS.map((k) => [k, $(`[data-calc-lo="${k}"]`, root)])),
    hi: Object.fromEntries(METRICS.map((k) => [k, $(`[data-calc-hi="${k}"]`, root)])),
  };
  if (nodes.demo) nodes.demo.hidden = rates.demo !== true;

  buildPills(form, options, state);
  range.min = '0';
  range.max = String(scale.length - 1);
  range.step = '1';
  range.value = String(state.index);

  const shown = new WeakMap(); // узел → число, которое в нём сейчас стоит (для докрутки)
  let lastIssues = '';
  let frame = 0;
  let liveTimer = 0;
  let trackTimer = 0;
  let entered = false;

  const budget = () => scale[state.index];
  const payload = () => ({ niche: state.niche, geo: state.geo, goal: state.goal, budget: budget() });
  const goalOption = () => options.goal.find((o) => o.id === state.goal);

  function budgetText(lang) {
    const value = budget();
    const text = formatMoney(value, lang);
    return state.index === scale.length - 1 ? `${text}+` : text;
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

  function paint(node, value, format, duration) {
    if (!node) return;
    if (value == null) {
      shown.delete(node);
      node.textContent = '—';
      return;
    }
    const from = shown.get(node);
    shown.set(node, value);
    countTo(node, from ?? value, value, { duration: from == null ? 0 : duration, format });
  }

  /** Пересчитывает и перерисовывает всё; duration — длительность докрутки чисел. */
  function render(duration = ROLL_MS) {
    frame = 0;
    const lang = getLang();
    const fc = forecast({ ...payload() }, rates);

    const issues = fc.issues.join('; ');
    if (issues && issues !== lastIssues) console.warn(`[calculator] src/data/calculator.json: ${issues}`);
    lastIssues = issues;

    // бюджет и ползунок
    const text = budgetText(lang);
    if (nodes.budgetValue) nodes.budgetValue.textContent = text;
    range.setAttribute('aria-valuetext', text);
    const progress = scale.length > 1 ? state.index / (scale.length - 1) : 0;
    if (nodes.fill) nodes.fill.style.transform = `scaleX(${progress})`;
    if (nodes.glow) nodes.glow.style.opacity = String(0.35 + 0.65 * progress);

    // воронка: ширина ступеней через scaleX
    funnelWidths(fc).forEach((w, i) => {
      const bar = nodes.bars[i];
      if (bar) bar.style.transform = `scaleX(${w.toFixed(4)})`;
    });
    if (nodes.goalStep) nodes.goalStep.textContent = goalOption()?.step?.[lang] ?? label(goalOption(), lang);

    // шесть показателей диапазонами
    const fmt = formatters(lang);
    for (const key of METRICS) {
      const value = fc[key];
      const [fLo, fHi] = fmt[key];
      paint(nodes.lo[key], value?.lo, fLo, duration);
      paint(nodes.hi[key], value?.hi ?? null, fHi, duration);
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
    entered = true;
    if (!frame) frame = requestAnimationFrame(() => render(ROLL_MS));
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

  // подписи шкалы
  const paintScale = () => {
    const lang = getLang();
    if (nodes.min) nodes.min.textContent = formatMoney(scale[0], lang);
    if (nodes.max) nodes.max.textContent = `${formatMoney(scale.at(-1), lang)}+`;
  };
  paintScale();

  // первый показ: воронка и числа «набегают» от нуля, когда блок входит в экран
  const enter = () => {
    if (entered) return;
    entered = true;
    render(ENTER_MS);
    speak();
  };
  const startFromZero = () => {
    const fmt = formatters(getLang());
    for (const key of METRICS) {
      [nodes.lo[key], nodes.hi[key]].forEach((node, i) => {
        if (!node || !shown.has(node)) return; // «—» остаётся «—»
        shown.set(node, 0);
        node.textContent = fmt[key][i](0);
      });
    }
    for (const bar of nodes.bars) if (bar) bar.style.transform = 'scaleX(0.14)';
  };
  render(0);
  if ('IntersectionObserver' in window) {
    startFromZero();
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        // кадр, чтобы стартовая ширина ступеней успела примениться до перехода
        requestAnimationFrame(() => requestAnimationFrame(enter));
      },
      { threshold: 0.25 },
    );
    io.observe($('.calc__forecast', root) || root);
  } else {
    enter();
  }

  onLangChange((lang) => {
    for (const input of $$('.calc__pill-input', form)) {
      const opt = options[input.dataset.calcKey]?.find((o) => o.id === input.value);
      const textNode = input.parentElement?.querySelector('.calc__pill-text');
      if (textNode) textNode.textContent = label(opt, lang);
    }
    paintScale();
    render(0);
    if (entered) speak();
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
