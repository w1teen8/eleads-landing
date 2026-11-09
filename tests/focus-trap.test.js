// F1: одна ловушка фокуса в core/dom.js на шапку, модалку кейса и лайтбокс форматов.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';
import * as dom from '../src/core/dom.js';

function setup() {
  const doc = { activeElement: null };
  globalThis.document = doc;
  const make = (name) => ({ name, focus() { doc.activeElement = this; } });
  const items = [make('a'), make('b'), make('c')];
  const target = new EventTarget();
  const press = (shiftKey = false, key = 'Tab') => {
    const e = new Event('keydown', { cancelable: true });
    Object.assign(e, { key, shiftKey });
    target.dispatchEvent(e);
    return e;
  };
  return { doc, items, target, press };
}

test('trapFocus: Tab с последнего — на первый, Shift+Tab с первого — на последний, в середине не мешает', () => {
  assert.equal(typeof dom.trapFocus, 'function', 'в core/dom.js нет trapFocus');
  const { doc, items, target, press } = setup();
  const off = dom.trapFocus(target, () => items);
  items[2].focus();
  assert.equal(press().defaultPrevented, true);
  assert.equal(doc.activeElement, items[0]);
  assert.equal(press(true).defaultPrevented, true);
  assert.equal(doc.activeElement, items[2]);
  items[1].focus();
  assert.equal(press().defaultPrevented, false, 'в середине Tab идёт своим ходом');
  assert.equal(press(false, 'Enter').defaultPrevented, false);
  doc.activeElement = { name: 'outside' };
  press();
  assert.equal(doc.activeElement, items[0], 'фокус снаружи возвращается внутрь');
  off();
  items[2].focus();
  assert.equal(press().defaultPrevented, false, 'после отписки ловушки нет');
});

// T27: у форматов лайтбокса больше нет (телефон не кликабелен) — trapFocus там не нужен
test('шапка и кейсы используют trapFocus, своего кода Tab-ловушки в секциях нет', () => {
  for (const name of ['header', 'cases']) {
    const src = read(`src/sections/${name}.js`);
    assert.match(src, /trapFocus\(/, `${name}.js не зовёт trapFocus`);
    assert.doesNotMatch(src, /['"]Tab['"]/, `${name}.js сам ловит Tab`);
  }
});
