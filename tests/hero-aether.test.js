// Сборка 2 — Aether, первый экран (G17, история 82): «ELEADS» поверх планеты, влёт в неё и круглое окно
// со сценой Володимира. Проверяется разметка, тексты из JSON и правила движения — то, что видно без браузера.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, readJson } from './helpers.js';

const html = read('index.html');
const hero = html.split(/<section\b[^>]*\sid="hero"/)[1].split('</section>')[0];
const ua = readJson('src/data/content.ua.json');
const en = readJson('src/data/content.en.json');
const css = read('src/styles/sections/hero.css').replace(/\/\*[\s\S]*?\*\//g, '');
const js = read('src/sections/hero.js');

test('сцена: слово из JSON поверх планеты с кольцом, надзаголовок, подзаголовок и «гортайте» моно', () => {
  assert.equal(ua.hero.word, 'ELEADS');
  assert.equal(en.hero.word, 'ELEADS');
  assert.ok(ua.hero.scroll && en.hero.scroll, 'подпись прокрутки UA/EN');
  assert.match(hero, /data-i18n="hero\.word"/);
  assert.match(hero, /class="planet\b[^"]*"/);
  for (const part of ['planet__glow', 'planet__ring--back', 'planet__body', 'planet__ring--front']) {
    assert.match(hero, new RegExp(part), part);
  }
  assert.match(hero, /class="[^"]*\bmono-label\b[^"]*"[^>]*data-i18n="hero\.eyebrow"/);
  assert.match(hero, /data-i18n="hero\.subtitle"/);
  assert.match(hero, /class="[^"]*\bmono-label\b[^"]*"[^>]*>[\s\S]*?data-i18n="hero\.scroll"/);
});

test('окно: круглая обёртка с фото DSC_3087 (volodymyr-cta-*), одна <picture> на весь первый экран', () => {
  assert.match(hero, /class="hero__window"/);
  assert.match(hero, /class="hero__window-inner"/);
  assert.equal((hero.match(/<picture\b/g) || []).length, 1, 'LCP/фото грузится один раз');
  assert.match(hero, /volodymyr-cta-900\.avif/);
  assert.doesNotMatch(hero, /volodymyr-hero-/);
});

test('финал сцены: H1 «Просування через Telegram Ads» по строкам, акцент, три цифры, CTA с data-place="hero"', () => {
  const h1 = hero.match(/<h1\b[\s\S]*?<\/h1>/)[0];
  assert.equal((h1.match(/class="hero__line"/g) || []).length, 2);
  assert.match(h1, /display__accent[^>]*data-i18n="hero\.titleAccent"/);
  assert.equal((hero.match(/data-count\b/g) || []).length, 3);
  assert.match(hero, /<a\b[^>]*href="\{\{config\.telegramUrl\}\}"[^>]*data-place="hero"/);
  assert.equal((hero.match(/data-i18n="hero\.trusted\.items\.\d"/g) || []).length, 7, '«Мені довіряють» — 7 имён');
});

test('движение: окно без clip-path и filter; закрепление только ≥900px и без reduced-motion', () => {
  assert.doesNotMatch(css, /clip-path/);
  assert.doesNotMatch(css, /filter\s*:/);
  assert.doesNotMatch(css, /transition[^;]*\b(width|height|top|left|filter)\b/);
  assert.match(js, /'\(min-width:\s*900px\)'/);
  assert.match(js, /matchMedia/);
  assert.match(js, /\breduced\b/);
  assert.match(js, /pin:\s*true/);
  assert.match(js, /scrub/);
});
