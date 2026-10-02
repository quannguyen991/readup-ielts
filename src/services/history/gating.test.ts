import test from 'node:test';
import assert from 'node:assert/strict';

import { DEV_FIXTURE } from '@/data/history/__dev__/fixture';

import { claimStatusCounts, indexClaims, isScenePublishable, isTopicVisible, sceneBlockers, sceneHasSingleSource, visibleScenes } from './gating';
import type { TopicBundle } from './types';

const fx = (): TopicBundle => structuredClone(DEV_FIXTURE);

test('cổng: cảnh published + khẳng định verified/single-source + có ảnh & audio thì được hiện', () => {
  const b = fx();
  assert.deepEqual(visibleScenes(b).map((s) => s.id), ['s01', 's02', 's03']);
});

test('cổng: khẳng định disputed / unverified chặn cảnh, kể cả khi cảnh được đánh dấu published', () => {
  const b = fx();
  const s4 = b.scenes[3]!;
  s4.status = 'published';
  s4.imagePending = false;
  s4.audioPending = false;
  s4.image = b.scenes[0]!.image;
  s4.audio = b.scenes[0]!.audio;
  assert.deepEqual(sceneBlockers(s4, indexClaims(b.claims)), ['claim-blocked']);
  b.claims[3]!.status = 'unverified';
  assert.equal(isScenePublishable(s4, indexClaims(b.claims)), false);
  b.claims[3]!.status = 'single-source';
  assert.equal(isScenePublishable(s4, indexClaims(b.claims)), true);
});

test('cổng: cờ pending, thiếu ảnh/audio.en, status draft/verified đều chặn', () => {
  const b = fx();
  const claims = indexClaims(b.claims);
  const s = b.scenes[0]!;
  s.audioPending = true;
  assert.ok(sceneBlockers(s, claims).includes('audio'));
  s.audioPending = false;
  delete s.audio!.en;
  assert.ok(sceneBlockers(s, claims).includes('audio'));
  s.imagePending = true;
  assert.ok(sceneBlockers(s, claims).includes('image'));
  const t = b.scenes[1]!;
  t.status = 'verified';
  assert.ok(sceneBlockers(t, claims).includes('status'));
});

test('cổng: cảnh không có khẳng định nào, hoặc claimId mồ côi, bị chặn', () => {
  const b = fx();
  const s = b.scenes[0]!;
  s.claimIds = [];
  assert.ok(sceneBlockers(s, indexClaims(b.claims)).includes('no-claims'));
  s.claimIds = ['c99-1'];
  assert.ok(sceneBlockers(s, indexClaims(b.claims)).includes('claim-missing'));
});

test('cổng: nhãn "Nguồn đơn" chỉ ở cảnh có khẳng định single-source', () => {
  const b = fx();
  const claims = indexClaims(b.claims);
  assert.equal(sceneHasSingleSource(b.scenes[0]!, claims), false);
  assert.equal(sceneHasSingleSource(b.scenes[1]!, claims), true);
});

test('cổng: chủ đề chỉ hiện khi published và có ít nhất một cảnh qua cổng', () => {
  const b = fx();
  assert.equal(isTopicVisible(b), true);
  b.topic.status = 'draft';
  assert.equal(isTopicVisible(b), false);
  b.topic.status = 'published';
  for (const s of b.scenes) s.status = 'draft';
  assert.equal(isTopicVisible(b), false);
  assert.equal(visibleScenes(b, { dev: true }).length, 4, 'bản thử bỏ qua cổng');
});

test('cổng: thứ tự cảnh theo topic.sceneIds, không theo thứ tự trong scenes.json', () => {
  const b = fx();
  b.scenes.reverse();
  assert.deepEqual(visibleScenes(b).map((s) => s.id), ['s01', 's02', 's03']);
});

test('đếm trạng thái khẳng định', () => {
  assert.deepEqual(claimStatusCounts(fx().claims), { verified: 2, 'single-source': 1, disputed: 1, unverified: 0 });
});
