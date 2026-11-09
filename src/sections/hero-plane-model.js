// Вариант 3 первого экрана — математика интро без DOM (проверяется тестами): потолок интро, стык с последним кадром
// ролика, геометрия кольца вокруг «ELEADS» и положение самолётика в каждый момент кодовой части.
// Координаты — в пикселях относительно центра надписи (ось y вниз), углы самолётика — градусы, 0 — нос вправо.
// Самолётик летит против часовой стрелки: подлёт от точки стыка → круг по эллипсу (за ним раскрывается кольцо) →
// влёт в центр кольца крупным планом.

/** Сколько мс после старта кодовой части длится каждая фаза (при codeMs = 3600; иначе — пропорционально). */
export const PHASES = { approach: [0, 900], loop: [900, 2400], land: [2400, 3300], copy: 3000 };
const BASE_MS = 3600;
const RAD = Math.PI / 180;

/** Потолок интро от его старта, мс: длина ролика (out − in) + кодовая часть + 2 с. Позже главный экран показывается в любом случае. */
export function introCeilingMs(cfg) {
  const v = cfg?.video || {};
  const len = Math.max(0, (Number(v.out) || 0) - (Number(v.in) || 0));
  return Math.round(len * 1000) + (Number(cfg?.codeMs) || BASE_MS) + 2000;
}

/** Точка кадра ролика (доли 0…1) → пиксели экрана W×H при object-fit: cover; frameWidth — ширина кадра на экране. */
export function coverPoint({ x = 0.5, y = 0.5 } = {}, W, H, aspect = 16 / 9) {
  const frameHeight = Math.max(H, W / aspect);
  const frameWidth = frameHeight * aspect;
  return { x: (W - frameWidth) / 2 + x * frameWidth, y: (H - frameHeight) / 2 + y * frameHeight, frameWidth };
}

/** Раскрытие кольца на θ градусов → повороты двух половинок (каждая 0…180). */
export function ringSpins(theta) {
  const t = Math.min(360, Math.max(0, Number(theta) || 0));
  return [Math.min(t, 180), Math.max(0, t - 180)];
}

/**
 * Геометрия по ширине надписи. Кольцо — круг диаметром ringSize с линией на 44 % от стороны (отступ под свечение),
 * в CSS: rotate(tilt) scaleY(k) rotate(spin) scaleX(-1) — эллипс rx × ry, раскрытие стартует с угла phi0 и идёт
 * против часовой стрелки. phi0 — справа вверху: самолётик из последнего кадра (нос вправо-вверх) долетает туда
 * по прямой и плавно доворачивает влево, на курс кольца.
 */
export function ringGeometry(wordWidth) {
  const rx = Math.max(60, wordWidth * 0.62);
  const k = 0.34;
  const ry = rx * k;
  const tilt = -6;
  const phi0 = -25;
  return {
    rx,
    ry,
    k,
    tilt,
    phi0,
    ringSize: (2 * rx) / 0.88,
    spin: phi0 + 90,
    loopWidth: rx * 0.2,
    final: { x: rx * 0.04, y: -ry * 0.06, w: rx * 0.86, a: -30 },
  };
}

