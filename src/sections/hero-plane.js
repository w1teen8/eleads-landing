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
// После интро (или сразу, если интро не было) на ≥900px без reduced-motion — сцена прокрутки, переход «как с планетой»:
// первый экран закрепляется, буквы «ELEADS» садятся на верхнюю дугу кольца и разлетаются по ней к зрителю, самолётик
// уходит вверх-вперёд, кольцо разворачивается в круг и растёт, пока не закроет экран, — и из центра раскрывается
// круглое окно, в котором уже ленты и следующие секции (они подъезжают под закреплённый экран). Окно — слой-вуаль цвета
// неба с прозрачным кругом в центре (radial-gradient), растёт только scale. Окно во весь экран — сцена открепляется.
// Кадры сцены — scrollScene() в hero-plane-model.js. На телефоне и при reduced-motion — обычный поток.
import { $, $$, el } from '../core/dom.js';
import { reduced, lockScroll, motionReady } from '../core/motion.js';
import { onLangChange } from '../core/i18n.js';
import { countTo } from '../core/format.js';
import config from '../data/config.json';
import { introCeilingMs, coverPoint, ringSpins, ringGeometry, planePose, PHASES, scrollScene, letterArc, SCENE } from './hero-plane-model.js';

/** Тот же ключ, что у заставки-поиска (preloader.js): время последнего показа интро. */
const INTRO_KEY = 'eleads-intro';
const INTRO_CLASS = 'js-plane-intro';
const MOBILE = '(max-width: 767px)';
const VIDEO_START_MS = 2000;
const SKIP_FADE_MS = 450;
export const SCENE_MEDIA = '(min-width: 900px)';
/** Длина закрепления сцены, экранов прокрутки. */
const PIN_SCREENS = 2.4;
/** Прозрачный круг вуали — доля от её радиуса; окно во весь экран — масштаб 1 / HOLE с запасом. */
const HOLE = 0.04;
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
    initScene(root);
    return;
  }

  try {
    runIntro(root, cfg, { html, mark, flyer, spins, geo: () => geo, done: () => initScene(root) });
  } catch (err) {
    console.error('[hero-plane]', err);
    html.classList.remove(INTRO_CLASS);
    lockScroll(false);
  }
}

function runIntro(root, cfg, { html, mark, flyer, spins, geo, done }) {
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
    done();
  }
}

/* ——— сцена прокрутки ——— */

/** Сцена строится один раз, когда первый экран уже финальный (после интро); дальше её ведёт gsap.matchMedia. */
function initScene(root) {
  if (reduced) return;
  const section = root.closest('[data-section="hero"]');
  if (!section || root.dataset.scene) return;
  root.dataset.scene = 'on';
  motionReady().then((api) => {
    if (!api) return; // GSAP не загрузился — обычный поток
    api.gsap.matchMedia().add(SCENE_MEDIA, () => {
      try {
        return buildScene(root, section, api);
      } catch (err) {
        console.error('[hero-plane] сцена прокрутки', err);
        section.classList.remove('is-plane-scene');
        return undefined;
      }
    });
  });
}

/** «ELEADS» → буквы-span (aria-hidden у родителя). Тот же текст — буквы не пересоздаются. */
function splitLetters(word) {
  const text = word.textContent.trim();
  const current = $$('.hero-plane__letter', word);
  if (current.length && current.map((n) => n.textContent).join('') === text) return current;
  word.textContent = '';
  const letters = [...text].map((char) => el('span', { class: 'hero-plane__letter', text: char }));
  word.append(...letters);
  return letters;
}

