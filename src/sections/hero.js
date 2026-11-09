// 01 Hero — один первый экран (сборка 3, reference/run3/hero-keep.png) в палитре канала: огромное «eLeads» за
// Володимиром без фона, слева заголовок и акцентная пилюля, справа цифры брифа и строка рекламы Telegram текстом,
// ниже — «Мені довіряють». Здесь: появление после заставки-поиска, параллакс слоёв [data-depth] (слово, фигура) за
// курсором и бегущая строка. Появление: .hero--entering снимается, когда заставка ушла; упала или вышел срок — сразу
// коротким переходом (.hero--fast). Страховка — HERO_SAFETY_MS: позже первый экран виден при любом сбое.
// При reduced-motion всё стоит на месте и видно сразу. Двигаются только transform и opacity.
import { $, $$, el } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { reduced, marquee } from '../core/motion.js';
import { whenIntroDone, INTRO_DEADLINE_MS } from '../core/intro.js';

const DESKTOP = '(min-width: 900px)';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
/** Сдвиг слоя с глубиной 1 при курсоре у края экрана, px. */
const PARALLAX_X = 26;
const PARALLAX_Y = 18;

/** Позже этого срока (от старта страницы) первый экран виден в любом случае. */
export const HERO_SAFETY_MS = INTRO_DEADLINE_MS + 600;

export function init(root) {
  initTrusted(root);
  initParallax(root);
  if (reduced) return;
  root.classList.add('hero--entering');
  const show = (fast) => {
    if (fast) root.classList.add('hero--fast');
    root.classList.remove('hero--entering');
  };
  if (document.documentElement.classList.contains('js-preload')) {
    whenIntroDone().then((how) => show(how !== 'done'));
    const left = Math.max(0, HERO_SAFETY_MS - performance.now());
    setTimeout(() => root.classList.contains('hero--entering') && show(true), left);
  } else {
    // без заставки — лёгкое появление сразу
    requestAnimationFrame(() => requestAnimationFrame(() => show(false)));
  }
}

/* ——— параллакс: слои [data-depth] смещаются за курсором с инерцией (десктоп, мышь) ——— */
function initParallax(root) {
  if (reduced || !window.matchMedia(FINE_POINTER).matches) return;
  const visual = $('[data-hero-visual]', root);
  if (!visual) return;
  const desktop = window.matchMedia(DESKTOP);
  const layers = $$('[data-depth]', visual).map((node) => ({ node, depth: parseFloat(node.dataset.depth) || 0, x: 0, y: 0 }));
  const target = { x: 0, y: 0 };
  let raf = 0;

  const loop = () => {
    let moving = false;
    for (const layer of layers) {
      const tx = target.x * layer.depth * -PARALLAX_X;
      const ty = target.y * layer.depth * -PARALLAX_Y;
      layer.x += (tx - layer.x) * 0.08;
      layer.y += (ty - layer.y) * 0.08;
      if (Math.abs(tx - layer.x) > 0.05 || Math.abs(ty - layer.y) > 0.05) moving = true;
      layer.node.style.transform = `translate3d(${layer.x.toFixed(2)}px, ${layer.y.toFixed(2)}px, 0)`;
    }
    raf = moving ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };
  const reset = () => {
    target.x = 0;
    target.y = 0;
    kick();
  };

  root.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse' || !desktop.matches) return;
      target.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.y = (event.clientY / window.innerHeight) * 2 - 1;
      kick();
    },
    { passive: true },
  );
  root.addEventListener('pointerleave', reset);
  desktop.addEventListener?.('change', reset);
}

/* ——— «Мені довіряють»: список из JSON, бесконечная строка, пауза при наведении ——— */
function initTrusted(root) {
  const track = $('.marquee__track', root);
  const group = $('.marquee__group', root);
  if (!track || !group) return;

  const items = t('hero.trusted.items');
  if (Array.isArray(items) && items.length !== group.children.length) {
    group.replaceChildren(
      ...items.map((name, i) => el('li', { class: 'marquee__item', text: name, dataset: { i18n: `hero.trusted.items.${i}` } })),
    );
  }
  marquee(track, { speed: 36 });
}
