import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeAuthError } from './errors';

/*
  Hai chuỗi dưới đây là NGUYÊN VĂN máy chủ Supabase trả về, lấy bằng cách gọi
  thật vào /auth/v1/token?grant_type=pkce. Không chép từ tài liệu — tài liệu và
  máy chủ đã lệch nhau ở chỗ khác rồi.
*/
const MISSING_VERIFIER = 'invalid request: both auth code and code verifier should be non-empty';
const NO_FLOW_STATE = 'invalid flow state, no valid flow state found';

test('mở liên kết ở trình duyệt khác: chỉ đúng lời khuyên đổi trình duyệt', () => {
  const info = describeAuthError(new Error(MISSING_VERIFIER));
  assert.equal(info.kind, 'link_wrong_browser');
  assert.match(info.message, /trình duyệt/);
});

test('liên kết đã dùng hoặc hết hạn: bảo xin liên kết mới', () => {
  const info = describeAuthError(new Error(NO_FLOW_STATE));
  assert.equal(info.kind, 'link_used');
  assert.match(info.message, /gửi lại|một lần/);
});

test('hai lỗi này KHÔNG được rơi vào unknown', () => {
  // Đây chính là lỗi đã gặp thật: cả hai ra "Có lỗi xảy ra. Thử lại sau ít phút."
  // — một lời khuyên sai, vì thử lại y hệt thì hỏng y hệt.
  for (const raw of [MISSING_VERIFIER, NO_FLOW_STATE]) {
    const info = describeAuthError(new Error(raw));
    assert.notEqual(info.kind, 'unknown', raw);
    assert.doesNotMatch(info.message, /Thử lại sau ít phút/);
  }
});

test('các lỗi cũ vẫn phân loại đúng như trước', () => {
  assert.equal(describeAuthError(new Error('Invalid login credentials')).kind, 'invalid_credentials');
  assert.equal(describeAuthError(new Error('Token has expired')).kind, 'otp_expired');
  assert.equal(describeAuthError(new Error('Provider is not enabled')).kind, 'provider_disabled');
  assert.equal(describeAuthError(new Error('Failed to fetch')).kind, 'network');
});

test('lỗi lạ thật thì vẫn là unknown', () => {
  assert.equal(describeAuthError(new Error('cái gì đó chưa từng gặp')).kind, 'unknown');
});
