// 10 Відгуки + засновник (T30): слайдер отзывов на scroll-snap — свайп на тач, кнопки, точки (клик по точке —
// к слайду), стрелки с клавиатуры. Карточка засновника — статичная. Переходов по прокрутке нет (H11).
import { $, $$, el, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';

export function init(root) {
  accentTitles(root);
  const host = $('[data-slider]', root);
  const view = host && $('[data-slider-viewport]', host);
  if (!host || !view) return;
  const slides = $$('.reviews__slide', view);
  const prev = $('[data-slider-prev]', host);
  const next = $('[data-slider-next]', host);
  const dots = $('[data-slider-dots]', host);
  const dotNodes = slides.map((_, i) =>
    el('button', { class: 'reviews__dot', attrs: { type: 'button', tabindex: '-1', 'aria-hidden': 'true', 'data-slide': String(i) } }),
  );
  dots.replaceChildren(...dotNodes);

  const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : view.clientWidth);
  const index = () => Math.round(view.scrollLeft / (step() || 1));
  const goTo = (i) => view.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * step(), behavior: 'smooth' });
  const go = (dir) => goTo(index() + dir);

  function sync() {
    const max = view.scrollWidth - view.clientWidth;
    const scrollable = max > 4;
    host.classList.toggle('is-static', !scrollable);
    prev.disabled = !scrollable || view.scrollLeft <= 2;
    next.disabled = !scrollable || view.scrollLeft >= max - 2;
    const i = Math.min(slides.length - 1, index());
    dotNodes.forEach((d, n) => d.classList.toggle('is-active', n === i));
  }

  on(prev, 'click', () => go(-1));
  on(next, 'click', () => go(1));
  dotNodes.forEach((d, i) => on(d, 'click', () => goTo(i)));
  on(view, 'scroll', sync, { passive: true });
  on(view, 'keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  });
  new ResizeObserver(sync).observe(view);
  sync();
}
