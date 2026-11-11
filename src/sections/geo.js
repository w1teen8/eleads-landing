// 08 GEO (T33, H45): точечный 3D-глобус (образец глобуса — reference/run3/geo-A-chosen.png, раскладка — «Л 4»
// reference/run3/geo-L4-chosen.png с просторными строками), поведение — как Framer «3D Dot Globe Map».
// T42 (правка клиента, reference/client-feedback/page-08.png): четыре переключателя — Україна, Європа, Америка/Канада,
// Worldwide; у Америки/Канады две метки (США и Канада) подсвечиваются вместе; Worldwide — весь мир: суша вся светится,
// горят метки всех регионов, глобус непрерывно вращается. В раскрытой карточке — число пользователей Telegram и
// «з них українців» (geo.regions.<id>.users / .ukrainians; у Worldwide — 1B+ MAU и .more); значение с цифрами
// докручивается барабанами (rollTo), «уточнити» — приглушённо (цифр клиент ещё не дал).
// Слева список регионов: строка — кнопка (aria-pressed), выбранная раскрыта в карточку. Выбор — клик, наведение мышью (с
// задержкой, чтобы проход курсора по списку не дёргал глобус), фокус, стрелки ↑/↓, Home/End; клик по метке на глобусе.
// Справа глобус на единственном <canvas> страницы (2000+ точек суши на каждом кадре SVG не тянет): выбранный регион
// всегда к зрителю лицом — после поворота к нему и ~6 с бездействия глобус медленно покачивается вокруг него (правка
// пользователя: «выбрана Європа, а глобус повёрнут к Америкам»); перетаскивание мышью и пальцем — с инерцией, через
// ~6 с бездействия глобус сам возвращается к региону; точки у курсора чуть «вспухают», метки светятся (у України —
// крупнее). Холст берёт размер у контейнера [data-geo-globe] (ResizeObserver), шар вписан по меньшей стороне в центре.
// Цикл кадров — только пока блок в окне и вкладка видна. reduced-motion и ?nomotion=1 — глобус стоит, повёрнут
// к Європі, выбор региона поворачивает его сразу. Цвета — из CSS-переменных (hex только в tokens.css).
// Математика (проекция, видимость, выбор метки, инерция) — geo-globe.js.
import { $, $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t, onLangChange } from '../core/i18n.js';
import { reduced } from '../core/motion.js';
import { FLIP } from '../core/motion-kit.js';
import { rollTo } from './stats-odometer.js';
import { isTbd } from './reviews-model.js';
import grid from '../data/geo-dots.json';
import {
  GLOBE,
  clamp,
  decay,
  dragView,
  focusView,
  isVisible,
  landDots,
  lonDelta,
  nearestRegion,
  project,
  regionAt,
  regionPins,
  spinView,
  swayView,
  swell,
  toVector,
  tweenView,
  viewBasis,
  wrapLon,
} from './geo-globe.js';

/** Регион по умолчанию — Європа (раскрыта и без JS). */
const DEFAULT = 'europe';
/** Уровней яркости точек: точки одного цвета и уровня рисуются одним путём. */
const LEVELS = 10;
/** Размеры в долях радиуса шара (образец: R ≈ 229 px — точка 2.6…4.2, метка 8 / 12, кольцо 18 / 26). */
const SIZE = { dot: 0.0112, dotZ: 0.0072, pin: 8 / 229, pinBig: 12 / 229, ring: 18 / 229, ringBig: 26 / 229, hit: 22 };
/** Пульс кольца активной метки, мс. */
const PULSE = 2400;
/** Сдвиг указателя, после которого нажатие — перетаскивание, а не клик, px. */
const CLICK_SLOP = 5;
/** Задержка выбора строки наведением мыши, мс. */
const HOVER_MS = 140;

/** Цвет CSS-переменной → [r, g, b] через пробный узел (computed color — rgb() или color(srgb …)). */
function readColor(host, name) {
  const probe = document.createElement('i');
  probe.style.cssText = `position:absolute;visibility:hidden;color:var(${name})`;
  host.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  const nums = (value.match(/-?[\d.]+/g) || []).map(Number);
  if (value.startsWith('color(')) return nums.slice(0, 3).map((n) => Math.round(n * 255));
  return nums.length >= 3 ? nums.slice(0, 3) : [255, 255, 255];
}

const mix = (a, b, k) => a.map((v, i) => Math.round(v * k + b[i] * (1 - k)));
const rgba = ([r, g, b], a = 1) => `rgba(${r},${g},${b},${a})`;

