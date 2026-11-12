// 06 Кейси (T29): карточки из src/data/cases.json по <template> — горизонтальная лента в один экран.
// Лента — как на блоках 11–12 (правка пользователя): на широком альбомном экране блок закрепляется под шапкой, а
// карточки едут влево по мере прокрутки страницы (showcaseScroll из core/motion-kit.js). Стрелок и перетаскивания нет.
// Узкий экран, reduced-motion, ?nomotion=1 или GSAP не загрузился — обычная горизонтальная прокрутка пальцем
// (класс is-static, scroll-snap в CSS). Полоса под лентой — пройденный путь (scaleX).
// Карточка (вариант F, выбор пользователя; T40 — по документу клиента, блок 6): шапка — круглый аватар и справа имя
// с нишей; под ней GEO и ціль кампанії, затем 3 ключові показники (подпись + значение крупно цветом бренда) из
// cases.json → metrics. «Линию роста» клиент убрал («графік без змістовного пояснення»). Акценты — в цвет бренда
// кейса (cases.json → accent, инлайн-переменная --case-accent). Фото — только у кейсов с avatar: true:
// /img/cases/<id>.webp через publicUrl; иначе (и при сбое загрузки) — круг с первой буквой имени и акцент сайта.
// Модалка — те же поля + «Детальна інформація» (task, done); нативный <dialog>: Esc, клик вне, кнопка;
// фокус заперт и возвращается на карточку;
// фон не скроллится (lockScroll ставит Lenis на паузу).
import { $, $$, el, on, trapFocus } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, getLang, onLangChange, applyTranslations } from '../core/i18n.js';
import { lockScroll, reduced } from '../core/motion.js';
import { showcaseScroll, SHOWCASE_MEDIA } from '../core/motion-kit.js';
import { publicUrl } from '../core/public-url.js';
import { track } from '../core/analytics.js';
import data from '../data/cases.json';

const CARD_FIELDS = ['niche', 'name', 'geo', 'goal'];
const MODAL_FIELDS = ['name', 'niche', 'formats', 'geo', 'goal', 'task'];
/** Сколько ключевых показателей на карточке и в модалке (документ клиента: «3 ключові показники»). */
export const METRICS = 3;
const CLOSE_MS = 260;

/** Путь к аватару клиента в public/: /img/cases/<id>.webp (256 px); retina — /img/cases/<id>@2x.webp (512 px). */
export const avatarPath = (id, retina = false) => `/img/cases/${id}${retina ? '@2x' : ''}.webp`;
/** Первая буква имени — запасной аватар в круге, когда картинки нет. */
export const initial = (name) => (String(name ?? '').trim().match(/[\p{L}\p{N}]/u)?.[0] ?? '').toUpperCase();
/** Цвет бренда кейса из cases.json (accent) — только #rgb / #rrggbb; иначе null, и карточка берёт акцент сайта. */
export const accentOf = (item) => (typeof item?.accent === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(item.accent) ? item.accent : null);

/** Красит узел в цвет кейса: инлайн-переменная --case-accent (в CSS секции hex нет). */
function tint(node, item) {
  const accent = accentOf(item);
  if (accent) node.style.setProperty('--case-accent', accent);
  else node.style.removeProperty('--case-accent');
}

/** Аватар: фото только у кейсов с avatar: true (лишних запросов нет); иначе и при сбое загрузки — круг с буквой. */
function paintAvatar(avatar, item) {
  if (!avatar) return;
  for (const old of $$('img', avatar)) old.remove();
  avatar.classList.remove('has-image');
  if (item.avatar !== true) return;
  const attrs = { src: publicUrl(avatarPath(item.id)), alt: '', decoding: 'async' };
  // файл @2x есть не у всех: у маленького исходника (avatarRetina: false) его нет — запрос не делается
  if (item.avatarRetina !== false) attrs.srcset = `${attrs.src} 1x, ${publicUrl(avatarPath(item.id, true))} 2x`;
  const img = el('img', { class: 'cases__avatar-img', attrs });
  img.addEventListener('load', () => avatar.classList.add('has-image'), { once: true });
  img.addEventListener('error', () => img.remove(), { once: true });
  avatar.append(img);
}

const text = (value, lang) => (value && typeof value === 'object' ? value[lang] ?? value.ua ?? '' : String(value ?? ''));

/**
 * Ключевые показатели кейса → ровно METRICS пар { label, value } на языке lang (cases.json → metrics[]).
 * Лишние отбрасываются; недостающий или пустой — null (слот скрыт). Тексты — только из данных.
 */
export function metricsOf(item, lang) {
  const list = Array.isArray(item?.metrics) ? item.metrics : [];
  return Array.from({ length: METRICS }, (_, i) => {
    const m = list[i];
    const label = m ? text(m.label, lang).trim() : '';
    const value = m ? text(m.value, lang).trim() : '';
    return label || value ? { label, value } : null;
  });
}

const isTbd = (value) => value === t('common.tbd') || value === 'уточнити' || value === 'TBD';

function fill(node, value) {
  if (!node) return;
  node.textContent = value;
  node.classList.toggle('is-tbd', isTbd(value));
}

/** Слоты показателей (карточка: [data-metric], модалка: [data-m-metric]) ← metricsOf; пустой слот скрыт. */
function paintMetrics(slots, item, lang) {
  const list = metricsOf(item, lang);
  slots.forEach((slot, i) => {
    const m = list[i];
    slot.hidden = !m;
    if (!m) return;
    fill($('[data-metric-label]', slot), m.label);
    fill($('[data-metric-value]', slot), m.value);
  });
}

export function init(root) {
  accentTitles(root);
  const grid = $('[data-cases-grid]', root);
  const tpl = $('template[data-case-card]', root);
  const modal = $('[data-case-modal]', root);
  const cases = Array.isArray(data?.cases) ? data.cases : [];
  if (!grid || !tpl || !cases.length) return;

  // карточки создаются один раз; смена языка меняет только тексты
  const cards = cases.map((item) => {
    const li = tpl.content.firstElementChild.cloneNode(true);
    applyTranslations(li);
    tint(li, item);
    const button = $('.cases__card', li);
    button.dataset.case = item.id;
    on(button, 'click', () => open(item, button));
    paintAvatar($('[data-case-avatar]', li), item);
    return { item, li };
  });
  grid.replaceChildren(...cards.map((c) => c.li));
  const ribbon = ride(root, grid);

  const paintCards = (lang) => {
    for (const { item, li } of cards) {
      for (const f of CARD_FIELDS) fill($(`[data-f="${f}"]`, li), text(item[f], lang));
      paintMetrics($$('[data-metric]', li), item, lang);
      for (const letter of $$('[data-case-letter]', li)) letter.textContent = initial(text(item.name, lang));
    }
  };
  paintCards(getLang());

  /* ——— модалка ——— */
  let current = null;
  let opener = null;
  let closeTimer = 0;

  const paintModal = (item, lang) => {
    for (const f of MODAL_FIELDS) fill($(`[data-m="${f}"]`, modal), text(item[f], lang));
    paintMetrics($$('[data-m-metric]', modal), item, lang);
    const letter = $('[data-m-letter]', modal);
    if (letter) letter.textContent = initial(text(item.name, lang));
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
  };

  function open(item, trigger) {
    if (!modal) return;
    clearTimeout(closeTimer);
    current = item;
    opener = trigger;
    tint(modal, item);
    paintAvatar($('[data-m-avatar]', modal), item);
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
