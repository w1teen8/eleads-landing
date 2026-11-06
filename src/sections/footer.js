// Подвал: переключатель языка и кнопка «нагору». Якоря и Telegram обрабатываются общими модулями.
import { $, $$ } from '../core/dom.js';
import { bindLangSwitch } from '../core/lang-switch.js';
import { scrollToTarget } from '../core/motion.js';

export function init(root) {
  for (const sw of $$('[data-lang-switch]', root)) bindLangSwitch(sw);
  $('[data-scroll-top]', root)?.addEventListener('click', () => {
    scrollToTarget(0);
    document.getElementById('main')?.focus({ preventScroll: true });
  });
}
