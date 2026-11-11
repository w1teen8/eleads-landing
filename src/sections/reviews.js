// 10 Відгуки (T35, H48; T42 — правка клиента, reference/client-feedback/page-10.png): кружки, как видео-сообщения
// Telegram. Облик — «Рев С» (reference/run3/reviews-C-chosen.png). Заголовок «Що говорять підприємці»; фото и текста
// засновника больше нет: слева большой круг с жёлто-оранжевым кольцом — видео-отзыв выбранного клиента
// (reviews.items.*.video, файл в public/video/reviews/; пусто — аватар клиента и «відео-відгук скоро»). Клик по кругу
// или по кнопке ▶: без звука → со звуком → пауза (как видео-кружок в Telegram). Справа — ряд круглых аватаров клиентов
// (вкладки), под ним отзыв выбранного и цифры. Отзывы сами листаются раз в STEP_MS (как диск блока 09): вокруг
// выбранного кружка кольцо прогресса — две половины, крутятся transform-ом (Web Animations API); конец — следующий
// отзыв. Пауза — пока курсор на самом кружке, на фокусе с клавиатуры, вне окна, на скрытой вкладке и пока играет
// видео-отзыв. Клик, наведение мышью, стрелки — выбор и новый отсчёт; смена текста — табло (flipSwap). Отзыв
// объявляется скринридером только при ручном выборе (aria-live). reduced-motion / ?nomotion=1 — без автолистания.
// Аватар — фото кейса (reviews.items.*.case → cases.json), иначе первая буква имени.
import { $, $$, el, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, onLangChange } from '../core/i18n.js';
import { reduced } from '../core/motion.js';
import { flipSwap } from '../core/motion-kit.js';
import { publicUrl } from '../core/public-url.js';
import { avatarPath, initial } from './cases.js';
import { reviewAvatar, reviewVideo, isTbd, STEP_MS } from './reviews-model.js';
import { nextIndex } from './targeting-model.js';
import data from '../data/cases.json';

const KEYS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
const HOVER_MS = 140;

export function init(root) {
  accentTitles(root);
  initReviews(root);
}

const item = (i, f) => t(`reviews.items.${i}.${f}`);
const avatarOf = (i) => reviewAvatar(item(i, 'case'), data.cases, (id, retina) => publicUrl(avatarPath(id, retina)));

/* ——— большой круг: аватар выбранного клиента и его видео-отзыв, когда есть файл ——— */
function videoStage(root, onPlaying) {
  const circle = $('[data-rv-circle]', root);
  const screen = $('[data-rv-screen]', root);
  const button = $('[data-rv-play]', root);
  const soon = $('[data-rv-soon]', root);
  const letter = $('[data-rv-big-letter]', root);
  if (!circle || !screen || !button) return { show() {}, pause() {}, sync() {} };
  let index = 0;
  let video = null;
  let img = null;

  const file = () => reviewVideo(item(index, 'video'));
  const playing = () => Boolean(video && !video.paused);
  // состояние кнопки: idle — ▶, muted — «включить звук», sound — пауза (иконку выбирает CSS по data-video)
  const label = () => {
    let state = 'idle';
    if (playing()) state = video.muted ? 'muted' : 'sound';
    circle.dataset.video = state;
    button.setAttribute('aria-label', t(`reviews.player.${{ idle: 'play', muted: 'sound', sound: 'pause' }[state]}`));
    onPlaying(playing());
  };

  function stop() {
    if (!video) return;
    video.pause();
    video.remove();
    video = null;
    circle.classList.remove('is-playing');
    label();
  }

  // аватар клиента: фото кейса (крупный файл — круг большой), без фото и при сбое — буква
  function paintAvatar() {
    const found = avatarOf(index);
    if (letter) letter.textContent = initial(item(index, 'name'));
    circle.style.setProperty('--rv-accent', found?.accent || '');
    const src = found ? (found.srcset ? publicUrl(avatarPath(String(item(index, 'case')).trim(), true)) : found.src) : '';
    if (img && img.dataset.src === src) return;
    img?.remove();
    img = null;
    screen.classList.remove('has-image');
    if (!src) return;
    const next = el('img', { class: 'reviews__shot', attrs: { src, alt: '', decoding: 'async' }, dataset: { src } });
    on(next, 'load', () => img === next && screen.classList.add('has-image'), { once: true });
    on(next, 'error', () => next.remove(), { once: true });
    img = next;
    screen.prepend(next);
  }

  // вкладка скрыта — видео на паузе (кадр остаётся в круге, следующий клик продолжит)
  function pause() {
    if (playing()) video.pause();
  }

  function sync() {
    const has = Boolean(file());
    button.hidden = !has;
    circle.classList.toggle('has-video', has);
    if (soon) soon.hidden = has;
    paintAvatar();
    label();
  }

  function show(i) {
    if (i === index && video) return;
    stop();
    index = i;
    sync();
  }

  function toggle() {
    if (button.hidden) return;
    if (!video) {
      video = el('video', { class: 'reviews__video', attrs: { src: publicUrl(file()), playsinline: true, preload: 'auto' } });
      video.muted = true; // как кружок в Telegram: сначала без звука
      on(video, 'ended', () => {
        circle.classList.remove('is-playing');
        video.muted = true;
        label();
      });
      on(video, 'pause', label);
      screen.append(video);
    }
    if (video.paused) {
      circle.classList.add('is-playing');
      video.play()?.catch?.(() => {
        circle.classList.remove('is-playing');
        label();
      });
    } else if (video.muted) {
      video.muted = false;
    } else {
      video.pause();
      circle.classList.remove('is-playing');
    }
    label();
  }

  on(button, 'click', (e) => {
    e.stopPropagation();
    toggle();
  });
  on(screen, 'click', toggle);
  return { show, pause, sync };
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
  const state = { hovered: false, focused: false, inView: false, hidden: document.hidden, playing: false };
  if (reduced) root.classList.add('is-static');

  // пока играет видео-отзыв, листание стоит: следующий отзыв не сменит круг посреди видео
  const stage = videoStage(root, (playing) => {
    if (state.playing === playing) return;
    state.playing = playing;
    sync();
  });

  /* аватары: фото кейса через publicUrl, цвет бренда — инлайн-переменная; без фото и при сбое — буква */
  tabs.forEach((tab, i) => {
    const box = $('[data-rv-avatar]', tab);
    const found = avatarOf(i);
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

  // идёт только в окне, на видимой вкладке, без курсора на кружке, без фокуса с клавиатуры и пока видео не играет
  function sync() {
    const run = state.inView && !state.hidden && !state.hovered && !state.focused && !state.playing;
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
      stage.show(i);
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
    if (state.hidden) stage.pause();
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
    stage.sync();
  });
  paintLetters();
  paint(current, false);
  stage.show(current);

  if (reduced) return; // без автолистания: выбор только кликом и клавишами
  startTimers();
}
