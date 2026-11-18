import assert from 'node:assert/strict';
import { test } from 'node:test';

import { answerMatches, expandExpected } from './answer-match';

test('khoá có biến thể Anh/Mỹ, gạch chéo và ngoặc đều chấp nhận chữ người học gõ', () => {
  assert.ok(answerMatches('flavor', 'flavour / flavor'));
  assert.ok(answerMatches('Flavour', 'flavour / flavor'));
  assert.ok(answerMatches('gut', 'intestines/gut'));
  assert.ok(answerMatches('floors', 'floor(s)'));
  assert.ok(answerMatches('floor', 'floor(s)'));
  assert.ok(answerMatches('consumption', '(food) consumption'));
  assert.ok(answerMatches('food consumption', '(food) consumption'));
  assert.ok(answerMatches('harbor', '(the) harbour / harbor'));
  assert.ok(answerMatches('24th April', '24(th) April'));
  assert.ok(answerMatches('24 april', '24(th) April'));
  assert.ok(!answerMatches('flavours', 'flavour / flavor'));
});

test('T/F/NG, tên đi kèm chữ cái và hai ý thứ tự tuỳ ý', () => {
  assert.ok(answerMatches('FALSE', 'F'));
  assert.ok(answerMatches('NOT GIVEN', 'NG'));
  assert.ok(answerMatches('TRUE', 'T'));
  assert.ok(answerMatches('B', 'B – Susanna Tol'));
  assert.ok(answerMatches('C', 'C/D') && answerMatches('D', 'C/D'));
  assert.ok(answerMatches('A', 'A, C') && answerMatches('C', 'A, C'));
  assert.ok(!answerMatches('B', 'C/D'));
  assert.ok(!answerMatches('', 'C/D'));
});

test('số viết bằng chữ và dấu phân cách hàng nghìn', () => {
  assert.ok(answerMatches('four sides', '4 sides'));
  assert.ok(answerMatches('4 sides', 'four sides'));
  assert.ok(answerMatches('1000 kg', '1,000 kg'));
  assert.ok(answerMatches('fifty', 'fifty / 50') && answerMatches('50', 'fifty / 50'));
  assert.deepEqual(expandExpected(['gut', 'intestines']).sort(), ['gut', 'intestines']);
});

test('khoá viết "A hoặc D" và hai ý thứ tự tuỳ ý', () => {
  assert.ok(answerMatches('D', 'A hoặc D') && answerMatches('A', 'D hoặc A'));
  assert.ok(answerMatches('B', 'B or D') && answerMatches('D', 'B or D'));
  assert.ok(answerMatches('B', 'B & D') && answerMatches('D', 'B & D'));
});

test('TRUE/FALSE tương đương YES/NO khi chấm', () => {
  assert.ok(answerMatches('TRUE', 'YES') && answerMatches('YES', 'TRUE'));
  assert.ok(answerMatches('FALSE', 'NO') && answerMatches('NO', 'FALSE'));
  assert.ok(!answerMatches('NOT GIVEN', 'YES'));
  assert.ok(!answerMatches('TRUE', 'NO'));
});

test('khoá ghi cả tiêu đề thì chấp nhận số La Mã hoặc chữ cái đứng đầu', () => {
  assert.ok(answerMatches('v', 'v) Potential threat to minority languages'));
  assert.ok(answerMatches('iv', 'iv. A surprising approach to waste disposal'));
  assert.ok(answerMatches('F', 'F. Incineration of waste is now relatively harmless'));
  assert.ok(answerMatches('D', 'D original plans'));
  assert.ok(!answerMatches('E', 'D original plans'));
});
