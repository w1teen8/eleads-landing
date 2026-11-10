const IC = [
  '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.500 3 14.500 0 18M12 3c-3 3.500-3 14.500 0 18"/>',
  '<path d="M12 20s-7.500-4.600-7.500-10A4.300 4.300 0 0 1 12 7.200 4.300 4.300 0 0 1 19.500 10c0 5.400-7.500 10-7.500 10z"/>',
  '<path d="M9 3 7 21M17 3l-2 18M4 8.500h17M3 15.500h17"/>',
  '<path d="M4 10v4h3l8 5V5L7 10zM18.500 9a4 4 0 0 1 0 6"/>',
  '<circle cx="9" cy="8.500" r="3.500"/><path d="M2.500 20c0-3.600 3-5.500 6.500-5.500s6.500 1.900 6.500 5.500"/><circle cx="17.500" cy="9.500" r="2.500"/><path d="M17 14.600c2.600.2 4.500 1.700 4.500 4.400"/>',
];
const ico = (i) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${IC[i]}</svg>`;
const ring = (D, share) => { const r = D / 2 - 3, c = 2 * Math.PI * r; return `<svg class="prog" width="${D}" height="${D}" viewBox="0 0 ${D} ${D}"><defs><linearGradient id="pg" x1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD23F"/><stop offset="1" stop-color="#FF8A1F"/></linearGradient></defs><circle cx="${D / 2}" cy="${D / 2}" r="${r}" fill="none" stroke="rgba(244,242,236,.12)" stroke-width="3"/><circle cx="${D / 2}" cy="${D / 2}" r="${r}" fill="none" stroke="url(#pg)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c * share).toFixed(0)} ${c.toFixed(0)}" transform="rotate(-90 ${D / 2} ${D / 2})"/></svg>`; };
const dialCss = `
.mk .dial{position:relative;border-radius:50%;box-shadow:inset 0 0 0 50px rgba(244,242,236,.035)}
.mk .dial .prog{position:absolute;inset:0}
.mk .nd{position:absolute;width:76px;height:76px;margin:-38px;border-radius:50%;background:#1A2132;border:1px solid rgba(244,242,236,.16);display:grid;place-items:center;color:rgba(244,242,236,.7);z-index:2}
.mk .nd .ic{width:32px;height:32px}
.mk .nd.on{width:100px;height:100px;margin:-50px;background:${GRAD};color:#070C18;border:0;box-shadow:0 0 0 10px rgba(255,138,31,.16),0 0 50px rgba(255,138,31,.5)}.mk .nd.on .ic{width:44px;height:44px}
`;
const variants = {
  // 1 — диск по центру, подписи всех шести вокруг него, выбранное описание — в центре диска
  1: { name: 'Диск по центру, підписи навколо', css: dialCss + `
.mk1 .dial{position:absolute;left:50%;top:50%;width:520px;height:520px;margin:-260px}
.mk1 .mid{position:absolute;inset:92px;border-radius:50%;background:#131B2B;border:1px solid rgba(244,242,236,.1);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 34px}
.mk1 .mid .num{font-size:84px}.mk1 .mid .h{font-size:44px;margin:2px 0 8px}.mk1 .mid p{font-size:14px}
.mk1 .lb{position:absolute;width:380px}.mk1 .lb .h{font-size:40px;color:rgba(244,242,236,.45)}.mk1 .lb p{font-size:15px;color:rgba(244,242,236,.45)}
.mk1 .lb.r{text-align:right}.mk1 .lb.on .h{color:#FFD23F}.mk1 .lb.on p{color:rgba(244,242,236,.85)}
`, html: () => { const R = 257, cx = 851, cy = 270; return `<div class="mk mk1"><div class="dial">${ring(520, 0.62)}<div class="mid"><span class="num grad">01</span><div class="h">GEO</div><p>${MORES[0]}</p></div>${I.map((_, i) => { const a = (i * 60) * Math.PI / 180; return `<span class="nd ${i === 0 ? 'on' : ''}" style="left:${260 + R * Math.cos(a)}px;top:${260 + R * Math.sin(a)}px">${ico(i)}</span>`; }).join('')}</div>${I.map(([h, t], i) => { const a = (i * 60) * Math.PI / 180, right = Math.cos(a) > 0; const x = cx + (R + 80) * Math.cos(a), y = cy + R * Math.sin(a) * 1.02; return `<div class="lb ${right ? '' : 'r'} ${i === 0 ? 'on' : ''}" style="${right ? `left:${x}px` : `right:${1703 - x}px`};top:${y - 40}px"><div class="h">${h}</div><p>${t}</p></div>`; }).join('')}</div>`; } },
  // 2 — огромная половина диска слева (уходит за край), справа крупно выбранный пункт, с краю — список всех шести с таймером
  2: { name: 'Половина диска зліва, список справа', css: dialCss + `
.mk2{display:grid;grid-template-columns:430px 1fr 430px;align-items:center;gap:40px}
.mk2 .wrap{position:relative;height:540px}
.mk2 .dial{position:absolute;left:-470px;top:-110px;width:760px;height:760px;box-shadow:inset 0 0 0 70px rgba(244,242,236,.035)}
.mk2 .txt .num{font-size:150px}.mk2 .txt .h{font-size:96px;margin:0 0 16px}.mk2 .txt p{font-size:21px;max-width:560px}
.mk2 .li{display:flex;flex-direction:column}
.mk2 .row{padding:16px 0;border-top:1px solid rgba(244,242,236,.12);display:flex;align-items:center;gap:14px;position:relative}
.mk2 .row .num{font-size:24px;width:34px}.mk2 .row .h{font-size:34px;color:rgba(244,242,236,.45)}
.mk2 .row.on .h{color:#FFD23F}.mk2 .row.on::after{content:"";position:absolute;left:0;bottom:-1px;height:3px;width:62%;background:${GRAD}}
`, html: () => { const R = 377; return `<div class="mk mk2"><div class="wrap"><div class="dial">${ring(760, 0.62)}${I.map((_, i) => { const a = ((i - 0) * 30 - 0) * Math.PI / 180 * (i <= 3 ? 1 : 1); const ang = [0, 30, 60, -60, -30, 90][i] * Math.PI / 180; return `<span class="nd ${i === 0 ? 'on' : ''}" style="left:${380 + R * Math.cos(ang)}px;top:${380 + R * Math.sin(ang)}px">${ico(i)}</span>`; }).join('')}</div></div><div class="txt"><span class="num grad">01</span><div class="h">GEO</div><p>${I[0][1]} ${MORES[0]}</p></div><div class="li">${I.map(([h], i) => `<div class="row ${i === 0 ? 'on' : ''}"><span class="num grad">${n(i)}</span><span class="h">${h}</span></div>`).join('')}</div></div>`; } },
  // 3 — три колонки: текст выбранного слева, диск по центру, список шести справа
  3: { name: 'Текст · диск · список', css: dialCss + `
.mk3{display:grid;grid-template-columns:1fr 500px 1fr;gap:60px;align-items:center}
.mk3 .dial{width:500px;height:500px}
.mk3 .mid{position:absolute;inset:104px;border-radius:50%;background:#131B2B;border:1px solid rgba(244,242,236,.1);display:grid;place-items:center}.mk3 .mid .num{font-size:150px}
.mk3 .txt .h{font-size:100px}.mk3 .txt p{font-size:21px;margin-top:14px;max-width:500px}
.mk3 .txt .mono{display:block;margin-bottom:10px}
.mk3 .li{display:flex;flex-direction:column}
.mk3 .row{padding:15px 0;border-top:1px solid rgba(244,242,236,.12);display:flex;align-items:center;gap:14px;position:relative}
.mk3 .row .num{font-size:24px;width:34px}.mk3 .row .h{font-size:34px;color:rgba(244,242,236,.45)}
.mk3 .row.on .h{color:#FFD23F}.mk3 .row.on::after{content:"";position:absolute;left:0;bottom:-1px;height:3px;width:62%;background:${GRAD}}
`, html: () => { const R = 247; return `<div class="mk mk3"><div class="txt"><span class="mono">Спосіб таргетингу</span><div class="h grad">GEO</div><p>${I[0][1]} ${MORES[0]}</p></div><div class="dial">${ring(500, 0.62)}<div class="mid"><span class="num grad">01</span></div>${I.map((_, i) => { const a = (i * 60 - 180) * Math.PI / 180; return `<span class="nd ${i === 0 ? 'on' : ''}" style="left:${250 + R * Math.cos(a)}px;top:${250 + R * Math.sin(a)}px">${ico(i)}</span>`; }).join('')}</div><div class="li">${I.map(([h], i) => `<div class="row ${i === 0 ? 'on' : ''}"><span class="num grad">${n(i)}</span><span class="h">${h}</span></div>`).join('')}</div></div>`; } },
};
