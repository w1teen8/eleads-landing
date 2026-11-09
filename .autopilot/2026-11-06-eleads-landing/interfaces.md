# Границы, решённые в спецификации

Это первый файл, который читает исполнитель таска. Он описывает, как модули стыкуются,
чтобы два параллельных таска не построили две разные системы.

## Правила проекта

1. **Vite + vanilla JS, без фреймворков.** Никакого React, Vue, Tailwind, jQuery, UI-китов.
2. **Весь текст — из JSON.** В исходнике `index.html` не должно быть ни одной украинской или английской
   фразы, кроме `<noscript>`. Любая строка приходит из `src/data/content.<lang>.json`, `cases.json`,
   `faq.json`, `calculator.json`. Украинский текст вписывается в узлы `[data-i18n]` при сборке
   плагином `vite-plugin-i18n-prerender` (`build/i18n-prerender.js`), английский — в рантайме.
3. **Анимируем только `transform` и `opacity`.** Никаких анимаций `filter`, `blur`, `box-shadow`,
   `width`, `height`, `top/left`. `backdrop-filter` разрешён ровно в одном месте — шапка.
4. **Контент виден без JS.** Секция не прячется навсегда через `opacity: 0`: начальное состояние
   ревила ставит JS (класс `.js-anim` на `<html>`), и при выключенном JS всё видно.
5. **Один canvas на странице** — GEO-карта; ставится на паузу через IntersectionObserver.
6. **Имена в коде английские**, kebab-case для файлов и CSS-классов, camelCase для JS.
7. **Никаких придуманных фактов о клиенте.** Нет данных — видимая заглушка «уточнити» / `[EN draft]`,
   никогда правдоподобное число.
8. **CSS-классы — БЭМ-подобные, с префиксом секции**: `.hero__title`, `.calc__funnel-step`.
   Утилиты общие: `.container`, `.eyebrow`, `.btn`, `.btn--primary`, `.reveal`.

## Стек, команды, проверка

- Node 24, npm 11. Vite 5, `gsap` 3.12+, `lenis` 1.x. Других runtime-зависимостей нет.
- `npm install` — установить; `npm run dev` — локальный сервер; `npm run build` — статика в `dist/`;
  `npm run preview` — посмотреть сборку.
- **`npm run check`** — единственная команда проверки: `node --test` по `tests/` **и** `vite build`.
  Таск не сдаётся, пока она красная. Один файл тестов: `node --test tests/<file>.test.js`.
- Ключи UA/EN проверяются тестом `tests/i18n-keys.test.js`: наборы ключей в двух файлах совпадают.
- **Нельзя трогать:** `.autopilot/`, `reference/`, `client-data/`, `AGENTS.md`, `CLAUDE.md`.
- Окружение — Windows, Git Bash. `python3` здесь заглушка — если нужен Python, это `python`.
- `public/` — материалы клиента; файлов там пока нет, только `.gitkeep`. Ссылки на будущие файлы
  ставятся по именам из брифа (`/video/hero-1080.mp4` и т.д.), а отсутствие файла обрабатывается
  заглушкой, без 404 в консоли там, где этого можно избежать (`HEAD`-проверка не нужна — достаточно
  `onerror` / `error`-события и CSS-фона под медиа).

## Контент: кто что пишет

Таски идут последовательно, и каждый пишет в `content.ua.json` / `content.en.json` только свой
раздел верхнего уровня: 01 — `meta`, `nav`, `preloader`, `hero`, `footer`, `common`; 02 — `calculator`,
`cases`; 03 — `stats`, `niches`, `formats`, `process`, `geo`, `targeting`, `reviews`, `founder`,
`ecosystem`, `materials`, `faq`, `cta`. Чужие разделы не переписываются.
Английский — черновой перевод исполнителя, `"draft": true` в корне `content.en.json`.
Где данных нет — строка `"уточнити"` (EN: `"TBD"`), никогда выдуманный факт.

## Карта модулей

