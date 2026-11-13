// 2026-11-13 «Шапка A · Класика»: текущий раздел в шапке подсвечивается по прокрутке (header.js → currentSection),
// превью ссылки — по полному адресу сайта (config.siteUrl).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const src = read('src/sections/header.js');
const fnSrc = src.slice(src.indexOf('export function currentSection'), src.indexOf('\n}\n', src.indexOf('export function currentSection')) + 2).replace('export ', '');
const currentSection = new Function(`${fnSrc}; return currentSection;`)();

test('currentSection: последний раздел, чей верх выше линии; ничего не прошло — первый; скрытые пропускаются', () => {
  const ids = ['hero', 'stats', 'calculator', 'cases'];
  assert.equal(currentSection(ids, [0, 900, 2000, 3000], 300), 'hero');
  assert.equal(currentSection(ids, [-1200, -200, 700, 1800], 300), 'stats');
  assert.equal(currentSection(ids, [-5000, -4000, -900, 250], 300), 'cases');
  assert.equal(currentSection(ids, [-5000, null, -900, 800], 300), 'calculator', 'выключенный раздел (null) не мешает');
  assert.equal(currentSection([], [], 300), null);
});

test('подсветка: класс is-current и aria-current на ссылке; прокрутка и смена размера — через rAF', () => {
  assert.match(src, /export const NAV_MEDIA = '\(min-width: 1280px\)';/);
  assert.match(src, /a\.classList\.toggle\('is-current', on\)/);
  assert.match(src, /a\.setAttribute\('aria-current', 'location'\)/);
  assert.match(src, /window\.addEventListener\('scroll', schedule, \{ passive: true \}\)/);
  for (const lang of ['ua', 'en']) {
    const { nav } = readJson(`src/data/content.${lang}.json`);
    for (const k of ['home', 'experience', 'calculator', 'results', 'reviews', 'faq', 'blog', 'soon']) assert.ok(nav.links[k], `${lang}: nav.links.${k}`);
  }
  assert.equal(readJson('src/data/content.ua.json').nav.links.experience, 'Досвід');
});

test('превью ссылки: og:url и og:image — полным адресом из config.siteUrl', () => {
  const html = read('index.html');
  assert.match(html, /<meta property="og:url" content="\{\{config\.siteUrl\}\}\/" \/>/);
  assert.match(html, /<meta property="og:image" content="\{\{config\.siteUrl\}\}\/og\.jpg" \/>/);
  assert.match(readJson('src/data/config.json').siteUrl, /^https:\/\/[^/]+\/[\w-]+$/, 'без «/» в конце');
});
