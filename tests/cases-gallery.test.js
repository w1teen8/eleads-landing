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

test('карточка: аватар, ниша-тег, номер, название, CPA/CPS, бюджет, результат — кнопка', () => {
  for (const f of ['niche', 'name', 'budget', 'result', 'cpa']) assert.match(tpl, new RegExp(`data-f="${f}"`), f);
  assert.match(tpl, /data-case-num/);
  assert.match(tpl, /data-case-avatar[^>]*aria-hidden="true"/, 'аватар — украшение, имя читается из названия');
  assert.match(tpl, /data-case-letter/);
  assert.match(tpl, /<button\b/, 'карточка — кнопка: Enter и Space открывают модалку');
});

test('аватар: /img/cases/<id>.webp через publicUrl, запасной — первая буква имени; сбой загрузки убирает <img>', async () => {
  assert.match(js, /publicUrl\(avatarPath\(item\.id\)\)/);
  assert.match(js, /addEventListener\('error',\s*\(\)\s*=>\s*img\.remove\(\)/);
  assert.match(js, /addEventListener\('load',\s*\(\)\s*=>\s*avatar\.classList\.add\('has-image'\)/);
  // чистые помощники — без DOM
  const src = read('src/sections/cases.js');
  const avatarPath = new Function(`return ${src.match(/export const avatarPath = ([^\n]+);/)[1]}`)();
  const initial = new Function(`return ${src.match(/export const initial = ([^\n]+);/)[1]}`)();
  assert.equal(avatarPath('finmap'), '/img/cases/finmap.webp');
  assert.deepEqual(cases.map((c) => initial(c.name.ua)), ['C', 'F', 'G', 'К', 'О', 'В', 'T']);
  assert.equal(initial('  «Monolit»'), 'M');
  assert.equal(initial(''), '');
  assert.match(css, /\.cases__avatar\s*\{[^}]*border-radius:\s*50%/);
  assert.match(css, /\.cases__avatar\.has-image \.cases__avatar-img\s*\{[^}]*opacity:\s*1/);
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

test('облик: шрифт канала у заголовка, названий и цифр; акцентная карточка featured; заглушка «уточнити» видна', () => {
  for (const sel of ['.section--cases .display.section__title', '.cases__name', '.cases__figure-value', '.case-modal__title']) {
    const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(css, new RegExp(`${esc}\\s*\\{[^}]*font-family:\\s*var\\(--font-head\\)[^}]*text-transform:\\s*uppercase`), sel);
  }
  assert.doesNotMatch(css, /--font-display|--font-mono/, 'прежних шрифтов (Unbounded, моно) в блоке нет');
  assert.match(css, /\.cases__item--featured \.cases__card\s*\{[^}]*background:\s*var\(--grad\)[^}]*color:\s*var\(--accent-ink\)/);
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
