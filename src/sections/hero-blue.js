// 01 Hero, вариант 4 «blue» (?hero=4, G26/G27; макет reference/hero-v4/mockup.png): синий фон Telegram, огромное
// «eLeads» за Володимиром без фона, слева заголовок из маски и белая пилюля, справа белые карточки с цифрами брифа
// и карточка рекламы Telegram. Здесь — фото (в HTML без src: неактивные варианты его не грузят) и появление после
// заставки-поиска; плавание карточек — CSS, параллакс слоёв [data-depth] — общий из hero.js.
// Появление: .hero--entering снимается, когда заставка ушла; упала или вышел срок — сразу коротким переходом
// (.hero--fast). Страховка — BLUE_SAFETY_MS: позже первый экран виден при любом сбое.
// При reduced-motion всё видно сразу. Двигаются только transform и opacity.
import { $, $$ } from '../core/dom.js';
import { reduced } from '../core/motion.js';
import { whenIntroDone, INTRO_DEADLINE_MS } from '../core/intro.js';

/** Позже этого срока (от старта страницы) первый экран варианта 4 виден в любом случае. */
export const BLUE_SAFETY_MS = INTRO_DEADLINE_MS + 600;

/** stage — обёртка варианта `.hero-blue`, root — `<section id="hero">`. */
export function initBlue(stage, root = stage) {
  loadPhoto(stage);
  if (reduced) return;
  root.classList.add('hero--entering');
  const show = (fast) => {
    if (fast) root.classList.add('hero--fast');
    root.classList.remove('hero--entering');
  };
  if (document.documentElement.classList.contains('js-preload')) {
    whenIntroDone().then((how) => show(how !== 'done'));
    const left = Math.max(0, BLUE_SAFETY_MS - performance.now());
    setTimeout(() => root.classList.contains('hero--entering') && show(true), left);
  } else {
    // без заставки — лёгкое появление сразу
    requestAnimationFrame(() => requestAnimationFrame(() => show(false)));
  }
}

/** data-src / data-srcset → src / srcset: фото грузится только в активном варианте 4. */
function loadPhoto(stage) {
  const picture = $('.hero-blue__person', stage);
  if (!picture) return;
  const img = $('img', picture);
  for (const source of $$('source', picture)) {
    if (source.dataset.srcset) source.srcset = source.dataset.srcset;
  }
  if (!img) return;
  img.setAttribute('fetchpriority', 'high');
  if (img.dataset.srcset) img.srcset = img.dataset.srcset;
  if (img.dataset.src) img.src = img.dataset.src;
}
