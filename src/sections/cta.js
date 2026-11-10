// 14 Фінальний CTA (T37, вариант B «чат з Володимиром»): слева заголовок, текст и кнопка в Telegram, справа общий
// телефон с чатом. Сообщение-приглашение есть в разметке (видно без JS и при reduced-motion / ?nomotion=1); с движением
// оно прячется до появления блока, а при первом появлении приходит после «друкує…» — один раз.
// Весь экран телефона — ссылка в Telegram (a.phone__link, data-place="final_cta_chat"). Только transform и opacity.
import { $, el } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t } from '../core/i18n.js';
import { reduced } from '../core/motion.js';

/** Сколько Володимир «друкує», мс. */
export const TYPING_MS = 900;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export function init(root) {
  accentTitles(root);
  const thread = $('[data-cta-thread]', root);
  const hello = $('[data-cta-hello]', root);
  const status = $('[data-cta-status]', root);
  if (reduced || !thread || !hello || typeof hello.animate !== 'function' || !('IntersectionObserver' in window)) return;

  hello.style.opacity = '0';
  let played = false;

  const play = () => {
    if (played) return;
    played = true;
    const typing = el('div', { class: 'phone__typing', attrs: { 'aria-hidden': 'true' } }, el('i'), el('i'), el('i'));
    hello.hidden = true;
    thread.append(typing);
    typing.animate([{ opacity: 0, transform: 'translateY(30%) scale(0.86)' }, { opacity: 1, transform: 'none' }], {
      duration: 360,
      easing: EASE,
    });
    if (status) status.textContent = t('cta.chat.typing');
    setTimeout(() => {
      typing.remove();
      hello.hidden = false;
      hello.style.opacity = '';
      hello.animate([{ opacity: 0, transform: 'translateY(24%) scale(0.88)' }, { opacity: 1, transform: 'none' }], {
        duration: 460,
        easing: EASE,
      });
      if (status) status.textContent = t('cta.chat.status');
    }, TYPING_MS);
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setTimeout(play, 350);
    },
    { threshold: 0.5 },
  );
  io.observe(thread.closest('.phone') || root);
}
