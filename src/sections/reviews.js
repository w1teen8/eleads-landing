// 10 Відгуки + засновник (T35, H48): кружки, как видео-сообщения Telegram. Выбор пользователя: «Рев С»
// (reference/run3/reviews-C-chosen.png). Слева Володимир в большом круге с жёлто-оранжевым кольцом; справа — ряд круглых
// аватаров клиентов (вкладки), под ним отзыв выбранного и цифры. Отзывы сами листаются раз в STEP_MS (как диск блока 09):
// вокруг выбранного кружка кольцо прогресса — две половины, крутятся transform-ом (Web Animations API); конец — следующий
// отзыв. Пауза — только пока курсор на самом кружке (блок во весь экран: пауза на всём блоке почти всегда стояла бы), на
// фокусе с клавиатуры, вне окна и на скрытой вкладке. Клик, наведение мышью, стрелки — выбор и новый отсчёт; смена текста —
// табло (flipSwap). Отзыв объявляется скринридером только при ручном выборе (aria-live). reduced-motion / ?nomotion=1 —
// без автолистания. Аватар — фото кейса (reviews.items.*.case → cases.json), иначе первая буква имени.
// Круг засновника: если в founder.video есть файл — кнопка ▶, по клику видео без звука, второй клик — со звуком.
import { $, $$, el, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, onLangChange } from '../core/i18n.js';
import { reduced } from '../core/motion.js';
import { flipSwap } from '../core/motion-kit.js';
import { publicUrl } from '../core/public-url.js';
import { avatarPath, initial } from './cases.js';
import { reviewAvatar, isTbd, STEP_MS } from './reviews-model.js';
import { nextIndex } from './targeting-model.js';
import data from '../data/cases.json';

const KEYS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
const HOVER_MS = 140;

export function init(root) {
  accentTitles(root);
  initFounder(root);
  initReviews(root);
}

/* ——— засновник: видео-кружок, когда есть файл ——— */
function initFounder(root) {
  const circle = $('[data-founder-circle]', root);
  const button = $('[data-founder-play]', root);
  const figure = circle && $('.founder__photo', circle);
  if (!circle || !button || !figure) return;
  let video = null;

  const file = () => String(t('founder.video') ?? '').trim();
  // состояние кнопки: idle — ▶, muted — «включить звук», sound — пауза (иконку выбирает CSS по data-video)
  const label = () => {
    let state = 'idle';
    if (video && !video.paused) state = video.muted ? 'muted' : 'sound';
    circle.dataset.video = state;
    button.setAttribute('aria-label', t({ idle: 'founder.play', muted: 'founder.sound', sound: 'founder.pause' }[state]));
  };
  const sync = () => {
    const has = Boolean(file()) && file() !== 'founder.video';
    button.hidden = !has;
    circle.classList.toggle('has-video', has);
    label();
  };

  function toggle() {
    if (button.hidden) return;
    if (!video) {
      video = el('video', { class: 'founder__video', attrs: { src: publicUrl(file()), playsinline: true, preload: 'auto' } });
      video.muted = true; // как кружок в Telegram: сначала без звука
      on(video, 'ended', () => {
        circle.classList.remove('is-playing');
        video.muted = true;
        label();
      });
      figure.append(video);
    }
    if (video.paused) {
      circle.classList.add('is-playing');
      video.play()?.catch?.(() => circle.classList.remove('is-playing'));
    } else if (video.muted) {
      video.muted = false;
    } else {
      video.pause();
      circle.classList.remove('is-playing');
    }
    label();
  }

  on(button, 'click', toggle);
  on(figure, 'click', toggle);
  onLangChange(sync);
  sync();
}

