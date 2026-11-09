// 04 Як виглядає реклама (T21; T27 — вкладки форматов и телефон с Telegram). Переходов по прокрутке нет (H11): блок
// идёт за предыдущим обычной прокруткой, содержимое видно сразу.
// Вкладки (role=tablist): наведение мышью, клик/тап, стрелки, Home/End — выбирают формат; экран телефона меняет
// панель коротким сдвигом с проявлением (SWAP_MS, только transform/opacity — реакция на действие, в духе «табло»
// motion-kit → flipSwap). При reduced-motion / ?nomotion=1 — мгновенно.
// Клик по экрану открывает макет открытой панели крупно в лайтбоксе (нативный <dialog>): Esc, клик вне, кнопка;
// фокус возвращается на открывавшую кнопку; фон не скроллится (lockScroll — Lenis на паузе).
import { $, $$, on, trapFocus } from '../core/dom.js';
import { onLangChange } from '../core/i18n.js';
import { accentTitles } from '../core/title-accent.js';
import { lockScroll, reduced } from '../core/motion.js';

const CLOSE_MS = 240;
/** Смена экрана телефона: короче «табло» (600 мс) — экран отвечает на наведение сразу. */
export const SWAP_MS = 350;
const SWAP_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // = --ease-out
const SWAP_SHIFT = '6%';

/* ——— вкладки форматов и панели экрана ——— */
function initTabs(root) {
  const bar = $('[role="tablist"]', root);
  const tabs = $$('[data-formats-tab]', root);
  const panels = $$('[data-formats-panel]', root);
  const note = $('[data-formats-note]', root);
  if (!bar || !tabs.length || !panels.length) return;
  const leaving = new Map(); // панель → анимация ухода (чтобы быстрый пробег мышью не оставлял полуспрятанных панелей)

  function hideLater(panel) {
    if (panel.hidden || leaving.has(panel)) return;
    if (reduced || typeof panel.animate !== 'function') {
      panel.hidden = true;
      return;
    }
    const out = panel.animate(
      [{ transform: 'none', opacity: 1 }, { transform: `translateY(-${SWAP_SHIFT})`, opacity: 0 }],
      { duration: SWAP_MS, easing: SWAP_EASE, fill: 'both' },
    );
    leaving.set(panel, out);
    out.finished.then(
      () => {
        if (leaving.get(panel) !== out) return;
        leaving.delete(panel);
        panel.hidden = true;
        out.cancel();
      },
      () => {},
    );
  }

  function show(next) {
    for (const panel of panels) if (panel !== next) hideLater(panel);
    const back = leaving.get(next);
    if (back) {
      // панель ещё уходила — возвращаем её на место без повторного въезда
      leaving.delete(next);
      back.cancel();
      return;
    }
    if (!next.hidden) return;
    next.hidden = false;
    if (reduced || typeof next.animate !== 'function') return;
    next.animate(
      [{ transform: `translateY(${SWAP_SHIFT})`, opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: SWAP_MS, easing: SWAP_EASE },
    );
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

/* ——— лайтбокс ——— */
function initLightbox(root) {
  const dialog = $('[data-lightbox]', root);
  const stage = $('[data-lightbox-stage]', root);
  if (!dialog || !stage) return;
  let opener = null;
  let timer = 0;

  function open(button) {
    clearTimeout(timer);
    opener = button;
    // макет открытой панели телефона; без панелей — макет внутри самой кнопки
    const example = $('[data-formats-panel]:not([hidden]) .tg-ad', root) || $('.tg-ad', button);
    if (!example) return;
    stage.replaceChildren(example.cloneNode(true));
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    lockScroll(true);
    requestAnimationFrame(() => dialog.classList.add('is-open'));
    $('[data-lightbox-close]', dialog).focus({ preventScroll: true });
  }

  function close() {
    if (!dialog.open) return;
    dialog.classList.remove('is-open');
    const finish = () => {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      lockScroll(false);
      opener?.focus({ preventScroll: true });
    };
    if (reduced) finish();
    else timer = setTimeout(finish, CLOSE_MS);
  }

  for (const button of $$('[data-lightbox-open]', root)) on(button, 'click', () => open(button));
  on($('[data-lightbox-close]', dialog), 'click', close);
  on(dialog, 'cancel', (e) => {
    e.preventDefault();
    close();
  });
  on(dialog, 'click', (e) => {
    if (e.target === dialog || e.target === stage) close();
  });
  trapFocus(dialog);
}

export function init(root) {
  accentTitles(root);
  initTabs(root);
  initLightbox(root);
}
