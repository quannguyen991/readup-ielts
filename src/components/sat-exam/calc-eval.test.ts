import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CalcError, evaluate, formatNumber, toFraction } from './calc-eval';

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

test('thứ bậc phép toán và ngoặc', () => {
  assert.equal(evaluate('2+3*4'), 14);
  assert.equal(evaluate('(2+3)*4'), 20);
  assert.equal(evaluate('2^3^2'), 512);
  assert.equal(evaluate('-2^2'), -4);
  assert.equal(evaluate('2^-1'), 0.5);
  assert.equal(evaluate('10÷4×2'), 5);
  assert.equal(evaluate('7 − 10'), -3);
});

test('nhân ngầm, hằng, hàm', () => {
  near(evaluate('2π'), 2 * Math.PI);
  assert.equal(evaluate('3(4+1)'), 15);
  assert.equal(evaluate('(1+1)(2+3)'), 10);
  assert.equal(evaluate('2√9'), 6);
  assert.equal(evaluate('sqrt(16)+abs(-3)'), 7);
  assert.equal(evaluate('log(1000)'), 3);
  near(evaluate('ln(e)'), 1);
  assert.equal(evaluate('5!'), 120);
  assert.equal(evaluate('sqrt(2'), Math.SQRT2);
});

test('lượng giác theo độ và radian', () => {
  near(evaluate('sin(30)'), 0.5);
  near(evaluate('cos(60)', { angle: 'deg' }), 0.5);
  near(evaluate('sin(pi/2)', { angle: 'rad' }), 1);
  near(evaluate('asin(1)'), 90);
});

test('ans và lỗi', () => {
  assert.equal(evaluate('ans*2', { ans: 21 }), 42);
  assert.throws(() => evaluate('1/0'), CalcError);
  assert.throws(() => evaluate('sqrt(-1)'), CalcError);
  assert.throws(() => evaluate('2+'), CalcError);
  assert.throws(() => evaluate('(2))'), CalcError);
  assert.throws(() => evaluate('alert(1)'), CalcError);
  assert.throws(() => evaluate(''), CalcError);
});

test('in số và phân số', () => {
  assert.equal(formatNumber(0.1 + 0.2), '0.3');
  assert.equal(formatNumber(-0), '0');
  assert.equal(toFraction(0.75), '3/4');
  assert.equal(toFraction(-1 / 3), '-1/3');
  assert.equal(toFraction(Math.PI), null);
  assert.equal(toFraction(4), null);
});
