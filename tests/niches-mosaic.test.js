// T26 (H26): блок 03 «Ніші» — мозаика 4×2 в цветах палитры, крупная контурная иконка ниши в углу каждой плитки.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';

const html = read('index.html');
const css = read('src/styles/sections/niches.css').replace(/\/\*[\s\S]*?\*\//g, '');
const section = html.split(/<section\b[^>]*\sid="niches"/)[1].split('</section>')[0];
const items = section.split('<li class="niches__item">').slice(1);

const TONES = ['dark', 'light', 'dark', 'yellow', 'orange', 'dark', 'light', 'other'];

test('восемь плиток в тонах образца: тёмная, светлая, тёмная, жёлтая, оранжевая, тёмная, светлая, «Інша ніша?»', () => {
  assert.equal(items.length, 8);
  items.forEach((it, i) => {
    assert.match(it, new RegExp(`class="niches__card niches__card--${TONES[i]}\\b`), `плитка ${i}`);
  });
});

test('в каждой плитке — инлайн-SVG-иконка aria-hidden; точек и номеров нет', () => {
  items.forEach((it, i) => {
    const icon = it.match(/<svg class="niches__icon"[^>]*>[\s\S]*?<\/svg>/);
    assert.ok(icon, `иконка плитки ${i}`);
    assert.match(icon[0], /aria-hidden="true"/);
    assert.match(icon[0], /stroke="currentColor"/);
    assert.doesNotMatch(icon[0], /stroke-opacity|rgba|opacity=/, 'прозрачность — на весь svg в CSS, не на обводке');
  });
  assert.doesNotMatch(section, /niches__dot|niches__num|niches__label|\b0[1-7]\b/);
});

test('«Auto» — машина сбоку: кузов, окна и два колеса, не обрезана краем', () => {
  const car = items[4].match(/<svg class="niches__icon"[\s\S]*?<\/svg>/)[0];
  assert.equal((car.match(/<circle\b/g) || []).length, 2, 'два колеса');
  assert.match(car, /<path d="M1\.8 15\.8/, 'кузов из образца');
  assert.match(car, /M6\.3 11\.5h12\.4M11\.8 7\.5v4/, 'окна');
  // вся иконка внутри плитки: сдвиг за край только отрицательным right/bottom — его быть не должно
  const icon = css.match(/\.niches__icon\s*\{([^}]*)\}/)[1];
  assert.doesNotMatch(icon, /(?:right|bottom)\s*:\s*-/, 'иконка не уходит за край плитки');
});

test('«Інша ніша?» — ссылка в Telegram с data-place, иконка-самолётик, стрелка-кружок; фокус виден', () => {
  assert.match(items[7], /<a class="niches__card niches__card--other"[^>]*data-place="niches_other"/);
  assert.match(items[7], /M21 4 3 11l6 2 2 6 3-4 5 4z/, 'самолётик');
  assert.match(items[7], /class="niches__arrow"/);
  assert.match(css, /\.niches__card--other:focus-visible\s*\{[^}]*outline:\s*2px solid/);
});

test('стили: название шрифтом канала заглавными, прозрачность иконки на весь svg, цвета — из токенов', () => {
  assert.match(css, /\.niches__name\s*\{[^}]*font-family:\s*var\(--font-head\)[^}]*text-transform:\s*uppercase/);
  assert.match(css, /\.niches__icon\s*\{[^}]*opacity:\s*0?\.\d+/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'литералы цвета — только в tokens.css');
  for (const tone of ['light', 'yellow', 'orange', 'other']) assert.match(css, new RegExp(`\\.niches__card--${tone}\\b`), tone);
  assert.match(css, /\.niches__card--other\s*\{[^}]*border[^;]*var\(--accent\)/, 'жёлтый контур');
});

