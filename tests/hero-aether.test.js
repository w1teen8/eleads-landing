// Первый экран, вариант 2 «mockup» (по умолчанию; G18, история 87): слева наклонный H1, абзац с чертой,
// пилюля; справа Володимир без фона на тёмной планете, горящее кольцо с семью переливами — задняя часть за планетой
// и фигурой, передняя перед ними; вокруг — присланные PNG-карточки и стеклянная «Цільова аудиторія».
// Проверяется разметка, тексты из JSON, файлы и правила движения — то, что видно без браузера.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const section = html.split(/<section\b[^>]*\sid="hero"/)[1].split('</section>')[0];
// вариант 2 — до обёртки варианта 1; «Мені довіряють» — общий, после обоих
const hero = section.split('data-hero-variant="orbit"')[0];
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const css = strip(read('src/styles/sections/hero.css'));
const js = strip(read('src/sections/hero.js'));
const CARDS = ['views', 'subscribers', 'campaigns', 'growth', 'telegram'];

test('текст слева: метка моно, H1 тремя строками из маски («Telegram Ads» акцентом), абзац, CTA, три цифры брифа', () => {
  assert.match(hero, /data-hero-variant="mockup"/);
  assert.match(hero, /class="[^"]*\bmono-label\b[^"]*"[^>]*data-i18n="hero\.eyebrow"/);
  const h1 = hero.match(/<h1\b[\s\S]*?<\/h1>/)[0];
  assert.equal((h1.match(/class="hero__line"/g) || []).length, 3);
  for (const key of ['titleLine1', 'titleLine2']) assert.match(h1, new RegExp(`data-i18n="hero\\.${key}"`));
  assert.match(h1, /display__accent[^>]*data-i18n="hero\.titleAccent"/);
  assert.match(hero, /class="hero__subtitle"[^>]*data-i18n="hero\.subtitle"/);
  assert.match(hero, /<a\b[^>]*class="[^"]*\bbtn--pill\b[^"]*"[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="hero"/);
  assert.equal((hero.match(/data-count\b/g) || []).length, 3);
  assert.equal((section.match(/data-i18n="hero\.trusted\.items\.\d"/g) || []).length, 7, '«Мені довіряють» — 7 имён, один раз');
});

test('Володимир без фона: одна LCP-картинка volodymyr-cutout с fetchpriority="high", файлы с прозрачностью в public', () => {
  const lcp = html.match(/<img\b[^>]*fetchpriority="high"[^>]*>/g) || [];
  assert.equal(lcp.length, 1, 'fetchpriority="high" — ровно у одной картинки на странице');
  assert.match(lcp[0], /volodymyr-cutout-/);
  assert.match(lcp[0], /loading="eager"/);
  assert.equal((section.match(/volodymyr-cutout-720\.avif/g) || []).length, 1, 'фото подключено один раз');
  for (const w of [720, 1200]) {
    for (const ext of ['webp', 'avif', 'png']) {
      assert.ok(existsSync(`public/img/hero/volodymyr-cutout-${w}.${ext}`), `нет volodymyr-cutout-${w}.${ext}`);
    }
  }
});

test('карточки — присланные PNG: <picture> WebP + PNG в двух ширинах, lazy, alt из hero.cards (UA/EN)', () => {
  for (const id of CARDS) {
    const card = hero.match(new RegExp(`<picture\\b[^>]*data-card="${id}"[\\s\\S]*?</picture>`));
    assert.ok(card, `нет карточки ${id}`);
    assert.match(card[0], /type="image\/webp"/);
    assert.match(card[0], /loading="lazy"/, `${id}: в скрытом варианте не грузится`);
    assert.match(card[0], new RegExp(`data-i18n-attr="alt:hero\\.cards\\.${id}\\.alt"`));
    const files = [...card[0].matchAll(/\/img\/hero\/([\w-]+\.(?:webp|png))/g)].map((m) => m[1]);
    assert.ok(files.length >= 4, `${id}: ожидаются две ширины WebP и PNG`);
    for (const f of files) assert.ok(existsSync(`public/img/hero/${f}`), `нет файла ${f}`);
    for (const dict of [ua, en]) assert.ok(String(dict.hero.cards?.[id]?.alt || '').trim(), `alt ${id}`);
    assert.notEqual(ua.hero.cards[id].alt, en.hero.cards[id].alt, `${id}: EN не переведён`);
  }
});

test('«Цільова аудиторія» — HTML-стекло с инлайн-SVG, подпись из JSON (UA/EN)', () => {
  const card = hero.match(/class="hero__card hero__card--audience"[\s\S]*?<\/div><\/div>/);
  assert.ok(card, 'нет карточки audience');
  assert.match(card[0], /data-i18n="hero\.cards\.audience\.label"/);
  assert.equal((card[0].match(/<svg\b/g) || []).length, 2, 'иконки людей и мишени');
  assert.equal(ua.hero.cards.audience.label, 'Цільова аудиторія');
  assert.equal(en.hero.cards.audience.label, 'Target audience');
});

test('слои: заднее кольцо → планета → фото → переднее кольцо; переливы — вращение слоя, не dashoffset', () => {
  const order = ['ring-back-1x', 'planet-1x', 'volodymyr-cutout-', 'ring-front-1x'].map((k) => hero.indexOf(k));
  assert.ok(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), `порядок слоёв нарушен: ${order}`);
  assert.equal((hero.match(/class="hero__glints"/g) || []).length, 2, 'переливы в обеих половинах');
  for (const half of hero.match(/<span class="hero__glints">[\s\S]*?<\/div>/g)) {
    assert.equal((half.match(/class="hero__glint"/g) || []).length, 7, 'семь переливов');
  }
  assert.doesNotMatch(hero, /hero__comet/, 'не точки-кометы');
  assert.doesNotMatch(css + js, /stroke-dash|strokeDash|offset-path|offset-distance/);
  const spin = css.match(/@keyframes\s+hero-ring-spin\s*\{([\s\S]*?)\}\s*\}/);
  assert.ok(spin, 'нет @keyframes hero-ring-spin');
  assert.match(spin[1], /rotate\(/);
  // семь дуг через 360°/7, картинка дуги, вращается обёртка
  assert.match(css, /\.hero__glint\s*\{[^}]*rotate\(calc\(var\(--i\) \* 51\.4286deg\)\)[^}]*ring-glint\.webp/);
  assert.match(css, /\.js-anim \.hero__glints\s*\{\s*animation: hero-ring-spin/);
  assert.ok(existsSync('public/img/hero/ring-glint.webp') && existsSync('public/img/hero/ring-glint.png'));
  assert.doesNotMatch(css, /repeating-conic|mask(-image)?\s*:[^;]*(conic|radial)/, 'без тяжёлых масок');
});

