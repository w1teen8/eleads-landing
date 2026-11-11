// 13 FAQ (T37, вариант A «переписка»): вопросы из src/data/faq.json — кнопки-вкладки слева, справа общий телефон
// с чатом Володимира. Выбор вопроса «отправляет» его сообщением посетителя, в шапке и ленте — «друкує…» (TYPING_MS),
// затем приходит ответ; переписка копится, старые сообщения уезжают вверх за край экрана (как в Telegram).
// Вопросы сами не перебираются (2026-11-11: «пускай оно само не пишет вопросы и не выдает ответы»): вопрос уходит
// в чат только по клику или клавише. AUTO = false выключает прежнее автолистание раз в STEP_MS.
// reduced-motion / ?nomotion=1 — первый вопрос и ответ сразу, без автолистания, смены мгновенные.
// Только transform и opacity (Web Animations API).
import { $, el, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, getLang, onLangChange } from '../core/i18n.js';
import { reduced, scrollToTarget } from '../core/motion.js';
import { pickText, isTbd, nextIndex } from './faq-model.js';
import data from '../data/faq.json';

/** Автолистание вопросов: выключено по просьбе пользователя. */
export const AUTO = false;
/** Шаг автолистания, мс (если AUTO включат снова). */
export const STEP_MS = 8000;
/** Сколько Володимир «друкує» перед ответом, мс. */
export const TYPING_MS = 700;
/** Сколько сообщений держать в ленте (старые всё равно за краем экрана). */
const KEEP = 8;

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
/** Где вместо телефона — выпадающий список. */
export const ACCORDION_MEDIA = '(max-width: 899px), (orientation: portrait)';
const KEYS = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
const ARROW =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>';

