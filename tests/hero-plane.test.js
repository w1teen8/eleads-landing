// Первый экран, вариант 3 «plane» (?hero=3, G24): ролик пользователя → кодом самолётик рисует кольцо вокруг «ELEADS»
// и садится в его центр → главный экран. Ролик — сменяемый слот config.json → heroV3. Проверяются слот, математика
// стыка и полёта (hero-plane-model.js), разметка без медиа в HTML, правила движения и переключатель.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { read, readJson, root } from './helpers.js';
import { introCeilingMs, coverPoint, ringSpins, ringGeometry, ellipseAt, planePose } from '../src/sections/hero-plane-model.js';

const config = readJson('src/data/config.json');
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const html = read('index.html');
const section = html.split(/<section\b[^>]*\sid="hero"/)[1].split('</section>')[0];
const plane = section.split('data-hero-variant="plane"')[1]?.split('class="hero__trust"')[0] || '';
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const near = (a, b, eps = 0.5) => Math.abs(a - b) <= eps;

test('слот ролика: файл, обрезка, постер и поза самолётика в последнем кадре — в config.json → heroV3', () => {
  const v = config.heroV3?.video;
  assert.ok(v, 'heroV3.video');
  for (const key of ['source', 'src', 'srcMobile', 'poster']) assert.equal(typeof v[key], 'string', key);
  assert.ok(v.out > v.in && v.out <= 6.8, 'только кусок до надписи и дрожащего кольца (≤ 6,8 с)');
  for (const key of ['x', 'y', 'width', 'angle']) assert.equal(typeof v.plane?.[key], 'number', `plane.${key}`);
  assert.equal(typeof config.heroV3.earth, 'string', 'дуга Земли — путь или пустая строка');
  assert.ok(config.heroV3.codeMs >= 3000 && config.heroV3.codeMs <= 4000, 'кодовая часть ~3–4 с');
  const size = (url) => statSync(join(root, 'public', url)).size;
  assert.ok(size(v.src) < 4.5 * 1024 * 1024, '1080 ≤ ~4 МБ');
  assert.ok(size(v.srcMobile) < size(v.src));
  assert.ok(size(v.poster) > 0);
  if (config.heroV3.earth) assert.ok(size(config.heroV3.earth) > 0);
  assert.match(read('package.json'), /"encode:hero-v3":\s*"node scripts\/encode-hero-v3\.mjs"/);
});

test('потолок интро = ролик (out − in) + кодовая часть + 2 с', () => {
  assert.equal(introCeilingMs({ video: { in: 0, out: 6.71 }, codeMs: 3600 }), 12310);
  assert.equal(introCeilingMs({ video: { in: 1.5, out: 7.5 }, codeMs: 3000 }), 11000);
  assert.equal(introCeilingMs({}), 5600, 'без ролика — кодовая часть по умолчанию + 2 с');
});

test('стык: точка кадра при object-fit: cover на 1920×1080 и на телефоне 360×740', () => {
  assert.deepEqual(coverPoint({ x: 0.5, y: 0.5 }, 1920, 1080), { x: 960, y: 540, frameWidth: 1920 });
  const p = coverPoint({ x: 0.648, y: 0.525 }, 1920, 1080);
  assert.ok(near(p.x, 1244.16) && near(p.y, 567));
  const m = coverPoint({ x: 0.648, y: 0.525 }, 360, 740);
  assert.ok(near(m.frameWidth, 1315.56, 0.1));
  assert.ok(near(m.x, (360 - 1315.56) / 2 + 0.648 * 1315.56) && near(m.y, 388.5));
});

test('кольцо раскрывается поворотом двух половинок: 0…180 правая, потом левая', () => {
  assert.deepEqual(ringSpins(0), [0, 0]);
  assert.deepEqual(ringSpins(90), [90, 0]);
  assert.deepEqual(ringSpins(270), [180, 90]);
  assert.deepEqual(ringSpins(400), [180, 180]);
  assert.deepEqual(ringSpins(-5), [0, 0]);
});

