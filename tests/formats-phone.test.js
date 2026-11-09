// Блок 04 «Як виглядає реклама» (T27, H34): три формата — вкладки слева, справа крупный телефон с экраном «как Telegram»
// (тёмная тема, акценты канала вместо синего). На экране — макет рекламы выбранного формата; чужие посты — скелетоны.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const html = read('index.html');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const js = read('src/sections/formats.js');
const css = strip(read('src/styles/sections/formats.css'));
const formats = html.split(/<section\b[^>]*\sid="formats"/)[1].split('</section>')[0];
const count = (s, re) => (s.match(re) || []).length;
const KINDS = ['channel', 'video', 'bot'];

const panel = (kind) => {
  const start = formats.indexOf(`data-formats-panel="${kind}"`);
  assert.ok(start > -1, `нет панели ${kind}`);
  const from = formats.lastIndexOf('<', start);
  const next = KINDS.map((k) => formats.indexOf(`data-formats-panel="${k}"`)).filter((i) => i > start);
  const end = formats.lastIndexOf('<', next.length ? Math.min(...next) : formats.indexOf('data-lightbox-open'));
  return formats.slice(from, end);
};

test('вкладки: role=tablist, три role=tab 01–03 с aria-controls/aria-selected, три панели role=tabpanel', () => {
  assert.equal(count(formats, /role="tablist"/g), 1);
  assert.equal(count(formats, /class="formats__item"/g), 3, 'три формата');
  const tabs = [...formats.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map((m) => m[0]);
  assert.equal(tabs.length, 3);
  tabs.forEach((tab, i) => {
    const kind = KINDS[i];
    assert.match(tab, new RegExp(`data-formats-tab="${kind}"`), kind);
    assert.match(tab, new RegExp(`id="formats-tab-${kind}"`));
    assert.match(tab, new RegExp(`aria-controls="formats-panel-${kind}"`));
    assert.match(tab, new RegExp(`aria-selected="${i === 0 ? 'true' : 'false'}"`));
    assert.match(tab, new RegExp(`tabindex="${i === 0 ? '0' : '-1'}"`));
  });
  for (const [i, kind] of KINDS.entries()) {
    const p = formats.match(new RegExp(`<[a-z]+\\b[^>]*data-formats-panel="${kind}"[^>]*>`))[0];
    assert.match(p, /role="tabpanel"/, kind);
    assert.match(p, new RegExp(`id="formats-panel-${kind}"`));
    assert.match(p, new RegExp(`aria-labelledby="formats-tab-${kind}"`));
    if (i > 0) assert.match(p, /\shidden(\s|>)/, `${kind}: скрыта до выбора`);
    else assert.doesNotMatch(p, /\shidden(\s|>)/, 'первая вкладка открыта сразу');
    assert.match(panel(kind), new RegExp(`class="tg-ad tg-ad--${kind}[ "]`), `${kind}: макет рекламы в панели`);
  }
  // номера 01–03 и подписи — внутри вкладок, из словаря
  for (const i of [0, 1, 2]) {
    assert.match(formats, new RegExp(`data-i18n="formats\\.items\\.${i}\\.num"`));
    assert.match(formats, new RegExp(`data-i18n="formats\\.items\\.${i}\\.title"`));
    assert.match(formats, new RegExp(`data-i18n="formats\\.items\\.${i}\\.text"`));
  }
  assert.doesNotMatch(formats, /<h3\b/, 'внутри кнопки-вкладки заголовков нет (phrasing content)');
});

test('переключение: наведение мыши, клик, стрелки и Home/End; смена экрана ≈350 мс только transform/opacity, при reduced — сразу', () => {
  assert.match(js, /pointerenter/, 'наведение переключает вкладку');
  assert.match(js, /pointerType\s*===\s*'mouse'/, 'наведение — только мышь, не тач');
  assert.match(js, /ArrowDown|ArrowRight/);
  assert.match(js, /'Home'/);
  assert.match(js, /aria-selected/);
  assert.match(js, /SWAP_MS\s*=\s*350/);
  assert.match(js, /\breduced\b/);
  // кадры смены экрана — только transform и opacity
  for (const [, frames] of js.matchAll(/\.animate\(\s*\[([\s\S]*?)\]/g)) {
    for (const [, prop] of frames.matchAll(/\b([a-zA-Z]+)\s*:/g)) assert.ok(['transform', 'opacity'].includes(prop), `кадр: ${prop}`);
  }
  // появлений по прокрутке и других эффектов нет
  for (const fn of ['stackReveal', 'stagger', 'flipSwap']) assert.doesNotMatch(js, new RegExp(`\\b${fn}\\(`), fn);
  assert.doesNotMatch(js, /gsap|ScrollTrigger|IntersectionObserver/);
  assert.equal(count(formats, /data-reveal/g), 0);
});

test('экран как Telegram: строка состояния с иконками, шапка чата (стрелка, аватар, MONOLIT, «канал»/«бот»), лента, низ', () => {
  assert.match(formats, /class="phone\b/);
  const status = formats.match(/class="phone__status"[\s\S]*?class="phone__panels"/)[0];
  assert.match(status, /data-i18n="formats\.phone\.time"/, 'время — из словаря');
  assert.ok(count(status, /<svg\b/g) >= 3, 'сигнал, wi-fi, батарея — иконки, не текст');
  assert.doesNotMatch(status, /[0-9]{1,3}\s*%/, 'заряд батареи — иконка, не число');
  for (const kind of KINDS) {
    const p = panel(kind);
    assert.match(p, /class="phone__back"[^>]*>\s*<svg/, `${kind}: стрелка назад`);
    assert.match(p, /class="phone__avatar"[^>]*data-i18n="formats\.phone\.avatar"/, `${kind}: аватар`);
    assert.match(p, /class="phone__name"[^>]*data-i18n="formats\.mock\.brand"/, `${kind}: название MONOLIT`);
    assert.match(p, new RegExp(`class="phone__sub"[^>]*data-i18n="formats\\.phone\\.${kind === 'bot' ? 'bot' : 'channel'}"`), `${kind}: подпись`);
    assert.ok(count(p, /class="phone__skel/g) >= 2, `${kind}: чужие посты — скелетоны`);
  }
  assert.match(panel('channel'), /data-i18n="formats\.phone\.sponsored"/, 'метка «Спонсороване» у рекламы в канале');
  assert.match(panel('channel'), /data-i18n="formats\.phone\.join"/, 'снизу — «Приєднатися»');
  assert.match(panel('video'), /data-i18n="formats\.phone\.join"/);
  assert.match(panel('bot'), /data-i18n="formats\.phone\.message"/, 'у бота — поле ввода «Повідомлення»');
  assert.match(panel('bot'), /class="phone__input"/);
  // спонсорское сообщение — внизу ленты канала: метка и макет после скелетонов
  const ch = panel('channel');
  assert.ok(ch.lastIndexOf('phone__skel') < ch.indexOf('formats.phone.sponsored'), 'скелетоны выше рекламы');
});

test('в ленте телефона нет придуманных текстов и цифр: всё видимое — из словаря или скелетоны', () => {
  for (const kind of KINDS) {
    const text = panel(kind)
      .replace(/<svg\b[\s\S]*?<\/svg>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/0:00|[$€]/g, '') // обложка медиа: таймер видео и монеты — часть существующего макета
      .replace(/\s+/g, '');
    assert.equal(text, '', `${kind}: лишний текст в разметке — «${text}»`);
  }
  for (const dict of [ua, en]) {
    const { time, ...rest } = dict.formats.phone;
    assert.match(time, /^\d{1,2}:\d{2}$/, 'время — единственная цифра на экране вне макета');
    assert.doesNotMatch(Object.values(rest).join(' '), /\d|підписник|subscriber|переглад|views/i, 'без выдуманных подписчиков и просмотров');
  }
});

test('ключи интерфейса телефона в обоих словарях; UA — как в Telegram', () => {
  const keys = ['time', 'avatar', 'channel', 'bot', 'sponsored', 'join', 'message', 'tabsLabel'];
  for (const [lang, dict] of [['ua', ua], ['en', en]]) {
    for (const key of keys) assert.equal(typeof dict.formats.phone[key], 'string', `${lang}: formats.phone.${key}`);
  }
  assert.equal(ua.formats.phone.sponsored, 'Спонсороване');
  assert.equal(ua.formats.phone.channel, 'канал');
  assert.equal(ua.formats.phone.bot, 'бот');
  assert.equal(ua.formats.phone.join, 'Приєднатися');
  assert.equal(ua.formats.phone.message, 'Повідомлення');
  assert.equal(ua.formats.phone.time, '9:41');
  assert.equal(en.formats.phone.sponsored, 'Sponsored');
  // строки под блоком не тронуты
  assert.equal(ua.formats.hint, 'Натисніть на скриншот, щоб збільшити приклад.');
  assert.equal(ua.formats.caption, 'Реальні приклади розміщень клієнта MONOLIT');
  assert.match(formats, /data-i18n="formats\.hint"/);
  assert.match(formats, /data-i18n="formats\.caption"/);
});

test('лайтбокс: одна кнопка на экране телефона, открывает макет текущей вкладки; остальное как раньше', () => {
  assert.equal(count(formats, /data-lightbox-open/g), 1);
  const phone = formats.slice(formats.indexOf('class="phone'), formats.indexOf('<dialog'));
  assert.match(phone, /data-lightbox-open/, 'кнопка — внутри телефона');
  assert.match(js, /:not\(\[hidden\]\)/, 'берётся макет открытой панели');
  assert.match(js, /showModal/);
  assert.match(js, /trapFocus\(/);
  assert.match(formats, /<dialog class="lightbox"[^>]*data-lenis-prevent/);
});

test('оформление: телефон в палитре (без своих цветов), размер от высоты окна, экран масштабируется контейнерными единицами; на телефоне — пилюли', () => {
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'цвета — только переменные');
  assert.match(css, /\.phone\s*\{[^}]*aspect-ratio/, 'рамка держит пропорции экрана');
  assert.match(css, /\d(?:\.\d+)?cqw/, 'содержимое экрана — от ширины телефона');
  assert.match(css, /container-type:\s*(size|inline-size)/);
  assert.match(css, /\d(?:\.\d+)?svh/, 'высота — от окна');
  const mobile = css.match(/@media\s*\(max-width:\s*899px\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(mobile, /\.formats__tabs\s*\{[^}]*flex-wrap:\s*wrap/, 'вкладки в ряд пилюлями');
  assert.match(mobile, /\.formats__tab\s*\{[^}]*border-radius:\s*var\(--r-pill\)/);
  // активная вкладка — жёлто-оранжевая, подсветка проявляется opacity (transition только transform/opacity)
  assert.match(css, /\.formats__tab\[aria-selected='true'\]/);
  assert.match(css, /\.formats__tab::before\s*\{[^}]*background:\s*var\(--grad\)/);
});
