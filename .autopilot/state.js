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
  "baseCommit": "0f2eb78",
  "startedAt": "2026-11-06T11:50:20+02:00",
  "updatedAt": "2026-11-10T01:01:57+02:00",
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
      "status": "done",
      "startedAt": "2026-11-06T18:35:53+02:00",
      "finishedAt": "2026-11-06T18:36:34+02:00"
    },
    {
      "id": "build",
      "status": "active",
      "startedAt": "2026-11-06T18:36:34+02:00"
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
    "total": 131,
    "done": 108,
    "inTicket": 5,
    "inSpec": 3,
    "placeholder": 3,
    "deferred": 1,
    "dropped": 11
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
      "status": "done",
      "startedAt": "2026-11-06T18:36:36+02:00",
      "finishedAt": "2026-11-06T18:51:04+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 63,
        "failed": 0
      },
      "commit": "e3c2c58"
    },
    {
      "id": "06",
      "title": "Оформление overtake: темы, типографика, компоненты, шапка, hero, загрузка, подвал, переключатель версий",
      "requirements": [
        "G09",
        "G10",
        "G11",
        "G12",
        "R15",
        "R16",
        "R17",
        "R18",
        "R19"
      ],
      "blockedBy": [
        "05"
      ],
      "wave": 7,
      "zone": [
        "src/styles/tokens.css",
        "src/styles/base.css",
        "src/styles/layout.css",
        "src/styles/components.css",
        "src/styles/sections/{header,hero,preloader,footer,photos}.css",
        "src/sections/{header,hero,preloader,footer}.js",
        "src/core/transition.js",
        "src/dev/",
        "src/main.js",
        "components.css",
        "import.meta.env.DEV",
        "index.html",
        "<head>",
        ".preloader",
        "hero",
        "nav",
        "footer",
        "preloader",
        "common",
        "content.*.json",
        "tests/"
      ],
      "review": "да — фундамент",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-06T18:54:14+02:00",
      "finishedAt": "2026-11-07T23:18:15+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 89,
        "failed": 0
      },
      "commit": "5b9d887"
    },
    {
      "id": "07",
      "title": "Оформление overtake для секций 02–14, модалки и лайтбокса",
      "requirements": [
        "G09",
        "G10",
        "G11",
        "R22",
        "R23"
      ],
      "blockedBy": [],
      "wave": 7,
      "zone": [
        "src/styles/sections/{stats,niches,formats,calculator,cases,process,geo,targeting,reviews,ecosystem,materials,faq,cta}.css",
        "src/sections/*.js",
        "tests/",
        "index.html"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "failed",
      "startedAt": "2026-11-06T18:57:57+02:00",
      "finishedAt": "2026-11-07T23:22:59+02:00",
      "retries": 0,
      "repairs": 0,
      "concerns": [
        "заменён: пользователь «Делаем с 0» — оформление Aether вместо overtake; шаг 1 вошёл в коммит 5b9d887"
      ]
    },
    {
      "id": "08",
      "title": "Маркер в заголовках, линза в hero, номер процесса, вордмарк, наклон portfolea",
      "requirements": [
        "G04",
        "G06"
      ],
      "blockedBy": [
        "13"
      ],
      "wave": 14,
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
      "id": "09",
      "title": "Bento-секции, наклон portfolea на картинках и перепроверка скорости",
      "requirements": [
        "G05",
        "G06",
        "R30"
      ],
      "blockedBy": [
        "08"
      ],
      "wave": 15,
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
      "id": "10",
      "title": "Облик Aether: темы, шрифты, шапка, ленты крест-накрест, подвал, загрузка",
      "requirements": [
        "G13",
        "G10",
        "G11",
        "G15",
        "G16"
      ],
      "blockedBy": [],
      "wave": 11,
      "zone": [
        "src/styles/tokens.css",
        "src/styles/base.css",
        "src/styles/layout.css",
        "src/styles/components.css",
        "src/styles/sections/{header,preloader,footer}.css",
        "src/sections/{header,preloader,footer}.js",
        "src/sections/ribbons.js",
        "src/styles/sections/ribbons.css",
        "src/core/transition.js",
        "src/dev/",
        "index.html",
        "<head>",
        ".preloader",
        "#hero",
        "nav",
        "footer",
        "preloader",
        "ribbons",
        "common",
        "content.*.json",
        "tests/"
      ],
      "review": "да — фундамент",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-07T23:23:56+02:00",
      "finishedAt": "2026-11-07T23:42:15+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 97,
        "failed": 0
      },
      "commit": "83b63b4"
    },
    {
      "id": "11",
      "title": "Первый экран по макету пользователя: Володимир, планета, горящее кольцо, парящие карточки",
      "requirements": [
        "G17",
        "G18",
        "G13",
        "R40",
        "R41",
        "R42",
        "R43",
        "R44",
        "R45",
        "R46"
      ],
      "blockedBy": [
        "10"
      ],
      "wave": 12,
      "zone": [
        "src/sections/hero.js",
        "src/styles/sections/hero.css",
        "src/styles/sections/photos.css",
        "public/img/hero/",
        "#hero",
        "index.html",
        "<section id=\"hero\">",
        "hero",
        "content.*.json",
        "tests/hero-*.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-07T23:39:33+02:00",
      "finishedAt": "2026-11-08T01:06:44+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 127,
        "failed": 0
      },
      "commit": "2b928ab"
    },
    {
      "id": "12",
      "title": "Кейсы: галерея, которая «перекручивается» вбок при прокрутке",
      "requirements": [
        "G14",
        "G13",
        "R69",
        "R70",
        "R71",
        "R72",
        "R73"
      ],
      "blockedBy": [
        "10"
      ],
      "wave": 12,
      "zone": [
        "src/sections/cases.js",
        "src/styles/sections/cases.css",
        "#cases",
        "index.html",
        "<section id=\"cases\">",
        "cases",
        "content.*.json",
        "tests/",
        "cases-gallery*.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-07T23:39:33+02:00",
      "finishedAt": "2026-11-07T23:54:59+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 109,
        "failed": 0
      },
      "commit": "b147d61"
    },
    {
      "id": "13",
      "title": "Остальные секции в облике Aether: орбита ниш, цифры-таймер, всё прочее",
      "requirements": [
        "G13",
        "R22",
        "R23",
        "R47",
        "R51",
        "R52",
        "R53"
      ],
      "blockedBy": [
        "12"
      ],
      "wave": 13,
      "zone": [
        "src/sections/{stats,niches,formats,calculator,process,geo,targeting,reviews,ecosystem,materials,faq,cta}.js",
        "src/styles/sections/",
        "index.html",
        "content.*.json",
        "tests/"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "in-progress",
      "startedAt": "2026-11-08T00:06:08+02:00",
      "retries": 0,
      "repairs": 0
    },
    {
      "id": "14",
      "title": "Вариант 3 первого экрана: интро с самолётиком (видео + кольцо вокруг ELEADS в коде)",
      "requirements": [
        "G24",
        "G19"
      ],
      "blockedBy": [
        "11"
      ],
      "wave": 13,
      "zone": [
        "src/sections/hero-plane.js",
        "src/styles/sections/hero-plane.css",
        "src/sections/hero.js",
        "src/sections/preloader.js",
        "<head>",
        "src/dev/theme-switcher.js",
        "public/video/hero-v3*",
        "public/img/hero/",
        "<section id=\"hero\">",
        "hero.v3",
        "content.*.json",
        "tests/hero-plane*.test.js",
        "tests/head-scripts.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-08T01:10:36+02:00",
      "finishedAt": "2026-11-08T01:34:54+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 136,
        "failed": 0
      },
      "commit": "6846302"
    },
    {
      "id": "15",
      "title": "Вариант 2 первого экрана на весь экран 1920×1080",
      "requirements": [
        "G18",
        "G25"
      ],
      "blockedBy": [
        "14"
      ],
      "wave": 14,
      "zone": [
        "src/styles/sections/hero.css",
        "src/styles/sections/photos.css",
        "src/sections/hero.js",
        "<section id=\"hero\">",
        "tests/hero-*.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-08T01:40:55+02:00",
      "finishedAt": "2026-11-08T01:47:51+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 137,
        "failed": 0
      },
      "commit": "be20d4e"
    },
    {
      "id": "16",
      "title": "Вариант 4 первого экрана: синий, огромное «eLeads» за Володимиром, белые карточки",
      "requirements": [
        "G26",
        "G27",
        "G19",
        "R40",
        "R41",
        "R42",
        "R43",
        "R44"
      ],
      "blockedBy": [
        "15"
      ],
      "wave": 15,
      "zone": [
        "src/sections/hero-blue.js",
        "src/styles/sections/hero-blue.css",
        "src/sections/hero.js",
        "<head>",
        "src/dev/theme-switcher.js",
        "src/styles/sections/header.css",
        "data-hero=\"blue\"",
        "public/img/hero/",
        "<section id=\"hero\">",
        "hero.v4",
        "content.*.json",
        "tests/hero-blue*.test.js",
        "tests/head-scripts.test.js",
        "src/sections/hero-orbit.js",
        "src/styles/sections/hero-orbit.css",
        "tests/hero-orbit.test.js",
        "#hero",
        "hero.word",
        "hero.ads",
        "hero.scroll",
        "public/img/hero/"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-08T18:59:06+02:00",
      "finishedAt": "2026-11-08T19:50:08+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 142,
        "failed": 0
      },
      "commit": "8d4852a"
    },
    {
      "id": "17",
      "title": "Вариант «Самолётик»: продолжение страницы под первым экраном",
      "requirements": [
        "G28",
        "G23",
        "G13"
      ],
      "blockedBy": [
        "16"
      ],
      "wave": 16,
      "zone": [
        "src/data/config.json",
        "src/core/sections.js",
        "src/main.js",
        "<head>",
        "build/i18n-prerender.js",
        "hidden",
        "tests/sections-config.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "failed",
      "startedAt": "2026-11-08T19:42:20+02:00",
      "finishedAt": "2026-11-09T12:43:19+02:00",
      "retries": 0,
      "repairs": 0,
      "concerns": [
        "прервано сбоем API: продолжение страницы сделано, переход с разлётом букв начат и не доделан"
      ]
    },
    {
      "id": "18",
      "title": "Один первый экран («Синий») в палитре канала, без вариантов и тем",
      "requirements": [
        "H01",
        "H02"
      ],
      "blockedBy": [
        "17"
      ],
      "wave": 17,
      "zone": [
        ".autopilot/",
        "reference/",
        "Photos/",
        "AGENTS.md",
        "CLAUDE.md",
        ".gitignore"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-09T12:54:15+02:00",
      "finishedAt": "2026-11-09T13:11:26+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 113,
        "failed": 0
      },
      "commit": "14f454c"
    },
    {
      "id": "19",
      "title": "Блок 02 «Telegram у цифрах»: наезд шторкой (Stack Reveal Scroll), счётчики, табло, лесенка",
      "requirements": [
        "H03",
        "H09",
        "H10",
        "R47",
        "R48",
        "R49",
        "R50",
        "R51"
      ],
      "blockedBy": [
        "18"
      ],
      "wave": 18,
      "zone": [
        "src/sections/stats.js",
        "src/styles/sections/stats.css",
        "#stats",
        "index.html",
        "stats",
        "content.*.json",
        "src/data/config.json → sections",
        "stats",
        "src/core/",
        "stackReveal(section)",
        "tests/stats-*.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-09T13:11:57+02:00",
      "finishedAt": "2026-11-09T13:25:30+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 120,
        "failed": 0
      },
      "commit": "0667f56"
    },
    {
      "id": "20",
      "title": "Блок 03 «Ніші»: карточки-табло",
      "requirements": [
        "H03",
        "H10",
        "R52",
        "R53"
      ],
      "blockedBy": [
        "19"
      ],
      "wave": 19,
      "zone": [
        "src/sections/niches.js",
        "calculator-model.js",
        "src/styles/sections/niches.css",
        "#niches",
        "index.html",
        "niches",
        "content.*.json",
        "src/data/config.json → sections",
        "tests/niches-*.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-09T13:25:31+02:00",
      "finishedAt": "2026-11-09T16:17:29+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 132,
        "failed": 0
      },
      "commit": "ff8d135"
    },
    {
      "id": "21",
      "title": "Блок 04 «Як виглядає реклама»: три формата и лайтбокс",
      "requirements": [
        "H03",
        "H10",
        "R54",
        "R55",
        "R56"
      ],
      "blockedBy": [
        "19"
      ],
      "wave": 19,
      "zone": [
        "src/sections/formats.js",
        "calculator-model.js",
        "src/styles/sections/formats.css",
        "#formats",
        "index.html",
        "formats",
        "content.*.json",
        "src/data/config.json → sections",
        "tests/formats-*.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-09T13:25:31+02:00",
      "finishedAt": "2026-11-09T16:17:29+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 132,
        "failed": 0
      },
      "commit": "ff8d135"
    },
    {
      "id": "22",
      "title": "Блок 05 «Калькулятор» в новом облике",
      "requirements": [
        "H03",
        "H10",
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
        "R68"
      ],
      "blockedBy": [
        "19"
      ],
      "wave": 19,
      "zone": [
        "src/sections/calculator.js",
        "calculator-model.js",
        "src/styles/sections/calculator.css",
        "#calculator",
        "index.html",
        "calculator",
        "content.*.json",
        "src/data/config.json → sections",
        "tests/calculator-*.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-09T13:25:31+02:00",
      "finishedAt": "2026-11-09T16:17:29+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 132,
        "failed": 0
      },
      "commit": "ff8d135"
    },
    {
      "id": "23",
      "title": "Узкая шапка, каждый блок в один экран, фон без швов",
      "requirements": [
        "H12",
        "H13",
        "H14",
        "H15",
        "H16",
        "H17",
        "H18",
        "H19",
        "H20",
        "H11",
        "H03"
      ],
      "blockedBy": [
        "22"
      ],
      "wave": 20,
      "zone": [
        "src/styles/sections/header.css",
        "src/sections/header.js",
        "index.html",
        "src/styles/{tokens,base,layout}.css",
        "src/styles/sections/{hero,stats,niches,formats,calculator}.css",
        "tests/"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-09T16:23:49+02:00",
      "finishedAt": "2026-11-09T17:18:57+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 141,
        "failed": 0
      },
      "commit": "7fde75f"
    },
    {
      "id": "24",
      "title": "Фигура на первом экране: оранжевая подсветка вместо синей",
      "requirements": [
        "H21",
        "H14"
      ],
      "blockedBy": [
        "22"
      ],
      "wave": 20,
      "zone": [
        "public/img/hero/volodymyr-blue-{720,1200}.{png,webp,avif}"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-09T17:07:23+02:00",
      "finishedAt": "2026-11-09T17:32:32+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 141,
        "failed": 0
      },
      "commit": "e7735e3"
    },
    {
      "id": "25",
      "title": "Блок 02: карта Украины из точек (81% горит), Worldwide — карта мира",
      "requirements": [
        "H22",
        "H23",
        "H24",
        "H25",
        "H15",
        "H11",
        "H14",
        "H18"
      ],
      "blockedBy": [
        "23"
      ],
      "wave": 21,
      "zone": [
        ".eyebrow",
        "index.html",
        "src/sections/stats.js",
        "src/styles/sections/stats.css",
        "#stats",
        "index.html",
        "stats",
        "content.*.json",
        "src/data/ua-dots.json",
        "build/",
        "scripts/",
        "src/data/geo-dots.json",
        "tests/stats-*.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-09T17:28:01+02:00",
      "finishedAt": "2026-11-09T18:21:57+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 167,
        "failed": 0
      },
      "commit": "9740b45"
    },
    {
      "id": "26",
      "title": "Блок 03 «Ніші»: мозаика плиток с иконками",
      "requirements": [
        "H26",
        "H27",
        "H28",
        "H29",
        "H30",
        "H15",
        "H14",
        "H18"
      ],
      "blockedBy": [
        "23"
      ],
      "wave": 21,
      "zone": [
        "src/sections/niches.js",
        "src/styles/sections/niches.css",
        "#niches",
        "index.html",
        "niches",
        "content.*.json",
        "tests/niches-*.test.js"
      ],
      "review": "нет",
      "model": "обычная",
      "status": "in-progress",
      "startedAt": "2026-11-09T18:14:10+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 170,
        "failed": 0
      },
      "commit": "c50dddd"
    },
    {
      "id": "27",
      "title": "Блок 04 «Як виглядає реклама»: вкладки форматов и большой телефон с Telegram",
      "requirements": [
        "H34",
        "H15",
        "H14",
        "H18",
        "H24"
      ],
      "blockedBy": [
        "23"
      ],
      "wave": 22,
      "zone": [
        "src/sections/formats.js",
        "src/styles/sections/formats.css",
        "#formats",
        "index.html",
        "formats",
        "content.*.json",
        "tests/formats-*.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-09T23:08:18+02:00",
      "finishedAt": "2026-11-09T23:56:14+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 176,
        "failed": 0
      },
      "commit": "9f6bfaf"
    },
    {
      "id": "28",
      "title": "Блок 05 «Калькулятор»: прогноз сообщением от бота (вариант G)",
      "requirements": [
        "H38",
        "H15",
        "H14",
        "H18",
        "R58",
        "R68"
      ],
      "blockedBy": [
        "23"
      ],
      "wave": 23,
      "zone": [
        "src/sections/calculator.js",
        "calculator-model.js",
        "src/styles/sections/calculator.css",
        "#calculator",
        "index.html",
        "calculator",
        "content.*.json",
        "tests/calculator-*.test.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "startedAt": "2026-11-10T00:12:37+02:00",
      "finishedAt": "2026-11-10T00:30:45+02:00",
      "retries": 0,
      "repairs": 0,
      "tests": {
        "passed": 177,
        "failed": 0
      },
      "commit": "6791775"
    },
    {
      "id": "29",
      "title": "Блоки 06 «Кейси», 07 «Процес», 08 «GEO»",
      "requirements": [
        "H41",
        "H15",
        "H14",
        "H18",
        "H24",
        "R69",
        "R81"
      ],
      "blockedBy": [
        "28"
      ],
      "wave": 24,
      "zone": [
        "src/sections/cases.js",
        "src/styles/sections/cases.css",
        "src/sections/process.js",
        "src/styles/sections/process.css",
        "src/sections/geo.js",
        "src/styles/sections/geo.css",
        "index.html",
        "content.*.json",
        "cases.json",
        "faq.json",
        "src/data/config.json → sections.enabled",
        "tests/"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "in-progress",
      "retries": 0,
      "repairs": 0,
      "startedAt": "2026-11-10T01:01:55+02:00"
    },
    {
      "id": "30",
      "title": "Блоки 09 «Таргетинг», 10 «Відгуки + засновник», 11 «Екосистема»",
      "requirements": [
        "H41",
        "H07",
        "H15",
        "H14",
        "H18",
        "H24",
        "R82",
        "R90"
      ],
      "blockedBy": [
        "28"
      ],
      "wave": 24,
      "zone": [
        "src/sections/targeting.js",
        "src/styles/sections/targeting.css",
        "src/sections/reviews.js",
        "src/styles/sections/reviews.css",
        "src/sections/ecosystem.js",
        "src/styles/sections/ecosystem.css",
        "index.html",
        "content.*.json",
        "cases.json",
        "faq.json",
        "src/data/config.json → sections.enabled",
        "tests/"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "in-progress",
      "retries": 0,
      "repairs": 0,
      "startedAt": "2026-11-10T01:01:56+02:00"
    },
    {
      "id": "31",
      "title": "Блоки 12 «Матеріали», 13 «FAQ», 14 «Фінальний CTA», подвал",
      "requirements": [
        "H41",
        "H07",
        "H15",
        "H14",
        "H18",
        "H24",
        "R91",
        "R99"
      ],
      "blockedBy": [
        "28"
      ],
      "wave": 24,
      "zone": [
        "src/sections/materials.js",
        "src/styles/sections/materials.css",
        "src/sections/faq.js",
        "src/styles/sections/faq.css",
        "src/sections/cta.js",
        "src/styles/sections/cta.css",
        "src/sections/footer.js",
        "src/styles/sections/footer.css",
        "index.html",
        "content.*.json",
        "cases.json",
        "faq.json",
        "src/data/config.json → sections.enabled",
        "tests/"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "in-progress",
      "retries": 0,
      "repairs": 0,
      "startedAt": "2026-11-10T01:01:57+02:00"
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
    "passed": 177,
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
    "Тап по GEO-карте на тач-устройстве вживую не проверялся, только Chrome",
    "index.html <head> — инлайн-скрипт снимает js-preload в 4 с только если сцена не стартовала, последний фолбэк 8,8 с",
    "src/sections/preloader.js — грузит gsap своим import(), при медленной загрузке срабатывает CSS-фолбэк без набора текста",
    "Lighthouse после 5-секундной заставки не перемерен",
    "src/styles/sections/header.css:265-298 — на 900–1099px UA/EN в шапке скрыт, бургера нет — язык меняется только в подвале",
    "src/styles/tokens.css:103,131 — --ribbon-2 даёт ~2:1 на нижней ленте, нужно ≥3:1",
    "src/styles/base.css:55-63 — зерно body::after на z-index 200 выше шапки и прелоадера, слой не задокументирован",
    "src/styles/tokens.css:10/95 — --line объявлен дважды (палитра и семантика)",
    "index.html:8 — theme-color #070C18 не меняется под тему aether",
    "src/sections/ribbons.js:21 — после смены языка обратная лента может оставлять пустоту слева, проверить на EN",
    "src/styles/sections/stats.css — на 360px EN горизонтальный скролл 2px от .stats__value",
    "tests/overtake-sections.test.js — тест стопки кейсов удалён исполнителем T12 (противоречит галерее)",
    "Под CPU×4 первый экран всё ещё даёт длинные кадры: пересчёт стилей каждый кадр, тикер gsap+Lenis+marquee, полноэкранное зерно body::after с анимацией — следующий шаг: выключить зерно и Lenis на странице из одного экрана",
    "Вариант 2: в EN подписи на карточках остаются украинскими (PNG пользователя); кольцо и планета оранжевые и в теме aether"
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
    "2026-11-06T18:36:21+02:00",
    "2026-11-06T18:36:32+02:00",
    "2026-11-06T18:36:34+02:00",
    "2026-11-06T18:36:36+02:00",
    "2026-11-06T18:39:25+02:00",
    "2026-11-06T18:51:04+02:00",
    "2026-11-06T18:51:05+02:00",
    "2026-11-06T18:54:12+02:00",
    "2026-11-06T18:54:13+02:00",
    "2026-11-06T18:54:14+02:00",
    "2026-11-06T18:56:36+02:00",
    "2026-11-06T18:56:46+02:00",
    "2026-11-06T18:56:47+02:00",
    "2026-11-06T18:57:54+02:00",
    "2026-11-06T18:57:56+02:00",
    "2026-11-06T18:57:57+02:00",
    "2026-11-07T23:18:15+02:00",
    "2026-11-07T23:22:59+02:00",
    "2026-11-07T23:23:55+02:00",
    "2026-11-07T23:23:56+02:00",
    "2026-11-07T23:39:31+02:00",
    "2026-11-07T23:39:32+02:00",
    "2026-11-07T23:39:33+02:00",
    "2026-11-07T23:42:15+02:00",
    "2026-11-07T23:42:17+02:00",
    "2026-11-07T23:54:01+02:00",
    "2026-11-07T23:54:59+02:00",
    "2026-11-07T23:55:00+02:00",
    "2026-11-08T00:06:04+02:00",
    "2026-11-08T00:06:05+02:00",
    "2026-11-08T00:06:06+02:00",
    "2026-11-08T00:06:08+02:00",
    "2026-11-08T00:06:26+02:00",
    "2026-11-08T00:06:29+02:00",
    "2026-11-08T00:51:02+02:00",
    "2026-11-08T01:06:44+02:00",
    "2026-11-08T01:06:45+02:00",
    "2026-11-08T01:10:30+02:00",
    "2026-11-08T01:10:31+02:00",
    "2026-11-08T01:10:36+02:00",
    "2026-11-08T01:34:54+02:00",
    "2026-11-08T01:40:53+02:00",
    "2026-11-08T01:40:55+02:00",
    "2026-11-08T01:47:51+02:00",
    "2026-11-08T18:59:02+02:00",
    "2026-11-08T18:59:06+02:00",
    "2026-11-08T18:59:38+02:00",
    "2026-11-08T19:18:24+02:00",
    "2026-11-08T19:19:06+02:00",
    "2026-11-08T19:26:03+02:00",
    "2026-11-08T19:42:17+02:00",
    "2026-11-08T19:42:20+02:00",
    "2026-11-08T19:43:38+02:00",
    "2026-11-08T19:50:08+02:00",
    "2026-11-09T12:43:19+02:00",
    "2026-11-09T12:54:11+02:00",
    "2026-11-09T12:54:15+02:00",
    "2026-11-09T13:08:23+02:00",
    "2026-11-09T13:11:26+02:00",
    "2026-11-09T13:11:56+02:00",
    "2026-11-09T13:11:57+02:00",
    "2026-11-09T13:22:37+02:00",
    "2026-11-09T13:25:30+02:00",
    "2026-11-09T13:25:31+02:00",
    "2026-11-09T16:17:29+02:00",
    "2026-11-09T16:23:48+02:00",
    "2026-11-09T16:23:49+02:00",
    "2026-11-09T16:32:17+02:00",
    "2026-11-09T16:53:36+02:00",
    "2026-11-09T16:55:50+02:00",
    "2026-11-09T17:00:45+02:00",
    "2026-11-09T17:07:22+02:00",
    "2026-11-09T17:07:23+02:00",
    "2026-11-09T17:18:57+02:00",
    "2026-11-09T17:28:00+02:00",
    "2026-11-09T17:28:01+02:00",
    "2026-11-09T17:32:32+02:00",
    "2026-11-09T17:40:30+02:00",
    "2026-11-09T17:49:38+02:00",
    "2026-11-09T17:50:40+02:00",
    "2026-11-09T18:14:09+02:00",
    "2026-11-09T18:14:10+02:00",
    "2026-11-09T18:16:12+02:00",
    "2026-11-09T18:18:39+02:00",
    "2026-11-09T18:21:57+02:00",
    "2026-11-09T18:21:58+02:00",
    "2026-11-09T18:24:21+02:00",
    "2026-11-09T18:25:22+02:00",
    "2026-11-09T18:28:41+02:00",
    "2026-11-09T18:30:45+02:00",
    "2026-11-09T18:46:32+02:00",
    "2026-11-09T23:08:16+02:00",
    "2026-11-09T23:08:18+02:00",
    "2026-11-09T23:33:16+02:00",
    "2026-11-09T23:42:05+02:00",
    "2026-11-09T23:56:14+02:00",
    "2026-11-10T00:12:35+02:00",
    "2026-11-10T00:12:37+02:00",
    "2026-11-10T00:19:29+02:00",
    "2026-11-10T00:30:45+02:00",
    "2026-11-10T01:01:53+02:00",
    "2026-11-10T01:01:55+02:00",
    "2026-11-10T01:01:56+02:00",
    "2026-11-10T01:01:57+02:00"
  ],
  "rev": 166,
  "waiting": null,
  "waits": [
    {
      "kind": "briefing",
      "from": "2026-11-06T11:56:30+02:00",
      "to": "2026-11-06T13:31:12+02:00"
    },
    {
      "kind": "briefing",
      "from": "2026-11-06T18:39:25+02:00",
      "to": "2026-11-06T18:51:04+02:00"
    },
    {
      "kind": "briefing",
      "from": "2026-11-07T23:54:01+02:00",
      "to": "2026-11-07T23:54:59+02:00"
    },
    {
      "kind": "briefing",
      "from": "2026-11-08T00:51:02+02:00",
      "to": "2026-11-08T01:06:44+02:00"
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
    },
    {
      "t": "2026-11-06T18:36:34+02:00",
      "k": "stage",
      "id": "build",
      "act": "start"
    },
    {
      "t": "2026-11-06T18:36:36+02:00",
      "k": "ticket",
      "ids": [
        "05"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-06T18:39:25+02:00",
      "k": "ask",
      "kind": "briefing",
      "note": "новое направление оформления — какое, на что опираться"
    },
    {
      "t": "2026-11-06T18:51:04+02:00",
      "k": "answered",
      "kind": "briefing"
    },
    {
      "t": "2026-11-06T18:51:04+02:00",
      "k": "ticket",
      "ids": [
        "05"
      ],
      "act": "done",
      "tests": {
        "passed": 63,
        "failed": 0
      }
    },
    {
      "t": "2026-11-06T18:51:05+02:00",
      "k": "add",
      "key": "concerns",
      "n": 3
    },
    {
      "t": "2026-11-06T18:54:12+02:00",
      "k": "tickets",
      "n": 10
    },
    {
      "t": "2026-11-06T18:54:13+02:00",
      "k": "gate",
      "g": "G3",
      "ok": true,
      "problems": 0
    },
    {
      "t": "2026-11-06T18:54:14+02:00",
      "k": "ticket",
      "ids": [
        "06"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-06T18:56:36+02:00",
      "k": "tickets",
      "n": 10
    },
    {
      "t": "2026-11-06T18:56:46+02:00",
      "k": "tickets",
      "n": 10
    },
    {
      "t": "2026-11-06T18:56:47+02:00",
      "k": "gate",
      "g": "G3",
      "ok": true,
      "problems": 0
    },
    {
      "t": "2026-11-06T18:57:54+02:00",
      "k": "tickets",
      "n": 10
    },
    {
      "t": "2026-11-06T18:57:56+02:00",
      "k": "gate",
      "g": "G3",
      "ok": false,
      "problems": 2
    },
    {
      "t": "2026-11-06T18:57:57+02:00",
      "k": "ticket",
      "ids": [
        "07"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-07T23:18:15+02:00",
      "k": "ticket",
      "ids": [
        "06"
      ],
      "act": "done",
      "tests": {
        "passed": 89,
        "failed": 0
      }
    },
    {
      "t": "2026-11-07T23:22:59+02:00",
      "k": "ticket",
      "ids": [
        "07"
      ],
      "act": "fail",
      "note": "заменён: пользователь «Делаем с 0» — оформление Aether вместо overtake; шаг 1 вошёл в коммит 5b9d887"
    },
    {
      "t": "2026-11-07T23:23:55+02:00",
      "k": "tickets",
      "n": 14
    },
    {
      "t": "2026-11-07T23:23:56+02:00",
      "k": "gate",
      "g": "G3",
      "ok": false,
      "problems": 5
    },
    {
      "t": "2026-11-07T23:23:56+02:00",
      "k": "ticket",
      "ids": [
        "10"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-07T23:39:31+02:00",
      "k": "ticket",
      "ids": [
        "10"
      ],
      "act": "done",
      "tests": {
        "passed": 97,
        "failed": 0
      }
    },
    {
      "t": "2026-11-07T23:39:32+02:00",
      "k": "ticket",
      "ids": [
        "10"
      ],
      "act": "review"
    },
    {
      "t": "2026-11-07T23:39:33+02:00",
      "k": "ticket",
      "ids": [
        "11",
        "12"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-07T23:42:15+02:00",
      "k": "ticket",
      "ids": [
        "10"
      ],
      "act": "done",
      "tests": {
        "passed": 97,
        "failed": 0
      }
    },
    {
      "t": "2026-11-07T23:42:17+02:00",
      "k": "add",
      "key": "concerns",
      "n": 6
    },
    {
      "t": "2026-11-07T23:54:01+02:00",
      "k": "ask",
      "kind": "briefing",
      "note": "ждём картинки для первого экрана; цифры в карточках макета и подзаголовок — реальные или из брифа"
    },
    {
      "t": "2026-11-07T23:54:59+02:00",
      "k": "answered",
      "kind": "briefing"
    },
    {
      "t": "2026-11-07T23:54:59+02:00",
      "k": "ticket",
      "ids": [
        "12"
      ],
      "act": "done",
      "tests": {
        "passed": 109,
        "failed": 0
      }
    },
    {
      "t": "2026-11-07T23:55:00+02:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-08T00:06:05+02:00",
      "k": "tickets",
      "n": 14
    },
    {
      "t": "2026-11-08T00:06:06+02:00",
      "k": "tickets",
      "n": 14
    },
    {
      "t": "2026-11-08T00:06:08+02:00",
      "k": "ticket",
      "ids": [
        "11",
        "13"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-08T00:06:26+02:00",
      "k": "tickets",
      "n": 14
    },
    {
      "t": "2026-11-08T00:06:29+02:00",
      "k": "gate",
      "g": "G3",
      "ok": false,
      "problems": 5
    },
    {
      "t": "2026-11-08T00:51:02+02:00",
      "k": "ask",
      "kind": "briefing",
      "note": "вариант 3: видео для кадров 1–4, картинки для 5–9, заменяет ли интро заставку-поиск"
    },
    {
      "t": "2026-11-08T01:06:44+02:00",
      "k": "answered",
      "kind": "briefing"
    },
    {
      "t": "2026-11-08T01:06:44+02:00",
      "k": "ticket",
      "ids": [
        "11"
      ],
      "act": "done",
      "tests": {
        "passed": 127,
        "failed": 0
      }
    },
    {
      "t": "2026-11-08T01:06:45+02:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-08T01:10:31+02:00",
      "k": "tickets",
      "n": 15
    },
    {
      "t": "2026-11-08T01:10:36+02:00",
      "k": "ticket",
      "ids": [
        "14"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-08T01:34:54+02:00",
      "k": "ticket",
      "ids": [
        "14"
      ],
      "act": "done",
      "tests": {
        "passed": 136,
        "failed": 0
      }
    },
    {
      "t": "2026-11-08T01:40:53+02:00",
      "k": "tickets",
      "n": 16
    },
    {
      "t": "2026-11-08T01:40:55+02:00",
      "k": "ticket",
      "ids": [
        "15"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-08T01:47:51+02:00",
      "k": "ticket",
      "ids": [
        "15"
      ],
      "act": "done",
      "tests": {
        "passed": 137,
        "failed": 0
      }
    },
    {
      "t": "2026-11-08T18:59:02+02:00",
      "k": "tickets",
      "n": 17
    },
    {
      "t": "2026-11-08T18:59:06+02:00",
      "k": "ticket",
      "ids": [
        "16"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-08T18:59:38+02:00",
      "k": "tickets",
      "n": 17
    },
    {
      "t": "2026-11-08T19:18:24+02:00",
      "k": "ticket",
      "ids": [
        "16"
      ],
      "act": "done",
      "tests": {
        "passed": 140,
        "failed": 0
      }
    },
    {
      "t": "2026-11-08T19:19:06+02:00",
      "k": "ticket",
      "ids": [
        "16"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-08T19:26:03+02:00",
      "k": "ticket",
      "ids": [
        "16"
      ],
      "act": "done",
      "tests": {
        "passed": 140,
        "failed": 0
      }
    },
    {
      "t": "2026-11-08T19:42:17+02:00",
      "k": "tickets",
      "n": 18
    },
    {
      "t": "2026-11-08T19:42:20+02:00",
      "k": "ticket",
      "ids": [
        "17"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-08T19:43:38+02:00",
      "k": "ticket",
      "ids": [
        "16"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-08T19:50:08+02:00",
      "k": "ticket",
      "ids": [
        "16"
      ],
      "act": "done",
      "tests": {
        "passed": 142,
        "failed": 0
      }
    },
    {
      "t": "2026-11-09T12:43:19+02:00",
      "k": "ticket",
      "ids": [
        "17"
      ],
      "act": "fail",
      "note": "прервано сбоем API: продолжение страницы сделано, переход с разлётом букв начат и не доделан"
    },
    {
      "t": "2026-11-09T12:54:11+02:00",
      "k": "tickets",
      "n": 19
    },
    {
      "t": "2026-11-09T12:54:15+02:00",
      "k": "ticket",
      "ids": [
        "18"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T13:08:23+02:00",
      "k": "tickets",
      "n": 20
    },
    {
      "t": "2026-11-09T13:11:26+02:00",
      "k": "ticket",
      "ids": [
        "18"
      ],
      "act": "done",
      "tests": {
        "passed": 113,
        "failed": 0
      }
    },
    {
      "t": "2026-11-09T13:11:56+02:00",
      "k": "tickets",
      "n": 20
    },
    {
      "t": "2026-11-09T13:11:57+02:00",
      "k": "ticket",
      "ids": [
        "19"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T13:22:37+02:00",
      "k": "tickets",
      "n": 23
    },
    {
      "t": "2026-11-09T13:25:30+02:00",
      "k": "ticket",
      "ids": [
        "19"
      ],
      "act": "done",
      "tests": {
        "passed": 120,
        "failed": 0
      }
    },
    {
      "t": "2026-11-09T13:25:31+02:00",
      "k": "ticket",
      "ids": [
        "20",
        "21",
        "22"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T16:17:29+02:00",
      "k": "ticket",
      "ids": [
        "20",
        "21",
        "22"
      ],
      "act": "done",
      "tests": {
        "passed": 132,
        "failed": 0
      }
    },
    {
      "t": "2026-11-09T16:23:48+02:00",
      "k": "tickets",
      "n": 24
    },
    {
      "t": "2026-11-09T16:23:49+02:00",
      "k": "ticket",
      "ids": [
        "23"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T16:32:17+02:00",
      "k": "tickets",
      "n": 24
    },
    {
      "t": "2026-11-09T16:53:36+02:00",
      "k": "tickets",
      "n": 24
    },
    {
      "t": "2026-11-09T16:55:50+02:00",
      "k": "tickets",
      "n": 24
    },
    {
      "t": "2026-11-09T17:00:45+02:00",
      "k": "tickets",
      "n": 24
    },
    {
      "t": "2026-11-09T17:07:22+02:00",
      "k": "tickets",
      "n": 25
    },
    {
      "t": "2026-11-09T17:07:23+02:00",
      "k": "ticket",
      "ids": [
        "24"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T17:18:57+02:00",
      "k": "ticket",
      "ids": [
        "23"
      ],
      "act": "done",
      "tests": {
        "passed": 141,
        "failed": 0
      }
    },
    {
      "t": "2026-11-09T17:28:00+02:00",
      "k": "tickets",
      "n": 26
    },
    {
      "t": "2026-11-09T17:28:01+02:00",
      "k": "ticket",
      "ids": [
        "25"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T17:32:32+02:00",
      "k": "ticket",
      "ids": [
        "24"
      ],
      "act": "done",
      "tests": {
        "passed": 141,
        "failed": 0
      }
    },
    {
      "t": "2026-11-09T17:40:30+02:00",
      "k": "tickets",
      "n": 26
    },
    {
      "t": "2026-11-09T17:49:38+02:00",
      "k": "tickets",
      "n": 26
    },
    {
      "t": "2026-11-09T17:50:40+02:00",
      "k": "tickets",
      "n": 26
    },
    {
      "t": "2026-11-09T18:14:09+02:00",
      "k": "tickets",
      "n": 27
    },
    {
      "t": "2026-11-09T18:14:10+02:00",
      "k": "ticket",
      "ids": [
        "26"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T18:16:12+02:00",
      "k": "tickets",
      "n": 27
    },
    {
      "t": "2026-11-09T18:18:39+02:00",
      "k": "tickets",
      "n": 27
    },
    {
      "t": "2026-11-09T18:21:57+02:00",
      "k": "ticket",
      "ids": [
        "25"
      ],
      "act": "done",
      "tests": {
        "passed": 167,
        "failed": 0
      }
    },
    {
      "t": "2026-11-09T18:21:58+02:00",
      "k": "ticket",
      "ids": [
        "26"
      ],
      "act": "done",
      "tests": {
        "passed": 167,
        "failed": 0
      }
    },
    {
      "t": "2026-11-09T18:24:21+02:00",
      "k": "ticket",
      "ids": [
        "26"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T18:25:22+02:00",
      "k": "tickets",
      "n": 27
    },
    {
      "t": "2026-11-09T18:28:41+02:00",
      "k": "ticket",
      "ids": [
        "26"
      ],
      "act": "done",
      "tests": {
        "passed": 170,
        "failed": 0
      }
    },
    {
      "t": "2026-11-09T18:30:45+02:00",
      "k": "ticket",
      "ids": [
        "26"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T18:46:32+02:00",
      "k": "ticket",
      "ids": [
        "26"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T23:08:16+02:00",
      "k": "tickets",
      "n": 28
    },
    {
      "t": "2026-11-09T23:08:18+02:00",
      "k": "ticket",
      "ids": [
        "27"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T23:33:16+02:00",
      "k": "ticket",
      "ids": [
        "27"
      ],
      "act": "done",
      "tests": {
        "passed": 177,
        "failed": 0
      }
    },
    {
      "t": "2026-11-09T23:42:05+02:00",
      "k": "ticket",
      "ids": [
        "27"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-09T23:56:14+02:00",
      "k": "ticket",
      "ids": [
        "27"
      ],
      "act": "done",
      "tests": {
        "passed": 176,
        "failed": 0
      }
    },
    {
      "t": "2026-11-10T00:12:35+02:00",
      "k": "tickets",
      "n": 29
    },
    {
      "t": "2026-11-10T00:12:37+02:00",
      "k": "ticket",
      "ids": [
        "28"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-10T00:19:29+02:00",
      "k": "tickets",
      "n": 29
    },
    {
      "t": "2026-11-10T00:30:45+02:00",
      "k": "ticket",
      "ids": [
        "28"
      ],
      "act": "done",
      "tests": {
        "passed": 177,
        "failed": 0
      }
    },
    {
      "t": "2026-11-10T01:01:53+02:00",
      "k": "tickets",
      "n": 32
    },
    {
      "t": "2026-11-10T01:01:55+02:00",
      "k": "ticket",
      "ids": [
        "29"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-10T01:01:56+02:00",
      "k": "ticket",
      "ids": [
        "30"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-10T01:01:57+02:00",
      "k": "ticket",
      "ids": [
        "31"
      ],
      "act": "start"
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
      "status": "done"
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
      "status": "done"
    },
    {
      "id": "G08",
      "text": "«давай твой вариант» — в поиске набирается «просування telegram ads» / EN «telegram ads promotion», результат «eLeads — Telegram Ads · Володимир Кучер»",
      "status": "done"
    },
    {
      "id": "G09",
      "text": "«оформление надо вообще другое» + «https://overtake-wbs.framer.website/ берем оформление этого сайта»",
      "status": "dropped",
      "why": "пользователь: «Делаем с 0» + новый образец Aether (2026-11-07); вариант overtake сохранён меткой git design/overtake"
    },
    {
      "id": "G10",
      "text": "«берем палитру которая была» — по умолчанию цвета канала (R15)",
      "status": "in-ticket"
    },
    {
      "id": "G11",
      "text": "«дай переключатель и сделай несколько версий, переключатель для меня, не встроенный в сайт»",
      "status": "dropped",
      "why": "пользователь 2026-11-09: «тему смены цвета убираем тоже, остается только эта»"
    },
    {
      "id": "G12",
      "text": "«загрузка появляется каждый раз даже после перезагрузки сайта»",
      "status": "done"
    },
    {
      "id": "G13",
      "text": "«Делаем с 0» + «https://fair-presentations-365847.framer.app/» — оформление по Aether",
      "status": "dropped",
      "why": "пользователь 2026-11-09: «остальные удаляем … остается только эта» — облик Aether снят, основа — синий вариант в палитре канала"
    },
    {
      "id": "G14",
      "text": "«06 / SOCIAL PROOF шестой экран можно сделать также что-бы перекручивалось как на сайте»",
      "status": "done"
    },
    {
      "id": "G15",
      "text": "«Появление подвала сделай такое же как на этом сайте»",
      "status": "done"
    },
    {
      "id": "G16",
      "text": "«Такое перелистывание добавить можно» — две наклонённые бегущие ленты крест-накрест",
      "status": "done"
    },
    {
      "id": "G17",
      "text": "«Хиро тоже такое можно сделать» — огромное слово поверх планеты с кольцом, «scroll to enter orbit»",
      "status": "dropped",
      "why": "пользователь 2026-11-09: «Этот вариант оставляем, остальные удаляем» — «Кольцо» удалён"
    },
    {
      "id": "G18",
      "text": "«там фото есть, делаем как тут, надо сделать чтобы кольцо» + «закинул файлы» — первый экран по макету пользователя",
      "status": "dropped",
      "why": "пользователь 2026-11-09: «Этот вариант оставляем, остальные удаляем» — макет «Кольцо» удалён"
    },
    {
      "id": "G19",
      "text": "«будет 2 варианта, тот который я сейчас предложил и старый» + переключатель",
      "status": "dropped",
      "why": "пользователь 2026-11-09: «остальные удаляем» — переключатель вариантов не нужен"
    },
    {
      "id": "G20",
      "text": "«вместо значка планеты огромный значок телеграмма и вокруг окошки с телеграмм адс»",
      "status": "dropped",
      "why": "пользователь про вариант 1 (значок Telegram и окна Telegram Ads): «Этот хиро удали»"
    },
    {
      "id": "G21",
      "text": "«И сделай чтобы эти картинки плавали верх вниз»",
      "status": "in-spec"
    },
    {
      "id": "G22",
      "text": "«Сделай 3 штуки которые бегут по кругу планеты»",
      "status": "in-spec"
    },
    {
      "id": "G23",
      "text": "«Остальное все на странице убери, надо сделать так чтобы не лагало»",
      "status": "in-ticket"
    },
    {
      "id": "G24",
      "text": "«Это вариант 3. Наш герой Владимир сидит в офисе, берет в руки самолетик, запускает его, тот летит в космос делает круг вокруг надписи елидс и залетает на место планеты в круг»",
      "status": "dropped",
      "why": "пользователь 2026-11-09: «остальные удаляем» — «Самолётик» удалён"
    },
    {
      "id": "G25",
      "text": "«Сделай хиро 2 в 1920 на 1080. расстяни его как-то»",
      "status": "dropped",
      "why": "пользователь 2026-11-09: «остальные удаляем» — относился к «Кольцу»"
    },
    {
      "id": "G26",
      "text": "«Давай еще один хиро» — вариант 4 по макету reference/hero-v4/mockup.png",
      "status": "done"
    },
    {
      "id": "G27",
      "text": "«Этот хиро удали» — вариант 1 (орбита со значком Telegram)",
      "status": "done"
    },
    {
      "id": "G28",
      "text": "«Добавь в хиро самолетик продолжение страницы чтобы показать анимацию»",
      "status": "dropped",
      "why": "пользователь 2026-11-09: «остальные удаляем» — относился к «Самолётику»"
    },
    {
      "id": "G29",
      "text": "«eLeads текст больше за спиной и его не должно ничего закрывать … остальное … просто текстом снизу, а не окошками» (вариант «Синий»)",
      "status": "in-spec"
    },
    {
      "id": "G30",
      "text": "«чтобы человек увидел как разлетаются буквы и тд» (вариант «Самолётик»)",
      "status": "dropped",
      "why": "пользователь 2026-11-09: «остальные удаляем» — относился к «Самолётику»"
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
      "ok": false,
      "at": "2026-11-08T00:06:29+02:00",
      "problems": 5
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
