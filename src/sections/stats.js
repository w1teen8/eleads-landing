// 02 Telegram у цифрах — «таймер» Aether: вкладки Україна / Worldwide (role=tablist, стрелки);
// при первом показе цифры докручиваются, при смене вкладки отличающиеся знаки въезжают сверху.
import { $, $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, getLang } from '../core/i18n.js';
import { countTo, formatInt } from '../core/format.js';
import { reduced } from '../core/motion.js';

// «81%», «4 500», «1B+», «200+ GEO»: докручивается первое целое число, остальное — как в тексте
const NUMBER = /\d[\d\s  ,]*/;

// Итоговая строка — всегда из словаря текущего языка (а не закэшированный текст первого показа):
// после UA → EN докрутка кончается на строке из content.en.json.
function finalText(node) {
  const key = node.dataset.i18n;
  const value = key ? t(key) : null;
  return typeof value === 'string' && value !== key ? value : node.textContent;
}

function roll(node) {
  const start = finalText(node);
  node.textContent = start;
  const match = start.match(NUMBER);
  if (!match || reduced) return;
  const target = Number(match[0].replace(/\D/g, ''));
  if (!target) return;
  const grouped = /[\s  ,]/.test(match[0].trim());
  countTo(node, 0, target, {
    duration: 1100,
    format: (v) => {
      // язык могли переключить посреди докрутки — каждый кадр строится от строки текущего языка
      const text = finalText(node);
      const n = Math.round(v);
      const m = text.match(NUMBER);
      if (n >= target || !m) return text;
      return text.replace(m[0], grouped ? formatInt(n, getLang()) : String(n));
    },
  });
}

/** Какие знаки нового значения отличаются от прежнего на той же позиции — они и въезжают. */
export function changedChars(prev, next) {
  return [...next].map((ch, i) => [...prev][i] !== ch);
}

const SLOTS = ['.stats__card--main .stats__value', '.stats__card--a .stats__value', '.stats__card--b .stats__value'];
const DROP_MS = 1300;

// знаки по одному под маской; через DROP_MS — снова обычный текст (читалки, смена языка)
function drop(node, prevText) {
  const text = finalText(node);
  const changed = changedChars(prevText, text);
  let n = 0;
  node.replaceChildren(
    ...[...text].map((ch, i) => {
      const outer = document.createElement('span');
      outer.className = changed[i] ? 'stats__char is-new' : 'stats__char';
      if (changed[i]) outer.style.setProperty('--i', String(n++));
      const inner = document.createElement('span');
      inner.textContent = ch;
      outer.append(inner);
      return outer;
    }),
  );
  node.setAttribute('aria-label', text);
  clearTimeout(node._dropTimer);
  node._dropTimer = setTimeout(() => {
    node.textContent = finalText(node);
    node.removeAttribute('aria-label');
  }, DROP_MS);
}

export function init(root) {
  accentTitles(root);
  const host = $('[data-stats]', root);
  if (!host) return;
  const tabs = $$('[data-stats-tab]', host);
  const panels = $$('[data-stats-panel]', host);
  const bar = $('.stats__tabs', host);

  const rollPanel = (panel) => $$('[data-count]', panel).forEach(roll);

  function select(id, { focus = false, animate = true } = {}) {
    const prev = panels.find((p) => !p.hidden);
    const prevTexts = prev ? SLOTS.map((sel) => $(sel, prev)?.textContent ?? '') : [];
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
      if (show && animate && panel !== prev) {
        void panel.offsetWidth;
        panel.classList.add('is-entering');
        SLOTS.forEach((sel, i) => {
          const node = $(sel, panel);
          if (!node) return;
          if (reduced) node.textContent = finalText(node);
          else drop(node, prevTexts[i] || '');
        });
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
