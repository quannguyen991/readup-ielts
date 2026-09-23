import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateMath } from '@/lib/math/expr';
import {
  better,
  buildWeeklyChallenge,
  mergeWeekly,
  msUntilNextWeek,
  parseWeekId,
  rankOf,
  weekId,
  weekLabel,
  weekStart,
  type WeeklyResult,
} from './challenge';

test('mã tuần theo ISO và giờ Việt Nam', () => {
  // Thứ Tư 23/9/2026 → tuần 39.
  assert.equal(weekId(Date.parse('2026-09-23T05:00:00Z')), 'w2026_39');
  // Chủ nhật 27/9 lúc 23:30 giờ VN vẫn là tuần 39 …
  assert.equal(weekId(Date.parse('2026-09-27T16:30:00Z')), 'w2026_39');
  // … nhưng 00:30 thứ Hai 28/9 giờ VN (17:30 UTC Chủ nhật) đã sang tuần 40.
  assert.equal(weekId(Date.parse('2026-09-27T17:30:00Z')), 'w2026_40');
  // Đầu năm: 1/1/2027 (thứ Sáu) thuộc tuần 53 của 2026.
  assert.equal(weekId(Date.parse('2027-01-01T05:00:00Z')), 'w2026_53');
  assert.deepEqual(parseWeekId('w2026_39'), { year: 2026, week: 39 });
  assert.equal(weekLabel('w2026_39'), '21/9–27/9');
  assert.equal(weekId(weekStart('w2026_39')), 'w2026_39');
  assert.equal(weekId(weekStart('w2026_39') - 1), 'w2026_38');
  const now = Date.parse('2026-09-23T05:00:00Z');
  assert.equal(weekId(now + msUntilNextWeek(now)), 'w2026_40');
});

test('đề của tuần: 10 câu cố định theo tuần, xen kẽ Math/Verbal, không trùng', () => {
  for (const id of ['w2026_39', 'w2026_40', 'w2027_01']) {
    const a = buildWeeklyChallenge(id);
    const b = buildWeeklyChallenge(id);
    assert.equal(a.length, 10);
    assert.deepEqual(JSON.stringify(a), JSON.stringify(b), 'cùng tuần phải ra đúng cùng đề');
    a.forEach((it, i) => assert.equal(it.kind, i % 2 === 0 ? 'math' : 'verbal'));
    const verbalIds = a.filter((x) => x.kind === 'verbal').map((x) => (x.kind === 'verbal' ? x.question.id : ''));
    assert.equal(new Set(verbalIds).size, 5);
    for (const it of a) if (it.kind === 'math') assert.deepEqual(validateMath(it.item.stem), []);
  }
  assert.notEqual(JSON.stringify(buildWeeklyChallenge('w2026_39')), JSON.stringify(buildWeeklyChallenge('w2026_40')));
});

test('xếp hạng: nhiều câu đúng hơn, bằng nhau thì nhanh hơn; top % làm tròn lên', () => {
  assert.ok(better({ score: 8, ms: 900_000 }, { score: 7, ms: 100_000 }));
  assert.ok(better({ score: 8, ms: 500_000 }, { score: 8, ms: 600_000 }));
  const others = [
    { score: 10, ms: 400_000 },
    { score: 8, ms: 300_000 },
    { score: 8, ms: 700_000 },
    { score: 5, ms: 200_000 },
  ];
  assert.deepEqual(rankOf({ score: 8, ms: 500_000 }, others), { rank: 3, total: 5, topPercent: 60 });
  assert.deepEqual(rankOf({ score: 10, ms: 100_000 }, []), { rank: 1, total: 1, topPercent: 100 });
  const many = Array.from({ length: 199 }, () => ({ score: 1, ms: 1 }));
  assert.equal(rankOf({ score: 10, ms: 1 }, many).topPercent, 1);
});

test('gộp giữa hai máy: mỗi tuần giữ lần làm đầu tiên', () => {
  const r = (score: number, at: string): WeeklyResult => ({ score, total: 10, ms: 1, at, wrong: [] });
  const merged = mergeWeekly(
    { w2026_39: r(9, '2026-09-23T10:00:00Z'), w2026_38: r(5, '2026-09-15T10:00:00Z') },
    { w2026_39: r(4, '2026-09-22T10:00:00Z') },
  );
  assert.equal(merged.w2026_39!.score, 4, 'lần trước (điểm thấp hơn) vẫn là lần được tính');
  assert.equal(merged.w2026_38!.score, 5);
});
