// Шов №2 из interfaces.md: у content.ua.json и content.en.json совпадает набор ключей.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJson, flattenKeys } from './helpers.js';

const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');

test('UA и EN содержат один и тот же набор ключей', () => {
  const { draft, ...enBody } = en;
  const uaKeys = flattenKeys(ua).sort();
  const enKeys = flattenKeys(enBody).sort();
  const onlyUa = uaKeys.filter((k) => !enKeys.includes(k));
  const onlyEn = enKeys.filter((k) => !uaKeys.includes(k));
  assert.deepEqual({ onlyUa, onlyEn }, { onlyUa: [], onlyEn: [] });
});

test('английский словарь помечен как черновик', () => {
  assert.equal(en.draft, true);
  assert.equal('draft' in ua, false);
});

test('в словарях заполнены разделы фундамента', () => {
  for (const dict of [ua, en]) {
    for (const key of ['meta', 'nav', 'preloader', 'hero', 'footer', 'common']) {
      assert.ok(dict[key] && Object.keys(dict[key]).length > 0, `раздел ${key} пуст`);
    }
  }
});
