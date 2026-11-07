import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildResult } from './writing-evaluator';

const TEXT = 'The chart shows sales. Sales increased toward 40 units over the period.';

const SCORE = {
  bandLow: 6,
  bandHigh: 6.5,
  taskBand: 6,
  coherenceBand: 6,
  lexicalBand: 6.5,
  grammarBand: 6,
  summaryVi: 'Bài đủ ý nhưng thiếu overview.',
  strengths: ['Cấu trúc rõ'],
  improvements: ['Thêm đoạn overview'],
};

test('đọc đúng các trường nhận xét và band tổng', () => {
  // (6 + 6 + 6,5 + 6) / 4 = 6,125 → 6
  const r = buildResult(SCORE, { annotations: [] }, TEXT, 'm');
  assert.equal(r.bandLow, 6);
  assert.equal(r.bandHigh, 6);
  assert.equal(r.lexicalBand, 6.5);
  assert.equal(r.summaryVi, 'Bài đủ ý nhưng thiếu overview.');
  assert.deepEqual(r.improvements, ['Thêm đoạn overview']);
  assert.equal(r.model, 'm');
});

test('band tổng là MỘT số, không lấy từ bandLow/bandHigh do model ghi', () => {
  const khoang = buildResult({ ...SCORE, bandLow: 5, bandHigh: 8 }, { annotations: [] }, TEXT, 'm');
  const so = buildResult({ ...SCORE, bandLow: 7, bandHigh: 7 }, { annotations: [] }, TEXT, 'm');
  assert.equal(khoang.bandLow, khoang.bandHigh);
  assert.equal(khoang.bandLow, 6);
  assert.equal(so.bandLow, 6);
});

test('band lẻ hoặc ngoài thang thì kẹp về 1-9 và làm tròn 0.5', () => {
  const r = buildResult(
    { ...SCORE, taskBand: 6.3, coherenceBand: 12, lexicalBand: -4, grammarBand: 'x' },
    { annotations: [] },
    TEXT,
    'm',
  );
  assert.equal(r.taskBand, 6.5);
  assert.equal(r.coherenceBand, 9);
  assert.equal(r.lexicalBand, 1);
  assert.equal(r.grammarBand, 5);
});

test('annotation trích đúng thì được neo vào bài', () => {
  const r = buildResult(
    SCORE,
    {
      annotations: [
        { quote: 'toward 40', category: 'grammar', severity: 'minor', whyVi: 'Sai giới từ.', fix: 'to 40' },
      ],
    },
    TEXT,
    'm',
  );
  assert.equal(r.annotations.length, 1);
  assert.equal(TEXT.slice(r.annotations[0]?.start ?? 0, r.annotations[0]?.end ?? 0), 'toward 40');
});

test('annotation trích một câu không có trong bài thì bị loại', () => {
  const r = buildResult(
    SCORE,
    {
      annotations: [
        { quote: 'không tồn tại', category: 'grammar', severity: 'minor', whyVi: 'x', fix: 'y' },
      ],
    },
    TEXT,
    'm',
  );
  assert.equal(r.annotations.length, 0);
});

test('category lạ thì rơi về expression thay vì làm hỏng cả kết quả', () => {
  const r = buildResult(
    SCORE,
    { annotations: [{ quote: 'Sales', category: 'style', severity: 'x', whyVi: 'a', fix: 'b' }] },
    TEXT,
    'm',
  );
  assert.equal(r.annotations[0]?.category, 'expression');
  assert.equal(r.annotations[0]?.severity, 'minor');
});

test('model trả rác thì vẫn ra kết quả dùng được, không ném lỗi', () => {
  const r = buildResult(null, 'không phải object', TEXT, 'm');
  assert.ok(r.bandLow >= 1 && r.bandHigh <= 9);
  assert.deepEqual(r.annotations, []);
  assert.deepEqual(r.strengths, []);
});
