import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addExpressRound, bumpStat, expressScore, itemKey, itemState, mergeStats, paragraphResult, setProgress, statsFromSessions } from './learn-status';

const sessions = [
  {
    mode: 'dictation' as const,
    finishedAt: '2026-11-01T10:00:00Z',
    attempts: [
      { itemId: 'a-01', accuracy: 1 },
      { itemId: 'a-02', accuracy: 0.5 },
    ],
  },
  { mode: 'translation' as const, finishedAt: '2026-11-02T10:00:00Z', attempts: [{ itemId: 't-01', selfCorrect: true }] },
];

test('chưa có lịch sử thì mọi câu là "new"', () => {
  assert.equal(itemState({}, 'dictation', 'a-01'), 'new');
  assert.deepEqual(setProgress({}, 'dictation', ['a-01', 'a-02']), { total: 2, learned: 0, tried: 0, state: 'new' });
});

test('lịch sử cũ: đạt ≥ 80% là đã học, thấp hơn là đang học', () => {
  const stats = statsFromSessions(sessions);
  assert.equal(itemState(stats, 'dictation', 'a-01'), 'learned');
  assert.equal(itemState(stats, 'dictation', 'a-02'), 'learning');
  assert.equal(itemState(stats, 'translation', 't-01'), 'learned');
  assert.equal(itemState(stats, 'translation', 'a-01'), 'new');
});

test('tiến độ bài: đủ mọi câu đã học mới "learned"', () => {
  const stats = statsFromSessions(sessions);
  const p = setProgress(stats, 'dictation', ['a-01', 'a-02', 'a-03']);
  assert.deepEqual(p, { total: 3, learned: 1, tried: 2, state: 'learning' });
  const done = setProgress(stats, 'dictation', ['a-01']);
  assert.equal(done.state, 'learned');
});

test('ghi theo từng câu thắng lịch sử cũ và giữ điểm cao nhất', () => {
  const legacy = statsFromSessions(sessions);
  const live = { [itemKey('dictation', 'a-02')]: bumpStat(undefined, 0.9, true, '2026-11-03T00:00:00Z') };
  const merged = mergeStats(legacy, live);
  assert.equal(itemState(merged, 'dictation', 'a-02'), 'learned');
  const again = bumpStat(live[itemKey('dictation', 'a-02')], 0.4, false, '2026-11-04T00:00:00Z');
  assert.equal(again.best, 0.9);
  assert.equal(again.passed, true);
  assert.equal(again.tries, 2);
});

test('tự diễn đạt: giữ 30 lần gần nhất và mức gợi ý cao nhất', () => {
  let rec = addExpressRound(undefined, { text: 'a', at: '1', errors: 2, passed: false }, 1);
  for (let i = 0; i < 40; i += 1) rec = addExpressRound(rec, { text: `t${i}`, at: String(i), errors: 0, passed: false }, 0);
  assert.equal(rec.rounds.length, 30);
  assert.equal(rec.hintLevel, 1);
  assert.equal(rec.rounds[rec.rounds.length - 1]!.text, 't39');
});

test('điểm tự diễn đạt: đạt = 1, còn lỗi thì trừ dần nhưng không âm', () => {
  assert.equal(expressScore({ errors: 0, passed: true }), 1);
  assert.equal(expressScore({ errors: 2, passed: false }), 0.5);
  assert.equal(expressScore({ errors: 9, passed: false }), 0);
});

test('viết cả đoạn: đủ câu và ≥ 80% câu sạch mới đạt', () => {
  assert.equal(paragraphResult(5, 3, 5).passed, false);
  assert.equal(paragraphResult(5, 4, 5).passed, true);
  assert.equal(paragraphResult(3, 3, 5).passed, false);
  assert.equal(paragraphResult(0, 0, 5).score, 0);
});
