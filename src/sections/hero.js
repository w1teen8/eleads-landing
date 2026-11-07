// 01 Hero в облике Aether (G17): огромное «ELEADS» поверх планеты с кольцом. На десктопе (≥900px, без
// reduced-motion) сцена закреплена, прокрутка скрабит таймлайн: буквы разлетаются по дуге кольца и гаснут →
// планета растёт на весь экран → из центра растёт круглое окно (scale обёртки + обратный scale содержимого,
// без clip-path) со сценой Володимира → по строкам поднимается H1, цифры с докруткой, CTA, «Мені довіряють».
// Ниже 900px и при reduced-motion — обычный поток: слово с планетой, затем фото, H1, цифры, CTA.
// Только transform и opacity. Параллакс фото и свечение за курсором — только десктоп с мышью.
import { $, $$, el } from '../core/dom.js';
import { t, onLangChange } from '../core/i18n.js';
import { reduced, motionReady, marquee } from '../core/motion.js';
import { countTo } from '../core/format.js';
import { whenIntroDone } from '../core/intro.js';

const DESKTOP = '(min-width: 900px)';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const MOBILE_VIDEO = '(max-width: 767px)';
// "7+" → ["", "7", "+"], "$2M+" → ["$", "2", "M+"]; слово ("десятки") не совпадает — не докручивается
const COUNTABLE = /^(\D*?)(\d+)(\D*)$/;

/** Длина закрепления, в высотах экрана. */
const PIN_SCREENS = 3.2;
/** Начальный масштаб круглого окна (доля от полного круга). */
const WINDOW_FROM = 0.04;
/** Доля прогресса закрепления, после которой докручиваются цифры (H1 уже поднялся). */
const COUNT_AT = 0.78;

export function init(root) {
  const entering = !reduced && document.documentElement.classList.contains('js-preload');
  if (entering) root.classList.add('hero--entering');
  splitWord(root);
  onLangChange(() => splitWord(root));
  initVideo($('.hero__video', root), root);
  initTrusted(root);
  initPointerDepth(root);
  initScene(root);
  if (entering) intro(root);
  else root.classList.remove('hero--entering');
}

/* ——— «ELEADS»: текст из JSON остаётся для чтения, буквы — отдельные span для разлёта ——— */
function splitWord(root) {
  const word = $('.hero__word', root);
  const source = $('.hero__word-text', root);
  if (!word || !source) return;
  const text = String(t('hero.word') || source.textContent).trim();
  if (text && !text.includes('.')) source.textContent = text;
  const old = $('.hero__letters', word);
  // то же слово (ELEADS в обоих языках) — буквы не пересоздаются: на них держится таймлайн сцены
  if (old && old.textContent === source.textContent.trim()) return;
  old?.remove();
  const letters = el(
    'span',
    { class: 'hero__letters', attrs: { 'aria-hidden': 'true' } },
    ...[...source.textContent.trim()].map((char) =>
      el('span', { class: 'hero__letter' }, el('span', { class: 'hero__letter-inner', text: char })),
    ),
  );
  word.append(letters);
  word.classList.add('is-split');
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

/* ——— глубина: фото чуть смещается, свечение тянется за курсором (десктоп, мышь) ——— */
function initPointerDepth(root) {
  if (reduced || !window.matchMedia(FINE_POINTER).matches) return;
  const media = $('.hero__media', root);
  if (!media) return;
  const desktop = window.matchMedia(DESKTOP);
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
  const reset = () => {
    Object.assign(state, { nx: 0, ny: 0, gx: 0, gy: 0 });
    kick();
  };

  root.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse' || !desktop.matches) return;
      const box = root.getBoundingClientRect();
      state.nx = ((event.clientX - box.left) / box.width) * 2 - 1;
      state.ny = ((event.clientY - box.top) / box.height) * 2 - 1;
      const m = media.getBoundingClientRect();
      const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));
      state.gx = clamp((event.clientX - (m.left + m.width * 0.7)) * 0.35, m.width * 0.3);
      state.gy = clamp((event.clientY - (m.top + m.height / 2)) * 0.35, m.height * 0.3);
      kick();
    },
    { passive: true },
  );
  root.addEventListener('pointerleave', reset);
  desktop.addEventListener?.('change', reset);
}

