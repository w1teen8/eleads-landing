// T35 (H48): блок 10 «Відгуки + засновник» — кружки, как видео-сообщения Telegram (выбор пользователя «Рев С»;
// образец reference/run3/reviews-C-chosen.png). Слева Володимир в большом круге с жёлто-оранжевым кольцом, справа ряд
// круглых аватаров клиентов, карточка отзыва выбранного и цифры. Отзывы сами листаются раз в 10 с.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { reviewAvatar, isTbd } from '../src/sections/reviews-model.js';

const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const cases = readJson('src/data/cases.json').cases;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const s = html.split(/<section\b[^>]*\sid="reviews"/)[1].split('</section>')[0];
const css = strip(read('src/styles/sections/reviews.css'));
const js = strip(read('src/sections/reviews.js'));
const count = (str, re) => (str.match(re) || []).length;

test('прежнего слайдера нет — ни в разметке, ни в CSS, ни в JS, ни в словарях', () => {
  for (const src of [s, css, js]) {
    assert.doesNotMatch(src, /data-slider|reviews__slide|reviews__dot|reviews__btn|reviews__viewport|scroll-snap|aria-roledescription/);
  }
  for (const dict of [ua, en]) for (const key of ['prev', 'next', 'sliderLabel']) assert.equal(dict.reviews[key], undefined, `reviews.${key}`);
  assert.doesNotMatch(html, /reviews\.(prev|next|sliderLabel)/);
});

