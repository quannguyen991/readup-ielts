import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  extractReference,
  generateGroupCode,
  generateReference,
  isValidGroupCode,
  isValidReference,
  transferDescription,
} from './reference';
import { normalizeDescription } from './vietqr';

/** RNG giả lập, đi vòng quanh — cho ra mã tái lập được để test. */
const seeded = (values: number[]) => {
  let at = 0;
  return () => values[at++ % values.length]!;
};

test('mã nhóm mua chung dùng đúng tiền tố riêng, tự kiểm được', () => {
  for (let i = 0; i < 200; i += 1) {
    const code = generateGroupCode();
    assert.ok(code.startsWith('RG'), `mã nhóm "${code}" không bắt đầu bằng RG`);
    assert.ok(isValidGroupCode(code), `mã nhóm "${code}" không tự kiểm được`);
    // Mã nhóm không được lẫn với hai loại mã kia — khác tiền tố nên isValidReference
    // và isValidInviteCode phải từ chối nó, kể cả khi thân mã trùng ngẫu nhiên.
    assert.ok(!isValidReference(code), `mã nhóm "${code}" bị nhận nhầm là mã thanh toán`);
  }
});

test('mã sinh ra luôn tự kiểm được', () => {
  for (let i = 0; i < 500; i += 1) {
    assert.ok(isValidReference(generateReference()), 'mã vừa sinh mà không hợp lệ');
  }
});

test('mã không chứa ký tự dễ nhìn nhầm', () => {
  // 0/O, 1/I/L, U — người dùng đọc trên màn hình rồi gõ tay vào app ngân hàng.
  for (let i = 0; i < 300; i += 1) {
    const code = generateReference().slice(2); // bỏ tiền tố RU
    assert.ok(!/[01OILU]/.test(code), `mã "${code}" chứa ký tự dễ nhầm`);
  }
});

test('GÕ SAI MỘT KÝ TỰ bị bắt', () => {
  /*
    Đây là lý do tồn tại của ký tự kiểm. Không có nó thì một ký tự gõ nhầm tạo
    ra một mã trông hợp lệ, tiền chuyển đi, và không đơn nào khớp — người dùng
    mất tiền còn ta không truy được về đâu.
  */
  const code = generateReference();
  let caught = 0;
  let tried = 0;
  const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  for (let pos = 2; pos < code.length; pos += 1) {
    for (const ch of ALPHABET) {
      if (ch === code[pos]) continue;
      tried += 1;
      const typo = code.slice(0, pos) + ch + code.slice(pos + 1);
      if (!isValidReference(typo)) caught += 1;
    }
  }
  assert.equal(caught, tried, `${tried - caught}/${tried} lỗi gõ một ký tự lọt qua`);
});

test('mã sai khuôn bị từ chối', () => {
  assert.equal(isValidReference(''), false);
  assert.equal(isValidReference('RU123'), false, 'quá ngắn');
  assert.equal(isValidReference('XX7K3M9Q'), false, 'sai tiền tố');
  assert.equal(isValidReference('RU7K3M9QXX'), false, 'quá dài');
  assert.equal(isValidReference('RU0O1ILU'), false, 'ký tự ngoài bảng');
});

test('nhận mã viết thường và có khoảng trắng thừa', () => {
  const code = generateReference();
  assert.ok(isValidReference(`  ${code.toLowerCase()}  `));
});

test('mã sống sót qua bước chuẩn hoá của ngân hàng', () => {
  // Ngân hàng viết hoa, bỏ dấu, thay ký tự lạ. Mã phải nguyên vẹn sau bước đó,
  // nếu không thì thứ hiện trên màn hình và thứ về trong sao kê là hai mã khác nhau.
  for (let i = 0; i < 200; i += 1) {
    const code = generateReference();
    const asBankSeesIt = normalizeDescription(transferDescription(code));
    assert.ok(asBankSeesIt.includes(code), `"${asBankSeesIt}" mất mã "${code}"`);
  }
});

test('tìm được mã trong một dòng sao kê lộn xộn', () => {
  const code = generateReference();
  const line = `CHUYEN TIEN TU 0011 NGUYEN VAN A ${transferDescription(code)} GD 123456`;
  assert.equal(extractReference(line), code);
});

test('dòng sao kê không có mã thì trả về null, không đoán bừa', () => {
  assert.equal(extractReference('CHUYEN TIEN THANH TOAN DON HANG 12345'), null);
  // Một cụm bắt đầu bằng RU nhưng sai ký tự kiểm KHÔNG được nhận.
  assert.equal(extractReference('RUABCDEF GD 999'), null);
});

test('hai mã khác nhau gần như không bao giờ trùng', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 5000; i += 1) seen.add(generateReference());
  // 30^6 ≈ 729 triệu tổ hợp; 5000 mẫu mà trùng thì nguồn ngẫu nhiên có vấn đề.
  assert.equal(seen.size, 5000, 'có mã trùng — kiểm lại nguồn ngẫu nhiên');
});

test('RNG lệch về đầu bảng vẫn ra mã hợp lệ', () => {
  // Không kiểm chất lượng ngẫu nhiên ở đây, chỉ kiểm hàm không vỡ ở biên.
  assert.ok(isValidReference(generateReference(seeded([0]))));
  assert.ok(isValidReference(generateReference(seeded([0.999999]))));
});

test('nội dung chuyển khoản có nhãn để người đọc sao kê nhận ra', () => {
  const code = generateReference();
  assert.ok(transferDescription(code).startsWith('READUP '));
  assert.ok(transferDescription(code).includes(code));
});
