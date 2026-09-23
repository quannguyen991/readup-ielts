import { buildChoices, buildTextChoices } from '../choices';
import { coefTerm, fracOrInt, linearSide, pick, pickInt, pickNonZeroInt, signedTerm, twoVarSide } from '../authoring';
import { rat } from '@/lib/math/value';
import type { MathTemplate } from '@/lib/math/types';

/**
 * Dạng câu THỨ BA và THỨ TƯ cho năm kỹ năng Algebra.
 *
 * Mỗi kỹ năng trước đây chỉ có hai dạng, nên một kỹ năng 70 câu là 70 biến thể
 * số của đúng hai khuôn — làm tới lượt thứ ba là nhận ra khuôn và giải theo
 * phản xạ. Hai dạng thêm vào đây hỏi cùng kỹ năng từ một hướng khác: phương
 * trình có phân số, phương trình vô số nghiệm, hệ vô nghiệm, bất phương trình
 * hệ số âm…
 *
 * Cùng nguyên tắc với các file domain: CHỌN ĐÁP ÁN TRƯỚC rồi mới dựng đề từ nó,
 * để nghiệm luôn là số đẹp như đề thật; mỗi nhiễu là kết quả của MỘT sai lầm
 * có tên.
 */

/** Số âm trong phép tính ở lời giải thì bọc ngoặc: "3 + (-2)", không phải "3 + -2". */
const par = (n: number) => (n < 0 ? `(${n})` : String(n));

/** `x/a + b = c` — dạng có phân số, nhân hai vế với mẫu. */
const oneVarFraction: MathTemplate = {
  slug: 'alg-linear-one-var-fraction',
  skill: 'linear_equations_one_var',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const a = pickInt(rng, 2, 9);
    const k = pickInt(rng, 1, 12);
    const x = a * k;
    const b = pickNonZeroInt(rng, -9, 9);
    const c = k + b;
    return {
      format: 'grid_in',
      stem: `If frac(x,${a})${signedTerm(b)} = ${c}, what is the value of x?`,
      answer: rat(x),
      steps: [
        { text: `${b > 0 ? 'Trừ' : 'Cộng'} ${Math.abs(b)} ở hai vế để phân số đứng một mình.`, expr: `frac(x,${a}) = ${k}` },
        { text: `Nhân hai vế với ${a}.`, expr: `x = ${x}` },
      ],
    };
  },
};

/**
 * `p(qx - r) = sx - k` có VÔ SỐ NGHIỆM — hỏi hằng số k.
 *
 * Dạng này kiểm hiểu biết chứ không kiểm tính toán: vô số nghiệm nghĩa là hai
 * vế là CÙNG MỘT biểu thức. s = pq được dựng sẵn để hệ số x đã khớp.
 */
const oneVarInfinite: MathTemplate = {
  slug: 'alg-linear-one-var-infinite',
  skill: 'linear_equations_one_var',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const p = pickInt(rng, 2, 6);
    const q = pickInt(rng, 2, 6);
    const r = pickInt(rng, 2, 9);
    const s = p * q;
    const k = p * r;
    const { choices, correctIndex } = buildChoices(
      rat(k),
      [
        { value: rat(r), errorTag: 'forgot_distribute', note: `Lấy luôn số trong ngoặc, quên nhân với ${p}.` },
        { value: rat(-k), errorTag: 'sign_flip' },
        { value: rat(q * r), errorTag: null, note: 'Nhân nhầm hệ số của x với số trong ngoặc — hệ số ngoài ngoặc mới là thứ nhân vào.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `In the equation ${p}(${q}x - ${r}) = ${s}x - k, k is a constant. If the equation has infinitely many solutions, what is the value of k?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Nhân phân phối vế trái.', expr: `${s}x - ${k} = ${s}x - k` },
        { text: 'Vô số nghiệm khi hai vế giống hệt nhau. Hệ số của x đã bằng nhau, nên hằng số cũng phải bằng nhau.', expr: `k = ${k}` },
      ],
    };
  },
};

