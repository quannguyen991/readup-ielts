import { buildChoices, buildTextChoices } from '../choices';
import {
  coefTerm,
  fracOrInt,
  linearSide,
  pick,
  pickInt,
  pickNonZeroInt,
  quadraticSide,
  signedCoefTerm,
  signedTerm,
} from '../authoring';
import { formatValueMath, rat } from '@/lib/math/value';
import type { MathErrorTag, MathTemplate, MathValue } from '@/lib/math/types';

/**
 * Đợt "panda-b": 20 dạng câu phủ các chương Hàm số, Chia đa thức, Số phức,
 * Giá trị tuyệt đối, Góc, Tam giác, Đường tròn, Lượng giác, Đọc bảng, Xác suất,
 * Thống kê và Thể tích.
 *
 * Cùng nguyên tắc với các file `more-*.ts`: CHỌN ĐÁP ÁN TRƯỚC rồi dựng tham số
 * ngược từ đáp án, nên số trong đề luôn sạch mà không cần vòng thử lại. Mỗi
 * nhiễu dựng từ đúng một sai lầm có tên; nhiễu nào không quy được về một nhãn
 * chung thì để `errorTag: null` và nói rõ cái sai trong `note`.
 *
 * Số phức không có kiểu `MathValue`, nên câu số phức dùng lựa chọn bằng CHỮ
 * (`buildTextChoices`), viết theo đúng quy ước "a + bi" của đề thật.
 */

// ------------------------------------------------------------ tiện ích chung

/**
 * Viết đa thức từ dãy hệ số (bậc cao nhất trước), bỏ số hạng 0 và hệ số 1.
 * `quadraticSide` chỉ lo được bậc hai; chương chia đa thức cần tới bậc ba.
 */
function polyText(coefs: readonly number[], v = 'x'): string {
  const deg = coefs.length - 1;
  let out = '';
  coefs.forEach((c, i) => {
    if (c === 0) return;
    const p = deg - i;
    const varPart = p === 0 ? '' : p === 1 ? v : `${v}^${p}`;
    const abs = Math.abs(c);
    const body = p === 0 ? String(abs) : abs === 1 ? varPart : `${abs}${varPart}`;
    if (out === '') out = (c < 0 ? '-' : '') + body;
    else out += c < 0 ? ` - ${body}` : ` + ${body}`;
  });
  return out === '' ? '0' : out;
}

function evalPoly(coefs: readonly number[], x: number): number {
  return coefs.reduce((acc, c) => acc * x + c, 0);
}

/** Số âm trong phép tính ở lời giải phải có ngoặc: 3 × (-2), không phải 3 × -2. */
const par = (n: number) => (n < 0 ? `(${n})` : String(n));

/** Viết số phức dạng `a + bi` với phần thực và phần ảo hữu tỉ, bỏ phần bằng 0. */
function cx(re: MathValue, im: MathValue): string {
  const absText = (v: MathValue) => formatValueMath(rat(Math.abs(v.num), v.den));
  const imBody = im.num === 0 ? '' : Math.abs(im.num) === 1 && im.den === 1 ? 'i' : `${absText(im)}i`;
  if (re.num === 0 && im.num === 0) return '0';
  if (im.num === 0) return formatValueMath(re);
  if (re.num === 0) return `${im.num < 0 ? '-' : ''}${imBody}`;
  return `${formatValueMath(re)} ${im.num < 0 ? '-' : '+'} ${imBody}`;
}

const cxi = (re: number, im: number) => cx(rat(re), rat(im));

const I_NOTE = 'where i = sqrt(-1)';

// ================================================================ Chương 14

/**
 * Hai cửa của "hàm số khó": tìm chỗ hàm KHÔNG xác định (mẫu bằng 0), hoặc giải
 * f(g(t)) = K. Chữ "undefined" cố ý không dùng trong đề — bộ test chung coi nó
 * là dấu hiệu chuỗi rác lọt ra màn hình.
 */
const functionUndefinedOrInverse: MathTemplate = {
  slug: 'pd-function-undefined-or-inverse',
  skill: 'nonlinear_functions',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    if (rng() < 0.5) {
      // Chọn hai nghiệm của mẫu trước, dựng mẫu từ tổng và tích.
      const r1 = pickInt(rng, -8, 8);
      const r2 = r1 + pickInt(rng, 1, 9);
      const S = r1 + r2;
      const P = r1 * r2;
      const a = pickInt(rng, 1, 5);
      const c = pickNonZeroInt(rng, -9, 9);
      const greatest = rng() < 0.5;
      const answer = greatest ? r2 : r1;
      const den = quadraticSide(1, -S, P);
      return {
        format: 'grid_in',
        stem: `The function f is defined by f(x) = frac(${linearSide(a, c)},${den}). What is the ${greatest ? 'greatest' : 'least'} value of x for which f(x) is not defined?`,
        answer: rat(answer),
        steps: [
          { text: 'Phân thức không xác định khi MẪU bằng 0 — tử số không liên quan.', expr: `${den} = 0` },
          { text: `Phân tích mẫu: tìm hai số có tổng ${S} và tích ${P}.`, expr: `(${linearSide(1, -r1)})(${linearSide(1, -r2)}) = 0` },
          { text: `Hai giá trị là ${r1} và ${r2}; đề hỏi giá trị ${greatest ? 'lớn' : 'nhỏ'} hơn.`, expr: `x = ${answer}` },
        ],
      };
    }
    const m = pickInt(rng, 2, 6);
    const n = pickNonZeroInt(rng, -9, 9);
    const q = pickNonZeroInt(rng, -9, 9);
    const t = pickInt(rng, 1, 9);
    const inner = t * t + q;
    const K = m * inner + n;
    return {
      format: 'grid_in',
      stem: `The functions f and g are defined by f(x) = ${linearSide(m, n)} and g(x) = x^2${signedTerm(q)}. If f(g(t)) = ${K} and t > 0, what is the value of t?`,
      answer: rat(t),
      steps: [
        { text: 'Thay g(t) vào vị trí x của f.', expr: `f(g(t)) = ${m}(t^2${signedTerm(q)})${signedTerm(n)} = ${K}` },
        { text: `Chuyển ${n} sang vế phải rồi chia cho ${m}.`, expr: `t^2${signedTerm(q)} = ${inner}` },
        { text: 'Tìm t bình phương rồi lấy căn, giữ nghiệm dương.', expr: `t^2 = ${t * t}   ⇒   t = ${t}` },
      ],
    };
  },
};

// ================================================================ Chương 16

/** Định lý số dư: chia p(x) cho x - a thì số dư là p(a). Không cần chia thật. */
const remainderTheorem: MathTemplate = {
  slug: 'pd-remainder-theorem',
  skill: 'nonlinear_functions',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const coefs = [pickInt(rng, 1, 3), pickInt(rng, -6, 6), pickInt(rng, -9, 9), pickNonZeroInt(rng, -9, 9)];
    const a = pickNonZeroInt(rng, -3, 3);
    const value = evalPoly(coefs, a);
    const [c3, c2, c1, c0] = coefs as [number, number, number, number];
    return {
      format: 'grid_in',
      stem: `The polynomial p is defined by p(x) = ${polyText(coefs)}. What is the remainder when p(x) is divided by ${linearSide(1, -a)}?`,
      answer: rat(value),
      steps: [
        { text: `Theo định lý số dư, chia cho ${linearSide(1, -a)} thì số dư bằng giá trị của p tại x = ${a}.`, expr: `số dư = p(${a})` },
        { text: 'Thay số vào từng số hạng.', expr: `${c3 === 1 ? '' : c3}${par(a)}^3 + ${par(c2)}${par(a)}^2 + ${par(c1)}${par(a)} + ${par(c0)}` },
        { text: 'Cộng lại.', expr: `p(${a}) = ${value}` },
      ],
    };
  },
};

