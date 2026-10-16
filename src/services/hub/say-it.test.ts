import test from 'node:test';
import assert from 'node:assert/strict';

import { SAY_PASS, percentOf, scoreSaying } from './say-it';

test('đọc đúng cả cụm thì mọi từ là đúng và đạt', () => {
  const r = scoreSaying('I usually go for a walk', 'I usually go for a walk');
  assert.equal(r.accuracy, 1);
  assert.equal(r.passed, true);
  assert.ok(r.tokens.every((t) => t.status === 'correct'));
  assert.equal(percentOf(r), 100);
});

test('không phân biệt hoa thường và dấu câu', () => {
  const r = scoreSaying("Hello, it's nice to meet you.", "hello it's nice to meet you");
  assert.equal(r.accuracy, 1);
});

test('từ bị bỏ sót được đánh dấu thiếu, và đạt hay không theo ngưỡng', () => {
  const r = scoreSaying('I usually go for a walk in the park', 'I usually go for walk in the park');
  assert.ok(r.tokens.some((t) => t.status === 'missing'));
  assert.equal(r.passed, r.accuracy >= SAY_PASS);
  assert.ok(r.accuracy < 1);
});

test('từ nói thừa được đánh dấu thừa nhưng không kéo điểm xuống', () => {
  const r = scoreSaying('I like tea', 'I like like tea');
  assert.ok(r.tokens.some((t) => t.status === 'extra'));
  assert.equal(r.accuracy, 1);
});

test('không nói gì thì điểm bằng 0 và mọi từ là thiếu', () => {
  const r = scoreSaying('Two words', '   ');
  assert.equal(r.accuracy, 0);
  assert.equal(r.passed, false);
  assert.ok(r.tokens.every((t) => t.status === 'missing'));
});
