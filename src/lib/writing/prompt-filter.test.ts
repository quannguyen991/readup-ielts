import assert from 'node:assert/strict';
import { test } from 'node:test';

import { matchesWritingFilter, type FilterablePrompt } from './prompt-filter';

const NONE = { chartKinds: [], essayKinds: [], bands: [] };

const line: FilterablePrompt = {
  task: 'ielts_task1',
  chartKind: 'line',
  essayKind: null,
  difficultyBand: 6.5,
};
const pie: FilterablePrompt = {
  task: 'ielts_task1',
  chartKind: 'pie',
  essayKind: null,
  difficultyBand: 7,
};
const opinion: FilterablePrompt = {
  task: 'ielts_task2',
  chartKind: null,
  essayKind: 'opinion',
  difficultyBand: 6.5,
};

test('không lọc gì thì giữ hết', () => {
  for (const p of [line, pie, opinion]) assert.ok(matchesWritingFilter(p, NONE));
});

test('chọn tab Task 1 thì bỏ đề Task 2', () => {
  assert.ok(matchesWritingFilter(line, { ...NONE, child: 'task1' }));
  assert.ok(!matchesWritingFilter(opinion, { ...NONE, child: 'task1' }));
});

test('tab SAT chưa có đề nào', () => {
  assert.ok(!matchesWritingFilter(line, { ...NONE, child: 'sat' }));
});

test('lọc band áp cho cả hai task', () => {
  assert.ok(matchesWritingFilter(line, { ...NONE, bands: ['6.5'] }));
  assert.ok(matchesWritingFilter(opinion, { ...NONE, bands: ['6.5'] }));
  assert.ok(!matchesWritingFilter(pie, { ...NONE, bands: ['6.5'] }));
});

test('chọn dạng biểu đồ thì bỏ đề Task 2', () => {
  assert.ok(matchesWritingFilter(line, { ...NONE, chartKinds: ['line'] }));
  assert.ok(!matchesWritingFilter(pie, { ...NONE, chartKinds: ['line'] }));
  assert.ok(!matchesWritingFilter(opinion, { ...NONE, chartKinds: ['line'] }));
});

test('chọn dạng đề thì bỏ đề Task 1', () => {
  assert.ok(matchesWritingFilter(opinion, { ...NONE, essayKinds: ['opinion'] }));
  assert.ok(!matchesWritingFilter(line, { ...NONE, essayKinds: ['opinion'] }));
});

test('chọn cả hai trục là HOẶC, không phải VÀ — và đây là chỗ dễ sai nhất', () => {
  // Hiểu là VÀ thì cả ba đề dưới đây đều rớt và màn hình trắng trơn.
  const both = { ...NONE, chartKinds: ['line'], essayKinds: ['opinion'] };
  assert.ok(matchesWritingFilter(line, both));
  assert.ok(matchesWritingFilter(opinion, both));
  assert.ok(!matchesWritingFilter(pie, both));
});

test('lọc chéo task không bao giờ cho ra danh sách rỗng vô cớ', () => {
  const all = [line, pie, opinion];
  const both = { ...NONE, chartKinds: ['pie'], essayKinds: ['opinion'] };
  assert.equal(all.filter((p) => matchesWritingFilter(p, both)).length, 2);
});

test('band cắt trước, nên band lệch thì lọc dạng cũng không cứu được', () => {
  const f = { ...NONE, bands: ['7'], chartKinds: ['line'] };
  assert.ok(!matchesWritingFilter(line, f), 'line là band 6.5, không được lọt');
});
