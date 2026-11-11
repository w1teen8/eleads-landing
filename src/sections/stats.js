// 02 Telegram у цифрах (T19; T25 — карты из точек и движение блока). Переходов между экранами нет (H11): блок идёт
// обычной прокруткой под первым экраном. Своё движение блока (выбор пользователя, T25, дополнение 3):
//   появление — один раз, когда блок вошёл в окно: заголовок выезжает строками из-под маски; карточка, строки и
//             плашка поднимаются снизу лесенкой (stagger из core/motion-kit.js); карта Украины зажигается волной
//             от Киева и останавливается ровно на доле из stats.ua.main.value; цифры докручиваются барабанами от нуля;
//   вкладки  — Україна / Worldwide (role=tablist, стрелки, Home/End): цифры перекручиваются барабанами
//             (stats-odometer.js), подписи меняются «табло» (flipSwap), карты сменяют друг друга через opacity;
//   карты    — Украина (src/data/ua-dots.json) и мир (geo-dots.json; доли нет — горят все точки суши): волны от
//             курсора, клика и тапа, расталкивание точек у курсора, редкое «дыхание» поля — stats-dots.js.
// Меняются только transform и opacity. При reduced-motion и ?nomotion=1 — всё статично и сразу в конечном виде.
import { $, $$, on } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { t } from '../core/i18n.js';
import { reduced } from '../core/motion.js';
import { flipSwap, stagger, FLIP } from '../core/motion-kit.js';
import { gridPoint, parseShare, WORLD_STRIDE } from './stats-model.js';
import { createDotMap } from './stats-dots.js';
import { rollTo, shownValue } from './stats-odometer.js';
import uaGrid from '../data/ua-dots.json';
import worldGrid from '../data/geo-dots.json';

/** Задержка табло между соседними строками карточек, мс — волна слева направо. */
const FLIP_STEP_MS = 35;
/** Откуда волна зажигает карту Украины — Киев. */
const KYIV = { lon: 30.5, lat: 50.45 };
/** Появление: блок вошёл в окно почти наполовину — карточка с картой уже на виду. На телефоне блок выше окна:
 *  заголовок с вкладками появляются, когда блок показался, а каждая часть ниже — когда сама доходит до низа окна. */
const ENTER_START = 'top 55%';
const ENTER_START_NARROW = 'top 80%';
const WIDE = '(min-width: 900px)';
/** Заголовок: строка выезжает из-под маски; вторая — с задержкой. */
const TITLE = { duration: 760, step: 90 };

// Итоговая строка — всегда из словаря текущего языка: язык могли сменить посреди табло.
function finalText(node) {
  const key = node.dataset.i18n;
  const value = key ? t(key) : null;
  return typeof value === 'string' && value !== key ? value : shownValue(node);
}

const isValue = (node) => node.classList.contains('stats__value');

/** Смена карты при переключении вкладки: прежняя гаснет поверх новой, новая проявляется — только opacity. */
function crossfade(fromBox, toBox) {
  for (const old of $$('.stats__ghost', toBox)) old.remove();
  const fromSvg = fromBox && $('svg', fromBox);
  const toSvg = toBox && $('svg', toBox);
  if (reduced || !fromSvg || !toSvg || typeof toSvg.animate !== 'function') return;
  const ghost = fromSvg.cloneNode(true);
  ghost.classList.add('stats__ghost');
  for (const dot of $$('.stats__dot', ghost)) dot.removeAttribute('style');
  toBox.append(ghost);
  const timing = { duration: FLIP.duration, easing: FLIP.easing };
  toSvg.animate({ opacity: [0, 1] }, timing);
  const out = ghost.animate({ opacity: [1, 0] }, { ...timing, fill: 'forwards' });
  const done = () => ghost.remove();
  out.finished.then(done, done);
}

/** Заголовок выезжает строками из-под маски: начало и акцентный хвост — каждая своей строкой. */
function revealTitle(title) {
  if (reduced || !title || typeof title.animate !== 'function') return;
  const accent = $('.display__accent', title);
  const lead = document.createElement('span');
  lead.className = 'stats__line';
  lead.append(...[...title.childNodes].filter((node) => node !== accent));
  const lines = [lead, accent].filter(Boolean);
  const masks = lines.map((line) => {
    const mask = document.createElement('span');
    mask.className = 'stats__mask';
    mask.append(line);
    return mask;
  });
  title.replaceChildren(...masks);
  const moves = lines.map((line, i) =>
    line.animate(
      { transform: ['translateY(110%)', 'translateY(0)'] },
      { duration: TITLE.duration, delay: i * TITLE.step, easing: FLIP.easing, fill: 'both' },
    ),
  );
  const restore = () => {
    for (const move of moves) move.cancel();
    // язык могли сменить посреди движения — тогда заголовок уже переписан, трогать нечего
    if (masks.every((mask) => mask.parentNode === title)) title.replaceChildren(...lead.childNodes, ...(accent ? [accent] : []));
  };
  Promise.all(moves.map((move) => move.finished)).then(restore, restore);
}

