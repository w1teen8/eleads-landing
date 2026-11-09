// Развитие варианта B блока 02 («81 зі 100») — четыре более интересных подачи. Только картинки для выбора.
const p = require('puppeteer-core');
const path = require('path');
const OUT = path.resolve(__dirname, '..', 'stats-options-2');
require('fs').mkdirSync(OUT, { recursive: true });

const GRAD = 'linear-gradient(90deg,#FFD23F 0%,#FF8A1F 100%)';
const T = {
  main: 'користувачів месенджерів 18–70 використовували Telegram протягом року',
  age: 'високе проникнення Telegram у всіх основних вікових групах',
  sample: 'респондентів у дослідженні Суспільного / Gradus Research',
  note: 'У Telegram присутні різні сегменти аудиторії — від молоді до дорослих користувачів.',
};

// детерминированный «случайный» порядок
function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
function litSet(n, share, seed) { const r = rng(seed); const idx = [...Array(n).keys()].map((i) => [r(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); return new Set(idx.slice(0, Math.round(n * share))); }

// ——— схематичный контур Украины (lon, lat), включая Крым ———
const UA = [[22.14,48.4],[22.55,49.08],[22.7,49.6],[23.3,50.1],[24.1,50.5],[24.1,50.85],[23.62,51.5],[24.3,51.75],[25.3,51.95],[27.2,51.6],[28.7,51.45],[29.3,51.4],[30.55,51.3],[30.95,52.05],[31.78,52.1],[32.4,52.33],[33.8,52.36],[34.4,51.75],[34.25,51.25],[35.1,51.2],[35.6,50.4],[36.6,50.25],[37.5,50.35],[38.0,49.9],[39.2,49.85],[40.2,49.6],[40.1,49.05],[39.7,48.6],[39.85,47.9],[38.85,47.85],[38.25,47.1],[37.6,47.05],[36.75,46.75],[35.8,46.6],[35.2,46.3],[34.8,46.15],[35.0,45.7],[35.5,45.3],[36.6,45.45],[36.45,45.05],[35.4,45.0],[34.5,44.7],[33.75,44.4],[33.4,44.6],[33.55,45.1],[32.5,45.35],[33.0,45.75],[33.6,46.1],[32.9,46.1],[32.2,46.2],[32.0,46.5],[31.5,46.6],[30.75,46.45],[30.2,45.85],[29.65,45.3],[28.2,45.45],[28.95,46.0],[29.2,46.4],[30.0,46.4],[29.6,46.9],[29.9,47.3],[29.2,47.95],[28.6,48.15],[27.75,48.45],[26.63,48.25],[26.2,48.0],[24.9,47.72],[24.2,47.9],[22.9,47.95]];
function inside(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
function uaMap(W) {
  const K = 0.663, lon0 = 22.0, lat1 = 52.5, step = 0.36;
  const s = W / ((40.3 - lon0) * K); const pts = [];
  let row = 0;
  for (let lat = lat1; lat > 44.2; lat -= step, row++) for (let lon = lon0 + (row % 2 ? (step / K) / 2 : 0); lon < 40.4; lon += step / K) if (inside(lon, lat, UA)) pts.push([(lon - lon0) * K * s, (lat1 - lat) * s]);
  const lit = litSet(pts.length, 0.81, 7); const r = (step * s) * 0.36; const H = (lat1 - 44.2) * s;
  const svg = `<svg viewBox="0 0 ${W} ${H.toFixed(0)}" width="${W}" height="${H.toFixed(0)}"><defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stop-color="#FFD23F"/><stop offset="1" stop-color="#FF8A1F"/></linearGradient></defs>` +
    pts.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${lit.has(i) ? 'url(#mg)' : 'rgba(244,242,236,.13)'}"/>`).join('') + '</svg>';
  return { svg, n: pts.length };
}

const PLANE = 'M21.4 3.6 2.9 10.7c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.6c.3.9 1.4 1.1 2 .4l2.6-2.6 4.6 3.4c.8.6 1.9.1 2.1-.8l3.1-14.6c.3-1.2-.9-2.2-2.4-1.6Zm-3.6 4.1-8.4 7.6-.3 3.3-1.4-4.5 9.6-6.1c.4-.3.8.2.5.5Z';
const planes = () => { const lit = litSet(100, 0.81, 3); return [...Array(100).keys()].map((i) => `<svg class="${lit.has(i) ? 'on' : ''}" viewBox="0 0 24 24"><path d="${PLANE}"/></svg>`).join(''); };
const people = () => { const lit = litSet(100, 0.81, 11); return [...Array(100).keys()].map((i) => `<svg class="${lit.has(i) ? 'on' : ''}" viewBox="0 0 40 40"><circle class="bg" cx="20" cy="20" r="20"/><circle class="fg" cx="20" cy="15.5" r="6.6"/><path class="fg" d="M7.5 34.5c1.2-7 6.2-10.6 12.5-10.6s11.300 3.600 12.500 10.600A19.900 19.900 0 0 1 20 40a19.900 19.900 0 0 1-12.500-5.500Z"/></svg>`).join(''); };

const base = `
.stats__panel:not([hidden]){display:block!important}
.stats__panel[hidden]{display:none!important}
.mk{height:492px;color:#F4F2EC;font-family:'Onest',sans-serif;display:grid;grid-template-columns:1.32fr 1fr;gap:20px}
.mk .num{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;line-height:.86;background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent}
.mk .lbl{color:rgba(244,242,236,.72);font-size:18px;line-height:1.4;margin:0}
.mk .card{position:relative;border-radius:28px;background:rgba(244,242,236,.055);border:1px solid rgba(244,242,236,.1);overflow:hidden}
.mk .accent{border-radius:24px;background:linear-gradient(100deg,#FFD23F,#FF8A1F);color:#070C18;padding:22px 30px;display:flex;align-items:center;gap:28px;margin-top:6px}
.mk .accent .tag{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;font-size:60px;line-height:.9}
.mk .accent .txt{font-size:18px;line-height:1.4;font-weight:500}
.mk .mono{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,242,236,.5)}
.mk .right{display:flex;flex-direction:column}
.mk .row{flex:1;display:flex;align-items:center;justify-content:space-between;gap:28px;border-top:1px solid rgba(244,242,236,.14);padding:0 4px}
.mk .row .num{font-size:92px;white-space:nowrap}
.mk .row .lbl{text-align:right;max-width:300px}
.mk .legend{display:flex;gap:22px;align-items:center}
.mk .legend span{display:inline-flex;align-items:center;gap:8px}
.mk .legend i{width:10px;height:10px;border-radius:50%;background:rgba(244,242,236,.16)}
.mk .legend i.on{background:linear-gradient(135deg,#FFD23F,#FF8A1F)}
`;
const right = `<div class="right">
    <div class="row"><div class="num">18–70</div><p class="lbl">${T.age}</p></div>
    <div class="row"><div class="num">4 500</div><p class="lbl">${T.sample}</p></div>
    <div class="accent"><div class="tag">UA</div><div class="txt">${T.note}</div></div>
  </div>`;
const legend = `<div class="legend mono"><span><i class="on"></i>користуються Telegram</span><span><i></i>ні</span></div>`;

const map = uaMap(560);
const variants = {
  // E — «Мапа»: Украина из точек, 81% точек горит; на вкладке Worldwide — карта мира из точек (данные уже есть)
  E: {
    name: 'Мапа України',
    css: `
.mkE .left{padding:34px 40px;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px}
.mkE .txt{display:flex;flex-direction:column;justify-content:space-between;height:100%;max-width:300px}
.mkE .txt .num{font-size:190px}
.mkE .txt .lbl{font-size:20px;color:#F4F2EC;margin-top:14px}
.mkE .map{justify-self:end;margin-right:-6px}
.mkE .map svg{display:block}
`,
    html: `<div class="mk mkE"><div class="card left">
    <div class="txt"><div><div class="num">81%</div><p class="lbl">${T.main}</p></div>${legend}</div>
    <div class="map">${map.svg}</div></div>${right}</div>`,
  },
  // F — «Самолётики»: сто значков Telegram, 81 горит
  F: {
    name: 'Самолётики',
    css: `
.mkF .left{padding:32px 40px;display:flex;flex-direction:column;justify-content:space-between}
.mkF .top{display:flex;align-items:flex-end;gap:32px}
.mkF .top .num{font-size:170px}
.mkF .top .lbl{font-size:20px;color:#F4F2EC;max-width:400px;padding-bottom:12px}
.mkF .grid{display:grid;grid-template-columns:repeat(20,1fr);gap:12px 10px}
.mkF .grid svg{width:100%;aspect-ratio:1;fill:rgba(244,242,236,.13)}
.mkF .grid svg.on{fill:#FFB52E}
.mkF .grid svg.on:nth-child(3n){fill:#FFD23F}
.mkF .grid svg.on:nth-child(4n){fill:#FF8A1F}
`,
    html: `<div class="mk mkF"><div class="card left">
    <div class="top"><div class="num">81%</div><p class="lbl">${T.main}</p></div>
    <div class="grid">${planes()}</div></div>${right}</div>`,
  },
  // G — «Аудиторія»: сто аватарок, как участники канала; 81 «в сети»
  G: {
    name: 'Аудиторія',
    css: `
.mkG .left{padding:32px 40px;display:flex;flex-direction:column;justify-content:space-between}
.mkG .top{display:flex;align-items:flex-end;gap:32px}
.mkG .top .num{font-size:170px}
.mkG .top .lbl{font-size:20px;color:#F4F2EC;max-width:400px;padding-bottom:12px}
.mkG .grid{display:grid;grid-template-columns:repeat(20,1fr);gap:10px 8px}
.mkG .grid svg{width:100%;aspect-ratio:1}
.mkG .grid .bg{fill:rgba(244,242,236,.08)}
.mkG .grid .fg{fill:rgba(244,242,236,.14)}
.mkG .grid svg.on .bg{fill:#FFB52E}
.mkG .grid svg.on:nth-child(3n) .bg{fill:#FFD23F}
.mkG .grid svg.on:nth-child(4n) .bg{fill:#FF8A1F}
.mkG .grid svg.on .fg{fill:#070C18}
`,
    html: `<div class="mk mkG"><div class="card left">
    <div class="top"><div class="num">81%</div><p class="lbl">${T.main}</p></div>
    <div class="grid">${people()}</div></div>${right}</div>`,
  },
  // H — «Світлове табло»: 81% набрано горящими точками на поле из точек
  H: {
    name: 'Світлове табло',
    css: `
.mkH .left{padding:30px 36px;display:flex;flex-direction:column;justify-content:space-between}
.mkH canvas{display:block}
.mkH .left .lbl{font-size:20px;color:#F4F2EC;max-width:560px}
`,
    html: `<div class="mk mkH"><div class="card left"><div id="led"></div><p class="lbl">${T.main}</p></div>${right}</div>`,
    js: () => {
      const W = 900, H = 330, step = 13.2, r = 4.6;
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
      x.fillStyle = '#000'; x.font = "900 430px 'Sofia Sans Extra Condensed'"; x.textBaseline = 'alphabetic'; x.fillText('81%', -6, 318);
      const d = x.getImageData(0, 0, W, H).data;
      let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><linearGradient id="lg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W * 0.62}" y2="0"><stop offset="0" stop-color="#FFD23F"/><stop offset="1" stop-color="#FF8A1F"/></linearGradient></defs>`;
      for (let yy = step / 2; yy < H; yy += step) for (let xx = step / 2; xx < W; xx += step) {
        const on = d[(Math.round(yy) * W + Math.round(xx)) * 4 + 3] > 128;
        s += `<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="${r}" fill="${on ? 'url(#lg)' : 'rgba(244,242,236,.08)'}"/>`;
      }
      document.getElementById('led').innerHTML = s + '</svg>';
    },
  },
};

(async () => {
  console.log('map dots', map.n);
  const b = await p.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const [key, v] of Object.entries(variants)) {
    const pg = await b.newPage();
    await pg.setViewport({ width: 1903, height: 937, deviceScaleFactor: 1 });
    await pg.evaluateOnNewDocument(() => { try { localStorage.setItem('eleads-intro', String(Date.now())); } catch {} });
    await pg.goto('http://localhost:5173/?nomotion=1', { waitUntil: 'networkidle0' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.addStyleTag({ content: base + v.css });
    const info = await pg.evaluate((html) => {
      document.querySelector('[data-stats-panel="ua"]').innerHTML = html;
      const s = document.querySelector('#stats');
      window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 60);
      return { secH: Math.round(s.getBoundingClientRect().height), sw: document.documentElement.scrollWidth };
    }, v.html);
    if (v.js) { await pg.evaluate(() => document.fonts.load("900 100px 'Sofia Sans Extra Condensed'")); await pg.evaluate(v.js); }
    await new Promise((r) => setTimeout(r, 700));
    await pg.screenshot({ path: path.join(OUT, `stats-${key}.png`) });
    console.log(key, v.name, JSON.stringify(info));
    await pg.close();
  }
  await b.close();
})();
