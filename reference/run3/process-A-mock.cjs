// Блок 07 «Процес» — четыре варианта оформления. Только картинки; тексты — из словаря.
const p = require('puppeteer-core'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '..', 'process-options'); fs.mkdirSync(OUT, { recursive: true });
const GRAD = 'linear-gradient(100deg,#FFD23F 0%,#FF8A1F 100%)';
const S = ['Аналізую проєкт', 'Формую стратегію', 'Готую рекламу та погоджую', 'Готую / допрацьовую посадкову', 'Запускаю кампанії', 'Аналізую та оптимізую', 'Масштабую те, що працює'];
const n = (i) => String(i + 1).padStart(2, '0');
const base = `
.mk{height:470px;color:#F4F2EC;font-family:'Onest',sans-serif;position:relative}
.mk .num{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;line-height:.85}
.mk .grad{background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent}
.mk .t{font-weight:700;font-size:19px;line-height:1.3}
`;
const variants = {
  // A — «Сходи»: шаги поднимаются ступенями вверх слева направо; последний — на вершине, акцентом
  A: { name: 'Сходи вгору', css: `
.mkA{display:grid;grid-template-columns:repeat(7,1fr);gap:12px;align-items:end}
.mkA .s{border-radius:22px 22px 0 0;background:rgba(244,242,236,.055);border:1px solid rgba(244,242,236,.1);border-bottom:0;padding:20px 18px;display:flex;flex-direction:column;justify-content:space-between}
.mkA .s .num{font-size:64px}
.mkA .s.last{background:${GRAD};color:#070C18;border:0}
.mkA .s.last .num{background:none;-webkit-background-clip:border-box;background-clip:border-box;color:#070C18}
.mkA .base{position:absolute;left:0;right:0;bottom:-1px;height:2px;background:${GRAD}}
`, html: () => `<div class="mk mkA">${S.map((s, i) => `<div class="s ${i === 6 ? 'last' : ''}" style="height:${150 + i * 50}px"><span class="num ${i === 6 ? '' : 'grad'}">${n(i)}</span><span class="t">${s}</span></div>`).join('')}<span class="base"></span></div>` },
  // B — «Траєкторія»: одна кривая роста через 7 точек, подписи у точек — как линия на карточках кейсов
  B: { name: 'Крива росту', css: `
.mkB svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.mkB .pt{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:10px;width:200px;text-align:center}
.mkB .dot{width:22px;height:22px;border-radius:50%;background:#070C18;border:4px solid #FFD23F;box-shadow:0 0 0 8px rgba(255,210,63,.15)}
.mkB .pt.last .dot{width:34px;height:34px;background:${GRAD};border:0;box-shadow:0 0 0 12px rgba(255,138,31,.2),0 0 40px rgba(255,138,31,.6)}
.mkB .pt .num{font-size:40px}
.mkB .lab{position:absolute;width:190px;text-align:center;transform:translateX(-50%)}
`, html: () => {
    const W = 1700, H = 470; const P = S.map((_, i) => [70 + i * ((W - 140) / 6), H - 70 - Math.pow(i / 6, 1.6) * (H - 160)]);
    let d = `M${P[0][0]} ${P[0][1]}`; for (let i = 1; i < P.length; i++) { const [x0, y0] = P[i - 1], [x1, y1] = P[i]; const cx = (x0 + x1) / 2; d += ` C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`; }
    return `<div class="mk mkB"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" stop-color="#FFD23F"/><stop offset="1" stop-color="#FF8A1F"/></linearGradient><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A1F" stop-opacity=".22"/><stop offset="1" stop-color="#FF8A1F" stop-opacity="0"/></linearGradient></defs><path d="${d} L${P[6][0]} ${H} L${P[0][0]} ${H}Z" fill="url(#fg)"/><path d="${d}" fill="none" stroke="url(#lg)" stroke-width="5" stroke-linecap="round"/></svg>
    ${P.map(([x, y], i) => `<div class="pt ${i === 6 ? 'last' : ''}" style="left:${(x / W) * 100}%;top:${(y / H) * 100}%"><span class="dot"></span></div><div class="lab" style="left:${(x / W) * 100}%;top:calc(${(y / H) * 100}% ${i % 2 ? '+ 30px' : '- 108px'})"><div class="num grad">${n(i)}</div><div class="t">${S[i]}</div></div>`).join('')}</div>`;
  } },
  // C — «Етап у фокусі»: слева большая карточка активного шага (номер на пол-экрана), справа вертикальный список с прогрессом
  C: { name: 'Етап у фокусі', css: `
.mkC{display:grid;grid-template-columns:1.15fr 1fr;gap:28px}
.mkC .big{border-radius:30px;background:${GRAD};color:#070C18;padding:34px 40px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
.mkC .big .num{font-size:300px;line-height:.8;letter-spacing:-.02em}
.mkC .big .t{font-size:34px;max-width:520px}
.mkC .big .of{position:absolute;right:36px;top:34px;font:700 18px 'Onest';opacity:.6}
.mkC .list{display:flex;flex-direction:column;position:relative;padding-left:34px}
.mkC .list::before{content:"";position:absolute;left:9px;top:14px;bottom:14px;width:2px;background:rgba(244,242,236,.14)}
.mkC .list::after{content:"";position:absolute;left:9px;top:14px;height:42%;width:2px;background:${GRAD}}
.mkC .row{flex:1;display:flex;align-items:center;gap:18px;position:relative;opacity:.45}
.mkC .row::before{content:"";position:absolute;left:-31px;width:14px;height:14px;border-radius:50%;background:#070C18;border:2px solid rgba(244,242,236,.3)}
.mkC .row.done{opacity:.75}.mkC .row.done::before{background:#FFD23F;border-color:#FFD23F}
.mkC .row.on{opacity:1}.mkC .row.on::before{width:20px;height:20px;left:-34px;background:${GRAD};border:0;box-shadow:0 0 0 6px rgba(255,138,31,.2)}
.mkC .row .num{font-size:34px;width:48px}
`, html: () => `<div class="mk mkC"><div class="big"><span class="of">03 / 07</span><span class="num">03</span><span class="t">${S[2]}</span></div><div class="list">${S.map((s, i) => `<div class="row ${i < 2 ? 'done' : i === 2 ? 'on' : ''}"><span class="num grad">${n(i)}</span><span class="t">${s}</span></div>`).join('')}</div></div>` },
  // D — «Колода карток»: 7 высоких карточек внахлёст, как разложенные; номер огромный, у последней — акцент
  D: { name: 'Картки віялом', css: `
.mkD{display:flex;align-items:center;justify-content:center}
.mkD .c{width:300px;height:420px;margin-left:-70px;border-radius:28px;padding:26px;background:#1A2132;border:1px solid rgba(244,242,236,.14);display:flex;flex-direction:column;justify-content:space-between;box-shadow:-24px 24px 50px -24px rgba(0,0,0,.85);transform-origin:50% 120%}
.mkD .c:first-child{margin-left:0}
.mkD .c .num{font-size:120px}
.mkD .c.last{background:${GRAD};color:#070C18;border:0}
.mkD .c.last .num{background:none;-webkit-background-clip:border-box;background-clip:border-box;color:#070C18}
`, html: () => `<div class="mk mkD">${S.map((s, i) => `<div class="c ${i === 6 ? 'last' : ''}" style="transform:rotate(${(i - 3) * 4}deg) translateY(${Math.abs(i - 3) * 14}px);z-index:${i}"><span class="num ${i === 6 ? '' : 'grad'}">${n(i)}</span><span class="t">${s}</span></div>`).join('')}</div>` },
};
(async () => {
  const b = await p.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const [key, v] of Object.entries(variants)) {
    const pg = await b.newPage(); await pg.setViewport({ width: 1903, height: 937 });
    await pg.evaluateOnNewDocument(() => { try { localStorage.setItem('eleads-intro', String(Date.now())); } catch {} });
    await pg.goto('http://localhost:5173/?nomotion=1', { waitUntil: 'networkidle0' }); await pg.evaluate(() => document.fonts.ready);
    await pg.addStyleTag({ content: base + v.css });
    const ok = await pg.evaluate((html) => {
      const s = document.querySelector('#process'); if (!s) return 'no section';
      const list = s.querySelector('ol, ul, [class*="process__steps"], [class*="process__list"], [class*="process__grid"]');
      if (!list) return 'no list'; list.outerHTML = html;
      window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 60); return { secH: Math.round(s.getBoundingClientRect().height), sw: document.documentElement.scrollWidth };
    }, v.html());
    await new Promise((r) => setTimeout(r, 700));
    await pg.screenshot({ path: path.join(OUT, `process-${key}.png`) }); console.log(key, v.name, JSON.stringify(ok)); await pg.close();
  }
  await b.close();
})();
