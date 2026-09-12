import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PLAN_TOTAL_WEEKS,
  SAT_EXAM_ISO,
  daysUntil,
  nextCheckpoint,
  planWeek,
  routeFor,
  stageOf,
  todaySlots,
  weekNumber,
} from './roadmap';
import { PLAN_CHECKPOINTS, PLAN_STAGES, PLAN_WEEKS } from './weeks';

/** 07/09/2026 là thứ Hai của tuần 1. Dùng giờ địa phương như app chạy thật. */
const MON_W1 = new Date(2026, 8, 7);
const TUE_W1 = new Date(2026, 8, 8);
const SUN_W1 = new Date(2026, 8, 13);

test('tuần suy từ ngày, không lưu trạng thái', () => {
  assert.equal(weekNumber(MON_W1), 1);
  assert.equal(weekNumber(SUN_W1), 1, 'chủ nhật vẫn thuộc tuần 1');
  assert.equal(weekNumber(new Date(2026, 8, 14)), 2);
  assert.equal(weekNumber(new Date(2026, 8, 6)), 0, 'chưa tới ngày bắt đầu');
  assert.ok(weekNumber(new Date(2027, 10, 1)) > PLAN_TOTAL_WEEKS, 'qua lộ trình thì vẫn báo số thật');
});

test('60 tuần liền mạch, tuần nào cũng có khối từ vựng', () => {
  assert.equal(PLAN_WEEKS.length, 60);
  assert.deepEqual(
    PLAN_WEEKS.map((w) => w.week),
    Array.from({ length: 60 }, (_, i) => i + 1),
  );
  for (const w of PLAN_WEEKS) assert.ok(w.vocab.length > 0, `tuần ${w.week} thiếu từ vựng`);
});

test('sáu chặng phủ kín 60 tuần, không chồng nhau', () => {
  assert.equal(PLAN_STAGES.length, 6);
  let expected = 1;
  for (const stage of PLAN_STAGES) {
    assert.equal(stage.fromWeek, expected, `chặng ${stage.id} bắt đầu sai`);
    assert.ok(stage.toWeek >= stage.fromWeek);
    expected = stage.toWeek + 1;
  }
  assert.equal(expected - 1, 60);
  for (let week = 1; week <= 60; week += 1) assert.ok(stageOf(week), `tuần ${week} không thuộc chặng nào`);
});

test('cửa kiểm tra: lấy cửa gần nhất còn ở phía trước, kể cả cửa của chính tuần này', () => {
  assert.equal(nextCheckpoint(1)?.week, 12);
  assert.equal(nextCheckpoint(12)?.week, 12);
  assert.equal(nextCheckpoint(13)?.week, 20);
  assert.equal(nextCheckpoint(57), null, 'qua cửa cuối thì không còn cửa nào');
  assert.deepEqual(
    PLAN_CHECKPOINTS.map((c) => c.week),
    [...PLAN_CHECKPOINTS.map((c) => c.week)].sort((a, b) => a - b),
  );
});

test('đếm ngược tới ngày thi SAT', () => {
  assert.equal(daysUntil(SAT_EXAM_ISO, new Date(2027, 10, 5)), 1);
  assert.equal(daysUntil(SAT_EXAM_ISO, new Date(2027, 10, 6)), 0);
});

test('thứ Hai: từ vựng, slot sáng của tuần, và tối SAT Math', () => {
  const slots = todaySlots(MON_W1, 1);
  assert.deepEqual(slots.map((s) => s.id), ['vocab', 'morning', 'evening']);
  assert.equal(slots[1]!.title, 'Reading');
  assert.match(slots[2]!.when, /SAT Math/);
  assert.equal(slots[2]!.href, '/math');
});

test('thứ Ba: tối đổi sang kỹ năng viết hoặc nghe — đúng nhịp cách ngày', () => {
  const slots = todaySlots(TUE_W1, 1);
  assert.equal(slots[2]!.title, 'Listening');
  assert.doesNotMatch(slots[2]!.when, /SAT Math/);
});

test('chủ nhật không có bài mới: chỉ từ vựng, chữa lỗi và tối Math', () => {
  const slots = todaySlots(SUN_W1, 1);
  assert.equal(slots[1]!.title, 'Chữa lỗi');
  assert.equal(slots[1]!.href, '/progress');
});

test('tuần 21 học Speaking — app CHƯA có màn Speaking nên không dẫn đi đâu', () => {
  /*
    Đây là chỗ dễ nói dối nhất: dẫn tạm sang một màn khác cho "có đường đi" thì
    người học bấm vào rồi tự hỏi mình nhầm chỗ nào. Không có thì nói không có.
  */
  const morning = planWeek(21)?.morning;
  assert.equal(morning?.label, 'Speaking');
  assert.equal(routeFor(morning ?? null), null);
});

test('việc nào app làm được thì dẫn đúng màn', () => {
  assert.equal(routeFor({ label: 'Reading', detail: '' }), '/practice');
  assert.equal(routeFor({ label: 'Đề trộn R + L', detail: '' }), '/mock-tests');
  assert.equal(routeFor({ label: 'Task 1', detail: '' }), '/write');
  assert.equal(routeFor({ label: 'Bài tập R&W', detail: '' }), '/sat-rw');
  assert.equal(routeFor({ label: 'Đề full-length Kaplan', detail: '' }), null, 'sách giấy ngoài app');
  assert.equal(routeFor(null), null);
});