```
src/
  main.js                 точка входа: boot() — i18n → sections → motion → analytics
  core/
    i18n.js      dom.js      format.js
    motion.js    analytics.js
  sections/      по модулю на секцию
  styles/        tokens.css base.css layout.css sections/*.css
  data/          *.json
```

### `core/i18n.js` — язык и тексты

Владеет: выбранным языком, загруженными словарями, подстановкой текста в DOM.
Скрывает: `localStorage`, порядок загрузки JSON.

```js
export async function initI18n(): Promise<void>          // читает localStorage → <html lang> → грузит словарь
export function t(path: string): string|string[]|object  // "hero.title"; нет ключа → возвращает сам path
export function getLang(): 'ua'|'en'
export async function setLang(lang: 'ua'|'en'): Promise<void>  // грузит словарь, перерисовывает, пишет localStorage
export function onLangChange(fn: (lang) => void): void   // секции подписываются, чтобы перерисовать себя
export function applyTranslations(root: Element): void   // проходит по [data-i18n] внутри root
```

Разметка: `<h2 data-i18n="stats.title"></h2>`, `<a data-i18n-attr="aria-label:nav.menu">`.

### `core/dom.js` — мелкие помощники

```js
export function $(sel, root = document): Element|null
export function $$(sel, root = document): Element[]
export function el(tag, props = {}, ...children): Element   // props: class, text, html, dataset, attrs
export function on(target, type, fn, opts): () => void      // возвращает отписку
```

### `core/format.js` — числа

```js
export function formatInt(n: number, lang): string          // 260000 → "260 000" (узкий пробел)
export function formatMoney(n: number, lang): string        // 0.21 → "€0.21"
export function formatRange(lo, hi, fmt): string            // "928 – 1 256"
export function countTo(node, from, to, { duration, format }): void  // докрутка, через rAF
```

### `core/motion.js` — движение

Владеет: единственным экземпляром Lenis, регистрацией ScrollTrigger, правилом reduced-motion.
Скрывает: сам GSAP — секции не импортируют gsap напрямую без нужды.

```js
export const reduced: boolean                 // prefers-reduced-motion или ?nomotion=1
export async function initMotion(): Promise<void>   // Lenis + ScrollTrigger; при reduced — no-op
export function reveal(target, opts = {}): void     // opacity 0→1 + translateY, стагер по детям
export function parallax(target, factor): void      // translate3d по прогрессу скролла
export function pinSection(section, opts): void     // ScrollTrigger pin
export function marquee(track, { speed }): void     // бесконечный translateX, пауза на hover
export function refreshMotion(): void               // ScrollTrigger.refresh() после смены языка
```

При `reduced === true` все функции — пустые: элементы просто видны.

### `core/analytics.js` — события

```js
export function initAnalytics(config): void    // GA4/Pixel только если ID непустой
export function track(event: string, payload = {}): void   // window.dataLayer.push({event, ...payload})
```

События ровно четыре: `cta_telegram_click {place}`, `calculator_change {niche, geo, goal, budget}`
(дебаунс 600 мс), `calculator_cta_click`, `case_open {case}`.

### Секции — единый контракт

Каждый файл в `sections/` экспортирует одно:

```js
export function init(root: Element): void   // root — <section> из index.html, уже в DOM
```

- Секция сама подписывается на `onLangChange`, если её содержимое строится из JSON в JS.
- Секция не трогает чужой DOM и не импортирует другую секцию.
- `main.js` знает соответствие `id секции → модуль` и вызывает `init` для тех, что есть в разметке.

### `sections/calculator.js` — отдельно про расчёт

Чистая функция расчёта живёт в `sections/calculator-model.js`, без DOM, — чтобы её можно было
проверить отдельно:

```js
export function forecast(input, rates): Forecast
// input: { niche, geo, goal, budget }
// rates: содержимое calculator.json
// Forecast: { impressions:{lo,hi}, ctr:{lo,hi}, clicks:{lo,hi}, cpc:{lo,hi},
//             conversions:{lo,hi}, cpa:{lo,hi} }
```

