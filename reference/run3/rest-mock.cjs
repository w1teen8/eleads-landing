// Блоки 11–14: по три варианта оформления каждого. Только картинки; тексты — из словарей / faq.json.
const p = require('puppeteer-core'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '..', 'rest-options'); fs.mkdirSync(OUT, { recursive: true });
const ROOT = 'C:/Users/admin/Desktop/claude/eLeads';
const D = JSON.parse(fs.readFileSync(`${ROOT}/src/data/content.ua.json`, 'utf8'));
const F = JSON.parse(fs.readFileSync(`${ROOT}/src/data/faq.json`, 'utf8')).items;
const GRAD = 'linear-gradient(100deg,#FFD23F 0%,#FF8A1F 100%)';
const E = D.ecosystem, M = D.materials, C = D.cta;
const n = (i) => String(i + 1).padStart(2, '0');
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const PLANE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.4 3.6 2.9 10.7c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.6c.3.9 1.4 1.1 2 .4l2.6-2.6 4.6 3.4c.8.6 1.9.1 2.1-.8l3.1-14.6c.3-1.2-.9-2.2-2.4-1.6Zm-3.6 4.1-8.4 7.6-.3 3.3-1.4-4.5 9.6-6.1c.4-.3.8.2.5.5Z"/></svg>';
const PH = '/img/photo/volodymyr-cta-900.webp';
const base = `
.mk{height:560px;color:#F4F2EC;font-family:'Onest',sans-serif;position:relative}
.mk .h{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;text-transform:uppercase;line-height:.92}
.mk .num{font-family:'Sofia Sans Extra Condensed',sans-serif;font-weight:900;line-height:.9}
.mk .grad{background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent}
.mk .mono{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,242,236,.5)}
.mk p{margin:0;color:rgba(244,242,236,.72);line-height:1.5}
.mk .card{border-radius:26px;background:#1A2132;border:1px solid rgba(244,242,236,.1)}
.mk .arr{width:46px;height:46px;border-radius:50%;background:#FFD23F;color:#070C18;display:grid;place-items:center;flex:none}.mk .arr svg{width:46%;height:46%}
.mk .btn{display:inline-flex;align-items:center;gap:14px;height:62px;padding:0 8px 0 28px;border-radius:999px;background:${GRAD};color:#070C18;font-weight:700;font-size:18px}
.mk .btn .arr{background:#070C18;color:#FFD23F}
.mk .tbd{color:rgba(244,242,236,.45);font-style:italic}
`;
const S = {
  ecosystem: {
    // A — «Шлях-конвеєр»: шесть этапов пути крупно в ряд со стрелками, под каждым — услуги этого этапа
    A: ['Шлях клієнта з послугами під кожним кроком', `
.eA{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}
.eA .st{display:flex;flex-direction:column;gap:12px}
.eA .st .hd{padding:20px;border-radius:22px;background:#1A2132;border:1px solid rgba(244,242,236,.1);position:relative}
.eA .st .hd .h{font-size:38px}.eA .st .hd .num{font-size:22px}
.eA .st.on .hd{background:${GRAD};color:#070C18;border:0}.eA .st.on .num{color:#070C18;background:none;-webkit-background-clip:border-box;background-clip:border-box}
.eA .st .hd::after{content:"→";position:absolute;right:-16px;top:50%;transform:translateY(-50%);color:#FFD23F;font-size:22px;z-index:2}.eA .st:last-child .hd::after{display:none}
.eA .sv{padding:12px 14px;border-radius:14px;border:1px solid rgba(244,242,236,.1);font-weight:700;font-size:15px}.eA .sv small{display:block;font-weight:400;color:rgba(244,242,236,.55);font-size:12px;margin-top:3px}
`, () => { const map = [[0, 1, 2], [3], [4], [5, 6], [7], [8]]; return `<div class="mk eA">${E.flow.map((f, i) => `<div class="st ${i === 1 ? 'on' : ''}"><div class="hd"><span class="num grad">${n(i)}</span><div class="h">${f}</div></div>${map[i].map((k) => `<div class="sv">${E.services[k].name}<small>${E.services[k].text}</small></div>`).join('')}</div>`).join('')}</div>`; }],
    // B — «Орбіти»: в центре «Ваш бізнес», вокруг на двух орбитах девять услуг пилюлями, справа описание выбранной
    B: ['Орбіти послуг навколо вашого бізнесу', `
.eB{display:grid;grid-template-columns:620px 1fr;gap:60px;align-items:center}
.eB .orb{position:relative;width:560px;height:560px}
.eB .ring{position:absolute;border-radius:50%;border:1.5px dashed rgba(255,210,63,.3);left:50%;top:50%;transform:translate(-50%,-50%)}
.eB .core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:150px;height:150px;border-radius:50%;background:${GRAD};color:#070C18;display:grid;place-items:center;text-align:center;font:900 26px/0.95 'Sofia Sans Extra Condensed';text-transform:uppercase;box-shadow:0 0 70px rgba(255,138,31,.5)}
.eB .pl{position:absolute;transform:translate(-50%,-50%);padding:10px 16px;border-radius:999px;background:#1A2132;border:1px solid rgba(244,242,236,.16);font-weight:700;font-size:14px;white-space:nowrap}
.eB .pl.on{background:#FFD23F;color:#070C18;border:0}
.eB .side .h{font-size:76px;margin:6px 0 14px}.eB .side p{font-size:20px;max-width:620px}
.eB .flow{display:flex;gap:8px;flex-wrap:wrap;margin-top:28px}.eB .flow span{font:700 13px 'JetBrains Mono';padding:6px 10px;border-radius:8px;background:rgba(244,242,236,.06);color:rgba(244,242,236,.6)}
`, () => { const pos = (i) => { const inner = i < 4, k = inner ? i : i - 4, cnt = inner ? 4 : 5, r = inner ? 150 : 255, a = (k / cnt) * 2 * Math.PI - Math.PI / 2 + (inner ? 0.4 : 0); return [280 + r * Math.cos(a), 280 + r * Math.sin(a)]; }; return `<div class="mk eB"><div class="orb"><span class="ring" style="width:300px;height:300px"></span><span class="ring" style="width:510px;height:510px"></span><span class="core">Ваш<br>бізнес</span>${E.services.map((s, i) => { const [x, y] = pos(i); return `<span class="pl ${i === 0 ? 'on' : ''}" style="left:${x}px;top:${y}px">${s.name}</span>`; }).join('')}</div><div class="side"><span class="mono">Послуга</span><div class="h grad">${E.services[0].name}</div><p>${E.services[0].text}</p><div class="flow">${E.flow.map((f) => `<span>${f}</span>`).join('<span style="background:none">→</span>')}</div></div></div>`; }],
    // C — «Табло послуг»: слева большой номер и шаг, справа девять услуг сеткой 3×3, наведённая раскрывается
    C: ['Сітка 3×3 з великим номером', `
.eC{display:grid;grid-template-columns:420px 1fr;gap:40px}
.eC .l{display:flex;flex-direction:column;justify-content:space-between}
.eC .l .num{font-size:220px}.eC .l .h{font-size:56px}
.eC .flow{display:flex;flex-direction:column;gap:6px}.eC .flow span{display:flex;gap:10px;align-items:center;font-weight:700;color:rgba(244,242,236,.45)}.eC .flow span.on{color:#FFD23F}.eC .flow span::before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor}
.eC .g{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:12px}
.eC .s{border-radius:20px;background:#1A2132;border:1px solid rgba(244,242,236,.1);padding:18px 20px;display:flex;flex-direction:column;justify-content:space-between}
.eC .s .h{font-size:28px}.eC .s p{font-size:13px}
.eC .s.on{background:${GRAD};color:#070C18;border:0}.eC .s.on p{color:rgba(7,12,24,.75)}
`, () => `<div class="mk eC"><div class="l"><div><span class="mono">9 послуг · 1 підрядник</span><div class="num grad">09</div></div><div class="flow">${E.flow.map((f, i) => `<span class="${i < 2 ? 'on' : ''}">${f}</span>`).join('')}</div></div><div class="g">${E.services.map((s, i) => `<div class="s ${i === 0 ? 'on' : ''}"><div class="h">${s.name}</div><p>${s.text}</p></div>`).join('')}</div></div>`],
  },
  materials: {
    // A — «Пости як у Telegram»: четыре карточки-поста канала, как превью сообщений с обложкой и счётчиком
    A: ['Картки-пости, як у каналі Telegram', `
.mA{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.mA .po{border-radius:22px;background:#111A2C;border:1px solid rgba(244,242,236,.1);overflow:hidden;display:flex;flex-direction:column}
.mA .cv{height:230px;background:linear-gradient(135deg,#1C2538,#0B1220);display:grid;place-items:center;position:relative}
.mA .po.on .cv{background:${GRAD}}
.mA .cv .h{font-size:46px;text-align:center;padding:0 20px}.mA .po.on .cv .h{color:#070C18}
.mA .bd{padding:18px 20px;display:flex;flex-direction:column;gap:12px;flex:1}
.mA .ch{display:flex;align-items:center;gap:10px}.mA .ch i{width:30px;height:30px;border-radius:50%;background:${GRAD}}.mA .ch b{font-size:14px}.mA .ch small{color:rgba(244,242,236,.45);font-size:12px;margin-left:auto}
.mA .bd .t{font-weight:700;font-size:17px;line-height:1.35}
.mA .rd{margin-top:auto;padding:12px;border-radius:12px;background:rgba(255,210,63,.1);color:#FFD23F;font-weight:700;text-align:center;font-size:14px}
`, () => `<div class="mk mA">${M.items.map((it, i) => `<div class="po ${i === 0 ? 'on' : ''}"><div class="cv"><span class="h">${i === 0 ? '8 способів' : 'Пост'}</span></div><div class="bd"><div class="ch"><i></i><b>eLeads</b><small>пост</small></div><div class="t ${it.title === 'уточнити' ? 'tbd' : ''}">${it.title}</div><div class="rd">${M.read} ↗</div></div></div>`).join('')}</div>`],
    // B — «Головний + список»: слева один большой пост, справа список остальных строками
    B: ['Головний матеріал і список', `
.mB{display:grid;grid-template-columns:1.25fr 1fr;gap:24px}
.mB .big{border-radius:30px;background:${GRAD};color:#070C18;padding:38px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
.mB .big .h{font-size:84px;max-width:640px}
.mB .big .mono{color:rgba(7,12,24,.6)}
.mB .big .pl{position:absolute;right:-40px;top:-40px;width:300px;height:300px;color:rgba(7,12,24,.1)}.mB .big .pl svg{width:100%;height:100%}
.mB .list{display:flex;flex-direction:column}
.mB .li{flex:1;display:flex;align-items:center;gap:20px;border-top:1px solid rgba(244,242,236,.12);padding:0 4px}
.mB .li .num{font-size:44px}.mB .li .t{font-size:22px;font-weight:700;flex:1}
.mB .li .arr{background:transparent;border:1px solid rgba(244,242,236,.2);color:#F4F2EC}
`, () => `<div class="mk mB"><div class="big"><span class="pl">${PLANE}</span><span class="mono">Пост · Telegram</span><div class="h">${M.items[0].title}</div><span class="btn" style="background:#070C18;color:#FFD23F;align-self:flex-start">${M.read} <span class="arr" style="background:#FFD23F;color:#070C18">${ARROW}</span></span></div><div class="list">${M.items.slice(1).map((it, i) => `<div class="li"><span class="num grad">${n(i + 1)}</span><span class="t tbd">${it.title}</span><span class="arr">${ARROW}</span></div>`).join('')}<div class="li"><span class="num grad">+</span><span class="t">Усі матеріали в каналі</span><span class="arr" style="background:#FFD23F;color:#070C18;border:0">${ARROW}</span></div></div></div>`],
    // C — «Телефон із каналом»: телефон с открытым каналом eLeads (как на экране 04), справа список постов — клик прокручивает ленту в телефоне
    C: ['Телефон з каналом, як на екрані 04', `
.mC{display:grid;grid-template-columns:1fr 360px 1fr;gap:50px;align-items:center}
.mC .ph{width:320px;height:560px;border-radius:44px;background:#0B1220;border:8px solid #1E293B;box-shadow:0 40px 80px -40px rgba(0,0,0,.9);overflow:hidden;position:relative}
.mC .ph .bar{height:74px;background:#111A2C;display:flex;align-items:flex-end;gap:10px;padding:0 18px 12px}.mC .ph .bar i{width:34px;height:34px;border-radius:50%;background:${GRAD}}.mC .ph .bar b{font-size:15px}.mC .ph .bar small{display:block;color:rgba(244,242,236,.5);font-size:11px}
.mC .ph .feed{padding:14px;display:flex;flex-direction:column;gap:10px}
.mC .ph .msg{border-radius:16px 16px 16px 5px;background:#16213A;overflow:hidden}.mC .ph .msg .cv{height:110px;background:linear-gradient(135deg,#1C2538,#0B1220)}.mC .ph .msg.on .cv{background:${GRAD}}.mC .ph .msg p{padding:10px 12px;font-size:12px;color:#F4F2EC}
.mC .li{display:flex;flex-direction:column;gap:10px}
.mC .it{padding:18px 20px;border-radius:18px;border:1px solid rgba(244,242,236,.12);font-weight:700;font-size:18px}.mC .it.on{background:${GRAD};color:#070C18;border:0}
`, () => `<div class="mk mC"><div class="li">${M.items.slice(0, 2).map((it, i) => `<div class="it ${i === 0 ? 'on' : ''} ${it.title === 'уточнити' ? 'tbd' : ''}">${it.title}</div>`).join('')}</div><div class="ph"><div class="bar"><i></i><span><b>eLeads</b><small>канал</small></span></div><div class="feed">${M.items.slice(0, 3).map((it, i) => `<div class="msg ${i === 0 ? 'on' : ''}"><div class="cv"></div><p>${it.title}</p></div>`).join('')}</div></div><div class="li">${M.items.slice(2).map((it) => `<div class="it tbd">${it.title}</div>`).join('')}<span class="btn" style="align-self:flex-start;margin-top:8px">Відкрити канал <span class="arr">${ARROW}</span></span></div></div>`],
  },
  faq: {
    // A — «Чат питань»: вопросы как сообщения посетителя справа, ответ Володимира слева с аватаром
    A: ['Питання й відповіді як переписка', `
.fA{display:grid;grid-template-columns:1fr 1.1fr;gap:34px}
.fA .qs{display:flex;flex-direction:column;gap:8px;overflow:hidden}
.fA .q{padding:14px 18px;border-radius:16px;border:1px solid rgba(244,242,236,.12);font-weight:700;font-size:16px;display:flex;justify-content:space-between;gap:10px}.fA .q.on{background:${GRAD};color:#070C18;border:0}
.fA .chat{border-radius:28px;background:#0B1220;border:1px solid rgba(244,242,236,.08);padding:30px;display:flex;flex-direction:column;justify-content:flex-end;gap:14px}
.fA .me{align-self:flex-end;max-width:76%;padding:14px 18px;border-radius:20px 20px 6px 20px;background:${GRAD};color:#070C18;font-weight:700}
.fA .he{display:flex;gap:12px;align-items:flex-end}.fA .he img{width:52px;height:52px;border-radius:50%;object-fit:cover;object-position:50% 15%}
.fA .he .b{max-width:78%;padding:16px 20px;border-radius:20px 20px 20px 6px;background:#16213A;font-size:17px;line-height:1.5}.fA .he .b b{display:block;color:#FFD23F;font-size:14px;margin-bottom:4px}
.fA .typing{color:rgba(244,242,236,.4);font-size:13px;margin-left:64px}
`, () => `<div class="mk fA"><div class="qs">${F.slice(0, 9).map((f, i) => `<div class="q ${i === 0 ? 'on' : ''}">${f.q.ua}<span>${i === 0 ? '↗' : '+'}</span></div>`).join('')}</div><div class="chat"><div class="me">${F[0].q.ua}</div><div class="he"><img src="/img/photo/volodymyr-founder-480.webp"><div class="b"><b>Володимир</b>${F[0].a.ua}</div></div><div class="typing">Володимир зазвичай відповідає протягом дня</div></div></div>`],
    // B — «Великі номери»: аккордеон в две колонки, номер вопроса крупно, открытый — жёлтая карточка
    B: ['Акордеон із великими номерами', `
.fB{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;align-content:start}
.fB .it{border-top:1px solid rgba(244,242,236,.12);padding:16px 4px;display:grid;grid-template-columns:60px 1fr 30px;gap:14px;align-items:start}
.fB .it .num{font-size:34px}.fB .it b{font-size:19px;line-height:1.3}.fB .it .pm{font-size:26px;color:#FFD23F;text-align:right}
.fB .it.on{grid-column:1 / -1;border:0;border-radius:24px;background:${GRAD};color:#070C18;padding:24px 28px}.fB .it.on .num{color:#070C18;background:none;-webkit-background-clip:border-box;background-clip:border-box;font-size:60px}.fB .it.on b{font-size:28px}.fB .it.on p{color:rgba(7,12,24,.8);font-size:18px;margin-top:8px}.fB .it.on .pm{color:#070C18}
`, () => `<div class="mk fB">${F.slice(0, 9).map((f, i) => i === 2 ? `<div class="it on"><span class="num">${n(i)}</span><div><b>${f.q.ua}</b><p>${f.a.ua}</p></div><span class="pm">−</span></div>` : `<div class="it"><span class="num grad">${n(i)}</span><b>${f.q.ua}</b><span class="pm">+</span></div>`).join('')}</div>`],
    // C — «Картки, що перевертаються»: 3×3 карточки-вопросы, наведённая переворачивается и показывает ответ
    C: ['Картки, що перевертаються', `
.fC{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:12px}
.fC .c{border-radius:20px;background:#1A2132;border:1px solid rgba(244,242,236,.1);padding:18px 20px;display:flex;flex-direction:column;justify-content:space-between}
.fC .c b{font-size:18px;line-height:1.3}.fC .c .num{font-size:30px}
.fC .c.on{background:${GRAD};color:#070C18;border:0;transform:rotateY(0)}.fC .c.on p{color:rgba(7,12,24,.85);font-size:15px}
.fC .c .ft{display:flex;justify-content:space-between;align-items:center}.fC .c .ft small{color:rgba(244,242,236,.4);font-size:12px}
`, () => `<div class="mk fC">${F.slice(0, 9).map((f, i) => i === 4 ? `<div class="c on"><span class="mono" style="color:rgba(7,12,24,.6)">Відповідь</span><p>${f.a.ua}</p><b style="font-size:14px">${f.q.ua}</b></div>` : `<div class="c"><span class="num grad">${n(i)}</span><b>${f.q.ua}</b><div class="ft"><small>навести — відповідь</small><span style="color:#FFD23F">↻</span></div></div>`).join('')}</div>`],
  },
  cta: {
    // A — «Великий конверт»: огромный заголовок по центру, под ним кнопка, фото Володимира круглое, бумажный самолётик пролетает
    A: ['Великий заголовок по центру з літачком', `
.cA{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:26px;height:640px;margin-top:0}
.cA .h{font-size:150px}.cA .h span{display:block}
.cA .row{display:flex;align-items:center;gap:24px}
.cA .row img{width:84px;height:84px;border-radius:50%;object-fit:cover;object-position:50% 15%;box-shadow:0 0 0 3px #070C18,0 0 0 6px #FFD23F}
.cA p{max-width:640px;font-size:19px}
.cA .pl{position:absolute;right:120px;top:40px;width:120px;height:120px;color:#FFD23F;transform:rotate(-12deg)}.cA .pl svg{width:100%;height:100%}
.cA .trail{position:absolute;right:220px;top:150px;width:520px;height:160px;border-top:3px dashed rgba(255,210,63,.35);border-radius:50% 50% 0 0;transform:rotate(-14deg)}
`, () => `<div class="mk cA"><span class="trail"></span><span class="pl">${PLANE}</span><div class="h">Обговоримо<span class="grad">ваш проєкт?</span></div><p>${C.text}</p><div class="row"><img src="/img/photo/volodymyr-founder-480.webp"><span class="btn">${C.button} <span class="arr">${ARROW}</span></span></div></div>`],
    // B — «Чат з Володимиром»: слева заголовок и текст, справа окно чата Telegram с Володимиром и полем ввода, кнопка — «Надіслати»
    B: ['Вікно чату з Володимиром', `
.cB{display:grid;grid-template-columns:1fr 560px;gap:60px;align-items:center;height:620px;margin-top:0}
.cB .h{font-size:120px}.cB .h span{display:block}.cB p{font-size:20px;max-width:620px;margin:20px 0 30px}
.cB .win{border-radius:30px;background:#0B1220;border:1px solid rgba(244,242,236,.1);overflow:hidden;box-shadow:0 40px 80px -40px rgba(0,0,0,.9)}
.cB .top{display:flex;gap:14px;align-items:center;padding:18px 22px;background:#111A2C}.cB .top img{width:52px;height:52px;border-radius:50%;object-fit:cover;object-position:50% 15%}.cB .top b{display:block}.cB .top small{color:#FFD23F;font-size:13px}
.cB .body{padding:24px;display:flex;flex-direction:column;gap:12px;min-height:280px;justify-content:flex-end}
.cB .he{max-width:80%;padding:14px 18px;border-radius:20px 20px 20px 6px;background:#16213A;font-size:16px;line-height:1.5}
.cB .inp{display:flex;gap:10px;align-items:center;padding:14px 18px;border-top:1px solid rgba(244,242,236,.08)}.cB .inp span{flex:1;color:rgba(244,242,236,.4)}.cB .inp .arr{width:48px;height:48px}
`, () => `<div class="mk cB"><div><div class="h">Обговоримо<span class="grad">ваш проєкт?</span></div><p>${C.text}</p><span class="btn">${C.button} <span class="arr">${ARROW}</span></span></div><div class="win"><div class="top"><img src="/img/photo/volodymyr-founder-480.webp"><span><b>Володимир Кучер</b><small>@Kucherflow · у мережі</small></span></div><div class="body"><div class="he">Привіт! Розкажіть коротко про проєкт, задачу та GEO — підкажу оптимальний формат.</div></div><div class="inp"><span>Повідомлення…</span><span class="arr">${PLANE.replace('fill="currentColor"', 'fill="currentColor" style="width:50%;height:50%"')}</span></div></div></div>`],
    // C — «Фото на весь екран»: крупное фото Володимира справа во всю высоту, слева заголовок, кнопка и @Kucherflow; бегущая строка внизу
    C: ['Фото на всю висоту + бігуча стрічка', `
.cC{display:grid;grid-template-columns:1.1fr 1fr;gap:0;height:640px;margin-top:0;border-radius:34px;overflow:hidden;background:${GRAD}}
.cC .l{padding:56px;display:flex;flex-direction:column;justify-content:center;gap:24px;color:#070C18}
.cC .l .h{font-size:120px}.cC .l p{color:rgba(7,12,24,.8);font-size:19px;max-width:620px}
.cC .l .btn{background:#070C18;color:#FFD23F;align-self:flex-start}.cC .l .btn .arr{background:#FFD23F;color:#070C18}
.cC .r{background:url(${PH}) 50% 15%/cover;position:relative}
.cC .tape{position:absolute;left:-40px;right:-40px;bottom:30px;transform:rotate(-3deg);background:#070C18;color:#FFD23F;padding:14px 0;white-space:nowrap;font:900 30px 'Sofia Sans Extra Condensed';text-transform:uppercase;letter-spacing:.02em}
`, () => `<div class="mk cC"><div class="l"><div class="h">Обговоримо ваш проєкт?</div><p>${C.text}</p><span class="btn">${C.button} <span class="arr">${ARROW}</span></span><b>@Kucherflow</b></div><div class="r"><div class="tape">${'Написати Володимиру · Telegram Ads · '.repeat(5)}</div></div></div>`],
  },
};
(async () => {
  const b = await p.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const [sec, vars] of Object.entries(S)) for (const [key, [name, css, html]] of Object.entries(vars)) {
    const pg = await b.newPage(); await pg.setViewport({ width: 1903, height: 937 });
    await pg.evaluateOnNewDocument(() => { try { localStorage.setItem('eleads-intro', String(Date.now())); } catch {} });
    await pg.goto('http://localhost:5173/?nomotion=1', { waitUntil: 'networkidle0' }); await pg.evaluate(() => document.fonts.ready);
    await pg.addStyleTag({ content: base + css + `#${sec}{min-height:auto!important}` });
    const ok = await pg.evaluate((sec, h) => {
      const s = document.querySelector('#' + sec); if (!s) return 'no';
      const c = s.querySelector('.container'); const h2 = s.querySelector('h2'); const head = h2.closest('.section__head') || h2;
      [...s.children].forEach((x) => { if (x !== c) x.remove(); }); [...c.children].forEach((x) => { if (!x.contains(h2)) x.remove(); }); c.style.display = 'block'; c.style.gridTemplateColumns = 'none'; s.style.overflow = 'hidden'; const hd = [...c.children][0]; if (hd) { hd.style.maxWidth = 'none'; hd.style.marginBottom = '28px'; }
      if (sec === 'cta') { const hh = [...c.children].find((x) => x.contains(h2)); if (hh) hh.style.display = 'none'; }
      const d = document.createElement('div'); d.innerHTML = h; c.appendChild(d.firstElementChild);
      window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 60); return { secH: Math.round(s.getBoundingClientRect().height), sw: document.documentElement.scrollWidth };
    }, sec, html());
    await new Promise((r) => setTimeout(r, 800));
    await pg.screenshot({ path: path.join(OUT, `${sec}-${key}.png`) }); console.log(sec, key, name, JSON.stringify(ok)); await pg.close();
  }
  await b.close();
})();
