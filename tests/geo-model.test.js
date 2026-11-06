import test from 'node:test';
import assert from 'node:assert/strict';
import { pulsePhase } from '../src/sections/geo-model.js';

test('фаза пульса всегда в [0, 1), даже для отрицательной долготы', () => {
  // Нью-Йорк: lon = -74, now = 0 → сырой остаток отрицателен (-814); радиус кольца 4 + p*16 уходил в минус
  for (const lon of [-170, -74, -0.5, 0, 30, 151]) {
    for (const now of [0, 1, 999, 2600, 123456.7]) {
      const p = pulsePhase(now, lon, 2600);
      assert.ok(p >= 0 && p < 1, `lon=${lon} now=${now} → ${p}`);
    }
  }
});

test('фаза пульса для известного значения', () => {
  // (0 + (-74*11)) = -814 → по модулю 2600 это 1786 → 1786/2600
  assert.ok(Math.abs(pulsePhase(0, -74, 2600) - 1786 / 2600) < 1e-12);
  assert.equal(pulsePhase(1300, 0, 2600), 0.5);
});
