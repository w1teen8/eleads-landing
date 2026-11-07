// Первый экран, вариант 1 «orbit» (?hero=1): прежний «ELEADS + влёт», но вместо планеты — огромный значок Telegram
// (свой SVG в цветах темы), вокруг парят окошки рекламы Telegram Ads. Переключение — data-hero на <html>/секции,
// активен только один вариант. Проверяется разметка, тексты из JSON и правила движения.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const section = html.split(/<section\b[^>]*\sid="hero"/)[1].split('</section>')[0];
const orbit = section.split('data-hero-variant="orbit"')[1] || '';
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const css = strip(read('src/styles/sections/hero-orbit.css'));
const heroCss = strip(read('src/styles/sections/hero.css'));
const js = strip(read('src/sections/hero-orbit.js'));
const heroJs = strip(read('src/sections/hero.js'));

test('переключатель: по умолчанию виден mockup, при data-hero="orbit" — orbit; инициализируется только активный', () => {
  assert.match(heroCss, /\[data-hero-variant='orbit'\],\s*\[data-hero='orbit'\] \[data-hero-variant='mockup'\]\s*\{\s*display:\s*none/);
  assert.match(heroCss, /\[data-hero='orbit'\] \[data-hero-variant='orbit'\]\s*\{\s*display:\s*block/);
  assert.match(heroJs, /if \(variant === 'orbit'\) \{\s*initOrbit\(stage\);\s*return;/);
  assert.match(heroJs, /export function heroVariant/);
});

test('сцена 1: «ELEADS» из JSON поверх значка Telegram (инлайн-SVG в цветах темы), без картинки-логотипа', () => {
  assert.equal(ua.hero.word, 'ELEADS');
  assert.equal(en.hero.word, 'ELEADS');
  assert.match(orbit, /data-i18n="hero\.word"/);
  const mark = orbit.match(/class="hero-orbit__planet hero-orbit__mark"[\s\S]*?<\/svg>/)?.[0] || '';
  assert.match(mark, /<svg\b/);
  assert.match(mark, /var\(--accent\)/);
  assert.doesNotMatch(mark, /<img\b|telegram logo|card-telegram/);
  assert.doesNotMatch(orbit, /class="planet\b/, 'планеты в варианте 1 больше нет');
});

test('окошки рекламы Telegram Ads: шапка с меткой, текст, кнопка — из hero.ads (UA/EN), плавают transform-ом', () => {
  const ads = orbit.match(/class="hero-orbit__ad hero-orbit__ad--\d"/g) || [];
  assert.ok(ads.length >= 3, `окошек ${ads.length}`);
  for (let i = 0; i < ads.length; i++) {
    for (const part of ['name', 'tag', 'text', 'button']) assert.match(orbit, new RegExp(`data-i18n="hero\\.ads\\.${i}\\.${part}"`));
    for (const dict of [ua, en]) assert.ok(String(dict.hero.ads?.[i]?.text || '').trim(), `hero.ads.${i}.text`);
  }
  assert.equal(ua.hero.ads[0].tag, 'Реклама');
  const kf = css.match(/@keyframes\s+hero-orbit-float\s*\{([\s\S]*?)\}\s*\}/)?.[1] || '';
  assert.match(kf, /translate3d/);
  assert.doesNotMatch(kf, /\b(top|left|margin|filter)\s*:/);
  const live = css.match(/@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(live, /animation:\s*hero-orbit-float/);
});

test('сценарий прокрутки сохранён: закрепление ≥900px, буквы, рост значка, круглое окно с фото DSC_3087 (lazy)', () => {
  assert.match(js, /'\(min-width:\s*900px\)'/);
  assert.match(js, /pin:\s*true/);
  assert.match(js, /scrub/);
  assert.match(js, /\breduced\b/);
  assert.match(orbit, /class="hero-orbit__window"/);
  assert.match(orbit, /class="hero-orbit__window-inner"/);
  const photo = orbit.match(/<img\b[^>]*volodymyr-cta-[^>]*>/)?.[0] || '';
  assert.match(photo, /loading="lazy"/, 'в варианте 2 фото окна не грузится');
  assert.doesNotMatch(photo, /fetchpriority/);
  assert.equal((orbit.match(/<h1\b/g) || []).length, 0, 'H1 на странице один — в варианте 2');
  assert.match(orbit, /role="heading" aria-level="1"[^>]*>|id="hero-title-orbit"[^>]*role="heading"/);
  assert.doesNotMatch(css, /clip-path|filter\s*:/);
});
