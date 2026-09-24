import assert from 'node:assert/strict';
import { test } from 'node:test';

import { byRecent, deckProgress, fold, isInProgress, relativeTimeVi } from './deck-library';

const words = [{ word: 'adopt' }, { word: 'sibling' }, { word: 'kin' }, { word: 'spouse' }];

test('tiến độ đếm theo danh sách từ của bộ, bỏ qua từ đã rời bộ', () => {
  const p = deckProgress(words, { adopt: 2, sibling: 1, kin: 2, removed: 2 }, '2026-09-24T08:00:00Z');
  assert.deepEqual(p, { mastered: 2, learning: 1, total: 4, lastAt: '2026-09-24T08:00:00Z' });
  assert.deepEqual(deckProgress(words, undefined, undefined), { mastered: 0, learning: 0, total: 4, lastAt: null });
});

test('bộ đang học: đã mở màn luyện hoặc đã có từ nhận ra', () => {
  assert.equal(isInProgress(deckProgress(words, undefined, null)), false);
  assert.equal(isInProgress(deckProgress(words, { kin: 1 }, null)), true);
  assert.equal(isInProgress(deckProgress(words, undefined, '2026-09-24T08:00:00Z')), true);
});

test('bộ học gần nhất lên đầu, bộ chưa học giữ thứ tự cũ ở cuối', () => {
  const decks = [
    { id: 'a', at: null },
    { id: 'b', at: '2026-09-20T00:00:00Z' },
    { id: 'c', at: null },
    { id: 'd', at: '2026-09-23T00:00:00Z' },
  ];
  assert.deepEqual(byRecent(decks, (d) => d.at).map((d) => d.id), ['d', 'b', 'a', 'c']);
});

test('học lần cuối nói bằng lời', () => {
  const now = new Date('2026-09-24T12:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const min = 60_000;
  assert.equal(relativeTimeVi(null, now), 'chưa học');
  assert.equal(relativeTimeVi(ago(20_000), now), 'vừa xong');
  assert.equal(relativeTimeVi(ago(12 * min), now), '12 phút trước');
  assert.equal(relativeTimeVi(ago(18 * 60 * min), now), '18 giờ trước');
  assert.equal(relativeTimeVi(ago(26 * 60 * min), now), '1 ngày trước');
  assert.equal(relativeTimeVi(ago(15 * 24 * 60 * min), now), '2 tuần trước');
  assert.equal(relativeTimeVi(ago(95 * 24 * 60 * min), now), '3 tháng trước');
  assert.equal(relativeTimeVi('không phải ngày', now), 'chưa học');
});

test('tìm không dấu vẫn ra', () => {
  assert.equal(fold('Môi trường'), 'moi truong');
  assert.equal(fold('Động vật hoang dã'), 'dong vat hoang da');
  assert.ok(fold('Giáo dục').includes(fold('giao duc')));
});
