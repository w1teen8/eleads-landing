// 06 Кейси (T29): карточки из src/data/cases.json по <template> — горизонтальная лента в один экран.
// Лента — как на блоках 11–12 (правка пользователя): на широком альбомном экране блок закрепляется под шапкой, а
// карточки едут влево по мере прокрутки страницы (showcaseScroll из core/motion-kit.js). Стрелок и перетаскивания нет.
// Узкий экран, reduced-motion, ?nomotion=1 или GSAP не загрузился — обычная горизонтальная прокрутка пальцем
// (класс is-static, scroll-snap в CSS). Полоса под лентой — пройденный путь (scaleX).
// У карточки аватар клиента: <img> /img/cases/<id>.webp (publicUrl); файла нет — остаётся круг с первой буквой имени.
// Модалка — нативный <dialog>: Esc, клик вне, кнопка; фокус заперт и возвращается на карточку;
// фон не скроллится (lockScroll ставит Lenis на паузу).
import { $, $$, el, on, trapFocus } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, getLang, onLangChange, applyTranslations } from '../core/i18n.js';
import { lockScroll, reduced } from '../core/motion.js';
import { showcaseScroll, SHOWCASE_MEDIA } from '../core/motion-kit.js';
import { publicUrl } from '../core/public-url.js';
import { track } from '../core/analytics.js';
import data from '../data/cases.json';

const CARD_FIELDS = ['niche', 'name', 'cpa', 'budget', 'result'];
const MODAL_FIELDS = ['name', 'niche', 'task', 'geo', 'budget', 'result', 'cpa', 'review'];
const CLOSE_MS = 260;
/** Тона запасного аватара (круг с буквой) — по кругу; сами цвета — в cases.css. */
const AVATAR_TONES = ['sun', 'light', 'ember'];

/** Путь к аватару клиента в public/: /img/cases/<id>.webp. */
export const avatarPath = (id) => `/img/cases/${id}.webp`;
/** Первая буква имени для запасного аватара. */
export const initial = (name) => (String(name ?? '').trim().match(/[\p{L}\p{N}]/u)?.[0] ?? '').toUpperCase();

const text = (value, lang) => (value && typeof value === 'object' ? value[lang] ?? value.ua ?? '' : String(value ?? ''));
const isTbd = (value) => value === t('common.tbd') || value === 'уточнити' || value === 'TBD';

function fill(node, value) {
  if (!node) return;
  node.textContent = value;
  node.classList.toggle('is-tbd', isTbd(value));
}

export function init(root) {
  accentTitles(root);
  const grid = $('[data-cases-grid]', root);
  const tpl = $('template[data-case-card]', root);
  const modal = $('[data-case-modal]', root);
  const cases = Array.isArray(data?.cases) ? data.cases : [];
  if (!grid || !tpl || !cases.length) return;

  // карточки создаются один раз; смена языка меняет только тексты
  const cards = cases.map((item, i) => {
    const li = tpl.content.firstElementChild.cloneNode(true);
    applyTranslations(li);
    if (item.featured) li.classList.add('cases__item--featured');
    const num = $('[data-case-num]', li);
    if (num) num.textContent = String(i + 1).padStart(2, '0');
    const button = $('.cases__card', li);
    button.dataset.case = item.id;
    on(button, 'click', () => open(item, button));
    const avatar = $('[data-case-avatar]', li);
    if (avatar) {
      avatar.dataset.tone = AVATAR_TONES[i % AVATAR_TONES.length];
      // фото клиента поверх буквы; файла нет (или отдан не рисунок) — <img> убирается, остаётся буква
      const img = el('img', {
        class: 'cases__avatar-img',
        attrs: { src: publicUrl(avatarPath(item.id)), alt: '', loading: 'lazy', decoding: 'async' },
      });
      img.addEventListener('load', () => avatar.classList.add('has-image'), { once: true });
      img.addEventListener('error', () => img.remove(), { once: true });
      avatar.append(img);
    }
    return { item, li };
  });
  grid.replaceChildren(...cards.map((c) => c.li));
  const ribbon = ride(root, grid);

  const paintCards = (lang) => {
    for (const { item, li } of cards) {
      for (const f of CARD_FIELDS) fill($(`[data-f="${f}"]`, li), text(item[f], lang));
      const letter = $('[data-case-letter]', li);
      if (letter) letter.textContent = initial(text(item.name, lang));
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
          attrs: { src: publicUrl(item.screenshot), alt: text(item.name, lang), loading: 'lazy', decoding: 'async' },
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
    ribbon.refresh();
  });
}

/* ——— лента: едет по прокрутке страницы (showcaseScroll), запасной вариант — нативная прокрутка ——— */
function ride(root, trackEl) {
  const viewport = $('[data-cases-viewport]', root);
  const bar = $('[data-cases-progress]', root);
  const faces = () => $$('.cases__card', trackEl);
  const paintBar = (p) => {
    if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, p)).toFixed(4)})`;
  };
  paintBar(0);

  let riding = false; // лента закрепляется и едет по прокрутке страницы (GSAP есть, анимации живые)
  const wide = () => Boolean(window.matchMedia?.(SHOWCASE_MEDIA).matches);
  const handle = showcaseScroll(root, trackEl, { onProgress: paintBar });
  handle.ready.then((ok) => {
    riding = ok;
    root.classList.toggle('is-static', !ok);
  });

  // запасная прокрутка пальцем: полоса идёт за scrollLeft окна ленты
  if (viewport) {
    let frame = 0;
    const paint = () => {
      frame = 0;
      if (riding && wide()) return;
      const max = viewport.scrollWidth - viewport.clientWidth;
      paintBar(max > 0 ? viewport.scrollLeft / max : 0);
    };
    on(
      viewport,
      'scroll',
      () => {
        if (!frame) frame = requestAnimationFrame(paint);
      },
      { passive: true },
    );
  }

  // ←/→ — к соседней карточке; Home/End — к крайним
  on(trackEl, 'keydown', (e) => {
    const list = faces();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (to === undefined || to < 0 || to >= list.length) return;
    e.preventDefault();
    list[to].focus({ preventScroll: true });
  });

  // фокус на карточке за краем окна ленты: едущую ленту докручиваем прокруткой страницы (пиксель в пиксель),
  // обычную — нативно
  on(trackEl, 'focusin', (e) => {
    const item = e.target.closest?.('.cases__item');
    if (!item || !viewport) return;
    const box = viewport.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    const dx = rect.left < box.left ? rect.left - box.left : rect.right > box.right ? rect.right - box.right : 0;
    if (!dx) return;
    if (riding && wide()) {
      viewport.scrollLeft = 0;
      window.scrollBy({ top: dx, behavior: 'auto' });
    } else {
      viewport.scrollBy({ left: dx, behavior: reduced ? 'auto' : 'smooth' });
    }
  });

  return { refresh: () => handle.refresh() };
}
