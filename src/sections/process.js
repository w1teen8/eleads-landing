// 07 Процес (T32, выбор пользователя «А с скролл степс»): семь ступеней вверх слева направо на общем основании
// (образец reference/run3/process-A-chosen.png) и рост ступеней по прокрутке в духе Framer «Scroll Steps».
// Пользователь: «Я должен застыть на этом экране, скролить вниз и ждать пока появятся все 7 столбов» —
//   широкий альбомный экран: блок встаёт под шапку и закрепляется (pinScrub из core/motion-kit.js — тот же механизм,
//                pin + pinSpacing, что у лент showcase). Пока страница стоит, прокрутка по очереди выращивает ступени
//                01 → 07: фон ступени вырастает из основания (scaleY от низа), номер едет за верхним краем фона, номер
//                и подпись проявляются; основание прочерчивается слева направо. После седьмой — короткая пауза, экран
//                отпускается, страница едет дальше. Назад — ступени опускаются в обратном порядке. До закрепления
//                ступени стоят у основания, тусклые. Отрезки и позы — process-model.js;
//   узкий / портретный экран, reduced-motion, ?nomotion=1, сбой загрузки GSAP — без закрепления, ступени сразу
//                в конечном виде (стиль ставит только JS).
// 2026-11-12 клиент: «Тут відв'язати скрол від блока. Щоб воно само з'являлось» — закрепление выключено (PINNED = false);
//   на широком альбомном экране ступени вырастают сами, когда блок въезжает в экран (appear: та же раскадровка
//   01 → 07, только прогресс идёт по времени APPEAR_MS, а не по прокрутке), один раз. До этого стоят у основания.
// Только transform и opacity; номер и подпись не искажаются (растёт отдельный слой фона).
import { $, $$ } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { pinScrub, SHOWCASE_MEDIA } from '../core/motion-kit.js';
import { reduced } from '../core/motion.js';
import { stepProgress, stepPose, pinLength, GROW_MIN } from './process-model.js';

/** Закрепление с ростом ступеней по прокрутке. 2026-11-11 выключали («во втором — убрать»), утром 2026-11-12 вернули
 *  («теперь не поднимается при скроле»), вечером 2026-11-12 клиент: «відв'язати скрол від блока. Щоб воно само
 *  з'являлось» — выключено, ступени растут сами (appear). */
export const PINNED = false;

/** Сколько длится рост всех семи ступеней, когда они появляются сами, мс. */
export const APPEAR_MS = 2600;

/** Минимальный зазор между номером и подписью, px. */
const GAP = 8;

export function init(root) {
  accentTitles(root);
  const list = $('[data-process]', root);
  if (!list) return;
  const steps = $$('.process__step', list).map((li) => ({
    li,
    bg: $('.process__bg', li),
    num: $('.process__num', li),
    label: $('.process__label', li),
  }));
  const base = $('.process__base', list);
  if (!steps.length || steps.some((s) => !s.bg || !s.num || !s.label)) return;
  const n = steps.length;

  let sizes = [];
  const measure = () => {
    sizes = steps.map(({ li, num, label }) => ({
      height: li.offsetHeight,
      // offsetTop / offsetHeight не зависят от transform — меряется конечный вид
      room: Math.max(0, label.offsetTop - (num.offsetTop + num.offsetHeight) - GAP),
    }));
  };

  // пишем в style, только если значение изменилось: за кадр меняются одна-две ступени
  const written = new Map();
  const set = (node, prop, value) => {
    const memo = written.get(node) || {};
    if (memo[prop] === value) return;
    memo[prop] = value;
    written.set(node, memo);
    node.style[prop] = value;
  };

  const paint = (p) => {
    if (!sizes.length) measure();
    steps.forEach(({ bg, num, label }, i) => {
      const pose = stepPose(stepProgress(p, i, n), sizes[i]);
      set(bg, 'transform', pose.scale >= 1 ? '' : `scaleY(${pose.scale.toFixed(4)})`);
      set(num, 'transform', pose.numY ? `translateY(${pose.numY.toFixed(1)}px)` : '');
      const glow = pose.glow >= 1 ? '' : pose.glow.toFixed(3);
      set(num, 'opacity', glow);
      set(label, 'opacity', glow);
    });
    if (base) set(base, 'transform', p >= 1 ? '' : `scaleX(${Math.max(GROW_MIN, Math.min(1, p)).toFixed(4)})`);
  };

  const revert = () => {
    written.clear();
    for (const { bg, num, label } of steps) {
      bg.style.transform = '';
      num.style.transform = '';
      num.style.opacity = '';
      label.style.opacity = '';
    }
    if (base) base.style.transform = '';
  };

  if (!PINNED) {
    appear(root, paint, measure);
    return;
  }
  pinScrub(root, {
    length: () => window.innerHeight * pinLength(n),
    onRefresh: () => {
      written.clear();
      measure();
    },
    onProgress: paint,
    onRevert: revert,
  });
}

/** Ступени вырастают сами, когда блок въезжает в экран: прогресс 0 → 1 за APPEAR_MS, один раз. Только на широком
 *  альбомном экране (на телефоне ступени — список полос, стоят в конечном виде); reduced-motion — конечный вид. */
function appear(root, paint, measure) {
  if (reduced || !window.matchMedia?.(SHOWCASE_MEDIA).matches || !('IntersectionObserver' in window)) return;
  measure();
  paint(0);
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      measure(); // шрифты уже загружены — размеры конечного вида точнее
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / APPEAR_MS);
        paint(p);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { threshold: 0.45 },
  );
  io.observe(root);
}
