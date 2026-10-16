import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isBreakExemptRoute, isStudyRoute } from './study-routes';

test('các khu vực học cộng giờ', () => {
  for (const p of ['/read/abc', '/sat/full-test', '/math/drill/x', '/vocabulary/topic/t/learn', '/sentence/dictation', '/listening/abc', '/speaking/room']) {
    assert.equal(isStudyRoute(p), true, p);
  }
});

test('trang không học thì không cộng giờ', () => {
  for (const p of ['/', '/settings', '/shop', '/leaderboard', '/quest/city', '/quest/du-ngoan/hanoi', '/listening/history', '/upgrade']) {
    assert.equal(isStudyRoute(p), false, p);
  }
});

test('màn thi có đồng hồ được hoãn giờ nghỉ', () => {
  for (const p of ['/sat/full-test', '/math/mock', '/math/diagnostic', '/speaking/room', '/write/abc', '/mock-run/1', '/duel/xyz']) {
    assert.equal(isBreakExemptRoute(p), true, p);
  }
});

test('màn luyện bình thường không được miễn giờ nghỉ', () => {
  for (const p of ['/math/drill/x', '/vocabulary/topic/t/learn', '/sentence/dictation', '/speaking']) {
    assert.equal(isBreakExemptRoute(p), false, p);
  }
});
