import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ledgerAdd, ticketsOf, coinsOf } from './economy';
import {
  awardCorrect,
  awardDaily,
  awardPractice,
  awardVisit,
  isClaimed,
  markClaimed,
  monthPointsOf,
  nextTier,
  pointsOf,
  readyTiers,
  tierState,
  travelStreak,
} from './passport';
import { MONTHLY_PRIZES, PASSPORT_POINTS, PRO_MAX_GRANT, TIERS, prizeLabelForRank } from './passport-rewards';
import { emptyTravel, mergeTravel, normalizeTravel, withDerived } from './sync';

const D1 = '2026-10-02';
const visit = (l: Record<string, number>, over: Partial<Parameters<typeof awardVisit>[1]> = {}) =>
  awardVisit(l, { day: D1, poiId: 'paris-louvre', bestBefore: 0, bestAfter: 3, correct: 6, ...over });

test('điểm: lần đầu đạt 3 sao tính cả mốc 2 sao và 3 sao, kèm ngày đi và câu đúng', () => {
  const l = visit({}, { souvenir: 'sv-x', stamp: 'paris' });
  const P = PASSPORT_POINTS;
  assert.equal(pointsOf(l), P.dailyTravel + P.poiTwoStars + P.poiThreeStars + P.souvenir + P.stamp + 6 * P.perCorrect);
});

test('điểm: ghi lại cùng kết quả (hoặc hai máy cùng ghi) không cộng đôi', () => {
  const once = visit({}, { souvenir: 'sv-x', stamp: 'paris' });
  const twice = visit(once, { souvenir: 'sv-x', stamp: 'paris', bestBefore: 0, correct: 0 });
  assert.equal(pointsOf(twice), pointsOf(once));
  const a = visit({});
  const b = visit({});
  const merged = mergeTravel(withDerived({ ...emptyTravel(D1), ledger: a }), withDerived({ ...emptyTravel(D1), ledger: b }));
  assert.equal(pointsOf(merged.ledger), pointsOf(a));
});

test('điểm: mốc sao và quà là MỘT LẦN dù làm lại ở ngày khác', () => {
  const day1 = visit({}, { souvenir: 'sv-x', stamp: 'paris' });
  const day2 = visit(day1, { day: '2026-10-03', souvenir: 'sv-x', stamp: 'paris', bestBefore: 1, bestAfter: 3, correct: 0 });
  assert.equal(pointsOf(day2) - pointsOf(day1), PASSPORT_POINTS.dailyTravel + PASSPORT_POINTS.streakPerDay);
});

test('điểm: câu đúng có trần mỗi ngày, ngày khác đếm lại', () => {
  let l = awardCorrect({}, D1, 15);
  l = awardCorrect(l, D1, 15);
  assert.equal(pointsOf(l), PASSPORT_POINTS.correctDailyCap);
  l = awardCorrect(l, '2026-10-03', 4);
  assert.equal(pointsOf(l), PASSPORT_POINTS.correctDailyCap + 4);
});

test('điểm: chuỗi ngày đi liền tăng thưởng, đứt chuỗi thì về lại 1, có trần', () => {
  let l = awardDaily({}, '2026-10-01');
  l = awardDaily(l, '2026-10-02');
  assert.equal(travelStreak(l, '2026-10-02'), 2);
  l = awardDaily(l, '2026-10-05');
  assert.equal(travelStreak(l, '2026-10-05'), 1);
  assert.equal(awardDaily(l, '2026-10-05'), l);
  let long: Record<string, number> = {};
  for (let d = 1; d <= 20; d += 1) long = awardDaily(long, `2026-11-${String(d).padStart(2, '0')}`);
  assert.equal(long['pp:2026-11-20:streak:2026-11-20'], PASSPORT_POINTS.streakMax);
});

test('điểm: ôn / hải quan chỉ tính ngày đi và câu đúng; 0 câu đúng thì không có gì', () => {
  assert.deepEqual(awardPractice({}, D1, 0), {});
  assert.equal(pointsOf(awardPractice({}, D1, 3)), PASSPORT_POINTS.dailyTravel + 3);
});

