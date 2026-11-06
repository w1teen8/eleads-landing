// 10 Відгуки: слайдер на scroll-snap — свайп на мобильном, кнопки и стрелки с клавиатуры, точки.
import { $, $$, el, on } from '../core/dom.js';

export function init(root) {
  const host = $('[data-slider]', root);
  const view = host && $('[data-slider-viewport]', host);
  if (!host || !view) return;
  const slides = $$('.reviews__slide', view);
  const prev = $('[data-slider-prev]', host);
  const next = $('[data-slider-next]', host);
  const dots = $('[data-slider-dots]', host);
  dots.replaceChildren(...slides.map(() => el('span', { class: 'reviews__dot' })));

  const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : view.clientWidth);
  const index = () => Math.round(view.scrollLeft / (step() || 1));
  const go = (dir) => view.scrollBy({ left: dir * step(), behavior: 'smooth' });

  function sync() {
    const max = view.scrollWidth - view.clientWidth;
    const scrollable = max > 4;
    host.classList.toggle('is-static', !scrollable);
    prev.disabled = !scrollable || view.scrollLeft <= 2;
    next.disabled = !scrollable || view.scrollLeft >= max - 2;
    const i = Math.min(slides.length - 1, index());
    $$('.reviews__dot', dots).forEach((d, n) => d.classList.toggle('is-active', n === i));
  }

  on(prev, 'click', () => go(-1));
  on(next, 'click', () => go(1));
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
