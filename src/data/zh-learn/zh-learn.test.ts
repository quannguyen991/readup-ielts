import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ZH_DIALOGUES, ZH_GRAMMAR } from './index';

const HAN = /[㐀-鿿]/;

test('bài ngữ pháp: id duy nhất, đủ bước bắt buộc, 5 câu kiểm tra hợp lệ', () => {
  assert.ok(ZH_GRAMMAR.length >= 100);
  assert.equal(new Set(ZH_GRAMMAR.map((l) => l.id)).size, ZH_GRAMMAR.length);
  for (const l of ZH_GRAMMAR) {
    const labels = l.steps.map((s) => s.label);
    assert.ok(labels.includes('Định nghĩa') && labels.includes('Lỗi hay mắc'), l.id);
    assert.equal(l.quiz.length, 5, l.id);
    for (const q of l.quiz) {
      assert.ok(q.answer >= 0 && q.answer < q.options.length, `${l.id}: đáp án ngoài khoảng`);
      assert.equal(new Set(q.options).size, q.options.length, `${l.id}: đáp án trùng`);
    }
    for (const s of l.steps) {
      for (const e of s.examples ?? []) {
        assert.ok(HAN.test(e.zh) && e.py && e.vi, `${l.id}: ví dụ thiếu trường`);
        if (e.mark) assert.ok(e.zh.includes(e.mark), `${l.id}: mark không khớp`);
      }
    }
  }
});

test('hội thoại: id duy nhất, hai người nói trở lên, ngữ pháp tham chiếu có thật', () => {
  assert.ok(ZH_DIALOGUES.length >= 40);
  assert.equal(new Set(ZH_DIALOGUES.map((d) => d.id)).size, ZH_DIALOGUES.length);
  const grammarIds = new Set(ZH_GRAMMAR.map((l) => l.id));
  for (const d of ZH_DIALOGUES) {
    assert.ok(new Set(d.lines.map((l) => l.who)).size >= 2, `${d.id}: cần ít nhất 2 người nói`);
    assert.equal(d.quiz.length, 5, d.id);
    assert.ok(d.keyWords.length >= 3, d.id);
    for (const g of d.grammarIds ?? []) assert.ok(grammarIds.has(g), `${d.id}: ngữ pháp ${g} không tồn tại`);
    for (const q of d.quiz) assert.ok(q.answer >= 0 && q.answer < q.options.length, d.id);
  }
});
