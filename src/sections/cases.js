// 06 Кейси — галерея в духе «SHOT AFTER DARK» (Aether): карточки из src/data/cases.json по <template>.
// ≥900px без reduced-motion: сцена закреплена (ScrollTrigger pin + scrub), вертикальная прокрутка двигает
// ленту вбок (translateX), огромное слово «КЕЙСИ» за ней едет медленнее, полоса прогресса растёт scaleX.
// Длина закрепления = на сколько лента шире экрана. Меньше / reduced / без JS — нативный горизонтальный
// свайп со scroll-snap; стрелки ←/→ переводят фокус между карточками.
// Модалка — нативный <dialog>: Esc, клик вне, кнопка; фокус заперт и возвращается на карточку;
// фон не скроллится (lockScroll ставит Lenis на паузу).
import { $, $$, el, on, trapFocus } from '../core/dom.js';
import { t, getLang, onLangChange, applyTranslations } from '../core/i18n.js';
import { lockScroll, reduced, motionReady, refreshMotion, scrollToTarget } from '../core/motion.js';
import { track } from '../core/analytics.js';
import data from '../data/cases.json';

const CARD_FIELDS = ['niche', 'name', 'cpa', 'budget', 'result'];
const MODAL_FIELDS = ['name', 'niche', 'task', 'geo', 'budget', 'result', 'cpa', 'review'];
const CLOSE_MS = 260;
const GALLERY_MEDIA = '(min-width: 900px)';
const WORD_SPEED = 0.38; // слово-фон проходит 38% пути ленты — «едет медленнее»

const text = (value, lang) => (value && typeof value === 'object' ? value[lang] ?? value.ua ?? '' : String(value ?? ''));
const isTbd = (value) => value === t('common.tbd') || value === 'уточнити' || value === 'TBD';

function fill(node, value) {
  if (!node) return;
  node.textContent = value;
  node.classList.toggle('is-tbd', isTbd(value));
}

export function init(root) {
  const grid = $('[data-cases-grid]', root);
  const tpl = $('template[data-case-card]', root);
  const modal = $('[data-case-modal]', root);
  const cases = Array.isArray(data?.cases) ? data.cases : [];
  if (!grid || !tpl || !cases.length) return;

  // карточки создаются один раз; смена языка меняет только тексты (ревил не сбрасывается)
  const cards = cases.map((item, i) => {
    const li = tpl.content.firstElementChild.cloneNode(true);
    applyTranslations(li);
    li.style.setProperty('--i', String(i));
    if (item.featured) li.classList.add('cases__item--featured');
    const num = $('[data-case-num]', li);
    if (num) num.textContent = String(i + 1).padStart(2, '0');
    const button = $('.cases__card', li);
    button.dataset.case = item.id;
    on(button, 'click', () => open(item, button));
    return { item, li };
  });
  grid.replaceChildren(...cards.map((c) => c.li));
  grid.dataset.reveal = 'stagger';
  const galleryApi = gallery(root, grid);

  const paintCards = (lang) => {
    for (const { item, li } of cards) {
      for (const f of CARD_FIELDS) fill($(`[data-f="${f}"]`, li), text(item[f], lang));
    }
  };
  paintCards(getLang());

  /* ——— модалка ——— */
  let current = null;
  let opener = null;
  let closeTimer = 0;

  const paintModal = (item, lang) => {
    for (const f of MODAL_FIELDS) fill($(`[data-m="${f}"]`, modal), text(item[f], lang));
    const list = $('[data-m-list="done"]', modal);
    list?.replaceChildren(
      ...(item.done || []).map((d) => {
        const value = text(d, lang);
        const li = el('li', { class: 'case-modal__done-item' });
        // «Запит клієнта: уточнити» — заглушку внутри строки подсвечиваем
        const tbd = [t('common.tbd'), 'уточнити', 'TBD'].find((w) => value.endsWith(w));
        if (tbd) li.append(value.slice(0, -tbd.length), el('span', { class: 'is-tbd', text: tbd }));
        else li.textContent = value;
        return li;
      }),
    );
    const shot = $('[data-m-shot]', modal);
    if (shot) {
      shot.replaceChildren();
      shot.classList.remove('has-image');
      if (item.screenshot) {
        const img = el('img', {
          attrs: { src: item.screenshot, alt: text(item.name, lang), loading: 'lazy', decoding: 'async' },
        });
        img.addEventListener('load', () => shot.classList.add('has-image'), { once: true });
        img.addEventListener('error', () => img.remove(), { once: true });
        shot.append(img);
      } else {
        shot.append(el('span', { class: 'case-modal__shot-empty', text: t('cases.reviewEmpty') }));
      }
    }
  };

  function open(item, trigger) {
    if (!modal) return;
    clearTimeout(closeTimer);
    current = item;
    opener = trigger;
    paintModal(item, getLang());
    if (!modal.open) {
      if (typeof modal.showModal === 'function') modal.showModal();
      else modal.setAttribute('open', '');
    }
    modal.scrollTop = 0;
    lockScroll(true);
    requestAnimationFrame(() => modal.classList.add('is-open'));
    $('[data-case-close]', modal)?.focus({ preventScroll: true });
    track('case_open', { case: text(item.name, 'ua') });
  }

  function close() {
    if (!modal?.open || !current) return;
    current = null;
    modal.classList.remove('is-open');
    const finish = () => {
      if (typeof modal.close === 'function') modal.close();
      else modal.removeAttribute('open');
      lockScroll(false);
      opener?.focus({ preventScroll: true });
    };
    if (reduced) finish();
    else closeTimer = setTimeout(finish, CLOSE_MS);
  }

  if (modal) {
    on($('[data-case-close]', modal), 'click', close);
    // Esc: свой выход с анимацией вместо мгновенного закрытия
    on(modal, 'cancel', (e) => {
      e.preventDefault();
      close();
    });
    // клик по самому <dialog> (вне панели) — закрыть
    on(modal, 'click', (e) => {
      if (e.target === modal) close();
    });
    // без нативного <dialog> Esc не даёт 'cancel' — закрываем сами
    on(modal, 'keydown', (e) => {
      if (e.key === 'Escape' && !('showModal' in modal)) close();
    });
    // ловушка фокуса: Tab ходит по кругу внутри модалки
    trapFocus(modal);
  }

  onLangChange((lang) => {
    paintCards(lang);
    if (current) paintModal(current, lang);
    galleryApi.refresh();
  });
}

