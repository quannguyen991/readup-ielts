import test from 'node:test';
import assert from 'node:assert/strict';

import { canonicalize, CanonicalError } from './canonical';

test('thứ tự khoá lúc khai báo không đổi được kết quả', () => {
  const a = canonicalize({ b: 1, a: 2, c: 3 });
  const b = canonicalize({ c: 3, a: 2, b: 1 });
  assert.equal(a, b);
  assert.equal(a, '{"a":2,"b":1,"c":3}');
});

test('sắp khoá lồng nhau ở mọi tầng', () => {
  const s = canonicalize({ z: { y: 1, x: 2 }, a: [{ q: 1, p: 2 }] });
  assert.equal(s, '{"a":[{"p":2,"q":1}],"z":{"x":2,"y":1}}');
});

test('mảng GIỮ NGUYÊN thứ tự — mảng là dữ liệu có thứ tự, không phải tập hợp', () => {
  assert.equal(canonicalize([3, 1, 2]), '[3,1,2]');
});

test('không chèn khoảng trắng', () => {
  assert.equal(canonicalize({ a: 1, b: [1, 2] }), '{"a":1,"b":[1,2]}');
});

test('tiếng Việt gõ tổ hợp và gõ dựng sẵn cho cùng một chữ ký', () => {
  /*
    Hai chuỗi này NHÌN GIỐNG HỆT NHAU trên màn hình và khác nhau về byte: một
    bên dấu nằm trong ký tự, một bên dấu là ký tự riêng đứng sau. Người dùng
    không phân biệt được, bàn phím khác nhau cho ra khác nhau, và nếu hai cách
    gõ cho hai chữ ký khác nhau thì một chứng chỉ hợp lệ sẽ báo sai mà không ai
    hiểu vì sao.
  */
  const nfc = 'đã công nhận'.normalize('NFC');
  const nfd = 'đã công nhận'.normalize('NFD');
  assert.notEqual(nfc, nfd, 'hai dạng phải khác byte, nếu không thì test này không kiểm gì');
  assert.equal(canonicalize({ t: nfc }), canonicalize({ t: nfd }));
});

test('khoá cũng được chuẩn hoá, không chỉ giá trị', () => {
  const nfc = { ['kỹ']: 1 };
  const nfd = { ['kỹ'.normalize('NFD')]: 1 };
  assert.equal(canonicalize(nfc), canonicalize(nfd));
});

test('null giữ nguyên, không bị bỏ như undefined', () => {
  assert.equal(canonicalize({ a: null, b: 1 }), '{"a":null,"b":1}');
});

test('bool và số nguyên', () => {
  assert.equal(canonicalize({ a: true, b: false, c: 0, d: -7 }), '{"a":true,"b":false,"c":0,"d":-7}');
});

/*
  NHỮNG THỨ BỊ TỪ CHỐI, VÀ VÌ SAO TỪ CHỐI CHỨ KHÔNG XỬ LÝ KHÉO.

  Mỗi giá trị dưới đây đều có ít nhất hai cách tuần tự hoá hợp lý, và hai máy khác
  nhau có thể chọn khác nhau. Chữ ký thì không tha thứ một byte lệch. Đoán bừa một
  cách xử lý sẽ tạo ra lỗi chỉ hiện ra trên máy người dùng, rất lâu sau, dưới dạng
  "chứng chỉ hợp lệ bỗng báo sai" — loại lỗi tốn nhiều ngày nhất để tìm.

  Ném lỗi ngay lúc ký thì hỏng to tiếng, ở đúng chỗ, lúc còn sửa được.
*/

test('từ chối undefined', () => {
  assert.throws(() => canonicalize({ a: undefined }), CanonicalError);
});

test('từ chối NaN và Infinity', () => {
  assert.throws(() => canonicalize({ a: NaN }), CanonicalError);
  assert.throws(() => canonicalize({ a: Infinity }), CanonicalError);
});

test('từ chối số thực — dạng in ra khác nhau giữa các máy', () => {
  assert.throws(() => canonicalize({ a: 1.5 }), CanonicalError);
});

test('từ chối số nguyên vượt khoảng an toàn', () => {
  assert.throws(() => canonicalize({ a: Number.MAX_SAFE_INTEGER + 1 }), CanonicalError);
});

test('từ chối hàm và ký hiệu', () => {
  assert.throws(() => canonicalize({ a: () => 1 }), CanonicalError);
  assert.throws(() => canonicalize({ a: Symbol('x') }), CanonicalError);
});

test('từ chối vòng lặp tham chiếu thay vì treo máy', () => {
  const o: Record<string, unknown> = { a: 1 };
  o.self = o;
  assert.throws(() => canonicalize(o), CanonicalError);
});

test('từ chối Date — hai cách quy ra chuỗi đều hợp lý như nhau', () => {
  assert.throws(() => canonicalize({ a: new Date(0) }), CanonicalError);
});

test('cùng một object canonical hoá hai lần cho cùng một chuỗi', () => {
  const o = { skills: [{ key: 'reading:inference', n: 3 }], did: 'did:key:z6Mk' };
  assert.equal(canonicalize(o), canonicalize(o));
});
