import assert from 'node:assert/strict';
import test from 'node:test';

import { MEMBER_ONLY_PREFIXES, isMemberOnlyPath, lockedFeatureName } from './member-gate';

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

test('màn khoá gọi đúng tên tính năng đang mở', () => {
  assert.equal(lockedFeatureName('/listening/band9-t1', false), 'Listening');
  assert.equal(lockedFeatureName('/speaking/room', false), 'Speaking');
  assert.equal(lockedFeatureName('/write/abc', false), 'Writing');
  assert.equal(lockedFeatureName('/quest/du-ngoan/tokyo', false), 'Du ngoạn & Du học');
  assert.equal(lockedFeatureName('/bilingual/bl-01', false), 'Đọc báo song ngữ');
  assert.equal(lockedFeatureName('/bilingual/bl-01', true), 'Bilingual news');
  assert.equal(lockedFeatureName('/sat/full-test', false), 'Thi thử SAT');
  assert.equal(lockedFeatureName('/ielts-source-practice', false), 'Công cụ IELTS');
});

test('danh sách "cần đăng nhập" phủ đủ mọi khu bị khoá', () => {
  for (const prefix of MEMBER_ONLY_PREFIXES) assert.ok(lockedFeatureName(prefix, false), prefix);
});
