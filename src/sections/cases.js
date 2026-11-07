// 06 Кейси: карточки из src/data/cases.json по <template>, модалка кейса без перехода со страницы.
// Широкий экран (не reduced): карточки складываются стопкой — sticky в CSS, уходящая карточка
// уменьшается (transform: scale через --stack-s) по мере того, как следующая наезжает на неё.
// Модалка — нативный <dialog>: Esc, клик вне, кнопка; фокус заперт и возвращается на карточку;
// фон не скроллится (lockScroll ставит Lenis на паузу).
import { $, el, on, trapFocus } from '../core/dom.js';
import { t, getLang, onLangChange, applyTranslations } from '../core/i18n.js';
import { lockScroll, reduced } from '../core/motion.js';
import { track } from '../core/analytics.js';
import data from '../data/cases.json';

const CARD_FIELDS = ['niche', 'name', 'cpa', 'budget', 'result'];
const MODAL_FIELDS = ['name', 'niche', 'task', 'geo', 'budget', 'result', 'cpa', 'review'];
const CLOSE_MS = 260;

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
    const button = $('.cases__card', li);
    button.dataset.case = item.id;
    on(button, 'click', () => open(item, button));
    return { item, li };
  });
  grid.replaceChildren(...cards.map((c) => c.li));
  grid.dataset.reveal = 'stagger';
  if (!reduced) stack(grid, cards.map((c) => c.li));

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
  });
}

/* ——— стопка ——— */
const STACK_MEDIA = '(min-width: 900px)';
const STACK_SHRINK = 0.06; // уходящая карточка: scale 1 → 0.94

// Прогресс считается от живого getBoundingClientRect следующей карточки: пока она едет снизу,
// он растёт от 0 (её верх у низа окна) до 1 (она прилипла на своём sticky-top). Позиции sticky
// не кэшируются — ScrollTrigger для sticky-элементов мерил бы неверно.
function stack(grid, items) {
  const media = window.matchMedia(STACK_MEDIA);
  const faces = items.map((li) => $('.cases__card', li));
  let frame = 0;
  let unbind = null;

  const paint = () => {
    frame = 0;
    const vh = window.innerHeight;
    for (let i = 0; i < items.length - 1; i += 1) {
      const next = items[i + 1];
      const stickTop = parseFloat(getComputedStyle(next).top) || 0;
      const top = next.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (vh - top) / Math.max(1, vh - stickTop)));
      faces[i].style.setProperty('--stack-s', (1 - STACK_SHRINK * p).toFixed(4));
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };

  const apply = () => {
    if (media.matches && !unbind) {
      grid.classList.add('is-stacked');
      const offScroll = on(window, 'scroll', schedule, { passive: true });
      const offResize = on(window, 'resize', schedule);
      unbind = () => {
        offScroll();
        offResize();
      };
      schedule();
    } else if (!media.matches && unbind) {
      unbind();
      unbind = null;
      cancelAnimationFrame(frame);
      frame = 0;
      grid.classList.remove('is-stacked');
      for (const face of faces) face.style.removeProperty('--stack-s');
    }
  };
  media.addEventListener('change', apply);
  apply();
}
