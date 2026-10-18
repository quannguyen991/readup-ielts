import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeStudy, type StudyPayload } from './store-merges';

const base = (over: Partial<StudyPayload> = {}): StudyPayload => ({
  sessions: [],
  progress: {},
  daily: {},
  bookmarks: [],
  targetBand: 7,
  dailyGoalMinutes: 60,
  readingWpm: [],
  vocabRuns: [],
  ...over,
});

test('ngày chỉ có việc đã xong trên máy kia vẫn còn sau khi đồng bộ (events lấy số lớn hơn)', () => {
  const local = base({ daily: { '2026-10-18': { minutes: 0, questions: 0, wordsReviewed: 0, events: 0 } } });
  const remote = base({ daily: { '2026-10-18': { minutes: 0, questions: 0, wordsReviewed: 0, events: 3 } } });
  const merged = mergeStudy(local, remote);
  assert.equal(merged.daily['2026-10-18']?.events, 3);
});

test('thời gian theo hoạt động của hai máy được gộp theo số lớn hơn, không cái nào đè cái nào', () => {
  const local = base({
    daily: { '2026-10-18': { minutes: 5, questions: 0, wordsReviewed: 0, byActivity: { practice: 5, review: 0 } as never } },
  });
  const remote = base({
    daily: { '2026-10-18': { minutes: 2, questions: 0, wordsReviewed: 0, byActivity: { practice: 1, reading_library: 2 } as never } },
  });
  const day = mergeStudy(local, remote).daily['2026-10-18'] as unknown as { byActivity: Record<string, number> };
  assert.deepEqual(day.byActivity, { practice: 5, review: 0, reading_library: 2 });
});

test('lịch sử từ vựng hợp theo id, mới nhất trước, và không nhân đôi khi đồng bộ lại', () => {
  const run = (id: string, at: string) => ({ id, deck: 'd', title: 'Bộ', correct: 3, total: 5, finishedAt: at });
  const local = base({ vocabRuns: [run('a', '2026-10-18T09:00:00Z')] });
  const remote = base({ vocabRuns: [run('a', '2026-10-18T09:00:00Z'), run('b', '2026-10-18T10:00:00Z')] });
  const merged = mergeStudy(local, remote);
  assert.deepEqual(merged.vocabRuns?.map((r) => r.id), ['b', 'a']);
  assert.equal(mergeStudy(merged, remote).vocabRuns?.length, 2);
});
