import { buildChoices, buildTextChoices } from '../choices';
import { coefTerm, pick, pickInt, pickNonZeroInt, quadraticSide, signedTerm } from '../authoring';
import { rat } from '@/lib/math/value';
import type { MathTemplate } from '@/lib/math/types';

/**
 * Đợt hai của Advanced Math: thêm ba dạng mỗi kỹ năng (4 → 7).
 *
 * Ba kỹ năng này có kho lớn nhất trong ngân hàng (120 câu mỗi kỹ năng, theo tỉ
 * trọng ~35% của đề). Với bốn dạng, mỗi dạng vẫn quay lại khoảng 30 lần chỉ
 * khác số liệu; bảy dạng kéo con số đó xuống còn khoảng 17.
 */

const par = (n: number) => (n < 0 ? `(${n})` : String(n));

/** Quy tắc số mũ: nhân thì cộng mũ, chia thì trừ mũ. */
const exponentRules: MathTemplate = {
  slug: 'adv-exponent-rules',
  skill: 'equivalent_expressions',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 9);
    const b = pickInt(rng, 2, 9);
    const c = pickInt(rng, 1, a + b - 2);
    const v = pick(rng, ['x', 'y', 'n']);
    const e = a + b - c;
    const pow = (n: number) => (n === 1 ? v : `${v}^${n}`);
    const { choices, correctIndex } = buildTextChoices(
      pow(e),
      [
        { display: pow(a * b - c), errorTag: null, note: 'Nhân hai lũy thừa cùng cơ số thì CỘNG số mũ, không nhân.' },
        { display: pow(a + b + c), errorTag: 'sign_flip', note: 'Chia hai lũy thừa cùng cơ số thì TRỪ số mũ.' },
        { display: pow(a * b + c), errorTag: null, note: 'Vừa nhân số mũ vừa cộng khi chia — cả hai quy tắc đều bị đảo.' },
        { display: pow(e + 1), errorTag: null, note: 'Lệch một ở bước cộng trừ số mũ.' },
        // Dự phòng: với a = b = 2, "nhân số mũ" và "cộng số mũ" ra cùng một số.
        { display: pow(a * b), errorTag: null, note: 'Nhân số mũ rồi quên chia cho mẫu số.' },
        { display: pow(e + 2), errorTag: null, note: 'Lệch ở bước cộng trừ số mũ.' },
        { display: pow(a + b), errorTag: 'stopped_too_early', note: 'Mới làm phép nhân, còn phải chia cho mẫu số.' },
        { display: pow(Math.max(2, e - 1)), errorTag: null, note: 'Lệch một ở bước trừ số mũ.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Which of the following is equivalent to frac(${v}^${a} × ${v}^${b},${pow(c)}), where ${v} > 0?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Nhân hai lũy thừa cùng cơ số: cộng số mũ.', expr: `${v}^${a} × ${v}^${b} = ${v}^${a + b}` },
        { text: 'Chia cho lũy thừa cùng cơ số: trừ số mũ.', expr: `frac(${v}^${a + b},${pow(c)}) = ${pow(e)}` },
      ],
    };
  },
};

