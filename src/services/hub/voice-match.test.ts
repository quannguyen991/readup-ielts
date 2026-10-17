import assert from 'node:assert/strict';
import { test } from 'node:test';

import { matchChoice } from './voice-match';

const OPTIONS = [
  { text: 'Hi, I\'d like to book a table for two tonight at seven, please.' },
  { text: 'I want table. Now.' },
  { text: 'Hello? Can you hear me?' },
];

test('giọng nói khớp đúng phương án có nhiều từ trùng', () => {
  const hit = matchChoice('hi I would like to book a table for two tonight at seven', OPTIONS);
  assert.equal(hit?.index, 0);
});

test('phương án khác không khớp thì không chọn', () => {
  assert.equal(matchChoice('hello can you hear me', OPTIONS)?.index, 2);
  assert.equal(matchChoice('something completely unrelated about weather', OPTIONS), null);
});

test('không nghe được gì thì không chọn', () => {
  assert.equal(matchChoice('   ', OPTIONS), null);
  assert.equal(matchChoice('the a of', OPTIONS), null, 'chỉ có từ phụ thì không tính');
});

test('hai phương án khớp ngang bằng thì không chọn, tránh nhầm', () => {
  const tie = [{ text: 'Yes, I agree' }, { text: 'Yes, I disagree' }];
  assert.equal(matchChoice('yes', tie), null);
  assert.equal(matchChoice('yes i agree', tie)?.index, 0);
});

test('khớp dưới một nửa từ nội dung thì không chọn', () => {
  assert.equal(matchChoice('table', OPTIONS), null);
});
