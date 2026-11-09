// 04 Як виглядає реклама (T21; T27 — вкладки форматов и телефон с Telegram). Переходов по прокрутке нет (H11): блок
// идёт за предыдущим обычной прокруткой, содержимое видно сразу.
// Вкладки (role=tablist): наведение мышью, клик/тап, стрелки, Home/End — выбирают формат; экран телефона меняет
// панель коротким сдвигом с проявлением (SWAP_MS, только transform/opacity — реакция на действие, в духе «табло»
// motion-kit → flipSwap). При reduced-motion / ?nomotion=1 — мгновенно.
// Телефон не кликабелен: лайтбокса нет (правка пользователя).
import { $, $$, on } from '../core/dom.js';
import { onLangChange } from '../core/i18n.js';
import { accentTitles } from '../core/title-accent.js';
import { reduced } from '../core/motion.js';

/** Смена экрана телефона — как смена экрана в Telegram/iOS: мягко, с перекрытием панелей (кроссфейд). */
export const SWAP_MS = 650;
const SWAP_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // = --ease-out
const SWAP_SHIFT = 9; // % ширины: лента уезжает в сторону порядка вкладок, новая въезжает с противоположной

/* ——— вкладки форматов и панели экрана ——— */
function initTabs(root) {
  const bar = $('[role="tablist"]', root);
  const tabs = $$('[data-formats-tab]', root);
  const panels = $$('[data-formats-panel]', root);
  const note = $('[data-formats-note]', root);
  if (!bar || !tabs.length || !panels.length) return;
  const canAnimate = !reduced && typeof Element.prototype.animate === 'function';
  // панель → { dir: 'in' | 'out', anims } — текущая смена; при быстром переключении анимация разворачивается
  // назад (reverse), а не стартует заново — без хвостов и чёрных кадров
  const moving = new Map();
  const index = (panel) => panels.indexOf(panel);
  let shownIndex = Math.max(0, index(panels.find((p) => !p.hidden)));

  function settle(panel) {
    const state = moving.get(panel);
    if (!state) return;
    moving.delete(panel);
    if (state.dir === 'out') panel.hidden = true;
    for (const anim of state.anims) anim.cancel();
    panel.style.zIndex = '';
  }

  function watch(panel, state) {
    moving.set(panel, state);
    Promise.all(state.anims.map((anim) => anim.finished)).then(() => settle(panel), () => {});
  }

  /** Шапка чата и строка состояния на месте: двигается только лента, низ и подпись шапки меняются кроссфейдом. */
  function frames(panel, dir, sign) {
    const timing = { duration: SWAP_MS, easing: SWAP_EASE, fill: 'both' };
    const feed = $('.phone__feed', panel);
    const bottom = $('.phone__bottom', panel);
    const chat = $('.phone__chat', panel);
    const fade = dir === 'in' ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
    const slide =
      dir === 'in'
        ? [{ transform: `translateX(${-sign * SWAP_SHIFT}%)`, opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }]
        : [{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${sign * SWAP_SHIFT}%)`, opacity: 0 }];
    const anims = [];
    if (feed) anims.push(feed.animate(slide, timing));
    if (bottom) anims.push(bottom.animate(fade, timing));
    // уходящая шапка остаётся непрозрачной под въезжающей — название не мигает, меняется только подпись
    if (chat && dir === 'in') anims.push(chat.animate(fade, timing));
    return anims;
  }

  function show(next) {
    const to = index(next);
    const sign = to >= shownIndex ? -1 : 1; // 01→03 — влево, 03→01 — вправо
    shownIndex = to;
    for (const panel of panels) {
      if (panel === next || panel.hidden) continue;
      if (!canAnimate) {
        panel.hidden = true;
        continue;
      }
      const state = moving.get(panel);
      if (state?.dir === 'out') continue;
      if (state) {
        // ещё въезжала — разворачиваем обратно
        state.dir = 'out';
        for (const anim of state.anims) anim.reverse();
        continue;
      }
      watch(panel, { dir: 'out', anims: frames(panel, 'out', sign) });
    }
    const state = moving.get(next);
    if (state) {
      if (state.dir === 'out') {
        state.dir = 'in';
        for (const anim of state.anims) anim.reverse();
      }
      return;
    }
    if (!next.hidden) return;
    next.hidden = false;
    if (!canAnimate) return;
    next.style.zIndex = '1'; // въезжающая — поверх уходящей: кроссфейд низа и подписи шапки
    watch(next, { dir: 'in', anims: frames(next, 'in', sign) });
  }

  const tabOf = (id) => tabs.find((tab) => tab.dataset.formatsTab === id);
  const current = () => tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
  const describe = () => {
    if (note) note.textContent = $('.formats__text', current())?.textContent || '';
  };

  function select(id, { focus = false } = {}) {
    for (const tab of tabs) {
      const active = tab.dataset.formatsTab === id;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus({ preventScroll: true });
    }
    bar.dataset.active = id;
    const next = panels.find((panel) => panel.dataset.formatsPanel === id);
    if (next) show(next);
    describe();
  }

  tabs.forEach((tab, i) => {
    const id = tab.dataset.formatsTab;
    on(tab, 'click', () => select(id));
    // наведение переключает только у мыши: палец на сенсорном экране — это клик
    on(tab, 'pointerenter', (e) => {
      if (e.pointerType === 'mouse') select(id);
    });
    on(tab, 'keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        select(tabs[e.key === 'Home' ? 0 : tabs.length - 1].dataset.formatsTab, { focus: true });
      } else if (keys[e.key]) {
        e.preventDefault();
        select(tabs[(i + keys[e.key] + tabs.length) % tabs.length].dataset.formatsTab, { focus: true });
      }
    });
  });

  select((tabOf(bar.dataset.active) || current()).dataset.formatsTab);
  onLangChange(describe);
}

export function init(root) {
  accentTitles(root);
  initTabs(root);
}
