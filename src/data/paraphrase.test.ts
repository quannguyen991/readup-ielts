import test from 'node:test';
import assert from 'node:assert/strict';

import { ANTONYMS, QUANTIFIER_FLIPS, SYNONYMS } from './paraphrase';
import { rewordMany } from '@/services/questions/rule-generator';

/**
 * Canh lỗi tra chữ theo prototype.
 *
 * Các bảng tra theo chữ là object thường nên `SYNONYMS['constructor']` trả về hàm của JavaScript,
 * không phải undefined. Bài về lập trình có chữ `constructor` từng làm bộ sinh đề sập ở
 * `made.toLowerCase`. Cả ba bảng phải không kế thừa Object.prototype.
 */

const PROTO_KEYS = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__'];

test('tra chữ thuộc Object.prototype ra undefined ở cả ba bảng', () => {
  for (const table of [SYNONYMS, ANTONYMS, QUANTIFIER_FLIPS]) {
    for (const key of PROTO_KEYS) {
      assert.equal(table[key], undefined, `bảng có khoá kế thừa: ${key}`);
    }
  }
});

test('bộ đổi chữ không đổi chữ thuộc prototype và không sập', () => {
  const sentence =
    'The constructor returns a prototype object that every class instance inherits from the runtime.';
  const { text, swaps } = rewordMany(sentence, 'proto-guard', 3);
  assert.equal(typeof text, 'string');
  for (const [from, to] of swaps) {
    assert.equal(typeof to, 'string');
    assert.equal(PROTO_KEYS.includes(from.toLowerCase()), false);
  }
});
