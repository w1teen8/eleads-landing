// 11 Екосистема (T36, H49): шлях клієнта з послугами під кожним кроком — выбор пользователя, вариант A
// (reference/run3/ecosystem-A-chosen.png). T42 (правка клиента): пять шагов в ряд — Трафік → Посадкові → Контент →
// Лід → Sales, под каждым — его услуги (ecosystem.steps[].items, тексты дословно из документа клиента).
// «Бегущий импульс»: шаги по очереди загораются жёлто-оранжевым слева направо (класс is-on на шаге — CSS проявляет
// градиентную грань карточки и рамки его услуг через opacity), каждый горит PULSE_MS. Наведение мышью на сам шаг
// (карточка и его услуги) зажигает его и ставит импульс на паузу; курсор где-то ещё в блоке паузы не ставит
// (урок блока 09). Импульс идёт, только пока блок в окне и вкладка видна. reduced-motion / ?nomotion=1 — без
// импульса: горит первый шаг, наведение по-прежнему подсвечивает. Прежней ленты showcase-scroll в блоке нет.
import { $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { reduced } from '../core/motion.js';
import { PULSE_MS, nextStep } from './ecosystem-model.js';

/** Где импульс не бежит сам: узкий экран. */
export const NARROW_MEDIA = '(max-width: 899px)';

export function init(root) {
  accentTitles(root);
  const steps = $$('[data-eco-step]', root);
  const total = steps.length;
  if (!total) return;

  let current = Math.max(0, steps.findIndex((s) => s.classList.contains('is-on')));
  let timer = 0;
  const state = { hovered: false, inView: false, hidden: document.hidden };
  // телефон: без автоматической смены подсветки (клиент 2026-11-11) — шаг загорается по нажатию
  const narrow = window.matchMedia?.(NARROW_MEDIA);

  const light = (i) => {
    current = i;
    steps.forEach((step, n) => step.classList.toggle('is-on', n === i));
  };

  // один отсчёт за раз; любая смена состояния перезапускает его с полного шага
  function sync() {
    clearTimeout(timer);
    timer = 0;
    if (reduced || narrow?.matches || state.hovered || !state.inView || state.hidden) return;
    timer = setTimeout(() => {
      light(nextStep(current, total));
      sync();
    }, PULSE_MS);
  }

  // на телефоне шаг загорается по нажатию
  steps.forEach((step, i) => on(step, 'click', () => narrow?.matches && light(i)));
  steps.forEach((step, i) => {
    on(step, 'pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      state.hovered = true;
      light(i);
      sync();
    });
    on(step, 'pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      state.hovered = false;
      sync();
    });
  });

  on(document, 'visibilitychange', () => {
    state.hidden = document.hidden;
    sync();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        state.inView = entry.isIntersecting;
        sync();
      },
      // на телефоне путь выше экрана — порог от доли узла не сработал бы; «в окне» = хоть часть пути в средней полосе
      { rootMargin: '-20% 0px' },
    ).observe(steps[0].parentElement);
  } else {
    state.inView = true;
    sync();
  }
}
