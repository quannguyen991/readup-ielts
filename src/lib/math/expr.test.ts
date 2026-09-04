import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mathToPlainText, parseMath, validateMath } from './expr';

/** Rút gọn: parse rồi đổ lại về chữ phẳng — đủ để khẳng định cấu trúc đã đúng. */
function flat(src: string): string {
  return mathToPlainText(parseMath(src));
}

// ------------------------------------------------------------- văn xuôi

test('văn xuôi tiếng Anh đi qua nguyên vẹn', () => {
  const stem = 'If 3(x + 4) = 5x - 2, what is the value of x?';
  const nodes = parseMath(stem);
  assert.equal(nodes.length, 1);
  assert.deepEqual(nodes[0], { kind: 'text', value: stem });
});

test('"pizza" không bị đọc thành số pi', () => {
  // Thay pi theo biên từ chứ không thay theo chuỗi con — nếu không thì mọi đề
  // có chữ "pizza" hay "pile" đều hỏng.
  assert.equal(flat('The pizza costs pi dollars'), 'The pizza costs π dollars');
});

test('"degrees" không bị đọc thành ký hiệu độ', () => {
  assert.equal(flat('an angle of 90 deg is 90 degrees'), 'an angle of 90 ° is 90 degrees');
});

test('ba ký hiệu so sánh được đổi', () => {
  assert.equal(flat('a <= b >= c != d'), 'a ≤ b ≥ c ≠ d');
});

// ------------------------------------------------------- mũ và chỉ số dưới

test('luỹ thừa một chữ số', () => {
  assert.deepEqual(parseMath('x^2'), [
    { kind: 'text', value: 'x' },
    { kind: 'sup', children: [{ kind: 'text', value: '2' }] },
  ]);
});

test('số mũ chỉ nuốt dãy chữ số, không nuốt chữ cái đứng sau', () => {
  // 'x^2y' phải là "x mũ 2, nhân y" chứ không phải "x mũ 2y".
  assert.equal(flat('x^2y'), 'x^2y');
  const nodes = parseMath('x^2y');
  assert.equal(nodes.length, 3);
  assert.deepEqual(nodes[2], { kind: 'text', value: 'y' });
});

test('số mũ nhiều chữ số vẫn lấy trọn', () => {
  assert.equal(flat('2^10'), '2^(10)');
});

test('số mũ là cả một cụm thì phải đặt trong ngoặc', () => {
  assert.equal(flat('x^(n+1)'), 'x^(n+1)');
});

test('số mũ âm', () => {
  assert.equal(flat('x^-1'), 'x^(−1)');
});

test('chỉ số dưới', () => {
  assert.deepEqual(parseMath('x_1'), [
    { kind: 'text', value: 'x' },
    { kind: 'sub', children: [{ kind: 'text', value: '1' }] },
  ]);
});

// --------------------------------------------------------------- phân số

test('phân số hai phần', () => {
  assert.deepEqual(parseMath('frac(3,4)'), [
    {
      kind: 'frac',
      numerator: [{ kind: 'text', value: '3' }],
      denominator: [{ kind: 'text', value: '4' }],
    },
  ]);
});

test('ngoặc của văn bản trong tử số không cắt nhầm phân số', () => {
  // Đây là ca hỏng thật nếu không đếm độ sâu ngoặc: dấu ')' của '2(x+1)' đứng
  // trước dấu phẩy phân cách.
  assert.equal(flat('frac(2(x+1),3)'), '(2(x+1))/(3)');
});

test('phân số lồng phân số', () => {
  assert.equal(flat('frac(frac(1,2),3)'), '((1)/(2))/(3)');
});

test('phân số nằm giữa văn xuôi', () => {
  assert.equal(flat('The slope is frac(3,4) here.'), 'The slope is (3)/(4) here.');
});

// ------------------------------------------------------------------ căn

test('căn bậc hai', () => {
  assert.deepEqual(parseMath('sqrt(2)'), [
    { kind: 'sqrt', children: [{ kind: 'text', value: '2' }] },
  ]);
});

test('căn chứa cả biểu thức có mũ', () => {
  assert.equal(flat('sqrt(x^2+1)'), '√(x^2+1)');
});

// ---------------------------------------------------------- markup hỏng

test('markup hỏng rơi về chữ thường chứ không ném lỗi', () => {
  // Ném lỗi lúc chạy là vỡ nguyên màn hình vì một dấu ngoặc thiếu.
  assert.doesNotThrow(() => parseMath('frac(a'));
  assert.equal(flat('frac(a'), 'frac(a');
  assert.equal(flat('sqrt(x'), 'sqrt(x');
  assert.equal(flat('x^'), 'x^');
});

test('validateMath bắt được đúng những markup hỏng ấy', () => {
  assert.deepEqual(validateMath('frac(3,4) and sqrt(2)'), []);
  assert.equal(validateMath('frac(a').length, 1);
  assert.equal(validateMath('sqrt(x').length, 1);
  assert.equal(validateMath('x^').length, 1);
});

test('validateMath không báo động giả trên văn xuôi thường', () => {
  assert.deepEqual(validateMath('If 3(x + 4) = 5x - 2, what is the value of x?'), []);
  assert.deepEqual(validateMath('A survey of 250 students (about 40%) responded.'), []);
});
