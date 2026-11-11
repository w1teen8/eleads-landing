// Сборка 2 — Aether: ленты крест-накрест после первого экрана (G16) и подвал с вордмарком,
// буквы которого поднимаются по одной (G15).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

test('ленты: секция без id сразу после #hero, две полосы с бегущими дорожками', () => {
  const afterHero = html.split(/<section\b[^>]*\sid="hero"/)[1].split('</section>').slice(1).join('</section>');
  const next = afterHero.match(/<section\b[^>]*>/)[0];
  assert.match(next, /data-section="ribbons"/);
  assert.doesNotMatch(next, /\sid=/, 'id сдвинул бы номера секций и якоря');
  const ribbons = afterHero.split('</section>')[0];
  assert.equal((ribbons.match(/class="ribbons__band\b/g) || []).length, 2);
  assert.equal((ribbons.match(/class="ribbons__track"/g) || []).length, 2);
  assert.match(ribbons, /<svg\b/, 'значок между словами — SVG');
});

// T23 (H13): акцентная лента — «Мені довіряють» (hero.trusted), тёмная — факты (ribbons.top)
test('ленты: тексты из content.*.json — ribbons.top и hero.trusted, UA и EN одной длины', () => {
  for (const dict of [ua, en]) {
    assert.ok(Array.isArray(dict.ribbons?.top) && dict.ribbons.top.length >= 3, 'ribbons.top');
    assert.ok(Array.isArray(dict.hero?.trusted?.items) && dict.hero.trusted.items.length >= 3, 'hero.trusted.items');
    assert.ok(String(dict.hero.trusted.title || '').trim(), 'hero.trusted.title');
  }
  assert.equal(ua.ribbons.top.length, en.ribbons.top.length);
  assert.equal(ua.hero.trusted.items.length, en.hero.trusted.items.length);
  assert.ok(ua.ribbons.top.includes('TELEGRAM ADS'));
});

test('ленты: бегут через motion.marquee в разные стороны; две в ряд ровно, без наклона (выбор P1)', async () => {
  const js = read('src/sections/ribbons.js');
  assert.match(js, /import\s*\{[^}]*\bmarquee\b[^}]*\}\s*from\s*'\.\.\/core\/motion\.js'/);
  const css = strip(read('src/styles/sections/ribbons.css'));
  // 2026-11-11: «А если просто две линии в ряд поставить … прям под руки владимиру»
  assert.doesNotMatch(css, /rotate\(/, 'полосы не наклонены');
  assert.match(css, /\.ribbons \{[^}]*flex-direction: column/, 'одна под другой');
  assert.doesNotMatch(css, /\.ribbons \{[^}]*min-height/, 'без пустых полей под концы наклонных полос');
  // «Полоски еще выше поставь»: подъём на низ фото — на свободное место под кнопкой и карточкой минус зазор
  assert.match(css, /margin-top: calc\(-1 \* var\(--rb-lift, 0px\)\)/);
  const { liftFor, LIFT_GAP } = await import('../src/sections/ribbons.js');
  assert.equal(LIFT_GAP, 20);
  assert.equal(liftFor(937, [864, 860]), 53, 'по самому нижнему элементу');
  assert.equal(liftFor(720, [705]), 0, 'места нет — не поднимаем');
  assert.equal(liftFor(900, []), 0);
});

test('подвал (T31): компактный — логотип словом, ссылки, Telegram, ©, UA/EN, строка автора', () => {
  const footer = html.match(/<footer class="footer"[\s\S]*?<\/footer>/)[0];
  assert.match(footer, /data-i18n="footer\.tagline"/);
  assert.ok((footer.match(/class="footer__col\b/g) || []).length >= 2, 'колонки');
  assert.match(footer, /href="\{\{config\.telegramUrl\}\}"[^>]*data-place="footer"/);
  assert.match(footer, /data-i18n="footer\.copyright"/);
  assert.match(footer, /data-lang-switch/);
  assert.match(footer, /data-i18n="footer\.creditLabel"/);
  assert.match(footer, /data-wordmark[^>]*data-i18n="common\.brand"|data-i18n="common\.brand"[^>]*data-wordmark/);
  assert.ok((footer.match(/class="footer__link"/g) || []).length >= 10, 'ссылки на разделы одной строкой');
});

test('подвал (T31): без «подъёма букв», огромного вордмарка и эффектов появления — правило клиента и H11', () => {
  const footer = html.match(/<footer class="footer"[\s\S]*?<\/footer>/)[0];
  assert.doesNotMatch(footer, /footer__wordmark|footer__glow|footer__orbit|data-reveal/);
  const js = strip(read('src/sections/footer.js'));
  assert.doesNotMatch(js, /wordmarkLetters|IntersectionObserver|footer__char/);
  const css = strip(read('src/styles/sections/footer.css'));
  assert.doesNotMatch(css, /footer__char|\.is-in|translate3d\(0,\s*1\d\d%/);
});
