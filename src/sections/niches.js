// 03 Ніші (T20; T26 — мозаика с иконками и движение блока). Переходов между экранами нет (H11): блок идёт обычной
// прокруткой, плитки видны сразу — появления плиток нет.
//   появление — только заголовок, один раз, когда блок вошёл в окно: выезжает двумя строками из-под маски;
//   наведение — плитка приподнимается и наклоняется к курсору (здесь), иконка вырастает из угла, самолётик
//               «Інша ніша?» улетает и возвращается, стрелка поворачивается (CSS niches.css; только мышь, без
//               reduced-motion).
// Двигаются только transform и opacity. Заголовок прячет только CSS под .js-anim, так что без JS, при reduced-motion
// и ?nomotion=1 всё видно сразу в конечном виде.
import { $, $$, on } from '../core/dom.js';
import { reduced, motionReady } from '../core/motion.js';
import { accentTitles } from '../core/title-accent.js';

/** Наклон к курсору, градусы. */
const TILT = 5;
/** Блок вошёл в окно почти наполовину; на телефоне блок выше окна — раньше. */
const ENTER_START = 'top 55%';
const ENTER_START_NARROW = 'top 80%';
const WIDE = '(min-width: 900px)';
/** Заголовок: строка выезжает из-под маски; вторая — с задержкой. */
const TITLE = { duration: 760, step: 90 };
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function tilt(card) {
  on(card, 'pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--tilt-x', `${(-y * TILT).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${(x * TILT).toFixed(2)}deg`);
  });
  on(card, 'pointerleave', () => {
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
  });
}

/** Заголовок выезжает строками из-под маски: начало и акцентный хвост — каждая своей строкой. */
function revealTitle(title) {
  if (!title || typeof title.animate !== 'function') return;
  const accent = $('.display__accent', title);
  const lead = document.createElement('span');
  lead.className = 'niches__line';
  lead.append(...[...title.childNodes].filter((node) => node !== accent));
  const lines = [lead, accent].filter(Boolean);
  const masks = lines.map((line) => {
    const mask = document.createElement('span');
    mask.className = 'niches__mask';
    mask.append(line);
    return mask;
  });
  title.replaceChildren(...masks);
  const moves = lines.map((line, i) =>
    line.animate(
      { transform: ['translateY(110%)', 'translateY(0)'] },
      { duration: TITLE.duration, delay: i * TITLE.step, easing: EASE, fill: 'both' },
    ),
  );
  const restore = () => {
    for (const move of moves) move.cancel();
    // язык могли сменить посреди движения — тогда заголовок уже переписан, трогать нечего
    if (masks.every((mask) => mask.parentNode === title)) title.replaceChildren(...lead.childNodes, ...(accent ? [accent] : []));
  };
  Promise.all(moves.map((move) => move.finished)).then(restore, restore);
}

/** Появление заголовка — один раз, когда блок вошёл в окно. */
function enter(root) {
  let entered = false;
  const start = () => {
    if (entered) return;
    entered = true;
    root.classList.add('is-in');
    revealTitle($('.section__title', root));
  };
  motionReady().then((api) => {
    if (!api) return start();
    const narrow = !window.matchMedia?.(WIDE).matches;
    api.ScrollTrigger.create({ trigger: root, start: narrow ? ENTER_START_NARROW : ENTER_START, once: true, onEnter: start });
  });
}

export function init(root) {
  accentTitles(root);
  if (reduced) return;
  enter(root);
  if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return;
  $$('[data-niches-card]', root).forEach(tilt);
}
