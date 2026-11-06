// Прелоадер: 0→100% за ~1.2 с (держится на 90%, пока страница не загрузилась), жёсткий потолок 2.5 с,
// затем шторка уходит вверх transform-ом. Один раз за сессию; при reduced-motion его нет
// (класс html.js-preload не ставится инлайн-скриптом).
import { signalIntroDone } from '../core/intro.js';

const MIN_MS = 1000;
const MAX_MS = 2500;
const SESSION_KEY = 'eleads-intro';

export function init(root) {
  const html = document.documentElement;
  if (!html.classList.contains('js-preload')) {
    root.hidden = true;
    signalIntroDone();
    return;
  }

  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* без sessionStorage заставка просто покажется снова */
  }

  const valueNode = root.querySelector('.preloader__value');
  const barNode = root.querySelector('.preloader__bar-fill');
  const start = performance.now();
  let loaded = document.readyState === 'complete';
  let shown = 0;
  let done = false;

  window.addEventListener('load', () => (loaded = true), { once: true });

  const finish = () => {
    if (done) return;
    done = true;
    valueNode.textContent = '100';
    barNode.style.transform = 'scaleX(1)';
    root.classList.add('is-leaving');
    signalIntroDone();
    const cleanup = () => {
      html.classList.remove('js-preload');
      root.hidden = true;
    };
    root.addEventListener('transitionend', (e) => e.target === root && cleanup(), { once: true });
    setTimeout(cleanup, 1300);
  };

  const tick = (now) => {
    if (done) return;
    const elapsed = now - start;
    const timeShare = Math.min(1, elapsed / MIN_MS);
    let target = loaded ? timeShare : Math.min(0.9, timeShare);
    if (elapsed >= MAX_MS) target = 1;
    shown += (target - shown) * 0.18;
    if (target === 1 && shown > 0.995) shown = 1;
    valueNode.textContent = String(Math.floor(shown * 100));
    barNode.style.transform = `scaleX(${shown})`;
    if (shown >= 1) {
      setTimeout(finish, 120);
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // страховка: если rAF не крутится (вкладка в фоне), шторка всё равно уходит по потолку
  setTimeout(finish, MAX_MS + 200);
}
