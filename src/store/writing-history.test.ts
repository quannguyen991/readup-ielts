import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addSubmission, submissionsForPrompt, writingProgress } from './writing-history';
import type { WritingEvaluation, WritingSubmission } from '@/lib/writing/types';

function sub(id: string, promptId: string, words: number, at: string): WritingSubmission {
  return {
    id,
    promptId,
    mode: 'full',
    drillPart: null,
    bodyText: 'x '.repeat(words).trim(),
    wordCount: words,
    durationSeconds: 1200,
    submittedAt: at,
  };
}

function evaluation(submissionId: string, low: number, high: number): WritingEvaluation {
  return {
    submissionId,
    bandLow: low,
    bandHigh: high,
    taskBand: low,
    coherenceBand: low,
    lexicalBand: low,
    grammarBand: low,
    summaryVi: '',
    strengths: [],
    improvements: [],
    annotations: [],
    model: null,
    evaluatedAt: '2026-08-19T00:00:00Z',
  };
}

test('bài mới nhất nằm đầu danh sách', () => {
  const list = addSubmission(
    addSubmission([], sub('a', 'p1', 200, '2026-08-18T10:00:00Z')),
    sub('b', 'p1', 210, '2026-08-19T10:00:00Z'),
  );
  assert.deepEqual(
    list.map((s) => s.id),
    ['b', 'a'],
  );
});

test('thêm bài cũ hơn vẫn xếp đúng chỗ, không nhảy lên đầu', () => {
  const list = addSubmission(
    addSubmission([], sub('b', 'p1', 210, '2026-08-19T10:00:00Z')),
    sub('a', 'p1', 200, '2026-08-18T10:00:00Z'),
  );
  assert.deepEqual(
    list.map((s) => s.id),
    ['b', 'a'],
  );
});

test('nộp lại cùng một bài thì thay bản cũ, không nhân đôi', () => {
  const first = addSubmission([], sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  const again = addSubmission(first, sub('a', 'p1', 250, '2026-08-18T11:00:00Z'));
  assert.equal(again.length, 1);
  assert.equal(again[0]?.wordCount, 250);
});

test('lọc bài theo đề', () => {
  let list: WritingSubmission[] = [];
  list = addSubmission(list, sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  list = addSubmission(list, sub('b', 'p2', 200, '2026-08-18T11:00:00Z'));
  assert.deepEqual(
    submissionsForPrompt(list, 'p1').map((s) => s.id),
    ['a'],
  );
});

test('tiến độ: tổng bài, tổng từ, band trung bình lấy điểm giữa khoảng', () => {
  let list: WritingSubmission[] = [];
  list = addSubmission(list, sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  list = addSubmission(list, sub('b', 'p2', 300, '2026-08-19T10:00:00Z'));

  const p = writingProgress(list, [evaluation('a', 6.0, 6.5), evaluation('b', 6.5, 7.0)]);
  assert.equal(p.totalSubmissions, 2);
  assert.equal(p.totalWords, 500);
  // Điểm giữa: 6.25 và 6.75 → trung bình 6.5.
  assert.equal(p.averageBand, 6.5);
});

test('chưa bài nào được chấm thì band trung bình là null, không phải 0', () => {
  const list = addSubmission([], sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  assert.equal(writingProgress(list, []).averageBand, null);
});

test('bài chưa chấm không kéo tụt band trung bình', () => {
  let list: WritingSubmission[] = [];
  list = addSubmission(list, sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  list = addSubmission(list, sub('b', 'p2', 200, '2026-08-19T10:00:00Z'));
  // Chỉ bài 'a' có bản chấm; bài 'b' chưa chấm phải bị bỏ qua, không tính là 0.
  assert.equal(writingProgress(list, [evaluation('a', 7.0, 7.0)]).averageBand, 7.0);
});

test('chênh lệch so với bài trước, tính trên điểm giữa khoảng', () => {
  let list: WritingSubmission[] = [];
  list = addSubmission(list, sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  list = addSubmission(list, sub('b', 'p2', 200, '2026-08-19T10:00:00Z'));
  const p = writingProgress(list, [evaluation('a', 6.0, 6.0), evaluation('b', 6.5, 6.5)]);
  assert.equal(p.latestDelta, 0.5);
});

test('chỉ có một bài được chấm thì không có gì để so', () => {
  const list = addSubmission([], sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  assert.equal(writingProgress(list, [evaluation('a', 6.0, 6.5)]).latestDelta, null);
});

test('danh sách rỗng không ném lỗi', () => {
  const p = writingProgress([], []);
  assert.deepEqual(p, {
    totalSubmissions: 0,
    totalWords: 0,
    averageBand: null,
    latestDelta: null,
  });
});
