// Блок 02 (T25, дополнение 3): движение — волны по точкам карт, расталкивание у курсора, цифры-барабаны, появление
// блока с зажиганием карты от Киева. Математика — src/sections/stats-model.js, проверяется здесь без браузера.
// В node нет window — motion.js считает это reduced-motion: всё обязано быть статичным и сразу в конечном виде.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { read, readJson, root } from './helpers.js';
import {
  parseShare, litSet, litCount, gridDots, gridPoint, hasDot, farthest,
  waveStrength, waveAlive, repelOffset, springStep, igniteLevel, odoCells, reelDigits,
} from '../src/sections/stats-model.js';

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const ua = readJson('src/data/content.ua.json');
const grid = readJson('src/data/ua-dots.json');
const FILES = ['stats.js', 'stats-dots.js', 'stats-odometer.js', 'stats-model.js'];
const code = Object.fromEntries(FILES.map((f) => [f, strip(read(`src/sections/${f}`))]));
const all = FILES.map((f) => code[f]).join('\n');
const css = strip(read('src/styles/sections/stats.css'));
const KYIV = [30.5, 50.45];

test('волна — круг по воде: гребень идёт от источника, за ним и перед ним тихо, к краю затухает', () => {
  const wave = { speed: 10, width: 1.5, reach: 20, amp: 1 };
  assert.equal(waveStrength(wave, 5, 0), 0, 'ещё не дошла');
  const atCrest = waveStrength(wave, 5, 0.5);
  assert.ok(atCrest > 0.7 && atCrest <= 1, `на гребне ${atCrest}`);
  assert.ok(waveStrength(wave, 5.7, 0.5) < atCrest && waveStrength(wave, 5.7, 0.5) > 0, 'склон гребня');
  assert.equal(waveStrength(wave, 5, 1), 0, 'прошла — точка вернулась в покой');
  assert.equal(waveStrength(wave, 5, -1), 0);
  assert.ok(waveStrength(wave, 15, 1.5) < waveStrength(wave, 5, 0.5), 'дальше от источника — слабее');
  assert.equal(waveStrength(wave, 20, 2), 0, 'на reach волна сошла на нет');
  assert.equal(waveAlive(wave, 1), true);
  assert.equal(waveAlive(wave, 2.2), false, 'ушла за край — цикл кадров можно останавливать');
  assert.ok(waveStrength({ ...wave, amp: 0.25 }, 5, 0.5) < atCrest / 3, 'слабая волна «дыхания»');
});

test('расталкивание: точка уходит прочь от курсора, чем ближе — тем дальше; за радиусом не трогается', () => {
  const opts = { reach: 2.4, push: 0.6 };
  const near = repelOffset(0.5, 0, opts);
  const far = repelOffset(2, 0, opts);
  assert.ok(near.x > far.x && far.x > 0 && near.y === 0, 'вправо от курсора — вправо');
  assert.ok(repelOffset(-1, -1, opts).x < 0 && repelOffset(-1, -1, opts).y < 0, 'влево-вверх — влево-вверх');
  assert.deepEqual(repelOffset(2.4, 0, opts), { x: 0, y: 0 });
  assert.deepEqual(repelOffset(3, 4, opts), { x: 0, y: 0 });
  assert.ok(Math.hypot(near.x, near.y) <= opts.push);
  const under = repelOffset(0, 0, opts);
  assert.ok(Number.isFinite(under.x) && Number.isFinite(under.y) && Math.hypot(under.x, under.y) > 0, 'под самым курсором — без NaN');
});

test('пружина: отпущенная точка проскакивает своё место и возвращается в покой', () => {
  const spring = { stiffness: 190, damping: 11 };
  let o = 0.6;
  let v = 0;
  let crossed = false;
  for (let i = 0; i < 240; i++) {
    [o, v] = springStep(o, v, 0, 1 / 60, spring);
    if (o < 0) crossed = true;
    assert.ok(Math.abs(o) < 0.7, 'не разлетается');
  }
  assert.ok(crossed, 'пружинит — проходит через ноль');
  assert.ok(Math.abs(o) < 0.004 && Math.abs(v) < 0.05, `за 4 с успокоилась: ${o}, ${v}`);
  // к цели тянется
  [o, v] = [0, 0];
  for (let i = 0; i < 240; i++) [o, v] = springStep(o, v, 0.5, 1 / 60, spring);
  assert.ok(Math.abs(o - 0.5) < 0.004);
});

