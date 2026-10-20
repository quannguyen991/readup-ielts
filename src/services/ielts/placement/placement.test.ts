import assert from 'node:assert/strict';
import { test } from 'node:test';

import { READING, READING_DURATION_MS } from './blueprint';
import { READING_PAPER, READING_QUESTIONS } from './reading-paper';
import {
  gradeReading,
  isExpired,
  normalizeGap,
  remainingMs,
  setAnswer,
  startReading,
  submitReading,
} from './session';

const T0 = 1_000_000;

test('đề có đúng 3 bài và 40 câu, đánh số liên tiếp 1–40', () => {
  assert.equal(READING_PAPER.length, READING.parts);
  assert.equal(READING_QUESTIONS.length, READING.questions);
  assert.deepEqual(
    READING_QUESTIONS.map((q) => q.n),
    Array.from({ length: 40 }, (_, i) => i + 1),
  );
});

test('mọi câu đều có đáp án hợp lệ theo dạng của nó', () => {
  for (const q of READING_QUESTIONS) {
    if (q.type === 'mcq') {
      assert.ok(q.options.length >= 3, `câu ${q.n} thiếu phương án`);
      assert.ok(q.answer >= 0 && q.answer < q.options.length, `câu ${q.n} đáp án ngoài phạm vi`);
      assert.equal(new Set(q.options).size, q.options.length, `câu ${q.n} có phương án trùng`);
    } else if (q.type === 'tfng') {
      assert.ok(['TRUE', 'FALSE', 'NOT GIVEN'].includes(q.answer), `câu ${q.n} đáp án TFNG lạ`);
    } else {
      assert.ok(q.answer.trim().length > 0, `câu ${q.n} thiếu đáp án`);
    }
  }
});

test('đáp án điền chỗ trống phải có nguyên văn trong bài đọc (không đoán được)', () => {
  for (const passage of READING_PAPER) {
    const text = normalizeGap(passage.paragraphs.join(' '));
    for (const q of passage.questions) {
      if (q.type !== 'gap') continue;
      assert.ok(text.includes(normalizeGap(q.answer)), `câu ${q.n}: "${q.answer}" không có trong bài ${passage.id}`);
    }
  }
});

test('thời lượng và luật: 60 phút, hết giờ tự nộp', () => {
  assert.equal(READING_DURATION_MS, 60 * 60_000);
  const s = startReading(T0);
  assert.equal(remainingMs(s, T0), READING_DURATION_MS);
  assert.equal(isExpired(s, T0 + READING_DURATION_MS - 1), false);
  assert.equal(isExpired(s, T0 + READING_DURATION_MS), true);
});

test('sau khi hết giờ không ghi thêm được đáp án', () => {
  const s = startReading(T0);
  const late = T0 + READING_DURATION_MS + 1;
  const after = setAnswer(s, 1, '0', late);
  assert.deepEqual(after.answers, {});
});

test('đã nộp thì không sửa đáp án, nộp lại không đổi thời điểm nộp', () => {
  let s = startReading(T0);
  s = setAnswer(s, 1, '1', T0 + 1000);
  s = submitReading(s, T0 + 2000);
  const again = submitReading(s, T0 + 9000);
  assert.equal(again.submittedAt, T0 + 2000);
  const edited = setAnswer(s, 1, '0', T0 + 3000);
  assert.equal(edited.answers[1], '1');
});

test('nộp bù khi hết giờ ghi đúng mốc hết giờ, không phải lúc bấm', () => {
  const s = submitReading(startReading(T0), T0 + READING_DURATION_MS + 5 * 60_000);
  assert.equal(s.submittedAt, T0 + READING_DURATION_MS);
});

test('chưa nộp thì không chấm', () => {
  assert.equal(gradeReading(startReading(T0)), null);
});

test('chấm đúng: trắc nghiệm theo chỉ số, TFNG theo chữ, điền chỗ trống bỏ hoa/thường và dấu câu', () => {
  const mcq = READING_QUESTIONS.find((q) => q.n === 1)!;
  const tfng = READING_QUESTIONS.find((q) => q.n === 5)!;
  const gap = READING_QUESTIONS.find((q) => q.n === 3)!;
  assert.equal(mcq.type, 'mcq');
  assert.equal(tfng.type, 'tfng');
  assert.equal(gap.type, 'gap');

  let s = startReading(T0);
  s = setAnswer(s, 1, String(mcq.type === 'mcq' ? mcq.answer : 0), T0 + 1);
  s = setAnswer(s, 5, tfng.type === 'tfng' ? tfng.answer : '', T0 + 2);
  s = setAnswer(s, 3, '  Weeks. ', T0 + 3);
  s = submitReading(s, T0 + 4);
  const r = gradeReading(s)!;
  assert.ok(r.correct >= 3);
  assert.equal(r.total, 40);
  assert.ok(r.wrong.every((w) => w.n !== 1 && w.n !== 5 && w.n !== 3));
});

test('bỏ trống là sai, và kết quả liệt kê câu sai với đáp án đúng', () => {
  const s = submitReading(startReading(T0), T0 + 1);
  const r = gradeReading(s)!;
  assert.equal(r.correct, 0);
  assert.equal(r.wrong.length, 40);
  assert.equal(r.wrong[0]!.given, '—');
});

test('thang điểm band không vượt 9 và không xuống dưới 0', () => {
  const s = submitReading(startReading(T0), T0 + 1);
  const r = gradeReading(s)!;
  assert.ok(r.band >= 0 && r.band <= 9);
});
