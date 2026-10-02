import test from 'node:test';
import assert from 'node:assert/strict';

import { addDays, DAILY_CAP, dueBySlug, forecast, loadByDay, mergeReviewEntry, nextReview, scheduleSummary, upcomingLoad, type ReviewEntry } from './review-schedule';

test('đúng liên tục đúng hạn: khoảng cách giãn 1 → 2 → 4 → 7 ngày', () => {
  let day = '2026-10-01';
  let e = nextReview(undefined, true, day);
  assert.equal(e.due, '2026-10-02');
  const gaps: number[] = [];
  for (let i = 0; i < 3; i++) {
    day = e.due;
    const n = nextReview(e, true, day);
    gaps.push((Date.parse(n.due) - Date.parse(day)) / 86400000);
    e = n;
  }
  assert.deepEqual(gaps, [2, 4, 7]);
});

test('sai thì về hộp đầu, hạn ngày mai', () => {
  const e = nextReview({ box: 4, due: '2026-10-05', last: '2026-09-20' }, false, '2026-10-05');
  assert.deepEqual(e, { box: 0, due: '2026-10-06', last: '2026-10-05' });
});

test('học dồn không lên hộp: đúng nhiều lần một ngày hoặc ôn trước hạn giữ nguyên', () => {
  const a = nextReview(undefined, true, '2026-10-01');
  assert.deepEqual(nextReview(a, true, '2026-10-01'), a);
  const early = nextReview({ box: 2, due: '2026-10-10', last: '2026-10-06' }, true, '2026-10-08');
  assert.equal(early.box, 2);
  assert.equal(early.due, '2026-10-10');
});

test('danh sách đến hạn theo bộ và dự báo 7 ngày', () => {
  const r = {
    a: { x: { box: 0, due: '2026-10-01', last: '2026-09-30' }, y: { box: 1, due: '2026-10-03', last: '2026-10-01' } },
    b: { z: { box: 0, due: '2026-09-28', last: '2026-09-27' } },
  };
  assert.deepEqual(dueBySlug(r, '2026-10-01'), { a: ['x'], b: ['z'] });
  const f = forecast(r, '2026-10-01', 3);
  assert.deepEqual(f.map((d) => d.count), [2, 0, 1]);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('gộp hai máy: lấy bản ôn gần nhất', () => {
  const old = { box: 3, due: '2026-10-09', last: '2026-10-02' };
  const recent = { box: 0, due: '2026-10-06', last: '2026-10-05' };
  assert.equal(mergeReviewEntry(old, recent), recent);
  assert.equal(mergeReviewEntry(undefined, old), old);
});

type Reviews = Record<string, Record<string, ReviewEntry>>;
/** Học một lô từ trong ngày `today`: mỗi từ trả lời đúng một lần (như store.review). */
function study(reviews: Reviews, slug: string, words: string[], today: string, correct = true): Reviews {
  const out: Reviews = { ...reviews, [slug]: { ...(reviews[slug] ?? {}) } };
  for (const w of words) {
    const load = loadByDay(out, today, { slug, word: w });
    out[slug]![w] = nextReview(out[slug]![w], correct, today, load);
  }
  return out;
}
const names = (from: number, n: number) => Array.from({ length: n }, (_, i) => `w${from + i}`);

test('học 10 trong 50 từ rồi thoát: 10 lần ôn đầu rải đều 7 ngày tới, không dồn về mai', () => {
  const today = '2026-10-02';
  const r = study({}, 'edu', names(0, 10), today);
  const f = forecast(r, today, 8);
  assert.equal(f[0]!.count, 0, 'hôm nay không có gì đến hạn');
  const counts = f.slice(1).map((d) => d.count);
  assert.equal(counts.reduce((a, b) => a + b, 0), 10);
  assert.ok(counts.every((c) => c >= 1 && c <= 2), `mỗi ngày 1–2 từ: ${counts.join(',')}`);
});

test('học thêm 20, 30, 40 từ: lịch TÍCH LUỸ, từ mới nhập vào lịch, không ngày nào quá trần', () => {
  const today = '2026-10-02';
  let r: Reviews = {};
  const seen: number[] = [];
  for (const total of [10, 20, 30, 40]) {
    r = study(r, 'edu', names(total - 10, 10), today);
    const sum = scheduleSummary(r, today);
    seen.push(sum.scheduled);
    const days = upcomingLoad(r, today, 14);
    assert.ok(days.every((d) => d.count <= DAILY_CAP), 'không ngày nào vượt trần');
    assert.equal(days[days.length - 1]!.cumulative, total, 'số dồn = tổng từ đã xếp (trong 14 ngày)');
  }
  assert.deepEqual(seen, [10, 20, 30, 40]);
  // 40 từ vẫn rải trong cả tuần chứ không chỉ một ngày
  const used = forecast(r, today, 7).filter((d) => d.count > 0).length;
  assert.ok(used >= 6, `dùng ${used}/7 ngày`);
});

test('trần mỗi ngày: học dồn 120 từ vẫn không ngày nào quá DAILY_CAP, từ tràn sang tuần sau', () => {
  const today = '2026-10-02';
  const r = study({}, 'big', names(0, 120), today);
  const days = forecast(r, today, 30);
  assert.ok(days.every((d) => d.count <= DAILY_CAP));
  assert.equal(days.reduce((a, d) => a + d.count, 0), 120);
});

test('từ sai: ôn lại trong 1–2 ngày tới, không bị đẩy xa; sai lặp lại cùng ngày giữ nguyên chỗ', () => {
  const today = '2026-10-02';
  const a = nextReview(undefined, false, today, {});
  assert.ok(a.due === '2026-10-03' || a.due === '2026-10-04');
  const again = nextReview(a, false, today, { [a.due]: 5 });
  assert.deepEqual(again, a);
});

test('đúng khi đến hạn: lên hộp, ngày đầy thì lùi sang ngày còn chỗ', () => {
  const today = '2026-10-05';
  const full = { [addDays(today, 2)]: DAILY_CAP };
  const e = nextReview({ box: 0, due: '2026-10-05', last: '2026-10-04' }, true, today, full);
  assert.equal(e.box, 1);
  assert.equal(e.due, addDays(today, 3));
});

test('tổng kết lịch: hôm nay / mai / tuần này', () => {
  const r: Reviews = {
    a: {
      x: { box: 0, due: '2026-10-01', last: '2026-09-30' },
      y: { box: 0, due: '2026-10-03', last: '2026-10-02' },
      z: { box: 1, due: '2026-10-08', last: '2026-10-02' },
      q: { box: 3, due: '2026-11-01', last: '2026-10-02' },
    },
  };
  assert.deepEqual(scheduleSummary(r, '2026-10-02'), { scheduled: 4, dueToday: 1, tomorrow: 1, week: 3 });
});
