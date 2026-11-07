import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildResult, finalizeBands } from './writing-evaluator';

const crit = (band: number) => ({ band, evidenceVi: '', gapVi: '', nextStepVi: '', quotes: [] });
const score = (t: number, c: number, l: number, g: number) => ({
  bandLow: 5,
  bandHigh: 6,
  criteria: { task: crit(t), coherence: crit(c), lexical: crit(l), grammar: crit(g) },
  summaryVi: '',
});
const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

test('band tổng là trung bình bốn tiêu chí, làm tròn theo IELTS', () => {
  // (6 + 6 + 7 + 7) / 4 = 6,5 → 6,5
  const r = finalizeBands(buildResult(score(6, 6, 7, 7), { annotations: [] }, words(260), 'm'), 250);
  assert.equal(r.bandLow, 6.5);
  assert.equal(r.bandHigh, 6.5);
  // (6 + 6 + 6 + 7) / 4 = 6,25 → 6,5
  const r2 = finalizeBands(buildResult(score(6, 6, 6, 7), { annotations: [] }, words(260), 'm'), 250);
  assert.equal(r2.bandLow, 6.5);
});

test('bài thiếu từ thì Task Response không vượt 6 và band tổng được tính lại', () => {
  const r = finalizeBands(buildResult(score(8, 7, 7, 7), { annotations: [] }, words(120), 'm'), 250);
  assert.equal(r.taskBand, 6);
  assert.equal(r.criteria.task.band, 6);
  // (6 + 7 + 7 + 7) / 4 = 6,75 → 7
  assert.equal(r.bandLow, 7);
});

test('đủ từ thì giữ nguyên Task Response', () => {
  const r = finalizeBands(buildResult(score(8, 7, 7, 7), { annotations: [] }, words(260), 'm'), 250);
  assert.equal(r.taskBand, 8);
});

test('đếm số từ theo luật IELTS, giống ô đếm: gạch ngang đứng lẻ không phải từ', () => {
  // 245 từ thật + 10 dấu gạch: đếm theo khoảng trắng là 255 (đủ 250), đếm theo IELTS là 245 (thiếu).
  const body = `${words(245)} ${Array.from({ length: 10 }, () => '—').join(' ')}`;
  const r = finalizeBands(buildResult(score(8, 7, 7, 7), { annotations: [] }, body, 'm'), 250);
  assert.equal(r.wordCount, 245);
  assert.equal(r.taskBand, 6);
});
