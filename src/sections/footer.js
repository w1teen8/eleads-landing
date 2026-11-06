// Подвал: переключатель языка и кнопка «нагору». Якоря — фирменной полосой (core/transition), Telegram — общим модулем.
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
