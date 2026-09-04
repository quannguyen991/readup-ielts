import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildVietQrPayload,
  crc16,
  normalizeDescription,
  parseTlv,
  tlv,
  verifyVietQrChecksum,
} from './vietqr';

const VCB = { bankBin: '970436', accountNumber: '1234567890' };

// ------------------------------------------------------------------- CRC

test('CRC-16/CCITT-FALSE khớp giá trị kiểm chuẩn', () => {
  /*
    0x29B1 cho "123456789" là giá trị kiểm CHÍNH THỨC của biến thể CCITT-FALSE.
    Có cả tá biến thể CRC-16 (ARC, MODBUS, XMODEM, KERMIT…) và chúng cho kết quả
    khác nhau hoàn toàn. Chọn nhầm là lỗi im lặng tuyệt đối: chuỗi vẫn dựng ra
    đẹp đẽ, chỉ có điều không app ngân hàng nào quét được — mà ta không có app
    ngân hàng trong bộ test để phát hiện.
  */
  assert.equal(crc16('123456789'), 0x29b1);
});

test('CRC đổi khi dữ liệu đổi dù chỉ một ký tự', () => {
  assert.notEqual(crc16('READUP AB'), crc16('READUP AC'));
});

// ------------------------------------------------------------------- TLV

test('độ dài luôn hai chữ số có đệm 0', () => {
  assert.equal(tlv('00', '01'), '000201');
  assert.equal(tlv('53', '704'), '5303704');
  // Chuỗi 9 ký tự phải ra "09", không phải "9" — sai chỗ này thì máy quét đọc
  // lệch từ đó tới hết chuỗi.
  assert.equal(tlv('62', '123456789'), '6209123456789');
});

test('trường quá 99 ký tự thì ném lỗi thay vì cắt ngầm', () => {
  assert.throws(() => tlv('62', 'x'.repeat(100)), /99/);
});

test('parseTlv đọc ngược đúng thứ tlv dựng ra', () => {
  const built = tlv('00', '01') + tlv('53', '704') + tlv('58', 'VN');
  assert.deepEqual(parseTlv(built), { '00': '01', '53': '704', '58': 'VN' });
});

test('parseTlv phát hiện chuỗi hỏng thay vì trả về dữ liệu bịa', () => {
  assert.throws(() => parseTlv('0010abc'), /chỉ còn/);
});

// ------------------------------------------------ chuẩn hoá nội dung

test('bỏ dấu tiếng Việt và viết hoa', () => {
  assert.equal(normalizeDescription('Nâng cấp gói Pro'), 'NANG CAP GOI PRO');
  assert.equal(normalizeDescription('Đặt cọc'), 'DAT COC');
});

test('ký tự đặc biệt thành khoảng trắng, không bị dính chữ', () => {
  // "READUP-AB12" mà thành "READUPAB12" thì đối chiếu sao kê trượt.
  assert.equal(normalizeDescription('READUP-AB12'), 'READUP AB12');
  assert.equal(normalizeDescription('a  b\n\tc'), 'A B C');
});

// --------------------------------------------------------------- payload

test('chuỗi QR tự kiểm được checksum của chính nó', () => {
  const payload = buildVietQrPayload({ ...VCB, amountVnd: 159_000, description: 'READUP AB12' });
  assert.ok(verifyVietQrChecksum(payload));
});

test('CRC tính TRÊN CẢ "6304" của chính trường CRC', () => {
  /*
    Đây là chi tiết hay sai nhất của EMVCo, và sai thì mọi app ngân hàng chỉ báo
    "mã QR không hợp lệ" chứ không nói vì sao. Test kiểm bằng cách khẳng định
    checksum KHÁC với checksum tính trên phần thân không có "6304".
  */
  const payload = buildVietQrPayload({ ...VCB, amountVnd: 79_000 });
  const bodyWithHeader = payload.slice(0, -4);
  assert.ok(bodyWithHeader.endsWith('6304'));
  const bodyWithout = bodyWithHeader.slice(0, -4);
  const wrong = crc16(bodyWithout).toString(16).toUpperCase().padStart(4, '0');
  assert.notEqual(payload.slice(-4), wrong);
});

test('sửa một ký tự trong chuỗi làm checksum sai ngay', () => {
  const payload = buildVietQrPayload({ ...VCB, amountVnd: 79_000 });
  const tampered = payload.replace('970436', '970437');
  assert.equal(verifyVietQrChecksum(tampered), false);
});

test('mã ngân hàng và số tài khoản nằm đúng nhánh 38 của Napas', () => {
  const payload = buildVietQrPayload({ ...VCB, amountVnd: 159_000 });
  const root = parseTlv(payload.slice(0, -8)); // bỏ phần "6304XXXX"
  const merchant = parseTlv(root['38']!);
  assert.equal(merchant['00'], 'A000000727', 'GUID của Napas');
  assert.equal(merchant['02'], 'QRIBFTTA', 'chuyển tới tài khoản, không phải tới thẻ');
  const beneficiary = parseTlv(merchant['01']!);
  assert.equal(beneficiary['00'], '970436');
  assert.equal(beneficiary['01'], '1234567890');
});

