// Точечные карты блока 02 (T25): кружки SVG и их движение. Математика — в stats-model.js.
//   волны      — круги по воде: от движения курсора (слабые), от клика или тапа (сильная, через всю карту),
//                редкие слабые «вдохи» без курсора; на гребне точки растут и становятся ярче;
//   пружины    — точки вплотную к курсору расталкиваются от него и пружинят обратно (только мышь);
//   зажигание  — волна от заданной точки (Киев) включает горящие точки и останавливается ровно на их наборе.
// У точек меняются только transform и opacity. За кадр переписываются только точки в зоне волн, пружин и фронта
// зажигания; цикл requestAnimationFrame идёт, только пока есть что двигать и карта в окне.
// При reduced-motion карта рисуется сразу в конечном виде и ничего не слушает.
import { $, on } from '../core/dom.js';
import { reduced } from '../core/motion.js';
import { gridDots, litSet, waveStrength, waveAlive, repelOffset, springStep, igniteLevel, farthest } from './stats-model.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Радиус точки в шагах сетки (шаг = 1): между соседними остаётся зазор. */
const DOT_R = 0.36;
/** Непрозрачность точек в покое — те же числа стоят в stats.css; на гребне волны точка доходит до 1. */
export const DOT_OPACITY = { lit: 0.88, off: 0.31, dark: 0.14 };
/** Гребень волны: прибавка к размеру точки и её сдвиг от источника (в шагах сетки) при силе волны 1. */
const CREST = { scale: 0.6, shift: 0.22, glow: 0.55 };
/** Виды волн. speed — шагов сетки в секунду; у волн «через всю карту» вместо speed — sweep, секунд на всю карту. */
const WAVES = {
  trail: { speed: 10, width: 1.5, reach: 7, amp: 0.55 },
  tap: { sweep: 1.25, width: 2.4, amp: 1 },
  breath: { sweep: 3.4, width: 3.2, amp: 0.24 },
  ignite: { sweep: 0.95, width: 2.4, amp: 0.85 },
};
/** След курсора: новая волна не чаще, чем раз в TRAIL_MS и не ближе TRAIL_STEP шагов от прошлой. */
const TRAIL_MS = 110;
const TRAIL_STEP = 1.3;
const MAX_WAVES = 8;
/** Расталкивание у курсора и пружина возврата (недожатая — точка проскакивает место и возвращается). */
const REPEL = { reach: 2.4, push: 0.62 };
const SPRING = { stiffness: 190, damping: 11 };
const SPRING_REST = 0.004;
/** «Дыхание» поля без курсора: от пуска одной слабой волны до следующей, мс — волна идёт ≈3,4 с, потом пауза. */
const BREATH_MS = [6500, 11000];
/** Ширина полосы за фронтом зажигания, в которой точка набирает яркость, шагов сетки. */
const IGNITE_BAND = 3;
/** Зажигание стартует, когда в окне не меньше этой доли карты. */
const IGNITE_IN_VIEW = 0.25;

/**
 * Рисует карту в <svg> внутри box и оживляет её. share — доля горящих точек (null — горят все).
 * Возвращает { box, svg, dots, lit, darken(), ignite(origin), wave(point, kind), center }.
 */
