// Видео-фон финального экрана «Silk» (2026-11-12, «Сделай чтобы не лагало» → «сделай как видео на фоне»).
// Рисует ткань функциями src/sections/cta-silk.js в бесшовную петлю LOOP секунд и кодирует в MP4 (H.264):
//   public/video/silk-1920.mp4 — широкий экран (кадр 1920×884, как блок на 1903×937);
//   public/video/silk-720.mp4  — телефон / портрет (кадр 540×1206, как блок на 390×871);
//   public/video/silk-1920.jpg, silk-720.jpg — первый кадр (заставка, и он же при reduced-motion).
// Фон кадра чёрный: на странице видео ложится режимом screen — чёрное исчезает, видна пыль и фон страницы.
// Запуск (один раз, после правки параметров ткани): нужен ffmpeg в PATH и Chrome;
//   npm i --no-save puppeteer-core && node build/render-silk.cjs
const { spawn } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const puppeteer = require('puppeteer-core');

const ROOT = join(__dirname, '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FPS = 25;
const SUN = [255, 210, 63]; // --sun
const EMBER = [255, 138, 31]; // --ember
const OUTS = [
  { name: 'silk-1920', w: 1920, h: 884, crf: 27 },
  { name: 'silk-720', w: 540, h: 1206, crf: 27 },
];

// модуль ткани как есть, без export — исполняется в странице
const silkSrc = readFileSync(join(ROOT, 'src/sections/cta-silk.js'), 'utf8').replace(/^export /gm, '');

function encode(out) {
  const file = join(ROOT, 'public/video', `${out.name}.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(out.crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', file],
  { stdio: ['pipe', 'inherit', 'inherit'] });
  return { ff, file, done: new Promise((ok, fail) => ff.on('close', (c) => (c ? fail(new Error(`ffmpeg ${c}`)) : ok(file)))) };
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await page.setContent('<canvas></canvas>');
  await page.addScriptTag({ content: `${silkSrc}
    window.silkFrame = (w, h, t, sun, ember) => {
      const c = document.querySelector('canvas');
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const ctx = c.getContext('2d');
      const unit = h / UNIT_H, widthU = w / unit, n = lineCount();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.setTransform(unit, 0, 0, unit, 0, 0);
      ctx.lineWidth = SILK.width;
      for (let i = 0; i < n; i += 1) {
        const s = sheenOf(i, t);
        const col = ember.map((v, k) => Math.round(v + (sun[k] - v) * s));
        ctx.strokeStyle = 'rgba(' + col.join(',') + ',' + (SILK.base + SILK.sheen * s * s) + ')';
        ctx.beginPath();
        for (let x = 0; x <= widthU + SILK.step; x += SILK.step) {
          const y = silkY(i, x, t);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      return c.toDataURL('image/png').split(',')[1];
    };
    window.LOOP_S = LOOP;` });
  const loop = await page.evaluate(() => window.LOOP_S);
  const total = Math.round(loop * FPS); // кадр total совпал бы с кадром 0 — его не пишем, петля бесшовная
  for (const out of OUTS) {
    const enc = encode(out);
    for (let f = 0; f < total; f += 1) {
      const b64 = await page.evaluate((w, h, t, sun, ember) => window.silkFrame(w, h, t, sun, ember), out.w, out.h, f / FPS, SUN, EMBER);
      const buf = Buffer.from(b64, 'base64');
      if (f === 0) require('node:fs').writeFileSync(join(ROOT, 'public/video', `${out.name}.png`), buf);
      if (!enc.ff.stdin.write(buf)) await new Promise((r) => enc.ff.stdin.once('drain', r));
    }
    enc.ff.stdin.end();
    console.log(await enc.done);
  }
  await browser.close();
  // заставки: первый кадр в JPEG
  for (const out of OUTS) {
    const src = join(ROOT, 'public/video', `${out.name}.png`);
    await new Promise((ok, fail) => spawn('ffmpeg', ['-v', 'error', '-y', '-i', src, '-q:v', '4', join(ROOT, 'public/video', `${out.name}.jpg`)], { stdio: 'inherit' })
      .on('close', (c) => (c ? fail(new Error('poster')) : ok())));
    require('node:fs').unlinkSync(src);
  }
})();
