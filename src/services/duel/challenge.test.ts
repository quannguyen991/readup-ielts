import { test } from 'node:test';
import assert from 'node:assert/strict';

import { decodeChallenge, encodeChallenge, newChallengeSeed, verdictOf } from './challenge';

test('mã hoá rồi giải mã thì ra đúng thông tin, và không có ký tự + / =', () => {
  const payload = { d: 'school-life', s: 'abc123', p: 640, c: 7, t: 10 };
  const raw = encodeChallenge(payload);
  assert.match(raw, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeChallenge(raw), payload);
});

test('chuỗi rác, sai phiên bản, hoặc số ngoài khoảng đều bị từ chối (null)', () => {
  assert.equal(decodeChallenge(''), null);
  assert.equal(decodeChallenge('không-phải-base64!!'), null);
  const bad = Buffer.from(JSON.stringify({ v: 2, d: 'x', s: 'y', p: 1, c: 0, t: 10 })).toString('base64url');
  assert.equal(decodeChallenge(bad), null);
  const tooMany = Buffer.from(JSON.stringify({ v: 1, d: 'x', s: 'y', p: 1, c: 11, t: 10 })).toString('base64url');
  assert.equal(decodeChallenge(tooMany), null);
  const noSeed = Buffer.from(JSON.stringify({ v: 1, d: 'x', p: 1, c: 0, t: 10 })).toString('base64url');
  assert.equal(decodeChallenge(noSeed), null);
});

test('hạt giống mới là chuỗi 6 ký tự chữ và số', () => {
  for (let i = 0; i < 20; i += 1) assert.match(newChallengeSeed(), /^[0-9a-z]{6}$/);
});

test('so điểm: cao hơn thắng, bằng nhau là hoà', () => {
  assert.equal(verdictOf(500, 300), 'win');
  assert.equal(verdictOf(300, 500), 'lose');
  assert.equal(verdictOf(400, 400), 'draw');
});
