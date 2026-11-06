// Переключатель UA/EN — одна и та же разметка в шапке, меню и подвале:
// <div data-lang-switch><button data-lang="ua" aria-pressed>…</button><button data-lang="en">…</button></div>
import { getLang, setLang, onLangChange } from './i18n.js';

function paint(container, lang) {
  container.dataset.active = lang;
  for (const btn of container.querySelectorAll('[data-lang]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
  }
}

export function bindLangSwitch(container) {
  if (!container) return;
  paint(container, getLang());
  container.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-lang]');
    if (btn) setLang(btn.dataset.lang);
  });
  onLangChange((lang) => paint(container, lang));
}
