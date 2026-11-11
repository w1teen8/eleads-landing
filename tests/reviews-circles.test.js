// T35 (H48): блок 10 «Відгуки» — кружки, как видео-сообщения Telegram (выбор пользователя «Рев С»; образец
// reference/run3/reviews-C-chosen.png). T42 (правка клиента, reference/client-feedback/page-10.png): заголовок «Що
// говорять підприємці», фото и текста засновника нет — слева большой круг с жёлто-оранжевым кольцом показывает
// видео-отзыв выбранного клиента (reviews.items.*.video; пусто — аватар и «відео-відгук скоро»), два слота отзывов.
// Справа ряд круглых аватаров клиентов, карточка отзыва выбранного и цифры. Отзывы сами листаются раз в 10 с.
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { reviewAvatar, reviewVideo, isTbd } from '../src/sections/reviews-model.js';
import { validate } from '../src/admin/validate.js';

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

test('T42: заголовок «Що говорять підприємці»; засновника (фото, имя, текст) в блоке нет, founder.* удалён', () => {
  assert.equal(ua.reviews.title, 'Що говорять підприємці');
  assert.equal(ua.reviews.titleAccent, 'підприємці');
  assert.equal(en.reviews.title, 'What entrepreneurs say');
  for (const dict of [ua, en]) {
    assert.ok(dict.reviews.title.endsWith(dict.reviews.titleAccent), 'акцент — хвост заголовка');
    assert.equal(dict.founder, undefined, 'founder.* не нужен');
  }
  assert.doesNotMatch(s, /founder|volodymyr|photo-img|<picture/);
  assert.doesNotMatch(html, /data-i18n(?:-attr)?="[^"]*founder\./, 'на странице нет ключей founder.*');
  assert.doesNotMatch(css + js, /founder/);
});

test('большой круг слева — видео-отзыв выбранного клиента: аватар, «відео-відгук скоро», кнопка ▶ скрыта без файла', () => {
  const order = ['reviews__stage', 'reviews'].map((cls) => s.search(new RegExp(`class="${cls}\\b`)));
  assert.ok(order[0] > -1 && order[0] < order[1], 'круг — первым (слева)');
  assert.match(s, /class="reviews__circle" data-rv-circle/);
  assert.match(s, /class="reviews__screen" data-rv-screen/);
  assert.match(s, /<button type="button" class="reviews__play" data-rv-play hidden data-i18n-attr="aria-label:reviews\.player\.play">/, 'без видео кнопка скрыта уже в HTML');
  assert.match(s, /<p class="reviews__soon" data-rv-soon data-i18n="reviews\.player\.soon"><\/p>/);
  assert.equal(ua.reviews.player.soon, 'відео-відгук скоро');
  for (const dict of [ua, en]) for (const key of ['soon', 'play', 'sound', 'pause']) assert.ok(dict.reviews.player[key], `reviews.player.${key}`);
  // видео: по клику на круг или кнопку, без звука → со звуком → пауза; файл — через publicUrl; круг — аватар клиента
  assert.match(js, /reviewVideo\(item\(index, 'video'\)\)/);
  assert.match(js, /\.muted = true/);
  assert.match(js, /\.muted = false/);
  assert.match(js, /publicUrl\(file\(\)\)/);
  assert.match(js, /playsinline/);
  assert.match(js, /on\(screen, 'click', toggle\)/);
  assert.match(js, /stage\.show\(i\)/, 'смена отзыва меняет и большой круг');
});

test('видео-отзывы: два слота, путь к файлу — строка словаря (правится в админке), файлы лежат в public/', () => {
  for (const dict of [ua, en]) {
    assert.equal(dict.reviews.items.length, 2, 'клиент: «Додати два відеовідгуки»');
    for (const item of dict.reviews.items) {
      assert.deepEqual(Object.keys(item), ['name', 'role', 'quote', 'case', 'video']);
      // 2026-11-11: пользователь прислал оба видео (9:16), сжаты в public/video/reviews/
      assert.equal(item.video, `video/reviews/${item.case}.mp4`);
      assert.ok(existsSync(new URL(`../public/${item.video}`, import.meta.url)), item.video);
    }
  }
  // формат пути — тот же, что проверяет админка
  for (const path of ['video/reviews/mukhin.mp4', '/video/reviews/dombovetskyi.webm']) {
    assert.equal(reviewVideo(path), path);
    assert.equal(validate(path, { kind: 'file' }), null);
  }
  for (const bad of ['', '   ', 'reviews.items.0.video', 'https://evil.example/a.mp4', 'video/../x.mp4', 'video/a.mov']) {
    assert.equal(reviewVideo(bad), '', bad);
  }
  assert.equal(reviewVideo(' video/reviews/mukhin.mp4 '), 'video/reviews/mukhin.mp4');
  const readme = read('public/video/reviews/README.md');
  assert.match(readme, /Як додати відеовідгук/);
  assert.match(readme, /reviews\.items/);
  assert.match(read('README.md'), /Як додати відеовідгук/);
});

