// Какие секции видны, решает config.json → sections: по умолчанию (варианты «Кольцо» и «Синий») — только первый экран,
// в варианте «Самолётик» (byHero.plane = "all") — вся страница. Секции не удаляются из index.html.
// Выключенная везде секция получает hidden при сборке; включённая только в части вариантов — data-hero-on и правило
// <style data-hero-sections> в <head>, которое прячет её до первой отрисовки по data-hero; main.js её не инициализирует.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { isSectionEnabled, disableSections, ALWAYS_ON } from '../src/core/sections.js';

const html = read('index.html');
const config = readJson('src/data/config.json');
const names = [...html.matchAll(/\sdata-section="([\w-]+)"/g)].map((m) => m[1]);
const tagOf = (out, name) => out.match(new RegExp(`<[a-z]+\\b[^>]*\\sdata-section="${name}"[^>]*>`))[0];

test('config.json: «Самолётик» — вся страница, «Кольцо» и «Синий» — только первый экран; шапка и заставка — всегда', () => {
  assert.deepEqual(config.sections.enabled, ['hero']);
  assert.equal(config.sections.byHero.plane, 'all');
  assert.deepEqual(ALWAYS_ON, ['header', 'preloader']);
  for (const name of ['stats', 'ribbons', 'calculator', 'footer']) {
    assert.equal(isSectionEnabled(name, config, 'plane'), true, `${name} в plane`);
    assert.equal(isSectionEnabled(name, config, 'mockup'), false, `${name} в mockup`);
    assert.equal(isSectionEnabled(name, config, 'blue'), false, `${name} в blue`);
    assert.equal(isSectionEnabled(name, config), false, `${name} по умолчанию`);
  }
  for (const hero of ['plane', 'mockup', 'blue', undefined]) {
    assert.equal(isSectionEnabled('hero', config, hero), true);
    assert.equal(isSectionEnabled('header', config, hero), true);
  }
  assert.equal(isSectionEnabled('stats', {}), true, 'без списка включено всё');
  assert.equal(isSectionEnabled('stats', { sections: { enabled: ['hero'], byHero: { blue: ['stats'] } } }, 'blue'), true);
});

test('сборка: секции под первым экраном — data-hero-on="plane" без hidden; ссылки навигации так же; правило в <head>', () => {
  const out = disableSections(html, config);
  for (const name of new Set(names)) {
    const tag = tagOf(out, name);
    assert.ok(!/\shidden(\s|>|=)/.test(tag), `${name}: не hidden — нужен варианту plane`);
    const on = tag.match(/\sdata-hero-on="([^"]*)"/)?.[1];
    assert.equal(on, ['hero', 'header', 'preloader'].includes(name) ? undefined : 'plane', `${name}: data-hero-on`);
  }
  assert.ok(names.includes('footer') && names.includes('ribbons') && names.includes('stats'));
  const links = [...out.matchAll(/<li\b([^>]*)>\s*<a\b[^>]*\shref="#([\w-]+)"/g)];
  assert.ok(links.length > 10);
  for (const [, attrs, id] of links) {
    assert.equal(/\sdata-hero-on="plane"/.test(attrs), id !== 'hero', `пункт #${id}`);
    assert.ok(!/\shidden/.test(attrs), `пункт #${id} не hidden`);
  }
  // правило стоит в <head> (до первой отрисовки) и прячет чужие варианты, но не plane
  const head = out.slice(0, out.indexOf('</head>'));
  const css = head.match(/<style data-hero-sections>([^<]+)<\/style>/)?.[1];
  assert.ok(css, 'нет <style data-hero-sections> в <head>');
  assert.match(css, /html\[data-hero="mockup"\] \[data-hero-on\]:not\(\[data-hero-on~="mockup"\]\)/);
  assert.match(css, /html\[data-hero="blue"\] \[data-hero-on\]:not\(\[data-hero-on~="blue"\]\)/);
  assert.match(css, /display:\s*none\s*!important/);
  // включить обратно — одна строка
  assert.equal(disableSections(html, { sections: { enabled: names } }), html);
});

test('сборка: секция, выключенная во всех вариантах, — hidden, без правила по вариантам', () => {
  const out = disableSections(html, { sections: { enabled: ['hero'] } });
  assert.match(tagOf(out, 'stats'), /\shidden/);
  assert.ok(!/data-hero-on/.test(out));
  assert.ok(!/data-hero-sections/.test(out));
});

test('main.js пропускает секции, выключенные для текущего варианта, и убирает их узлы до старта движения', () => {
  const main = read('src/main.js');
  assert.match(main, /import \{ isSectionEnabled \} from '\.\/core\/sections\.js'/);
  assert.match(main, /document\.documentElement\.dataset\.hero/);
  assert.match(main, /if \(!isSectionEnabled\(name, config, hero\) \|\| node\.hidden\) \{\s*node\.remove\(\);\s*continue;/);
  const prerender = read('build/i18n-prerender.js');
  assert.match(prerender, /disableSections\(/);
});