Формулы: `impressions = budget / cpm * 1000`, `clicks = impressions * ctr`,
`cpc = budget / clicks`, `conversions = clicks * cr`, `cpa = budget / conversions`.
Диапазон: медиана × (1 ∓ `spread`), `spread` из JSON (0.15). CPC и CPA считаются
от противоположных концов (меньше кликов → дороже клик).

## Швы для проверки

Минимум, намеренно:

1. `forecast()` — чистая функция, проверяется вызовами с эталонными входами (`npm test`, node:test).
2. `i18n.t()` — проверка, что у `content.ua.json` и `content.en.json` совпадает набор ключей.
3. Остальное проверяется глазами и прогоном сборки: `npm run build` должен проходить без ошибок,
   и в `dist/` не должно остаться непереведённых ключей.

## Общая разметка, которую нельзя ломать

`index.html` содержит все 14 секций статически, в порядке вайрфрейма, с `id`:

`#hero`, `#stats`, `#niches`, `#formats`, `#calculator`, `#cases`, `#process`, `#geo`,
`#targeting`, `#reviews`, `#ecosystem`, `#materials`, `#faq`, `#cta`

Якоря шапки ссылаются на этот список. Менять `id` нельзя — на них завязаны навигация и аналитика.

## Что построили готовые таски

<!-- сюда исполнители дописывают по строке: что реально экспортируется -->

### T01 — фундамент (коммит ниже)

- **Цветов в брифе 9, не 10** (ink, navy, card, line, fg, muted, sun, ember, tg) — в `tokens.css` ровно они + `--grad`; тест это держит.
- `core/i18n`: `initI18n, t, getLang, setLang, onLangChange, applyTranslations`; ключ `localStorage` — `"eleads-lang"`; `<html lang>` — `uk` / `en`.
- `core/motion`: `reduced, initMotion, reveal(target,{stagger,y,delay,start,trigger}), parallax, pinSection(section,{...ScrollTrigger, onCreate}), marquee(track,{speed}) → stop, refreshMotion`, плюс `motionReady() → Promise<{gsap,ScrollTrigger,lenis}|null>`, `scrollToTarget(el|sel|number,{offset})`, `lockScroll(bool)`. Любой `a[href^="#"]` скроллит через Lenis. Атрибуты `[data-reveal]` и `[data-reveal="stagger"]` раскрываются сами — секциям не нужно звать `reveal` руками.
- `core/format`: `formatInt(n,lang)` (узкий nbsp для ua, запятая для en), `formatMoney` (< 10 → `€0.21`, иначе `€1 500`), `formatRange(lo,hi,fmt)`, `countTo(node,from,to,{duration,format})`; не-число → «—».
- `core/analytics`: `initAnalytics(config), track(event,payload)`; **любой** `a[href*="t.me/"]` сам шлёт `cta_telegram_click` с `place` из `data-place` ссылки или ближайшего предка — секциям достаточно поставить `data-place`.
- `core/dom`: `$, $$, el, on, focusables(root)`. `core/intro`: `signalIntroDone, whenIntroDone`. `core/lang-switch`: `bindLangSwitch(container[data-lang-switch])`.
- **`main.js` сам подхватывает** `src/sections/<name>.js` для каждого `[data-section="<name>"]` и все `src/styles/sections/*.css` через `import.meta.glob` — последующие таски **не правят `main.js`**. Контракт секции — `init(root)`.
- Пре-рендер: `data-i18n="a.b.0"` (текст, индекс массива можно), `data-i18n-attr="attr:key;attr2:key2"`, `{{config.key}}`. Отсутствующий ключ **валит `build`** со списком ключей, в dev — предупреждение.
- Данные: `config.json` `{telegramUrl, telegramHandle, analytics:{ga4Id:"",metaPixelId:""}}`; `cases.json {cases:[]}`, `faq.json {items:[]}`, `calculator.json {demo:true}` — заготовки. В `content.*` у секций 02–14 пока только `{eyebrow,title}`. Секции чередуют классы `.section` / `.section--alt`.
- Тесты: `tests/{helpers,i18n-keys,prerender,markup,styles}.test.js`.

### T01 — ремонт по ревью

