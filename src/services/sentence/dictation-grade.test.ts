import assert from 'node:assert/strict';
import { test } from 'node:test';

import { gradeDictation } from './dictation-grade';

test('gõ đúng nguyên văn thì mọi từ đều correct, accuracy = 1', () => {
  const g = gradeDictation('She studies English every morning.', 'She studies English every morning.');
  assert.equal(g.accuracy, 1);
  assert.equal(g.correctCount, g.totalSourceWords);
  assert.ok(g.tokens.every((t) => t.status === 'correct'));
});

test('không hoa/thường, không dấu câu ở cuối từ vẫn tính đúng', () => {
  const g = gradeDictation('She studies English.', 'she STUDIES english');
  assert.equal(g.accuracy, 1);
});

test('gõ trống thì mọi từ nguồn đều missing, accuracy = 0', () => {
  const g = gradeDictation('He works at a bank.', '');
  assert.equal(g.accuracy, 0);
  assert.ok(g.tokens.every((t) => t.status === 'missing'));
});

test('thiếu một từ giữa câu: từ đó missing, các từ còn lại vẫn correct', () => {
  // Bỏ "very" ra khỏi câu gốc "The weather has been very cold this week."
  const g = gradeDictation('The weather has been very cold this week.', 'The weather has been cold this week.');
  const missing = g.tokens.filter((t) => t.status === 'missing');
  assert.equal(missing.length, 1);
  assert.equal(missing[0]?.word, 'very');
  assert.equal(g.correctCount, g.totalSourceWords - 1);
});

test('gõ thừa một từ không có trong câu gốc: từ đó extra, không kéo các từ khác thành sai', () => {
  const g = gradeDictation('He works at a bank.', 'He really works at a bank.');
  const extra = g.tokens.filter((t) => t.status === 'extra');
  assert.equal(extra.length, 1);
  assert.equal(extra[0]?.word, 'really');
  assert.equal(g.correctCount, g.totalSourceWords);
  assert.equal(g.accuracy, 1);
});

test('gõ sai một từ (thay thế): từ gốc missing, từ gõ sai extra, hai từ còn lại vẫn correct', () => {
  const g = gradeDictation('He works at a bank.', 'He works at a school.');
  assert.equal(g.correctCount, 4); // He / works / at / a
  assert.equal(g.accuracy, 4 / 5);
  const statuses = g.tokens.map((t) => t.status);
  assert.ok(statuses.includes('missing'));
  assert.ok(statuses.includes('extra'));
});

test('đảo thứ tự hai từ thì KHÔNG được tính đúng cả hai — đây là điểm khác gradeParaphrase', () => {
  const g = gradeDictation('very cold weather', 'cold very weather');
  // "weather" khớp đúng vị trí cuối, còn "very"/"cold" bị đảo nên tối đa một
  // trong hai khớp được theo LCS (không phải cả hai).
  assert.ok(g.correctCount <= 2);
  assert.ok(g.correctCount < g.totalSourceWords);
});

test('dấu nháy đơn cong trong câu gốc khớp với dấu nháy thẳng người học gõ', () => {
  const g = gradeDictation('The library closes at nine o’clock.', 'The library closes at nine o\'clock.');
  assert.equal(g.accuracy, 1);
});
