// Перекодирование ролика первого экрана, вариант 3 (?hero=3). Всё берётся из src/data/config.json → heroV3.video:
// source (исходник), in / out (секунды обрезки), src / srcMobile / poster (куда положить в public/).
// Делает: 1920×1080 H.264 без звука с faststart (десктоп), 1280×720 (телефон), постер — первый кадр (JPEG),
// и последний кадр в системный temp — по нему меряют heroV3.video.plane (x, y — центр самолётика в долях кадра,
// width — его ширина в долях ширины кадра, angle — куда смотрит нос, градусы, 0 — вправо, минус — вверх).
// Запуск: npm run encode:hero-v3 (нужен ffmpeg в PATH). Новый ролик: поменять source/in/out, запустить, поправить plane.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { video } = JSON.parse(readFileSync(join(root, 'src/data/config.json'), 'utf8')).heroV3;
const source = join(root, video.source);
const cut = ['-ss', String(video.in), '-to', String(video.out), '-i', source];
const pub = (url) => join(root, 'public', url.replace(/^\//, ''));
const ffmpeg = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const h264 = (w, h, crf) => [
  '-an', '-vf', `scale=${w}:${h}:flags=lanczos,format=yuv420p`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-profile:v', 'high', '-movflags', '+faststart',
];

ffmpeg([...cut, ...h264(1920, 1080, 23), pub(video.src)]);
ffmpeg([...cut, ...h264(1280, 720, 25), pub(video.srcMobile)]);
ffmpeg(['-ss', String(video.in), '-i', source, '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '4', pub(video.poster)]);
const last = join(tmpdir(), 'hero-v3-last-frame.png');
ffmpeg(['-sseof', '-0.05', '-i', pub(video.src), '-frames:v', '1', '-update', '1', last]);

for (const url of [video.src, video.srcMobile, video.poster]) {
  console.log(`${url}  ${(statSync(pub(url)).size / 1024).toFixed(0)} KB`);
}
console.log(`последний кадр (для heroV3.video.plane): ${last}`);
