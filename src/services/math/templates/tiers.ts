import { buildChoices, buildTextChoices } from '../choices';
import { coefTerm, linearSide, pick, pickInt, pickNonZeroInt, quadraticSide, signedTerm } from '../authoring';
import { fitsGrid } from '../grid-in';
import { formatValueMath, rat } from '@/lib/math/value';
import type { MathTemplate } from '@/lib/math/types';

/**
 * BẬC DỄ VÀ BẬC KHÓ còn thiếu của từng kỹ năng (01/10/2026).
 *
 * Người học phản ánh đề "hơi dễ": kho theo kỹ năng có 85 template nhưng 12/19
 * kỹ năng không có template KHÓ nào, 6 kỹ năng không có template DỄ. Bộ đề
 * giờ chia dễ → vừa → khó (xem `generateMathSet({ mix })`), nên mỗi kỹ năng
 * phải có đủ ba bậc.
 *
 * Bậc khó ở đây bám kiểu câu khó của module 2 Digital SAT: NHIỀU BƯỚC (tìm tham
 * số rồi mới tìm thứ được hỏi), ĐIỀU KIỆN thay vì con số (vô nghiệm, tiếp xúc,
 * không có nghiệm thực), đơn vị BÌNH PHƯƠNG, phần trăm KÉP, xác suất điều kiện
 * NGƯỢC chiều, và câu chữ thống kê phải đọc cả hai yếu tố thiết kế nghiên cứu.
 *
 * Như mọi template khác: dựng tham số trước, ĐÁP ÁN TÍNH TỪ THAM SỐ, mỗi nhiễu
 * là một sai lầm có tên. Bộ kiểm chứng đọc ngược từ đề nằm ở `tiers.verify.ts`.
 */

const par = (n: number) => (n < 0 ? `(${n})` : String(n));

/** Phân số đã rút gọn, dạng markup. */
const fv = (num: number, den: number) => formatValueMath(rat(num, den));

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

/** 12400 → "12,400" — tự viết để không phụ thuộc locale của máy chạy. */
export function withCommas(n: number): string {
  const s = String(Math.abs(n));
  const out = s.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  return n < 0 ? `-${out}` : out;
}

// ======================================================================
// BẬC KHÓ
// ======================================================================

/** Hai phân thức bậc nhất trừ nhau — quy đồng rồi mới giải. */
const linTwoFractions: MathTemplate = {
  slug: 'hard-lin1-two-fractions',
  skill: 'linear_equations_one_var',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const m = pickInt(rng, 2, 6);
    const nRaw = pickInt(rng, 2, 5);
    const n = nRaw >= m ? nRaw + 1 : nRaw;
    const a = pickInt(rng, 1, 6);
    let c = pickInt(rng, 1, 6);
    if (n * a === m * c) c += 1;
    const x = pickNonZeroInt(rng, -9, 12);
    const k1 = pickInt(rng, -5, 9);
    const k2 = pickInt(rng, -5, 9);
    const b = m * k1 - a * x;
    const d = c * x - n * k2;
    const t = k1 - k2;
    const left = linearSide(a, b);
    const right = linearSide(c, -d);
    const coef = n * a - m * c;
    const constant = n * b + m * d;
    const steps = [
      { text: `Nhân cả hai vế với ${m * n} để bỏ mẫu. Đặt mỗi tử số trong ngoặc — dấu trừ đứng trước phân thức thứ hai áp cho CẢ tử số.`, expr: `${n}(${left}) - ${m}(${right}) = ${m * n * t}` },
      { text: 'Nhân phân phối rồi gom hạng tử.', expr: `${linearSide(coef, constant)} = ${m * n * t}` },
    ];
    const last = `x = ${x}`;
    if (steps[1]!.expr !== last) steps.push({ text: 'Chuyển hằng số sang vế phải rồi chia cho hệ số của x.', expr: last });
    return {
      format: 'grid_in',
      stem: `If frac(${left},${m}) - frac(${right},${n}) = ${t}, what is the value of x?`,
      answer: rat(x),
      steps,
    };
  },
};

/** Tìm tham số từ một điểm, rồi mới ra độ dốc — dừng ở k là sai. */
const twoVarParamSlope: MathTemplate = {
  slug: 'hard-two-var-param-slope',
  skill: 'linear_equations_two_var',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const a = pick(rng, [1, -1]) * pickInt(rng, 2, 9);
    const kAbs = pickInt(rng, 2, 9);
    const k = pick(rng, [1, -1]) * (kAbs === Math.abs(a) ? (kAbs === 9 ? 2 : kAbs + 1) : kAbs);
    const p = pickNonZeroInt(rng, -6, 6);
    const q = pickNonZeroInt(rng, -6, 6);
    const c = a * p + k * q;
    const { choices, correctIndex } = buildChoices(
      rat(-a, k),
      [
        { value: rat(a, k), errorTag: 'sign_flip', note: 'Chuyển số hạng chứa x sang vế phải thì phải đổi dấu.' },
        { value: rat(k), errorTag: 'stopped_too_early', note: 'Đây là giá trị của k — đề hỏi độ dốc, còn một bước nữa.' },
        { value: rat(-k, a), errorTag: 'inverted_fraction' },
        { value: rat(c, k), errorTag: 'swapped_slope_intercept', note: 'Đây là tung độ gốc, không phải độ dốc.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `In the xy-plane, the graph of ${coefTerm(a)} + ky = ${c}, where k is a constant, passes through the point (${p}, ${q}). What is the slope of the graph?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Điểm nằm trên đồ thị thì toạ độ của nó thoả phương trình. Thay vào để tìm k.', expr: `${a}(${par(p)}) + k(${par(q)}) = ${c}` },
        { text: 'Giải ra k.', expr: `k = ${k}` },
        { text: 'Viết lại về dạng y = mx + b: độ dốc là âm hệ số của x chia cho hệ số của y.', expr: `m = ${fv(-a, k)}` },
      ],
    };
  },
};

