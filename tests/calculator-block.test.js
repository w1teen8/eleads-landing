// Блок 05 «Калькулятор» (T22, с T23 — в палитре канала): панель параметров и панель прогноза — тёмные поверхности.
// Расчёт, аналитика и доступность — прежние (T02); переходов по прокрутке нет (H11), на ввод — табло.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { disableSections } from '../src/core/sections.js';

const html = read('index.html');
const config = readJson('src/data/config.json');
const calc = html.split(/<section\b[^>]*\sid="calculator"/)[1].split('</section>')[0];
const js = read('src/sections/calculator.js');
const css = read('src/styles/sections/calculator.css');
const count = (s, re) => (s.match(re) || []).length;

test('блок 05 включён после 02–04 по порядку страницы; секция и пункт меню #calculator видны после сборки', () => {
  const list = config.sections.enabled;
  assert.ok(list.includes('calculator'), 'calculator нет в sections.enabled');
  for (const before of ['hero', 'stats', 'niches', 'formats']) {
    if (list.includes(before)) assert.ok(list.indexOf(before) < list.indexOf('calculator'), `${before} — раньше calculator`);
  }
  const out = disableSections(html, config);
  assert.doesNotMatch(out.match(/<section\b[^>]*\sid="calculator"[^>]*>/)[0], /\shidden/);
  const item = out.match(/<li\b([^>]*)>\s*<a\b[^>]*href="#calculator"/);
  assert.ok(item, 'нет пункта навигации на #calculator');
  assert.doesNotMatch(item[1], /\shidden/);
});

test('разметка по вайрфрейму: H2, параметры, прогноз — воронка из трёх ступеней и шесть показателей', () => {
  assert.doesNotMatch(calc, /eyebrow/, 'метки-номера блока нет (правка клиента, T25)');
  assert.match(calc, /<h2 id="calculator-title"[^>]*data-i18n="calculator\.title"/);
  for (const key of ['niche', 'geo', 'goal']) assert.match(calc, new RegExp(`<select [^>]*data-calc-select="${key}"`), key);
  assert.match(calc, /type="range"[^>]*data-calc-budget/);
  assert.deepEqual([...calc.matchAll(/data-calc-step="(\w+)"/g)].map((m) => m[1]), ['impressions', 'clicks', 'conversions']);
  assert.match(calc, /data-calc-goal-step/, 'название строки цели меняется по цели');
  for (const key of ['impressions', 'clicks', 'conversions', 'cpc', 'cpa']) {
    assert.equal(count(calc, new RegExp(`data-calc-lo="${key}"`, 'g')), 1, `lo ${key}`);
    assert.equal(count(calc, new RegExp(`data-calc-hi="${key}"`, 'g')), 1, `hi ${key}`);
    assert.equal(count(calc, new RegExp(`data-calc-mid="${key}"`, 'g')), 1, `mid ${key}`);
  }
  // T39: CTR — одним средним значением
  assert.equal(count(calc, /data-calc-mid="ctr"/g), 1);
  assert.doesNotMatch(calc, /data-calc-(lo|hi)="ctr"/);
  assert.match(calc, /aria-live="polite"[^>]*data-calc-live/);
  assert.match(calc, /data-place="calculator" data-calc-cta/);
  assert.doesNotMatch(calc, /calc__foot|calculator_note|calculator\.disclaimer/, 'старые строки под блоком убраны — «убрать» (2026-11-10)');
});

