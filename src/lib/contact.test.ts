import test from 'node:test';
import assert from 'node:assert/strict';

import { buildContact, contactPhrase, formatVnPhone, normalizeVnPhone } from './contact';

test('số Zalo nhận nhiều cách viết, ra một dạng 10 số', () => {
  assert.equal(normalizeVnPhone('0912345678'), '0912345678');
  assert.equal(normalizeVnPhone('+84 912 345 678'), '0912345678');
  assert.equal(normalizeVnPhone('84912345678'), '0912345678');
  assert.equal(normalizeVnPhone('0912.345.678'), '0912345678');
  assert.equal(normalizeVnPhone('(091) 234-5678'), '0912345678');
});

test('số không phải di động Việt Nam thì bỏ — không dựng link Zalo tới hư không', () => {
  assert.equal(normalizeVnPhone(''), null);
  assert.equal(normalizeVnPhone('02438123456'), null, 'số bàn không có Zalo');
  assert.equal(normalizeVnPhone('091234567'), null, 'thiếu một số');
  assert.equal(normalizeVnPhone('09123456789'), null, 'thừa một số');
  assert.equal(normalizeVnPhone('zalo.me/0912345678'), null);
});

test('số điện thoại chia nhóm 4-3-3', () => {
  assert.equal(formatVnPhone('0912345678'), '0912 345 678');
});

test('chưa khai gì thì không có kênh nào, và không có chuỗi rỗng lọt ra ngoài', () => {
  const contact = buildContact({});
  assert.deepEqual(contact, { sellerName: null, address: null, taxId: null, channels: [] });
  assert.equal(contactPhrase(contact), null);
});

test('email sai định dạng bị bỏ; có cả hai thì Zalo đứng trước', () => {
  const onlyZalo = buildContact({ supportEmail: 'khong-phai-email', supportZalo: '0912345678' });
  assert.equal(onlyZalo.channels.length, 1);

  const both = buildContact({ supportEmail: ' hotro@readup.vn ', supportZalo: '0912 345 678' });
  assert.deepEqual(both.channels.map((c) => c.kind), ['zalo', 'email']);
  assert.equal(both.channels[0]!.href, 'https://zalo.me/0912345678');
  assert.equal(both.channels[1]!.href, 'mailto:hotro@readup.vn');
});

test('câu liên hệ trong trang chính sách đọc liền một mạch', () => {
  const contact = buildContact({ supportEmail: 'hotro@readup.vn', supportZalo: '0912345678' });
  assert.equal(contactPhrase(contact), 'Zalo 0912 345 678 hoặc email hotro@readup.vn');
});

test('tên người bán, địa chỉ, mã số thuế: cắt khoảng trắng, rỗng thì null', () => {
  const contact = buildContact({ sellerName: '  Nguyễn Văn A ', sellerAddress: '   ', sellerTaxId: '0123456789' });
  assert.equal(contact.sellerName, 'Nguyễn Văn A');
  assert.equal(contact.address, null);
  assert.equal(contact.taxId, '0123456789');
});
