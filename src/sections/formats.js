// 04 Формати: клик по скриншоту-плейсхолдеру открывает лайтбокс (нативный <dialog>).
// Esc, клик вне, кнопка; фокус возвращается на открывавший элемент; фон не скроллится (lockScroll).
import { $, $$, on, focusables } from '../core/dom.js';
import { lockScroll, reduced } from '../core/motion.js';

const CLOSE_MS = 240;

export function init(root) {
  const dialog = $('[data-lightbox]', root);
  const stage = $('[data-lightbox-stage]', root);
  if (!dialog || !stage) return;
  let opener = null;
  let timer = 0;

  function open(button) {
    clearTimeout(timer);
    opener = button;
    const mock = $('.mock', button);
    stage.replaceChildren(mock.cloneNode(true));
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
  on(dialog, 'keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = focusables(dialog);
    if (!items.length) return;
    if (e.shiftKey && document.activeElement === items[0]) {
      e.preventDefault();
      items.at(-1).focus();
    } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
      e.preventDefault();
      items[0].focus();
    }
  });
}
