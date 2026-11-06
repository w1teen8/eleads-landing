<!-- autopilot:start -->
# eLeads — лендинг експерта з Telegram Ads

## Команды

- `npm ci` — зависимости (предупреждение npm про esbuild postinstall сборке не мешает)
- `npm run dev` — локально
- `npm run check` — тесты + сборка; единственная проверка перед сдачей (61 тест)
- `npm test` / `node --test tests/<file>.test.js` — все тесты / один файл
- `npm run build` — статика в `dist/`
- `npm run preview -- --port 4178 --strictPort` — http://localhost:4178/
- `?nomotion=1` в URL — сайт без анимаций
- Lighthouse (после preview): `CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" npx -y lighthouse@12 http://localhost:4178/ --form-factor=mobile --chrome-flags="--headless=new"`

## Где что

- `index.html` — вся разметка 14 секций без текстов (`data-i18n`); сюда подключают материалы клиента
- `src/data/content.ua.json`, `content.en.json` — тексты; новый ключ в оба; остальные данные в `src/data/` (`cases.json`, `faq.json`, `calculator.json`, `config.json`)
- `src/sections/<name>.js` + `src/styles/sections/<name>.css` — секция; `calculator-model.js` — формулы
- `src/core/` — i18n, motion (Lenis/GSAP), analytics, intro; `src/styles/tokens.css` — палитра
- `build/i18n-prerender.js`, `vite.config.js` — пре-рендер UA в HTML
- `public/` — материалы клиента (`video/`, `img/`), состав и имена файлов в `README.md`
- `docs/qa-report.md` — результаты проверки скорости и экранов
- Архитектура, поток данных, соглашения: `docs/architecture.md`; решения: `docs/adr/`; термины: `CONTEXT.md`

## Подводные камни

- Сборка падает, если в `content.ua.json` / `content.en.json` нет ключа из `data-i18n` (пре-рендер в `build/`).
- `vite.config.js` фиксирует `root`: из cwd с маленькой буквой диска (`/c/…`) сборка иначе падала.
- Новая секция: `[data-section]` в `index.html` + файл в `src/sections/` + CSS в `src/styles/sections/`; `main.js` не править.
- Меню под остановленным Lenis скроллится только благодаря `data-lenis-prevent` (также у лайтбокса и модалки кейса).
- `vite preview` на отсутствующий `/video/hero-1080.mp4` отдаёт 200 text/html (SPA-fallback), не 404: видео уходит в error, остаётся градиент.
- Фото, логотипы и скриншоты рекламы пока CSS-заглушки в `index.html`; видео подхватывается из `public/video` по именам из `README.md`.
- Анимировать только `transform` и `opacity`.

## Окружение

`.env` нет. ID аналитики (`ga4Id`, `metaPixelId`) — в `src/data/config.json`, пустые = аналитика не подключается. Windows, Git Bash; `python3` — заглушка, использовать `python`.

## Как здесь работает Autopilot

Сборка ведётся навыком `/autopilot`. Требования, спецификация и таски — в `.autopilot/`.
Прогресс — `.autopilot/dashboard.html`. Требование из `manifest.md` может снять
только пользователь. Прерванную сборку продолжает «продолжи автопилот».

### Правка без автопилота

Мелкий баг или доводка после сборки — обычная сессия, без прогона.

Сначала прочитай:
1. `.autopilot/PROGRESS.md` — что не доделано, известные баги, о чём договорились с пользователем.
2. Что правили после последней сборки — первая строка таблицы в «История git».
3. Только если правка их касается: почему сделано так — `docs/adr/`; что значат слова — `CONTEXT.md`;
   что именно просили — `manifest.md` в папке сборки (указана в начале `PROGRESS.md`).

После правки:
- коммит — по правилам из «История git»;
- строка в «Правки без автопилота» в `PROGRESS.md`: дата — что — почему;
- починенный пункт из «Не доделано» или «Известные баги» — удали;
- договорились с пользователем о том, что следующая сборка не должна пересматривать, —
  строка в «Договорились», его словами.

### История git

Целиком не читай — бери срез под вопрос:

| Вопрос | Команда |
|---|---|
| что правили после последней сборки | `git log --oneline "$(git log -1 --format=%h --grep='^Autopilot: сборка сдана')"..HEAD -- . ':(exclude).autopilot'` |
| всё, что делали ради требования | `git log --oneline --grep="R02"` |
| история файла | `git log --oneline -10 -- <файл>` |
| когда появился или исчез код | `git log --oneline -S "<фрагмент>"` |
| почему строка такая | `git blame -L <с>,<по> <файл>`, затем `git show <sha>` |
| что внутри коммита | `git show --stat <sha>` |

Срез длиннее ~30 коммитов — отдай его субагенту и возьми выжимку в десять строк.

Коммит: заголовок — что (`fix: даты в одном формате`), тело — почему, трейлер
`--trailer "Requirements: R02"`, если правка касается требования из `manifest.md`.
Заголовок `Autopilot: сборка сдана` пишет только автопилот — по нему находят последнюю сборку.
<!-- autopilot:end -->