export function init(root) {
  accentTitles(root);
  const list = $('[data-faq-list]', root);
  const feed = $('[data-faq-feed]', root);
  const thread = $('[data-faq-thread]', root);
  const status = $('[data-faq-status]', root);
  const face = $('[data-faq-avatar] picture', root);
  const items = Array.isArray(data?.items) ? data.items : [];
  if (!list || !feed || !thread || !items.length) return;
  // статус в шапке переключает этот модуль («у мережі» ↔ «друкує…»), i18n не должен его перезаписывать
  status?.removeAttribute('data-i18n');

  const tabs = items.map((item, i) => {
    const bar = el('span', { class: 'faq__bar', attrs: { 'aria-hidden': 'true' } });
    const text = el('span', { class: 'faq__q-text' });
    const btn = el(
      'button',
      {
        class: 'faq__q',
        attrs: { type: 'button', role: 'tab', id: `faq-q-${i}`, 'aria-controls': feed.id, 'aria-selected': 'false', tabindex: '-1' },
      },
      text,
      el('span', { class: 'faq__mark', html: ARROW, attrs: { 'aria-hidden': 'true' } }),
      bar,
    );
    // ответ под вопросом — для узкого экрана (выпадающий список вместо телефона)
    const ans = el('div', { class: 'faq__a', attrs: { id: `faq-a-${i}`, hidden: '' } }, el('p', { class: 'faq__a-text' }));
    list.append(el('li', { attrs: { role: 'presentation' } }, btn, ans));
    return { item, btn, text, bar, ans };
  });

  // телефон: «может сделать просто выпадающий список? А то каждый раз перекидывает на телефон» — вопрос раскрывает
  // ответ прямо под собой, телефон с чатом скрыт (CSS по классу is-accordion)
  const narrow = window.matchMedia?.(ACCORDION_MEDIA);
  const accordion = () => Boolean(narrow?.matches);
  const mode = () => root.classList.toggle('is-accordion', accordion());
  mode();
  narrow?.addEventListener?.('change', mode);
  const toggle = (i) => {
    const { btn, ans } = tabs[i];
    const open = ans.hidden;
    ans.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  };

  let current = -1;
  let timer = null; // полоска отсчёта (WAAPI) — её конец выбирает следующий вопрос
  let pending = null; // { id, finish } — ответ, который ещё «печатается»
  const state = { hovered: false, focused: false, inView: false, hidden: document.hidden };

  const lang = () => getLang();
  const question = (i) => pickText(items[i].q, lang());
  const answer = (i) => pickText(items[i].a, lang());

  /* ——— сообщения ——— */
  const outMsg = (i) => el('p', { class: 'phone__msg phone__msg--out' }, el('span', { class: 'phone__msg-text', text: question(i) }));

  function inMsg(i) {
    const text = answer(i);
    const body = el('span', { class: `phone__msg-text${isTbd(text, t('common.tbd')) ? ' is-tbd' : ''}`, text });
    const bubble = el('p', { class: 'phone__msg phone__msg--in' }, el('span', { class: 'phone__msg-name', text: t('faq.chat.short') }), body);
    const avatar = el('span', { class: 'faq__face', attrs: { 'aria-hidden': 'true' } });
    if (face) avatar.append(face.cloneNode(true));
    return el('div', { class: 'faq__in' }, avatar, bubble);
  }

  const typingMsg = () =>
    el('div', { class: 'phone__typing', attrs: { 'aria-hidden': 'true' } }, el('i'), el('i'), el('i'));

  const setStatus = (typing) => {
    if (status) status.textContent = t(typing ? 'faq.chat.typing' : 'faq.chat.status');
  };

  // новое сообщение: лента подъезжает вверх на его высоту, сам пузырь «выпрыгивает» из своего угла
  function push(node) {
    thread.append(node);
    const extra = [...thread.children].slice(0, -KEEP);
    if (!reduced && typeof node.animate === 'function') {
      const gap = parseFloat(getComputedStyle(thread).rowGap) || 0;
      const shift = node.getBoundingClientRect().height + gap;
      thread.animate([{ transform: `translateY(${shift}px)` }, { transform: 'translateY(0)' }], { duration: 420, easing: EASE });
      // точка роста пузыря — его нижний угол (transform-origin в phone.css)
      node.animate([{ opacity: 0, transform: 'translateY(30%) scale(0.86)' }, { opacity: 1, transform: 'none' }], {
        duration: 420,
        easing: EASE,
      });
    }
    for (const old of extra) old.remove();
  }

  function finishPending() {
    if (!pending) return;
    const { id, i, typing } = pending;
    clearTimeout(id);
    pending = null;
    typing.remove();
    thread.append(inMsg(i));
    setStatus(false);
  }

  /** Отправить вопрос i в чат: сообщение посетителя → «друкує…» → ответ. */
  function send(i, animate) {
    finishPending();
    if (!animate) {
      thread.replaceChildren(outMsg(i), inMsg(i));
      setStatus(false);
      return;
    }
    push(outMsg(i));
    const typing = typingMsg();
    const id = setTimeout(() => {
      pending = null;
      typing.remove();
      push(inMsg(i));
      setStatus(false);
    }, TYPING_MS + 280);
    pending = { id, i, typing };
    setTimeout(() => {
      if (pending?.typing !== typing) return;
      push(typing);
      setStatus(true);
    }, 280);
  }

  /* ——— отсчёт до следующего вопроса ——— */
  function startTimer() {
    timer?.cancel();
    timer = null;
    if (!AUTO) return; // автолистание выключено
    if (reduced || typeof tabs[current].bar.animate !== 'function') return;
    timer = tabs[current].bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
      duration: STEP_MS,
      easing: 'linear',
      fill: 'both',
    });
    timer.finished.then(
      () => select(nextIndex(current, tabs.length), false),
      () => {}, // отменён — новый выбор запустил свой отсчёт
    );
    sync();
  }

  // идёт только в окне, на видимой вкладке, без курсора над списком и фокуса с клавиатуры в нём
  function sync() {
    if (!timer) return;
    const run = state.inView && !state.hidden && !state.hovered && !state.focused;
    if (run && timer.playState === 'paused') timer.play();
    if (!run && timer.playState === 'running') timer.pause();
  }

  function select(i, manual, focus = false, animate = !reduced) {
    if (i < 0 || i >= tabs.length) return;
    const changed = i !== current;
    current = i;
    tabs.forEach(({ btn }, n) => {
      btn.setAttribute('aria-selected', String(n === i));
      btn.tabIndex = n === i ? 0 : -1;
    });
    feed.setAttribute('aria-labelledby', tabs[i].btn.id);
    feed.setAttribute('aria-live', manual ? 'polite' : 'off');
    if (focus) tabs[i].btn.focus();
    if (changed) send(i, animate);
    startTimer();
  }

  /* ——— ввод ——— */
  // узкий экран: телефон под списком — после тапа по вопросу докрутить к нему, если ответ не виден
  const phone = feed.closest('.phone');
  const wide = window.matchMedia('(min-width: 900px) and (orientation: landscape)');
  const showPhone = () => {
    if (wide.matches || !phone) return;
    const r = phone.getBoundingClientRect();
    if (r.bottom > window.innerHeight) scrollToTarget(phone, { offset: Math.min(0, r.height + 12 - window.innerHeight) });
  };

  tabs.forEach(({ btn }, i) => {
    on(btn, 'click', () => {
      if (accordion()) return toggle(i);
      select(i, true);
      showPhone();
    });
    on(btn, 'keydown', (e) => {
      let to = null;
      if (e.key in KEYS) to = (current + KEYS[e.key] + tabs.length) % tabs.length;
      if (e.key === 'Home') to = 0;
      if (e.key === 'End') to = tabs.length - 1;
      if (to === null) return;
      e.preventDefault();
      select(to, true, true);
    });
  });

  // пауза — только пока курсор на самом списке вопросов (не на всём блоке)
  on(list, 'pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    state.hovered = true;
    sync();
  });
  on(list, 'pointerleave', () => {
    state.hovered = false;
    sync();
  });
  const keyboardFocus = (node) => {
    try {
      return Boolean(node?.matches(':focus-visible'));
    } catch {
      return true;
    }
  };
  on(list, 'focusin', (e) => {
    state.focused = keyboardFocus(e.target);
    sync();
  });
  on(list, 'focusout', (e) => {
    state.focused = list.contains(e.relatedTarget) && keyboardFocus(e.relatedTarget);
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
    ).observe(root);
  } else {
    state.inView = true;
  }

  /* ——— язык: подписи вопросов и переписка заново, без анимации ——— */
  const paint = () => {
    for (const { text, item, ans } of tabs) {
      text.textContent = pickText(item.q, lang());
      ans.firstChild.textContent = pickText(item.a, lang());
    }
    if (current >= 0) send(current, false);
  };
  onLangChange(paint);

  // первый вопрос и ответ видны сразу (без «печати»): блок не пустой, пока до него докручивают
  for (const { text, item, ans } of tabs) {
    text.textContent = pickText(item.q, lang());
    ans.firstChild.textContent = pickText(item.a, lang());
  }
  select(0, false, false, false);
}