- `reveal()` после твина ставит `.is-revealed` на узлы и снимает инлайн `opacity`/`transform`; у stagger-контейнера — на контейнер и детей.
- Начальное состояние в CSS: `.js-anim .reveal:not(.is-revealed)`, `[data-reveal]:not(.is-revealed)`, `[data-reveal='stagger']:not(.is-revealed) > *:not(.is-revealed)`.
- После `initMotion` `MutationObserver` на `body` ловит вставленные узлы: новый `[data-reveal]` раскрывается сам, ничейный `.reveal` показывается сразу, дети stagger-контейнера читаются при входе в экран. **Перерисовка списков при смене языка безопасна** — секции ничего специально делать не нужно.
- Шапка: только `.is-scrolled` (появляется подложка); `.is-hidden` больше нет, шапка видна всегда.

### T02 — калькулятор и кейсы

- `calculator-model.js`: `forecast(input,rates) → {impressions,ctr,clicks,cpc,conversions,cpa: {lo,hi}|null, issues: string[]}`; `budgetScale({min,max,scale:[{upTo,step}]}) → number[]` (значение слайдера — индекс в этом массиве); `funnelWidths(fc,{floor=100,min=0.14}) → [1,w2,w3]`.
- `calculator.json`: `{demo, spread, budget:{min,max,default,scale}, defaults:{niche,geo,goal}, cpm:{ua,worldwide}, ctr:{business,crypto,education,auto}, cr:{subscribers,bot_users}, niches|geos:[{id,label:{ua,en}}], goals:[{id,label,step:{ua,en}}]}`.
- `cases.json`: `{cases:[{id, featured?, niche, name, budget, result, cpa, task, geo, review:{ua,en}, done:[{ua,en}], screenshot:""}]}` — двуязычные значения внутри записи.
- События: `calculator_change` / `calculator_cta_click {niche,geo,goal,budget}`; `case_open {case: name.ua}`; `data-place`: `calculator`, `calculator_note`, `case_modal`.
- Пилюли и карточки кейсов рисует JS — без JS у калькулятора видны только заголовки, дисклеймер и ссылки.

### T03 — остальные десять секций

- Разделы `content.*`: `stats, niches, formats, process, geo, targeting, reviews, founder, ecosystem, materials, faq, cta` (EN — черновик).
- `faq.json`: `{items:[{id, q:{ua,en}, a:{ua,en}}]}`. `geo-dots.json`: `{step, lon0, lat0, cols, rows, rowsData:string[], regions:[{id,lon,lat}]}` — сетка суши 2.5°, контуры грубые.
- `data-place`: `niches_other`, `materials` (4 ссылки), `final_cta`. Новых событий нет. Контракт `init(root)` у 11 модулей.
- Браузером не проверялось: пин процесса, карта, раскладка — только чтением кода и сборкой.

### F1 — ремонт ветки

- `core/dom`: `trapFocus(target, items = () => focusables(target)) → () => void` — единая ловушка фокуса для меню, модалки кейса и лайтбокса.
- `core/intro`: `INTRO_DEADLINE_MS = 2600`, `introTimeLeft(deadline?) → ms`, `whenIntroDone({deadline}?) → Promise<'done'|'timeout'>`; по таймауту снимает `html.js-preload` и сигналит done.
- `vite.config.js` задаёт `root` явно — сборка не зависит от регистра буквы диска в cwd.
- Меню — `data-lenis-prevent`; линия процесса — слой `.process__fill` со `scaleX/scaleY`; свечения — слои с `translate3d`; суша GEO — кэш вне DOM как CSS-фон единственного `<canvas>`.
- **F1, дозапрос:** дедлайн intro считается от старта прелоадера (`markIntroStart()`), `INTRO_DEADLINE_MS` = 4200; по таймауту сначала уход шторки `is-leaving`, потом снятие `js-preload`. Новое в `intro.js`: `PRELOADER_MAX_MS, PRELOADER_SAFETY_MS, INTRO_EXIT_MS, INTRO_DEADLINE_MS, markIntroStart(), failIntro(err?)`; `signalIntroDone(reason='done')`, `whenIntroDone() → 'done'|'failed'|'timeout'`.