/** x - a là nhân tử của p(x) khi và chỉ khi p(a) = 0 — dùng điều đó để tìm hệ số ẩn. */
const polynomialFactorK: MathTemplate = {
  slug: 'pd-polynomial-factor-k',
  skill: 'nonlinear_functions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const a = pickNonZeroInt(rng, -4, 4);
    const b = pickNonZeroInt(rng, -6, 6);
    let k = pickNonZeroInt(rng, -12, 12);
    let d = -(a ** 3 + b * a * a + k * a);
    // d = 0 thì mất hằng số, đề còn nhân tử x hiển nhiên. Dời k một bước là đủ,
    // vì d đổi đúng -a (khác 0).
    if (d === 0) {
      k = k > 0 ? k + 1 : k - 1;
      d = -(a ** 3 + b * a * a + k * a);
    }
    const known = a ** 3 + b * a * a + d;
    const { choices, correctIndex } = buildChoices(
      rat(k),
      [
        { value: rat(-(a ** 3) + b * a * a + d, a), errorTag: 'sign_flip', note: `Thay x = ${-a} thay vì x = ${a}. Nhân tử x - a cho nghiệm x = a.` },
        { value: rat(k * a), errorTag: 'stopped_too_early', note: `Đây là giá trị của ${a}k — còn phải chia cho ${a}.` },
        { value: rat(-k), errorTag: 'moved_term_wrong_side', note: 'Chuyển số hạng chứa k sang vế kia mà giữ nguyên dấu.' },
      ],
      rng,
    );
    const pText = `x^3${signedCoefTerm(b, 'x^2')} + kx${signedTerm(d)}`;
    return {
      format: 'mcq',
      stem: `In the polynomial p(x) = ${pText}, k is a constant. If ${linearSide(1, -a)} is a factor of p(x), what is the value of k?`,
      choices,
      correctIndex,
      steps: [
        { text: `${linearSide(1, -a)} là nhân tử nghĩa là p(${a}) = 0.`, expr: `${par(a)}^3 + ${par(b)}${par(a)}^2 + k${par(a)} + ${par(d)} = 0` },
        { text: 'Tính các số hạng đã biết.', expr: `${known} + ${par(a)}k = 0` },
        { text: `Giải ra k.`, expr: `k = frac(${-known},${a}) = ${k}` },
      ],
    };
  },
};

/** Viết thương + phân thức dư: `2x + 3 + frac(5,x - 1)`. */
function divForm(m: number, q0: number, R: number, a: number): string {
  const head = `${coefTerm(m)}${signedTerm(q0)}`;
  if (R === 0) return head;
  return `${head} ${R < 0 ? '-' : '+'} frac(${Math.abs(R)},${linearSide(1, -a)})`;
}

/** Chia đa thức bậc hai cho x - a, viết dạng thương cộng phân thức dư. */
const polyDivisionQuotient: MathTemplate = {
  slug: 'pd-poly-division-quotient',
  skill: 'equivalent_expressions',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const m = pickInt(rng, 2, 4);
    const a = pickNonZeroInt(rng, -5, 5);
    const q0 = pickInt(rng, -9, 9);
    const R = pickNonZeroInt(rng, -12, 12);
    // (mx + q0)(x - a) + R
    const b = q0 - m * a;
    const c = R - q0 * a;
    // Chia tổng hợp với -a thay vì a.
    const q0Wrong = b - m * a;
    const RWrong = c - q0Wrong * a;
    const correct = divForm(m, q0, R, a);
    const { choices, correctIndex } = buildTextChoices(
      correct,
      [
        { display: divForm(m, q0Wrong, RWrong, a), errorTag: 'sign_flip', note: `Chia tổng hợp với ${-a} thay vì ${a}: nghiệm của ${linearSide(1, -a)} là ${a}.` },
        { display: divForm(m, q0, 0, a), errorTag: 'stopped_too_early', note: 'Chỉ có thương, bỏ mất phần dư. Phép chia này không chia hết.' },
        { display: divForm(m, q0, -R, a), errorTag: 'sign_flip', note: 'Số dư đúng độ lớn nhưng sai dấu.' },
        { display: divForm(m, q0, c, a), errorTag: null, note: 'Lấy luôn hằng số của tử làm số dư. Số dư là giá trị của tử tại x = a.' },
        { display: divForm(m, q0 + 1, R - a, a), errorTag: null, note: 'Nhân lại (thương)(mẫu) + dư thì không ra tử số đề cho — lỗi cộng ở bước chia.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Which of the following is equivalent to frac(${quadraticSide(m, b, c)},${linearSide(1, -a)})?`,
      choices,
      correctIndex,
      steps: [
        { text: `Chia tổng hợp với nghiệm của mẫu là ${a}. Hạ hệ số đầu ${m}.`, expr: `${m} · ${par(a)} + ${par(b)} = ${q0}` },
        { text: 'Làm tiếp một bước để ra số dư.', expr: `${q0} · ${par(a)} + ${par(c)} = ${R}` },
        { text: 'Thương là bậc nhất, số dư đặt trên mẫu.', expr: correct },
        { text: 'Kiểm lại: thương nhân mẫu cộng dư phải ra đúng tử.', expr: `(${linearSide(m, q0)})(${linearSide(1, -a)})${signedTerm(R)} = ${quadraticSide(m, b, c)}` },
      ],
    };
  },
};

// ================================================================ Chương 17

/** Cộng/trừ số phức: gộp phần thực với phần thực, phần ảo với phần ảo. */
const complexAdd: MathTemplate = {
  slug: 'pd-complex-add',
  skill: 'equivalent_expressions',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const a = pickNonZeroInt(rng, -9, 9);
    const b = pickNonZeroInt(rng, -9, 9);
    const c = pickNonZeroInt(rng, -9, 9);
    const d = pickNonZeroInt(rng, -9, 9);
    const minus = rng() < 0.5;
    const s = minus ? -1 : 1;
    const re = a + s * c;
    const im = b + s * d;
    const correct = cxi(re, im);
    const { choices, correctIndex } = buildTextChoices(
      correct,
      [
        minus
          ? { display: cxi(a - c, b + d), errorTag: 'sign_flip', note: 'Dấu trừ trước ngoặc phải đổi dấu CẢ phần ảo, không chỉ phần thực.' }
          : { display: cxi(a + c, b - d), errorTag: 'sign_flip', note: 'Phần ảo bị trừ thay vì cộng.' },
        { display: cxi(0, re + im), errorTag: null, note: 'Gộp phần thực với phần ảo thành một số hạng. Hai phần này không cộng vào nhau được.' },
        { display: cxi(im, re), errorTag: null, note: 'Đảo chỗ phần thực và phần ảo.' },
        { display: cxi(a - s * c, b - s * d), errorTag: null, note: minus ? 'Cộng hai số phức trong khi đề là phép trừ.' : 'Trừ hai số phức trong khi đề là phép cộng.' },
        { display: cxi(re, -im), errorTag: 'sign_flip', note: 'Phần ảo đúng độ lớn nhưng sai dấu.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Which of the following is equivalent to (${cxi(a, b)}) ${minus ? '-' : '+'} (${cxi(c, d)}), ${I_NOTE}?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Gộp phần thực với nhau.', expr: `${a} ${minus ? '-' : '+'} ${par(c)} = ${re}` },
        { text: 'Gộp phần ảo với nhau.', expr: `(${b} ${minus ? '-' : '+'} ${par(d)})i = ${cxi(0, im)}` },
        { text: 'Viết lại dạng a + bi.', expr: correct },
      ],
    };
  },
};

/** Nhân số phức: phân phối như nhân hai nhị thức, rồi thay i^2 = -1. */
const complexMultiply: MathTemplate = {
  slug: 'pd-complex-multiply',
  skill: 'equivalent_expressions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 1, 7);
    const b = pickNonZeroInt(rng, -6, 6);
    const c = pickInt(rng, 1, 7);
    const d = pickNonZeroInt(rng, -6, 6);
    const re = a * c - b * d;
    const im = a * d + b * c;
    const correct = cxi(re, im);
    const { choices, correctIndex } = buildTextChoices(
      correct,
      [
        { display: cxi(a * c + b * d, im), errorTag: 'sign_flip', note: 'Coi i bình phương bằng 1. Thật ra i bình phương bằng -1 nên tích hai phần ảo đổi dấu.' },
        { display: cxi(a * c, b * d), errorTag: 'forgot_distribute', note: 'Chỉ nhân phần thực với phần thực, phần ảo với phần ảo — thiếu hai tích chéo.' },
        { display: cxi(re, a * d - b * c), errorTag: null, note: 'Một trong hai tích chéo bị lấy sai dấu.' },
        { display: cxi(a * c - b * d, 0), errorTag: null, note: 'Bỏ quên phần ảo tạo bởi hai tích chéo.' },
        { display: cxi(re, -im), errorTag: 'sign_flip', note: 'Phần ảo đúng độ lớn nhưng sai dấu.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Which of the following is equivalent to (${cxi(a, b)})(${cxi(c, d)}), ${I_NOTE}?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Nhân phân phối từng cặp số hạng.', expr: `${a * c} + ${par(a * d)}i + ${par(b * c)}i + ${par(b * d)}i^2` },
        { text: 'Thay i bình phương bằng -1.', expr: `${par(b * d)}i^2 = ${-b * d}` },
        { text: 'Gộp phần thực và phần ảo.', expr: correct },
      ],
    };
  },
};

