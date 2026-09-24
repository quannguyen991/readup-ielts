import assert from 'node:assert/strict';
import { test } from 'node:test';

import { comboSemitones, shiftHz } from './sfx-notes';

test('tiếng đúng leo theo thang ngũ cung rồi đứng ở đỉnh', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(comboSemitones),
    [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24],
  );
  assert.equal(comboSemitones(40), 24);
  assert.equal(comboSemitones(0), 0);
});

test('lên một quãng tám là gấp đôi tần số', () => {
  assert.equal(shiftHz(440, 12), 880);
  assert.ok(Math.abs(shiftHz(440, 7) - 659.26) < 0.01);
});
