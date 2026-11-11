// 09 Таргетинг (T43): «Велика формула» — выбор пользователя 9-F («берем это») с текстами клиента.
// Крупная формула выбранного способа «части + … = ваш клієнт», под ней три способа клиента (вкладки). Каждые STEP_MS
// активным становится следующий способ: части формулы уходят вверх и гаснут, новые въезжают снизу по одной; у активной
// вкладки полоска-таймер заполняется за шаг. Таймер — Web Animations API: пауза, пока курсор на самих вкладках или фокус
// с клавиатуры внутри, вне окна и на скрытой вкладке браузера (как было у диска, T34). Клик и стрелки — выбор и новый
// отсчёт. reduced-motion / ?nomotion=1 — без автолистания, смена мгновенная. Только transform и opacity.
import { $, $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, onLangChange } from '../core/i18n.js';
import { reduced } from '../core/motion.js';
import { nextIndex } from './targeting-model.js';

/** Шаг автолистания, мс (пользователь: «раз в 10 секунд»). */
export const STEP_MS = 10000;
/** Смена частей формулы: уход старых и шаг появления новых, мс. */
export const SWAP = { out: 260, in: 520, step: 90 };

const KEYS = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** Части формулы способа i из словаря: непустые строки массива targeting.items.i.parts. */
export function partsOf(read, i) {
  const parts = read(`targeting.items.${i}.parts`);
  return Array.isArray(parts) ? parts.filter((p) => typeof p === 'string' && p.trim()) : [];
}

/** Узлы частей: «часть + часть + часть». */
export function partNodes(doc, parts) {
  const nodes = [];
  parts.forEach((text, n) => {
    if (n > 0) {
      const op = doc.createElement('span');
      op.className = 'tg__op';
      op.setAttribute('aria-hidden', 'true');
      op.textContent = '+';
      nodes.push(op);
    }
    const part = doc.createElement('span');
    part.className = 'tg__part';
    part.textContent = text;
    nodes.push(part);
  });
  return nodes;
}

export function init(root) {
  accentTitles(root);
  const host = $('[data-tg]', root);
  const panel = $('#tg-panel', root);
  const box = $('[data-tg-parts]', root);
  if (!host || !panel || !box) return;
  const tabs = $$('[data-tg-tab]', root);
  const total = tabs.length;
  // части формулы пишет этот модуль: i18n при смене языка не должен возвращать способ 0
  for (const node of $$('[data-i18n]', box)) node.removeAttribute('data-i18n');

  let current = 0;
  let timer = null;
  let swapId = 0;
  const state = { hovered: false, focused: false, inView: false, hidden: document.hidden };
  if (reduced) root.classList.add('is-static');

  /* ——— формула ——— */
  function paint(i, animate) {
    const nodes = partNodes(document, partsOf(t, i));
    const id = ++swapId;
    if (!animate || reduced || typeof box.animate !== 'function') {
      box.replaceChildren(...nodes);
      return;
    }
    const old = [...box.children];
    const leave = old.map((el) =>
      el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-30%)' }], {
        duration: SWAP.out,
        easing: 'ease-in',
        fill: 'forwards',
      }),
    );
    Promise.all(leave.map((a) => a.finished.catch(() => {}))).then(() => {
      if (id !== swapId) return; // уже выбран другой способ
      box.replaceChildren(...nodes);
      nodes.forEach((el, n) =>
        el.animate([{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'none' }], {
          duration: SWAP.in,
          delay: n * SWAP.step,
          easing: EASE,
          fill: 'backwards',
        }),
      );
    });
  }

  /* ——— таймер: полоска под активной вкладкой; конец — следующий способ ——— */
  function startTimer() {
    timer?.cancel();
    timer = null;
    const bar = $('.tg__bar', tabs[current]);
    if (reduced || !bar || typeof bar.animate !== 'function') return;
    timer = bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
      duration: STEP_MS,
      easing: 'linear',
      fill: 'both',
    });
    timer.finished.then(
      () => select(nextIndex(current, total), false),
      () => {}, // отменён — новый выбор уже запустил свой отсчёт
    );
    sync();
  }

  // идёт только в окне, на видимой вкладке, без курсора над вкладками и фокуса с клавиатуры внутри
  function sync() {
    if (!timer) return;
    const run = state.inView && !state.hidden && !state.hovered && !state.focused;
    if (run && timer.playState === 'paused') timer.play();
    if (!run && timer.playState === 'running') timer.pause();
  }

  function select(i, manual, focus = false) {
    if (i < 0 || i >= total) return;
    panel.setAttribute('aria-live', manual ? 'polite' : 'off');
    const changed = i !== current;
    current = i;
    tabs.forEach((tab, n) => {
      const sel = n === i;
      tab.setAttribute('aria-selected', String(sel));
      tab.tabIndex = sel ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tabs[i].id);
    if (focus) tabs[i].focus();
    if (changed) paint(i, true);
    startTimer();
  }

  /* ——— ввод ——— */
  tabs.forEach((tab, i) => {
    on(tab, 'click', () => select(i, true));
    on(tab, 'keydown', (e) => {
      let to = null;
      if (e.key in KEYS) to = (current + KEYS[e.key] + total) % total;
      if (e.key === 'Home') to = 0;
      if (e.key === 'End') to = total - 1;
      if (to === null) return;
      e.preventDefault();
      select(to, true, true);
    });
    // пауза только пока курсор на самих вкладках (T34: пауза над всем блоком останавливала листание почти всегда)
    on(tab, 'pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      state.hovered = true;
      sync();
    });
    on(tab, 'pointerleave', () => {
      state.hovered = false;
      sync();
    });
  });
  // фокус с клавиатуры останавливает листание; кнопка, получившая фокус от клика мышью, — нет
  const keyboardFocus = (node) => {
    try {
      return Boolean(node?.matches(':focus-visible'));
    } catch {
      return true;
    }
  };
  on(root, 'focusin', (e) => {
    state.focused = keyboardFocus(e.target);
    sync();
  });
  on(root, 'focusout', (e) => {
    state.focused = root.contains(e.relatedTarget) && keyboardFocus(e.relatedTarget);
    sync();
  });
  on(document, 'visibilitychange', () => {
    state.hidden = document.hidden;
    sync();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        state.inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.35 },
    ).observe(host);
  } else {
    state.inView = true;
  }

  onLangChange(() => paint(current, false));

  if (reduced) return; // без автолистания: выбор только кликом и клавишами
  startTimer();
}
