import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { WritingEvaluation, WritingSubmission } from '@/lib/writing/types';
import { mergeWriting } from './store-sync';

const sub = (id: string, submittedAt: string) =>
  ({ id, promptId: 'p', mode: 'full', drillPart: null, bodyText: '', wordCount: 200, durationSeconds: 1200, submittedAt }) as unknown as WritingSubmission;

const ev = (submissionId: string, evaluatedAt: string, bandLow: number) =>
  ({ submissionId, evaluatedAt, bandLow, bandHigh: bandLow + 0.5 }) as unknown as WritingEvaluation;

test('bài nộp hợp theo id, không nhân đôi, mới nhất trước', () => {
  const merged = mergeWriting(
    { submissions: [sub('a', '2026-10-10T08:00:00Z'), sub('b', '2026-10-12T08:00:00Z')] },
    { submissions: [sub('b', '2026-10-12T08:00:00Z'), sub('c', '2026-10-15T08:00:00Z')] },
  );
  assert.deepEqual(merged.submissions.map((s) => s.id), ['c', 'b', 'a']);
});

test('bản chấm cùng bài thì giữ bản chấm sau', () => {
  const merged = mergeWriting(
    { submissions: [sub('a', '2026-10-10T08:00:00Z')], evaluations: [ev('a', '2026-10-10T09:00:00Z', 6)] },
    { submissions: [sub('a', '2026-10-10T08:00:00Z')], evaluations: [ev('a', '2026-10-11T09:00:00Z', 7)] },
  );
  assert.equal(merged.evaluations.length, 1);
  assert.equal(merged.evaluations[0]?.bandLow, 7);
});

test('bản chấm của bài không còn trong danh sách thì bị bỏ', () => {
  const merged = mergeWriting({ evaluations: [ev('gone', '2026-10-10T09:00:00Z', 6)] }, { submissions: [sub('a', '2026-10-10T08:00:00Z')] });
  assert.deepEqual(merged.evaluations, []);
});

test('máy mới chưa có gì thì lấy hết từ máy chủ; cả hai trống thì rỗng', () => {
  assert.deepEqual(mergeWriting(null, null), { submissions: [], evaluations: [], modelEssays: {} });
  const fromRemote = mergeWriting(null, { submissions: [sub('x', '2026-10-01T00:00:00Z')] });
  assert.equal(fromRemote.submissions.length, 1);
});

test('bài mẫu: khoá trùng thì bản trên máy này thắng', () => {
  const merged = mergeWriting({ modelEssays: { 'p:7': { v: 'local' } } }, { modelEssays: { 'p:7': { v: 'remote' }, 'p:6': { v: 'r6' } } });
  assert.deepEqual(merged.modelEssays, { 'p:7': { v: 'local' }, 'p:6': { v: 'r6' } });
});
