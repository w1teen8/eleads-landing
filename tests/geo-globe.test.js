// T33 (H45): блок 08 «GEO» — точечный 3D-глобус на <canvas> (поведение Framer «3D Dot Globe Map») и список регионов
// раскладки «Л 4». Здесь — то, что проверяется без браузера: математика глобуса (geo-globe.js), словари, разметка и
// правила движения. Живое поведение (кадры, жесты, помещаемость) — скриншоты и замер в возврате таска.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import {
  GLOBE,
  clamp,
  decay,
  dragView,
  focusView,
  isVisible,
  landDots,
  lonDelta,
  nearestRegion,
  project,
  regionAt,
  swayView,
  swell,
  toVector,
  tweenView,
  viewBasis,
  wrapLon,
} from '../src/sections/geo-globe.js';

const grid = readJson('src/data/geo-dots.json');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const html = read('index.html');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const block = html.split(/<section\b[^>]*\sid="geo"/)[1].split('</section>')[0];
const js = strip(read('src/sections/geo.js'));
const math = strip(read('src/sections/geo-globe.js'));
const css = strip(read('src/styles/sections/geo.css'));
const ids = grid.regions.map((r) => r.id);
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const at = (lon, lat, view) => project(toVector(lon, lat), viewBasis(view));

test('точки суши: только суша сетки, без сгущения у полюсов', () => {
  const dots = landDots(grid);
  assert.ok(dots.length > 1200 && dots.length < 2600, `${dots.length}`);
  for (const d of dots) {
    const r = Math.floor((grid.lat0 - d.lat) / grid.step);
    const c = Math.floor((d.lon - grid.lon0) / grid.step);
    assert.equal(grid.rowsData[r][c], '1', `${d.lon}, ${d.lat}`);
  }
  // в строке сетки точек по долготе ∝ cos φ: у 70° с.ш. шаг по долготе почти втрое шире, чем у экватора
  const step = (lat) => {
    const row = dots.filter((d) => near(d.lat, lat)).map((d) => d.lon).sort((a, b) => a - b);
    return Math.min(...row.slice(1).map((v, i) => v - row[i]));
  };
  const north = grid.lat0 - (Math.floor((grid.lat0 - 70) / grid.step) + 0.5) * grid.step;
  const equator = grid.lat0 - (Math.floor(grid.lat0 / grid.step) + 0.5) * grid.step;
  assert.ok(step(north) > step(equator) * 2.5, `${step(north)} / ${step(equator)}`);
});

test('ортографическая проекция: центр вида — к зрителю, край — на окружности, обратная полусфера не видна', () => {
  const view = { lon: 15, lat: 30 };
  const c = at(15, 30, view);
  assert.ok(near(c.x, 0) && near(c.y, 0) && near(c.z, 1));
  const east = at(105, 0, { lon: 15, lat: 0 });
  assert.ok(near(east.x, 1) && near(east.y, 0) && near(east.z, 0), 'на 90° восточнее — правый край');
  const pole = at(0, 90, view);
  assert.ok(near(pole.y, Math.cos(30 * Math.PI / 180)) && near(pole.x, 0), 'северный полюс над центром');
  const anti = at(-165, -30, view);
  assert.ok(near(anti.z, -1) && !isVisible(anti.z), 'антипод не рисуется');
  assert.equal(isVisible(0), false);
  assert.equal(isVisible(0.01), true);
  for (const [lon, lat] of [[0, 0], [120, 45], [-60, -70]]) {
    const p = at(lon, lat, view);
    assert.ok(near(p.x * p.x + p.y * p.y + p.z * p.z, 1), 'проекция сохраняет единичную длину');
  }
});

test('поворот к региону: регион стоит лицом к зрителю, наклон не больше предела', () => {
  for (const r of grid.regions) {
    const v = focusView(r);
    assert.ok(near(v.lon, wrapLon(r.lon)));
    assert.ok(Math.abs(v.lat) <= GLOBE.tiltMax);
    assert.ok(at(r.lon, r.lat, v).z > 0.85, `${r.id}: ${at(r.lon, r.lat, v).z}`);
  }
  // Європа по умолчанию — как на образце: центр примерно (9°, 30°)
  const europe = focusView(grid.regions.find((r) => r.id === 'europe'));
  assert.ok(near(europe.lat, 29.7, 1e-6));
});

