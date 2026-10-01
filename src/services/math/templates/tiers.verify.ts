import assert from 'node:assert/strict';

import type { MathItem, MathValue } from '@/lib/math/types';
import { equalsValue, formatValueMath, rat } from '@/lib/math/value';

/**
 * Bộ kiểm chứng cho `tiers.ts` — ĐỌC NGƯỢC TỪ ĐỀ rồi tự giải bằng cách khác
 * với template (thế ngược, đếm vét, biệt thức…), cùng nguyên tắc với
 * `more.verify.ts`. So với biến nội bộ của template thì test luôn xanh kể cả
 * khi câu chữ in ra lệch số.
 */

type Verifier = (item: MathItem) => void;

function match(text: string, pattern: RegExp): RegExpMatchArray {
  const m = text.match(pattern);
  assert.ok(m, `Đề không đúng khuôn: ${text}`);
  return m;
}

function correctDisplay(item: MathItem): string {
  assert.ok(item.choices && item.correctIndex !== null, 'Câu trắc nghiệm thiếu lựa chọn.');
  return item.choices[item.correctIndex]!.display;
}

function displayValue(display: string): MathValue {
  const int = display.match(/^(-?\d+)$/);
  if (int) return rat(Number(int[1]));
  const frac = display.match(/^(-?)frac\((\d+),(\d+)\)$/);
  assert.ok(frac, `Lựa chọn "${display}" không phải số.`);
  return rat((frac[1] === '-' ? -1 : 1) * Number(frac[2]), Number(frac[3]));
}

function answerOf(item: MathItem): MathValue {
  return item.answerValue ?? displayValue(correctDisplay(item));
}

function expect(item: MathItem, expected: MathValue, why: string) {
  const got = answerOf(item);
  assert.ok(
    equalsValue(got, expected),
    `${why}: kỳ vọng ${expected.num}/${expected.den}, template cho ${got.num}/${got.den}. Đề: ${item.stem}`,
  );
}

/** "3x - 5", "x", "-2x + 7", "4x" → {a, b}. */
function linear(text: string): { a: number; b: number } {
  const m = text.trim().match(/^(-?\d*)x(?: ([+-]) (\d+))?$/);
  assert.ok(m, `Không đọc được biểu thức bậc nhất: ${text}`);
  const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
  const b = m[2] ? (m[2] === '-' ? -1 : 1) * Number(m[3]) : 0;
  return { a, b };
}

const num = (s: string) => Number(s.replace(/,/g, ''));

