// Единый язык движения (задача 3, H10): три приёма, из которых собираются все блоки страницы.
//   stackReveal(section) — «глава»: блок выезжает снизу поверх предыдущего, как следующая карточка в стопке
//                          (Stack Reveal Scroll); предыдущий закреплён, чуть уменьшается и темнеет. Только ≥900px.
//   flipSwap(node, next) — «табло»: старый текст уезжает вверх, новый въезжает снизу под маской.
//   stagger(items)       — «лесенка»: появление по одному, шаг 80 мс, power3.out 0.6 с, сдвиг 24px.
//   showcaseScroll(…)    — лента карточек едет вбок, пока блок закреплён под шапкой (блоки 06, 11, 12).
//   pinScrub(…)          — блок закреплён под шапкой, прокрутка отдаёт ему прогресс 0…1 (блок 07, рост ступеней).
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

/* ——— лента showcase (задача 3, H07/H11: единственный переход по прокрутке — ленты блоков 06, 11 и 12) ——— */

/** Лента едет только на широком альбомном экране — там, где блок ровно один экран (layout.css). */
export const SHOWCASE_MEDIA = '(min-width: 900px) and (orientation: landscape)';

const cssPx = (name, fallback) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Лента карточек в духе showcase-scroll.framer.ai: пока страница прокручивается, section закреплён под шапкой,
 * а track едет влево на величину своего переполнения. Общий помощник: о разметке блока ничего не знает —
 * нужны только закрепляемый узел и дорожка. Только transform. На узком/портретном экране, при reduced-motion и
 * без GSAP ничего не делает — запасной вариант (горизонтальная прокрутка пальцем) даёт CSS блока.
 *
 *   showcaseScroll(section, track, { viewport, media, offset, speed, onProgress })
 *     → { ready: Promise<boolean>, refresh(), destroy() }
 *
 *   section    — узел, который закрепляется (pin); его высота должна быть ≤ окна минус offset;
 *   track      — дорожка карточек (display:flex; width:max-content); на media у её окна не должно быть своей
 *                прокрутки (overflow: visible / clip);
 *   viewport   — «окно» дорожки, по умолчанию track.parentElement: путь = track.scrollWidth − viewport.clientWidth;
 *   media      — где лента едет (по умолчанию SHOWCASE_MEDIA); вне media закрепление снимается, transform чистится;
 *   offset     — отступ закрепления от верха окна, px (по умолчанию --header-h из tokens.css);
 *   speed      — пикселей прокрутки страницы на пиксель пути ленты (по умолчанию 1: лента едет как обычная прокрутка);
 *   onProgress — (p: 0..1) на каждое обновление прокрутки: полоса прогресса, счётчик, точки.
 *
 *   ready      — true: GSAP загружен, на media лента едет; false: reduced-motion, ?nomotion=1 или сбой загрузки
 *                (блок ставит себе запасную прокрутку, например класс is-static);
 *   refresh()  — пересчитать путь после смены состава или ширины карточек (смена языка — уже через refreshMotion);
 *   destroy()  — снять закрепление совсем.
 * Пока лента закреплена, на section стоит класс `is-pinned`.
 */
export function showcaseScroll(section, track, { viewport, media = SHOWCASE_MEDIA, offset, speed = 1, onProgress } = {}) {
  let setReady;
  const handle = { refresh() {}, destroy() {}, ready: new Promise((resolve) => (setReady = resolve)) };
  if (reduced || !section || !track) {
    setReady(false);
    return handle;
  }
  let mm = null;
  motionReady().then((api) => {
    setReady(Boolean(api) && !handle.dead);
    if (!api || handle.dead) return;
    const { gsap, ScrollTrigger } = api;
    mm = gsap.matchMedia();
    mm.add(media, () => {
      const frame = viewport || track.parentElement || section;
      // путь считается заново на каждый refresh: дорожку могут наполнить позже (карточки из JSON, шрифты, язык)
      const distance = () => Math.max(0, track.scrollWidth - frame.clientWidth);
      const top = () => offset ?? cssPx('--header-h', 0);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: () => `top ${top()}px`,
          end: () => `+=${Math.max(1, distance() * speed)}`,
          pin: true,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onToggle: (self) => section.classList.toggle('is-pinned', self.isActive),
          onUpdate: onProgress ? (self) => onProgress(self.progress) : undefined,
        },
      });
      handle.refresh = () => ScrollTrigger.refresh();
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(track, { clearProps: 'transform' });
        section.classList.remove('is-pinned');
        handle.refresh = () => {};
      };
    });
  });
  handle.destroy = () => {
    handle.dead = true;
    mm?.revert();
  };
  return handle;
}

