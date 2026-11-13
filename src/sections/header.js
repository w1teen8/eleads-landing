// Шапка: липнет и проявляет подложку при скролле (не прячется никогда), переключает язык,
// уже NAV_MEDIA — бургер с полноэкранным меню. 2026-11-13 (макет «Шапка A · Класика»): на широком экране — быстрые
// ссылки, текущий раздел подсвечивается по прокрутке (spy): так подпись в шапке всегда совпадает с тем, что на экране
// (H16: «или хотя бы чтоб оно нормально менялось, я вернулся обратно на хиро сайта, а там написано калькулятор»).
import { $, $$, focusables, trapFocus } from '../core/dom.js';
import { t, onLangChange } from '../core/i18n.js';
import { lockScroll } from '../core/motion.js';
import { bindLangSwitch } from '../core/lang-switch.js';
import { bindSweepLinks } from '../core/transition.js';

/** С какой ширины в шапке быстрые ссылки, а меню-бургер не нужен. */
export const NAV_MEDIA = '(min-width: 1280px)';
const DESKTOP = NAV_MEDIA;

export function init(root) {
  const burger = $('.burger', root);
  const menu = document.getElementById(burger?.getAttribute('aria-controls') || 'menu');

  for (const sw of $$('[data-lang-switch]', root)) bindLangSwitch(sw);

  initScrollState(root);
  initSpy(root);
  if (burger && menu) initMenu(root, burger, menu);
  // якоря шапки и мобильного меню — фирменной полосой (меню успевает закрыться своим обработчиком раньше)
  bindSweepLinks(root);
}

// Шапка всегда на экране (бриф: «Sticky»; история 7 — «на любой прокрутке вижу шапку»):
// при скролле только проявляется размытая подложка.
function initScrollState(root) {
  let ticking = false;
  const update = () => {
    ticking = false;
    root.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

function initMenu(root, burger, menu) {
  let open = false;
  let closeTimer = 0;

  const setLabel = () => {
    burger.setAttribute('aria-label', t(open ? 'nav.menuClose' : 'nav.menuOpen'));
  };

  let releaseFocus = null;

  const onKeydown = (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    close();
  };

  function openMenu() {
    if (open) return;
    open = true;
    clearTimeout(closeTimer);
    menu.hidden = false;
    // следующий кадр — чтобы переход opacity/transform сработал после снятия hidden
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    root.classList.add('is-menu-open');
    burger.setAttribute('aria-expanded', 'true');
    setLabel();
    lockScroll(true);
    document.addEventListener('keydown', onKeydown);
    // Tab ходит по кругу: бургер (он же «закрыть») и пункты меню
    releaseFocus = trapFocus(document, () => [burger, ...focusables(menu)]);
    const firstLink = $('.menu__link', menu);
    firstLink?.focus({ preventScroll: true });
  }

  function close({ returnFocus = true } = {}) {
    if (!open) return;
    open = false;
    menu.classList.remove('is-open');
    root.classList.remove('is-menu-open');
    burger.setAttribute('aria-expanded', 'false');
    setLabel();
    lockScroll(false);
    document.removeEventListener('keydown', onKeydown);
    releaseFocus?.();
    releaseFocus = null;
    closeTimer = setTimeout(() => {
      menu.hidden = true;
    }, 460);
    if (returnFocus) burger.focus({ preventScroll: true });
  }

  burger.addEventListener('click', () => (open ? close() : openMenu()));

  // выбор пункта: меню закрывается, разблокирует скролл, а переход по якорю делает общий обработчик
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) close({ returnFocus: false });
  });

  // на десктопе меню не нужно — если окно расширили с открытым меню, закрываем
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener?.('change', (e) => e.matches && close({ returnFocus: false }));

  onLangChange(setLabel);
}

/** Текущий раздел для ссылок шапки: последний из ids, чей верх уже выше линии line (доля высоты окна);
 *  tops — положения верхов разделов относительно окна, по порядку на странице. Ничего не прошло линию — первый. */
export function currentSection(ids, tops, line) {
  let current = ids[0] ?? null;
  ids.forEach((id, i) => {
    if (tops[i] !== null && tops[i] <= line) current = id;
  });
  return current;
}

function initSpy(root) {
  const links = [...root.querySelectorAll('[data-spy]')];
  if (!links.length) return;
  const ids = links.map((a) => a.dataset.spy);
  let ticking = false;
  const update = () => {
    ticking = false;
    const tops = ids.map((id) => {
      const el = document.getElementById(id);
      return el && !el.hidden ? el.getBoundingClientRect().top : null;
    });
    const current = currentSection(ids, tops, window.innerHeight * 0.4);
    for (const a of links) {
      const on = a.dataset.spy === current;
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  };
  const schedule = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
}
