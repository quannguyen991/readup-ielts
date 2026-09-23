import { buildChoices, buildTextChoices } from '../choices';
import { coefTerm, pick, pickInt, pickNonZeroInt, quadraticSide, signedTerm } from '../authoring';
import { rat } from '@/lib/math/value';
import type { MathTemplate } from '@/lib/math/types';

/**
 * Dạng câu thứ ba và thứ tư cho ba kỹ năng Advanced Math — domain nặng nhất
 * của đề (~35%), nên cũng là chỗ ngân hàng có nhiều câu nhất và cần nhiều dạng
 * nhất để không lặp khuôn.
 */

const par = (n: number) => (n < 0 ? `(${n})` : String(n));

/** Hằng đẳng thức hiệu hai bình phương, ở chiều PHÂN TÍCH (đề thật hay hỏi chiều này). */
const differenceOfSquares: MathTemplate = {
  slug: 'adv-difference-of-squares',
  skill: 'equivalent_expressions',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 1, 7);
    const b = pickInt(rng, 1, 9);
    const v = pick(rng, ['x', 'y', 't', 'n']);
    const A = a * a;
    const B = b * b;
    const ax = coefTerm(a, v);
    const { choices, correctIndex } = buildTextChoices(
      `(${ax} - ${b})(${ax} + ${b})`,
      [
        { display: `(${ax} - ${b})^2`, errorTag: 'expanded_without_middle_term', note: 'Bình phương một hiệu còn có số hạng ở giữa, nên nhân ra không bằng biểu thức đề cho.' },
        { display: `(${ax} + ${b})^2`, errorTag: null, note: 'Bình phương một tổng cho ra dấu cộng ở cuối, không phải dấu trừ.' },
        { display: `(${coefTerm(A, v)} - ${b})(${v} + ${b})`, errorTag: null, note: 'Nhân ra thì số hạng bậc hai đúng nhưng còn thừa số hạng bậc nhất.' },
        { display: `(${ax} - ${B})(${ax} + 1)`, errorTag: null, note: 'Hằng số phải tách thành căn bậc hai của nó ở cả hai ngoặc.' },
        // Dự phòng cho x^2 - 1: khi a = b = 1 hai nhiễu trên trùng đáp án.
        { display: `(${ax} - ${b})(${ax} - ${b})`, errorTag: null, note: 'Hai ngoặc cùng dấu trừ nhân ra số hạng tự do dương, không phải âm.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Which of the following is equivalent to ${coefTerm(A, `${v}^2`)} - ${B}?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Nhận ra hiệu của hai bình phương.', expr: `${coefTerm(A, `${v}^2`)} - ${B} = (${ax})^2 - ${b}^2` },
        { text: 'Áp dụng hằng đẳng thức: hiệu hai bình phương bằng tích của hiệu và tổng.', expr: `(${ax} - ${b})(${ax} + ${b})` },
      ],
    };
  },
};

/** Trừ hai đa thức bậc hai — bẫy kinh điển là quên đổi dấu cả ngoặc thứ hai. */
const polySubtractCoef: MathTemplate = {
  slug: 'adv-poly-subtract-coef',
  skill: 'equivalent_expressions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 9);
    const b = pickNonZeroInt(rng, -9, 9);
    const c = pickNonZeroInt(rng, -9, 9);
    const d = pickInt(rng, 1, 8);
    const eRaw = pickNonZeroInt(rng, -9, 9);
    // e ≠ b để q khác 0; e ≠ -b để nhiễu "quên đổi dấu" (b + e) không bằng 0 trùng khuôn.
    const e = eRaw === b || eRaw === -b ? (eRaw > 0 ? eRaw - 10 : eRaw + 10) : eRaw;
    const f = pickNonZeroInt(rng, -9, 9);
    const q = b - e;
    const { choices, correctIndex } = buildChoices(
      rat(q),
      [
        { value: rat(b + e), errorTag: 'sign_flip', note: 'Quên đổi dấu mọi số hạng trong ngoặc thứ hai khi bỏ ngoặc.' },
        { value: rat(a - d), errorTag: 'solved_for_wrong_var', note: 'Đây là p, hệ số của số hạng bậc hai.' },
        { value: rat(c - f), errorTag: 'solved_for_wrong_var', note: 'Đây là r, số hạng tự do.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The expression (${quadraticSide(a, b, c)}) - (${quadraticSide(d, e, f)}) is equivalent to px^2 + qx + r, where p, q, and r are constants. What is the value of q?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Bỏ ngoặc thứ hai: dấu trừ phía trước đổi dấu MỌI số hạng bên trong.', expr: `${quadraticSide(a, b, c)} ${quadraticSide(-d, -e, -f).replace(/^-/, '- ')}` },
        { text: 'q là tổng các hệ số của số hạng bậc nhất.', expr: `q = ${b} - ${par(e)} = ${q}` },
      ],
    };
  },
};

/** Phương trình chứa căn: bình phương hai vế. */
const radicalEquation: MathTemplate = {
  slug: 'adv-radical-equation',
  skill: 'nonlinear_equations',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const b = pickInt(rng, 2, 9);
    const aRaw = pickNonZeroInt(rng, -9, 9);
    // Nghiệm phải dương để điền được vào ô và để căn có nghĩa.
    const a = b * b - aRaw <= 0 ? -aRaw : aRaw;
    const x = b * b - a;
    const v = pick(rng, ['x', 'n']);
    return {
      format: 'grid_in',
      stem: `If sqrt(${v}${signedTerm(a)}) = ${b}, what is the value of ${v}?`,
      answer: rat(x),
      steps: [
        { text: 'Bình phương hai vế để bỏ dấu căn.', expr: `${v}${signedTerm(a)} = ${b * b}` },
        { text: `${a > 0 ? 'Trừ' : 'Cộng'} ${Math.abs(a)} ở hai vế.`, expr: `${v} = ${x}` },
      ],
    };
  },
};

