// Какие секции видны, решает config.json → sections.enabled: сейчас только первый экран (блоки возвращаются по одному).
// Секции не удаляются из index.html: выключенная получает hidden при сборке, пункт навигации со ссылкой на неё — тоже;
// main.js её не инициализирует. Вариантов первого экрана больше нет (сборка 3, T18).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { isSectionEnabled, disableSections, ALWAYS_ON } from '../src/core/sections.js';

const html = read('index.html');
const config = readJson('src/data/config.json');
const names = [...html.matchAll(/\sdata-section="([\w-]+)"/g)].map((m) => m[1]);
const tagOf = (out, name) => out.match(new RegExp(`<[a-z]+\\b[^>]*\\sdata-section="${name}"[^>]*>`))[0];

test('config.json: включён только первый экран; шапка и заставка — всегда; без списка включено всё', () => {
  assert.deepEqual(config.sections, { enabled: ['hero'] });
  assert.deepEqual(ALWAYS_ON, ['header', 'preloader']);
  for (const name of ['stats', 'ribbons', 'calculator', 'footer']) assert.equal(isSectionEnabled(name, config), false, name);
  for (const name of ['hero', 'header', 'preloader']) assert.equal(isSectionEnabled(name, config), true, name);
  assert.equal(isSectionEnabled('stats', {}), true, 'без списка включено всё');
  assert.equal(isSectionEnabled('stats', { sections: { enabled: ['hero', 'stats'] } }), true);
});

test('сборка: выключенные секции и ссылки шапки и меню на них — hidden; включённые не тронуты', () => {
  const out = disableSections(html, config);
  for (const name of new Set(names)) {
    const hidden = /\shidden(\s|>|=)/.test(tagOf(out, name));
    assert.equal(hidden, !['hero', 'header', 'preloader'].includes(name), name);
  }
  assert.ok(names.includes('footer') && names.includes('ribbons') && names.includes('stats'));
  const links = [...out.matchAll(/<li\b([^>]*)>\s*<a\b[^>]*\shref="#([\w-]+)"/g)];
  assert.ok(links.length > 10);
  for (const [, attrs, id] of links) assert.equal(/\shidden/.test(attrs), id !== 'hero', `пункт #${id}`);
  // в шапке нет видимых ссылок на выключенные секции — только Telegram
  const bar = out.match(/<header\b[\s\S]*?<div class="menu"/)[0];
  for (const [, attrs] of bar.matchAll(/<li\b([^>]*)>\s*<a\b[^>]*class="header__link"/g)) assert.match(attrs, /\shidden/);
  assert.doesNotMatch(out, /data-hero-on|data-hero-sections/);
  // включить обратно — одна строка
  assert.equal(disableSections(html, { sections: { enabled: names } }), html);
});

test('main.js пропускает выключенные секции и убирает их узлы до старта движения', () => {
  const main = read('src/main.js');
  assert.match(main, /import \{ isSectionEnabled \} from '\.\/core\/sections\.js'/);
  assert.match(main, /if \(!isSectionEnabled\(name, config\) \|\| node\.hidden\) \{\s*node\.remove\(\);\s*continue;/);
  assert.doesNotMatch(main, /dataset\.hero|theme-switcher/);
  assert.match(read('build/i18n-prerender.js'), /disableSections\(/);
});
