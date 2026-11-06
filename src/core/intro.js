// Сигнал «заставка ушла»: прелоадер его подаёт, первый экран ждёт, чтобы начать своё появление.
// Через атрибут на <html> и событие — секции не импортируют друг друга.

const EVENT = 'eleads:intro';

export function signalIntroDone() {
  const html = document.documentElement;
  if (html.dataset.intro === 'done') return;
  html.dataset.intro = 'done';
  document.dispatchEvent(new CustomEvent(EVENT));
}

export function whenIntroDone() {
  if (document.documentElement.dataset.intro === 'done') return Promise.resolve();
  return new Promise((resolve) => document.addEventListener(EVENT, () => resolve(), { once: true }));
}