/* ——— закреплённый экран «шаг за шагом» (T32, блок 07: «застыть на экране и ждать, пока появятся все 7») ——— */

/**
 * Экран застывает под шапкой, пока прокрутка проходит путь length(); прогресс 0..1 привязан к позиции прокрутки
 * (scrub) и отдаётся блоку — что расти и проявляться, решает сам блок. Тот же механизм, что у showcaseScroll:
 * ScrollTrigger pin + pinSpacing (следующий блок приходит ровно, без скачка), отступ --header-h, только на media.
 * Помощник о разметке блока ничего не знает. При reduced-motion, ?nomotion=1 и без GSAP — no-op: ready → false,
 * блок остаётся в конечном виде.
 *
 *   pinScrub(section, { length, media, offset, onProgress, onRefresh, onRevert }) → { ready, refresh(), destroy() }
 *
 *   section    — узел, который закрепляется; его высота должна быть ≤ окна минус offset;
 *   length     — () => px: сколько прокрутки страница стоит на месте (считается заново на каждый refresh);
 *   media      — где закреплять (по умолчанию SHOWCASE_MEDIA — там, где блок ровно один экран);
 *   offset     — отступ закрепления от верха окна, px (по умолчанию --header-h из tokens.css);
 *   onProgress — (p: 0..1) сразу после включения и на каждое обновление прокрутки; до закрепления p = 0, после — 1;
 *   onRefresh  — перемерить раскладку блока (смена окна, языка, шрифтов) — до следующего onProgress;
 *   onRevert   — вышли из media или destroy(): блок снимает свои инлайн-стили и встаёт в конечный вид.
 * Пока экран закреплён, на section стоит класс `is-pinned`.
 */
export function pinScrub(section, { length, media = SHOWCASE_MEDIA, offset, onProgress, onRefresh, onRevert } = {}) {
  let setReady;
  const handle = { refresh() {}, destroy() {}, ready: new Promise((resolve) => (setReady = resolve)) };
  if (reduced || !section || typeof length !== 'function') {
    setReady(false);
    return handle;
  }
  let mm = null;
  motionReady().then((api) => {
    setReady(Boolean(api) && !handle.dead);
    if (!api || handle.dead) return;
    const { gsap, ScrollTrigger } = api;
    mm = gsap.matchMedia();
    mm.add(media, () => {
      const top = () => offset ?? cssPx('--header-h', 0);
      const state = { p: 0 };
      const tween = gsap.to(state, {
        p: 1,
        ease: 'none',
        onUpdate: () => onProgress?.(state.p),
        scrollTrigger: {
          trigger: section,
          start: () => `top ${top()}px`,
          end: () => `+=${Math.max(1, Math.round(length()))}`,
          pin: true,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onToggle: (self) => section.classList.toggle('is-pinned', self.isActive),
          onRefresh: (self) => {
            onRefresh?.();
            onProgress?.(self.progress);
          },
        },
      });
      onRefresh?.();
      onProgress?.(tween.scrollTrigger ? tween.scrollTrigger.progress : 0);
      handle.refresh = () => ScrollTrigger.refresh();
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        section.classList.remove('is-pinned');
        onRevert?.();
        handle.refresh = () => {};
      };
    });
  });
  handle.destroy = () => {
    handle.dead = true;
    mm?.revert();
  };
  return handle;
}
