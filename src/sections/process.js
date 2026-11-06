// 07 Процес: линия прорисовывается stroke-dashoffset по скроллу, шаги загораются по очереди.
// На десктопе секция закрепляется (pinSection) на время прорисовки. reduced / без JS — линия нарисована целиком.
import { $, $$ } from '../core/dom.js';
import { reduced, motionReady, pinSection } from '../core/motion.js';

const DESKTOP = '(min-width: 900px)';

export function init(root) {
  const host = $('[data-process]', root);
  if (!host || reduced) return;
  const steps = $$('.process__step', host);
  const draws = $$('.process__draw', host);

  const paint = (p) => {
    for (const d of draws) d.style.strokeDashoffset = String(1 - p);
    steps.forEach((s, i) => s.classList.toggle('is-lit', p >= i / (steps.length - 1) - 0.001));
  };

  motionReady().then((api) => {
    if (!api) return;
    host.classList.add('is-armed');
    paint(0);
    const { ScrollTrigger } = api;
    if (window.matchMedia(DESKTOP).matches) {
      pinSection(root, { end: '+=110%', scrub: true, onUpdate: (self) => paint(Math.min(1, self.progress * 1.12)) });
    } else {
      ScrollTrigger.create({
        trigger: $('.process__track', host),
        start: 'top 72%',
        end: 'bottom 55%',
        scrub: true,
        onUpdate: (self) => paint(self.progress),
      });
    }
  });
}
