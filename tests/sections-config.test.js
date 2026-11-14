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

// T19: вернулся блок 02 «Telegram у цифрах»; задача 3 — блоки 03… возвращаются по одному, по порядку страницы
const ON = config.sections.enabled;
const order = names.filter((n) => ON.includes(n));

test('config.json: включены первый экран, ленты (T23, H13) и блок 02; шапка и заставка — всегда; без списка включено всё', () => {
  assert.deepEqual(Object.keys(config.sections), ['enabled']);
  assert.deepEqual(ON.slice(0, 3), ['hero', 'ribbons', 'stats']);
  assert.deepEqual(ON, order, 'список — по порядку секций в index.html, без лишних имён');
  assert.deepEqual(ALWAYS_ON, ['header', 'preloader']);
  for (const name of ['hero', 'ribbons', 'header', 'preloader', 'footer']) assert.equal(isSectionEnabled(name, config), true, name);
  assert.equal(isSectionEnabled('stats', {}), true, 'без списка включено всё');
  assert.equal(isSectionEnabled('stats', { sections: { enabled: ['hero', 'stats'] } }), true);
});

test('сборка: выключенные секции и ссылки шапки и меню на них — hidden; включённые не тронуты', () => {
  const out = disableSections(html, config);
  for (const name of new Set(names)) {
    const hidden = /\shidden(\s|>|=)/.test(tagOf(out, name));
    assert.equal(hidden, ![...ON, 'header', 'preloader'].includes(name), name);
  }
  assert.ok(names.includes('footer') && names.includes('ribbons') && names.includes('stats'));
  const links = [...out.matchAll(/<li\b([^>]*)>\s*<a\b[^>]*\shref="#([\w-]+)"/g)];
  assert.ok(links.length > 10);
  for (const [, attrs, id] of links) assert.equal(/\shidden/.test(attrs), !ON.includes(id), `пункт #${id}`);
  // 2026-11-13 «Шапка A · Класика»: быстрые ссылки шапки ведут на включённые разделы; выключенный — ссылка hidden
  const bar = out.match(/<header\b[\s\S]*?<div class="menu"/)[0];
  const quick = [...bar.matchAll(/<a class="header__link"([^>]*)\shref="#([\w-]+)"/g)];
  assert.deepEqual(quick.map((m) => m[2]), ['hero', 'hero', 'calculator', 'cases', 'reviews', 'faq']);
  for (const [, attrs, id] of quick) assert.equal(/\shidden/.test(attrs), !ON.includes(id), `ссылка шапки #${id}`);
  const offFaq = disableSections(html, { sections: { enabled: names.filter((n) => n !== 'faq') } });
  assert.match(offFaq, /<a class="header__link" hidden href="#faq"/, 'раздел выключен — ссылка шапки скрыта');
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
