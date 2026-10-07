import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addDays,
  DAILY_CAP,
  daysBetween,
  dueBySlug,
  forecast,
  INTERVALS,
  lapseBox,
  loadByDay,
  mergeReviewEntry,
  nextReview,
  pickDay,
  repairReviews,
  scheduleSummary,
  upcomingLoad,
  windowOf,
  type ReviewEntry,
} from './review-schedule';

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

test('sai thì rớt hộp và ôn lại ngày mai: từ mới về hộp đầu, từ đã nhớ lâu chỉ rớt một nửa', () => {
  assert.deepEqual(nextReview({ box: 0, due: '2026-10-05', last: '2026-10-04' }, false, '2026-10-05'), { box: 0, due: '2026-10-06', last: '2026-10-05' });
  assert.deepEqual(nextReview({ box: 4, due: '2026-10-05', last: '2026-09-20' }, false, '2026-10-05'), { box: 1, due: '2026-10-06', last: '2026-10-05' });
  assert.equal(lapseBox(6), 2);
  assert.equal(lapseBox(8), 3);
  assert.equal(lapseBox(1), 0);
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

test('học 10 từ hôm nay: cả 10 lần ôn đầu rơi vào NGÀY MAI (đường cong quên), không bị đẩy xa', () => {
  const today = '2026-10-02';
  const r = study({}, 'edu', names(0, 10), today);
  const f = forecast(r, today, 8);
  assert.equal(f[0]!.count, 0, 'hôm nay không có gì đến hạn');
  assert.equal(f[1]!.count, 10, `ngày mai: ${f.map((d) => d.count).join(',')}`);
});

test('học thêm 20, 30, 40 từ trong cùng ngày: lịch TÍCH LUỸ và vẫn ôn lần đầu trong 1–2 ngày', () => {
  const today = '2026-10-02';
  let r: Reviews = {};
  const seen: number[] = [];
  for (const total of [10, 20, 30, 40]) {
    r = study(r, 'edu', names(total - 10, 10), today);
    seen.push(scheduleSummary(r, today).scheduled);
    assert.equal(upcomingLoad(r, today, 14).at(-1)!.cumulative, total, 'số dồn = tổng từ đã xếp');
  }
  assert.deepEqual(seen, [10, 20, 30, 40]);
  const f = forecast(r, today, 4);
  assert.equal(f[1]!.count + f[2]!.count, 40, 'mọi lần ôn đầu nằm trong ngày 1–2');
});

test('học dồn 300 từ một ngày: ngày mai không quá 2,5× trần, phần còn lại sang ngày kia, không ai chờ quá vài ngày', () => {
  const today = '2026-10-02';
  const r = study({}, 'big', names(0, 300), today);
  const f = forecast(r, today, 6);
  assert.ok(f[1]!.count <= DAILY_CAP * 2.5 + 1, `ngày mai ${f[1]!.count}`);
  assert.equal(f.reduce((s, d) => s + d.count, 0), 300);
  assert.ok(f[1]!.count + f[2]!.count >= 2 * DAILY_CAP * 2.5 - 2, 'ngày 1 và 2 đều đầy trước khi nới sang ngày 3');
  const latest = Math.max(...Object.values(r.big!).map((e) => daysBetween(today, e.due)));
  assert.ok(latest <= 4, `lần ôn đầu muộn nhất sau ${latest} ngày`);
});

test('cửa sổ cân tải: ±13% khoảng cách chuẩn, lần ôn đầu chỉ ngày 1–2', () => {
  assert.deepEqual(windowOf(1), [1, 2]);
  assert.deepEqual(windowOf(2), [2, 3]);
  assert.deepEqual(windowOf(4), [3, 5]);
  assert.deepEqual(windowOf(7), [6, 8]);
  assert.deepEqual(windowOf(30), [26, 34]);
  assert.deepEqual(windowOf(240), [209, 271]);
  assert.equal(INTERVALS.at(-1), 240);
});

test('ôn dài dàn tải: chọn ngày NHẸ nhất trong cửa sổ, hoà thì gần ngày chuẩn; cửa sổ đầy thì nới thêm vài ngày chứ không đẩy xa', () => {
  const today = '2026-10-10';
  const [lo, hi] = windowOf(30);
  const load: Record<string, number> = {};
  for (let d = lo; d <= hi; d += 1) load[addDays(today, d)] = 5;
  load[addDays(today, 32)] = 1;
  assert.equal(pickDay(load, today, lo, hi, DAILY_CAP, 30), addDays(today, 32));
  assert.equal(pickDay({}, today, lo, hi, DAILY_CAP, 30), addDays(today, 30));
  for (let d = lo; d <= hi; d += 1) load[addDays(today, d)] = DAILY_CAP;
  const far = daysBetween(today, pickDay(load, today, lo, hi, DAILY_CAP, 30));
  assert.ok(far <= hi + Math.ceil(hi * 0.25), `bị đẩy tới ngày ${far}`);
});

test('KHÔNG BAO GIỜ đẩy lần ôn ra xa: 10 từ mới mỗi ngày suốt 150 ngày, đều đúng — lần ôn đầu luôn ngày mai, mọi lần ôn nằm trong cửa sổ + nới', () => {
  const t0 = '2026-10-01';
  const reviews: Reviews = { deck: {} };
  let id = 0;
  let worst = 0;
  let firstWorst = 0;
  for (let d = 0; d < 150; d += 1) {
    const today = addDays(t0, d);
    for (const [w, e] of Object.entries(reviews.deck!).filter(([, x]) => x.due <= today)) {
      const load = loadByDay(reviews, today, { slug: 'deck', word: w });
      const n = nextReview(e, true, today, load);
      const gap = daysBetween(today, n.due);
      const [, hi] = windowOf(INTERVALS[n.box]!);
      worst = Math.max(worst, gap - (hi + Math.max(2, Math.ceil(hi * 0.25))));
      reviews.deck![w] = n;
    }
    for (let k = 0; k < 10; k += 1) {
      const w = `w${id++}`;
      const load = loadByDay(reviews, today, { slug: 'deck', word: w });
      reviews.deck![w] = nextReview(undefined, true, today, load);
      firstWorst = Math.max(firstWorst, daysBetween(today, reviews.deck![w]!.due));
    }
  }
  assert.ok(worst <= 0, `có lần ôn bị đẩy quá cửa sổ ${worst} ngày`);
  assert.equal(firstWorst, 1, 'lần ôn đầu luôn là ngày mai');
});

test('sửa lịch cũ: lần ôn bị đẩy xa quá cửa sổ được kéo về, xếp từ hôm nay (trần mỗi ngày), và chạy lại không đổi gì', () => {
  const today = '2026-10-20';
  const old: Reviews = { a: {} };
  for (let i = 0; i < 100; i += 1) old.a![`w${i}`] = { box: 0, due: addDays(today, 30 + (i % 20)), last: addDays(today, -(i % 10) - 1) };
  old.a!.fine = { box: 3, due: addDays(today, 7), last: today };
  const fixed = repairReviews(old, today);
  assert.deepEqual(fixed.a!.fine, old.a!.fine, 'từ đang đúng lịch không bị động');
  for (const [w, e] of Object.entries(fixed.a!)) {
    if (w === 'fine') continue;
    assert.ok(daysBetween(today, e.due) <= 3, `${w} xếp quá xa: ${e.due}`);
  }
  const load = loadByDay(fixed, today);
  assert.ok((load[today] ?? 0) <= DAILY_CAP + 1, 'hôm nay không quá trần');
  assert.equal(repairReviews(fixed, today), fixed, 'lũy đẳng');
  const keep = { a: { x: { box: 1, due: addDays(today, 2), last: today } } };
  assert.equal(repairReviews(keep, today), keep, 'không có gì sai thì trả về nguyên bản');
});

test('từ sai: ôn lại ngày mai (tối đa ngày kia khi mai đã quá đầy); sai lặp lại cùng ngày giữ nguyên chỗ', () => {
  const today = '2026-10-02';
  const a = nextReview(undefined, false, today, {});
  assert.equal(a.due, '2026-10-03');
  const again = nextReview(a, false, today, { [a.due]: 5 });
  assert.deepEqual(again, a);
  const crowded = nextReview(undefined, false, today, { '2026-10-03': 120 });
  assert.equal(crowded.due, '2026-10-04');
});

test('đúng khi đến hạn: lên hộp; ngày chuẩn quá đầy thì lùi sang ngày còn chỗ trong cửa sổ', () => {
  const today = '2026-10-05';
  const full = { [addDays(today, 2)]: DAILY_CAP * 2.5 };
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

test('học 60 từ trong một buổi: mai ôn đủ 60, lần ôn thứ hai tách ~30/30 sang hai ngày liền, các hộp sau dàn trong cửa sổ', () => {
  const t0 = '2026-10-08';
  const reviews: Record<string, Record<string, ReviewEntry>> = { d: {} };
  for (const w of names(0, 60)) reviews.d![w] = nextReview(undefined, true, t0, loadByDay(reviews, t0, { slug: 'd', word: w }));
  const dueOn = (day: string) => Object.values(reviews.d!).filter((e) => e.due === day).length;
  assert.equal(dueOn(addDays(t0, 1)), 60);
  // Ngày 2: ôn đủ 60, tất cả đúng ⇒ lên hộp 1 (ngày chuẩn 2, cửa sổ [2,3]) và chia đều hai ngày.
  const d1 = addDays(t0, 1);
  for (const w of names(0, 60)) reviews.d![w] = nextReview(reviews.d![w], true, d1, loadByDay(reviews, d1, { slug: 'd', word: w }));
  assert.equal(dueOn(addDays(d1, 2)), 30);
  assert.equal(dueOn(addDays(d1, 3)), 30);
  // Không từ nào bị hẹn xa hơn cửa sổ của hộp.
  for (const e of Object.values(reviews.d!)) assert.ok(daysBetween(d1, e.due) <= windowOf(2)[1]);
});
