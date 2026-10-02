import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';

import { breakerKey, cooldownMs, isOpen, recordFailure, recordSuccess, resetBreakers, statusFromReason } from './breaker';

beforeEach(resetBreakers);

test('thời gian nghỉ theo mã lỗi: 403 lâu nhất', () => {
  assert.equal(cooldownMs(403), 600_000);
  assert.equal(cooldownMs(429), 60_000);
  assert.equal(cooldownMs(503), 45_000);
  assert.equal(cooldownMs(null), 30_000);
  assert.equal(statusFromReason('HTTP 429: rate limit'), 429);
  assert.equal(statusFromReason('không ra chữ nào'), null);
});

test('cửa hỏng thì mở cầu dao tới hết hạn rồi tự đóng', () => {
  const k = breakerKey('api.groq.com', 'm');
  assert.equal(isOpen(k, 0), false);
  recordFailure(k, 'HTTP 429: x', 1000);
  assert.equal(isOpen(k, 1000 + 59_999), true);
  assert.equal(isOpen(k, 1000 + 60_000), false);
});

test('403 nghỉ 10 phút; thành công xoá ngay; cửa khác không bị ảnh hưởng', () => {
  const a = breakerKey('codex', 'haiku');
  const b = breakerKey('groq', 'qwen');
  recordFailure(a, 'HTTP 403', 0);
  assert.equal(isOpen(a, 599_000), true);
  assert.equal(isOpen(b, 1), false);
  recordSuccess(a);
  assert.equal(isOpen(a, 1), false);
});
