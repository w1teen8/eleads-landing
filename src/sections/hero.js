// 01 Hero — два варианта в одной секции: data-hero="mockup|orbit" на <html> (ставит инлайн-скрипт <head> по
// ?hero=1|2|3 → sessionStorage['eleads-hero'] → mockup) или на секции. Инициализируется только активный вариант;
// «orbit» (1) — модуль hero-orbit.js, «plane» (3, интро с самолётиком) — hero-plane.js. Вариант 2 «mockup» (по умолчанию) — по макету пользователя (G18): слева наклонный H1 по строкам из маски, абзац с чертой,
// пилюля в Telegram и три цифры брифа; справа Володимир без фона на тёмной планете, горящее кольцо перед ним и
// за ним, вокруг — присланные PNG-карточки. Кольцо и плавание карточек — CSS (@keyframes, только transform);
// здесь — появление после заставки, параллакс слоёв за курсором (десктоп с мышью), видео, «Мені довіряють»,
// докрутка цифр. При reduced-motion всё стоит на месте и видно сразу.
import { $, $$, el } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { reduced, marquee } from '../core/motion.js';
import { countTo } from '../core/format.js';
import { whenIntroDone } from '../core/intro.js';
import { initOrbit } from './hero-orbit.js';
import { initPlane } from './hero-plane.js';

const DESKTOP = '(min-width: 900px)';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const MOBILE_VIDEO = '(max-width: 767px)';
// "7+" → ["", "7", "+"], "$2M+" → ["$", "2", "M+"]; слово ("десятки") не совпадает — не докручивается
const COUNTABLE = /^(\D*?)(\d+)(\D*)$/;
/** Сдвиг слоя с глубиной 1 при курсоре у края экрана, px. */
const PARALLAX_X = 26;
const PARALLAX_Y = 18;

export const HERO_VARIANTS = ['mockup', 'orbit', 'plane'];

/** Активный вариант: data-hero на секции или <html>; иначе — mockup. */
export function heroVariant(root, html = document.documentElement) {
  const v = root?.dataset?.hero || html?.dataset?.hero;
  return HERO_VARIANTS.includes(v) ? v : 'mockup';
}

export function init(root) {
  const variant = heroVariant(root);
  const stage = $(`[data-hero-variant="${variant}"]`, root) || root;
  root.setAttribute('aria-labelledby', variant === 'mockup' ? 'hero-title' : `hero-title-${variant}`);
  if (variant === 'plane') {
    initPlane(stage);
    return;
  }
  initVideo($('.hero__video', stage), root);
  initTrusted(root);
  pauseOffscreen(root);
  if (variant === 'orbit') {
    initOrbit(stage);
    return;
  }
  initParallax(root);
  if (reduced) return; // всё видно, цифры стоят итоговые
  root.classList.add('hero--entering');
  if (document.documentElement.classList.contains('js-preload')) {
    intro(root).then(() => whenVisible(root, () => startCounters($$('[data-count]', stage))));
  } else {
    // без заставки — лёгкое появление строк и сразу цифры
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('hero--entering')));
    whenVisible(root, () => startCounters($$('[data-count]', stage)));
  }
}

/* ——— вне экрана плавание и кометы на паузе (.hero--offscreen → animation-play-state) ——— */
function pauseOffscreen(root) {
  new IntersectionObserver(([entry]) => root.classList.toggle('hero--offscreen', !entry.isIntersecting)).observe(root);
}

/* ——— появление после заставки ——— */
// Заставка упала ('failed') или сработал крайний срок ('timeout') — первый экран проявляется сразу коротким
// переходом (.hero--fast, 250 мс): он не может остаться невидимым дольше INTRO_DEADLINE_MS + 250 мс.
async function intro(root) {
  const how = await whenIntroDone();
  if (how !== 'done') root.classList.add('hero--fast');
  root.classList.remove('hero--entering');
}

function whenVisible(root, fn) {
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    fn();
  });
  io.observe($('.hero__stats', root) || root);
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

/* ——— видео: грузится только если можно; без файла остаётся свечение темы ——— */
function initVideo(video, root) {
  if (!video) return;
  const conn = navigator.connection || {};
  const slow = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
  if (reduced || slow) return;

  const src = window.matchMedia(MOBILE_VIDEO).matches ? video.dataset.srcMobile : video.dataset.srcDesktop;
  if (!src) return;

  video.addEventListener(
    'loadedmetadata',
    () => {
      if (video.dataset.poster) video.poster = video.dataset.poster;
    },
    { once: true },
  );
  video.addEventListener('loadeddata', () => video.classList.add('is-ready'), { once: true });
  video.addEventListener('error', () => video.classList.remove('is-ready'), { once: true });
  video.src = src;
  video.play?.()?.catch?.(() => {
    /* автоплей запрещён — остаётся свечение */
  });

  // вне экрана видео не крутится
  new IntersectionObserver(([entry]) => {
    if (!video.classList.contains('is-ready')) return;
    if (entry.isIntersecting) video.play?.()?.catch?.(() => {});
    else video.pause();
  }).observe(root);
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

function startCounters(nodes) {
  for (const node of nodes) {
    const text = node.textContent.trim();
    const match = text.match(COUNTABLE);
    if (!match) continue;
    const [, prefix, digits, suffix] = match;
    countTo(node, 0, Number(digits), {
      duration: 1400,
      format: (n) => `${prefix}${Math.round(n)}${suffix}`,
    });
  }
}
