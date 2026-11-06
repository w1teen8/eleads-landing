// Плагин пре-рендера: украинский текст вписывается в [data-i18n] при сборке.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prerender } from '../build/i18n-prerender.js';

const dict = {
  hero: { title: 'ПРОСУВАННЯ <ЧЕРЕЗ> & "TELEGRAM"', items: ['Finmap', 'Monolit'] },
  meta: { description: 'Опис "сайту"' },
  nav: { menu: 'Меню' },
};
const config = { telegramUrl: 'https://t.me/Kucherflow' };

test('вписывает текст в пустой узел и экранирует HTML', () => {
  const out = prerender('<h1 class="x" data-i18n="hero.title"></h1>', dict, config);
  assert.equal(out, '<h1 class="x" data-i18n="hero.title">ПРОСУВАННЯ &lt;ЧЕРЕЗ&gt; &amp; "TELEGRAM"</h1>');
});

test('берёт элемент массива по числовому индексу', () => {
  const out = prerender('<li data-i18n="hero.items.1"></li>', dict, config);
  assert.equal(out, '<li data-i18n="hero.items.1">Monolit</li>');
});

test('заполняет атрибуты из data-i18n-attr — и новый, и существующий', () => {
  const out = prerender(
    '<meta name="description" content="" data-i18n-attr="content:meta.description"><button data-i18n-attr="aria-label:nav.menu;title:nav.menu"></button>',
    dict,
    config,
  );
  assert.equal(
    out,
    '<meta name="description" content="Опис &quot;сайту&quot;" data-i18n-attr="content:meta.description"><button aria-label="Меню" title="Меню" data-i18n-attr="aria-label:nav.menu;title:nav.menu"></button>',
  );
});

test('подставляет значения конфига в {{config.*}}', () => {
  const out = prerender('<a href="{{config.telegramUrl}}"></a>', dict, config);
  assert.equal(out, '<a href="https://t.me/Kucherflow"></a>');
});

test('в строгом режиме падает и называет отсутствующий ключ', () => {
  assert.throws(
    () => prerender('<p data-i18n="hero.nope"></p><p data-i18n-attr="title:x.y"></p>', dict, config, { strict: true }),
    (err) => err.message.includes('hero.nope') && err.message.includes('x.y'),
  );
});

test('в мягком режиме оставляет ключ видимым текстом', () => {
  const out = prerender('<p data-i18n="hero.nope"></p>', dict, config, { strict: false, warn: () => {} });
  assert.equal(out, '<p data-i18n="hero.nope">hero.nope</p>');
});

test('сборка кладёт robots.txt в dist (иначе хостинг отдаёт index.html вместо него)', async () => {
  const { build } = await import('vite');
  const out = await build({ logLevel: 'silent', build: { write: false } });
  const bundle = (Array.isArray(out) ? out[0] : out).output;
  const robots = bundle.find((f) => f.fileName === 'robots.txt');
  assert.ok(robots, 'robots.txt не попал в сборку');
  assert.match(String(robots.source), /^User-agent: \*\s+Allow: \//);
});
