// Первый экран, вариант 4 «blue» (?hero=4, G26/G27; макет reference/hero-v4/mockup.png): синий фон Telegram, огромное
// белое «eLeads» за Володимиром без фона, слева заголовок и белая пилюля, под буквами цифры брифа и строка рекламы
// Telegram простым текстом (без карточек). Вариант 1 «orbit» удалён. Проверяется разметка, тексты из JSON, файлы и правила движения.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { read, readJson, root } from './helpers.js';

const html = read('index.html');
const section = html.split(/<section\b[^>]*\sid="hero"/)[1].split('</section>')[0];
const blue = (section.split('data-hero-variant="blue"')[1] || '').split('data-hero-variant="plane"')[0];
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const css = existsSync(join(root, 'src/styles/sections/hero-blue.css')) ? strip(read('src/styles/sections/hero-blue.css')) : '';
const js = existsSync(join(root, 'src/sections/hero-blue.js')) ? strip(read('src/sections/hero-blue.js')) : '';
const heroJs = strip(read('src/sections/hero.js'));
const get = (dict, path) => path.split('.').reduce((o, k) => o?.[k], dict);

test('переключатель: mockup (по умолчанию), plane, blue; hero.js зовёт initBlue; dev-кнопки «Кольцо / Самолётик / Синий»', () => {
  assert.match(heroJs, /HERO_VARIANTS = \['mockup', 'plane', 'blue'\]/);
  assert.match(heroJs, /if \(variant === 'blue'\) \{[^}]*initBlue\(stage/);
  assert.match(css, /\[data-hero-variant='blue'\],\s*\[data-hero='blue'\] \[data-hero-variant='mockup'\]\s*\{\s*display:\s*none/);
  assert.match(css, /\[data-hero='blue'\] \[data-hero-variant='blue'\]\s*\{\s*display:\s*block/);
  const dev = read('src/dev/theme-switcher.js');
  assert.match(dev, /\{ id: 'mockup', label: 'Кольцо', param: '2' \}/);
  assert.match(dev, /\{ id: 'plane', label: 'Самолётик', param: '3' \}/);
  assert.match(dev, /\{ id: 'blue', label: 'Синий', param: '4' \}/);
});

test('вариант 1 «orbit» удалён: модуль, стили, разметка, тест, ключи hero.ads; общие ключи варианта 3 остались', () => {
  for (const f of ['src/sections/hero-orbit.js', 'src/styles/sections/hero-orbit.css', 'tests/hero-orbit.test.js']) {
    assert.equal(existsSync(join(root, f)), false, f);
  }
  assert.doesNotMatch(section, /data-hero-variant="orbit"|hero-orbit/);
  assert.doesNotMatch(heroJs, /orbit/i);
  assert.doesNotMatch(read('src/dev/theme-switcher.js'), /orbit/);
  assert.doesNotMatch(read('src/styles/sections/photos.css'), /hero-orbit/);
  for (const dict of [ua, en]) {
    assert.equal(dict.hero.ads, undefined, 'hero.ads');
    assert.ok(dict.hero.word && dict.hero.scroll, 'hero.word / hero.scroll нужны варианту 3');
  }
});

test('разметка: заголовок ролью H1, огромное «eLeads» из JSON, пилюля в Telegram, строка цифр и реклама текстом — тексты из JSON', () => {
  assert.ok(blue, 'data-hero-variant="blue"');
  assert.match(blue, /id="hero-title-blue"[^>]*role="heading" aria-level="1"/);
  assert.equal((blue.match(/<h1\b/g) || []).length, 0, 'H1 страницы — в варианте 2');
  assert.match(blue, /data-i18n="hero\.v4\.word"/);
  assert.match(blue, /class="[^"]*\bmono-label\b[^"]*"[^>]*data-i18n="hero\.eyebrow"/);
  assert.match(blue, /data-i18n="hero\.subtitle"/);
  assert.match(blue, /<a\b[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="hero"[^>]*>[\s\S]*?data-i18n="hero\.v4\.cta"/);
  assert.match(blue, /<a\b[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="hero_ad"[^>]*>[\s\S]*?data-i18n="hero\.v4\.ad\.button"/);
  const keys = [
    'titleLine1', 'titleLine2', 'titleAccent', 'cta',
    'cards.budgets.label', 'cards.budgets.value', 'cards.years.label', 'cards.years.value', 'cards.projects.label', 'cards.projects.value',
    'ad.tag', 'ad.title', 'ad.text', 'ad.button',
  ];
  for (const key of keys) {
    assert.match(blue, new RegExp(`data-i18n="hero\\.v4\\.${key.replace(/\./g, '\\.')}"`), key);
    for (const dict of [ua, en]) assert.ok(String(get(dict, `hero.v4.${key}`) || '').trim(), `hero.v4.${key}`);
  }
  assert.equal(ua.hero.v4.word, 'eLeads');
  assert.equal(ua.hero.v4.cards.budgets.value, ua.hero.stats.budgets.value, '$2M+ — цифра брифа');
  assert.equal(ua.hero.v4.cards.years.value, ua.hero.stats.years.value, '7+ — цифра брифа');
  assert.match(ua.hero.v4.titleAccent, /^Ads$/);
  assert.equal((blue.match(/<svg\b/g) || []).length >= 2, true, 'стрелки — инлайн-SVG');
  // нижняя строка: три цифры + реклама — простой текст, без белых плашек и теней
  assert.equal((blue.match(/<li class="hero-blue__stat\b/g) || []).length, 3, 'три цифры брифа');
  assert.doesNotMatch(blue, /hero-blue__card|hero-blue__float|hero-blue__icon/, 'карточек и иконок-плашек нет');
  assert.doesNotMatch(css, /hero-blue__(card|float|icon)/, 'в CSS нет карточек');
  assert.match(css, /\.hero-blue__stat-value\s*\{[^}]*color:\s*var\(--paper\)/, 'цифры — светлым на синем');
  assert.match(css, /\.hero-blue__ad-btn\s*\{[^}]*text-decoration:\s*underline/, '«Переглянути» — текстовая ссылка');
  assert.doesNotMatch(css.replace(/\.hero-blue__cta\s*\{[^}]*\}/, ''), /box-shadow/, 'теней нет (кроме пилюли)');
  assert.doesNotMatch(blue.replace(/<!--[\s\S]*?-->/g, ''), /[А-Яа-яЁёІіЇїЄєҐґ]/, 'ни одной фразы в HTML');
});

test('фото без фона: файлы в public с прозрачностью; в HTML нет src — медиа ставит hero-blue.js только в варианте 4', () => {
  for (const w of [720, 1200]) {
    for (const ext of ['avif', 'webp', 'png']) assert.ok(existsSync(join(root, `public/img/hero/volodymyr-blue-${w}.${ext}`)), `${w}.${ext}`);
    const png = readFileSync(join(root, `public/img/hero/volodymyr-blue-${w}.png`));
    assert.equal(png[25], 6, 'PNG RGBA — с альфой');
  }
  assert.match(blue, /data-srcset="[^"]*volodymyr-blue-720\.avif/);
  assert.doesNotMatch(blue, /<(img|source)\b[^>]*\s(src|srcset)=/, 'без src/srcset в HTML');
  assert.match(js, /export function initBlue/);
  assert.match(js, /dataset\.srcset/);
  assert.match(js, /whenIntroDone/);
});

test('цвета варианта 4 — свои (--v4-* в tokens.css); шапка меняется только при data-hero="blue"', () => {
  assert.doesNotMatch(css, /:root|\[data-theme/, 'палитра не трогает темы');
  assert.match(css, /\.hero-blue\s*\{[^}]*background:\s*var\(--v4-bg\)/);
  const tokens = read('src/styles/tokens.css');
  const themes = tokens.split(/\[data-theme=/).slice(1).join('');
  assert.doesNotMatch(themes, /--v4-/, 'темы brand/aether не ссылаются на палитру варианта 4');
  const header = strip(read('src/styles/sections/header.css'));
  const blueRules = [...header.matchAll(/([^{}]+)\{[^{}]*\}/g)].map((m) => m[1].trim()).filter((s) => s.includes('blue'));
  assert.ok(blueRules.length >= 3, 'облик шапки варианта 4');
  for (const sel of blueRules) {
    for (const part of sel.split(',')) assert.match(part.trim(), /^\[data-hero='blue'\]/, part);
  }
});

test('движение варианта 4 — только transform и opacity; карточки не плавают; параллакс слова и фигуры за курсором', () => {
  assert.ok(css, 'hero-blue.css');
  for (const [, props] of css.matchAll(/transition(?:-property)?:\s*([^;]+);/g)) {
    for (const part of props.split(/,(?![^(]*\))/)) {
      const prop = part.trim().split(/\s+/)[0];
      assert.ok(['transform', 'opacity', 'none'].includes(prop), `transition: ${prop}`);
    }
  }
  for (const [, body] of css.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?)\}\s*\}/g)) {
    assert.doesNotMatch(body, /\b(top|left|width|height|margin|filter)\s*:/);
  }
  assert.doesNotMatch(css, /animation:|@keyframes/, 'плавающих карточек больше нет');
  assert.doesNotMatch(css, /filter\s*:|mix-blend-mode/);
  assert.match(blue, /data-hero-visual/);
  assert.match(blue, /data-depth="0\.12"/, 'параллакс слова');
  assert.match(blue, /data-depth="0\.3"/, 'параллакс фигуры');
});

test('слово крупное и за фигурой; ничто, кроме фигуры, не заходит на буквы (текст — под словом)', () => {
  assert.match(css, /--word-fs:\s*2[4-9](\.\d+)?cqw/, 'слово почти на всю ширину сцены');
  assert.match(css, /\.hero-blue__depth--word\s*\{[^}]*z-index:\s*1/);
  assert.match(css, /\.hero-blue__depth--person\s*\{[^}]*z-index:\s*2/);
  assert.match(css, /\.hero-blue__copy\s*\{[^}]*top:\s*58%/, 'левый блок под буквами');
  assert.match(css, /\.hero-blue__side\s*\{[^}]*top:\s*58%/, 'цифры и реклама под буквами');
});
