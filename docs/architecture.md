# Архитектура eLeads

Vite + vanilla JS, без фреймворков. Весь текст в JSON. Границы модулей и соглашения ниже; подробности по решениям — `docs/adr/`.

## Поток данных

1. `index.html` — вся разметка 14 секций статически, без текстов: только `data-i18n="раздел.ключ"`, `data-i18n-attr="attr:key;attr2:key2"`, `{{config.key}}`.
2. Сборка и dev: `build/i18n-prerender.js` (подключён в `vite.config.js`) вписывает украинский текст из `src/data/content.ua.json` в HTML. Отсутствующий ключ валит `npm run build` списком ключей; в dev — предупреждение.
3. Рантайм: `src/main.js` `boot()` — `initI18n` -> `init(root)` каждой секции -> `initMotion` -> `initAnalytics(config)`. Английский словарь подставляется в браузере (`setLang`, ключ `localStorage` `eleads-lang`, `<html lang>` = `uk`/`en`).
4. Секции, строящие содержимое из JSON в JS (калькулятор, кейсы, FAQ), сами подписываются на `onLangChange`.

## Границы модулей

- `src/main.js` — единственная точка сборки: секции и CSS подхватываются через `import.meta.glob` по имени (`[data-section="x"]` -> `src/sections/x.js` + `src/styles/sections/x.css`). Не править.
- `src/core/` — общие сервисы: `i18n` (язык, `t`, `applyTranslations`), `motion` (единственный Lenis, ScrollTrigger, правило reduced-motion, `reveal`/`parallax`/`pinSection`/`marquee`/`scrollToTarget`/`lockScroll`), `analytics` (`track`), `dom` (`$`, `$$`, `el`, `on`, `focusables`, `trapFocus`), `format` (`formatInt`/`formatMoney`/`formatRange`/`countTo`), `intro` (дедлайн прелоадера), `lang-switch`.
- `src/sections/<name>.js` — один модуль на секцию, контракт `export function init(root)`. Секция не трогает чужой DOM и не импортирует другую секцию (исключение — общий модуль карт из точек `stats-dots.js` / `stats-model.js`: его берут блоки 02 и 08). Чистая логика без DOM вынесена в `*-model.js` (`calculator-model.js`, `stats-model.js`) и покрыта тестами.
- `src/data/` — `content.ua.json`/`content.en.json` (ключи обоих совпадают, тест `tests/i18n-keys.test.js`), `cases.json`, `faq.json`, `calculator.json`, `geo-dots.json`, `config.json`.
- `src/styles/` — `tokens.css` (ровно 9 цветов + `--grad`), `base.css`, `layout.css`, `sections/*.css`.

## Соглашения

- Анимируем только `transform` и `opacity`; `backdrop-filter` только в шапке.
- Контент виден без JS: начальное скрытое состояние ставит JS (класс `.js-anim` на `<html>`), не CSS по умолчанию.
- `[data-reveal]` и `[data-reveal="stagger"]` раскрываются сами; `MutationObserver` ловит перерисованные узлы, при смене языка ничего делать не надо.
- `<canvas>` на странице нет: карты блоков 02 и 08 — точки SVG (`createDotMap` из `stats-dots.js`), цикл кадров стоит вне экрана.
- Любой `a[href*="t.me/"]` сам шлёт `cta_telegram_click`, `place` берётся из `data-place`. События всего четыре: `cta_telegram_click`, `calculator_change`, `calculator_cta_click`, `case_open`.
- Якоря `a[href^="#"]` скроллит Lenis (`scrollToTarget`). id секций менять нельзя: `#hero #stats #niches #formats #calculator #cases #process #geo #targeting #reviews #ecosystem #materials #faq #cta`.
- Нет данных — видимая заглушка `уточнити` / `TBD`, не придуманный факт. Английский — черновик (`"draft": true` в `content.en.json`).
- Имена в коде английские: файлы и CSS-классы kebab-case с БЭМ-префиксом секции (`.calc__funnel-step`), JS camelCase.
- Секция `content.*` принадлежит одной секции верхнего уровня (`hero`, `calculator`, `faq`, ...); чужие разделы не переписываются.

## Калькулятор

`forecast(input, rates)` в `calculator-model.js`: показы = бюджет / CPM x 1000, клики = показы x CTR, CPC = бюджет / клики, конверсии = клики x CR, CPA = бюджет / конверсии; диапазон = медиана x (1 -/+ `spread`), CPC и CPA считаются от противоположных концов. Коэффициенты — `calculator.json`.

## Прелоадер

`core/intro.js`: дедлайн отсчитывается от `markIntroStart()` (`INTRO_DEADLINE_MS` 4200); `whenIntroDone()` -> `'done'|'failed'|'timeout'`; по таймауту сначала `is-leaving`, затем снимается `js-preload`.