export function createDotMap(box, grid, { stride = 1, share = null } = {}) {
  const svg = box && $('svg', box);
  const layer = svg && $('g', svg);
  if (!layer) return null;
  const { dots, width, height } = gridDots(grid, { stride });
  const count = dots.length;
  const lit = share == null ? null : litSet(count, share);
  const isLit = (i) => !lit || lit.has(i);
  const nodes = dots.map((dot, i) => {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(dot.x));
    circle.setAttribute('cy', String(dot.y));
    circle.setAttribute('r', String(DOT_R));
    circle.setAttribute('class', isLit(i) ? 'stats__dot' : 'stats__dot stats__dot--off');
    return circle;
  });
  layer.replaceChildren(...nodes);
  box.dataset.statsDots = String(count);
  box.dataset.statsLit = String(lit ? lit.size : count);

  const center = { x: width / 2, y: height / 2 };
  const map = { box, svg, dots, lit, center, darken() {}, ignite: () => Promise.resolve(), wave() {} };
  if (reduced || typeof requestAnimationFrame !== 'function') return map;

  /* ——— состояние ——— */
  const strength = new Float32Array(count); // сумма сил волн в точке за кадр
  const pushX = new Float32Array(count); // сдвиг от волн
  const pushY = new Float32Array(count);
  const targetX = new Float32Array(count); // куда тянет пружину курсор
  const targetY = new Float32Array(count);
  const offsetX = new Float32Array(count); // пружина: положение и скорость
  const offsetY = new Float32Array(count);
  const speedX = new Float32Array(count);
  const speedY = new Float32Array(count);
  const level = new Float32Array(count).fill(1); // зажигание: 0 — ещё тёмная, 1 — горит
  const stamp = new Uint32Array(count); // номер кадра, в котором точку трогали
  const springing = new Uint8Array(count);
  const written = new Int16Array(count * 4).fill(-32768); // что стоит в style: масштаб, сдвиг x/y, непрозрачность
  let touched = []; // точки этого кадра
  let previous = []; // точки прошлого кадра — им надо вернуть покой
  let springs = [];
  let waves = [];
  let ignition = null;
  let dark = false;
  let pointer = null; // курсор мыши в экранных координатах
  let lastTrail = null;
  let frame = 0;
  let frameId = 0;
  let lastTime = 0;
  let visible = false; // карта хоть краем в окне — можно крутить цикл
  let inView = false; // карта в окне заметной частью — можно зажигать
  let pending = null; // зажигание, которое ждёт, пока карта войдёт в окно
  let breathTimer = 0;

  const restOpacity = (i) => (isLit(i) ? (dark ? DOT_OPACITY.dark : DOT_OPACITY.lit) : DOT_OPACITY.off);

  function touch(i) {
    if (stamp[i] === frameId) return;
    stamp[i] = frameId;
    strength[i] = 0;
    pushX[i] = 0;
    pushY[i] = 0;
    targetX[i] = 0;
    targetY[i] = 0;
    touched.push(i);
  }

  function toMap(clientX, clientY) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const inv = matrix.inverse();
    return { x: inv.a * clientX + inv.c * clientY + inv.e, y: inv.b * clientX + inv.d * clientY + inv.f };
  }

  /** Записывает точке transform и opacity; покой — пустой style. Пишет, только если значение изменилось. */
  function paint(i) {
    const s = Math.min(strength[i], 1.2);
    const lv = level[i];
    const scale = Math.round((1 + CREST.scale * s * (isLit(i) ? 0.4 + 0.6 * lv : 1)) * 100);
    const x = Math.round((pushX[i] * CREST.shift + offsetX[i]) * 100);
    const y = Math.round((pushY[i] * CREST.shift + offsetY[i]) * 100);
    const rest = restOpacity(i);
    const base = isLit(i) ? DOT_OPACITY.dark + (DOT_OPACITY.lit - DOT_OPACITY.dark) * (dark ? lv : 1) : DOT_OPACITY.off;
    const glow = Math.min(1, s) * (isLit(i) ? (1 - base) * (dark ? Math.max(lv, 0.35) : 1) : CREST.glow);
    const opacity = Math.round(Math.min(1, base + glow) * 100);
    const k = i * 4;
    if (written[k] === scale && written[k + 1] === x && written[k + 2] === y && written[k + 3] === opacity) return;
    written[k] = scale;
    written[k + 1] = x;
    written[k + 2] = y;
    written[k + 3] = opacity;
    const node = nodes[i];
    node.style.transform = scale === 100 && !x && !y ? '' : `translate(${x / 100}px, ${y / 100}px) scale(${scale / 100})`;
    node.style.opacity = opacity === Math.round(rest * 100) ? '' : String(opacity / 100);
  }

  /** Конец зажигания: горит весь набор. Яркость покоя снова даёт CSS — горящие точки перекрашиваются этим же кадром. */
  function finishIgnition() {
    if (!ignition) return;
    const { resolve } = ignition;
    ignition = null;
    pending = null;
    dark = false;
    box.classList.remove('is-dark');
    level.fill(1);
    for (let i = 0; i < count; i++) {
      if (!isLit(i)) continue;
      written[i * 4 + 3] = -32768;
      touch(i);
    }
    resolve();
  }

  /** Кадр вне цикла: вернуть в покой всё, что когда-либо красили. */
  function settle() {
    frameId++;
    touched = [];
    for (let i = 0; i < count; i++) if (written[i * 4] !== -32768) touch(i);
    for (const i of touched) paint(i);
    previous = [];
  }

  function tick(now) {
    frame = 0;
    const time = now / 1000;
    const dt = Math.min(0.034, lastTime ? time - lastTime : 0.016);
    lastTime = time;
    frameId++;
    touched = [];
    for (const i of previous) touch(i);

    // волны
    waves = waves.filter((wave) => waveAlive(wave, time - wave.start));
    for (const wave of waves) {
      const age = time - wave.start;
      const far = wave.speed * age + wave.width;
      const near = wave.speed * age - wave.width;
      for (let i = 0; i < count; i++) {
        const dx = dots[i].x - wave.x;
        if (dx > far || dx < -far) continue;
        const dy = dots[i].y - wave.y;
        if (dy > far || dy < -far) continue;
        const d = Math.hypot(dx, dy);
        if (d >= far || d <= near) continue;
        const s = waveStrength(wave, d, age);
        if (!s) continue;
        touch(i);
        strength[i] += s;
        if (d > 0) {
          pushX[i] += (dx / d) * s;
          pushY[i] += (dy / d) * s;
        }
      }
    }

    // расталкивание у курсора
    const at = pointer && toMap(pointer.x, pointer.y);
    if (at) {
      for (let i = 0; i < count; i++) {
        const dx = dots[i].x - at.x;
        if (dx > REPEL.reach || dx < -REPEL.reach) continue;
        const dy = dots[i].y - at.y;
        if (dy > REPEL.reach || dy < -REPEL.reach) continue;
        const away = repelOffset(dx, dy, REPEL);
        if (!away.x && !away.y) continue;
        touch(i);
        targetX[i] = away.x;
        targetY[i] = away.y;
        if (!springing[i]) {
          springing[i] = 1;
          springs.push(i);
        }
      }
    }
    if (springs.length) {
      const still = [];
      for (const i of springs) {
        touch(i);
        [offsetX[i], speedX[i]] = springStep(offsetX[i], speedX[i], targetX[i], dt, SPRING);
        [offsetY[i], speedY[i]] = springStep(offsetY[i], speedY[i], targetY[i], dt, SPRING);
        const resting =
          !targetX[i] && !targetY[i] && Math.abs(offsetX[i]) + Math.abs(offsetY[i]) + (Math.abs(speedX[i]) + Math.abs(speedY[i])) * 0.05 < SPRING_REST;
        if (resting) {
          offsetX[i] = offsetY[i] = speedX[i] = speedY[i] = 0;
          springing[i] = 0;
        } else {
          still.push(i);
        }
      }
      springs = still;
    }

    // зажигание: фронт включает горящие точки
    if (ignition) {
      const front = ignition.speed * (time - ignition.start);
      for (let i = 0; i < count; i++) {
        if (!isLit(i) || level[i] === 1) continue;
        const next = igniteLevel(ignition.distance[i], front, IGNITE_BAND);
        if (next === level[i]) continue;
        level[i] = next;
        touch(i);
      }
      if (front >= ignition.reach + IGNITE_BAND) finishIgnition();
    }

    for (const i of touched) paint(i);
    previous = touched.filter((i) => strength[i] > 0 || springing[i] || (ignition && level[i] > 0 && level[i] < 1));
    if (waves.length || springs.length || ignition || previous.length) run();
  }

  function run() {
    if (!frame && visible) frame = requestAnimationFrame(tick);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  /** Пускает волну из точки карты. kind — 'trail' | 'tap' | 'breath' | 'ignite'. */
  function wave(point, kind = 'tap') {
    if (!visible || !point) return;
    const spec = WAVES[kind];
    const reach = spec.reach ?? farthest(dots, point);
    const speed = spec.speed ?? (reach + spec.width) / spec.sweep;
    if (waves.length >= MAX_WAVES) waves.shift();
    waves.push({ x: point.x, y: point.y, start: performance.now() / 1000, speed, width: spec.width, reach: reach + spec.width, amp: spec.amp });
    run();
  }

  /* ——— курсор, клик, тап ——— */
  on(box, 'pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    pointer = { x: e.clientX, y: e.clientY };
    const at = toMap(e.clientX, e.clientY);
    const now = performance.now();
    if (at && (!lastTrail || (now - lastTrail.time > TRAIL_MS && Math.hypot(at.x - lastTrail.x, at.y - lastTrail.y) > TRAIL_STEP))) {
      lastTrail = { ...at, time: now };
      wave(at, 'trail');
    }
    run();
  });
  on(box, 'pointerleave', () => {
    pointer = null;
    lastTrail = null;
    run();
  });
  on(box, 'pointerdown', (e) => wave(toMap(e.clientX, e.clientY), 'tap'));

  /* ——— «дыхание» и остановка вне окна ——— */
  function breathe() {
    clearTimeout(breathTimer);
    if (!visible) return;
    breathTimer = setTimeout(() => {
      if (!document.hidden && !pointer && !ignition && waves.length < 2) wave(dots[Math.floor(Math.random() * count)], 'breath');
      breathe();
    }, BREATH_MS[0] + Math.random() * (BREATH_MS[1] - BREATH_MS[0]));
  }

  function setVisible(next) {
    if (next === visible) return;
    visible = next;
    if (visible) {
      breathe();
      if (waves.length || springs.length || ignition || previous.length) run();
      return;
    }
    // карта ушла из окна (или вкладка скрыта): всё гаснет, цикл и таймер останавливаются
    clearTimeout(breathTimer);
    stop();
    waves = [];
    pointer = null;
    lastTrail = null;
    if (ignition) finishIgnition();
    for (const i of springs) {
      offsetX[i] = offsetY[i] = speedX[i] = speedY[i] = 0;
      springing[i] = 0;
    }
    springs = [];
    settle();
  }

  function startIgnition({ origin, resolve }) {
    pending = null;
    const reach = farthest(dots, origin);
    const distance = new Float32Array(count);
    for (let i = 0; i < count; i++) distance[i] = Math.hypot(dots[i].x - origin.x, dots[i].y - origin.y);
    ignition = { start: performance.now() / 1000, speed: (reach + IGNITE_BAND) / WAVES.ignite.sweep, reach, distance, resolve };
    wave(origin, 'ignite');
    run();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        setVisible(entry.isIntersecting);
        inView = entry.isIntersecting && entry.intersectionRatio >= IGNITE_IN_VIEW;
        if (inView && pending) startIgnition(pending);
      },
      { threshold: [0, IGNITE_IN_VIEW] },
    ).observe(box);
  } else {
    setVisible(true);
    inView = true;
  }

  /** До зажигания: горящие точки тусклые (класс is-dark, вид — в stats.css). */
  map.darken = () => {
    dark = true;
    level.fill(0);
    box.classList.add('is-dark');
  };

  /**
   * Волна от origin зажигает горящие точки; резолвится, когда горит весь набор. Карта ещё не в окне — зажигание
   * ждёт, пока она войдёт. Анимации отключены на лету (сбой загрузки GSAP снял .js-anim) — сразу конечный вид.
   */
  map.ignite = (origin = center) =>
    new Promise((resolve) => {
      if (!dark || ignition || pending) {
        resolve();
      } else if (!document.documentElement.classList.contains('js-anim')) {
        ignition = { resolve };
        finishIgnition();
        settle();
      } else if (inView) {
        startIgnition({ origin, resolve });
      } else {
        pending = { origin, resolve };
      }
    });
  map.wave = wave;
  return map;
}
