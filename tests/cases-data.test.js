// cases.json: кейсы брифа + два кейса по присланным аватарам (Monolit, ПроSales); сначала кейсы с аватарами.
// Все поля модалки, тексты на двух языках, неизвестное — «уточнити». Аватар и цвет бренда — поля avatar / accent.
// T40 (документ клиента, блок 6): у кейса GEO, ціль кампанії и 3 ключові показники (metrics: подпись + значение)
// вместо budget / result / cpa; Trackdesk и Finmap — «SaaS / B2B».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, root } from './helpers.js';

const { cases } = readJson('src/data/cases.json');
// имена — из брифа (таск 02) и с аватаров от пользователя (T29); порядок: с аватарами, потом остальные
// 2026-11-10: «Это и есть Олександр» — аватар ПроSales принадлежит Олександру Мухіну, его отдельная карточка с буквой удалена;
// фото Віктора Домбовецького пользователь добавил в Photos/
const ORDER = ['Cryptonite', 'Monolit', 'Global Auto Logistic', 'Trackdesk', 'Олександр Мухін', 'Віктор Домбовецький', 'Finmap', 'Князєв'];
const ACCENTS = { cryptonite: '#F2596B', monolit: '#19B5E0', 'global-auto-logistic': '#DCE21C', trackdesk: '#12B76A', mukhin: '#7B4DFF', dombovetskyi: '#5BE84A', finmap: '#74E3A8', kniaziev: '#4F6BFF' };
const FIELDS = ['niche', 'name', 'geo', 'goal', 'task', 'review'];
const bilingual = (v) => v && typeof v.ua === 'string' && v.ua.trim() && typeof v.en === 'string' && v.en.trim();

test('8 кейсов: сначала с аватарами, потом остальные; id уникальны', () => {
  assert.deepEqual(cases.map((c) => c.name.ua), ORDER);
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  const flags = cases.map((c) => c.avatar);
  assert.deepEqual(flags, [true, true, true, true, true, true, true, true]);
  assert.equal(cases.find((c) => c.id === 'mukhin').name.en, 'Oleksandr Mukhin');
  assert.ok(!cases.some((c) => c.id === 'prosales'), 'ПроSales — это Мухін, отдельной карточки нет');
  assert.equal(cases.find((c) => c.id === 'monolit').niche.ua, 'Finance / Investments');
  assert.equal(cases.find((c) => c.id === 'mukhin').niche.ua, 'Expert · ПроSales');
  // «Trackdesk — залишити як SaaS / B2B. Finmap — залишити як SaaS / B2B.»
  for (const id of ['trackdesk', 'finmap']) assert.deepEqual(cases.find((c) => c.id === id).niche, { ua: 'SaaS / B2B', en: 'SaaS / B2B' }, id);
});

test('аватар и цвет бренда: accent только у кейсов с аватаром, файлы 256 и 512 лежат в public/img/cases', () => {
  for (const c of cases) {
    assert.equal(typeof c.avatar, 'boolean', c.id);
    if (c.avatar) {
      assert.equal(c.accent, ACCENTS[c.id], c.id);
      assert.ok(existsSync(join(root, 'public/img/cases', `${c.id}.webp`)), `${c.id}.webp`);
      // @2x есть у всех, кроме помеченных avatarRetina: false (маленький исходник — не растягиваем)
      assert.equal(existsSync(join(root, 'public/img/cases', `${c.id}@2x.webp`)), c.avatarRetina !== false, `${c.id}@2x.webp`);
    } else {
      assert.equal(c.accent, undefined, `${c.id}: без аватара — акцент сайта`);
      assert.ok(!existsSync(join(root, 'public/img/cases', `${c.id}.webp`)), `${c.id}: файл есть, а avatar: false`);
    }
  }
  assert.deepEqual(cases.filter((c) => c.avatarRetina === false).map((c) => c.id), ['kniaziev']);
  // аватар без хозяина в public не кладётся — не публикуем чужое фото без кейса
  assert.ok(!existsSync(join(root, 'public/img/cases/_unassigned-red.webp')));
  assert.ok(!cases.some((c) => c.id.includes('unassigned')));
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
    for (const f of ['geo', 'goal', 'task', 'review']) {
      assert.equal(c[f].ua, 'уточнити', `${c.name.ua}: ${f}`);
      assert.equal(c[f].en, 'TBD', `${c.name.ua}: ${f}`);
    }
    for (const m of c.metrics) assert.deepEqual(m.value, { ua: 'уточнити', en: 'TBD' }, `${c.name.ua}: ${m.label.ua}`);
  }
});

test('3 ключові показники: подпись и значение на двух языках; подписи по умолчанию — Бюджет, Результат, CPA / CPS', () => {
  for (const c of cases) {
    assert.ok(Array.isArray(c.metrics) && c.metrics.length === 3, `${c.name.ua}: metrics ×3`);
    for (const m of c.metrics) {
      assert.deepEqual(Object.keys(m), ['label', 'value'], c.name.ua);
      assert.ok(bilingual(m.label) && bilingual(m.value), c.name.ua);
    }
    assert.deepEqual(c.metrics.map((m) => m.label.ua), ['Бюджет', 'Результат', 'CPA / CPS'], c.name.ua);
    assert.deepEqual(c.metrics.map((m) => m.label.en), ['Budget', 'Result', 'CPA / CPS'], c.name.ua);
    // прежние отдельные поля перенесены в metrics — данных в двух местах нет
    for (const old of ['budget', 'result', 'cpa']) assert.equal(c[old], undefined, `${c.name.ua}: ${old}`);
  }
});