/* ——— сцена: закрепление на десктопе, обычный поток ниже ——— */
function initScene(root) {
  const scene = $('.hero__scene', root);
  const counters = $$('[data-count]', root);
  if (reduced || !scene) return; // всё видно, цифры стоят итоговые
  let counted = false;
  const count = () => {
    if (counted) return;
    counted = true;
    startCounters(counters);
  };

  motionReady().then((motion) => {
    // GSAP не загрузился — motion.js снял .js-anim, сцена видна потоком
    if (!motion) return showScene(scene, count);
    const mm = motion.gsap.matchMedia();
    mm.add(DESKTOP, () => {
      scene.classList.remove('is-in');
      try {
        return buildPin(root, motion, count);
      } catch (err) {
        console.error('[hero] сцена без закрепления', err);
        root.classList.add('hero--static');
        showScene(scene, count);
        return undefined;
      }
    });
    mm.add('(max-width: 899px)', () => revealOnView(scene, count));
  });
}

function showScene(scene, count) {
  scene.classList.add('is-in');
  count();
}

function revealOnView(scene, count) {
  const target = $('.hero__copy', scene) || scene;
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      showScene(scene, count);
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  io.observe(target);
  return () => io.disconnect();
}

/** Точка на кольце планеты: эллипс rx×ry, повёрнутый на tilt (экранные координаты, y вниз). */
function ringPoint(theta, rx, ry, tilt) {
  const x = rx * Math.cos(theta);
  const y = ry * Math.sin(theta);
  const tx = -rx * Math.sin(theta);
  const ty = ry * Math.cos(theta);
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  return {
    x: x * c - y * s,
    y: x * s + y * c,
    angle: (Math.atan2(tx * s + ty * c, tx * c - ty * s) * 180) / Math.PI,
  };
}

