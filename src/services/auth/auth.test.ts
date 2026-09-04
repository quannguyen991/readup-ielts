import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeAuthError } from './errors';
import { isValidOtp, maskPhone, parsePhone } from './phone';

/**
 * Hai mảnh này test được mà không cần máy chủ, và chúng cũng chính là hai chỗ
 * hỏng đắt nhất: sai định dạng số thì SMS không tới nhưng vẫn TỐN TIỀN gửi, còn
 * dịch sai lỗi thì người dùng ngồi thử lại một việc không bao giờ chạy được.
 */

// ------------------------------------------------------ chuẩn hoá số VN

test('ba cách người Việt hay gõ đều ra cùng một số E.164', () => {
  for (const input of ['0912345678', '+84912345678', '84912345678', '0912 345 678', '(+84) 912-345-678']) {
    const result = parsePhone(input);
    assert.equal(result.ok, true, `"${input}" bị từ chối`);
    assert.equal(result.ok && result.e164, '+84912345678', `"${input}" ra sai`);
  }
});

test('trả về cả dạng nội địa để hiện lại cho người dùng đọc', () => {
  const result = parsePhone('+84912345678');
  assert.equal(result.ok && result.national, '0912345678');
});

test('nhận đủ năm đầu số di động đang dùng', () => {
  for (const prefix of ['03', '05', '07', '08', '09']) {
    const result = parsePhone(`${prefix}12345678`);
    assert.equal(result.ok, true, `Đầu số ${prefix} bị từ chối`);
  }
});

test('từ chối số bàn và đầu số không tồn tại, kèm lý do đọc được', () => {
  const landline = parsePhone('02812345678');
  assert.equal(landline.ok, false);
  assert.equal(landline.ok === false && landline.reason, 'too_long');

  const bad = parsePhone('0112345678');
  assert.equal(bad.ok === false && bad.reason, 'not_vn_mobile');
});

test('từ chối số quá ngắn, chuỗi rỗng và ký tự lạ', () => {
  assert.equal(parsePhone('') .ok, false);
  assert.equal(parsePhone('   ').ok, false);
  assert.equal(parsePhone('091234').ok, false);
  const letters = parsePhone('091234567a');
  assert.equal(letters.ok === false && letters.reason, 'not_digits');
});

test('số nước ngoài có mã nước thì giữ nguyên, không ép về +84', () => {
  // Người học ở nước ngoài vẫn phải đăng nhập được.
  const us = parsePhone('+1 415 555 0132');
  assert.equal(us.ok && us.e164, '+14155550132');

  const sg = parsePhone('+65 8123 4567');
  assert.equal(sg.ok && sg.e164, '+6581234567');
});

test('số quốc tế vẫn bị chặn nếu dài hoặc ngắn quá chuẩn E.164', () => {
  assert.equal(parsePhone('+1234567').ok, false, 'Dưới 8 chữ số phải bị chặn.');
  assert.equal(parsePhone('+1234567890123456').ok, false, 'Trên 15 chữ số phải bị chặn.');
});

test('che số nhưng vẫn để người dùng nhận ra số của mình', () => {
  const masked = maskPhone('+84912345678');
  assert.ok(masked.startsWith('+849'), 'Phải giữ đầu số để nhận ra.');
  assert.ok(masked.endsWith('678'), 'Phải giữ ba số cuối.');
  assert.ok(!masked.includes('12345'), 'Phần giữa phải bị che.');
  assert.equal(masked.length, '+84912345678'.length, 'Che không được đổi độ dài.');
});

test('mã OTP chỉ nhận đúng sáu chữ số', () => {
  assert.ok(isValidOtp('123456'));
  assert.ok(isValidOtp(' 123456 '), 'Khoảng trắng thừa lúc dán vào không phải lỗi.');
  assert.ok(!isValidOtp('12345'));
  assert.ok(!isValidOtp('1234567'));
  assert.ok(!isValidOtp('12345a'));
  assert.ok(!isValidOtp(''));
});

// ------------------------------------------------------------ dịch lỗi

test('lỗi cấu hình được đánh dấu KHÔNG thử lại được', () => {
  // Đây là điểm mấu chốt: hiện nút "Thử lại" cho lỗi cấu hình là bắt người dùng
  // bấm mãi một việc không bao giờ chạy.
  for (const raw of [
    'Unsupported provider: provider is not enabled',
    'Error sending confirmation OTP to provider: SMS provider not configured',
    'Chưa cấu hình Supabase. Điền EXPO_PUBLIC_SUPABASE_URL...',
  ]) {
    const info = describeAuthError(new Error(raw));
    assert.equal(info.retryable, false, `"${raw}" đáng lẽ không thử lại được`);
  }
});

test('lỗi của người dùng thì thử lại được', () => {
  for (const raw of ['Invalid login credentials', 'Token has expired or is invalid', 'Failed to fetch']) {
    assert.equal(describeAuthError(new Error(raw)).retryable, true, `"${raw}" phải cho thử lại`);
  }
});

test('đọc được số giây phải chờ từ thông báo giới hạn tần suất', () => {
  const info = describeAuthError(
    new Error('For security purposes, you can only request this after 46 seconds.'),
  );
  assert.equal(info.kind, 'rate_limited');
  assert.equal(info.retryAfterSeconds, 46);
});

test('nhận diện đúng nhóm lỗi hay gặp nhất', () => {
  const cases: Array<[string, string]> = [
    ['Invalid login credentials', 'invalid_credentials'],
    ['Token has expired or is invalid', 'otp_expired'],
    ['Email not confirmed', 'email_not_confirmed'],
    ['User already registered', 'already_registered'],
    ['Failed to fetch', 'network'],
  ];
  for (const [raw, expected] of cases) {
    assert.equal(describeAuthError(new Error(raw)).kind, expected, `"${raw}" phân loại sai`);
  }
});

test('nhận cả chuỗi trần, object lạ và null mà không nổ', () => {
  assert.equal(describeAuthError('Invalid login credentials').kind, 'invalid_credentials');
  assert.equal(describeAuthError({ message: 'Failed to fetch' }).kind, 'network');
  assert.equal(describeAuthError(null).kind, 'unknown');
  assert.equal(describeAuthError(undefined).kind, 'unknown');
});

test('lỗi 429 không kèm chữ vẫn được coi là giới hạn tần suất', () => {
  assert.equal(describeAuthError({ message: 'Too many requests', status: 429 }).kind, 'rate_limited');
});

test('mọi thông báo đều là tiếng Việt và nói được việc cần làm', () => {
  for (const raw of ['Invalid login credentials', 'Unsupported provider', 'Token has expired']) {
    const info = describeAuthError(new Error(raw));
    assert.ok(info.message.length > 20, 'Thông báo quá ngắn để hướng dẫn được gì.');
    assert.ok(!/[a-z]{4,}\s[a-z]{4,}\s[a-z]{4,}/.test(info.message.replace(/[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/gi, 'à')), 'Thông báo còn nguyên tiếng Anh.');
  }
});
