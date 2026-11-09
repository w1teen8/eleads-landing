// Чистая математика точечных карт блока 02 — без DOM и без импорта данных, чтобы проверяться в node
// и работать в скрипте сборки сетки (scripts/ua-dots.js).
//
// Сетка (src/data/ua-dots.json, geo-dots.json): { step, lon0, lat0, cols, rows, rowsData } — строки с севера на юг,
// '1' — точка; ячейка (r, c) занимает lat0 − r·step … lat0 − (r+1)·step по широте. У сетки Украины ещё
// lonStep (шаг по долготе, растянут на косинус широты) и shift (сдвиг нечётных строк в долях шага — шахматный порядок).

/** Карта мира: сетка geo-dots.json (2.5°) прорежена вдвое в шахматном порядке — точки того же рисунка, что у Украины. */
export const WORLD_STRIDE = 2;

/** «81%» → 0.81; «7,5 %» → 0.075; не процент («1B+») → null. */
export function parseShare(value) {
  const match = /^\s*(\d+(?:[.,]\d+)?)\s*%\s*$/.exec(String(value ?? ''));
  if (!match) return null;
  const share = Number(match[1].replace(',', '.')) / 100;
  return share >= 0 && share <= 1 ? Math.round(share * 1e6) / 1e6 : null;
}

/** Сколько точек из total горит при доле share — округление до целой точки. */
export function litCount(total, share) {
  return Math.max(0, Math.min(total, Math.round(total * share)));
}

/**
 * Номера горящих точек: ровно litCount(total, share) штук, разбросаны по карте равномерно.
 * Порядок — от генератора с постоянным зерном: набор один и тот же при каждой загрузке.
 */
export function litSet(total, share, seed = 7) {
  let state = seed >>> 0;
  const next = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
  const order = Array.from({ length: total }, (_, i) => [next(), i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return new Set(order.slice(0, litCount(total, share)).map(([, i]) => i));
}

/** Ячейка сетки, в которую попадает точка (lon, lat); вне сетки — null. */
export function cellAt(grid, lon, lat) {
  const lonStep = grid.lonStep ?? grid.step;
  const row = Math.floor((grid.lat0 - lat) / grid.step);
  if (row < 0 || row >= grid.rows) return null;
  const col = Math.floor((lon - grid.lon0) / lonStep - (row % 2 ? grid.shift ?? 0 : 0));
  if (col < 0 || col >= grid.cols) return null;
  return { row, col };
}

/** Есть ли на месте (lon, lat) точка карты. */
export function hasDot(grid, lon, lat) {
  const cell = cellAt(grid, lon, lat);
  return Boolean(cell) && grid.rowsData[cell.row][cell.col] === '1';
}

/**
 * Точки карты в единицах шага сетки: { dots: [{ x, y }], width, height } — центры кружков и рамка для viewBox.
 * stride > 1 прореживает плотную прямую сетку: берётся блок stride×stride ячеек, в нечётных рядах блоки сдвинуты
 * на полблока; точка ставится, если суши в блоке не меньше половины.
 */
export function gridDots(grid, { stride = 1 } = {}) {
  const dots = [];
  if (stride === 1) {
    const shift = grid.shift ?? 0;
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (grid.rowsData[r][c] === '1') dots.push({ x: c + 0.5 + (r % 2 ? shift : 0), y: r + 0.5 });
      }
    }
    return { dots, width: grid.cols + shift, height: grid.rows };
  }
  const half = Math.floor(stride / 2);
  const need = (stride * stride) / 2;
  for (let i = 0; i * stride < grid.rows; i++) {
    const offset = i % 2 ? half : 0;
    for (let j = 0; j * stride + offset < grid.cols; j++) {
      let land = 0;
      for (let dr = 0; dr < stride; dr++) {
        for (let dc = 0; dc < stride; dc++) {
          if (grid.rowsData[i * stride + dr]?.[j * stride + offset + dc] === '1') land++;
        }
      }
      if (land >= need) dots.push({ x: j + 0.5 + offset / stride, y: i + 0.5 });
    }
  }
  return { dots, width: Math.ceil(grid.cols / stride) + half / stride, height: Math.ceil(grid.rows / stride) };
}

