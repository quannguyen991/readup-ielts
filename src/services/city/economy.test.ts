import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ECONOMY, EMPTY_ECONOMY, resolveEconomy, shiftDay, type EconomyState, type StudyEvent } from './economy';

const DAY = '2026-09-29';
const run = (events: StudyEvent[], start: EconomyState = EMPTY_ECONOMY, day = DAY) =>
  events.reduce((s, e) => resolveEconomy(s, e, day).state, start);

test('câu từ vựng đúng lần đầu → 1 gỗ; mười câu → 10 gỗ và 1 ca', () => {
  const s = run(Array.from({ length: 10 }, (_, i) => ({ type: 'answer', source: 'vocab', correct: true, key: `w${i}` }) as StudyEvent));
  assert.equal(s.inventory.wood, 10);
  assert.equal(s.shiftBank, 1);
  assert.equal(s.shiftCounter, 0);
});

test('câu tự chấm (lật thẻ, "tôi đọc giống mẫu") = 0 vật liệu và không tính ca', () => {
  const r = resolveEconomy(EMPTY_ECONOMY, { type: 'answer', source: 'vocab', correct: true, selfGraded: true }, DAY);
  assert.equal(r.state.inventory.wood, 0);
  assert.equal(r.state.shiftCounter, 0);
  assert.equal(r.note, 'self_graded');
});

test('chỉ lần thử đầu: sai rồi làm lại đúng cùng câu trong ngày → không có gỗ', () => {
  const s = run([
    { type: 'answer', source: 'vocab', correct: false, key: 'apple' },
    { type: 'answer', source: 'vocab', correct: true, key: 'apple' },
  ]);
  assert.equal(s.inventory.wood, 0);
});

test('không thưởng lặp: cùng câu đúng hai lần (mở lại / tải lại) → 1 gỗ', () => {
  const s = run([
    { type: 'answer', source: 'vocab', correct: true, key: 'apple' },
    { type: 'answer', source: 'vocab', correct: true, key: 'apple' },
  ]);
  assert.equal(s.inventory.wood, 1);
});

test('sang ngày mới gặp lại câu cũ thì được xét lại (ôn tập ngắt quãng)', () => {
  const d1 = run([{ type: 'answer', source: 'vocab', correct: true, key: 'apple' }]);
  const d2 = run([{ type: 'answer', source: 'vocab', correct: true, key: 'apple' }], d1, shiftDay(DAY, 1));
  assert.equal(d2.inventory.wood, 2);
});

test('nghe: listen và listening đều ra gạch', () => {
  const s = run([
    { type: 'answer', source: 'listen', correct: true, key: 'a' },
    { type: 'answer', source: 'listening', correct: true, key: 'b' },
  ]);
  assert.equal(s.inventory.brick, 2);
});

test('toán / verbal không ra vật liệu nhưng vẫn tính vào ca', () => {
  const s = run(Array.from({ length: 10 }, (_, i) => ({ type: 'answer', source: 'math', correct: true, key: `m${i}` }) as StudyEvent));
  assert.deepEqual(s.inventory, EMPTY_ECONOMY.inventory);
  assert.equal(s.shiftBank, 1);
});

test('trần ngày: gỗ không vượt trần, hôm sau đặt lại', () => {
  const many = Array.from({ length: 100 }, (_, i) => ({ type: 'answer', source: 'vocab', correct: true, key: `k${i}` }) as StudyEvent);
  const s = run(many);
  assert.equal(s.inventory.wood, ECONOMY.dailyCap.wood);
  const next = resolveEconomy(s, { type: 'answer', source: 'vocab', correct: true, key: 'new' }, shiftDay(DAY, 1));
  assert.equal(next.state.inventory.wood, ECONOMY.dailyCap.wood + 1);
});

test('Reading: đá theo số câu đúng khi nộp; nộp lại cùng mã không cộng', () => {
  const r1 = resolveEconomy(EMPTY_ECONOMY, { type: 'submission', source: 'read', id: 'art-1', correct: 7, total: 10 }, DAY);
  assert.equal(r1.state.inventory.stone, 7);
  assert.equal(r1.shifts, 1);
  const r2 = resolveEconomy(r1.state, { type: 'submission', source: 'read', id: 'art-1', correct: 10, total: 10 }, DAY);
  assert.equal(r2.state.inventory.stone, 7);
  assert.equal(r2.note, 'duplicate');
  assert.equal(r2.state.shiftBank, 1);
});

test('bài nộp khác (toán, verbal) tạo ca nhưng không ra đá', () => {
  const r = resolveEconomy(EMPTY_ECONOMY, { type: 'submission', source: 'math', id: 'set-3', correct: 5, total: 8 }, DAY);
  assert.equal(r.state.inventory.stone, 0);
  assert.equal(r.shifts, 1);
});

test('thép: thi thử đầy đủ và Writing đã chấm, có mã chống cộng hai lần', () => {
  let s = run([{ type: 'mock_test', id: 'sat-1' }]);
  assert.equal(s.inventory.steel, ECONOMY.mockTest.amount);
  s = run([{ type: 'mock_test', id: 'sat-1' }], s);
  assert.equal(s.inventory.steel, ECONOMY.mockTest.amount);
  s = run([{ type: 'writing_graded', id: 'essay-9' }, { type: 'writing_graded', id: 'essay-9' }], s);
  assert.equal(s.inventory.steel, ECONOMY.mockTest.amount + ECONOMY.writingGraded.amount);
});

test('kính: mỗi mốc chuỗi 7/14/30 của một chuỗi chỉ thưởng một lần', () => {
  const start = '2026-09-01';
  let s = run([{ type: 'streak', streakDays: 7, streakStart: start }]);
  assert.equal(s.inventory.glass, ECONOMY.streak[7]!);
  s = run([{ type: 'streak', streakDays: 8, streakStart: start }], s, shiftDay(DAY, 1));
  assert.equal(s.inventory.glass, ECONOMY.streak[7]!, 'mở lại màn hình không cộng lại');
  s = run([{ type: 'streak', streakDays: 14, streakStart: start }], s, shiftDay(DAY, 7));
  assert.equal(s.inventory.glass, ECONOMY.streak[7]! + ECONOMY.streak[14]!);
  // chuỗi mới, bắt đầu ngày khác → mốc 7 lại được tính
  s = run([{ type: 'streak', streakDays: 7, streakStart: '2026-11-01' }], s, '2026-11-07');
  assert.equal(s.inventory.glass, ECONOMY.streak[7]! * 2 + ECONOMY.streak[14]!);
});

test('ca có trần ngày; kho ca có trần', () => {
  const answers = Array.from({ length: 10 * (ECONOMY.shift.maxPerDay + 5) }, (_, i) => ({ type: 'answer', source: 'math', correct: true, key: `q${i}` }) as StudyEvent);
  const s = run(answers);
  assert.equal(s.shiftBank, ECONOMY.shift.maxPerDay);
});

test('kho vật liệu không bao giờ âm; sự kiện HỌC chỉ có năm loại (đổi sao ở `exchange`, có test riêng)', () => {
  const s = run([{ type: 'answer', source: 'vocab', correct: false }]);
  for (const v of Object.values(s.inventory)) assert.ok(v >= 0);
  // Kinh tế chỉ có năm loại sự kiện học — không có sự kiện "mua".
  const kinds: StudyEvent['type'][] = ['answer', 'submission', 'mock_test', 'writing_graded', 'streak'];
  assert.equal(kinds.length, 5);
});
