// 02 Telegram у цифрах: вкладки Україна / Worldwide (role=tablist, стрелки), цифры перекручиваются.
import { $, $$, on } from '../core/dom.js';
import { getLang } from '../core/i18n.js';
import { countTo, formatInt } from '../core/format.js';
import { reduced } from '../core/motion.js';

// «81%», «4 500», «1B+», «200+ GEO»: докручивается первое целое число, остальное — как в тексте
const NUMBER = /\d[\d\s  ,]*/;

function roll(node) {
  const original = node.dataset.final || node.textContent;
  node.dataset.final = original;
  const match = original.match(NUMBER);
  if (!match || reduced) return;
  const target = Number(match[0].replace(/\D/g, ''));
  if (!target) return;
  const grouped = /[\s  ,]/.test(match[0].trim());
  countTo(node, 0, target, {
    duration: 1100,
    format: (v) => {
      const n = Math.round(v);
      if (n >= target) return original;
      return original.replace(match[0], grouped ? formatInt(n, getLang()) : String(n));
    },
  });
}

export function init(root) {
  const host = $('[data-stats]', root);
  if (!host) return;
  const tabs = $$('[data-stats-tab]', host);
  const panels = $$('[data-stats-panel]', host);
  const bar = $('.stats__tabs', host);

  const rollPanel = (panel) => $$('[data-count]', panel).forEach(roll);

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
    for (const panel of panels) {
      const show = panel.dataset.statsPanel === id;
      panel.hidden = !show;
      panel.classList.remove('is-entering');
      if (show && animate) {
        void panel.offsetWidth;
        panel.classList.add('is-entering');
        rollPanel(panel);
      }
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

  // первый показ: цифры докручиваются при входе в экран
  const first = panels.find((p) => !p.hidden);
  let seen = false;
  new IntersectionObserver(
    (entries, obs) => {
      if (seen || !entries.some((e) => e.isIntersecting)) return;
      seen = true;
      obs.disconnect();
      if (first && !first.hidden) rollPanel(first);
    },
    { threshold: 0.25 },
  ).observe(host);
}
