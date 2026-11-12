// T37 (H49, H50): общий телефон (src/core/phone.js + src/styles/phone.css) в блоках 04 и 13.
// 13 «FAQ» — вариант A «переписка» (reference/run3/faq-A-chosen.png). Пользователь: «если ты делаешь копию телеграмм …
// сделай экран телефона». T41 (H54): в 14 «Фінальний CTA» телефона больше нет — клиент: «Прибрати зображення телефону,
// оскільки воно вже повторюється на сайті. Замість телефону додати мою фотографію».
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { expandPhones, phoneFrame, PHONE_TAG } from '../src/core/phone.js';
import { prerender } from '../build/i18n-prerender.js';

const raw = read('index.html');
const html = expandPhones(raw);
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const config = readJson('src/data/config.json');
const faqData = readJson('src/data/faq.json');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const section = (src, id) => src.split(new RegExp(`<section\\b[^>]*\\sid="${id}"`))[1].split('</section>')[0];
const count = (s, re) => (s.match(re) || []).length;
const phoneCss = strip(read('src/styles/phone.css'));
const faqJs = strip(read('src/sections/faq.js'));
const ctaJs = strip(read('src/sections/cta.js'));
const ctaCss = strip(read('src/styles/sections/cta.css'));

// кадры WAAPI: все ключи объектов внутри .animate([...]) — только transform и opacity
const animatedProps = (code) =>
  [...code.matchAll(/\.animate\(\s*(\[[\s\S]*?\])\s*,/g)].flatMap(([, frames]) => [...frames.matchAll(/\b([a-zA-Z]+)\s*:/g)].map((m) => m[1]));

test('общий телефон: шаблон <phone-frame> в блоках 04 и 13, рамка разворачивается сборкой, копий рамки в разметке нет', () => {
  for (const id of ['formats', 'faq']) assert.equal(count(section(raw, id), /<phone-frame\b/g), 1, `${id}: один телефон`);
  assert.equal(count(section(raw, 'cta'), /<phone-frame\b|class="phone\b/g), 0, 'cta: телефона нет');
  assert.equal(count(raw, /<phone-frame\b/g), 2, 'телефонов на странице два');
  for (const part of ['phone__island', 'phone__status', 'phone__glare', 'phone__key']) {
    assert.doesNotMatch(raw, new RegExp(part), `${part} — только в шаблоне src/core/phone.js`);
  }
  const built = prerender(raw, ua, config);
  assert.doesNotMatch(built, /<phone-frame\b/, 'сборка разворачивает все шаблоны');
  assert.equal(count(built, /class="phone__screen"/g), 2);
  assert.equal(count(built, /<span class="phone__time" data-i18n="formats\.phone\.time">9:41<\/span>/g), 2, 'время — из словаря');
});

test('шаблон: класс phone первым, свои классы и data-атрибуты сохраняются, содержимое экрана — под строкой состояния', () => {
  const out = phoneFrame(' class="faq__phone" data-faq-phone', '<div class="phone__view">X</div>');
  assert.match(out, /^<div class="phone faq__phone" data-faq-phone>/);
  const order = ['phone__screen', 'phone__island', 'phone__status', 'phone__view', 'phone__glare', 'phone__key--mute', 'phone__key--power'].map((c) => out.indexOf(c));
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'порядок частей рамки');
  assert.equal(count(out, /<svg\b/g), 3, 'сигнал, wi-fi, батарея');
  assert.equal(count(out, /class="phone__key /g), 4);
  assert.match(phoneFrame(' data-formats-phone', ''), /^<div class="phone" data-formats-phone>/);
  assert.equal(expandPhones('<phone-frame>a</phone-frame><p>b</p><phone-frame class="x">c</phone-frame>').match(/class="phone( x)?"/g).length, 2);
  assert.ok(PHONE_TAG.global);
});

test('стили телефона — в общем файле до стилей секций; блок 04 задаёт только размер и своё содержимое', () => {
  assert.match(read('src/styles/components.css'), /@import '\.\/phone\.css';/);
  for (const sel of ['\\.phone', '\\.phone__screen', '\\.phone__status', '\\.phone__chat', '\\.phone__feed', '\\.phone__bottom', '\\.phone__glare']) {
    assert.match(phoneCss, new RegExp(`(^|\\n)${sel}\\s*\\{`), `${sel} в phone.css`);
  }
  const formats = strip(read('src/styles/sections/formats.css'));
  assert.doesNotMatch(formats, /(^|\n)\.phone(__screen|__status|__chat|__feed|__bottom|__glare|__island|__key)?\s*\{/, 'рамка не продублирована в formats.css');
  assert.match(formats, /\.formats__stage \.phone\s*\{[^}]*height:\s*100%/, 'размер телефона 04 — у блока');
  assert.doesNotMatch(phoneCss, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'цвета — только переменные');
  assert.match(phoneCss, /container-type:\s*size/);
  // чат 13: пузыри, «друкує…», фото в шапке
  for (const cls of ['phone__view', 'phone__thread', 'phone__msg', 'phone__msg--out', 'phone__typing', 'phone__avatar--photo']) {
    assert.match(phoneCss, new RegExp(`\\.${cls}\\b`), cls);
  }
  // кнопка отправки и ссылка на весь экран были только у телефона 14 — убраны вместе с ним
  for (const cls of ['phone__send', 'phone__link', 'phone__bottom--send']) assert.doesNotMatch(phoneCss, new RegExp(`\\.${cls}\\b`), cls);
  assert.match(phoneCss, /\.phone__msg--out\s*\{[^}]*background:\s*var\(--grad\)/, 'исходящее — жёлто-оранжевое');
  for (const [, body] of phoneCss.matchAll(/@keyframes [\w-]+\s*\{([\s\S]*?\n)\}/g)) {
    for (const [, prop] of body.matchAll(/([a-z-]+):/g)) assert.ok(['opacity', 'transform'].includes(prop), `кадр: ${prop}`);
  }
});

test('13 FAQ: слева заголовок, «Не знайшли відповідь?» и вопросы-вкладки; справа телефон с чатом Володимира', () => {
  const s = section(html, 'faq');
  assert.match(s, /<a class="faq__ask"[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="faq"/);
  assert.match(s, /<ul class="faq__list" role="tablist" aria-orientation="vertical"[^>]*data-faq-list/);
  assert.match(s, /class="phone faq__phone" data-faq-phone/);
  assert.match(s, /class="phone__name" data-i18n="faq\.chat\.name"/);
  assert.match(s, /data-faq-status data-i18n="faq\.chat\.status"/);
  assert.match(s, /\/img\/photo\/volodymyr-founder-480\.webp/, 'фото Володимира в шапке чата');
  assert.match(s, /id="faq-chat" role="tabpanel"[^>]*data-faq-feed/);
  assert.doesNotMatch(s, /faq__cols|aria-expanded/, 'прежнего аккордеона нет');
  for (const dict of [ua, en]) {
    for (const key of ['name', 'short', 'status', 'typing']) assert.equal(typeof dict.faq.chat[key], 'string', `faq.chat.${key}`);
    assert.ok(dict.faq.listLabel && dict.faq.ask.title && dict.faq.ask.text);
  }
  assert.equal(ua.faq.chat.status, 'у мережі');
  assert.equal(ua.faq.chat.typing, 'друкує…');
  assert.match(faqJs, /import data from '\.\.\/data\/faq\.json'/, 'вопросы — из faq.json');
  assert.equal(faqData.items.length, 8, 'вопрос «Чи є гарантія результату?» убран (T41)');
});

test('13 FAQ: выбор «отправляет» вопрос, «друкує…» ~0,7 с, затем ответ; автолистание ~8 с с паузой только на списке', async () => {
  const mod = faqJs;
  const step = Number(mod.match(/STEP_MS\s*=\s*(\d+)/)[1]);
  const typing = Number(mod.match(/TYPING_MS\s*=\s*(\d+)/)[1]);
  assert.ok(step >= 7000 && step <= 9000, `STEP_MS = ${step}`);
  assert.ok(typing >= 500 && typing <= 1000, `TYPING_MS = ${typing}`);
  assert.match(mod, /faq\.chat\.typing/, 'в шапке — «друкує…»');
  assert.match(mod, /phone__typing/, 'в ленте — пузырь с точками');
  // пауза — наведение мышью на сам список, не на весь блок (урок блока 09)
  assert.match(mod, /on\(list, 'pointerenter'/);
  assert.match(mod, /pointerType !== 'mouse'/);
  assert.doesNotMatch(mod, /on\(root, 'pointer(enter|leave)'/, 'не на весь блок');
  assert.match(mod, /visibilitychange/);
  assert.match(mod, /IntersectionObserver/, 'листает, только пока блок в окне');
  // reduced-motion / ?nomotion=1: без автолистания, смены мгновенные
  assert.match(mod, /if \(reduced \|\|[^)]*\) return;/);
  assert.match(mod, /select\(0, false, false, false\)/, 'первый вопрос и ответ — сразу, без «печати»');
  assert.match(mod, /ArrowDown/);
  assert.match(mod, /'Home'/);
  assert.match(mod, /aria-live', manual \? 'polite' : 'off'/, 'скринридер — только при ручном выборе');
  for (const prop of animatedProps(mod)) assert.ok(['transform', 'opacity'].includes(prop), `faq.js: ${prop}`);
  assert.doesNotMatch(mod, /\b(stagger|stackReveal|gsap|ScrollTrigger)\b/);
  const { pickText, isTbd, nextIndex } = await import('../src/sections/faq-model.js');
  assert.equal(pickText({ ua: 'а', en: 'b' }, 'en'), 'b');
  assert.equal(pickText({ ua: 'а' }, 'en'), 'а');
  assert.equal(pickText('x', 'ua'), 'x');
  assert.equal(isTbd('уточнити'), true);
  assert.equal(isTbd('TBD'), true);
  assert.equal(isTbd(faqData.items[0].a.ua), false);
  assert.equal(nextIndex(8, 9), 0);
  assert.equal(nextIndex(2, 9), 3);
});

test('14 CTA: заголовок, текст и кнопка без изменений; вместо телефона — фото Володимира (<picture> AVIF/WebP/JPG)', () => {
  const s = section(html, 'cta');
  assert.match(s, /class="btn btn--primary[^"]*cta__btn"[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="final_cta"/);
  assert.match(s, /data-i18n="cta\.title" data-title-accent="cta\.titleAccent"/);
  assert.match(s, /data-i18n="cta\.text"/);
  assert.match(s, /data-i18n="cta\.button"/);
  assert.doesNotMatch(s, /phone|data-cta-(thread|hello|status)|final_cta_chat|telegramHandle/, 'телефона с чатом нет');
  // 2026-11-11 (выбор «1»): фото без рамки — кадр с улицей снизу и вырезанная фигура того же размера поверх
  const scene = s.match(/<div class="cta__scene" data-cta-photo>([\s\S]*?)<\/div>/);
  assert.ok(scene, 'фото на месте телефона');
  const pic = scene[1];
  assert.doesNotMatch(pic, /cta__scene-bg/, 'улицы за фигурой больше нет — фон блока шёлк');
  assert.match(pic, /<img class="cta__scene-cut" src="\/img\/photo\/volodymyr-cta-cut-800\.webp" srcset="\/img\/photo\/volodymyr-cta-cut-800\.webp 800w, \/img\/photo\/volodymyr-cta-cut-1200\.webp 1200w"/);
  assert.match(pic, /width="800" height="1020"/, 'размер фигуры — без сдвига вёрстки');
  assert.match(pic, /class="cta__scene-cut"[^>]*data-i18n-attr="alt:cta\.photoAlt"/, 'alt — из словаря, у фигуры');
  assert.match(pic, /loading="lazy"/);
  for (const f of ['cut-800', 'cut-1200']) {
    assert.ok(existsSync(new URL(`../public/img/photo/volodymyr-cta-${f}.webp`, import.meta.url)), f);
  }
  // ключи чата больше не используются
  for (const dict of [ua, en]) {
    assert.equal(dict.cta.chatHello, undefined, 'cta.chatHello удалён');
    assert.equal(dict.cta.chat, undefined, 'cta.chat удалён');
    assert.match(dict.cta.photoAlt, /Strokach|Строкач/, 'alt фото — свой ключ блока (founder.* может исчезнуть с блоком 10)');
  }
  assert.doesNotMatch(ctaJs, /phone|typing/, 'cta.js — без чата');
});

test('14 CTA: фото без рамки — улица растворяется в фон, фигура поверх с тёплым контуром; кадр крупный, забор ниже края', () => {
  assert.doesNotMatch(ctaCss, /\.cta__photo|::after/, 'рамки и старого фото нет');
  assert.match(ctaCss, /\.cta__scene-cut\s*\{[^}]*drop-shadow/, 'тёплый контур фигуры');
  assert.match(ctaCss, /\.cta__glow\s*\{[^}]*var\(--accent-2\)/, 'свечение за головой');
  // широкий экран: кадр выше блока в 1,5 раза — Володимир крупно («Давай приблизм владимира»)
  assert.match(ctaCss, /height:\s*calc\(var\(--cta-h\) \* 1\.3\)/);
  for (const [, prop] of ctaCss.matchAll(/transition:\s*([a-z-]+)/g)) assert.ok(['transform', 'opacity'].includes(prop), prop);
  assert.doesNotMatch(ctaCss, /@keyframes|animation:/, 'движение — только в видео шёлка');
});

// 2026-11-12 «Сделай чтобы не лагало» → «сделай как видео на фоне»: шёлк — заранее отрисованная видео-петля
test('14 CTA: фон «Silk» на весь блок — видео-петля из JS, грузится у блока, играет только пока он виден', async () => {
  assert.doesNotMatch(section(html, 'cta'), /<canvas|<video/, 'в HTML фона нет — его добавляет cta.js');
  assert.match(ctaJs, /document\.createElement\('video'\)/);
  assert.match(ctaJs, /video\.className = 'cta__silk'/);
  assert.doesNotMatch(ctaJs, /getContext|requestAnimationFrame/, 'в браузере ткань больше не рисуется');
  assert.match(ctaJs, /video\.muted = true;/);
  assert.match(ctaJs, /video\.preload = 'none';/);
  assert.match(ctaJs, /if \(reduced\) return;/, 'reduced-motion — только заставка');
  assert.match(ctaCss, /\.cta__silk\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*object-fit:\s*cover[^}]*mix-blend-mode:\s*screen/, 'на весь блок, чёрное убирает screen');
  assert.doesNotMatch(ctaCss.match(/\.section--cta\s*\{[^}]*\}/)[0], /isolation/, 'screen смешивается с фоном страницы, а не с пустым блоком');
  assert.match(ctaJs, /IntersectionObserver/);
  assert.match(ctaJs, /visibilitychange/);
  for (const n of ['silk-1920', 'silk-720']) for (const ext of ['mp4', 'jpg']) {
    assert.ok(existsSync(new URL(`../public/video/${n}.${ext}`, import.meta.url)), `${n}.${ext}`);
  }
  assert.doesNotMatch(ctaJs, /cta-lines|contourSegments/, 'топографических линий больше нет');
  const { SILK, UNIT_H, silkY, sheenOf, lineCount, hexRgb } = await import('../src/sections/cta-silk.js');
  assert.equal(UNIT_H, 877);
  assert.ok(lineCount() * SILK.gap >= UNIT_H + 60, 'линии закрывают всю высоту');
  assert.equal(silkY(5, 100, 2), silkY(5, 100, 2), 'один и тот же рисунок');
  assert.notEqual(silkY(5, 100, 2), silkY(5, 100, 3), 'ткань движется');
  // петля бесшовная: кадр LOOP совпадает с кадром 0
  const { LOOP } = await import('../src/sections/cta-silk.js');
  for (const i of [0, 9, 40]) for (const x of [0, 777]) assert.ok(Math.abs(silkY(i, x, 0) - silkY(i, x, LOOP)) < 1e-6 && Math.abs(sheenOf(i, 0) - sheenOf(i, LOOP)) < 1e-6);
  for (const t of [0, 1.3, 7]) for (const i of [0, 10, 40]) { const s = sheenOf(i, t); assert.ok(s >= 0 && s <= 1); }
  assert.ok(SILK.base + SILK.sheen <= 0.4, 'ткань не перебивает текст');
  assert.deepEqual(hexRgb('#FFD23F'), [255, 210, 63]);
  assert.equal(hexRgb('red'), null);
});

test('13 — не выше телефона, 14 — ровно экран на широком; телефон 13 и фото 14 — на всю высоту блока', () => {
  for (const id of ['faq', 'cta']) {
    const c = strip(read(`src/styles/sections/${id}.css`));
    const wide = c.slice(c.indexOf('@media (min-width: 900px) and (orientation: landscape)'));
    // 2026-11-11 равные промежутки: FAQ — не выше телефона (46rem), финальный экран — по-прежнему во всё окно
    if (id === 'faq') assert.match(wide, /min-height:\s*min\(calc\(100svh - var\(--header-h\) - 2 \* var\(--screen-pad\)\), 46rem\)/, id);
    else assert.match(wide, /min-height:\s*calc\(100svh - var\(--header-h\) - 2 \* var\(--screen-pad\)\)/, id);
    // 2026-11-11: телефон FAQ того же размера, что телефон блока 04 («такого же размера, как и первый телефон»)
    if (id === 'faq') assert.match(wide, /\.faq__stage \.phone\s*\{[^}]*height:\s*var\(--formats-phone-h, 100%\)/, 'faq: размер как у 04');
    // 2026-11-11: фото 14 привязано к самому блоку и выше его — на всю высоту
    else assert.match(wide, /\.cta__stage\s*\{[^}]*position:\s*absolute;\s*inset:\s*0/, 'cta: фото на всю высоту блока');
    assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b|rgba?\(/i, `${id}: цвета`);
  }
});

test('13 FAQ: ответы из документа клиента (стр. 13) — q7, q8; q5 — GEO блока 08; «гарантія» убрана', () => {
  const byId = Object.fromEntries(faqData.items.map((item) => [item.id, item]));
  assert.equal(byId.q9, undefined, 'q9 «Чи є гарантія результату?» удалён');
  assert.ok(!faqData.items.some((item) => /гаранті/i.test(item.q.ua)), 'вопроса о гарантии нет');
  assert.equal(byId.q7.q.ua, 'Чи можете створити Telegram-канал з нуля?');
  assert.equal(byId.q7.a.ua, 'Так, можемо створити, оформити та підготувати Telegram-канал до запуску реклами.');
  assert.equal(byId.q8.a.ua, 'Так, працюємо з українськими та міжнародними проєктами, налаштовуючи рекламу на потрібні країни й аудиторії.');
  // 2026-11-12 клиент: «В этом ответе я допустил ошибку. Нужно убрать «окрім росії та України»»
  assert.equal(byId.q5.a.ua, 'Telegram Ads охоплює понад 200 GEO — практично весь світ.');
  for (const id of ['q5', 'q7', 'q8']) {
    assert.ok(byId[id].a.en && !/TBD/.test(byId[id].a.en), `${id}: EN-перевод`);
    assert.doesNotMatch(byId[id].a.en, /[а-яіїєґ]/i, `${id}: EN без кириллицы`);
  }
  // id остальных вопросов не сдвинуты — админка и аналитика ссылаются на них
  assert.deepEqual(faqData.items.map((item) => item.id), ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8']);
});

// «Лагает экран» → «Сделай чтобы не лагало»: шёлк — видео (декодирует видеокарта); screen — только у видео; фигура на своём слое
test('14 CTA: шёлк лёгкий — видео вместо рисования, режим смешивания только у шёлка; фигура на своём слое', () => {
  assert.equal((ctaCss.match(/mix-blend-mode/g) || []).length, 1);
  assert.match(ctaCss, /\.cta__scene\s*\{[^}]*will-change:\s*transform/);
});

// клиент 2026-11-11: «В моб версии может сделать просто выпадающий список? А то каждый раз перекидывает на телефон»
test('13 FAQ на узком экране — выпадающий список: ответ под вопросом, телефон скрыт', () => {
  const faq = read('src/sections/faq.js');
  const css = read('src/styles/sections/faq.css');
  assert.match(faq, /export const ACCORDION_MEDIA = '\(max-width: 899px\), \(orientation: portrait\)';/);
  assert.match(faq, /if \(accordion\(\)\) return toggle\(i\);/);
  assert.match(faq, /class: 'faq__a', attrs: \{ id: `faq-a-\$\{i\}`, hidden: '' \}/);
  assert.match(css, /\.is-accordion \.faq__stage\s*\{\s*display: none;/);
  assert.match(css, /\.is-accordion \.faq__q\[aria-expanded='true'\] \.faq__mark\s*\{\s*transform: rotate\(45deg\);/);
});