/** f(x + h) = f(x) + d — đọc ra hệ số góc d/h, không phải d. */
const linFnShift: MathTemplate = {
  slug: 'hard-linfn-shift-rate',
  skill: 'linear_functions',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const h = pickInt(rng, 2, 6);
    const d = pickNonZeroInt(rng, -20, 20);
    const g = gcd(d, h);
    const j = pickInt(rng, 1, 5);
    const delta = (h / g) * j;
    const x0 = pickInt(rng, -5, 8);
    const y0 = pickInt(rng, -30, 40);
    const x1 = x0 + delta;
    const answer = y0 + (delta * d) / h;
    return {
      format: 'grid_in',
      stem: `For the linear function f, f(x + ${h}) = f(x)${signedTerm(d)} for all values of x, and f(${x0}) = ${y0}. What is the value of f(${x1})?`,
      answer: rat(answer),
      steps: [
        { text: `Mỗi khi x tăng ${h} đơn vị thì f thay đổi ${d}. Hệ số góc là lượng thay đổi chia cho độ tăng của x.`, expr: `m = ${fv(d, h)}` },
        { text: `Từ x = ${x0} tới x = ${x1}, x tăng ${delta}.`, expr: `f(${x1}) = ${y0} + ${delta} × ${fv(d, h)} = ${answer}` },
      ],
    };
  },
};

/** Hệ vô nghiệm với HAI hằng số — chỉ tích của chúng là xác định. */
const systemNoSolutionProduct: MathTemplate = {
  slug: 'hard-system-no-solution-product',
  skill: 'systems_linear_two_var',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const q = pickInt(rng, 2, 9);
    const s = pickInt(rng, 2, 9);
    const r = pickNonZeroInt(rng, -20, 20);
    const uRaw = pickNonZeroInt(rng, -20, 20);
    const u = uRaw === r ? -r : uRaw;
    return {
      format: 'grid_in',
      stem: `In the system of equations px + ${q}y = ${r} and ${s}x + ty = ${u}, p and t are constants. If the system has no solution, what is the value of pt?`,
      answer: rat(q * s),
      steps: [
        { text: 'Hệ vô nghiệm khi hai đường thẳng song song: tỉ số hai hệ số của x bằng tỉ số hai hệ số của y. Không cần biết riêng p hay t.', expr: `frac(p,${s}) = frac(${q},t)` },
        { text: 'Nhân chéo.', expr: `pt = ${s} × ${q} = ${q * s}` },
      ],
    };
  },
};

/** Bất phương trình kép có hệ số âm — đếm số nghiệm nguyên. */
const inequalityCompoundCount: MathTemplate = {
  slug: 'hard-ineq-compound-count',
  skill: 'linear_inequalities',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const q = pickInt(rng, 2, 5);
    const r = pickInt(rng, 2, 5);
    const p = pickNonZeroInt(rng, -10, 20);
    const lo = pickInt(rng, -6, 2);
    const hi = lo + pickInt(rng, 3, 8);
    // r·lo ≤ p − qx < r·hi  ⇔  (p − r·hi)/q < x ≤ (p − r·lo)/q
    const lowNum = p - r * hi;
    const highNum = p - r * lo;
    const first = Math.floor(lowNum / q) + 1;
    const last = Math.floor(highNum / q);
    const count = last - first + 1;
    return {
      format: 'grid_in',
      stem: `How many integers x satisfy ${lo} <= frac(${p} - ${q}x,${r}) < ${hi}?`,
      answer: rat(count),
      steps: [
        { text: `Nhân cả ba vế với ${r} (số dương, giữ chiều).`, expr: `${r * lo} <= ${p} - ${q}x < ${r * hi}` },
        { text: `Trừ ${p} rồi chia cho -${q}. Chia cho số âm nên ĐỔI CHIỀU cả hai dấu — đầu nào là dấu bằng cũng đổi theo.`, expr: `${fv(lowNum, q)} < x <= ${fv(highNum, q)}` },
        { text: `Các số nguyên thoả mãn chạy từ ${first} đến ${last}.`, expr: `${last} - (${first}) + 1 = ${count}` },
      ],
    };
  },
};

/** Chia đa thức cho nhị thức, viết dạng a + k/(x + c). */
const rationalDivision: MathTemplate = {
  slug: 'hard-expr-rational-division',
  skill: 'equivalent_expressions',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 7);
    const c = pickNonZeroInt(rng, -8, 8);
    let b = pickNonZeroInt(rng, -15, 15);
    if (b === a * c) b += 1;
    if (b === 0) b = 1;
    const k = b - a * c;
    const { choices, correctIndex } = buildChoices(
      rat(k),
      [
        { value: rat(b + a * c), errorTag: 'sign_flip', note: `Phần ${a}(x${signedTerm(c)}) phải TRỪ đi khỏi tử số, không cộng vào.` },
        { value: rat(b - c), errorTag: 'forgot_distribute', note: `Quên nhân ${a} với ${c} khi viết ${a}(x${signedTerm(c)}).` },
        { value: rat(b), errorTag: 'stopped_too_early', note: 'Đây là hằng số của tử số ban đầu, chưa tách phần chia hết.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The expression frac(${linearSide(a, b)},x${signedTerm(c)}) is equivalent to ${a} + frac(k,x${signedTerm(c)}), where k is a constant and x != ${-c}. What is the value of k?`,
      choices,
      correctIndex,
      steps: [
        { text: `Tách tử số thành một bội của mẫu cộng phần dư.`, expr: `${linearSide(a, b)} = ${a}(x${signedTerm(c)})${signedTerm(k)}` },
        { text: 'Chia từng phần cho mẫu: phần đầu ra đúng hằng số, phần dư chính là k.', expr: `k = ${b} - ${par(a * c)} = ${k}` },
      ],
    };
  },
};

