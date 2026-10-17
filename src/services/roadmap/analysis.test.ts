import test from 'node:test';
import assert from 'node:assert/strict';

import { checkBudget, parseAiPlan, scaleToBudget, weeklyBudget } from './analysis';

const good = {
  summary: 'Bạn còn 0,5 band tới mục tiêu. Cần ưu tiên viết vì điểm Writing thấp nhất.',
  risks: ['Viết đang yếu nhất', 'Thời gian chưa đủ cho Speaking'],
  allocation: [
    { skill: 'writing', minutesPerWeek: 200, reason: 'Điểm thấp nhất' },
    { skill: 'reading', minutesPerWeek: 150, reason: 'Duy trì' },
    { skill: 'listening', minutesPerWeek: 120, reason: 'Duy trì' },
    { skill: 'vocab', minutesPerWeek: 30, reason: 'Ôn đều' },
  ],
  tips: ['Học 3 ngày viết, 3 ngày đọc'],
  priority: ['writing', 'reading'],
};

test('đọc phản hồi hợp lệ thành kết quả đầy đủ', () => {
  const a = parseAiPlan(good);
  assert.ok(a);
  assert.equal(a?.allocation.length, 4);
  assert.deepEqual(a?.priority, ['writing', 'reading']);
  assert.equal(a?.risks.length, 2);
});

test('bỏ kỹ năng lạ, phút âm và phút phi lý; không để một dòng hỏng làm hỏng cả kết quả', () => {
  const a = parseAiPlan({
    ...good,
    allocation: [
      { skill: 'cooking', minutesPerWeek: 100, reason: 'lạ' },
      { skill: 'reading', minutesPerWeek: -5, reason: 'âm' },
      { skill: 'writing', minutesPerWeek: 99999, reason: 'quá lớn' },
    ],
  });
  assert.ok(a);
  assert.deepEqual(a?.allocation.map((r) => r.skill), ['writing']);
  assert.equal(a?.allocation[0]?.minutesPerWeek, 2000);
});

test('thiếu tóm tắt hoặc không có kỹ năng hợp lệ thì trả về null', () => {
  assert.equal(parseAiPlan({ ...good, summary: '' }), null);
  assert.equal(parseAiPlan({ ...good, allocation: [{ skill: 'x', minutesPerWeek: 10 }] }), null);
  assert.equal(parseAiPlan(null), null);
  assert.equal(parseAiPlan('chuỗi'), null);
});

test('ưu tiên không hợp lệ thì lấy hai kỹ năng nhiều phút nhất', () => {
  const a = parseAiPlan({ ...good, priority: ['cooking'] });
  assert.deepEqual(a?.priority, ['writing', 'reading']);
});

test('ngân sách tuần và kiểm tra lệch', () => {
  assert.equal(weeklyBudget(60, 6), 360);
  const a = parseAiPlan(good)!;
  const total = a.allocation.reduce((s, r) => s + r.minutesPerWeek, 0);
  assert.equal(total, 500);
  assert.equal(checkBudget(a, 500).ok, true);
  assert.equal(checkBudget(a, 360).ok, false, 'lệch quá 10% thì báo không khớp');
});

test('quy phân bổ về đúng ngân sách, giữ tỉ lệ AI muốn', () => {
  const scaled = scaleToBudget(parseAiPlan(good)!.allocation, 360);
  const total = scaled.reduce((s, r) => s + r.minutesPerWeek, 0);
  assert.ok(Math.abs(total - 360) <= 3, `tổng ${total} phải xấp xỉ 360`);
  const writing = scaled.find((r) => r.skill === 'writing')!.minutesPerWeek;
  const vocab = scaled.find((r) => r.skill === 'vocab')!.minutesPerWeek;
  assert.ok(writing > vocab, 'kỹ năng AI ưu tiên vẫn nhiều phút hơn');
});

test('ngân sách bằng 0 thì mọi kỹ năng 0 phút, không chia cho 0', () => {
  const scaled = scaleToBudget(parseAiPlan(good)!.allocation, 0);
  assert.ok(scaled.every((r) => r.minutesPerWeek === 0));
});