## Сборка 2 — границы

- `core/transition.js` (новый): `cover({label, badge}) → Promise` — полоса закрывает экран, резолвится, когда закрыто; `uncover() → Promise` — полоса уезжает; `sweep({label, badge}, midFn) → Promise` — cover → `await midFn()` → uncover. Один DOM-узел полосы, создаётся модулем. При `reduced` — только `midFn`, без анимации.
- Якорные переходы: обработчик кликов по `a[href^="#"]` внутри шапки, `#menu` и подвала вызывает `sweep({label: название раздела из nav.*, badge: номер секции})`, а в `midFn` — `scrollToTarget(target, {immediate: true})`. Остальные якоря на странице прокручиваются как раньше.
- `core/i18n` + `build/i18n-prerender.js`: новый атрибут `data-i18n-mark="key"` — текст из JSON, где `[[…]]` → `<span class="hl">…</span>`, остальное экранировано. Отсутствующий ключ так же валит сборку. `data-i18n` (обычный текст) не меняется.
- `core/motion`: новый `tiltOnScroll(el, {deg = 4, scale = 0.94})` — скраб наклона по прокрутке, при `reduced` — no-op; маркеры `.hl` в `[data-i18n-mark]` растут слева направо при входе в экран автоматически, как `[data-reveal]` — секции их руками не зовут.
- `core/intro`: дедлайн пересчитывается из новой длительности заставки — длина сценария (~5000 мс) плюс ожидание `load` (≤2000 мс); правило «hero никогда не обрывается раньше ухода полосы» сохраняется.
- Новый `data-place`: `founder` (кнопка Telegram в bento-плитке основателя).
- Ключи заставки — раздел `preloader` в `content.*.json`: запрос, заголовок и адрес результата, подписи SKIP / SEARCHING / LOADING.


## Сборка 2 — оформление и темы

- Темы: атрибут `data-theme` на `<html>` — `brand-light` (по умолчанию), `brand-dark`, `overtake`. Ставит инлайн-скрипт в `<head>` до отрисовки: `?theme=` → `sessionStorage['eleads-theme']` → `brand-light`.
- Семантические переменные (единственное, что используют секции): `--bg, --surface, --surface-2, --block, --block-2, --text, --text-muted, --text-on-block, --text-on-block-muted, --accent, --accent-2, --accent-ink, --tag-1, --tag-2, --line, --line-strong` + `--grad` (акцентный градиент темы). Старые имена (`--ink`, `--card`, `--fg` …) остаются только как палитра канала внутри `tokens.css`.
- Компоненты (`src/styles/components.css`, новый): `.pill-label` (метка с точкой), `.btn` / `.btn--primary` / `.btn--ghost` с кружком-стрелкой `.btn__arrow`, `.chip`, `.panel` (скруглённый контейнер секции с отступом от краёв), `.panel--block` (тёмный блок), `.stat-card` (карточка-цифра, модификаторы цвета), `.inline-pill` (пилюля-иконка внутри заголовка).
- `src/dev/theme-switcher.js` — только `import.meta.env.DEV`; ставит `data-theme` и пишет `sessionStorage`.


## Сборка 2 — Aether (заменяет оформление overtake)

- Темы: `data-theme` = `brand` (по умолчанию, `:root`) | `aether`. Инлайн-скрипт `<head>`: `?theme=` → `sessionStorage['eleads-theme']` → `brand`; старые значения `brand-light`/`brand-dark`/`overtake` → `brand`.
- Семантические переменные остаются (`--bg … --grad`), значения — под тёмный облик Aether в обеих темах.
- Новые общие компоненты (`components.css`): `.mono-label` (моно-капс с разрядкой), `.display` (широкий капс Unbounded), `.display__accent` (вторая строка акцентом), `.btn--pill` (акцентная пилюля), `.ribbons` (две ленты крест-накрест, разметка + `motion.marquee`), `.planet` (SVG/CSS-планета с кольцом, параметры через CSS-переменные — общая для hero и орбиты).
- Footer reveal: буквы вордмарка — отдельные `span` внутри маски; подъём по входу подвала в экран.

