// Живой фон страницы (2026-11-11, «на фон добавить пятна или анимации… как на 3duva-studio.com, но по-своему»).
// Слой .backdrop закреплён за всей страницей: тёплые пятна света (CSS, backdrop.css) и волна из точек на canvas —
// сетка точек в перспективе, по ней медленно идёт волна; на гребнях точки разгораются жёлтым → оранжевым (цвета
// канала берутся из CSS-переменных, своих литералов нет). Прокрутка подгоняет волну и чуть сдвигает пятна,
// курсор прогибает волну под собой. Рисуется не чаще 30 раз в секунду, на скрытой вкладке стоит,
// при reduced-motion (и ?nomotion=1) — один неподвижный кадр.

const FPS = 30;
const DPR_MAX = 1.5;

function rgbOf(value, fallback) {
  const hex = String(value || '').trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback;
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));

/** Слой фона: пятна + canvas. Возвращает узел (для тестов и отладки). */
function mount() {
  const root = document.createElement('div');
  root.className = 'backdrop';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML =
    '<div class="backdrop__glows">' +
    '<span class="backdrop__glow backdrop__glow--sun"></span>' +
    '<span class="backdrop__glow backdrop__glow--ember"></span>' +
    '<span class="backdrop__glow backdrop__glow--light"></span>' +
    '</div>' +
    '<canvas class="backdrop__waves"></canvas>';
  document.body.prepend(root);
  return root;
}

export function initBackdrop({ reduced = false } = {}) {
  if (typeof document === 'undefined' || document.querySelector('.backdrop')) return null;
  const root = mount();
  const glows = root.querySelector('.backdrop__glows');
  const canvas = root.querySelector('.backdrop__waves');
  const ctx = canvas.getContext('2d');
  if (!ctx) return root;

  const css = getComputedStyle(document.documentElement);
  const text = rgbOf(css.getPropertyValue('--text'), [244, 242, 236]);
  const sun = rgbOf(css.getPropertyValue('--accent'), [255, 210, 63]);
  const ember = rgbOf(css.getPropertyValue('--accent-2'), [255, 138, 31]);

  let W = 0;
  let H = 0;
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let xs = new Float32Array(0);
  let zs = new Float32Array(0);
  // курсор в координатах мира (x — поперёк, z — вглубь), сглаженный
  const pointer = { x: 0, z: 3, tx: 0, tz: 3, power: 0, tpower: 0 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const narrow = W < 900;
    cols = narrow ? 56 : 112;
    rows = narrow ? 22 : 32;
    xs = new Float32Array(cols);
    zs = new Float32Array(rows);
    for (let i = 0; i < cols; i++) xs[i] = -1.7 + (3.4 * i) / (cols - 1);
    // ближе к зрителю ряды реже, вдали гуще — как у настоящей перспективы
    for (let j = 0; j < rows; j++) zs[j] = 1 + 5 * Math.pow(j / (rows - 1), 1.35);
  }

  const horizon = () => H * 0.36;
  const spread = () => H * 0.42;
  const focal = () => W * 0.52;

  function heightAt(x, z, t) {
    let y =
      0.2 * Math.sin(x * 2.1 + z * 0.9 + t * 0.55) +
      0.13 * Math.sin(z * 1.7 - x * 0.6 - t * 0.42) +
      0.06 * Math.sin((x + z) * 3.3 + t * 0.9);
    if (pointer.power > 0.001) {
      const dx = x - pointer.x;
      const dz = (z - pointer.z) * 0.6;
      y -= 0.28 * pointer.power * Math.exp(-(dx * dx + dz * dz) / 0.35);
    }
    return y;
  }

  function draw(t, scrollPhase) {
    ctx.clearRect(0, 0, W, H);
    const h0 = horizon();
    const s = spread();
    const f = focal();
    const phase = t + scrollPhase;
    for (let j = rows - 1; j >= 0; j--) {
      const z = zs[j];
      const depth = 1 - (z - 1) / 5; // 1 рядом, 0 у горизонта
      const size = Math.max(0.9, 2.8 / Math.pow(z, 0.7));
      for (let i = 0; i < cols; i++) {
        const x = xs[i];
        const y = heightAt(x, z, phase);
        const sx = W / 2 + (x / z) * f;
        if (sx < -4 || sx > W + 4) continue;
        const sy = h0 + ((0.9 - y) / z) * s;
        // гребень: точка поднялась выше 0.12 — разгорается
        const crest = Math.min(1, Math.max(0, (y - 0.1) / 0.24));
        const edge = Math.min(1, (1 - Math.abs(x) / 1.7) * 3);
        const alpha = (0.13 + 0.72 * crest) * (0.3 + 0.7 * depth) * edge;
        if (alpha < 0.012) continue;
        const warm = mix(sun, ember, (x + 1.7) / 3.4);
        const [r, g, b] = mix(text, warm, Math.min(1, crest * 1.4));
        ctx.fillStyle = `rgb(${r} ${g} ${b} / ${alpha.toFixed(3)})`;
        const d = size * (1 + crest * 0.8);
        // крупные (ближние, на гребне) — круглые; мелкие — квадратиком, так быстрее и на глаз не отличить
        if (d > 2.2) {
          ctx.beginPath();
          ctx.arc(sx, sy, d / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(sx - d / 2, sy - d / 2, d, d);
        }
      }
    }
  }

  resize();

  if (reduced) {
    draw(0.8, 0);
    window.addEventListener('resize', () => {
      resize();
      draw(0.8, 0);
    });
    return root;
  }

  // курсор: экранные координаты -> мир (обратная перспектива для плоскости волны)
  window.addEventListener(
    'pointermove',
    (e) => {
      const below = e.clientY - horizon();
      if (below <= 4) {
        pointer.tpower = 0;
        return;
      }
      const z = Math.min(6, Math.max(1, (0.9 * spread()) / below));
      pointer.tz = z;
      pointer.tx = ((e.clientX - W / 2) / focal()) * z;
      pointer.tpower = 1;
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => (pointer.tpower = 0));

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  let last = 0;
  let raf = 0;
  const start = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 1000 / FPS - 1) return;
    last = now;
    const k = 0.08;
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.z += (pointer.tz - pointer.z) * k;
    pointer.power += (pointer.tpower - pointer.power) * 0.05;
    const scroll = window.scrollY || 0;
    // прокрутка подгоняет волну и мягко качает пятна (по синусу — не уезжают за экран на длинной странице)
    glows.style.transform = `translate3d(0, ${(Math.sin(scroll / 1400) * 46).toFixed(1)}px, 0)`;
    draw((now - start) / 1000, scroll * 0.0016);
  }
  raf = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
  });

  return root;
}
