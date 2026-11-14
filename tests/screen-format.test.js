// T23 (H12–H16): узкая шапка без ссылок-разделов, весь сайт в палитре канала, каждый блок — один экран под шапкой,
// ленты крест-накрест на стыке первого экрана и блока 02 вместо плоской полосы «Мені довіряють».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { read, readJson, root } from './helpers.js';
import { disableSections } from '../src/core/sections.js';

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = strip(read('src/styles/tokens.css'));
const layout = strip(read('src/styles/layout.css'));
const headerCss = strip(read('src/styles/sections/header.css'));
const html = read('index.html');
const config = readJson('src/data/config.json');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');

function cssFiles(dir = 'src/styles') {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? cssFiles(`${dir}/${e.name}`) : e.name.endsWith('.css') ? [`${dir}/${e.name}`] : [],
  );
}

test('H12: шапка узкая — --header-h 56–64px, строка шапки ровно этой высоты на любой ширине', () => {
  const m = tokens.match(/--header-h:\s*([^;]+);/);
  assert.ok(m, 'нет --header-h');
  const h = Number(m[1].trim().match(/^(\d+(?:\.\d+)?)px$/)?.[1]);
  assert.ok(h >= 56 && h <= 64, `--header-h = ${m[1]}`);
  const heights = [...headerCss.matchAll(/\.header__inner\s*\{[^}]*?(?<![-\w])height:\s*([^;]+);/g)].map((x) => x[1].trim());
  assert.ok(heights.length > 0, 'у строки шапки нет высоты');
  for (const v of heights) assert.equal(v, 'var(--header-h)', 'высоту строки шапки задаёт только --header-h');
  assert.doesNotMatch(headerCss, /\b112\b/, 'прежняя высота «по макету» (112 единиц) не возвращается');
});

test('якоря и прокрутка учитывают шапку: scroll-margin-top секций = var(--header-h)', () => {
  assert.match(layout, /\.section\s*\{[^}]*scroll-margin-top:\s*var\(--header-h\)/);
});

