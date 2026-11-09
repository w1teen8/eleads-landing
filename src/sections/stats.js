// 02 Telegram у цифрах (T19) — синее продолжение первого экрана. Движение — только общий язык (core/motion-kit.js):
//   глава   — stackReveal: блок наезжает на первый экран снизу, как следующая карточка стопки (≥900px);
//   лесенка — stagger: шапка и вкладки, затем карточки по одной (тёмная акцентная — последней), при появлении
//             цифры докручиваются (countTo);
//   табло   — flipSwap: вкладки Україна / Worldwide (role=tablist, стрелки, Home/End) меняют тексты карточек —
//             старое уезжает вверх, новое въезжает снизу под маской.
import { $, $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, getLang } from '../core/i18n.js';
import { countTo, formatInt } from '../core/format.js';
import { stackReveal, flipSwap, stagger } from '../core/motion-kit.js';

// «81%», «4 500», «1B+», «200+ GEO»: докручивается первое целое число, остальное — как в тексте
const NUMBER = /\d[\d\s  ,]*/;
/** Задержка табло между соседними строками карточек, мс — волна слева направо. */
const FLIP_STEP_MS = 35;

// Итоговая строка — всегда из словаря текущего языка: язык могли сменить посреди докрутки или табло.
function finalText(node) {
  const key = node.dataset.i18n;
  const value = key ? t(key) : null;
  return typeof value === 'string' && value !== key ? value : node.textContent;
}

function roll(node) {
  const start = finalText(node);
  node.textContent = start;
  const match = start.match(NUMBER);
  if (!match) return;
  const target = Number(match[0].replace(/\D/g, ''));
  if (!target) return;
  const grouped = /[\s  ,]/.test(match[0].trim());
  countTo(node, 0, target, {
    duration: 1100,
    format: (v) => {
      const text = finalText(node);
      const n = Math.round(v);
      const m = text.match(NUMBER);
      if (n >= target || !m) return text;
      return text.replace(m[0], grouped ? formatInt(n, getLang()) : String(n));
    },
  });
}

export function init(root) {
  accentTitles(root);
  const host = $('[data-stats]', root);
  const bar = $('.stats__tabs', root);
  if (!host || !bar) return;
  const tabs = $$('[data-stats-tab]', bar);
  const panels = $$('[data-stats-panel]', host);

  function select(id, { focus = false, animate = true } = {}) {
    tabs.forEach((tab, i) => {
      const active = tab.dataset.statsTab === id;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) {
        bar.dataset.active = id;
        bar.style.setProperty('--tab', String(i));
        if (focus) tab.focus();
      }
    });
    const prev = panels.find((p) => !p.hidden);
    const next = panels.find((p) => p.dataset.statsPanel === id);
    if (!next || next === prev) return;
    // табло: каждая строка новой вкладки стартует с текста той же строки прежней
    const was = new Map(prev ? $$('[data-flip]', prev).map((n) => [n.dataset.flip, n.textContent]) : []);
    if (prev) prev.hidden = true;
    next.hidden = false;
    if (!animate) return;
    for (const node of $$('[data-flip]', next)) {
      const from = was.get(node.dataset.flip);
      if (from == null) continue;
      node.textContent = from;
      flipSwap(node, finalText(node), { delay: Number(node.dataset.flip) * FLIP_STEP_MS }).then(() => {
        node.textContent = finalText(node);
      });
    }
  }

  tabs.forEach((tab, i) => {
    on(tab, 'click', () => select(tab.dataset.statsTab));
    on(tab, 'keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        select(tabs[e.key === 'Home' ? 0 : tabs.length - 1].dataset.statsTab, { focus: true });
      } else if (keys[e.key]) {
        e.preventDefault();
        select(tabs[(i + keys[e.key] + tabs.length) % tabs.length].dataset.statsTab, { focus: true });
      }
    });
  });

  select('ua', { animate: false });

  // глава: наезд на первый экран
  stackReveal(root);

  // лесенка: шапка и вкладки; затем карточки открытой вкладки и сноска — цифры докручиваются при появлении
  stagger($$('[data-stats-step]', $('.stats__top', root) || root), { trigger: root, start: 'top 70%' });
  const first = panels.find((p) => !p.hidden);
  const cards = first ? $$('.stats__card', first) : [];
  stagger([...cards, $('.stats__footnote', host)], {
    trigger: host,
    onEach: (node) => $$('[data-count]', node).forEach(roll),
  });
}