/** Phân tích tam thức bậc hai thành tích hai nhị thức. */
const factorTrinomial: MathTemplate = {
  slug: 'adv-factor-trinomial',
  skill: 'equivalent_expressions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const p = pickNonZeroInt(rng, -9, 9);
    let q = pickNonZeroInt(rng, -9, 9);
    if (q === p || q === -p) q = p > 0 ? p - 10 : p + 10;
    const b = p + q;
    const c = p * q;
    const f = (u: number, w: number) => `(x${signedTerm(u)})(x${signedTerm(w)})`;
    const { choices, correctIndex } = buildTextChoices(
      f(p, q),
      [
        { display: f(-p, -q), errorTag: 'sign_flip', note: 'Nhân ra thì hệ số của x bị đổi dấu.' },
        { display: f(p, -q), errorTag: null, note: 'Nhân ra thì tích hai số hạng tự do sai dấu.' },
        { display: f(c, 1), errorTag: null, note: 'Hai số cần tìm phải có TÍCH bằng hằng số và TỔNG bằng hệ số của x.' },
        // Dự phòng khi một nghiệm là 1 (nhiễu trên trùng đáp án).
        { display: f(-p, q), errorTag: 'sign_flip', note: 'Sai dấu ở một nhân tử: tổng và tích đều lệch.' },
        { display: f(p + 1, q - 1), errorTag: null, note: 'Tổng hai số đúng nhưng tích thì không bằng hằng số.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Which of the following is equivalent to ${quadraticSide(1, b, c)}?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Tìm hai số có tích bằng hằng số và tổng bằng hệ số của x.', expr: `${p} × ${par(q)} = ${c},   ${p} + ${par(q)} = ${b}` },
        { text: 'Viết thành tích hai nhị thức.', expr: f(p, q) },
      ],
    };
  },
};

/** Rút gọn phân thức: phân tích tử rồi giản ước nhân tử chung với mẫu. */
const rationalSimplify: MathTemplate = {
  slug: 'adv-rational-simplify',
  skill: 'equivalent_expressions',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const p = pickNonZeroInt(rng, -9, 9);
    let q = pickInt(rng, 1, 9);
    if (q === p) q = q === 9 ? 1 : q + 1;
    return {
      format: 'grid_in',
      stem: `The expression frac(${quadraticSide(1, p + q, p * q)},x${signedTerm(p)}) is equivalent to x + k for all x != ${-p}, where k is a constant. What is the value of k?`,
      answer: rat(q),
      steps: [
        { text: 'Phân tích tử số thành nhân tử; một nhân tử trùng với mẫu số.', expr: `(x${signedTerm(p)})(x${signedTerm(q)})` },
        { text: 'Giản ước nhân tử chung.', expr: `x${signedTerm(q)}` },
      ],
    };
  },
};

/** Số nghiệm thực, đọc từ biệt thức. */
const discriminantCount: MathTemplate = {
  slug: 'adv-discriminant-count',
  skill: 'nonlinear_equations',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 1, 4);
    const kind = pick(rng, [0, 1, 2] as const);
    let b: number;
    let c: number;
    if (kind === 1) {
      // a(x - h)^2 — nghiệm kép.
      const h = pickNonZeroInt(rng, -6, 6);
      b = -2 * a * h;
      c = a * h * h;
    } else if (kind === 2) {
      const r1 = pickNonZeroInt(rng, -6, 6);
      let r2 = pickNonZeroInt(rng, -6, 6);
      if (r2 === r1) r2 = r1 > 0 ? r1 - 7 : r1 + 7;
      b = -a * (r1 + r2);
      c = a * r1 * r2;
    } else {
      // a(x - h)^2 + m với m > 0 — không có nghiệm thực.
      const h = pickInt(rng, -6, 6);
      const m = pickInt(rng, 1, 9);
      b = -2 * a * h;
      c = a * h * h + m;
    }
    const disc = b * b - 4 * a * c;
    const label = (n: number) => (n === 0 ? 'Zero' : n === 1 ? 'Exactly one' : 'Exactly two');
    const why =
      disc > 0 ? 'Biệt thức dương nên có hai nghiệm phân biệt.' : disc === 0 ? 'Biệt thức bằng 0 nên có đúng một nghiệm.' : 'Biệt thức âm nên không có nghiệm thực.';
    const { choices, correctIndex } = buildTextChoices(
      label(kind),
      [
        ...[0, 1, 2].filter((n) => n !== kind).map((n) => ({ display: label(n), errorTag: null, note: why })),
        { display: 'Infinitely many', errorTag: null, note: 'Phương trình bậc hai có nhiều nhất hai nghiệm.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `How many distinct real solutions does the equation ${quadraticSide(a, b, c)} = 0 have?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Tính biệt thức: b bình phương trừ 4ac.', expr: `${par(b)}^2 - 4(${a})(${c}) = ${disc}` },
        { text: why, expr: `Δ = ${disc}` },
      ],
    };
  },
};