test('H11: переходов по прокрутке нет — без наезда, лесенки и ревилов; на ввод цифры крутят барабаны, подпись — табло', () => {
  assert.match(js, /from '\.\.\/core\/motion-kit\.js'/);
  assert.match(js, /\bflipSwap\(/, 'название третьей ступени — табло');
  // T28: цифры — барабанами из блока 02, модуль переиспользуется, а не копируется
  assert.match(js, /import \{[^}]*\brollTo\b[^}]*\} from '\.\/stats-odometer\.js'/);
  assert.match(js, /\brollTo\(/);
  assert.doesNotMatch(js, /odoCells|reelDigits|\.animate\(/, 'своей реализации барабана нет');
  for (const fn of ['stackReveal', 'stagger', 'reveal']) assert.doesNotMatch(js, new RegExp(`\\b${fn}\\(`), fn);
  assert.equal(count(calc, /data-reveal/g), 0, 'содержимое блока видно сразу');
  assert.doesNotMatch(js, /gsap|ScrollTrigger|IntersectionObserver|countTo/);
  // ширина ступеней фиксирована: JS не трогает ни ширину, ни scaleX ступеней; ползунок заполняется scaleX
  assert.doesNotMatch(js, /funnelWidths/, 'воронки нет — JS не считает ширины');
  assert.match(js, /scaleX\(/, 'заливка ползунка');
  assert.doesNotMatch(js, /\.style\.(width|height|left|top)\s*=/);
});

// T28: оформление по образцу reference/run3/calc-G-chosen.png — «Повідомлення від бота»: слева клавиши бота в два
// столбца и строка бюджета, справа прогноз как сообщение от бота с фразой из параметров, сеткой цифр и inline-кнопкой
test('T28: параметры слева, пузырь сообщения справа; фраза из параметров — шаблон в обоих словарях', () => {
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(flat, /\.calc__bubble\s*\{[^}]*border-radius:\s*26px/, 'панель прогноза');
  assert.match(flat, /\.calc__cell--big\s*\{[^}]*grid-column:\s*1 \/ -1/, 'строка цели — во всю ширину');
  assert.match(flat, /\.calc__cell--big \.calc__cell-value\s*\{[^}]*background:\s*var\(--grad\)/, 'строка цели — акцентом');
  assert.match(flat, /\.calc__cta\s*\{[^}]*color:\s*var\(--accent\)/, 'inline-кнопка Telegram');
  assert.doesNotMatch(flat, /#[0-9a-f]{3,8}/i, 'hex — только в tokens.css');
  assert.doesNotMatch(flat, /calc__step|calc__funnel|calc__money|clip-path/, 'воронки и карточек варианта C нет');
  // барабаны строки цели: `background: none` в общем правиле сбрасывает background-clip — градиент ставится заново
  // вместе с обрезкой по тексту, иначе цифры рисуются сплошными прямоугольниками (баг с dev-сервера)
  const odoBig = flat.match(/\.calc__cell--big \.odo__char,\s*\.calc__cell--big \.odo__strip\s*\{([^}]*)\}/)?.[1] || '';
  assert.match(odoBig, /background-image:\s*var\(--grad\)/);
  assert.match(odoBig, /background-clip:\s*text/);
  assert.match(odoBig, /color:\s*transparent/);
  const odoAll = flat.match(/\.calc \.odo__char,\s*\.calc \.odo__strip\s*\{([^}]*)\}/)?.[1] || '';
  assert.match(odoAll, /background:\s*none/);
  assert.match(odoAll, /color:\s*inherit/, 'обычные цифры — цветом текста');
  // разметка: клавиши, строка бюджета, панель прогноза — заголовок, демо-плашка, фраза, сетка, кнопка (без аватара/подписи бота/времени — «это сайт, а не сообщение бота», 2026-11-10)
  assert.match(calc, /<div class="calc__budget">[\s\S]*calc__budget-label[\s\S]*calc__range[\s\S]*data-calc-budget-value/);
  assert.match(calc, /<div class="calc__bubble" role="group" aria-labelledby="calc-forecast-title">/);
  for (const key of ['forecastTitle', 'cta.label']) {
    assert.match(calc, new RegExp(`data-i18n="calculator\.${key.replace('.', '\.')}"`), key);
  }
  assert.match(calc, /<p class="calc__intro" data-calc-intro><\/p>/);
  assert.doesNotMatch(calc, /calc__avatar|calc__from|calc__bot-|calc__time|calculator\.bot\.|calc__demo|demoBadge/);
  assert.match(calc, /<dl class="calc__grid">[\s\S]*calc__cell--big[^>]*data-calc-step="conversions"[\s\S]*data-calc-goal-step/);
  assert.match(calc, /class="calc__cta"[^>]*data-place="calculator" data-calc-cta/);
  assert.doesNotMatch(calc, /calc__step|calc__funnel|calc__money/);
  // фраза бота собирается из текущих параметров: шаблон с плейсхолдерами и падежи GEO — в обоих словарях
  assert.match(js, /t\('calculator\.intro'\)/);
  assert.match(js, /calculator\.introGeo\./);
  for (const dict of [readJson('src/data/content.ua.json'), readJson('src/data/content.en.json')]) {
    for (const ph of ['{budget}', '{niche}', '{geo}']) assert.ok(dict.calculator.intro.includes(ph), `intro без ${ph}`);
    assert.deepEqual(Object.keys(dict.calculator.introGeo).sort(), ['ua', 'worldwide']);
    assert.ok(!dict.calculator.bot, 'ключей бота больше нет');
  }
});

test('расчёт и аналитика прежние: forecast() из модели, calculator_change с дебаунсом, calculator_cta_click', () => {
  assert.match(js, /from '\.\/calculator-model\.js'/);
  assert.match(js, /track\('calculator_change', payload\(\)\)/);
  assert.match(js, /track\('calculator_cta_click', payload\(\)\)/);
  assert.match(js, /TRACK_MS = 600/);
});

// T23 (H14): палитра канала — пузырь тёмная поверхность с тонкой границей; выбранная клавиша — жёлтый → оранжевый
test('палитра канала: пузырь — тёмная поверхность с тонкой границей; списки и поле суммы — как клавиши, фокус акцентом', () => {
  assert.match(css, /\.calc__bubble\s*\{[^}]*background:\s*var\(--surface-2\);[^}]*border:\s*1px solid var\(--line\)/);
  assert.match(css, /\.calc__select,\s*\.calc__amount-input\s*\{[^}]*background:\s*var\(--calc-key\)/);
  assert.match(css, /\.calc__select:focus-visible,\s*\.calc__amount-input:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent\)/);
});