test('điểm tháng tách theo mã khoản; vé và xu không bị lẫn', () => {
  let l = awardPractice({}, '2026-09-30', 2);
  l = awardPractice(l, '2026-10-02', 4);
  l = ledgerAdd(l, 'tk:welcome', 2);
  l = ledgerAdd(l, 'co:visit:a:1', 10);
  assert.equal(monthPointsOf(l, '2026-10'), PASSPORT_POINTS.dailyTravel + 4);
  assert.equal(monthPointsOf(l, '2026-09'), PASSPORT_POINTS.dailyTravel + 2);
  assert.equal(ticketsOf(l), 2);
  assert.equal(coinsOf(l), 10);
});

test('mốc quà: đủ điểm thì sẵn sàng, nhận rồi thì khoá lại, nhận hai lần không đổi', () => {
  const [t1, t2] = TIERS;
  assert.ok(t1 && t2);
  const few = { 'pp:2026-10-02:ans:1': t1.points - 1 };
  assert.equal(tierState(few, t1), 'locked');
  const enough = { 'pp:2026-10-02:day:2026-10-02': t1.points };
  assert.equal(tierState(enough, t1), 'ready');
  assert.deepEqual(readyTiers(enough).map((t) => t.id), [t1.id]);
  const claimed = markClaimed(enough, t1.id);
  assert.equal(isClaimed(claimed, t1.id), true);
  assert.equal(tierState(claimed, t1), 'claimed');
  assert.equal(markClaimed(claimed, t1.id), claimed);
  assert.equal(pointsOf(claimed), t1.points);
  assert.equal(nextTier(t1.points)?.id, t2.id);
  assert.equal(nextTier(10_000), null);
});

test('mốc quà: tăng dần, mốc đỉnh là Pro Max', () => {
  for (let i = 1; i < TIERS.length; i += 1) assert.ok(TIERS[i]!.points > TIERS[i - 1]!.points);
  const top = TIERS[TIERS.length - 1]!;
  assert.equal(top.top, true);
  assert.ok(top.grants.some((g) => g.kind === 'promax'));
  assert.ok(PRO_MAX_GRANT.days > 0);
  assert.match(PRO_MAX_GRANT.label.vi, /Pro Max/);
});

test('giải tháng: hạng 1 là Pro Max, ngoài top 10 không có giải', () => {
  assert.match(prizeLabelForRank(1)!.vi, /Pro Max/);
  assert.ok(prizeLabelForRank(MONTHLY_PRIZES[MONTHLY_PRIZES.length - 1]!.upTo));
  assert.equal(prizeLabelForRank(11), null);
  assert.equal(prizeLabelForRank(0), null);
});

test('đồng bộ: điểm và quà đã nhận hợp theo mã giữa hai máy; bộ từ đã chọn theo bản mới hơn', () => {
  const a = withDerived({ ...emptyTravel(D1), ledger: markClaimed(awardPractice({}, D1, 5), 'p040'), decks: ['food'], updatedAt: '2026-10-02T08:00:00Z' });
  const b = withDerived({ ...emptyTravel(D1), ledger: awardPractice({}, '2026-10-03', 5), decks: ['tourism', 'transport'], updatedAt: '2026-10-03T08:00:00Z' });
  const m = mergeTravel(a, b);
  assert.equal(pointsOf(m.ledger), 2 * PASSPORT_POINTS.dailyTravel + 10); // máy b chưa biết ngày 10-02 nên chưa có thưởng chuỗi
  assert.equal(isClaimed(m.ledger, 'p040'), true);
  assert.deepEqual(m.decks, ['tourism', 'transport']);
  assert.deepEqual(mergeTravel(b, a).decks, ['tourism', 'transport']);
});

test('chuẩn hoá: bản lưu cũ không có `decks` ra danh sách rỗng; mã lạ bị bỏ', () => {
  assert.deepEqual(normalizeTravel({ ledger: {} }).decks, []);
  assert.deepEqual(normalizeTravel({ decks: ['food', 'khong-co-bo-nay', 'food', 7] }).decks, ['food']);
});
