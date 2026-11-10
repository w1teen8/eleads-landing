// T29 (H41): блок 06 «Кейси» в облике блоков 02–05 — лента карточек в один экран. По правке пользователя лента едет
// по прокрутке страницы, как на блоках 11–12 (showcaseScroll из core/motion-kit.js); стрелок и перетаскивания нет.
// Узкий экран, reduced-motion, ?nomotion=1 — горизонтальная прокрутка пальцем со scroll-snap. У карточки — аватар клиента.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const { cases } = readJson('src/data/cases.json');
const stripCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const stripJs = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const css = stripCss(read('src/styles/sections/cases.css'));
const js = stripJs(read('src/sections/cases.js'));
const section = html.split(/<section\b[^>]*\sid="cases"/)[1].split(/<\/section>/)[0];
const tpl = section.split('<template data-case-card>')[1].split('</template>')[0];

test('разметка: заголовок с акцентной строкой, окно с лентой, полоса пути, модалка; слова-фона и стрелок нет', () => {
  assert.match(section, /<h2\b[^>]*class="display section__title"[^>]*data-i18n="cases\.title"[^>]*data-title-accent="cases\.titleAccent"/);
  assert.match(section, /data-cases-viewport/);
  assert.match(section, /<ul\b[^>]*data-cases-grid/);
  assert.match(section, /data-cases-progress/);
  assert.match(section, /<dialog\b[^>]*data-case-modal[^>]*data-lenis-prevent/, 'модалка на месте, Lenis в ней не гасит прокрутку');
  assert.doesNotMatch(section, /cases__word|data-cases-word|data-cases-stage/, 'огромного слова-фона и сцены нет');
  assert.doesNotMatch(section, /data-cases-prev|data-cases-next|cases__arrow/, 'стрелок нет — ленту двигает прокрутка');
  assert.doesNotMatch(section, /data-reveal|eyebrow|section--alt/, 'без появления по прокрутке, метки и линии сверху');
  for (const dict of [ua, en]) {
    assert.equal(dict.cases.word, undefined);
    assert.equal(dict.cases.prev, undefined);
    assert.ok(dict.cases.title.endsWith(dict.cases.titleAccent) && dict.cases.titleAccent.length < dict.cases.title.length);
  }
});

// Вариант F (выбор пользователя) + уточнение: «надо аватарка и справа надпись кто это»
test('карточка F: линия роста на фоне — шапка «аватар + имя и ниша», внизу «Результат», значение, «Детальніше» со стрелкой', () => {
  const order = ['class="cases__chart" data-case-chart aria-hidden="true"', 'data-case-avatar', 'class="cases__name" data-f="name"', 'class="cases__niche" data-f="niche"',
    'data-i18n="cases.labels.result"', 'class="cases__figure-value" data-f="result"', 'data-i18n="cases.more"', 'class="cases__go"'].map((s) => tpl.indexOf(s));
  for (const i of order) assert.ok(i > -1, 'нет части карточки');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'порядок частей карточки');
  assert.equal((tpl.match(/data-f="name"/g) || []).length, 1, 'имя — один раз, в шапке (внизу не дублируется)');
  const who = tpl.split('class="cases__top-row"')[1].split('class="cases__figure"')[0];
  assert.match(who, /data-case-avatar[^>]*aria-hidden="true"[\s\S]*class="cases__who"[\s\S]*data-f="name"[\s\S]*data-f="niche"/);
  // правки пользователя: большую букву заменили иконкой ниши, потом «Убери иконки ниш», потом «давай 5 вариант» — линия роста
  assert.doesNotMatch(section, /cases__letter|cases__icon|data-case-icon|data-icon/, 'ни буквы, ни иконки на фоне — на карточке и в модалке');
  assert.equal((tpl.match(/data-case-letter/g) || []).length, 1, 'буква — только запасной аватар в круге');
  assert.doesNotMatch(tpl, /cases__tag|data-case-num|data-f="(cpa|budget)"/, 'плашки ниши, номера, CPA и бюджета на карточке нет — они в модалке');
  assert.match(tpl, /<button\b/, 'карточка — кнопка: Enter и Space открывают модалку');
  // то же расположение — в шапке модалки
  const head = section.split('class="case-modal__who"')[1].split('<dl')[0];
  assert.match(head, /data-m-avatar[^>]*aria-hidden="true"[\s\S]*id="case-modal-title"[^>]*data-m="name"[\s\S]*data-m="niche"/);
});

