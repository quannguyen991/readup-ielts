import assert from 'node:assert/strict';

import { FIT_CONTEXTS, MARGIN_ANSWER, STUDY_CONTEXTS, experimentAnswers, fitAnswers, surveyAnswers } from './more-data';
import type { MathItem, MathValue } from '@/lib/math/types';
import { equalsValue, rat } from '@/lib/math/value';

/**
 * Bộ kiểm chứng cho 38 dạng câu trong `more-*.ts`, nối vào `VERIFIERS` của
 * `templates.test.ts`.
 *
 * Cùng nguyên tắc với file test chính: ĐỌC NGƯỢC TỪ ĐỀ BÀI rồi tự giải, không
 * đọc tham số nội bộ của template. Đề in ra một dãy số khác với thứ template
 * nghĩ thì bộ kiểm chứng giải theo đề và bắt được ngay.
 */

type Verifier = (item: MathItem) => void;

function value(display: string): MathValue {
  const int = display.match(/^(-?\d+)$/);
  if (int) return rat(Number(int[1]));
  const frac = display.match(/^(-?)frac\((\d+),(\d+)\)$/);
  if (frac) return rat((frac[1] === '-' ? -1 : 1) * Number(frac[2]), Number(frac[3]));
  throw new Error(`Lựa chọn "${display}" không ở dạng số.`);
}

function correctDisplay(item: MathItem): string {
  assert.ok(item.choices && item.correctIndex !== null, 'Câu trắc nghiệm thiếu lựa chọn.');
  return item.choices[item.correctIndex]!.display;
}