test('автовращение — покачивание вокруг выбранного региона: он всегда к зрителю, Америки не встают вместо Європи', () => {
  for (const r of grid.regions) {
    const home = focusView(r);
    for (let ms = 0; ms <= GLOBE.swayPeriod; ms += 500) {
      const v = swayView(home, ms, 1);
      assert.ok(Math.abs(lonDelta(home.lon, v.lon)) <= GLOBE.swayAmp + 1e-9);
      assert.ok(at(r.lon, r.lat, v).z > 0.8, `${r.id} @${ms}`);
    }
    assert.deepEqual(swayView(home, 3000, 0), { lon: home.lon, lat: home.lat }, 'без разгона — стоит на месте');
  }
  const europe = grid.regions.find((r) => r.id === 'europe');
  const usa = grid.regions.find((r) => r.id === 'usa');
  for (let ms = 0; ms <= GLOBE.swayPeriod; ms += 500) {
    const v = swayView(focusView(europe), ms);
    const z = at(usa.lon, usa.lat, v).z;
    assert.ok(z < 0.5 && z < at(europe.lon, europe.lat, v).z - 0.4, `USA далеко от центра: ${z}`);
  }
});

test('плавный поворот — кратчайшей дорогой через 180°; перетаскивание, инерция, вспухание', () => {
  assert.equal(wrapLon(190), -170);
  assert.equal(wrapLon(-180), 180);
  assert.equal(lonDelta(170, -170), 20);
  const mid = tweenView({ lon: 170, lat: 0 }, { lon: -170, lat: 20 }, 0.5);
  assert.ok(near(mid.lon, 180) && near(mid.lat, 10));
  assert.deepEqual(tweenView({ lon: 0, lat: 0 }, { lon: 40, lat: 10 }, 1), { lon: 40, lat: 10 });
  // вправо — шар вправо (к центру приходят земли западнее), вниз — к северу; наклон ограничен
  const d = dragView({ lon: 0, lat: 0 }, 100, 0, 200);
  assert.ok(d.lon < 0 && near(d.lat, 0));
  assert.equal(dragView({ lon: 0, lat: 0 }, 0, 10000, 200).lat, GLOBE.tiltMax);
  assert.ok(decay(1, GLOBE.inertia) < 0.37 && decay(1, 0) === 1);
  assert.equal(swell(0, 10), 1);
  assert.equal(swell(10, 10), 0);
  assert.ok(swell(5, 10) > 0 && swell(5, 10) < 1);
  assert.equal(clamp(5, 0, 1), 1);
});

test('регион точки суши и метка под курсором', () => {
  const europe = ids.indexOf('europe');
  assert.equal(nearestRegion(10, 49, grid.regions), europe);
  assert.equal(nearestRegion(-40, -10, grid.regions), -1, 'океан далеко от регионов');
  const pins = [
    { id: 'a', x: 100, y: 100, z: 0.9 },
    { id: 'b', x: 112, y: 100, z: 0.9 },
    { id: 'c', x: 101, y: 100, z: -0.5 },
  ];
  assert.equal(regionAt(pins, 103, 100, 20), 'a');
  assert.equal(regionAt(pins, 110, 100, 20), 'b');
  assert.equal(regionAt(pins, 300, 300, 20), null);
  assert.equal(regionAt([pins[2]], 101, 100, 20), null, 'метка на обратной стороне не кликается');
});

test('словари: регионы UA/EN — только названия (подписи «Tier-1» и т.п. убраны); цифра только у Європи', () => {
  for (const dict of [ua, en]) {
    assert.ok(dict.geo.mapAlt && dict.geo.listTitle);
    assert.equal(dict.geo.footnote, undefined);
    for (const id of ids) {
      const r = dict.geo.regions[id];
      assert.ok(r.name, id);
      // пользователь: «убрать эти текста» — мелкие подписи справа в строках списка
      assert.equal(r.text, undefined, `${id}: подписи нет`);
      if (id === 'europe') assert.deepEqual(Object.keys(r).sort(), ['figure', 'figureText', 'name']);
      else assert.deepEqual(Object.keys(r), ['name'], `${id}: только название, цифры нет`);
    }
    assert.equal(dict.geo.regions.europe.figure, '4.43M');
    assert.doesNotMatch(dict.geo.regions.europe.figureText, /\*/);
  }
});

