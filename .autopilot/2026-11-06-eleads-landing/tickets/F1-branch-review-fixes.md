# F1 — Исправления по ревью ветки

**Требования:** R24, R29, R04, R36, R47, R76, R78, R101i
**Зависит от:** —
**Зона:** `tests/prerender.test.js` · `vite.config.js` · `index.html` (только `#menu`) · `src/core/dom.js` · `src/core/intro.js` · `src/core/motion.js` · `src/sections/{header,cases,formats,hero,process,geo,stats}.js` · `src/styles/sections/{niches,materials,process}.css` · `tests/`
**Волна:** 5
**Ревью:** да — ремонт ветки
**Модель:** сильная

## Что должно заработать

Сайт соблюдает собственные жёсткие правила брифа: движется только `transform` и `opacity`, карта не грузит
главный поток, первый экран не может остаться невидимым, меню прокручивается на низком экране, а
проверка проекта зелёная в любой оболочке.

## Из брифа, дословно

> «Анимировать только `transform` и `opacity`. Не анимировать blur, filter, box-shadow, размеры.»

> «Контент виден без JS-анимаций: ничего не прячем через `opacity: 0` навсегда.»

> «летать на среднем Android»

> «На мобильном бургер с полноэкранным меню.»

> «Переключатель Україна / Worldwide, цифры меняются с анимацией.»

## Разделы спецификации

`interfaces.md` → «Правила проекта» (3, 4), блоки T01–T04. `spec.md` → истории 3, 4, 5, 8, 18, 35, 36.

## Критерии приёмки — дословно из ревью ветки

- [ ] Craft · tests/prerender.test.js:52 · test calls `build()` in-process without a fixed root; from Git Bash in `/c/Users/admin/Desktop/claude/eLeads` (lowercase drive) it fails with "No matching HTML proxy module" · **condition: `npm run check` is green in both shells** (Git Bash at `/c/Users/admin/Desktop/claude/eLeads` and cmd/PowerShell at `C:\Users\admin\Desktop\claude\eLeads`).
- [ ] Craft · index.html:120 (`#menu`) · the menu has `overflow-y: auto`, but `lockScroll(true)` stops Lenis, which cancels wheel/touchmove on anything without `data-lenis-prevent` · **condition: with the menu open at 640×360, wheel and touch scroll reach `.menu__cta`.**
- [ ] Spec · src/sections/process.js:104, src/styles/sections/niches.css:44, src/styles/sections/materials.css:41 · the process line scrubs `stroke-dashoffset` on scroll; two glows move a `radial-gradient` position on every pointermove · **condition: no per-frame change of anything but transform/opacity — line progress is a scaleX/scaleY of the draw layer, the glows are a translated layer.**
- [ ] Craft · src/sections/geo.js:59-68 · every rAF frame redraws all 2390 land dots at DPR up to 2 while only 7 regions pulse · **condition: land is drawn only on resize (cached layer/bitmap); per-frame drawing covers only the region dots and rings.**
- [ ] Craft · src/core/intro.js:13 + src/sections/hero.js:125 · `whenIntroDone()` has no timeout; if preloader init or tick throws, hero title lines, CTA and media stay hidden for good · **condition: with the preloader throwing, the whole hero is visible within 3 s.**
- [ ] Craft · src/sections/stats.js:11 · `dataset.final` caches the text of the first language seen; after UA→EN a tab round-trip ends on the UA string · **condition: after a language switch, every tab switch ends each value on the string from the current `content.<lang>.json`.**
- [ ] Craft · src/sections/header.js:75-92, src/sections/cases.js:130-144, src/sections/formats.js:200-211 · the same Tab-wrap focus trap copied in three tickets · **condition: one helper in core/dom.js is used by all three, and no Tab-wrap code is left in sections.**
- [ ] `npm run check` зелёный; Lighthouse mobile Performance не ниже, чем в `docs/qa-report.md` (медиана 92), — перепрогнать и дописать в отчёт.
