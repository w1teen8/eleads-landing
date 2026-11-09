// Единый язык движения (задача 3, H10): три приёма, из которых собираются все блоки страницы.
//   stackReveal(section) — «глава»: блок выезжает снизу поверх предыдущего, как следующая карточка в стопке
//                          (Stack Reveal Scroll); предыдущий закреплён, чуть уменьшается и темнеет. Только ≥900px.
//   flipSwap(node, next) — «табло»: старый текст уезжает вверх, новый въезжает снизу под маской.
//   stagger(items)       — «лесенка»: появление по одному, шаг 80 мс, power3.out 0.6 с, сдвиг 24px.
// Всё — transform и opacity. При reduced-motion (и без GSAP) — статично: всё видно, тексты стоят сразу.
import { reduced, motionReady } from './motion.js';

/** Закрепление и наезд — только на широком экране; на телефоне блоки идут друг за другом. */
export const STACK_MEDIA = '(min-width: 900px)';
/** Предыдущий блок под наезжающим: масштаб и плотность затемнения в конце наезда. */
export const STACK = { scale: 0.94, dim: 0.55 };
/** «Табло»: одна длительность и кривая везде (= --ease-out в tokens.css). */
export const FLIP = { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', distance: '105%' };
/** «Лесенка»: шаг, длительность, кривая, сдвиг — одинаково во всех блоках. */
export const STAGGER = { step: 0.08, duration: 0.6, ease: 'power3.out', y: 24, start: 'top 82%' };

/* ——— глава: наезд шторкой ——— */

const previousBlock = (section) => {
  let node = section.previousElementSibling;
  while (node && (node.hidden || node.tagName === 'SCRIPT' || node.tagName === 'TEMPLATE')) node = node.previousElementSibling;
  return node;
};

/**
 * Блок section выезжает снизу поверх предыдущего соседа. Предыдущий закрепляется (ScrollTrigger pin, без
 * распорки), его слои уменьшаются до STACK.scale вокруг центра экрана, слой-тень над ним проявляется до STACK.dim.
 * Когда верх section доходит до верха экрана — закрепление снимается, дальше обычная прокрутка.
 * Внешний вид карточки (скругление сверху, тень) задаёт CSS блока; здесь — только z-index над предыдущим.
 */
export function stackReveal(section, { scale = STACK.scale, dim = STACK.dim } = {}) {
  if (reduced || !section) return;
  const prev = previousBlock(section);
  if (!prev) return;
  motionReady().then((api) => {
    if (!api) return;
    const { gsap } = api;
    section.style.position = 'relative';
    section.style.zIndex = '2';
    gsap.matchMedia().add(STACK_MEDIA, () => {
      const shade = document.createElement('div');
      shade.className = 'stack-shade';
      shade.setAttribute('aria-hidden', 'true');
      Object.assign(shade.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '30',
        background: 'var(--ink)',
        opacity: '0',
        pointerEvents: 'none',
      });
      const layers = Array.from(prev.children);
      prev.append(shade);

      // предыдущий выше экрана — закрепляется, когда его низ дошёл до низа экрана; ниже — когда верх дошёл до верха
      const tall = () => prev.offsetHeight > window.innerHeight;
      // центр экрана в координатах каждого слоя: все слои сжимаются как одна карточка
      const origin = (i, layer) => {
        const top = tall() ? prev.offsetHeight - window.innerHeight : 0;
        return `50% ${top + window.innerHeight / 2 - layer.offsetTop}px`;
      };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: prev,
          start: () => (tall() ? 'bottom bottom' : 'top top'),
          endTrigger: section,
          end: 'top top',
          pin: true,
          pinSpacing: false,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo(layers, { scale: 1, transformOrigin: origin }, { scale, transformOrigin: origin }, 0);
      tl.fromTo(shade, { opacity: 0 }, { opacity: dim }, 0);

      return () => {
        shade.remove();
        gsap.set(layers, { clearProps: 'transform,transformOrigin' });
      };
    });
  });
}

/* ——— табло ——— */

const swaps = new WeakMap(); // node → завершить текущую смену

