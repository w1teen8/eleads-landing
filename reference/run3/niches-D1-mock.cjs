// Варианты оформления блока 03 «Ніші» — только картинки для выбора, проект не трогает.
const p = require('puppeteer-core');
const path = require('path');
const OUT = path.resolve(__dirname, '..', 'niches-options-3');
require('fs').mkdirSync(OUT, { recursive: true });

const GRAD = 'linear-gradient(100deg,#FFD23F 0%,#FF8A1F 100%)';
const N = [
  { n: 'Бізнес', c: ['Finmap'], i: '<path d="M3 7h18v13H3zM9 7V4h6v3M3 12h18"/>' },
  { n: 'Експерти', c: ['eLeads', 'Мухін', 'Домбовецький'], i: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>' },
  { n: 'Crypto', c: ['Cryptonite'], i: '<circle cx="12" cy="12" r="9"/><path d="M9.500 7.500h4a2.200 2.200 0 0 1 0 4.500h-4zm0 4.500h4.700a2.200 2.200 0 0 1 0 4.500H9.500zM11.500 5.500v2m0 9v2"/>' },
  { n: 'Education', c: ['Anna Haustova'], i: '<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5"/>' },
  { n: 'Auto', c: ['Global Auto Logistic'], i: '<path d="M1.800 15.800v-2.300c0-.7.5-1.300 1.200-1.400l3-.5 2.300-3.500c.3-.5.800-.7 1.300-.7h5.200c.5 0 1 .200 1.300.600l2.900 3.600 2.200.5c.8.200 1.400.900 1.400 1.700v2c0 .400-.3.700-.7.700H20.300M3.700 16.500H1.800v-.7M8.700 16.500h6.600"/><path d="M6.300 11.500h12.400M11.800 7.500v4"/><circle cx="6.200" cy="16.500" r="2.200"/><circle cx="17.800" cy="16.500" r="2.200"/>' },
  { n: 'Finance / Investments', c: ['Monolit'], i: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>' },
  { n: 'SaaS / B2B', c: ['Trackdesk'], i: '<path d="M7 18a5 5 0 1 1 1-9.900A6 6 0 0 1 19.500 10 4 4 0 0 1 18 18z"/>' },
];
const CTA = { n: 'Інша ніша?', t: 'Напишіть мені — оціню потенціал Telegram Ads для вашого проєкту.', b: 'Написати в Telegram' };
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const icon = (s) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round">${s}</svg>`;
const pad = (i) => String(i + 1).padStart(2, '0');

const base = `
.mk{height:474px;color:#F4F2EC;font-family:'Onest',sans-serif}
.mk .h{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;text-transform:uppercase;line-height:.92}
.mk .mono{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.12em;color:rgba(244,242,236,.45)}
.mk .arr{display:grid;place-items:center;border-radius:50%;flex:none}
.mk .arr svg{width:46%;height:46%}
`;


const cls = ['dark', 'cream', 'dark', 'yellow', 'orange', 'dark', 'cream'];
const tileBase = `
.mkD{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;gap:14px}
.mkD .t{position:relative;border-radius:22px;padding:24px 26px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;isolation:isolate}
.mkD .t .h{font-size:58px;position:relative;z-index:1}
.mkD .t .cl{font-size:17px;font-weight:600;line-height:1.35;position:relative;z-index:1}
.mkD .dark{background:#1A2132;border:1px solid rgba(244,242,236,.1);--p:rgba(244,242,236,.13)}
.mkD .dark .cl{color:rgba(244,242,236,.72)}
.mkD .cream{background:#F4F2EC;color:#070C18;--p:rgba(7,12,24,.13)}
.mkD .yellow{background:#FFD23F;color:#070C18;--p:rgba(7,12,24,.15)}
.mkD .orange{background:#FF8A1F;color:#070C18;--p:rgba(7,12,24,.16)}
.mkD .ink{background:#070C18;border:1.500px solid #FFD23F;color:#FFD23F;--p:rgba(255,210,63,.2)}
.mkD .ink .txt{font-size:16px;line-height:1.4;color:rgba(244,242,236,.82);position:relative;z-index:1}
.mkD .top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.mkD .arr{width:46px;height:46px;background:#FFD23F;color:#070C18;position:relative;z-index:1}
`;
const tile = (x, i, extra = '') => `<div class="t ${cls[i]} p${i}">${extra}<div class="h">${x.n}</div><div class="cl">${x.c.join(' · ')}</div></div>`;
const ctaTile = (extra = '') => `<div class="t ink p7">${extra}<div class="top"><div class="h">${CTA.n}</div><span class="arr">${ARROW}</span></div><div class="txt">${CTA.t}</div></div>`;

const variants = {
  // D1 — мозаика + крупная иконка ниши в углу каждой плитки
  D1: {
    name: 'Мозаїка з іконками',
    css: tileBase + `
.mkD .ic{position:absolute;right:-18px;bottom:-22px;width:200px;height:200px;color:var(--p);stroke-width:1.500;z-index:0}
`,
    html: () => `<div class="mk mkD">${N.map((x, i) => tile(x, i, icon(x.i))).join('')}${ctaTile(icon('<path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/>'))}</div>`,
  },
  // D2 — мозаика + у каждой плитки свой графический узор (точки, полосы, кольца, сетка, круг, клетка, дуги)
  D2: {
    name: 'Мозаїка з візерунками',
    css: tileBase + `
.mkD .t::after{content:"";position:absolute;inset:0;z-index:0;-webkit-mask-image:linear-gradient(135deg,transparent 38%,#000 100%);mask-image:linear-gradient(135deg,transparent 38%,#000 100%)}
.mkD .p0::after{background:radial-gradient(var(--p) 3.500px,transparent 4px) 0 0/22px 22px}
.mkD .p1::after{background:repeating-linear-gradient(135deg,var(--p) 0 4px,transparent 4px 18px)}
.mkD .p2::after{background:repeating-radial-gradient(circle at 100% 100%,var(--p) 0 3px,transparent 3px 24px)}
.mkD .p3::after{background:linear-gradient(var(--p) 2px,transparent 2px) 0 0/26px 26px,linear-gradient(90deg,var(--p) 2px,transparent 2px) 0 0/26px 26px}
.mkD .p4::after{background:radial-gradient(circle at 100% 100%,var(--p) 0 150px,transparent 151px),radial-gradient(circle at 100% 100%,var(--p) 0 230px,transparent 231px)}
.mkD .p5::after{background:conic-gradient(var(--p) 25%,transparent 0 50%,var(--p) 0 75%,transparent 0) 0 0/36px 36px}
.mkD .p6::after{background:repeating-linear-gradient(90deg,var(--p) 0 4px,transparent 4px 20px)}
.mkD .p7::after{background:repeating-radial-gradient(circle at 0% 100%,var(--p) 0 2px,transparent 2px 20px)}
`,
    html: () => `<div class="mk mkD">${N.map((x, i) => tile(x, i)).join('')}${ctaTile()}</div>`,
  },
  // D3 — мозаика из плиток разной ширины и формы (скругления-«лепестки», пилюли), названия крупнее
  D3: {
    name: 'Мозаїка різних форм',
    css: tileBase + `
.mkD{grid-template-columns:repeat(12,1fr)}
.mkD .t .h{font-size:64px}
.mkD .p0{grid-column:span 3;border-radius:22px 110px 22px 22px}
.mkD .p1{grid-column:span 4;border-radius:22px}
.mkD .p2{grid-column:span 2;border-radius:999px;align-items:center;text-align:center;justify-content:center;gap:10px}
.mkD .p2 .h{font-size:50px}
.mkD .p3{grid-column:span 3;border-radius:110px 22px 22px 22px;padding-left:44px}
.mkD .p4{grid-column:span 2;border-radius:22px 22px 22px 110px}
.mkD .p4 .cl{padding-left:34px}
.mkD .p5{grid-column:span 4;border-radius:999px;padding:24px 56px;justify-content:center;gap:12px}
.mkD .p6{grid-column:span 3;border-radius:22px}
.mkD .p7{grid-column:span 3;border-radius:22px 22px 110px 22px}
`,
    html: () => `<div class="mk mkD">${N.map((x, i) => tile(x, i)).join('')}${ctaTile()}</div>`,
  },
  // D4 — тёмные плитки с цветным контуром и цветным кругом в углу; при наведении плитка заливается цветом (одна показана наведённой)
  D4: {
    name: 'Контур + заливка при наведенні',
    css: tileBase + `
.mkD .t{background:#111827;border:1.500px solid var(--c);color:#F4F2EC}
.mkD .t .h{color:var(--c)}
.mkD .t .cl{color:rgba(244,242,236,.75)}
.mkD .t::after{content:"";position:absolute;right:-70px;bottom:-70px;width:210px;height:210px;border-radius:50%;background:var(--c);opacity:.16;z-index:0}
.mkD .p0,.mkD .p3,.mkD .p6{--c:#FFD23F}
.mkD .p1,.mkD .p4{--c:#FF8A1F}
.mkD .p2,.mkD .p5{--c:#F4F2EC}
.mkD .p7{--c:#FFD23F;background:linear-gradient(100deg,#FFD23F,#FF8A1F);border:0}
.mkD .p7 .h{color:#070C18}.mkD .p7 .txt{color:rgba(7,12,24,.8);font-weight:500}.mkD .p7 .arr{background:#070C18;color:#FFD23F}.mkD .p7::after{display:none}
.mkD .p1{background:#FF8A1F;transform:translateY(-8px) rotate(-1.500deg);box-shadow:0 30px 50px -24px rgba(255,138,31,.6)}
.mkD .p1 .h{color:#070C18}.mkD .p1 .cl{color:rgba(7,12,24,.85)}
.mkD .p1::after{background:#070C18;opacity:.12;width:520px;height:520px;right:-170px;bottom:-250px}
.mkD .hint{position:absolute;right:20px;top:18px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;color:rgba(7,12,24,.6);z-index:1}
`,
    html: () => `<div class="mk mkD">${N.map((x, i) => tile(x, i, i === 1 ? '<span class="hint">↖ НАВЕДЕНО</span>' : '')).join('')}${ctaTile()}</div>`,
  },
};

(async () => {
  const b = await p.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const [key, v] of Object.entries(variants)) {
    if (key !== 'D1') continue;
    const pg = await b.newPage();
    await pg.setViewport({ width: 1903, height: 937, deviceScaleFactor: 1 });
    await pg.evaluateOnNewDocument(() => { try { localStorage.setItem('eleads-intro', String(Date.now())); } catch {} });
    await pg.goto('http://localhost:5173/?nomotion=1', { waitUntil: 'networkidle0' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.addStyleTag({ content: base + v.css });
    const info = await pg.evaluate((html) => {
      document.querySelector('.niches__grid').outerHTML = html;
      const s = document.querySelector('#niches');
      window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 60);
      const m = document.querySelector('.mk').getBoundingClientRect();
      return { secH: Math.round(s.getBoundingClientRect().height), mkBottom: Math.round(m.bottom), sw: document.documentElement.scrollWidth };
    }, v.html());
    await new Promise((r) => setTimeout(r, 700));
    await pg.screenshot({ path: path.join(OUT, `niches-${key}.png`) });
    console.log(key, v.name, JSON.stringify(info));
    await pg.close();
  }
  await b.close();
})();
