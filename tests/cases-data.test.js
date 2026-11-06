// cases.json: 7 кейсов брифа в его порядке, все поля модалки, тексты на двух языках, неизвестное — «уточнити».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJson } from './helpers.js';

const { cases } = readJson('src/data/cases.json');
// порядок и имена — из брифа (таск 02, «Из брифа, дословно»)
const BRIEF = ['Cryptonite', 'Finmap', 'Global Auto Logistic', 'Князєв', 'Олександр Мухін', 'Віктор Домбовецький', 'Trackdesk'];
const FIELDS = ['niche', 'name', 'budget', 'result', 'cpa', 'task', 'geo', 'review'];
const bilingual = (v) => v && typeof v.ua === 'string' && v.ua.trim() && typeof v.en === 'string' && v.en.trim();

test('7 кейсов брифа в его порядке, Cryptonite — главный', () => {
  assert.deepEqual(cases.map((c) => c.name.ua), BRIEF);
  assert.equal(cases[0].featured, true);
  assert.equal(cases.filter((c) => c.featured).length, 1);
  assert.equal(new Set(cases.map((c) => c.id)).size, 7);
});

test('у каждого кейса все поля, на двух языках; «Що було зроблено» — список', () => {
  for (const c of cases) {
    for (const f of FIELDS) assert.ok(bilingual(c[f]), `${c.name?.ua}: ${f}`);
    assert.ok(Array.isArray(c.done) && c.done.length > 0, `${c.name.ua}: done[]`);
    for (const item of c.done) assert.ok(bilingual(item), `${c.name.ua}: done`);
  }
});

test('цифр клиента ещё нет — «уточнити», а не правдоподобное число', () => {
  for (const c of cases) {
    for (const f of ['budget', 'result', 'cpa']) {
      assert.equal(c[f].ua, 'уточнити', `${c.name.ua}: ${f}`);
      assert.equal(c[f].en, 'TBD', `${c.name.ua}: ${f}`);
    }
  }
});