export function init(root) {
  accentTitles(root);
  const box = $('[data-geo-globe]', root);
  const canvas = $('[data-geo-canvas]', root);
  const list = $('[data-geo-list]', root);
  const rows = $$('.geo__row', root);
  const regions = Array.isArray(grid?.regions) ? grid.regions : [];
  const ctx = canvas?.getContext?.('2d');
  if (!box || !canvas || !ctx || !list || !rows.length || !regions.length) return;

  /* ——— данные шара ——— */
  const dots = landDots(grid);
  const count = dots.length;
  const vec = new Float32Array(count * 3);
  const owner = new Int8Array(count); // индекс региона точки или -1
  const marks = regionPins(regions); // у Америки/Канады — две метки, у Worldwide — ни одной
  dots.forEach((d, i) => {
    vec.set(toVector(d.lon, d.lat), i * 3);
    const k = nearestRegion(d.lon, d.lat, marks);
    owner[i] = k < 0 ? -1 : marks[k].region;
  });
  const pins = marks.map((m) => ({ id: m.id, v: toVector(m.lon, m.lat), big: m.id === 'ukraine' }));
  const isWorld = (id) => Boolean(regions.find((r) => r.id === id)?.world);
  const sx = new Float32Array(count);
  const sy = new Float32Array(count);
  const sr = new Float32Array(count);
  const bucket = new Int16Array(count); // цвет × LEVELS + уровень яркости; -1 — не рисуется

  const colors = {
    text: readColor(box, '--text'),
    sun: readColor(box, '--accent'),
    ember: readColor(box, '--accent-2'),
    bg: readColor(box, '--bg'),
  };
  // цвета точек: суша, регион, выбранный регион
  const tones = [colors.text, colors.ember, colors.sun];

  /* ——— состояние ——— */
  let active = DEFAULT;
  let view = focusView(regions.find((r) => r.id === DEFAULT) || regions[0]);
  let tween = null; // { from, to, start, ms }
  let vel = { lon: 0, lat: 0 }; // °/мс
  let home = { ...view }; // вид «лицом к выбранному региону» — центр покачивания
  let atHome = true; // глобус стоит у home (после перетаскивания — нет, пока не вернётся)
  let holdUntil = 0; // до этого времени автовращение стоит
  let swayT0 = 0; // начало покачивания
  let swayK = 0; // разгон покачивания 0 → 1
  let drag = null; // { id, x, y, x0, y0, touch, t, moved, total }
  let cursor = null; // { x, y } — мышь над холстом
  let hoverK = 0; // сила «вспухания» 0 → 1
  let W = 0; // размер холста в CSS px — от контейнера, шар вписан по меньшей стороне и стоит в центре
  let H = 0;
  let dpr = 1;
  let body = null; // градиент шара под текущий размер
  let inView = false;
  let raf = 0;
  let last = 0;
  let shownPins = []; // экранные метки последнего кадра — для клика и курсора

  /* ——— размер холста: от контейнера, к раскладке колонок не привязан ——— */
  function resize() {
    const w = Math.round(canvas.clientWidth);
    const h = Math.round(canvas.clientHeight);
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w;
    H = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const R = radius();
    body = ctx.createRadialGradient(W / 2 - R * 0.3, H / 2 - R * 0.4, R * 0.05, W / 2, H / 2, R);
    body.addColorStop(0, rgba(mix(colors.text, colors.bg, 0.12)));
    body.addColorStop(1, rgba(mix(colors.text, colors.bg, 0.035)));
    requestDraw();
  }

  const radius = () => {
    const side = Math.min(W, H);
    return side / 2 - Math.max(2, side * 0.012);
  };

  /* ——— кадр ——— */
  function draw(now) {
    if (!W || !H) return;
    const R = radius();
    const c = W / 2;
    const cy = H / 2;
    const basis = viewBasis(view);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // шар и тонкий ободок
    ctx.beginPath();
    ctx.arc(c, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = rgba(colors.sun, 0.25);
    ctx.stroke();

    // точки суши: проекция, размер и яркость от глубины (у края — темнее и мельче), у курсора — вспухают
    const reach = GLOBE.swell * R;
    const activeIndex = regions.findIndex((r) => r.id === active);
    const world = isWorld(active); // Worldwide: светится вся суша, регионы — ярче
    const { sl, cl, sf, cf } = basis;
    for (let i = 0; i < count; i += 1) {
      // project() без выделения памяти на каждую точку
      const vx = vec[i * 3];
      const vy = vec[i * 3 + 1];
      const vz = vec[i * 3 + 2];
      const zr = vx * sl + vz * cl;
      const z = vy * sf + zr * cf;
      if (!isVisible(z)) {
        bucket[i] = -1;
        continue;
      }
      const x = c + R * (vx * cl - vz * sl);
      const y = cy - R * (vy * cf - zr * sf);
      const s = cursor && hoverK > 0 ? swell(Math.hypot(x - cursor.x, y - cursor.y), reach) * hoverK : 0;
      const tone = owner[i] < 0 ? (world ? 1 : 0) : owner[i] === activeIndex || world ? 2 : 1;
      const alpha = tone === 0 ? 0.12 + z * 0.3 + s * 0.45 : 0.45 + z * 0.5 + s * 0.2;
      sx[i] = x;
      sy[i] = y;
      sr[i] = R * (SIZE.dot + SIZE.dotZ * z) * (1 + s * 0.85);
      bucket[i] = tone * LEVELS + Math.min(LEVELS - 1, Math.floor(clamp(alpha, 0, 1) * LEVELS));
    }
    for (let b = 0; b < tones.length * LEVELS; b += 1) {
      let any = false;
      ctx.beginPath();
      for (let i = 0; i < count; i += 1) {
        if (bucket[i] !== b) continue;
        any = true;
        ctx.moveTo(sx[i] + sr[i], sy[i]);
        ctx.arc(sx[i], sy[i], sr[i], 0, Math.PI * 2);
      }
      if (!any) continue;
      ctx.fillStyle = rgba(tones[Math.floor(b / LEVELS)], ((b % LEVELS) + 0.5) / LEVELS);
      ctx.fill();
    }

    // метки регионов: свечение, точка, кольцо; у выбранной — пульс; у края полусферы гаснут
    shownPins = [];
    const pulse = reduced ? 0 : (now % PULSE) / PULSE;
    for (const pin of pins) {
      const p = project(pin.v, basis);
      if (!isVisible(p.z)) continue;
      const fade = clamp(p.z / 0.2, 0, 1);
      const x = c + R * p.x;
      const y = cy - R * p.y;
      const on = pin.id === active || world;
      const r = R * (pin.big ? SIZE.pinBig : SIZE.pin) * (on ? 1.15 : 1);
      const ring = R * (pin.big ? SIZE.ringBig : SIZE.ring);
      shownPins.push({ id: pin.id, x, y, z: p.z });

      const glow = ctx.createRadialGradient(x, y, 0, x, y, ring * 1.6);
      glow.addColorStop(0, rgba(colors.ember, 0.42 * fade));
      glow.addColorStop(1, rgba(colors.ember, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, ring * 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(pin.big || on ? colors.sun : colors.ember, fade);
      ctx.fill();

      ctx.lineWidth = on ? 2 : 1.5;
      ctx.beginPath();
      ctx.arc(x, y, ring, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(colors.sun, (on ? 0.7 : 0.35) * fade);
      ctx.stroke();

      if (on && pulse) {
        ctx.beginPath();
        ctx.arc(x, y, ring * (1 + pulse * 1.2), 0, Math.PI * 2);
        ctx.strokeStyle = rgba(colors.sun, 0.55 * (1 - pulse) * fade);
        ctx.stroke();
      }
    }
  }

  /* ——— движение ——— */
  function step(now) {
    const dt = last ? Math.min(now - last, 64) : 16;
    last = now;
    if (drag?.moved) {
      // вид ставит pointermove
    } else if (tween) {
      const k = (now - tween.start) / tween.ms;
      view = tweenView(tween.from, tween.to, k);
      if (k >= 1) {
        tween = null;
        atHome = true;
        swayK = 0;
      }
    } else if (Math.abs(vel.lon) + Math.abs(vel.lat) > 1e-4) {
      view = {
        lon: wrapLon(view.lon + vel.lon * dt),
        lat: clamp(view.lat + vel.lat * dt, -GLOBE.tiltMax, GLOBE.tiltMax),
      };
      vel = { lon: decay(vel.lon, dt), lat: decay(vel.lat, dt) };
    } else if (now >= holdUntil) {
      if (!atHome) {
        // после перетаскивания и паузы — плавно обратно лицом к выбранному региону, потом покачивание
        goHome(now);
      } else {
        if (swayK === 0) swayT0 = now;
        swayK = Math.min(1, swayK + dt / GLOBE.swayRamp);
        // Worldwide — непрерывное вращение (весь мир), регион — покачивание вокруг него
        view = isWorld(active) ? spinView(view, dt, swayK) : swayView(home, now - swayT0, swayK);
      }
    }
    hoverK = clamp(hoverK + (cursor ? dt : -dt) / 220, 0, 1);
    draw(now);
  }

  function loop(now) {
    raf = 0;
    if (!running()) {
      last = 0;
      return;
    }
    step(now);
    raf = requestAnimationFrame(loop);
  }

  const running = () => !reduced && inView && document.visibilityState === 'visible';

  function wake() {
    if (!raf && running()) raf = requestAnimationFrame(loop);
  }

  /** Один кадр по требованию: при reduced-motion и пока цикл стоит (размер, выбор региона). */
  function requestDraw() {
    if (raf) return;
    if (running()) {
      wake();
      return;
    }
    raf = requestAnimationFrame((now) => {
      raf = 0;
      draw(now);
      wake();
    });
  }

  /* ——— выбор региона: строка списка раскрывается в карточку ——— */
  const zeros = (value) => value.replace(/\d/g, '0');

  function paint({ animate }) {
    const moving = animate && !reduced;
    const items = moving ? rows.map((row) => row.parentElement) : [];
    const before = items.map((item) => item.getBoundingClientRect().top);
    for (const row of rows) {
      const open = row.dataset.region === active;
      const was = row.getAttribute('aria-pressed') === 'true';
      row.setAttribute('aria-pressed', String(open));
      if (!open || was || !moving) continue;
      // раскрытие: описание проявляется (opacity/transform), цифра докручивается барабанами с нулей
      $('.geo__row-info', row)?.animate(
        { opacity: [0, 1], transform: ['translateY(0.4em)', 'translateY(0)'] },
        { duration: 450, easing: FLIP.easing },
      );
      for (const figure of $$('[data-geo-figure]', row)) {
        const value = t(figure.dataset.i18n);
        if (typeof value === 'string' && /\d/.test(value) && !isTbd(value)) rollTo(figure, value, { from: zeros(value) });
      }
    }
    // строки доезжают на новые места (FLIP, только transform): раскрытая карточка выше свёрнутой строки
    items.forEach((item, i) => {
      const dy = before[i] - item.getBoundingClientRect().top;
      if (Math.abs(dy) < 1 || typeof item.animate !== 'function') return;
      item.animate({ transform: [`translateY(${dy}px)`, 'translateY(0)'] }, { duration: 500, easing: FLIP.easing });
    });
  }

  /** Плавный поворот лицом к home; длительность — от расстояния. Возвращает время окончания. */
  function goHome(now) {
    // Worldwide: «лица» у мира нет — вращение продолжается с той долготы, где глобус сейчас, выравнивается только наклон
    if (isWorld(active) && !atHome) home = { lon: view.lon, lat: home.lat };
    const far = Math.max(Math.abs(lonDelta(view.lon, home.lon)), Math.abs(home.lat - view.lat));
    const ms = GLOBE.focusMs * clamp(far / 120, 0.45, 1);
    tween = { from: { ...view }, to: { ...home }, start: now, ms };
    vel = { lon: 0, lat: 0 };
    return now + ms;
  }

  function select(id) {
    const region = regions.find((r) => r.id === id);
    if (!region) return;
    const changed = id !== active;
    active = id;
    home = focusView(region);
    vel = { lon: 0, lat: 0 };
    if (reduced) {
      view = { ...home };
      tween = null;
      atHome = true;
    } else {
      // поворот к региону, потом пауза бездействия ~6 с, потом покачивание вокруг него; Worldwide вращается сразу
      const done = goHome(performance.now());
      holdUntil = isWorld(id) ? done : done + GLOBE.idleMs;
    }
    if (changed) paint({ animate: true });
    requestDraw();
  }

  /* ——— список: клик, фокус, наведение мышью (с задержкой и только при реальном движении курсора — раскрытие
     карточки сдвигает строки под неподвижным курсором), стрелки ↑/↓, Home/End ——— */
  let hoverTimer = 0;
  for (const row of rows) {
    on(row, 'click', () => select(row.dataset.region));
    on(row, 'focus', () => select(row.dataset.region));
    on(row, 'pointermove', (e) => {
      if (e.pointerType !== 'mouse' || (!e.movementX && !e.movementY) || row.dataset.region === active) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => select(row.dataset.region), HOVER_MS);
    });
    on(row, 'pointerleave', () => clearTimeout(hoverTimer));
  }
  on(list, 'keydown', (e) => {
    const i = rows.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: rows.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    rows[(next + rows.length) % rows.length].focus();
  });

  /* ——— указатель: перетаскивание, клик по метке, «вспухание» у курсора ——— */
  const local = (e) => {
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) * W) / (rect.width || 1), y: ((e.clientY - rect.top) * H) / (rect.height || 1) };
  };
  const pinAt = (p) => regionAt(shownPins, p.x, p.y, Math.max(SIZE.hit, radius() * SIZE.ring * 1.1));
  const onSphere = (p) => Math.hypot(p.x - W / 2, p.y - H / 2) <= radius();

  on(canvas, 'pointerdown', (e) => {
    if (e.button !== 0 || !W) return;
    const p = local(e);
    if (!onSphere(p)) return;
    drag = { id: e.pointerId, x: p.x, y: p.y, x0: p.x, y0: p.y, touch: e.pointerType !== 'mouse', t: performance.now(), moved: false, total: 0 };
    vel = { lon: 0, lat: 0 };
    canvas.setPointerCapture?.(e.pointerId);
  });

  on(canvas, 'pointermove', (e) => {
    const p = local(e);
    if (e.pointerType === 'mouse' && !reduced) {
      cursor = onSphere(p) ? p : null;
      if (cursor && holdUntil > performance.now()) holdUntil = Math.max(holdUntil, performance.now() + GLOBE.idleMs);
    }
    if (drag && drag.id === e.pointerId) {
      const dx = p.x - drag.x;
      const dy = p.y - drag.y;
      drag.total += Math.hypot(dx, dy);
      if (!drag.moved && drag.total < CLICK_SLOP) return;
      if (!drag.moved && drag.touch && Math.abs(p.y - drag.y0) > Math.abs(p.x - drag.x0)) {
        // палец пошёл вертикально — это прокрутка страницы (touch-action: pan-y), глобус не трогаем
        drag = null;
        return;
      }
      if (!drag.moved) {
        drag.moved = true;
        tween = null;
        atHome = false;
        canvas.classList.add('is-drag');
      }
      const now = performance.now();
      const next = dragView(view, dx, dy, radius());
      const dt = Math.max(now - drag.t, 1);
      const inst = { lon: lonDelta(view.lon, next.lon) / dt, lat: (next.lat - view.lat) / dt };
      vel = { lon: inst.lon * 0.8 + vel.lon * 0.2, lat: inst.lat * 0.8 + vel.lat * 0.2 };
      view = next;
      Object.assign(drag, { x: p.x, y: p.y, t: now });
      requestDraw();
      return;
    }
    canvas.classList.toggle('is-pin', Boolean(cursor && pinAt(p)));
  });

  function release(e, cancelled) {
    if (!drag || drag.id !== e.pointerId) return;
    const { moved, t: lastMove } = drag;
    drag = null;
    canvas.classList.remove('is-drag');
    const now = performance.now();
    if (!moved) {
      vel = { lon: 0, lat: 0 };
      if (!cancelled) {
        const id = pinAt(local(e));
        if (id) select(id);
      }
      return;
    }
    // инерция — если палец ещё двигался в момент отпускания; через ~6 с бездействия глобус сам вернётся лицом
    // к выбранному региону (подсветка справа не спорит с картинкой)
    if (cancelled || reduced || now - lastMove > 80) vel = { lon: 0, lat: 0 };
    vel.lat = clamp(vel.lat, -0.3, 0.3);
    vel.lon = clamp(vel.lon, -0.6, 0.6);
    holdUntil = now + GLOBE.idleMs;
    requestDraw();
  }

  on(canvas, 'pointerup', (e) => release(e, false));
  on(canvas, 'pointercancel', (e) => release(e, true));
  on(canvas, 'pointerleave', (e) => {
    if (e.pointerType === 'mouse') cursor = null;
    canvas.classList.remove('is-pin');
  });

  /* ——— видимость: цикл кадров только пока блок в окне и вкладка видна ——— */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) requestDraw();
      },
      { rootMargin: '80px 0px' },
    ).observe(box);
  } else {
    inView = true;
  }
  on(document, 'visibilitychange', wake);

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(box);
  else on(window, 'resize', resize);
  resize();

  /* значения без цифр от клиента («уточнити» / «TBD») — приглушённо; поле правится в админке текстов */
  const markTbd = () => {
    for (const figure of $$('[data-geo-figure]', root)) figure.classList.toggle('is-tbd', isTbd(t(figure.dataset.i18n)));
  };
  onLangChange(markTbd);
  markTbd();

  paint({ animate: false });
}