test('отзывы справа: метка, tablist из кружков, карточка-tabpanel, цифры 7+ / $2M+ / 50+', () => {
  const order = ['reviews__kicker', 'reviews__row', 'reviews__card', 'reviews__stats'].map((cls) => s.search(new RegExp(`class="${cls}\\b`)));
  for (const i of order) assert.ok(i > -1, 'нет части');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'порядок: метка → кружки → отзыв → цифры');
  assert.match(s, /<p class="reviews__kicker" id="rv-kicker" data-i18n="reviews\.kicker"/);
  assert.match(s, /<div class="reviews__row" role="tablist" aria-labelledby="rv-kicker" data-rv-list>/);
  const tabs = [...s.matchAll(/<button type="button" class="reviews__tab" role="tab"[^>]*>/g)].map((m) => m[0]);
  assert.equal(tabs.length, ua.reviews.items.length);
  assert.equal(tabs.length, 2);
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

test('данные не выдуманы: тексты — заглушки, авторы — Мухін и Домбовецький, аватары — только подтверждённых кейсов', () => {
  for (const item of ua.reviews.items) assert.equal(item.quote, 'уточнити');
  for (const item of en.reviews.items) assert.equal(item.quote, 'TBD');
  assert.deepEqual(ua.reviews.items.map((i) => i.case), ['mukhin', 'dombovetskyi']);
  assert.deepEqual(en.reviews.items.map((i) => i.case), ['mukhin', 'dombovetskyi']);
  assert.deepEqual(ua.reviews.items.map((i) => i.name), ['Олександр Мухін', 'Віктор Домбовецький']);
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
  assert.match(css, /\.reviews__play:focus-visible\s*\{[^}]*outline/);
});

test('автолистание: раз в 10 с; пауза на самом кружке, на фокусе с клавиатуры, вне окна, на скрытой вкладке и пока играет видео', () => {
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
  assert.match(js, /!state\.focused && !state\.playing/, 'во время видео-отзыва листание стоит');
  assert.match(js, /import \{ flipSwap \} from '\.\.\/core\/motion-kit\.js'/);
  assert.doesNotMatch(js, /ScrollTrigger|stagger\(|reveal\(/, 'появления по прокрутке нет');
});

test('облик: кольца — box-shadow/border, движение — только transform и opacity; телефон — круг ≈220px, кружки листаются в ряду', () => {
  assert.match(css, /\.reviews__circle\s*\{[^}]*--vd-d:/, 'диаметр большого круга — переменная');
  assert.match(css, /\.reviews__circle\s*\{[^}]*background:\s*var\(--grad\)/, 'жёлто-оранжевое кольцо');
  assert.match(css, /\.reviews__tab\s*\{[^}]*--rv-c:/, 'диаметр кружка клиента — переменная');
  assert.match(css, /\.reviews__row\s*\{[^}]*overflow-x:\s*auto/, 'кружки прокручиваются внутри ряда');
  assert.match(css, /\.reviews__name\s*\{[^}]*font-weight/);
  assert.match(css, /\.reviews__text\.is-tbd[^{]*\{[^}]*font-style:\s*italic/, 'заглушка — курсивом, приглушённо');
  assert.match(css, /@media \(max-width: 599px\)\s*\{[\s\S]*?--vd-d:\s*13\.75rem/, 'телефон: круг 220px');
  assert.doesNotMatch(css, /stroke-dash/);
  for (const m of css.matchAll(/transition:\s*([^;]+);/g)) {
    for (const part of m[1].split(',')) assert.match(part.trim(), /^(transform|opacity)\b/, `transition: ${part}`);
  }
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i, 'литерал цвета');
  assert.match(css, /\d(?:\.\d+)?svh/, 'на десктопе — от высоты окна');
});

// 2026-11-11: раскладка 10-2 и «видео 9 на 16 … вместо кружка»
test('видео-отзыв — вертикальная карточка 9:16, заголовок блока — в правой колонке', () => {
  const rcss = read('src/styles/sections/reviews.css');
  assert.match(rcss, /\.reviews__circle \{[^}]*aspect-ratio: 9 \/ 16;/);
  assert.doesNotMatch(rcss, /\.reviews__circle \{[^}]*border-radius: 50%/);
  const sec = read('index.html').split(/<section\b[^>]*\sid="reviews"/)[1].split('</section>')[0];
  const col = sec.indexOf('<div class="reviews" data-rv>');
  const head = sec.indexOf('class="section__head reviews__head"');
  assert.ok(col > -1 && head > col, 'заголовок внутри правой колонки');
  assert.ok(sec.indexOf('reviews__stage') < col, 'видео — слева');
});

// 2026-11-11: «видео должно само проигрываться, по окончанию переходит на следующее … проигрывается только если его видно»
test('видео-отзыв играет сам, пока карточку видно; закончилось — следующий отзыв; ушло из окна — пауза', () => {
  assert.match(js, /export const VIDEO_VISIBLE = 0\.6;/);
  assert.match(js, /intersectionRatio >= VIDEO_VISIBLE/, 'видимость — по самой карточке видео');
  assert.match(js, /stage\.setActive\(state\.videoInView && !state\.hidden\)/);
  assert.match(js, /if \(active && !userPaused && !reduced\) play\(\);\s*else if \(playing\(\)\) video\.pause\(\);/);
  assert.match(js, /onEnded: \(\) => select\(nextIndex\(current, total\), false\)/);
  assert.match(js, /on\(video, 'ended'/);
  // «сразу со звуком»; браузер без нажатия на странице разрешает только без звука — звук включит первое нажатие
  assert.match(js, /let soundOn = true;/);
  assert.match(js, /on\(document, 'pointerdown', unmuteOnGesture/);
  assert.match(js, /userPaused = true;/, 'пауза рукой — само не продолжает');
});
