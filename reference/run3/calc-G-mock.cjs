// Блок 05 — второй заход: четыре более смелых варианта (E–H). Только картинки.
const p = require('puppeteer-core');
const path = require('path');
const OUT = path.resolve(__dirname, '..', 'calc-options-2');
require('fs').mkdirSync(OUT, { recursive: true });

const GRAD = 'linear-gradient(100deg,#FFD23F 0%,#FF8A1F 100%)';
const V = { imp: '510 000 – 690 000', ctr: '1,0–1,4%', clk: '6 120 – 8 280', sub: '2 142 – 2 898', cpc: '€0.18 – €0.25', cpa: '€0.52 – €0.70', bud: '€1 500' };
const pills = (items, on = 0) => `<div class="pills">${items.map((x, i) => `<span class="pill ${i === on ? 'on' : ''}">${x}</span>`).join('')}</div>`;
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const base = `
.mk{height:560px;color:#F4F2EC;font-family:'Onest',sans-serif}
.mk .h{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;text-transform:uppercase;line-height:.9}
.mk .num{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;line-height:.9;letter-spacing:0}
.mk .grad{background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent}
.mk .mono{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,242,236,.5)}
.mk .card{border-radius:28px;background:rgba(244,242,236,.055);border:1px solid rgba(244,242,236,.1)}
.mk .pills{display:flex;flex-wrap:wrap;gap:8px}
.mk .pill{padding:9px 16px;border-radius:999px;border:1px solid rgba(244,242,236,.16);font-size:15px;font-weight:600}
.mk .pill.on{background:${GRAD};color:#070C18;border-color:transparent}
.mk .lbl{font-size:14px;color:rgba(244,242,236,.55);margin:0 0 8px}
.mk .range{position:relative;height:6px;border-radius:3px;background:rgba(244,242,236,.14);margin:14px 0 8px}
.mk .range i{position:absolute;left:0;top:0;bottom:0;width:30%;border-radius:3px;background:${GRAD}}
.mk .range b{position:absolute;left:30%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#FFD23F;box-shadow:0 0 0 5px rgba(255,210,63,.25)}
.mk .cta{display:inline-flex;align-items:center;gap:14px;padding:0 8px 0 24px;height:56px;border-radius:999px;background:${GRAD};color:#070C18;font-weight:700;font-size:16px;white-space:nowrap}
.mk .cta .arr{width:40px;height:40px;border-radius:50%;background:#070C18;color:#FFD23F;display:grid;place-items:center;flex:none}
.mk .cta .arr svg{width:46%;height:46%}
`;

