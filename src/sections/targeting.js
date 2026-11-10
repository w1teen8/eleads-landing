// 09 Таргетинг (T34, H47): диск, который сам листает способы таргетинга. Выбор пользователя: «давай М, но он должен
// сам перелистываться … справа пусто получается» → «3 давай» (reference/run3/targeting-dial-chosen.png).
// Слева — текущий способ крупно и описание, в центре — диск с шестью иконками и номером, справа — список с таймером.
// Каждые STEP_MS активным становится следующий пункт: диск поворачивается кратчайшим путём так, что активная иконка
// встаёт слева (иконки остаются вертикальными — CSS), номер крутится барабаном (rollTo), название и описание — табло
// (flipSwap), кольцо вокруг диска и полоска под строкой списка заполняются за шаг. Таймер — Web Animations API:
// пауза при наведении на блок и фокусе внутри, вне окна и на скрытой вкладке. Клик по иконке или строке, стрелки по
// списку — выбор и новый отсчёт. reduced-motion / ?nomotion=1 — без автолистания, смены мгновенные.
// Описание объявляется скринридером только при ручном выборе (aria-live), не при автолистании. Только transform/opacity.
import { $, $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, onLangChange } from '../core/i18n.js';
import { reduced } from '../core/motion.js';
import { flipSwap } from '../core/motion-kit.js';
import { rollTo } from './stats-odometer.js';
import { turnTo, nextIndex } from './targeting-model.js';

/** Шаг автолистания, мс. */
export const STEP_MS = 10000;

const KEYS = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

export function init(root) {
  accentTitles(root);
  const host = $('[data-tg]', root);
  const dial = $('[data-tg-dial]', root);
  const panel = $('#tg-panel', root);
  if (!host || !dial || !panel) return;
  const tabs = $$('[data-tg-tab]', root);
  const nodes = $$('[data-tg-node]', root);
  const total = tabs.length;
  const out = {
    name: $('[data-tg-name]', root),
    text: $('[data-tg-text]', root),
    more: $('[data-tg-more]', root),
    num: $('[data-tg-num]', root),
  };
  // тексты текущего пункта пишет этот модуль: i18n при смене языка не должен возвращать пункт 0
  for (const node of [out.name, out.text, out.more]) node?.removeAttribute('data-i18n');
  const arcs = { r: $('.tg__arc--r', root), l: $('.tg__arc--l', root) };

  let current = 0;
  let turn = 0;
  let timers = [];
  const state = { hovered: false, focused: false, inView: false, hidden: document.hidden };
  if (reduced) root.classList.add('is-static');

  const item = (i, f) => t(`targeting.items.${i}.${f}`);

  /* ——— таймер: кольцо из двух половин и полоска под строкой; конец — следующий пункт ——— */
  const stopTimers = () => {
    for (const a of timers) a.cancel();
    timers = [];
  };

  function startTimers() {
    stopTimers();
    if (reduced || typeof dial.animate !== 'function') return;
    const timing = { duration: STEP_MS, easing: 'linear', fill: 'both' };
    const bar = $('.tg__bar', tabs[current]);
    timers = [
      arcs.r?.animate(
        [{ transform: 'rotate(-45deg)' }, { transform: 'rotate(135deg)', offset: 0.5 }, { transform: 'rotate(135deg)' }],
        timing,
      ),
      arcs.l?.animate(
        [{ transform: 'rotate(-45deg)' }, { transform: 'rotate(-45deg)', offset: 0.5 }, { transform: 'rotate(135deg)' }],
        timing,
      ),
      bar?.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], timing),
    ].filter(Boolean);
    const last = timers[timers.length - 1];
    last?.finished.then(
      () => select(nextIndex(current, total), false),
      () => {}, // отменён — новый выбор уже запустил свой отсчёт
    );
    sync();
  }

  // идёт только в окне, на видимой вкладке, без курсора над блоком и фокуса внутри
  function sync() {
    const run = state.inView && !state.hidden && !state.hovered && !state.focused;
    for (const a of timers) {
      if (run && a.playState === 'paused') a.play();
      if (!run && a.playState === 'running') a.pause();
    }
  }

  /* ——— смена пункта ——— */
  function paint(i, animate) {
    const name = item(i, 'name');
    const text = item(i, 'text');
    const more = item(i, 'more');
    const num = item(i, 'num');
    if (animate) {
      flipSwap(out.name, name);
      flipSwap(out.text, text);
      flipSwap(out.more, more);
      rollTo(out.num, num);
    } else {
      out.name.textContent = name;
      out.text.textContent = text;
      out.more.textContent = more;
      out.num.textContent = num;
    }
  }

  function select(i, manual, focus = false) {
    if (i < 0 || i >= total) return;
    panel.setAttribute('aria-live', manual ? 'polite' : 'off');
    const changed = i !== current;
    current = i;
    tabs.forEach((tab, n) => {
      const on = n === i;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    nodes.forEach((node, n) => node.classList.toggle('is-active', n === i));
    panel.setAttribute('aria-labelledby', tabs[i].id);
    if (focus) tabs[i].focus();
    if (changed) {
      turn = turnTo(turn, i);
      dial.style.setProperty('--tg-turn', `${turn}deg`);
      paint(i, true);
    }
    startTimers();
  }

  /* ——— ввод ——— */
  tabs.forEach((tab, i) => on(tab, 'click', () => select(i, true)));
  nodes.forEach((node, i) => on(node, 'click', () => select(i, true)));
  for (const tab of tabs) {
    on(tab, 'keydown', (e) => {
      let to = null;
      if (e.key in KEYS) to = (current + KEYS[e.key] + total) % total;
      if (e.key === 'Home') to = 0;
      if (e.key === 'End') to = total - 1;
      if (to === null) return;
      e.preventDefault();
      select(to, true, true);
    });
  }

  on(root, 'pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    state.hovered = true;
    sync();
  });
  on(root, 'pointerleave', () => {
    state.hovered = false;
    sync();
  });
  // фокус с клавиатуры останавливает листание; кнопка, получившая фокус от клика мышью, — нет (иначе после клика
  // листание стояло бы, пока не кликнут мимо блока)
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
  startTimers();
}
