import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IRREGULAR_VERBS, PATTERNS, fold, isCorrectForm, patternOf, pickQuizVerbs, searchVerbs } from './irregular-verbs';

test('danh sách đủ rộng, không trùng dạng gốc, mọi ô có nội dung', () => {
  assert.ok(IRREGULAR_VERBS.length >= 150, `${IRREGULAR_VERBS.length} động từ`);
  const bases = IRREGULAR_VERBS.map((v) => v.base);
  assert.equal(new Set(bases).size, bases.length, 'có dạng gốc bị trùng');
  for (const v of IRREGULAR_VERBS) {
    assert.ok(v.base && v.past && v.pp && v.vi, `thiếu ô ở "${v.base}"`);
    assert.equal(v.base, v.base.toLowerCase());
    assert.ok(!/\s/.test(v.base), `"${v.base}" chứa khoảng trắng`);
  }
});

test('xếp theo thứ tự chữ cái', () => {
  const bases = IRREGULAR_VERBS.map((v) => v.base);
  assert.deepEqual(bases, [...bases].sort((a, b) => a.localeCompare(b)));
});

test('các động từ kinh điển có đúng ba dạng', () => {
  const get = (b: string) => IRREGULAR_VERBS.find((v) => v.base === b)!;
  assert.deepEqual([get('go').past, get('go').pp], ['went', 'gone']);
  assert.deepEqual([get('buy').past, get('buy').pp], ['bought', 'bought']);
  assert.deepEqual([get('write').past, get('write').pp], ['wrote', 'written']);
  assert.deepEqual([get('begin').past, get('begin').pp], ['began', 'begun']);
  assert.deepEqual([get('be').past, get('be').pp], ['was/were', 'been']);
  assert.equal(get('lie').past, 'lay');
  assert.equal(get('lay').past, 'laid');
});

test('phân loại kiểu biến đổi', () => {
  assert.equal(patternOf({ base: 'cut', past: 'cut', pp: 'cut' }), 'AAA');
  assert.equal(patternOf({ base: 'come', past: 'came', pp: 'come' }), 'ABA');
  assert.equal(patternOf({ base: 'buy', past: 'bought', pp: 'bought' }), 'ABB');
  assert.equal(patternOf({ base: 'go', past: 'went', pp: 'gone' }), 'ABC');
  for (const p of PATTERNS) {
    assert.ok(IRREGULAR_VERBS.some((v) => patternOf(v) === p), `không có động từ kiểu ${p}`);
  }
});

test('tìm theo dạng gốc, V2, V3 và nghĩa không dấu', () => {
  assert.equal(searchVerbs('go')[0]!.base, 'go');
  assert.ok(searchVerbs('went').some((v) => v.base === 'go'));
  assert.ok(searchVerbs('gone').some((v) => v.base === 'go'));
  assert.ok(searchVerbs('bat dau').some((v) => v.base === 'begin'));
  assert.ok(searchVerbs('Bắt đầu').some((v) => v.base === 'begin'));
  assert.equal(searchVerbs('').length, IRREGULAR_VERBS.length);
  assert.equal(searchVerbs('zzzzqq').length, 0);
});

test('fold bỏ dấu tiếng Việt', () => {
  assert.equal(fold('Đứng đắn'), 'dung dan');
});

test('chấm đáp án: bỏ qua hoa thường, nhận mọi dạng cho phép', () => {
  assert.equal(isCorrectForm(' Went ', 'went'), true);
  assert.equal(isCorrectForm('burned', 'burnt/burned'), true);
  assert.equal(isCorrectForm('burnt', 'burnt/burned'), true);
  assert.equal(isCorrectForm('gotten', 'got/gotten'), true);
  assert.equal(isCorrectForm('was', 'was/were'), true);
  assert.equal(isCorrectForm('goed', 'went'), false);
  assert.equal(isCorrectForm('', 'went'), false);
});

test('bộ câu hỏi nhanh: đủ số lượng, không trùng, không vượt kho', () => {
  const ten = pickQuizVerbs(10);
  assert.equal(ten.length, 10);
  assert.equal(new Set(ten.map((v) => v.base)).size, 10);
  assert.equal(pickQuizVerbs(9999).length, IRREGULAR_VERBS.length);
  const fixed = pickQuizVerbs(5, IRREGULAR_VERBS, () => 0);
  assert.equal(fixed.length, 5);
});