export const TIER_VERIFIERS: Record<string, Verifier> = {
  // ------------------------------------------------------------- KHÓ

  'hard-lin1-two-fractions': (item) => {
    const m = match(item.stem, /^If frac\((.+?),(\d+)\) - frac\((.+?),(\d+)\) = (-?\d+), what is the value of x\?$/);
    const L = linear(m[1]!);
    const M = Number(m[2]);
    const R = linear(m[3]!);
    const N = Number(m[4]);
    const t = Number(m[5]);
    const x = answerOf(item);
    assert.equal(x.den, 1);
    // Thế ngược, nhân chéo để khỏi dùng số thực.
    assert.equal(N * (L.a * x.num + L.b) - M * (R.a * x.num + R.b), M * N * t, `Thế x = ${x.num} không thoả: ${item.stem}`);
    assert.notEqual(N * L.a - M * R.a, 0, 'Hệ số của x triệt tiêu — phương trình không còn nghiệm duy nhất.');
  },

  'hard-two-var-param-slope': (item) => {
    const m = match(
      item.stem,
      /^In the xy-plane, the graph of (-?\d*)x \+ ky = (-?\d+), where k is a constant, passes through the point \((-?\d+), (-?\d+)\)\. What is the slope of the graph\?$/,
    );
    const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
    const c = Number(m[2]);
    const p = Number(m[3]);
    const q = Number(m[4]);
    assert.notEqual(q, 0);
    const k = rat(c - a * p, q);
    assert.equal(k.den, 1, 'k phải là số nguyên.');
    assert.notEqual(k.num, 0);
    expect(item, rat(-a, k.num), 'Độ dốc -a/k');
  },

  'hard-linfn-shift-rate': (item) => {
    const m = match(
      item.stem,
      /^For the linear function f, f\(x \+ (\d+)\) = f\(x\) ([+-]) (\d+) for all values of x, and f\((-?\d+)\) = (-?\d+)\. What is the value of f\((-?\d+)\)\?$/,
    );
    const h = Number(m[1]);
    const d = (m[2] === '-' ? -1 : 1) * Number(m[3]);
    const x0 = Number(m[4]);
    const y0 = Number(m[5]);
    const x1 = Number(m[6]);
    // f(x) = y0 + (d/h)(x - x0)
    expect(item, rat(y0 * h + d * (x1 - x0), h), 'f(x1)');
  },

  'hard-system-no-solution-product': (item) => {
    const m = match(
      item.stem,
      /^In the system of equations px \+ (\d+)y = (-?\d+) and (\d+)x \+ ty = (-?\d+), p and t are constants\. If the system has no solution, what is the value of pt\?$/,
    );
    const q = Number(m[1]);
    const r = Number(m[2]);
    const s = Number(m[3]);
    const u = Number(m[4]);
    // Dựng một cặp (p, t) vô nghiệm cụ thể: p = s, t = q cho hai đường song song;
    // khác hằng số nên không trùng nhau.
    assert.notEqual(r, u, 'Với p = s, t = q mà r = u thì hai đường trùng nhau.');
    expect(item, rat(s * q), 'pt');
  },

  'hard-ineq-compound-count': (item) => {
    const m = match(item.stem, /^How many integers x satisfy (-?\d+) <= frac\((-?\d+) - (\d+)x,(\d+)\) < (-?\d+)\?$/);
    const lo = Number(m[1]);
    const p = Number(m[2]);
    const q = Number(m[3]);
    const r = Number(m[4]);
    const hi = Number(m[5]);
    let count = 0;
    for (let x = -2000; x <= 2000; x += 1) {
      const v = p - q * x; // so với r·lo và r·hi, r > 0
      if (r * lo <= v && v < r * hi) count += 1;
    }
    assert.ok(count > 0, 'Không có nghiệm nguyên nào.');
    expect(item, rat(count), 'Đếm vét');
  },

  'hard-expr-rational-division': (item) => {
    const m = match(
      item.stem,
      /^The expression frac\((.+?),x ([+-]) (\d+)\) is equivalent to (\d+) \+ frac\(k,x ([+-]) (\d+)\), where k is a constant and x != (-?\d+)\. What is the value of k\?$/,
    );
    const top = linear(m[1]!);
    const c = (m[2] === '-' ? -1 : 1) * Number(m[3]);
    const a = Number(m[4]);
    assert.equal(top.a, a, 'Hằng số đứng trước phải bằng hệ số của x trên tử.');
    assert.equal(Number(m[7]), -c);
    // a(x + c) + k ≡ ax + b ⇒ k = b − ac; kiểm bằng cách thế hai giá trị x.
    const k = answerOf(item);
    for (const x of [c + 3, c + 7]) {
      const lhs = rat(top.a * x + top.b, x + c);
      const rhs = rat(a * (x + c) + k.num, x + c);
      assert.ok(equalsValue(lhs, rhs), `Thế x = ${x} hai vế lệch.`);
    }
  },

  'hard-quad-tangent-line': (item) => {
    const m = match(
      item.stem,
      /^In the xy-plane, the line y = (-?\d*)x \+ k, where k is a constant, intersects the parabola y = x\^2(?: ([+-]) (\d*)x)?(?: ([+-]) (\d+))? at exactly one point\. What is the value of k\?$/,
    );
    const mm = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
    const p = m[2] ? (m[2] === '-' ? -1 : 1) * (m[3] === '' ? 1 : Number(m[3])) : 0;
    const q = m[4] ? (m[4] === '-' ? -1 : 1) * Number(m[5]) : 0;
    const k = answerOf(item);
    assert.equal(k.den, 1);
    // x² + (p − m)x + (q − k) = 0 phải có nghiệm kép.
    const B = p - mm;
    const C = q - k.num;
    assert.equal(B * B - 4 * C, 0, `Biệt thức khác 0: ${item.stem}`);
  },

  'hard-quad-no-real-condition': (item) => {
    const m = match(
      item.stem,
      /^In the equation (\d*)x\^2 ([+-]) (\d*)x \+ c = 0, c is a constant\. For which values of c does the equation have (no real solutions|two distinct real solutions)\?$/,
    );
    const a = m[1] === '' ? 1 : Number(m[1]);
    const b = (m[2] === '-' ? -1 : 1) * (m[3] === '' ? 1 : Number(m[3]));
    const none = m[4] === 'no real solutions';
    assert.equal(correctDisplay(item), `c ${none ? '>' : '<'} ${formatValueMath(rat(b * b, 4 * a))}`);
    // Kiểm bằng số: lệch ngưỡng một chút về phía đáp án thì biệt thức đúng dấu.
    const T = (b * b) / (4 * a);
    const probe = none ? T + 0.01 : T - 0.01;
    const disc = b * b - 4 * a * probe;
    assert.ok(none ? disc < 0 : disc > 0);
  },


  'hard-transform-vertex': (item) => {
    const m = match(
      item.stem,
      /^The graph of y = f\(x\) in the xy-plane is a parabola with vertex \((-?\d+), (-?\d+)\)\. The function g is defined by g\(x\) = (-?\d+)f\(x ([+-]) (\d+)\) ([+-]) (\d+)\. What are the coordinates of the vertex of the graph of y = g\(x\)\?$/,
    );
    const h = Number(m[1]);
    const k = Number(m[2]);
    const A = Number(m[3]);
    const s = (m[4] === '-' ? -1 : 1) * Number(m[5]);
    const v = (m[6] === '-' ? -1 : 1) * Number(m[7]);
    // g đạt cực trị khi x + s = h.
    assert.equal(correctDisplay(item), `(${h - s}, ${A * k + v})`);
  },

  'hard-exp-from-two-values': (item) => {
    const m = match(
      item.stem,
      /^The function ([fgh]) is defined by \1\(x\) = a\(b\)\^x, where a and b are positive constants\. If \1\((\d+)\) = (\d+) and \1\((\d+)\) = (\d+), what is the value of \1\(0\)\?$/,
    );
    const x1 = Number(m[2]);
    const y1 = Number(m[3]);
    const x2 = Number(m[4]);
    const y2 = Number(m[5]);
    let b = 0;
    for (let cand = 2; cand <= 10; cand += 1) if (y1 * cand ** (x2 - x1) === y2) b = cand;
    assert.ok(b > 0, 'Không tìm được cơ số nguyên.');
    expect(item, rat(y1, b ** x1), 'f(0)');
  },


  'hard-ratio-square-units': (item) => {
    const m = match(item.stem, /^A rectangular lawn measures (\d+) yards by (\d+) yards\. Fertilizer is applied at a rate of (\d+) pounds per 100 square feet\./);
    const L = Number(m[1]);
    const W = Number(m[2]);
    const r = Number(m[3]);
    expect(item, rat(3 * L * 3 * W * r, 100), 'Pound phân bón');
  },

  'hard-percent-reverse-compound': (item) => {
    const m = match(
      item.stem,
      /^The price of a [a-z ]+ was increased by x% and then the increased price was decreased by (\d+)%\. The final price was ([\d.]+)% (greater|less) than the original price\. What is the value of x\?$/,
    );
    const d = Number(m[1]);
    const net100 = Math.round(Number(m[2]) * 100) * (m[3] === 'less' ? -1 : 1);
    const x = answerOf(item);
    assert.equal(x.den, 1);
    // (100 + x)(100 − d) = 10000 + net·100
    assert.equal((100 + x.num) * (100 - d), 10000 + net100);
  },

  'hard-mean-outlier-removed': (item) => {
    const m = match(item.stem, /^A data set consists of the (\d+) values ([\d, ]+)\. The value (\d+) is an outlier\./);
    const n = Number(m[1]);
    const values = m[2]!.split(',').map((v) => Number(v.trim()));
    assert.equal(values.length, n);
    const outlier = Number(m[3]);
    assert.equal(Math.max(...values), outlier, 'Ngoại lai phải là giá trị lớn nhất.');
    const total = values.reduce((s, v) => s + v, 0);
    const meanAll = rat(total, n);
    const meanRest = rat(total - outlier, n - 1);
    expect(item, rat(meanAll.num * meanRest.den - meanRest.num * meanAll.den, meanAll.den * meanRest.den), 'Hiệu hai trung bình');
  },

  'hard-exp-model-period': (item) => {
    const m = match(item.stem, /^The function f\(t\) = (\d+)\(([\d.]+)\)\^\(t\/(\d+)\) models /);
    const base = Number(m[2]);
    const k = Number(m[3]);
    const pct = Math.round(Math.abs(base - 1) * 100);
    const verb = base > 1 ? 'increases' : 'decreases';
    assert.equal(correctDisplay(item), `The quantity ${verb} by ${pct}% every ${k} years.`);
  },

  'hard-conditional-weighted': (item) => {
    const m = match(
      item.stem,
      /^At a company with ([\d,]+) employees, (\d+)% of the employees work remotely and the rest work on-site\. Of the remote employees, (\d+)% use a standing desk, and of the on-site employees, (\d+)% use a standing desk\./,
    );
    const N = num(m[1]!);
    const a = Number(m[2]);
    const p = Number(m[3]);
    const q = Number(m[4]);
    // Đếm trên 1.000.000 người giả định để mọi tích là số nguyên.
    const remote = N * a * p; // ×10000
    const onsite = N * (100 - a) * q;
    expect(item, rat(remote, remote + onsite), 'P(làm từ xa | bàn đứng)');
  },

  'hard-moe-population-count': (item) => {
    const m = match(item.stem, /from a town with ([\d,]+) adults\. Of those surveyed, (\d+)% said .* The margin of error for this estimate is (\d+) percentage points\./);
    const P = num(m[1]!);
    const x = Number(m[2]);
    const e = Number(m[3]);
    const fmt = (v: number) => v.toLocaleString('en-US');
    assert.equal(correctDisplay(item), `Between ${fmt((P * (x - e)) / 100)} and ${fmt((P * (x + e)) / 100)}`);
  },

  'hard-claim-study-design': (item) => {
    const randomSample = /^Researchers randomly selected /.test(item.stem);
    const volunteer = /who volunteered\./.test(item.stem);
    assert.ok(randomSample !== volunteer, 'Đề phải nói rõ cách chọn mẫu.');
    const randomAssign = /randomly assigned half/.test(item.stem);
    const chose = /let each participant choose/.test(item.stem);
    assert.ok(randomAssign !== chose, 'Đề phải nói rõ cách phân nhóm.');
    const t = match(item.stem, /The researchers (?:randomly assigned half of them to use|let each participant choose whether to use) (.+?)(?: and the other half not to)?\. After/)[1]!;
    const correct = correctDisplay(item);
    const causal = /causes/.test(correct);
    const general = !/participants/.test(correct);
    assert.equal(causal, randomAssign, `Nhân quả chỉ khi phân nhóm ngẫu nhiên: ${correct}`);
    assert.equal(general, randomSample, `Suy rộng chỉ khi chọn mẫu ngẫu nhiên: ${correct}`);
    assert.ok(correct.includes(t), 'Kết luận phải nói về đúng can thiệp trong đề.');
  },

  'hard-cylinder-scale-percent': (item) => {
    const m = match(
      item.stem,
      /^The radius of a right circular (cylinder|cone) is (increased|decreased) by (\d+)%, and its height is (increased|decreased) by (\d+)%\./,
    );
    const rf = 100 + (m[2] === 'increased' ? 1 : -1) * Number(m[3]);
    const hf = 100 + (m[4] === 'increased' ? 1 : -1) * Number(m[5]);
    // V = πr²h (hoặc ⅓πr²h — hệ số chung triệt tiêu khi lấy tỉ số).
    expect(item, rat(rf * rf * hf, 10000), 'Phần trăm thể tích');
  },

  'hard-similar-trapezoid-area': (item) => {
    const m = match(item.stem, /AD = (\d+), DB = (\d+), and the area of triangle ADE is (\d+), what is the area of quadrilateral DBCE\?$/);
    const a = Number(m[1]);
    const b = Number(m[2]);
    const X = Number(m[3]);
    const big = rat(X * (a + b) * (a + b), a * a);
    expect(item, rat(big.num - X * big.den, big.den), 'Diện tích tứ giác');
  },

  'hard-trig-similar-transfer': (item) => {
    const m = match(
      item.stem,
      /^Triangles ([A-Z])([A-Z])([A-Z]) and ([A-Z])([A-Z])([A-Z]) are similar, .* Angles \3 and \6 are right angles\. If (sin|cos|tan) \1 = frac\((\d+),(\d+)\), what is the value of (sin|cos|tan) \5\?$/,
    );
    const given = m[7]!;
    const p = Number(m[8]);
    const q = Number(m[9]);
    // Dựng lại ba cạnh (đối o, kề a, huyền h của góc thứ nhất) từ tỉ số đã cho.
    let o: number;
    let a: number;
    let h: number;
    if (given === 'tan') [o, a, h] = [p, q, Math.sqrt(p * p + q * q)];
    else if (given === 'sin') [o, a, h] = [p, Math.sqrt(q * q - p * p), q];
    else [o, a, h] = [Math.sqrt(q * q - p * p), p, q];
    assert.ok(Number.isInteger(o) && Number.isInteger(a) && Number.isInteger(h), 'Ba cạnh phải nguyên.');
    // Góc thứ hai (ứng với đỉnh giữa): đối = a, kề = o.
    const asked = m[10]!;
    const want = asked === 'sin' ? rat(a, h) : asked === 'cos' ? rat(o, h) : rat(a, o);
    expect(item, want, `${asked} của góc tương ứng`);
  },


  'hard-circle-constant-from-radius': (item) => {
    const m = match(
      item.stem,
      /^In the xy-plane, the graph of x\^2 ([+-]) (\d+)x \+ y\^2 ([+-]) (\d+)y \+ c = 0, where c is a constant, is a circle with radius (\d+)\. What is the value of c\?$/,
    );
    const D = (m[1] === '-' ? -1 : 1) * Number(m[2]);
    const E = (m[3] === '-' ? -1 : 1) * Number(m[4]);
    const r = Number(m[5]);
    const c = answerOf(item);
    // Bán kính² = (D/2)² + (E/2)² − c
    assert.equal(D * D + E * E - 4 * c.num, 4 * r * r);
  },

  // -------------------------------------------------------------- DỄ

  'easy-system-sum-diff': (item) => {
    const m = match(item.stem, /^If x \+ y = (-?\d+) and x - y = (-?\d+), what is the value of x\?$/);
    expect(item, rat(Number(m[1]) + Number(m[2]), 2), 'x');
  },

  'easy-ineq-which-value': (item) => {
    const m = match(item.stem, /^Which of the following values of x satisfies (.+) > (-?\d+)\?$/);
    const { a, b } = linear(m[1]!);
    const c = Number(m[2]);
    const ok = (item.choices ?? []).map((ch) => {
      const v = displayValue(ch.display);
      return a * v.num + b * v.den > c * v.den;
    });
    assert.equal(ok.filter(Boolean).length, 1, 'Phải có đúng một lựa chọn thoả.');
    assert.equal(ok.indexOf(true), item.correctIndex);
  },

  'easy-quad-factored-root': (item) => {
    const m = match(item.stem, /^What is the positive solution to the equation \(x - (\d+)\)\(x \+ (\d+)\) = 0\?$/);
    const x = answerOf(item);
    assert.equal((x.num - Number(m[1]) * x.den) * (x.num + Number(m[2]) * x.den), 0);
    assert.ok(x.num > 0);
  },

  'easy-line-fit-predict-int': (item) => {
    const m = match(item.stem, /^A line of best fit for a data set is y = (\d+)x \+ (\d+)\. Based on the line of best fit, what is the predicted value of y when x = (\d+)\?$/);
    expect(item, rat(Number(m[1]) * Number(m[3]) + Number(m[2])), 'y dự đoán');
  },

  'easy-claim-generalize': (item) => {
    const m = match(item.stem, /^A survey was given to a random sample of \d+ (.+)\. To which/);
    const sample = m[1]!;
    const correct = correctDisplay(item);
    assert.equal(correct, `All ${sample}`, `"${correct}" không phải đúng tổng thể của mẫu "${sample}".`);
  },

  'easy-circle-radius-from-equation': (item) => {
    const m = match(item.stem, /= (\d+)\. What is the radius of the circle\?$/);
    const r = answerOf(item);
    assert.equal(r.den, 1);
    assert.equal(r.num * r.num, Number(m[1]));
  },
};
