window.STATE =
{
  "version": 2,
  "slug": "eleads-landing",
  "dir": "2026-11-06-eleads-landing",
  "title": "Лендинг eLeads — эксперт по Telegram Ads",
  "mode": "semi",
  "depth": "normal",
  "tier": "T2",
  "briefFile": null,
  "memoryFile": "AGENTS.md",
  "memoryOwner": "autopilot",
  "skillDir": "C:/Users/admin/.claude/skills/autopilot",
  "baseCommit": "1899f41",
  "startedAt": "2026-11-06T11:50:20+02:00",
  "updatedAt": "2026-11-06T18:36:21+02:00",
  "finishedAt": null,
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-11-06T11:50:20+02:00",
      "finishedAt": "2026-11-06T11:50:27+02:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-11-06T18:31:59+02:00",
      "finishedAt": "2026-11-06T18:32:17+02:00"
    },
    {
      "id": "briefing",
      "status": "done",
      "startedAt": "2026-11-06T18:32:23+02:00",
      "finishedAt": "2026-11-06T18:32:23+02:00"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-11-06T18:32:17+02:00",
      "finishedAt": "2026-11-06T18:35:53+02:00"
    },
    {
      "id": "plan",
      "status": "active",
      "startedAt": "2026-11-06T18:35:53+02:00"
    },
    {
      "id": "build",
      "status": "pending"
    },
    {
      "id": "review",
      "status": "pending"
    },
    {
      "id": "final",
      "status": "pending"
    }
  ],
  "requirements": {
    "total": 109,
    "done": 99,
    "inTicket": 6,
    "inSpec": 0,
    "placeholder": 3,
    "deferred": 1,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Фундамент, шапка, прелоадер, первый экран, подвал",
      "requirements": [
        "R01",
        "R02",
        "R03",
        "R04",
        "R05",
        "R07",
        "R08",
        "R09",
        "R10",
        "R11",
        "R12",
        "R13",
        "R14",
        "R15",
        "R16",
        "R17",
        "R18",
        "R19",
        "R20",
        "R21",
        "R22",
        "R23",
        "R24",
        "R25",
        "R27",
        "R28",
        "R29",
        "R31",
        "R32",
        "R33",
        "R34",
        "R35",
        "R36",
        "R37",
        "R38",
        "R39",
        "R40",
        "R41",
        "R42",
        "R43",
        "R44",
        "R45",
        "R46",
        "R92",
        "R93",
        "R94",
        "R95",
        "R96",
        "R97",
        "R98",
        "R100i",
        "R101i",
        "G01"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "package.json",
        "vite.config.js",
        "build/",
        "index.html",
        "src/main.js",
        "src/core/",
        "src/styles/tokens.css",
        "src/styles/base.css",
        "src/styles/layout.css",
        "src/styles/sections/header.css",
        "src/styles/sections/preloader.css",
        "src/styles/sections/hero.css",
        "src/styles/sections/footer.css",
        "src/sections/header.js",
        "src/sections/preloader.js",
        "src/sections/hero.js",
        "src/sections/footer.js",
        "src/data/",
        "public/favicon.svg",
        "public/og.jpg",
        "tests/"
      ],
      "review": "да — фундамент",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-06T13:57:38+02:00",
      "finishedAt": "2026-11-06T14:30:59+02:00",
      "retries": 0,
      "repairs": 1,
      "repairFindings": [
        "контент, вставленный в [data-reveal] после initMotion, виден без твина; шапка не прячется при скролле"
      ],
      "tests": {
        "passed": 37,
        "failed": 0
      },
      "commit": "e570636"
    },
    {
      "id": "02",
      "title": "Калькулятор прогноза и кейсы с модалкой",
      "requirements": [
        "R05",
        "R58",
        "R59",
        "R60",
        "R61",
        "R62",
        "R63",
        "R64",
        "R65",
        "R66",
        "R67",
        "R68",
        "R69",
        "R70",
        "R71",
        "R72",
        "R73",
        "R74"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "src/sections/calculator.js",
        "src/sections/calculator-model.js",
        "src/sections/cases.js",
        "src/styles/sections/calculator.css",
        "src/styles/sections/cases.css",
        "src/data/calculator.json",
        "src/data/cases.json",
        "content.*.json",
        "calculator",
        "cases",
        "#calculator",
        "#cases",
        "index.html",
        "tests/calculator-model.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-06T14:24:35+02:00",
      "finishedAt": "2026-11-06T14:39:14+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 37,
        "failed": 0
      },
      "commit": "7717dab"
    },
    {
      "id": "03",
      "title": "Остальные десять секций каркасом с настоящим текстом",
      "requirements": [
        "R06",
        "R26",
        "R47",
        "R48",
        "R49",
        "R50",
        "R51",
        "R52",
        "R53",
        "R54",
        "R55",
        "R56",
        "R75",
        "R76",
        "R77",
        "R78",
        "R79",
        "R80",
        "R81",
        "R82",
        "R83",
        "R84",
        "R85",
        "R86",
        "R87",
        "R88",
        "R89",
        "R90",
        "R91"
      ],
      "blockedBy": [
        "02"
      ],
      "wave": 3,
      "zone": [
        "src/sections/{stats,niches,formats,process,geo,targeting,reviews,ecosystem,materials,faq,cta}.js",
        "src/styles/sections/",
        "src/data/faq.json",
        "src/data/geo-dots.json",
        "content.*.json",
        "stats",
        "niches",
        "formats",
        "process",
        "geo",
        "targeting",
        "reviews",
        "founder",
        "ecosystem",
        "materials",
        "faq",
        "cta",
        "index.html"
      ],
      "review": "нет",
      "model": "обычная",
      "status": "done",
      "startedAt": "2026-11-06T14:59:24+02:00",
      "finishedAt": "2026-11-06T15:17:56+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 48,
        "failed": 0
      },
      "commit": "53b6508"
    },
    {
      "id": "04",
      "title": "Проверка: экраны, скорость, движение, клавиатура — и доводка",
      "requirements": [
        "R30",
        "R99",
        "G02"
      ],
      "blockedBy": [
        "03"
      ],
      "wave": 4,
      "zone": [
        "src/",
        "index.html",
        "vite.config.js",
        "README.md",
        "docs/qa-report.md"
      ],
      "review": "нет",
      "model": "обычная",
      "status": "done",
      "startedAt": "2026-11-06T15:17:58+02:00",
      "finishedAt": "2026-11-06T15:42:37+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 51,
        "failed": 0
      },
      "commit": "e9e6f25"
    },
    {
      "id": "05",
      "title": "Загрузка «поиск находит eLeads» и фирменный переход полосой",
      "requirements": [
        "G03",
        "G07",
        "G08",
        "R39"
      ],
      "blockedBy": [],
      "wave": 6,
      "zone": [
        "src/sections/preloader.js",
        "src/styles/sections/preloader.css",
        "src/core/transition.js",
        "src/core/intro.js",
        "src/sections/header.js",
        "src/sections/footer.js",
        "src/main.js",
        "transition.js",
        ".preloader",
        "index.html",
        "preloader",
        "nav",
        "src/data/content.ua.json",
        "content.en.json",
        "tests/"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "pending",
      "retries": 0,
      "repairs": 0
    },
    {
      "id": "06",
      "title": "Маркер в заголовках, линза в hero, номер процесса, вордмарк, наклон portfolea",
      "requirements": [
        "G04",
        "G06"
      ],
      "blockedBy": [
        "05"
      ],
      "wave": 7,
      "zone": [
        "build/i18n-prerender.js",
        "src/core/i18n.js",
        "src/core/motion.js",
        "src/sections/hero.js",
        "src/styles/sections/hero.css",
        "src/styles/sections/photos.css",
        "src/sections/process.js",
        "src/styles/sections/process.css",
        "src/sections/footer.js",
        "src/styles/sections/footer.css",
        "src/styles/base.css",
        ".hl",
        "index.html",
        "src/data/content.ua.json",
        "content.en.json",
        "[[…]]",
        "tests/"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "pending",
      "retries": 0,
      "repairs": 0
    },
    {
      "id": "07",
      "title": "Bento-секции, наклон portfolea на картинках и перепроверка скорости",
      "requirements": [
        "G05",
        "G06",
        "R30"
      ],
      "blockedBy": [
        "06"
      ],
      "wave": 8,
      "zone": [
        "src/sections/{targeting,reviews,materials,formats}.js",
        "src/styles/sections/{targeting,reviews,materials,formats}.css",
        "#targeting",
        "#reviews",
        "#materials",
        "#formats",
        "index.html",
        "targeting",
        "reviews",
        "founder",
        "materials",
        "content.*.json",
        "docs/qa-report.md",
        "tests/"
      ],
      "review": "нет",
      "model": "обычная",
      "status": "pending",
      "retries": 0,
      "repairs": 0
    },
    {
      "id": "F1",
      "title": "Исправления по ревью ветки",
      "requirements": [
        "R24",
        "R29",
        "R04",
        "R36",
        "R47",
        "R76",
        "R78",
        "R101i"
      ],
      "blockedBy": [],
      "wave": 5,
      "zone": [
        "tests/prerender.test.js",
        "vite.config.js",
        "index.html",
        "#menu",
        "src/core/dom.js",
        "src/core/intro.js",
        "src/core/motion.js",
        "src/sections/{header,cases,formats,hero,process,geo,stats}.js",
        "src/styles/sections/{niches,materials,process}.css",
        "tests/"
      ],
      "review": "да — ремонт ветки",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-06T16:25:44+02:00",
      "finishedAt": "2026-11-06T17:00:11+02:00",
      "retries": 0,
      "repairs": 1,
      "repairFindings": [
        "дедлайн intro не срабатывает раньше потолка прелоадера + его ухода; hero виден за 3 с при упавшем прелоадере"
      ],
      "tests": {
        "passed": 61,
        "failed": 0
      },
      "commit": "9f69550"
    }
  ],
  "tests": {
    "passed": 61,
    "failed": 0
  },
  "debt": {
    "placeholders": [
      "Фото Володимира — силуэт 4/5 в hero",
      "Видео hero — брендовый градиент до прихода файлов",
      "Подвал — «Design & development — [ІМ'Я]», ссылка #",
      "EN — черновой перевод, draft: true",
      "Коэффициенты калькулятора — демо (demo: true, плашка на странице)",
      "Кейсы — все цифры, задачи, GEO и отзывы «уточнити»",
      "Скриншоты рекламы — CSS-макеты, лайтбокс показывает их же",
      "Отзывы — три текста «уточнити»",
      "Материалы — заголовки постов 2–4 «уточнити», ссылки ведут на @Kucherflow",
      "FAQ — ответы 6, 7, 9 «уточнити»"
    ],
    "assumptions": [],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 3,
    "fixed": 3,
    "deferred": 0,
    "items": []
  },
  "concerns": [
    "og:image относительный /og.jpg — адрес сайта неизвестен",
    "Шрифты с Google Fonts: preload таблицы стилей, не woff2 — self-host вне зоны T01",
    "Не проверено в браузере: фолбэк при офлайн-GSAP и восстановление языка при втором визите",
    "build/i18n-prerender.js:261,310 — [data-i18n] с дочерними тегами молча пропускается, рантайм стирает детей",
    "src/sections/hero.js:428 + src/core/intro.js:246 — whenIntroDone без таймаута: если прелоадер упал, hero остаётся скрытым",
    "src/sections/hero.js:364 — «Мені довіряють» не перерисовывается при смене языка",
    "index.html:16 — og:image относительный, мессенджеры не развернут",
    "index.html:24-31 — preload таблицы стилей вместо woff2 основного начертания",
    "src/core/motion.js:100-104 — контейнер [data-reveal], заменённый целиком при смене языка, снова проигрывает появление (мигание); перерисовывать детей, а не контейнер",
    "src/core/motion.js:107-110 — .reveal внутри ещё не раскрытого stagger-контейнера показывается раньше соседей",
    "tests/visibility.test.js — проверяет исходник grep-ом, поведение не исполняет",
    "client-data/calculator-template.csv — шаблон просит значение на каждую комбинацию ниша×GEO×цель, а calculator.json по брифу держит три отдельные таблицы (CPM по GEO, CTR по нише, CR по цели)",
    "src/data/cases.json — done[] собран из общей фразы вайрфрейма 07, нужна сверка по каждому кейсу",
    "src/data/faq.json — ответы 3, 4, 5, 8 собраны исполнителем из текстов страницы; клиенту подтвердить",
    "src/data/geo-dots.json — контуры суши нарисованы вручную, сетка 2.5°, грубо",
    "src/sections/process.js — pin на десктопе не проверен в браузере",
    "src/sections/formats.js — в макете формата использован текст MONOLIT из вайрфрейма",
    "T03 — тесты написаны после кода, red-proof только мутацией",
    "Lighthouse Perf плавает 86–96 на этой машине, запас над 85 небольшой; на реальном Android не проверялось",
    "src/sections/preloader.js — подзаголовок hero виден под шторкой ради LCP, прелоадер 1.0 с",
    "Тап по GEO-карте на тач-устройстве вживую не проверялся, только Chrome"
  ],
  "blind": null,
  "beats": [
    "2026-11-06T11:50:20+02:00",
    "2026-11-06T11:50:27+02:00",
    "2026-11-06T11:56:21+02:00",
    "2026-11-06T11:56:30+02:00",
    "2026-11-06T12:31:33+02:00",
    "2026-11-06T13:31:12+02:00",
    "2026-11-06T13:48:20+02:00",
    "2026-11-06T13:49:34+02:00",
    "2026-11-06T13:54:28+02:00",
    "2026-11-06T13:54:29+02:00",
    "2026-11-06T13:54:30+02:00",
    "2026-11-06T13:55:13+02:00",
    "2026-11-06T13:55:35+02:00",
    "2026-11-06T13:57:38+02:00",
    "2026-11-06T14:24:29+02:00",
    "2026-11-06T14:24:30+02:00",
    "2026-11-06T14:24:35+02:00",
    "2026-11-06T14:27:43+02:00",
    "2026-11-06T14:27:44+02:00",
    "2026-11-06T14:29:53+02:00",
    "2026-11-06T14:30:59+02:00",
    "2026-11-06T14:31:00+02:00",
    "2026-11-06T14:39:14+02:00",
    "2026-11-06T14:39:15+02:00",
    "2026-11-06T14:39:16+02:00",
    "2026-11-06T14:59:21+02:00",
    "2026-11-06T14:59:24+02:00",
    "2026-11-06T15:17:56+02:00",
    "2026-11-06T15:17:57+02:00",
    "2026-11-06T15:17:58+02:00",
    "2026-11-06T15:42:37+02:00",
    "2026-11-06T15:42:38+02:00",
    "2026-11-06T16:25:42+02:00",
    "2026-11-06T16:25:43+02:00",
    "2026-11-06T16:25:44+02:00",
    "2026-11-06T16:54:14+02:00",
    "2026-11-06T16:56:15+02:00",
    "2026-11-06T17:00:11+02:00",
    "2026-11-06T17:00:12+02:00",
    "2026-11-06T17:24:19+02:00",
    "2026-11-06T17:25:28+02:00",
    "2026-11-06T18:31:58+02:00",
    "2026-11-06T18:32:17+02:00",
    "2026-11-06T18:32:23+02:00",
    "2026-11-06T18:32:24+02:00",
    "2026-11-06T18:35:53+02:00",
    "2026-11-06T18:35:55+02:00",
    "2026-11-06T18:35:56+02:00",
    "2026-11-06T18:36:21+02:00"
  ],
  "rev": 62,
  "waiting": null,
  "waits": [
    {
      "kind": "briefing",
      "from": "2026-11-06T11:56:30+02:00",
      "to": "2026-11-06T13:31:12+02:00"
    }
  ],
  "log": [
    {
      "t": "2026-11-06T11:50:20+02:00",
      "k": "init"
    },
    {
      "t": "2026-11-06T11:50:27+02:00",
      "k": "stage",
      "id": "manifest",
      "act": "start"
    },
    {
      "t": "2026-11-06T11:56:21+02:00",
      "k": "stage",
      "id": "briefing",
      "act": "start"
    },
    {
      "t": "2026-11-06T11:56:30+02:00",
      "k": "ask",
      "kind": "briefing",
      "note": "четыре вопроса — /reference, подача калькулятора, EN-контент, язык анимаций"
    },
    {
      "t": "2026-11-06T12:31:33+02:00",
      "k": "ask",
      "kind": "briefing",
      "note": "ждём ответы 2-4: подача калькулятора, EN-контент, язык анимаций"
    },
    {
      "t": "2026-11-06T13:31:12+02:00",
      "k": "answered",
      "kind": "briefing"
    },
    {
      "t": "2026-11-06T13:31:12+02:00",
      "k": "gate",
      "g": "G1",
      "ok": false,
      "open": 101,
      "total": 102
    },
    {
      "t": "2026-11-06T13:31:12+02:00",
      "k": "stage",
      "id": "spec",
      "act": "start"
    },
    {
      "t": "2026-11-06T13:48:20+02:00",
      "k": "gate",
      "g": "G2",
      "ok": true,
      "found": 14,
      "fixed": 14,
      "deferred": 0
    },
    {
      "t": "2026-11-06T13:49:34+02:00",
      "k": "stage",
      "id": "plan",
      "act": "start"
    },
    {
      "t": "2026-11-06T13:54:28+02:00",
      "k": "tier",
      "v": "T2"
    },
    {
      "t": "2026-11-06T13:54:29+02:00",
      "k": "tickets",
      "n": 4
    },
    {
      "t": "2026-11-06T13:54:30+02:00",
      "k": "gate",
      "g": "G3",
      "ok": true,
      "problems": 0
    },
    {
      "t": "2026-11-06T13:55:35+02:00",
      "k": "stage",
      "id": "build",
      "act": "start"
    },
    {
      "t": "2026-11-06T13:57:38+02:00",
      "k": "ticket",
      "ids": [
        "01"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-06T14:24:29+02:00",
      "k": "ticket",
      "ids": [
        "01"
      ],
      "act": "done",
      "tests": {
        "passed": 23,
        "failed": 0
      }
    },
    {
      "t": "2026-11-06T14:24:30+02:00",
      "k": "add",
      "key": "debt.placeholders",
      "n": 4
    },
    {
      "t": "2026-11-06T14:24:30+02:00",
      "k": "add",
      "key": "concerns",
      "n": 3
    },
    {
      "t": "2026-11-06T14:24:35+02:00",
      "k": "ticket",
      "ids": [
        "01"
      ],
      "act": "review"
    },
    {
      "t": "2026-11-06T14:24:35+02:00",
      "k": "ticket",
      "ids": [
        "02"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-06T14:27:43+02:00",
      "k": "ticket",
      "ids": [
        "01"
      ],
      "act": "repair",
      "note": "контент, вставленный в [data-reveal] после initMotion, виден без твина; шапка не прячется при скролле"
    },
    {
      "t": "2026-11-06T14:27:44+02:00",
      "k": "add",
      "key": "concerns",
      "n": 5
    },
    {
      "t": "2026-11-06T14:29:53+02:00",
      "k": "ticket",
      "ids": [
        "01"
      ],
      "act": "review"
    },
    {
      "t": "2026-11-06T14:30:59+02:00",
      "k": "ticket",
      "ids": [
        "01"
      ],
      "act": "done",
      "tests": {
        "passed": 37,
        "failed": 0
      }
    },
    {
      "t": "2026-11-06T14:31:00+02:00",
      "k": "add",
      "key": "concerns",
      "n": 3
    },
    {
      "t": "2026-11-06T14:39:14+02:00",
      "k": "ticket",
      "ids": [
        "02"
      ],
      "act": "done",
      "tests": {
        "passed": 37,
        "failed": 0
      }
    },
    {
      "t": "2026-11-06T14:39:14+02:00",
      "k": "add",
      "key": "debt.placeholders",
      "n": 2
    },
    {
      "t": "2026-11-06T14:39:15+02:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-06T14:39:16+02:00",
      "k": "ticket",
      "ids": [
        "03"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-06T14:59:21+02:00",
      "k": "ticket",
      "ids": [
        "03"
      ],
      "act": "reset"
    },
    {
      "t": "2026-11-06T14:59:24+02:00",
      "k": "ticket",
      "ids": [
        "03"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-06T15:17:56+02:00",
      "k": "ticket",
      "ids": [
        "03"
      ],
      "act": "done",
      "tests": {
        "passed": 48,
        "failed": 0
      }
    },
    {
      "t": "2026-11-06T15:17:57+02:00",
      "k": "add",
      "key": "debt.placeholders",
      "n": 4
    },
    {
      "t": "2026-11-06T15:17:58+02:00",
      "k": "add",
      "key": "concerns",
      "n": 5
    },
    {
      "t": "2026-11-06T15:17:58+02:00",
      "k": "ticket",
      "ids": [
        "04"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-06T15:42:37+02:00",
      "k": "ticket",
      "ids": [
        "04"
      ],
      "act": "done",
      "tests": {
        "passed": 51,
        "failed": 0
      }
    },
    {
      "t": "2026-11-06T15:42:37+02:00",
      "k": "add",
      "key": "concerns",
      "n": 3
    },
    {
      "t": "2026-11-06T15:42:38+02:00",
      "k": "stage",
      "id": "review",
      "act": "start"
    },
    {
      "t": "2026-11-06T16:25:42+02:00",
      "k": "tickets",
      "n": 5
    },
    {
      "t": "2026-11-06T16:25:43+02:00",
      "k": "gate",
      "g": "G3",
      "ok": true,
      "problems": 0
    },
    {
      "t": "2026-11-06T16:25:44+02:00",
      "k": "add",
      "key": "report",
      "n": 12
    },
    {
      "t": "2026-11-06T16:25:44+02:00",
      "k": "ticket",
      "ids": [
        "F1"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-06T16:54:14+02:00",
      "k": "ticket",
      "ids": [
        "F1"
      ],
      "act": "done",
      "tests": {
        "passed": 59,
        "failed": 0
      }
    },
    {
      "t": "2026-11-06T16:54:14+02:00",
      "k": "ticket",
      "ids": [
        "F1"
      ],
      "act": "review"
    },
    {
      "t": "2026-11-06T16:56:15+02:00",
      "k": "ticket",
      "ids": [
        "F1"
      ],
      "act": "repair",
      "note": "дедлайн intro не срабатывает раньше потолка прелоадера + его ухода; hero виден за 3 с при упавшем прелоадере"
    },
    {
      "t": "2026-11-06T17:00:11+02:00",
      "k": "ticket",
      "ids": [
        "F1"
      ],
      "act": "done",
      "tests": {
        "passed": 61,
        "failed": 0
      }
    },
    {
      "t": "2026-11-06T17:00:12+02:00",
      "k": "add",
      "key": "report",
      "n": 1
    },
    {
      "t": "2026-11-06T17:00:12+02:00",
      "k": "stage",
      "id": "final",
      "act": "start"
    },
    {
      "t": "2026-11-06T17:24:19+02:00",
      "k": "gate",
      "g": "G4",
      "ok": false,
      "checked": 52,
      "matched": 48
    },
    {
      "t": "2026-11-06T17:25:28+02:00",
      "k": "tests",
      "passed": 61,
      "failed": 0
    },
    {
      "t": "2026-11-06T17:25:28+02:00",
      "k": "finish",
      "result": "Макет лендинга eLeads: 14 секций, калькулятор и кейсы в полном качестве, UA/EN, аналитика, статика в dist/"
    },
    {
      "t": "2026-11-06T18:31:58+02:00",
      "k": "reopen"
    },
    {
      "t": "2026-11-06T18:32:17+02:00",
      "k": "gate",
      "g": "G1",
      "ok": false,
      "open": 6,
      "total": 109
    },
    {
      "t": "2026-11-06T18:32:17+02:00",
      "k": "stage",
      "id": "spec",
      "act": "start"
    },
    {
      "t": "2026-11-06T18:32:23+02:00",
      "k": "stage",
      "id": "briefing",
      "act": "done"
    },
    {
      "t": "2026-11-06T18:32:24+02:00",
      "k": "gate",
      "g": "G1",
      "ok": false,
      "open": 6,
      "total": 109
    },
    {
      "t": "2026-11-06T18:32:24+02:00",
      "k": "stage",
      "id": "spec",
      "act": "start"
    },
    {
      "t": "2026-11-06T18:35:53+02:00",
      "k": "stage",
      "id": "plan",
      "act": "start"
    },
    {
      "t": "2026-11-06T18:35:55+02:00",
      "k": "tickets",
      "n": 8
    },
    {
      "t": "2026-11-06T18:35:56+02:00",
      "k": "gate",
      "g": "G3",
      "ok": true,
      "problems": 0
    },
    {
      "t": "2026-11-06T18:36:21+02:00",
      "k": "gate",
      "g": "G2",
      "ok": true,
      "found": 3,
      "fixed": 3,
      "deferred": 0
    }
  ],
  "reqList": [
    {
      "id": "R01",
      "text": "«одностраничный лендинг эксперта по Telegram Ads — Володимира Кучера (бренд eLeads, Telegram @Kucherflow)»",
      "status": "done"
    },
    {
      "id": "R02",
      "text": "«давать «вау» с первого экрана»",
      "status": "done"
    },
    {
      "id": "R03",
      "text": "«выглядеть как дорогой кастомный проект, а не шаблон»",
      "status": "done"
    },
    {
      "id": "R04",
      "text": "«летать на среднем Android»",
      "status": "done"
    },
    {
      "id": "R05",
      "text": "«этап МАКЕТА: делаем шапку, hero, калькулятор и кейсы в полном качестве»",
      "status": "done"
    },
    {
      "id": "R06",
      "text": "«остальные блоки каркасом с реальным контентом»",
      "status": "done"
    },
    {
      "id": "R07",
      "text": "«Изучи все файлы в /reference: это вайрфрейм клиента (структура) и обложка поста (бренд)»",
      "status": "done"
    },
    {
      "id": "R08",
      "text": "«Vite + vanilla JS (без React), чистый HTML/CSS»",
      "status": "done"
    },
    {
      "id": "R09",
      "text": "«GSAP + ScrollTrigger для анимаций»",
      "status": "done"
    },
    {
      "id": "R10",
      "text": "«Lenis для плавного скролла»",
      "status": "done"
    },
    {
      "id": "R11",
      "text": "«Весь контент вынести в JSON в /src/data: content.ua.json, content.en.json, cases.json, faq.json, calculator.json»",
      "status": "done"
    },
    {
      "id": "R12",
      "text": "«Клиент и я должны менять тексты и цифры без правки вёрстки»",
      "status": "done"
    },
    {
      "id": "R13",
      "text": "«Сборка в статику (dist/), деплой на обычный хостинг клиента»",
      "status": "done"
    },
    {
      "id": "R14",
      "text": "«Никаких тяжёлых UI-фреймворков и Tailwind-шаблонности»",
      "status": "done"
    },
    {
      "id": "R15",
      "text": "«Цвета берутся из Telegram-канала клиента» — палитра из 10 переменных (--ink … --tg)",
      "status": "done"
    },
    {
      "id": "R16",
      "text": "«Синие кнопки из вайрфрейма заменить на бренд»",
      "status": "done"
    },
    {
      "id": "R17",
      "text": "«заголовки: узкий жирный гротеск КАПСОМ … (Oswald или аналог, подбери лучший с кириллицей)»",
      "status": "done"
    },
    {
      "id": "R18",
      "text": "«текст: Onest или Manrope»",
      "status": "done"
    },
    {
      "id": "R19",
      "text": "«цифры и подписи: моноширинный (JetBrains Mono)»",
      "status": "done"
    },
    {
      "id": "R20",
      "text": "«Фото Володимира: вырезанное, на тёмном фоне, с мягким тёплым оранжевым свечением сзади … Пока фото нет, поставь аккуратный плейсхолдер такого же размера»",
      "status": "done"
    },
    {
      "id": "R21",
      "text": "«Чистий premium-tech / performance marketing. Багато повітря, сильна типографіка … Не перетворювати на \"велике агентство з 30 послугами\"»",
      "status": "done"
    },
    {
      "id": "R22",
      "text": "«Запрещено: шаблонный AI-вид (фиолетово-синие градиенты, одинаковые карточки с одинаковым радиусом везде, эмодзи как иконки, всё по центру)»",
      "status": "done"
    },
    {
      "id": "R23",
      "text": "«Каждая секция со своей раскладкой»",
      "status": "done"
    },
    {
      "id": "R24",
      "text": "«Анимировать только transform и opacity. Не анимировать blur, filter, box-shadow, размеры»",
      "status": "done"
    },
    {
      "id": "R25",
      "text": "«backdrop-filter только в шапке»",
      "status": "done"
    },
    {
      "id": "R26",
      "text": "«Не больше одного canvas/WebGL на странице, ставить его на паузу вне экрана»",
      "status": "done"
    },
    {
      "id": "R27",
      "text": "«Изображения в WebP/AVIF, lazy-load всё ниже первого экрана»",
      "status": "done"
    },
    {
      "id": "R28",
      "text": "«Поддержать prefers-reduced-motion: эффекты выключаются, контент виден»",
      "status": "done"
    },
    {
      "id": "R29",
      "text": "«Контент виден без JS-анимаций: ничего не прячем через opacity: 0 навсегда»",
      "status": "done"
    },
    {
      "id": "R30",
      "text": "«Цель: Lighthouse на мобильном 85+ по Performance»",
      "status": "done"
    },
    {
      "id": "R31",
      "text": "«0 горизонтального скролла на 360px»",
      "status": "done"
    },
    {
      "id": "R32",
      "text": "«Sticky, полупрозрачная с blur»",
      "status": "done"
    },
    {
      "id": "R33",
      "text": "«Логотип eLeads, якоря на блоки»",
      "status": "done"
    },
    {
      "id": "R34",
      "text": "«переключатель UA/EN» (в шапке)",
      "status": "done"
    },
    {
      "id": "R35",
      "text": "«кнопка «Написати» → https://t.me/Kucherflow»",
      "status": "done"
    },
    {
      "id": "R36",
      "text": "«На мобильном бургер с полноэкранным меню»",
      "status": "done"
    },
    {
      "id": "R37",
      "text": "«Фон: видео /public/video/hero-1080.mp4 (мобильный hero-720.mp4, постер poster.jpg), autoplay muted loop playsinline. Пока файла нет, сделай плейсхолдер-градиент в бренде»",
      "status": "done"
    },
    {
      "id": "R38",
      "text": "«Поверх тёмный градиент 50–70%, чтобы текст читался»",
      "status": "done"
    },
    {
      "id": "R39",
      "text": "«Прелоадер 1–1,5 сек: проценты огромным condensed-шрифтом в градиенте, потом шторка уходит вверх»",
      "status": "done"
    },
    {
      "id": "R40",
      "text": "«Надзаголовок: TELEGRAM PERFORMANCE MARKETING»",
      "status": "done"
    },
    {
      "id": "R41",
      "text": "«Заголовок «ПРОСУВАННЯ ЧЕРЕЗ TELEGRAM ADS»: выезжает по строкам из маски, «TELEGRAM ADS» в градиенте»",
      "status": "done"
    },
    {
      "id": "R42",
      "text": "«Подзаголовок: «Залучаю підписників, лідів і клієнтів через офіційну рекламу Telegram в Україні та по всьому світу»»",
      "status": "done"
    },
    {
      "id": "R43",
      "text": "«Цифры-счётчики: 7+ років у digital · $2M+ рекламних бюджетів · десятки проєктів»",
      "status": "done"
    },
    {
      "id": "R44",
      "text": "«CTA: «Обговорити проєкт у Telegram →»»",
      "status": "done"
    },
    {
      "id": "R45",
      "text": "«Фото справа: параллакс слоёв (фото, свечение, фон двигаются с разной скоростью), свечение слегка следует за курсором. Только на десктопе»",
      "status": "done"
    },
    {
      "id": "R46",
      "text": "«Мені довіряють»: бегущая строка логотипов (Finmap, Cryptonite, Global Auto Logistic, Олександр Мухін, Віктор Домбовецький, Monolit, Trackdesk), пауза при наведении. Пока логотипов нет, названия текстом»",
      "status": "done"
    },
    {
      "id": "R47",
      "text": "«Переключатель Україна / Worldwide, цифры меняются с анимацией»",
      "status": "done"
    },
    {
      "id": "R48",
      "text": "«UA: 81% користувачів месенджерів 18–70 використовували Telegram; 18–70 високе проникнення в усіх вікових групах; 4 500 респондентів дослідження Суспільного / Gradus Research; блок «У Telegram присутні різні сегменти аудиторії»»",
      "status": "done"
    },
    {
      "id": "R49",
      "text": "«Worldwide: 1B+ MAU; TOP-5 застосунків світу; 200+ GEO; «Що рекламуємо: Telegram-канали · боти · сайти · застосунки»»",
      "status": "done"
    },
    {
      "id": "R50",
      "text": "«Сноска с источниками мелким текстом (из вайрфрейма)»",
      "status": "done"
    },
    {
      "id": "R51",
      "text": "«Подача bento: карточки разного размера, одна главная цифра крупно»",
      "status": "done"
    },
    {
      "id": "R52",
      "text": "«8 карточек: Бізнес (Finmap), Експерти (eLeads · Мухін · Домбовецький), Crypto (Cryptonite), Education (Anna Haustova), Auto (Global Auto Logistic), Finance / Investments (Monolit), SaaS / B2B (Trackdesk)»",
      "status": "done"
    },
    {
      "id": "R53",
      "text": "«Інша ніша? Напишіть мені» (акцентная, ведёт в Telegram)»",
      "status": "done"
    },
    {
      "id": "R54",
      "text": "«3 формата: у каналах, у відео / медіаконтенті, у ботах»",
      "status": "done"
    },
    {
      "id": "R55",
      "text": "«Скриншоты из /public/img/ads/ (пока плейсхолдеры)»",
      "status": "done"
    },
    {
      "id": "R56",
      "text": "«Клик увеличивает скриншот в лайтбоксе»",
      "status": "done"
    },
    {
      "id": "R57",
      "text": "«Можно подать скриншоты внутри макетов телефона»",
      "status": "deferred",
      "why": "сказано «можно» — не обязательное"
    },
    {
      "id": "R58",
      "text": "«Ввод: ніша (Business, Crypto, Education, Auto), GEO (Україна, Worldwide), ціль (Підписники, Користувачі бота)»",
      "status": "done"
    },
    {
      "id": "R59",
      "text": "«бюджет слайдером €650 – €10 000+»",
      "status": "done"
    },
    {
      "id": "R60",
      "text": "«Пересчёт мгновенно, без перезагрузки, цифры плавно «докручиваются»»",
      "status": "done"
    },
    {
      "id": "R61",
      "text": "«Вывод диапазонами: Покази, CTR, Кліки, CPC, Конверсії, CPA/CPS»",
      "status": "done"
    },
    {
      "id": "R62",
      "text": "«Подача НЕ таблицей: сделай живую воронку «Покази → Кліки → Підписники/Ліди», ступени меняют ширину при движении слайдера»",
      "status": "done"
    },
    {
      "id": "R63",
      "text": "«Предложи мне ещё 1 альтернативу в плане»",
      "status": "done"
    },
    {
      "id": "R64",
      "text": "«Все коэффициенты в calculator.json (CPM по GEO, CTR по нише, CR по цели, разброс ±15%) … правдоподобные демо-значения и пометь \"demo\": true»",
      "status": "done"
    },
    {
      "id": "R65",
      "text": "«Подпись: «Розрахунок базується на історичних кампаніях eLeads. Фактичний результат залежить від GEO, оферу, посадкової та креативів»»",
      "status": "done"
    },
    {
      "id": "R66",
      "text": "«CTA «Отримати точний прогноз →» в Telegram»",
      "status": "done"
    },
    {
      "id": "R67",
      "text": "«Под блоком: «Не знайшли свою нішу? Напишіть мені — перевірю, чи є релевантний досвід, і дам окремий прогноз»»",
      "status": "done"
    },
    {
      "id": "R68",
      "text": "«Доступность: управление с клавиатуры, aria-live на результате»",
      "status": "done"
    },
    {
      "id": "R69",
      "text": "«Карточки: Cryptonite, Finmap, Global Auto Logistic, Князєв (Auto / Korea), Олександр Мухін, Віктор Домбовецький, Trackdesk»",
      "status": "done"
    },
    {
      "id": "R70",
      "text": "«На карточке ниша-тег, название, бюджет, результат, CPA/CPS крупными цифрами»",
      "status": "done"
    },
    {
      "id": "R71",
      "text": "«Один кейс крупнее остальных»",
      "status": "done"
    },
    {
      "id": "R72",
      "text": "«Клик открывает модалку без перехода: задача, GEO, бюджет, результат, CPA/CPS, «Що було зроблено», отзыв/скриншот»",
      "status": "done"
    },
    {
      "id": "R73",
      "text": "«кнопка «Написати Володимиру →»» (в модалке кейса)",
      "status": "done"
    },
    {
      "id": "R74",
      "text": "«Данные в cases.json, пока плейсхолдеры с пометкой «уточнити»»",
      "status": "placeholder",
      "why": "реальных цифр кейсов нет"
    },
    {
      "id": "R75",
      "text": "«7 шагов: Аналізую проєкт → Формую стратегію → Готую рекламу та погоджую → Готую/допрацьовую посадкову → Запускаю кампанії → Аналізую та оптимізую → Масштабую те, що працює»",
      "status": "done"
    },
    {
      "id": "R76",
      "text": "«Линия прорисовывается по скроллу, шаги загораются по очереди»",
      "status": "done"
    },
    {
      "id": "R77",
      "text": "«Клієнту не потрібно самостійно розбиратися в Telegram Ads: я підключаюсь до задачі від стратегії та рекламних матеріалів до оптимізації й масштабування»",
      "status": "done"
    },
    {
      "id": "R78",
      "text": "«Точечная (dot-map) карта мира, пульсирующие точки в регионах»",
      "status": "done"
    },
    {
      "id": "R79",
      "text": "«Hover/tap по региону — карточка с данными»",
      "status": "done"
    },
    {
      "id": "R80",
      "text": "«Список справа: Україна (локальна аудиторія), Європа (українці + міжнародні сегменти, 4.43M під temporary protection у ЄС), UK, USA, Canada, Australia (Tier-1), Asia (окремі GEO за задачею)»",
      "status": "done"
    },
    {
      "id": "R81",
      "text": "«Карту делай лёгкой (SVG или canvas, без картографических библиотек)»",
      "status": "done"
    },
    {
      "id": "R82",
      "text": "«6 карточек: GEO, Мова, Інтереси, Тематики, Конкретні канали, Аудиторії. Hover раскрывает 1–2 предложения пояснения»",
      "status": "done"
    },
    {
      "id": "R83",
      "text": "«Слайдер отзывов (desktop 3 карточки, mobile swipe): Мухін, Домбовецький, третий отзыв»",
      "status": "done"
    },
    {
      "id": "R84",
      "text": "«блок засновника с фото: «За eLeads стоїть особиста експертиза. Привіт, я Володимир — засновник eLeads …»»",
      "status": "done"
    },
    {
      "id": "R85",
      "text": "«Цепочка Traffic → Telegram → Content → Funnel → Lead → Sale как анимированный поток»",
      "status": "done"
    },
    {
      "id": "R86",
      "text": "«Услуги нумерованным списком крупным капсом с превью при наведении: Telegram Ads, Meta Ads, Посіви / закуп реклами, Упаковка каналу, Контент, Боти, Воронки, Органічний / UBT traffic, Консультації»",
      "status": "done"
    },
    {
      "id": "R87",
      "text": "«Клієнт може прийти лише за Telegram Ads або передати eLeads повну Telegram-систему»",
      "status": "done"
    },
    {
      "id": "R88",
      "text": "«4 карточки постов из канала в стиле обложек (жёлтый капс на тёмном), «Читати в Telegram →»»",
      "status": "done"
    },
    {
      "id": "R89",
      "text": "«FAQ-аккордеон» из 9 вопросов, начиная со «Скільки потрібно для старту? (мін. бюджет €650)»",
      "status": "placeholder",
      "why": "текстов ответов нет"
    },
    {
      "id": "R90",
      "text": "«Тёмный блок с фото. «Обговоримо ваш проєкт?» огромным капсом»",
      "status": "done"
    },
    {
      "id": "R91",
      "text": "«Кнопка «Написати Володимиру в Telegram →», под ней @Kucherflow» + текст блока",
      "status": "done"
    },
    {
      "id": "R92",
      "text": "«Подвал: Логотип, якоря, Telegram, © 2026 eLeads, переключатель UA/EN»",
      "status": "done"
    },
    {
      "id": "R93",
      "text": "«строка «Design & development — [ИМЯ]» со ссылкой (имя вставлю сам)»",
      "status": "placeholder",
      "why": "имя и ссылка не переданы"
    },
    {
      "id": "R94",
      "text": "«UA по умолчанию, EN через JSON. Структура и UX одинаковые»",
      "status": "done"
    },
    {
      "id": "R95",
      "text": "«Выбор языка сохранять в localStorage, lang на <html> менять»",
      "status": "done"
    },
    {
      "id": "R96",
      "text": "«отправлять в window.dataLayer событиями: cta_telegram_click (с местом клика), calculator_change (ниша, GEO, цель, бюджет), calculator_cta_click, case_open (название кейса)»",
      "status": "done"
    },
    {
      "id": "R97",
      "text": "«GA4 и Meta Pixel подключатся через ID в конфиге, пока пустые»",
      "status": "done"
    },
    {
      "id": "R98",
      "text": "«Title, description, Open Graph-картинка, favicon, семантичные заголовки, alt у картинок, lang»",
      "status": "done"
    },
    {
      "id": "R99",
      "text": "«Проверка: 360px, 768px, 1440px, Lighthouse mobile, reduced motion, клавиатура. Пришли отчёт и что не дотянуто»",
      "status": "done"
    },
    {
      "id": "R100i",
      "text": "(подразумевается) английские переводы всех украинских текстов, которых в брифе нет",
      "status": "done"
    },
    {
      "id": "R101i",
      "text": "(подразумевается) сайт должен открываться по одному адресу как статика — нужен способ запустить и собрать (npm run dev / build)",
      "status": "done"
    },
    {
      "id": "G01",
      "text": "«https://fintap.framer.website/ Анимации как тут сделай»",
      "status": "done"
    },
    {
      "id": "G02",
      "text": "«можешь закинуть на гитхаб»",
      "status": "done"
    },
    {
      "id": "G03",
      "text": "«https://shining-three-588967.framer.app/ отсюда надо взять загрузку сайта, типо пишется запрос находится наш сайт и потом переход на сам сайт»",
      "status": "in-ticket"
    },
    {
      "id": "G04",
      "text": "«https://shining-three-588967.framer.app/ анимации и переходы тоже отсюда»",
      "status": "in-ticket"
    },
    {
      "id": "G05",
      "text": "«https://neu-bento.framer.website/ секции под бриф»",
      "status": "in-ticket"
    },
    {
      "id": "G06",
      "text": "«https://portfolea.framer.website/ тут ахуенные анимации их надо будет где-то использовать»",
      "status": "in-ticket"
    },
    {
      "id": "G07",
      "text": "«5 секунд давай» — длительность загрузки",
      "status": "in-ticket"
    },
    {
      "id": "G08",
      "text": "«давай твой вариант» — в поиске набирается «просування telegram ads» / EN «telegram ads promotion», результат «eLeads — Telegram Ads · Володимир Кучер»",
      "status": "in-ticket"
    }
  ],
  "gates": {
    "G1": {
      "ok": false,
      "at": "2026-11-06T18:32:24+02:00",
      "open": 6,
      "total": 109
    },
    "G3": {
      "ok": true,
      "at": "2026-11-06T18:35:56+02:00",
      "problems": 0
    },
    "G2": {
      "ok": true,
      "at": "2026-11-06T18:36:21+02:00",
      "found": 3,
      "fixed": 3,
      "deferred": 0
    }
  },
  "result": null,
  "report": [
    "Пре-рендер молча пропускает узел [data-i18n] с вложенными тегами — сейчас таких нет, но следующая правка вёрстки может выпустить пустой узел",
    "Мёртвый код: pinSection в motion.js не используется, лишний getLang() в geo.js",
    "Таргетинг и экосистема: при наведении ставят aria-expanded=true закрытой панели — скринридер скажет «развёрнуто»",
    "Проверка заглушки «уточнити»/«TBD» захардкожена в cases.js и faq.js отдельно от common.tbd",
    "lockScroll — флаг, а не счётчик: лайтбокс внутри модалки разблокировал бы страницу",
    "tests/visibility.test.js проверяет исходник, а не поведение появления",
    "Шаблон client-data/calculator-template.csv (16 строк ниша×GEO×цель) не ложится в три таблицы calculator.json — нужно решение, как сводить",
    "Фото, логотипы и скриншоты рекламы подключаются правкой index.html, когда клиент их пришлёт (описано в README)",
    "og:image относительный — превью в мессенджерах появится, когда будет домен; шрифты с Google Fonts, не self-host",
    "Клиенту подтвердить: ответы FAQ 3, 4, 5, 8, шаги «Що було зроблено» в кейсах, имя MONOLIT в макете формата — собраны из текстов страницы",
    "Градиентный дрейф фона hero (22 с) крутится и вне экрана — дёшево, но не на паузе",
    "Не проверено: реальный Android, Safari, Firefox, живой тап по карте, страница с упавшим GSAP; видео hero даёт 404, пока нет файлов",
    "Если прелоадер падает на самом шаге ухода (около 2,6 с), hero показывается сразу, но шторка уходит ещё до 1,3 с"
  ]
}
