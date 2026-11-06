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
