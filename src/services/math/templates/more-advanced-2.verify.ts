import assert from 'node:assert/strict';

import type { MathItem, MathValue } from '@/lib/math/types';
import { equalsValue, rat } from '@/lib/math/value';

/**
 * Bộ kiểm chứng cho `more-advanced-2.ts` — đọc ngược từ đề rồi tự giải, cùng
 * nguyên tắc với `more.verify.ts`.
 */

type Verifier = (item: MathItem) => void;

function correctDisplay(item: MathItem): string {
  assert.ok(item.choices && item.correctIndex !== null, 'Câu trắc nghiệm thiếu lựa chọn.');
  return item.choices[item.correctIndex]!.display;
}

function answerOf(item: MathItem): MathValue {
  if (item.answerValue) return item.answerValue;
  const d = correctDisplay(item);
  const int = d.match(/^(-?\d+)$/);
  assert.ok(int, `Lựa chọn "${d}" không phải số nguyên.`);
  return rat(Number(int[1]));
}

function expectAnswer(item: MathItem, expected: MathValue, why: string) {
  const got = answerOf(item);
  assert.ok(equalsValue(got, expected), `${why}: kỳ vọng ${expected.num}/${expected.den}, template cho ${got.num}/${got.den}. Đề: ${item.stem}`);
}

function match(text: string, pattern: RegExp): RegExpMatchArray {
  const m = text.match(pattern);
  assert.ok(m, `Đề không đúng khuôn: ${text}`);
  return m;
}

function coef(text: string | undefined): number {
  if (text === undefined || text === '') return 1;
  if (text === '-') return -1;
  return Number(text);
}

function signed(sign: string | undefined, n: string | undefined): number {
  if (!sign || !n) return 0;
  return (sign === '-' ? -1 : 1) * Number(n);
}

/** "ax^2 + bx + c" với b, c có thể vắng. */
function quadratic(text: string): { a: number; b: number; c: number } {
  const m = text.trim().match(/^(-?\d*)x\^2(?: ([+-]) (\d*)x)?(?: ([+-]) (\d+))?$/);
  assert.ok(m, `Không đọc được đa thức bậc hai: ${text}`);
  const b = m[2] ? (m[2] === '-' ? -1 : 1) * coef(m[3]) : 0;
  return { a: coef(m[1]), b, c: signed(m[4], m[5]) };
}

/** Đọc "x^n" / "x" ra số mũ. */
function exponentOf(display: string, v: string): number {
  if (display === v) return 1;
  const m = display.match(new RegExp(`^${v}\\^(\\d+)$`));
  assert.ok(m, `Lựa chọn "${display}" không ở dạng lũy thừa.`);
  return Number(m[1]);
}

export const MORE_ADVANCED_VERIFIERS_2: Record<string, Verifier> = {
  'adv-exponent-rules': (item) => {
    const m = match(item.stem, /^Which of the following is equivalent to frac\(([xyn])\^(\d+) × \1\^(\d+),\1(?:\^(\d+))?\), where \1 > 0\?$/);
    const [v, a, b] = [m[1]!, Number(m[2]), Number(m[3])];
    const c = m[4] ? Number(m[4]) : 1;
    assert.equal(exponentOf(correctDisplay(item), v), a + b - c, 'Số mũ sai.');
  },

  'adv-factor-trinomial': (item) => {
    const m = match(item.stem, /^Which of the following is equivalent to (.+)\?$/);
    const { a, b, c } = quadratic(m[1]!);
    assert.equal(a, 1);
    const f = match(correctDisplay(item), /^\(x ([+-]) (\d+)\)\(x ([+-]) (\d+)\)$/);
    const p = signed(f[1], f[2]);
    const q = signed(f[3], f[4]);
    assert.equal(p + q, b, 'Nhân ra hệ số của x không khớp.');
    assert.equal(p * q, c, 'Nhân ra hằng số không khớp.');
  },

  'adv-rational-simplify': (item) => {
    const m = match(item.stem, /^The expression frac\((.+),x ([+-]) (\d+)\) is equivalent to x \+ k for all x != (-?\d+),/);
    const { a, b, c } = quadratic(m[1]!);
    const p = signed(m[2], m[3]);
    assert.equal(a, 1);
    assert.equal(Number(m[4]), -p, 'Điều kiện x ≠ phải là nghiệm của mẫu.');
    // Chia (x^2 + bx + c) cho (x + p): phải hết, thương là x + (b - p).
    const k = b - p;
    assert.equal(p * k, c, 'Tử số không chia hết cho mẫu số.');
    expectAnswer(item, rat(k), 'Thương của phép chia');
  },

  'adv-discriminant-count': (item) => {
    const m = match(item.stem, /^How many distinct real solutions does the equation (.+) = 0 have\?$/);
    const { a, b, c } = quadratic(m[1]!);
    const disc = b * b - 4 * a * c;
    const expected = disc > 0 ? 'Exactly two' : disc === 0 ? 'Exactly one' : 'Zero';
    assert.equal(correctDisplay(item), expected, `Biệt thức ${disc}.`);
  },

  'adv-exponential-equation': (item) => {
    const m = match(item.stem, /^If (\d+)\^\(([xn]) \+ (\d+)\) = (\d+), what is the value of \2\?$/);
    const [base, a, rhs] = [Number(m[1]), Number(m[3]), Number(m[4])];
    const x = answerOf(item);
    assert.equal(x.den, 1);
    assert.equal(base ** (x.num + a), rhs, `Thế ngược không thỏa: ${item.stem}`);
  },

  'adv-absolute-value-sum': (item) => {
    const m = match(item.stem, /^What is the sum of the solutions to \|x ([+-]) (\d+)\| = (\d+)\?$/);
    const shift = signed(m[1], m[2]);
    const b = Number(m[3]);
    // |x + shift| = b  ⇒  x = -shift ± b.
    expectAnswer(item, rat(-shift + b + (-shift - b)), 'Tổng hai nghiệm');
  },

  'adv-vertex-form-extreme': (item) => {
    const m = match(item.stem, /^The function f is defined by f\(x\) = (-?\d*)\(x ([+-]) (\d+)\)\^2 ([+-]) (\d+)\. What is the (minimum|maximum) value of f\(x\)\?$/);
    const a = coef(m[1]);
    const k = signed(m[4], m[5]);
    assert.equal(m[6], a > 0 ? 'minimum' : 'maximum', 'Hỏi nhầm cực trị so với dấu của a.');
    expectAnswer(item, rat(k), 'Tung độ đỉnh');
  },

  'adv-doubling-growth': (item) => {
    const m = match(item.stem, /doubles every (\d+) \w+\. There are currently (\d+) \w+\. .* there be (\d+) \w+ from now\?$/);
    const [d, P, t] = [Number(m[1]), Number(m[2]), Number(m[3])];
    assert.equal(t % d, 0, 'Thời gian phải là bội của chu kỳ.');
    expectAnswer(item, rat(P * 2 ** (t / d)), 'Nhân đôi');
  },

  'adv-function-composition': (item) => {
    const m = match(item.stem, /f\(x\) = x\^2 - (\d+) and g\(x\) = x ([+-]) (\d+)\. What is the value of f\(g\((\d+)\)\)\?$/);
    const c = Number(m[1]);
    const d = signed(m[2], m[3]);
    const k = Number(m[4]);
    expectAnswer(item, rat((k + d) ** 2 - c), 'f(g(k))');
    assert.ok(answerOf(item).num > 0, 'Đáp án grid-in phải dương.');
  },
};