/** Độ dốc của đường thẳng cho ở dạng chuẩn `ax + by = c`. */
const twoVarSlopeStandard: MathTemplate = {
  slug: 'alg-two-var-slope-standard',
  skill: 'linear_equations_two_var',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const aAbs = pickInt(rng, 2, 9);
    const bRaw = pickInt(rng, 2, 9);
    const b = bRaw === aAbs ? (aAbs === 9 ? 2 : aAbs + 1) : bRaw;
    const a = pick(rng, [1, -1]) * aAbs;
    const c = pickNonZeroInt(rng, -30, 30);
    const { choices, correctIndex } = buildChoices(
      rat(-a, b),
      [
        { value: rat(a, b), errorTag: 'sign_flip', note: 'Chuyển số hạng chứa x sang vế phải thì phải đổi dấu.' },
        { value: rat(-b, a), errorTag: 'inverted_fraction' },
        { value: rat(c, b), errorTag: 'swapped_slope_intercept', note: 'Đây là tung độ gốc, không phải độ dốc.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `What is the slope of the line with equation ${twoVarSide(a, b)} = ${c} in the xy-plane?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Đưa về dạng y = mx + b: chuyển số hạng chứa x sang vế phải và đổi dấu.', expr: `${coefTerm(b, 'y')} = ${linearSide(-a, c)}` },
        { text: `Chia hai vế cho ${b}. Hệ số của x lúc này là độ dốc.`, expr: `m = ${fracOrInt(-a, b)}` },
      ],
    };
  },
};

/** Điểm `(p, t)` nằm trên đường thẳng — thế vào tìm t. */
const twoVarPointOnLine: MathTemplate = {
  slug: 'alg-two-var-point-on-line',
  skill: 'linear_equations_two_var',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const a = pickInt(rng, 2, 9);
    const b = pickInt(rng, 2, 9);
    const p = pickInt(rng, 1, 9);
    const t = pickInt(rng, 1, 12);
    const c = a * p + b * t;
    return {
      format: 'grid_in',
      stem: `The point (${p}, t) lies on the line with equation ${twoVarSide(a, b)} = ${c} in the xy-plane. What is the value of t?`,
      answer: rat(t),
      steps: [
        { text: `Điểm nằm trên đường thẳng thì tọa độ của nó thỏa phương trình. Thay x = ${p}.`, expr: `${a * p} + ${b}t = ${c}` },
        { text: `Trừ ${a * p} ở hai vế.`, expr: `${b}t = ${b * t}` },
        { text: `Chia hai vế cho ${b}.`, expr: `t = ${t}` },
      ],
    };
  },
};

/** Hàm bậc nhất cho bằng HAI giá trị, hỏi giá trị thứ ba. */
const linearFnTwoPoints: MathTemplate = {
  slug: 'alg-linear-fn-two-points',
  skill: 'linear_functions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const m = pickNonZeroInt(rng, -6, 6);
    const b0 = pickInt(rng, -10, 10);
    const x1 = pickInt(rng, 0, 3);
    const x2 = x1 + pickInt(rng, 1, 4);
    const x3 = x2 + pickInt(rng, 1, 5);
    const f = (x: number) => m * x + b0;
    const [y1, y2, y3] = [f(x1), f(x2), f(x3)];
    const { choices, correctIndex } = buildChoices(
      rat(y3),
      [
        { value: rat(m), errorTag: 'stopped_too_early', note: 'Đây mới là độ dốc — còn phải dùng nó để đi tới giá trị cần tìm.' },
        { value: rat(y2 + m), errorTag: 'off_by_one', note: `Chỉ cộng thêm một lần độ dốc, trong khi từ x = ${x2} tới x = ${x3} là ${x3 - x2} bước.` },
        { value: rat(y2 - m * (x3 - x2)), errorTag: 'sign_flip' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The linear function f satisfies f(${x1}) = ${y1} and f(${x2}) = ${y2}. What is the value of f(${x3})?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Độ dốc bằng chênh lệch giá trị hàm chia cho chênh lệch x.', expr: `m = frac(${y2} - ${par(y1)},${x2} - ${x1}) = ${m}` },
        { text: `Từ x = ${x2} tới x = ${x3}, cộng thêm ${x3 - x2} lần độ dốc.`, expr: `f(${x3}) = ${y2} + ${x3 - x2} × ${par(m)} = ${y3}` },
      ],
    };
  },
};