test('có số tiền thì QR là loại DÙNG MỘT LẦN (01 = 12)', () => {
  const withAmount = parseTlv(buildVietQrPayload({ ...VCB, amountVnd: 79_000 }).slice(0, -8));
  const withoutAmount = parseTlv(buildVietQrPayload({ ...VCB }).slice(0, -8));
  assert.equal(withAmount['01'], '12');
  assert.equal(withoutAmount['01'], '11');
});

test('tiền đồng ghi trần trụi: không dấu phân cách, không phần thập phân', () => {
  const root = parseTlv(buildVietQrPayload({ ...VCB, amountVnd: 2_590_000 }).slice(0, -8));
  assert.equal(root['54'], '2590000');
  assert.equal(root['53'], '704', 'mã tiền tệ VND');
  assert.equal(root['58'], 'VN');
});

test('không có số tiền thì không có trường 54, chứ không phải 54 rỗng', () => {
  const root = parseTlv(buildVietQrPayload({ ...VCB }).slice(0, -8));
  assert.equal(root['54'], undefined);
});

test('nội dung chuyển khoản nằm ở 62-08 và đã được chuẩn hoá', () => {
  const root = parseTlv(
    buildVietQrPayload({ ...VCB, amountVnd: 1000, description: 'Nâng cấp gói Pro' }).slice(0, -8),
  );
  assert.equal(parseTlv(root['62']!)['08'], 'NANG CAP GOI PRO');
});

test('nội dung quá dài bị cắt chứ không làm hỏng cả chuỗi', () => {
  const payload = buildVietQrPayload({ ...VCB, amountVnd: 1000, description: 'A'.repeat(200) });
  assert.ok(verifyVietQrChecksum(payload), 'cắt xong vẫn phải là chuỗi hợp lệ');
});

test('đầu vào sai bị chặn ngay, không đẻ ra QR hỏng', () => {
  assert.throws(() => buildVietQrPayload({ bankBin: '97043', accountNumber: '123456' }), /BIN/);
  assert.throws(() => buildVietQrPayload({ bankBin: '970436', accountNumber: 'abc' }), /tài khoản/);
  assert.throws(() => buildVietQrPayload({ ...VCB, amountVnd: -5 }), /dương/);
  assert.throws(() => buildVietQrPayload({ ...VCB, amountVnd: 1.5 }), /nguyên/);
});

test('cùng đầu vào luôn ra cùng chuỗi', () => {
  // QR phải tái lập được: người dùng tải lại trang giữa chừng mà ra mã khác thì
  // hai lần chuyển khoản không đối chiếu về cùng một đơn.
  const input = { ...VCB, amountVnd: 159_000, description: 'READUP XY9Z' };
  assert.equal(buildVietQrPayload(input), buildVietQrPayload(input));
});

test('ca thật đã dựng trên trang thanh toán: Pro/năm, Vietcombank', () => {
  // Chốt lại đúng bộ giá trị đã kiểm bằng mắt trên trình duyệt, để nếu ai đó
  // sửa bộ dựng chuỗi thì test đỏ chứ không phải một mã QR im lặng hỏng.
  const payload = buildVietQrPayload({
    bankBin: '970436',
    accountNumber: '1234567890',
    accountName: 'NGUYEN VAN A',
    amountVnd: 1_390_000,
    description: 'READUP RUCKNC363',
  });
  assert.ok(verifyVietQrChecksum(payload));
  const root = parseTlv(payload.slice(0, -8));
  assert.equal(root['54'], '1390000');
  assert.equal(parseTlv(root['62']!)['08'], 'READUP RUCKNC363');
  assert.equal(root['59'], 'NGUYEN VAN A');
});

test('số tài khoản ẢO có chữ cái vẫn hợp lệ', () => {
  /*
    Tài khoản ảo của ZaloPay/MoMo/ViettelPay có dạng `99ZP26030M39069491`. Bản
    đầu của bộ dựng chuỗi chỉ nhận chữ số và ném lỗi ngay với đúng loại tài khoản
    phổ biến nhất — trang thanh toán trắng bóc mà không ai hiểu vì sao.
  */
  const payload = buildVietQrPayload({
    bankBin: '970454',
    accountNumber: '99ZP26030M39069491',
    amountVnd: 79_000,
    description: 'READUP RU7K3M9Q',
  });
  assert.ok(verifyVietQrChecksum(payload));
  const merchant = parseTlv(parseTlv(payload.slice(0, -8))['38']!);
  assert.equal(parseTlv(merchant['01']!)['01'], '99ZP26030M39069491');
});

test('ký tự ngoài chữ-số vẫn bị chặn', () => {
  assert.throws(
    () => buildVietQrPayload({ bankBin: '970454', accountNumber: '99ZP-2603' }),
    /tài khoản/,
  );
});