test('планета и кольцо — заранее отрисованные слои с прозрачностью (AVIF/WebP 1×/2× + PNG), WebP ≤ 250 КБ', () => {
  for (const name of ['ring-back', 'planet', 'ring-front']) {
    for (const f of [`${name}-1x.avif`, `${name}-2x.avif`, `${name}-1x.webp`, `${name}-2x.webp`, `${name}-1x.png`]) {
      assert.ok(existsSync(`public/img/hero/${f}`), `нет ${f}`);
      assert.match(hero, new RegExp(f.replace('.', '\\.')), `${f} не подключён`);
    }
    assert.ok(statSync(`public/img/hero/${name}-2x.webp`).size <= 250 * 1024, `${name}-2x.webp тяжелее 250 КБ`);
  }
  assert.doesNotMatch(css, /\.hero__ring-line|\.hero__ring-glow|planet__body/, 'кольцо и планета больше не рисуются CSS-градиентами');
});

test('движение: параллакс только с мышью от 900px; плавание и кометы — только без reduced-motion; без закрепления', () => {
  assert.match(js, /\(min-width:\s*900px\)/);
  assert.match(js, /pointer:\s*fine/);
  assert.match(js, /\breduced\b/);
  assert.doesNotMatch(js, /pin:\s*true/);
  const live = css.match(/@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(live, /\.js-anim \.hero__card-float\s*\{[^}]*animation:\s*hero-float/);
  assert.match(live, /hero-ring-spin/);
  assert.equal((css.match(/animation:/g) || []).length, (live.match(/animation:/g) || []).length, 'анимация вне no-preference');
  assert.doesNotMatch(css, /transition[^;]*\b(width|height|top|left|filter)\b/);
  assert.doesNotMatch(css, /filter\s*:|mix-blend-mode/, 'фильтры и смешивание на первом экране тормозят');
});

test('десктоп: холст варианта 2 — на весь экран (100vw × 100svh), без пропорциональной коробки и контейнера 1800px', () => {
  const desk = css.split(/@media \(min-width: 900px\) \{/)[1] || '';
  const canvas = desk.match(/\.hero__canvas\s*\{([^}]*)\}/)?.[1] || '';
  assert.match(canvas, /height:[^;]*100svh/, 'высота холста — от высоты экрана');
  assert.match(canvas, /container-type:\s*size/, 'элементы считаются от ширины и высоты сцены');
  assert.doesNotMatch(canvas, /aspect-ratio|max-width/, 'холст не ограничен пропорцией или контейнером');
  assert.doesNotMatch(section.split('data-hero-variant="orbit"')[0], /class="[^"]*\bcontainer\b/, 'вариант 2 не в .container');
});