const RENTALS = ['a kayak', 'a bicycle', 'a canoe', 'a scooter', 'a paddleboard'] as const;

/** Ý nghĩa của độ dốc trong ngữ cảnh: chi phí TĂNG thêm bao nhiêu. */
const linearFnRateChange: MathTemplate = {
  slug: 'alg-linear-fn-rate-change',
  skill: 'linear_functions',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 6, 45);
    const b = pickInt(rng, 10, 80);
    const h1 = pickInt(rng, 1, 4);
    const h2 = h1 + pickInt(rng, 2, 6);
    const item = pick(rng, RENTALS);
    const increase = a * (h2 - h1);
    const { choices, correctIndex } = buildChoices(
      rat(increase),
      [
        { value: rat(a * h2 + b), errorTag: 'stopped_too_early', note: `Đây là TỔNG chi phí khi thuê ${h2} giờ, không phải phần tăng thêm.` },
        { value: rat(a), errorTag: null, note: 'Đây chỉ là phần tăng cho MỘT giờ.' },
        { value: rat(increase + b), errorTag: null, note: 'Phí cố định chỉ trả một lần, nó không tăng theo số giờ.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The function C(h) = ${a}h + ${b} gives the total cost, in dollars, of renting ${item} for h hours. By how many dollars does the total cost increase when the rental time increases from ${h1} hours to ${h2} hours?`,
      choices,
      correctIndex,
      steps: [
        { text: `Độ dốc ${a} là số tiền tăng thêm cho mỗi giờ; phí cố định ${b} không đổi.`, expr: `${h2} - ${h1} = ${h2 - h1}` },
        { text: 'Nhân số giờ tăng thêm với giá mỗi giờ.', expr: `${h2 - h1} × ${a} = ${increase}` },
      ],
    };
  },
};

/** Hệ giải bằng phương pháp thế: một phương trình đã cho sẵn `y = ...`. */
const systemSubstitution: MathTemplate = {
  slug: 'alg-system-substitution-y',
  skill: 'systems_linear_two_var',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const x0 = pickInt(rng, 1, 9);
    const y0 = pickInt(rng, 1, 15);
    const m = pickNonZeroInt(rng, -4, 4);
    const k = y0 - m * x0;
    const aRaw = pickInt(rng, 2, 7);
    // a + m = 0 thì hai đường song song, hệ không có nghiệm duy nhất.
    const a = aRaw + m === 0 ? aRaw + 1 : aRaw;
    const c = a * x0 + y0;
    return {
      format: 'grid_in',
      stem: `In the system of equations y = ${linearSide(m, k)} and ${coefTerm(a)} + y = ${c}, (x, y) is the solution. What is the value of y?`,
      answer: rat(y0),
      steps: [
        { text: 'Thay y từ phương trình đầu vào phương trình sau.', expr: `${coefTerm(a)} + (${linearSide(m, k)}) = ${c}` },
        { text: 'Gom các số hạng chứa x rồi giải.', expr: `x = ${x0}` },
        { text: 'Thay x vào phương trình đầu để ra y.', expr: `y = ${y0}` },
      ],
    };
  },
};

