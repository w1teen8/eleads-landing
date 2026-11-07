// 07 Процес: линия прорисовывается по скроллу — scaleX / scaleY отдельного слоя (только transform), шаги загораются по очереди.
// На десктопе секция закрепляется (pinSection) на время прорисовки. reduced / без JS — линия нарисована целиком.
import { $, $$ } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { reduced, motionReady } from '../core/motion.js';

const DESKTOP_MIN = 900;
const DESKTOP = `(min-width: ${DESKTOP_MIN}px)`;

export function init(root) {
  accentTitles(root);
  const host = $('[data-process]', root);
  if (!host || reduced) return;
  const steps = $$('.process__step', host);
  const fills = $$('.process__line', host).map(splitLine);

  const paint = (p) => {
    for (const { node, axis } of fills) node.style.transform = axis === 'x' ? `scaleX(${p})` : `scaleY(${p})`;
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

// Рельс и прорисовка — в разных слоях: копия <svg> только с линией прорисовки масштабируется целиком
// (transform-origin — начало линии), рельс под ней стоит. Без JS в разметке остаётся одна целая линия.
function splitLine(svg) {
  const fill = svg.cloneNode(true);
  for (const rail of $$('.process__rail', fill)) rail.remove();
  for (const draw of $$('.process__draw', svg)) draw.remove();
  fill.classList.add('process__fill');
  svg.after(fill);
  return { node: fill, axis: svg.classList.contains('process__line--v') ? 'y' : 'x' };
}
