import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildDiagnostic } from './diagnostic';
import { generateMathItem } from './generator';
import { countCorrect, gradeMathItem, gradeMathSession } from './grade';
import { MATH_TEMPLATES } from './templates';
import { formatValue } from '@/lib/math/value';
import type { MathItem } from '@/lib/math/types';

/** Câu trắc nghiệm và câu grid-in đầu tiên tìm được, để khỏi hardcode slug. */
function sampleItem(format: 'mcq' | 'grid_in'): MathItem {
  const template = MATH_TEMPLATES.find((t) => t.format === format);
  assert.ok(template, `Không có template nào định dạng ${format}.`);
  return generateMathItem(template.slug, 'grade-test');
}

// ------------------------------------------------------------ trắc nghiệm

test('chọn đúng thì đúng và không mang nhãn lỗi', () => {
  const item = sampleItem('mcq');
  const grade = gradeMathItem(item, String(item.correctIndex));
  assert.equal(grade.isCorrect, true);
  assert.equal(grade.errorTag, null);
  assert.equal(grade.note, null);
});

test('chọn nhiễu thì lấy đúng nhãn lỗi và ghi chú của chính nhiễu ấy', () => {
  const item = sampleItem('mcq');
  const wrongIndex = [0, 1, 2, 3].find((i) => i !== item.correctIndex)!;
  const chosen = item.choices![wrongIndex]!;
  const grade = gradeMathItem(item, String(wrongIndex));

  assert.equal(grade.isCorrect, false);
  assert.equal(grade.errorTag, chosen.errorTag);
  assert.equal(grade.note, chosen.note ?? null);
  assert.equal(grade.chosen?.display, chosen.display);
});

test('bỏ trắng là sai nhưng KHÔNG bị gán nhãn lỗi', () => {
  // Gán nhãn cho câu bỏ trắng là bịa ra một sai lầm mà người học chưa hề mắc,
  // và nó sẽ chảy thẳng vào bảng thống kê lỗi.
  const item = sampleItem('mcq');
  const grade = gradeMathItem(item, null);
  assert.equal(grade.isCorrect, false);
  assert.equal(grade.errorTag, null);
});

test('chỉ số lựa chọn nằm ngoài khoảng thì không làm vỡ bộ chấm', () => {
  const item = sampleItem('mcq');
  assert.equal(gradeMathItem(item, '9').isCorrect, false);
  assert.equal(gradeMathItem(item, 'x').isCorrect, false);
});

// --------------------------------------------------------------- grid-in

test('grid-in nhận đúng giá trị và kèm lý do khi sai', () => {
  const item = sampleItem('grid_in');
  const correct = formatValue(item.answerValue!);

  assert.equal(gradeMathItem(item, correct).isCorrect, true);

  const wrong = gradeMathItem(item, '999999');
  assert.equal(wrong.isCorrect, false);
  assert.equal(wrong.gridVerdict?.ok, false);
});

test('grid-in bỏ trắng được phân biệt với gõ bậy', () => {
  const item = sampleItem('grid_in');
  const blank = gradeMathItem(item, null);
  const garbage = gradeMathItem(item, 'abc');
  assert.equal(blank.gridVerdict?.ok === false && blank.gridVerdict.reason, 'empty');
  assert.equal(garbage.gridVerdict?.ok === false && garbage.gridVerdict.reason, 'malformed');
});

test('câu grid-in không bao giờ sinh ra nhãn lỗi', () => {
  // Nhãn lỗi đến từ NHIỄU, mà câu tự điền thì không có nhiễu nào.
  const item = sampleItem('grid_in');
  assert.equal(gradeMathItem(item, '12345').errorTag, null);
});

// ------------------------------------------------------------- cả lượt

test('chấm cả lượt: câu không trả lời vẫn nằm trong mẫu số', () => {
  const items = buildDiagnostic('s1');
  // Chỉ trả lời ba câu đầu, và trả lời đúng.
  const responses = items.slice(0, 3).map((item) => ({
    itemId: item.id,
    answer: item.format === 'mcq' ? String(item.correctIndex) : formatValue(item.answerValue!),
    timeSpentMs: 40_000,
  }));

  const attempts = gradeMathSession(items, responses);
  assert.equal(attempts.length, items.length, 'Câu bỏ trắng phải vẫn có mặt trong kết quả.');
  assert.equal(countCorrect(attempts), 3);
  assert.equal(attempts[5]?.timeSpentMs, 0);
  assert.equal(attempts[5]?.userAnswer, null);
});

test('chấm cả lượt giữ nguyên chuỗi người học đã gõ', () => {
  const item = sampleItem('grid_in');
  const [attempt] = gradeMathSession(
    [item],
    [{ itemId: item.id, answer: '  12  ', timeSpentMs: 1000 }],
  );
  assert.equal(attempt?.userAnswer, '  12  ', 'Chuỗi gõ vào phải được lưu nguyên vẹn.');
});

test('mỗi lượt trả lời mang theo kỹ năng và domain của câu', () => {
  const items = buildDiagnostic('s2');
  const attempts = gradeMathSession(items, []);
  for (let i = 0; i < items.length; i += 1) {
    assert.equal(attempts[i]?.skill, items[i]?.skill);
    assert.equal(attempts[i]?.domain, items[i]?.domain);
  }
});

test('trả lời đúng hết thì đúng hết — trên cả 19 kỹ năng', () => {
  const items = buildDiagnostic('s3');
  const responses = items.map((item) => ({
    itemId: item.id,
    answer: item.format === 'mcq' ? String(item.correctIndex) : formatValue(item.answerValue!),
    timeSpentMs: 30_000,
  }));
  assert.equal(countCorrect(gradeMathSession(items, responses)), 19);
});
