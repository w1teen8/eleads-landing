// 04 Як виглядає реклама (T21): три формата с примерами рекламы MONOLIT, собранными в HTML/CSS.
// Переходов по прокрутке нет (H11): блок идёт за предыдущим обычной прокруткой, содержимое видно сразу.
// Клик по примеру открывает его крупно в лайтбоксе (нативный <dialog>): Esc, клик вне, кнопка; фокус возвращается
// на открывавший пример; фон не скроллится (lockScroll — Lenis на паузе).
import { $, $$, on, trapFocus } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { lockScroll, reduced } from '../core/motion.js';

const CLOSE_MS = 240;

export function init(root) {
  accentTitles(root);

  const dialog = $('[data-lightbox]', root);
  const stage = $('[data-lightbox-stage]', root);
  if (!dialog || !stage) return;
  let opener = null;
  let timer = 0;

  function open(button) {
    clearTimeout(timer);
    opener = button;
    const example = $('.tg-ad', button);
    stage.replaceChildren(example.cloneNode(true));
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    lockScroll(true);
    requestAnimationFrame(() => dialog.classList.add('is-open'));
    $('[data-lightbox-close]', dialog).focus({ preventScroll: true });
  }

  function close() {
    if (!dialog.open) return;
    dialog.classList.remove('is-open');
    const finish = () => {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      lockScroll(false);
      opener?.focus({ preventScroll: true });
    };
    if (reduced) finish();
    else timer = setTimeout(finish, CLOSE_MS);
  }

  for (const button of $$('[data-lightbox-open]', root)) on(button, 'click', () => open(button));
  on($('[data-lightbox-close]', dialog), 'click', close);
  on(dialog, 'cancel', (e) => {
    e.preventDefault();
    close();
  });
  on(dialog, 'click', (e) => {
    if (e.target === dialog || e.target === stage) close();
  });
  trapFocus(dialog);
}
