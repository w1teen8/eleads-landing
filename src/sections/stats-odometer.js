// Цифры-барабаны блока 02 (T25): каждая цифра значения крутится своим барабаном до нужной; прочие знаки
// (%, –, №, +, буквы) стоят на месте, а сменившиеся въезжают один раз снизу. Раскладка — odoCells() в stats-model.js.
// Пока крутится, в узле барабаны (скрыты от скринридера) и невидимая строка с итоговым значением; по окончании —
// снова обычный текст. Движение — Web Animations API, только transform. При reduced-motion текст ставится сразу.
import { reduced } from '../core/motion.js';
import { FLIP } from '../core/motion-kit.js';
import { odoCells, reelDigits } from './stats-model.js';

/** Длительность прокрутки барабана, задержка между соседними знаками, въезд нецифрового знака — мс. */
export const ODOMETER = { duration: 1000, step: 70, enter: 520 };

const rolling = new WeakMap(); // узел → { value, finish } текущей прокрутки

/** Значение, которое узел показывает (или к которому крутится): во время прокрутки textContent — не оно. */
export function shownValue(node) {
  return rolling.get(node)?.value ?? node.textContent;
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/**
 * Перекручивает значение узла на next. from — с чего крутить (по умолчанию — то, что узел показывает),
 * turns — полных оборотов сверху (появление: от нуля с оборотом). Резолвится, когда всё остановилось.
 */
export function rollTo(node, next, { from = shownValue(node), turns = 0, delay = 0 } = {}) {
  const text = String(next ?? '');
  if (!node) return Promise.resolve();
  rolling.get(node)?.finish();
  if (reduced || typeof node.animate !== 'function' || !node.ownerDocument) {
    node.textContent = text;
    return Promise.resolve();
  }
  const cells = odoCells(from, text, { turns });
  if (!cells.some((cell) => (cell.digit ? cell.steps : cell.enter))) {
    node.textContent = text;
    return Promise.resolve();
  }

  const face = make('span', 'odo');
  face.setAttribute('aria-hidden', 'true');
  const moving = []; // [лента, число кадров ленты, длительность]
  const parts = cells.map((cell) => {
    const moves = cell.digit ? cell.steps > 0 : cell.enter;
    if (!moves) return make('span', 'odo__char', cell.char);
    // окно в один знак: размер держит невидимый знак, лента ездит под маской
    const reel = make('span', 'odo__reel');
    const strip = make('span', 'odo__strip');
    const frames = cell.digit ? reelDigits(cell.from, cell.steps) : [' ', cell.char];
    strip.style.setProperty('--n', String(frames.length));
    strip.append(...frames.map((frame) => make('span', 'odo__digit', String(frame))));
    reel.append(make('span', 'odo__sizer', cell.char), strip);
    moving.push([strip, frames.length, cell.digit ? ODOMETER.duration : ODOMETER.enter]);
    return reel;
  });
  face.append(...parts);
  node.replaceChildren(make('span', 'visually-hidden', text), face);

  // градиент цифры — общий на всё значение: каждому знаку — его срез (ширина значения и сдвиг знака)
  const width = face.offsetWidth;
  for (const part of parts) {
    part.style.setProperty('--odo-w', `${width}px`);
    part.style.setProperty('--odo-x', `${part.offsetLeft}px`);
  }

  const animations = moving.map(([strip, frames, duration], i) =>
    strip.animate(
      { transform: ['translateY(0)', `translateY(${(-100 * (frames - 1)) / frames}%)`] },
      { duration, delay: delay + i * ODOMETER.step, easing: FLIP.easing, fill: 'both' },
    ),
  );

  return new Promise((resolve) => {
    const state = { value: text, finish: null };
    state.finish = () => {
      if (rolling.get(node) !== state) return;
      rolling.delete(node);
      for (const animation of animations) animation.cancel();
      if (face.isConnected) node.textContent = text; // язык могли сменить посреди прокрутки — тогда текст уже новый
      resolve();
    };
    rolling.set(node, state);
    Promise.all(animations.map((animation) => animation.finished)).then(state.finish, state.finish);
  });
}