/** Chia số phức: nhân cả tử và mẫu với số phức liên hợp của mẫu. */
const complexDivide: MathTemplate = {
  slug: 'pd-complex-divide',
  skill: 'equivalent_expressions',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const x = pickNonZeroInt(rng, -5, 5);
    const y = pickNonZeroInt(rng, -5, 5);
    const c = pickInt(rng, 1, 5);
    const d = pickNonZeroInt(rng, -4, 4);
    // Tử = đáp án × mẫu, nên thương chắc chắn nguyên.
    const p = x * c - y * d;
    const q = x * d + y * c;
    const N = c * c + d * d;
    const correct = cxi(x, y);
    const distractors: Array<{ display: string; errorTag: MathErrorTag | null; note?: string }> = [
      { display: cxi(x * N, y * N), errorTag: 'stopped_too_early', note: `Đã nhân với số liên hợp nhưng quên chia cho ${N} ở mẫu.` },
    ];
    if (c * c !== d * d) {
      const D = c * c - d * d;
      distractors.push({ display: cx(rat(x * N, D), rat(y * N, D)), errorTag: 'sign_flip', note: 'Tính mẫu thành hiệu hai bình phương. Vì i bình phương bằng -1 nên mẫu là TỔNG hai bình phương.' });
    }
    distractors.push(
      { display: cx(rat(p, c), rat(q, d)), errorTag: null, note: 'Chia riêng phần thực cho phần thực, phần ảo cho phần ảo. Phép chia số phức không làm như vậy được.' },
      { display: cx(rat(p * c - q * d, N), rat(p * d + q * c, N)), errorTag: null, note: 'Nhân với chính mẫu số thay vì số phức LIÊN HỢP của nó.' },
      { display: cxi(x, -y), errorTag: 'sign_flip', note: 'Phần ảo đúng độ lớn nhưng sai dấu.' },
      { display: cxi(y, x), errorTag: null, note: 'Đảo chỗ phần thực và phần ảo.' },
    );
    const { choices, correctIndex } = buildTextChoices(correct, distractors, rng);
    const conj = cxi(c, -d);
    return {
      format: 'mcq',
      stem: `Which of the following is equivalent to frac(${cxi(p, q)},${cxi(c, d)}), ${I_NOTE}?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Nhân cả tử và mẫu với số phức liên hợp của mẫu.', expr: `frac((${cxi(p, q)})(${conj}),(${cxi(c, d)})(${conj}))` },
        { text: 'Mẫu thành tổng hai bình phương, vì i bình phương bằng -1.', expr: `${c}^2 + ${Math.abs(d)}^2 = ${N}` },
        { text: 'Nhân tử số rồi chia từng phần cho mẫu.', expr: `frac(${cxi(x * N, y * N)},${N}) = ${correct}` },
      ],
    };
  },
};

// ================================================================ Chương 18

/** Tính giá trị hàm có trị tuyệt đối — bẫy là bên trong âm mà quên đổi dấu. */
const absEvaluate: MathTemplate = {
  slug: 'pd-abs-evaluate',
  skill: 'nonlinear_functions',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const a = pickInt(rng, 2, 5);
    const b = pickNonZeroInt(rng, -9, 9);
    const c = pickNonZeroInt(rng, -9, 9);
    const k = pickNonZeroInt(rng, -6, 6);
    const inside = a * k + b;
    const value = Math.abs(inside) + c;
    return {
      format: 'grid_in',
      stem: `The function f is defined by f(x) = |${linearSide(a, b)}|${signedTerm(c)}. What is the value of f(${k})?`,
      answer: rat(value),
      steps: [
        { text: `Thay x = ${k} vào biểu thức trong dấu giá trị tuyệt đối.`, expr: `${a}${par(k)}${signedTerm(b)} = ${inside}` },
        { text: 'Giá trị tuyệt đối luôn không âm.', expr: `|${inside}| = ${Math.abs(inside)}` },
        { text: `Cộng phần còn lại.`, expr: `f(${k}) = ${Math.abs(inside)}${signedTerm(c)} = ${value}` },
      ],
    };
  },
};

/** Bất phương trình trị tuyệt đối: đếm nghiệm nguyên, hoặc viết lại một khoảng. */
const absInequality: MathTemplate = {
  slug: 'pd-abs-inequality',
  skill: 'linear_inequalities',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    if (rng() < 0.5) {
      const k = pick(rng, [1, 2, 3] as const);
      const a = pickInt(rng, -10, 10);
      const b = pickInt(rng, 2, 9);
      // Đếm bằng cách duyệt thẳng: khoảng nghiệm nằm gọn trong [-20, 20].
      let strict = 0;
      let loose = 0;
      let oneSide = 0;
      for (let x = -30; x <= 30; x += 1) {
        const v = k * x - a;
        if (Math.abs(v) < b) strict += 1;
        if (Math.abs(v) <= b) loose += 1;
        if (v >= 0 && v < b) oneSide += 1;
      }
      const lo = fracOrInt(a - b, k);
      const hi = fracOrInt(a + b, k);
      const first = `-${b} < ${linearSide(k, -a)} < ${b}`;
      const second = `${lo} < x < ${hi}`;
      const { choices, correctIndex } = buildChoices(
        rat(strict),
        [
          { value: rat(loose), errorTag: 'off_by_one', note: 'Tính cả hai đầu mút, nhưng dấu < là bất đẳng thức NGẶT.' },
          { value: rat(oneSide), errorTag: 'dropped_a_solution', note: 'Chỉ giải nhánh biểu thức bên trong không âm, bỏ mất nhánh âm.' },
          { value: rat(2 * b - 1), errorTag: null, note: `Quên chia cho hệ số ${k} của x.` },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `How many integer values of x satisfy |${linearSide(k, -a)}| < ${b}?`,
        choices,
        correctIndex,
        steps: [
          { text: `Trị tuyệt đối nhỏ hơn ${b} nghĩa là biểu thức bên trong nằm giữa -${b} và ${b}.`, expr: first },
          // Với x trần (a = 0, k = 1) bước giải khoảng không làm gì thêm, bỏ đi.
          ...(second === first
            ? []
            : [{ text: k === 1 ? 'Cộng vào cả ba vế.' : `Cộng vào cả ba vế rồi chia cho ${k}.`, expr: second }]),
          { text: 'Đếm các số nguyên nằm HẲN bên trong khoảng (không lấy đầu mút).', expr: `${strict}` },
        ],
      };
    }
    const m = pickInt(rng, -10, 10);
    const h = pickInt(rng, 1, 9);
    const M = m + 2 * h;
    const center = m + h;
    const correct = `|${linearSide(1, -center)}| < ${h}`;
    const { choices, correctIndex } = buildTextChoices(
      correct,
      [
        { display: `|${linearSide(1, center)}| < ${h}`, errorTag: 'sign_flip', note: `Tâm của khoảng là ${center}, nên trong trị tuyệt đối phải là x trừ đi ${center}.` },
        { display: `|${linearSide(1, -center)}| < ${2 * h}`, errorTag: null, note: 'Dùng cả độ dài khoảng. Vế phải là NỬA độ dài — khoảng cách từ tâm tới mỗi đầu.' },
        { display: `|${linearSide(1, -center)}| > ${h}`, errorTag: 'forgot_flip_inequality', note: 'Dấu > mô tả phần NGOÀI khoảng, không phải phần giữa hai đầu mút.' },
        { display: `|${linearSide(1, -h)}| < ${center}`, errorTag: null, note: 'Đảo chỗ tâm và bán kính của khoảng.' },
        { display: `|${linearSide(1, -m)}| < ${M}`, errorTag: null, note: 'Lấy hai đầu mút làm tâm và bán kính. Tâm là trung điểm của hai đầu mút.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Which of the following inequalities is equivalent to ${m} < x < ${M}?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Tâm của khoảng là trung điểm hai đầu mút.', expr: `frac(${m} + ${par(M)},2) = ${center}` },
        { text: 'Bán kính là khoảng cách từ tâm tới một đầu mút.', expr: `${M} - ${par(center)} = ${h}` },
        { text: 'Mọi x cách tâm ít hơn bán kính.', expr: correct },
      ],
    };
  },
};

// ================================================================ Chương 19

/** Hai góc bù nhau có tổng 180°. */
const supplementaryAngles: MathTemplate = {
  slug: 'pd-supplementary-angles',
  skill: 'lines_angles_triangles',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    if (rng() < 0.5) {
      const raw = pickInt(rng, 20, 159);
      const A = raw === 90 ? 160 : raw;
      const candidates: Array<{ value: MathValue; errorTag: MathErrorTag | null; note?: string }> = [];
      if (A < 90) candidates.push({ value: rat(90 - A), errorTag: 'confused_supplementary_complementary' });
      candidates.push(
        { value: rat(360 - A), errorTag: null, note: '360° là tổng các góc quanh một điểm, không phải tổng hai góc bù.' },
        { value: rat(A), errorTag: null, note: 'Hai góc bù nhau chỉ bằng nhau khi cả hai cùng là 90°.' },
      );
      const { choices, correctIndex } = buildChoices(rat(180 - A), candidates, rng);
      return {
        format: 'mcq',
        stem: `Angle P and angle Q are supplementary angles. If the measure of angle P is ${A}°, what is the measure, in degrees, of angle Q?`,
        choices,
        correctIndex,
        steps: [
          { text: 'Hai góc bù nhau có tổng bằng 180°.', expr: `P + Q = 180` },
          { text: 'Trừ số đo đã biết.', expr: `Q = 180 - ${A} = ${180 - A}` },
        ],
      };
    }
    const half = pickInt(rng, 3, 30);
    const d = 2 * half;
    const x = 90 - half;
    const { choices, correctIndex } = buildChoices(
      rat(x),
      [
        { value: rat(90 - d, 2), errorTag: 'confused_supplementary_complementary' },
        { value: rat(180 - d), errorTag: 'stopped_too_early', note: `Đây là 2x — còn phải chia cho 2.` },
        { value: rat(x + d), errorTag: 'solved_for_wrong_var', note: 'Đây là số đo góc thứ hai, không phải x.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Two angles are supplementary. The measure of one angle is x°, and the measure of the other angle is (x + ${d})°. What is the value of x?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Hai góc bù nhau có tổng 180°.', expr: `x + (x + ${d}) = 180` },
        { text: 'Gom x rồi chuyển vế.', expr: `2x = ${180 - d}` },
        { text: 'Chia cho 2.', expr: `x = ${x}` },
      ],
    };
  },
};

const REGULAR_SIDES = [5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36] as const;

/** Tổng góc trong đa giác (n - 2)·180, ba chiều hỏi. */
const polygonInterior: MathTemplate = {
  slug: 'pd-polygon-interior',
  skill: 'lines_angles_triangles',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    // Dạng "góc còn thiếu" có nhiều bộ số nhất nên chiếm nửa số câu; ba dạng kia
    // chỉ có vài chục bộ số mỗi dạng.
    const mode = rng() < 0.5 ? 'missing' : pick(rng, ['regular', 'regularAngle', 'sum'] as const);
    if (mode === 'regularAngle') {
      const n = pick(rng, REGULAR_SIDES);
      const S = 180 * (n - 2);
      return {
        format: 'grid_in',
        stem: `What is the measure, in degrees, of each interior angle of a regular polygon with ${n} sides?`,
        answer: rat(S / n),
        steps: [
          { text: `Tổng các góc trong của đa giác ${n} cạnh.`, expr: `(${n} - 2) × 180 = ${S}` },
          { text: 'Đa giác đều có các góc bằng nhau, nên chia đều.', expr: `${S} ÷ ${n} = ${S / n}` },
        ],
      };
    }
    if (mode === 'regular') {
      const n = pick(rng, REGULAR_SIDES);
      const E = (180 * (n - 2)) / n;
      return {
        format: 'grid_in',
        stem: `Each interior angle of a regular polygon measures ${E}°. How many sides does the polygon have?`,
        answer: rat(n),
        steps: [
          { text: 'Góc ngoài và góc trong tại mỗi đỉnh bù nhau.', expr: `180 - ${E} = ${180 - E}` },
          { text: 'Tổng các góc ngoài của đa giác lồi luôn là 360°, và đa giác đều có các góc ngoài bằng nhau.', expr: `n = frac(360,${180 - E}) = ${n}` },
        ],
      };
    }
    if (mode === 'sum') {
      const n = pickInt(rng, 5, 20);
      const S = 180 * (n - 2);
      return {
        format: 'grid_in',
        stem: `The sum of the measures of the interior angles of a convex polygon is ${S}°. How many sides does the polygon have?`,
        answer: rat(n),
        steps: [
          { text: 'Tổng các góc trong của đa giác n cạnh là (n - 2) nhân 180°.', expr: `(n - 2) × 180 = ${S}` },
          { text: 'Chia cho 180.', expr: `n - 2 = ${n - 2}` },
          { text: 'Cộng 2.', expr: `n = ${n}` },
        ],
      };
    }
    const n = pickInt(rng, 5, 12);
    const last = pickInt(rng, 60, 175);
    const S = 180 * (n - 2);
    const T = S - last;
    return {
      format: 'grid_in',
      stem: `A convex polygon has ${n} sides. The sum of the measures of ${n - 1} of its interior angles is ${T}°. What is the measure, in degrees, of the remaining interior angle?`,
      answer: rat(last),
      steps: [
        { text: `Tổng tất cả các góc trong của đa giác ${n} cạnh.`, expr: `(${n} - 2) × 180 = ${S}` },
        { text: 'Góc còn lại là phần thiếu.', expr: `${S} - ${T} = ${last}` },
      ],
    };
  },
};

// ================================================================ Chương 20

/** Tam giác đồng dạng: đường song song cắt cạnh, hoặc tỉ số diện tích. */
const similarTriangles: MathTemplate = {
  slug: 'pd-similar-triangles',
  skill: 'lines_angles_triangles',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    if (rng() < 0.5) {
      const p = pickInt(rng, 2, 9);
      const q = pickInt(rng, 1, 9);
      const t = pickInt(rng, 1, 6);
      const DE = p * t;
      const BC = (p + q) * t;
      const { choices, correctIndex } = buildChoices(
        rat(BC),
        [
          { value: rat(q * t), errorTag: 'wrong_denominator', note: `Lập tỉ số với DB = ${q}. Cạnh tương ứng với AD trong tam giác lớn là AB = ${p + q}.` },
          { value: rat(p * p * t, p + q), errorTag: 'inverted_fraction' },
          { value: rat(DE + q), errorTag: null, note: 'Cộng thêm độ dài DB vào DE. Tam giác đồng dạng thì cạnh tỉ lệ, không cộng thêm.' },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `In triangle ABC, point D lies on side AB and point E lies on side AC such that DE is parallel to BC. If AD = ${p}, DB = ${q}, and DE = ${DE}, what is the length of BC?`,
        choices,
        correctIndex,
        steps: [
          { text: 'DE song song BC nên tam giác ADE đồng dạng tam giác ABC.', expr: `frac(DE,BC) = frac(AD,AB)` },
          { text: 'Cạnh AB là cả đoạn, gồm AD và DB.', expr: `AB = ${p} + ${q} = ${p + q}` },
          { text: 'Thay số rồi giải.', expr: `BC = ${DE} × frac(${p + q},${p}) = ${BC}` },
        ],
      };
    }
    const a = pickInt(rng, 2, 6);
    const bRaw = pickInt(rng, 2, 9);
    const b = bRaw === a ? a + 1 : bRaw;
    const u = pickInt(rng, 1, 5);
    const A = a * a * u;
    const answer = b * b * u;
    const { choices, correctIndex } = buildChoices(
      rat(answer),
      [
        { value: rat(a * b * u), errorTag: null, note: 'Nhân diện tích với tỉ số cạnh. Tỉ số diện tích bằng BÌNH PHƯƠNG tỉ số đồng dạng.' },
        { value: rat(A * a * a, b * b), errorTag: 'inverted_fraction' },
        { value: rat(A + b - a), errorTag: null, note: 'Cộng chênh lệch cạnh vào diện tích. Hai tam giác đồng dạng thì các đại lượng tỉ lệ, không cộng thêm.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Triangle PQR is similar to triangle XYZ, where side PQ corresponds to side XY. If PQ = ${a}, XY = ${b}, and the area of triangle PQR is ${A} square units, what is the area, in square units, of triangle XYZ?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Tỉ số đồng dạng từ tam giác PQR sang tam giác XYZ.', expr: `k = frac(${b},${a})` },
        { text: 'Diện tích đổi theo bình phương tỉ số đồng dạng.', expr: `${A} × frac(${b * b},${a * a}) = ${answer}` },
      ],
    };
  },
};

// ================================================================ Chương 21

const CIRCLE_UNITS = ['centimeters', 'inches', 'feet', 'meters'] as const;

/** Bán kính ↔ đường kính ↔ chu vi, mức dễ. */
const circleDiameterEasy: MathTemplate = {
  slug: 'pd-circle-diameter-easy',
  skill: 'circles',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const r = pickInt(rng, 2, 30);
    const unit = pick(rng, CIRCLE_UNITS);
    const mode = pick(rng, ['r2d', 'd2r', 'c2r', 'c2d'] as const);
    if (mode === 'r2d') {
      return {
        format: 'grid_in',
        stem: `A circle has a radius of ${r} ${unit}. What is the diameter, in ${unit}, of the circle?`,
        answer: rat(2 * r),
        steps: [{ text: 'Đường kính gấp đôi bán kính.', expr: `d = 2 × ${r} = ${2 * r}` }],
      };
    }
    if (mode === 'd2r') {
      return {
        format: 'grid_in',
        stem: `A circle has a diameter of ${2 * r} ${unit}. What is the radius, in ${unit}, of the circle?`,
        answer: rat(r),
        steps: [{ text: 'Bán kính bằng nửa đường kính.', expr: `r = ${2 * r} ÷ 2 = ${r}` }],
      };
    }
    const askDiameter = mode === 'c2d';
    return {
      format: 'grid_in',
      stem: `The circumference of a circle is ${2 * r} pi ${unit}. What is the ${askDiameter ? 'diameter' : 'radius'}, in ${unit}, of the circle?`,
      answer: rat(askDiameter ? 2 * r : r),
      steps: [
        { text: 'Chu vi bằng pi nhân đường kính, cũng bằng 2 pi nhân bán kính.', expr: `C = pi d = ${2 * r} pi` },
        askDiameter
          ? { text: 'So hệ số của pi.', expr: `d = ${2 * r}` }
          : { text: 'Đường kính là hệ số của pi; bán kính bằng một nửa.', expr: `r = ${2 * r} ÷ 2 = ${r}` },
      ],
    };
  },
};

// ================================================================ Chương 22

const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
] as const;

const TRI_NAMES = [
  ['A', 'B', 'C'],
  ['P', 'Q', 'R'],
  ['X', 'Y', 'Z'],
  ['D', 'E', 'F'],
] as const;

/** sin của một góc bằng cos của góc phụ với nó. */
const sinCosComplement: MathTemplate = {
  slug: 'pd-sin-cos-complement',
  skill: 'right_triangles_trig',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    if (rng() < 0.5) {
      const raw = pickInt(rng, 5, 84);
      const x = raw === 45 ? 85 : raw;
      const sinFirst = rng() < 0.5;
      const [f, g] = sinFirst ? ['sin', 'cos'] : ['cos', 'sin'];
      const { choices, correctIndex } = buildChoices(
        rat(90 - x),
        [
          { value: rat(180 - x), errorTag: 'confused_supplementary_complementary' },
          { value: rat(x), errorTag: null, note: `${f} và ${g} của CÙNG một góc chỉ bằng nhau khi góc đó là 45°.` },
          { value: rat(90 + x), errorTag: 'sign_flip', note: 'Cộng 90 thay vì lấy 90 trừ đi góc đã cho.' },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `If ${f}(${x}°) = ${g}(k°), where 0 < k < 90, what is the value of k?`,
        choices,
        correctIndex,
        steps: [
          { text: 'sin của một góc nhọn bằng cos của góc phụ với nó, và ngược lại.', expr: `${f}(${x}°) = ${g}((90 - ${x})°)` },
          { text: 'Vậy k là góc phụ của góc đã cho.', expr: `k = 90 - ${x} = ${90 - x}` },
        ],
      };
    }
    const [p, q, r] = pick(rng, TRIPLES);
    const [A, B, C] = pick(rng, TRI_NAMES);
    const oppFirst = rng() < 0.5;
    const opp = oppFirst ? p : q;
    const adj = oppFirst ? q : p;
    const { choices, correctIndex } = buildChoices(
      rat(opp, r),
      [
        { value: rat(adj, r), errorTag: 'used_wrong_trig_ratio', note: `Đây là cos ${A} (cũng là sin ${B}), không phải cos ${B}.` },
        { value: rat(r, opp), errorTag: 'inverted_fraction' },
        { value: rat(opp, adj), errorTag: 'used_wrong_trig_ratio', note: `Đây là tan ${A}.` },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `In right triangle ${A}${B}${C}, angle ${C} is a right angle and sin ${A} = frac(${opp},${r}). What is the value of cos ${B}?`,
      choices,
      correctIndex,
      steps: [
        { text: `Góc ${C} vuông nên ${A} và ${B} là hai góc phụ nhau.`, expr: `${A} + ${B} = 90°` },
        { text: `Cạnh đối diện góc ${A} chính là cạnh kề góc ${B}, nên cos ${B} = sin ${A}.`, expr: `cos ${B} = sin ${A} = frac(${opp},${r})` },
      ],
    };
  },
};

/** Tử số nguyên tố cùng nhau với b, trong (0, 2b). */
function coprimeNumerators(b: number): number[] {
  const g = (x: number, y: number): number => (y === 0 ? x : g(y, x % y));
  const out: number[] = [];
  for (let a = 1; a < 2 * b; a += 1) if (g(a, b) === 1) out.push(a);
  return out;
}

/** Đổi độ ↔ radian, và độ dài cung khi góc cho bằng radian. */
const radiansConvert: MathTemplate = {
  slug: 'pd-radians-convert',
  skill: 'circles',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const mode = pick(rng, ['deg2rad', 'rad2deg', 'arc'] as const);
    if (mode === 'deg2rad') {
      const raw = 5 * pickInt(rng, 1, 71);
      const D = raw === 180 ? 355 : raw;
      const { choices, correctIndex } = buildChoices(
        rat(D, 180),
        [
          { value: rat(180, D), errorTag: 'inverted_fraction' },
          { value: rat(D, 360), errorTag: null, note: 'Dùng 360° tương ứng pi radian. Thật ra 180° mới ứng với pi radian (360° ứng với 2 pi).' },
          { value: rat(D, 90), errorTag: null, note: 'Chia cho 90 thay vì 180. Nửa vòng tròn là 180°, ứng với pi radian.' },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `An angle has a measure of ${D}°. The measure of the angle is k pi radians. What is the value of k?`,
        choices,
        correctIndex,
        steps: [
          { text: '180° ứng với pi radian, nên chia số đo độ cho 180.', expr: `k = frac(${D},180)` },
          { text: 'Rút gọn.', expr: `k = ${formatValueMath(rat(D, 180))}` },
        ],
      };
    }
    if (mode === 'rad2deg') {
      const b = pick(rng, [2, 3, 4, 5, 6, 9, 10, 12, 18] as const);
      const a = pick(rng, coprimeNumerators(b));
      const deg = (180 * a) / b;
      const { choices, correctIndex } = buildChoices(
        rat(deg),
        [
          { value: rat(360 * a, b), errorTag: null, note: 'Dùng pi radian = 360°. Thật ra pi radian = 180°.' },
          { value: rat(180 * b, a), errorTag: 'inverted_fraction' },
          { value: rat(90 * a, b), errorTag: null, note: 'Dùng pi radian = 90°. Thật ra pi radian = 180°.' },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `An angle has a measure of frac(${a},${b}) pi radians. What is the measure of the angle, in degrees?`,
        choices,
        correctIndex,
        steps: [
          { text: 'Thay pi radian bằng 180°.', expr: `frac(${a},${b}) × 180` },
          { text: 'Tính ra số đo độ.', expr: `${deg}°` },
        ],
      };
    }
    const r = pickInt(rng, 2, 12);
    const b = pick(rng, [2, 3, 4, 6] as const);
    const a = pick(rng, coprimeNumerators(b));
    const { choices, correctIndex } = buildChoices(
      rat(r * a, b),
      [
        { value: rat(2 * r * a, b), errorTag: 'used_diameter_not_radius' },
        { value: rat(r * r * a, 2 * b), errorTag: 'confused_area_perimeter', note: 'Đây là hệ số của DIỆN TÍCH hình quạt, không phải độ dài cung.' },
        { value: rat(a, r * b), errorTag: 'inverted_fraction', note: 'Chia góc cho bán kính. Độ dài cung bằng bán kính NHÂN góc (radian).' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A circle has a radius of ${r} centimeters. A central angle of frac(${a},${b}) pi radians intercepts an arc of length k pi centimeters. What is the value of k?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Với góc tính bằng radian, độ dài cung bằng bán kính nhân góc.', expr: `s = r θ = ${r} × frac(${a},${b}) pi` },
        { text: 'k là hệ số của pi.', expr: `k = ${formatValueMath(rat(r * a, b))}` },
      ],
    };
  },
};

// ================================================================ Chương 23

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

const TABLE_CONTEXTS = [
  { what: 'bicycles rented', noun: 'bicycles', happened: 'were rented', where: 'a rental shop', column: 'Bicycles rented' },
  { what: 'books borrowed', noun: 'books', happened: 'were borrowed', where: 'a school library', column: 'Books borrowed' },
  { what: 'smoothies sold', noun: 'smoothies', happened: 'were sold', where: 'a juice stand', column: 'Smoothies sold' },
  { what: 'visitors', noun: 'visitors', happened: 'came', where: 'a science museum', column: 'Visitors' },
] as const;

/** Đọc bảng một chiều: chênh lệch hai ngày, hoặc tổng mấy ngày. */
const tableRead: MathTemplate = {
  slug: 'pd-table-read',
  skill: 'one_var_data',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const ctx = pick(rng, TABLE_CONTEXTS);
    const values = DAYS.map(() => pickInt(rng, 12, 98));
    const figure = {
      kind: 'data_table' as const,
      caption: `${ctx.column} at ${ctx.where}`,
      columns: ['Day', ctx.column],
      rows: DAYS.map((day, i) => ({ label: day, cells: [values[i] ?? 0] })),
    };
    if (rng() < 0.6) {
      const i = pickInt(rng, 0, 4);
      const jRaw = pickInt(rng, 0, 3);
      const j = jRaw >= i ? jRaw + 1 : jRaw;
      // Luôn hỏi "nhiều hơn" theo chiều ngày lớn hơn trừ ngày nhỏ hơn, để đáp án
      // không âm; hai ngày bằng nhau thì nâng một ngày lên để có chênh lệch.
      if (values[i] === values[j]) values[i] = (values[i] ?? 0) + 3;
      figure.rows[i] = { label: DAYS[i]!, cells: [values[i] ?? 0] };
      const [hi, lo] = (values[i] ?? 0) > (values[j] ?? 0) ? [i, j] : [j, i];
      const vHi = values[hi] ?? 0;
      const vLo = values[lo] ?? 0;
      return {
        format: 'grid_in',
        stem: `The table shows the number of ${ctx.what} at ${ctx.where} on each of five days. How many more ${ctx.noun} ${ctx.happened} on ${DAYS[hi]} than on ${DAYS[lo]}?`,
        figure,
        answer: rat(vHi - vLo),
        steps: [
          { text: `Đọc hai dòng ${DAYS[hi]} và ${DAYS[lo]} trong bảng.`, expr: `${vHi}   và   ${vLo}` },
          { text: '"Nhiều hơn bao nhiêu" là phép trừ.', expr: `${vHi} - ${vLo} = ${vHi - vLo}` },
        ],
      };
    }
    const start = pickInt(rng, 0, 2);
    const len = pickInt(rng, 2, 5 - start);
    const picked = values.slice(start, start + len);
    const total = picked.reduce((s, v) => s + v, 0);
    return {
      format: 'grid_in',
      stem: `The table shows the number of ${ctx.what} at ${ctx.where} on each of five days. What is the total number of ${ctx.what} from ${DAYS[start]} through ${DAYS[start + len - 1]}?`,
      figure,
      answer: rat(total),
      steps: [
        { text: `"Từ ${DAYS[start]} đến ${DAYS[start + len - 1]}" tính cả hai ngày đầu và cuối.`, expr: picked.join(' + ') },
        { text: 'Cộng lại.', expr: `${total}` },
      ],
    };
  },
};

const PERCENT_CONTEXTS = [
  { unit: 'students', verb: 'chose', rowPrefix: 'in', rows: ['Grade 10', 'Grade 11'], cols: ['Soccer', 'Swimming'], caption: 'Grade × sport chosen' },
  { unit: 'employees', verb: 'prefer', rowPrefix: 'on the', rows: ['Day shift', 'Night shift'], cols: ['Tea', 'Coffee'], caption: 'Shift × drink preferred' },
  { unit: 'members', verb: 'joined', rowPrefix: 'in the', rows: ['Morning group', 'Evening group'], cols: ['Yoga', 'Cycling'], caption: 'Group × class joined' },
] as const;

const PERCENT_TOTALS = [25, 40, 50, 80, 100, 125, 200] as const;
const PERCENT_GRAND = [400, 500] as const;

/**
 * Phần trăm từ bảng hai chiều. Chọn ô hỏi c là bội của 20 và mọi tổng là ước
 * của 2000, nên c chia cho BẤT KỲ tổng nào cũng ra phần trăm nguyên — cả đáp
 * án lẫn ba nhiễu "sai mẫu số" đều là số sạch.
 */
const tablePercentHard: MathTemplate = {
  slug: 'pd-table-percent-hard',
  skill: 'percentages',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const ctx = pick(rng, PERCENT_CONTEXTS);
    const c = 20 * pickInt(rng, 1, 3);
    const C = pick(rng, PERCENT_TOTALS.filter((t) => t > c));
    const R = pick(rng, PERCENT_TOTALS.filter((t) => t > c));
    const G = pick(rng, PERCENT_GRAND);
    const ri = pickInt(rng, 0, 1);
    const ci = pickInt(rng, 0, 1);
    const cells = [
      [0, 0],
      [0, 0],
    ];
    cells[ri]![ci] = c;
    cells[ri]![1 - ci] = R - c;
    cells[1 - ri]![ci] = C - c;
    cells[1 - ri]![1 - ci] = G - R - C + c;
    const rowLabel = ctx.rows[ri]!;
    const colLabel = ctx.cols[ci]!;
    const rowPhrase = `${ctx.rowPrefix} ${rowLabel.toLowerCase()}`;
    const colPhrase = `${ctx.verb} ${colLabel.toLowerCase()}`;
    const byColumn = rng() < 0.5;
    const base = byColumn ? C : R;
    const other = byColumn ? R : C;
    const answer = rat(100 * c, base);
    const { choices, correctIndex } = buildChoices(
      answer,
      [
        { value: rat(100 * c, other), errorTag: 'wrong_denominator', note: `Chia cho ${other} — tổng của nhóm kia. Nhóm làm mẫu là nhóm đứng sau "of the ${ctx.unit}".` },
        { value: rat(100 * c, G), errorTag: 'wrong_denominator', note: `Chia cho tổng cả bảng (${G}). Đề đã giới hạn trong một nhóm.` },
        { value: rat(100 * (base - c), base), errorTag: null, note: 'Đúng mẫu số nhưng lấy phần CÒN LẠI của nhóm.' },
      ],
      rng,
      (v) => `${formatValueMath(v)}%`,
    );
    const stem = byColumn
      ? `The table shows the ${G} ${ctx.unit} in a survey, classified by two characteristics. What percent of the ${ctx.unit} who ${colPhrase} are ${rowPhrase}?`
      : `The table shows the ${G} ${ctx.unit} in a survey, classified by two characteristics. What percent of the ${ctx.unit} ${rowPhrase} ${colPhrase}?`;
    return {
      format: 'mcq',
      stem,
      figure: {
        kind: 'data_table',
        caption: ctx.caption,
        columns: ['', ctx.cols[0], ctx.cols[1], 'Total'],
        rows: ctx.rows.map((label, i) => ({
          label,
          cells: [cells[i]![0]!, cells[i]![1]!, cells[i]![0]! + cells[i]![1]!],
        })),
        totalRow: { label: 'Total', cells: [cells[0]![0]! + cells[1]![0]!, cells[0]![1]! + cells[1]![1]!, G] },
      },
      choices,
      correctIndex,
      steps: [
        {
          text: byColumn
            ? `Nhóm làm mẫu là những người ở cột ${colLabel}: đọc ô tổng cuối cột.`
            : `Nhóm làm mẫu là những người ở hàng ${rowLabel}: đọc ô tổng cuối hàng.`,
          expr: `mẫu số = ${base}`,
        },
        { text: `Trong nhóm đó, số người thuộc cả ${rowLabel} và ${colLabel}.`, expr: `tử số = ${c}` },
        { text: 'Đổi ra phần trăm.', expr: `frac(${c},${base}) × 100 = ${formatValueMath(answer)}%` },
      ],
    };
  },
};

// ================================================================ Chương 24

const MARBLE_COLORS = [
  ['red', 'blue'],
  ['green', 'yellow'],
  ['black', 'white'],
] as const;

/** Rút hai lần không hoàn lại: lần hai mẫu số giảm 1. */
const probabilityWithoutReplacement: MathTemplate = {
  slug: 'pd-probability-without-replacement',
  skill: 'probability',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const [c1, c2] = pick(rng, MARBLE_COLORS);
    const r = pickInt(rng, 3, 9);
    const b = pickInt(rng, 3, 9);
    const n = r + b;
    if (rng() < 0.5) {
      const targetFirst = rng() < 0.5;
      const t = targetFirst ? r : b;
      const color = targetFirst ? c1 : c2;
      const { choices, correctIndex } = buildChoices(
        rat(t * (t - 1), n * (n - 1)),
        [
          { value: rat(t * t, n * n), errorTag: null, note: 'Tính như rút CÓ HOÀN LẠI. Không hoàn lại thì lần hai còn ít bi hơn một viên.' },
          { value: rat(t * (t - 1), n * n), errorTag: 'wrong_denominator', note: `Tử đã trừ đi một viên nhưng mẫu lần hai vẫn để ${n}, phải là ${n - 1}.` },
          { value: rat(t - 1, n - 1), errorTag: 'stopped_too_early', note: 'Đây chỉ là xác suất của lần rút thứ hai, còn phải nhân với lần thứ nhất.' },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `A bag contains ${r} ${c1} marbles and ${b} ${c2} marbles. Two marbles are selected at random, one at a time, without replacement. What is the probability that both marbles are ${color}?`,
        choices,
        correctIndex,
        steps: [
          { text: `Lần thứ nhất: ${t} viên ${color} trên ${n} viên.`, expr: `frac(${t},${n})` },
          { text: `Lần thứ hai: đã lấy đi một viên ${color}, còn ${t - 1} trên ${n - 1}.`, expr: `frac(${t - 1},${n - 1})` },
          { text: 'Nhân hai xác suất rồi rút gọn.', expr: `frac(${t * (t - 1)},${n * (n - 1)}) = ${formatValueMath(rat(t * (t - 1), n * (n - 1)))}` },
        ],
      };
    }
    const { choices, correctIndex } = buildChoices(
      rat(r * b, n * (n - 1)),
      [
        { value: rat(r * b, n * n), errorTag: null, note: 'Tính như rút CÓ HOÀN LẠI. Không hoàn lại thì lần hai chỉ còn một viên ít hơn.' },
        { value: rat(2 * r * b, n * (n - 1)), errorTag: null, note: 'Tính cả thứ tự ngược lại. Đề chỉ định rõ viên nào ra trước.' },
        { value: rat(r * (b - 1), n * (n - 1)), errorTag: 'off_by_one', note: `Trừ một viên ở màu ${c2}, nhưng viên đã lấy ra là màu ${c1}.` },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A bag contains ${r} ${c1} marbles and ${b} ${c2} marbles. Two marbles are selected at random, one at a time, without replacement. What is the probability that the first marble is ${c1} and the second marble is ${c2}?`,
      choices,
      correctIndex,
      steps: [
        { text: `Lần thứ nhất ra ${c1}.`, expr: `frac(${r},${n})` },
        { text: `Lần thứ hai: số bi ${c2} không đổi, nhưng tổng còn ${n - 1}.`, expr: `frac(${b},${n - 1})` },
        { text: 'Nhân hai xác suất rồi rút gọn.', expr: `frac(${r * b},${n * (n - 1)}) = ${formatValueMath(rat(r * b, n * (n - 1)))}` },
      ],
    };
  },
};

