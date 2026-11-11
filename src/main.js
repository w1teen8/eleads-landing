// Точка входа: boot() — i18n → sections → motion → analytics.
// Секции и их стили подхватываются по имени файла: <section data-section="stats"> ищет src/sections/stats.js
// и src/styles/sections/stats.css — новый блок добавляется без правки этого файла.
import { initI18n, onLangChange } from './core/i18n.js';
import { initMotion, refreshMotion, reduced } from './core/motion.js';
import { initBackdrop } from './core/backdrop.js';
import { initAnalytics } from './core/analytics.js';
import config from './data/config.json';
import { isSectionEnabled } from './core/sections.js';

// Порядок каскада: сначала токены, база и каркас, потом стили секций.
// Оба glob-вызова Vite поднимает в начало модуля в порядке их записи — поэтому и база идёт через glob.
import.meta.glob(['./styles/tokens.css', './styles/base.css', './styles/layout.css'], { eager: true });
import.meta.glob(['./styles/components.css', './styles/backdrop.css'], { eager: true });
import.meta.glob('./styles/sections/*.css', { eager: true });
const sections = import.meta.glob('./sections/*.js', { eager: true });

// Отдать поток браузеру между секциями: инициализация одним куском — это длинная задача (TBT в Lighthouse).
const yieldToBrowser = () =>
  typeof scheduler !== 'undefined' && scheduler.yield ? scheduler.yield() : new Promise((resolve) => setTimeout(resolve, 0));

async function initSections() {
  for (const node of document.querySelectorAll('[data-section]')) {
    const name = node.dataset.section;
    // отключённая в config.json → sections.enabled: не инициализируется и уходит из DOM до старта движения
    if (!isSectionEnabled(name, config) || node.hidden) {
      node.remove();
      continue;
    }
    const mod = sections[`./sections/${name}.js`];
    if (typeof mod?.init !== 'function') continue;
    try {
      mod.init(node);
    } catch (err) {
      // одна сломанная секция не роняет страницу
      console.error(`[boot] секция «${name}» не запустилась`, err);
    }
    await yieldToBrowser();
  }
}

async function boot() {
  // живой фон — сразу, до секций: он за всей страницей и от текста не зависит
  try {
    initBackdrop({ reduced });
  } catch (err) {
    console.error('[boot] фон', err);
  }
  try {
    await initI18n();
  } catch (err) {
    console.error('[boot] i18n', err);
  }
  await initSections();
  initMotion();
  initAnalytics(config);
  onLangChange(() => refreshMotion());
}

boot();
