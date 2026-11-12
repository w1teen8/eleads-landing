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
// Только transform и opacity; номер и подпись не искажаются (растёт отдельный слой фона).
import { $, $$ } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { pinScrub } from '../core/motion-kit.js';
import { stepProgress, stepPose, pinLength, GROW_MIN } from './process-model.js';

/** Закрепление с ростом ступеней по прокрутке. 2026-11-11 выключали (клиент: «во втором — убрать. Не так важно,
 *  чтобы они это читали прям»); 2026-11-12 клиент: «теперь не поднимается при скроле» — пользователь: «Вернуть как было». */
export const PINNED = true;

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

  if (!PINNED) return;
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
