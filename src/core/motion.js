// Движение: единственный экземпляр Lenis, ScrollTrigger, правило reduced-motion.
// GSAP и Lenis грузятся динамическим import() после первого кадра; при reduced-motion — не грузятся вовсе.
// Секции вызывают reveal/parallax/pinSection сразу в init(): вызовы копятся в очереди
// и выполняются, когда GSAP загрузится. Сбой загрузки снимает .js-anim — всё видно без анимаций.

const html = typeof document !== 'undefined' ? document.documentElement : null;

/** prefers-reduced-motion или ?nomotion=1 */
export const reduced =
  typeof window === 'undefined'
    ? true
    : window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      new URLSearchParams(window.location.search).get('nomotion') === '1';

let api = null; // { gsap, ScrollTrigger, lenis }
let readyResolve;
const ready = new Promise((resolve) => {
  readyResolve = resolve;
});
const queue = [];
let started = false;

function run(fn) {
  if (reduced) return;
  if (api) fn(api);
  else queue.push(fn);
}

const toArray = (target) => {
  if (!target) return [];
  if (typeof target === 'string') return Array.from(document.querySelectorAll(target));
  if (target instanceof Element) return [target];
  return Array.from(target);
};

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

/** Резолвится в { gsap, ScrollTrigger, lenis } или null (reduced / сбой загрузки). */
export function motionReady() {
  return reduced ? Promise.resolve(null) : ready;
}

/** Lenis + ScrollTrigger; при reduced — no-op. */
export async function initMotion() {
  if (started) return ready;
  started = true;
  bindAnchors();
  if (reduced) {
    readyResolve(null);
    return null;
  }
  try {
    await nextFrame();
    const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('lenis'),
    ]);
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    api = { gsap, ScrollTrigger, lenis };
    html.classList.add('motion-ok');

    autoReveal();
    watchInserted();
    while (queue.length) {
      try {
        queue.shift()(api);
      } catch (err) {
        console.error('[motion] ошибка в анимации', err);
      }
    }
    readyResolve(api);
    return api;
  } catch (err) {
    console.error('[motion] GSAP/Lenis не загрузились — показываю всё без анимаций.', err);
    html.classList.remove('js-anim');
    queue.length = 0;
    readyResolve(null);
    return null;
  }
}

// Узлы, за которые отвечает reveal(): остальное, что появится в DOM позже, показывается сразу.
const tracked = new WeakSet();

function settle(gsap, nodes) {
  for (const node of nodes) node.classList.add('is-revealed');
  gsap.set(nodes, { clearProps: 'opacity,transform' });
}

/** [data-reveal] — ревил блока, [data-reveal="stagger"] — ревил детей со стагером; .reveal из разметки — тоже. */
function autoReveal(root = document) {
  const scope = root === document ? [] : [root];
  const containers = [...scope.filter((n) => n.matches('[data-reveal]')), ...root.querySelectorAll('[data-reveal]')];
  for (const node of containers) {
    if (tracked.has(node) || node.classList.contains('is-revealed')) continue;
    if (node.dataset.reveal === 'stagger') revealChildren(node);
    else reveal(node);
  }
  const loose = [...scope.filter((n) => n.matches('.reveal')), ...root.querySelectorAll('.reveal')];
  for (const node of loose) {
    if (tracked.has(node) || node.classList.contains('is-revealed')) continue;
    if (root === document) reveal(node);
    else node.classList.add('is-revealed'); // вставлено после старта и никем не анимируется — просто видно
  }
}

/**
 * Узлы, вставленные или перерисованные после initMotion (смена языка, списки из JSON),
 * не остаются с начальным opacity:0: новые [data-reveal] получают свой ревил,
 * остальное видно сразу. Дети, добавленные в ещё не проявленный stagger-контейнер,
 * проявятся вместе с ним — список детей берётся в момент входа в экран.
 */
function watchInserted() {
  if (!('MutationObserver' in window)) return;
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === 1) autoReveal(node);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

/** Ревил детей контейнера со стагером. Состав детей читается при входе в экран, а не при вызове. */
function revealChildren(container, opts = {}) {
  if (reduced || !container) return;
  tracked.add(container);
  run(({ gsap, ScrollTrigger }) => {
    ScrollTrigger.create({
      trigger: container,
      start: opts.start || 'top 86%',
      once: true,
      onEnter: () => {
        const kids = Array.from(container.children);
        gsap.to(kids, {
          opacity: 1,
          y: 0,
          duration: opts.duration ?? 0.8,
          ease: opts.ease ?? 'power3.out',
          stagger: opts.stagger ?? 0.075,
          onComplete: () => settle(gsap, [container, ...container.children]),
        });
      },
    });
  });
}

/** opacity 0→1 + translateY, стагер по элементам; один раз при входе в экран. После — .is-revealed. */
export function reveal(target, opts = {}) {
  if (reduced) return;
  const els = toArray(target);
  if (!els.length) return;
  for (const node of els) {
    node.classList.add('reveal');
    tracked.add(node);
  }
  run(({ gsap }) => {
    gsap.to(els, {
      opacity: 1,
      y: 0,
      duration: opts.duration ?? 0.8,
      ease: opts.ease ?? 'power3.out',
      stagger: opts.stagger ?? 0.075,
      delay: opts.delay ?? 0,
      onComplete: () => settle(gsap, els),
      scrollTrigger: {
        trigger: opts.trigger || els[0],
        start: opts.start || 'top 86%',
        once: true,
      },
    });
  });
}

