// Карточки кейсов (вариант F) с реальными аватарками: три способа раскраски. Только картинка.
const p = require('puppeteer-core'); const path = require('path'); const fs = require('fs'); const { pathToFileURL } = require('url');
const DIR = path.resolve(__dirname, '..', 'avatars');
const C = [
  { n: 'MONOLIT', ini: 'M', col: '#19B5E0', ink: '#04121A' }, { n: 'ПроSales', ini: 'П', col: '#7B4DFF', ink: '#FFFFFF' },
  { n: '(жабка зі свічками)', ini: 'C', col: '#F2596B', ink: '#1A0508' }, { n: 'Trackdesk', ini: 'T', col: '#12B76A', ink: '#03160D' },
  { n: 'Global Auto Logistic', ini: 'G', col: '#DCE21C', ink: '#12140A' }, { n: '(жінка в червоному)', ini: '?', col: '#C8102E', ink: '#FFFFFF' },
];
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const pal = [['#1A2132', '#F4F2EC', 'rgba(244,242,236,.07)'], ['#FFD23F', '#070C18', 'rgba(7,12,24,.13)'], ['#1A2132', '#F4F2EC', 'rgba(244,242,236,.07)'], ['#FF8A1F', '#070C18', 'rgba(7,12,24,.13)'], ['#F4F2EC', '#070C18', 'rgba(7,12,24,.12)'], ['#1A2132', '#F4F2EC', 'rgba(244,242,236,.07)']];
const card = (c, i, mode) => {
  let bg, fg, letter, num;
  if (mode === 1) { bg = '#1A2132'; fg = '#F4F2EC'; letter = c.col; num = c.col; }
  else if (mode === 2) { bg = c.col; fg = c.ink; letter = 'rgba(0,0,0,.16)'; num = c.ink; }
  else { [bg, fg, letter] = pal[i]; num = fg === '#F4F2EC' ? '#FFD23F' : fg; }
  return `<div class="c" style="background:${bg};color:${fg}"><span class="bg" style="color:${letter};opacity:${mode === 1 ? 0.9 : 1}">${c.ini}</span>
  <img class="ava" src="a${i + 1}.png" style="box-shadow:0 0 0 4px ${bg}, 0 0 0 6px ${mode === 1 ? c.col : fg}">
  <div class="h">${c.n}</div><span class="mono">Результат</span><span class="num" style="color:${num}">уточнити</span>
  <div class="foot" style="border-color:${fg}"><b>Детальніше</b><span class="arr" style="background:${mode === 1 ? c.col : fg};color:${mode === 1 ? c.ink : bg}">${ARROW}</span></div></div>`;
};
const row = (t, mode) => `<h2>${t}</h2><div class="row">${C.map((c, i) => card(c, i, mode)).join('')}</div>`;
const html = `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sofia+Sans+Extra+Condensed:wght@900&family=Onest:wght@400;600;700&family=JetBrains+Mono:wght@500&display=block">
<style>body{margin:0;padding:28px 32px;background:#070C18;color:#F4F2EC;font-family:'Onest',sans-serif}
h2{font:700 22px 'Onest';margin:26px 0 14px}h2 b{color:#FFD23F}
.row{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.c{position:relative;overflow:hidden;border-radius:26px;height:400px;padding:22px;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;border:1px solid rgba(244,242,236,.1)}
.bg{position:absolute;right:-20px;top:-50px;font:900 380px/1 'Sofia Sans Extra Condensed'}
.ava{position:absolute;left:22px;top:22px;width:76px;height:76px;border-radius:50%;object-fit:cover}
.h{font:900 34px/.92 'Sofia Sans Extra Condensed';text-transform:uppercase;position:relative}
.mono{font:500 11px 'JetBrains Mono';letter-spacing:.12em;text-transform:uppercase;opacity:.6;position:relative}
.num{font:900 44px/.9 'Sofia Sans Extra Condensed';position:relative}
.foot{display:flex;justify-content:space-between;align-items:center;border-top:1.5px solid;padding-top:12px;position:relative;font-size:14px}
.arr{width:38px;height:38px;border-radius:50%;display:grid;place-items:center}.arr svg{width:46%;height:46%}</style>
${row('<b>1</b> — тёмные карточки, буква и акценты в цвет аватарки', 1)}${row('<b>2</b> — вся карточка в цвет аватарки', 2)}${row('<b>3</b> — наша палитра (жёлтый / оранжевый / светлый), аватарки как есть', 3)}`;
fs.writeFileSync(path.join(DIR, 'colors.html'), html);
(async () => { const b = await p.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage(); await pg.setViewport({ width: 1900, height: 900 });
  await pg.goto(pathToFileURL(path.join(DIR, 'colors.html')).href, { waitUntil: 'networkidle0' }); await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: path.join(DIR, 'colors.png'), fullPage: true }); await b.close(); })();