/** Đường thẳng tiếp xúc parabol — biệt thức bằng 0. */
const quadTangentLine: MathTemplate = {
  slug: 'hard-quad-tangent-line',
  skill: 'nonlinear_equations',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const m = pickNonZeroInt(rng, -6, 6);
    const half = pickNonZeroInt(rng, -4, 4);
    const p = m + 2 * half;
    const q = pickInt(rng, -10, 10);
    const k = q - half * half;
    const { choices, correctIndex } = buildChoices(
      rat(k),
      [
        { value: rat(q + half * half), errorTag: 'sign_flip', note: 'Biệt thức bằng 0 cho q − k = (p − m)²/4, nên k nhỏ hơn q chứ không lớn hơn.' },
        { value: rat(q - 4 * half * half), errorTag: null, note: 'Quên chia 4 trong điều kiện b² = 4ac.' },
        { value: rat(q - ((p + m) * (p + m)) / 4), errorTag: 'moved_term_wrong_side', note: 'Chuyển mx sang vế trái mà cộng thay vì trừ, nên hệ số của x sai.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `In the xy-plane, the line y = ${coefTerm(m)} + k, where k is a constant, intersects the parabola y = ${quadraticSide(1, p, q)} at exactly one point. What is the value of k?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Cho hai vế bằng nhau rồi chuyển hết sang một vế.', expr: `${quadraticSide(1, p - m, 0)} + (${q} - k) = 0` },
        { text: 'Cắt nhau tại đúng một điểm nghĩa là phương trình bậc hai có nghiệm kép: biệt thức bằng 0.', expr: `(${p - m})^2 - 4(${q} - k) = 0` },
        { text: 'Giải ra k.', expr: `k = ${q} - frac(${(p - m) * (p - m)},4) = ${k}` },
      ],
    };
  },
};

/** Điều kiện để phương trình bậc hai không có nghiệm thực. */
const quadNoRealCondition: MathTemplate = {
  slug: 'hard-quad-no-real-condition',
  skill: 'nonlinear_equations',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 1, 6);
    const b = pickNonZeroInt(rng, -13, 13);
    const none = rng() < 0.5;
    const T = fv(b * b, 4 * a);
    const T2 = fv(b * b, a);
    const T3 = fv(b * b, 2 * a);
    const right = none ? `c > ${T}` : `c < ${T}`;
    const flipped = none ? `c < ${T}` : `c > ${T}`;
    const { choices, correctIndex } = buildTextChoices(
      right,
      [
        {
          display: flipped,
          errorTag: 'forgot_flip_inequality',
          note: none ? 'Đây là điều kiện để có HAI nghiệm thực: biệt thức dương.' : 'Đây là điều kiện để VÔ nghiệm thực: biệt thức âm.',
        },
        { display: `c = ${T}`, errorTag: null, note: 'Biệt thức bằng 0 cho đúng MỘT nghiệm.' },
        { display: none ? `c > ${T2}` : `c < ${T2}`, errorTag: null, note: 'Quên số 4 trong biệt thức b² − 4ac.' },
        { display: none ? `c > ${T3}` : `c < ${T3}`, errorTag: null, note: 'Chia cho 2a thay vì 4a.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `In the equation ${quadraticSide(a, b, 0)} + c = 0, c is a constant. For which values of c does the equation have ${none ? 'no real solutions' : 'two distinct real solutions'}?`,
      choices,
      correctIndex,
      steps: [
        { text: none ? 'Không có nghiệm thực khi biệt thức âm.' : 'Hai nghiệm thực phân biệt khi biệt thức dương.', expr: `(${b})^2 - 4(${a})c ${none ? '<' : '>'} 0` },
        { text: `Chuyển vế rồi chia cho ${4 * a} (số dương, giữ chiều).`, expr: right },
      ],
    };
  },
};

/** Phép biến hình kép trên parabol: dịch ngang, co giãn dọc, dịch dọc. */
const transformVertex: MathTemplate = {
  slug: 'hard-transform-vertex',
  skill: 'nonlinear_functions',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const h = pickInt(rng, -6, 6);
    const k = pickNonZeroInt(rng, -8, 8);
    const A = pick(rng, [-3, -2, 2, 3, 4]);
    const s = pickNonZeroInt(rng, -6, 6);
    const v = pickNonZeroInt(rng, -9, 9);
    const pt = (x: number, y: number) => `(${x}, ${y})`;
    const correct = pt(h - s, A * k + v);
    const { choices, correctIndex } = buildTextChoices(
      correct,
      [
        { display: pt(h + s, A * k + v), errorTag: 'sign_flip', note: `f(x${signedTerm(s)}) dịch đồ thị NGƯỢC chiều dấu: cộng là sang trái.` },
        { display: pt(h - s, k + v), errorTag: null, note: `Quên nhân tung độ đỉnh với ${A}.` },
        { display: pt(h - s, A * (k + v)), errorTag: 'forgot_distribute', note: `Nhân ${A} cả phần cộng thêm, trong khi ${v} nằm ngoài phép nhân.` },
        { display: pt(h + s, k + v), errorTag: null, note: 'Vừa dịch ngược chiều vừa bỏ quên hệ số co giãn.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The graph of y = f(x) in the xy-plane is a parabola with vertex (${h}, ${k}). The function g is defined by g(x) = ${A}f(x${signedTerm(s)})${signedTerm(v)}. What are the coordinates of the vertex of the graph of y = g(x)?`,
      choices,
      correctIndex,
      steps: [
        { text: `Thay x bằng x${signedTerm(s)} dịch đồ thị ${s > 0 ? 'sang trái' : 'sang phải'} ${Math.abs(s)} đơn vị.`, expr: `x = ${h} - ${par(s)} = ${h - s}` },
        { text: `Nhân với ${A} rồi cộng ${v}: tung độ đỉnh đi qua đúng hai phép ấy theo thứ tự.`, expr: `y = ${A}(${k})${signedTerm(v)} = ${A * k + v}` },
      ],
    };
  },
};

/** Hàm mũ biết hai giá trị — chia để khử a, ra cơ số, rồi lùi về f(0). */
const expFromTwoValues: MathTemplate = {
  slug: 'hard-exp-from-two-values',
  skill: 'nonlinear_functions',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const b = pick(rng, [2, 3, 4]);
    const a = pickInt(rng, 2, 12);
    const x1 = pickInt(rng, 1, b === 4 ? 2 : 3);
    const gap = b === 4 ? 2 : pickInt(rng, 2, 3);
    const x2 = x1 + gap;
    const y1 = a * b ** x1;
    const y2 = a * b ** x2;
    const name = pick(rng, ['f', 'g', 'h']);
    return {
      format: 'grid_in',
      stem: `The function ${name} is defined by ${name}(x) = a(b)^x, where a and b are positive constants. If ${name}(${x1}) = ${y1} and ${name}(${x2}) = ${y2}, what is the value of ${name}(0)?`,
      answer: rat(a),
      steps: [
        { text: 'Chia hai giá trị cho nhau để khử a.', expr: `b^${gap} = frac(${y2},${y1}) = ${b ** gap}` },
        { text: 'Cơ số dương nên lấy căn dương.', expr: `b = ${b}` },
        { text: `Giá trị tại 0 chính là a: lùi từ x = ${x1} về 0 bằng cách chia cho b mỗi bước.`, expr: `a = frac(${y1},${b ** x1}) = ${a}` },
      ],
    };
  },
};

