// Заставка «поиск находит eLeads» (сборка 2, ≈5 с): пустая строка с курсором → запрос набирается по символу →
// кнопка поиска загорается → три «скелетона» с бликом → первый становится карточкой eLeads → счётчик 100 →
// скошенная полоса (core/transition) закрывает экран и, уезжая, открывает сайт.
// Шаги сцены — атрибут data-step на корне (0 пусто · 1 набор · 2 поиск · 3 найдено), вид шагов — CSS
// на transform/opacity; часы шагов и набора — таймлайн GSAP. GSAP не успел — CSS-фолбэк: сразу результат.
// Счётчик идёт по своим часам и не доходит до 100 до `load` (держится на 99 не дольше LOAD_HOLD_MAX_MS).
// SKIP, Esc и клик по фону сразу запускают уход полосой. Не чаще раза в сутки на браузер: метку времени показа
// пишет rememberIntro() в localStorage, инлайн-скрипт <head> по ней решает, ставить ли html.js-preload
// (?intro=1 — принудительно); при reduced-motion заставки нет. Любая ошибка → failIntro(): первый экран виден сразу.
import {
  signalIntroDone,
  markIntroStart,
  failIntro,
  PRELOADER_SCENE_MS,
  PRELOADER_MAX_MS,
  PRELOADER_SAFETY_MS,
  LOAD_HOLD_MAX_MS,
} from '../core/intro.js';
import { t } from '../core/i18n.js';
import { cover, uncover } from '../core/transition.js';

/** Ключ localStorage: время последнего показа заставки, мс (читает инлайн-скрипт в <head>). */
export const INTRO_KEY = 'eleads-intro';
const TYPE_START_MS = 900; // курсор мигает в пустой строке
const CHAR_MIN_MS = 55;
const CHAR_MAX_MS = 90;
const SEARCH_AFTER_MS = 250; // от конца набора до кнопки и скелетонов
const FOUND_AFTER_MS = 650; // скелетоны → карточка результата
const HUNDRED_AFTER_MS = 350; // карточка → 100
const EXIT_AFTER_MS = 120; // 100 → полоса
const PRE_JS_MAX_MS = 500;

/** Расписание сцены, мс от старта; набор ужимается, чтобы «100» не выходило за PRELOADER_SCENE_MS. */
function plan(length) {
  const tail = SEARCH_AFTER_MS + FOUND_AFTER_MS + HUNDRED_AFTER_MS;
  const budget = PRELOADER_SCENE_MS - TYPE_START_MS - tail;
  let delays = Array.from({ length }, () => CHAR_MIN_MS + Math.random() * (CHAR_MAX_MS - CHAR_MIN_MS));
  const sum = delays.reduce((a, b) => a + b, 0);
  if (sum > budget) delays = delays.map((d) => (d * budget) / sum);
  const chars = [];
  let at = TYPE_START_MS;
  for (const d of delays) chars.push((at += d));
  const typeEnd = at;
  const searchAt = typeEnd + SEARCH_AFTER_MS;
  const foundAt = searchAt + FOUND_AFTER_MS;
  const hundredAt = foundAt + HUNDRED_AFTER_MS;
  // опорные точки счётчика — как у референса: 000 в пустой строке, ~55 к концу набора, 90+ на карточке
  const keys = [
    [0, 0],
    [TYPE_START_MS, 2],
    [typeEnd, 55],
    [searchAt, 70],
    [foundAt, 92],
    [hundredAt, 100],
  ];
  return { chars, typeEnd, searchAt, foundAt, hundredAt, keys };
}

function counterAt(keys, ms) {
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (ms <= t1) {
      const [t0, v0] = keys[i - 1];
      return v0 + ((v1 - v0) * (ms - t0)) / Math.max(1, t1 - t0);
    }
  }
  return 100;
}

/** Запомнить показ: сутки после него новая вкладка заставку не показывает. Без хранилища — покажется снова. */
export function rememberIntro(storage = globalThis.localStorage, now = Date.now()) {
  try {
    storage.setItem(INTRO_KEY, String(now));
  } catch {
    /* хранилище недоступно — заставка просто покажется снова */
  }
}

export function init(root) {
  const html = document.documentElement;
  if (!html.classList.contains('js-preload')) {
    root.hidden = true;
    signalIntroDone();
    return;
  }
  markIntroStart();
  try {
    run(root, html);
  } catch (err) {
    failIntro(err);
  }
}

