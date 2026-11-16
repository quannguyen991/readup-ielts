import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getVocabTopic } from '@/data/vocab-topics';
import { PATH_RESOLVERS } from '@/services/learning-path/resolvers';
import { assignmentStatus } from '@/services/classes/assignments';

import { JA_LEVELS, ZH_LEVELS, eaNodesOf } from './east-asian';

test('lộ trình Trung có HSK 1–6, Nhật có N5–N1, mỗi cấp 9 chủ đề', () => {
  assert.deepEqual(ZH_LEVELS.map((l) => l.label), ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6']);
  assert.deepEqual(JA_LEVELS.map((l) => l.label), ['N5', 'N4', 'N3', 'N2', 'N1']);
  for (const l of [...ZH_LEVELS, ...JA_LEVELS]) assert.equal(l.parts.length, 9, l.id);
});

test('mọi bài trỏ tới buổi học có thật, có từ, mã bài không trùng', () => {
  const seen = new Set<string>();
  for (const l of [...ZH_LEVELS, ...JA_LEVELS]) {
    for (const n of eaNodesOf(l)) {
      assert.ok(!seen.has(n.id), `trùng ${n.id}`);
      seen.add(n.id);
      const t = getVocabTopic(n.slug);
      assert.ok(t, `thiếu buổi học ${n.slug}`);
      assert.ok(t.words.length > 0, n.slug);
      assert.equal(t.words.length, n.words);
    }
  }
});

test('tổng số từ khớp sách nguồn', () => {
  assert.equal(ZH_LEVELS.reduce((s, l) => s + l.words, 0), 4997);
  assert.equal(JA_LEVELS.reduce((s, l) => s + l.words, 0), 7811);
});

test('đo tiến độ bằng luật bộ từ dùng chung: chưa học thì "chưa làm"', () => {
  const node = eaNodesOf(ZH_LEVELS[0]!)[0]!;
  const s = assignmentStatus({ kind: 'vocab_deck', ref: node.slug, created_at: '1970-01-01T00:00:00.000Z' }, { synced: true }, PATH_RESOLVERS);
  assert.equal(s.state, 'todo');
  assert.ok((s.need ?? 0) > 0);
});
