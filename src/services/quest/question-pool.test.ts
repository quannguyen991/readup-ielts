import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildQuestQuestions } from './question-pool';

/*
  Quest lấy câu từ ngân hàng SAT có sẵn. Chỗ dễ hỏng là BỘ CHUYỂN: trước đây nó
  chỉ chép `stem` và `passage`, nên câu Math hỏi "theo đồ thị" mất đồ thị, câu
  Verbal mất bảng số và phần gạch chân — câu hỏi vẫn hiện, nhưng không giải được.
*/

test('câu Verbal mang theo nguyên câu gốc: đoạn văn đầy đủ, bảng, gạch chân', () => {
  const qs = buildQuestQuestions('kiem-tra', 30, 'verbal');
  assert.ok(qs.length > 0);
  for (const q of qs) {
    assert.ok(q.rwItem, `${q.id} thiếu câu gốc`);
    assert.equal(q.context, q.rwItem.passage);
  }
});

test('câu Math có hình thì hình đi theo câu', () => {
  const seeds = Array.from({ length: 40 }, (_, i) => `hinh-${i}`);
  const withFigure = seeds.flatMap((s) => buildQuestQuestions(s, 10, 'math')).filter((q) => q.figure);
  assert.ok(withFigure.length > 0, 'không bốc được câu nào có hình để kiểm');
});

test('nhãn kỹ năng là chữ cho người đọc, không phải mã nội bộ', () => {
  for (const q of buildQuestQuestions('nhan', 20, 'mixed')) {
    assert.ok(q.skillLabel, `${q.id} thiếu nhãn`);
    assert.doesNotMatch(q.skillLabel!, /_/, `${q.id}: "${q.skillLabel}" trông như mã nội bộ`);
  }
});

test('trận "mixed" có cả Math lẫn Verbal ngay trong 8 câu đầu', () => {
  for (const seed of ['a', 'b', 'c', 'd', 'e']) {
    const qs = buildQuestQuestions(seed, 8, 'mixed');
    const subjects = new Set(qs.map((q) => q.subject));
    assert.deepEqual([...subjects].sort(), ['math', 'verbal'], `seed ${seed}: chỉ có ${[...subjects]}`);
  }
});

test('không lặp câu trong một trận khi ngân hàng đủ câu', () => {
  const qs = buildQuestQuestions('khong-lap', 10, 'mixed');
  assert.equal(new Set(qs.map((q) => q.id)).size, qs.length);
});