function run(root, html) {
  const need = (sel) => {
    const node = root.querySelector(sel);
    if (!node) throw new Error(`preloader: нет ${sel}`);
    return node;
  };
  const valueNode = need('.preloader__value');
  const queryNode = need('.preloader__query');
  const skipNode = need('[data-preloader-skip]');

  rememberIntro();

  const query = String(t('preloader.query') || queryNode.textContent || '');
  const p = plan(query.length);
  // сцена видна с первой отрисовки (CSS), а скрипт стартует позже — до PRE_JS_MAX_MS этого времени засчитывается
  const start = performance.now() - Math.min(performance.now(), PRE_JS_MAX_MS);
  let loaded = document.readyState === 'complete';
  let shown = -1;
  let hundredSince = 0; // когда счётчик мог бы стать 100, но load ещё нет
  let exiting = false;
  let timeline = null;
  const timers = [];

  const setStep = (n) => {
    root.dataset.step = String(n);
  };
  const paint = (value) => {
    if (value === shown) return;
    shown = value;
    valueNode.textContent = String(value).padStart(3, '0');
  };

  window.addEventListener('load', () => (loaded = true), { once: true });

  // ——— сцена: GSAP, если успел к началу набора; иначе CSS-фолбэк — сразу результат ———
  setStep(0);
  queryNode.textContent = '';
  const toStatic = () => {
    if (exiting || timeline) return;
    root.classList.add('is-static');
    queryNode.textContent = query;
    setStep(3);
  };
  // GSAP грузится тут же, не дожидаясь initMotion (тот стартует после всех секций): общий чанк, второй загрузки нет
  const gsapWait = Promise.race([
    import('gsap').catch(() => null),
    new Promise((r) => timers.push(setTimeout(() => r(null), Math.max(0, start + TYPE_START_MS - 100 - performance.now())))),
  ]);
  gsapWait.then((mod) => {
    if (exiting) return;
    const gsap = mod?.gsap || mod?.default;
    if (!gsap) return toStatic();
    try {
      // таймлайн стоит на паузе, его головку двигает tick() по тем же часам, что и счётчик:
      // собственный тикер GSAP при занятом потоке (старт страницы) сглаживает лаги и отстаёт от счётчика
      const at = (ms) => ms / 1000;
      const tl = gsap.timeline({ paused: true });
      tl.call(() => setStep(1), null, at(TYPE_START_MS - 60));
      p.chars.forEach((ms, i) => tl.call(() => (queryNode.textContent = query.slice(0, i + 1)), null, at(ms)));
      tl.call(() => setStep(2), null, at(p.searchAt));
      tl.call(() => setStep(3), null, at(p.foundAt));
      timeline = tl;
    } catch (err) {
      console.error('[preloader] timeline', err);
      toStatic();
    }
  });

  // ——— уход полосой ———
  const exit = async () => {
    if (exiting) return;
    exiting = true;
    for (const id of timers) clearTimeout(id);
    try {
      timeline?.kill();
      paint(100);
      root.classList.add('is-done');
      document.removeEventListener('keydown', onKey);
      await cover({});
      root.hidden = true;
      html.classList.remove('js-preload');
      signalIntroDone();
      // перестройка страницы под открывшимся первым экраном — пока полоса закрывает его, а не на ходу
      await new Promise((r) => {
        requestAnimationFrame(() => requestAnimationFrame(r));
        setTimeout(r, 120);
      });
      await uncover();
    } catch (err) {
      failIntro(err);
    }
  };

  // ——— счётчик ———
  const tick = (now) => {
    if (exiting) return;
    try {
      const elapsed = now - start;
      timeline?.time(elapsed / 1000);
      let value = Math.floor(counterAt(p.keys, elapsed));
      if (value >= 100 && !loaded) {
        hundredSince ||= now;
        if (now - hundredSince < LOAD_HOLD_MAX_MS) value = 99;
      }
      paint(Math.min(100, value));
      if (value >= 100) {
        timers.push(setTimeout(exit, EXIT_AFTER_MS));
        return;
      }
      requestAnimationFrame(tick);
    } catch (err) {
      exiting = true;
      failIntro(err);
    }
  };
  requestAnimationFrame(tick);

  // ——— пропуск: SKIP, Esc, клик по фону ———
  function onKey(event) {
    if (event.key === 'Escape') exit();
  }
  document.addEventListener('keydown', onKey);
  root.addEventListener('click', () => exit());
  skipNode.addEventListener('click', (event) => {
    event.stopPropagation();
    exit();
  });

  // страховка: если rAF не крутится (вкладка в фоне), уход всё равно начинается по потолку
  setTimeout(exit, PRELOADER_MAX_MS + PRELOADER_SAFETY_MS);
}