/**
 * Текст node меняется на next: старый уезжает вверх (или влево при axis: 'x'), новый въезжает снизу под маской.
 * По завершении в node снова обычный текст. Резолвится, когда смена закончилась.
 */
export function flipSwap(node, next, { axis = 'y', delay = 0 } = {}) {
  const text = String(next ?? '');
  if (!node) return Promise.resolve();
  if (reduced || typeof node.animate !== 'function' || !node.ownerDocument) {
    node.textContent = text;
    return Promise.resolve();
  }
  swaps.get(node)?.();
  const prevText = node.textContent;
  if (prevText === text) return Promise.resolve();

  const doc = node.ownerDocument;
  const outgoing = doc.createElement('span');
  const incoming = doc.createElement('span');
  outgoing.textContent = prevText;
  outgoing.setAttribute('aria-hidden', 'true');
  incoming.textContent = text;
  for (const span of [outgoing, incoming]) {
    span.style.gridArea = '1 / 1';
    span.style.display = 'block';
  }
  const saved = { display: node.style.display, overflow: node.style.overflow, margin: node.style.overflowClipMargin };
  const inline = getComputedStyle(node).display.startsWith('inline');
  node.style.display = inline ? 'inline-grid' : 'grid';
  node.style.overflow = 'clip';
  node.style.overflowClipMargin = '0.12em'; // маска не режет выносные элементы плотных цифр
  node.replaceChildren(outgoing, incoming);

  const move = axis === 'x' ? 'translateX' : 'translateY';
  const timing = { duration: FLIP.duration, easing: FLIP.easing, delay, fill: 'both' };
  const out = outgoing.animate(
    [{ transform: `${move}(0)`, opacity: 1 }, { transform: `${move}(-${FLIP.distance})`, opacity: 0 }],
    timing,
  );
  const into = incoming.animate(
    [{ transform: `${move}(${FLIP.distance})`, opacity: 0 }, { transform: `${move}(0)`, opacity: 1 }],
    timing,
  );

  return new Promise((resolve) => {
    const finish = () => {
      if (swaps.get(node) !== finish) return;
      swaps.delete(node);
      out.cancel();
      into.cancel();
      node.style.display = saved.display;
      node.style.overflow = saved.overflow;
      node.style.overflowClipMargin = saved.margin;
      node.textContent = text;
      resolve();
    };
    swaps.set(node, finish);
    into.finished.then(finish, finish);
  });
}

/* ——— лесенка ——— */

/**
 * items появляются по одному при входе в экран: opacity 0→1, сдвиг STAGGER.y → 0, шаг STAGGER.step.
 * onEach(node, i) — в момент старта появления узла (докрутка цифр). При reduced-motion и без GSAP узлы не
 * прячутся, onEach зовётся сразу по порядку.
 */
export function stagger(items, { onEach, trigger, start = STAGGER.start } = {}) {
  const list = Array.from(items || []).filter(Boolean);
  const each = (node, i) => onEach?.(node, i);
  if (reduced || !list.length) {
    list.forEach(each);
    return Promise.resolve();
  }
  // прячем сразу, до загрузки GSAP: блок ниже первого экрана, вспышки нет
  for (const node of list) {
    node.style.opacity = '0';
    node.style.transform = `translate3d(0, ${STAGGER.y}px, 0)`;
  }
  return motionReady().then(
    (api) =>
      new Promise((resolve) => {
        if (!api) {
          for (const node of list) {
            node.style.opacity = '';
            node.style.transform = '';
          }
          list.forEach(each);
          resolve();
          return;
        }
        const { gsap, ScrollTrigger } = api;
        ScrollTrigger.create({
          trigger: trigger || list[0],
          start,
          once: true,
          onEnter: () => {
            list.forEach((node, i) => {
              gsap.fromTo(
                node,
                { opacity: 0, y: STAGGER.y },
                {
                  opacity: 1,
                  y: 0,
                  duration: STAGGER.duration,
                  ease: STAGGER.ease,
                  delay: i * STAGGER.step,
                  onStart: () => each(node, i),
                  onComplete: () => {
                    gsap.set(node, { clearProps: 'opacity,transform' });
                    if (i === list.length - 1) resolve();
                  },
                },
              );
            });
          },
        });
      }),
  );
}