/* ——— отзывы: кружки-вкладки с автолистанием ——— */
function initReviews(root) {
  const list = $('[data-rv-list]', root);
  const panel = $('#rv-panel', root);
  if (!list || !panel) return;
  const tabs = $$('[data-rv-tab]', root);
  const total = tabs.length;
  if (!total) return;
  const out = { name: $('[data-rv-name]', panel), role: $('[data-rv-role]', panel), quote: $('[data-rv-quote]', panel) };
  // текст выбранного отзыва пишет этот модуль: i18n при смене языка не должен возвращать первый отзыв
  for (const node of Object.values(out)) node?.removeAttribute('data-i18n');

  let current = 0;
  let timers = [];
  let hoverTimer = 0;
  const state = { hovered: false, focused: false, inView: false, hidden: document.hidden };
  if (reduced) root.classList.add('is-static');

  const item = (i, f) => t(`reviews.items.${i}.${f}`);

  /* аватары: фото кейса через publicUrl, цвет бренда — инлайн-переменная; без фото и при сбое — буква */
  tabs.forEach((tab, i) => {
    const box = $('[data-rv-avatar]', tab);
    const found = reviewAvatar(item(i, 'case'), data.cases, (id, retina) => publicUrl(avatarPath(id, retina)));
    if (!box || !found) return;
    if (found.accent) tab.style.setProperty('--rv-accent', found.accent);
    const img = el('img', { class: 'reviews__img', attrs: { src: found.src, srcset: found.srcset, alt: '', decoding: 'async' } });
    on(img, 'load', () => box.classList.add('has-image'), { once: true });
    on(img, 'error', () => img.remove(), { once: true });
    box.append(img);
  });
  const paintLetters = () => {
    tabs.forEach((tab, i) => {
      const letter = $('[data-rv-letter]', tab);
      if (letter) letter.textContent = initial(item(i, 'name'));
    });
  };

  /* таймер: кольцо из двух половин вокруг выбранного кружка; конец — следующий отзыв */
  const stopTimers = () => {
    for (const a of timers) a.cancel();
    timers = [];
  };

  function startTimers() {
    stopTimers();
    if (reduced || typeof list.animate !== 'function') return;
    const timing = { duration: STEP_MS, easing: 'linear', fill: 'both' };
    const r = $('.reviews__arc--r', tabs[current]);
    const l = $('.reviews__arc--l', tabs[current]);
    timers = [
      r?.animate([{ transform: 'rotate(-45deg)' }, { transform: 'rotate(135deg)', offset: 0.5 }, { transform: 'rotate(135deg)' }], timing),
      l?.animate([{ transform: 'rotate(-45deg)' }, { transform: 'rotate(-45deg)', offset: 0.5 }, { transform: 'rotate(135deg)' }], timing),
    ].filter(Boolean);
    timers[timers.length - 1]?.finished.then(
      () => select(nextIndex(current, total), false),
      () => {}, // отменён — новый выбор уже запустил свой отсчёт
    );
    sync();
  }

  // идёт только в окне, на видимой вкладке, без курсора на кружке и без фокуса с клавиатуры
  function sync() {
    const run = state.inView && !state.hidden && !state.hovered && !state.focused;
    for (const a of timers) {
      if (run && a.playState === 'paused') a.play();
      if (!run && a.playState === 'running') a.pause();
    }
  }

  /* смена отзыва */
  function paint(i, animate) {
    const text = { name: item(i, 'name'), role: item(i, 'role'), quote: item(i, 'quote') };
    out.role?.classList.toggle('is-tbd', isTbd(text.role));
    out.quote?.classList.toggle('is-tbd', isTbd(text.quote));
    for (const [f, node] of Object.entries(out)) {
      if (!node) continue;
      if (animate) flipSwap(node, text[f]);
      else node.textContent = text[f];
    }
  }

  // выбранный кружок виден в ряду (на телефоне ряд прокручивается): двигается только ряд, не страница
  function bringIntoRow(tab) {
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    if (left >= list.scrollLeft && right <= list.scrollLeft + list.clientWidth) return;
    list.scrollTo({ left: Math.max(0, left - (list.clientWidth - tab.offsetWidth) / 2), behavior: reduced ? 'auto' : 'smooth' });
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
    if (changed) {
      paint(i, true);
      bringIntoRow(tabs[i]);
    }
    startTimers();
  }

  /* ввод */
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
  });

  // пауза только пока курсор на самом кружке; наведение мышью ещё и выбирает его (с короткой задержкой — проходящий мимо
  // курсор отзыв не меняет)
  for (const tab of tabs) {
    on(tab, 'pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      state.hovered = true;
      sync();
      clearTimeout(hoverTimer);
      const i = tabs.indexOf(tab);
      if (i !== current) hoverTimer = setTimeout(() => select(i, true), HOVER_MS);
    });
    on(tab, 'pointerleave', () => {
      clearTimeout(hoverTimer);
      state.hovered = false;
      sync();
    });
  }
  // фокус с клавиатуры останавливает листание; кружок, получивший фокус от клика мышью, — нет
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
    ).observe(list);
  } else {
    state.inView = true;
  }

  onLangChange(() => {
    paintLetters();
    paint(current, false);
  });
  paintLetters();
  paint(current, false);

  if (reduced) return; // без автолистания: выбор только кликом и клавишами
  startTimers();
}
