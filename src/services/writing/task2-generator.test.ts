import assert from 'node:assert/strict';
import { test } from 'node:test';

import { generateTask1Prompts, generateTask2Prompts } from './task2-generator';
import { validateChartData } from '@/lib/writing/chart-data';
import type { Task2Essay } from '@/lib/writing/types';

const ESSAY_KINDS: Task2Essay[] = [
  'opinion',
  'discussion',
  'advantage_disadvantage',
  'problem_solution',
  'two_part',
];

test('sinh đủ năm dạng luận', () => {
  const kinds = new Set(generateTask2Prompts().map((p) => p.essayKind));
  for (const k of ESSAY_KINDS) assert.ok(kinds.has(k), `thiếu dạng ${k}`);
});

test('kho đề Task 2 đủ lớn để không lặp lại trong 45 ngày', () => {
  assert.ok(generateTask2Prompts().length >= 30);
});

test('mọi đề Task 2 đúng hình dạng của Task 2', () => {
  for (const p of generateTask2Prompts()) {
    assert.equal(p.task, 'ielts_task2');
    assert.equal(p.chartKind, null);
    assert.equal(p.chartData, null);
    assert.ok(p.essayKind);
    assert.equal(p.minWords, 250);
    assert.equal(p.timeLimitSeconds, 2400);
    assert.ok(p.promptText.length > 40, `đề quá ngắn: ${p.id}`);
  }
});

test('câu lệnh đề khớp dạng luận', () => {
  for (const p of generateTask2Prompts()) {
    const text = p.promptText.toLowerCase();
    if (p.essayKind === 'discussion') assert.match(text, /discuss both/);
    if (p.essayKind === 'advantage_disadvantage') assert.match(text, /advantages|disadvantages/);
    if (p.essayKind === 'problem_solution') assert.match(text, /problems|solutions|causes/);
    if (p.essayKind === 'opinion') assert.match(text, /agree or disagree|to what extent/);
  }
});

test('mọi đề Task 1 đúng hình dạng và có chartData hợp lệ', () => {
  const prompts = generateTask1Prompts();
  assert.ok(prompts.length >= 20);
  for (const p of prompts) {
    assert.equal(p.task, 'ielts_task1');
    assert.equal(p.essayKind, null);
    assert.ok(p.chartKind);
    assert.equal(p.minWords, 150);
    assert.equal(p.timeLimitSeconds, 1200);
    const r = validateChartData(p.chartData);
    assert.equal(r.ok, true, `${p.id}: ${r.ok === false ? r.reason : ''}`);
  }
});

test('câu lệnh Task 1 nêu đúng loại hình', () => {
  for (const p of generateTask1Prompts()) {
    const text = p.promptText.toLowerCase();
    if (p.chartKind === 'line') assert.match(text, /line graph/);
    if (p.chartKind === 'bar') assert.match(text, /bar chart/);
    if (p.chartKind === 'pie') assert.match(text, /pie charts/);
    if (p.chartKind === 'table') assert.match(text, /table/);
  }
});

test('id không trùng nhau trên toàn kho', () => {
  const ids = [...generateTask1Prompts(), ...generateTask2Prompts()].map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('chạy hai lần ra kết quả giống hệt', () => {
  assert.deepEqual(generateTask1Prompts(), generateTask1Prompts());
  assert.deepEqual(generateTask2Prompts(), generateTask2Prompts());
});
