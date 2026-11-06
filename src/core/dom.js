// Мелкие помощники для работы с DOM.

export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

/**
 * el('a', { class: 'btn', text: 'Hi', dataset: { place: 'hero' }, attrs: { href: '#' } }, child, 'text')
 * props: class, text, html, dataset, attrs
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  const { class: className, text, html, dataset, attrs } = props;
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  if (html != null) node.innerHTML = html;
  if (dataset) Object.assign(node.dataset, dataset);
  if (attrs) {
    for (const [name, value] of Object.entries(attrs)) {
      if (value === false || value == null) continue;
      node.setAttribute(name, value === true ? '' : String(value));
    }
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Подписка с возвратом отписки. */
export function on(target, type, fn, opts) {
  target.addEventListener(type, fn, opts);
  return () => target.removeEventListener(type, fn, opts);
}

/** Фокусируемые элементы внутри контейнера — для ловушки фокуса в меню и модалках. */
export function focusables(root) {
  return $$(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    root,
  ).filter((node) => !node.hidden && node.getClientRects().length > 0);
}

/**
 * Ловушка фокуса для меню и модалок: на keydown у target Tab / Shift+Tab ходят по кругу по items().
 * Фокус вне списка — возвращается на первый (Shift+Tab — на последний). Возвращает отписку.
 */
export function trapFocus(target, items = () => focusables(target)) {
  return on(target, 'keydown', (event) => {
    if (event.key !== 'Tab') return;
    const list = items();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    const active = globalThis.document?.activeElement;
    let next = null;
    if (!list.includes(active)) next = event.shiftKey ? last : first;
    else if (event.shiftKey && active === first) next = last;
    else if (!event.shiftKey && active === last) next = first;
    if (!next) return;
    event.preventDefault();
    next.focus();
  });
}
