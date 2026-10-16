import { test } from 'node:test';
import assert from 'node:assert/strict';

import { IDLE_MS, MAX_GAP_MS, advance, formatClock, startClock, type TickInput } from './break-clock';

const MIN = 60_000;
const DAY = '2026-10-14';
const STUDY_MS = 25 * MIN;
const BREAK_MS = 5 * MIN;

/** Một lần tick hợp lệ: đang học, tab hiện, có thao tác vừa xong. */
function tick(now: number, patch: Partial<TickInput> = {}): TickInput {
  return {
    now,
    today: DAY,
    gapMs: 1000,
    visible: true,
    studyRoute: true,
    exempt: false,
    lastActivityAt: now,
    studyMs: STUDY_MS,
    breakMs: BREAK_MS,
    ...patch,
  };
}

test('chỉ cộng giờ khi đang ở màn học, tab hiện và không thi', () => {
  let c = startClock(DAY);
  c = advance(c, tick(1_000));
  assert.equal(c.studiedMs, 1000);

  c = advance(c, tick(2_000, { studyRoute: false }));
  assert.equal(c.studiedMs, 1000, 'trang không phải màn học thì không cộng');

  c = advance(c, tick(3_000, { visible: false }));
  assert.equal(c.studiedMs, 1000, 'tab ẩn thì không cộng');

  c = advance(c, tick(4_000, { exempt: true }));
  assert.equal(c.studiedMs, 1000, 'màn thi thì không cộng');
});

test('đứng yên quá 10 phút thì ngừng cộng, nhưng thao tác lại thì cộng tiếp', () => {
  const c0 = { ...startClock(DAY), studiedMs: 60_000 };
  const idleNow = 1_000_000 + IDLE_MS + 1;
  const idle = advance(c0, tick(idleNow, { lastActivityAt: 1_000_000 }));
  assert.equal(idle.studiedMs, 60_000, 'không thao tác quá 10 phút thì đứng yên');

  const back = advance(idle, tick(idleNow + 1000, { lastActivityAt: idleNow }));
  assert.equal(back.studiedMs, 61_000);
});

test('khoảng trống lớn hơn 5 giây (máy ngủ, tab bị ép chậm) không tính vào giờ học', () => {
  const c = advance(startClock(DAY), tick(1_000_000, { gapMs: MAX_GAP_MS + 1 }));
  assert.equal(c.studiedMs, 0);
});

test('đủ giờ học thì vào giờ nghỉ, mốc kết thúc = bây giờ + giờ nghỉ', () => {
  const c = advance({ ...startClock(DAY), studiedMs: STUDY_MS - 1000 }, tick(5_000_000));
  assert.equal(c.phase, 'break');
  assert.equal(c.breakEndsAt, 5_000_000 + BREAK_MS);
});

test('trong giờ nghỉ, mọi thao tác và đổi trang đều không làm đồng hồ học chạy', () => {
  const resting = advance({ ...startClock(DAY), studiedMs: STUDY_MS }, tick(0));
  const endsAt = resting.breakEndsAt as number;
  const during = advance(resting, tick(endsAt - 1000, { studyRoute: false, lastActivityAt: endsAt - 1000 }));
  assert.equal(during.phase, 'break');
  assert.equal(during.breakEndsAt, endsAt);
});

test('tải lại trang giữa giờ nghỉ vẫn còn nghỉ, vì trạng thái là dữ liệu có mốc giờ', () => {
  const saved = JSON.parse(JSON.stringify({ ...startClock(DAY), phase: 'break', studiedMs: STUDY_MS, breakEndsAt: 9_000_000 }));
  const afterReload = advance(saved, tick(8_999_000, { visible: true, studyRoute: false }));
  assert.equal(afterReload.phase, 'break');
});

test('hết giờ nghỉ thì tự về học lại từ 0', () => {
  const resting = { ...startClock(DAY), phase: 'break' as const, studiedMs: STUDY_MS, breakEndsAt: 9_000_000 };
  const done = advance(resting, tick(9_000_000));
  assert.equal(done.phase, 'study');
  assert.equal(done.studiedMs, 0);
  assert.equal(done.breakEndsAt, null);
});

test('màn thi có đồng hồ: đủ giờ rồi vẫn không nghỉ, cho tới khi thi xong', () => {
  const full = { ...startClock(DAY), studiedMs: STUDY_MS };
  const inExam = advance(full, tick(1_000, { exempt: true }));
  assert.equal(inExam.phase, 'study', 'đang thi thì hoãn giờ nghỉ');

  const leftExam = advance(inExam, tick(2_000, { exempt: false, studyRoute: false }));
  assert.equal(leftExam.phase, 'break', 'ra khỏi phòng thi thì nghỉ ngay, không mất lượt');
});

test('sang ngày mới thì đếm lại từ đầu', () => {
  const yesterday = { ...startClock('2026-10-13'), studiedMs: 20 * MIN };
  const c = advance(yesterday, tick(1_000, { today: DAY, visible: false }));
  assert.equal(c.day, DAY);
  assert.equal(c.studiedMs, 0);
  assert.equal(c.phase, 'study');
});

test('không thay đổi gì thì trả về đúng object cũ (để store khỏi ghi thừa)', () => {
  const c = startClock(DAY);
  assert.equal(advance(c, tick(1_000, { visible: false })), c);
});

test('formatClock ra mm:ss và không âm', () => {
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(59_100), '01:00');
  assert.equal(formatClock(25 * MIN), '25:00');
  assert.equal(formatClock(-5), '00:00');
});