/** Đổi đơn vị DIỆN TÍCH: một yard = 3 feet nhưng một yard vuông = 9 feet vuông. */
const ratioSquareUnits: MathTemplate = {
  slug: 'hard-ratio-square-units',
  skill: 'ratios_rates_units',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const L = 10 * pickInt(rng, 2, 8);
    const W = 5 * pickInt(rng, 2, 9);
    const r = pick(rng, [2, 4, 6, 8]);
    const sqft = 9 * L * W;
    const answer = (sqft * r) / 100;
    const { choices, correctIndex } = buildChoices(
      rat(answer),
      [
        { value: rat((L * W * r) / 100), errorTag: 'dropped_unit_conversion', note: 'Dùng thẳng yard vuông như thể là feet vuông.' },
        { value: rat((3 * L * W * r) / 100), errorTag: 'dropped_unit_conversion', note: 'Chỉ nhân 3 một lần. Diện tích có hai chiều nên phải nhân 3 × 3 = 9.' },
        { value: rat(sqft * r), errorTag: null, note: 'Quên rằng tỉ lệ là cho mỗi 100 feet vuông.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A rectangular lawn measures ${L} yards by ${W} yards. Fertilizer is applied at a rate of ${r} pounds per 100 square feet. How many pounds of fertilizer are needed for the entire lawn? (1 yard = 3 feet)`,
      choices,
      correctIndex,
      steps: [
        { text: 'Đổi từng cạnh sang feet trước, rồi mới tính diện tích.', expr: `${3 * L} × ${3 * W} = ${withCommas(sqft)}` },
        { text: `Mỗi 100 feet vuông cần ${r} pound.`, expr: `frac(${sqft},100) × ${r} = ${answer}` },
      ],
    };
  },
};

/** Tăng rồi giảm theo phần trăm, biết kết quả ròng — tìm ngược phần trăm tăng. */
const percentReverseCompound: MathTemplate = {
  slug: 'hard-percent-reverse-compound',
  skill: 'percentages',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const d = pick(rng, [10, 20, 25, 30, 40, 50, 60]);
    let x = 5 * pickInt(rng, 2, 30);
    let net = (100 + x) * (100 - d) - 10000; // phần trăm ròng × 100
    if (net === 0) {
      x += 5;
      net = (100 + x) * (100 - d) - 10000;
    }
    const thing = pick(rng, ['jacket', 'bicycle', 'laptop', 'concert ticket']);
    const netText = String(Math.abs(net) / 100);
    const direction = net > 0 ? 'greater' : 'less';
    const factor = (10000 + net) / 10000;
    return {
      format: 'grid_in',
      stem: `The price of a ${thing} was increased by x% and then the increased price was decreased by ${d}%. The final price was ${netText}% ${direction} than the original price. What is the value of x?`,
      answer: rat(x),
      steps: [
        { text: 'Hai lần thay đổi là hai phép NHÂN hệ số, không cộng trừ phần trăm.', expr: `(1 + frac(x,100))(${(100 - d) / 100}) = ${factor}` },
        { text: `Chia cho ${(100 - d) / 100}.`, expr: `1 + frac(x,100) = ${(100 + x) / 100}` },
        { text: 'Trừ 1 rồi nhân 100.', expr: `x = ${x}` },
      ],
    };
  },
};

/** Bỏ một giá trị ngoại lai — trung bình thay đổi bao nhiêu. */
const meanOutlierRemoved: MathTemplate = {
  slug: 'hard-mean-outlier-removed',
  skill: 'one_var_data',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const n = pickInt(rng, 7, 9);
    const rest = n - 1;
    const mr = pickInt(rng, 30, 50);
    const values: number[] = [];
    for (let i = 0; i + 1 < rest; i += 2) {
      const delta = pickInt(rng, 1, 12);
      values.push(mr + delta, mr - delta);
    }
    if (rest % 2 === 1) values.push(mr);
    const dd = pickInt(rng, 5, 12);
    const outlier = mr + n * dd;
    const all = [...values, outlier].sort((x, y) => x - y);
    const total = all.reduce((s, v) => s + v, 0);
    return {
      format: 'grid_in',
      stem: `A data set consists of the ${n} values ${all.join(', ')}. The value ${outlier} is an outlier. How much greater is the mean of all ${n} values than the mean of the ${rest} values that remain after the outlier is removed?`,
      answer: rat(dd),
      steps: [
        { text: `Tổng cả ${n} giá trị.`, expr: `frac(${total},${n}) = ${mr + dd}` },
        { text: `Bỏ ${outlier} ra thì còn ${rest} giá trị.`, expr: `frac(${total - outlier},${rest}) = ${mr}` },
        { text: 'Lấy hiệu hai trung bình.', expr: `${mr + dd} - ${mr} = ${dd}` },
      ],
    };
  },
};