test('зажигание от Киева: фронт включает точки по порядку и останавливается ровно на 81% горящих', () => {
  const { dots, width, height } = gridDots(grid);
  const origin = gridPoint(grid, ...KYIV);
  assert.ok(origin.x > 0 && origin.x < width && origin.y > 0 && origin.y < height, 'Киев внутри рамки карты');
  assert.equal(hasDot(grid, ...KYIV), true);
  const nearest = Math.min(...dots.map((d) => Math.hypot(d.x - origin.x, d.y - origin.y)));
  assert.ok(nearest < 0.75, 'рядом с Киевом есть точка — волна идёт от неё');

  assert.equal(igniteLevel(5, 4, 3), 0, 'фронт не дошёл');
  assert.equal(igniteLevel(5, 6.5, 3), 0.5);
  assert.equal(igniteLevel(5, 8, 3), 1);
  assert.equal(igniteLevel(5, 100, 3), 1);

  const share = parseShare(ua.stats.ua.main.value);
  const lit = litSet(dots.length, share);
  const reach = farthest(dots, origin);
  const band = 3;
  const burning = (front) => dots.filter((d, i) => lit.has(i) && igniteLevel(Math.hypot(d.x - origin.x, d.y - origin.y), front, band) === 1).length;
  assert.equal(burning(0), 0, 'до волны не горит ничего');
  let last = 0;
  for (let front = 0; front <= reach + band; front += 0.5) {
    const now = burning(front);
    assert.ok(now >= last, 'зажжённое не гаснет');
    last = now;
  }
  assert.ok(burning((reach + band) / 2) > 0 && burning((reach + band) / 2) < lit.size, 'посреди пути горит часть');
  assert.equal(burning(reach + band), litCount(dots.length, share), 'в конце — весь набор');
  assert.equal(burning(reach + band), Math.round(dots.length * share));
  assert.ok(Math.abs(burning(reach + band) / dots.length - share) <= 0.5 / dots.length, 'ровно доля из главной цифры');
});

test('цифры-барабаны: цифра крутится своим барабаном, прочие знаки стоят или въезжают один раз', () => {
  // появление: от нуля с полным оборотом
  assert.deepEqual(odoCells('', '81%', { turns: 1 }), [
    { char: '8', digit: true, from: 0, steps: 18 },
    { char: '1', digit: true, from: 0, steps: 11 },
    { char: '%', digit: false, enter: true },
  ]);
  // вкладка: Україна → Worldwide
  assert.deepEqual(odoCells('81%', '1B+'), [
    { char: '1', digit: true, from: 8, steps: 3 },
    { char: 'B', digit: false, enter: true },
    { char: '+', digit: false, enter: true },
  ]);
  assert.deepEqual(odoCells('18–70', 'TOP-5').map((c) => [c.char, c.digit, c.digit ? c.steps : c.enter]), [
    ['T', false, true], ['O', false, true], ['P', false, true], ['-', false, true], ['5', true, 5],
  ]);
  assert.deepEqual(odoCells('№1', '200+ GEO').slice(0, 2), [
    { char: '2', digit: true, from: 0, steps: 2 },
    { char: '0', digit: true, from: 1, steps: 9 },
  ]);
  // то же значение — ничего не движется
  for (const cell of odoCells('18–70', '18–70')) assert.ok(cell.digit ? cell.steps === 0 : cell.enter === false);
  assert.deepEqual(odoCells('№1', '#1').map((c) => (c.digit ? c.steps : c.enter)), [true, 0], 'UA → EN: меняется только знак');
  assert.deepEqual(reelDigits(8, 3), [8, 9, 0, 1]);
  assert.deepEqual(reelDigits(0, 11).at(-1), 1);
  assert.deepEqual(reelDigits(4, 0), [4]);
  for (const value of ['81%', '18–70', '№1', '1B+', 'TOP-5', '200+ GEO']) {
    for (const cell of odoCells('', value, { turns: 1 })) {
      if (cell.digit) assert.equal(reelDigits(cell.from, cell.steps).at(-1), Number(cell.char), `${value}: барабан встаёт на свою цифру`);
    }
  }
});

