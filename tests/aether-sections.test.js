// T13: секции 02–14 (кроме кейсов) в облике Aether — заголовки со второй строкой акцентом,
// орбита ниш, цифры-таймер статистики.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const section = (id) => html.split(new RegExp(`<section\\b[^>]*\\sid="${id}"`))[1].split('</section>')[0];
const count = (s, re) => (s.match(re) || []).length;

const IDS = ['stats', 'niches', 'formats', 'calculator', 'process', 'geo', 'targeting', 'reviews', 'ecosystem', 'materials', 'faq', 'cta'];

test('заголовки секций — .display, хвост для акцентной строки в словаре — конец заголовка (UA и EN)', () => {
  for (const id of IDS) {
    const h2 = section(id).match(/<h2\b[^>]*>/)[0];
    assert.match(h2, /class="[^"]*\bdisplay\b/, `${id}: h2 без .display`);
    assert.match(h2, new RegExp(`data-title-accent="${id}\\.titleAccent"`), `${id}: нет data-title-accent`);
    for (const [lang, dict] of [['ua', ua], ['en', en]]) {
      const { title, titleAccent } = dict[id];
      assert.ok(typeof titleAccent === 'string' && titleAccent.length > 0, `${lang}.${id}.titleAccent пуст`);
      assert.ok(titleAccent.length < title.length && title.endsWith(titleAccent), `${lang}.${id}: «${titleAccent}» — не хвост «${title}»`);
    }
  }
});

test('splitTitle: делит заголовок на начало и акцентный хвост; чужой хвост — null', async () => {
  const { splitTitle } = await import('../src/core/title-accent.js');
  assert.deepEqual(splitTitle('Обговоримо ваш проєкт?', 'ваш проєкт?'), { lead: 'Обговоримо', accent: 'ваш проєкт?' });
  assert.deepEqual(splitTitle('Від аналізу до масштабування', 'до масштабування'), { lead: 'Від аналізу', accent: 'до масштабування' });
  assert.equal(splitTitle('Часті питання', 'questions'), null);
  assert.equal(splitTitle('Часті питання', 'Часті питання'), null);
  assert.equal(splitTitle('Часті питання', ''), null);
});

test('ніші: планета и восемь круглых карточек орбиты (декор), «Інша ніша?» остаётся ссылкой в Telegram', () => {
  const s = section('niches');
  const orbit = s.match(/<div class="niches__orbit"[^>]*>/)?.[0];
  assert.ok(orbit, 'нет .niches__orbit');
  assert.match(orbit, /aria-hidden="true"/);
  assert.match(s, /class="planet"/);
  assert.equal(count(s, /class="niches__sat[ "]/g), 8);
  assert.equal(count(s, /class="niches__sat niches__sat--other"/g), 1);
  assert.match(s, /<a class="niches__card niches__card--other"[^>]*data-place="niches_other"/);
});

test('orbitPoint: эллипс, передняя половина крупнее и над планетой', async () => {
  const { orbitPoint } = await import('../src/sections/niches.js');
  const front = orbitPoint(Math.PI / 2, 300, 80);
  const back = orbitPoint(-Math.PI / 2, 300, 80);
  const side = orbitPoint(0, 300, 80);
  assert.equal(Math.round(side.x), 300);
  assert.equal(Math.round(side.y), 0);
  assert.equal(Math.round(front.y), 80);
  assert.equal(Math.round(back.y), -80);
  assert.equal(front.front, true);
  assert.equal(back.front, false);
  assert.ok(front.scale > side.scale && side.scale > back.scale);
  assert.ok(front.opacity === 1 && back.opacity < 1 && back.opacity > 0.3);
});

test('орбита вращается transform-ом в rAF, стоит вне экрана и при reduced-motion', () => {
  const js = read('src/sections/niches.js');
  assert.match(js, /requestAnimationFrame/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /reduced/);
  assert.match(js, /\.style\.transform\s*=/);
  assert.doesNotMatch(js, /\.style\.(left|top|width|height)\s*=/);
});

// T19: «таймер» статистики заменён табло из общего языка движения (core/motion-kit.js → flipSwap) —
// см. tests/stats-block.test.js и tests/stats-motion-kit.test.js
test('статистика: цифры без градиентного текста', () => {
  assert.doesNotMatch(section('stats'), /stats__value[^"]*text-grad/);
});
