// Сигнал «заставка ушла»: прелоадер его подаёт, первый экран ждёт, чтобы начать своё появление.
// Через атрибут на <html> и событие — секции не импортируют друг друга.

const EVENT = 'eleads:intro';

/** Потолок прелоадера от его старта (preloader.js берёт его отсюда). */
export const PRELOADER_MAX_MS = 2500;
/** Страховочный таймер прелоадера сверх потолка. */
export const PRELOADER_SAFETY_MS = 200;
/** Выход шторки: переход is-leaving (--dur-slow 900ms) с запасом, потом снимается js-preload. */
export const INTRO_EXIT_MS = 1300;
/**
 * Последний рубеж, от старта прелоадера: позже его потолка, страховки и полного выхода шторки —
 * нормальная, даже медленная заставка всегда успевает уйти сама. Падение прелоадера сюда не доходит:
 * он ловит свои ошибки и зовёт failIntro() сразу.
 */
export const INTRO_DEADLINE_MS = PRELOADER_MAX_MS + PRELOADER_SAFETY_MS + INTRO_EXIT_MS + 200;

const now = () => (typeof performance !== 'undefined' ? performance.now() : 0);
const html = () => document.documentElement;

/** Прелоадер отмечает свой старт — от него считается крайний срок. */
export function markIntroStart() {
  if (!html().dataset.introStart) html().dataset.introStart = String(now());
}

/** reason: 'done' — заставка ушла сама; 'failed' — прелоадер упал; 'timeout' — крайний срок. */
export function signalIntroDone(reason = 'done') {
  const root = html();
  if (root.dataset.intro === 'done') return;
  root.dataset.intro = 'done';
  root.dataset.introReason = reason;
  document.dispatchEvent(new CustomEvent(EVENT, { detail: reason }));
}

/** Шторка уходит своим переходом (is-leaving), и только после него снимается js-preload. */
function leaveCurtain() {
  const curtain = document.querySelector?.('.preloader');
  curtain?.classList.add('is-leaving');
  setTimeout(() => html().classList.remove('js-preload'), curtain ? INTRO_EXIT_MS : 0);
}

/** Прелоадер упал: шторка уходит, первый экран показывается сразу. */
export function failIntro(err) {
  if (html().dataset.intro === 'done') return;
  if (err) console.error('[preloader]', err);
  leaveCurtain();
  signalIntroDone('failed');
}

/** Сколько осталось до крайнего срока, мс: от старта прелоадера (если не стартовал — от вызова). */
export function introTimeLeft(deadline = INTRO_DEADLINE_MS) {
  const start = Number(html().dataset.introStart);
  const from = Number.isFinite(start) && html().dataset.introStart ? start : now();
  return Math.max(0, from + deadline - now());
}

/** Резолвится 'done' | 'failed' | 'timeout'. */
export function whenIntroDone({ deadline = INTRO_DEADLINE_MS } = {}) {
  const root = html();
  if (root.dataset.intro === 'done') return Promise.resolve(root.dataset.introReason || 'done');
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      document.removeEventListener(EVENT, onDone);
      leaveCurtain();
      signalIntroDone('timeout');
      resolve('timeout');
    }, introTimeLeft(deadline));
    function onDone(event) {
      clearTimeout(timer);
      resolve(event?.detail || 'done');
    }
    document.addEventListener(EVENT, onDone, { once: true });
  });
}