/** Phương trình mũ: đưa hai vế về cùng cơ số. */
const exponentialEquation: MathTemplate = {
  slug: 'adv-exponential-equation',
  skill: 'nonlinear_equations',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const base = pick(rng, [2, 3, 5]);
    const maxN = base === 2 ? 12 : base === 3 ? 8 : 6;
    const n = pickInt(rng, 3, maxN);
    const a = pickInt(rng, 1, n - 1);
    const x = n - a;
    const v = pick(rng, ['x', 'n']);
    return {
      format: 'grid_in',
      stem: `If ${base}^(${v} + ${a}) = ${base ** n}, what is the value of ${v}?`,
      answer: rat(x),
      steps: [
        { text: `Viết vế phải thành lũy thừa của ${base}.`, expr: `${base ** n} = ${base}^${n}` },
        { text: 'Hai lũy thừa cùng cơ số bằng nhau thì số mũ bằng nhau.', expr: `${v} + ${a} = ${n}   ⇒   ${v} = ${x}` },
      ],
    };
  },
};

/** Phương trình trị tuyệt đối: tổng hai nghiệm. */
const absoluteValueSum: MathTemplate = {
  slug: 'adv-absolute-value-sum',
  skill: 'nonlinear_equations',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const a = pickNonZeroInt(rng, -9, 9);
    let b = pickInt(rng, 1, 12);
    if (b === Math.abs(a)) b += 1;
    const { choices, correctIndex } = buildChoices(
      rat(2 * a),
      [
        { value: rat(a + b), errorTag: 'dropped_a_solution', note: 'Chỉ lấy một nghiệm. Trị tuyệt đối bằng b cho HAI trường hợp: b và âm b.' },
        { value: rat(2 * b), errorTag: null, note: 'Đây là khoảng cách giữa hai nghiệm, không phải tổng.' },
        { value: rat(-2 * a), errorTag: 'sign_flip' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `What is the sum of the solutions to |x${signedTerm(-a)}| = ${b}?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Trị tuyệt đối bằng b nghĩa là biểu thức bên trong bằng b hoặc bằng âm b.', expr: `x${signedTerm(-a)} = ${b}   hoặc   x${signedTerm(-a)} = ${-b}` },
        { text: 'Giải hai trường hợp rồi cộng lại.', expr: `${a + b} + ${par(a - b)} = ${2 * a}` },
      ],
    };
  },
};

/** Dạng đỉnh của parabol: giá trị nhỏ nhất hoặc lớn nhất. */
const vertexFormExtreme: MathTemplate = {
  slug: 'adv-vertex-form-extreme',
  skill: 'nonlinear_functions',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const a = pickNonZeroInt(rng, -5, 5);
    const h = pickNonZeroInt(rng, -9, 9);
    let k = pickNonZeroInt(rng, -12, 12);
    if (k === h || k === -h) k = k > 0 ? k + 13 : k - 13;
    const word = a > 0 ? 'minimum' : 'maximum';
    const vi = a > 0 ? 'nhỏ nhất' : 'lớn nhất';
    const { choices, correctIndex } = buildChoices(
      rat(k),
      [
        { value: rat(h), errorTag: 'solved_for_wrong_var', note: `Đây là hoành độ đỉnh — giá trị x tại đó hàm đạt ${vi} — không phải giá trị của hàm.` },
        { value: rat(-k), errorTag: 'sign_flip' },
        { value: rat(-h), errorTag: 'sign_flip', note: 'Vừa lấy nhầm hoành độ đỉnh, vừa đọc sai dấu trong ngoặc.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The function f is defined by f(x) = ${coefTerm(a, '')}(x${signedTerm(-h)})^2${signedTerm(k)}. What is the ${word} value of f(x)?`,
      choices,
      correctIndex,
      steps: [
        {
          text: `Ở dạng đỉnh, đỉnh parabol là (h, k). Hệ số trước ngoặc ${a > 0 ? 'dương nên parabol mở lên, đỉnh là điểm thấp nhất' : 'âm nên parabol mở xuống, đỉnh là điểm cao nhất'}.`,
          expr: `(h, k) = (${h}, ${k})`,
        },
        { text: `Giá trị ${vi} của hàm là tung độ của đỉnh.`, expr: `f(${h}) = ${k}` },
      ],
    };
  },
};

const GROWTH = [
  { what: 'bacteria in a sample', noun: 'bacteria', unit: 'hours' },
  { what: 'users of a new app', noun: 'users', unit: 'weeks' },
  { what: 'fish in a pond', noun: 'fish', unit: 'months' },
] as const;

/** Tăng trưởng nhân đôi theo chu kỳ. */
const doublingGrowth: MathTemplate = {
  slug: 'adv-doubling-growth',
  skill: 'nonlinear_functions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const P = pickInt(rng, 3, 60) * 10;
    const d = pickInt(rng, 2, 8);
    const n = pickInt(rng, 2, 5);
    const t = d * n;
    const ctx = pick(rng, GROWTH);
    const answer = P * 2 ** n;
    const { choices, correctIndex } = buildChoices(
      rat(answer),
      [
        { value: rat(P * (1 + n)), errorTag: 'percent_added_instead_of_multiplied', note: 'Nhân đôi là NHÂN thêm 2 mỗi chu kỳ, không phải cộng thêm một lượng bằng ban đầu.' },
        { value: rat(P * 2 * n), errorTag: null, note: 'Nhân với 2n thay vì 2 mũ n.' },
        { value: rat(P * 2 ** (n - 1)), errorTag: 'off_by_one', note: 'Đếm thiếu một chu kỳ nhân đôi.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The number of ${ctx.what} doubles every ${d} ${ctx.unit}. There are currently ${P} ${ctx.noun}. If this pattern continues, how many ${ctx.noun} will there be ${t} ${ctx.unit} from now?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Đếm số lần nhân đôi trong khoảng thời gian đó.', expr: `${t} ÷ ${d} = ${n}` },
        { text: `Nhân với 2 đúng ${n} lần.`, expr: `${P} × 2^${n} = ${answer}` },
      ],
    };
  },
};

