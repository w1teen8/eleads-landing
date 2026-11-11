// Живой фон страницы (2026-11-11): «на фон добавить пятна или анимации… как на 3duva-studio.com, но по-своему» →
// «На протяжении всей страницы должно меняться» → «Оставляем только пыль». Слой .backdrop закреплён за всей
// страницей: по экрану медленно всплывает и мерцает светящаяся пыль; при прокрутке ближние пылинки пролетают быстрее
// дальних (параллакс), поэтому фон меняется от блока к блоку. Цвета канала — из CSS-переменных, своих литералов нет.
// Рисуется не чаще 30 раз в секунду, на скрытой вкладке стоит, при reduced-motion (и ?nomotion=1) — один кадр.

const FPS = 30;
const DPR_MAX = 1; // пыль мелкая — высокое разрешение не видно, а весь экран перерисовывается каждый кадр

function rgbOf(value, fallback) {
  const hex = String(value || '').trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback;
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));

/** Пыль: n пылинок со своими [x 0…1, y 0…1, радиус, скорость (доля экрана/с), глубина 0.3…1, фаза]. */
export function makeDust(n, seed = 7) {
  let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: n }, () => [r(), r(), 0.6 + r() * 1.6, 0.004 + r() * 0.012, 0.3 + r() * 0.7, r() * 6.28]);
}

/** Положение пылинки по вертикали (0…1) в момент t при прокрутке scroll (в экранах): всплывает и уходит с параллаксом. */
export function dustY(y0, v, depth, t, screens) {
  return (((y0 - t * v - screens * 0.35 * depth) % 1) + 1) % 1;
}

function mount() {
  const root = document.createElement('div');
  root.className = 'backdrop';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<canvas class="backdrop__dust"></canvas>';
  document.body.prepend(root);
  return root;
}

export function initBackdrop({ reduced = false } = {}) {
  if (typeof document === 'undefined' || document.querySelector('.backdrop')) return null;
  const root = mount();
  const canvas = root.querySelector('.backdrop__dust');
  const ctx = canvas.getContext('2d');
  if (!ctx) return root;

  const css = getComputedStyle(document.documentElement);
  const text = rgbOf(css.getPropertyValue('--text'), [244, 242, 236]);
  const sun = rgbOf(css.getPropertyValue('--accent'), [255, 210, 63]);
  const warm = mix(text, sun, 0.75);

  let W = 0;
  let H = 0;
  let dust = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dust = makeDust(W < 900 ? 80 : 170);
  }

  function draw(t, scroll) {
    ctx.clearRect(0, 0, W, H);
    for (const [x0, y0, r, v, depth, ph] of dust) {
      const y = dustY(y0, v, depth, t, scroll / H) * H;
      const x = x0 * W + 10 * Math.sin(t * 0.25 + ph);
      const tw = 0.5 + 0.5 * Math.sin(t * 1.2 + ph);
      const a = (0.12 + 0.45 * tw) * depth;
      const [cr, cg, cb] = depth > 0.78 ? warm : text;
      ctx.fillStyle = `rgb(${cr} ${cg} ${cb} / ${a.toFixed(3)})`;
      const d = r * (0.6 + depth * 0.6) * 2;
      // крупные (ближние) — круглые; мелкие — квадратиком, так быстрее и на глаз не отличить
      if (d > 2.2) {
        ctx.beginPath();
        ctx.arc(x, y, d / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x - d / 2, y - d / 2, d, d);
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
    draw((now - start) / 1000, window.scrollY || 0);
  }
  raf = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
  });

  return root;
}
