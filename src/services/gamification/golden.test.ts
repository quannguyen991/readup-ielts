import assert from 'node:assert/strict';
import { test } from 'node:test';

import { goldenBoard, goldenOf, vnToday } from './golden';

test('ngày của bảng vàng theo giờ Việt Nam, không theo giờ máy chủ', () => {
  // 18:30 UTC ngày 24 là 01:30 sáng ngày 25 ở Việt Nam.
  assert.equal(vnToday(new Date('2026-09-24T18:30:00Z')).key, '2026-09-25');
  assert.equal(vnToday(new Date('2026-09-24T16:59:00Z')).key, '2026-09-24');
});

test('sao hôm nay = sao học hôm nay + sao thưởng trận đấu hôm nay; ngày khác thì không tính', () => {
  const { key, date } = vnToday(new Date('2026-09-24T05:00:00Z'));
  const u = { userId: 'u1', daily: { [key]: { minutes: 20, questions: 10 } }, frozen: [], game: { day: key, today: { correct: 12, answers: 15, vocab: 9, stars: 7 } } };
  const r = goldenOf(u, key, date);
  assert.equal(r.stars, 25 + 7, '20 phút + 10 câu × 0,5 = 25 sao học, cộng 7 sao trận');
  assert.deepEqual([r.correct, r.vocab, r.answers], [12, 9, 15]);
  const stale = goldenOf({ ...u, game: { day: '2026-09-20', today: { correct: 99, stars: 50 } } }, key, date);
  assert.deepEqual([stale.stars, stale.correct], [25, 0], 'số liệu game của ngày cũ không lên bảng hôm nay');
});

test('xếp theo sao, rồi câu đúng; người chưa học hôm nay không lên bảng', () => {
  const now = new Date('2026-09-24T05:00:00Z');
  const { key } = vnToday(now);
  const mk = (userId: string, minutes: number, correct: number) => ({ userId, daily: minutes ? { [key]: { minutes, questions: 0 } } : {}, frozen: [], game: { day: key, today: { correct } } });
  const { day, rows } = goldenBoard([mk('a', 10, 5), mk('b', 30, 1), mk('c', 10, 9), mk('d', 0, 0)], now);
  assert.equal(day, key);
  assert.deepEqual(rows.map((r) => r.userId), ['b', 'c', 'a']);
});
