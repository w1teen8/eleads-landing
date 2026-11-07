// 01 Hero, вариант 3 «plane» (?hero=3, G24): при первом заходе (не чаще раза в сутки, тот же localStorage['eleads-intro'],
// ?intro=1 — принудительно) вместо заставки-поиска идёт интро: ролик пользователя (самолётик из офиса летит к Земле),
// затем кодом — самолётик с места, где он в последнем кадре, облетает «ELEADS» по эллипсу, за ним раскрывается
// ровное кольцо, и он садится в центр кольца; проявляются шапка и тексты — это и есть главный экран.
// Ролик — сменяемый слот config.json → heroV3 (файлы, обрезка, поза самолётика в последнем кадре, дуга Земли);
// математика — hero-plane-model.js. Стык: ролик гаснет 400 мс поверх кодовой сцены, где самолётик стоит в той же
// точке и том же масштабе, а под ним — последний кадр без самолётика (дуга Земли), который уезжает вниз.
// Телефон (<768px) получает ролик 720p; save-data / 2g — сразу кодовая часть. Ролик не стартовал за 2 с или упал —
// сразу кодовая часть. «Пропустити» и Esc — сразу главный экран. Потолок интро — ролик + код + 2 с (introCeilingMs):
// позже главный экран виден при любом сбое; если модуль не стартовал вовсе, класс снимает инлайн-скрипт <head> через 4 с.
// Только transform и opacity; кольцо раскрывается поворотом двух половинок, без stroke-dashoffset.
import { $, $$ } from '../core/dom.js';
import { reduced, lockScroll, motionReady } from '../core/motion.js';
import { countTo } from '../core/format.js';
import config from '../data/config.json';
import { introCeilingMs, coverPoint, ringSpins, ringGeometry, planePose, PHASES } from './hero-plane-model.js';

/** Тот же ключ, что у заставки-поиска (preloader.js): время последнего показа интро. */
const INTRO_KEY = 'eleads-intro';
const INTRO_CLASS = 'js-plane-intro';
const MOBILE = '(max-width: 767px)';
const VIDEO_START_MS = 2000;
const SKIP_FADE_MS = 450;
// "7+" → ["", "7", "+"], "$2M+" → ["$", "2", "M+"]; слово ("десятки") не докручивается
const COUNTABLE = /^(\D*?)(\d+)(\D*)$/;

/** root — обёртка варианта `.hero-plane` внутри `<section id="hero">`. */
export function initPlane(root, cfg = config.heroV3 || {}) {
  const html = document.documentElement;
  const mark = $('.hero-plane__mark', root);
  const word = $('.hero-plane__word > span', root) || $('.hero-plane__word', root);
  const flyer = $('.hero-plane__flyer', root);
  const spins = $$('.hero-plane__spin', root);
  let geo = ringGeometry(word?.offsetWidth || 600);

  const layout = () => {
    geo = ringGeometry(word?.offsetWidth || 600);
    const set = (name, value) => mark?.style.setProperty(name, value);
    set('--ring-size', `${geo.ringSize.toFixed(1)}px`);
    set('--ring-k', String(geo.k));
    set('--ring-tilt', `${geo.tilt}deg`);
    set('--ring-spin', `${geo.spin}deg`);
    set('--plane-w', `${geo.final.w.toFixed(1)}px`);
    set('--plane-x', `${geo.final.x.toFixed(1)}px`);
    set('--plane-y', `${geo.final.y.toFixed(1)}px`);
    set('--plane-a', `${geo.final.a}deg`);
  };
  layout();
  document.fonts?.ready?.then(layout);
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(layout);
  });

  if (reduced || !html.classList.contains(INTRO_CLASS)) {
    html.classList.remove(INTRO_CLASS);
    whenVisible(root, () => startCounters($$('[data-count]', root)));
    return;
  }

  try {
    runIntro(root, cfg, { html, mark, flyer, spins, geo: () => geo });
  } catch (err) {
    console.error('[hero-plane]', err);
    html.classList.remove(INTRO_CLASS);
    lockScroll(false);
  }
}

