// Сигнал «заставка ушла»: прелоадер его подаёт, первый экран ждёт, чтобы начать своё появление.
// Через атрибут на <html> и событие — секции не импортируют друг друга.

const EVENT = 'eleads:intro';

/**
 * Крайний срок от старта страницы: если прелоадер к нему не подал сигнал (упал в init или в кадре),
 * заставка снимается принудительно, а первый экран показывается сразу — он не может остаться невидимым.
 * Обычная заставка укладывается в 1–2.6 с (потолок прелоадера 2.5 с + выход).
 */
export const INTRO_DEADLINE_MS = 2600;

export function signalIntroDone() {
  const html = document.documentElement;
  if (html.dataset.intro === 'done') return;
  html.dataset.intro = 'done';
  document.dispatchEvent(new CustomEvent(EVENT));
}

/** Сколько осталось до крайнего срока, мс (отсчёт от навигации, а не от вызова). */
export function introTimeLeft(deadline = INTRO_DEADLINE_MS) {
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  return Math.max(0, deadline - now);
}

/** Резолвится 'done', когда прелоадер подал сигнал, или 'timeout' по крайнему сроку (тогда шторка снимается). */
export function whenIntroDone({ deadline = INTRO_DEADLINE_MS } = {}) {
  if (document.documentElement.dataset.intro === 'done') return Promise.resolve('done');
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      document.removeEventListener(EVENT, onDone);
      document.documentElement.classList.remove('js-preload');
      signalIntroDone();
      resolve('timeout');
    }, introTimeLeft(deadline));
    function onDone() {
      clearTimeout(timer);
      resolve('done');
    }
    document.addEventListener(EVENT, onDone, { once: true });
  });
}
