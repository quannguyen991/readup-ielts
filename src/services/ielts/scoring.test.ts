import assert from 'node:assert/strict';
import test from 'node:test';
import { overallIeltsBand, writingBandMidpoint } from './scoring';

test('IELTS overall rounds to the nearest half band', () => {
  assert.equal(overallIeltsBand({ listening: 6.5, reading: 6.5, writing: 5, speaking: 7 }), 6.5);
  assert.equal(overallIeltsBand({ listening: 6.5, reading: 6.5, writing: 5.5, speaking: 6 }), 6);
  assert.equal(overallIeltsBand({ listening: 7, reading: 7, writing: 7, speaking: 7 }), 7);
});

test('overall waits for four valid IELTS component bands', () => {
  assert.equal(overallIeltsBand({ reading: 7, writing: 6.5, speaking: 7 }), null);
  assert.equal(overallIeltsBand({ listening: 6.2, reading: 7, writing: 6.5, speaking: 7 }), null);
});

test('writing range becomes a half-band midpoint', () => {
  assert.equal(writingBandMidpoint(6, 7), 6.5);
  assert.equal(writingBandMidpoint(7.5, 7), null);
});
