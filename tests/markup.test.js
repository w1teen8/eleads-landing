// Общая разметка из interfaces.md: 14 секций с id, тексты только из JSON, SEO-теги.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { prerender } from '../build/i18n-prerender.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const config = readJson('src/data/config.json');

const SECTION_IDS = [
  'hero', 'stats', 'niches', 'formats', 'calculator', 'cases', 'process', 'geo',
  'targeting', 'reviews', 'ecosystem', 'materials', 'faq', 'cta',
];

// Исходник без скриптов, стилей, <noscript> и комментариев.
const stripped = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

test('14 секций с id из interfaces.md, в порядке вайрфрейма', () => {
  const ids = [...html.matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, SECTION_IDS);
});

test('у каждой секции после hero — eyebrow и H2 из словаря секции', () => {
  for (const id of SECTION_IDS.slice(1)) {
    const block = html.split(new RegExp(`<section\\b[^>]*\\sid="${id}"`))[1].split('</section>')[0];
    assert.match(block, new RegExp(`class="[^"]*\\beyebrow\\b[^"]*"[^>]*data-i18n="${id}\\.eyebrow"`), `${id}: нет eyebrow`);
    assert.match(block, new RegExp(`<h2\\b[^>]*data-i18n="${id}\\.title"`), `${id}: нет H2`);
  }
});

test('ровно один <h1>, и он в hero', () => {
  const h1 = html.match(/<h1\b/g) || [];
  assert.equal(h1.length, 1);
  const hero = html.split(/<section\b[^>]*\sid="hero"/)[1].split('</section>')[0];
  assert.match(hero, /<h1\b/);
});

test('в исходнике нет ни одной фразы: текстовые узлы и атрибуты без букв', () => {
  // {{config.*}} — данные из config.json (адрес и ник Telegram), не фраза
  const textNodes = [...stripped.matchAll(/>([^<]+)</g)]
    .map((m) => m[1].replace(/\{\{\s*config\.[\w.]+\s*\}\}/g, '').trim())
    .filter(Boolean);
  const withLetters = textNodes.filter((s) => /\p{L}/u.test(s));
  assert.deepEqual(withLetters, []);
  const attrs = [...stripped.matchAll(/\s(alt|aria-label|title|placeholder|content)="([^"]*)"/g)]
    .filter(([, name, value]) => name !== 'content' || !/^(width|initial|website|summary|#|\/|\d)/.test(value))
    .filter(([, , value]) => /\p{L}/u.test(value) && !value.startsWith('{{'))
    .map(([full]) => full.trim());
  assert.deepEqual(attrs, []);
});

test('все ключи разметки есть и в UA, и в EN', () => {
  assert.doesNotThrow(() => prerender(html, ua, config, { strict: true }));
  assert.doesNotThrow(() => prerender(html, en, config, { strict: true }));
});

test('после пре-рендера не остаётся пустых [data-i18n]', () => {
  const out = prerender(html, ua, config, { strict: true });
  const empty = [...out.matchAll(/<([a-z0-9]+)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>\s*<\/\1>/g)].map((m) => m[2]);
  assert.deepEqual(empty, []);
  assert.match(out, /Просування/); // сборка 2: заголовок в обычном регистре
  assert.match(out, /© 2026 eLeads/);
});

test('каждая ссылка в Telegram размечена местом клика для аналитики', () => {
  const links = [...html.matchAll(/<a\b[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*>/g)].map((m) => m[0]);
  assert.ok(links.length >= 4, 'ожидаются ссылки шапки, меню, hero и подвала');
  for (const tag of links) assert.match(tag, /\sdata-place="[a-z_]+"/, tag);
  const places = new Set(links.map((tag) => tag.match(/data-place="([a-z_]+)"/)[1]));
  for (const p of ['header', 'mobile_menu', 'hero', 'footer']) assert.ok(places.has(p), `нет place=${p}`);
});

test('SEO: lang, title, description, OG-картинка, favicon', () => {
  assert.match(html, /<html\b[^>]*\slang="uk"/);
  assert.match(html, /<title\b[^>]*data-i18n="meta\.title"/);
  assert.match(html, /<meta\b[^>]*name="description"[^>]*data-i18n-attr="content:meta\.description"/);
  assert.match(html, /<meta\b[^>]*property="og:image"[^>]*content="[^"]*\/og\.jpg"/);
  assert.match(html, /<link\b[^>]*rel="icon"[^>]*href="\/favicon\.svg"/);
});
