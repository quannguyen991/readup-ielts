import test from 'node:test';
import assert from 'node:assert/strict';

import { errorText, LOCALE_HEADER, localeOf, msg } from './server-locale';

/**
 * Lời nhắn máy chủ đi theo header ngôn ngữ của client. Điều quan trọng nhất là
 * MẶC ĐỊNH TIẾNG VIỆT: thiếu header, header lạ hay client cũ chưa gửi header
 * đều phải nhận đúng câu tiếng Việt như trước khi có bản tiếng Anh.
 */

function req(locale?: string): Request {
  const headers = new Headers();
  if (locale !== undefined) headers.set(LOCALE_HEADER, locale);
  return new Request('http://localhost/api/x', { headers });
}

test('không có header thì là tiếng Việt', () => {
  assert.equal(localeOf(req()), 'vi');
  assert.equal(msg(req(), 'Thiếu dữ liệu.', 'Missing data.'), 'Thiếu dữ liệu.');
});

test('header en thì trả tiếng Anh, không phân biệt hoa thường và khoảng trắng', () => {
  assert.equal(localeOf(req('en')), 'en');
  assert.equal(localeOf(req(' EN ')), 'en');
  assert.equal(msg(req('en'), 'Thiếu dữ liệu.', 'Missing data.'), 'Missing data.');
});

test('header lạ rơi về tiếng Việt', () => {
  assert.equal(localeOf(req('vi')), 'vi');
  assert.equal(localeOf(req('fr')), 'vi');
  assert.equal(localeOf(req('')), 'vi');
});

test('nhận cả locale đã biết sẵn (dùng trong service không có Request)', () => {
  assert.equal(localeOf('en'), 'en');
  assert.equal(localeOf('vi'), 'vi');
  assert.equal(localeOf(null), 'vi');
  assert.equal(localeOf(undefined), 'vi');
  assert.equal(msg('en', 'Có', 'Yes'), 'Yes');
});

test('errorText: tiếng Việt giữ nguyên lời lỗi gốc', () => {
  const err = new Error('Không chấm được bài.: boom');
  assert.equal(errorText(req(), err, 'Lỗi.', 'Error.'), 'Không chấm được bài.: boom');
  assert.equal(errorText(req(), 'không phải Error', 'Lỗi.', 'Error.'), 'Lỗi.');
});

test('errorText: tiếng Anh dịch tiền tố đã biết, giữ chi tiết kỹ thuật', () => {
  assert.equal(errorText(req('en'), new Error('Hết thời gian chờ: aborted'), 'Lỗi.', 'Error.'), 'Timed out: aborted');
  assert.equal(
    errorText(req('en'), new Error('Lỗi phía server AI (503): upstream down'), 'Lỗi.', 'Error.'),
    'AI server error (503): upstream down',
  );
  assert.equal(
    errorText(req('en'), new Error('Cả 3 proxy AI đều không gọi được.\n  groq: Lỗi mạng: x'), 'Lỗi.', 'Error.'),
    'All 3 AI proxies failed.',
  );
});

test('errorText: tiếng Anh gặp câu tiếng Việt lạ thì dùng câu dự phòng', () => {
  assert.equal(errorText(req('en'), new Error('Không chấm được bài.'), 'Lỗi.', 'Could not grade.'), 'Could not grade.');
  assert.equal(errorText(req('en'), new Error('relation "x" does not exist'), 'Lỗi.', 'Error.'), 'relation "x" does not exist');
  assert.equal(errorText(req('en'), 42, 'Lỗi.', 'Error.'), 'Error.');
});
