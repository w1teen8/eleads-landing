// Фирменный переход: скошенная (skewX(-10deg)) полоса градиента закрывает экран и уезжает дальше.
// Одна и та же полоса — для ухода заставки и для переходов по якорям шапки, мобильного меню и подвала.
// Движение — Web Animations API, только transform и opacity: полоса не зависит от того, загрузился ли GSAP.
// При reduced-motion (или без DOM) — никакой анимации: sweep() просто выполняет midFn.
import { reduced, scrollToTarget } from './motion.js';
import { t } from './i18n.js';

const COVER_MS = 450;
const UNCOVER_MS = 500;
const UNCOVER_DELAY_MS = 60;
const EASE_IN = 'cubic-bezier(.7,0,.25,1)';
const EASE_OUT = 'cubic-bezier(.7,0,.2,1)';
const EASE_POP = 'cubic-bezier(.34,1.7,.6,1)';
const SKEW = 'skewX(-10deg)';

let nodes = null;
let busy = null; // промис идущего sweep — повторный клик его не перезапускает

const canAnimate = () =>
  !reduced && typeof document !== 'undefined' && typeof Element !== 'undefined' && 'animate' in Element.prototype;

function build() {
  if (nodes) return nodes;
  const make = (tag, cls, text) => {
    const node = document.createElement(tag);
    node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  const root = make('div', 'sweep');
  root.setAttribute('aria-hidden', 'true');
  root.hidden = true;
  const band = make('div', 'sweep__band');
  const ride = make('div', 'sweep__ride');
  const top = make('div', 'sweep__top');
  const brand = make('span', 'sweep__brand');
  const brandText = make('span', 'sweep__brand-text');
  brand.append(brandText); // только слово «eLeads», без значка
  const caption = make('span', 'sweep__caption');
  top.append(brand, caption);
  const mid = make('div', 'sweep__mid');
  const crumb = make('p', 'sweep__crumb');
  const pill = make('div', 'sweep__pill');
  const name = make('span', 'sweep__name');
  const badge = make('b', 'sweep__badge');
  pill.append(name, badge);
  mid.append(crumb, pill);
  ride.append(top, mid);
  root.append(band, ride);
  document.body.append(root);
  nodes = { root, band, ride, brandText, caption, crumb, name, badge, top };
  return nodes;
}

// finished с подстраховкой: в фоновой вкладке анимация может не доиграть — промис всё равно резолвится
function done(animation, ms) {
  return Promise.race([animation.finished.catch(() => {}), new Promise((r) => setTimeout(r, ms + 250))]);
}

function fill({ label, badge }) {
  const n = build();
  const hasLabel = Boolean(label);
  n.ride.hidden = !hasLabel;
  if (hasLabel) {
    n.brandText.textContent = t('common.brand');
    n.caption.textContent = t('preloader.next');
    n.crumb.textContent = t('preloader.resultUrl');
    n.name.textContent = label;
    n.badge.textContent = badge || '';
    n.badge.hidden = !badge;
  }
  return n;
}

/** Полоса закрывает экран; резолвится, когда закрыто. */
export function cover(opts = {}) {
  if (!canAnimate()) return Promise.resolve();
  const n = fill(opts);
  n.root.hidden = false;
  const band = n.band.animate(
    [{ transform: `translateX(-106%) ${SKEW}` }, { transform: `translateX(0) ${SKEW}` }],
    { duration: COVER_MS, easing: EASE_IN, fill: 'both' },
  );
  if (!n.ride.hidden) {
    n.ride.animate([{ transform: 'translateX(-78vw)' }, { transform: 'translateX(0)' }], {
      duration: COVER_MS * 1.2,
      easing: 'cubic-bezier(.3,.7,.2,1)',
      fill: 'both',
    });
    n.top.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: COVER_MS * 0.5, easing: 'ease', fill: 'both' });
    n.badge.animate(
      [
        { transform: 'scale(.3) rotate(-14deg)', opacity: 0 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1 },
      ],
      { duration: 450, delay: COVER_MS * 0.75, easing: EASE_POP, fill: 'both' },
    );
  }
  return done(band, COVER_MS);
}

/** Полоса уезжает дальше и открывает экран. */
export function uncover() {
  if (!canAnimate() || !nodes || nodes.root.hidden) return Promise.resolve();
  const n = nodes;
  const band = n.band.animate(
    [{ transform: `translateX(0) ${SKEW}` }, { transform: `translateX(106%) ${SKEW}` }],
    { duration: UNCOVER_MS, delay: UNCOVER_DELAY_MS, easing: EASE_OUT, fill: 'both' },
  );
  if (!n.ride.hidden) {
    n.ride.animate(
      [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(64vw)', opacity: 0 },
      ],
      { duration: UNCOVER_MS * 0.8, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'both' },
    );
  }
  return done(band, UNCOVER_MS + UNCOVER_DELAY_MS).then(() => {
    n.root.hidden = true;
    for (const node of [n.band, n.ride, n.top, n.badge]) for (const a of node.getAnimations()) a.cancel();
  });
}

/** cover → await midFn() → uncover. При reduced — только midFn. Ошибка midFn не оставляет экран закрытым. */
export function sweep(opts, midFn = () => {}) {
  if (!canAnimate()) return Promise.resolve().then(midFn);
  if (busy) return busy;
  busy = (async () => {
    try {
      await cover(opts);
      try {
        await midFn();
      } catch (err) {
        console.error('[transition]', err);
      }
    } finally {
      await uncover();
      busy = null;
    }
  })();
  return busy;
}

/** Номер секции в порядке страницы: hero → #01. */
function sectionBadge(node) {
  const list = [...document.querySelectorAll('main > section[id]')];
  const i = list.indexOf(node);
  return i < 0 ? '' : `#${String(i + 1).padStart(2, '0')}`;
}

/**
 * Якоря внутри root (шапка, мобильное меню, подвал) переходят полосой: закрыла → мгновенный прыжок → открыла.
 * При reduced-motion обработчик не ставится — работает обычная прокрутка из core/motion.
 */
export function bindSweepLinks(root) {
  if (!canAnimate() || !root) return;
  root.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const link = event.target.closest?.('a[href^="#"]');
    if (!link || !root.contains(link)) return;
    const hash = link.getAttribute('href');
    const target = hash.length > 1 && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    const key = `nav.sections.${target.id}`;
    const name = t(key);
    const label = typeof name === 'string' && name !== key ? name : t('common.brand');
    sweep({ label, badge: sectionBadge(target) }, () => {
      scrollToTarget(target, { immediate: true });
      history.replaceState(null, '', hash);
      if (target.tabIndex >= 0 || target.id === 'main') target.focus?.({ preventScroll: true });
    });
  });
}