test('засновник слева: круг с фото, «Засновник eLeads», имя, текст; кнопка ▶ скрыта, пока нет видео', () => {
  const order = ['founder', 'reviews'].map((cls) => s.search(new RegExp(`class="${cls}\\b`)));
  assert.ok(order[0] > -1 && order[0] < order[1], 'засновник — первым (слева)');
  assert.match(s, /class="founder__circle"[^>]*data-founder-circle/);
  assert.match(s, /\/img\/photo\/volodymyr-founder-480\.jpg/);
  assert.match(s, /data-i18n-attr="alt:founder\.photoAlt"/);
  assert.match(s, /data-i18n="founder\.badge"/);
  assert.match(s, /class="founder__name" data-i18n="founder\.name"/);
  assert.match(s, /data-i18n="founder\.text"/);
  assert.match(s, /<button type="button" class="founder__play" data-founder-play hidden/, 'без видео кнопка скрыта уже в HTML');
  for (const dict of [ua, en]) {
    assert.equal(dict.founder.video, '', 'видео-кружка пока нет: пустое поле = кнопки нет');
    for (const key of ['name', 'play', 'sound', 'pause']) assert.ok(dict.founder[key], `founder.${key}`);
  }
  assert.equal(ua.founder.name, 'Володимир Кучер');
  assert.equal(en.founder.name, 'Volodymyr Kucher');
  // видео: по клику, без звука по умолчанию, со звуком — по второму клику; файл — через publicUrl
  assert.match(js, /t\('founder\.video'\)/);
  assert.match(js, /\.muted = true/);
  assert.match(js, /\.muted = false/);
  assert.match(js, /publicUrl\(/);
  assert.match(js, /playsinline/);
});

test('отзывы справа: метка, tablist из кружков, карточка-tabpanel, цифры 7+ / $2M+ / 50+', () => {
  const order = ['reviews__kicker', 'reviews__row', 'reviews__card', 'reviews__stats'].map((cls) => s.search(new RegExp(`class="${cls}\\b`)));
  for (const i of order) assert.ok(i > -1, 'нет части');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'порядок: метка → кружки → отзыв → цифры');
  assert.match(s, /<p class="reviews__kicker" id="rv-kicker" data-i18n="reviews\.kicker"/);
  assert.match(s, /<div class="reviews__row" role="tablist" aria-labelledby="rv-kicker" data-rv-list>/);
  const tabs = [...s.matchAll(/<button type="button" class="reviews__tab" role="tab"[^>]*>/g)].map((m) => m[0]);
  assert.equal(tabs.length, ua.reviews.items.length);
  tabs.forEach((tab, i) => {
    assert.match(tab, new RegExp(`id="rv-tab-${i}"`));
    assert.match(tab, new RegExp(`aria-selected="${i === 0}"`));
    assert.match(tab, new RegExp(`tabindex="${i === 0 ? 0 : -1}"`));
    assert.match(tab, /aria-controls="rv-panel"/);
  });
  // имя кружка для скринридера — из словаря; кольцо прогресса — две половины, как у диска блока 09
  assert.equal(count(s, /<span class="visually-hidden" data-i18n="reviews\.items\.\d\.name"><\/span>/g), tabs.length);
  assert.equal(count(s, /class="reviews__arc reviews__arc--[rl]"/g), tabs.length * 2);
  assert.match(s, /class="reviews__card" id="rv-panel" role="tabpanel" aria-live="off" aria-labelledby="rv-tab-0"/);
  for (const f of ['name', 'role', 'quote']) assert.match(s, new RegExp(`data-rv-${f} data-i18n="reviews\\.items\\.0\\.${f}"`), f);
  for (const k of ['years', 'budgets', 'projects']) assert.match(s, new RegExp(`data-i18n="hero\\.stats\\.${k}\\.value"`));
  assert.doesNotMatch(s.replace(/<svg[\s\S]*?<\/svg>/g, ''), />\s*[^\s<{][^<]*</, 'текст в разметке мимо словаря');
});

test('данные не выдуманы: тексты — заглушки, аватары — только подтверждённых кейсов, третий — буква', () => {
  for (const item of ua.reviews.items) assert.equal(item.quote, 'уточнити');
  for (const item of en.reviews.items) assert.equal(item.quote, 'TBD');
  assert.deepEqual(ua.reviews.items.map((i) => i.case), ['mukhin', 'dombovetskyi', '']);
  assert.deepEqual(en.reviews.items.map((i) => i.case), ['mukhin', 'dombovetskyi', '']);
  assert.deepEqual(ua.reviews.items.map((i) => i.name), ['Олександр Мухін', 'Віктор Домбовецький', 'Відгук 3']);
  for (const id of ['mukhin', 'dombovetskyi']) {
    const c = cases.find((x) => x.id === id);
    assert.ok(c && c.avatar === true, `кейс ${id} с аватаром`);
  }
  assert.ok(ua.reviews.kicker && en.reviews.kicker, 'reviews.kicker в обоих словарях');
});

test('reviewAvatar: путь и цвет из cases.json; без кейса или без avatar:true — null (круг с буквой)', () => {
  const path = (id, retina) => `/x/${id}${retina ? '@2x' : ''}.webp`;
  assert.deepEqual(reviewAvatar('mukhin', cases, path), { src: '/x/mukhin.webp', srcset: '/x/mukhin.webp 1x, /x/mukhin@2x.webp 2x', accent: '#7B4DFF' });
  assert.deepEqual(reviewAvatar('dombovetskyi', cases, path), {
    src: '/x/dombovetskyi.webp',
    srcset: '/x/dombovetskyi.webp 1x, /x/dombovetskyi@2x.webp 2x',
    accent: '#5BE84A',
  });
  assert.equal(reviewAvatar('', cases, path), null);
  assert.equal(reviewAvatar('nope', cases, path), null);
  assert.equal(reviewAvatar('x', [{ id: 'x', avatar: false, accent: '#fff' }], path), null);
  assert.deepEqual(reviewAvatar('x', [{ id: 'x', avatar: true, avatarRetina: false, accent: 'red' }], path), { src: '/x/x.webp', srcset: null, accent: null });
  assert.ok(isTbd('уточнити') && isTbd('TBD') && isTbd(' TBD '));
  assert.ok(!isTbd('Експерт'));
  // аватар — через publicUrl и avatarPath блока кейсов; ПроSales Мухину и Домбовецькому не ставится
  assert.match(js, /reviewAvatar\(/);
  assert.match(js, /publicUrl\(avatarPath\(/);
  assert.doesNotMatch(js + s, /prosales/i);
});

test('доступность: стрелки, Home/End; aria-live включается только при ручном выборе', () => {
  assert.match(js, /setAttribute\('aria-live', manual \? 'polite' : 'off'\)/);
  for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) assert.match(js, new RegExp(`\\b${key}\\b`));
  assert.match(css, /\.reviews__tab:focus-visible\s*\{[^}]*outline/);
});

test('автолистание: раз в 10 с; пауза только на самом кружке, на фокусе с клавиатуры, вне окна и на скрытой вкладке', () => {
  const step = Number(read('src/sections/reviews-model.js').match(/export const STEP_MS = (\d+);/)?.[1]);
  assert.equal(step, 10000, `шаг ${step}`);
  for (const ev of ['pointerenter', 'pointerleave', 'focusin', 'focusout', 'visibilitychange']) assert.match(js, new RegExp(`'${ev}'`));
  assert.doesNotMatch(js, /on\((root|host|list), 'pointerenter'/, 'наведение на блок целиком листание не останавливает — только на кружки');
  assert.match(js, /for \(const tab of tabs\) \{\s*on\(tab, 'pointerenter'/);
  assert.match(js, /:focus-visible/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /if \(reduced\)/, 'reduced-motion / ?nomotion=1 — без автолистания');
  assert.match(js, /\.pause\(\)/);
  assert.match(js, /\.play\(\)/);
  assert.match(js, /import \{ flipSwap \} from '\.\.\/core\/motion-kit\.js'/);
  assert.doesNotMatch(js, /ScrollTrigger|stagger\(|reveal\(/, 'появления по прокрутке нет');
});

test('облик: кольца — box-shadow/border, движение — только transform и opacity; телефон — круг ≈220px, кружки листаются в ряду', () => {
  assert.match(css, /\.founder__circle\s*\{[^}]*--fd-d:/, 'диаметр круга засновника — переменная');
  assert.match(css, /\.founder__circle\s*\{[^}]*background:\s*var\(--grad\)/, 'жёлто-оранжевое кольцо');
  assert.match(css, /\.reviews__tab\s*\{[^}]*--rv-c:/, 'диаметр кружка клиента — переменная');
  assert.match(css, /\.reviews__row\s*\{[^}]*overflow-x:\s*auto/, 'кружки прокручиваются внутри ряда');
  assert.match(css, /\.reviews__name\s*\{[^}]*font-weight/);
  assert.match(css, /\.reviews__text\.is-tbd[^{]*\{[^}]*font-style:\s*italic/, 'заглушка — курсивом, приглушённо');
  assert.match(css, /@media \(max-width: 599px\)\s*\{[\s\S]*?--fd-d:\s*13\.75rem/, 'телефон: круг 220px');
  assert.doesNotMatch(css, /stroke-dash/);
  for (const m of css.matchAll(/transition:\s*([^;]+);/g)) {
    for (const part of m[1].split(',')) assert.match(part.trim(), /^(transform|opacity)\b/, `transition: ${part}`);
  }
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i, 'литерал цвета');
  assert.match(css, /\d(?:\.\d+)?svh/, 'на десктопе — от высоты окна');
});
