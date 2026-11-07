// Таск 12 (G14, история 83): кейсы — закреплённая галерея, лента едет вбок при прокрутке вниз,
// за ней медленнее плывёт огромное слово «КЕЙСИ» / «CASES», внизу растёт полоса прогресса.
// Мобильный и reduced-motion — горизонтальный свайп со scroll-snap, без закрепления.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const stripCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const stripJs = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const css = stripCss(read('src/styles/sections/cases.css'));
const js = stripJs(read('src/sections/cases.js'));
const section = html.split(/<section\b[^>]*\sid="cases"/)[1].split(/<\/section>/)[0];

// всё вне @media (min-width: 900px) — базовые правила (мобильный / reduced / без JS)
const wideBlocks = [];
const base = css.replace(/@media\s*\(min-width:\s*900px\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, (_, body) => {
  wideBlocks.push(body);
  return '';
});
const wide = wideBlocks.join('\n');

test('разметка: сцена, вьюпорт с лентой, слово-фон из JSON, полоса прогресса', () => {
  assert.match(section, /data-cases-stage/);
  assert.match(section, /data-cases-viewport/);
  assert.match(section, /<ul\b[^>]*data-cases-grid/);
  assert.match(section, /data-cases-progress/);
  assert.match(section, /data-i18n="cases\.word"[^>]*>|data-cases-word[^>]*data-i18n="cases\.word"/);
  assert.match(section, /aria-hidden="true"[^>]*data-cases-word|data-cases-word[^>]*aria-hidden="true"/, 'слово-фон скрыто от скринридера');
  assert.match(section, /<dialog\b[^>]*data-case-modal/, 'модалка на месте');
});

test('слово-фон: «КЕЙСИ» / «CASES»; заголовок — широкий капс, вторая строка акцентом', () => {
  assert.equal(ua.cases.word, 'КЕЙСИ');
  assert.equal(en.cases.word, 'CASES');
  assert.match(section, /<h2\b[^>]*class="display cases__title"[^>]*data-i18n="cases\.title"/);
  assert.match(css, /\.cases__title::first-line\s*\{[^}]*color:\s*var\(--text\)/);
});

test('карточка: ниша-тег, название, бюджет, результат, CPA/CPS и номер', () => {
  const tpl = section.split('<template data-case-card>')[1].split('</template>')[0];
  for (const f of ['niche', 'name', 'budget', 'result', 'cpa']) assert.match(tpl, new RegExp(`data-f="${f}"`), f);
  assert.match(tpl, /data-case-num/);
  assert.match(tpl, /<button\b/, 'карточка — кнопка: Enter и Space открывают модалку');
});

test('мобильный и reduced-motion: горизонтальный свайп со scroll-snap, без закрепления', () => {
  assert.match(base, /\.cases__viewport\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(base, /scroll-snap-type:\s*x\s+mandatory/);
  assert.match(base, /scroll-snap-align:\s*start/);
  assert.doesNotMatch(base, /\.is-pinned/, 'закрепление — только внутри min-width: 900px');
  assert.doesNotMatch(css, /position:\s*sticky/, 'старой стопки нет');
});

test('широкий экран: закреплённая сцена режет переполнение, карточки разного размера', () => {
  assert.match(wide, /\.is-pinned/);
  assert.match(wide, /overflow:\s*clip/, 'лента шире экрана, но горизонтального скролла страницы нет');
  const sizes = new Set([...wide.matchAll(/--card-w:\s*([^;]+);/g)].map((m) => m[1].trim()));
  assert.ok(sizes.size >= 3, `ширины карточек: ${[...sizes]}`);
  assert.match(wide, /--card-dy:/, 'вертикальный сдвиг карточек');
  assert.match(css, /\.cases__item--featured[^{]*\{[^}]*--card-w/, 'Cryptonite крупнее');
});

test('движение: pin + scrub на (min-width: 900px), длина — по ширине ленты, только transform/opacity', () => {
  assert.match(js, /\(min-width:\s*900px\)/);
  assert.match(js, /pin:/);
  assert.match(js, /scrub:/);
  assert.match(js, /scrollWidth/, 'длина закрепления считается от ширины ленты');
  assert.match(js, /scaleX/, 'полоса прогресса растёт через scaleX');
  const animated = [...js.matchAll(/\b(?:to|fromTo|set)\([^)]*?\{([^}]*)\}/g)].map((m) => m[1]).join(',');
  for (const prop of ['width', 'height', 'left', 'top', 'filter', 'blur']) {
    assert.doesNotMatch(animated, new RegExp(`\\b${prop}\\s*:`), `анимируется ${prop}`);
  }
  assert.match(js, /motionReady/);
});

test('модалка работает как раньше: case_open, trapFocus, lockScroll, Esc', () => {
  assert.match(js, /track\('case_open'/);
  assert.match(js, /trapFocus\(/);
  assert.match(js, /lockScroll\(true\)/);
  assert.match(js, /'cancel'/);
});

test('клавиатура в ленте: стрелки переводят фокус между карточками', () => {
  assert.match(js, /ArrowRight/);
  assert.match(js, /ArrowLeft/);
});

test('длинные названия не рвутся посреди слова', () => {
  const rule = css.match(/\.cases__name\s*\{([^}]*)\}/)[1];
  assert.match(rule, /overflow-wrap:\s*normal/);
  assert.match(rule, /hyphens:\s*manual/);
  assert.match(rule, /cqi/, 'кегль от ширины карточки — самое длинное слово влезает');
});
