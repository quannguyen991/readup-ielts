import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clampVolume, createSfxGate, isSfxId, SFX_CATALOG } from './sfx-core';

test('id lạ bị bỏ qua, không nổ', () => {
  const g = createSfxGate(() => 1000);
  assert.equal(g.allow('khong-co'), false);
  assert.equal(g.allow('toString'), false);
  assert.equal(isSfxId(undefined), false);
  assert.equal(isSfxId('tap'), true);
});

test('tắt tiếng hoặc âm lượng 0 thì im', () => {
  let t = 0;
  const g = createSfxGate(() => (t += 10_000));
  g.setMuted(true);
  assert.equal(g.allow('tap'), false);
  g.setMuted(false);
  assert.equal(g.allow('tap'), true);
  g.setVolume(0);
  assert.equal(g.allow('select'), false);
  g.setVolume(0.5);
  assert.equal(g.allow('select'), true);
});

test('cùng một tiếng kêu dồn thì chỉ phát một lần, hết khoảng thì phát lại', () => {
  let t = 5000;
  const g = createSfxGate(() => t);
  assert.equal(g.allow('flip'), true);
  t += SFX_CATALOG.flip.debounce - 1;
  assert.equal(g.allow('flip'), false);
  assert.equal(g.allow('tap'), true, 'tiếng khác không bị chặn');
  t += 2;
  assert.equal(g.allow('flip'), true);
});

test('âm lượng được kẹp 0–1', () => {
  assert.equal(clampVolume(3), 1);
  assert.equal(clampVolume(-1), 0);
  assert.equal(clampVolume(Number.NaN), 0.8);
});

test('Du ngoạn: mọi tiếng cần cho engine đều có trong danh mục, nhóm travel, có chống dồn', () => {
  for (const id of ['step', 'doorOpen', 'doorClose', 'enter', 'leave', 'npc', 'greet', 'locked', 'seam', 'plane', 'fullscreen', 'fullscreenOff', 'takeoff']) {
    assert.ok(isSfxId(id), id);
    assert.equal(SFX_CATALOG[id as keyof typeof SFX_CATALOG].group, 'travel', id);
    assert.ok(SFX_CATALOG[id as keyof typeof SFX_CATALOG].debounce >= 70, id);
  }
  const gate = createSfxGate(() => 0);
  gate.setMuted(true);
  assert.equal(gate.allow('step'), false);
});
