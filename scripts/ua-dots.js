// Сборка src/data/ua-dots.json — Украина в виде шахматной сетки точек для блока 02 «Telegram у цифрах» (T25).
//
// Источник контура: Natural Earth, Admin 0 – Countries, вариант «точка зрения Украины»
//   (ne_10m_admin_0_countries_ukr, масштаб 1:10m) — https://www.naturalearthdata.com/
//   GeoJSON: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_ukr.geojson
// Лицензия: общественное достояние (public domain) — https://www.naturalearthdata.com/about/terms-of-use/
//
// Почему именно этот вариант: в Natural Earth по умолчанию (ne_10m_admin_0_countries) Крым отнесён не к Украине.
// В варианте _ukr контур — международно признанные границы: с Крымом, Донецкой и Луганской областями целиком.
// Скрипт это проверяет сам (CONTROL) и падает, если хоть одна контрольная точка вне контура или вне сетки.
//
// Сам GeoJSON (13 МБ) в репозиторий не кладётся. Запуск:
//   curl -L -o <папка>/ne_ukr.geojson <адрес GeoJSON выше>
//   node scripts/ua-dots.js <папка>/ne_ukr.geojson
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { hasDot } from '../src/sections/stats-model.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'ua-dots.json');

/** Шаг сетки по широте, градусы. 0.36° ≈ 40 км → около 380 точек на страну. */
const STEP = 0.36;
/** Сжатие долготы на широте середины страны (≈48.5° с. ш.): точки на экране стоят квадратной шахматной сеткой. */
const K = Math.cos((48.5 * Math.PI) / 180);
/** Северо-западный угол сетки (край первой ячейки), градусы. Фаза подобрана так, чтобы первая строка была не пустой,
 *  а Крым, Перекоп и Буджак читались. */
const LAT0 = 52.2;
const LON0 = 21.9;
/** Точка ставится, если суша Украины занимает не меньше этой доли ячейки (ячейка проверяется SUB×SUB пробами). */
const COVER = 0.5;
const SUB = 5;

/** Контрольные точки: должны лежать внутри контура, а ближайшая к ним ячейка сетки — быть точкой. */
const CONTROL = [
  { name: 'Крым (Симферополь)', lon: 34.1, lat: 45.0 },
  { name: 'Донецк', lon: 37.8, lat: 48.0 },
  { name: 'Луганск', lon: 39.3, lat: 48.6 },
  { name: 'Львов', lon: 24.0, lat: 49.8 },
  { name: 'Киев', lon: 30.5, lat: 50.45 },
];

const file = process.argv[2];
if (!file) {
  console.error('Нужен путь к GeoJSON: node scripts/ua-dots.js <ne_10m_admin_0_countries_ukr.geojson>');
  process.exit(1);
}

const geo = JSON.parse(readFileSync(file, 'utf8'));
const features = geo.type === 'FeatureCollection' ? geo.features : [geo];
const ukraine = features.find((f) => f.properties?.ADM0_A3 === 'UKR' || f.properties?.shapeGroup === 'UKR');
if (!ukraine) throw new Error('В файле нет объекта Украины (ADM0_A3 = UKR)');
const polygons = ukraine.geometry.type === 'Polygon' ? [ukraine.geometry.coordinates] : ukraine.geometry.coordinates;

function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// внутри внешнего кольца и вне «дыр» хотя бы одного полигона
const inUkraine = (lon, lat) =>
  polygons.some(([outer, ...holes]) => inRing(lon, lat, outer) && !holes.some((hole) => inRing(lon, lat, hole)));

for (const p of CONTROL) {
  if (!inUkraine(p.lon, p.lat)) throw new Error(`Контрольная точка вне контура Украины: ${p.name} (${p.lon}°E ${p.lat}°N)`);
}

let west = Infinity;
let east = -Infinity;
let south = Infinity;
for (const [outer] of polygons) {
  for (const [lon, lat] of outer) {
    west = Math.min(west, lon);
    east = Math.max(east, lon);
    south = Math.min(south, lat);
  }
}
if (west < LON0) throw new Error(`Контур западнее сетки: ${west}`);

const lonStep = STEP / K;
const rows = Math.ceil((LAT0 - south) / STEP);
const cols = Math.ceil((east - LON0) / lonStep);
const rowsData = [];
for (let r = 0; r < rows; r++) {
  let line = '';
  for (let c = 0; c < cols; c++) {
    const lonA = LON0 + (c + (r % 2 ? 0.5 : 0)) * lonStep; // нечётные строки сдвинуты на полшага — шахматная сетка
    const latA = LAT0 - r * STEP;
    let hits = 0;
    for (let i = 0; i < SUB; i++) {
      for (let j = 0; j < SUB; j++) {
        if (inUkraine(lonA + ((i + 0.5) / SUB) * lonStep, latA - ((j + 0.5) / SUB) * STEP)) hits++;
      }
    }
    line += hits / (SUB * SUB) >= COVER ? '1' : '0';
  }
  rowsData.push(line);
}

// пустые строки снизу и столбцы справа не нужны; сверху не режем — иначе собьётся чётность строк (сдвиг)
if (!rowsData[0].includes('1')) throw new Error('Первая строка сетки пустая — сдвиньте LAT0');
while (rowsData.length && !rowsData.at(-1).includes('1')) rowsData.pop();
const usedCols = Math.max(...rowsData.map((line) => line.lastIndexOf('1'))) + 1;

const round = (v) => Math.round(v * 1e6) / 1e6;
const grid = {
  source: 'Natural Earth 1:10m Admin 0 – Countries, Ukraine point of view (ne_10m_admin_0_countries_ukr); public domain',
  step: STEP,
  lonStep: round(lonStep),
  shift: 0.5,
  lon0: LON0,
  lat0: LAT0,
  cols: usedCols,
  rows: rowsData.length,
  total: rowsData.join('').split('1').length - 1,
  rowsData: rowsData.map((line) => line.slice(0, usedCols)),
};

for (const p of CONTROL) {
  if (!hasDot(grid, p.lon, p.lat)) throw new Error(`Контрольная точка не попала в сетку: ${p.name} (${p.lon}°E ${p.lat}°N)`);
}

writeFileSync(OUT, `${JSON.stringify(grid, null, 2)}\n`);
console.log(`ua-dots.json: ${grid.cols}×${grid.rows}, точек ${grid.total}; контрольные точки внутри: ${CONTROL.map((p) => p.name).join(', ')}`);
console.log(grid.rowsData.map((line, r) => (r % 2 ? ' ' : '') + line.replace(/0/g, '  ').replace(/1/g, '● ')).join('\n'));
