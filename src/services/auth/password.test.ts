import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateSignUp } from './password';

test('tạo tài khoản: chuẩn hoá email, chặn mật khẩu yếu', () => {
  const ok = validateSignUp('  Ban@Gmail.COM ', 'hocIELTS2027', ' Minh ');
  assert.deepEqual(ok, { ok: true, email: 'ban@gmail.com', password: 'hocIELTS2027', name: 'Minh' });
  assert.equal(validateSignUp('khong-phai-email', 'hocIELTS2027').ok, false);
  assert.equal(validateSignUp('ban@gmail.com', 'ngan').ok, false);
  assert.equal(validateSignUp('ban@gmail.com', '12345678').ok, false, 'toàn số');
  assert.equal(validateSignUp('ban@gmail.com', 'ban@gmail.com').ok, false, 'trùng email');
  assert.equal(validateSignUp('ban@gmail.com', 'x'.repeat(73)).ok, false, 'quá 72 ký tự (giới hạn bcrypt)');
  const noName = validateSignUp('ban@gmail.com', 'hocIELTS2027', '');
  assert.ok(noName.ok && noName.name === null, 'tên trống thì lưu null');
});
