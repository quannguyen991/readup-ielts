import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeActiveRounds, mergeTopicStudy, type RoundPayload, type TopicStudyPayload } from './store-merges';

const NOW = Date.parse('2026-10-30T12:00:00Z');
const round = (asked: number, at: number): RoundPayload => ({ words: ['a', 'b'], asked, at });
const cleared = (at: number): RoundPayload => ({ words: [], asked: 0, cleared: true, at });
const H = 3_600_000;

test('hai máy cùng có vòng dở: bản lưu muộn hơn thắng, dù ít câu hơn', () => {
  const m = mergeActiveRounds({ s: round(30, NOW - 5 * H) }, { s: round(12, NOW - 1 * H) }, {}, NOW);
  assert.equal(m.s?.asked, 12);
});

test('chỉ một máy có vòng thì giữ vòng đó', () => {
  assert.equal(mergeActiveRounds({ s: round(4, NOW - H) }, undefined, {}, NOW).s?.asked, 4);
  assert.equal(mergeActiveRounds(undefined, { s: round(7, NOW - H) }, {}, NOW).s?.asked, 7);
});

test('vòng đã xong ở máy này không bị máy kia làm sống lại', () => {
  const m = mergeActiveRounds({ s: cleared(NOW - H) }, { s: round(20, NOW - 3 * H) }, {}, NOW);
  assert.equal(m.s?.cleared, true);
});

test('vòng mới học sau dấu xoá thì thắng dấu', () => {
  const m = mergeActiveRounds({ s: cleared(NOW - 3 * H) }, { s: round(5, NOW - H) }, {}, NOW);
  assert.equal(m.s?.cleared, undefined);
  assert.equal(m.s?.asked, 5);
});

test('xoá tiến độ bộ: vòng cũ hơn lúc xoá bị bỏ, vòng học lại sau đó giữ', () => {
  const resets = { s: new Date(NOW - 2 * H).toISOString(), t: new Date(NOW - 2 * H).toISOString() };
  const m = mergeActiveRounds({ s: round(9, NOW - 5 * H), t: round(3, NOW - H) }, undefined, resets, NOW);
  assert.equal(m.s, undefined);
  assert.equal(m.t?.asked, 3);
});

test('vòng và dấu quá 30 ngày thì bỏ; bản lưu cũ chưa có mốc giờ vẫn giữ nếu không có gì tốt hơn', () => {
  const old = NOW - 31 * 86_400_000;
  const m = mergeActiveRounds({ a: round(3, old), b: cleared(old), c: { words: ['x'], asked: 2 } }, undefined, {}, NOW);
  assert.deepEqual(Object.keys(m), ['c']);
});

test('bản lưu cũ chưa có mốc giờ thua bản có mốc giờ', () => {
  const m = mergeActiveRounds({ s: { words: ['x'], asked: 40 } }, { s: round(2, NOW - H) }, {}, NOW);
  assert.equal(m.s?.asked, 2);
});

test('mergeTopicStudy mang vòng dở sang kết quả gộp', () => {
  const base = (over: Partial<TopicStudyPayload>): TopicStudyPayload => ({ stages: {}, scores: {}, starred: {}, lapses: {}, mistakeLog: [], learnSettings: {}, lastAt: {}, ...over });
  const at = Date.now() - H;
  const local = base({ activeRound: { s: round(3, at) } });
  const remote = base({ activeRound: { s: round(8, at + 1000), t: round(1, at) } });
  const merged = mergeTopicStudy(local, remote);
  assert.equal(merged.activeRound?.s?.asked, 8);
  assert.equal(merged.activeRound?.t?.asked, 1);
  assert.equal(mergeTopicStudy(local, null).activeRound?.s?.asked, 3);
});