export function init(root) {
  accentTitles(root);
  const host = $('[data-stats]', root);
  const bar = $('.stats__tabs', root);
  if (!host || !bar) return;
  const tabs = $$('[data-stats-tab]', bar);
  const panels = $$('[data-stats-panel]', host);

  // карты: у Украины горит доля из главной цифры вкладки, у мира доли нет — горят все точки суши
  const mapBox = (id) => $(`[data-stats-map="${id}"]`, host);
  const maps = {
    ua: createDotMap(mapBox('ua'), uaGrid, { share: parseShare(t('stats.ua.main.value')) }),
    ww: createDotMap(mapBox('ww'), worldGrid, { stride: WORLD_STRIDE }),
  };

  function select(id, { focus = false, animate = true } = {}) {
    tabs.forEach((tab, i) => {
      const active = tab.dataset.statsTab === id;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) {
        bar.dataset.active = id;
        bar.style.setProperty('--tab', String(i));
        if (focus) tab.focus();
      }
    });
    const prev = panels.find((p) => !p.hidden);
    const next = panels.find((p) => p.dataset.statsPanel === id);
    if (!next || next === prev) return;
    // каждая строка новой вкладки стартует с того, что показывала та же строка прежней
    const was = new Map(prev ? $$('[data-flip]', prev).map((n) => [n.dataset.flip, shownValue(n)]) : []);
    if (prev) prev.hidden = true;
    next.hidden = false;
    if (!animate) return;
    if (prev) crossfade($('[data-stats-map]', prev), $('[data-stats-map]', next));
    for (const node of $$('[data-flip]', next)) {
      const from = was.get(node.dataset.flip);
      if (from == null) continue;
      const delay = Number(node.dataset.flip) * FLIP_STEP_MS;
      const settle = () => {
        node.textContent = finalText(node);
      };
      if (isValue(node)) {
        // цифры — барабанами
        rollTo(node, finalText(node), { from, delay }).then(settle);
      } else {
        // подписи — табло
        node.textContent = from;
        flipSwap(node, finalText(node), { delay }).then(settle);
      }
    }
  }

  tabs.forEach((tab, i) => {
    on(tab, 'click', () => select(tab.dataset.statsTab));
    on(tab, 'keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        select(tabs[e.key === 'Home' ? 0 : tabs.length - 1].dataset.statsTab, { focus: true });
      } else if (keys[e.key]) {
        e.preventDefault();
        select(tabs[(i + keys[e.key] + tabs.length) % tabs.length].dataset.statsTab, { focus: true });
      }
    });
  });

  select('ua', { animate: false });
  enter(root, panels[0], maps.ua);
}

/**
 * Появление блока — один раз. При reduced-motion ничего не прячется и не движется: stagger сразу зовёт onEach,
 * а здесь всё выходит до первого действия.
 */
function enter(root, panel, map) {
  if (!panel) return;
  const items = $$('.stats__card, .stats__row', panel); // карточка, две строки, плашка — в порядке разметки
  if (!reduced) map?.darken();
  let entered = false;

  // первая часть блока тронулась — выезжает заголовок и зажигается карта
  const start = () => {
    if (entered) return;
    entered = true;
    root.classList.add('is-in');
    if (reduced) return;
    revealTitle($('.section__title', root));
    map?.ignite(gridPoint(uaGrid, KYIV.lon, KYIV.lat));
  };
  // часть блока тронулась — её цифра докручивается от нуля
  const onEach = (node) => {
    start();
    if (reduced) return;
    const value = $('.stats__value', node);
    if (!value || node.closest('[hidden]')) return;
    rollTo(value, finalText(value), { from: '', turns: 1 }).then(() => {
      value.textContent = finalText(value);
    });
  };

  // весь блок появляется вместе, и на телефоне тоже («Появление этого блока сделать вместе с остальным блоком»):
  // раньше на узком экране каждая строка ждала, пока сама доедет до низа окна
  const bar = $('.stats__tabs', root);
  const startAt = reduced || window.matchMedia?.(WIDE).matches ? ENTER_START : ENTER_START_NARROW;
  stagger([bar], { trigger: root, start: startAt, onEach: start });
  stagger(items, { trigger: root, start: startAt, onEach });
}
