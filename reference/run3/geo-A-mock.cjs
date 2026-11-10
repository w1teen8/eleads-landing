// Блок 08 «GEO» — четыре варианта оформления. Только картинки. Точки суши — src/data/geo-dots.json.
const p = require('puppeteer-core'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '..', 'geo-options'); fs.mkdirSync(OUT, { recursive: true });
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
.mk{height:470px;color:#F4F2EC;font-family:'Onest',sans-serif;position:relative}
.mk .h{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;text-transform:uppercase;line-height:.9}
.mk .num{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;line-height:.85}
.mk .grad{background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent}
.mk .mono{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,242,236,.5)}
`;
const variants = {
  // A — «Глобус»: крупный точечный глобус, повёрнутый к Европе; справа выбранный регион крупно + пилюли регионов
  A: { name: 'Глобус', css: `
.mkA{display:grid;grid-template-columns:520px 1fr;gap:50px;align-items:center}
.mkA .side{display:flex;flex-direction:column;gap:22px}
.mkA .side .num{font-size:150px}
.mkA .side .h{font-size:54px}
.mkA .pills{display:flex;flex-wrap:wrap;gap:10px}
.mkA .pill{padding:10px 18px;border-radius:999px;border:1px solid rgba(244,242,236,.16);font-weight:700;font-size:16px}
.mkA .pill.on{background:${GRAD};color:#070C18;border-color:transparent}
`, html: () => `<div class="mk mkA"><div>${globe(470)}</div><div class="side"><span class="mono">Обраний напрямок</span><div class="h">Європа</div><div class="num grad">4.43M</div><p style="margin:0;font-size:18px;color:rgba(244,242,236,.75);max-width:520px">людей, які виїхали з України, під temporary protection у ЄС · українці + міжнародні сегменти</p><div class="pills">${R.map((g) => `<span class="pill ${g.id === 'europe' ? 'on' : ''}">${g.n}</span>`).join('')}</div></div></div>` },
  // B — «Маршрути з України»: карта на всю ширину, из Украины пунктирные дуги-маршруты ко всем регионам, подписи на карте
  B: { name: 'Маршрути з України', css: `
.mkB{border-radius:30px;background:rgba(244,242,236,.04);border:1px solid rgba(244,242,236,.1);overflow:hidden;padding:10px 30px}
.mkB .leg{position:absolute;left:34px;bottom:26px;display:flex;gap:22px}
.mkB .card{position:absolute;right:34px;bottom:26px;padding:18px 22px;border-radius:20px;background:#0B1220;border:1px solid rgba(255,210,63,.4)}
.mkB .card .num{font-size:52px}
`, html: () => `<div class="mk mkB">${flat(1640, 450, { arcs: true, pins: 'label' })}<div class="card"><span class="mono">Європа</span><div class="num grad">4.43M</div><small style="color:rgba(244,242,236,.7)">українців під temporary protection у ЄС</small></div></div>` },
  // C — «Табло вильотів»: слева строки как табло аэропорта «KYIV → LONDON · TIER-1», справа карта поменьше
  C: { name: 'Табло вильотів', css: `
.mkC{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.mkC .board{border-radius:26px;background:#0B1220;border:1px solid rgba(244,242,236,.1);padding:22px 26px;display:flex;flex-direction:column}
.mkC .head{display:grid;grid-template-columns:1.1fr 1fr 1fr;padding-bottom:10px;border-bottom:1px solid rgba(244,242,236,.12)}
.mkC .row{flex:1;display:grid;grid-template-columns:1.1fr 1fr 1fr;align-items:center;border-bottom:1px solid rgba(244,242,236,.06)}
.mkC .row .fl{display:flex;gap:3px}
.mkC .row .fl i{font-style:normal;display:inline-grid;place-items:center;width:22px;height:34px;border-radius:4px;background:#1A2132;font:900 22px 'Sofia Sans Extra Condensed';color:#FFD23F;box-shadow:inset 0 -17px 0 rgba(0,0,0,.18)}
.mkC .row.on .fl i{background:#FFD23F;color:#070C18}
.mkC .row b{font-size:15px}.mkC .row span{font-size:14px;color:rgba(244,242,236,.6)}
.mkC .map{border-radius:26px;background:rgba(244,242,236,.04);border:1px solid rgba(244,242,236,.1);padding:20px;display:flex;align-items:center}
`, html: () => `<div class="mk mkC"><div class="board"><div class="head mono"><span>Напрямок</span><span>Аудиторія</span><span>Статус</span></div>${R.map((g) => `<div class="row ${g.id === 'europe' ? 'on' : ''}"><span class="fl">${[...g.n.toUpperCase().replace(/\s/g, '')].slice(0, 7).map((c) => `<i>${c}</i>`).join('')}</span><span>${g.t}</span><b style="color:${g.id === 'europe' ? '#FFD23F' : '#F4F2EC'}">${g.id === 'europe' ? '4.43M' : g.id === 'ukraine' ? 'UA' : 'GO'}</b></div>`).join('')}</div><div class="map">${flat(760, 400, { r: 2.6, arcs: true })}</div></div>` },
  // D — «Карта-герой»: карта на весь блок без рамки, подписи регионов прямо на карте пилюлями, Україна — жёлтая
  D: { name: 'Карта без списку', css: `
.mkD{display:flex;align-items:center;justify-content:center}
.mkD .wrap{width:100%;height:100%}
.mkD .card{position:absolute;left:0;bottom:10px;padding:20px 24px;border-radius:22px;background:${GRAD};color:#070C18}
.mkD .card .num{font-size:64px}
`, html: () => `<div class="mk mkD"><div class="wrap">${flat(1700, 470, { r: 3.6, pins: 'label' })}</div><div class="card"><span class="mono" style="color:rgba(7,12,24,.65)">Європа</span><div class="num">4.43M</div><small>українців під temporary protection у ЄС</small></div></div>` },
};
(async () => {
  const b = await p.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const [key, v] of Object.entries(variants)) {
    const pg = await b.newPage(); await pg.setViewport({ width: 1903, height: 937 });
    await pg.evaluateOnNewDocument(() => { try { localStorage.setItem('eleads-intro', String(Date.now())); } catch {} });
    await pg.goto('http://localhost:5173/?nomotion=1', { waitUntil: 'networkidle0' }); await pg.evaluate(() => document.fonts.ready);
    await pg.addStyleTag({ content: base + v.css });
    const ok = await pg.evaluate((html) => {
      const s = document.querySelector('#geo'); if (!s) return 'no';
      const h = s.querySelector('h2'); const head = h.closest('.section__head') || h;
      [...s.querySelector('.container').children].forEach((c) => { if (!c.contains(h)) c.remove(); });
      const d = document.createElement('div'); d.innerHTML = html; s.querySelector('.container').appendChild(d.firstElementChild);
      window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 60); return { secH: Math.round(s.getBoundingClientRect().height), sw: document.documentElement.scrollWidth };
    }, v.html());
    await new Promise((r) => setTimeout(r, 700));
    await pg.screenshot({ path: path.join(OUT, `geo-${key}.png`) }); console.log(key, v.name, JSON.stringify(ok)); await pg.close();
  }
  await b.close();
})();