test('аватар: фото только при avatar: true (лишних запросов нет), 256 + 512 через publicUrl; запасной — буква', async () => {
  assert.match(js, /if \(item\.avatar !== true\) return;/);
  assert.match(js, /src: publicUrl\(avatarPath\(item\.id\)\)/);
  assert.match(js, /if \(item\.avatarRetina !== false\) attrs\.srcset = `\$\{attrs\.src\} 1x, \$\{publicUrl\(avatarPath\(item\.id, true\)\)\} 2x`/, '@2x — только когда файл есть');
  assert.match(js, /addEventListener\('error',\s*\(\)\s*=>\s*img\.remove\(\)/);
  assert.match(js, /addEventListener\('load',\s*\(\)\s*=>\s*avatar\.classList\.add\('has-image'\)/);
  assert.match(js, /paintAvatar\(\$\('\[data-m-avatar\]', modal\), item\)/, 'аватар и в модалке');
  // чистые помощники — без DOM
  const src = read('src/sections/cases.js');
  const pick = (name) => new Function(`return ${src.match(new RegExp(`export const ${name} = ([^\\n]+);`))[1]}`)();
  const avatarPath = pick('avatarPath');
  const initial = pick('initial');
  const accentOf = pick('accentOf');
  assert.equal(avatarPath('finmap'), '/img/cases/finmap.webp');
  assert.equal(avatarPath('finmap', true), '/img/cases/finmap@2x.webp');
  assert.deepEqual(cases.map((c) => initial(c.name.ua)), ['C', 'M', 'G', 'T', 'О', 'В', 'F', 'К']);
  assert.equal(initial('  «Monolit»'), 'M');
  assert.equal(initial(''), '');
  assert.equal(accentOf({ accent: '#12B76A' }), '#12B76A');
  for (const bad of [{}, { accent: 'red' }, { accent: '#12B76A; background:url(x)' }, { accent: 12 }, null]) assert.equal(accentOf(bad), null);
  assert.match(css, /\.cases__avatar\s*\{[^}]*border-radius:\s*50%[^}]*box-shadow:[^;}]*var\(--case-accent\)/, 'кольцо цвета бренда');
  assert.match(css, /\.cases__avatar\.has-image \.cases__avatar-img\s*\{[^}]*opacity:\s*1/);
});

test('цвет бренда — данные: в CSS приходит инлайн-переменной --case-accent, hex в стилях нет; без него — акцент сайта', () => {
  assert.match(js, /style\.setProperty\('--case-accent', accent\)/);
  assert.match(js, /tint\(li, item\)/);
  assert.match(js, /tint\(modal, item\)/);
  assert.match(css, /\.cases__item,\s*\.case-modal\s*\{[^}]*--case-accent:\s*var\(--accent\);[^}]*--case-tone:\s*color-mix\(in srgb, var\(--case-accent\) \d+%, var\(--text\)\)/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(css, /cases__letter|cases__icon/);
  assert.doesNotMatch(js, /iconSvg|icons\.js|data-case-icon/);
  for (const c of cases) assert.equal(c.icon, undefined, `${c.id}: поле icon больше не нужно`);
  assert.match(css, /\.cases__figure-value\s*\{[^}]*color:\s*var\(--case-tone\)/, 'значение — осветлённым цветом бренда (AA для крупного текста)');
  assert.match(css, /\.cases__go\s*\{[^}]*background:\s*var\(--case-accent\)[^}]*color:\s*var\(--accent-ink\)/);
  // контраст: осветлённый цвет бренда на поверхности карточки — не меньше 3:1 (крупный текст, AA)
  const mixP = Number(css.match(/--case-tone:\s*color-mix\(in srgb, var\(--case-accent\) (\d+)%/)[1]) / 100;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, p) => a.map((v, i) => v * p + b[i] * (1 - p));
  const lum = (c) => {
    const [r, g, b] = c.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const fg = hex('#F4F2EC');
  const ink = hex('#070C18');
  const surface = mix(fg, ink, 0.08);
  for (const c of cases.filter((c) => c.accent)) {
    assert.ok(ratio(mix(hex(c.accent), fg, mixP), surface) >= 4.5, `${c.id}: значение на карточке`);
    assert.ok(ratio(ink, hex(c.accent)) >= 3, `${c.id}: стрелка на круге`);
  }
});

