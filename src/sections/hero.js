// 01 Hero: фон-видео с брендовым градиентом под ним, появление по строкам после заставки,
// докрутка цифр, параллакс слоёв фото и свечение за курсором (только мышь), бегущая строка.
import { $, $$, el } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { reduced, motionReady, marquee, parallax } from '../core/motion.js';
import { countTo } from '../core/format.js';
import { whenIntroDone, introTimeLeft } from '../core/intro.js';

const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const MOBILE_VIDEO = '(max-width: 767px)';
// "7+" → ["", "7", "+"], "$2M+" → ["$", "2", "M+"]; слово ("десятки") не совпадает — не докручивается
const COUNTABLE = /^(\D*?)(\d+)(\D*)$/;

export function init(root) {
  initVideo($('.hero__video', root), root);
  initTrusted(root);
  initPointerDepth(root);
  if (window.matchMedia(FINE_POINTER).matches) parallax($('.hero__backdrop', root), 0.12);
  intro(root);
}

/* ——— видео: грузится только если можно; без файла остаётся градиент ——— */
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
    /* автоплей запрещён — остаётся градиент */
  });

  // вне экрана видео не крутится
  new IntersectionObserver(([entry]) => {
    if (!video.classList.contains('is-ready')) return;
    if (entry.isIntersecting) video.play?.()?.catch?.(() => {});
    else video.pause();
  }).observe(root);
}

/* ——— «Мені довіряють»: список из JSON, бесконечная строка ——— */
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

/* ——— глубина: слои фото двигаются с разной скоростью, свечение тянется за курсором ——— */
function initPointerDepth(root) {
  if (reduced || !window.matchMedia(FINE_POINTER).matches) return;
  const media = $('.hero__media', root);
  if (!media) return;
  const layers = $$('[data-depth]', media).map((node) => ({ node, depth: parseFloat(node.dataset.depth) || 0, x: 0, y: 0 }));
  const glow = $('[data-glow]', media);
  const state = { nx: 0, ny: 0, gx: 0, gy: 0, glowX: 0, glowY: 0 };
  let raf = 0;

  const loop = () => {
    let moving = false;
    for (const layer of layers) {
      const tx = state.nx * layer.depth * -28;
      const ty = state.ny * layer.depth * -20;
      layer.x += (tx - layer.x) * 0.08;
      layer.y += (ty - layer.y) * 0.08;
      if (Math.abs(tx - layer.x) > 0.05 || Math.abs(ty - layer.y) > 0.05) moving = true;
      layer.node.style.transform = `translate3d(${layer.x.toFixed(2)}px, ${layer.y.toFixed(2)}px, 0)`;
    }
    if (glow) {
      // инерция больше, чем у слоёв: свечение «догоняет» курсор
      state.glowX += (state.gx - state.glowX) * 0.05;
      state.glowY += (state.gy - state.glowY) * 0.05;
      if (Math.abs(state.gx - state.glowX) > 0.05 || Math.abs(state.gy - state.glowY) > 0.05) moving = true;
      glow.style.transform = `translate3d(${state.glowX.toFixed(2)}px, ${state.glowY.toFixed(2)}px, 0)`;
    }
    raf = moving ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };

  root.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      const box = root.getBoundingClientRect();
      state.nx = ((event.clientX - box.left) / box.width) * 2 - 1;
      state.ny = ((event.clientY - box.top) / box.height) * 2 - 1;
      const m = media.getBoundingClientRect();
      const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));
      state.gx = clamp((event.clientX - (m.left + m.width / 2)) * 0.35, m.width * 0.45);
      state.gy = clamp((event.clientY - (m.top + m.height / 2)) * 0.35, m.height * 0.35);
      kick();
    },
    { passive: true },
  );
  root.addEventListener('pointerleave', () => {
    Object.assign(state, { nx: 0, ny: 0, gx: 0, gy: 0 });
    kick();
  });
}

/* ——— появление после заставки ——— */
// Если к крайнему сроку (core/intro.js) нет ни сигнала прелоадера, ни GSAP — первый экран проявляется
// сразу коротким переходом opacity/transform: он не может остаться невидимым.
const LATE_REVEAL_MS = 250;

async function intro(root) {
  if (reduced) return; // всё уже видно, цифры стоят итоговые
  const lines = $$('.hero__line-inner', root);
  const eyebrow = $('.hero__eyebrow', root);
  const fades = $$('[data-hero-fade]', root).filter((node) => node !== eyebrow && !node.classList.contains('hero__trust'));
  const trust = $('.hero__trust', root);
  const media = $('.hero__media', root);
  const counters = $$('[data-count]', root);

  const late = new Promise((resolve) => setTimeout(() => resolve(null), introTimeLeft()));
  const ready = Promise.all([motionReady(), whenIntroDone()]).then(([motion, how]) => ({ motion, how }));
  const result = await Promise.race([ready, late]);
  if (!result || result.how === 'timeout' || !result.motion) {
    // прелоадер упал, GSAP опоздал или не загрузился — показать всё сейчас
    showNow([eyebrow, ...lines, media, ...fades, trust]);
    return;
  }

  const { gsap } = result.motion;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });
  tl.to(eyebrow, { opacity: 1, y: 0 }, 0.05)
    .to(lines, { y: 0, duration: 1.05, ease: 'power4.out', stagger: 0.09 }, 0.1)
    .to(media, { opacity: 1, y: 0, scale: 1, duration: 1.2 }, 0.3)
    .to(fades, { opacity: 1, y: 0, stagger: 0.08 }, 0.15)
    .call(() => startCounters(counters), null, 0.4)
    .to(trust, { opacity: 1, y: 0 }, 0.6);
}

function showNow(nodes) {
  const transition = `opacity ${LATE_REVEAL_MS}ms ease-out, transform ${LATE_REVEAL_MS}ms ease-out`;
  for (const node of nodes) {
    if (!node) continue;
    node.style.transition = transition;
    node.style.opacity = '1';
    node.style.transform = 'none';
  }
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