/* ——— галерея ——— */
function gallery(root, trackEl) {
  const stage = $('[data-cases-stage]', root);
  const viewport = $('[data-cases-viewport]', root);
  const word = $('[data-cases-word]', root);
  const head = $('[data-cases-head]', root);
  const bar = $('[data-cases-progress]', root);
  const faces = () => $$('.cases__card', trackEl);
  let pin = null; // ScrollTrigger закреплённой сцены, пока она есть

  // ←/→ — к соседней карточке; Home/End — к крайним
  on(trackEl, 'keydown', (e) => {
    const list = faces();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (to === undefined || to < 0 || to >= list.length) return;
    e.preventDefault();
    list[to].focus({ preventScroll: Boolean(pin) });
    if (!pin) list[to].parentElement.scrollIntoView({ block: 'nearest', inline: 'start', behavior: reduced ? 'auto' : 'smooth' });
  });

  // свайп: полоса прогресса идёт за нативной прокруткой ленты
  let frame = 0;
  const paintSwipe = () => {
    frame = 0;
    if (pin || !bar || !viewport) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    bar.style.transform = `scaleX(${max > 0 ? (viewport.scrollLeft / max).toFixed(4) : 0})`;
  };
  if (viewport) {
    on(viewport, 'scroll', () => {
      if (!frame) frame = requestAnimationFrame(paintSwipe);
    }, { passive: true });
    on(window, 'resize', paintSwipe);
    paintSwipe();
  }

  // закреплённая сцена: фокус Tab на карточке за краем экрана — докручиваем страницу до неё
  on(trackEl, 'focusin', (e) => {
    if (!pin || !viewport) return;
    const item = e.target.closest?.('.cases__item');
    if (!item) return;
    // сцена закреплена: браузер мог сдвинуть клип-вьюпорт к фокусу — возвращаем, ленту двигает только transform
    viewport.scrollLeft = 0;
    const distance = pin.end - pin.start;
    const room = trackEl.scrollWidth - viewport.clientWidth;
    if (distance <= 0 || room <= 0) return;
    // где карточка сейчас на экране (offsetLeft — от .cases__track, у него position: relative)
    const left = item.offsetLeft - pin.progress * room;
    if (left >= 0 && left + item.offsetWidth <= viewport.clientWidth) return;
    const center = item.offsetLeft + item.offsetWidth / 2 - viewport.clientWidth / 2;
    const p = Math.min(1, Math.max(0, center / room));
    scrollToTarget(pin.start + p * distance, { immediate: true });
  });

  if (stage && viewport) {
    motionReady().then((api) => {
      if (!api) return;
      const { gsap } = api;
      gsap.matchMedia().add(GALLERY_MEDIA, () => {
        root.classList.add('is-pinned');
        viewport.scrollLeft = 0;
        const distance = () => Math.max(0, trackEl.scrollWidth - viewport.clientWidth);
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        tl.to(trackEl, { x: () => -distance(), duration: 1 }, 0);
        if (word) tl.to(word, { x: () => -distance() * WORD_SPEED, duration: 1 }, 0);
        if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
        // заголовок уходит в тень, когда на него наезжают карточки
        if (head) tl.to(head, { opacity: 0.22, duration: 0.3 }, 0.04);
        pin = tl.scrollTrigger;
        return () => {
          pin = null;
          root.classList.remove('is-pinned');
          requestAnimationFrame(paintSwipe);
        };
      });
    });
  }

  return {
    refresh() {
      if (pin) refreshMotion();
      else paintSwipe();
    },
  };
}
