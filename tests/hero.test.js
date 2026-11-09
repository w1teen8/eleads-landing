// Первый экран — один, композиция бывшего варианта «Синий» (reference/run3/hero-keep.png): огромное «eLeads» за
// Володимиром без фона, слева заголовок и акцентная пилюля, справа цифры брифа и строка рекламы Telegram простым
// текстом. С T23 (H14) — в палитре канала, как весь сайт. Варианты «Кольцо» и «Самолётик», переключатель и dev-панель
// удалены (сборка 3, T18). Проверяется разметка, тексты из JSON, файлы, цвета экрана и правила движения.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { read, readJson, root } from './helpers.js';

const html = read('index.html');
const section = html.split(/<section\b[^>]*\sid="hero"/)[1].split('</section>')[0];
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const css = strip(read('src/styles/sections/hero.css'));
const js = strip(read('src/sections/hero.js'));
const get = (dict, path) => path.split('.').reduce((o, k) => o?.[k], dict);

test('варианты «Кольцо» и «Самолётик», переключатель и dev-панель удалены целиком — код, стили, ассеты, ключи, скрипт', () => {
  const gone = [
    'src/sections/hero-plane.js', 'src/sections/hero-plane-model.js', 'src/sections/hero-blue.js',
    'src/styles/sections/hero-plane.css', 'src/styles/sections/hero-blue.css', 'src/dev', 'scripts/encode-hero-v3.mjs',
    'tests/hero-plane.test.js', 'tests/hero-aether.test.js',
  ];
  for (const f of gone) assert.equal(existsSync(join(root, f)), false, f);
  const heroImg = readdirSync(join(root, 'public/img/hero'));
  assert.deepEqual(heroImg.filter((f) => !f.startsWith('volodymyr-blue-')), [], 'в public/img/hero — только фото экрана');
  assert.deepEqual(readdirSync(join(root, 'public/video')).filter((f) => f.startsWith('hero-v3')), []);
  assert.equal(readJson('package.json').scripts['encode:hero-v3'], undefined);
  assert.equal(readJson('src/data/config.json').heroV3, undefined);
  assert.doesNotMatch(section, /data-hero-variant|hero-plane|hero-blue|hero__ring|hero__planet|hero__card/);
  assert.doesNotMatch(js, /HERO_VARIANTS|heroVariant|initPlane|initBlue|sessionStorage|dataset\.hero\b/);
  for (const dict of [ua, en]) {
    for (const key of ['v3', 'v4', 'cards', 'scroll']) assert.equal(dict.hero[key], undefined, `hero.${key}`);
  }
});

