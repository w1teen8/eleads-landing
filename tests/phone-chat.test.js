// T37 (H49, H50): общий телефон (src/core/phone.js + src/styles/phone.css) в блоках 04, 13, 14.
// 13 «FAQ» — вариант A «переписка» (reference/run3/faq-A-chosen.png), 14 «Фінальний CTA» — вариант B «чат з Володимиром»
// (reference/run3/cta-B-chosen.png). Пользователь: «если ты делаешь копию телеграмм … сделай экран телефона».
import { test } from 'node:test';
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

// кадры WAAPI: все ключи объектов внутри .animate([...]) — только transform и opacity
const animatedProps = (code) =>
  [...code.matchAll(/\.animate\(\s*(\[[\s\S]*?\])\s*,/g)].flatMap(([, frames]) => [...frames.matchAll(/\b([a-zA-Z]+)\s*:/g)].map((m) => m[1]));

test('общий телефон: шаблон <phone-frame> в трёх блоках, рамка разворачивается сборкой, копий рамки в разметке нет', () => {
  for (const id of ['formats', 'faq', 'cta']) assert.equal(count(section(raw, id), /<phone-frame\b/g), 1, `${id}: один телефон`);
  assert.equal(count(raw, /<phone-frame\b/g), 3, 'телефонов на странице три');
  for (const part of ['phone__island', 'phone__status', 'phone__glare', 'phone__key']) {
    assert.doesNotMatch(raw, new RegExp(part), `${part} — только в шаблоне src/core/phone.js`);
  }
  const built = prerender(raw, ua, config);
  assert.doesNotMatch(built, /<phone-frame\b/, 'сборка разворачивает все шаблоны');
  assert.equal(count(built, /class="phone__screen"/g), 3);
  assert.equal(count(built, /<span class="phone__time" data-i18n="formats\.phone\.time">9:41<\/span>/g), 3, 'время — из словаря');
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
  // чат 13/14: пузыри, «друкує…», кнопка отправки, ссылка на весь экран
  for (const cls of ['phone__view', 'phone__thread', 'phone__msg', 'phone__msg--out', 'phone__typing', 'phone__send', 'phone__link', 'phone__avatar--photo']) {
    assert.match(phoneCss, new RegExp(`\\.${cls}\\b`), cls);
  }
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
  assert.equal(faqData.items.length, 9);
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

test('14 CTA: заголовок, текст, кнопка в Telegram; телефон с чатом @Kucherflow — одно приглашение, поле ввода и отправка', () => {
  const s = section(html, 'cta');
  assert.match(s, /class="btn btn--primary[^"]*cta__btn"[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="final_cta"/);
  assert.match(s, /data-i18n="cta\.text"/);
  assert.match(s, /class="phone cta__phone" data-cta-phone/);
  assert.match(s, /\{\{config\.telegramHandle\}\}<\/span> · <span data-cta-status data-i18n="cta\.chat\.status">/);
  assert.match(s, /\/img\/photo\/volodymyr-founder-480\.webp/);
  assert.equal(count(s, /class="phone__msg /g), 1, 'одно сообщение');
  assert.match(s, /class="phone__msg phone__msg--in" data-cta-hello><span class="phone__msg-text" data-i18n="cta\.chatHello">/);
  assert.match(s, /class="phone__placeholder" data-i18n="formats\.phone\.message"/);
  assert.match(s, /class="phone__send"/);
  // весь экран телефона — ссылка в Telegram; не второй стоп табуляции
  assert.match(s, /<a class="phone__link" href="\{\{config\.telegramUrl\}\}"[^>]*tabindex="-1" aria-hidden="true" data-place="final_cta_chat">/);
  assert.doesNotMatch(s, /cta__photo|cta__handle|data-cta-photo/, 'прежнего фото и пилюли @handle нет');
  for (const dict of [ua, en]) {
    assert.ok(dict.cta.chatHello && dict.cta.chatHello.length < dict.cta.text.length, 'приглашение — короче cta.text');
    for (const key of ['name', 'status', 'typing']) assert.equal(typeof dict.cta.chat[key], 'string', `cta.chat.${key}`);
  }
  // без новых фактов: цифр в приглашении нет
  for (const dict of [ua, en]) assert.doesNotMatch(dict.cta.chatHello, /\d/);
});

test('14 CTA: сообщение приходит после «друкує…» один раз при появлении блока; reduced — видно сразу', () => {
  assert.match(ctaJs, /if \(reduced \|\|[^;]*\) return;/, 'reduced-motion / ?nomotion=1 — сообщение из разметки, без анимации');
  assert.match(ctaJs, /io\.disconnect\(\)/, 'один раз');
  assert.match(ctaJs, /cta\.chat\.typing/);
  assert.match(ctaJs, /phone__typing/);
  const typing = Number(ctaJs.match(/TYPING_MS\s*=\s*(\d+)/)[1]);
  assert.ok(typing >= 500 && typing <= 1500);
  for (const prop of animatedProps(ctaJs)) assert.ok(['transform', 'opacity'].includes(prop), `cta.js: ${prop}`);
  assert.doesNotMatch(ctaJs, /\b(stagger|stackReveal|gsap|ScrollTrigger|pointermove)\b/);
});

test('13 и 14 — ровно экран на широком; телефон на всю высоту блока', () => {
  for (const id of ['faq', 'cta']) {
    const c = strip(read(`src/styles/sections/${id}.css`));
    const wide = c.slice(c.indexOf('@media (min-width: 900px) and (orientation: landscape)'));
    assert.match(wide, /min-height:\s*calc\(100svh - var\(--header-h\) - 2 \* var\(--screen-pad\)\)/, id);
    assert.match(wide, new RegExp(`\\.${id}__stage \\.phone\\s*\\{[^}]*height:\\s*100%`), `${id}: телефон по высоте`);
    assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b|rgba?\(/i, `${id}: цвета`);
  }
});