function buildScene(root, section, { ScrollTrigger }) {
  const word = $('.hero-plane__word > span', root);
  const mark = $('.hero-plane__mark', root);
  const ring = $('.hero-plane__ring', root);
  const flyer = $('.hero-plane__flyer', root);
  const copy = $('.hero-plane__copy', root);
  const halo = $('.hero-plane__halo', root);
  const stars = $('.hero-plane__stars', root);
  const sky = $('.hero-plane__sky', root);
  if (!word || !mark || !ring || !flyer || !copy || !stars || !sky) return undefined;

  const fly = el('div', { class: 'hero-plane__fly' });
  flyer.before(fly);
  fly.append(flyer);
  const veil = el('div', { class: 'hero-plane__veil' });
  sky.prepend(veil);
  section.classList.add('is-plane-scene');

  let letters = splitLetters(word);
  let geo = null;
  let next = null;
  let progress = 0;

  const host = () => (section.parentElement?.classList.contains('pin-spacer') ? section.parentElement : section);
  // следующая часть страницы (ленты) подъезжает под закреплённый экран: к середине раскрытия окна она стоит
  // в его центре, к концу сцены видна и следующая секция — после открепления прокрутка просто продолжается
  const placeNext = () => {
    if (next) next.style.marginTop = '';
    next = host().nextElementSibling;
    if (!next) return;
    const h = window.innerHeight;
    const mid = ((SCENE.window + 1) / 2) * PIN_SCREENS * h;
    next.style.marginTop = `${Math.max(0, Math.round(mid + 0.47 * h - next.offsetHeight / 2 - h))}px`;
  };

  const measure = () => {
    const ringGeo = ringGeometry(word.offsetWidth || 600);
    const cx = word.offsetWidth / 2;
    const w = section.offsetWidth;
    const h = root.offsetHeight;
    const mx = mark.offsetLeft;
    const my = mark.offsetTop;
    // от центра знака до дальнего угла экрана
    const far = Math.hypot(Math.max(mx, w - mx), Math.max(my, h - my));
    const n = letters.length;
    geo = {
      ring: ringGeo,
      fill: (far / ringGeo.rx) * 1.08,
      holeEnd: 1 / HOLE + 2,
      paths: letters.map((letter, i) => {
        const a = letterArc(ringGeo, i, n);
        const x0 = letter.offsetLeft + letter.offsetWidth / 2 - cx;
        return {
          x1: a.x - x0,
          y1: a.y - ringGeo.ry * 0.35,
          r1: a.r,
          x2: a.x * 2.4 - x0,
          y2: a.y * 2.4 - ringGeo.rx * 0.3,
          r2: Math.max(-70, Math.min(70, a.r * 1.3 + (i % 2 ? 12 : -12))),
        };
      }),
    };
    veil.style.setProperty('--veil-size', `${Math.ceil(far * 2.08)}px`);
  };

  const apply = (p) => {
    progress = p;
    if (!geo) measure();
    const f = scrollScene(p, { letters: letters.length, fill: geo.fill, holeEnd: geo.holeEnd });
    const g = geo.ring;
    copy.style.opacity = String(f.copy.opacity);
    copy.style.transform = f.copy.y ? `translate3d(0, ${(-f.copy.y * 9).toFixed(2)}vh, 0)` : '';
    copy.classList.toggle('is-gone', f.copy.opacity < 0.5);
    letters.forEach((letter, i) => {
      const { arc, fly: out } = f.letters[i];
      const q = geo.paths[i];
      const e = arc * arc * (3 - 2 * arc);
      const o = out * out;
      const x = q.x1 * e + (q.x2 - q.x1) * o;
      const y = q.y1 * e + (q.y2 - q.y1) * o;
      const r = q.r1 * e + (q.r2 - q.r1) * o;
      const s = 1 + 0.05 * e + 1.2 * o;
      letter.style.transform = arc
        ? `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`
        : '';
      letter.style.opacity = String(1 - out);
    });
    mark.style.transform = f.mark.scale !== 1 ? `scale(${f.mark.scale.toFixed(4)})` : '';
    const o = f.ring.open;
    ring.style.transform = o
      ? `rotate(${(g.tilt * (1 - o)).toFixed(2)}deg) scaleY(${(g.k + (1 - g.k) * o).toFixed(4)}) rotate(${g.spin}deg) scaleX(-1)`
      : '';
    ring.style.opacity = String(f.ring.opacity);
    const t = f.flyer.t;
    fly.style.transform = t
      ? `translate3d(${(g.rx * 0.4 * t).toFixed(1)}px, ${(-g.ry * 2.2 * t).toFixed(1)}px, 0) scale(${(1 + 1.5 * t).toFixed(3)})`
      : '';
    fly.style.opacity = String(f.flyer.opacity);
    if (halo) halo.style.opacity = String(f.halo.opacity);
    stars.style.transform = f.stars.scale !== 1 ? `scale(${f.stars.scale.toFixed(4)})` : '';
    stars.style.opacity = String(f.stars.opacity);
    veil.style.transform = `scale(${f.hole.scale.toFixed(3)})`;
  };

  placeNext();
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${Math.round(window.innerHeight * PIN_SCREENS)}`,
    pin: true,
    pinSpacing: false,
    anticipatePin: 1,
    refreshPriority: 1,
    invalidateOnRefresh: true,
    onRefreshInit: () => {
      geo = null;
      placeNext();
    },
    onRefresh: (self) => apply(self.progress),
    onUpdate: (self) => apply(self.progress),
  });
  placeNext(); // после обёртки pin-spacer следующий узел — сосед обёртки
  ScrollTrigger.refresh();

  // смена языка перерисовывает текст надписи — буквы собираются заново на том же месте сцены
  const offLang = onLangChange(() => {
    letters = splitLetters(word);
    geo = null;
    apply(progress);
  });

  return () => {
    // уход ниже 900px: обычный поток, всё как без сцены
    offLang();
    trigger.kill();
    section.classList.remove('is-plane-scene');
    if (next) next.style.marginTop = '';
    for (const node of [copy, mark, ring, fly, halo, stars, ...letters]) {
      if (!node) continue;
      node.style.transform = '';
      node.style.opacity = '';
    }
    copy.classList.remove('is-gone');
    fly.replaceWith(flyer);
    veil.remove();
    ScrollTrigger.refresh();
  };
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