/** Mô hình mũ có số mũ t/k — phần trăm thay đổi theo CHU KỲ k, không theo năm. */
const expModelPeriod: MathTemplate = {
  slug: 'hard-exp-model-period',
  skill: 'two_var_data',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const p = pick(rng, [4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 35]);
    const k = pick(rng, [2, 3, 4, 5, 6, 10]);
    const grow = rng() < 0.5;
    const base = grow ? (100 + p) / 100 : (100 - p) / 100;
    const A = 100 * pickInt(rng, 2, 60);
    const verb = grow ? 'increases' : 'decreases';
    const other = grow ? 'decreases' : 'increases';
    const quantity = pick(rng, ['the number of fish in a lake', 'the value of a piece of equipment', 'the population of a town', 'the amount of a medication in the bloodstream']);
    const { choices, correctIndex } = buildTextChoices(
      `The quantity ${verb} by ${p}% every ${k} years.`,
      [
        { display: `The quantity ${verb} by ${p}% every year.`, errorTag: null, note: `Bỏ qua mẫu số ${k} trong số mũ: hệ số chỉ nhân vào sau mỗi ${k} năm.` },
        { display: `The quantity ${verb} by ${100 - p}% every ${k} years.`, errorTag: 'percent_of_wrong_base', note: `Lấy nhầm phần còn lại: ${base} nghĩa là ${grow ? 'tăng' : 'giảm'} ${p}%.` },
        { display: `The quantity ${other} by ${p}% every ${k} years.`, errorTag: 'sign_flip', note: `Cơ số ${grow ? 'lớn' : 'nhỏ'} hơn 1 nghĩa là ${grow ? 'tăng' : 'giảm'}.` },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The function f(t) = ${A}(${base})^(t/${k}) models ${quantity}, where t is the number of years since the start of a study. Which statement best describes the model?`,
      choices,
      correctIndex,
      steps: [
        { text: `Số mũ tăng 1 khi t tăng ${k}, nên hệ số ${base} nhân vào sau mỗi ${k} năm.` },
        { text: `${base} = 1 ${grow ? '+' : '-'} ${p / 100}, tức là ${grow ? 'tăng' : 'giảm'} ${p}% mỗi chu kỳ.` },
      ],
    };
  },
};

/** Xác suất điều kiện NGƯỢC: biết nhóm → đặc điểm, hỏi đặc điểm → nhóm. */
const conditionalWeighted: MathTemplate = {
  slug: 'hard-conditional-weighted',
  skill: 'probability',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const N = pick(rng, [1000, 2000, 3000]);
    const a = pick(rng, [20, 25, 30, 40, 60, 75]);
    const p = 10 * pickInt(rng, 1, 7);
    const qRaw = 10 * pickInt(rng, 1, 6);
    const q = qRaw === p ? qRaw + 10 : qRaw;
    const R = (N * a) / 100;
    const S = N - R;
    const Rp = (R * p) / 100;
    const Sq = (S * q) / 100;
    const { choices, correctIndex } = buildChoices(
      rat(Rp, Rp + Sq),
      [
        { value: rat(p, 100), errorTag: null, note: 'Đây là P(bàn đứng | làm từ xa) — đề hỏi chiều ngược lại.' },
        { value: rat(Rp, N), errorTag: 'wrong_denominator', note: 'Chia cho toàn bộ nhân viên; đề chỉ chọn trong những người dùng bàn đứng.' },
        { value: rat(Rp, Sq), errorTag: 'wrong_denominator', note: 'Đây là tỉ số giữa hai nhóm, không phải xác suất.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `At a company with ${withCommas(N)} employees, ${a}% of the employees work remotely and the rest work on-site. Of the remote employees, ${p}% use a standing desk, and of the on-site employees, ${q}% use a standing desk. If an employee who uses a standing desk is selected at random, what is the probability that the employee works remotely?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Đổi phần trăm ra số người cho từng nhóm.', expr: `${R} × ${p / 100} = ${Rp}    ${S} × ${q / 100} = ${Sq}` },
        { text: 'Mẫu số là TẤT CẢ người dùng bàn đứng, tử số là phần làm từ xa trong số đó.', expr: `frac(${Rp},${Rp} + ${Sq}) = ${formatValueMath(rat(Rp, Rp + Sq))}` },
      ],
    };
  },
};

