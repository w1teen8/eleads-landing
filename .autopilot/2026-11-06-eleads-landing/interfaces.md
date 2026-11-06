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