### T10 — основа Aether (что реально есть)

- `data-theme` = `brand` (`:root`) | `aether`; доп. переменные `--glow`, `--planet-light/-mid/-dark`, `--ribbon-2`, `--star`; токены `--fs-display`, `--fs-mono`, `--fs-h3`, `--tracking-display`, `--tracking-mono` (`--tracking-tight` = `--tracking-display`).
- `.mono-label` (`--accent` | `--muted`), `.display > .display__accent`, `.btn--pill` (`.btn--primary`/`--accent` — та же акцентная пилюля).
- `.planet > .planet__glow + .planet__ring--back + .planet__body + .planet__ring--front`; параметры `--planet-size`, `--planet-tilt`, `--planet-ring`, `--planet-glow`.
- Ленты: `<section class="ribbons" data-section="ribbons">` без id сразу после `#hero`; `[data-ribbon="top|bottom"] > .ribbons__viewport > .ribbons__track > ul.ribbons__group`.
- Подвал: `footer.js` → `wordmarkLetters(word) → [{char, accent}]`; `.footer__wordmark.is-in` запускает подъём букв. Размер вордмарка рассчитан на «ELEADS» в Unbounded 800.
- Внимание секциям: глобальный Unbounded капсом + `overflow-wrap` рвёт длинные заголовки карточек посреди слова — секции поправляют у себя (таски 11–13).



## Задача 3 — единый язык движения (H10, обязателен для всех блоков)

Пользователь: «Только предлагай такие переходы чтобы они были в одну тему друг с другом». Три приёма, общие помощники в `src/core/`:
1. **Глава** — `stackReveal(section)`: блок выезжает снизу поверх предыдущего (скругление сверху, тень), предыдущий чуть уменьшается и темнеет. Между всеми блоками ≥900px.
2. **Табло** — `flipSwap(node, next)`: меняющийся текст/цифры — старое уезжает вверх, новое въезжает снизу под маской; та же длительность и кривая везде. Для «переворота» карточек — та же механика по оси X.
3. **Лесенка** — `stagger(items)`: появление по одному, шаг 80 мс, `power3.out` 0.6 с, сдвиг 24px — одинаково во всех блоках.
Новые эффекты в блоках — только из этих трёх (плюс локальные hover-микродвижения). Всё на `transform`/`opacity`, reduced-motion — статично.

### T19 — общий набор движения (что реально есть)

- `src/core/motion-kit.js`: `stackReveal(section,{scale=0.94,dim=0.55})` — закрепляет предыдущий блок (pinSpacing:false), на ≥900px уменьшает его слои к центру и проявляет поверх `.stack-shade`; ставит секции инлайн `z-index:2`; скругление сверху и тень — в CSS самого блока. `flipSwap(node,next,{axis:'y'|'x',delay}) → Promise` — WAAPI под маской `overflow:clip`, 600 мс, `--ease-out`. `stagger(items,{onEach,trigger,start}) → Promise` — GSAP, шаг 80 мс, `power3.out` 0.6 с, 24px. Экспорт `STACK, FLIP, STAGGER, STACK_MEDIA`. При reduced-motion — no-op (текст ставится сразу, onEach по порядку).
- Разметка блока 02: `[data-flip="0..7"]` — пары строк между панелями, `[data-stats-step]` — порядок лесенки.
- Правило: в CSS секций — только семантические переменные (`--bg`, `--accent` …), не имена палитры.
- `config.sections.enabled` сейчас `['hero','stats']`; новые блоки добавляют себя точечно и по порядку.



## Задача 3 — правка языка движения (H11, заменяет H10 в части переходов)

Пользователь: «не подходит такой переход, убери все переходы которые сейчас есть, оставь только тот который стоит на 12-13 экранах».
- `stackReveal` — **не используется** нигде (блоки идут друг за другом обычной прокруткой, без закрепления и затемнения предыдущего).
- `stagger` (лесенка появления) — **не используется**: содержимое блока видно сразу.
- `flipSwap` — только как реакция на действие (переключатель вкладок, смена значения), не как появление.
- Единственный переход по прокрутке — лента карточек showcase на блоках 12 «Екосистема» и 13 «Матеріали» (H07).

