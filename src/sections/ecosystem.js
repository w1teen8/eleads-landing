// 11 Екосистема: поток по цепочке (CSS-анимация transform) идёт, только пока блок на экране и вкладка видна;
// услуги — превью по hover/фокусу (CSS), на тач — по тапу.
import { $, $$, on } from '../core/dom.js';
import { reduced } from '../core/motion.js';

export function init(root) {
  const flow = $('[data-eco-flow]', root);
  if (flow) {
    if (reduced) flow.classList.add('is-static');
    let inView = false;
    const apply = () => flow.classList.toggle('is-paused', !inView || document.hidden);
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      apply();
    }).observe(flow);
    document.addEventListener('visibilitychange', apply);
    apply();
  }

  const rows = $$('.eco__row', root);
  const expanded = (row, value) => row.setAttribute('aria-expanded', String(value));
  for (const row of rows) {
    on(row, 'click', () => {
      const open = !row.classList.contains('is-open');
      rows.forEach((r) => {
        r.classList.remove('is-open');
        expanded(r, false);
      });
      row.classList.toggle('is-open', open);
      expanded(row, open);
    });
    const show = () => expanded(row, true);
    const hide = () => expanded(row, row.classList.contains('is-open'));
    on(row, 'mouseenter', show);
    on(row, 'focus', show);
    on(row, 'mouseleave', hide);
    on(row, 'blur', hide);
  }
}
