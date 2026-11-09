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

// T20: орбита ниш заменена карточками-табло из общего языка движения — см. tests/niches-block.test.js

// T19: «таймер» статистики заменён табло из общего языка движения (core/motion-kit.js → flipSwap) —
// см. tests/stats-block.test.js и tests/stats-motion-kit.test.js
test('статистика: цифры без градиентного текста', () => {
  assert.doesNotMatch(section('stats'), /stats__value[^"]*text-grad/);
});
