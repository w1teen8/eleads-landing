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

test('ленты: тексты из content.*.json → ribbons, UA и EN одной длины', () => {
  for (const dict of [ua, en]) {
    for (const row of ['top', 'bottom']) {
      assert.ok(Array.isArray(dict.ribbons?.[row]) && dict.ribbons[row].length >= 3, `ribbons.${row}`);
    }
  }
  assert.equal(ua.ribbons.top.length, en.ribbons.top.length);
  assert.equal(ua.ribbons.bottom.length, en.ribbons.bottom.length);
  assert.ok(ua.ribbons.top.includes('TELEGRAM ADS'));
});

test('ленты: бегут через motion.marquee в разные стороны, полосы наклонены ±3–4°', async () => {
  const js = read('src/sections/ribbons.js');
  assert.match(js, /import\s*\{[^}]*\bmarquee\b[^}]*\}\s*from\s*'\.\.\/core\/motion\.js'/);
  const css = strip(read('src/styles/sections/ribbons.css'));
  const angles = [...css.matchAll(/rotate\((-?\d+(?:\.\d+)?)deg\)/g)].map((m) => Number(m[1]));
  assert.ok(angles.some((a) => a <= -3 && a >= -4) && angles.some((a) => a >= 3 && a <= 4), `углы: ${angles}`);
});

test('подвал: колонки ссылок, абзац, Telegram, ©, UA/EN, строка автора и вордмарк из словаря', () => {
  const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)[0];
  assert.match(footer, /data-i18n="footer\.tagline"/);
  assert.ok((footer.match(/class="footer__col\b/g) || []).length >= 2, 'колонки ссылок');
  assert.match(footer, /href="\{\{config\.telegramUrl\}\}"[^>]*data-place="footer"/);
  assert.match(footer, /data-i18n="footer\.copyright"/);
  assert.match(footer, /data-lang-switch/);
  assert.match(footer, /data-i18n="footer\.creditLabel"/);
  assert.match(footer, /data-wordmark[^>]*data-i18n="common\.brand"|data-i18n="common\.brand"[^>]*data-wordmark/);
});

test('подвал: буквы вордмарка — по одной, акцент и белый чередуются, первая — акцент', async () => {
  globalThis.window ??= { location: { search: '' }, addEventListener() {} };
  const { wordmarkLetters } = await import('../src/sections/footer.js');
  assert.deepEqual(wordmarkLetters('eLeads'), [
    { char: 'E', accent: true },
    { char: 'L', accent: false },
    { char: 'E', accent: true },
    { char: 'A', accent: false },
    { char: 'D', accent: true },
    { char: 'S', accent: false },
  ]);
  assert.deepEqual(wordmarkLetters(''), []);
});

test('подвал: буквы прячутся только под .js-anim и до .is-in — без JS и при reduced-motion видны', () => {
  const css = strip(read('src/styles/sections/footer.css'));
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, sel, body]) => /footer__char/.test(sel) && /translate3d\(0,\s*1\d\d%/.test(body));
  assert.ok(rules.length > 0, 'нет начального состояния букв');
  for (const [, sel] of rules) {
    for (const part of sel.split(',')) {
      assert.match(part, /\.js-anim/, `без .js-anim: ${part.trim()}`);
      assert.match(part, /:not\(\.is-in\)/, `без выхода: ${part.trim()}`);
    }
  }
});
