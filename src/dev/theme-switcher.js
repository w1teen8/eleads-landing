// Панель версий оформления — инструмент заказчика, только в `npm run dev` (main.js грузит её под import.meta.env.DEV).
// Ставит <html data-theme> и пишет sessionStorage['eleads-theme'] — тот же ключ читает инлайн-скрипт в <head>,
// поэтому выбор держится до конца вкладки. В собранном сайте панели нет; там версия выбирается через ?theme=.
// Второй ряд — вариант первого экрана «Хиро: Кольцо / Самолётик / Синий» (mockup = ?hero=2, plane = 3 — интро
// с самолётиком, blue = 4): пишет sessionStorage['eleads-hero'] и перезагружает страницу — инициализируется только
// активный вариант.
const KEY = 'eleads-theme';
const HERO_KEY = 'eleads-hero';
const HEROES = [
  { id: 'mockup', label: 'Кольцо', param: '2' },
  { id: 'plane', label: 'Самолётик', param: '3' },
  { id: 'blue', label: 'Синий', param: '4' },
];
const THEMES = [
  ['brand', 'Бренд · Aether'],
  ['aether', 'Aether · оригинал'],
];

const CSS = `
.dev-theme{position:fixed;left:12px;bottom:12px;z-index:400;display:flex;gap:4px;padding:4px;
  border-radius:999px;background:var(--surface);color:var(--text);border:1px solid var(--line-strong);font:500 11px/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;
  box-shadow:0 10px 30px -10px color-mix(in srgb,var(--block) 80%,transparent)}
.dev-theme__btn{padding:8px 12px;border-radius:999px;color:var(--text-muted)}
.dev-theme__btn[aria-pressed='true']{background:var(--grad);color:var(--accent-ink)}
.dev-theme__btn:focus-visible{outline:2px solid var(--accent)}
.dev-theme--hero{bottom:56px;align-items:center}
.dev-theme__label{padding:0 6px 0 10px;color:var(--text-muted)}
`;

export function mountThemeSwitcher() {
  if (document.querySelector('[data-dev-themes]')) return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const panel = document.createElement('div');
  panel.className = 'dev-theme';
  panel.setAttribute('data-dev-themes', '');
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Версия оформления (dev)');

  const html = document.documentElement;
  const buttons = THEMES.map(([id, label]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dev-theme__btn';
    btn.textContent = label;
    btn.addEventListener('click', () => apply(id));
    btn.dataset.theme = id;
    return btn;
  });
  panel.append(...buttons);
  document.body.append(panel);

  function apply(id) {
    html.setAttribute('data-theme', id);
    try {
      sessionStorage.setItem(KEY, id);
    } catch {
      /* без хранилища выбор живёт до перезагрузки */
    }
    sync();
  }
  function sync() {
    const current = html.getAttribute('data-theme') || 'brand';
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.theme === current));
  }
  sync();
  mountHeroSwitcher();
}

function mountHeroSwitcher() {
  const html = document.documentElement;
  const panel = document.createElement('div');
  panel.className = 'dev-theme dev-theme--hero';
  panel.setAttribute('data-dev-hero', '');
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Вариант первого экрана (dev)');
  const label = document.createElement('span');
  label.className = 'dev-theme__label';
  label.textContent = 'Хиро:';
  const current = html.getAttribute('data-hero') || 'mockup';
  const buttons = HEROES.map(({ id, label: text, param }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dev-theme__btn';
    btn.textContent = text;
    btn.dataset.hero = id;
    btn.setAttribute('aria-pressed', String(id === current));
    btn.addEventListener('click', () => {
      if (id === current) return;
      try {
        sessionStorage.setItem(HERO_KEY, id);
      } catch {
        /* без хранилища — через параметр */
      }
      const url = new URL(location.href);
      url.searchParams.set('hero', param);
      location.replace(url);
    });
    return btn;
  });
  panel.append(label, ...buttons);
  document.body.append(panel);
}
