// Шапка: липнет и проявляет подложку при скролле (не прячется никогда),
// подсвечивает текущую секцию, переключает язык, на < 900px — бургер с полноэкранным меню.
import { $, $$, focusables, trapFocus } from '../core/dom.js';
import { t, onLangChange } from '../core/i18n.js';
import { lockScroll } from '../core/motion.js';
import { bindLangSwitch } from '../core/lang-switch.js';

const DESKTOP = '(min-width: 900px)';

export function init(root) {
  const burger = $('.burger', root);
  const menu = document.getElementById(burger?.getAttribute('aria-controls') || 'menu');

  for (const sw of $$('[data-lang-switch]', root)) bindLangSwitch(sw);

  initScrollState(root);
  initActiveLink(root);
  if (burger && menu) initMenu(root, burger, menu);
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

function initActiveLink(root) {
  const links = $$('.header__link', root);
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const targets = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (!targets.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = byId.get(entry.target.id);
        if (entry.isIntersecting) {
          for (const a of links) a.removeAttribute('aria-current');
          link.setAttribute('aria-current', 'true');
        } else if (link.hasAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  for (const node of targets) io.observe(node);
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