### T23 — шапка, палитра, формат экрана, ленты, первый экран B, шрифт канала (H12–H20)

- Токены: `--header-h: 60px` (шапка во всех размерах), `--screen-pad`, `--font-head` — Sofia Sans Extra Condensed 800/900 (заглавные: заголовок и цифры первого экрана, H2 и крупные цифры блоков, ленты); обычный текст — Onest. `--v4-*`, `--paper` и звёзды удалены — палитра канала на всём сайте, hex только в `tokens.css`.
- `layout.css`: `.section{scroll-margin-top:var(--header-h)}`; на ≥900px в альбомной ориентации `.section{display:grid;align-content:center;min-height:calc(100svh - var(--header-h))}` — каждый блок ровно один экран (06–14 получат правило при включении).
- `config.sections.enabled = ['hero','ribbons','stats','niches','formats','calculator']`.
- Ленты: `data-ribbon="accent|muted"`, `.ribbons__item--title` («МЕНІ ДОВІРЯЮТЬ» в акцентной), разделитель — значок Telegram `.ribbons__icon`; бегут навстречу (−70 / +55 px/s); полоса ≈50px на десктопе, ≈33px на 390.
- Первый экран: карточка рекламы — `hero.ad.channel` / `hero.ad.label` (ключ `hero.ad.tag` удалён), цифра проектов «50+» (3 места, UA/EN); `ribbons.bottom` удалён.
- Шапка: нет `.header__nav` / `.header__link` (и `initActiveLink`), есть `.header__cta-arrow`; полный список разделов — только в бургере.

### T25 — блок 02: карты из точек, барабаны, появление (H22–H25)

- Правило H11 уточнено: переходов между экранами нет; внутри блока 02 появление и анимации разрешены (`stagger` из `motion-kit` вызывается только в `stats.js` — это проверяет тест). Для остальных блоков появление — только по слову пользователя.
- Данные: `src/data/ua-dots.json` `{source, step, lonStep, shift, lon0, lat0, cols, rows, total, rowsData}` — сетка 33×22, 376 точек; собирается `scripts/ua-dots.js` из Natural Earth 1:10m (вариант с точкой зрения Украины, public domain); GeoJSON в репозитории нет.
- Модули: `stats-model.js` (чистая математика: `parseShare`, `litCount`, `litSet`, `gridDots`, `waveStrength`, `repelOffset`, `springStep`, `igniteLevel`, `odoCells`, `reelDigits` …), `stats-dots.js` (`createDotMap(box, grid, {stride, share}) → {darken(), ignite(origin), wave(point, kind)}`), `stats-odometer.js` (`rollTo(node, next, {from, turns, delay})`, `shownValue(node)`).
- Разметка: `[data-stats-map="ua|ww"]` (`role="img"`, подпись `stats.ua.mapLabel` / `stats.ww.mapLabel`), состояния `.section--stats.is-in`, `.stats__map.is-dark`; `[data-flip="0..7"]` сохранён.
- Контент: `stats.ua.rank` вместо `stats.ua.sample`; удалены `stats.footnote` и `*.eyebrow` у секций 02–14 (`hero.eyebrow` остался); у логотипа нет `.logo__mark` (шапка, заставка, полоса перехода).
- Доля горящих точек читается из `stats.ua.main.value`; подпись карты для скринридера — отдельный текст, при смене цифры править руками.

### T26 — блок 03: мозаика плиток с иконками (H26–H28)

- Плитки: `niches__card--dark|light|yellow|orange|other`, `svg.niches__icon` (opacity на весь svg), `.niches__top-row` в «Інша ніша?»; у ниши только `name` (`examples` удалены); первая плитка — «B2B»; `data-place="niches_other"` сохранён. Ключи `niches.other.cta` / `niches.other.arrow` в JSON не используются.

