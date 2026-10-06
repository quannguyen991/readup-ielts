import assert from 'node:assert/strict';
import test from 'node:test';

import { isMemberOnlyPath } from './member-gate';

test('khu thành viên: chặn cả trang gốc lẫn mọi trang con', () => {
  for (const p of ['/quest', '/quest/du-ngoan/tokyo', '/quest/study-abroad/dorm', '/speaking/room', '/write', '/write/abc', '/listening/band9-t1', '/history/vn', '/community/chat', '/sat/full-test', '/mock-tests', '/ielts/score', '/ielts-source-practice', '/leaderboard']) {
    assert.equal(isMemberOnlyPath(p), true, p);
  }
});

test('phần dùng thử cho khách vẫn mở', () => {
  for (const p of ['/', '/intro', '/vocabulary', '/vocabulary/topic/work', '/vocabulary/topic/work/learn', '/read', '/library', '/sat', '/sat-rw', '/math', '/math/learn/x', '/practice', '/sentence', '/upgrade', '/plan', '/auth/sign-in', '/dashboard', '/profile', '/settings']) {
    assert.equal(isMemberOnlyPath(p), false, p);
  }
});

test('chuẩn hoá: bỏ chuỗi truy vấn và dấu gạch chéo cuối', () => {
  assert.equal(isMemberOnlyPath('/quest/?x=1'), true);
  assert.equal(isMemberOnlyPath('/vocabulary/?x=1'), false);
});
