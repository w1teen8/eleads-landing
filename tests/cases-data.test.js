// cases.json: кейсы брифа + два кейса по присланным аватарам (Monolit, ПроSales); сначала кейсы с аватарами.
// Все поля модалки, тексты на двух языках, неизвестное — «уточнити». Аватар и цвет бренда — поля avatar / accent.
// T40 (документ клиента, блок 6): у кейса GEO, ціль кампанії и 3 ключові показники (metrics: подпись + значение)
// вместо budget / result / cpa; Finmap — «SaaS / B2B».
// 2026-11-11: клиент прислал данные по каждому кейсу — порядок как в сообщении, TRACKDESK заменить на АННА ХАУСТОВА.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, root } from './helpers.js';

const { cases } = readJson('src/data/cases.json');
// имена — из брифа (таск 02) и с аватаров от пользователя (T29); порядок: с аватарами, потом остальные
// 2026-11-10: «Это и есть Олександр» — аватар ПроSales принадлежит Олександру Мухіну, его отдельная карточка с буквой удалена;
// фото Віктора Домбовецького пользователь добавил в Photos/
const ORDER = ['Cryptonite', 'Global Auto Logistic', 'Finmap', 'Віктор Домбовецький', 'Олександр Мухін', 'Monolit', 'Князєв', 'Анна Хаустова'];
const ACCENTS = { cryptonite: '#F2596B', monolit: '#19B5E0', 'global-auto-logistic': '#DCE21C', mukhin: '#7B4DFF', dombovetskyi: '#5BE84A', finmap: '#74E3A8', kniaziev: '#4F6BFF' };
const FIELDS = ['niche', 'name', 'geo', 'formats', 'goal', 'task', 'review'];
const bilingual = (v) => v && typeof v.ua === 'string' && v.ua.trim() && typeof v.en === 'string' && v.en.trim();

test('8 кейсов в порядке из сообщения клиента; id уникальны', () => {
  assert.deepEqual(cases.map((c) => c.name.ua), ORDER);
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  const flags = cases.map((c) => c.avatar);
  assert.deepEqual(flags, [true, true, true, true, true, true, true, false], 'у Анни Хаустової аватара ще немає — буква');
  assert.ok(!cases.some((c) => c.id === 'trackdesk'), 'Trackdesk заменён на Анну Хаустову');
  assert.equal(cases.find((c) => c.id === 'mukhin').name.en, 'Oleksandr Mukhin');
  assert.ok(!cases.some((c) => c.id === 'prosales'), 'ПроSales — это Мухін, отдельной карточки нет');
  assert.equal(cases.find((c) => c.id === 'monolit').niche.ua, 'Finance / Investments');
  assert.equal(cases.find((c) => c.id === 'mukhin').niche.ua, 'Expert · ПроSales');
  // «Finmap — залишити як SaaS / B2B.»
  assert.deepEqual(cases.find((c) => c.id === 'finmap').niche, { ua: 'SaaS / B2B', en: 'SaaS / B2B' });
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

test('данные клиента 2026-11-11: GEO, формат, ціль, показники, задача и сделанное — дословно; отзывов ещё нет', () => {
  const ua = (id) => cases.find((c) => c.id === id);
  const W = 'Україна, весь світ';
  const rows = {
    cryptonite: [W, 'Канал, бот / Telegram Ads', 'Підписники на воронку в боті', '$0,56', '$1,72', 4],
    'global-auto-logistic': [W, 'Канал / Telegram Ads, UBT', 'Підписники на канал', 'невідомо', '$0,27', 4],
    finmap: [W, 'Канал, сайт / Telegram Ads', 'Впізнаваність, підписники на канал', '$0,65', '$2,67', 4],
    dombovetskyi: ['Україна', 'Канал / Telegram Ads', 'Впізнаваність, підписники на канал', '$0,61', '$1,16', 4],
    mukhin: ['Україна', 'Канал / Telegram Ads', 'Впізнаваність, підписники на канал', '$0,71', '$2,44', 4],
    monolit: ['Україна', 'Канал / Telegram Ads', 'Впізнаваність, підписники на канал', '$0,72', '$8,50', 4],
    kniaziev: ['Україна', 'Канал, бот / Telegram Ads', 'Підписники на воронку в боті та на канал', '$0,43', '$1,02', 5],
    khaustova: ['Україна', 'Канал, бот / Telegram Ads', 'Підписники на воронку в боті', '$0,69', '$1,66', 4],
  };
  for (const [id, [geo, formats, goal, cpm, cps, done]] of Object.entries(rows)) {
    const c = ua(id);
    assert.deepEqual([c.geo.ua, c.formats.ua, c.goal.ua], [geo, formats, goal], id);
    assert.deepEqual(c.metrics.map((m) => m.value.ua), ['n/a', cpm, cps], id);
    assert.equal(c.done.length, done, id);
    assert.ok(c.task.ua.endsWith('.') && c.task.ua !== 'уточнити', id);
    // отзывов по кейсам клиент не присылал — заглушка, а не выдуманная цитата
    assert.deepEqual(c.review, { ua: 'уточнити', en: 'TBD' }, id);
  }
  assert.equal(ua('cryptonite').task.ua, 'Залучення цільової аудиторії в Telegram-воронку та канал із подальшим масштабуванням реклами.');
  assert.equal(ua('khaustova').done[3].ua, 'Провели глибинний аналіз залученої аудиторії спільно з відділом продажів для оцінки якості лідів.');
  // EN — та же цифра с точкой
  assert.equal(ua('monolit').metrics[2].value.en, '$8.50');
});

test('3 ключові показники: подпись и значение на двух языках; подписи по умолчанию — Бюджет, CPM за 1000, Ціна підписника (клиент 2026-11-11)', () => {
  for (const c of cases) {
    assert.ok(Array.isArray(c.metrics) && c.metrics.length === 3, `${c.name.ua}: metrics ×3`);
    for (const m of c.metrics) {
      assert.deepEqual(Object.keys(m), ['label', 'value'], c.name.ua);
      assert.ok(bilingual(m.label) && bilingual(m.value), c.name.ua);
    }
    assert.deepEqual(c.metrics.map((m) => m.label.ua), ['Бюджет', 'CPM за 1000', 'Ціна підписника'], c.name.ua);
    assert.deepEqual(c.metrics.map((m) => m.label.en), ['Budget', 'CPM per 1000', 'Cost per subscriber'], c.name.ua);
    // прежние отдельные поля перенесены в metrics — данных в двух местах нет
    for (const old of ['budget', 'result', 'cpa']) assert.equal(c[old], undefined, `${c.name.ua}: ${old}`);
  }
});
