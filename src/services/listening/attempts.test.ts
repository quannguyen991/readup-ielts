import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeListeningAttempts } from './attempts';
import type { ListeningAttempt } from './types';

const at = (id: string, finishedAt: string): ListeningAttempt => ({
  id, testId: 't', title: 'T', section: 1, mode: 'practice', startedAt: finishedAt, finishedAt,
  durationSec: 60, score: 5, total: 10, band: 6, answers: {},
});

test('gộp lượt làm: hợp theo id, mới nhất trước', () => {
  const m = mergeListeningAttempts(
    [at('a', '2026-10-01T10:00:00Z'), at('b', '2026-10-02T10:00:00Z')],
    [at('b', '2026-10-02T10:00:00Z'), at('c', '2026-10-03T10:00:00Z')],
  );
  assert.deepEqual(m.map((x) => x.id), ['c', 'b', 'a']);
});

test('gộp lượt làm: chịu được dữ liệu rỗng / hỏng', () => {
  assert.deepEqual(mergeListeningAttempts(null, undefined), []);
  assert.equal(mergeListeningAttempts([null as never, at('a', '2026-10-01T00:00:00Z')], null).length, 1);
});