function buildPin(root, { gsap }, count) {
  const stage = $('.hero__stage', root);
  const planet = $('.hero__planet', root);
  const word = $('.hero__word', root);
  const win = $('.hero__window', root);
  const inner = $('.hero__window-inner', root);
  const letters = $$('.hero__letter', root);
  const fades = $$('[data-hero-fade]', root);
  const rings = $$('.planet__ring', planet);
  const glow = $('.planet__glow', planet);
  const lines = $$('.hero__line-inner', root);
  const items = $$('[data-scene-item]', root);

  // геометрия — по размерам без transform (offset*), пересчитывается на refresh
  const geometry = () => {
    const size = planet.offsetWidth;
    const tiltRaw = parseFloat(getComputedStyle(planet).getPropertyValue('--planet-tilt'));
    const tilt = ((Number.isFinite(tiltRaw) ? tiltRaw : -14) * Math.PI) / 180;
    const rx = (size * 2.1) / 2;
    const ry = rx * 0.24;
    const n = letters.length || 1;
    const cx = word.offsetWidth / 2;
    const cy = word.offsetHeight / 2;
    const fill = (Math.hypot(stage.clientWidth, stage.clientHeight) / Math.max(1, size)) * 1.15;
    const clampAngle = (a) => Math.max(-58, Math.min(58, a));
    const paths = letters.map((letter, i) => {
      // верхняя дуга кольца слева направо: буквы «садятся» на кольцо и уходят дальше по нему к зрителю
      const theta = Math.PI + ((i + 0.5) / n) * Math.PI;
      const p = ringPoint(theta, rx, ry, tilt);
      const x0 = letter.offsetLeft + letter.offsetWidth / 2 - cx;
      const y0 = letter.offsetTop + letter.offsetHeight / 2 - cy;
      const rot = clampAngle(p.angle);
      return {
        x1: p.x * 1.3 - x0,
        y1: p.y * 1.3 - y0 - size * 0.12,
        r1: rot,
        x2: p.x * 2.9 - x0,
        y2: p.y * 2.9 - y0 - size * 0.3,
        r2: clampAngle(rot * 1.35 + (i % 2 ? 14 : -14)),
      };
    });
    return { paths, fill };
  };
  let geo = geometry();

  const proxy = { w: 0 };
  const applyWindow = () => {
    const s = WINDOW_FROM + (1 - WINDOW_FROM) * proxy.w;
    const zoom = 1 + 0.2 * (1 - proxy.w); // сцена в окне чуть «наезжает», пока окно растёт
    win.style.transform = `scale(${s.toFixed(4)})`;
    inner.style.transform = `scale(${(zoom / s).toFixed(4)})`;
  };
  applyWindow();

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * PIN_SCREENS)}`,
      pin: true,
      scrub: 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefreshInit: () => {
        geo = null;
      },
      onUpdate: (self) => {
        if (self.progress >= COUNT_AT) count();
      },
    },
  });
  const g = () => (geo ||= geometry());

  // 0 — 1.2: подписи первого экрана уходят
  // fromTo без immediateRender: не перебивает появление после заставки, назад возвращает видимое состояние
  tl.fromTo(fades, { opacity: 1, y: 0 }, { opacity: 0, y: -24, duration: 1.2, ease: 'power1.in', immediateRender: false }, 0.02);
  // 0.1 — 3.8: буквы садятся на кольцо, затем разлетаются по нему к зрителю и гаснут
  letters.forEach((letter, i) => {
    const at = 0.1 + Math.abs(i - (letters.length - 1) / 2) * 0.08;
    tl.to(
      letter,
      { x: () => g().paths[i].x1, y: () => g().paths[i].y1, rotation: () => g().paths[i].r1, scale: 1.05, duration: 1.7, ease: 'power1.inOut' },
      at,
    ).to(
      letter,
      { x: () => g().paths[i].x2, y: () => g().paths[i].y2, rotation: () => g().paths[i].r2, scale: 2.3, opacity: 0, duration: 1.8, ease: 'power1.in' },
      at + 1.7,
    );
  });
  // 0.4 — 6: планета растёт, пока не заполнит экран; кольцо и свечение уходят
  tl.fromTo(planet, { scale: 1 }, { scale: () => g().fill, duration: 5.6, ease: 'power2.in' }, 0.4);
  tl.fromTo(glow, { opacity: 1 }, { opacity: 0, duration: 1.6, immediateRender: false }, 3);
  tl.to(rings, { opacity: 0, duration: 1.1 }, 4.3);
  // 5.4 — 7.8: из центра растёт круглое окно со сценой Володимира
  tl.fromTo(win, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 5.4);
  tl.fromTo(proxy, { w: 0 }, { w: 1, duration: 2.4, ease: 'power2.inOut', onUpdate: applyWindow }, 5.4);
  tl.set(planet, { opacity: 0 }, 7.8);
  // 7.3 — 9.6: заголовок по строкам из маски, цифры, CTA, «Мені довіряють»
  tl.fromTo(lines, { y: 0, yPercent: 112 }, { y: 0, yPercent: 0, duration: 1.1, stagger: 0.28, ease: 'power3.out' }, 7.3);
  tl.fromTo(items, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.3, ease: 'power2.out' }, 7.9);
  tl.to({}, { duration: 0.6 });

  return () => {
    // уход ниже 900px: gsap.matchMedia откатывает свои твины, окно — вручную
    win.style.transform = '';
    inner.style.transform = '';
  };
}

/* ——— появление первого экрана после заставки ——— */
// Прелоадер упал ('failed'), сработал крайний срок ('timeout') или GSAP не успел за MOTION_GRACE_MS после
// заставки — первый экран проявляется сразу коротким переходом opacity/transform: он не может остаться невидимым.
const LATE_REVEAL_MS = 250;
const MOTION_GRACE_MS = 600;

async function intro(root) {
  const inners = () => $$('.hero__letter-inner', root);
  const orbit = $('.hero__orbit', root);
  const fades = $$('[data-hero-fade]', root);
  const glow = $('.planet__glow', root);

  const motionP = motionReady();
  const how = await whenIntroDone();
  const done = () => root.classList.remove('hero--entering');
  // прелоадер упал или сработал крайний срок — показать всё сейчас, без таймлайна
  if (how !== 'done') return showNow(root, [...inners(), orbit, glow, ...fades], done);
  // заставка ушла сама; GSAP, если ещё грузится, ждём недолго — первый экран не висит невидимым
  const motion = await Promise.race([motionP, new Promise((r) => setTimeout(() => r(null), MOTION_GRACE_MS))]);
  if (!motion) return showNow(root, [...inners(), orbit, glow, ...fades], done);

  const { gsap } = motion;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => {
    done();
    gsap.set([...inners(), orbit, glow], { clearProps: 'transform,opacity' });
  } });
  tl.fromTo(inners(), { yPercent: 70, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, ease: 'power4.out', stagger: 0.06 }, 0)
    .fromTo(orbit, { scale: 0.9 }, { scale: 1, duration: 1.6 }, 0)
    .fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0.1)
    .fromTo(fades, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, clearProps: 'transform,opacity' }, 0.35);
}

function showNow(root, nodes, done) {
  const transition = `opacity ${LATE_REVEAL_MS}ms ease-out, transform ${LATE_REVEAL_MS}ms ease-out`;
  for (const node of nodes) {
    if (!node) continue;
    node.style.transition = transition;
  }
  done();
  setTimeout(() => {
    for (const node of nodes) if (node) node.style.transition = '';
  }, LATE_REVEAL_MS + 50);
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
