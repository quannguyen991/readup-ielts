import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isFocusRoute, isImmersiveRoute, isPhoneChromelessRoute } from './focus-routes';

test('màn thi bỏ thanh đầu trang trên điện thoại', () => {
  for (const p of ['/listening/ielts-test-1', '/sat/full-test', '/math/mock', '/math/diagnostic', '/math/drill/algebra', '/sat-rw/mix/abc', '/weekly']) {
    assert.ok(isPhoneChromelessRoute(p), p);
  }
});

test('trang chọn bài vẫn có thanh điều hướng', () => {
  for (const p of ['/listening', '/listening/history', '/sat', '/math', '/sat-rw', '/sat-rw/learn', '/library', '/vocabulary', '/dashboard']) {
    assert.ok(!isPhoneChromelessRoute(p), p);
  }
});

test('màn bỏ thanh trên điện thoại cũng là màn tập trung (giữ cột desktop), trừ phòng thi Reading', () => {
  assert.ok(isFocusRoute('/listening/ielts-test-1'));
  assert.ok(isImmersiveRoute('/read/abc'));
});
