// Страница = шапка + первый экран: остальные секции отключены списком config.json → sections.enabled, но не удалены.
// Отключённая секция получает hidden при сборке (без мигания), её пункт навигации скрыт, main.js её не инициализирует.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { isSectionEnabled, disableSections, ALWAYS_ON } from '../src/core/sections.js';

const html = read('index.html');
const config = readJson('src/data/config.json');
const names = [...html.matchAll(/\sdata-section="([\w-]+)"/g)].map((m) => m[1]);

test('config.json: включён только первый экран; шапка и заставка — всегда', () => {
  assert.deepEqual(config.sections.enabled, ['hero']);
  assert.deepEqual(ALWAYS_ON, ['header', 'preloader']);
  assert.equal(isSectionEnabled('hero', config), true);
  assert.equal(isSectionEnabled('header', config), true);
  assert.equal(isSectionEnabled('stats', config), false);
  assert.equal(isSectionEnabled('stats', {}), true, 'без списка включено всё');
});

test('сборка: у всех секций кроме hero/шапки/заставки — hidden; ссылки навигации на них скрыты; hero не тронут', () => {
  const out = disableSections(html, config);
  for (const name of new Set(names)) {
    const tag = out.match(new RegExp(`<[a-z]+\\b[^>]*\\sdata-section="${name}"[^>]*>`))[0];
    const hidden = /\shidden(\s|>|=)/.test(tag);
    assert.equal(hidden, !isSectionEnabled(name, config), `${name}: hidden=${hidden}`);
  }
  assert.ok(names.includes('footer') && names.includes('ribbons') && names.includes('stats'));
  const links = [...out.matchAll(/<li\b([^>]*)>\s*<a\b[^>]*\shref="#([\w-]+)"/g)];
  assert.ok(links.length > 10);
  for (const [, attrs, id] of links) {
    assert.equal(/\shidden/.test(attrs), id !== 'hero', `пункт #${id}`);
  }
  // включить обратно — одна строка
  assert.equal(disableSections(html, { sections: { enabled: names } }), html);
});

test('main.js пропускает отключённые секции и убирает их узлы до старта движения', () => {
  const main = read('src/main.js');
  assert.match(main, /import \{ isSectionEnabled \} from '\.\/core\/sections\.js'/);
  assert.match(main, /if \(!isSectionEnabled\(name, config\) \|\| node\.hidden\) \{\s*node\.remove\(\);\s*continue;/);
  const prerender = read('build/i18n-prerender.js');
  assert.match(prerender, /disableSections\(/);
});
