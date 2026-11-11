// T40 (H54): обратная связь клиента — блоки 3, 6, 12 (reference/client-feedback/page-03.png, page-06.png, page-12.png).
// Блок 6 подробно — tests/cases-data.test.js и tests/cases-gallery.test.js; блок 12 — tests/ecosystem-materials.test.js.
// Здесь — блок 3, ссылки и картинки постов (проверка в materials.js и в админке) и поля админки для новых данных.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { buildFields } from '../src/admin/fields.js';
import { validate } from '../src/admin/validate.js';
import { FILES } from '../src/admin/config.js';

const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const matJs = strip(read('src/sections/materials.js'));

test('блок 3: «Прибрати B2B у назві категорії SaaS / B2B» — плитка «SaaS» (UA и EN)', () => {
  for (const dict of [ua, en]) {
    const names = dict.niches.items.map((i) => i.name);
    assert.ok(names.includes('SaaS'), names.join(', '));
    assert.ok(!names.includes('SaaS / B2B'));
  }
});

// чистые помощники materials.js — без DOM и без импорта модуля (он тянет GSAP)
const src = read('src/sections/materials.js');
const pick = (name) => new Function(`${src.match(new RegExp(`export const ${name} = \\(v\\) => \\{[\\s\\S]*?\\n\\};`))[0].replace('export ', '')} return ${name};`)();
const postUrl = pick('postUrl');
const imagePath = pick('imagePath');

test('блок 12: ссылка «Читати в Telegram» — только на t.me; иначе — общий telegramUrl из разметки', () => {
  assert.equal(postUrl('https://t.me/eleads_marketing/123'), 'https://t.me/eleads_marketing/123');
  assert.equal(postUrl(' https://t.me/eleads_marketing '), 'https://t.me/eleads_marketing');
  for (const bad of ['', 'javascript:alert(1)', 'http://t.me/x_chan/1', 'https://evil.example/t.me/abc/1', 'https://t.me/abc/1?x="><b>', 'https://t.me.evil.io/abc', undefined, 42]) {
    assert.equal(postUrl(bad), null, String(bad));
  }
  assert.match(matJs, /link\.dataset\.fallback \?\?= link\.getAttribute\('href'\)/);
  assert.match(matJs, /postUrl\(str\(`materials\.items\.\$\{link\.dataset\.matUrl\}\.url`\)\) \|\| link\.dataset\.fallback/);
  assert.match(matJs, /onLangChange\(\(\) => paint\(root\)\)/, 'на смену языка — ссылки и картинки своего словаря');
});

test('блок 12: картинки поста и канала — файл из public/ через publicUrl; без пути или при ошибке — заглушка', () => {
  assert.equal(imagePath('img/posts/8-sposobiv.webp'), 'img/posts/8-sposobiv.webp');
  assert.equal(imagePath('/img/posts/channel.JPG'), '/img/posts/channel.JPG');
  for (const bad of ['', 'https://evil.example/a.webp', '//evil.example/a.png', 'img/../../a.webp', 'img/a.svg', 'data:image/png;base64,AAA', 'img/a b.webp', null]) {
    assert.equal(imagePath(bad), null, String(bad));
  }
  assert.match(matJs, /src: publicUrl\(path\), alt: '', loading: 'lazy', decoding: 'async'/);
  assert.match(matJs, /addEventListener\('load', \(\) => box\.classList\.add\('has-image'\)/);
  assert.match(matJs, /paintImage\(avatar, str\('materials\.channelImage'\), 'mat__avatar-img'\)/);
  assert.match(matJs, /paintImage\(cover, str\(`materials\.items\.\$\{cover\.dataset\.matImage\}\.image`\), 'mat__cover-img'\)/);
  assert.doesNotMatch(matJs, /innerHTML/);
});

test('админка: новые поля кейсов и постов редактируются; ссылка и путь проверяются тем же правилом, что на сайте', () => {
  const texts = Object.fromEntries(FILES.map((f) => [f.path, read(f.path)]));
  const fields = buildFields(texts);
  const byPath = (p) => fields.find((f) => f.keyPath === p);
  for (const p of ['cases.0.geo', 'cases.0.goal', 'cases.0.metrics.0.label', 'cases.0.metrics.0.value', 'cases.6.metrics.2.value']) {
    const f = byPath(p);
    assert.ok(f, p);
    assert.equal(f.section, 'cases');
    assert.deepEqual(f.slots.map((s) => s.lang), ['ua', 'en']);
  }
  assert.equal(byPath('cases.0.goal').label, 'Ціль кампанії');
  assert.equal(byPath('cases.0.metrics.1.value').label, 'Ключові показники · №2 · Значення');
  assert.equal(byPath('materials.channel').section, 'materials');
  assert.equal(byPath('materials.channelImage').kind, 'image');
  assert.equal(byPath('materials.items.0.text').kind, 'text');
  assert.equal(byPath('materials.items.0.image').kind, 'image');
  assert.equal(byPath('materials.items.3.url').kind, 'post');
  assert.equal(byPath('materials.items.3.url').label, '№4 · Посилання на пост');

  assert.equal(validate('', { kind: 'post', original: '' }), null, 'ссылки ещё нет — поле может остаться пустым');
  assert.equal(validate('https://t.me/eleads_marketing/123', { kind: 'post' }), null);
  assert.match(validate('https://evil.example/t.me/x/1', { kind: 'post' }), /t\.me/);
  assert.equal(validate('img/posts/8-sposobiv.webp', { kind: 'image' }), null);
  assert.match(validate('https://evil.example/a.webp', { kind: 'image' }), /public/);
  assert.match(validate('img/../a.webp', { kind: 'image' }), /public/);
  for (const v of ['https://t.me/abc/1', 'https://evil.example/t.me/x/1', 'javascript:alert(1)', 'https://t.me/abc']) {
    assert.equal(validate(v, { kind: 'post' }) === null, postUrl(v) !== null, v);
  }
  for (const v of ['img/posts/a.webp', '/img/a.png', 'img/../a.webp', 'https://x.io/a.webp', 'a.svg']) {
    assert.equal(validate(v, { kind: 'image' }) === null, imagePath(v) !== null, v);
  }
});
