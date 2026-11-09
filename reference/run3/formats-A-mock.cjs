// Варианты оформления блока 04 «Як виглядає реклама» — только картинки для выбора; проект не трогает.
// Макеты рекламы (.tg-ad) берутся с живой страницы как есть и переставляются в новые раскладки.
const p = require('puppeteer-core');
const path = require('path');
const OUT = path.resolve(__dirname, '..', 'formats-options');
require('fs').mkdirSync(OUT, { recursive: true });

const GRAD = 'linear-gradient(100deg,#FFD23F 0%,#FF8A1F 100%)';
const F = [
  { n: 'У Telegram-каналах', t: 'Рекламне повідомлення показується аудиторії безпосередньо під час перегляду Telegram-каналів.' },
  { n: 'У відео / медіаконтенті', t: 'Візуальний формат із креативом, заголовком, текстом та CTA всередині медіаконтенту.' },
  { n: 'У ботах', t: 'Реклама може показуватися користувачам під час взаємодії з Telegram-ботами.' },
];
const base = `
.mk{height:500px;color:#F4F2EC;font-family:'Onest',sans-serif}
.mk .h{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;text-transform:uppercase;line-height:.92}
.mk .mono{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,242,236,.5)}
.mk .card{border-radius:28px;background:rgba(244,242,236,.055);border:1px solid rgba(244,242,236,.1)}
.mk .phone{position:relative;width:250px;height:470px;border-radius:38px;background:#0B1220;border:6px solid #1E293B;box-shadow:0 40px 80px -40px rgba(0,0,0,.9);overflow:hidden;flex:none}
.mk .phone::before{content:"";position:absolute;left:50%;top:10px;width:84px;height:22px;margin-left:-42px;border-radius:12px;background:#1E293B;z-index:2}
.mk .phone .bar{position:absolute;left:0;right:0;top:0;height:52px;background:#111A2C;border-bottom:1px solid rgba(244,242,236,.08)}
.mk .phone .bar b{position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:13px;color:#F4F2EC}
.mk .phone .scr{position:absolute;left:12px;right:12px;top:64px;bottom:0}
.mk .phone .msg{margin:0 0 8px;padding:9px 12px;border-radius:14px 14px 14px 4px;background:#16213A;font-size:11px;line-height:1.35;color:rgba(244,242,236,.8);max-width:86%}
.mk .phone .tg-ad{transform:scale(.56);transform-origin:top left;width:380px;position:absolute;left:0;top:0}
.mk .phone .adbox{position:relative;height:300px;overflow:hidden}
.mk .fmt .h{font-size:44px}
.mk .fmt p{margin:6px 0 0;color:rgba(244,242,236,.7);font-size:16px;line-height:1.45}
.mk .num{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;font-size:28px;background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent}
`;