test('reduced-motion: барабан сразу ставит значение, карта без движения, появление ничего не прячет', async () => {
  const calls = [];
  const node = {
    textContent: '81%',
    classList: { add: (c) => calls.push(`add ${c}`), remove: () => {}, contains: () => false },
    style: new Proxy({}, { set: (o, k, v) => (calls.push(`style.${String(k)}`), (o[k] = v), true) }),
    animate: () => calls.push('animate'),
    replaceChildren: () => calls.push('replace'),
    ownerDocument: {},
  };
  const { rollTo, shownValue } = await import('../src/sections/stats-odometer.js');
  await rollTo(node, '1B+', { from: '81%' });
  assert.equal(node.textContent, '1B+');
  assert.equal(shownValue(node), '1B+');
  assert.deepEqual(calls, [], 'ни анимаций, ни обёрток');
  await rollTo(node, '81%', { from: '', turns: 1 });
  assert.equal(node.textContent, '81%');

  // карта: кружки стоят, движения нет — ни слушателей, ни кадров, ни затемнения
  const made = [];
  const circle = () => {
    const attrs = {};
    const el = { attrs, style: {}, setAttribute: (k, v) => (attrs[k] = v) };
    made.push(el);
    return el;
  };
  globalThis.document = { createElementNS: circle };
  try {
    const layer = { replaceChildren: (...kids) => (layer.kids = kids) };
    const svg = { querySelector: (sel) => (sel === 'g' ? layer : null) };
    const box = {
      dataset: {},
      querySelector: (sel) => (sel === 'svg' ? svg : null),
      addEventListener: () => calls.push('listen'),
      classList: { add: (c) => calls.push(`add ${c}`), remove: () => {} },
    };
    const { createDotMap } = await import('../src/sections/stats-dots.js');
    const share = parseShare(ua.stats.ua.main.value);
    const map = createDotMap(box, grid, { share });
    assert.equal(layer.kids.length, grid.total);
    const off = made.filter((el) => /stats__dot--off/.test(el.attrs.class)).length;
    assert.equal(grid.total - off, litCount(grid.total, share), 'горит доля из главной цифры — сразу, без волны');
    assert.equal(box.dataset.statsLit, String(litCount(grid.total, share)));
    map.darken();
    await map.ignite(gridPoint(grid, ...KYIV));
    map.wave({ x: 1, y: 1 }, 'tap');
    assert.deepEqual(calls, [], 'reduced-motion: карта ничего не слушает и не затемняется');
    for (const el of made) assert.deepEqual(el.style, {}, 'style точек не тронут');
  } finally {
    delete globalThis.document;
  }
});

test('движение блока — только transform и opacity, без холста; волны и пружины останавливают цикл кадров', () => {
  assert.doesNotMatch(all + read('index.html').split(/<section\b[^>]*\sid="stats"/)[1].split('</section>')[0], /canvas/i);
  for (const [file, js] of Object.entries(code)) {
    for (const [, props] of js.matchAll(/\.animate\(\s*(\{[^}]*\}|\[[^\]]*\])/g)) {
      for (const [, prop] of props.matchAll(/(\w+)\s*:/g)) assert.ok(['opacity', 'transform'].includes(prop), `${file}: animate ${prop}`);
    }
    for (const [, prop] of js.matchAll(/\.style\.(\w+)\s*=/g)) assert.ok(['transform', 'opacity'].includes(prop), `${file}: style.${prop}`);
    for (const [, prop] of js.matchAll(/\.style\.setProperty\(\s*'([^']+)'/g)) assert.match(prop, /^--/, `${file}: ${prop} — только переменные раскладки`);
    assert.doesNotMatch(js, /\bgsap\b|ScrollTrigger|stackReveal/, `${file}: закрепления и наезда блока на блок нет`);
  }
  const dots = code['stats-dots.js'];
  assert.match(dots, /cancelAnimationFrame\(/, 'цикл кадров останавливается');
  assert.match(dots, /IntersectionObserver/, 'вне окна карта не работает');
  assert.match(dots, /if \(waves\.length \|\| springs\.length \|\| ignition \|\| previous\.length\) run\(\)/, 'нет волн и пружин — нет следующего кадра');
  assert.match(dots, /pointerType !== 'mouse'/, 'расталкивание и след — только мышь');
  assert.match(dots, /'pointerdown'/, 'клик и тап пускают волну');
  assert.match(dots, /if \(reduced \|\|[^)]*\) return map;/, 'reduced-motion — карта статична');
  // у точек нет CSS-переходов: каждый кадр их ставит скрипт
  assert.doesNotMatch(css.match(/\.stats__dot\s*\{([^}]*)\}/)[1], /transition|animation/);
  assert.doesNotMatch(css, /@keyframes/);
});