/** Sai số biên áp lên TỔNG THỂ — đổi khoảng phần trăm ra khoảng số người. */
const moePopulationCount: MathTemplate = {
  slug: 'hard-moe-population-count',
  skill: 'sample_inference',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const n = pick(rng, [200, 300, 400, 500, 800]);
    const P = 100 * pickInt(rng, 60, 300);
    const x = pickInt(rng, 20, 70);
    const m = pickInt(rng, 2, 6);
    const L = (P * (x - m)) / 100;
    const U = (P * (x + m)) / 100;
    const point = (P * x) / 100;
    const topic = pick(rng, ['support building a new library', 'ride a bicycle to work at least once a week', 'would use a community garden', 'own an electric vehicle']);
    const { choices, correctIndex } = buildTextChoices(
      `Between ${withCommas(L)} and ${withCommas(U)}`,
      [
        { display: `Exactly ${withCommas(point)}`, errorTag: 'ignored_margin_of_error' },
        { display: `Between ${withCommas((n * (x - m)) / 100)} and ${withCommas((n * (x + m)) / 100)}`, errorTag: null, note: 'Áp khoảng vào cỡ MẪU; đề hỏi số người của cả thị trấn.' },
        { display: `Between ${withCommas(point - m)} and ${withCommas(point + m)}`, errorTag: null, note: `Trừ cộng ${m} như thể là ${m} người; sai số là ${m} ĐIỂM PHẦN TRĂM.` },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A random sample of ${n} adults was selected from a town with ${withCommas(P)} adults. Of those surveyed, ${x}% said they ${topic}. The margin of error for this estimate is ${m} percentage points. Which of the following is the most plausible range for the number of adults in the town who would say they ${topic}?`,
      choices,
      correctIndex,
      steps: [
        { text: `Khoảng hợp lý cho tỉ lệ của cả thị trấn là ${x - m}% đến ${x + m}%.` },
        { text: 'Nhân hai đầu khoảng với số người lớn của thị trấn.', expr: `${withCommas(P)} × ${(x - m) / 100} = ${withCommas(L)}    ${withCommas(P)} × ${(x + m) / 100} = ${withCommas(U)}` },
      ],
    };
  },
};

/**
 * Thiết kế nghiên cứu 2 × 2: chọn mẫu ngẫu nhiên hay không, phân nhóm ngẫu
 * nhiên hay không. Bốn kết luận — mỗi kết luận đúng cho đúng một thiết kế —
 * nên người học phải đọc CẢ HAI yếu tố mới chọn được.
 */
const STUDY_SETTINGS = [
  { pop: 'adults in Riverton', treatment: 'a daily 20-minute walk', outcome: 'lower resting heart rate' },
  { pop: 'students at Lakeside College', treatment: 'a weekly study-skills workshop', outcome: 'higher exam scores' },
  { pop: 'employees of Northgate Software', treatment: 'a standing desk', outcome: 'fewer reported back problems' },
  { pop: 'tomato growers in the county', treatment: 'a new organic fertilizer', outcome: 'greater crop yield' },
  { pop: 'residents of Millbrook aged 65 or older', treatment: 'a daily vitamin D supplement', outcome: 'fewer falls' },
] as const;

function studyStatements(s: (typeof STUDY_SETTINGS)[number]) {
  return {
    both: `Using ${s.treatment} causes ${s.outcome} among ${s.pop}.`,
    assignOnly: `Using ${s.treatment} causes ${s.outcome} among the participants, but the result cannot be generalized to all ${s.pop}.`,
    sampleOnly: `Using ${s.treatment} is associated with ${s.outcome} among ${s.pop}, but a causal relationship cannot be concluded.`,
    neither: `Using ${s.treatment} is associated with ${s.outcome} among the participants, but neither causation nor generalization to all ${s.pop} is supported.`,
  };
}

const claimStudyDesign: MathTemplate = {
  slug: 'hard-claim-study-design',
  skill: 'statistical_claims',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const s = pick(rng, STUDY_SETTINGS);
    const randomSample = rng() < 0.5;
    const randomAssign = rng() < 0.5;
    const n = 20 * pickInt(rng, 5, 20);
    const st = studyStatements(s);
    const key = randomSample ? (randomAssign ? 'both' : 'sampleOnly') : randomAssign ? 'assignOnly' : 'neither';
    const NOTES: Record<keyof typeof st, string> = {
      both: 'Kết luận này cần CẢ chọn mẫu ngẫu nhiên lẫn phân nhóm ngẫu nhiên.',
      assignOnly: 'Kết luận này dành cho nghiên cứu có phân nhóm ngẫu nhiên nhưng mẫu là người tình nguyện.',
      sampleOnly: 'Kết luận này dành cho nghiên cứu có mẫu ngẫu nhiên nhưng người tham gia tự chọn nhóm.',
      neither: 'Kết luận này dành cho nghiên cứu không có yếu tố ngẫu nhiên nào.',
    };
    const others = (Object.keys(st) as (keyof typeof st)[]).filter((k) => k !== key);
    const { choices, correctIndex } = buildTextChoices(
      st[key],
      others.map((k) => ({
        display: st[k],
        // Nhãn "nhầm tương quan với nhân quả" chỉ đúng khi nhiễu kết luận nhân
        // quả mà thiết kế thật KHÔNG phân nhóm ngẫu nhiên.
        errorTag: !randomAssign && (k === 'both' || k === 'assignOnly') ? ('confused_correlation_causation' as const) : null,
        note: NOTES[k],
      })),
      rng,
    );
    const who = randomSample ? `randomly selected ${n} ${s.pop}` : `recruited ${n} ${s.pop} who volunteered`;
    const how = randomAssign
      ? `randomly assigned half of them to use ${s.treatment} and the other half not to`
      : `let each participant choose whether to use ${s.treatment}`;
    return {
      format: 'mcq',
      stem: `Researchers ${who}. The researchers ${how}. After 3 months, those who used ${s.treatment} showed significantly ${s.outcome} than those who did not. Which conclusion is best supported by the study?`,
      choices,
      correctIndex,
      steps: [
        { text: randomSample ? 'Mẫu chọn ngẫu nhiên từ tổng thể, nên suy rộng ra cả tổng thể được.' : 'Mẫu là người tình nguyện, nên KHÔNG suy rộng ra cả tổng thể.' },
        { text: randomAssign ? 'Nhóm được phân ngẫu nhiên, nên kết luận được quan hệ nhân quả.' : 'Người tham gia tự chọn nhóm, nên chỉ nói được là có liên hệ.' },
      ],
    };
  },
};

/** Phóng to bán kính, thu nhỏ chiều cao — thể tích là bao nhiêu phần trăm. */
const SCALE_COMBOS: { up: number; down: number; radiusUp: boolean; percent: ReturnType<typeof rat> }[] = [];
for (const up of [10, 20, 25, 30, 40, 50]) {
  for (const down of [10, 20, 25, 30, 40, 50, 60]) {
    for (const radiusUp of [true, false]) {
      const percent = radiusUp
        ? rat((100 + up) * (100 + up) * (100 - down), 10000)
        : rat((100 - down) * (100 - down) * (100 + up), 10000);
      if (fitsGrid(percent)) SCALE_COMBOS.push({ up, down, radiusUp, percent });
    }
  }
}

const cylinderScalePercent: MathTemplate = {
  slug: 'hard-cylinder-scale-percent',
  skill: 'area_volume',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const combo = pick(rng, SCALE_COMBOS);
    const shape = pick(rng, ['cylinder', 'cone']);
    const rChange = combo.radiusUp ? `increased by ${combo.up}%` : `decreased by ${combo.down}%`;
    const hChange = combo.radiusUp ? `decreased by ${combo.down}%` : `increased by ${combo.up}%`;
    const rFactor = combo.radiusUp ? (100 + combo.up) / 100 : (100 - combo.down) / 100;
    const hFactor = combo.radiusUp ? (100 - combo.down) / 100 : (100 + combo.up) / 100;
    const shown = combo.percent.num / combo.percent.den;
    return {
      format: 'grid_in',
      stem: `The radius of a right circular ${shape} is ${rChange}, and its height is ${hChange}. The volume of the new ${shape} is what percent of the volume of the original ${shape}?`,
      answer: combo.percent,
      steps: [
        { text: 'Thể tích tỉ lệ với BÌNH PHƯƠNG bán kính nhân chiều cao, nên hệ số của bán kính phải bình phương.', expr: `(${rFactor})^2 × ${hFactor}` },
        { text: 'Đổi hệ số ra phần trăm.', expr: `${shown}%` },
      ],
    };
  },
};

/** Tam giác đồng dạng do đường song song — diện tích tỉ lệ BÌNH PHƯƠNG. */
const similarTrapezoidArea: MathTemplate = {
  slug: 'hard-similar-trapezoid-area',
  skill: 'lines_angles_triangles',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const a = pickInt(rng, 2, 5);
    const b = pickInt(rng, 1, 6);
    const k = pickInt(rng, 1, 6);
    const X = a * a * k;
    const big = (a + b) * (a + b) * k;
    return {
      format: 'grid_in',
      stem: `In triangle ABC, point D lies on side AB and point E lies on side AC so that segment DE is parallel to side BC. If AD = ${a}, DB = ${b}, and the area of triangle ADE is ${X}, what is the area of quadrilateral DBCE?`,
      answer: rat(big - X),
      steps: [
        { text: 'DE song song BC nên tam giác ADE đồng dạng tam giác ABC, tỉ số cạnh là AD : AB.', expr: `frac(AB,AD) = frac(${a + b},${a})` },
        { text: 'Diện tích tỉ lệ với BÌNH PHƯƠNG tỉ số cạnh.', expr: `${X} × (frac(${a + b},${a}))^2 = ${big}` },
        { text: 'Tứ giác là phần còn lại của tam giác lớn.', expr: `${big} - ${X} = ${big - X}` },
      ],
    };
  },
};

/** Hai tam giác vuông đồng dạng — chuyển tỉ số lượng giác qua góc tương ứng. */
const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
  [12, 35, 37],
  [11, 60, 61],
];

type TrigFn = 'sin' | 'cos' | 'tan';

/** Giá trị tỉ số lượng giác của góc thứ nhất (đối o, kề a, huyền h) hoặc góc phụ của nó. */
function trigValue(fn: TrigFn, angle: 'first' | 'second', o: number, a: number, h: number) {
  const opp = angle === 'first' ? o : a;
  const adj = angle === 'first' ? a : o;
  return fn === 'sin' ? rat(opp, h) : fn === 'cos' ? rat(adj, h) : rat(opp, adj);
}

const LETTERS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['P', 'Q', 'R', 'S', 'T', 'U'],
  ['J', 'K', 'L', 'X', 'Y', 'Z'],
] as const;

const trigSimilarTransfer: MathTemplate = {
  slug: 'hard-trig-similar-transfer',
  skill: 'right_triangles_trig',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const [l1, l2, h] = pick(rng, TRIPLES);
    const swap = rng() < 0.5;
    const o = swap ? l2 : l1;
    const a = swap ? l1 : l2;
    const [A, B, C, D, E, F] = pick(rng, LETTERS);
    const given = pick(rng, ['sin', 'cos', 'tan'] as const);
    const asked = pick(rng, ['sin', 'cos', 'tan'] as const);
    const other: TrigFn = asked === 'tan' ? 'sin' : 'tan';
    const correct = trigValue(asked, 'second', o, a, h);
    const g = trigValue(given, 'first', o, a, h);
    const { choices, correctIndex } = buildChoices(
      correct,
      [
        { value: trigValue(asked, 'first', o, a, h), errorTag: 'used_wrong_trig_ratio', note: `Đây là ${asked} ${A}. Góc ${E} ứng với góc ${B}, không phải góc ${A}.` },
        { value: rat(correct.den, correct.num), errorTag: 'inverted_fraction' },
        { value: trigValue(other, 'second', o, a, h), errorTag: 'used_wrong_trig_ratio', note: `Đây là ${other} ${E}, không phải ${asked} ${E}.` },
      ],
      rng,
    );
    const sideOf: Record<TrigFn, string> = { sin: 'đối / huyền', cos: 'kề / huyền', tan: 'đối / kề' };
    return {
      format: 'mcq',
      stem: `Triangles ${A}${B}${C} and ${D}${E}${F} are similar, with vertices ${A}, ${B}, and ${C} corresponding to vertices ${D}, ${E}, and ${F}, respectively. Angles ${C} and ${F} are right angles. If ${given} ${A} = frac(${g.num},${g.den}), what is the value of ${asked} ${E}?`,
      choices,
      correctIndex,
      steps: [
        { text: `${given} ${A} = ${sideOf[given]}. Dựng tam giác có cạnh đối góc ${A} là ${o}, cạnh kề là ${a}, cạnh huyền là ${h}.`, expr: `${o}^2 + ${a}^2 = ${h}^2` },
        { text: `Đồng dạng giữ nguyên góc: góc ${E} bằng góc ${B}. Cạnh đối của góc ${B} là cạnh kề của góc ${A}.`, expr: `${asked} ${E} = ${asked} ${B} = ${formatValueMath(correct)}` },
      ],
    };
  },
};

/** Phương trình đường tròn khai triển, biết bán kính — tìm hằng số. */
const circleConstantFromRadius: MathTemplate = {
  slug: 'hard-circle-constant-from-radius',
  skill: 'circles',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const h = pickNonZeroInt(rng, -9, 9);
    const k = pickNonZeroInt(rng, -9, 9);
    const r = pickInt(rng, 2, 12);
    const c = h * h + k * k - r * r;
    return {
      format: 'grid_in',
      stem: `In the xy-plane, the graph of x^2${signedTerm(-2 * h)}x + y^2${signedTerm(-2 * k)}y + c = 0, where c is a constant, is a circle with radius ${r}. What is the value of c?`,
      answer: rat(c),
      steps: [
        { text: 'Hoàn thành bình phương cho x và cho y: lấy nửa hệ số rồi bình phương.', expr: `(x${signedTerm(-h)})^2 + (y${signedTerm(-k)})^2 = ${h * h + k * k} - c` },
        { text: 'Vế phải là bình phương bán kính.', expr: `${h * h + k * k} - c = ${r * r}` },
        { text: 'Giải ra c.', expr: `c = ${c}` },
      ],
    };
  },
};

export const HARD_TEMPLATES: readonly MathTemplate[] = [
  linTwoFractions,
  twoVarParamSlope,
  linFnShift,
  systemNoSolutionProduct,
  inequalityCompoundCount,
  rationalDivision,
  quadTangentLine,
  quadNoRealCondition,
  transformVertex,
  expFromTwoValues,
  ratioSquareUnits,
  percentReverseCompound,
  meanOutlierRemoved,
  expModelPeriod,
  conditionalWeighted,
  moePopulationCount,
  claimStudyDesign,
  cylinderScalePercent,
  similarTrapezoidArea,
  trigSimilarTransfer,
  circleConstantFromRadius,
];

// ======================================================================
// BẬC DỄ — những kỹ năng trước đây không có câu khởi động nào
// ======================================================================

const systemSumDiff: MathTemplate = {
  slug: 'easy-system-sum-diff',
  skill: 'systems_linear_two_var',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const x = pickInt(rng, 1, 20);
    const y = pickNonZeroInt(rng, -10, 15);
    const s = x + y;
    const d = x - y;
    return {
      format: 'grid_in',
      stem: `If x + y = ${s} and x - y = ${d}, what is the value of x?`,
      answer: rat(x),
      steps: [
        { text: 'Cộng hai phương trình: y triệt tiêu.', expr: `2x = ${s + d}` },
        { text: 'Chia hai vế cho 2.', expr: `x = ${x}` },
      ],
    };
  },
};

const inequalityWhichValue: MathTemplate = {
  slug: 'easy-ineq-which-value',
  skill: 'linear_inequalities',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 6);
    const B = pickInt(rng, -5, 10);
    const b = pickNonZeroInt(rng, -12, 12);
    const c = a * B + b;
    const correct = B + pickInt(rng, 1, 4);
    const { choices, correctIndex } = buildChoices(
      rat(correct),
      [
        { value: rat(B), errorTag: 'off_by_one', note: `Tại x = ${B} hai vế bằng nhau, mà dấu là > nên không nhận.` },
        { value: rat(B - 2), errorTag: null, note: 'Thế vào thì vế trái nhỏ hơn vế phải.' },
        { value: rat(B - 4), errorTag: null, note: 'Thế vào thì vế trái nhỏ hơn vế phải.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Which of the following values of x satisfies ${linearSide(a, b)} > ${c}?`,
      choices,
      correctIndex,
      steps: [
        { text: `${b > 0 ? 'Trừ' : 'Cộng'} ${Math.abs(b)} ở hai vế.`, expr: `${a}x > ${a * B}` },
        { text: `Chia cho ${a} (số dương, giữ chiều).`, expr: `x > ${B}` },
        { text: `Chỉ ${correct} lớn hơn ${B}.` },
      ],
    };
  },
};