const variants = {
  // A — «Телефон»: один большой телефон с Telegram, слева список форматов-вкладок; активный формат показан на экране
  A: {
    name: 'Телефон і вкладки',
    css: `
.mkA{display:grid;grid-template-columns:1fr 420px 1fr;align-items:center;gap:40px}
.mkA .tabs{display:flex;flex-direction:column;gap:12px}
.mkA .tab{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:start;padding:20px 24px;border-radius:20px;border:1px solid rgba(244,242,236,.1)}
.mkA .tab.on{background:${GRAD};color:#070C18}
.mkA .tab.on .h,.mkA .tab.on p{color:#070C18}.mkA .tab.on .num{background:none;-webkit-background-clip:border-box;background-clip:border-box;color:#070C18}
.mkA .tab .h{font-size:34px}.mkA .tab p{font-size:15px}
.mkA .ph{display:flex;justify-content:center}
.mkA .side{display:flex;flex-direction:column;gap:14px;align-items:flex-start}
.mkA .side .h{font-size:40px}
.mkA .side .pill{padding:8px 14px;border-radius:999px;border:1px solid rgba(244,242,236,.14);font-size:14px}
`,
    html: (ads) => `<div class="mk mkA">
  <div class="tabs">${F.map((f, i) => `<div class="tab fmt ${i === 0 ? 'on' : ''}"><span class="num">0${i + 1}</span><div><div class="h">${f.n}</div><p>${f.t}</p></div></div>`).join('')}</div>
  <div class="ph"><div class="phone"><div class="bar"><b>MONOLIT · канал</b></div><div class="scr"><p class="msg">Курс на сьогодні 👇</p><p class="msg">USD 41,20 / 41,45 · EUR 44,90 / 45,30</p><div class="adbox">${ads[0]}</div></div></div></div>
  <div class="side"><span class="mono">Приклад розміщення</span><div class="h">Так бачить рекламу ваш клієнт</div><span class="pill">Реальні приклади клієнта MONOLIT</span><span class="pill">Натисніть, щоб збільшити</span></div>
</div>`,
  },
  // B — «Три телефони»: три экрана веером, под каждым формат
  B: {
    name: 'Три телефони',
    css: `
.mkB{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;align-items:start}
.mkB .col{display:flex;flex-direction:column;align-items:center;gap:18px}
.mkB .phone{width:230px;height:330px;border-radius:32px}
.mkB .phone .scr{top:58px}
.mkB .phone .tg-ad{transform:scale(.52)}
.mkB .col:nth-child(1) .phone{transform:rotate(-5deg) translateY(6px)}
.mkB .col:nth-child(3) .phone{transform:rotate(5deg) translateY(6px)}
.mkB .fmt{text-align:center;max-width:420px}
.mkB .fmt .h{font-size:40px}
`,
    html: (ads) => `<div class="mk mkB">${F.map((f, i) => `<div class="col"><div class="phone"><div class="bar"><b>${['MONOLIT · канал', 'Відео', 'MONOLIT · бот'][i]}</b></div><div class="scr"><div class="adbox">${ads[i]}</div></div></div><div class="fmt"><span class="num">0${i + 1}</span><div class="h">${f.n}</div><p>${f.t}</p></div></div>`).join('')}</div>`,
  },
  // C — «Стрічка Telegram»: одна широкая сцена чата, три рекламы на своих местах с выносками-номерами
  C: {
    name: 'Стрічка з виносками',
    css: `
.mkC{display:grid;grid-template-columns:1.35fr 1fr;gap:28px}
.mkC .feed{position:relative;padding:26px 30px;overflow:hidden;background:#0B1220}
.mkC .feed .msg{margin:0 0 10px;padding:10px 14px;border-radius:16px 16px 16px 4px;background:#16213A;font-size:13px;line-height:1.4;color:rgba(244,242,236,.8);max-width:60%}
.mkC .feed .slot{position:relative;margin:12px 0 18px}
.mkC .feed .slot .tg-ad{transform:scale(.62);transform-origin:top left;width:420px;display:block}
.mkC .feed .slot.s0{height:170px}.mkC .feed .slot.s2{height:120px}
.mkC .feed .slot.s1{position:absolute;right:30px;top:40px;height:280px;width:260px}
.mkC .feed .slot.s1 .tg-ad{transform:scale(.6)}
.mkC .tag{position:absolute;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:${GRAD};color:#070C18;font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;font-size:20px;box-shadow:0 0 0 6px rgba(255,210,63,.18)}
.mkC .list{display:flex;flex-direction:column;justify-content:center;gap:0}
.mkC .row{display:grid;grid-template-columns:48px 1fr;gap:18px;padding:22px 0;border-top:1px solid rgba(244,242,236,.14)}
.mkC .row .h{font-size:40px}
.mkC .row p{margin:6px 0 0;color:rgba(244,242,236,.7);font-size:16px;line-height:1.45}
.mkC .row .tag{position:static;box-shadow:none}
`,
    html: (ads) => `<div class="mk mkC">
  <div class="card feed">
    <p class="msg">Курс на сьогодні 👇</p>
    <div class="slot s0">${ads[0]}<span class="tag" style="left:-12px;top:-10px">1</span></div>
    <div class="slot s1">${ads[1]}<span class="tag" style="left:-14px;top:-12px">2</span></div>
    <p class="msg">/start — обрати відділення</p>
    <div class="slot s2">${ads[2]}<span class="tag" style="left:-12px;top:-10px">3</span></div>
  </div>
  <div class="list">${F.map((f, i) => `<div class="row"><span class="tag">${i + 1}</span><div><div class="h">${f.n}</div><p>${f.t}</p></div></div>`).join('')}</div>
</div>`,
  },
  // D — «Великі цифри»: три карточки в палитре (тёмная / жёлтая / светлая), огромные 01 02 03, макет внутри
  D: {
    name: 'Великі цифри',
    css: `
.mkD{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.mkD .c{position:relative;border-radius:28px;padding:26px 28px;overflow:hidden;display:flex;flex-direction:column}
.mkD .c1{background:#1A2132;border:1px solid rgba(244,242,236,.1)}
.mkD .c2{background:${GRAD};color:#070C18}
.mkD .c3{background:#F4F2EC;color:#070C18}
.mkD .big{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;font-size:150px;line-height:.8;opacity:.16;position:absolute;right:18px;top:10px}
.mkD .fmt{position:relative;z-index:1}
.mkD .fmt .h{font-size:42px}
.mkD .c2 .fmt p,.mkD .c3 .fmt p{color:rgba(7,12,24,.78)}
.mkD .shot{position:relative;margin-top:auto;height:250px;overflow:hidden;border-radius:18px}
.mkD .shot .tg-ad{transform:scale(.68);transform-origin:top left;width:420px;display:block}
`,
    html: (ads) => `<div class="mk mkD">${F.map((f, i) => `<div class="c c${i + 1}"><span class="big">0${i + 1}</span><div class="fmt"><div class="h">${f.n}</div><p>${f.t}</p></div><div class="shot">${ads[i]}</div></div>`).join('')}</div>`,
  },
};

(async () => {
  const b = await p.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const [key, v] of Object.entries(variants)) {
    const pg = await b.newPage();
    await pg.setViewport({ width: 1903, height: 937, deviceScaleFactor: 1 });
    await pg.evaluateOnNewDocument(() => { try { localStorage.setItem('eleads-intro', String(Date.now())); } catch {} });
    await pg.goto('http://localhost:5173/?nomotion=1', { waitUntil: 'networkidle0' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.addStyleTag({ content: base + v.css });
    const ads = await pg.evaluate(() => [...document.querySelectorAll('#formats .tg-ad')].map((e) => e.outerHTML));
    const info = await pg.evaluate((html) => {
      document.querySelector('.formats__grid').outerHTML = html;
      const s = document.querySelector('#formats');
      window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 60);
      return { secH: Math.round(s.getBoundingClientRect().height), sw: document.documentElement.scrollWidth };
    }, v.html(ads));
    await new Promise((r) => setTimeout(r, 700));
    await pg.screenshot({ path: path.join(OUT, `formats-${key}.png`) });
    console.log(key, v.name, JSON.stringify(info));
    await pg.close();
  }
  await b.close();
})();