/** Hệ VÔ NGHIỆM — hỏi hằng số làm hai đường song song. */
const systemNoSolution: MathTemplate = {
  slug: 'alg-system-no-solution-k',
  skill: 'systems_linear_two_var',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 6);
    const b = pickInt(rng, 2, 6);
    const t = pickInt(rng, 2, 5);
    const c = pickInt(rng, 1, 12);
    const d = t * b;
    const k = t * a;
    const e = t * c + pickNonZeroInt(rng, -5, 5);
    const { choices, correctIndex } = buildChoices(
      rat(k),
      [
        { value: rat(a), errorTag: null, note: `Chép lại hệ số của phương trình đầu. Hai phương trình phải cùng tỉ lệ ${t}, vì hệ số của y đã gấp ${t} lần.` },
        { value: rat(d), errorTag: 'solved_for_wrong_var', note: 'Đây là hệ số của y trong phương trình sau.' },
        { value: rat(-k), errorTag: 'sign_flip' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `In the system of equations ${a}x + ${b}y = ${c} and kx + ${d}y = ${e}, k is a constant. For what value of k does the system have no solution?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Hệ vô nghiệm khi hai đường thẳng song song: hệ số của x và y tỉ lệ với nhau, còn vế phải thì không.', expr: `frac(k,${a}) = frac(${d},${b})` },
        { text: 'Giải ra k.', expr: `k = ${k}` },
      ],
    };
  },
};

/** Bất phương trình hệ số âm — chia cho số âm phải đổi chiều. */
const inequalityNegativeCoef: MathTemplate = {
  slug: 'alg-inequality-negative-coef',
  skill: 'linear_inequalities',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 7);
    const k = pickNonZeroInt(rng, -8, 8);
    const c = pickInt(rng, -10, 10);
    const b = c + a * k;
    const op = pick(rng, ['>', '>='] as const);
    const flip = op === '>' ? '<' : '<=';
    const { choices, correctIndex } = buildTextChoices(
      `x ${flip} ${k}`,
      [
        { display: `x ${op} ${k}`, errorTag: 'forgot_flip_inequality' },
        { display: `x ${flip} ${-k}`, errorTag: 'sign_flip' },
        { display: `x ${op} ${-k}`, errorTag: null, note: 'Vừa quên đổi chiều bất đẳng thức, vừa sai dấu của số.' },
      ],
      rng,
    );
    const steps = [];
    if (b !== 0) steps.push({ text: `${b > 0 ? 'Trừ' : 'Cộng'} ${Math.abs(b)} ở hai vế.`, expr: `${coefTerm(-a)} ${op} ${c - b}` });
    steps.push({ text: `Chia hai vế cho ${-a}. Chia cho số âm thì phải đổi chiều bất đẳng thức.`, expr: `x ${flip} ${k}` });
    return {
      format: 'mcq',
      stem: `Which of the following is the solution set of ${linearSide(-a, b)} ${op} ${c}?`,
      choices,
      correctIndex,
      steps,
    };
  },
};

/** "Cần ít nhất bao nhiêu điểm" — bất phương trình từ điều kiện trung bình. */
const inequalityMinScore: MathTemplate = {
  slug: 'alg-inequality-min-score',
  skill: 'linear_inequalities',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const n = pickInt(rng, 4, 6);
    const target = pickInt(rng, 78, 90);
    let scores: number[] = [];
    let last = -1;
    // Bốc lại tới khi điểm bài cuối nằm trong khoảng hợp lý (55–100). Giới hạn
    // số lần để luôn dừng; hết lượt thì lấy bộ điểm đều bằng mục tiêu.
    for (let tries = 0; tries < 60 && !(last >= 55 && last <= 100); tries += 1) {
      scores = Array.from({ length: n - 1 }, () => pickInt(rng, 68, 98));
      last = target * n - scores.reduce((s, v) => s + v, 0);
    }
    if (!(last >= 55 && last <= 100)) {
      scores = Array.from({ length: n - 1 }, () => target);
      last = target;
    }
    const sum = scores.reduce((s, v) => s + v, 0);
    const list = `${scores.slice(0, -1).join(', ')}, and ${scores[scores.length - 1]}`;
    return {
      format: 'grid_in',
      stem: `A student's scores on the first ${n - 1} tests of a course were ${list}. What is the minimum score the student needs on test ${n} for the mean of all ${n} test scores to be at least ${target}?`,
      answer: rat(last),
      steps: [
        { text: `Trung bình ít nhất ${target} trên ${n} bài nghĩa là tổng điểm ít nhất bằng ${target} nhân ${n}.`, expr: `${target} × ${n} = ${target * n}` },
        { text: 'Trừ đi tổng điểm các bài đã có.', expr: `${target * n} - ${sum} = ${last}` },
      ],
    };
  },
};

export const MORE_ALGEBRA_TEMPLATES: MathTemplate[] = [
  oneVarFraction,
  oneVarInfinite,
  twoVarSlopeStandard,
  twoVarPointOnLine,
  linearFnTwoPoints,
  linearFnRateChange,
  systemSubstitution,
  systemNoSolution,
  inequalityNegativeCoef,
  inequalityMinScore,
];
