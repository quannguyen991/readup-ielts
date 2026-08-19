import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  WRITING_PROMPTS,
  filterWritingPrompts,
  getWritingPromptById,
  writingLibraryStats,
} from './writing-repository';
import { validateChartData } from '@/lib/writing/chart-data';

test('kho đề nạp được và không rỗng', () => {
  assert.ok(WRITING_PROMPTS.length >= 3);
});

test('mọi đề Task 1 đều có chartData hợp lệ', () => {
  const task1 = WRITING_PROMPTS.filter((p) => p.task === 'ielts_task1');
  assert.ok(task1.length > 0, 'kho đề phải có ít nhất một đề Task 1');
  for (const p of task1) {
    assert.ok(p.chartData, `${p.id} thiếu chartData`);
    const r = validateChartData(p.chartData);
    assert.equal(r.ok, true, `${p.id}: ${r.ok === false ? r.reason : ''}`);
  }
});

test('mọi đề Task 2 đều có essayKind và không có biểu đồ', () => {
  const task2 = WRITING_PROMPTS.filter((p) => p.task === 'ielts_task2');
  assert.ok(task2.length > 0, 'kho đề phải có ít nhất một đề Task 2');
  for (const p of task2) {
    assert.ok(p.essayKind, `${p.id} thiếu essayKind`);
    assert.equal(p.chartKind, null);
    assert.equal(p.chartData, null);
  }
});

test('số từ tối thiểu và thời gian đúng theo task', () => {
  for (const p of WRITING_PROMPTS) {
    const expected = p.task === 'ielts_task1' ? { minWords: 150, seconds: 1200 } : { minWords: 250, seconds: 2400 };
    assert.equal(p.minWords, expected.minWords, `${p.id} sai minWords`);
    assert.equal(p.timeLimitSeconds, expected.seconds, `${p.id} sai timeLimitSeconds`);
  }
});

test('id là duy nhất', () => {
  const ids = WRITING_PROMPTS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('tra theo id', () => {
  const first = WRITING_PROMPTS[0];
  // `noUncheckedIndexedAccess` bật nên phần tử mảng có thể undefined — phải chặn
  // trước khi dùng, không được dùng dấu `!`.
  assert.ok(first);
  assert.equal(getWritingPromptById(first.id)?.id, first.id);
  assert.equal(getWritingPromptById('khong-co-that'), undefined);
});

test('lọc theo task', () => {
  const t1 = filterWritingPrompts({ task: 'ielts_task1' });
  assert.ok(t1.length > 0);
  assert.ok(t1.every((p) => p.task === 'ielts_task1'));
});

test('lọc theo band tối đa lấy cả đề dễ hơn', () => {
  const easy = filterWritingPrompts({ maxBand: 6.5 });
  assert.ok(easy.length > 0);
  assert.ok(easy.every((p) => p.difficultyBand <= 6.5));
  assert.ok(easy.length < WRITING_PROMPTS.length, 'phải lọc bớt được ít nhất một đề');
});

test('tìm theo chữ, không phân biệt hoa thường', () => {
  const found = filterWritingPrompts({ search: 'PUBLIC TRANSPORT' });
  assert.ok(found.some((p) => p.id === 'w-t2-transport-001'));
});

test('không truyền bộ lọc thì trả toàn bộ', () => {
  assert.equal(filterWritingPrompts().length, WRITING_PROMPTS.length);
});

test('nhiều bộ lọc cùng lúc phải thoả tất cả', () => {
  const r = filterWritingPrompts({ task: 'ielts_task2', topicSlug: 'education' });
  assert.ok(r.every((p) => p.task === 'ielts_task2' && p.topicSlug === 'education'));
});

test('thống kê đếm đúng theo task', () => {
  const stats = writingLibraryStats();
  assert.equal(stats.total, WRITING_PROMPTS.length);
  assert.equal(stats.byTask.ielts_task1 + stats.byTask.ielts_task2, WRITING_PROMPTS.length);
});