/** translate3d по прогрессу скролла; factor 0.05–0.15 — доля высоты окна. */
export function parallax(target, factor = 0.1) {
  if (reduced) return;
  const els = toArray(target);
  if (!els.length) return;
  run(({ gsap }) => {
    for (const node of els) {
      gsap.fromTo(
        node,
        { y: () => -factor * window.innerHeight },
        {
          y: () => factor * window.innerHeight,
          ease: 'none',
          scrollTrigger: {
            trigger: node.closest('section') || node,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    }
  });
}

/** ScrollTrigger pin. opts — параметры ScrollTrigger (end, onUpdate…); opts.onCreate(trigger) — доступ к триггеру. */
export function pinSection(section, opts = {}) {
  if (reduced || !section) return;
  const { onCreate, ...rest } = opts;
  run(({ ScrollTrigger }) => {
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=100%',
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      ...rest,
    });
    onCreate?.(trigger);
  });
}

/**
 * Бесконечная бегущая строка: track содержит одну группу (.marquee__group или первый ребёнок),
 * группа клонируется до заполнения ширины. Пауза: hover, скрытая вкладка, вне экрана.
 * Работает без GSAP (rAF + transform). Возвращает функцию остановки.
 */
export function marquee(track, { speed = 40 } = {}) {
  if (reduced || !track) return () => {};
  const viewport = track.parentElement;
  const group = track.firstElementChild;
  if (!group) return () => {};

  let groupWidth = 0;
  let x = 0;
  let last = 0;
  let raf = 0;
  let hovered = false;
  let visible = true;
  let inView = false;

  const fill = () => {
    for (const clone of track.querySelectorAll('[data-marquee-clone]')) clone.remove();
    groupWidth = group.getBoundingClientRect().width;
    if (!groupWidth) return;
    const copies = Math.max(1, Math.ceil(viewport.clientWidth / groupWidth));
    for (let i = 0; i < copies; i++) {
      const clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('aria-labelledby');
      clone.dataset.marqueeClone = '';
      track.append(clone);
    }
  };

  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    x = (x + speed * dt) % (groupWidth || 1);
    track.style.transform = `translate3d(${-x}px, 0, 0)`;
    raf = requestAnimationFrame(tick);
  };

  const update = () => {
    const shouldRun = !hovered && visible && inView;
    if (shouldRun && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    } else if (!shouldRun && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  viewport.classList.add('is-running');
  // ширина группы меняется со шрифтами и сменой языка — пересчитываем
  const ro = new ResizeObserver(() => {
    fill();
  });
  ro.observe(group);
  ro.observe(viewport);
  fill();

  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    update();
  });
  io.observe(viewport);

  const onEnter = () => {
    hovered = true;
    update();
  };
  const onLeave = () => {
    hovered = false;
    update();
  };
  const onVisibility = () => {
    visible = document.visibilityState === 'visible';
    update();
  };
  viewport.addEventListener('pointerenter', onEnter);
  viewport.addEventListener('pointerleave', onLeave);
  viewport.addEventListener('focusin', onEnter);
  viewport.addEventListener('focusout', onLeave);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    viewport.removeEventListener('pointerenter', onEnter);
    viewport.removeEventListener('pointerleave', onLeave);
    viewport.removeEventListener('focusin', onEnter);
    viewport.removeEventListener('focusout', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

/** ScrollTrigger.refresh() — после смены языка и других перестроений. */
export function refreshMotion() {
  run(({ ScrollTrigger }) => ScrollTrigger.refresh());
}

/** Плавная прокрутка к элементу/селектору/числу: Lenis, а без него — нативно. */
export function scrollToTarget(target, { offset = 0, immediate = false } = {}) {
  const node = typeof target === 'string' ? document.querySelector(target) : target;
  if (node == null) return;
  if (api?.lenis) {
    api.lenis.scrollTo(node, { offset, immediate, duration: 1.2 });
    return;
  }
  const top = typeof node === 'number' ? node : node.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: reduced || immediate ? 'auto' : 'smooth' });
}

/** Блокировка скролла страницы (меню, модалки). Позиция сохраняется. */
export function lockScroll(locked) {
  html.classList.toggle('is-scroll-locked', locked);
  if (api?.lenis) {
    if (locked) api.lenis.stop();
    else api.lenis.start();
  }
}

/** Якорные ссылки href="#id" ведут к секции через Lenis; "#" без id — заглушка, никуда не ведёт. */
function bindAnchors() {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const link = event.target.closest?.('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (hash === '#') {
      event.preventDefault();
      return;
    }
    const node = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!node) return;
    event.preventDefault();
    scrollToTarget(node);
    history.replaceState(null, '', hash);
    if (node.id === 'main' || node.tabIndex >= 0) node.focus?.({ preventScroll: true });
  });
}
