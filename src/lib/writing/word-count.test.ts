import assert from 'node:assert/strict';
import { test } from 'node:test';

import { countWords } from './word-count';

test('bài rỗng và bài toàn khoảng trắng đều là 0 từ', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   \n\t  '), 0);
});

test('đếm theo khoảng trắng, gộp nhiều khoảng trắng liền nhau', () => {
  assert.equal(countWords('Hello   world\n\nagain'), 3);
});

test('từ ghép nối gạch nối tính là MỘT từ, đúng luật IELTS', () => {
  assert.equal(countWords('a well-known problem'), 3);
  assert.equal(countWords('state-of-the-art'), 1);
});

test('số và phần trăm tính là một từ', () => {
  assert.equal(countWords('In 2020, sales rose by 20%.'), 6);
});

test('viết tắt có dấu nháy tính là một từ', () => {
  assert.equal(countWords("don't stop"), 2);
});

test('gạch ngang dài là dấu ngăn cách, không phải gạch nối', () => {
  // "one—two" là hai từ bị dấu gạch ngang dính vào nhau, không phải từ ghép.
  assert.equal(countWords('one—two'), 2);
  assert.equal(countWords('one – two'), 2);
});

test('dấu câu đứng một mình không được tính là từ', () => {
  assert.equal(countWords('Yes . . . no'), 2);
});