test('наведение: подъём и наклон плитки, сдвиг иконки; только на мыши и без reduced-motion; transform/opacity', () => {
  assert.match(css, /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*and\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{[\s\S]*?\.niches__card:hover[\s\S]*?--lift:\s*-\d/);
  assert.match(css, /\.niches__card:hover \.niches__icon[^{]*\{[^}]*transform:\s*scale\(2\.[234]\)/);
  assert.match(css, /\.niches__icon\s*\{[^}]*transform-origin:\s*100% 100%/, 'растёт из правого нижнего угла');
  assert.doesNotMatch(css, /@media[^{]*max-width[^{]*\{[\s\S]*?:hover/, 'нет hover внутри мобильных правил');
  for (const [, value] of css.matchAll(/transition:\s*([^;]+);/g)) {
    for (const part of value.split(',')) assert.match(part.trim(), /^(transform|opacity)\b/, `transition: ${value}`);
  }
});

test('у семи ниш только название и иконка; название — заголовок плитки; крупнее прежних 58px', () => {
  items.slice(0, 7).forEach((it, i) => {
    assert.match(it, /<h3 class="niches__name"/);
    assert.doesNotMatch(it, /niches__examples/, `плитка ${i}`);
  });
  assert.match(items[7], /niches__examples/, '«Інша ніша?» сохраняет текст');
  // иконка в правом нижнем углу с отступом, ≤ 60% высоты, ширина — доля плитки; название не наезжает (замер в браузере — в отчёте T26)
  const ic = css.match(/\.niches__icon\s*\{([^}]*)\}/)[1];
  assert.match(ic, /right:\s*0\.75rem/);
  assert.match(ic, /bottom:\s*0\.75rem/);
  assert.match(ic, /width:\s*2\d%/);
  assert.match(ic, /max-height:\s*60%/);
  assert.match(css, /min\(2\.9vw,\s*6svh\)/, 'кегль названия: от ширины и высоты окна');
});

test('абзаца под заголовком блока нет: ни разметки, ни ключа, ни стилей', () => {
  assert.doesNotMatch(section, /niches\.lead|niches__lead/);
  assert.doesNotMatch(css, /niches__lead/);
  for (const l of ['ua', 'en']) assert.equal(JSON.parse(read(`src/data/content.${l}.json`)).niches.lead, undefined, l);
});

test('появление: под .js-anim плитки и заголовок скрыты до .is-in; без .js-anim (reduced-motion, nomotion) ничего не скрыто', () => {
  const hidden = [...css.matchAll(/([^{}]+)\{[^}]*opacity:\s*0;[^}]*\}/g)].map((m) => m[1].trim()).filter((sel) => !/^\d+%$/.test(sel));
  assert.ok(hidden.length > 0);
  for (const sel of hidden) assert.match(sel, /\.js-anim [^,]*:not\(\.is-in\)/, `скрыто без .js-anim или без .is-in: ${sel}`);
  assert.match(css, /\.js-anim \.section--niches:not\(\.is-in\) \.niches__item/);
  const js = read('src/sections/niches.js');
  assert.match(js, /if \(reduced\) return;[\s\S]*enter\(root\)/, 'при reduced-motion появления нет');
  assert.match(js, /if \(entered\) return;/, 'один раз');
  assert.match(js, /classList\.add\('is-in'\)/);
  assert.match(js, /fill: 'both'/);
});

test('появление: волна по диагонали, шаг ≈70 мс, иконка позже плитки, всё ≤ 1,4 с; «Інша ніша?» — самолётик улетает за 700 мс', async () => {
  const { ENTER } = await import('../src/sections/niches.js');
  assert.equal(ENTER.step, 70);
  assert.equal(ENTER.scale, 0.92);
  assert.equal(ENTER.y, 28);
  const lastWave = 3 + 1; // 4 колонки, 2 строки
  const total = lastWave * ENTER.step + ENTER.icon.delay + ENTER.icon.duration;
  assert.ok(total <= 1400, `${total} мс`);
  assert.ok(lastWave * ENTER.step + ENTER.duration <= 1400);
  assert.ok(ENTER.icon.delay > 0);
  assert.match(css, /@keyframes niches-fly[\s\S]*?translate\(130%, -130%\)/);
  assert.match(css, /\.niches__card--other:hover \.niches__icon[^{]*\{[^}]*animation:\s*niches-fly 700ms/);
  assert.match(css, /\.niches__card--other:hover \.niches__arrow[^{]*\{[^}]*transform:\s*rotate\(/);
});
