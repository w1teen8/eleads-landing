// Подвал (T31): компактный — логотип словом, строка ссылок на разделы, UA/EN, кнопка в Telegram, © и «Нагору».
// Без «подъёма букв», вордмарка и прочих эффектов появления (правило клиента, H11): всё видно сразу.
import { $, $$ } from '../core/dom.js';
import { bindLangSwitch } from '../core/lang-switch.js';
import { scrollToTarget } from '../core/motion.js';
import { bindSweepLinks } from '../core/transition.js';

export function init(root) {
  for (const sw of $$('[data-lang-switch]', root)) bindLangSwitch(sw);
  bindSweepLinks(root);
  $('[data-scroll-top]', root)?.addEventListener('click', () => {
    scrollToTarget(0);
    document.getElementById('main')?.focus({ preventScroll: true });
  });
}
