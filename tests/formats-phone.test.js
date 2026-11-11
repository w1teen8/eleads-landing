// Блок 04 «Як виглядає реклама» (T27, H34): три формата — вкладки слева, справа крупный телефон с экраном «как Telegram»
// (тёмная тема, акценты канала вместо синего). На экране — макет рекламы выбранного формата; чужие посты — скелетоны.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';
import { expandPhones } from '../src/core/phone.js';

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
// T37: телефон — общий компонент: в разметке шаблон <phone-frame> (разворачивает сборка), стили рамки и экрана —
// src/styles/phone.css; блок 04 проверяется в том виде, в каком его получает браузер
const html = expandPhones(read('index.html'));
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const js = read('src/sections/formats.js');
const css = strip(read('src/styles/phone.css') + read('src/styles/sections/formats.css'));
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

test('переключение: наведение мыши, клик, стрелки и Home/End; смена экрана 600–700 мс, кроссфейд, только transform/opacity, при reduced — сразу', () => {
  assert.match(js, /pointerenter/, 'наведение переключает вкладку');
  assert.match(js, /pointerType\s*===\s*'mouse'/, 'наведение — только мышь, не тач');
  assert.match(js, /ArrowDown|ArrowRight/);
  assert.match(js, /'Home'/);
  assert.match(js, /aria-selected/);
  const ms = Number(js.match(/SWAP_MS\s*=\s*(\d+)/)[1]);
  assert.ok(ms >= 600 && ms <= 700, `SWAP_MS = ${ms}`);
  assert.match(js, /cubic-bezier\(0\.22, 1, 0\.36, 1\)/, 'кривая easing-out');
  assert.match(js, /\breduced\b/);
  assert.match(js, /translateX\(/, 'лента уезжает в сторону порядка вкладок');
  assert.match(js, /\.reverse\(\)/, 'быстрое переключение разворачивает текущую анимацию, а не стартует новую');
  assert.match(js, /fill:\s*'both'/, 'панели перекрываются на время смены — без чёрного кадра');
  // кадры смены экрана — только transform и opacity; двигаются лента и низ, шапка чата только проявляется
  const framesFn = js.slice(js.indexOf('function frames('), js.indexOf('return anims;'));
  const keyframes = [...framesFn.matchAll(/\[\{[\s\S]*?\}\]/g)];
  assert.ok(keyframes.length >= 3, 'кадры заданы в frames()');
  for (const [block] of keyframes) {
    for (const [, prop] of block.matchAll(/\b([a-zA-Z]+)\s*:/g)) assert.ok(['transform', 'opacity'].includes(prop), `кадр: ${prop}`);
  }
  for (const part of ['phone__feed', 'phone__bottom', 'phone__chat']) assert.match(framesFn, new RegExp(part), part);
  assert.doesNotMatch(framesFn, /phone__status|phone__panel\b/, 'строка состояния и панель целиком не двигаются');
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

// T41 (H54, документ клиента, стр. 4): «У відео / медіаконтенті» — пример, который раньше был у ботов (компактная
// карточка: логотип, заголовок, метка Ad, текст) поверх видео; «У ботах» — закреплённая плашка рекламы вверху чата бота
// по скриншоту клиента: «Реклама <назва> · що це?», жирный заголовок-акцент + текст в 2–3 строки, справа крестик
test('02 медиа: компактная карточка (лого, заголовок, Ad, текст) поверх видео; кнопки и подписи «Спонсороване» нет', () => {
  const p = panel('video');
  const ad = p.slice(p.indexOf('class="tg-ad tg-ad--video'));
  assert.match(ad, /class="tg-ad__cover"[\s\S]*class="tg-ad__time"/, 'видео с таймером');
  const card = ad.slice(ad.indexOf('class="tg-ad__card'));
  const head = card.match(/class="tg-ad__head">([\s\S]*?)<span class="tg-ad__body/)[1];
  const order = ['tg-ad__logo', 'tg-ad__title', 'tg-ad__ad'].map((c) => head.indexOf(c));
  assert.ok(order.every((i) => i > -1), 'лого, заголовок и метка Ad — в шапке карточки');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'порядок как у прежнего примера ботов');
  assert.match(card, /class="tg-ad__body"><span data-i18n="formats\.mock\.body"><\/span> <b class="tg-ad__brand" data-i18n="formats\.mock\.brand"><\/b><span data-i18n="formats\.mock\.bodyEnd">/);
  assert.doesNotMatch(p, /tg-ad__btn|formats\.mock\.button|formats\.phone\.sponsored/, 'без кнопки и метки канала');
  assert.match(css, /\.tg-ad--video \.tg-ad__card\s*\{[^}]*margin-top:\s*-/, 'карточка наезжает на низ видео, как в плеере Telegram');
});

test('03 бот: закреплённая плашка рекламы вверху чата — «Реклама MONOLIT · що це?», акцент + текст, крестик; ниже чат', () => {
  const p = panel('bot');
  const feed = p.slice(p.indexOf('class="phone__feed'));
  const pin = feed.match(/<span class="tg-ad tg-ad--bot">([\s\S]*?)<\/span>\s*<span class="phone__skel/);
  assert.ok(pin, 'плашка — первой в ленте, над сообщениями чата');
  const s = pin[1];
  assert.match(s, /class="tg-ad__pin-label"><span data-i18n="formats\.phone\.pinAd"><\/span> <b data-i18n="formats\.mock\.brand"><\/b><\/span>/, '«Реклама MONOLIT»');
  assert.match(s, /class="tg-ad__what" data-i18n="formats\.phone\.whatIs"/, '«що це?»');
  assert.match(s, /class="tg-ad__pin-text"><strong class="tg-ad__pin-accent" data-i18n="formats\.mock\.title"><\/strong> <span data-i18n="formats\.mock\.body"><\/span> <b class="tg-ad__brand" data-i18n="formats\.mock\.brand"><\/b><span data-i18n="formats\.mock\.bodyEnd">/);
  assert.match(s, /class="tg-ad__close" aria-hidden="true"><svg\b/, 'крестик — иконка');
  assert.doesNotMatch(s, /tg-ad__logo|tg-ad__btn|tg-ad__cover/, 'прежней карточки нет');
  assert.ok(count(feed, /class="phone__skel/g) >= 3, 'под плашкой — переписка с ботом');
  assert.match(css, /\.tg-ad__pin-text\s*\{[^}]*-webkit-line-clamp:\s*3/, 'текст — не больше 3 строк');
  // плашка прижата к верху ленты, переписка — к низу; если не влезает, срезается низ переписки, а не плашка
  assert.match(css, /\[data-formats-panel='bot'\] \.phone__feed\s*\{[^}]*justify-content:\s*flex-start/, 'лента бота — от верха');
  assert.match(css, /\.tg-ad--bot \+ \.phone__skel\s*\{[^}]*margin-top:\s*auto/, 'переписка — у поля ввода');
  assert.equal(ua.formats.phone.pinAd, 'Реклама');
  assert.equal(ua.formats.phone.whatIs, 'що це?');
  assert.equal(en.formats.phone.pinAd, 'Ad');
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
  const keys = ['time', 'avatar', 'channel', 'bot', 'sponsored', 'join', 'message', 'tabsLabel', 'pinAd', 'whatIs'];
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
  // строк под блоком нет (правка пользователя): ни ключей, ни разметки
  for (const dict of [ua, en]) for (const key of ['hint', 'caption', 'open', 'close']) assert.equal(dict.formats[key], undefined, key);
  assert.doesNotMatch(formats, /formats__foot|formats\.hint|formats\.caption/);
});

test('телефон не кликабелен: лайтбокса, лупы и <dialog> в блоке нет (правка пользователя)', () => {
  assert.doesNotMatch(formats, /data-lightbox|<dialog|phone__zoom|formats__zoom|aria-haspopup/);
  assert.doesNotMatch(js, /lightbox|showModal|lockScroll|trapFocus/);
  assert.doesNotMatch(css, /lightbox|zoom|cursor:\s*zoom/);
});

test('оформление: телефон в палитре (без своих цветов), размер от высоты окна, экран масштабируется контейнерными единицами; на телефоне — пилюли', () => {
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'цвета — только переменные');
  assert.match(css, /\.phone\s*\{[^}]*aspect-ratio/, 'рамка держит пропорции экрана');
  // корпус как у мокапов: металлический бортик градиентом, чёрная кромка, кнопки на торцах, блик на стекле, свет палитры снизу
  assert.match(css, /\.phone\s*\{[^}]*background:\s*linear-gradient\(/, 'металлический бортик');
  assert.match(css, /\.phone\s*\{[^}]*inset 0 -1px 1px color-mix\(in srgb, var\(--accent-2\)/, 'отражённый свет палитры на нижней грани');
  assert.match(css, /\.phone__screen\s*\{[^}]*box-shadow:\s*0 0 0 [\d.]+cqw var\(--phone-rim\)/, 'чёрная кромка под бортиком');
  for (const key of ['mute', 'up', 'down', 'power']) assert.match(formats, new RegExp(`class="phone__key phone__key--${key}"`), key);
  assert.match(formats, /class="phone__glare"/);
  assert.match(css, /\.phone__glare\s*\{[^}]*pointer-events:\s*none/);
  // обои экрана как в Telegram: градиент сине-серых тонов от --bg (oklch) и свой узор-дудлы одним SVG, без анимации
  assert.match(css, /\.phone__screen\s*\{[^}]*background-image:\s*url\("data:image\/svg\+xml,/, 'узор — одна SVG-картинка');
  assert.equal(count(css, /url\("data:image\/svg\+xml/g), 1, 'узор один');
  assert.match(css, /oklch\(from var\(--bg\)/, 'тона обоев — производные палитры');
  const svg = css.match(/url\("(data:image\/svg\+xml,[^"]+)"\)/)[1];
  assert.doesNotMatch(svg, /%23|#/, 'в узоре нет литералов цвета');
  assert.ok(count(svg, /%3Cpath/g) >= 6, 'несколько разных значков');
  assert.match(svg, /rotate\(/, 'значки с поворотами');
  assert.doesNotMatch(css, /\.phone__feed\s*\{[^}]*background/, 'лента прозрачна поверх обоев');
  for (const part of ['phone__status', 'phone__chat', 'phone__bottom']) assert.match(css, new RegExp(`\\.${part}\\s*\\{[^}]*background:\\s*var\\(--phone-bar\\)`), `${part}: подложка`);
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