// точки для «аудитории»
function dots(n, lit, cols, seed = 5) { let s = seed; const r = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; const idx = [...Array(n).keys()].map((i) => [r(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); const L = new Set(idx.slice(0, lit)); return `<div class="dots" style="grid-template-columns:repeat(${cols},1fr)">${[...Array(n).keys()].map((i) => `<i class="${L.has(i) ? 'on' : ''}"></i>`).join('')}</div>`; }

const variants = {
  // E — «Одна цифра»: весь экран про результат — огромные «2 142 – 2 898 підписників» на всю ширину, остальное мелко вокруг
  E: {
    name: 'Одна велика цифра',
    css: `
.mkE{display:grid;grid-template-rows:auto 1fr auto;gap:14px}
.mkE .ctrl{display:flex;gap:34px;align-items:flex-end;flex-wrap:wrap}
.mkE .ctrl .g{display:flex;flex-direction:column;gap:6px}
.mkE .hero{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:10px;padding:0 4px}
.mkE .hero .k{font-size:22px;color:rgba(244,242,236,.7)}
.mkE .hero .num{font-size:212px;letter-spacing:-.01em;white-space:nowrap}
.mkE .hero .num small{font-size:70px;color:rgba(244,242,236,.85);-webkit-text-fill-color:#F4F2EC;margin-left:16px}
.mkE .row{display:grid;grid-template-columns:repeat(4,1fr) auto;gap:24px;align-items:center;border-top:1px solid rgba(244,242,236,.14);padding-top:22px}
.mkE .row .num{font-size:40px}
.mkE .bud{min-width:300px}.mkE .bud .range{margin-top:8px}
`,
    html: `<div class="mk mkE">
  <div class="ctrl"><div class="g"><p class="lbl" style="margin:0">Ніша</p>${pills(['Business', 'Crypto', 'Education', 'Auto'])}</div><div class="g"><p class="lbl" style="margin:0">GEO</p>${pills(['Україна', 'Worldwide'])}</div><div class="g"><p class="lbl" style="margin:0">Ціль</p>${pills(['Підписники', 'Користувачі бота'])}</div><div class="g bud"><p class="lbl" style="margin:0">Бюджет <b style="color:#FFD23F">${V.bud}</b></p><div class="range"><i></i><b></b></div></div></div>
  <div class="hero"><span class="k">За ${V.bud} ви отримаєте приблизно</span><span class="num grad">${V.sub}<small>підписників</small></span></div>
  <div class="row"><div><p class="lbl">Покази</p><span class="num">${V.imp}</span></div><div><p class="lbl">Кліки · CTR ${V.ctr}</p><span class="num">${V.clk}</span></div><div><p class="lbl">CPC</p><span class="num">${V.cpc}</span></div><div><p class="lbl">CPA / CPS</p><span class="num">${V.cpa}</span></div><span class="cta">Отримати точний прогноз <span class="arr">${ARROW}</span></span></div>
</div>`,
  },
  // F — «Аудиторія»: поле из точек-людей (покази), из них горят кликнувшие, ярче — подписчики; цифры справа
  F: {
    name: 'Поле аудиторії',
    css: `
.mkF{display:grid;grid-template-columns:1.25fr 1fr;gap:24px}
.mkF .field{padding:30px 34px;display:flex;flex-direction:column;gap:18px}
.mkF .dots{display:grid;gap:7px;flex:1}
.mkF .dots i{border-radius:50%;background:rgba(244,242,236,.1)}
.mkF .dots i.on{background:#FF8A1F}
.mkF .dots i.on:nth-child(3n){background:#FFD23F}
.mkF .leg{display:flex;gap:26px}.mkF .leg span{display:inline-flex;align-items:center;gap:8px}.mkF .leg i{width:12px;height:12px;border-radius:50%;display:inline-block}
.mkF .ctrl{display:flex;gap:22px;flex-wrap:wrap;align-items:flex-end}
.mkF .ctrl .g{display:flex;flex-direction:column;gap:6px}
.mkF .side{display:flex;flex-direction:column;gap:14px}
.mkF .side .card{padding:22px 28px;display:flex;justify-content:space-between;align-items:center;gap:20px}
.mkF .side .num{font-size:52px;white-space:nowrap}
.mkF .side .card.hi{background:${GRAD};color:#070C18;border:0}.mkF .side .card.hi .num{font-size:66px}.mkF .side .card.hi .lbl{color:rgba(7,12,24,.7)}
.mkF .side .cta{align-self:stretch;justify-content:space-between;margin-top:auto}
.mkF .bud{display:flex;align-items:center;gap:14px;min-width:280px}.mkF .bud .range{flex:1;margin:0}.mkF .bud .num{font-size:30px}
`,
    html: `<div class="mk mkF">
  <div class="card field">
    <div class="leg mono"><span><i style="background:rgba(244,242,236,.2)"></i>Покази</span><span><i style="background:#FF8A1F"></i>Кліки</span><span><i style="background:#FFD23F"></i>Підписники</span></div>
    ${dots(26 * 11, 96, 26)}
    <div class="ctrl"><div class="g">${pills(['Business', 'Crypto', 'Education', 'Auto'])}</div><div class="g">${pills(['Україна', 'Worldwide'])}</div><div class="g">${pills(['Підписники', 'Користувачі бота'])}</div><div class="bud"><div class="range"><i></i><b></b></div><span class="num grad">${V.bud}</span></div></div>
  </div>
  <div class="side">
    <div class="card"><div><p class="lbl">Покази</p><span class="num">${V.imp}</span></div></div>
    <div class="card"><div><p class="lbl">Кліки · CTR ${V.ctr}</p><span class="num">${V.clk}</span></div><div style="text-align:right"><p class="lbl">CPC</p><span class="num" style="font-size:34px">${V.cpc}</span></div></div>
    <div class="card hi"><div><p class="lbl">Підписники</p><span class="num">${V.sub}</span></div><div style="text-align:right"><p class="lbl">CPA</p><span class="num" style="font-size:34px">${V.cpa}</span></div></div>
    <span class="cta">Отримати точний прогноз <span class="arr">${ARROW}</span></span>
  </div></div>`,
  },
  // G — «Оголошення в Telegram»: прогноз — в виде сообщения бота в телефонном пузыре, параметры — как кнопки клавиатуры бота
  G: {
    name: 'Повідомлення від бота',
    css: `
.mkG{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center}
.mkG .left{display:flex;flex-direction:column;gap:24px}
.mkG .left .h{font-size:34px;color:rgba(244,242,236,.9)}
.mkG .kb{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mkG .kb .key{padding:16px 18px;border-radius:14px;background:rgba(244,242,236,.08);text-align:center;font-size:16px;font-weight:600}
.mkG .kb .key.on{background:${GRAD};color:#070C18}
.mkG .kb .key.w{grid-column:1 / -1}
.mkG .bud{display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:14px;background:rgba(244,242,236,.08)}.mkG .bud .range{flex:1;margin:0}.mkG .bud .num{font-size:34px}
.mkG .bubble{position:relative;padding:30px 34px;border-radius:26px 26px 26px 6px;background:#16213A;box-shadow:0 40px 80px -40px rgba(0,0,0,.9)}
.mkG .bubble .from{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.mkG .bubble .ava{width:42px;height:42px;border-radius:50%;background:${GRAD};color:#070C18;display:grid;place-items:center;font-weight:800}
.mkG .bubble .from b{color:#FFD23F}.mkG .bubble .from small{display:block;font-size:12px;color:rgba(244,242,236,.5)}
.mkG .bubble p{margin:0 0 18px;font-size:18px;line-height:1.5}
.mkG .bubble .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px}
.mkG .bubble .num{font-size:46px}
.mkG .bubble .grid .big{grid-column:1 / -1}.mkG .bubble .grid .big .num{font-size:70px}
.mkG .bubble .time{position:absolute;right:20px;bottom:12px;font-size:12px;color:rgba(244,242,236,.45)}
.mkG .bubble .btn{margin-top:20px;display:flex;justify-content:center;align-items:center;gap:10px;padding:14px;border-radius:12px;background:rgba(255,210,63,.1);color:#FFD23F;font-weight:700}
`,
    html: `<div class="mk mkG">
  <div class="left"><div class="h">Оберіть параметри — бот порахує</div>
    <div class="kb"><span class="key on">Business</span><span class="key">Crypto</span><span class="key">Education</span><span class="key">Auto</span><span class="key on">Україна</span><span class="key">Worldwide</span><span class="key on">Підписники</span><span class="key">Користувачі бота</span></div>
    <div class="bud"><span class="lbl" style="margin:0">Бюджет</span><div class="range"><i></i><b></b></div><span class="num grad">${V.bud}</span></div>
  </div>
  <div class="bubble"><div class="from"><span class="ava">e</span><span><b>eLeads Forecast</b><small>бот · демо-коефіцієнти</small></span></div>
    <p>За бюджету <b>${V.bud}</b> для ніші Business в Україні орієнтовно:</p>
    <div class="grid"><div><p class="lbl">Покази</p><span class="num">${V.imp}</span></div><div><p class="lbl">Кліки · CTR ${V.ctr}</p><span class="num">${V.clk}</span></div><div class="big"><p class="lbl">Підписники</p><span class="num grad">${V.sub}</span></div><div><p class="lbl">CPC</p><span class="num" style="font-size:34px">${V.cpc}</span></div><div><p class="lbl">CPA / CPS</p><span class="num" style="font-size:34px">${V.cpa}</span></div></div>
    <div class="btn">Отримати точний прогноз ↗</div><span class="time">9:41</span>
  </div></div>`,
  },
  // H — «Слайдер-герой»: гигантский ползунок бюджета через весь экран, под ним три колонки результата
  H: {
    name: 'Великий повзунок',
    css: `
.mkH{display:grid;grid-template-rows:auto auto 1fr;gap:26px}
.mkH .ctrl{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.mkH .ctrl .sep{width:1px;height:28px;background:rgba(244,242,236,.16);margin:0 10px}
.mkH .big{padding:30px 40px 26px}
.mkH .big .top{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px}
.mkH .big .top .num{font-size:96px}
.mkH .big .top .lbl{font-size:18px}
.mkH .track{position:relative;height:18px;border-radius:9px;background:rgba(244,242,236,.1)}
.mkH .track i{position:absolute;left:0;top:0;bottom:0;width:30%;border-radius:9px;background:${GRAD}}
.mkH .track b{position:absolute;left:30%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:#FFD23F;box-shadow:0 0 0 10px rgba(255,210,63,.18),0 10px 30px -8px rgba(255,138,31,.8)}
.mkH .ticks{display:flex;justify-content:space-between;margin-top:14px}
.mkH .res{display:grid;grid-template-columns:repeat(3,1fr) auto;gap:20px;align-items:stretch}
.mkH .res .card{padding:24px 28px;display:flex;flex-direction:column;justify-content:space-between}
.mkH .res .num{font-size:56px;white-space:nowrap}
.mkH .res .sub{font-size:16px;color:rgba(244,242,236,.6);margin-top:8px}
.mkH .res .cta{align-self:center;height:64px}
`,
    html: `<div class="mk mkH">
  <div class="ctrl">${pills(['Business', 'Crypto', 'Education', 'Auto'])}<span class="sep"></span>${pills(['Україна', 'Worldwide'])}<span class="sep"></span>${pills(['Підписники', 'Користувачі бота'])}</div>
  <div class="card big"><div class="top"><span class="lbl">Рекламний бюджет</span><span class="num grad">${V.bud}</span></div><div class="track"><i></i><b></b></div><div class="ticks mono"><span>€650</span><span>€2 500</span><span>€5 000</span><span>€7 500</span><span>€10 000+</span></div></div>
  <div class="res">
    <div class="card"><p class="lbl">01 Покази</p><div><span class="num">${V.imp}</span><div class="sub">CTR ${V.ctr}</div></div></div>
    <div class="card"><p class="lbl">02 Кліки</p><div><span class="num">${V.clk}</span><div class="sub">CPC ${V.cpc}</div></div></div>
    <div class="card" style="background:${GRAD};color:#070C18;border:0"><p class="lbl" style="color:rgba(7,12,24,.7)">03 Підписники</p><div><span class="num">${V.sub}</span><div class="sub" style="color:rgba(7,12,24,.75)">CPA ${V.cpa}</div></div></div>
    <span class="cta" style="writing-mode:vertical-rl;transform:rotate(180deg);height:auto;padding:24px 0 8px;width:64px;border-radius:999px;justify-content:center"><span class="arr" style="transform:rotate(180deg)">${ARROW}</span>Точний прогноз</span>
  </div></div>`,
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
    const info = await pg.evaluate((html) => {
      document.querySelector('#calculator .calc').outerHTML = html;
      const note = document.querySelector('#calculator .calc__note'); if (note) note.remove();
      const s = document.querySelector('#calculator');
      window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 60);
      return { secH: Math.round(s.getBoundingClientRect().height), sw: document.documentElement.scrollWidth };
    }, v.html);
    await new Promise((r) => setTimeout(r, 700));
    await pg.screenshot({ path: path.join(OUT, `calc-${key}.png`) });
    console.log(key, v.name, JSON.stringify(info));
    await pg.close();
  }
  await b.close();
})();