/** Точка эллипса и курс самолётика (против часовой) при параметре phi, градусы. */
export function ellipseAt(geo, phi) {
  const p = phi * RAD;
  const t = geo.tilt * RAD;
  const lx = geo.rx * Math.cos(p);
  const ly = geo.ry * Math.sin(p);
  const tx = geo.rx * Math.sin(p);
  const ty = -geo.ry * Math.cos(p);
  return {
    x: lx * Math.cos(t) - ly * Math.sin(t),
    y: lx * Math.sin(t) + ly * Math.cos(t),
    a: Math.atan2(tx * Math.sin(t) + ty * Math.cos(t), tx * Math.cos(t) - ty * Math.sin(t)) / RAD,
  };
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
// круг: наполовину равномерно, наполовину плавно — скорость на входе близка к скорости подлёта
const loopEase = (t) => 0.5 * t + 0.5 * t * t * (3 - 2 * t);
/** Кратчайшая разница углов, градусы. */
const angleDelta = (from, to) => ((((to - from) % 360) + 540) % 360) - 180;

function bezier(p0, p1, p2, p3, u) {
  const v = 1 - u;
  return {
    x: v * v * v * p0.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * p3.x,
    y: v * v * v * p0.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * p3.y,
  };
}

const dir = (a) => ({ x: Math.cos(a * RAD), y: Math.sin(a * RAD) });

/** Крен: самолётик, летящий влево, переворачивается «через ребро», а не вверх ногами. */
const roll = (a) => {
  // ребром — только мгновение около вертикали: |cos|^0.3 почти всё время держит самолётик плоским
  const c = Math.cos(a * RAD);
  return Math.sign(c || 1) * Math.max(0.08, Math.abs(c) ** 0.3);
};

/**
 * Поза самолётика и раскрытие кольца через ms после старта кодовой части.
 * start — поза в последнем кадре ролика {x, y, w, a}; geo — ringGeometry(); codeMs — длина кодовой части.
 * → { x, y, w, a, sy (крен, −1…1), ring (градусы раскрытия 0…360), done }
 */
export function planePose(ms, start, geo, codeMs = BASE_MS) {
  const k = codeMs / BASE_MS;
  const [a0, a1] = PHASES.approach.map((v) => v * k);
  const [l0, l1] = PHASES.loop.map((v) => v * k);
  const [c0, c1] = PHASES.land.map((v) => v * k);
  const entry = ellipseAt(geo, geo.phi0);
  const depth = (phi) => 1 + 0.16 * Math.sin(phi * RAD); // ближняя (нижняя) часть эллипса — крупнее

  if (ms < l0) {
    const u = clamp01((ms - a0) / Math.max(1, a1 - a0));
    const reach = Math.hypot(entry.x - start.x, entry.y - start.y) * 0.55;
    const p1 = { x: start.x + dir(start.a).x * reach, y: start.y + dir(start.a).y * reach };
    const p2 = { x: entry.x - dir(entry.a).x * reach * 0.9, y: entry.y - dir(entry.a).y * reach * 0.9 };
    const p = bezier(start, p1, p2, entry, u);
    // нос доворачивает равномерно по всей фазе (по касательной кривой разворот собирался бы в конце рывком)
    const a = start.a + angleDelta(start.a, entry.a) * (u * u * (3 - 2 * u));
    const w = lerp(start.w, geo.loopWidth * depth(geo.phi0), u);
    return { x: p.x, y: p.y, w, a, sy: roll(a), ring: 0, done: false };
  }

  if (ms < c0) {
    const u = loopEase(clamp01((ms - l0) / Math.max(1, l1 - l0)));
    const phi = geo.phi0 - 360 * u;
    const p = ellipseAt(geo, phi);
    return { x: p.x, y: p.y, w: geo.loopWidth * depth(phi), a: p.a, sy: roll(p.a), ring: 360 * u, done: false };
  }

  const u = easeOutCubic(clamp01((ms - c0) / Math.max(1, c1 - c0)));
  const f = geo.final;
  // дуга внутрь кольца: продолжая курс кольца, разворот вниз и в центр снизу справа; нос плавно поворачивает к финальному курсу
  const lead = dir(entry.a);
  const p = bezier(entry, { x: entry.x + lead.x * geo.rx * 0.3, y: entry.y + lead.y * geo.rx * 0.3 }, { x: f.x + geo.rx * 0.3, y: f.y + geo.ry * 0.8 }, f, u);
  const a = entry.a + angleDelta(entry.a, f.a) * u;
  return {
    x: p.x,
    y: p.y,
    w: lerp(geo.loopWidth * depth(geo.phi0), f.w, u),
    a,
    sy: roll(a),
    ring: 360,
    done: ms >= codeMs,
  };
}

/* ——— сцена прокрутки (≥900px, после интро): p — прогресс закрепления 0…1 ——— */

/** Доли прогресса: когда начинается каждое движение. window — с этого момента из центра открывается окно. */
export const SCENE = {
  copy: [0, 0.16],
  letters: { start: 0.02, step: 0.03, arc: 0.14, fly: 0.16 },
  halo: [0.02, 0.3],
  flyer: [0.08, 0.5],
  flyerFade: [0.3, 0.5],
  grow: [0.12, 0.6],
  open: [0.12, 0.5],
  ringFade: [0.58, 0.7],
  stars: [0.1, 0.62],
  starsFade: [0.56, 0.62],
  window: 0.62,
};

const span = (p, [a, b]) => clamp01((p - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);

/**
 * Кадр сцены. letters — число букв, fill — масштаб знака, при котором кольцо закрывает экран,
 * holeEnd — масштаб окна, при котором оно шире экрана. Всё — числа для transform и opacity.
 */
export function scrollScene(progress, { letters = 6, fill = 8, holeEnd = 40 } = {}) {
  const p = clamp01(Number(progress) || 0);
  const L = SCENE.letters;
  const mid = (letters - 1) / 2;
  const copy = span(p, SCENE.copy);
  const grow = span(p, SCENE.grow);
  const hole = span(p, [SCENE.window, 1]);
  return {
    copy: { opacity: 1 - copy, y: copy },
    letters: Array.from({ length: letters }, (_, i) => {
      const at = L.start + Math.abs(i - mid) * L.step;
      return { arc: span(p, [at, at + L.arc]), fly: span(p, [at + L.arc, at + L.arc + L.fly]) };
    }),
    halo: { opacity: 1 - span(p, SCENE.halo) },
    mark: { scale: 1 + (fill - 1) * grow * grow },
    ring: { open: smooth(span(p, SCENE.open)), opacity: 1 - span(p, SCENE.ringFade) },
    flyer: { t: span(p, SCENE.flyer), opacity: 1 - span(p, SCENE.flyerFade) },
    stars: { scale: 1 + 0.6 * smooth(span(p, SCENE.stars)), opacity: 1 - span(p, SCENE.starsFade) },
    hole: { scale: 1 + (holeEnd - 1) * hole ** 1.5 },
  };
}

/** Точка буквы i из n на верхней дуге кольца (от центра надписи) и наклон по касательной, градусы. */
export function letterArc(geo, i, n) {
  const e = ellipseAt(geo, 200 + ((i + 0.5) / n) * 140);
  const r = ((((e.a - 180) % 360) + 540) % 360) - 180;
  return { x: e.x, y: e.y, r: Math.max(-60, Math.min(60, r)) };
}