// ================================================================ Chương 25

type Dir = 'increases' | 'decreases' | 'stays the same';

const effectSentence = (mean: Dir, median: Dir) => `The mean ${mean} and the median ${median}.`;

/**
 * Hai dạng thống kê bằng câu chữ.
 *
 * Dạng độ lệch chuẩn cố ý đặt BẪY KÉP: tập có khoảng biến thiên lớn hơn và
 * trung bình lớn hơn lại là tập có độ lệch chuẩn NHỎ hơn — vì phần lớn giá trị
 * của nó dồn về giữa. Người nhìn khoảng biến thiên hoặc nhìn trung bình đều sai.
 */
const rangeStddevCompare: MathTemplate = {
  slug: 'pd-range-stddev-compare',
  skill: 'one_var_data',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    if (rng() < 0.5) {
      const a = pickInt(rng, 6, 14);
      // 2b^2 > a^2 (độ lệch chuẩn của tập "tách đôi" lớn hơn) và b < a (khoảng
      // biến thiên của nó nhỏ hơn).
      let bMin = a - 1;
      while (2 * (bMin - 1) ** 2 > a * a) bMin -= 1;
      const b = pickInt(rng, bMin, a - 1);
      const m = pickInt(rng, 20, 60);
      const shift = pickInt(rng, 2, 12);
      const wide = [m + shift - a, m + shift, m + shift, m + shift, m + shift + a];
      const spread = [m - b, m - b, m, m + b, m + b];
      const spreadIsA = rng() < 0.5;
      const [setA, setB] = spreadIsA ? [spread, wide] : [wide, spread];
      const bigger = spreadIsA ? 'A' : 'B';
      const smaller = spreadIsA ? 'B' : 'A';
      const { choices, correctIndex } = buildTextChoices(
        `Data set ${bigger} has the greater standard deviation.`,
        [
          { display: `Data set ${smaller} has the greater standard deviation.`, errorTag: null, note: `Tập ${smaller} có khoảng biến thiên và trung bình lớn hơn, nhưng ba trong năm giá trị trùng đúng tâm nên độ phân tán nhỏ hơn.` },
          { display: 'The two data sets have the same standard deviation.', errorTag: null, note: 'Hai tập có cùng số giá trị nhưng khoảng cách tới trung bình khác nhau.' },
          { display: 'The standard deviations cannot be compared without knowing the means.', errorTag: null, note: 'Trung bình tính được ngay từ số liệu, và độ lệch chuẩn không phụ thuộc việc tịnh tiến cả tập.' },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `Data set A consists of the values ${setA.join(', ')}. Data set B consists of the values ${setB.join(', ')}. Which of the following statements is true?`,
        choices,
        correctIndex,
        steps: [
          { text: 'Độ lệch chuẩn đo khoảng cách trung bình của các giá trị tới trung bình, không đo khoảng biến thiên.', expr: `mean A = ${spreadIsA ? m : m + shift},   mean B = ${spreadIsA ? m + shift : m}` },
          { text: `Tập "tách đôi": cả bốn giá trị ngoài tâm đều cách trung bình ${b}.`, expr: `4 × ${b}^2 = ${4 * b * b}` },
          { text: `Tập "dồn giữa": chỉ hai giá trị cách trung bình ${a}, ba giá trị còn lại bằng đúng trung bình.`, expr: `2 × ${a}^2 = ${2 * a * a}` },
          { text: `Tổng bình phương độ lệch của tập ${bigger} lớn hơn, nên độ lệch chuẩn của nó lớn hơn.`, expr: `${4 * b * b} > ${2 * a * a}` },
        ],
      };
    }
    // Dãy 5 giá trị tăng nghiêm ngặt.
    const v: number[] = [];
    let cur = pickInt(rng, 5, 20);
    for (let i = 0; i < 5; i += 1) {
      v.push(cur);
      cur += pickInt(rng, 2, 8);
    }
    const mode = pick(rng, ['maxUp', 'minDown', 'minToTop'] as const);
    let oldValue: number;
    let newValue: number;
    let meanDir: Dir;
    let medianDir: Dir;
    if (mode === 'maxUp') {
      oldValue = v[4]!;
      newValue = oldValue + pickInt(rng, 5, 30);
      meanDir = 'increases';
      medianDir = 'stays the same';
    } else if (mode === 'minDown') {
      oldValue = v[0]!;
      newValue = Math.max(0, oldValue - pickInt(rng, 3, 20));
      if (newValue === oldValue) newValue = oldValue - 1;
      meanDir = 'decreases';
      medianDir = 'stays the same';
    } else {
      oldValue = v[0]!;
      newValue = v[4]! + pickInt(rng, 1, 20);
      meanDir = 'increases';
      medianDir = 'increases';
    }
    const correct = effectSentence(meanDir, medianDir);
    const flipped: Dir = meanDir === 'increases' ? 'decreases' : 'increases';
    const { choices, correctIndex } = buildTextChoices(
      correct,
      [
        { display: effectSentence(medianDir, meanDir), errorTag: 'confused_mean_median', note: 'Đảo vai trò trung bình và trung vị. Trung bình dùng MỌI giá trị, trung vị chỉ nhìn vị trí giữa.' },
        { display: effectSentence(meanDir, medianDir === 'stays the same' ? meanDir : 'stays the same'), errorTag: 'confused_mean_median', note: 'Trung vị chỉ đổi khi giá trị đứng GIỮA dãy đã sắp xếp đổi.' },
        { display: effectSentence('stays the same', 'stays the same'), errorTag: null, note: 'Tổng các giá trị đã đổi, nên trung bình phải đổi.' },
        { display: effectSentence(flipped, medianDir), errorTag: 'sign_flip', note: 'Trung bình đổi cùng chiều với tổng các giá trị.' },
      ],
      rng,
    );
    const after = [...v];
    after[after.indexOf(oldValue)] = newValue;
    after.sort((x, y) => x - y);
    const sumBefore = v.reduce((s, n) => s + n, 0);
    const sumAfter = after.reduce((s, n) => s + n, 0);
    return {
      format: 'mcq',
      stem: `A data set consists of the values ${v.join(', ')}. If the value ${oldValue} is replaced with ${newValue}, which of the following statements is true?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Trung bình phụ thuộc tổng. So tổng trước và sau khi thay.', expr: `${sumBefore}   →   ${sumAfter}` },
        { text: 'Trung vị là giá trị thứ ba khi xếp tăng dần. Xếp lại dãy mới.', expr: after.join(', ') },
        { text: 'So giá trị giữa trước và sau.', expr: `${v[2]}   →   ${after[2]}` },
      ],
    };
  },
};

// ================================================================ Chương 27

/** Thể tích nón và cầu: hệ số của pi, tìm bán kính từ thể tích, hoặc nón bằng cầu. */
const coneSphereVolume: MathTemplate = {
  slug: 'pd-cone-sphere-volume',
  skill: 'area_volume',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    // Dạng nón có nhiều bộ số nhất nên chiếm nửa số câu.
    const mode = rng() < 0.5 ? 'cone' : pick(rng, ['sphereRadius', 'equal'] as const);
    const unit = pick(rng, CIRCLE_UNITS);
    if (mode === 'cone') {
      const r = pickInt(rng, 2, 12);
      const hRaw = pickInt(rng, 3, 24);
      // r^2 h phải chia hết cho 3 để hệ số của pi là số nguyên.
      const h = r % 3 === 0 || hRaw % 3 === 0 ? hRaw : 3 * pickInt(rng, 1, 5);
      const k = (r * r * h) / 3;
      const { choices, correctIndex } = buildChoices(
        rat(k),
        [
          { value: rat(4 * r * r * h, 3), errorTag: 'used_diameter_not_radius' },
          { value: rat(r * r * h), errorTag: null, note: 'Đây là thể tích hình TRỤ cùng đáy cùng cao. Hình nón chỉ bằng một phần ba.' },
          { value: rat(2 * r * h, 3), errorTag: null, note: 'Quên bình phương bán kính.' },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `A right circular cone has a base with a diameter of ${2 * r} ${unit} and a height of ${h} ${unit}. The volume of the cone is k pi cubic ${unit}. What is the value of k?`,
        choices,
        correctIndex,
        steps: [
          { text: 'Bán kính bằng nửa đường kính.', expr: `r = ${r}` },
          { text: 'Thể tích nón bằng một phần ba pi r bình phương h.', expr: `V = frac(1,3) pi × ${r}^2 × ${h} = ${k} pi` },
        ],
      };
    }
    if (mode === 'sphereRadius') {
      const r = pickInt(rng, 1, 15);
      const V = fracOrInt(4 * r ** 3, 3);
      const { choices, correctIndex } = buildChoices(
        rat(r),
        [
          { value: rat(2 * r), errorTag: 'used_diameter_not_radius', note: 'Đây là đường kính, đề hỏi bán kính.' },
          { value: rat(r, 2), errorTag: 'used_diameter_not_radius', note: 'Chia đôi bán kính như thể nó là đường kính.' },
          { value: rat(r ** 3), errorTag: 'forgot_square_root', note: 'Đây là r lập phương — còn phải lấy căn bậc ba.' },
          { value: rat(r * r), errorTag: null, note: 'Dùng nhầm công thức có r bình phương. Thể tích cầu tỉ lệ với r lập phương.' },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `The volume of a sphere is ${V} pi cubic ${unit}. What is the radius, in ${unit}, of the sphere?`,
        choices,
        correctIndex,
        steps: [
          { text: 'Thể tích cầu bằng bốn phần ba pi r lập phương.', expr: `frac(4,3) pi r^3 = ${V} pi` },
          { text: 'Nhân hai vế với ba phần tư.', expr: `r^3 = ${r ** 3}` },
          { text: 'Lấy căn bậc ba.', expr: `r = ${r}` },
        ],
      };
    }
    const R = pickInt(rng, 1, 6);
    const radii: number[] = [];
    for (let r = 2; r <= 12; r += 1) {
      const h = (4 * R ** 3) / (r * r);
      if (r !== R && Number.isInteger(h) && h <= 300) radii.push(r);
    }
    const r = pick(rng, radii);
    const h = (4 * R ** 3) / (r * r);
    const { choices, correctIndex } = buildChoices(
      rat(h),
      [
        { value: rat(4 * R ** 3, 3 * r * r), errorTag: null, note: 'Quên hệ số một phần ba trong công thức thể tích nón.' },
        { value: rat(3 * R ** 3, r * r), errorTag: null, note: 'Quên hệ số bốn phần ba trong công thức thể tích cầu.' },
        { value: rat(4 * R * R, r * r), errorTag: null, note: 'Dùng R bình phương cho hình cầu. Thể tích cầu tỉ lệ với R lập phương.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A sphere has a radius of ${R} ${unit}. A right circular cone has a base radius of ${r} ${unit} and the same volume as the sphere. What is the height, in ${unit}, of the cone?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Đặt thể tích nón bằng thể tích cầu.', expr: `frac(1,3) pi × ${r}^2 × h = frac(4,3) pi × ${R}^3` },
        { text: 'Nhân hai vế với 3 rồi bỏ pi.', expr: `${r * r}h = ${4 * R ** 3}` },
        { text: `Chia cho ${r * r}.`, expr: `h = ${h}` },
      ],
    };
  },
};

export const PANDA_B_TEMPLATES: readonly MathTemplate[] = [
  functionUndefinedOrInverse,
  remainderTheorem,
  polynomialFactorK,
  polyDivisionQuotient,
  complexAdd,
  complexMultiply,
  complexDivide,
  absEvaluate,
  absInequality,
  supplementaryAngles,
  polygonInterior,
  similarTriangles,
  circleDiameterEasy,
  sinCosComplement,
  radiansConvert,
  tableRead,
  tablePercentHard,
  probabilityWithoutReplacement,
  rangeStddevCompare,
  coneSphereVolume,
];