const quadFactoredRoot: MathTemplate = {
  slug: 'easy-quad-factored-root',
  skill: 'nonlinear_equations',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const p = pickInt(rng, 1, 15);
    const q = pickInt(rng, 1, 15);
    return {
      format: 'grid_in',
      stem: `What is the positive solution to the equation (x - ${p})(x + ${q}) = 0?`,
      answer: rat(p),
      steps: [
        { text: 'Tích bằng 0 khi một thừa số bằng 0.', expr: `x = ${p}  or  x = ${-q}` },
        { text: 'Lấy nghiệm dương.', expr: `x = ${p}` },
      ],
    };
  },
};

const lineFitPredictInt: MathTemplate = {
  slug: 'easy-line-fit-predict-int',
  skill: 'two_var_data',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const m = pickInt(rng, 2, 9);
    const b = pickInt(rng, 1, 30);
    const p = pickInt(rng, 2, 12);
    const { choices, correctIndex } = buildChoices(
      rat(m * p + b),
      [
        { value: rat(b * p + m), errorTag: 'swapped_slope_intercept' },
        { value: rat(m * p), errorTag: 'stopped_too_early', note: 'Quên cộng tung độ gốc.' },
        { value: rat(m * p - b), errorTag: 'sign_flip' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A line of best fit for a data set is y = ${m}x + ${b}. Based on the line of best fit, what is the predicted value of y when x = ${p}?`,
      choices,
      correctIndex,
      steps: [{ text: `Thay x = ${p} vào phương trình đường thẳng.`, expr: `y = ${m}(${p}) + ${b} = ${m * p + b}` }],
    };
  },
};

const GENERALIZE = [
  { sample: 'students at Westfield High School', all: 'all students at Westfield High School', wider: ['all high school students in the state', 'all teenagers in the country', 'all teachers at Westfield High School'] },
  { sample: 'customers of the city library', all: 'all customers of the city library', wider: ['all residents of the city', 'all library users in the country', 'all bookstore customers in the city'] },
  { sample: 'nurses at Mercy Hospital', all: 'all nurses at Mercy Hospital', wider: ['all hospital employees in the state', 'all nurses in the country', 'all patients at Mercy Hospital'] },
  { sample: 'members of the regional cycling club', all: 'all members of the regional cycling club', wider: ['all cyclists in the country', 'all adults in the region', 'all members of sports clubs in the region'] },
] as const;

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const claimGeneralize: MathTemplate = {
  slug: 'easy-claim-generalize',
  skill: 'statistical_claims',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const g = pick(rng, GENERALIZE);
    const n = 10 * pickInt(rng, 8, 40);
    const { choices, correctIndex } = buildTextChoices(
      cap(g.all),
      g.wider.map((w) => ({ display: cap(w), errorTag: null, note: `Mẫu chỉ rút từ ${g.sample}, nên không suy rộng ra nhóm này.` })),
      rng,
    );
    return {
      format: 'mcq',
      stem: `A survey was given to a random sample of ${n} ${g.sample}. To which of the following groups can the results of the survey most appropriately be generalized?`,
      choices,
      correctIndex,
      steps: [{ text: 'Kết quả của một mẫu ngẫu nhiên chỉ suy rộng được cho đúng tổng thể mà mẫu được rút ra.' }],
    };
  },
};

const circleRadiusFromEquation: MathTemplate = {
  slug: 'easy-circle-radius-from-equation',
  skill: 'circles',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const h = pickNonZeroInt(rng, -9, 9);
    const k = pickNonZeroInt(rng, -9, 9);
    const r = pickInt(rng, 3, 12);
    const { choices, correctIndex } = buildChoices(
      rat(r),
      [
        { value: rat(r * r), errorTag: 'forgot_square_root' },
        { value: rat(2 * r), errorTag: 'used_diameter_not_radius', note: 'Đây là đường kính.' },
        { value: rat(r * r, 2), errorTag: null, note: 'Chia đôi vế phải thay vì khai căn.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A circle in the xy-plane has equation (x${signedTerm(-h)})^2 + (y${signedTerm(-k)})^2 = ${r * r}. What is the radius of the circle?`,
      choices,
      correctIndex,
      steps: [{ text: 'Vế phải là bình phương bán kính. Khai căn.', expr: `r = sqrt(${r * r}) = ${r}` }],
    };
  },
};

export const EASY_TEMPLATES: readonly MathTemplate[] = [
  systemSumDiff,
  inequalityWhichValue,
  quadFactoredRoot,
  lineFitPredictInt,
  claimGeneralize,
  circleRadiusFromEquation,
];
