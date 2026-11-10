// Блок 10 «Відгуки + засновник» — четыре варианта. Только картинки. Тексты отзывов — заглушки «уточнити» (реальных нет).
const p = require('puppeteer-core'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '..', 'rev-options'); fs.mkdirSync(OUT, { recursive: true });
const GRAD = 'linear-gradient(100deg,#FFD23F 0%,#FF8A1F 100%)';
const PH = '/img/photo/volodymyr-founder-800.webp';
const FT = 'Привіт, я Володимир — засновник eLeads. 7+ років у digital-маркетингу, $2M+ рекламних бюджетів і 50+ проєктів у різних нішах та GEO. Я особисто беру участь у стратегії та роботі з рекламними кампаніями клієнтів.';
const R = [['Олександр Мухін', 'Експерт', '/img/cases/prosales.webp'], ['Віктор Домбовецький', 'Експерт', ''], ['Monolit', 'Finance / Investments', '/img/cases/monolit.webp'], ['Trackdesk', 'SaaS / B2B', '/img/cases/trackdesk.webp'], ['Finmap', 'Finance / B2B', '/img/cases/finmap.webp']];
const Q = 'Текст відгуку — уточнити. Тут буде цитата клієнта про результат роботи з eLeads.';
const ava = (src, name, cls = 'av') => src ? `<img class="${cls}" src="${src}">` : `<span class="${cls} lt">${name[0]}</span>`;
const stats = `<div class="st"><div><b class="num grad">7+</b><small>років у digital</small></div><div><b class="num grad">$2M+</b><small>рекламних бюджетів</small></div><div><b class="num grad">50+</b><small>проєктів</small></div></div>`;
const base = `
.mk{height:560px;color:#F4F2EC;font-family:'Onest',sans-serif;position:relative}
.mk .h{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;text-transform:uppercase;line-height:.92}
.mk .num{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;line-height:.9}
.mk .grad{background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent}
.mk .mono{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,242,236,.5)}
.mk p{margin:0;color:rgba(244,242,236,.75);line-height:1.5}
.mk .av{width:52px;height:52px;border-radius:50%;object-fit:cover;flex:none}.mk .av.lt{display:grid;place-items:center;background:#FFD23F;color:#070C18;font:900 24px 'Sofia Sans Extra Condensed'}
.mk .st{display:flex;gap:36px}.mk .st b{font-size:46px;display:block}.mk .st small{color:rgba(244,242,236,.6);font-size:14px}
.mk .tbd{color:rgba(244,242,236,.45);font-style:italic}
`;
const V = {
  // A — «Скріни з Telegram»: слева крупное фото основателя с цитатой поверх, справа отзывы как пересланные сообщения в Telegram стопкой
  A: { name: 'Відгуки як повідомлення в Telegram', css: `
.mkA{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.mkA .fd{position:relative;border-radius:30px;overflow:hidden;background:url(${PH}) 50% 20%/cover}
.mkA .fd::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(7,12,24,.95) 82%)}
.mkA .fd .in{position:absolute;left:32px;right:32px;bottom:30px;z-index:1;display:flex;flex-direction:column;gap:16px}
.mkA .fd .h{font-size:44px}.mkA .fd p{font-size:16px}
.mkA .chat{border-radius:30px;background:#0B1220;border:1px solid rgba(244,242,236,.08);padding:26px;display:flex;flex-direction:column;gap:14px;justify-content:center}
.mkA .m{display:flex;gap:12px;align-items:flex-end}.mkA .m.r{flex-direction:row-reverse}
.mkA .b{max-width:78%;padding:14px 18px;border-radius:20px 20px 20px 6px;background:#16213A}.mkA .m.r .b{border-radius:20px 20px 6px 20px}
.mkA .b b{display:block;color:#FFD23F;font-size:14px;margin-bottom:4px}.mkA .b p{font-size:15px}
.mkA .b small{display:block;text-align:right;color:rgba(244,242,236,.4);font-size:11px;margin-top:4px}
.mkA .fw{font-size:11px;color:rgba(244,242,236,.45);margin-bottom:4px}
`, html: () => `<div class="mk mkA"><div class="fd"><div class="in"><span class="mono" style="color:#FFD23F">Засновник eLeads</span><div class="h">За eLeads стоїть особиста експертиза</div><p>${FT}</p>${stats}</div></div><div class="chat">${R.slice(0, 4).map(([n, r, a], i) => `<div class="m ${i % 2 ? 'r' : ''}">${ava(a, n)}<div class="b"><div class="fw">Переслано від</div><b>${n}</b><p class="tbd">${Q}</p><small>10:2${i}</small></div></div>`).join('')}</div></div>` },
  // B — «Стіна, що їде»: слева карточка основателя, справа две колонки отзывов, которые медленно едут вверх/вниз навстречу
  B: { name: 'Стіна відгуків, що рухається', css: `
.mkB{display:grid;grid-template-columns:560px 1fr 1fr;gap:20px;overflow:hidden}
.mkB .fd{border-radius:30px;background:#1A2132;border:1px solid rgba(244,242,236,.1);overflow:hidden;display:flex;flex-direction:column}
.mkB .fd .ph{height:250px;background:url(${PH}) 50% 18%/cover}
.mkB .fd .in{padding:22px 26px;display:flex;flex-direction:column;gap:12px}.mkB .fd .h{font-size:34px}.mkB .fd p{font-size:14px}
.mkB .col{display:flex;flex-direction:column;gap:16px;-webkit-mask-image:linear-gradient(180deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(180deg,transparent,#000 12%,#000 88%,transparent)}
.mkB .c{border-radius:24px;background:#16213A;padding:22px;display:flex;flex-direction:column;gap:14px}
.mkB .c .q{font:900 40px/0.6 'Sofia Sans Extra Condensed';color:#FFD23F}
.mkB .c .who{display:flex;gap:12px;align-items:center}.mkB .c .who b{display:block}.mkB .c .who small{color:rgba(244,242,236,.5)}
.mkB .c.y{background:${GRAD};color:#070C18}.mkB .c.y .q{color:#070C18}.mkB .c.y .tbd,.mkB .c.y small{color:rgba(7,12,24,.65)}
`, html: () => { const card = ([n, r, a], i) => `<div class="c ${i === 1 ? 'y' : ''}"><span class="q">“</span><p class="tbd">${Q}</p><div class="who">${ava(a, n)}<span><b>${n}</b><small>${r}</small></span></div></div>`; return `<div class="mk mkB"><div class="fd"><div class="ph"></div><div class="in"><span class="mono" style="color:#FFD23F">Засновник eLeads</span><div class="h">Володимир Кучер</div><p>${FT}</p>${stats.replace(/font-size:46px/, '')}</div></div><div class="col" style="margin-top:-60px">${[...R, ...R].slice(0, 4).map(card).join('')}</div><div class="col" style="margin-top:-180px">${[...R.slice(2), ...R].slice(0, 5).map(card).join('')}</div></div>`; } },
  // C — «Кружечки»: как видео-кружки Telegram — отзывы круглыми аватарами-«видео» в ряд, выбранный крупно с цитатой; основатель сверху слева
  C: { name: 'Кружечки, як відео в Telegram', css: `
.mkC{display:grid;grid-template-columns:1fr 1.15fr;gap:40px;align-items:center}
.mkC .fd{display:flex;gap:26px;align-items:center}
.mkC .fd .big{width:300px;height:300px;border-radius:50%;background:url(${PH}) 50% 18%/cover;box-shadow:0 0 0 6px #070C18,0 0 0 9px #FFD23F;flex:none;position:relative}
.mkC .fd .big::after{content:"▶";position:absolute;right:16px;bottom:16px;width:58px;height:58px;border-radius:50%;background:${GRAD};color:#070C18;display:grid;place-items:center;font-size:20px}
.mkC .fd .in{display:flex;flex-direction:column;gap:12px}.mkC .fd .h{font-size:40px}.mkC .fd p{font-size:15px}
.mkC .rv{display:flex;flex-direction:column;gap:22px}
.mkC .row{display:flex;gap:18px}
.mkC .cir{width:120px;height:120px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 3px rgba(244,242,236,.15);flex:none}.mkC .cir.lt{display:grid;place-items:center;background:#1A2132;color:#FFD23F;font:900 50px 'Sofia Sans Extra Condensed'}
.mkC .cir.on{box-shadow:0 0 0 4px #070C18,0 0 0 7px #FFD23F}
.mkC .qt{border-radius:24px;background:#16213A;padding:24px 28px;display:flex;flex-direction:column;gap:12px}.mkC .qt b{font-size:22px}.mkC .qt small{color:rgba(244,242,236,.5)}
`, html: () => `<div class="mk mkC"><div class="fd"><div class="big"></div><div class="in"><span class="mono" style="color:#FFD23F">Засновник eLeads</span><div class="h">Володимир Кучер</div><p>${FT}</p></div></div><div class="rv"><span class="mono">Відгуки клієнтів</span><div class="row">${R.map(([n, r, a], i) => a ? `<img class="cir ${i === 0 ? 'on' : ''}" src="${a}">` : `<span class="cir lt">${n[0]}</span>`).join('')}</div><div class="qt"><b>${R[0][0]} <small>· ${R[0][1]}</small></b><p class="tbd">${Q}</p></div>${stats}</div></div>` },
  // D — «Журнальний розворот»: фото основателя справа на всю высоту, слева огромная цитата-отзыв, ниже переключатель авторов
  D: { name: 'Журнальний розворот', css: `
.mkD{display:grid;grid-template-columns:1.3fr 1fr;gap:0;border-radius:30px;overflow:hidden;background:#1A2132;border:1px solid rgba(244,242,236,.1)}
.mkD .l{padding:40px 46px;display:flex;flex-direction:column;justify-content:space-between}
.mkD .l .q{font:900 120px/0.5 'Sofia Sans Extra Condensed';color:#FFD23F}
.mkD .l .big{font:600 30px/1.35 'Onest';color:rgba(244,242,236,.5);font-style:italic;max-width:780px}
.mkD .auth{display:flex;gap:14px;align-items:center}
.mkD .auth .av{width:58px;height:58px}.mkD .auth.on .av{box-shadow:0 0 0 3px #FFD23F}
.mkD .auths{display:flex;gap:26px;border-top:1px solid rgba(244,242,236,.12);padding-top:20px}.mkD .auth b{display:block;font-size:15px}.mkD .auth small{color:rgba(244,242,236,.5);font-size:12px}.mkD .auth:not(.on){opacity:.45}
.mkD .r{position:relative;background:url(${PH}) 50% 18%/cover}
.mkD .r::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(7,12,24,.92))}
.mkD .r .in{position:absolute;left:28px;right:28px;bottom:26px;z-index:1;display:flex;flex-direction:column;gap:10px}.mkD .r .h{font-size:38px}
`, html: () => `<div class="mk mkD"><div class="l"><span class="q">“</span><div class="big">${Q}</div><div class="auths">${R.slice(0, 4).map(([n, r, a], i) => `<div class="auth ${i === 0 ? 'on' : ''}">${ava(a, n)}<span><b>${n}</b><small>${r}</small></span></div>`).join('')}</div></div><div class="r"><div class="in"><span class="mono" style="color:#FFD23F">Засновник eLeads</span><div class="h">Володимир Кучер</div>${stats}</div></div></div>` },
};
(async () => {
  const b = await p.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const [key, v] of Object.entries(V)) {
    const pg = await b.newPage(); await pg.setViewport({ width: 1903, height: 937 });
    await pg.evaluateOnNewDocument(() => { try { localStorage.setItem('eleads-intro', String(Date.now())); } catch {} });
    await pg.goto('http://localhost:5173/?nomotion=1', { waitUntil: 'networkidle0' }); await pg.evaluate(() => document.fonts.ready);
    await pg.addStyleTag({ content: base + v.css });
    const ok = await pg.evaluate((html) => { const s = document.querySelector('#reviews'); const body = s.querySelector('.reviews__body'); body.outerHTML = html; window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 60); return { secH: Math.round(s.getBoundingClientRect().height), sw: document.documentElement.scrollWidth }; }, v.html());
    await new Promise((r) => setTimeout(r, 900));
    await pg.screenshot({ path: path.join(OUT, `rev-${key}.png`) }); console.log(key, v.name, JSON.stringify(ok)); await pg.close();
  }
  await b.close();
})();