/** Hàm hợp f(g(k)): tính hàm bên trong trước. */
const functionComposition: MathTemplate = {
  slug: 'adv-function-composition',
  skill: 'nonlinear_functions',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const c = pickInt(rng, 1, 9);
    const d = pickNonZeroInt(rng, -6, 6);
    let k = pickInt(rng, 1, 8);
    // Kết quả phải dương để điền được vào ô.
    if ((k + d) * (k + d) - c <= 0) k = Math.abs(d) + 4;
    const inner = k + d;
    const answer = inner * inner - c;
    return {
      format: 'grid_in',
      stem: `The functions f and g are defined by f(x) = x^2 - ${c} and g(x) = x${signedTerm(d)}. What is the value of f(g(${k}))?`,
      answer: rat(answer),
      steps: [
        { text: 'Tính hàm bên trong trước.', expr: `g(${k}) = ${k}${signedTerm(d)} = ${inner}` },
        { text: 'Đưa kết quả đó vào hàm bên ngoài.', expr: `f(${inner}) = ${par(inner)}^2 - ${c} = ${answer}` },
      ],
    };
  },
};

export const MORE_ADVANCED_TEMPLATES_2: MathTemplate[] = [
  exponentRules,
  factorTrinomial,
  rationalSimplify,
  discriminantCount,
  exponentialEquation,
  absoluteValueSum,
  vertexFormExtreme,
  doublingGrowth,
  functionComposition,
];
