import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatWordAnswer, isSingleWordQuestion } from './word-answer';
import { lookupOffline } from './word-lookup';

test('chỉ một từ mới đi đường tra từ; câu hỏi và cụm thì không', () => {
  assert.equal(isSingleWordQuestion('implement'), 'implement');
  assert.equal(isSingleWordQuestion(' Implement? '), 'Implement');
  assert.equal(isSingleWordQuestion('what is implement'), null);
  assert.equal(isSingleWordQuestion('implement là gì'), null);
  assert.equal(isSingleWordQuestion('a'), null);
});

test('câu trả lời từ tra cứu trong máy không có dấu markdown, có nghĩa Việt', () => {
  const r = lookupOffline('implement');
  assert.ok(r);
  const text = formatWordAnswer(r, false);
  assert.ok(text.includes(r.definitionVi ?? '???'));
  assert.ok(!text.includes('*'));
});
