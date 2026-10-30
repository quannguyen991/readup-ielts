import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nextRounds, withoutRound, type RoundLike } from './active-round';

const mark: RoundLike = { words: [], asked: 0, step: 0, cleared: true };
const round = (asked: number, step = 0): RoundLike => ({ words: ['a', 'b'], asked, step });

test('lưu vòng dở thì có mốc giờ', () => {
  const r = nextRounds({}, 's', round(3), 1000, mark)!;
  assert.equal(r.s?.asked, 3);
  assert.equal(r.s?.at, 1000);
});

test('mở lại màn mà chưa trả lời thêm: không đổi gì, giữ mốc giờ cũ', () => {
  const cur = nextRounds({}, 's', round(3), 1000, mark)!;
  assert.equal(nextRounds(cur, 's', round(3), 9000, mark), null);
  assert.equal(nextRounds(cur, 's', round(4), 9000, mark)!.s?.at, 9000);
});

test('bắt đầu lại (step đổi) là một vòng khác, được lưu dù số câu bằng nhau', () => {
  const cur = nextRounds({}, 's', round(3, 0), 1000, mark)!;
  assert.equal(nextRounds(cur, 's', round(3, 1), 5000, mark)!.s?.at, 5000);
});

test('vòng xong: để lại dấu có mốc giờ, không xoá mục', () => {
  const cur = nextRounds({}, 's', round(3), 1000, mark)!;
  const done = nextRounds(cur, 's', null, 2000, mark)!;
  assert.equal(done.s?.cleared, true);
  assert.equal(done.s?.at, 2000);
});

test('đã có dấu hoặc chưa có vòng thì xoá nữa không đổi gì', () => {
  const done = nextRounds(nextRounds({}, 's', round(3), 1000, mark)!, 's', null, 2000, mark)!;
  assert.equal(nextRounds(done, 's', null, 3000, mark), null);
  assert.equal(nextRounds({}, 'none', null, 3000, mark), null);
});

test('học vòng mới sau dấu: vòng thay dấu', () => {
  const done = nextRounds(nextRounds({}, 's', round(3), 1000, mark)!, 's', null, 2000, mark)!;
  const again = nextRounds(done, 's', round(1, 1), 3000, mark)!;
  assert.equal(again.s?.cleared, undefined);
  assert.equal(again.s?.asked, 1);
});

test('xoá tiến độ một bộ chỉ bỏ vòng của bộ đó', () => {
  const r = withoutRound({ s: round(2), t: round(5) }, 's');
  assert.equal(r.s, undefined);
  assert.equal(r.t?.asked, 5);
});