/* ——— движение карты (T25, дополнение 3): всё в единицах шага сетки и секундах ——— */

/** Точка (lon, lat) в координатах карты — тех же, что у gridDots: шаг сетки = 1. */
export function gridPoint(grid, lon, lat) {
  return { x: (lon - grid.lon0) / (grid.lonStep ?? grid.step), y: (grid.lat0 - lat) / grid.step };
}

/** Самое большое расстояние от origin до точки карты — докуда должна дойти волна, чтобы пройти всю карту. */
export function farthest(dots, origin) {
  let max = 0;
  for (const dot of dots) max = Math.max(max, Math.hypot(dot.x - origin.x, dot.y - origin.y));
  return max;
}

/**
 * Волна — круг по воде: { speed, width, reach, amp }. Гребень идёт от источника со скоростью speed, его полуширина —
 * width; к расстоянию reach волна затухает до нуля. Возвращает силу волны 0…amp в точке на расстоянии d от источника
 * через age секунд после пуска: вне гребня — 0.
 */
export function waveStrength(wave, d, age) {
  if (age < 0) return 0;
  const front = wave.speed * age;
  const k = (d - front) / wave.width;
  if (k <= -1 || k >= 1) return 0;
  const fade = 1 - front / wave.reach;
  if (fade <= 0) return 0;
  return wave.amp * fade * 0.5 * (1 + Math.cos(Math.PI * k));
}

/** Волна ещё идёт: гребень не ушёл за reach. */
export function waveAlive(wave, age) {
  return wave.speed * age < wave.reach + wave.width;
}

/**
 * Расталкивание: смещение точки, от которой курсор на (dx, dy) — прочь от курсора, тем сильнее, чем ближе;
 * на расстоянии reach и дальше — ноль. push — смещение под самым курсором.
 */
export function repelOffset(dx, dy, { reach, push }) {
  const d = Math.hypot(dx, dy);
  if (d >= reach) return { x: 0, y: 0 };
  if (d < 1e-6) return { x: 0, y: -push };
  const k = (push * (1 - d / reach) ** 2) / d;
  return { x: dx * k, y: dy * k };
}

/** Шаг пружины с затуханием: положение o и скорость v тянутся к target. Возвращает [o, v] через dt секунд. */
export function springStep(o, v, target, dt, { stiffness, damping }) {
  const velocity = v + (stiffness * (target - o) - damping * v) * dt;
  return [o + velocity * dt, velocity];
}

/** Зажигание карты волной: 0 — фронт ещё не дошёл до точки на расстоянии d, 1 — прошёл на band и дальше. */
export function igniteLevel(d, front, band) {
  return Math.max(0, Math.min(1, (front - d) / band));
}

/* ——— цифры-барабаны ——— */

const isDigit = (char) => char >= '0' && char <= '9';

/**
 * Раскладка значения to на ячейки при смене с from (знаки сопоставляются по месту слева):
 *   цифра — барабан: { char, digit: true, from, steps } — крутится вперёд от from на steps шагов, из них turns полных
 *   оборотов сверху; на прежнем месте стояла та же цифра — steps 0; раньше там была не цифра — барабан идёт от нуля;
 *   прочий знак — { char, digit: false, enter } — стоит на месте, а если знак на этом месте сменился — въезжает один раз.
 */
export function odoCells(from, to, { turns = 0 } = {}) {
  const prev = Array.from(String(from ?? ''));
  return Array.from(String(to ?? '')).map((char, i) => {
    if (!isDigit(char)) return { char, digit: false, enter: prev[i] !== char };
    const start = isDigit(prev[i] ?? '') ? Number(prev[i]) : 0;
    const same = prev[i] === char;
    const steps = same ? 0 : ((Number(char) - start + 10) % 10) + turns * 10;
    return { char, digit: true, from: start, steps };
  });
}

/** Лента барабана: цифры от from на steps шагов вперёд, последняя — та, на которой барабан остановится. */
export function reelDigits(from, steps) {
  return Array.from({ length: steps + 1 }, (_, i) => (from + i) % 10);
}