test('лента едет по прокрутке страницы — только общий помощник showcaseScroll; перетаскивания и своего pin нет', () => {
  assert.match(js, /import \{[^}]*\bshowcaseScroll\b[^}]*\} from '\.\.\/core\/motion-kit\.js'/);
  assert.match(js, /showcaseScroll\(root, trackEl, \{ onProgress: paintBar \}\)/);
  assert.match(js, /classList\.toggle\('is-static', !ok\)/, 'лента не поедет — запасная прокрутка пальцем');
  assert.doesNotMatch(js, /pointerdown|pointermove|setPointerCapture|is-dragging/, 'перетаскивание убрано');
  assert.doesNotMatch(js, /ScrollTrigger|gsap|pin:/, 'свой pin не пишем — он в motion-kit');
  assert.match(js, /scaleX\(/, 'полоса пути — transform');
});

test('CSS: по умолчанию прокрутка пальцем со scroll-snap; на широком альбомном экране без is-static окно не скроллится', () => {
  const wideBlocks = [];
  const base = css.replace(/@media\s*\(min-width:\s*900px\)\s*and\s*\(orientation:\s*landscape\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, (_, body) => {
    wideBlocks.push(body);
    return '';
  });
  const wide = wideBlocks.join('\n');
  assert.match(base, /\.cases__viewport\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(base, /scroll-snap-type:\s*x\s+mandatory/);
  assert.match(base, /scroll-snap-align:\s*start/);
  assert.match(base, /\.cases__track\s*\{[^}]*display:\s*flex/, 'showcaseScroll ждёт полосу display:flex');
  assert.match(wide, /\.section--cases:not\(\.is-static\) \.cases__viewport\s*\{[^}]*overflow:\s*visible/);
  assert.match(css, /\.section--cases\s*\{[^}]*overflow-x:\s*clip/, 'лента шире экрана, но горизонтального скролла страницы нет');
  assert.doesNotMatch(css, /position:\s*sticky|cursor:\s*grab/);
});

test('облик: шрифт канала у заголовка, цифр и имени в модалке; карточки тёмные; заглушка «уточнити» видна', () => {
  for (const sel of ['.section--cases .display.section__title', '.case-modal__title']) {
    const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(css, new RegExp(`${esc}\\s*\\{[^}]*font-family:\\s*var\\(--font-head\\)[^}]*text-transform:\\s*uppercase`), sel);
  }
  assert.match(css, /\.cases__figure-value\s*\{[^}]*font-family:\s*var\(--font-head\)/);
  assert.doesNotMatch(css, /--font-display|--font-mono/, 'прежних шрифтов (Unbounded, моно) в блоке нет');
  assert.match(css, /\.cases__card\s*\{[^}]*background:\s*var\(--surface\)/);
  assert.doesNotMatch(css, /cases__item--featured/, 'отдельной акцентной карточки нет — все тёмные, цвет даёт бренд кейса');
  assert.doesNotMatch(js, /cases__item--featured/);
  assert.match(css, /\.cases__card \.is-tbd\s*\{/);
  assert.match(css, /\d(?:\.\d+)?svh/, 'размеры от высоты окна');
  assert.doesNotMatch(css, /\.section--cases\s*\{[^}]*background\s*:/, 'своего фона у блока нет');
});

test('модалка работает как раньше: case_open, trapFocus, lockScroll, Esc', () => {
  assert.match(js, /track\('case_open'/);
  assert.match(js, /trapFocus\(/);
  assert.match(js, /lockScroll\(true\)/);
  assert.match(js, /'cancel'/);
});

test('клавиатура: стрелки переводят фокус между карточками, карточка за краем докручивается', () => {
  assert.match(js, /ArrowRight/);
  assert.match(js, /ArrowLeft/);
  assert.match(js, /'focusin'/);
});

test('длинные названия не рвутся посреди слова', () => {
  const rule = css.match(/\.cases__name\s*\{([^}]*)\}/)[1];
  assert.match(rule, /overflow-wrap:\s*normal/);
  assert.match(rule, /hyphens:\s*manual/);
  assert.match(rule, /cqi/, 'кегль от ширины карточки — самое длинное слово влезает');
});

// Иконки ниш блока 03 живут в общем модуле core/icons.js (переведён в T29); на карточках кейсов их нет
test('иконки ниш: в разметке блока 03 — только ключи, пути вписывает сборка из core/icons.js', async () => {
  const { ICONS, iconKey, iconSvg, inlineIcons } = await import('../src/core/icons.js');
  const niches = html.split(/<section\b[^>]*\sid="niches"/)[1].split('</section>')[0];
  assert.deepEqual([...niches.matchAll(/<svg class="niches__icon" data-icon="([a-z]+)"><\/svg>/g)].map((m) => m[1]),
    ['briefcase', 'person', 'coin', 'cap', 'car', 'chart', 'cloud', 'plane']);
  for (const d of Object.values(ICONS)) assert.ok(!html.includes(d), 'пути иконок в index.html не дублируются');
  const built = inlineIcons(niches);
  assert.equal((built.match(/<svg class="niches__icon" data-icon="[a-z]+" viewBox="0 0 24 24"/g) || []).length, 8);
  assert.ok(built.includes(ICONS.car) && built.includes(ICONS.plane));
  assert.throws(() => inlineIcons('<svg data-icon="nope"></svg>'), /nope/);
  assert.match(read('build/i18n-prerender.js'), /inlineIcons\(html\)/);
  for (const bad of [undefined, '', 'nope', 'constructor', 42]) assert.equal(iconKey(bad), 'briefcase');
  assert.match(iconSvg('car', 'x'), /^<svg class="x" viewBox="0 0 24 24"[^>]*stroke="currentColor"[^>]*aria-hidden="true"[^>]*><path d="M1\.8 15\.8/);
  assert.doesNotMatch(iconSvg('car', '"><script>'), /script/, 'имя класса не из букв — отбрасывается');
});

// Вариант 5 (выбор пользователя): фон карточки — «линия роста». Украшение, не данные
test('линия роста: три заготовки кривой по номеру карточки, цвет бренда, без осей и цифр; в модалке её нет', async () => {
  const src = read('src/sections/cases.js');
  const body = src.slice(src.indexOf('export const CHART_SHAPES'), src.indexOf('/** Красит узел'));
  const { CHART_SHAPES, chartSvg } = new Function(`${body.replace(/export /g, '')}; return { CHART_SHAPES, chartSvg };`)();
  assert.ok(CHART_SHAPES.length >= 2 && CHART_SHAPES.length <= 3);
  assert.equal(new Set(CHART_SHAPES.map((sh) => sh.d)).size, CHART_SHAPES.length, 'формы разные');
  for (const { d, end } of CHART_SHAPES) {
    const nums = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.match(d, /^M0 (\d+) /, 'начинается у левого края');
    assert.deepEqual(nums.slice(-2), [300, end], 'кончается у правого края на высоте end');
    assert.ok(nums[1] - end >= 120, 'слева-снизу вправо-вверх');
    assert.ok(nums.every((n) => n >= 0 && n <= 300));
  }
  // детерминированно и по кругу; соседние карточки — разные формы; id градиентов не повторяются
  assert.equal(chartSvg(0), chartSvg(0));
  assert.notEqual(chartSvg(0).replace(/cases-chart-\d+/g, ''), chartSvg(1).replace(/cases-chart-\d+/g, ''));
  assert.equal(chartSvg(0).replace(/cases-chart-\d+/g, ''), chartSvg(CHART_SHAPES.length).replace(/cases-chart-\d+/g, ''));
  assert.equal(new Set(cases.map((_, i) => chartSvg(i).match(/id="([^"]+)"/)[1])).size, cases.length);
  const svg = chartSvg(4);
  assert.match(svg, /stroke="currentColor" stroke-width="4" stroke-linecap="round" vector-effect="non-scaling-stroke"/);
  assert.match(svg, /stop-color="currentColor" stop-opacity="0\.45"[\s\S]*stop-opacity="0"/, 'заливка в прозрачность');
  assert.match(svg, /class="cases__chart-dot" style="top:[\d.]+%"/, 'круглая точка на конце');
  assert.doesNotMatch(svg, /<text|<tspan|<line\b|<rect|#[0-9a-f]{3,8}\b/i, 'ни осей, ни цифр, ни hex');
  assert.match(js, /chart\.innerHTML = chartSvg\(i\)/);
  assert.match(css, /\.cases__chart\s*\{[^}]*z-index:\s*-1[^}]*color:\s*var\(--case-accent\)[^}]*pointer-events:\s*none/);
  const modal = section.split('<dialog')[1];
  assert.doesNotMatch(modal, /cases__chart|data-case-chart/);
});
