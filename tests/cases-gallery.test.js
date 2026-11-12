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

// Вариант F (выбор пользователя) + уточнение: «надо аватарка и справа надпись кто это».
// T40 (документ клиента, блок 6): «Лого, назва клієнта та ніша; GEO; ціль кампанії; 3 ключові показники»
test('карточка: шапка «аватар + имя и ниша», GEO и ціль кампанії, 3 ключевых показателя, «Детальніше» со стрелкой', () => {
  const order = ['data-case-avatar', 'class="cases__name" data-f="name"', 'class="cases__niche" data-f="niche"',
    'data-i18n="cases.labels.geo"', 'class="cases__fact-value" data-f="geo"', 'data-i18n="cases.labels.goal"', 'class="cases__fact-value" data-f="goal"',
    'data-metric="0"', 'data-metric="1"', 'data-metric="2"', 'data-i18n="cases.more"', 'class="cases__go"'].map((s) => tpl.indexOf(s));
  for (const i of order) assert.ok(i > -1, 'нет части карточки');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'порядок частей карточки');
  assert.equal((tpl.match(/data-f="name"/g) || []).length, 1, 'имя — один раз, в шапке (внизу не дублируется)');
  const who = tpl.split('class="cases__top-row"')[1].split('class="cases__facts"')[0];
  assert.match(who, /data-case-avatar[^>]*aria-hidden="true"[\s\S]*class="cases__who"[\s\S]*data-f="name"[\s\S]*data-f="niche"/);
  // правки пользователя: большую букву заменили иконкой ниши, потом «Убери иконки ниш», потом «давай 5 вариант» — линия роста
  assert.doesNotMatch(section, /cases__letter|cases__icon|data-case-icon|data-icon/, 'ни буквы, ни иконки на фоне — на карточке и в модалке');
  assert.equal((tpl.match(/data-case-letter/g) || []).length, 1, 'буква — только запасной аватар в круге');
  assert.doesNotMatch(tpl, /cases__tag|data-case-num|data-f="(cpa|budget|result)"/, 'плашки ниши и номера нет; бюджет, результат, CPA — среди показателей');
  assert.equal((tpl.match(/class="cases__metric" data-metric="\d"><span class="cases__metric-label" data-metric-label><\/span><span class="cases__metric-value" data-metric-value><\/span><\/span>/g) || []).length, 3);
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
  assert.deepEqual(cases.map((c) => initial(c.name.ua)), ['C', 'G', 'F', 'В', 'О', 'M', 'К', 'А']);
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
  assert.match(css, /\.cases__metric-value\s*\{[^}]*color:\s*var\(--case-tone\)/, 'значение — осветлённым цветом бренда (AA для крупного текста)');
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
  assert.match(css, /\.cases__metric-value\s*\{[^}]*font-family:\s*var\(--font-head\)/);
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

// T40: «Прибрати графік без змістовного пояснення. Замість нього показати основні факти й результати з кейсу»
test('линии роста нет; показатели — из cases.json → metrics (ровно 3, пустой слот скрыт), модалка — те же поля + детали', async () => {
  assert.doesNotMatch(section, /cases__chart|data-case-chart|cases__figure/);
  assert.doesNotMatch(js, /CHART_SHAPES|chartSvg|innerHTML/);
  assert.doesNotMatch(css, /cases__chart|cases__figure/);
  for (const dict of [ua, en]) {
    for (const k of ['geo', 'goal', 'details', 'task', 'done']) assert.ok(dict.cases.labels[k], k);
    assert.equal(dict.cases.labels.review, undefined, 'поля отзыва в модалке нет');
    assert.equal(dict.cases.reviewEmpty, undefined);
    for (const k of ['budget', 'result', 'cpa']) assert.equal(dict.cases.labels[k], undefined, `${k}: подпись теперь в cases.json`);
  }
  // чистый помощник metricsOf — без DOM
  const src = read('src/sections/cases.js');
  const body = src.slice(src.indexOf('const text = '), src.indexOf('const isTbd'));
  const { metricsOf } = new Function(`const METRICS = 3; ${body.replace(/export /g, '')}; return { metricsOf };`)();
  const item = cases[0];
  assert.deepEqual(metricsOf(item, 'ua'), [
    { label: 'Бюджет', value: 'n/a' },
    { label: 'CPM за 1000', value: '$0,56' },
    { label: 'Ціна підписника', value: '$1,72' },
  ]);
  assert.deepEqual(metricsOf(item, 'en').map((m) => m.label), ['Budget', 'CPM per 1000', 'Cost per subscriber']);
  assert.deepEqual(metricsOf({}, 'ua'), [null, null, null]);
  assert.deepEqual(metricsOf({ metrics: [{ label: { ua: 'A', en: 'A' }, value: { ua: '1', en: '1' } }, { label: { ua: '' }, value: { ua: ' ' } }] }, 'ua'), [{ label: 'A', value: '1' }, null, null]);
  assert.equal(metricsOf({ metrics: Array(5).fill(item.metrics[0]) }, 'ua').length, 3, 'лишние отбрасываются');
  assert.match(js, /export const METRICS = 3;/);
  assert.match(js, /paintMetrics\(\$\$\('\[data-metric\]', li\), item, lang\)/);
  assert.match(js, /paintMetrics\(\$\$\('\[data-m-metric\]', modal\), item, lang\)/);
  assert.match(css, /\.cases__metric\[hidden\]\s*\{\s*display:\s*none/);
  // модалка: шапка, GEO и ціль, 3 показателя, «Детальна інформація» — задача, что сделано; справа отзыв
  const modal = section.split('<dialog')[1];
  const parts = ['data-m="name"', 'data-m="niche"', 'data-m="formats"', 'data-m="geo"', 'data-m="goal"', 'data-m-metric="0"', 'data-m-metric="1"', 'data-m-metric="2"',
    'data-i18n="cases.labels.details"', 'data-m="task"', 'data-m-list="done"'].map((p) => modal.indexOf(p));
  assert.doesNotMatch(modal, /case-modal__review|data-m-shot|data-m="review"/, 'поле отзыва / скриншота убрано (клиент 2026-11-12)');
  for (const i of parts) assert.ok(i > -1, 'нет части модалки');
  assert.deepEqual([...parts].sort((a, b) => a - b), parts, 'порядок частей модалки');
  assert.doesNotMatch(modal, /data-m="(budget|result|cpa)"/);
});

// 2026-11-12 «добавить ссылки на моих клиентов там где кейсы» → «И на карточке, и в окне»
test('канал клиента: кружок Telegram в углу карточки (рядом с кнопкой, не внутри) и строка под названием в окне', () => {
  const tpl = html.split('<template data-case-card>')[1].split('</template>')[0];
  assert.match(tpl, /<\/button>\s*<a class="cases__link" href="#" target="_blank" rel="noopener" data-case-link hidden><svg/, 'ссылка — соседка кнопки');
  const modal = html.split('<dialog')[1];
  assert.match(modal, /data-m="formats"><\/span><\/p>\s*<a class="case-modal__link"[^>]*data-m-link hidden><span data-m-link-text><\/span>/);
  const src = read('src/sections/cases.js');
  const fnSrc = src.slice(src.indexOf('export function channelOf'), src.indexOf('\n}\n', src.indexOf('export function channelOf')) + 2).replace('export ', '');
  const channelOf = new Function(`${fnSrc}; return channelOf;`)();
  assert.deepEqual(channelOf('https://t.me/cryptonite_ua'), { href: 'https://t.me/cryptonite_ua', label: 't.me/cryptonite_ua' });
  assert.deepEqual(channelOf('https://t.me/+s-RnfWlZtRNhOTI6'), { href: 'https://t.me/+s-RnfWlZtRNhOTI6', label: null }, 'приглашение — подпись из словаря');
  for (const bad of ['', 'javascript:alert(1)', 'http://t.me/x_channel', 'https://evil.com/t.me/abc', undefined]) assert.equal(channelOf(bad), null, String(bad));
  assert.match(js, /paintLink\(\$\('\[data-case-link\]', li\), item\);/);
  assert.match(js, /paintLink\(\$\('\[data-m-link\]', modal\), item, \$\('\[data-m-link-text\]', modal\)\);/);
  assert.match(css, /\.cases__link\s*\{[^}]*position:\s*absolute/);
  assert.match(css, /\.cases__link\[hidden\]\s*\{\s*display:\s*none/);
  for (const dict of [ua, en]) assert.ok(dict.cases.link && dict.cases.linkPrivate);
});


// 2026-11-12 клиент: «в этом блоке не с первого кейса начинается» — обычная лента встаёт на первый кейс,
// когда блок въезжает в экран, побывав за ним
test('лента кейсов: при входе блока в экран — с первого кейса; пока блок на экране, свайп не сбрасывается', () => {
  assert.match(js, /if \(entry\.isIntersecting && !inView && !\(riding && wide\(\)\) && viewport\.scrollLeft\) \{\s*viewport\.scrollLeft = 0;/);
  assert.match(js, /inView = entry\.isIntersecting;/);
});