test('разметка: H1, огромное «eLeads» из JSON, пилюля в Telegram, три цифры и реклама текстом — тексты из JSON', () => {
  assert.equal((section.match(/<h1\b/g) || []).length, 1);
  assert.match(section, /<h1 id="hero-title"/);
  assert.match(section, /data-i18n="hero\.word"/);
  assert.match(section, /class="[^"]*\bmono-label\b[^"]*"[^>]*data-i18n="hero\.eyebrow"/);
  assert.match(section, /<a\b[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="hero"[^>]*>[\s\S]*?data-i18n="hero\.cta"/);
  assert.match(section, /<a\b[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="hero_ad"[^>]*>[\s\S]*?data-i18n="hero\.ad\.button"/);
  const keys = [
    'eyebrow', 'subtitle', 'titleLine1', 'titleLine2', 'titleAccent', 'cta', 'photo.alt',
    'facts.budgets.label', 'facts.budgets.value', 'facts.years.label', 'facts.years.value', 'facts.projects.label', 'facts.projects.value',
    'ad.channel', 'ad.label', 'ad.title', 'ad.text', 'ad.button',
  ];
  for (const key of keys) {
    const k = key.replace(/\./g, '\\.');
    assert.match(section, new RegExp(`data-i18n="hero\\.${k}"|data-i18n-attr="alt:hero\\.${k}"`), key);
    for (const dict of [ua, en]) assert.ok(String(get(dict, `hero.${key}`) || '').trim(), `hero.${key}`);
  }
  assert.equal(ua.hero.word, 'eLeads');
  assert.equal(ua.hero.facts.budgets.value, ua.hero.stats.budgets.value, '$2M+ — цифра брифа');
  assert.equal(ua.hero.facts.years.value, ua.hero.stats.years.value, '7+ — цифра брифа');
  assert.match(ua.hero.titleAccent, /^Ads$/);
  assert.equal((section.match(/<li class="hero__fact\b/g) || []).length, 3, 'три цифры брифа');
  assert.doesNotMatch(section.replace(/<!--[\s\S]*?-->/g, ''), /[А-Яа-яЁёІіЇїЄєҐґ]/, 'ни одной фразы в HTML');
});

test('фото без фона — одна LCP-картинка: AVIF/WebP/PNG двух ширин с прозрачностью, eager + fetchpriority="high"', () => {
  for (const w of [720, 1200]) {
    for (const ext of ['avif', 'webp', 'png']) assert.ok(existsSync(join(root, `public/img/hero/volodymyr-blue-${w}.${ext}`)), `${w}.${ext}`);
    const png = readFileSync(join(root, `public/img/hero/volodymyr-blue-${w}.png`));
    assert.equal(png[25], 6, 'PNG RGBA — с альфой');
  }
  assert.equal((section.match(/<img\b/g) || []).length, 1);
  const img = section.match(/<img\b[^>]*>/)[0];
  assert.match(img, /\ssrc="\/img\/hero\/volodymyr-blue-720\.png"/);
  assert.match(img, /loading="eager"/);
  assert.match(img, /fetchpriority="high"/);
  assert.match(section, /<source type="image\/avif" srcset="[^"]*volodymyr-blue-720\.avif/);
});

// T23 (H14): «Перекрась весь сайт сразу в его палитру» — первый экран и шапка тоже: фон страницы #070C18 одним слоем,
// «eLeads» и текст #F4F2EC, «Ads», цифры и пилюли — жёлтый → оранжевый с тёмным текстом
test('цвета экрана — палитра канала: свой фон экран не рисует, «eLeads» светлым, «Ads», цифры и пилюли — акцентом', () => {
  for (const [, body] of css.matchAll(/\.hero__screen\s*\{([^}]*)\}/g)) assert.doesNotMatch(body, /background/, 'фон экрана — фон страницы');
  assert.match(css, /\.hero__word\s*\{[^}]*color:\s*var\(--text\)/, '«eLeads» — #F4F2EC');
  // H17: вся вторая строка «TELEGRAM ADS» — жёлтый → оранжевый
  assert.match(css, /\.hero__line:nth-child\(2\) \.hero__line-inner\s*\{[^}]*background:\s*var\(--grad\)/, '«TELEGRAM ADS» — жёлтый → оранжевый');
  assert.match(css, /\.hero__cta\s*\{[^}]*background:\s*var\(--grad\);[^}]*color:\s*var\(--accent-ink\)/, 'акцентная пилюля с тёмным текстом');
  assert.match(css, /\.hero__fact-value\s*\{[^}]*background:\s*var\(--grad\)/, 'цифры — акцентом');
  const header = strip(read('src/styles/sections/header.css'));
  assert.match(header, /\.header__cta\s*\{[^}]*background:\s*var\(--grad\);[^}]*color:\s*var\(--accent-ink\)/, '«Написати» — акцентная пилюля');
  // в CSS секций — только семантические переменные (имена палитры живут в tokens.css)
  for (const f of [css, header]) {
    assert.doesNotMatch(f, /var\(--(v4-[\w-]+|paper|ink|navy|card|fg|muted|sun|ember)\)/, 'не семантическая переменная');
  }
  assert.doesNotMatch(header, /data-hero/);
});

test('движение — только transform и opacity; появление после заставки; параллакс слова и фигуры за курсором', () => {
  for (const [, props] of css.matchAll(/transition(?:-property)?:\s*([^;]+);/g)) {
    for (const part of props.split(/,(?![^(]*\))/)) {
      const prop = part.trim().split(/\s+/)[0];
      assert.ok(['transform', 'opacity', 'none'].includes(prop), `transition: ${prop}`);
    }
  }
  assert.doesNotMatch(css, /filter\s*:|mix-blend-mode/);
  assert.match(js, /whenIntroDone/);
  assert.match(js, /hero--entering/);
  assert.match(section, /data-hero-visual/);
  assert.match(section, /data-depth="0\.12"/, 'параллакс слова');
  assert.match(section, /data-depth="0\.3"/, 'параллакс фигуры');
});

test('слово крупное и за фигурой; текст — под словом', () => {
  assert.match(css, /--word-fs:\s*2[4-9](\.\d+)?cqw/, 'слово почти на всю ширину сцены');
  assert.match(css, /\.hero__depth--word\s*\{[^}]*z-index:\s*1/);
  assert.match(css, /\.hero__depth--person\s*\{[^}]*z-index:\s*2/);
  // T23 (H17): заголовок шрифтом канала выше прежнего — колонка поднята до 56%, всё так же под буквами
  assert.match(css, /\.hero__copy\s*\{[^}]*top:\s*5[5-8]%/, 'левый блок под буквами');
  assert.match(css, /\.hero__side\s*\{[^}]*top:\s*58%/, 'цифры и реклама под буквами');
});