// 2026-11-13 клиент выбрал макет «Шапка A · Класика» (H16 «не надо подписывать… или хотя бы чтоб оно нормально
// менялось»: подпись текущего раздела меняется по прокрутке): логотип → быстрые ссылки → язык → «Написати» → бургер
test('шапка A: быстрые ссылки на широком экране, текущий раздел подсвечен; «Блог» — «скоро»; полный список — в меню', () => {
  const header = html.match(/<header\b[\s\S]*?<\/header>/)[0];
  const [bar, menu] = header.split(/<div class="menu"/);
  const order = ['header__logo', 'header__nav', 'lang-switch', 'header__cta', 'burger'].map((cls) => bar.search(new RegExp(`class="[^"]*\\b${cls}\\b`)));
  for (const i of order) assert.ok(i > -1, 'нет элемента шапки');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'порядок: логотип → ссылки → язык → «Написати» → бургер');
  const quick = [...bar.matchAll(/<a class="header__link" href="#([\w-]+)"( data-spy="\1")?><span data-i18n="nav\.links\.(\w+)"><\/span><\/a>/g)];
  // 2026-11-14 клиент: «При нажатии на "Досвід" пускай тоже на первый блок закидывает» — без подсветки (её даёт «Головна»)
  assert.deepEqual(quick.map((m) => [m[1], m[3], Boolean(m[2])]), [['hero', 'home', true], ['hero', 'experience', false], ['calculator', 'calculator', true], ['cases', 'results', true], ['reviews', 'reviews', true], ['faq', 'faq', true]]);
  assert.match(bar, /<span class="header__link is-soon" aria-disabled="true"><span data-i18n="nav\.links\.blog"><\/span><span class="header__soon" data-i18n="nav\.links\.soon"><\/span><\/span>/, 'блога пока нет — не ссылка');
  assert.equal((menu.match(/class="menu__link"/g) || []).length, 14, 'в меню — все 14 разделов');
  assert.match(headerCss, /\.header__nav\s*\{\s*display:\s*none;/);
  assert.match(headerCss, /@media \(min-width: 1280px\)\s*\{\s*\.header__nav\s*\{\s*display:\s*flex/);
  assert.match(headerCss, /@media \(max-width: 1279px\)\s*\{\s*\.burger\s*\{\s*display:\s*block/);
  assert.match(headerCss, /\.header__link\.is-current\s*\{\s*color:\s*var\(--text\)/);
});

test('H14: весь сайт в палитре канала — цветов первого экрана «Синий» (--v4-*, --paper) нет нигде, hex только в tokens.css', () => {
  for (const f of cssFiles()) assert.doesNotMatch(read(f), /--v4-|--paper\b/, f);
  assert.doesNotMatch(html, /--v4-|--paper\b/);
  const literals = (tokens.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi) || []).map((l) => l.toUpperCase()).sort();
  assert.deepEqual(literals, ['#070C18', '#F4F2EC', '#FF8A1F', '#FFD23F']);
  // и в data-URI картинок CSS (fill='%23…') — цвет приходит из переменных, а не литералом
  for (const f of cssFiles().filter((f) => !f.endsWith('tokens.css'))) {
    assert.doesNotMatch(strip(read(f)), /%23[0-9a-f]{3,8}(?![\w-])/i, `${f}: hex в data-URI`);
  }
});

// 2026-11-11 «Расстояние между блоками сделай одинаковое»: блок по высоте содержимого (не растягивается на экран),
// поля — половина --block-gap, под лентами — весь промежуток; размеры внутри по-прежнему от высоты окна (svh)
test('H15 + равные промежутки: на десктопе блок по содержимому, поля — половина общего промежутка; размеры — от высоты окна', () => {
  const screen = layout.match(/@media[^{]*min-width:\s*900px[^{]*\{([\s\S]*?\n)\}/)?.[1] || '';
  const rule = screen.match(/\.section\s*\{([^}]*)\}/)?.[1] || '';
  assert.doesNotMatch(rule, /min-height/, 'блок не растягивается на экран — иначе промежутки разные');
  assert.match(rule, /padding-block:\s*calc\(var\(--block-gap\) \/ 2\)/, 'поля — половина общего промежутка');
  assert.match(screen, /\.ribbons \+ \.section\s*\{\s*padding-top:\s*var\(--block-gap\)/, 'под лентами — весь промежуток');
  for (const name of ['stats', 'niches', 'formats', 'calculator']) {
    const css = strip(read(`src/styles/sections/${name}.css`));
    assert.match(css, /\d(?:\.\d+)?svh/, `${name}.css: размеры не от высоты окна`);
    assert.doesNotMatch(css, /\.section--\w+\s*\{[^}]*background\s*:/, `${name}.css: у блока свой фон`);
  }
  const hero = strip(read('src/styles/sections/hero.css'));
  assert.match(hero, /\.hero__screen\s*\{[^}]*100svh/, 'первый экран — во всё окно');
  // без прилипания страницы к блокам (горизонтальные карусели кейсов и отзывов — не про это)
  for (const f of cssFiles()) assert.doesNotMatch(strip(read(f)), /scroll-snap-type:\s*(y|both|block)\b/, `${f}: scroll-snap`);
  for (const f of ['tokens', 'base', 'layout']) assert.doesNotMatch(strip(read(`src/styles/${f}.css`)), /scroll-snap/, f);
});

test('H13: ленты крест-накрест включены сразу после первого экрана; плоской полосы «Мені довіряють» нет', () => {
  assert.deepEqual(config.sections.enabled.slice(0, 3), ['hero', 'ribbons', 'stats']);
  const hero = html.split(/<section\b[^>]*\sid="hero"/)[1].split('</section>')[0];
  assert.doesNotMatch(hero, /hero__trust|data-marquee|marquee__/, 'плоская полоса под первым экраном');
  assert.doesNotMatch(strip(read('src/styles/sections/hero.css')), /\.hero__trust|\.marquee/);
  const out = disableSections(html, config);
  assert.doesNotMatch(out.match(/<section\b[^>]*data-section="ribbons"[^>]*>/)[0], /\shidden/, 'лента выключена');
  const ribbons = html.split(/<section\b[^>]*data-section="ribbons"/)[1].split('</section>')[0];
  const [, accent, muted] = ribbons.split(/<div class="ribbons__band /);
  assert.match(accent, /^ribbons__band--accent/, 'первая — акцентная');
  assert.match(muted, /^ribbons__band--muted/, 'вторая — тёмная');
  // акцентная — «Мені довіряють» и все имена; тёмная — факты ribbons.top
  assert.match(accent, /data-i18n="hero\.trusted\.title"/);
  ua.hero.trusted.items.forEach((_, i) => assert.match(accent, new RegExp(`data-i18n="hero\\.trusted\\.items\\.${i}"`), `имя ${i}`));
  ua.ribbons.top.forEach((_, i) => assert.match(muted, new RegExp(`data-i18n="ribbons\\.top\\.${i}"`), `ribbons.top.${i}`));
  assert.doesNotMatch(ribbons, /ribbons\.bottom/);
  for (const dict of [ua, en]) assert.equal(dict.ribbons.bottom, undefined, 'неиспользуемые ribbons.bottom');
  const css = strip(read('src/styles/sections/ribbons.css'));
  // 2026-11-11: «Сделай две полоски серыми» → «Сделай нижнюю ленту желтой»: верхняя серая, нижняя жёлтая
  assert.match(css, /\.ribbons__band--accent\s*\{[^}]*background:\s*var\(--surface\)/, 'верхняя серая');
  // «Сделай нижнюю ленту желтой»
  assert.match(css, /\.ribbons__band--muted\s*\{[^}]*background:\s*var\(--grad\)[^}]*color:\s*var\(--accent-ink\)/, 'нижняя жёлтая');
  // дополнение 4: «Давай поменяем это на значок телеграмма и сделаем сами линии тоньше» — разделитель — значок Telegram
  // (круг с вырезанным самолётиком) цветом текста своей ленты, без синего; планеты с орбитой больше нет
  assert.doesNotMatch(ribbons, /<ellipse\b/, 'планета с орбитой');
  const icons = ribbons.match(/<svg class="ribbons__icon"[^>]*>[\s\S]*?<\/svg>/g) || [];
  assert.equal(icons.length, ua.hero.trusted.items.length + ua.ribbons.top.length * 2, 'значок после каждого слова');
  for (const icon of icons) {
    assert.match(icon, /aria-hidden="true"/);
    assert.match(icon, /fill="currentColor"/, 'цвет — цвет текста ленты');
    assert.match(icon, /fill-rule="evenodd"/, 'самолётик вырезан из круга');
  }
  assert.match(css, /\.ribbons__icon\s*\{[^}]*width:\s*0\.\d+em/, 'значок — около высоты заглавных');
});

// Дополнение 2 (H17): «Оставляем этот» — первый экран по образцу reference/run3/hero-B-font-chosen.png
test('H17: первый экран по образцу B — метка со штрихом, цифры строкой с разделителями, карточка сообщения Telegram', () => {
  const hero = html.split(/<section\b[^>]*\sid="hero"/)[1].split('</section>')[0];
  const ad = hero.split(/class="hero__ad"/)[1] || '';
  assert.match(ad, /data-i18n="hero\.ad\.channel"/, '«Ваш канал» в шапке карточки');
  assert.match(ad, /data-i18n="hero\.ad\.label"/, 'пилюля «Реклама»');
  assert.doesNotMatch(hero, /hero\.ad\.tag/, 'метка «Ad» уходит');
  for (const dict of [ua, en]) assert.equal(dict.hero.ad.tag, undefined, 'ключ hero.ad.tag');
  assert.deepEqual([ua.hero.ad.channel, ua.hero.ad.label], ['Ваш канал', 'Реклама']);
  assert.deepEqual([en.hero.ad.channel, en.hero.ad.label], ['Your channel', 'Sponsored']);
  const css = strip(read('src/styles/sections/hero.css'));
  assert.match(css, /\.hero__eyebrow::before\s*\{[^}]*background:\s*var\(--grad\)/, 'жёлто-оранжевый штрих метки');
  assert.match(css, /\.hero__fact \+ \.hero__fact::before\s*\{/, 'тонкие разделители между цифрами');
  assert.match(css, /\.hero__line:nth-child\(2\) \.hero__line-inner\s*\{[^}]*background:\s*var\(--grad\)/, '«TELEGRAM ADS» целиком акцентом');
  assert.match(css, /\.hero__ad-btn\s*\{[^}]*justify-content:\s*center/, 'кнопка во всю ширину снизу');
});

// Дополнение 2 (H18): «Давай попробуем с таким шрифтом» — шрифт обложек канала для заголовков и крупных цифр
test('H18: шрифт канала Sofia Sans Extra Condensed 800/900 — в ссылке Google Fonts, свой токен; где он стоит', () => {
  const links = [...html.matchAll(/href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/g)].map((m) => m[1]);
  assert.ok(links.length > 0);
  for (const href of links) assert.match(href, /family=Sofia\+Sans\+Extra\+Condensed:wght@800;900/);
  assert.match(tokens, /--font-head:\s*'Sofia Sans Extra Condensed'/);
  const uses = {
    hero: ['.hero__title', '.hero__fact-value'],
    stats: ['.section--stats .display.section__title', '.stats__value', '.stats__tag'],
    niches: ['.section--niches .display.section__title'],
    formats: ['.section--formats .display.section__title'],
    calculator: ['.section--calculator .display.section__title', '.calc__budget-value', '.calc__cell-value'],
    ribbons: ['.ribbons__band'],
  };
  for (const [file, selectors] of Object.entries(uses)) {
    const css = strip(read(`src/styles/sections/${file}.css`));
    for (const sel of selectors) {
      const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      assert.match(css, new RegExp(`${esc}\\s*\\{[^}]*font-family:\\s*var\\(--font-head\\)[^}]*text-transform:\\s*uppercase`), `${file}: ${sel}`);
    }
  }
  // огромное «eLeads» не трогаем
  assert.match(strip(read('src/styles/sections/hero.css')), /\.hero__word\s*\{[^}]*font-family:\s*var\(--font-body\)/);
});

// Дополнение 3: «И пишем проекты 50+ а не десятки»
test('«50+» проєктів вместо «десятки» — в цифрах первого экрана и в текстах', () => {
  for (const dict of [ua, en]) {
    assert.equal(dict.hero.facts.projects.value, '50+');
    assert.equal(dict.hero.stats.projects.value, '50+');
  }
  for (const f of ['src/data/content.ua.json', 'src/data/content.en.json']) assert.doesNotMatch(read(f), /десятк|Десятк|dozen/i, f);
});
