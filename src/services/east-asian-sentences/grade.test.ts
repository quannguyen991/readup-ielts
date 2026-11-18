import assert from 'node:assert/strict';
import { test } from 'node:test';

import { gradeCjk, isCjkPass } from './grade';

test('chép đúng, khác dấu câu vẫn đạt', () => {
  const g = gradeCjk('你好，小红，你今天好吗？', '你好小红你今天好吗');
  assert.equal(g.accuracy, 1);
  assert.equal(g.extra.length, 0);
  assert.ok(isCjkPass(g));
  assert.equal(g.source.filter((c) => c.status === 'punct').length, 3);
});

test('thiếu và thừa ký tự lộ ra', () => {
  const g = gradeCjk('我想吃米饭', '我想吃饭饭');
  assert.equal(g.correct, 4);
  assert.deepEqual(g.source.map((c) => c.status), ['correct', 'correct', 'correct', 'missing', 'correct']);
  assert.deepEqual(g.extra, ['饭']);
  assert.ok(!isCjkPass(g));
});

test('đảo thứ tự bị trừ điểm', () => {
  const g = gradeCjk('今天下雨', '下雨今天');
  assert.ok(g.accuracy < 1);
});

test('katakana và hiragana coi như nhau, toàn góc đổi về bán góc', () => {
  assert.equal(gradeCjk('コーヒー', 'こーひー').accuracy, 1);
  assert.equal(gradeCjk('ABC123', 'ａｂｃ１２３').accuracy, 1);
});

test('câu rỗng không chia cho 0', () => {
  const g = gradeCjk('，。', '');
  assert.equal(g.total, 0);
  assert.equal(g.accuracy, 0);
  assert.ok(!isCjkPass(g));
});