test('появление блока: один раз при входе в окно; до него скрыто только при .js-anim; лесенка — только здесь', () => {
  const js = code['stats.js'];
  assert.match(js, /import \{[^}]*\bstagger\b[^}]*\} from '\.\.\/core\/motion-kit\.js'/);
  assert.match(js, /stagger\(items, \{ trigger: root, start: ENTER_START, onEach \}\)/);
  assert.match(js, /map\?\.ignite\(gridPoint\(uaGrid, KYIV\.lon, KYIV\.lat\)\)/, 'карта зажигается от Киева');
  assert.match(js, /rollTo\(value, finalText\(value\), \{ from: '', turns: 1 \}\)/, 'цифры докручиваются от нуля');
  assert.match(js, /if \(entered\) return;/, 'один раз');
  assert.match(js, /if \(isValue\(node\)\) \{[\s\S]*?rollTo\(node, finalText\(node\), \{ from, delay \}\)[\s\S]*?\} else \{[\s\S]*?flipSwap\(node, finalText\(node\), \{ delay \}\)/, 'вкладки: цифры — барабанами, подписи — табло');
  // начальные состояния — только при живых анимациях: без JS, при reduced-motion и сбое GSAP класса .js-anim нет
  for (const [, selector] of css.matchAll(/([^{}]+)\{[^}]*opacity:\s*0(?:\.14)?;[^}]*\}/g)) {
    assert.match(selector, /\.js-anim /, `скрыто без .js-anim: ${selector.trim()}`);
  }
  assert.match(css, /\.js-anim \.section--stats:not\(\.is-in\) \.section__title\s*\{[^}]*opacity:\s*0/);
  assert.match(css, /\.js-anim \.stats__map\.is-dark \.stats__dot:not\(\.stats__dot--off\)\s*\{[^}]*opacity:\s*0\.14/);
  // H11: лесенка разрешена только блоку 02; наезда блока на блок нет нигде
  const dir = join(root, 'src/sections');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const other = strip(read(`src/sections/${file}`));
    assert.doesNotMatch(other, /\bstackReveal\(/, `${file}: stackReveal()`);
    if (file !== 'stats.js') assert.doesNotMatch(other, /\bstagger\(/, `${file}: stagger()`);
  }
});

test('появление укладывается в 1,8 с: лесенка, заголовок, барабаны и волна зажигания', async () => {
  const kit = await import('../src/core/motion-kit.js');
  const { ODOMETER } = await import('../src/sections/stats-odometer.js');
  const num = (name, src) => Number(src.match(new RegExp(`${name}[^\\n]*?([\\d.]+)`))[1]);
  const items = 4; // карточка, две строки, плашка
  const lastStart = (items - 1) * kit.STAGGER.step * 1000;
  assert.ok(lastStart + kit.STAGGER.duration * 1000 <= 1800, 'плашка — последней, и успевает');
  // самая длинная цифра — «18–70» во второй части лесенки: 4 барабана и знак
  const longest = kit.STAGGER.step * 1000 + 4 * ODOMETER.step + ODOMETER.duration;
  assert.ok(longest <= 1800, `барабаны: ${longest} мс`);
  const title = code['stats.js'].match(/const TITLE = \{ duration: (\d+), step: (\d+) \}/);
  assert.ok(Number(title[1]) + Number(title[2]) <= 1800);
  const sweep = num('ignite: \\{ sweep:', code['stats-dots.js']);
  assert.ok(sweep > 0.5 && sweep * 1000 <= 1800, `волна зажигания: ${sweep} с`);
});
