// Блок 08 «GEO» — четыре варианта оформления. Только картинки. Точки суши — src/data/geo-dots.json.
const p = require('puppeteer-core'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '..', 'geo-layout'); fs.mkdirSync(OUT, { recursive: true });
const G = JSON.parse(fs.readFileSync('C:/Users/admin/Desktop/claude/eLeads/src/data/geo-dots.json', 'utf8'));
const GRAD = 'linear-gradient(100deg,#FFD23F 0%,#FF8A1F 100%)';
const R = [
  { id: 'ukraine', n: 'Україна', t: 'локальна аудиторія', lon: 31, lat: 49 },
  { id: 'europe', n: 'Європа', t: 'українці + міжнародні сегменти', lon: 9, lat: 49.5, fig: '4.43M' },
  { id: 'uk', n: 'United Kingdom', t: 'Tier-1', lon: -2, lat: 53.5 },
  { id: 'usa', n: 'USA', t: 'Tier-1', lon: -98, lat: 39 },
  { id: 'canada', n: 'Canada', t: 'Tier-1', lon: -105, lat: 57 },
  { id: 'australia', n: 'Australia', t: 'Tier-1', lon: 134, lat: -25 },
  { id: 'asia', n: 'Asia', t: 'окремі GEO за задачею', lon: 100, lat: 30 },
];
const land = []; G.rowsData.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '1') land.push([G.lon0 + (c + 0.5) * G.step, G.lat0 - (r + 0.5) * G.step]); }));
const near = (lon, lat, rr) => R.find((x) => Math.hypot(x.lon - lon, (x.lat - lat) * 1.2) < rr);
// плоская карта
function flat(W, H, { r = 3.2, hi = true, arcs = false, pins = 'dot' } = {}) {
  const x = (lon) => ((lon + 180) / 360) * W, y = (lat) => ((80 - lat) / 140) * H;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%"><defs><linearGradient id="ag" x1="0" x2="1"><stop offset="0" stop-color="#FFD23F"/><stop offset="1" stop-color="#FF8A1F"/></linearGradient></defs>`;
  s += land.map(([lo, la]) => { const h = hi && near(lo, la, 9); return `<circle cx="${x(lo).toFixed(1)}" cy="${y(la).toFixed(1)}" r="${r}" fill="${h ? '#FF8A1F' : 'rgba(244,242,236,.16)'}" ${h ? 'opacity=".85"' : ''}/>`; }).join('');
  const ua = R[0];
  if (arcs) R.slice(1).forEach((g) => { const x0 = x(ua.lon), y0 = y(ua.lat), x1 = x(g.lon), y1 = y(g.lat); const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - Math.abs(x1 - x0) * 0.28; s += `<path d="M${x0} ${y0} Q${mx} ${my} ${x1} ${y1}" fill="none" stroke="url(#ag)" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>`; });
  R.forEach((g, i) => { const big = i === 0; s += `<circle cx="${x(g.lon)}" cy="${y(g.lat)}" r="${big ? 26 : 16}" fill="#FF8A1F" opacity=".18"/><circle cx="${x(g.lon)}" cy="${y(g.lat)}" r="${big ? 11 : 7}" fill="${big ? '#FFD23F' : '#FF8A1F'}"/>`;
    if (pins === 'label') s += `<g transform="translate(${x(g.lon) + 14},${y(g.lat) - 14})"><rect x="0" y="-22" rx="16" height="34" width="${g.n.length * 11 + 28}" fill="${big ? '#FFD23F' : '#16213A'}" stroke="rgba(244,242,236,.15)"/><text x="14" y="0" font-family="Onest" font-weight="700" font-size="16" fill="${big ? '#070C18' : '#F4F2EC'}">${g.n}</text></g>`; });
  return s + '</svg>';
}
// глобус (ортографическая проекция, центр на Европе)
function globe(D, lon0 = 15, lat0 = 30) {
  const rad = Math.PI / 180, R0 = D / 2 - 6; let s = `<svg viewBox="0 0 ${D} ${D}" width="${D}" height="${D}"><defs><radialGradient id="gl" cx=".35" cy=".3"><stop offset="0" stop-color="#1F2A44"/><stop offset="1" stop-color="#0B1220"/></radialGradient></defs><circle cx="${D / 2}" cy="${D / 2}" r="${R0}" fill="url(#gl)" stroke="rgba(255,210,63,.25)" stroke-width="2"/>`;
  const pr = (lon, lat) => { const l = (lon - lon0) * rad, f = lat * rad, f0 = lat0 * rad; const cosc = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l); if (cosc < 0) return null; return [D / 2 + R0 * Math.cos(f) * Math.sin(l), D / 2 - R0 * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l)), cosc]; };
  land.forEach(([lo, la]) => { const q = pr(lo, la); if (!q) return; const h = near(lo, la, 9); s += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${(2.6 + q[2] * 1.6).toFixed(1)}" fill="${h ? '#FF8A1F' : '#F4F2EC'}" opacity="${h ? 0.9 : (0.1 + q[2] * 0.22).toFixed(2)}"/>`; });
  R.forEach((g, i) => { const q = pr(g.lon, g.lat); if (!q) return; s += `<circle cx="${q[0]}" cy="${q[1]}" r="${i ? 8 : 12}" fill="${i ? '#FF8A1F' : '#FFD23F'}"/><circle cx="${q[0]}" cy="${q[1]}" r="${i ? 18 : 26}" fill="none" stroke="#FFD23F" stroke-opacity=".35" stroke-width="2"/>`; });
  return s + '</svg>';
}

const base = `
#geo .container{position:relative}
.mk{color:#F4F2EC;font-family:'Onest',sans-serif;position:relative}
.mk .h{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;text-transform:uppercase;line-height:.9}
.mk .num{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;line-height:.85}
.mk .grad{background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent}
.mk .mono{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,242,236,.5)}
.mk .pills{display:flex;flex-wrap:wrap;gap:10px}
.mk .pill{padding:10px 18px;border-radius:999px;border:1px solid rgba(244,242,236,.16);font-weight:700;font-size:16px;background:rgba(7,12,24,.6)}
.mk .pill.on{background:${GRAD};color:#070C18;border-color:transparent}
.mk p{margin:0;color:rgba(244,242,236,.75);font-size:17px;line-height:1.45}
`;
const pills = () => `<div class="pills">${R.map((g) => `<span class="pill ${g.id === 'europe' ? 'on' : ''}">${g.n}</span>`).join('')}</div>`;
const txt = 'людей, які виїхали з України, під temporary protection у ЄС';
const variants = {
  // 1 — «Планета знизу»: огромный глобус встаёт из низа блока по центру, текст и пилюли — над ним по центру
  1: { name: 'Планета знизу по центру', hideTitle: true, css: `
.mk1{height:780px;text-align:center;display:flex;flex-direction:column;align-items:center;overflow:hidden;margin-top:-20px}
.mk1 .tt .h{font-size:84px}.mk1 .tt .h span{display:block}
.mk1 .mid{display:flex;align-items:center;gap:26px;margin:22px 0 18px}
.mk1 .mid .num{font-size:96px}.mk1 .mid p{text-align:left;max-width:330px}
.mk1 .g{position:absolute;left:50%;top:330px;transform:translateX(-50%)}
.mk1 .pills{position:relative;z-index:2;justify-content:center}
`, html: () => `<div class="mk mk1"><div class="tt"><div class="h">Аудиторія в Україні<span class="grad">та по всьому світу</span></div></div><div class="mid"><div style="text-align:right"><span class="mono">Обраний напрямок</span><div class="h" style="font-size:40px">Європа</div></div><span class="num grad">4.43M</span><p>${txt}</p></div>${pills()}<div class="g">${globe(1000)}</div></div>` },
  // 2 — «Глобус справа за краєм»: заголовок и регион слева одной колонкой, огромный глобус справа обрезан краем экрана
  2: { name: 'Текст зліва, глобус справа за краєм', hideTitle: true, css: `
.mk2{height:780px;display:grid;grid-template-columns:780px 1fr;align-items:center}
.mk2 .col{display:flex;flex-direction:column;gap:20px;position:relative;z-index:2}
.mk2 .col .tt{font-size:84px}.mk2 .col .tt span{display:block}
.mk2 .col .num{font-size:120px}
.mk2 .g{position:absolute;right:-420px;top:50%;transform:translateY(-50%)}
`, html: () => `<div class="mk mk2"><div class="col"><div class="h tt">Аудиторія в Україні<span class="grad">та по всьому світу</span></div><div style="display:flex;align-items:flex-end;gap:24px;margin-top:20px"><div><span class="mono">Обраний напрямок</span><div class="h" style="font-size:46px">Європа</div></div><span class="num grad">4.43M</span></div><p style="max-width:560px">${txt} · українці + міжнародні сегменти</p>${pills()}</div><div class="g">${globe(860)}</div></div>` },
  // 3 — «Глобус у центрі, регіони навколо»: глобус по центру, пилюли регионов по кругу вокруг, карточка выбранного рядом
  3: { name: 'Глобус у центрі, регіони по колу', hideTitle: false, css: `
.mk3{height:560px}
.mk3 .g{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}
.mk3 .pill{position:absolute;transform:translate(-50%,-50%)}
.mk3 .card{position:absolute;right:0;top:50%;transform:translateY(-50%);padding:24px 28px;border-radius:24px;background:${GRAD};color:#070C18;max-width:320px}
.mk3 .card p{color:rgba(7,12,24,.75)}.mk3 .card .num{font-size:84px}
`, html: () => { const pos = [[50, 4], [70, 14], [80, 40], [74, 70], [50, 96], [26, 70], [20, 40]]; return `<div class="mk mk3"><div class="g">${globe(520)}</div>${R.map((g, i) => `<span class="pill ${g.id === 'europe' ? 'on' : ''}" style="left:${pos[i][0] - 8}%;top:${pos[i][1]}%">${g.n}</span>`).join('')}<div class="card"><span class="mono" style="color:rgba(7,12,24,.6)">Європа</span><div class="num">4.43M</div><p>${txt}</p></div></div>`; } },
  // 4 — «Список зліва, глобус справа»: слева вертикальный список регионов, выбранный раскрыт с цифрой; справа большой глобус
  4: { name: 'Список регіонів зліва, глобус справа', hideTitle: false, css: `
.mk4{height:560px;display:grid;grid-template-columns:1fr 560px;gap:40px;align-items:center}
.mk4 .list{display:flex;flex-direction:column}
.mk4 .row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid rgba(244,242,236,.12)}
.mk4 .row .h{font-size:34px;color:rgba(244,242,236,.55)}
.mk4 .row small{color:rgba(244,242,236,.5)}
.mk4 .row.on{padding:18px 22px;border-radius:22px;background:rgba(255,210,63,.08);border:1px solid rgba(255,210,63,.4);margin:6px 0}
.mk4 .row.on .h{color:#FFD23F;font-size:46px}.mk4 .row.on .num{font-size:70px}
`, html: () => `<div class="mk mk4"><div class="list">${R.map((g) => g.id === 'europe' ? `<div class="row on"><div><div class="h">${g.n}</div><small>${txt}</small></div><span class="num grad">4.43M</span></div>` : `<div class="row"><span class="h">${g.n}</span><small>${g.t}</small></div>`).join('')}</div><div>${globe(540)}</div></div>` },
};
(async () => {
  const b = await p.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const [key, v] of Object.entries(variants)) {
    const pg = await b.newPage(); await pg.setViewport({ width: 1903, height: 937 });
    await pg.evaluateOnNewDocument(() => { try { localStorage.setItem('eleads-intro', String(Date.now())); } catch {} });
    await pg.goto('http://localhost:5173/?nomotion=1', { waitUntil: 'networkidle0' }); await pg.evaluate(() => document.fonts.ready);
    await pg.addStyleTag({ content: base + v.css }); await pg.evaluate((x) => { window.__hideTitle = x; }, !!v.hideTitle);
    const ok = await pg.evaluate((html) => {
      const s = document.querySelector('#geo'); if (!s) return 'no';
      const h = s.querySelector('h2'); const head = h.closest('.section__head') || h; if (window.__hideTitle) head.style.display = 'none';
      [...s.querySelector('.container').children].forEach((c) => { if (!c.contains(h)) c.remove(); });
      const d = document.createElement('div'); d.innerHTML = html; s.querySelector('.container').appendChild(d.firstElementChild);
      window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 60); return { secH: Math.round(s.getBoundingClientRect().height), sw: document.documentElement.scrollWidth };
    }, v.html());
    await new Promise((r) => setTimeout(r, 700));
    await pg.screenshot({ path: path.join(OUT, `L-${key}.png`) }); console.log(key, v.name, JSON.stringify(ok)); await pg.close();
  }
  await b.close();
})();
