import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IELTS_LEVELS, SAT_LEVELS } from '@/data/learning-path';

import {
  FOCUS_EXTRA,
  FOCUS_OPTIONS,
  buildSchedule,
  fitsExam,
  focusNodes,
  interleave,
  mergeRequests,
  studyDaysBetween,
  weekdayOf,
  type RequestItem,
  type ScheduleItem,
} from './schedule';

const item = (id: string, minutes: number): ScheduleItem => ({ id, minutes, title: { vi: id, en: id } });

test('bài thêm cho phần tập trung lấy ở trình độ kế tiếp, đúng loại, chưa xong', () => {
  const [l1, l2] = IELTS_LEVELS;
  const got = focusNodes('ielts', ['listening'], l1!, IELTS_LEVELS, () => false);
  assert.ok(got.length > 0 && got.length <= FOCUS_EXTRA);
  const nextIds = new Set(l2!.parts.flatMap((p) => p.nodes.map((n) => n.id)));
  for (const n of got) {
    assert.equal(n.target.kind, 'dictation');
    assert.ok(nextIds.has(n.id));
  }
  const skip = got[0]!.id;
  assert.ok(!focusNodes('ielts', ['listening'], l1!, IELTS_LEVELS, (id) => id === skip).some((n) => n.id === skip));
});

test('trình độ cao nhất không có bài thêm', () => {
  const top = SAT_LEVELS[SAT_LEVELS.length - 1]!;
  assert.deepEqual(focusNodes('sat', ['math'], top, SAT_LEVELS, () => false), []);
});

test('mọi phần tập trung đều có ít nhất một bài ở trình độ kế tiếp', () => {
  for (const [exam, levels] of [['ielts', IELTS_LEVELS], ['sat', SAT_LEVELS]] as const) {
    for (const opt of FOCUS_OPTIONS[exam]) {
      assert.ok(focusNodes(exam, [opt.id], levels[0]!, levels, () => false).length > 0, `${exam}/${opt.id}`);
    }
  }
});

test('rải bài thêm đều giữa các bài chính, không mất bài nào', () => {
  const out = interleave(['a', 'b', 'c', 'd', 'e', 'f'], ['X', 'Y']);
  assert.deepEqual(out, ['a', 'b', 'X', 'c', 'd', 'Y', 'e', 'f']);
  assert.deepEqual(interleave([], ['X']), ['X']);
  assert.deepEqual(interleave(['a'], []), ['a']);
  assert.equal(interleave(['a'], ['X', 'Y', 'Z']).length, 4);
});

test('xếp lịch: chỉ ngày học, không vượt số phút trừ khi một bài dài hơn buổi', () => {
  // 2026-10-05 là thứ Hai.
  assert.equal(weekdayOf('2026-10-05'), 1);
  const s = buildSchedule([item('a', 20), item('b', 20), item('c', 30), item('d', 90), item('e', 10)], {
    startIso: '2026-10-04', // Chủ nhật, không học
    minutesPerDay: 45,
    studyDays: [1, 3, 5],
  });
  assert.deepEqual(
    s.days.map((d) => [d.iso, d.items.map((i) => i.id)]),
    [
      ['2026-10-05', ['a', 'b']],
      ['2026-10-07', ['c']],
      ['2026-10-09', ['d']],
      ['2026-10-12', ['e']],
    ],
  );
  assert.equal(s.endIso, '2026-10-12');
  assert.equal(s.totalMinutes, 170);
});

test('lịch rỗng khi không có bài hoặc không có ngày học', () => {
  assert.equal(buildSchedule([], { startIso: '2026-10-05', minutesPerDay: 60, studyDays: [1] }).endIso, null);
  assert.equal(buildSchedule([item('a', 10)], { startIso: '2026-10-05', minutesPerDay: 60, studyDays: [] }).days.length, 0);
});

test('kịp ngày thi hay không, và cần bao nhiêu phút mỗi buổi', () => {
  const items = Array.from({ length: 10 }, (_, i) => item(`n${i}`, 30));
  const opts = { startIso: '2026-10-05', minutesPerDay: 30, studyDays: [1, 2, 3, 4, 5] };
  const s = buildSchedule(items, opts);
  assert.equal(s.endIso, '2026-10-16');
  assert.deepEqual(fitsExam(s, '2026-11-30', opts.startIso, opts.studyDays), { ok: true });
  assert.deepEqual(fitsExam(s, null, opts.startIso, opts.studyDays), { ok: true });
  // Thi 12/10 → còn 5 ngày học (05–09/10) cho 300 phút → 60 phút/buổi.
  assert.deepEqual(fitsExam(s, '2026-10-12', opts.startIso, opts.studyDays), { ok: false, needMinutes: 60 });
  assert.equal(studyDaysBetween('2026-10-05', '2026-10-11', [1, 2, 3, 4, 5]), 5);
});

test('gộp bài theo yêu cầu: bỏ trùng, giữ bản mới, có trần', () => {
  const r = (id: string, ask = 'q'): RequestItem => ({ id, exam: 'ielts', title: { vi: id, en: id }, href: '/', reason: '', minutes: 10, ask });
  const merged = mergeRequests([r('a'), r('b')], [r('b', 'new'), r('c')]);
  assert.deepEqual(merged.map((x) => x.id), ['a', 'b', 'c']);
  assert.equal(merged.find((x) => x.id === 'b')!.ask, 'new');
  assert.equal(mergeRequests([], Array.from({ length: 30 }, (_, i) => r(`x${i}`)), 24).length, 24);
});