/** Tổng các nghiệm của phương trình bậc hai (có thể giải hoặc dùng Vi-ét). */
const quadraticSumRoots: MathTemplate = {
  slug: 'adv-quadratic-sum-of-roots',
  skill: 'nonlinear_equations',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const r1 = pickNonZeroInt(rng, -9, 9);
    let r2 = pickNonZeroInt(rng, -9, 9);
    // Hai nghiệm phân biệt, và tổng khác 0 (tổng 0 thì nhiễu "đổi dấu" trùng đáp án).
    if (r2 === r1 || r2 === -r1) r2 = r1 > 0 ? r1 - 10 : r1 + 10;
    const v = pick(rng, ['x', 't']);
    const b = -(r1 + r2);
    const c = r1 * r2;
    const big = Math.max(r1, r2);
    const small = Math.min(r1, r2);
    const { choices, correctIndex } = buildChoices(
      rat(r1 + r2),
      [
        { value: rat(b), errorTag: 'sign_flip', note: 'Tổng hai nghiệm bằng ĐỐI của hệ số bậc nhất, không phải chính nó.' },
        { value: rat(c), errorTag: null, note: 'Đây là TÍCH hai nghiệm.' },
        { value: rat(big), errorTag: 'dropped_a_solution' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `What is the sum of the solutions to ${quadraticSide(1, b, c, v)} = 0?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Phân tích vế trái thành nhân tử.', expr: `(${v}${signedTerm(-small)})(${v}${signedTerm(-big)}) = 0` },
        { text: 'Mỗi nhân tử bằng 0 cho một nghiệm.', expr: `${v} = ${small}   hoặc   ${v} = ${big}` },
        { text: 'Cộng hai nghiệm lại.', expr: `${small} + ${par(big)} = ${r1 + r2}` },
      ],
    };
  },
};

/** Tính giá trị hàm bậc hai tại một điểm — hay rơi vào bẫy bình phương số âm. */
const evaluateQuadratic: MathTemplate = {
  slug: 'adv-evaluate-quadratic',
  skill: 'nonlinear_functions',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const a = pickNonZeroInt(rng, -4, 4);
    const b = pickNonZeroInt(rng, -9, 9);
    const c = pickInt(rng, -9, 9);
    const k = pickNonZeroInt(rng, -5, 5);
    const value = a * k * k + b * k + c;
    const { choices, correctIndex } = buildChoices(
      rat(value),
      [
        { value: rat(-a * k * k + b * k + c), errorTag: 'sign_flip', note: 'Bình phương một số âm ra số dương — viết số âm trong ngoặc khi thay vào.' },
        { value: rat(a * 2 * k + b * k + c), errorTag: null, note: 'Nhân với 2 thay vì bình phương.' },
        { value: rat(a * k * k - b * k + c), errorTag: 'sign_flip' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The function f is defined by f(x) = ${quadraticSide(a, b, c)}. What is the value of f(${k})?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Thay x bằng giá trị đã cho, đặt trong ngoặc.', expr: `f(${k}) = ${a}${par(k)}^2 + ${b}${par(k)} + ${par(c)}` },
        { text: 'Bình phương trước, rồi nhân, rồi cộng.', expr: `= ${a * k * k} + ${par(b * k)} + ${par(c)} = ${value}` },
      ],
    };
  },
};

/** Hàm mũ giảm: đọc tỉ lệ giảm mỗi năm từ cơ số. */
const exponentialDecayPercent: MathTemplate = {
  slug: 'adv-exponential-decay-percent',
  skill: 'nonlinear_functions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const p = pick(rng, [5, 10, 15, 20, 25, 30, 35, 40]);
    const base = ((100 - p) / 100).toFixed(2).replace(/0$/, '');
    const A = pickInt(rng, 12, 90) * 100;
    const pct = (v: { num: number; den: number }) => `${v.num / v.den}%`;
    const { choices, correctIndex } = buildChoices(
      rat(p),
      [
        { value: rat(100 - p), errorTag: 'percent_of_wrong_base', note: 'Đây là phần giá trị CÒN LẠI mỗi năm, không phải phần bị giảm.' },
        { value: rat(Math.round(p / 10) || 1), errorTag: null, note: 'Đọc nhầm chữ số thập phân: 0,2 là 20%, không phải 2%.' },
        { value: rat(100 + p), errorTag: 'sign_flip', note: 'Cơ số nhỏ hơn 1 là giảm, không phải tăng.' },
      ],
      rng,
      pct,
    );
    return {
      format: 'mcq',
      stem: `The function V(t) = ${A}(${base})^t gives the estimated value, in dollars, of a machine t years after it was purchased. By what percent does the estimated value of the machine decrease each year?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Mỗi năm giá trị được nhân với cơ số — tức là còn lại phần này của giá trị năm trước.', expr: `${base} = ${100 - p}%` },
        { text: 'Phần bị giảm là phần còn thiếu để đủ 100%.', expr: `100% - ${100 - p}% = ${p}%` },
      ],
    };
  },
};

export const MORE_ADVANCED_TEMPLATES: MathTemplate[] = [
  differenceOfSquares,
  polySubtractCoef,
  radicalEquation,
  quadraticSumRoots,
  evaluateQuadratic,
  exponentialDecayPercent,
];