test('разметка: один <canvas> с подписью; строки списка — кнопки по geo.regions, раскрыта Європа', () => {
  assert.equal((html.match(/<canvas\b/g) || []).length, 1);
  assert.match(block, /<canvas class="geo__canvas" data-geo-canvas role="img" data-i18n-attr="aria-label:geo\.mapAlt"><\/canvas>/);
  assert.match(block, /class="geo__list" data-geo-list data-i18n-attr="aria-label:geo\.listTitle"/);
  const rows = [...block.matchAll(/<button type="button" class="geo__row" data-region="([a-z]+)" aria-pressed="(true|false)">/g)];
  assert.deepEqual(rows.map((m) => m[1]), ids);
  assert.deepEqual(rows.filter((m) => m[2] === 'true').map((m) => m[1]), ['europe']);
  for (const id of ids) assert.match(block, new RegExp(`data-i18n="geo\\.regions\\.${id}\\.name"`));
  assert.doesNotMatch(block, /geo\.regions\.[a-z]+\.text|geo__row-text/, 'подписей справа в строках нет');
  // в строке — только название; у Європи ещё пояснение к цифре и цифра (видны в раскрытой карточке)
  const extra = [...block.matchAll(/data-i18n="geo\.regions\.([a-z]+)\.(figure|figureText)"/g)].map((m) => `${m[1]}.${m[2]}`);
  assert.deepEqual(extra, ['europe.figureText', 'europe.figure']);
  assert.doesNotMatch(block, /eyebrow|footnote|__note|__hint|__caption|data-reveal|<svg|geo__pill/);
});

test('geo.js: canvas с devicePixelRatio, цикл кадров только в окне и на видимой вкладке, reduced — статично', () => {
  assert.match(js, /getContext\?\.\('2d'\)/);
  assert.match(js, /devicePixelRatio/);
  assert.match(js, /new IntersectionObserver/);
  assert.match(js, /visibilityState === 'visible'/);
  assert.match(js, /const running = \(\) => !reduced && inView && document\.visibilityState === 'visible'/);
  assert.match(js, /new ResizeObserver\(resize\)\.observe\(box\)/, 'размер холста — от контейнера');
  assert.match(js, /import \{ reduced \} from '\.\.\/core\/motion\.js'/);
  assert.match(js, /rollTo\(figure/);
  assert.match(js, /setAttribute\('aria-pressed'/);
  for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) assert.match(js, new RegExp(key));
  assert.doesNotMatch(js, /stats-dots|stats-model|createDotMap|ScrollTrigger|stagger/);
  // цвета холста — из CSS-переменных; hex только в tokens.css
  assert.match(js, /readColor\(box, '--accent'\)/);
  for (const [name, src] of [['geo.js', js], ['geo-globe.js', math], ['geo.css', css]]) {
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${name}: hex`);
  }
  assert.doesNotMatch(math, /document|window/, 'математика без DOM');
});

test('движение: только transform и opacity; жест по глобусу не мешает вертикальной прокрутке', () => {
  for (const [, props] of js.matchAll(/\.animate\(\s*(\{[^}]*\}|\[[^\]]*\])/g)) {
    for (const [, prop] of props.matchAll(/(\w+)\s*:/g)) assert.ok(['opacity', 'transform'].includes(prop), prop);
  }
  for (const [, value] of css.matchAll(/transition:\s*([^;]+);/g)) {
    for (const part of value.split(',')) assert.match(part.trim(), /^(transform|opacity)\b/, part);
  }
  assert.doesNotMatch(css, /animation:|@keyframes/);
  assert.match(css, /\.geo__canvas\s*\{[^}]*touch-action:\s*pan-y/);
  assert.match(css, /\.section--geo\s*\{[^}]*overflow-x:\s*clip/);
});