// T39 (H52, H53): формулы клиента, выпадающие списки, поле суммы, «Середнє», ±20%, «немає даних», примечание
test('T39: три выпадающих списка (Тематика · GEO · Ціль), варианты строит JS из calculator.json; радио-клавиш нет', () => {
  for (const key of ['niche', 'geo', 'goal']) {
    const field = calc.match(new RegExp(`<label class="calc__field"[^>]*>[\\s\\S]*?data-i18n="calculator\\.${key}"[\\s\\S]*?<select ([^>]*)>`))?.[1] || '';
    assert.match(field, new RegExp(`id="calc-${key}"`), `${key}: подпись связана со списком`);
    assert.match(field, /class="calc__select"/);
  }
  assert.doesNotMatch(calc, /calc__keys|calc__pill|type="radio"/);
  assert.doesNotMatch(js, /calc__pill|type: 'radio'/);
  assert.match(js, /el\('option'/, 'варианты — из данных');
  for (const [dict, niche] of [[readJson('src/data/content.ua.json'), 'Тематика'], [readJson('src/data/content.en.json'), 'Topic']]) {
    assert.equal(dict.calculator.niche, niche);
  }
});

test('T39: поле «Вказати суму (€)» — целое 1…10 000, зажим к краю, мусор игнорируется; ползунок встаёт рядом', () => {
  const input = calc.match(/<input [^>]*data-calc-amount[^>]*>/)?.[0] || '';
  for (const attr of [/type="number"/, /min="1"/, /max="10000"/, /step="1"/, /inputmode="numeric"/, /id="calc-amount"/]) {
    assert.match(input, attr);
  }
  assert.match(calc, /<label [^>]*for="calc-amount"[^>]*data-i18n="calculator\.amount"/);
  assert.match(js, /import \{[^}]*\bclampBudget\b[^}]*\} from '\.\/calculator-model\.js'/);
  assert.match(js, /AMOUNT_MS = \d+/, 'ввод с клавиатуры — с небольшим дебаунсом');
  assert.match(js, /nearestIndex\(scale, /, 'ползунок — на ближайшее значение шкалы');
  assert.match(js, /on\(amount, 'change'/, 'после ввода поле показывает итоговую сумму');
  for (const [dict, text] of [[readJson('src/data/content.ua.json'), 'Вказати суму (€)'], [readJson('src/data/content.en.json'), 'Exact amount (€)']]) {
    assert.equal(dict.calculator.amount, text);
  }
});

test('T39: под диапазонами «Середнє / Середня», плашка ±20% у главного показателя, цены — 3 знака', () => {
  for (const key of ['impressions', 'clicks', 'conversions']) {
    assert.match(calc, new RegExp(`data-i18n="calculator\\.avg"></span> <span data-calc-mid="${key}">`), key);
  }
  for (const key of ['cpc', 'cpa']) {
    assert.match(calc, new RegExp(`data-i18n="calculator\\.avgPrice"></span> <span data-calc-mid="${key}">`), key);
  }
  assert.match(calc, /calc__cell--big[\s\S]*?<span class="calc__spread" data-calc-spread><\/span>/);
  assert.match(js, /rates\.spread \* 100/, 'плашка — из разброса в данных');
  assert.match(js, /toFixed\(3\)/);
  const ua = readJson('src/data/content.ua.json').calculator;
  const en = readJson('src/data/content.en.json').calculator;
  assert.deepEqual([ua.avg, ua.avgPrice, en.avg, en.avgPrice], ['Середнє:', 'Середня:', 'Average:', 'Average:']);
});

test('T39: нет данных для пары «ниша × GEO» — сообщение со ссылкой в Telegram вместо цифр', () => {
  const box = calc.match(/<div class="calc__nodata" data-calc-nodata hidden>[\s\S]*?<\/div>/)?.[0] || '';
  assert.match(box, /data-i18n="calculator\.nodata\.lead"/);
  assert.match(box, /<a [^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="calculator_nodata"[^>]*data-i18n="calculator\.nodata\.link"/);
  assert.match(js, /fc\.nodata/);
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(flat, /\.calc__bubble\.is-nodata \.calc__grid\s*\{[^}]*visibility:\s*hidden/, 'место цифр сохраняется — блок не прыгает');
  const ua = readJson('src/data/content.ua.json').calculator.nodata;
  assert.equal(`${ua.lead} ${ua.link}`, 'Для цієї комбінації прогноз ще готуємо — напишіть, порахую вручну');
  assert.ok(readJson('src/data/content.en.json').calculator.nodata.link);
});

test('T39 (H53): под блоком одна строка — ±20% и бюджет уже з комісією реселера', () => {
  assert.match(calc, /<p class="calc__note" data-i18n="calculator\.note"><\/p>/);
  assert.equal(
    readJson('src/data/content.ua.json').calculator.note,
    'Прогноз за історичними результатами реклами, з орієнтовним відхиленням ±20%. Бюджет уже з комісією реселера.',
  );
  assert.equal(
    readJson('src/data/content.en.json').calculator.note,
    'Forecast based on historical ad results, with an approximate deviation of ±20%. The budget already includes the reseller’s commission.',
  );
});
