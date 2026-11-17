import test from 'node:test';
import assert from 'node:assert/strict';

import { checkUsername, looksLikeUsername, normalizeUsername } from './username';

test('chuẩn hoá: bỏ @, khoảng trắng, chữ thường', () => {
  assert.equal(normalizeUsername('  @Minh_Anh '), 'minh_anh');
  assert.equal(normalizeUsername(42), '');
});

test('chấp nhận tên hợp lệ', () => {
  assert.deepEqual(checkUsername('@Minh_9'), { ok: true, username: 'minh_9' });
});

test('từ chối sai định dạng và tên giữ chỗ', () => {
  assert.deepEqual(checkUsername('ab'), { ok: false, reason: 'format' });
  assert.deepEqual(checkUsername('có dấu'), { ok: false, reason: 'format' });
  assert.deepEqual(checkUsername('a'.repeat(21)), { ok: false, reason: 'format' });
  assert.deepEqual(checkUsername('admin'), { ok: false, reason: 'reserved' });
});

test('nhận diện lời tìm là username', () => {
  assert.equal(looksLikeUsername('@an'), true);
  assert.equal(looksLikeUsername('minh_9'), true);
  assert.equal(looksLikeUsername('Nguyễn An'), false);
});
