// Подвал: колонки ссылок, Telegram, UA/EN, кнопка «нагору» и огромный вордмарк «ELEADS».
// Вордмарк (G15, как у Aether): буквы — отдельные span внутри маски, при входе подвала в экран поднимаются
// по одной (CSS transition transform со сдвигом по --i), цвета чередуются акцент / белый.
// Начальное «спрятано» действует только под html.js-anim и до .is-in — без JS и при reduced-motion буквы на месте.
import { $, $$ } from '../core/dom.js';
import { bindLangSwitch } from '../core/lang-switch.js';
import { scrollToTarget } from '../core/motion.js';
import { bindSweepLinks } from '../core/transition.js';

/** «eLeads» → [{char:'E', accent:true}, {char:'L', accent:false}, …]: капс, пробелы выброшены, первая — акцент. */
export function wordmarkLetters(word) {
  return [...String(word || '').toUpperCase()]
    .filter((char) => char.trim())
    .map((char, i) => ({ char, accent: i % 2 === 0 }));
}

function buildWordmark(node) {
  const letters = wordmarkLetters(node.textContent);
  if (!letters.length) return;
  // слово не зависит от языка — убираем data-i18n, чтобы смена языка не затёрла буквы текстом
  node.removeAttribute('data-i18n');
  node.textContent = '';
  letters.forEach(({ char, accent }, i) => {
    const span = document.createElement('span');
    span.className = accent ? 'footer__char footer__char--accent' : 'footer__char';
    span.style.setProperty('--i', String(i));
    span.textContent = char;
    node.append(span);
  });
}

function revealOnEnter(target, mark) {
  if (!('IntersectionObserver' in window)) {
    mark.classList.add('is-in');
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      mark.classList.add('is-in');
      io.disconnect();
    },
    { threshold: 0.35 },
  );
  io.observe(target);
}

export function init(root) {
  for (const sw of $$('[data-lang-switch]', root)) bindLangSwitch(sw);
  bindSweepLinks(root);
  $('[data-scroll-top]', root)?.addEventListener('click', () => {
    scrollToTarget(0);
    document.getElementById('main')?.focus({ preventScroll: true });
  });

  const word = $('[data-wordmark]', root);
  const mark = word?.closest('.footer__wordmark');
  if (word && mark) {
    buildWordmark(word);
    revealOnEnter(mark, mark);
  }
}