function runIntro(root, cfg, { html, mark, flyer, spins, geo }) {
  html.dataset.planeStart = String(performance.now());
  rememberIntro();
  root.classList.add('is-playing');

  const video = $('.hero-plane__video', root);
  const earth = $('.hero-plane__earth', root);
  const skip = $('[data-plane-skip]', root);
  const v = cfg.video || {};
  const codeMs = Number(cfg.codeMs) || 3600;
  let codeStarted = false;
  let finished = false;
  let raf = 0;
  let videoWait = 0;

  lockScroll(true);
  motionReady().then(() => {
    if (!finished) lockScroll(true); // Lenis создаётся позже секций — остановить и его
  });

  if (cfg.earth && earth) {
    earth.src = cfg.earth;
    earth.hidden = false;
  }

  const ceiling = setTimeout(() => finish(true), introCeilingMs(cfg));
  const onKey = (event) => {
    if (event.key === 'Escape') finish(true);
  };
  document.addEventListener('keydown', onKey);
  skip?.addEventListener('click', () => finish(true));

  // ——— ролик ———
  const conn = navigator.connection || {};
  const slow = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
  const src = window.matchMedia(MOBILE).matches ? v.srcMobile : v.src;
  if (!video || !src || slow) {
    startCode();
  } else {
    video.preload = 'auto';
    if (v.poster) video.poster = v.poster;
    video.addEventListener('playing', () => clearTimeout(videoWait), { once: true });
    video.addEventListener('ended', startCode, { once: true });
    video.addEventListener('error', startCode, { once: true });
    videoWait = setTimeout(() => {
      if (video.paused || video.currentTime === 0) startCode();
    }, VIDEO_START_MS);
    video.src = src;
    video.play?.()?.catch?.(() => startCode());
  }

  // ——— кодовая часть ———
  function startCode() {
    if (codeStarted || finished) return;
    codeStarted = true;
    clearTimeout(videoWait);
    video?.pause?.();
    const start = handoff(root, mark, v.plane);
    const t0 = performance.now();
    let landed = false;
    root.classList.add('is-code');
    const tick = (now) => {
      if (finished) return;
      try {
        const ms = now - t0;
        const g = geo();
        const pose = planePose(ms, start, g, codeMs);
        applyPose(flyer, pose, g);
        const [r, l] = ringSpins(pose.ring);
        if (spins[0]) spins[0].style.transform = `rotate(${r.toFixed(2)}deg)`;
        if (spins[1]) spins[1].style.transform = `rotate(${l.toFixed(2)}deg)`;
        if (!landed && ms >= PHASES.copy * (codeMs / 3600)) {
          landed = true;
          reveal();
        }
        if (pose.done) return finish(false);
        raf = requestAnimationFrame(tick);
      } catch (err) {
        console.error('[hero-plane]', err);
        finish(true);
      }
    };
    applyPose(flyer, planePose(0, start, geo(), codeMs), geo());
    raf = requestAnimationFrame(tick);
  }

  // шапка и тексты проявляются, пока самолётик садится
  function reveal() {
    html.classList.add('plane-revealing');
    html.classList.remove(INTRO_CLASS);
    lockScroll(false);
  }

  /** Главный экран. skipped — по «Пропустити», Esc, потолку или ошибке: короткий кроссфейд всего сразу. */
  function finish(skipped) {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    clearTimeout(ceiling);
    clearTimeout(videoWait);
    document.removeEventListener('keydown', onKey);
    if (skipped) root.classList.add('is-skipped');
    if (flyer) flyer.style.transform = '';
    for (const s of spins) s.style.transform = '';
    root.classList.add('is-code');
    reveal();
    root.classList.remove('is-playing');
    if (document.activeElement === skip) $('.hero-plane__cta', root)?.focus?.({ preventScroll: true });
    setTimeout(() => {
      video?.pause?.();
      video?.removeAttribute('src');
      video?.load?.();
      if (earth) earth.hidden = true;
      html.classList.remove('plane-revealing');
      root.classList.remove('is-skipped');
    }, 1200 + SKIP_FADE_MS);
    whenVisible(root, () => startCounters($$('[data-count]', root)));
  }
}

/** Поза самолётика из последнего кадра ролика — в координатах от центра надписи. */
function handoff(root, mark, plane = {}) {
  const box = root.getBoundingClientRect();
  const m = mark.getBoundingClientRect();
  const p = coverPoint(plane, box.width, box.height);
  return {
    x: p.x - (m.left - box.left + m.width / 2),
    y: p.y - (m.top - box.top + m.height / 2),
    w: (Number(plane.width) || 0.1) * p.frameWidth,
    a: Number(plane.angle) || 0,
  };
}

/** Элемент самолётика шириной в финальную позу; меньше — scale; крен — scaleY. */
function applyPose(flyer, pose, geo) {
  if (!flyer) return;
  const s = pose.w / geo.final.w;
  flyer.style.transform =
    `translate(-50%, -50%) translate3d(${pose.x.toFixed(2)}px, ${pose.y.toFixed(2)}px, 0) ` +
    `rotate(${pose.a.toFixed(2)}deg) scale(${s.toFixed(4)}, ${(s * pose.sy).toFixed(4)})`;
}

function rememberIntro() {
  try {
    localStorage.setItem(INTRO_KEY, String(Date.now()));
  } catch {
    /* хранилище недоступно — интро просто покажется снова */
  }
}

function whenVisible(root, fn) {
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    fn();
  });
  io.observe($('.hero-plane__stats', root) || root);
}

function startCounters(nodes) {
  for (const node of nodes) {
    const match = node.textContent.trim().match(COUNTABLE);
    if (!match) continue;
    const [, prefix, digits, suffix] = match;
    countTo(node, 0, Number(digits), { duration: 1400, format: (n) => `${prefix}${Math.round(n)}${suffix}` });
  }
}