test('полёт: старт — ровно поза из последнего кадра, круг — по эллипсу кольца, финал — в центре кольца', () => {
  const geo = ringGeometry(900);
  const start = { x: 280, y: 30, w: 230, a: -40 };
  const p0 = planePose(0, start, geo, 3600);
  assert.ok(near(p0.x, 280) && near(p0.y, 30) && near(p0.w, 230), 'без скачка на стыке');
  assert.ok(Math.abs(p0.a - -40) < 6, `курс на стыке ${p0.a}`);
  assert.equal(p0.ring, 0);

  const mid = planePose(1500, start, geo, 3600);
  const t = (-geo.tilt * Math.PI) / 180;
  const lx = mid.x * Math.cos(t) - mid.y * Math.sin(t);
  const ly = mid.x * Math.sin(t) + mid.y * Math.cos(t);
  assert.ok(near((lx / geo.rx) ** 2 + (ly / geo.ry) ** 2, 1, 0.01), 'на круге самолётик на эллипсе');
  assert.ok(mid.ring > 0 && mid.ring < 360);
  const head = ellipseAt(geo, geo.phi0 - mid.ring);
  assert.ok(near(head.x, mid.x, 1) && near(head.y, mid.y, 1), 'кольцо раскрыто ровно до самолётика');

  assert.equal(planePose(2400, start, geo, 3600).ring, 360);
  const end = planePose(3600, start, geo, 3600);
  assert.ok(near(end.x, geo.final.x) && near(end.y, geo.final.y) && near(end.w, geo.final.w) && near(end.a, geo.final.a));
  assert.equal(end.done, true);
  assert.ok(Math.hypot(geo.final.x, geo.final.y) < geo.ry * 0.3, 'финал — в центре кольца');
});

test('разметка: свой блок варианта, медиа в HTML нет (src ставит скрипт только в варианте 3), тексты из JSON', () => {
  assert.ok(plane, 'data-hero-variant="plane"');
  const video = plane.match(/<video\b[^>]*>/)?.[0] || '';
  assert.match(video, /\bmuted\b/);
  assert.match(video, /\bplaysinline\b/);
  assert.match(video, /preload="none"/);
  assert.doesNotMatch(video, /\s(src|poster)=/);
  assert.doesNotMatch(plane, /<img\b[^>]*\ssrc=/, 'дуга Земли без src в HTML');
  assert.doesNotMatch(plane, /<source\b/);
  assert.match(plane, /data-plane-skip/);
  assert.match(plane, /data-place="hero"/);
  assert.match(plane, /role="heading" aria-level="1"/);
  for (const key of ['hero.word', 'hero.eyebrow', 'hero.subtitle', 'hero.cta.label', 'hero.scroll', 'hero.v3.skip', 'hero.stats.years.value']) {
    assert.match(plane, new RegExp(`data-i18n(-attr)?="[^"]*${key.replace(/\./g, '\\.')}"`), key);
  }
  for (const dict of [ua, en]) for (const k of ['skip', 'skipLabel', 'heading']) assert.ok(String(dict.hero.v3?.[k] || '').trim(), `hero.v3.${k}`);
  assert.equal((plane.match(/<h1\b/g) || []).length, 0, 'H1 страницы — в варианте 2');
});

test('переключатель: plane — третий вариант, по умолчанию mockup, dev-кнопка «3»; hero.js зовёт initPlane', () => {
  const heroJs = strip(read('src/sections/hero.js'));
  assert.match(heroJs, /HERO_VARIANTS = \['mockup', 'orbit', 'plane'\]/);
  assert.match(heroJs, /if \(variant === 'plane'\) \{\s*initPlane\(stage\);\s*return;/);
  const css = strip(read('src/styles/sections/hero-plane.css'));
  assert.match(css, /\[data-hero-variant='plane'\],\s*\[data-hero='plane'\] \[data-hero-variant='mockup'\]\s*\{\s*display:\s*none/);
  assert.match(css, /\[data-hero='plane'\] \[data-hero-variant='plane'\]\s*\{\s*display:\s*block/);
  const dev = read('src/dev/theme-switcher.js');
  assert.match(dev, /\{ id: 'plane', label: '3' \}/);
});

test('движение варианта 3 — только transform и opacity, без stroke-dashoffset и фильтров', () => {
  const css = strip(read('src/styles/sections/hero-plane.css'));
  for (const [, props] of css.matchAll(/transition(?:-property)?:\s*([^;]+);/g)) {
    for (const part of props.split(/,(?![^(]*\))/)) {
      const prop = part.trim().split(/\s+/)[0];
      assert.ok(['transform', 'opacity', 'none'].includes(prop), `transition: ${prop}`);
    }
  }
  for (const [, body] of css.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?)\}\s*\}/g)) {
    assert.doesNotMatch(body, /\b(top|left|width|height|margin|filter|stroke-dashoffset)\s*:/);
  }
  assert.doesNotMatch(css, /stroke-dash|filter\s*:/);
  const js = strip(read('src/sections/hero-plane.js'));
  assert.doesNotMatch(js, /strokeDashoffset|stroke-dashoffset|\.style\.(left|top|width|height|filter)\b/);
});