/** Đáp án của câu: giá trị grid-in, hoặc lựa chọn đúng đọc ra số. */
function answerOf(item: MathItem): MathValue {
  if (item.answerValue) return item.answerValue;
  return value(correctDisplay(item));
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

/** "3", "-3", "" (=1), "-" (=-1) — hệ số viết tắt trước biến. */
function coef(text: string | undefined): number {
  if (text === undefined || text === '' || text === '+') return 1;
  if (text === '-') return -1;
  return Number(text);
}

/** "+ 4" / "- 4" / undefined → số có dấu. */
function signed(sign: string | undefined, n: string | undefined): number {
  if (!sign || !n) return 0;
  return (sign === '-' ? -1 : 1) * Number(n);
}

/** Đọc vế "ax + b" (có thể thiếu một trong hai phần). */
function linear(text: string, v = 'x'): { m: number; k: number } {
  const t = text.trim();
  const full = t.match(new RegExp(`^(-?\\d*)${v}(?: ([+-]) (\\d+))?$`));
  if (full) return { m: coef(full[1]), k: signed(full[2], full[3]) };
  const constOnly = t.match(/^-?\d+$/);
  if (constOnly) return { m: 0, k: Number(t) };
  throw new Error(`Không đọc được biểu thức bậc nhất: ${text}`);
}

/** Đọc "ax^2 + bx + c" (b, c có thể vắng). */
function quadratic(text: string, v = 'x'): { a: number; b: number; c: number } {
  const re = new RegExp(`^(-?\\d*)${v}\\^2(?: ([+-]) (\\d*)${v})?(?: ([+-]) (\\d+))?$`);
  const m = text.trim().match(re);
  assert.ok(m, `Không đọc được đa thức bậc hai: ${text}`);
  const b = m[2] ? (m[2] === '-' ? -1 : 1) * coef(m[3]) : 0;
  return { a: coef(m[1]), b, c: signed(m[4], m[5]) };
}

function numbersAfter(text: string, marker: string): number[] {
  const i = text.indexOf(marker);
  assert.ok(i >= 0, `Không thấy "${marker}" trong đề.`);
  return [...text.slice(i + marker.length).matchAll(/-?\d+/g)].map((m) => Number(m[0]));
}

export const MORE_VERIFIERS: Record<string, Verifier> = {
  // ------------------------------------------------------------- algebra

  'alg-linear-one-var-fraction': (item) => {
    const m = match(item.stem, /^If frac\(x,(\d+)\) ([+-]) (\d+) = (-?\d+), what is the value of x\?$/);
    const [a, b, c] = [Number(m[1]), signed(m[2], m[3]), Number(m[4])];
    expectAnswer(item, rat(a * (c - b)), 'x/a + b = c');
    assert.ok(answerOf(item).num > 0, 'Nghiệm grid-in phải dương.');
  },

  'alg-linear-one-var-infinite': (item) => {
    const m = match(item.stem, /^In the equation (\d+)\((\d+)x - (\d+)\) = (\d+)x - k, k is a constant\./);
    const [p, q, r, s] = m.slice(1, 5).map(Number) as [number, number, number, number];
    assert.equal(s, p * q, 'Hệ số x hai vế phải bằng nhau thì mới có thể vô số nghiệm.');
    expectAnswer(item, rat(p * r), 'Vô số nghiệm');
  },

  'alg-two-var-slope-standard': (item) => {
    const m = match(item.stem, /^What is the slope of the line with equation (-?\d*)x ([+-]) (\d*)y = (-?\d+) in the xy-plane\?$/);
    const a = coef(m[1]);
    const b = (m[2] === '-' ? -1 : 1) * coef(m[3]);
    expectAnswer(item, rat(-a, b), 'Độ dốc -a/b');
  },

  'alg-two-var-point-on-line': (item) => {
    const m = match(item.stem, /^The point \((\d+), t\) lies on the line with equation (\d+)x \+ (\d+)y = (\d+) in the xy-plane\./);
    const [p, a, b, c] = m.slice(1, 5).map(Number) as [number, number, number, number];
    const t = answerOf(item);
    assert.ok(equalsValue(rat(a * p * t.den + b * t.num, t.den), rat(c)), `Thế (${p}, t) vào không thỏa: ${item.stem}`);
  },

  'alg-linear-fn-two-points': (item) => {
    const m = match(item.stem, /^The linear function f satisfies f\((-?\d+)\) = (-?\d+) and f\((-?\d+)\) = (-?\d+)\. What is the value of f\((-?\d+)\)\?$/);
    const [x1, y1, x2, y2, x3] = m.slice(1, 6).map(Number) as [number, number, number, number, number];
    // y3 = y2 + (y2 - y1)(x3 - x2)/(x2 - x1)
    expectAnswer(item, rat(y2 * (x2 - x1) + (y2 - y1) * (x3 - x2), x2 - x1), 'Nội suy tuyến tính');
  },

  'alg-linear-fn-rate-change': (item) => {
    const m = match(item.stem, /^The function C\(h\) = (\d+)h \+ (\d+) gives .* from (\d+) hours to (\d+) hours\?$/);
    const [a, , h1, h2] = m.slice(1, 5).map(Number) as [number, number, number, number];
    expectAnswer(item, rat(a * (h2 - h1)), 'Phần tăng = độ dốc × số giờ tăng');
  },

  'alg-system-substitution-y': (item) => {
    const m = match(item.stem, /^In the system of equations y = (.+) and (\d*)x \+ y = (\d+), \(x, y\) is the solution\./);
    const { m: slope, k } = linear(m[1]!);
    const a = coef(m[2]);
    const c = Number(m[3]);
    assert.notEqual(a + slope, 0, 'Hệ phải có nghiệm duy nhất.');
    // a x + slope x + k = c
    const x = rat(c - k, a + slope);
    const y = rat(slope * (c - k) + k * (a + slope), a + slope);
    expectAnswer(item, y, `Nghiệm của hệ (x = ${x.num}/${x.den})`);
  },

  'alg-system-no-solution-k': (item) => {
    const m = match(item.stem, /^In the system of equations (\d+)x \+ (\d+)y = (\d+) and kx \+ (\d+)y = (-?\d+), k is a constant\./);
    const [a, b, c, d, e] = m.slice(1, 6).map(Number) as [number, number, number, number, number];
    const k = answerOf(item);
    // Song song: k/a = d/b. Không trùng: e ≠ c·d/b.
    assert.ok(equalsValue(rat(k.num * b, k.den), rat(a * d)), `k không làm hai đường song song: ${item.stem}`);
    assert.ok(e * b !== c * d, 'Hai phương trình trùng nhau thì vô số nghiệm, không phải vô nghiệm.');
  },

  'alg-inequality-negative-coef': (item) => {
    const m = match(item.stem, /^Which of the following is the solution set of (.+) (>|>=) (-?\d+)\?$/);
    const { m: slope, k } = linear(m[1]!);
    assert.ok(slope < 0, 'Dạng này phải có hệ số âm.');
    const c = Number(m[3]);
    const bound = (c - k) / slope;
    assert.ok(Number.isInteger(bound), 'Cận phải là số nguyên.');
    const flipped = m[2] === '>' ? '<' : '<=';
    assert.equal(correctDisplay(item), `x ${flipped} ${bound}`);
  },

  'alg-inequality-min-score': (item) => {
    const scores = numbersAfter(item.stem.split(' What is')[0]!, 'tests of a course were ');
    const m = match(item.stem, /on test (\d+) for the mean of all (\d+) test scores to be at least (\d+)\?$/);
    const [n, n2, target] = m.slice(1, 4).map(Number) as [number, number, number];
    assert.equal(n, n2);
    assert.equal(scores.length, n - 1, 'Số điểm đã cho phải bằng n - 1.');
    const need = target * n - scores.reduce((s, v) => s + v, 0);
    expectAnswer(item, rat(need), 'Điểm tối thiểu');
    assert.ok(need >= 0 && need <= 100, 'Điểm cần phải nằm trong thang 0–100.');
  },

  // ------------------------------------------------------------ advanced

  'adv-difference-of-squares': (item) => {
    const m = match(item.stem, /^Which of the following is equivalent to (\d*)([xytn])\^2 - (\d+)\?$/);
    const A = coef(m[1]);
    const v = m[2]!;
    const B = Number(m[3]);
    const c = match(correctDisplay(item), new RegExp(`^\\((\\d*)${v} - (\\d+)\\)\\((\\d*)${v} \\+ (\\d+)\\)$`));
    const [p1, q1, p2, q2] = [coef(c[1]), Number(c[2]), coef(c[3]), Number(c[4])];
    assert.equal(p1, p2);
    assert.equal(q1, q2);
    assert.equal(p1 * p1, A, 'Nhân ra hệ số bậc hai không khớp đề.');
    assert.equal(q1 * q1, B, 'Nhân ra hằng số không khớp đề.');
  },

  'adv-poly-subtract-coef': (item) => {
    const m = match(item.stem, /^The expression \((.+)\) - \((.+)\) is equivalent to px\^2 \+ qx \+ r,/);
    const first = quadratic(m[1]!);
    const second = quadratic(m[2]!);
    expectAnswer(item, rat(first.b - second.b), 'q = b1 - b2');
  },

  'adv-radical-equation': (item) => {
    const m = match(item.stem, /^If sqrt\(([xn]) ([+-]) (\d+)\) = (\d+), what is the value of \1\?$/);
    const a = signed(m[2], m[3]);
    const b = Number(m[4]);
    const x = answerOf(item);
    assert.ok(equalsValue(rat(x.num + a * x.den, x.den), rat(b * b)), `Thế ngược không thỏa: ${item.stem}`);
    assert.ok(x.num + a * x.den >= 0, 'Biểu thức dưới căn phải không âm.');
  },

  'adv-quadratic-sum-of-roots': (item) => {
    const m = match(item.stem, /^What is the sum of the solutions to (.+) = 0\?$/);
    const v = m[1]!.includes('t^2') ? 't' : 'x';
    const { a, b, c } = quadratic(m[1]!, v);
    assert.equal(a, 1);
    const disc = b * b - 4 * c;
    assert.ok(disc > 0, 'Phải có hai nghiệm phân biệt.');
    expectAnswer(item, rat(-b), 'Tổng hai nghiệm = -b');
  },

  'adv-evaluate-quadratic': (item) => {
    const m = match(item.stem, /^The function f is defined by f\(x\) = (.+)\. What is the value of f\((-?\d+)\)\?$/);
    const { a, b, c } = quadratic(m[1]!);
    const k = Number(m[2]);
    expectAnswer(item, rat(a * k * k + b * k + c), 'f(k)');
  },

  'adv-exponential-decay-percent': (item) => {
    const m = match(item.stem, /^The function V\(t\) = \d+\((0\.\d+)\)\^t gives/);
    const p = Math.round((1 - Number(m[1])) * 100);
    assert.equal(correctDisplay(item), `${p}%`);
  },

  // ---------------------------------------------------------------- data

  'psda-ratio-part-whole': (item) => {
    const m = match(item.stem, /^There are (\d+) .+\. The ratio of .+ to .+ is (\d+) to (\d+)\./);
    const [total, a, b] = m.slice(1, 4).map(Number) as [number, number, number];
    expectAnswer(item, rat(total * a, a + b), 'Phần = tổng × a/(a+b)');
  },

  'psda-speed-distance': (item) => {
    const m = match(item.stem, /^A car travels (\d+) miles in (\d+) hours .* in (\d+) hours\?$/);
    const [d, t1, t2] = m.slice(1, 4).map(Number) as [number, number, number];
    expectAnswer(item, rat(d * t2, t1), 'Quãng đường tỉ lệ thời gian');
  },

  'psda-percent-of-percent': (item) => {
    const m = match(item.stem, /^What is (\d+)% of (\d+)% of (\d+)\?$/);
    const [p, q, n] = m.slice(1, 4).map(Number) as [number, number, number];
    expectAnswer(item, rat(p * q * n, 10000), 'p% của q% của n');
  },

  'psda-percent-increase-new': (item) => {
    const m = match(item.stem, /was \$(\d+)\. The price was then increased by (\d+)%\./);
    const [P, p] = m.slice(1, 3).map(Number) as [number, number];
    expectAnswer(item, rat(P * (100 + p), 100), 'Giá mới');
  },

  'psda-mean-missing-value': (item) => {
    const m = match(item.stem, /^The mean of (\d+) numbers is (\d+)\. If (\d+) of the numbers are (.+), what is the remaining number\?$/);
    const [n, M, k] = m.slice(1, 4).map(Number) as [number, number, number];
    const known = [...m[4]!.matchAll(/\d+/g)].map((x) => Number(x[0]));
    assert.equal(known.length, k);
    assert.equal(k, n - 1);
    expectAnswer(item, rat(n * M - known.reduce((s, v) => s + v, 0)), 'Số còn thiếu');
  },

  'psda-median-of-list': (item) => {
    const values = numbersAfter(item.stem, 'data set ');
    assert.equal(values.length % 2, 1, 'Dạng này dùng số lượng lẻ.');
    const sorted = [...values].sort((a, b) => a - b);
    expectAnswer(item, rat(sorted[(sorted.length - 1) / 2]!), 'Trung vị');
  },

  'psda-line-of-fit-predict': (item) => {
    const m = match(item.stem, /y = (\d+)\.(\d)x \+ (\d+)\. .* when x = (\d+)\?$/);
    const m10 = Number(m[1]) * 10 + Number(m[2]);
    const [b, x] = [Number(m[3]), Number(m[4])];
    expectAnswer(item, rat(m10 * x + 10 * b, 10), 'Giá trị dự đoán');
  },

  'psda-fit-coefficient-meaning': (item) => {
    const m = match(item.stem, /^The equation y = (\d+\.\d)x \+ (\d+) models the (.+)\. What is the best interpretation of (\S+) in this context\?$/);
    const ctx = FIT_CONTEXTS.find((c) => c.model === m[3]);
    assert.ok(ctx, `Ngữ cảnh lạ: ${m[3]}`);
    const answers = fitAnswers(ctx);
    const asked = m[4]!;
    if (asked === m[2]) assert.equal(correctDisplay(item), answers.intercept);
    else if (asked === m[1]) assert.equal(correctDisplay(item), answers.slope);
    else assert.fail(`Đề hỏi một số không có trong phương trình: ${asked}`);
  },

  'psda-probability-not-color': (item) => {
    const m = match(item.stem, /contains (\d+) red marbles, (\d+) blue marbles, and (\d+) green marbles\./);
    const [r, b, g] = m.slice(1, 4).map(Number) as [number, number, number];
    expectAnswer(item, rat(r + g, r + b + g), 'P(không xanh dương)');
  },

  'psda-expected-count': (item) => {
    const m = match(item.stem, /is defective is (0\.\d+)\. .* in a shipment of (\d+) /);
    const hundredths = Math.round(Number(m[1]) * 100);
    const N = Number(m[2]);
    expectAnswer(item, rat(N * hundredths, 100), 'Số kỳ vọng');
  },

  'psda-sample-estimate-population': (item) => {
    const m = match(item.stem, /^In a random sample of (\d+) students at a school, (\d+) students said .* There are (\d+) students at the school\./);
    const [n, k, N] = m.slice(1, 4).map(Number) as [number, number, number];
    expectAnswer(item, rat(k * N, n), 'Ước lượng tổng thể');
  },

  'psda-margin-sample-size': (item) => {
    assert.ok(/DECREASE the margin of error\?$/.test(item.stem));
    assert.equal(correctDisplay(item), MARGIN_ANSWER);
  },

  'psda-experiment-causal-scope': (item) => {
    assert.ok(item.stem.startsWith('Researchers randomly assigned'), 'Dạng này phải có phân nhóm ngẫu nhiên.');
    const ctx = STUDY_CONTEXTS.find((c) => item.stem.includes(`${c.group} who were ${c.people}`) && item.stem.includes(`assigned to ${c.assign}`));
    assert.ok(ctx, 'Không nhận ra ngữ cảnh.');
    assert.equal(correctDisplay(item), experimentAnswers(ctx).correct);
  },

  'psda-survey-association-only': (item) => {
    assert.ok(item.stem.startsWith('A survey of a random sample'), 'Dạng này là khảo sát trên mẫu ngẫu nhiên.');
    const ctx = STUDY_CONTEXTS.find((c) => item.stem.includes(` ${c.group} in a city`) && item.stem.includes(c.treatment));
    assert.ok(ctx, 'Không nhận ra ngữ cảnh.');
    assert.equal(correctDisplay(item), surveyAnswers(ctx).correct);
  },

  // ------------------------------------------------------------ geometry

  'geo-rect-area-change': (item) => {
    const m = match(item.stem, /length of (\d+) inches and a width of (\d+) inches\. If the length is increased by (\d+) inch(?:es)? and the width is decreased by (\d+) inch(?:es)?/);
    const [L, W, a, b] = m.slice(1, 5).map(Number) as [number, number, number, number];
    assert.ok(W - b > 0, 'Chiều rộng mới phải dương.');
    expectAnswer(item, rat((L + a) * (W - b)), 'Diện tích mới');
  },

  'geo-box-missing-height': (item) => {
    const m = match(item.stem, /volume of (\d+) cubic centimeters, a length of (\d+) centimeters, and a width of (\d+) centimeters\./);
    const [V, l, w] = m.slice(1, 4).map(Number) as [number, number, number];
    expectAnswer(item, rat(V, l * w), 'Chiều cao');
  },

  'geo-isosceles-angle': (item) => {
    const m = match(item.stem, /^In isosceles triangle (\w)(\w)(\w), angle \2 and angle \3 have equal measures\. If the measure of angle (\w) is (\d+)°, what is the measure, in degrees, of angle (\w)\?$/);
    const [A, B] = [m[1], m[2]];
    const given = m[4];
    const deg = Number(m[5]);
    const asked = m[6];
    if (given === A && asked === B) expectAnswer(item, rat(180 - deg, 2), 'Góc đáy');
    else if (given === B && asked === A) expectAnswer(item, rat(180 - 2 * deg), 'Góc ở đỉnh');
    else assert.fail(`Đề hỏi lẫn góc: ${item.stem}`);
    assert.ok(answerOf(item).num > 0, 'Góc phải dương.');
  },

  'geo-triangle-angle-algebra': (item) => {
    const m = match(item.stem, /are \(x \+ (\d+)\)°, \(2x - (\d+)\)°, and (\d+)°\./);
    const [a, b, c] = m.slice(1, 4).map(Number) as [number, number, number];
    const x = answerOf(item);
    assert.ok(equalsValue(rat(3 * x.num + (a - b + c) * x.den, x.den), rat(180)), `Tổng ba góc khác 180: ${item.stem}`);
    assert.ok(2 * x.num - b * x.den > 0, 'Góc thứ hai phải dương.');
  },

  'geo-pythagorean-side': (item) => {
    const legs = item.stem.match(/legs of lengths (\d+) and (\d+)\./);
    const ans = answerOf(item);
    assert.equal(ans.den, 1);
    if (legs) {
      const [a, b] = [Number(legs[1]), Number(legs[2])];
      assert.equal(ans.num * ans.num, a * a + b * b, 'Cạnh huyền sai.');
      return;
    }
    const m = match(item.stem, /hypotenuse of length (\d+) and one leg of length (\d+)\./);
    const [c, a] = [Number(m[1]), Number(m[2])];
    assert.equal(ans.num * ans.num + a * a, c * c, 'Cạnh góc vuông sai.');
  },

  'geo-trig-opposite-side': (item) => {
    const m = match(item.stem, /^In right triangle (\w)(\w)(\w), angle \3 is a right angle, \1\2 = (\d+), and sin \1 = frac\((\d+),(\d+)\)\. What is the length of \2\3\?$/);
    const [H, p, q] = [Number(m[4]), Number(m[5]), Number(m[6])];
    expectAnswer(item, rat(H * p, q), 'Cạnh đối = cạnh huyền × sin');
  },

  'geo-circle-circumference-area': (item) => {
    const s = item.stem;
    const area = s.match(/^The area of a circle is (\d+) pi square \w+\. The circumference/);
    if (area) {
      const r = Math.sqrt(Number(area[1]));
      assert.ok(Number.isInteger(r), 'Bán kính phải nguyên.');
      expectAnswer(item, rat(2 * r), 'Chu vi = 2πr');
      return;
    }
    const circ = s.match(/^The circumference of a circle is (\d+) pi \w+\./);
    const diam = s.match(/^A circle has a diameter of (\d+) \w+\./);
    const twoR = Number((circ ?? diam ?? [])[1]);
    assert.ok(twoR > 0, `Đề không đúng khuôn: ${s}`);
    expectAnswer(item, rat((twoR / 2) * (twoR / 2)), 'Diện tích = πr²');
  },

  'geo-circle-radius-from-point': (item) => {
    const m = match(item.stem, /center at \((-?\d+), (-?\d+)\) and passes through the point \((-?\d+), (-?\d+)\)\./);
    const [h, k, x, y] = m.slice(1, 5).map(Number) as [number, number, number, number];
    const r = answerOf(item);
    assert.equal(r.den, 1);
    assert.equal(r.num * r.num, (x - h) ** 2 + (y - k) ** 2, 'Bán kính không bằng khoảng cách tâm–điểm.');
  },
};
