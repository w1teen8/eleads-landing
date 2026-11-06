// 07 Процес: линия прорисовывается stroke-dashoffset по скроллу, шаги загораются по очереди.
// На десктопе секция закрепляется (pinSection) на время прорисовки. reduced / без JS — линия нарисована целиком.
import { $, $$ } from '../core/dom.js';
import { reduced, motionReady } from '../core/motion.js';

const DESKTOP_MIN = 900;
const DESKTOP = `(min-width: ${DESKTOP_MIN}px)`;

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
    const { gsap, ScrollTrigger } = api;
    // gsap.matchMedia сам снимает пин и создаёт его заново при пересечении порога ширины (resize, поворот)
    const mm = gsap.matchMedia();
    const scrubTrack = () =>
      ScrollTrigger.create({
        trigger: $('.process__track', host),
        start: 'top 72%',
        end: 'bottom 55%',
        scrub: true,
        onUpdate: (self) => paint(self.progress),
      });
    mm.add(DESKTOP, () => {
      // закрепляем только если секция помещается в окно целиком — иначе низ был бы обрезан на время пина
      if (root.offsetHeight > window.innerHeight + 1) {
        scrubTrack();
        return;
      }
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: '+=110%',
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: true,
        onUpdate: (self) => paint(Math.min(1, self.progress * 1.12)),
      });
    });
    mm.add(`(max-width: ${DESKTOP_MIN - 1}px)`, () => {
      scrubTrack();
    });
  });
}
