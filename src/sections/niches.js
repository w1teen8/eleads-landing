// 03 Ніші (T20; T26 — мозаика с иконками и движение блока). Переходов между экранами нет (H11): блок идёт обычной
// прокруткой. Своё движение блока (просьба пользователя «анимации добавить», как у блока 02):
//   появление — один раз, когда блок вошёл в окно: заголовок выезжает двумя строками из-под маски; плитки «раздаются
//               из колоды»: стопка в центре сетки проявляется, потом плитки по одной разлетаются на места, как карты
//               при раздаче (порядок — по рядам слева направо, «Інша ніша?» последней). Иконка летит с плиткой. До 1,6 с;
//   наведение — плитка приподнимается и наклоняется к курсору (здесь), иконка вырастает из угла, самолётик
//               «Інша ніша?» улетает и возвращается (CSS niches.css; только мышь, без reduced-motion).
// Двигаются только transform и opacity. До появления текст есть в разметке; прячет его только CSS под .js-anim, так что
// без JS, при reduced-motion и ?nomotion=1 всё видно сразу в конечном виде.
import { $, $$, on } from '../core/dom.js';
import { reduced, motionReady } from '../core/motion.js';
import { accentTitles } from '../core/title-accent.js';

/** Наклон к курсору, градусы. */
const TILT = 5;
/** Блок вошёл в окно почти наполовину; на телефоне блок выше окна — раньше. */
const ENTER_START = 'top 55%';
const ENTER_START_NARROW = 'top 80%';
const WIDE = '(min-width: 900px)';
/** «Раздача из колоды»: стопка в центре сетки проявляется за `appear` мс, затем плитки по одной разлетаются на свои
 *  места (по рядам слева направо, «Інша ніша?» последней): шаг `step`, полёт `fly` мс с лёгким перелётом. Стопка —
 *  уменьшенная (`scale`) и раскрытая веером (`angles` по индексу плитки, заданы здесь, не случайные). */
export const ENTER = {
  appear: 200,
  step: 70,
  fly: 520,
  scale: 0.55,
  angles: [-8, -5.7, -3.4, -1.1, 1.1, 3.4, 5.7, 8],
  ease: 'cubic-bezier(0.2, 1.2, 0.3, 1)',
};

/** Общая длительность раздачи, мс. */
export const dealTotal = (count) => ENTER.appear + (count - 1) * ENTER.step + ENTER.fly;

/** Сдвиг каждой плитки в центр сетки — из реальных размеров; кладётся в --dx/--dy (px) на плитке. */
function measure(items, grid) {
  const g = grid.getBoundingClientRect();
  const cx = g.left + g.width / 2;
  const cy = g.top + g.height / 2;
  for (const item of items) {
    const r = item.getBoundingClientRect();
    item.style.setProperty('--dx', `${(cx - (r.left + r.width / 2)).toFixed(1)}px`);
    item.style.setProperty('--dy', `${(cy - (r.top + r.height / 2)).toFixed(1)}px`);
  }
}

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

/** Заголовок выезжает строками из-под маски: начало и акцентный хвост — каждая своей строкой. Возвращает анимации. */
function revealTitle(title) {
  if (!title || typeof title.animate !== 'function') return [];
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
  return moves;
}

/** Раздача: стопка проявляется, потом плитки по одной летят на свои места; верхние в стопке перекрывают нижние. */
function dealTiles(items) {
  const total = dealTotal(items.length);
  const at = (ms) => ms / total;
  return items.map((item, i) => {
    const stack = `translate(var(--dx), var(--dy)) rotate(${ENTER.angles[i % ENTER.angles.length]}deg) scale(${ENTER.scale})`;
    const launch = ENTER.appear + i * ENTER.step;
    item.style.zIndex = String(i + 1);
    return item.animate(
      [
        { offset: 0, opacity: 0, transform: stack, easing: 'linear' },
        { offset: at(ENTER.appear), opacity: 1, transform: stack, easing: 'linear' },
        { offset: at(launch), opacity: 1, transform: stack, easing: ENTER.ease },
        { offset: 1, opacity: 1, transform: 'translate(0, 0) rotate(0deg) scale(1)' },
      ],
      { duration: total, fill: 'both' },
    );
  });
}

function enter(root) {
  const grid = $('.niches__grid', root);
  const items = $$('.niches__item', root);
  let entered = false;
  // до появления плитки уже спрятаны CSS-ом; сдвиг в центр сетки пересчитывается при ресайзе
  const place = () => !entered && grid && measure(items, grid);
  place();
  on(window, 'resize', place);
  const start = () => {
    if (entered) return;
    place();
    entered = true;
    // класс — в одном кадре с созданием анимаций: плитки сразу под fill 'both', вспышки нет
    root.classList.add('is-in');
    const anims = [...revealTitle($('.section__title', root)), ...dealTiles(items)];
    const settle = () => {
      anims.forEach((a) => a.cancel());
      for (const item of items) {
        item.style.zIndex = '';
        item.style.removeProperty('--dx');
        item.style.removeProperty('--dy');
      }
    };
    Promise.all(anims.map((a) => a.finished)).then(settle, settle);
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
