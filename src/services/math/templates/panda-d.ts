import { buildChoices, buildTextChoices } from '../choices';
import { coefTerm, linearSide, pick, pickInt, pickNonZeroInt, quadraticSide, signedCoefTerm, signedTerm } from '../authoring';
import { addValue, divValue, equalsValue, formatValueMath, mulValue, rat, subValue, toDecimal } from '@/lib/math/value';
import type {
  MathChoice,
  MathDifficulty,
  MathErrorTag,
  MathFigureSpec,
  MathSkill,
  MathSolutionStep,
  MathTemplate,
  MathValue,
} from '@/lib/math/types';

/**
 * Bộ dạng câu "pd-" phần D — dạng bài BÁM SÁCH cho Lộ trình SAT Math
 * (`/sat/lo-trinh`), chương 14 – 27.
 *
 * Mỗi template ứng với MỘT kiểu bài tập cuối chương của giáo trình: cùng dữ
 * kiện được cho, cùng câu hỏi, cùng bước biến đổi và cùng cái bẫy — nhưng số,
 * tên và bối cảnh đều do template tự sinh. Không chép câu chữ, số liệu hay bối
 * cảnh nào của sách (xem ghi chú bản quyền ở `src/data/sat-roadmap/types.ts`).
 *
 * Hình trong sách mà bốn loại hình của app (tam giác vuông, bảng, đồ thị điểm,
 * hai đường song song) không vẽ được thì tả ĐỦ bằng lời, hoặc chuyển thành
 * bảng số, để vẫn kiểm đúng kỹ năng đó.
 *
 * Nguyên tắc như các đợt trước: CHỌN ĐÁP ÁN TRƯỚC rồi dựng tham số ngược, không
 * vòng thử lại; mỗi nhiễu dựng từ một sai lầm có tên (hoặc `errorTag: null` kèm
 * ghi chú nói rõ cái sai). Lời giải tiếng Việt, không để markup toán lọt vào
 * phần lời. Bộ kiểm chứng: `panda-d.test.ts`.
 */

// ------------------------------------------------------------ tiện ích chung

type Tag = MathErrorTag | null;
type Step = MathSolutionStep;
type NumDist = { value: MathValue; errorTag: Tag; note?: string };
type TxtDist = { display: string; errorTag: Tag; note?: string };
type Rng = () => number;

type McqBody = { stem: string; figure?: MathFigureSpec; choices: MathChoice[]; correctIndex: number; steps: Step[] };
type GridBody = { stem: string; figure?: MathFigureSpec; answer: MathValue; steps: Step[] };

function mcqT(slug: string, skill: MathSkill, difficulty: MathDifficulty, build: (rng: Rng) => McqBody): MathTemplate {
  return { slug, skill, difficulty, format: 'mcq', build: (rng) => ({ format: 'mcq', ...build(rng) }) };
}

function gridT(slug: string, skill: MathSkill, difficulty: MathDifficulty, build: (rng: Rng) => GridBody): MathTemplate {
  return { slug, skill, difficulty, format: 'grid_in', build: (rng) => ({ format: 'grid_in', ...build(rng) }) };
}

const S = (text: string, expr?: string): Step => (expr === undefined ? { text } : { text, expr });
const R = (v: MathValue | number): MathValue => (typeof v === 'number' ? rat(v) : v);
const nd = (value: MathValue | number, errorTag: Tag, note: string): NumDist => ({ value: R(value), errorTag, note });
const td = (display: string, errorTag: Tag, note: string): TxtDist => ({ display, errorTag, note });

function numMcq(correct: MathValue | number, dists: NumDist[], rng: Rng, format?: (v: MathValue) => string) {
  return buildChoices(R(correct), dists, rng, format);
}

function textMcq(correct: string, dists: TxtDist[], rng: Rng) {
  return buildTextChoices(correct, dists, rng);
}

const fx = formatValueMath;
/** Số âm trong phép tính ở lời giải phải có ngoặc. */
const par = (n: number) => (n < 0 ? `(${n})` : String(n));

/** Viết đa thức từ dãy hệ số (bậc cao nhất trước), bỏ số hạng 0 và hệ số 1. */
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

/** `(x - 3)`, `(x + 2)`, `x`. */
const xMinus = (a: number, v = 'x') => (a === 0 ? v : `(${v}${signedTerm(-a)})`);

/** Hệ số đứng trước một ngoặc: 1 → "", -1 → "-", 3 → "3". */
const lead = (a: number) => (a === 1 ? '' : a === -1 ? '-' : String(a));

/**
 * k·π dạng markup: π, 3π, frac(3π,2), -frac(π,4). Viết thẳng ký tự π: từ khoá
 * `pi` của markup chỉ đổi khi đứng riêng một từ, nên "3pi" sẽ hiện nguyên chữ.
 */
function piText(c: MathValue): string {
  const sign = c.num < 0 ? '-' : '';
  const n = Math.abs(c.num);
  const top = n === 1 ? 'π' : `${n}π`;
  return c.den === 1 ? `${sign}${top}` : `${sign}frac(${top},${c.den})`;
}

/** k·√n dạng markup: 3sqrt(2), sqrt(5), frac(3sqrt(2),2). n = 1 thì chỉ còn số. */
function radText(k: MathValue, n: number): string {
  if (n === 1) return fx(k);
  const sign = k.num < 0 ? '-' : '';
  const a = Math.abs(k.num);
  const top = a === 1 ? `sqrt(${n})` : `${a}sqrt(${n})`;
  return k.den === 1 ? `${sign}${top}` : `${sign}frac(${top},${k.den})`;
}

/** Tách k·√n: √72 = 6√2. */
function simplifyRoot(n: number): { out: number; inside: number } {
  let out = 1;
  let inside = n;
  for (let f = 2; f * f <= inside; f += 1) {
    while (inside % (f * f) === 0) {
      out *= f;
      inside /= f * f;
    }
  }
  return { out, inside };
}

/** Số thập phân hữu hạn viết gọn (1.5, 0.25, 12). */
function decText(v: MathValue): string {
  const d = toDecimal(v);
  return String(Math.round(d * 1e6) / 1e6);
}


function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

function shuffleCopy<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Bốc `k` phần tử khác nhau từ mảng, không thử lại. */
function sample<T>(rng: Rng, items: readonly T[], k: number): T[] {
  return shuffleCopy(items, rng).slice(0, k);
}

const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// ---------------------------------------------------- lựa chọn kiểu I, II, III

const ROMAN = ['I', 'II', 'III'] as const;

/** "I only", "I and III only", "I, II, and III", "None". */
function romanLabel(set: readonly boolean[]): string {
  const on = ROMAN.filter((_, i) => set[i]);
  if (on.length === 0) return 'None';
  if (on.length === 1) return `${on[0]} only`;
  if (on.length === 2) return `${on[0]} and ${on[1]} only`;
  return 'I, II, and III';
}

const ALL_ROMAN_SETS: boolean[][] = [1, 2, 3, 4, 5, 6, 7].map((m) => [!!(m & 1), !!(m & 2), !!(m & 4)]);

/**
 * Bốn lựa chọn I/II/III: đáp án đúng + ba tổ hợp khác. Ghi chú của mỗi nhiễu
 * gọi đúng tên mệnh đề đã bị đánh giá sai.
 */
function romanMcq(truth: readonly boolean[], rng: Rng) {
  const correct = romanLabel(truth);
  const others = shuffleCopy(ALL_ROMAN_SETS, rng).filter((s) => romanLabel(s) !== correct);
  const dists = others.map((s) => {
    const wrong = ROMAN.filter((_, i) => s[i] !== truth[i]);
    return td(romanLabel(s), null, `Đánh giá sai mệnh đề ${wrong.join(', ')}.`);
  });
  return textMcq(correct, dists, rng);
}

/** Bảng hai cột x | f(x) (hoặc nhiều cột hàm). */
function fnTable(xs: readonly number[], cols: Array<{ name: string; ys: readonly (number | string)[] }>, caption: string): MathFigureSpec {
  return {
    kind: 'data_table',
    caption,
    columns: ['x', ...cols.map((c) => c.name)],
    rows: xs.map((x, i) => ({ label: String(x), cells: cols.map((c) => c.ys[i]!) })),
  };
}

const NAMES = ['Mai', 'Linh', 'Tuan', 'Khoa', 'Hanh', 'Minh', 'Lan', 'Nam', 'Vy', 'Quan', 'Thao', 'Duc'] as const;


/** √N rút gọn, nhân thêm hệ số k: rootText(12) = 2sqrt(3), rootText(8, 3) = 6sqrt(2). */
function rootText(N: number, k = 1): string {
  const { out, inside } = simplifyRoot(N);
  return radText(rat(k * out), inside);
}

/** Hệ số hữu tỉ nhân biến: 3x, -x, frac(2,3)x. */
function vx(v: MathValue, name = 'x'): string {
  return v.den === 1 ? coefTerm(v.num, name) : `${fx(v)}${name}`;
}

/**
 * Trắc nghiệm đáp số thập phân làm tròn (0.315, 37.5%): chống trùng theo CHUỖI
 * hiển thị, vì hai giá trị khác nhau vẫn có thể làm tròn ra cùng một chuỗi.
 */
function decMcq(correct: MathValue, dists: NumDist[], rng: Rng, places: number, percent = false) {
  const show = (x: number) => (percent ? `${(x * 100).toFixed(places)}%` : x.toFixed(places));
  const c = toDecimal(correct);
  const txt: TxtDist[] = dists.map((d) => ({ display: show(toDecimal(d.value)), errorTag: d.errorTag, note: d.note }));
  const unit = (percent ? 0.01 : 1) * 10 ** -places;
  for (const k of [7, -7, 13, -13, 23]) {
    const x = c + k * unit;
    if (x > 0) txt.push({ display: show(x), errorTag: null, note: 'Không có cách hiểu sai nào dẫn tới đúng số này — nó chỉ nằm cạnh đáp án.' });
  }
  return textMcq(show(c), txt, rng);
}

// ================================================================ Chương 14 — Hàm số

/** Bảng ba điểm → công thức nào khớp. Nhiễu đắt nhất: công thức chỉ khớp HAI điểm đầu. */
const fnTableFormula = mcqT('pd-d-fn-table-formula', 'nonlinear_functions', 'easy', (rng) => {
  const x0 = pickInt(rng, -1, 2);
  const xs = [x0, x0 + 1, x0 + 2];
  const quad = rng() < 0.5;
  const A = quad ? pickNonZeroInt(rng, -3, 3) : 0;
  const B = quad ? 0 : pickNonZeroInt(rng, -5, 5);
  const C = pickNonZeroInt(rng, -9, 9);
  const coefs = [A, B, C];
  const ys = xs.map((x) => evalPoly(coefs, x));
  const show = (c: number[]) => `f(x) = ${polyText(c)}`;
  const slope = ys[1]! - ys[0]!;
  const line2 = [0, slope, ys[0]! - slope * x0];
  const quad2 = [1, B - (xs[0]! + xs[1]!), C + xs[0]! * xs[1]!];
  const dists = quad
    ? [
        td(show(line2), null, 'Công thức này chỉ khớp hai điểm đầu. Phải thử CẢ BA điểm của bảng.'),
        td(show([0, A, C]), null, `Viết nhầm ${A}x² thành ${A}x — thử x = ${xs[2]} là lộ ngay.`),
        td(show([A, 0, -C]), 'sign_flip', 'Hằng số sai dấu: thay x = 0 (hoặc điểm đầu) để kiểm.'),
        td(show([-A, 0, C]), 'sign_flip', 'Hệ số của x² sai dấu.'),
      ]
    : [
        td(show(quad2), null, 'Công thức này khớp hai điểm đầu nhưng lệch ở điểm thứ ba.'),
        td(show([0, C, B]), 'swapped_slope_intercept', 'Đảo hệ số góc với tung độ gốc.'),
        td(show([0, B, -C]), 'sign_flip', 'Hằng số sai dấu.'),
        td(show([0, -B, C]), 'sign_flip', 'Hệ số góc sai dấu.'),
      ];
  const { choices, correctIndex } = textMcq(show(coefs), dists, rng);
  return {
    stem: 'The table shows three values of the function f. Which of the following could define f?',
    figure: fnTable(xs, [{ name: 'f(x)', ys }], 'Values of f'),
    choices,
    correctIndex,
    steps: [
      S('Cách nhanh nhất: thay từng giá trị x của bảng vào mỗi lựa chọn. Lựa chọn đúng phải khớp CẢ BA hàng.'),
      S(`Với công thức đúng, x = ${xs[2]} cho đúng ${ys[2]}.`, `${show(coefs)}   ⇒   f(${xs[2]}) = ${ys[2]}`),
    ],
  };
});

/** f(x) = g(x) có bao nhiêu nghiệm = đồ thị cắt nhau mấy điểm. */
const fnIntersectionCount = mcqT('pd-d-fn-intersection-count', 'nonlinear_functions', 'medium', (rng) => {
  const target = pickInt(rng, 0, 2);
  const t = pickNonZeroInt(rng, -4, 4);
  const s = pickInt(rng, 1, 4);
  const p = 2 * t;
  const q = target === 1 ? t * t : target === 2 ? t * t - s * s : t * t + s;
  const m = pickNonZeroInt(rng, -4, 4);
  const k = pickInt(rng, -6, 6);
  const b = p + m;
  const c = q + k;
  const D = p * p - 4 * q;
  const { choices, correctIndex } = numMcq(
    target,
    [0, 1, 2, 3]
      .filter((v) => v !== target)
      .map((v) =>
        nd(v, v === 3 ? null : 'dropped_a_solution', v === 3 ? 'Một parabol và một đường thẳng cắt nhau nhiều nhất 2 điểm.' : 'Đếm sai số giao điểm — xét dấu biệt thức của phương trình f(x) = g(x).'),
      ),
    rng,
  );
  return {
    stem: `The functions f and g are defined by f(x) = ${quadraticSide(1, b, c)} and g(x) = ${linearSide(m, k)}. For how many values of x does f(x) = g(x)?`,
    choices,
    correctIndex,
    steps: [
      S('Số nghiệm của f(x) = g(x) chính là số giao điểm của hai đồ thị. Chuyển hết về một vế.', `${quadraticSide(1, p, q)} = 0`),
      S('Xét biệt thức.', `Δ = ${par(p)}^2 - 4(${q}) = ${D}`),
      S(D > 0 ? 'Biệt thức dương: hai giao điểm.' : D === 0 ? 'Biệt thức bằng 0: một giao điểm (tiếp xúc).' : 'Biệt thức âm: không giao điểm nào.', `số nghiệm = ${target}`),
    ],
  };
});

/** Hàm cho bằng các đoạn thẳng nối những điểm trong bảng. */
function piecewise(rng: Rng, n: number, lo: number, hi: number) {
  const x0 = pickInt(rng, -4, -1);
  const xs = range(x0, x0 + n - 1);
  const ys: number[] = [];
  for (let i = 0; i < n; i += 1) {
    // Hai đỉnh liền nhau không bao giờ bằng nhau: không có đoạn nằm ngang.
    const prev = ys[i - 1];
    let y = pickInt(rng, lo, hi - 1);
    if (prev !== undefined && y >= prev) y += 1;
    ys.push(y);
  }
  return { xs, ys };
}

function levelCount(ys: readonly number[], k: number): number {
  let count = 0;
  ys.forEach((y, i) => {
    if (y === k) count += 1;
    const next = ys[i + 1];
    if (next !== undefined && (y - k) * (next - k) < 0) count += 1;
  });
  return count;
}

const PIECEWISE_NOTE = 'The graph of y = f(x) consists of line segments that connect the points in the table, in order from left to right.';

const fnPiecewiseEqual = mcqT('pd-d-fn-piecewise-equal', 'nonlinear_functions', 'easy', (rng) => {
  const x0 = pickInt(rng, -4, -1);
  const xs = range(x0, x0 + 5);
  const vals = shuffleCopy(range(-6, 6), rng).slice(0, 6);
  const ti = pickInt(rng, 0, 5);
  const far = range(0, 5).filter((i) => Math.abs(i - ti) >= 2);
  const ai = pick(rng, far);
  vals[ai] = vals[ti]!;
  const others = sample(rng, range(0, 5).filter((i) => i !== ti && i !== ai), 3);
  const t = xs[ti]!;
  const { choices, correctIndex } = numMcq(
    xs[ai]!,
    others.map((i) => nd(xs[i]!, null, `f(${xs[i]}) = ${vals[i]}, không bằng f(${t}) = ${vals[ti]}.`)),
    rng,
  );
  return {
    stem: `The table shows several points on the graph of the function f. ${PIECEWISE_NOTE} If f(a) = f(${t}) and a != ${t}, which of the following could be the value of a?`,
    figure: fnTable(xs, [{ name: 'f(x)', ys: vals }], 'Points on the graph of f'),
    choices,
    correctIndex,
    steps: [
      S(`Đọc giá trị của f tại x = ${t}.`, `f(${t}) = ${vals[ti]}`),
      S('Tìm trong các lựa chọn giá trị x khác có cùng tung độ đó.', `f(${xs[ai]}) = ${vals[ai]}`),
    ],
  };
});

function levelCountBody(rng: Rng, useY0: boolean) {
  const { xs, ys } = piecewise(rng, 7, -5, 5);
  const zeroIndex = xs.indexOf(0);
  const k = useY0 && zeroIndex >= 0 ? ys[zeroIndex]! : pickInt(rng, -3, 3);
  const count = levelCount(ys, k);
  const ask = useY0 ? `f(x) = f(0)` : `f(x) = ${k}`;
  return {
    xs,
    ys,
    k,
    count,
    stem: `The table shows several points on the graph of the function f, defined for ${xs[0]} <= x <= ${xs[xs.length - 1]}. ${PIECEWISE_NOTE} How many values of x satisfy ${ask}?`,
    steps: [
      S(useY0 ? `f(0) = ${k}, nên đếm số lần đồ thị chạm đường nằm ngang y = ${k}.` : `Số nghiệm của f(x) = ${k} là số giao điểm của đồ thị với đường nằm ngang y = ${k}.`),
      S('Đi qua từng đoạn: đoạn nào có hai đầu nằm hai phía của đường ấy thì cắt một lần; đỉnh nằm đúng trên đường thì tính một lần.', `số nghiệm = ${count}`),
    ],
  };
}

const fnLevelCount = mcqT('pd-d-fn-level-count', 'nonlinear_functions', 'medium', (rng) => {
  const b = levelCountBody(rng, false);
  const { choices, correctIndex } = numMcq(
    b.count,
    [
      nd(b.ys.filter((y) => y === b.k).length, null, 'Chỉ đếm những ĐỈNH nằm đúng độ cao đó, bỏ sót chỗ đồ thị cắt ngang giữa một đoạn.'),
      nd(b.count + 1, 'off_by_one', 'Đếm trùng một đỉnh nằm trên đường nằm ngang (tính cho cả hai đoạn chung đỉnh).'),
      nd(b.count - 1, 'off_by_one', 'Bỏ sót một giao điểm.'),
    ],
    rng,
  );
  return { stem: b.stem, figure: fnTable(b.xs, [{ name: 'f(x)', ys: b.ys }], 'Points on the graph of f'), choices, correctIndex, steps: b.steps };
});

const fnLevelCountGrid = gridT('pd-d-fn-level-count-grid', 'nonlinear_functions', 'hard', (rng) => {
  const b = levelCountBody(rng, true);
  return { stem: b.stem, figure: fnTable(b.xs, [{ name: 'f(x)', ys: b.ys }], 'Points on the graph of f'), answer: rat(b.count), steps: b.steps };
});

/** Hàm nào có f(-c) = f(c)? Chỉ hàm chẵn (không có số hạng bậc lẻ). */
const fnEvenCheck = mcqT('pd-d-fn-even-check', 'nonlinear_functions', 'medium', (rng) => {
  const c = pickInt(rng, 2, 5);
  const a = pickNonZeroInt(rng, -3, 3);
  const k = pickInt(rng, -9, 9);
  const b = pickNonZeroInt(rng, -4, 4);
  const h = pickNonZeroInt(rng, -3, 3);
  const show = (coefs: number[]) => `f(x) = ${polyText(coefs)}`;
  const correct = show([a, 0, k]);
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(show([a, b, k]), null, `Số hạng bậc một ${b}x đổi dấu khi thay c bằng âm c, nên hai giá trị lệch nhau.`),
      td(show([1, 0, 0, k]), null, 'Luỹ thừa bậc ba giữ nguyên dấu của biến: (âm c) mũ 3 là âm.'),
      td(show([a, k]), null, 'Hàm bậc nhất: giá trị tại c và âm c khác nhau.'),
      td(show([1, -2 * h, h * h]), null, 'Đây là bình phương của (x − h): đỉnh không nằm trên trục tung nên không đối xứng qua trục tung.'),
    ],
    rng,
  );
  return {
    stem: `For which of the following functions is f(-${c}) = f(${c})?`,
    choices,
    correctIndex,
    steps: [
      S('Thay lần lượt x = c và x = âm c vào từng lựa chọn. Số hạng bậc lẻ đổi dấu, số hạng bậc chẵn thì không.'),
      S('Chỉ hàm không có số hạng bậc lẻ mới cho hai giá trị bằng nhau.', `f(-${c}) = ${a * c * c + k} = f(${c})`),
    ],
  };
});

/** g(x) = f(px) + q: tính trong ngoặc trước, đưa vào f, rồi mới cộng. */
const fnInnerScale = gridT('pd-d-fn-inner-scale', 'nonlinear_functions', 'medium', (rng) => {
  const a = pickNonZeroInt(rng, -3, 3);
  const b = pickInt(rng, -6, 6);
  const c = pickInt(rng, -9, 9);
  const p = pickInt(rng, 2, 3);
  const q = pickNonZeroInt(rng, -9, 9);
  const k = pickNonZeroInt(rng, -3, 3);
  const inner = p * k;
  const f = evalPoly([a, b, c], inner);
  return {
    stem: `The function f is defined by f(x) = ${quadraticSide(a, b, c)}. The function g is defined by g(x) = f(${p}x)${signedTerm(q)}. What is the value of g(${k})?`,
    answer: rat(f + q),
    steps: [
      S(`g(${k}) nghĩa là thay x = ${k} vào ${p}x trước.`, `g(${k}) = f(${p} × ${par(k)}) ${q < 0 ? '-' : '+'} ${Math.abs(q)} = f(${inner})${signedTerm(q)}`),
      S(`Tính f tại ${inner}.`, `f(${inner}) = ${f}`),
      S('Cộng phần bên ngoài.', `g(${k}) = ${f + q}`),
    ],
  };
});

/** Tính hàm phân thức tại một số âm — ngoặc là chỗ hay sai. */
const fnEvalRational = mcqT('pd-d-fn-eval-rational', 'nonlinear_functions', 'easy', (rng) => {
  const p = pickNonZeroInt(rng, -5, 5);
  const q = pickInt(rng, -9, 9);
  const r = pickInt(rng, 1, 9);
  const k = pickInt(rng, 1, 4);
  const num = p * -k + q;
  const den = k * k + r;
  const dists = [
    nd(rat(p * k + q, den), 'sign_flip', `Thay x = ${k} thay vì x = −${k}.`),
    r !== k * k ? nd(rat(num, r - k * k), 'sign_flip', `Bình phương số âm mà giữ dấu âm: (−${k})² = ${k * k}, không phải −${k * k}.`) : null,
    nd(rat(-num, den), 'sign_flip', 'Tử số sai dấu.'),
  ].filter((d): d is NumDist => d !== null);
  const { choices, correctIndex } = numMcq(rat(num, den), dists, rng);
  return {
    stem: `The function f is defined by f(x) = frac(${linearSide(p, q)},x^2 + ${r}). What is the value of f(-${k})?`,
    choices,
    correctIndex,
    steps: [
      S('Thay x bằng −k, đặt trong ngoặc ở MỌI chỗ có x.', `f(-${k}) = frac(${p}(-${k})${signedTerm(q)},(-${k})^2 + ${r})`),
      S('Tính tử và mẫu rồi rút gọn nếu được.', gcd(num, den) > 1 ? `frac(${num},${den}) = ${fx(rat(num, den))}` : `f(-${k}) = ${fx(rat(num, den))}`),
    ],
  };
});

/** f(x) = ax² + b qua hai điểm của bảng → tìm a, b rồi tính f(k). */
const fnTableAx2b = mcqT('pd-d-fn-table-ax2b', 'nonlinear_functions', 'medium', (rng) => {
  const a = pickNonZeroInt(rng, -4, 4);
  const b = pickInt(rng, -9, 9);
  const x1 = pickInt(rng, 0, 1);
  const x2 = pickInt(rng, 2, 3);
  const k = pickInt(rng, 4, 5);
  const y1 = a * x1 * x1 + b;
  const y2 = a * x2 * x2 + b;
  const slope = rat(y2 - y1, x2 - x1);
  const lineAtK = addValue(rat(y1), mulValue(slope, rat(k - x1)));
  const { choices, correctIndex } = numMcq(
    a * k * k + b,
    [
      nd(lineAtK, null, 'Coi f là hàm bậc nhất đi qua hai điểm của bảng. Đề cho f có dạng ax² + b.'),
      nd(a * k + b, null, 'Tìm đúng a và b nhưng quên bình phương k khi thay vào.'),
      nd(b * k * k + a, 'swapped_slope_intercept', 'Đảo vai trò của a và b.'),
    ],
    rng,
  );
  return {
    stem: `The function f is defined by f(x) = ax^2 + b, where a and b are constants. The table shows two values of f. What is the value of f(${k})?`,
    figure: fnTable([x1, x2], [{ name: 'f(x)', ys: [y1, y2] }], 'Values of f'),
    choices,
    correctIndex,
    steps: [
      S('Thay hai điểm của bảng vào công thức để được hai phương trình theo a và b.', `${x1 === 0 ? 'b' : 'a + b'} = ${y1}   và   ${x2 * x2}a + b = ${y2}`),
      S('Trừ hai phương trình cho nhau.', `${x2 * x2 - x1 * x1}a = ${y2 - y1}   ⇒   a = ${a},   b = ${b}`),
      S(`Tính f(${k}).`, `f(${k}) = ${lead(a)}(${k})^2${signedTerm(b)} = ${a * k * k + b}`),
    ],
  };
});

/** f(x) = x²: số nào có bình phương NHỎ hơn chính nó? Chỉ số trong khoảng (0, 1). */
const fnSquareBelow = mcqT('pd-d-fn-square-below', 'nonlinear_functions', 'medium', (rng) => {
  const q = pickInt(rng, 2, 9);
  const p = pickInt(rng, 1, q - 1);
  const frac = rat(p, q);
  const less = rng() < 0.5;
  const big = rat(q + pickInt(rng, 1, 5), q);
  const neg = rat(-p, q);
  const { choices, correctIndex } = less
    ? numMcq(
        frac,
        [
          nd(neg, 'sign_flip', 'Số âm có bình phương dương, nên luôn LỚN hơn chính nó.'),
          nd(big, null, 'Số lớn hơn 1 thì bình phương còn lớn hơn nữa.'),
          nd(1, null, '1 bình phương vẫn bằng 1 — bằng nhau, không nhỏ hơn.'),
        ],
        rng,
      )
    : numMcq(
        rng() < 0.5 ? big : neg,
        [
          nd(frac, null, 'Số trong khoảng 0 đến 1 có bình phương NHỎ hơn chính nó.'),
          nd(1, null, '1 bình phương vẫn bằng 1 — bằng nhau, không lớn hơn.'),
          nd(0, null, '0 bình phương vẫn bằng 0.'),
        ],
        rng,
      );
  return {
    stem: `The function f is defined by f(x) = x^2. For which of the following values of c is f(c) ${less ? '<' : '>'} c?`,
    choices,
    correctIndex,
    steps: [
      S('So c bình phương với c: số từ 0 tới 1 bình phương thì nhỏ đi; số lớn hơn 1 hoặc số âm thì bình phương lớn hơn chính nó; 0 và 1 giữ nguyên.'),
      S('Thử lựa chọn đúng.', less ? `(${fx(frac)})^2 = ${fx(mulValue(frac, frac))} < ${fx(frac)}` : 'c^2 > c'),
    ],
  };
});

/** Giao điểm với trục hoành (có một điểm tiếp xúc) và tung độ gốc → công thức. */
const fnInterceptsFormula = mcqT('pd-d-fn-intercepts-formula', 'nonlinear_functions', 'hard', (rng) => {
  const p = pickNonZeroInt(rng, -4, 4);
  let q = pickNonZeroInt(rng, -4, 4);
  if (q === p) q = -p;
  const a = pick(rng, [-2, -1, 1, 2]);
  const Y = -a * p * p * q;
  const show = (c: number, r2: number, r1: number) => `f(x) = ${lead(c)}${xMinus(r2)}^2${xMinus(r1)}`;
  const { choices, correctIndex } = textMcq(
    show(a, p, q),
    [
      td(show(a, q, p), null, `Đảo vai trò hai nghiệm: nghiệm tiếp xúc (không cắt qua) là x = ${p}, nên ngoặc chứa ${p} mới có bình phương.`),
      td(show(a, -p, -q), 'sign_flip', `Nghiệm x = ${p} ứng với ngoặc (x ${p < 0 ? '+' : '−'} ${Math.abs(p)}), không phải ngoặc ngược dấu.`),
      td(show(-a, p, q), 'sign_flip', `Sai dấu hệ số: thay x = 0 phải ra tung độ gốc ${Y}.`),
      td(show(2 * a, p, q), null, `Sai hệ số: thay x = 0 phải ra ${Y}.`),
    ],
    rng,
  );
  return {
    stem: `The graph of the polynomial function f touches the x-axis at x = ${p} without crossing it, crosses the x-axis at x = ${q}, and has no other x-intercepts. The graph crosses the y-axis at (0, ${Y}). Which of the following could define f?`,
    choices,
    correctIndex,
    steps: [
      S(`Chạm trục hoành mà không cắt qua là nghiệm kép: có thừa số bình phương. Cắt qua là nghiệm đơn.`, `f(x) = a${xMinus(p)}^2${xMinus(q)}`),
      S('Thay x = 0 để tìm a từ tung độ gốc.', `a(${par(-p)})^2(${par(-q)}) = ${Y}   ⇒   a = ${a}`),
    ],
  };
});

/** f(g(k)) với hai hàm bậc hai: tính g trước. */
const fnComposeQuad = mcqT('pd-d-fn-compose-quad', 'nonlinear_functions', 'medium', (rng) => {
  const b = pickInt(rng, -4, 4);
  const c = pickInt(rng, -6, 6);
  const d = pickInt(rng, 1, 9);
  const k = pickNonZeroInt(rng, -3, 3);
  const f = (x: number) => x * x + b * x + c;
  const g = (x: number) => x * x - d;
  const gk = g(k);
  const { choices, correctIndex } = numMcq(
    f(gk),
    [
      nd(g(f(k)), null, 'Làm ngược thứ tự: tính f trước rồi mới đưa vào g.'),
      nd(f(k) * g(k), null, 'Nhân f(k) với g(k). Hàm hợp là lồng vào nhau, không phải nhân.'),
      nd(f(k) + g(k), null, 'Cộng f(k) với g(k) — không phải hàm hợp.'),
    ],
    rng,
  );
  return {
    stem: `The functions f and g are defined by f(x) = ${quadraticSide(1, b, c)} and g(x) = x^2 - ${d}. What is the value of f(g(${k}))?`,
    choices,
    correctIndex,
    steps: [
      S('Làm từ trong ra ngoài: tính g trước.', `g(${k}) = ${par(k)}^2 - ${d} = ${gk}`),
      S('Đưa kết quả vào f.', `f(${gk}) = ${par(gk)}^2${signedCoefTerm(b, par(gk))}${signedTerm(c)} = ${f(gk)}`),
    ],
  };
});

/** Bảng của f; g = m·f; g(k) = V → k. */
const fnTableScaledSolve = mcqT('pd-d-fn-table-scaled-solve', 'nonlinear_functions', 'easy', (rng) => {
  const x0 = pickInt(rng, -2, 1);
  const X = range(x0, x0 + 4);
  const ys = shuffleCopy(range(-6, 9).filter((v) => v !== 0), rng).slice(0, 5);
  const m = pickInt(rng, 2, 4);
  const idx = shuffleCopy(range(0, 4), rng);
  const i = idx[0]!;
  const V = m * ys[i]!;
  // Nhiễu "quên chia cho m": x có f(x) = V — chỉ dựng được khi V có trong bảng.
  const naive = ys.indexOf(V);
  const dists = [
    naive >= 0 ? nd(X[naive]!, 'stopped_too_early', `Tìm x có f(x) = ${V}, quên rằng g gấp ${m} lần f.`) : null,
    ...idx.slice(1).map((j) => nd(X[j]!, null, `g(${X[j]}) = ${m} × ${par(ys[j]!)} = ${m * ys[j]!}, không phải ${V}.`)),
  ].filter((d): d is NumDist => d !== null);
  const { choices, correctIndex } = numMcq(X[i]!, dists, rng);
  return {
    stem: `The table shows some values of the function f. The function g is defined by g(x) = ${m}f(x). If g(k) = ${V}, what is the value of k?`,
    figure: fnTable(X, [{ name: 'f(x)', ys }], 'Values of f'),
    choices,
    correctIndex,
    steps: [
      S(`g(k) = ${m}f(k) = ${V}, nên chia cho ${m}.`, `f(k) = ${ys[i]}`),
      S('Tìm trong bảng giá trị x cho f(x) đó.', `k = ${X[i]}`),
    ],
  };
});

/** f(x) = √(x + a): f(p) − f(q) = f(t). */
const fnSqrtDiff = mcqT('pd-d-fn-sqrt-diff', 'nonlinear_functions', 'medium', (rng) => {
  const a = pickNonZeroInt(rng, -5, 5);
  const n = pickInt(rng, 1, 5);
  const m = n + pickInt(rng, 1, 5);
  const p = m * m - a;
  const q = n * n - a;
  const s = m - n;
  const t = s * s - a;
  const { choices, correctIndex } = numMcq(
    t,
    [
      nd(p - q, null, 'Trừ hai đầu vào với nhau. Hiệu hai giá trị của hàm không phải giá trị của hàm tại hiệu hai đầu vào.'),
      nd(s * s + a, 'sign_flip', `Giải căn bậc hai sai dấu: t ${a < 0 ? '−' : '+'} ${Math.abs(a)} = ${s * s} nên t = ${t}.`),
      nd(s, 'stopped_too_early', `Đây là giá trị f(t) = ${s}; còn phải tìm t.`),
    ],
    rng,
  );
  return {
    stem: `The function f is defined by f(x) = sqrt(${linearSide(1, a)}). If f(${p}) - f(${q}) = f(t), what is the value of t?`,
    choices,
    correctIndex,
    steps: [
      S('Tính hai giá trị của hàm.', `f(${p}) = sqrt(${m * m}) = ${m},   f(${q}) = sqrt(${n * n}) = ${n}`),
      S('Vậy f(t) bằng hiệu của chúng.', `sqrt(${linearSide(1, a, 't')}) = ${s}`),
      S('Bình phương hai vế.', `${linearSide(1, a, 't')} = ${s * s}   ⇒   t = ${t}`),
    ],
  };
});

/** Điểm nào KHÔNG nằm trên đồ thị y = (x + a)/(x - b)? */
const fnPointNotOn = mcqT('pd-d-fn-point-not-on', 'nonlinear_functions', 'easy', (rng) => {
  const a = pickNonZeroInt(rng, -4, 4);
  const b = pickNonZeroInt(rng, -4, 4);
  const pool = range(-5, 6).filter((x) => x !== b && x + a !== 0);
  const xs = sample(rng, pool, 4);
  const val = (x: number) => rat(x + a, x - b);
  const pt = (x: number, y: MathValue) => `(${x}, ${fx(y)})`;
  const bad = xs[0]!;
  const wrongY = addValue(val(bad), rat(pickNonZeroInt(rng, -2, 2)));
  const { choices, correctIndex } = textMcq(
    pt(bad, wrongY),
    xs.slice(1).map((x) => td(pt(x, val(x)), null, `Điểm này nằm trên đồ thị: thay x = ${x} được đúng y = ${fx(val(x))}.`)),
    rng,
  );
  return {
    stem: `In the xy-plane, which of the following points does NOT lie on the graph of y = frac(${linearSide(1, a)},${linearSide(1, -b)})?`,
    choices,
    correctIndex,
    steps: [
      S('Thay hoành độ của từng điểm vào phương trình rồi so với tung độ.'),
      S(`Tại x = ${bad}, phương trình cho giá trị khác tung độ của điểm.`, `frac(${bad}${signedTerm(a)},${bad}${signedTerm(-b)}) = ${fx(val(bad))} != ${fx(wrongY)}`),
    ],
  };
});

/** g(x) = √(kx), g(a) = v → a = v²/k. */
const fnSqrtSolve = mcqT('pd-d-fn-sqrt-solve', 'nonlinear_equations', 'easy', (rng) => {
  const g = pick(rng, ['f', 'g', 'h']);
  const k = pickInt(rng, 2, 6);
  const c = pickInt(rng, -5, 5);
  const v = pickInt(rng, 2, 9);
  const ans = rat(v * v - c, k);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(rat(v - c, k), 'forgot_square_root', 'Quên bình phương hai vế: phải bình phương để khử căn trước.'),
      nd((v * v - c) * k, 'inverted_fraction', `Nhân với ${k} thay vì chia cho ${k}.`),
      nd(v * v - c, 'stopped_too_early', `Đây là giá trị của ${k}a — còn phải chia cho ${k}.`),
      nd(rat(v * v + c, k), 'sign_flip', 'Chuyển hằng số sang vế phải mà không đổi dấu.'),
    ],
    rng,
  );
  return {
    stem: `The function ${g} is defined by ${g}(x) = sqrt(${linearSide(k, c)}). If ${g}(a) = ${v}, what is the value of a?`,
    choices,
    correctIndex,
    steps: [
      S('Viết phương trình rồi bình phương hai vế để khử căn.', `sqrt(${linearSide(k, c, 'a')}) = ${v}   ⇒   ${linearSide(k, c, 'a')} = ${v * v}`),
      S(`Chuyển hằng số rồi chia cho ${k}.`, `a = ${fx(ans)}`),
    ],
  };
});

/** Bảng f và g: tính f(g(k)). */
function fnPairTable(rng: Rng) {
  const x0 = pickInt(rng, -2, 1);
  const X = range(x0, x0 + 4);
  const f = X.map(() => pick(rng, X));
  const g = X.map(() => pick(rng, X));
  const at = (h: number[], x: number) => h[X.indexOf(x)]!;
  return { X, f, g, at };
}

const fnTableCompose = mcqT('pd-d-fn-table-compose', 'nonlinear_functions', 'medium', (rng) => {
  const { X, f, g, at } = fnPairTable(rng);
  const k = pick(rng, X);
  const gk = at(g, k);
  const ans = at(f, gk);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(at(g, at(f, k)), null, 'Làm ngược thứ tự: tính f(k) trước rồi đưa vào g.'),
      nd(gk, 'stopped_too_early', `Đây mới là g(${k}); còn phải đưa vào f.`),
      nd(at(f, k), null, `Đây là f(${k}), bỏ qua bước tính g.`),
    ],
    rng,
  );
  return {
    stem: `The table shows some values of the functions f and g. What is the value of f(g(${k}))?`,
    figure: fnTable(X, [{ name: 'f(x)', ys: f }, { name: 'g(x)', ys: g }], 'Values of f and g'),
    choices,
    correctIndex,
    steps: [S('Đọc g tại x = k trước.', `g(${k}) = ${gk}`), S('Tìm hàng x bằng kết quả đó, đọc cột f.', `f(${gk}) = ${ans}`)],
  };
});

const fnTableLookupBack = mcqT('pd-d-fn-table-lookup-back', 'nonlinear_functions', 'easy', (rng) => {
  const x0 = pickInt(rng, -3, 1);
  const X = range(x0, x0 + 4);
  const g = shuffleCopy(range(-8, 9), rng).slice(0, 5);
  const f = shuffleCopy(range(-8, 9), rng).slice(0, 5);
  const i = pickInt(rng, 0, 4);
  const V = g[i]!;
  const c = X[i]!;
  const vIdx = X.indexOf(V);
  const dists = [
    nd(c, 'stopped_too_early', `Đây là c = ${c}; đề hỏi f(c).`),
    vIdx >= 0 ? nd(f[vIdx]!, null, `Thay thẳng ${V} vào f. Phải tìm c trước: c là x có g(x) = ${V}.`) : null,
    nd(f[(i + 1) % 5]!, null, 'Đọc nhầm sang hàng bên cạnh.'),
    nd(V, null, 'Đây là g(c), không phải f(c).'),
  ].filter((d): d is NumDist => d !== null);
  const { choices, correctIndex } = numMcq(f[i]!, dists, rng);
  return {
    stem: `The table shows some values of the functions f and g. If g(c) = ${V}, what is the value of f(c)?`,
    figure: fnTable(X, [{ name: 'f(x)', ys: f }, { name: 'g(x)', ys: g }], 'Values of f and g'),
    choices,
    correctIndex,
    steps: [S(`Tìm trong cột g giá trị ${V}: nằm ở hàng x = ${c}.`, `c = ${c}`), S('Đọc cột f ở cùng hàng.', `f(${c}) = ${f[i]}`)],
  };
});

/** (1/n)·f(a) = V với f bậc nhất. */
const fnLinearFractionSolve = mcqT('pd-d-fn-linear-fraction-solve', 'linear_functions', 'easy', (rng) => {
  const m = pickNonZeroInt(rng, -5, 5);
  const b = pickInt(rng, -9, 9);
  const n = pickInt(rng, 2, 4);
  const a = pickNonZeroInt(rng, -9, 9);
  const fa = m * a + b;
  // Chọn a để f(a) chia hết cho n: dời b.
  const b2 = b - (((fa % n) + n) % n);
  const fa2 = m * a + b2;
  const V = fa2 / n;
  const { choices, correctIndex } = numMcq(
    a,
    [
      nd(rat(V - b2, m), 'stopped_too_early', `Quên nhân hai vế với ${n}: f(a) = ${fa2}, không phải ${V}.`),
      nd(rat(fa2 + b2, m), 'sign_flip', 'Chuyển hằng số sang vế kia mà không đổi dấu.'),
      nd(fa2, 'solved_for_wrong_var', 'Đây là giá trị f(a), không phải a.'),
    ],
    rng,
  );
  return {
    stem: `The function f is defined by f(x) = ${linearSide(m, b2)}. If frac(1,${n})f(a) = ${V}, what is the value of a?`,
    choices,
    correctIndex,
    steps: [
      S(`Nhân hai vế với ${n}.`, `f(a) = ${fa2}`),
      S('Giải phương trình bậc nhất.', `${linearSide(m, b2, 'a')} = ${fa2}   ⇒   a = ${a}`),
    ],
  };
});

/** Bảng của f; g(x) = f(px − q); tính g(k). */
const fnTableInner = mcqT('pd-d-fn-table-inner', 'nonlinear_functions', 'medium', (rng) => {
  const x0 = pickInt(rng, -3, 0);
  const X = range(x0, x0 + 5);
  const ys = shuffleCopy(range(-9, 12), rng).slice(0, 6);
  const p = pickInt(rng, 2, 3);
  // Chọn đầu vào trong ngoặc trước, dựng k và q ngược lại.
  const innerIdx = pickInt(rng, 0, 5);
  const inner = X[innerIdx]!;
  const k = pickInt(rng, 1, 4);
  const q = p * k - inner;
  const kIdx = X.indexOf(k);
  const dists = [
    kIdx >= 0 ? nd(ys[kIdx]!, null, `Đây là f(${k}) — quên tính biểu thức trong ngoặc.`) : null,
    kIdx >= 0 ? nd(p * ys[kIdx]! - q, null, `Áp phép biến đổi lên giá trị của hàm thay vì lên đầu vào.`) : null,
    nd(ys[(innerIdx + 1) % 6]!, null, 'Đọc nhầm hàng.'),
    nd(inner, 'stopped_too_early', `Đây là đầu vào ${p}k ${q < 0 ? '+' : '−'} ${Math.abs(q)}; còn phải đọc f tại đó.`),
  ].filter((d): d is NumDist => d !== null);
  const { choices, correctIndex } = numMcq(ys[innerIdx]!, dists, rng);
  return {
    stem: `The table shows some values of the function f. The function g is defined by g(x) = f(${linearSide(p, -q)}). What is the value of g(${k})?`,
    figure: fnTable(X, [{ name: 'f(x)', ys }], 'Values of f'),
    choices,
    correctIndex,
    steps: [
      S('Tính đầu vào của f trước.', `${p}(${k})${signedTerm(-q)} = ${inner}`),
      S('Đọc f tại giá trị đó.', `g(${k}) = f(${inner}) = ${ys[innerIdx]}`),
    ],
  };
});

/** Hai hàm bậc nhất: f(k) bằng g tại đâu? */
const fnLinearMatch = mcqT('pd-d-fn-linear-match', 'linear_functions', 'medium', (rng) => {
  const a = pickNonZeroInt(rng, -5, 5);
  const c = pickNonZeroInt(rng, -4, 4);
  const t = pickNonZeroInt(rng, -8, 8);
  const d = pickInt(rng, -9, 9);
  const target = c * t + d;
  // Chọn k để f(k) = target: a k + b = target → dời b.
  const k = pickNonZeroInt(rng, -6, 6);
  const b2 = target - a * k;
  const { choices, correctIndex } = numMcq(
    t,
    [
      nd(k, null, `Đây là k — f và g là hai hàm khác nhau nên đầu vào không trùng nhau.`),
      nd(target, 'stopped_too_early', `Đây là giá trị f(${k}) = ${target}; còn phải tìm x để g(x) bằng nó.`),
      nd(rat(target + d, c), 'sign_flip', 'Chuyển hằng số của g sang vế kia mà không đổi dấu.'),
    ],
    rng,
  );
  return {
    stem: `The functions f and g are defined by f(x) = ${linearSide(a, b2)} and g(x) = ${linearSide(c, d)}. The value of f(${k}) is equal to the value of g(t). What is the value of t?`,
    choices,
    correctIndex,
    steps: [
      S(`Tính f(${k}).`, `f(${k}) = ${a}(${k})${signedTerm(b2)} = ${target}`),
      S('Giải g(t) bằng giá trị đó.', `${linearSide(c, d, 't')} = ${target}   ⇒   t = ${t}`),
    ],
  };
});

/** Parabol y = ±(n² − (x − h)²): khoảng cách từ đỉnh tới một giao điểm với trục hoành. */
const fnParabolaDistance = mcqT('pd-d-fn-parabola-distance', 'nonlinear_functions', 'hard', (rng) => {
  const n = pickInt(rng, 2, 9);
  const h = pickInt(rng, -6, 6);
  const down = rng() < 0.5;
  const sq = `(x${signedTerm(-h)})^2`;
  const eq = down ? `y = ${n * n} - ${h === 0 ? 'x^2' : sq}` : `y = ${h === 0 ? 'x^2' : sq} - ${n * n}`;
  const r = simplifyRoot(n * n + 1);
  const ans = radText(rat(n * r.out), r.inside);
  const { choices, correctIndex } = textMcq(
    ans,
    [
      td(String(n * n + n), 'forgot_square_root', 'Cộng thẳng hai cạnh góc vuông. Khoảng cách phải dùng định lý Pythagoras.'),
      td(rootText(n * n + n), 'forgot_square_root', 'Quên bình phương các cạnh trước khi cộng dưới dấu căn.'),
      td(rootText(n * n - 1, n), 'sign_flip', 'Trừ hai bình phương thay vì cộng.'),
      td(String(n * n), null, 'Chỉ lấy độ dài theo phương thẳng đứng.'),
    ],
    rng,
  );
  return {
    stem: `In the xy-plane, the graph of ${eq} has vertex V and crosses the x-axis at points A and B. What is the distance between V and A?`,
    choices,
    correctIndex,
    steps: [
      S('Dạng đỉnh cho ngay đỉnh V; cho y = 0 để tìm hai giao điểm với trục hoành.', `V(${h}, ${down ? n * n : -n * n}),   x = ${h} ± ${n}`),
      S('Hai điểm lệch nhau theo phương ngang và phương đứng; dùng định lý Pythagoras.', `sqrt(${n}^2 + ${n * n}^2) = sqrt(${n * n + n ** 4}) = ${ans}`),
    ],
  };
});

/** Đường thẳng qua hai điểm trên trục; tịnh tiến lên k → hoành độ gốc mới. */
const fnLineShiftXint = mcqT('pd-d-fn-line-shift-xint', 'linear_functions', 'medium', (rng) => {
  const a = pickInt(rng, 1, 6);
  const b = pickInt(rng, 1, 6);
  const k = pickNonZeroInt(rng, -6, 8);
  const ans = rat(a * (b + k), b);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(a + k, null, 'Cộng k vào hoành độ gốc. Tịnh tiến theo phương đứng không dời hoành độ gốc đúng k đơn vị.'),
      nd(a - k, 'sign_flip', 'Coi dịch lên là dịch sang trái đúng k đơn vị.'),
      nd(rat(a * k, b), null, 'Bỏ mất tung độ gốc ban đầu khi viết g.'),
    ],
    rng,
  );
  return {
    stem: `The graph of the linear function f passes through the points (0, ${b}) and (${a}, 0) in the xy-plane. The function g is defined by g(x) = f(x)${signedTerm(k)}. What is the x-intercept of the graph of g?`,
    choices,
    correctIndex,
    steps: [
      S('Hệ số góc của f và phương trình của f.', `m = frac(0 - ${b},${a} - 0),   f(x) = ${vx(rat(-b, a))} + ${b}`),
      S('Viết g rồi cho g(x) = 0.', `${vx(rat(-b, a))}${signedTerm(b + k)} = 0   ⇒   x = ${fx(ans)}`),
    ],
  };
});

/** f(x) = x³ + c, g(x) = m²x + k: k nào cho ba nghiệm? */
const fnCubicThree = mcqT('pd-d-fn-cubic-three', 'nonlinear_functions', 'hard', (rng) => {
  const m = pickInt(rng, 1, 3);
  const c = pickInt(rng, -9, 9);
  const inside = m === 1 ? [0] : m === 2 ? [0, 1, -1, 2, -2] : [0, 4, -4, 8, -8];
  const outside = m === 1 ? [1, -1, 2, -2, 3] : m === 2 ? [4, -4, 5, -5, 6] : [11, -11, 12, -12, 13];
  const r = pick(rng, inside);
  const outs = sample(rng, outside, 3);
  const { choices, correctIndex } = numMcq(
    c + r,
    outs.map((o) => nd(c + o, null, `Với k = ${c + o}, đường thẳng nằm quá cao hoặc quá thấp so với chỗ uốn của đồ thị bậc ba, nên chỉ cắt một lần.`)),
    rng,
  );
  const slope = m * m === 1 ? 'x' : `${m * m}x`;
  return {
    stem: `The functions f and g are defined by f(x) = x^3${signedTerm(c)} and g(x) = ${slope} + k, where k is a constant. For which of the following values of k does the equation f(x) = g(x) have three real solutions?`,
    choices,
    correctIndex,
    steps: [
      S('Chuyển về một vế: số nghiệm là số giao điểm của đồ thị bậc ba với trục hoành.', `x^3 - ${slope}${signedTerm(c - (c + r))} = 0`),
      S(r === 0 ? 'Khi k bằng hằng số của f, phương trình phân tích được ngay và có ba nghiệm.' : 'Đồ thị x³ − m²x có một cực đại và một cực tiểu; chỉ khi hằng số còn lại đủ nhỏ thì đường nằm ngang mới cắt đủ ba lần.', r === 0 ? `x(x - ${m})(x + ${m}) = 0` : `k = ${c + r}`),
    ],
  };
});

/** y = ax + c đi qua (−a, pa), a > 0. */
const fnLinePointA = gridT('pd-d-fn-line-point-a', 'nonlinear_equations', 'hard', (rng) => {
  const p = pick(rng, [1, 2, 3, -1, -2]);
  const q = pickInt(rng, 1, 3);
  const a = pickInt(rng, p < 0 ? 3 : 1, 12);
  const c = q * a * a + p * a;
  const pa = p === 1 ? 'a' : p === -1 ? '-a' : `${p}a`;
  const qa = q === 1 ? '-a' : `-${q}a`;
  return {
    stem: `In the xy-plane, the line with equation y = ax + ${c}, where a is a constant with a > 0, passes through the point (${qa}, ${pa}). What is the value of a?`,
    answer: rat(a),
    steps: [
      S('Thay toạ độ điểm vào phương trình.', `${pa} = a(${qa}) + ${c}`),
      S('Đưa về phương trình bậc hai theo a.', `${coefTerm(q, 'a^2')}${signedCoefTerm(p, 'a')} - ${c} = 0`),
      S('Phân tích (hoặc dùng công thức nghiệm) rồi giữ nghiệm dương.', `a = ${a}`),
    ],
  };
});

const CH14: MathTemplate[] = [
  fnTableFormula,
  fnIntersectionCount,
  fnPiecewiseEqual,
  fnLevelCount,
  fnEvenCheck,
  fnInnerScale,
  fnEvalRational,
  fnTableAx2b,
  fnSquareBelow,
  fnInterceptsFormula,
  fnComposeQuad,
  fnLevelCountGrid,
  fnTableScaledSolve,
  fnSqrtDiff,
  fnPointNotOn,
  fnSqrtSolve,
  fnTableCompose,
  fnTableLookupBack,
  fnLinearFractionSolve,
  fnTableInner,
  fnLinearMatch,
  fnParabolaDistance,
  fnLineShiftXint,
  fnCubicThree,
  fnLinePointA,
];

// ================================================================ Chương 15 — Hàm bậc hai

/** Khoảng cách giữa hai giao điểm với trục hoành = hiệu hai nghiệm. */
const quadInterceptDistance = mcqT('pd-d-quad-intercept-distance', 'nonlinear_functions', 'easy', (rng) => {
  const r1 = pickInt(rng, -8, 4);
  const r2 = r1 + pickInt(rng, 2, 10);
  const a = pickInt(rng, 1, 3);
  const coefs = [a, -a * (r1 + r2), a * r1 * r2];
  const { choices, correctIndex } = numMcq(
    r2 - r1,
    [
      nd(Math.abs(r1 + r2), null, 'Đây là (độ lớn của) tổng hai nghiệm, không phải khoảng cách.'),
      nd(Math.abs(r1 * r2), null, 'Đây là tích hai nghiệm.'),
      nd(Math.abs(r1) + Math.abs(r2) === r2 - r1 ? r2 - r1 + 2 : Math.abs(r1) + Math.abs(r2), null, 'Cộng độ lớn hai nghiệm mà không xét dấu.'),
      nd(r2 - r1 + 1, 'off_by_one', 'Đếm số điểm nguyên thay vì đo khoảng cách.'),
    ],
    rng,
  );
  return {
    stem: `The graph of y = ${polyText(coefs)} crosses the x-axis at two points. What is the distance between these two points?`,
    choices,
    correctIndex,
    steps: [
      S(a === 1 ? 'Cho y = 0 rồi phân tích nhân tử.' : `Cho y = 0, chia hai vế cho ${a} rồi phân tích nhân tử.`, `${xMinus(r1)}${xMinus(r2)} = 0`),
      S('Hai giao điểm là hai nghiệm; khoảng cách là hiệu của chúng.', `${r2} - ${par(r1)} = ${r2 - r1}`),
    ],
  };
});

/** Nghiệm vô tỉ: hoàn thành bình phương hoặc công thức nghiệm, dạng p ± √q. */
const NONSQUARES = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17] as const;

const quadIrrationalRoots = mcqT('pd-d-quad-irrational-roots', 'nonlinear_equations', 'medium', (rng) => {
  const p = pickNonZeroInt(rng, -6, 6);
  const q = pick(rng, NONSQUARES);
  const a = pickInt(rng, 1, 3);
  const b = -2 * p * a;
  const c = (p * p - q) * a;
  const pm = (h: number, rad: string) => `${h} ± ${rad}`;
  const { choices, correctIndex } = textMcq(
    pm(p, `sqrt(${q})`),
    [
      td(pm(-p, `sqrt(${q})`), 'sign_flip', 'Tâm của hai nghiệm là −b/2, không phải b/2.'),
      td(pm(p, `2sqrt(${q})`), 'stopped_too_early', 'Quên chia phần căn cho 2 khi dùng công thức nghiệm.'),
      td(pm(2 * p, `sqrt(${q})`), 'stopped_too_early', 'Quên chia −b cho 2.'),
      td(pm(p, `sqrt(${p * p + q})`), 'sign_flip', 'Chuyển hằng số sang vế phải mà không đổi dấu.'),
    ],
    rng,
  );
  return {
    stem: `What are the solutions to ${quadraticSide(a, b, c)} = 0?`,
    choices,
    correctIndex,
    steps: [
      S(a === 1 ? 'Không phân tích được thành nhân tử nguyên, nên hoàn thành bình phương.' : `Chia hai vế cho ${a}, rồi hoàn thành bình phương.`, `${xMinus(p)}^2 = ${q}`),
      S('Lấy căn hai vế (nhớ cả hai dấu).', `x = ${p} ± sqrt(${q})`),
    ],
  };
});

/** Phân tích a·t² + b·t + c = 0, giữ nghiệm nhỏ hơn 1 (một phân số). */
const quadFractionRoot = gridT('pd-d-quad-fraction-root', 'nonlinear_equations', 'medium', (rng) => {
  const v = pick(rng, ['a', 't', 'k', 'w']);
  const q = pickInt(rng, 2, 6);
  const p = pickInt(rng, 1, q - 1);
  const r = pickInt(rng, 2, 7);
  const coefs = [q, -(q * r + p), p * r];
  const ans = rat(p, q);
  return {
    stem: `If ${polyText(coefs, v)} = 0 and ${v} < 1, what is the value of ${v}?`,
    answer: ans,
    steps: [
      S('Phân tích nhân tử (tìm hai số có tích bằng hệ số đầu nhân hằng số).', `(${linearSide(q, -p, v)})(${linearSide(1, -r, v)}) = 0`),
      S(`Hai nghiệm là ${ans.num}/${ans.den} và ${r}; đề chỉ nhận nghiệm nhỏ hơn 1.`, `${v} = ${fx(ans)}`),
    ],
  };
});

/** ax² + bx = c có hai nghiệm; bình phương nghiệm nhỏ hơn. */
const quadSmallerRootSquare = mcqT('pd-d-quad-smaller-root-square', 'nonlinear_equations', 'medium', (rng) => {
  const p = pickInt(rng, 2, 5);
  const q = pickInt(rng, 1, 9);
  let s = pickInt(rng, 1, 6);
  if (p * s === q) s += 1;
  const B = p * s - q;
  const big = rat(q, p);
  const { choices, correctIndex } = numMcq(
    s * s,
    [
      nd(mulValue(big, big), 'solved_for_wrong_var', 'Bình phương nhầm nghiệm lớn hơn.'),
      nd(-s * s, 'sign_flip', 'Bình phương một số âm luôn dương.'),
      nd(s, 'stopped_too_early', 'Chưa bình phương.'),
      nd(-s, 'stopped_too_early', `Đây là nghiệm nhỏ hơn; đề hỏi bình phương của nó.`),
    ],
    rng,
  );
  return {
    stem: `If a and b are the two solutions to ${quadraticSide(p, B, 0)} = ${q * s} and a > b, what is the value of b^2?`,
    choices,
    correctIndex,
    steps: [
      S('Chuyển hết về một vế rồi phân tích nhân tử.', `${quadraticSide(p, B, -q * s)} = 0   ⇒   (${linearSide(p, -q)})(${linearSide(1, s)}) = 0`),
      S('Hai nghiệm; nghiệm nhỏ hơn là số âm.', `a = ${fx(big)},   b = -${s}`),
      S('Bình phương.', `b^2 = ${s * s}`),
    ],
  };
});

/** (px + q)² = mx + n: khai triển rồi dùng tổng nghiệm −b/a. */
const quadSumExpanded = gridT('pd-d-quad-sum-expanded', 'nonlinear_equations', 'hard', (rng) => {
  const p = pickInt(rng, 1, 3);
  const q = pickNonZeroInt(rng, -5, 5);
  const m = pickInt(rng, -9, 9);
  const n = q * q + pickInt(rng, 1, 20);
  const A = p * p;
  const B = 2 * p * q - m;
  const C = q * q - n;
  const ans = rat(-B, A);
  return {
    stem: `What is the sum of the solutions to (${linearSide(p, q)})^2 = ${linearSide(m, n)}?`,
    answer: ans,
    steps: [
      S('Khai triển vế trái (đừng quên số hạng giữa) rồi chuyển hết về một vế.', `${quadraticSide(A, B, C)} = 0`),
      S('Biệt thức dương nên có hai nghiệm; tổng hai nghiệm là −b/a, không cần giải.', `frac(${-B},${A}) = ${fx(ans)}`),
    ],
  };
});

/** y = −m² và y = x² + cx: giá trị c nào cho hai nghiệm? */
const quadSystemTwoSolutions = mcqT('pd-d-quad-system-two-solutions', 'nonlinear_equations', 'hard', (rng) => {
  const m = pickInt(rng, 1, 6);
  const K = -m * m;
  const sg = rng() < 0.5 ? 1 : -1;
  const correct = sg * (2 * m + pickInt(rng, 1, 3));
  const inside = shuffleCopy([2 * m, -2 * m, 0, m, -m, 2 * m - 1, 1 - 2 * m].filter((v, i, a) => a.indexOf(v) === i), rng);
  const { choices, correctIndex } = numMcq(
    correct,
    inside.map((c) =>
      nd(c, null, Math.abs(c) === 2 * m ? `Với c = ${c} biệt thức bằng 0: chỉ một nghiệm (đường thẳng tiếp xúc parabol).` : `Với c = ${c} biệt thức âm: hệ vô nghiệm.`),
    ),
    rng,
  );
  return {
    stem: `In the system of equations y = ${K} and y = x^2 + cx, c is a constant. For which of the following values of c does the system have exactly two real solutions?`,
    choices,
    correctIndex,
    steps: [
      S('Thế y vào phương trình thứ hai và chuyển về một vế.', `x^2 + cx + ${m * m} = 0`),
      S('Hai nghiệm khi biệt thức dương.', `c^2 - 4(${m * m}) > 0   ⇒   |c| > ${2 * m}`),
      S('Chỉ một lựa chọn thoả.', `c = ${correct}`),
    ],
  };
});

/** Đường nằm ngang cắt parabol dạng đỉnh ở đâu. */
const quadLineMeetsVertex = mcqT('pd-d-quad-line-meets-vertex', 'nonlinear_equations', 'medium', (rng) => {
  const a = pickNonZeroInt(rng, -3, 3);
  const s = pickInt(rng, 2, 5);
  const h = pickNonZeroInt(rng, -6, 6);
  const v = pickInt(rng, -9, 9);
  const k = v + a * s * s;
  const pts = (x1: number, y1: number, x2: number, y2: number) => `(${x1}, ${y1}) and (${x2}, ${y2})`;
  const { choices, correctIndex } = textMcq(
    pts(h - s, k, h + s, k),
    [
      td(pts(-h - s, k, -h + s, k), 'sign_flip', `Đọc sai dấu của h: (x ${h < 0 ? '+' : '−'} ${Math.abs(h)}) cho tâm tại x = ${h}.`),
      td(pts(h - s * s, k, h + s * s, k), 'forgot_square_root', 'Quên khai căn: khoảng cách tới tâm là căn bậc hai của vế phải.'),
      td(pts(h, v, h + s, k), null, 'Đỉnh của parabol không nằm trên đường thẳng này.'),
      td(pts(k, h - s, k, h + s), null, 'Đảo hoành độ với tung độ.'),
    ],
    rng,
  );
  return {
    stem: `In the xy-plane, the line y = ${k} intersects the graph of y = ${lead(a)}${xMinus(h)}^2${signedTerm(v)} at two points. What are the coordinates of the two points?`,
    choices,
    correctIndex,
    steps: [
      S('Cho hai vế bằng nhau rồi cô lập phần bình phương.', `${lead(a)}${xMinus(h)}^2 = ${k - v}   ⇒   ${xMinus(h)}^2 = ${s * s}`),
      S('Lấy căn, nhớ cả hai dấu.', `x = ${h} ± ${s}`),
    ],
  };
});

/** Biết đỉnh và một nghiệm → phương trình dạng đỉnh. */
const quadVertexRootEquation = mcqT('pd-d-quad-vertex-root-equation', 'nonlinear_functions', 'medium', (rng) => {
  const h = pickInt(rng, -5, 5);
  const d = pickNonZeroInt(rng, -4, 4);
  const a = pickNonZeroInt(rng, -3, 3);
  const k = -a * d * d;
  const r = h + d;
  const eq = (aa: MathValue | number, hh: number, kk: number) => {
    const av = R(aa);
    const head = av.den === 1 ? lead(av.num) : `${fx(av)}`;
    return `y = ${head}${xMinus(hh)}^2${signedTerm(kk)}`;
  };
  const dists = [
    td(eq(a, -h, k), 'sign_flip', `Đỉnh ở x = ${h} ứng với ${xMinus(h)}, không phải ngoặc ngược dấu.`),
    td(eq(-a, h, k), 'sign_flip', `Sai dấu hệ số: thay x = ${r} phải ra 0.`),
    td(eq(a, h, -k), 'sign_flip', 'Hằng số chính là tung độ đỉnh, giữ nguyên dấu.'),
    Math.abs(d) !== 1 ? td(eq(rat(-k, d), h, k), 'forgot_square_root', 'Tìm hệ số mà quên bình phương khoảng cách từ nghiệm tới đỉnh.') : td(eq(2 * a, h, k), null, `Sai hệ số: thay x = ${r} phải ra 0.`),
  ];
  const { choices, correctIndex } = textMcq(eq(a, h, k), h === 0 ? dists.slice(1) : dists, rng);
  return {
    stem: `The graph of a quadratic function in the xy-plane has its vertex at (${h}, ${k}) and crosses the x-axis at x = ${r}. Which of the following could be an equation of the graph?`,
    choices,
    correctIndex,
    steps: [
      S('Dạng đỉnh với đỉnh đã biết, còn một hệ số a chưa biết.', `y = a${xMinus(h)}^2${signedTerm(k)}`),
      S(`Thay điểm (${r}, 0) để tìm a.`, `0 = a(${d})^2${signedTerm(k)}   ⇒   a = ${a}`),
    ],
  };
});

/** Đại lượng dạng pt − qt² + c đạt lớn nhất tại t = p/(2q). */
const MAX_CONTEXTS = [
  { q: 'height, in meters, of a ball', t: 'seconds after it is thrown upward', ask: 'At what time t, in seconds, does the ball reach its greatest height?' },
  { q: 'depth, in centimeters, of water in a test channel', t: 'minutes after a valve is opened', ask: 'At what time t, in minutes, is the depth of the water greatest?' },
  { q: 'number of visitors per hour at a museum', t: 'hours after it opens', ask: 'At what time t, in hours, is the number of visitors per hour greatest?' },
  { q: 'speed, in meters per second, of a toy rocket', t: 'seconds after launch', ask: 'At what time t, in seconds, is the speed greatest?' },
] as const;

const quadMaxTime = gridT('pd-d-quad-max-time', 'nonlinear_functions', 'medium', (rng) => {
  const ctx = pick(rng, MAX_CONTEXTS);
  const q = pickInt(rng, 1, 5);
  const p = pickInt(rng, 3, 30);
  const c = pickInt(rng, 0, 12);
  const ans = rat(p, 2 * q);
  const expr = quadraticSide(-q, p, c, 't');
  return {
    stem: `The function f(t) = ${expr} models the ${ctx.q} t ${ctx.t}. ${ctx.ask}`,
    answer: ans,
    steps: [
      S('Hệ số của bình phương âm nên parabol úp xuống; giá trị lớn nhất ở đỉnh.', `a = -${q} < 0`),
      S('Hoành độ đỉnh là −b/(2a).', `t = frac(-${p},2(-${q})) = ${fx(ans)}`),
    ],
  };
});

/** Lợi nhuận bậc hai: số sản phẩm tối thiểu để không lỗ là nghiệm dương. */
const BREAK_EVEN = [
  { who: 'a bakery', units: 'boxes of cookies' },
  { who: 'a print shop', units: 'posters' },
  { who: 'a bike workshop', units: 'repaired bikes' },
  { who: 'a small farm', units: 'baskets of vegetables' },
] as const;

const quadBreakEven = gridT('pd-d-quad-break-even', 'nonlinear_equations', 'hard', (rng) => {
  const ctx = pick(rng, BREAK_EVEN);
  const r = pickInt(rng, 12, 120);
  const u = pickInt(rng, 3, 60);
  const B = u - r;
  const C = -u * r;
  return {
    stem: `The profit P, in dollars, that ${ctx.who} makes from selling n ${ctx.units} in one week is modeled by P(n) = ${quadraticSide(1, B, C, 'n')}. What is the least number of ${ctx.units} that must be sold in one week for the profit to be at least 0 dollars?`,
    answer: rat(r),
    steps: [
      S('Không lỗ nghĩa là P(n) lớn hơn hoặc bằng 0; tìm nghiệm của P(n) = 0.', `(n - ${r})(n + ${u}) = 0`),
      S('Số sản phẩm không âm, nên chỉ nhận nghiệm dương; từ đó trở đi P(n) không âm.', `n = ${r}`),
    ],
  };
});

/** y = k cắt y = ax² + bx + c đúng một điểm: biệt thức bằng 0. */
const quadOneSolutionA = mcqT('pd-d-quad-one-solution-a', 'nonlinear_equations', 'hard', (rng) => {
  const a = pickNonZeroInt(rng, -4, 4);
  const m = pickNonZeroInt(rng, -3, 3);
  const k = pickNonZeroInt(rng, -6, 6);
  const dd = a * m * m;
  const b = 2 * a * m;
  const c = dd + k;
  const dists = [
    nd(-a, 'sign_flip', 'Chuyển k sang vế trái mà không đổi dấu hằng số.'),
    nd(2 * a, null, 'Biệt thức là b² − 4ac, không phải b² − 2ac.'),
    c !== 0 ? nd(rat(b * b, 4 * c), 'moved_term_wrong_side', `Quên trừ ${k} ở vế phải: hằng số của phương trình là ${c} − (${k}).`) : null,
    nd(rat(b, 4 * dd), null, 'Quên bình phương b.'),
  ].filter((x): x is NumDist => x !== null);
  const { choices, correctIndex } = numMcq(a, dists, rng);
  return {
    stem: `In the system of equations y = ${k} and y = ax^2${signedCoefTerm(b, 'x')}${signedTerm(c)}, a is a nonzero constant. If the system has exactly one real solution, what is the value of a?`,
    choices,
    correctIndex,
    steps: [
      S('Cho hai vế bằng nhau rồi chuyển về một vế.', `ax^2${signedCoefTerm(b, 'x')}${signedTerm(dd)} = 0`),
      S('Đúng một nghiệm khi biệt thức bằng 0.', `${par(b)}^2 - 4a(${dd}) = 0`),
      S('Giải ra a.', `a = ${a}`),
    ],
  };
});

/** Bốn dạng tương đương — dạng nào cho thấy ngay giá trị lớn/nhỏ nhất? */
const quadFormShowsExtreme = mcqT('pd-d-quad-form-shows-extreme', 'equivalent_expressions', 'medium', (rng) => {
  const s = rng() < 0.5 ? -1 : 1;
  const p = pickNonZeroInt(rng, -7, 7);
  let q = p + 2 * pickInt(rng, 1, 5);
  if (q === 0) q += 2;
  if (p + q === 0) q += 2;
  const h = (p + q) / 2;
  const k = -s * ((q - p) / 2) ** 2;
  const F = pick(rng, ['f', 'g', 'h', 'p']);
  const vertex = `${F}(x) = ${lead(s)}${xMinus(h)}^2${signedTerm(k)}`;
  const factored = `${F}(x) = ${lead(s)}${xMinus(p)}${xMinus(q)}`;
  const standard = `${F}(x) = ${polyText([s, -s * (p + q), s * p * q])}`;
  const partial = `${F}(x) = ${lead(s)}x${xMinus(p + q)}${signedTerm(s * p * q)}`;
  const word = s < 0 ? 'maximum' : 'minimum';
  const { choices, correctIndex } = textMcq(
    vertex,
    [
      td(factored, null, 'Dạng nhân tử cho thấy hai nghiệm, không cho thấy giá trị cực trị.'),
      td(standard, null, 'Dạng khai triển cho thấy tung độ gốc, không cho thấy cực trị.'),
      td(partial, null, 'Dạng này không phải dạng đỉnh; hằng số ở cuối không phải cực trị.'),
    ],
    rng,
  );
  return {
    stem: `Which of the following equivalent forms of the function ${F} displays the ${word} value of ${F} as a constant or coefficient?`,
    choices,
    correctIndex,
    steps: [
      S('Dạng đỉnh a(x − h)² + k cho ngay cực trị: k.', vertex),
      S(`Hệ số của bình phương ${s < 0 ? 'âm nên đỉnh là điểm cao nhất' : 'dương nên đỉnh là điểm thấp nhất'}.`, `${word} = ${k}`),
    ],
  };
});

/** y = a(x − p)(x − k) có đỉnh (h, v): tìm a. */
const quadFactoredVertexA = mcqT('pd-d-quad-factored-vertex-a', 'nonlinear_functions', 'hard', (rng) => {
  const p = pickInt(rng, -6, 6);
  const d = pickInt(rng, 1, 5);
  const a = pickNonZeroInt(rng, -4, 4);
  const h = p + d;
  const v = -a * d * d;
  const dists = [
    nd(-a, 'sign_flip', `Sai dấu: (${h} − ${par(p)})(${h} − k) là tích một số dương với một số âm.`),
    d > 1 ? nd(rat(-v, d), 'forgot_square_root', 'Quên bình phương khoảng cách từ nghiệm tới trục đối xứng.') : null,
    nd(rat(-v, 4 * d * d), null, 'Dùng khoảng cách giữa HAI nghiệm thay vì từ một nghiệm tới đỉnh.'),
    nd(v, 'stopped_too_early', 'Đây là tung độ đỉnh, chưa phải a.'),
  ].filter((x): x is NumDist => x !== null);
  const { choices, correctIndex } = numMcq(a, dists, rng);
  return {
    stem: `In the xy-plane, the graph of y = a${xMinus(p)}(x - k), where a and k are constants, has its vertex at (${h}, ${v}). What is the value of a?`,
    choices,
    correctIndex,
    steps: [
      S('Đỉnh nằm chính giữa hai nghiệm, nên nghiệm còn lại đối xứng với nghiệm kia qua đỉnh.', `k = 2(${h}) - ${par(p)} = ${2 * h - p}`),
      S('Thay toạ độ đỉnh vào phương trình.', `${v} = a(${d})(${-d})`),
      S('Giải ra a.', `a = ${a}`),
    ],
  };
});

/** Đường y = mx + b và parabol y = x² + bx + c (cùng b) cắt nhau tại (s, k). */
const quadLineParabolaShared = mcqT('pd-d-quad-line-parabola-shared', 'nonlinear_equations', 'hard', (rng) => {
  const m = pickNonZeroInt(rng, -4, 4);
  const s = pick(rng, [-3, -2, -1, 2, 3, 4]);
  const b = pickNonZeroInt(rng, -6, 6);
  const c = b * (1 - s) - s * s + m * s;
  const k = m * s + b;
  const { choices, correctIndex } = numMcq(
    k,
    [
      nd(b, 'solved_for_wrong_var', 'Đây là b; đề hỏi tung độ k của giao điểm.'),
      nd(m * s - b, 'sign_flip', 'Giải ra b sai dấu.'),
      nd(s * s + c, null, 'Thay vào parabol mà bỏ mất số hạng bx.'),
    ],
    rng,
  );
  return {
    stem: `In the xy-plane, the line y = ${coefTerm(m)} + b and the parabola y = x^2 + bx${signedTerm(c)}, where b is a constant, intersect at the point (${s}, k). What is the value of k?`,
    choices,
    correctIndex,
    steps: [
      S('Điểm chung nằm trên cả hai đồ thị: cho hai biểu thức bằng nhau tại x = s.', `${m * s} + b = ${s * s} + ${par(s)}b${signedTerm(c)}`),
      S('Giải ra b.', `b = ${b}`),
      S('Thay vào phương trình đường thẳng.', `k = ${m}(${s})${signedTerm(b)} = ${k}`),
    ],
  };
});

const CH15: MathTemplate[] = [
  quadInterceptDistance,
  quadIrrationalRoots,
  quadFractionRoot,
  quadSmallerRootSquare,
  quadSumExpanded,
  quadSystemTwoSolutions,
  quadLineMeetsVertex,
  quadVertexRootEquation,
  quadMaxTime,
  quadBreakEven,
  quadOneSolutionA,
  quadFormShowsExtreme,
  quadFactoredVertexA,
  quadLineParabolaShared,
];

// ================================================================ Chương 16 — Chia đa thức

/** "Thương + dư/số chia": (ax + c)/(x − b) = a + (ab + c)/(x − b). */
function plusFrac(head: string, R: number, den: string): string {
  if (R === 0) return head;
  return `${head} ${R < 0 ? '-' : '+'} frac(${Math.abs(R)},${den})`;
}

const divLinearOverLinear = mcqT('pd-d-div-linear-over-linear', 'equivalent_expressions', 'easy', (rng) => {
  const a = pickInt(rng, 2, 7);
  const b = pickNonZeroInt(rng, -6, 6);
  const c = pick(rng, [0, 0, pickNonZeroInt(rng, -5, 5)]);
  let R = a * b + c;
  const cc = R === 0 ? c + 1 : c;
  R = a * b + cc;
  const den = linearSide(1, -b);
  const { choices, correctIndex } = textMcq(
    plusFrac(String(a), R, den),
    [
      td(plusFrac(String(a), -R, den), 'sign_flip', 'Số dư sai dấu: nhân ngược lại (thương × số chia + dư) phải ra đúng tử số.'),
      cc === 0
        ? td(plusFrac(String(a), b, den), 'stopped_too_early', `Quên nhân với ${a}: số dư là ${a} × ${par(b)}.`)
        : td(plusFrac(String(a), cc, den), 'stopped_too_early', `Chỉ giữ hằng số ban đầu của tử; phần ${a} × ${par(b)} sinh ra khi chia cũng thuộc số dư.`),
      td(plusFrac(String(a), R, linearSide(1, b)), 'sign_flip', 'Viết sai số chia.'),
      td(plusFrac(`${a}x`, R, den), null, 'Thương của hai biểu thức bậc nhất là một hằng số, không còn x.'),
    ],
    rng,
  );
  return {
    stem: `Which of the following is equivalent to frac(${linearSide(a, cc)},${den})?`,
    choices,
    correctIndex,
    steps: [
      S('Viết tử số theo số chia: thêm bớt cho xuất hiện đúng bội của số chia.', `${linearSide(a, cc)} = ${a}(${den})${signedTerm(R)}`),
      S('Tách phân số.', plusFrac(String(a), R, den)),
    ],
  };
});

/** frac(N, sx + t) = Q ± frac(|R|, sx + t): tìm thương Q. */
const divFindQuotient = mcqT('pd-d-div-find-quotient', 'equivalent_expressions', 'medium', (rng) => {
  const L = pick(rng, ['Q', 'A']);
  const s = pickInt(rng, 1, 3);
  const t = pickNonZeroInt(rng, -5, 5);
  const u = pickInt(rng, 1, 3);
  const v = pickNonZeroInt(rng, -6, 6);
  const R = pickNonZeroInt(rng, -9, 9);
  const N = [u * s, u * t + v * s, v * t + R];
  const den = linearSide(s, t);
  const Q = linearSide(u, v);
  const { choices, correctIndex } = textMcq(
    Q,
    [
      td(linearSide(u, -v), 'sign_flip', 'Hằng số của thương sai dấu.'),
      td(linearSide(u, v + R), null, 'Gộp luôn số dư vào thương.'),
      td(linearSide(u * s, v), null, `Quên chia hệ số đầu cho ${s}.`),
      td(linearSide(u, v - R), null, 'Trừ số dư vào thương.'),
      td(linearSide(u + 1, v), null, 'Hệ số đầu của thương sai: nhân ngược lại phải ra đúng hệ số của x².'),
      td(linearSide(u, v + t), null, 'Cộng nhầm hằng số của số chia vào thương.'),
    ],
    rng,
  );
  return {
    stem: `If frac(${polyText(N)},${den}) = ${plusFrac(L, R, den)}, where ${L} is a polynomial, what is ${L}?`,
    choices,
    correctIndex,
    steps: [
      S('Nhân hai vế với số chia.', `${polyText(N)} = ${L}(${den})${signedTerm(R)}`),
      S('Chuyển số dư sang trái, rồi chia (hoặc đoán thương bậc nhất từ hệ số đầu).', `${polyText([N[0]!, N[1]!, N[2]! - R])} = (${Q})(${den})`),
      S('Vậy thương là', `${L} = ${Q}`),
    ],
  };
});

/** ax² + bx + c = A(qx − 1) + R: số dư là giá trị tại x = 1/q. */
const divRemainderFraction = gridT('pd-d-div-remainder-fraction', 'nonlinear_functions', 'hard', (rng) => {
  const q = pickInt(rng, 2, 3);
  const a = pickInt(rng, 1, 9);
  const b = pickInt(rng, -4, 4);
  const c = pickInt(rng, -3, 3);
  const R = rat(a + b * q + c * q * q, q * q);
  return {
    stem: `The expression ${quadraticSide(a, b, c)} can be written as A(${q}x - 1) + R, where A is a polynomial and R is a constant. What is the value of R?`,
    answer: R,
    steps: [
      S('Chọn x làm cho số chia bằng 0 thì số hạng chứa A biến mất (định lý số dư).', `${q}x - 1 = 0   ⇒   x = frac(1,${q})`),
      S('Thay giá trị đó vào đa thức.', `R = ${a}(frac(1,${q}))^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}(frac(1,${q}))${signedTerm(c)} = ${fx(R)}`),
    ],
  };
});

/** Bảng giá trị của g → số dư khi chia cho x ± k là g(∓k). */
const divTableRemainder = mcqT('pd-d-div-table-remainder', 'nonlinear_functions', 'easy', (rng) => {
  const X = [-3, -2, -1, 0, 1, 2, 3];
  const g = shuffleCopy(range(-9, 9), rng).slice(0, 7);
  const k = pickNonZeroInt(rng, -3, 3);
  const at = (x: number) => g[X.indexOf(x)]!;
  const div = linearSide(1, -k);
  const { choices, correctIndex } = numMcq(
    at(k),
    [
      nd(at(-k), 'sign_flip', `Chia cho ${div} thì thay x = ${k}, không phải x = ${-k}.`),
      nd(0, null, 'Số dư bằng 0 chỉ khi số chia là một nhân tử.'),
      nd(at(0), null, 'Đây là g(0) — hằng số của đa thức, không phải số dư.'),
    ],
    rng,
  );
  return {
    stem: `The table shows several values of the polynomial function g. What is the remainder when g(x) is divided by ${div}?`,
    figure: fnTable(X, [{ name: 'g(x)', ys: g }], 'Values of g'),
    choices,
    correctIndex,
    steps: [
      S(`Định lý số dư: số dư khi chia cho ${div} là giá trị của g tại nghiệm của số chia.`, `${div} = 0   ⇒   x = ${k}`),
      S('Đọc bảng.', `g(${k}) = ${at(k)}`),
    ],
  };
});

/** (x − r) là nhân tử → p(r) = 0 → tìm hệ số k. Điền số. */
const divFactorKGrid = gridT('pd-d-div-factor-k-grid', 'nonlinear_functions', 'medium', (rng) => {
  const r = pick(rng, [1, -1, 2, -2]);
  const a = pickInt(rng, 1, 4);
  const b = pickInt(rng, -6, 6);
  const k = pickInt(rng, -9, 12);
  const c = k * r * r - a * r ** 3 - b * r;
  const v = pick(rng, ['x', 'z', 't']);
  const expr = `${coefTerm(a, `${v}^3`)} - k${v}^2${signedCoefTerm(b, v)}${signedTerm(c)}`;
  return {
    stem: `In the polynomial p(${v}) = ${expr}, k is a constant. If ${linearSide(1, -r, v)} is a factor of p(${v}), what is the value of k?`,
    answer: rat(k),
    steps: [
      S(`${linearSide(1, -r, v)} là nhân tử nghĩa là p(${r}) = 0.`, `${a}(${r})^3 - k(${r})^2${signedCoefTerm(b, `(${r})`)}${signedTerm(c)} = 0`),
      S('Tính các số hạng đã biết rồi giải ra k.', `${a * r ** 3 + b * r + c} - ${r * r}k = 0   ⇒   k = ${k}`),
    ],
  };
});

/** ax² + bx + c = A(x + d) + B, A là đa thức bậc nhất: tìm A. */
const divIdentityQuotient = mcqT('pd-d-div-identity-quotient', 'equivalent_expressions', 'medium', (rng) => {
  const u = pickInt(rng, 1, 4);
  const v = pickNonZeroInt(rng, -8, 8);
  const d = pickNonZeroInt(rng, -5, 5);
  const B = pickNonZeroInt(rng, -9, 9);
  const coefs = [u, u * d + v, v * d + B];
  const A = linearSide(u, v);
  const { choices, correctIndex } = textMcq(
    A,
    [
      td(linearSide(u, -v), 'sign_flip', 'Hằng số của A sai dấu.'),
      td(linearSide(u, v + B), null, 'Gộp cả số dư B vào A.'),
      td(linearSide(u, coefs[1]!), null, 'Chép hệ số bậc một của vế trái sang A; phải trừ đi phần sinh ra từ phép nhân.'),
      td(linearSide(u, v + 2 * d), null, 'Tính sai khi nhân A với số chia.'),
      td(linearSide(u + 1, v), null, 'Hệ số đầu của A sai: phải khớp hệ số của x².'),
      td(linearSide(u, -v - d), null, 'Tính sai hệ số bậc một.'),
    ],
    rng,
  );
  return {
    stem: `In the equation ${polyText(coefs)} = A(${linearSide(1, d)}) + B, A is a polynomial and B is a constant. Which of the following is A?`,
    choices,
    correctIndex,
    steps: [
      S('A bậc nhất, hệ số đầu khớp với hệ số của x².', `A = ${coefTerm(u)} + m`),
      S('So hệ số của x ở hai vế.', `${u}(${d}) + m = ${coefs[1]}   ⇒   m = ${v}`),
      S('Số dư là phần còn lại.', `A = ${A},   B = ${B}`),
    ],
  };
});

/** Lx² + bx + c = (Lx + β)(x − d) + e: tìm L + β + e. */
const divIdentitySum = mcqT('pd-d-div-identity-sum', 'equivalent_expressions', 'hard', (rng) => {
  const L = pickInt(rng, 1, 3);
  const b = pickInt(rng, -8, 8);
  const c = pickInt(rng, -9, 9);
  const d = pickNonZeroInt(rng, -4, 4);
  const beta = b + L * d;
  const e = c + beta * d;
  const betaWrong = b - L * d;
  const { choices, correctIndex } = numMcq(
    L + beta + e,
    [
      nd(L + betaWrong + (c + betaWrong * d), 'sign_flip', `Nhân với (x − ${par(d)}) mà lấy sai dấu khi so hệ số bậc một.`),
      nd(L + beta + c, null, 'Coi số dư e bằng đúng hằng số c của vế trái.'),
      nd(L + b + c, null, 'Chép thẳng hệ số của vế trái.'),
      nd(beta + e, null, 'Quên cộng hệ số a.'),
    ],
    rng,
  );
  return {
    stem: `The equation ${quadraticSide(L, b, c)} = (ax + b)(${linearSide(1, -d)}) + e is true for all values of x, where a, b, and e are constants. What is the value of a + b + e?`,
    choices,
    correctIndex,
    steps: [
      S('Khai triển vế phải.', `ax^2 + (b - ${par(d)}a)x - ${par(d)}b + e`),
      S('So hệ số từng bậc.', `a = ${L},   b = ${beta},   e = ${e}`),
      S('Cộng lại.', `${L} + ${par(beta)} + ${par(e)} = ${L + beta + e}`),
    ],
  };
});

/** p(r) = 0 → (x − r) phải là nhân tử. Hai biến thể: nghiệm nguyên, nghiệm phân số. */
function rootToFactor(slug: string, fraction: boolean) {
  return mcqT(slug, 'nonlinear_functions', fraction ? 'hard' : 'medium', (rng) => {
    const r = pickNonZeroInt(rng, -6, 6);
    let sArg = pickNonZeroInt(rng, -6, 6);
    if (sArg === r || sArg === -r) sArg = r > 0 ? r + 1 : r - 1;
    const val = pickInt(rng, 2, 9);
    if (!fraction) {
      const { choices, correctIndex } = textMcq(
        linearSide(1, -r),
        [
          td(linearSide(1, r), 'sign_flip', `p(${r}) = 0 cho nhân tử (x − ${par(r)}), không phải ngoặc ngược dấu.`),
          td(linearSide(1, -sArg), null, `p(${sArg}) = ${val} khác 0, nên x − ${par(sArg)} không phải nhân tử.`),
          td(linearSide(1, -val), null, 'Nhầm giá trị của hàm với nghiệm.'),
          td(linearSide(1, sArg), 'sign_flip', `p(${sArg}) khác 0.`),
        ],
        rng,
      );
      return {
        stem: `For the polynomial function p, p(${r}) = 0 and p(${sArg}) = ${val}. Which of the following must be a factor of p(x)?`,
        choices,
        correctIndex,
        steps: [
          S('Định lý số dư: p(r) = 0 nghĩa là chia p(x) cho x − r dư 0, tức x − r là nhân tử.', `p(${r}) = 0`),
          S('Giá trị khác 0 thì không cho nhân tử nào.', linearSide(1, -r)),
        ],
      };
    }
    const den = pickInt(rng, 2, 5);
    let n = pickNonZeroInt(rng, -4, 4);
    if (gcd(n, den) !== 1) n = n > 0 ? 1 : -1;
    const { choices, correctIndex } = textMcq(
      linearSide(den, -n),
      [
        td(linearSide(den, n), 'sign_flip', 'Sai dấu: nhân tử phải bằng 0 tại x = nghiệm.'),
        td(linearSide(Math.abs(n) === 1 ? den + 1 : Math.abs(n), -Math.sign(n) * den), 'inverted_fraction', 'Lật ngược phân số khi dựng nhân tử.'),
        td(linearSide(1, -n), null, 'Chỉ lấy tử số của nghiệm.'),
        td(linearSide(1, -den), null, 'Chỉ lấy mẫu số của nghiệm.'),
      ],
      rng,
    );
    const F = pick(rng, ['p', 'q', 'h']);
    return {
      stem: `For the polynomial function ${F}, ${F}(${fx(rat(n, den))}) = 0 and ${F}(${sArg}) = ${val}. Which of the following must be a factor of ${F}(x)?`,
      choices,
      correctIndex,
      steps: [
        S('Nghiệm cho nhân tử x trừ nghiệm; nhân với mẫu số để hệ số nguyên — vẫn là nhân tử.', `x - (${fx(rat(n, den))})`),
        S('Nhân với mẫu số.', linearSide(den, -n)),
      ],
    };
  });
}

const divRootToFactor = rootToFactor('pd-d-div-root-to-factor', false);
const divFractionRootFactor = rootToFactor('pd-d-div-fraction-root-factor', true);

/** Đa thức bậc ba cho sẵn: I, II, III — cái nào là nhân tử? */
const divRomanFactors = mcqT('pd-d-div-roman-factors', 'nonlinear_functions', 'hard', (rng) => {
  const roots = sample(rng, [-4, -3, -2, -1, 1, 2, 3, 4], 3);
  const coefs = [1, -(roots[0]! + roots[1]! + roots[2]!), roots[0]! * roots[1]! + roots[0]! * roots[2]! + roots[1]! * roots[2]!, -roots[0]! * roots[1]! * roots[2]!];
  // Ứng viên: vài nghiệm thật, vài nghiệm ngược dấu (bẫy), ít nhất một cái đúng.
  const truthCount = pickInt(rng, 1, 3);
  const cands = [...sample(rng, roots, truthCount), ...sample(rng, [-5, 5, ...roots.map((r) => -r)].filter((r) => !roots.includes(r)), 3 - truthCount)];
  const order = shuffleCopy(cands, rng);
  const truth = order.map((r) => roots.includes(r));
  const { choices, correctIndex } = romanMcq(truth, rng);
  return {
    stem: `The polynomial p is defined by p(x) = ${polyText(coefs)}. Which of the following are factors of p(x)? I. ${linearSide(1, -order[0]!)}; II. ${linearSide(1, -order[1]!)}; III. ${linearSide(1, -order[2]!)}`,
    choices,
    correctIndex,
    steps: [
      S('Với mỗi ứng viên x − r, tính p(r): bằng 0 thì là nhân tử.', order.map((r) => `p(${r}) = ${evalPoly(coefs, r)}`).join(',   ')),
      S('Chỉ những ứng viên cho giá trị 0 là nhân tử.', romanLabel(truth)),
    ],
  };
});

/** Tam thức nào chia hết cho x − r? */
const divWhichDivisible = mcqT('pd-d-div-which-divisible', 'nonlinear_functions', 'medium', (rng) => {
  const r = pickNonZeroInt(rng, -5, 5);
  const s = pickNonZeroInt(rng, -6, 6);
  const A = pickInt(rng, 1, 3);
  const prod = (p: number, q: number) => polyText([A, -A * (p + q), A * p * q]);
  const correct = prod(r, s);
  const pairs: Array<[number, number]> = [[-r, s], [-r, -s], [r + 1, s], [r - 1, -s], [s + 1, -s], [-r, r + 2], [r + 2, s + 3], [-r - 1, 2 * s]];
  const others = pairs
    .filter(([p1, p2]) => p1 !== r && p2 !== r)
    .map(([p1, p2]) => prod(p1, p2))
    .filter((t, i, a) => t !== correct && a.indexOf(t) === i);
  const dists = others.map((t) => td(t, null, `Thay x = ${r} vào biểu thức này không ra 0, nên không chia hết cho ${linearSide(1, -r)}.`));
  const { choices, correctIndex } = textMcq(correct, dists, rng);
  return {
    stem: `Which of the following expressions is divisible by ${linearSide(1, -r)}?`,
    choices,
    correctIndex,
    steps: [
      S(`Chia hết cho ${linearSide(1, -r)} nghĩa là số dư p(${r}) bằng 0. Thử từng lựa chọn tại x = ${r}.`),
      S('Chỉ một biểu thức cho giá trị 0: nó phân tích được thành tích có chứa nhân tử ấy.', `${correct} = ${lead(A)}${xMinus(r)}${xMinus(s)}`),
    ],
  };
});

/** x − 1 và x + 1 đều là nhân tử của ax⁴ + bx³ + cx² + dx + e: tìm a. */
const divTwoFactorsA = mcqT('pd-d-div-two-factors-a', 'nonlinear_functions', 'hard', (rng) => {
  const c = pickNonZeroInt(rng, -9, 9);
  const d = pickNonZeroInt(rng, -9, 9);
  let e = pick(rng, [0, pickNonZeroInt(rng, -6, 6)]);
  if (e === -c) e = 0;
  const a = -(c + e);
  const b = -d;
  const tail = `${signedCoefTerm(c, 'x^2')}${signedCoefTerm(d, 'x')}${signedTerm(e)}`;
  const dists = [
    nd(c + e, 'sign_flip', 'Giải hệ đúng nhưng sai dấu khi chuyển vế.'),
    e !== 0 ? nd(-c, null, 'Bỏ quên hằng số e khi thay x = 1 và x = −1.') : nd(c, 'sign_flip', 'Sai dấu.'),
    nd(b, 'solved_for_wrong_var', 'Đây là giá trị của b.'),
    nd(2 * a, null, 'Cộng hai phương trình mà quên chia cho 2.'),
  ];
  const { choices, correctIndex } = numMcq(a, dists, rng);
  return {
    stem: `In the polynomial p(x) = ax^4 + bx^3${tail}, a and b are constants. If x - 1 and x + 1 are both factors of p(x), what is the value of a?`,
    choices,
    correctIndex,
    steps: [
      S('Hai nhân tử cho hai điều kiện: p(1) = 0 và p(−1) = 0.', `a + b${signedTerm(c + d + e)} = 0   và   a - b${signedTerm(c - d + e)} = 0`),
      S('Cộng hai phương trình để khử b.', `2a${signedTerm(2 * (c + e))} = 0   ⇒   a = ${a}`),
    ],
  };
});

const CH16: MathTemplate[] = [
  divLinearOverLinear,
  divFindQuotient,
  divRemainderFraction,
  divTableRemainder,
  divFactorKGrid,
  divIdentityQuotient,
  divIdentitySum,
  divRootToFactor,
  divRomanFactors,
  divWhichDivisible,
  divTwoFactorsA,
  divFractionRootFactor,
];

// ================================================================ Chương 17 — Số phức

/** "a + bi" với phần thực, phần ảo nguyên; bỏ phần bằng 0 và hệ số 1. */
function cxs(re: number, im: number): string {
  const imBody = Math.abs(im) === 1 ? 'i' : `${Math.abs(im)}i`;
  if (im === 0) return String(re);
  if (re === 0) return `${im < 0 ? '-' : ''}${imBody}`;
  return `${re} ${im < 0 ? '-' : '+'} ${imBody}`;
}

const INOTE = 'where i = sqrt(-1)';

/** Bốn nhiễu số phức từ các cặp (thực, ảo); bỏ cặp trùng đáp án. */
function cxMcq(re: number, im: number, dists: Array<[number, number, Tag, string]>, rng: Rng) {
  return textMcq(
    cxs(re, im),
    dists.map(([a, b, tag, note]) => td(cxs(a, b), tag, note)),
    rng,
  );
}

const cxSubtract = mcqT('pd-d-cx-subtract', 'equivalent_expressions', 'easy', (rng) => {
  const a = pickInt(rng, -9, 9);
  const b = pickNonZeroInt(rng, -9, 9);
  const c = pickNonZeroInt(rng, -9, 9);
  const d = pickNonZeroInt(rng, -9, 9);
  const { choices, correctIndex } = cxMcq(
    a - c,
    b - d,
    [
      [a - c, b + d, 'sign_flip', 'Chỉ đổi dấu phần thực của số bị trừ, quên đổi dấu phần ảo.'],
      [a + c, b + d, 'sign_flip', 'Cộng thay vì trừ.'],
      [a + c, b - d, 'sign_flip', 'Quên đổi dấu phần thực của số bị trừ.'],
      [a - c, d - b, 'sign_flip', 'Trừ ngược phần ảo.'],
    ],
    rng,
  );
  return {
    stem: `Which of the following is equivalent to (${cxs(a, b)}) - (${cxs(c, d)}), ${INOTE}?`,
    choices,
    correctIndex,
    steps: [
      S('Dấu trừ trước ngoặc đổi dấu CẢ HAI phần của số thứ hai.', `${a} - ${par(c)} + (${b} - ${par(d)})i`),
      S('Gộp phần thực với phần thực, phần ảo với phần ảo.', cxs(a - c, b - d)),
    ],
  };
});

/** k·i·(a + qi) = −kq + ka·i. */
const cxITimes = mcqT('pd-d-cx-i-times', 'equivalent_expressions', 'easy', (rng) => {
  const k = pickNonZeroInt(rng, -5, 5);
  const a = pickNonZeroInt(rng, -8, 8);
  const q = pickNonZeroInt(rng, -6, 6);
  const { choices, correctIndex } = cxMcq(
    -k * q,
    k * a,
    [
      [k * q, k * a, 'sign_flip', 'Coi i² bằng 1. Thật ra i² = −1.'],
      [-k * q, -k * a, 'sign_flip', 'Phần ảo sai dấu.'],
      [k * a, -k * q, null, 'Đảo phần thực với phần ảo.'],
      [0, k * a + k * q, null, 'Coi mọi số hạng đều là số ảo, quên i² là số thực.'],
    ],
    rng,
  );
  const ki = k === 1 ? 'i' : k === -1 ? '-i' : `${k}i`;
  return {
    stem: `Which of the following is equivalent to ${ki}(${cxs(a, q)}), ${INOTE}?`,
    choices,
    correctIndex,
    steps: [
      S('Nhân phân phối.', `${ki}(${a}) + ${ki}(${q}i) = ${k * a}i + ${par(k * q)}i^2`),
      S('Thay i² = −1 rồi viết phần thực trước.', cxs(-k * q, k * a)),
    ],
  };
});

/** a·i^m + b·i^n + c: đổi luỹ thừa của i theo chu kỳ 4. */
const iPow = (n: number): [number, number] => [[1, 0], [0, 1], [-1, 0], [0, -1]][n % 4] as [number, number];

const cxPowerSum = mcqT('pd-d-cx-power-sum', 'equivalent_expressions', 'medium', (rng) => {
  const [m, n] = sample(rng, [2, 3, 4, 5, 6, 7, 8], 2) as [number, number];
  const a = pickNonZeroInt(rng, -5, 5);
  const b = pickNonZeroInt(rng, -5, 5);
  const c = pickInt(rng, -9, 9);
  const [mr, mi] = iPow(m);
  const [nr, ni] = iPow(n);
  const re = a * mr + b * nr + c;
  const im = a * mi + b * ni;
  const term = (k: number, p: number, first: boolean) => {
    const body = Math.abs(k) === 1 ? `i^${p}` : `${Math.abs(k)}i^${p}`;
    return first ? `${k < 0 ? '-' : ''}${body}` : ` ${k < 0 ? '-' : '+'} ${body}`;
  };
  const { choices, correctIndex } = cxMcq(
    re,
    im,
    [
      [a + b + c, 0, 'sign_flip', 'Coi mọi luỹ thừa của i đều bằng 1.'],
      [-a * mr - b * nr + c, -im, 'sign_flip', 'Nhớ sai chu kỳ: i² = −1, i³ = −i, i⁴ = 1.'],
      [re, -im, 'sign_flip', 'Nhầm i³ với i (hoặc ngược lại).'],
      [re + 2, im, null, 'Tính sai một luỹ thừa chẵn của i.'],
      [re - 2, im, null, 'Tính sai một luỹ thừa chẵn của i.'],
      [re, im + 2, null, 'Tính sai một luỹ thừa lẻ của i.'],
    ],
    rng,
  );
  return {
    stem: `Which of the following is equivalent to ${term(a, m, true)}${term(b, n, false)}${signedTerm(c)}, ${INOTE}?`,
    choices,
    correctIndex,
    steps: [
      S('Luỹ thừa của i lặp lại sau mỗi 4 bậc: i, −1, −i, 1. Lấy số mũ chia 4 và nhìn số dư.', `i^${m} = ${cxs(mr, mi)},   i^${n} = ${cxs(nr, ni)}`),
      S('Thay vào rồi gộp.', cxs(re, im)),
    ],
  };
});

/** (a + bi)(c + di) = x + yi: tìm x (phần thực). */
const cxProductRealPart = mcqT('pd-d-cx-product-real-part', 'equivalent_expressions', 'medium', (rng) => {
  const a = pickInt(rng, 1, 8);
  const b = pickNonZeroInt(rng, -7, 7);
  const c = pickInt(rng, 1, 8);
  const d = pickNonZeroInt(rng, -7, 7);
  const x = a * c - b * d;
  const { choices, correctIndex } = numMcq(
    x,
    [
      nd(a * c + b * d, 'sign_flip', 'Coi i² bằng 1, nên tích hai phần ảo mang nhầm dấu.'),
      nd(a * c, 'forgot_distribute', 'Chỉ nhân phần thực với phần thực, quên tích hai phần ảo cũng ra số thực.'),
      nd(a * d + b * c, 'solved_for_wrong_var', 'Đây là phần ảo y.'),
    ],
    rng,
  );
  return {
    stem: `If (${cxs(a, b)})(${cxs(c, d)}) = x + yi, where x and y are real numbers and i = sqrt(-1), what is the value of x?`,
    choices,
    correctIndex,
    steps: [
      S('Nhân phân phối bốn cặp.', `${a * c} + ${par(a * d)}i + ${par(b * c)}i + ${par(b * d)}i^2`),
      S('i² = −1 nên tích hai phần ảo thành số thực, đổi dấu.', `x = ${a * c} - ${par(b * d)} = ${x}`),
    ],
  };
});

/** p(i + a) − q(b − ci): phân phối rồi gộp. */
const cxDistributeCombine = mcqT('pd-d-cx-distribute-combine', 'equivalent_expressions', 'medium', (rng) => {
  const p = pickInt(rng, 2, 6);
  const a = pickNonZeroInt(rng, -6, 6);
  const q = pickInt(rng, 2, 6);
  const b = pickNonZeroInt(rng, -6, 6);
  const c = pickInt(rng, 1, 6);
  const re = p * a - q * b;
  const im = p + q * c;
  const { choices, correctIndex } = cxMcq(
    re,
    im,
    [
      [p * a - q * b, p - q * c, 'sign_flip', 'Quên rằng trừ một số âm là cộng.'],
      [p * a - b, p - c, 'forgot_distribute', `Chỉ nhân ${q} với số hạng đầu trong ngoặc thứ hai.`],
      [p * a + q * b, im, 'sign_flip', 'Quên đổi dấu phần thực của ngoặc thứ hai.'],
      [a - q * b, 1 + q * c, 'forgot_distribute', `Quên nhân ${p} vào ngoặc thứ nhất.`],
    ],
    rng,
  );
  return {
    stem: `Which of the following is equivalent to ${p}(i${signedTerm(a)}) - ${q}(${b} - ${c === 1 ? '' : c}i), ${INOTE}?`,
    choices,
    correctIndex,
    steps: [
      S('Nhân phân phối cả hai ngoặc, cẩn thận dấu trừ ở giữa.', `${p}i + ${par(p * a)} - ${par(q * b)} + ${q * c}i`),
      S('Gộp phần thực và phần ảo.', cxs(re, im)),
    ],
  };
});

/** p·i(i + a) − q·i(i − b). */
const cxIDistributeDiff = mcqT('pd-d-cx-i-distribute-diff', 'equivalent_expressions', 'medium', (rng) => {
  const p = pickInt(rng, 2, 6);
  const a = pickInt(rng, 1, 7);
  const q = pickInt(rng, 1, 6);
  const b = pickInt(rng, 1, 7);
  const re = q - p;
  const im = p * a + q * b;
  const qi = q === 1 ? 'i' : `${q}i`;
  const { choices, correctIndex } = cxMcq(
    re,
    im,
    [
      [p - q, im, 'sign_flip', 'Coi i² bằng 1.'],
      [re, p * a - q * b, 'sign_flip', 'Quên dấu trừ trước ngoặc thứ hai đổi dấu cả số hạng −bi.'],
      [-p - q, im, 'sign_flip', 'Dấu trừ trước ngoặc thứ hai không được áp vào i².'],
      [re, -im, 'sign_flip', 'Phần ảo sai dấu.'],
    ],
    rng,
  );
  return {
    stem: `Which of the following is equivalent to ${p}i(i + ${a}) - ${qi}(i - ${b}), ${INOTE}?`,
    choices,
    correctIndex,
    steps: [
      S('Nhân phân phối.', `${p}i^2 + ${p * a}i - ${q}i^2 + ${q * b}i`),
      S('Thay i² = −1.', `${-p} + ${q} + ${im}i = ${cxs(re, im)}`),
    ],
  };
});

/** i^n với n lớn: lấy n chia 4. */
const cxBigPower = mcqT('pd-d-cx-big-power', 'equivalent_expressions', 'medium', (rng) => {
  const n = pickInt(rng, 21, 400);
  const k = pick(rng, [1, 1, 2, 3, -1, -2]);
  const [r, im] = iPow(n);
  const all: Array<[number, number]> = [[k, 0], [0, k], [-k, 0], [0, -k]];
  const correct = cxs(k * r, k * im);
  const dists = all
    .map(([a, b]) => cxs(a, b))
    .filter((t) => t !== correct)
    .map((t) => td(t, null, `Số dư khi chia ${n} cho 4 là ${n % 4}; đối chiếu lại chu kỳ i, −1, −i, 1.`));
  const { choices, correctIndex } = textMcq(correct, dists, rng);
  const lhs = k === 1 ? `i^${n}` : k === -1 ? `-i^${n}` : `${k}i^${n}`;
  return {
    stem: `Which of the following is equivalent to ${lhs}, ${INOTE}?`,
    choices,
    correctIndex,
    steps: [
      S('i⁴ = 1, nên bỏ đi mọi bội của 4 trong số mũ.', `${n} = 4 × ${Math.floor(n / 4)} + ${n % 4}`),
      S('Chỉ còn lại luỹ thừa nhỏ.', `i^${n} = ${n % 4 === 0 ? '1' : `i^${n % 4}`} = ${cxs(r, im)}`),
    ],
  };
});

/** (a − bi)²: khai triển có số hạng giữa và i² = −1. */
const cxSquare = mcqT('pd-d-cx-square', 'equivalent_expressions', 'medium', (rng) => {
  const a = pickNonZeroInt(rng, -8, 8);
  let b = pickNonZeroInt(rng, -6, 6);
  if (Math.abs(b) === Math.abs(a)) b = b > 0 ? b + 1 : b - 1;
  const re = a * a - b * b;
  const im = 2 * a * b;
  const { choices, correctIndex } = cxMcq(
    re,
    im,
    [
      [a * a + b * b, im, 'sign_flip', 'Coi i² bằng 1.'],
      [a * a - b * b, 0, 'expanded_without_middle_term', 'Bình phương từng phần mà thiếu số hạng giữa 2ab·i.'],
      [a * a + b * b, 0, 'expanded_without_middle_term', 'Thiếu số hạng giữa và sai dấu i².'],
      [re, -im, 'sign_flip', 'Số hạng giữa sai dấu.'],
    ],
    rng,
  );
  return {
    stem: `Which of the following is equivalent to (${cxs(a, b)})^2, ${INOTE}?`,
    choices,
    correctIndex,
    steps: [
      S('Khai triển bình phương một tổng: đủ ba số hạng.', `${par(a)}^2 + 2(${a})(${b}i) + (${b}i)^2`),
      S('(bi)² = b²·i² = −b².', `${a * a} + ${par(im)}i - ${b * b} = ${cxs(re, im)}`),
    ],
  };
});

/** Tổng các số hạng k / i^m: 1/i = −i, 1/i² = −1, 1/i³ = i, 1/i⁴ = 1. */
const invPow = (m: number): [number, number] => [[1, 0], [0, -1], [-1, 0], [0, 1]][m % 4] as [number, number];

const cxReciprocalPowers = mcqT('pd-d-cx-reciprocal-powers', 'equivalent_expressions', 'hard', (rng) => {
  const pows = sample(rng, [1, 2, 3, 4, 5, 6], 3).sort((x, y) => x - y);
  const ks = pows.map(() => pickNonZeroInt(rng, -4, 4));
  let re = 0;
  let im = 0;
  pows.forEach((m, j) => {
    const [r, i] = invPow(m);
    re += ks[j]! * r;
    im += ks[j]! * i;
  });
  // Nhiễu: coi 1/i = i (tức dùng i^m thay vì i^−m).
  let wr = 0;
  let wi = 0;
  pows.forEach((m, j) => {
    const [r, i] = iPow(m);
    wr += ks[j]! * r;
    wi += ks[j]! * i;
  });
  const terms = pows
    .map((m, j) => {
      const k = ks[j]!;
      const f = `frac(${Math.abs(k)},${m === 1 ? 'i' : `i^${m}`})`;
      return j === 0 ? `${k < 0 ? '-' : ''}${f}` : ` ${k < 0 ? '-' : '+'} ${f}`;
    })
    .join('');
  const { choices, correctIndex } = cxMcq(
    re,
    im,
    [
      [wr, wi, 'inverted_fraction', 'Coi 1/i bằng i. Thật ra 1/i = −i (nhân cả tử và mẫu với i).'],
      [re, -im, 'sign_flip', 'Phần ảo sai dấu.'],
      [-re, im, 'sign_flip', 'Phần thực sai dấu: 1/i² = −1.'],
      [re + im, 0, null, 'Gộp nhầm phần ảo vào phần thực.'],
      [re, im + 1, null, 'Đổi sai một số hạng có luỹ thừa lẻ của i.'],
      [re - 1, im, null, 'Đổi sai một số hạng có luỹ thừa chẵn của i.'],
      [re + 1, im - 1, null, 'Đổi sai hai số hạng.'],
    ],
    rng,
  );
  return {
    stem: `Which of the following is equivalent to ${terms}, ${INOTE}?`,
    choices,
    correctIndex,
    steps: [
      S('Nhân tử và mẫu với i để khử i ở mẫu: 1/i = −i. Các luỹ thừa khác suy ra theo chu kỳ.', 'frac(1,i) = -i,   frac(1,i^2) = -1,   frac(1,i^3) = i,   frac(1,i^4) = 1'),
      S('Thay từng số hạng rồi gộp.', cxs(re, im)),
    ],
  };
});

/** (−ka + kb·i)/(b + ai) = ki: chia số phức ra số thuần ảo. */
const cxDividePure = mcqT('pd-d-cx-divide-pure', 'equivalent_expressions', 'hard', (rng) => {
  const a = pickInt(rng, 1, 6);
  let b = pickInt(rng, 1, 6);
  if (b === a) b += 1;
  const k = pickNonZeroInt(rng, -3, 3);
  // (ki)(b + ai) = −ka + kb·i
  const nr = -k * a;
  const ni = k * b;
  const n2 = a * a + b * b;
  const { choices, correctIndex } = cxMcq(
    0,
    k,
    [
      [0, -k, 'sign_flip', 'Sai dấu khi nhân với số phức liên hợp.'],
      [k, 0, null, 'Kết quả là số thuần ảo, không phải số thực.'],
      [0, k * n2, 'stopped_too_early', `Quên chia cho ${n2} (tổng hai bình phương ở mẫu).`],
      [nr, 0, null, 'Chia riêng phần thực cho phần thực.'],
    ],
    rng,
  );
  return {
    stem: `Which of the following is equivalent to frac(${cxs(nr, ni)},${cxs(b, a)}), ${INOTE}?`,
    choices,
    correctIndex,
    steps: [
      S('Nhân cả tử và mẫu với số liên hợp của mẫu.', `frac((${cxs(nr, ni)})(${cxs(b, -a)}),${b}^2 + ${a}^2)`),
      S('Tử số chỉ còn phần ảo; chia cho mẫu.', `frac(${cxs(0, k * n2)},${n2}) = ${cxs(0, k)}`),
    ],
  };
});

const CH17: MathTemplate[] = [
  cxSubtract,
  cxITimes,
  cxPowerSum,
  cxProductRealPart,
  cxDistributeCombine,
  cxIDistributeDiff,
  cxBigPower,
  cxSquare,
  cxReciprocalPowers,
  cxDividePure,
];

// ================================================================ Chương 18 — Giá trị tuyệt đối

const absIn = (a: number, v = 'x') => `|${linearSide(1, a, v)}|`;

/** |f(k)| với f bậc hai cho giá trị âm tại k. */
const absOfQuadratic = mcqT('pd-d-abs-of-quadratic', 'nonlinear_functions', 'easy', (rng) => {
  const b = pickInt(rng, 1, 6);
  const k = pickInt(rng, 1, 5);
  const v = pickInt(rng, 1, 12);
  const c = k * k - b * k + v;
  const f = (x: number) => x * x - b * x - c;
  const { choices, correctIndex } = numMcq(
    v,
    [
      nd(-v, 'sign_flip', 'Đây là f(k); trị tuyệt đối bỏ dấu âm.'),
      nd(Math.abs(f(-k)), 'sign_flip', `Thay x = −${k} thay vì x = ${k}.`),
      nd(Math.abs(k * k + b * k - c), 'sign_flip', 'Sai dấu số hạng bậc một khi thay số.'),
    ],
    rng,
  );
  return {
    stem: `The function f is defined by f(x) = ${quadraticSide(1, -b, -c)}. What is the value of |f(${k})|?`,
    choices,
    correctIndex,
    steps: [
      S('Tính f(k) trước.', `f(${k}) = ${k * k} - ${b * k} - ${c} = ${-v}`),
      S('Trị tuyệt đối là khoảng cách tới 0 — luôn không âm.', `|${-v}| = ${v}`),
    ],
  };
});

/** Biểu thức nào có thể bằng −m? Chỉ loại |…| − q với q ≥ m. */
const absCanEqualNegative = mcqT('pd-d-abs-can-equal-negative', 'nonlinear_functions', 'medium', (rng) => {
  const m = pickInt(rng, 2, 9);
  const a = pickNonZeroInt(rng, -6, 6);
  const q = m + pickInt(rng, 0, 4);
  const b = pickNonZeroInt(rng, -6, 6);
  const r = pickInt(rng, 0, 5);
  const { choices, correctIndex } = textMcq(
    `${absIn(a)} - ${q}`,
    [
      td(`${absIn(b)} + ${r === 0 ? m : r}`, null, 'Trị tuyệt đối không âm, cộng thêm số dương thì không thể âm.'),
      td(`${absIn(-a)} - ${m - 1}`, null, `Nhỏ nhất chỉ là −${m - 1}, không xuống tới −${m}.`),
      td(`${absIn(a + m)} + ${m}`, null, `Nhỏ nhất là ${m}.`),
      td(`${absIn(b, 'x')} - ${Math.max(0, m - 2) || 1}`, null, `Nhỏ nhất là −${Math.max(0, m - 2) || 1}, lớn hơn −${m}.`),
    ],
    rng,
  );
  return {
    stem: `For which of the following expressions is there a value of x that makes the expression equal to -${m}?`,
    choices,
    correctIndex,
    steps: [
      S('Trị tuyệt đối luôn lớn hơn hoặc bằng 0, nên |…| + c nhỏ nhất bằng c.'),
      S(`Chỉ biểu thức có giá trị nhỏ nhất không vượt quá −${m} mới bằng được −${m}.`, `${absIn(a)} - ${q} = -${m}   ⇔   ${absIn(a)} = ${q - m}`),
    ],
  };
});

/** Đồ thị hình chữ V: đỉnh (h, k), qua một điểm → y = a|x − h| + k. */
const absVGraph = mcqT('pd-d-abs-v-graph', 'nonlinear_functions', 'medium', (rng) => {
  const a = pick(rng, [-2, -1, 1, 2, 3]);
  const h = pickNonZeroInt(rng, -5, 5);
  const k = pickNonZeroInt(rng, -6, 6);
  const t = pickInt(rng, 1, 3);
  const px = h + t;
  const py = k + a * t;
  const show = (aa: number, hh: number, kk: number) => `f(x) = ${lead(aa)}${absIn(-hh)}${signedTerm(kk)}`;
  const dists = [
    td(show(a, -h, k), 'sign_flip', `Đỉnh ở x = ${h} ứng với ${absIn(-h)}.`),
    td(show(a, h, -k), 'sign_flip', 'Tung độ đỉnh là hằng số cộng thêm, giữ nguyên dấu.'),
    td(show(-a, h, k), 'sign_flip', `Sai hướng: thay x = ${px} phải ra ${py}.`),
    td(`f(x) = ${lead(a)}${absIn(-k)}${signedTerm(h)}`, null, 'Đảo hoành độ với tung độ của đỉnh.'),
  ];
  const { choices, correctIndex } = textMcq(show(a, h, k), dists, rng);
  return {
    stem: `In the xy-plane, the graph of the function f is ${a > 0 ? 'V-shaped and opens upward' : 'an upside-down V that opens downward'}, with its vertex at (${h}, ${k}). The graph passes through the point (${px}, ${py}). Which of the following could define f?`,
    choices,
    correctIndex,
    steps: [
      S('Đồ thị trị tuyệt đối có dạng a|x − h| + k với đỉnh (h, k).', `f(x) = a${absIn(-h)}${signedTerm(k)}`),
      S('Thay điểm đã cho để tìm a.', `${py} = a|${px} - ${par(h)}|${signedTerm(k)}   ⇒   a = ${a}`),
    ],
  };
});

/** |x − a| > b: giá trị nào có thể là |x|? */
const absCouldBe = mcqT('pd-d-abs-could-be', 'linear_inequalities', 'hard', (rng) => {
  const a = pickInt(rng, 1, 9);
  const b = a + pickInt(rng, 2, 12);
  const plus = rng() < 0.5;
  const low = b - a;
  const correct = low + pickInt(rng, 1, 2);
  const pool = [low, low - 1, low - 2, a, 0, 1].filter((v, i, arr) => v >= 0 && v <= low && arr.indexOf(v) === i);
  const { choices, correctIndex } = numMcq(
    correct,
    pool.map((v) => nd(v, null, `Nếu |x| = ${v} thì x = ${v} hoặc x = −${v}; cả hai đều không thoả bất phương trình.`)),
    rng,
  );
  const inner = plus ? `x + ${a}` : `x - ${a}`;
  const sol = plus ? `x > ${b - a}   hoặc   x < ${-a - b}` : `x > ${a + b}   hoặc   x < ${a - b}`;
  return {
    stem: `If |${inner}| > ${b}, which of the following could be the value of |x|?`,
    choices,
    correctIndex,
    steps: [
      S('Tách hai trường hợp.', `${inner} > ${b}   hoặc   ${inner} < -${b}   ⇒   ${sol}`),
      S(`Nhánh gần 0 nhất cho |x| lớn hơn ${low}. Chỉ một lựa chọn vượt được ngưỡng ấy.`, `|x| = ${correct}   ⇐   x = ${plus ? correct : -correct}`),
    ],
  };
});

/** Đếm số nguyên thoả |x + a| < b (hoặc ≤). */
const absCountIntegers = gridT('pd-d-abs-count-integers', 'linear_inequalities', 'easy', (rng) => {
  const a = pickNonZeroInt(rng, -9, 9);
  const b = pickInt(rng, 2, 12);
  const strict = rng() < 0.6;
  const count = strict ? 2 * b - 1 : 2 * b + 1;
  return {
    stem: `How many integers x satisfy ${absIn(a)} ${strict ? '<' : '<='} ${b}?`,
    answer: rat(count),
    steps: [
      S('Bỏ trị tuyệt đối thành bất phương trình kẹp.', `${-b} ${strict ? '<' : '<='} ${linearSide(1, a)} ${strict ? '<' : '<='} ${b}   ⇒   ${-b - a} ${strict ? '<' : '<='} x ${strict ? '<' : '<='} ${b - a}`),
      S(strict ? 'Hai đầu mút không được tính.' : 'Tính cả hai đầu mút.', `số nguyên = ${count}`),
    ],
  };
});

/** Bảng của f → giá trị của g = |f| (phần âm lật lên). */
const absReflectValues = mcqT('pd-d-abs-reflect-values', 'nonlinear_functions', 'easy', (rng) => {
  const x0 = pickInt(rng, -3, 0);
  const X = [x0, x0 + 1, x0 + 2, x0 + 3];
  const f = X.map(() => pickNonZeroInt(rng, -9, 9));
  if (f.every((y) => y > 0)) f[pickInt(rng, 0, 3)] = -f[0]!;
  if (f.every((y) => y < 0)) f[pickInt(rng, 0, 3)] = -f[0]!;
  const list = (ys: number[]) => ys.join(', ');
  const { choices, correctIndex } = textMcq(
    list(f.map((y) => Math.abs(y))),
    [
      td(list(f), null, 'Chép nguyên f; trị tuyệt đối lật phần âm lên trên trục hoành.'),
      td(list(f.map((y) => -y)), 'sign_flip', 'Đổi dấu mọi giá trị; chỉ giá trị âm mới đổi dấu.'),
      td(list(f.map((y) => -Math.abs(y))), 'sign_flip', 'Trị tuyệt đối không bao giờ âm.'),
    ],
    rng,
  );
  return {
    stem: `The table shows four values of the function f. The function g is defined by g(x) = |f(x)|. Which of the following lists g(${X[0]}), g(${X[1]}), g(${X[2]}), and g(${X[3]}), in that order?`,
    figure: fnTable(X, [{ name: 'f(x)', ys: f }], 'Values of f'),
    choices,
    correctIndex,
    steps: [
      S('Giá trị không âm giữ nguyên; giá trị âm đổi dấu (đồ thị lật phần dưới trục hoành lên).'),
      S('Áp vào từng giá trị.', list(f.map((y) => Math.abs(y)))),
    ],
  };
});

/** |x − a| = b với x < a → biểu diễn b − x (hoặc x − b, x + b) theo b. */
const absExpress = mcqT('pd-d-abs-express', 'nonlinear_equations', 'hard', (rng) => {
  const a = pickInt(rng, 2, 20);
  const x = pick(rng, ['x', 'y', 'n', 't']);
  const b = pick(rng, ['b', 'k', 'c']);
  const ask = pick(rng, [`${b} - ${x}`, `${x} - ${b}`, `${x} + ${b}`]);
  // x = a − b
  const ans = ask === `${b} - ${x}` ? `2${b} - ${a}` : ask === `${x} - ${b}` ? `${a} - 2${b}` : String(a);
  const pool = [`2${b} - ${a}`, `${a} - 2${b}`, String(a), `-${a}`, `2${b} + ${a}`, `${a} + 2${b}`].filter((t) => t !== ans);
  const { choices, correctIndex } = textMcq(
    ans,
    pool.map((t) => td(t, t === `-${a}` || t === `2${b} + ${a}` ? 'sign_flip' : null, `Dùng nhầm trường hợp ${x} lớn hơn ${a}: ${x} < ${a} nên ${x} − ${a} âm và |${x} − ${a}| = ${a} − ${x}.`)),
    rng,
  );
  return {
    stem: `If |${x} - ${a}| = ${b}, where ${x} < ${a}, what is ${ask} in terms of ${b}?`,
    choices,
    correctIndex,
    steps: [
      S(`${x} < ${a} nên biểu thức trong trị tuyệt đối âm, bỏ trị tuyệt đối phải đổi dấu.`, `${a} - ${x} = ${b}   ⇒   ${x} = ${a} - ${b}`),
      S('Thay vào biểu thức cần tìm.', `${ask} = ${ans}`),
    ],
  };
});

/** Khoảng chấp nhận lo…hi → |w − giữa| ≤ nửa độ rộng. */
const TOL_CONTEXTS = [
  { what: 'the length, in inches, of a bolt made by a machine', v: 'L' },
  { what: 'the weight, in grams, of a bag of rice packed at a factory', v: 'w' },
  { what: 'the temperature, in degrees Celsius, inside a storage room', v: 'T' },
  { what: 'the thickness, in millimeters, of a glass panel', v: 't' },
] as const;

function absTolerance(slug: string, fractions: boolean) {
  return mcqT(slug, 'linear_inequalities', fractions ? 'hard' : 'medium', (rng) => {
    const ctx = pick(rng, TOL_CONTEXTS);
    const den = fractions ? pick(rng, [2, 4, 8]) : 1;
    const loN = pickInt(rng, fractions ? 5 : 20, fractions ? 40 : 600);
    const width = pickInt(rng, 1, fractions ? 6 : 30) * 2;
    const lo = rat(loN, den);
    const hi = rat(loN + width, den);
    const mid = rat(2 * loN + width, 2 * den);
    const half = rat(width, 2 * den);
    const v = ctx.v;
    const ineq = (c: MathValue, r: MathValue, op = '<=', sign = '-') => `|${v} ${sign} ${fx(c)}| ${op} ${fx(r)}`;
    const { choices, correctIndex } = textMcq(
      ineq(mid, half),
      [
        td(ineq(half, mid), null, 'Đảo tâm với bán kính của khoảng.'),
        td(ineq(mid, half, '>='), null, 'Chiều bất đẳng thức ngược: |…| ≥ mô tả các giá trị NẰM NGOÀI khoảng.'),
        td(ineq(mid, half, '<=', '+'), 'sign_flip', 'Tâm của khoảng ứng với dấu trừ bên trong trị tuyệt đối.'),
        td(ineq(lo, hi), null, 'Dùng hai đầu mút thay vì tâm và nửa độ rộng.'),
      ],
      rng,
    );
    return {
      stem: `The acceptable values of ${ctx.what} are from ${fx(lo)} to ${fx(hi)}, inclusive. If ${v} represents an acceptable value, which of the following inequalities describes all acceptable values of ${v}?`,
      choices,
      correctIndex,
      steps: [
        S('Tâm của khoảng là trung bình hai đầu mút.', `frac(${fx(lo)} + ${fx(hi)},2) = ${fx(mid)}`),
        S('Nửa độ rộng là khoảng cách từ tâm tới mỗi đầu mút.', `${fx(hi)} - ${fx(mid)} = ${fx(half)}`),
        S('Khoảng cách từ giá trị tới tâm không vượt quá nửa độ rộng.', ineq(mid, half)),
      ],
    };
  });
}

const absToleranceFraction = absTolerance('pd-d-abs-tolerance-fraction', true);
const absToleranceInt = absTolerance('pd-d-abs-tolerance-int', false);

/** |px − q| = r và |sy + t| = u: tích xy nhỏ nhất (hoặc lớn nhất). */
const absProductExtreme = mcqT('pd-d-abs-product-extreme', 'nonlinear_equations', 'hard', (rng) => {
  const sol = () => {
    const p = pickInt(rng, 1, 4);
    const x2 = pickInt(rng, -6, 3);
    const x1 = x2 + 2 * pickInt(rng, 1, 4);
    return { p, xs: [x1, x2], r: (p * (x1 - x2)) / 2, q: (p * (x1 + x2)) / 2 };
  };
  const X = sol();
  const Y = sol();
  const prods = X.xs.flatMap((x) => Y.xs.map((y) => x * y));
  const smallest = rng() < 0.6;
  const ans = smallest ? Math.min(...prods) : Math.max(...prods);
  const others = [...new Set(prods)].filter((v) => v !== ans);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      ...others.map((v) => nd(v, null, 'Đây là một tích khả dĩ, nhưng không phải cực trị đề hỏi. Phải xét đủ bốn cặp.')),
      nd(X.xs[0]! * Y.xs[0]!, null, 'Chỉ lấy nghiệm dương của mỗi phương trình.'),
    ],
    rng,
  );
  const eqX = `|${linearSide(X.p, -X.q)}| = ${X.r}`;
  const eqY = `|${linearSide(Y.p, -Y.q, 'y')}| = ${Y.r}`;
  return {
    stem: `If ${eqX} and ${eqY}, what is the ${smallest ? 'least' : 'greatest'} possible value of xy?`,
    choices,
    correctIndex,
    steps: [
      S('Mỗi phương trình trị tuyệt đối cho hai nghiệm.', `x = ${X.xs[0]} hoặc x = ${X.xs[1]};   y = ${Y.xs[0]} hoặc y = ${Y.xs[1]}`),
      S('Xét cả bốn tích rồi chọn.', `xy ∈ {${prods.join(', ')}}   ⇒   ${ans}`),
    ],
  };
});

/** |a| < 1: mệnh đề nào chắc chắn đúng? */
const ABS_STATEMENTS: Array<{ text: string; must: boolean }> = [
  { text: 'a^2 < 1', must: true },
  { text: '-1 < a < 1', must: true },
  { text: 'a + 1 > 0', must: true },
  { text: '1 - a > 0', must: true },
  { text: 'a^3 < 1', must: true },
  { text: 'a > 0', must: false },
  { text: 'a^2 < a', must: false },
  { text: 'a < 0', must: false },
  { text: 'a^2 > a', must: false },
  { text: 'a^3 > a', must: false },
  { text: '2a < 1', must: false },
];

const absRomanMust = mcqT('pd-d-abs-roman-must', 'linear_inequalities', 'hard', (rng) => {
  const picks = sample(rng, ABS_STATEMENTS, 3);
  if (!picks.some((p) => p.must)) picks[pickInt(rng, 0, 2)] = pick(rng, ABS_STATEMENTS.filter((p) => p.must && !picks.includes(p)));
  const truth = picks.map((p) => p.must);
  const { choices, correctIndex } = romanMcq(truth, rng);
  return {
    stem: `If |a| < 1, which of the following must be true? I. ${picks[0]!.text}; II. ${picks[1]!.text}; III. ${picks[2]!.text}`,
    choices,
    correctIndex,
    steps: [
      S('|a| < 1 nghĩa là a nằm giữa −1 và 1. Thử những giá trị "khó": số âm, số 0, và số dương nhỏ hơn 1.', 'a = -frac(1,2),   a = 0,   a = frac(1,2)'),
      S('Mệnh đề nào sai với dù chỉ một giá trị thì không "chắc chắn đúng".', romanLabel(truth)),
    ],
  };
});

const CH18: MathTemplate[] = [
  absOfQuadratic,
  absCanEqualNegative,
  absVGraph,
  absCouldBe,
  absCountIntegers,
  absReflectValues,
  absExpress,
  absToleranceFraction,
  absToleranceInt,
  absProductExtreme,
  absRomanMust,
];

// ================================================================ Chương 19 — Góc

const dg = (n: number) => `${n}deg`;

/** Góc ngoài = tổng hai góc trong không kề → tìm một góc trong. */
const angExteriorFindInterior = mcqT('pd-d-ang-exterior-find-interior', 'lines_angles_triangles', 'easy', (rng) => {
  const [P, Q, T, X] = pick(rng, [['A', 'B', 'C', 'D'], ['P', 'Q', 'R', 'S'], ['K', 'L', 'M', 'N'], ['E', 'F', 'G', 'H']] as const);
  const a = pickInt(rng, 25, 80);
  const b = pickInt(rng, 25, 80);
  const E = a + b;
  const { choices, correctIndex } = numMcq(
    b,
    [
      nd(180 - E, null, `Đây là góc trong tại ${T} (bù với góc ngoài), không phải góc ${Q}.`),
      nd(E + a > 179 ? 180 - a : E + a, null, 'Cộng thay vì trừ.'),
      nd(180 - a, 'confused_supplementary_complementary', `Lấy góc bù của góc ${P}.`),
    ],
    rng,
  );
  return {
    stem: `In triangle ${P}${Q}${T}, side ${Q}${T} is extended through ${T} to point ${X}. The measure of angle ${P}${T}${X} is ${dg(E)}, and the measure of angle ${P} is ${dg(a)}. What is the measure of angle ${Q}?`,
    choices,
    correctIndex,
    steps: [
      S(`Góc ngoài ${P}${T}${X} bằng tổng hai góc trong không kề: góc ${P} và góc ${Q}.`, `${E} = ${a} + ${Q}`),
      S('Trừ đi.', `${Q} = ${dg(b)}`),
    ],
  };
});

/** Tam giác có một đoạn nối đỉnh xuống cạnh đối diện. */
const angCevian = mcqT('pd-d-ang-cevian', 'lines_angles_triangles', 'medium', (rng) => {
  const q = pickInt(rng, 30, 70);
  const p = pickInt(rng, 15, 45);
  const r = pickInt(rng, 25, 150 - p - q - 10 > 25 ? 150 - p - q - 10 : 26);
  const x = 180 - p - q - r;
  const { choices, correctIndex } = numMcq(
    x,
    [
      nd(p + q, null, 'Đây là góc ADC (góc ngoài của tam giác ABD), chưa phải góc DAC.'),
      nd(180 - q - r, 'stopped_too_early', 'Đây là cả góc BAC; còn phải trừ góc BAD.'),
      nd(180 - p - q, null, 'Đây là góc ADB.'),
    ],
    rng,
  );
  return {
    stem: `In triangle ABC, point D lies on side BC. The measure of angle ABD is ${dg(q)}, the measure of angle BAD is ${dg(p)}, and the measure of angle ACB is ${dg(r)}. What is the measure of angle DAC?`,
    choices,
    correctIndex,
    steps: [
      S('Góc ADC là góc ngoài của tam giác ABD.', `ADC = ${p} + ${q} = ${p + q}`),
      S('Trong tam giác ADC, ba góc cộng lại bằng 180 độ.', `DAC = 180 - ${p + q} - ${r} = ${dg(x)}`),
    ],
  };
});

/** Hai cát tuyến cắt hai đường song song: mỗi cặp góc trong cùng phía bù nhau. */
const angTwoTransversalsSum = mcqT('pd-d-ang-two-transversals-sum', 'lines_angles_triangles', 'medium', (rng) => {
  const a = pickInt(rng, 40, 140);
  const c = pickInt(rng, 40, 140);
  const ans = 360 - a - c;
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(a + c, null, 'Coi góc trong cùng phía bằng nhau. Thật ra chúng bù nhau.'),
      nd(Math.abs(180 - a - c) === ans ? ans + 10 : Math.abs(180 - a - c), null, 'Chỉ dùng một cặp góc bù nhau cho cả hai cát tuyến.'),
      nd(360 - a + c > 360 ? 360 - c : 360 - a + c, null, 'Sai dấu khi trừ.'),
    ],
    rng,
  );
  return {
    stem: `Lines j and k are parallel. Line s crosses both lines, and angles a and b are the two interior angles on the same side of s (between j and k). Line t also crosses both lines, and angles c and d are the two interior angles on the same side of t. If a = ${dg(a)} and c = ${dg(c)}, what is the value of b + d, in degrees?`,
    choices,
    correctIndex,
    steps: [
      S('Hai góc trong cùng phía tạo bởi một cát tuyến và hai đường song song thì bù nhau.', `a + b = 180,   c + d = 180`),
      S('Cộng hai đẳng thức rồi trừ đi a và c.', `b + d = 360 - ${a} - ${c} = ${ans}`),
    ],
  };
});

/** Tam giác có góc thứ ba bằng (x + y + e)°: tìm y khi biết x. */
const angTriangleXY = mcqT('pd-d-ang-triangle-xy', 'lines_angles_triangles', 'easy', (rng) => {
  const e = pick(rng, [-20, -10, 0, 0, 10, 20]);
  const sum = (180 - e) / 2;
  const x = pickInt(rng, 15, sum - 15);
  const y = sum - x;
  const third = e === 0 ? '(x + y)deg' : `(x + y ${e < 0 ? '-' : '+'} ${Math.abs(e)})deg`;
  const { choices, correctIndex } = numMcq(
    y,
    [
      nd(180 - e - x, null, 'Quên chia đôi: tổng 2(x + y) mới bằng 180 trừ phần hằng số.'),
      nd(180 - x, 'confused_supplementary_complementary', 'Quên góc thứ ba.'),
      nd(90 - x === y ? y + 10 : 90 - x, 'confused_supplementary_complementary', 'Coi luôn x + y = 90.'),
    ],
    rng,
  );
  return {
    stem: `The three angles of a triangle measure xdeg, ydeg, and ${third}. If x = ${x}, what is the value of y?`,
    choices,
    correctIndex,
    steps: [
      S('Tổng ba góc bằng 180 độ.', `x + y + x + y${signedTerm(e)} = 180   ⇒   x + y = ${sum}`),
      S('Thay x.', `y = ${sum} - ${x} = ${y}`),
    ],
  };
});

/** Điểm nằm giữa hai đường song song: góc tại điểm đó = tổng hai góc so le. */
const angZigzag = mcqT('pd-d-ang-zigzag', 'lines_angles_triangles', 'medium', (rng) => {
  const a = pickInt(rng, 20, 75);
  const b = pickInt(rng, 20, 75);
  const { choices, correctIndex } = numMcq(
    a + b,
    [
      nd(180 - a - b, null, 'Coi ba góc là ba góc của một tam giác.'),
      nd(Math.abs(a - b) || 5, null, 'Trừ hai góc thay vì cộng.'),
      nd(360 - a - b, null, 'Đây là góc phản xạ ở phía bên kia của điểm P.'),
    ],
    rng,
  );
  return {
    stem: `Lines j and k are parallel, and point P lies between them. Segment PA connects P to point A on line j, and segment PB connects P to point B on line k; both segments go to the left of P. Segment PA makes an angle of ${dg(a)} with line j, and segment PB makes an angle of ${dg(b)} with line k, both measured on the side facing P. What is the measure of angle APB?`,
    choices,
    correctIndex,
    steps: [
      S('Kẻ qua P một đường song song với j và k; nó chia góc APB thành hai phần.'),
      S('Mỗi phần là góc so le trong với góc đã cho, nên bằng góc đó.', `APB = ${a} + ${b} = ${dg(a + b)}`),
    ],
  };
});

/** Cắt một góc tam giác bằng một đoạn thẳng: hai góc phía dưới cộng lại = 180 + góc đỉnh. */
const angCutTriangle = mcqT('pd-d-ang-cut-triangle', 'lines_angles_triangles', 'hard', (rng) => {
  const T = pickInt(rng, 30, 80);
  const s = pickInt(rng, 30, 150 - T - 10);
  const ans = 180 + T;
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(180 - T, null, 'Đây là tổng hai góc ADE và AED của tam giác nhỏ.'),
      nd(360 - T - s, null, `Chỉ đúng khi cộng thêm góc ${s} mà không trừ góc thứ ba.`),
      nd(180 + s, null, 'Nhầm góc ADE với góc đỉnh A.'),
    ],
    rng,
  );
  return {
    stem: `In triangle ABC, point D lies on side AB and point E lies on side AC. The measure of angle A is ${dg(T)} and the measure of angle ADE is ${dg(s)}. What is the sum of the measures of angle BDE and angle CED, in degrees?`,
    choices,
    correctIndex,
    steps: [
      S('Trong tam giác ADE, hai góc tại D và E cộng lại bằng 180 trừ góc A.', `ADE + AED = ${180 - T}`),
      S('BDE bù với ADE, CED bù với AED.', `BDE + CED = 360 - ${180 - T} = ${ans}`),
    ],
  };
});

/** Ba đường thẳng đồng quy: sáu góc, góc đối đỉnh bằng nhau, ba góc liền nhau trên một đường thẳng. */
const angThreeLines = mcqT('pd-d-ang-three-lines', 'lines_angles_triangles', 'easy', (rng) => {
  const a = pickInt(rng, 25, 90);
  const b = pickInt(rng, 25, 150 - a);
  const c = 180 - a - b;
  const { choices, correctIndex } = numMcq(
    c,
    [
      nd(a + b, null, 'Cộng hai góc đã cho — đó là góc bù với x, không phải x.'),
      nd(360 - a - b, null, 'Coi ba góc cộng lại bằng 360 độ; ba góc liền nhau trên một nửa mặt phẳng chỉ cộng lại 180 độ.'),
      nd(Math.abs(a - b) === c ? c + 10 : Math.abs(a - b), null, 'Trừ hai góc cho nhau.'),
    ],
    rng,
  );
  return {
    stem: `Three lines intersect at a single point, forming six angles. Two adjacent angles among them measure ${dg(a)} and ${dg(b)}. Angle x is vertical to the angle that lies next to these two and completes a straight line with them. What is the value of x, in degrees?`,
    choices,
    correctIndex,
    steps: [
      S('Ba góc liền nhau nằm trên một đường thẳng cộng lại bằng 180 độ.', `${a} + ${b} + y = 180   ⇒   y = ${c}`),
      S('Góc đối đỉnh bằng nhau.', `x = y = ${c}`),
    ],
  };
});

/** Hình "nơ bướm": hai tam giác chung một cặp góc đối đỉnh. */
const angBowtie = mcqT('pd-d-ang-bowtie', 'lines_angles_triangles', 'medium', (rng) => {
  const a = pickInt(rng, 30, 80);
  const b = pickInt(rng, 30, 80);
  const c = pickInt(rng, 25, Math.min(a + b - 25, 90));
  const z = a + b - c;
  const { choices, correctIndex } = numMcq(
    z,
    [
      nd(180 - a - b, null, 'Đây là góc đối đỉnh ở giữa, chưa phải góc cần tìm.'),
      nd(180 - c, 'confused_supplementary_complementary', 'Lấy góc bù của góc đã cho.'),
      nd(a + b + c > 179 ? z + 12 : a + b + c, null, 'Cộng cả ba góc.'),
    ],
    rng,
  );
  return {
    stem: `Segments AD and BE intersect at point C. In triangle ABC, the measure of angle A is ${dg(a)} and the measure of angle B is ${dg(b)}. In triangle DEC, the measure of angle D is ${dg(c)}. What is the measure of angle E?`,
    choices,
    correctIndex,
    steps: [
      S('Hai góc tại C đối đỉnh nên bằng nhau; vì thế tổng hai góc còn lại của mỗi tam giác bằng nhau.', `${a} + ${b} = ${c} + E`),
      S('Giải ra.', `E = ${dg(z)}`),
    ],
  };
});

/** Hai góc kề bù cho bằng biểu thức: tổng bằng 180. */
const angLinearPair = mcqT('pd-d-ang-linear-pair', 'lines_angles_triangles', 'easy', (rng) => {
  const p = pickInt(rng, 1, 4);
  const r = pickInt(rng, 1, 3);
  const x = pickInt(rng, 10, 30);
  const q = pickInt(rng, -5, 40);
  const s = 180 - p * x - q - r * x;
  const e1 = `(${linearSide(p, q)})deg`;
  const e2 = `(${linearSide(r, s)})deg`;
  const { choices, correctIndex } = numMcq(
    x,
    [
      nd(rat(90 - q - s, p + r), 'confused_supplementary_complementary', 'Cho tổng bằng 90 độ. Hai góc kề bù cộng lại 180 độ.'),
      nd(rat(180 - q + s, p + r), 'sign_flip', 'Chuyển hằng số sang vế phải sai dấu.'),
      nd(p * x + q, 'stopped_too_early', 'Đây là số đo góc thứ nhất, không phải x.'),
    ],
    rng,
  );
  return {
    stem: `Two angles form a linear pair. Their measures are ${e1} and ${e2}. What is the value of x?`,
    choices,
    correctIndex,
    steps: [
      S('Hai góc kề bù cộng lại bằng 180 độ.', `${linearSide(p, q)} + ${linearSide(r, s)} = 180`),
      S('Gộp và giải.', `${coefTerm(p + r)}${signedTerm(q + s)} = 180   ⇒   x = ${x}`),
    ],
  };
});

/** Ba đường thẳng tạo tam giác: biết hai góc ngoài → góc trong thứ ba. */
const angExteriorPair = mcqT('pd-d-ang-exterior-pair', 'lines_angles_triangles', 'medium', (rng) => {
  const e1 = pickInt(rng, 100, 160);
  const e2 = pickInt(rng, Math.max(100, 200 - e1), 170);
  const ans = e1 + e2 - 180;
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(360 - e1 - e2, null, 'Đây là góc NGOÀI thứ ba, không phải góc trong.'),
      nd(e1 + e2 - 90, null, 'Trừ 90 thay vì 180.'),
      nd(180 - e1 + (180 - e2), null, 'Đây là tổng hai góc trong đã biết.'),
    ],
    rng,
  );
  return {
    stem: `Three lines intersect to form a triangle. At two of the vertices, the exterior angles measure ${dg(e1)} and ${dg(e2)}. What is the measure of the interior angle at the third vertex?`,
    choices,
    correctIndex,
    steps: [
      S('Góc trong bù với góc ngoài tại cùng đỉnh.', `${180 - e1} và ${180 - e2}`),
      S('Góc trong còn lại.', `180 - ${180 - e1} - ${180 - e2} = ${dg(ans)}`),
    ],
  };
});

/** Tổng góc trong của hai đa giác chồng lên nhau. */
const POLY_NAMES: Record<number, string> = { 3: 'triangle', 4: 'rectangle', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon' };

const angPolygonSumTwo = mcqT('pd-d-ang-polygon-sum-two', 'lines_angles_triangles', 'medium', (rng) => {
  const n1 = pickInt(rng, 3, 8);
  const n2 = pickInt(rng, 4, 8);
  const total = 180 * (n1 - 2) + 180 * (n2 - 2);
  const name1 = POLY_NAMES[n1]!;
  const name2 = n2 === 4 ? 'square' : POLY_NAMES[n2]!;
  const x = pickInt(rng, 55, n1 === 3 && n2 === 4 ? 90 : 170);
  const T = total - x;
  const { choices, correctIndex } = numMcq(
    x,
    [
      nd(180 * (n1 + n2 - 2) - T, null, 'Coi hai hình là một đa giác lớn có tổng số cạnh bằng tổng hai hình.'),
      nd(180 * (n1 + n2) - T, null, 'Quên trừ 2 trong công thức 180(n − 2).'),
      nd(Math.abs(720 - T), null, 'Coi mỗi hình như một tứ giác.'),
    ],
    rng,
  );
  return {
    stem: `A ${name1} and a ${name2} overlap in a figure, and every interior angle of each figure is marked. All but one of the marked angles have a total measure of ${dg(T)}. What is the measure, in degrees, of the remaining marked angle?`,
    choices,
    correctIndex,
    steps: [
      S('Tổng góc trong của đa giác n cạnh là 180(n − 2): chia đa giác thành n − 2 tam giác.', `180(${n1} - 2) + 180(${n2} - 2) = ${total}`),
      S('Chồng lên nhau không làm đổi góc của từng hình. Lấy tổng trừ phần đã biết.', `${total} - ${T} = ${x}`),
    ],
  };
});

/** Đa giác đều, tia vuông góc với một cạnh tại một đỉnh. */
const REG_N = [5, 6, 8, 9, 10, 12, 15, 18, 20] as const;

const angRegularPerp = mcqT('pd-d-ang-regular-perp', 'lines_angles_triangles', 'hard', (rng) => {
  const n = pick(rng, REG_N);
  const interior = 180 - 360 / n;
  const letters = 'ABCDEFGHJKLMNPQRSTUVW'.slice(0, n);
  const i = pickInt(rng, 0, n - 1);
  const P = letters[i]!;
  const Q = letters[(i + 1) % n]!;
  const Rr = letters[(i + n - 1) % n]!;
  const extension = rng() < 0.4;
  const ans = extension ? 270 - interior : interior - 90;
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(interior, null, 'Đây là cả góc trong của đa giác.'),
      nd(extension ? interior - 90 : 270 - interior, null, extension ? 'Đây là góc với chính cạnh, không phải với phần kéo dài.' : 'Đây là góc với phần kéo dài của cạnh.'),
      nd(180 - interior, null, 'Đây là góc ngoài của đa giác.'),
    ],
    rng,
  );
  return {
    stem: `In a regular polygon with ${n} sides, ${P}${Q} and ${P}${Rr} are the two sides that meet at vertex ${P}. A ray from ${P} is drawn perpendicular to side ${P}${Q}, pointing into the polygon. What is the measure of the angle between this ray and ${extension ? `the extension of side ${Rr}${P} beyond ${P}` : `side ${P}${Rr}`}?`,
    choices,
    correctIndex,
    steps: [
      S('Mỗi góc trong của đa giác đều n cạnh bằng 180(n − 2)/n.', `frac(180(${n} - 2),${n}) = ${interior}`),
      S(extension ? 'Góc với phần kéo dài bù với góc giữa tia và cạnh.' : 'Tia vuông góc chiếm 90 độ của góc trong; phần còn lại là góc cần tìm.', extension ? `180 - (${interior} - 90) = ${ans}` : `${interior} - 90 = ${ans}`),
    ],
  };
});

/** Tám góc quanh hai giao điểm của cát tuyến với hai đường song song. */
type Corner = 'upper_left' | 'upper_right' | 'lower_left' | 'lower_right';
const CORNERS: readonly Corner[] = ['upper_left', 'upper_right', 'lower_left', 'lower_right'];
const cornerText = (c: Corner, line: string, t: string) =>
  `${c.startsWith('upper') ? 'above' : 'below'} line ${line} and to the ${c.endsWith('left') ? 'left' : 'right'} of line ${t}`;
/** Nhóm góc: trên-trái và dưới-phải bằng nhau (θ), hai góc còn lại bằng 180 − θ. */
const cornerClass = (c: Corner) => (c === 'upper_left' || c === 'lower_right' ? 0 : 1);

const angParallelRoman = mcqT('pd-d-ang-parallel-roman', 'lines_angles_triangles', 'hard', (rng) => {
  const labels = ['a', 'b', 'c', 'd'];
  const spots = labels.map(() => ({ line: pick(rng, ['j', 'k']), corner: pick(rng, CORNERS) }));
  const cls = spots.map((s) => cornerClass(s.corner));
  // Mệnh đề: bằng nhau hoặc bù nhau.
  const pairs = sample(rng, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]], 3);
  const stmts = pairs.map(([i, j]) => {
    const eq = rng() < 0.5;
    const text = eq ? `${labels[i!]} = ${labels[j!]}` : `${labels[i!]} + ${labels[j!]} = 180`;
    const truth = eq ? cls[i!] === cls[j!] : cls[i!] !== cls[j!];
    return { text, truth };
  });
  if (!stmts.some((s) => s.truth)) {
    const [i, j] = pairs[0]!;
    stmts[0] = cls[i!] === cls[j!] ? { text: `${labels[i!]} = ${labels[j!]}`, truth: true } : { text: `${labels[i!]} + ${labels[j!]} = 180`, truth: true };
  }
  const truth = stmts.map((s) => s.truth);
  const { choices, correctIndex } = romanMcq(truth, rng);
  const where = spots.map((s, i) => `angle ${labels[i]} is ${cornerText(s.corner, s.line, 't')}`).join('; ');
  return {
    stem: `Horizontal lines j and k are parallel, and line t crosses both of them without being perpendicular to them. At each intersection, four angles are formed: ${where}. None of the angles is a right angle. Which of the following must be true? I. ${stmts[0]!.text}; II. ${stmts[1]!.text}; III. ${stmts[2]!.text}`,
    choices,
    correctIndex,
    steps: [
      S('Với hai đường song song và một cát tuyến, tám góc chia thành hai nhóm: mọi góc trong một nhóm bằng nhau, và một góc nhóm này bù với một góc nhóm kia.'),
      S('Góc trên-trái và dưới-phải cùng một nhóm; góc trên-phải và dưới-trái cùng nhóm còn lại — ở cả hai giao điểm.', romanLabel(truth)),
    ],
  };
});

/** "Mũi tên": điểm D trong tam giác, góc BDC = A + ABD + ACD. */
const angDart = mcqT('pd-d-ang-dart', 'lines_angles_triangles', 'hard', (rng) => {
  const A = pickInt(rng, 30, 80);
  const delta = A + pickInt(rng, 20, 70);
  const ans = delta - A;
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(180 - delta, null, 'Đây là tổng hai góc DBC và DCB của tam giác nhỏ.'),
      nd(180 - A, null, 'Đây là tổng hai góc B và C của tam giác lớn.'),
      nd(delta + A > 179 ? ans + 10 : delta + A, null, 'Cộng thay vì trừ.'),
    ],
    rng,
  );
  return {
    stem: `Point D lies inside triangle ABC, and segments DB and DC are drawn. The measure of angle BAC is ${dg(A)} and the measure of angle BDC is ${dg(delta)}. What is the sum of the measures of angle ABD and angle ACD, in degrees?`,
    choices,
    correctIndex,
    steps: [
      S('Trong tam giác lớn, B + C = 180 − A. Trong tam giác DBC, DBC + DCB = 180 − BDC.', `${180 - A}   và   ${180 - delta}`),
      S('Hiệu hai tổng chính là hai góc ABD và ACD.', `${180 - A} - ${180 - delta} = ${ans}`),
    ],
  };
});

/** Ba đường song song, hai cát tuyến — tính tổng hai góc. Điền số. */
const angThreeParallel = gridT('pd-d-ang-three-parallel', 'lines_angles_triangles', 'hard', (rng) => {
  const p = pickInt(rng, 35, 145);
  const q = pickInt(rng, 35, 145);
  const tGiven = { line: pick(rng, ['j', 'l']), corner: pick(rng, CORNERS) };
  const sGiven = { line: pick(rng, ['j', 'l']), corner: pick(rng, CORNERS) };
  const aCorner = pick(rng, CORNERS);
  const bCorner = pick(rng, CORNERS);
  const val = (given: Corner, gv: number, asked: Corner) => (cornerClass(given) === cornerClass(asked) ? gv : 180 - gv);
  const a = val(tGiven.corner, p, aCorner);
  const b = val(sGiven.corner, q, bCorner);
  return {
    stem: `Horizontal lines j, k, and l are parallel, with k between j and l. Lines t and s each cross all three lines. The angle ${cornerText(tGiven.corner, tGiven.line, 't')} measures ${dg(p)}, and the angle ${cornerText(sGiven.corner, sGiven.line, 's')} measures ${dg(q)}. Angle a is ${cornerText(aCorner, 'k', 't')}, and angle b is ${cornerText(bCorner, 'k', 's')}. What is the value of a + b, in degrees?`,
    answer: rat(a + b),
    steps: [
      S('Góc đồng vị bằng nhau nên mỗi cát tuyến tạo ra cùng một bộ góc ở cả ba đường song song.'),
      S('Góc trên-trái bằng góc dưới-phải; hai góc kia bằng 180 trừ góc ấy.', `a = ${a},   b = ${b}`),
      S('Cộng lại.', `a + b = ${a + b}`),
    ],
  };
});

const CH19: MathTemplate[] = [
  angExteriorFindInterior,
  angCevian,
  angTwoTransversalsSum,
  angTriangleXY,
  angZigzag,
  angCutTriangle,
  angThreeLines,
  angBowtie,
  angLinearPair,
  angExteriorPair,
  angPolygonSumTwo,
  angRegularPerp,
  angParallelRoman,
  angDart,
  angThreeParallel,
];

// ================================================================ Chương 20 — Tam giác

const TRIPLES: ReadonlyArray<readonly [number, number, number]> = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];

const LETTER_SETS = [
  ['A', 'B', 'C'],
  ['P', 'Q', 'R'],
  ['K', 'L', 'M'],
  ['G', 'H', 'J'],
  ['X', 'Y', 'Z'],
] as const;

/** Chọn bộ ba cạnh góc vuông: [cạnh a, cạnh b, cạnh huyền] đã nhân k, có thể đổi chỗ hai cạnh góc vuông. */
function triple(rng: Rng, kMax = 4): [number, number, number] {
  const [a, b, c] = pick(rng, TRIPLES);
  const k = pickInt(rng, 1, kMax);
  return rng() < 0.5 ? [a * k, b * k, c * k] : [b * k, a * k, c * k];
}

/** Cạnh x, x − a, x + b của tam giác vuông: phương trình Pythagoras đúng. */
const triPythSetup = mcqT('pd-d-tri-pyth-setup', 'right_triangles_trig', 'easy', (rng) => {
  const v = pick(rng, ['x', 'n', 's']);
  const a = pickInt(rng, 1, 9);
  const b = pickInt(rng, 1, 9);
  const S1 = `(${v} - ${a})`;
  const L = `(${v} + ${b})`;
  const eq = (p: string, q: string, r: string) => `${p}^2 + ${q}^2 = ${r}^2`;
  const { choices, correctIndex } = textMcq(
    eq(S1, v, L),
    [
      td(eq(S1, L, v), null, `Cạnh huyền phải là cạnh dài nhất: ${v} + ${b}.`),
      td(eq(v, L, S1), null, 'Cạnh huyền phải là cạnh dài nhất.'),
      td(`${v}^2 - ${a * a} + ${v}^2 = ${v}^2 + ${b * b}`, 'expanded_without_middle_term', 'Bình phương một hiệu (hoặc tổng) mà bỏ số hạng giữa.'),
      td(`${S1} + ${v} = ${L}`, 'forgot_square_root', 'Quên bình phương các cạnh.'),
    ],
    rng,
  );
  const sides = shuffleCopy([`${v}`, `${v} - ${a}`, `${v} + ${b}`], rng);
  return {
    stem: `The side lengths of a right triangle are ${sides[0]}, ${sides[1]}, and ${sides[2]}. Which of the following equations must be true?`,
    choices,
    correctIndex,
    steps: [
      S(`Cạnh dài nhất (${v} + ${b}) là cạnh huyền, đối diện góc vuông.`),
      S('Định lý Pythagoras: tổng bình phương hai cạnh góc vuông bằng bình phương cạnh huyền.', eq(S1, v, L)),
    ],
  };
});

/** Đường cao tam giác đều: chia đôi cạnh đáy, dài s√3/2. */
const triEquilateralParts = mcqT('pd-d-tri-equilateral-parts', 'right_triangles_trig', 'easy', (rng) => {
  const [A, B, C] = pick(rng, LETTER_SETS);
  const s = 2 * pickInt(rng, 1, 20);
  const askFoot = rng() < 0.5;
  const half = s / 2;
  const correct = askFoot ? String(half) : radText(rat(half), 3);
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(askFoot ? radText(rat(half), 3) : String(half), null, askFoot ? 'Đây là độ dài đường cao.' : 'Đây là nửa cạnh đáy, chưa phải đường cao.'),
      td(radText(rat(s), 3), null, 'Quên chia đôi: cạnh đối diện góc 60° bằng nửa cạnh huyền nhân căn 3.'),
      td(String(s), null, 'Đây là độ dài cạnh của tam giác.'),
      td(radText(rat(half), 2), null, 'Nhầm với tam giác 45-45-90.'),
    ],
    rng,
  );
  return {
    stem: `Triangle ${A}${B}${C} is equilateral with side length ${s}. Segment ${A}D is the altitude from ${A} to side ${B}${C}. What is the length of ${askFoot ? `D${C}` : `${A}D`}?`,
    choices,
    correctIndex,
    steps: [
      S('Đường cao của tam giác đều cũng là đường trung tuyến: chia cạnh đáy làm đôi, tạo hai tam giác 30-60-90.', `D${C} = ${half}`),
      S('Cạnh đối diện góc 60° bằng cạnh ngắn nhân căn 3.', `${A}D = ${radText(rat(half), 3)}`),
    ],
  };
});

/** Đường chéo hình vuông = cạnh × √2. */
const triSquareDiagonal = mcqT('pd-d-tri-square-diagonal', 'right_triangles_trig', 'easy', (rng) => {
  const s = pickInt(rng, 2, 60);
  const given = pick(rng, ['side', 'perimeter', 'area'] as const);
  const text = given === 'side' ? `a side length of ${s}` : given === 'perimeter' ? `a perimeter of ${4 * s}` : `an area of ${s * s}`;
  const { choices, correctIndex } = textMcq(
    radText(rat(s), 2),
    [
      td(String(2 * s), null, 'Cộng hai cạnh; đường chéo ngắn hơn tổng hai cạnh.'),
      td(radText(rat(s), 3), null, 'Nhầm với tam giác 30-60-90.'),
      td(radText(rat(2 * s), 2), null, 'Nhân đôi thừa.'),
      td(String(s * s), null, 'Đây là diện tích.'),
    ],
    rng,
  );
  return {
    stem: `A square has ${text}. What is the length of a diagonal of the square?`,
    choices,
    correctIndex,
    steps: [
      S('Tìm cạnh của hình vuông.', `s = ${s}`),
      S('Đường chéo chia hình vuông thành hai tam giác 45-45-90, nên đường chéo bằng cạnh nhân căn 2.', `${s}sqrt(2)`),
    ],
  };
});

/** "Nơ bướm": AB ∥ CD, AD cắt BC tại E. */
const triBowtieSimilar = gridT('pd-d-tri-bowtie-similar', 'lines_angles_triangles', 'medium', (rng) => {
  const a = pickInt(rng, 2, 12);
  const dd = pickInt(rng, 2, 12);
  const c = pickInt(rng, 2, 15);
  return {
    stem: `Segments AD and BC intersect at point E, and segment AB is parallel to segment CD. If AE = ${a}, ED = ${dd}, and CD = ${c}, what is the length of AB?`,
    answer: rat(a * c, dd),
    steps: [
      S('Hai góc tại E đối đỉnh, và AB song song CD cho hai cặp góc so le bằng nhau, nên tam giác ABE đồng dạng tam giác DCE.'),
      S('Cạnh tương ứng tỉ lệ.', `frac(AB,${c}) = frac(${a},${dd})   ⇒   AB = ${fx(rat(a * c, dd))}`),
    ],
  };
});

/** Bất đẳng thức tam giác: cạnh thứ ba nguyên lớn nhất/nhỏ nhất. */
const triThirdSideExtreme = gridT('pd-d-tri-third-side-extreme', 'lines_angles_triangles', 'easy', (rng) => {
  const p = pickInt(rng, 2, 20);
  const q = p + pickInt(rng, 1, 20);
  const greatest = rng() < 0.5;
  const ans = greatest ? p + q - 1 : q - p + 1;
  return {
    stem: `Two sides of a triangle have lengths ${p} and ${q}. If the length of the third side is an integer, what is the ${greatest ? 'greatest' : 'least'} possible length of the third side?`,
    answer: rat(ans),
    steps: [
      S('Bất đẳng thức tam giác: cạnh thứ ba lớn hơn hiệu và nhỏ hơn tổng hai cạnh kia.', `${q - p} < c < ${p + q}`),
      S('Không được bằng hai đầu mút (bằng thì ba điểm thẳng hàng).', `c = ${ans}`),
    ],
  };
});

/** Tam giác cân có hai độ dài cạnh p và q: chu vi lớn nhất / nhỏ nhất. */
const triIsoscelesPerimeter = gridT('pd-d-tri-isosceles-perimeter', 'lines_angles_triangles', 'medium', (rng) => {
  const p = pickInt(rng, 4, 30);
  const q = p + pickInt(rng, 1, p - 1);
  const greatest = rng() < 0.5;
  const ans = greatest ? p + 2 * q : 2 * p + q;
  return {
    stem: `An isosceles triangle has one side of length ${p} and another side of length ${q}. What is the ${greatest ? 'greatest' : 'least'} possible perimeter of the triangle?`,
    answer: rat(ans),
    steps: [
      S('Cạnh lặp lại có thể là cạnh ngắn hoặc cạnh dài. Kiểm bất đẳng thức tam giác cho cả hai trường hợp.', `${p}, ${p}, ${q}: ${2 * p} > ${q};   ${p}, ${q}, ${q}: hợp lệ`),
      S(greatest ? 'Chu vi lớn nhất khi cạnh dài được lặp lại.' : 'Chu vi nhỏ nhất khi cạnh ngắn được lặp lại.', `${ans}`),
    ],
  };
});

/** I, II, III: bộ ba nào là ba cạnh của một tam giác? */
const triRomanValid = mcqT('pd-d-tri-roman-valid', 'lines_angles_triangles', 'medium', (rng) => {
  const make = (kind: number): number[] => {
    const a = pickInt(rng, 2, 9);
    const b = pickInt(rng, 2, 9);
    // 0: hợp lệ, 1: suy biến (a + b = c), 2: quá dài.
    const c = kind === 0 ? Math.max(a, b) + pickInt(rng, 0, Math.min(a, b) - 1) : kind === 1 ? a + b : a + b + pickInt(rng, 1, 4);
    return shuffleCopy([a, b, c], rng);
  };
  const kinds = [pickInt(rng, 0, 2), pickInt(rng, 0, 2), pickInt(rng, 0, 2)];
  if (!kinds.includes(0)) kinds[pickInt(rng, 0, 2)] = 0;
  const sets = kinds.map(make);
  const truth = kinds.map((k) => k === 0);
  const { choices, correctIndex } = romanMcq(truth, rng);
  const t = (s: number[]) => s.join(', ');
  return {
    stem: `Which of the following could be the side lengths of a triangle? I. ${t(sets[0]!)}; II. ${t(sets[1]!)}; III. ${t(sets[2]!)}`,
    choices,
    correctIndex,
    steps: [
      S('Chỉ cần kiểm: tổng hai cạnh ngắn phải LỚN HƠN cạnh dài nhất. Bằng nhau cũng không được.'),
      S('Áp vào từng bộ.', romanLabel(truth)),
    ],
  };
});

/** Tam giác cân: đường cao từ đỉnh chia đôi đáy → Pythagoras → diện tích. */
const triIsoscelesArea = gridT('pd-d-tri-isosceles-area', 'area_volume', 'medium', (rng) => {
  const [half, h, sd] = triple(rng, 6);
  const [A, B, C] = pick(rng, LETTER_SETS);
  return {
    stem: `In isosceles triangle ${A}${B}${C}, ${A}${B} = ${A}${C} = ${sd} and ${B}${C} = ${2 * half}. What is the area of triangle ${A}${B}${C}?`,
    answer: rat(half * h),
    steps: [
      S(`Đường cao từ ${A} xuống ${B}${C} chia đôi ${B}${C}.`, `${2 * half} ÷ 2 = ${half}`),
      S('Pythagoras cho đường cao.', `h = sqrt(${sd}^2 - ${half}^2) = ${h}`),
      S('Diện tích bằng nửa đáy nhân cao.', `frac(1,2)(${2 * half})(${h}) = ${half * h}`),
    ],
  };
});

/** Hình vuông với tam giác đều dựng trên một cạnh. */
const triSquareEquilateral = mcqT('pd-d-tri-square-equilateral', 'area_volume', 'medium', (rng) => {
  const s = 2 * pickInt(rng, 1, 20);
  const byArea = rng() < 0.5;
  const name = pick(rng, ['ABCD', 'PQRS', 'KLMN', 'WXYZ']);
  const top = `${name[0]}${name[1]}`;
  const correct = radText(rat(s * s, 4), 3);
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(radText(rat(s * s, 2), 3), null, 'Quên nhân một nửa: diện tích tam giác là nửa đáy nhân cao.'),
      td(String((s * s) / 2), null, 'Coi đường cao bằng cạnh; đường cao tam giác đều là cạnh nhân căn 3 chia 2.'),
      td(radText(rat(s * s), 3), null, 'Dùng cạnh làm đường cao và quên chia đôi.'),
      td(radText(rat(s * s, 4), 2), null, 'Nhầm tỉ số của tam giác 45-45-90.'),
    ],
    rng,
  );
  return {
    stem: `Square ${name} has ${byArea ? `an area of ${s * s}` : `a perimeter of ${4 * s}`}. An equilateral triangle is drawn outside the square so that one of its sides is side ${top} of the square. What is the area of the equilateral triangle?`,
    choices,
    correctIndex,
    steps: [
      S('Cạnh của tam giác bằng cạnh hình vuông.', `s = ${s}`),
      S('Đường cao tam giác đều là nửa cạnh nhân căn 3.', `h = ${radText(rat(s / 2), 3)}`),
      S('Diện tích bằng nửa đáy nhân cao.', `frac(1,2)(${s})(${radText(rat(s / 2), 3)}) = ${correct}`),
    ],
  };
});

/** Cắt hình nón bởi mặt song song đáy: phần dưới cao bao nhiêu? */
const triConeSlice = mcqT('pd-d-tri-cone-slice', 'area_volume', 'hard', (rng) => {
  const r1 = pickInt(rng, 1, 6);
  const m = pickInt(rng, 2, 4);
  const r2 = r1 * m;
  const h1 = pickInt(rng, 1, 9);
  const ans = h1 * (m - 1);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(h1 * m, 'stopped_too_early', 'Đây là chiều cao của cả hình nón ban đầu; phải trừ phần nón nhỏ.'),
      nd(r2 - r1 === ans ? ans + 1 : r2 - r1, null, 'Trừ hai bán kính — chiều cao không thay đổi theo cùng hiệu mà theo cùng TỈ LỆ.'),
      nd(h1 * (r2 - r1), null, 'Nhân với hiệu bán kính thay vì dùng tỉ số đồng dạng.'),
    ],
    rng,
  );
  return {
    stem: `A right circular cone is cut by a plane parallel to its base, forming a small cone on top and a bottom piece. The small cone has height ${h1} and base radius ${r1}. The base of the original cone has radius ${r2}. What is the height of the bottom piece?`,
    choices,
    correctIndex,
    steps: [
      S('Mặt cắt song song đáy tạo nón nhỏ đồng dạng với nón lớn: chiều cao tỉ lệ với bán kính.', `H = ${h1} × frac(${r2},${r1}) = ${h1 * m}`),
      S('Phần dưới là hiệu hai chiều cao.', `${h1 * m} - ${h1} = ${ans}`),
    ],
  };
});

/** Chu vi P, cạnh nguyên: cạnh dài nhất lớn nhất là bao nhiêu? */
const triIntegerPerimeterMax = mcqT('pd-d-tri-integer-perimeter-max', 'lines_angles_triangles', 'hard', (rng) => {
  const P = pickInt(rng, 7, 120);
  const greatest = rng() < 0.6;
  const ans = greatest ? Math.ceil(P / 2) - 1 : Math.ceil(P / 3);
  const dists = greatest
    ? [
        nd(P % 2 === 0 ? P / 2 : ans + 1, 'off_by_one', 'Cạnh dài nhất bằng nửa chu vi thì hai cạnh kia cộng lại đúng bằng nó — tam giác suy biến.'),
        nd(P - 2, null, 'Hai cạnh kia bằng 1 không đủ dài để khép tam giác.'),
        nd(Math.floor(P / 3), null, 'Đây là cạnh của tam giác gần đều, không phải cạnh dài nhất lớn nhất.'),
      ]
    : [
        nd(Math.ceil(P / 3) - 1, 'off_by_one', 'Nếu z nhỏ hơn P/3 thì cả ba cạnh đều nhỏ hơn P/3, tổng không đủ P.'),
        nd(Math.ceil(P / 2) - 1, null, 'Đây là giá trị LỚN nhất của z.'),
        nd(Math.floor(P / 2), null, 'Nhầm với nửa chu vi.'),
      ];
  const { choices, correctIndex } = numMcq(ans, dists, rng);
  return {
    stem: `The side lengths of a triangle are integers x, y, and z, where x <= y <= z. If the perimeter of the triangle is ${P}, what is the ${greatest ? 'greatest' : 'least'} possible value of z?`,
    choices,
    correctIndex,
    steps: greatest
      ? [S('x + y > z và x + y + z = P, nên z nhỏ hơn nửa chu vi.', `2z < ${P}   ⇒   z < ${P / 2}`), S('Số nguyên lớn nhất thoả điều đó.', `z = ${ans}`)]
      : [S('z là cạnh lớn nhất nên 3z ≥ x + y + z = P.', `z >= ${fx(rat(P, 3))}`), S('Số nguyên nhỏ nhất thoả điều đó (và dựng được tam giác).', `z = ${ans}`)],
  };
});

/** Hai đoạn song song với cạnh đáy trong một tam giác. */
const triNestedParallel = gridT('pd-d-tri-nested-parallel', 'lines_angles_triangles', 'hard', (rng) => {
  const p = pickInt(rng, 2, 6);
  const q = p + pickInt(rng, 1, 5);
  const r = q + pickInt(rng, 1, 6);
  const f = (r - q) * pickInt(rng, 1, 4);
  const ans = rat(p * f, r - q);
  return {
    stem: `In triangle ABC, points D and F lie on side AB, with D between A and F, and points E and G lie on side AC. Segments DE, FG, and BC are all parallel. If DE = ${p}, FG = ${q}, BC = ${r}, and FB = ${f}, what is the length of AD?`,
    answer: ans,
    steps: [
      S('Các tam giác ADE, AFG, ABC đồng dạng: đoạn trên cạnh AB tỉ lệ với cạnh song song.', `AD : AF : AB = ${p} : ${q} : ${r}`),
      S(`FB ứng với phần ${r} − ${q} = ${r - q} của tỉ lệ.`, `1 phần = frac(${f},${r - q}) = ${fx(rat(f, r - q))}`),
      S('AD ứng với p phần.', `AD = ${p} × ${fx(rat(f, r - q))} = ${fx(ans)}`),
    ],
  };
});

/** Đổi độ sang radian. */
const triDegToRad = mcqT('pd-d-tri-deg-to-rad', 'circles', 'easy', (rng) => {
  const D = 5 * pickInt(rng, 1, 143);
  const r = rat(D, 180);
  const { choices, correctIndex } = textMcq(
    piText(r),
    [
      td(piText(rat(D, 360)), null, 'Chia cho 360; π radian ứng với 180 độ.'),
      td(piText(rat(180, D)), 'inverted_fraction', 'Lật ngược tỉ số đổi đơn vị.'),
      td(piText(rat(D, 90)), null, 'Chia cho 90.'),
      td(piText(rat(2 * D, 180)), null, 'Nhân đôi thừa.'),
      td(piText(rat(D, 120)), null, 'Dùng sai hệ số đổi đơn vị.'),
      td(piText(rat(D + 180, 180)), null, 'Cộng thêm π thừa.'),
    ],
    rng,
  );
  return {
    stem: `What is the measure, in radians, of an angle of ${dg(D)}?`,
    choices,
    correctIndex,
    steps: [S('180 độ bằng π radian, nên nhân số đo độ với π/180.', `${D} × frac(pi,180) = ${piText(r)}`)],
  };
});

/** Hai tam giác đồng dạng: chu vi tỉ lệ theo cùng hệ số. */
const triSimilarPerimeter = mcqT('pd-d-tri-similar-perimeter', 'lines_angles_triangles', 'medium', (rng) => {
  const sides = [pickInt(rng, 3, 9), pickInt(rng, 4, 11), 0];
  sides[2] = Math.max(sides[0]!, sides[1]!) + pickInt(rng, 1, Math.min(sides[0]!, sides[1]!) - 1);
  const [a, b, c] = sides as [number, number, number];
  const k = pick(rng, [rat(3, 2), rat(2), rat(5, 2), rat(3), rat(4, 3), rat(1, 2)]);
  const cNew = mulValue(rat(c), k);
  const per = mulValue(rat(a + b + c), k);
  const { choices, correctIndex } = numMcq(
    per,
    [
      nd(addValue(rat(a + b + c), subValue(cNew, rat(c))), null, 'Cộng thêm cùng một hiệu cho mọi cạnh; đồng dạng là NHÂN cùng một tỉ số.'),
      nd(mulValue(rat(a + b + c), divValue(cNew, rat(a))), null, 'Ghép nhầm cạnh tương ứng (dùng cạnh ngắn nhất).'),
      nd(addValue(rat(a + b), cNew), 'stopped_too_early', 'Chỉ đổi một cạnh, giữ nguyên hai cạnh kia.'),
    ],
    rng,
  );
  return {
    stem: `A triangle has side lengths ${a}, ${b}, and ${c}. A similar triangle has its longest side of length ${fx(cNew)}. What is the perimeter of the similar triangle?`,
    choices,
    correctIndex,
    steps: [
      S('Cạnh dài nhất ứng với cạnh dài nhất: tìm tỉ số đồng dạng.', `k = frac(${fx(cNew)},${c}) = ${fx(k)}`),
      S('Chu vi nhân với cùng tỉ số.', `(${a} + ${b} + ${c}) × ${fx(k)} = ${fx(per)}`),
    ],
  };
});

/** Có bao nhiêu độ dài nguyên cho cạnh thứ ba? */
const triCountThirdSides = mcqT('pd-d-tri-count-third-sides', 'lines_angles_triangles', 'medium', (rng) => {
  const p = pickInt(rng, 2, 25);
  const q = p + pickInt(rng, 0, 20);
  const ans = 2 * p - 1;
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(2 * p + 1, 'off_by_one', 'Tính cả hai đầu mút; bằng tổng hoặc hiệu thì tam giác suy biến.'),
      nd(2 * p, 'off_by_one', 'Tính một đầu mút.'),
      nd(p + q - 1, null, 'Chỉ dùng cận trên, quên cạnh thứ ba phải lớn hơn hiệu hai cạnh.'),
    ],
    rng,
  );
  return {
    stem: `Two sides of a triangle have lengths ${p} and ${q}. How many different integer lengths are possible for the third side?`,
    choices,
    correctIndex,
    steps: [
      S('Cạnh thứ ba nằm giữa hiệu và tổng (không lấy hai đầu).', `${q - p} < c < ${p + q}`),
      S('Đếm số nguyên trong khoảng mở.', `${p + q - 1} - ${q - p + 1} + 1 = ${ans}`),
    ],
  };
});

/** Tam giác vuông, DE song song với cạnh huyền. */
const triRightParallelInside = mcqT('pd-d-tri-right-parallel-inside', 'lines_angles_triangles', 'hard', (rng) => {
  const [p0, q0, c0] = pick(rng, TRIPLES);
  const [a0, b0] = rng() < 0.5 ? [p0, q0] : [q0, p0];
  const k = pickInt(rng, 2, 6);
  const t = pickInt(rng, 1, k - 1);
  const [AC, BC, AB] = [a0 * k, b0 * k, c0 * k];
  const CD = a0 * t;
  const CE = b0 * t;
  const { choices, correctIndex } = numMcq(
    CE,
    [
      nd(BC - CE, null, 'Đây là EB, phần còn lại của cạnh BC.'),
      nd(c0 * t, null, 'Đây là DE, không phải CE.'),
      nd(BC - (AC - CD) === CE ? CE + 1 : BC - (AC - CD), null, 'Trừ cùng một độ dài ở hai cạnh; đồng dạng là theo tỉ lệ.'),
    ],
    rng,
  );
  return {
    stem: `In right triangle ABC, angle C is a right angle, AC = ${AC}, and AB = ${AB}. Point D lies on AC and point E lies on BC so that DE is parallel to AB. If CD = ${CD}, what is the length of CE?`,
    choices,
    correctIndex,
    steps: [
      S('Pythagoras cho cạnh BC.', `BC = sqrt(${AB}^2 - ${AC}^2) = ${BC}`),
      S('DE song song AB nên tam giác CDE đồng dạng tam giác CAB.', `frac(CE,${BC}) = frac(${CD},${AC})   ⇒   CE = ${CE}`),
    ],
  };
});

/** Tam giác cân, cạnh đáy ngắn nhất, góc đỉnh là bội của m. */
const triIsoscelesAngleBound = mcqT('pd-d-tri-isosceles-angle-bound', 'lines_angles_triangles', 'hard', (rng) => {
  const m = pick(rng, [4, 5, 6, 8, 10, 12, 14]);
  const least = rng() < 0.5;
  const shortest = rng() < 0.6;
  const [P, Q, T] = shuffleCopy(pick(rng, LETTER_SETS), rng) as [string, string, string];
  // Cạnh đáy ngắn nhất ⇔ góc đỉnh < 60; dài nhất ⇔ góc đỉnh > 60.
  const apexes = shortest ? range(1, 59).filter((a) => a % m === 0) : range(61, 179).filter((a) => a % m === 0);
  const aMax = Math.max(...apexes);
  const aMin = Math.min(...apexes);
  const A = least ? aMax : aMin;
  const B = rat(180 - A, 2);
  const { choices, correctIndex } = numMcq(
    B,
    [
      nd(60, null, 'Góc đỉnh 60 độ cho tam giác đều — khi đó cạnh đáy không còn ngắn nhất hay dài nhất.'),
      nd(rat(180 - (least ? aMin : aMax), 2), null, least ? 'Đây là giá trị LỚN nhất của góc đáy.' : 'Đây là giá trị NHỎ nhất của góc đáy.'),
      nd(rat(180 - (shortest ? aMax + m : aMin - m), 2), null, 'Góc đỉnh này vi phạm điều kiện về cạnh đáy.'),
    ],
    rng,
  );
  return {
    stem: `In isosceles triangle ${P}${Q}${T}, ${P}${Q} = ${P}${T}, and side ${Q}${T} is ${shortest ? 'shorter' : 'longer'} than each of the other two sides. The measure of angle ${P}, in degrees, is a multiple of ${m}. What is the ${least ? 'least' : 'greatest'} possible measure of angle ${Q}, in degrees?`,
    choices,
    correctIndex,
    steps: [
      S(shortest ? 'Cạnh ngắn nhất đối diện góc nhỏ nhất, nên góc đỉnh nhỏ hơn hai góc đáy, tức nhỏ hơn 60 độ.' : 'Cạnh dài nhất đối diện góc lớn nhất, nên góc đỉnh lớn hơn 60 độ.', shortest ? `${P} < 60` : `${P} > 60`),
      S(least ? 'Góc đáy nhỏ nhất khi góc đỉnh lớn nhất.' : 'Góc đáy lớn nhất khi góc đỉnh nhỏ nhất.', `${P} = ${A}   ⇒   ${Q} = frac(180 - ${A},2) = ${fx(B)}`),
    ],
  };
});

/** Hai cột cao khác nhau, dây nối hai đỉnh. */
const triPolesRope = mcqT('pd-d-tri-poles-rope', 'right_triangles_trig', 'medium', (rng) => {
  const [dH, dist, rope] = triple(rng, 3);
  const h1 = pickInt(rng, 2, 12);
  const h2 = h1 + dH;
  const { choices, correctIndex } = textMcq(
    String(rope),
    [
      td(rootText(dist * dist + h2 * h2), null, 'Dùng cả chiều cao cột cao; cạnh đứng của tam giác chỉ là hiệu hai chiều cao.'),
      td(String(dist + dH), 'forgot_square_root', 'Cộng thẳng hai cạnh góc vuông.'),
      td(rootText(dist * dist + (h1 + h2) ** 2), null, 'Cộng hai chiều cao thay vì trừ.'),
      td(String(dist), null, 'Đây là khoảng cách theo phương ngang.'),
    ],
    rng,
  );
  return {
    stem: `Two vertical poles stand on level ground ${dist} meters apart. One pole is ${h1} meters tall and the other is ${h2} meters tall. A straight rope is stretched from the top of one pole to the top of the other. What is the length of the rope, in meters?`,
    choices,
    correctIndex,
    steps: [
      S('Dựng tam giác vuông: cạnh ngang là khoảng cách, cạnh đứng là hiệu hai chiều cao.', `${h2} - ${h1} = ${dH}`),
      S('Pythagoras.', `sqrt(${dist}^2 + ${dH}^2) = ${rope}`),
    ],
  };
});

/** Hình thang vuông: cạnh xiên + chiều cao → phần đáy chênh lệch. */
const triRightTrapezoid = mcqT('pd-d-tri-right-trapezoid', 'right_triangles_trig', 'hard', (rng) => {
  const [o, h, s] = triple(rng, 3);
  const Bb = o + pickInt(rng, 3, 30);
  const b = Bb - o;
  const P = Bb + b + h + s;
  const { choices, correctIndex } = numMcq(
    P,
    [
      nd(2 * Bb + h + s, null, 'Coi hai đáy bằng nhau; đáy ngắn thiếu đúng phần nằm dưới cạnh xiên.'),
      nd(Bb + (Bb - h) + h + s, null, 'Trừ nhầm chiều cao khỏi đáy lớn.'),
      nd(Bb + b + h, 'stopped_too_early', 'Quên cộng cạnh xiên.'),
    ],
    rng,
  );
  return {
    stem: `A trapezoid has two right angles. Its longer base has length ${Bb}, its height is ${h}, and its slanted side has length ${s}. What is the perimeter of the trapezoid?`,
    choices,
    correctIndex,
    steps: [
      S('Hạ đường cao từ đầu cạnh xiên: tạo tam giác vuông có cạnh huyền là cạnh xiên.', `sqrt(${s}^2 - ${h}^2) = ${o}`),
      S('Đáy ngắn bằng đáy dài trừ phần đó.', `${Bb} - ${o} = ${b}`),
      S('Cộng bốn cạnh.', `${Bb} + ${b} + ${h} + ${s} = ${P}`),
    ],
  };
});

/** Cạnh góc vuông a và x, cạnh huyền x + d. Điền số. */
const triLegsHypPlus = gridT('pd-d-tri-legs-hyp-plus', 'right_triangles_trig', 'medium', (rng) => {
  const [p, q, r] = pick(rng, TRIPLES);
  const k = pickInt(rng, 1, 12);
  const v = pick(rng, ['x', 'y', 'n']);
  const [a, x] = rng() < 0.5 ? [p * k, q * k] : [q * k, p * k];
  const d = r * k - x;
  return {
    stem: `A right triangle has legs of lengths ${a} and ${v} and a hypotenuse of length ${v} + ${d}. What is the value of ${v}?`,
    answer: rat(x),
    steps: [
      S('Pythagoras.', `${a}^2 + ${v}^2 = (${v} + ${d})^2`),
      S('Khai triển; bình phương của ẩn triệt tiêu.', `${a * a} = ${2 * d}${v} + ${d * d}   ⇒   ${v} = ${x}`),
    ],
  };
});

/** Cắt bốn góc hình vuông bằng tam giác vuông cân → hình chữ nhật bên trong. */
const triSquareCornerCut = mcqT('pd-d-tri-square-corner-cut', 'right_triangles_trig', 'hard', (rng) => {
  const s = pickInt(rng, 3, 20);
  const c = pickInt(rng, 1, s - 1);
  const perim = rng() < 0.7;
  const correct = perim ? radText(rat(2 * s), 2) : String(2 * c * (s - c));
  const dists = perim
    ? [
        td(String(4 * s), null, 'Đây là chu vi hình vuông.'),
        td(radText(rat(4 * c), 2), null, 'Coi cả bốn cạnh đều bằng c√2.'),
        td(String(2 * s), 'forgot_square_root', 'Quên nhân căn 2 khi đổi cạnh góc vuông sang cạnh huyền.'),
        td(radText(rat(s), 2), null, 'Chỉ tính một nửa chu vi.'),
      ]
    : [
        td(String(s * s - 2 * c * c), null, 'Chỉ trừ hai góc bị cắt.'),
        td(String(c * (s - c)), null, 'Quên nhân căn 2 cho cả hai cạnh (tích mất thừa số 2).'),
        td(String(s * s), null, 'Đây là diện tích hình vuông.'),
        td(String(2 * c * c), null, 'Coi hình chữ nhật là hình vuông cạnh c√2.'),
        td(String(c * c + (s - c) * (s - c)), null, 'Cộng bình phương hai cạnh thay vì nhân.'),
        td(String(4 * c * (s - c)), null, 'Nhân đôi thừa.'),
        td(String(2 * c * (s - c) + 2 * s), null, 'Cộng nhầm chu vi vào diện tích.'),
        td(String(s * s - 2 * c * (s - c)), null, 'Đây là phần diện tích bốn tam giác bị cắt.'),
      ];
  const area = 2 * c * (s - c);
  const { choices, correctIndex } = perim
    ? textMcq(correct, dists, rng)
    : numMcq(
        area,
        [
          nd(s * s - 2 * c * c, null, 'Chỉ trừ hai góc bị cắt.'),
          nd(c * (s - c), null, 'Quên nhân căn 2 cho cả hai cạnh (tích mất thừa số 2).'),
          nd(s * s, null, 'Đây là diện tích hình vuông.'),
          nd(c * c + (s - c) * (s - c), null, 'Cộng bình phương hai cạnh thay vì nhân.'),
        ],
        rng,
      );
  return {
    stem: `Square ABCD has side length ${s}. Points P and Q lie on sides AB and AD with AP = AQ = ${c}, and points R and T lie on sides CB and CD with CR = CT = ${c}. Quadrilateral PRTQ is a rectangle. What is the ${perim ? 'perimeter' : 'area'} of rectangle PRTQ?`,
    choices,
    correctIndex,
    steps: [
      S('Bốn góc bị cắt là tam giác vuông cân (45-45-90): hai tam giác cạnh góc vuông c, hai tam giác cạnh góc vuông s − c.', `BP = BR = ${s - c}`),
      S('Cạnh hình chữ nhật là cạnh huyền của các tam giác đó.', `PQ = ${radText(rat(c), 2)},   PR = ${radText(rat(s - c), 2)}`),
      S(perim ? 'Chu vi.' : 'Diện tích.', perim ? `2(${radText(rat(c), 2)} + ${radText(rat(s - c), 2)}) = ${correct}` : `${radText(rat(c), 2)} × ${radText(rat(s - c), 2)} = ${correct}`),
    ],
  };
});

/** Toạ độ tam giác vuông → góc tại gốc, bằng radian. */
const triCoordAngleRad = mcqT('pd-d-tri-coord-angle-rad', 'right_triangles_trig', 'medium', (rng) => {
  const k = pickInt(rng, 1, 30);
  const kind = pick(rng, [4, 3, 6] as const);
  const atB = rng() < 0.4;
  const B = kind === 4 ? `(${k}, ${k})` : kind === 3 ? `(${k}, ${radText(rat(k), 3)})` : `(${radText(rat(k), 3)}, ${k})`;
  const A = kind === 6 ? `(${radText(rat(k), 3)}, 0)` : `(${k}, 0)`;
  // Góc tại O là π/kind; góc tại B là phần phụ của nó.
  const ans = atB ? subValue(rat(1, 2), rat(1, kind)) : rat(1, kind);
  const correct = piText(ans);
  const pool = [piText(rat(1, 6)), piText(rat(1, 4)), piText(rat(1, 3)), piText(rat(1, 2)), piText(rat(2, 3))].filter((t) => t !== correct);
  const { choices, correctIndex } = textMcq(
    correct,
    pool.map((t) => td(t, null, 'Xét tỉ số hai cạnh góc vuông để nhận ra tam giác đặc biệt nào, và góc đó nằm ở đỉnh nào.')),
    rng,
  );
  return {
    stem: `In the xy-plane, O is the origin, point A is at ${A}, and point B is at ${B}. What is the measure, in radians, of angle ${atB ? 'OBA' : 'AOB'}?`,
    choices,
    correctIndex,
    steps: [
      S('OA nằm trên trục hoành, AB thẳng đứng, nên góc tại A vuông.', 'tan(AOB) = frac(AB,OA)'),
      S('Tỉ số cạnh cho biết tam giác đặc biệt; hai góc nhọn phụ nhau. Đổi sang radian.', `${atB ? 'OBA' : 'AOB'} = ${correct}`),
    ],
  };
});

/** Hai đường song song cắt hai trục: dùng Pythagoras rồi đồng dạng. */
const triParallelIntercepts = mcqT('pd-d-tri-parallel-intercepts', 'lines_angles_triangles', 'hard', (rng) => {
  const [a0, b0, c0] = pick(rng, TRIPLES);
  const flip = rng() < 0.5;
  const [ya, xb] = flip ? [b0, a0] : [a0, b0];
  const k = pickInt(rng, 1, 4);
  const OA = ya * k;
  const OB = xb * k;
  const AB = c0 * k;
  const m = pickInt(rng, 1, 7);
  const cc = ya * m;
  const n = xb * m;
  const { choices, correctIndex } = numMcq(
    n,
    [
      nd(rat(cc * AB, OA), null, 'Dùng AB thay vì OB trong tỉ lệ; phải tìm OB bằng Pythagoras trước.'),
      nd(rat(cc * OA, OB), 'inverted_fraction', 'Lật ngược tỉ số.'),
      nd(OB + (cc - OA), null, 'Dịch cùng một khoảng thay vì theo tỉ lệ.'),
    ],
    rng,
  );
  return {
    stem: `In the xy-plane, line p passes through A(0, ${OA}) and B(b, 0), where b > 0, and AB = ${AB}. Line q is parallel to line p and passes through (0, ${cc}). Line q crosses the x-axis at (n, 0). What is the value of n?`,
    choices,
    correctIndex,
    steps: [
      S('Pythagoras trong tam giác OAB.', `b = sqrt(${AB}^2 - ${OA}^2) = ${OB}`),
      S('Hai đường song song tạo hai tam giác vuông đồng dạng với gốc O.', `frac(n,${OB}) = frac(${cc},${OA})   ⇒   n = ${n}`),
    ],
  };
});

/** Đa giác đều nội tiếp: góc ở tâm giữa hai đỉnh, bằng radian. */
const triInscribedCentral = mcqT('pd-d-tri-inscribed-central', 'circles', 'medium', (rng) => {
  const n = pick(rng, [3, 4, 5, 6, 8, 9, 10, 12]);
  const apart = pickInt(rng, 1, Math.max(1, Math.ceil(n / 2) - 1));
  const letters = 'ABCDEFGHJKLM'.slice(0, n);
  const i = pickInt(rng, 0, n - 1);
  const P = letters[i]!;
  const Q = letters[(i + apart) % n]!;
  const correct = piText(rat(2 * apart, n));
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(piText(rat(apart, n)), null, 'Dùng π thay vì 2π cho cả vòng tròn.'),
      td(piText(rat(n - 2, n)), null, 'Đây là góc trong của đa giác đều, không phải góc ở tâm.'),
      td(piText(rat(2 * apart + 2, n)), null, 'Đếm sai số cung giữa hai đỉnh.'),
      td(piText(rat(4 * apart, n)), null, 'Nhân đôi thừa.'),
      td(piText(rat(apart, 2 * n)), null, 'Chia đôi thừa.'),
      td(piText(rat(2 * apart, n + 1)), null, 'Đếm sai số cung.'),
    ],
    rng,
  );
  return {
    stem: `Regular polygon ${letters} has ${n} sides and is inscribed in a circle with center O. What is the measure, in radians, of angle ${P}O${Q}?`,
    choices,
    correctIndex,
    steps: [
      S('Các đỉnh chia đều đường tròn thành n cung bằng nhau; cả vòng là 2π radian.', `frac(2π,${n})`),
      S(`Từ ${P} tới ${Q} (đi đường ngắn) có ${apart} cung.`, `${P}O${Q} = ${apart} × frac(2π,${n}) = ${correct}`),
    ],
  };
});

/** Tam giác 45-45-90 nối tiếp tam giác 30-60-90. */
const triChainSpecial = mcqT('pd-d-tri-chain-special', 'right_triangles_trig', 'hard', (rng) => {
  const a = pickInt(rng, 1, 60);
  const at30 = rng() < 0.5; // góc ADB = 30° thì DB = AB·√3; = 60° thì DB = AB/√3
  const askDB = rng() < 0.6;
  const DB = at30 ? rat(a) : rat(a, 3);
  const AD = at30 ? rat(2 * a) : rat(2 * a, 3);
  // DB = AB·√3 hoặc AB/√3 (đều có dạng hệ số × √6); AD = 2·AB (30°) hoặc 2·DB (60°).
  const correct = askDB ? radText(DB, 6) : at30 ? radText(rat(2 * a), 2) : radText(AD, 6);
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(askDB ? radText(at30 ? rat(a, 3) : rat(a), 6) : radText(at30 ? rat(2 * a, 3) : rat(2 * a), 6), null, 'Đặt nhầm cạnh đối diện góc 30° và góc 60°.'),
      td(radText(rat(a), 2), 'stopped_too_early', 'Đây mới là AB (cạnh huyền của tam giác thứ nhất).'),
      td(radText(rat(a), 3), null, 'Quên rằng AB bằng a nhân căn 2, không phải a.'),
      td(askDB ? radText(rat(2 * a), 2) : radText(DB, 6), null, askDB ? 'Đây là cạnh huyền AD khi góc D bằng 30°.' : 'Đây là DB, không phải cạnh huyền AD.'),
      td(radText(rat(2 * a), 3), null, 'Nhân đôi nhầm cạnh.'),
    ],
    rng,
  );
  return {
    stem: `In right triangle ABC, angle C is a right angle and AC = BC = ${a}. Triangle ABD is a right triangle with its right angle at B, and the measure of angle ADB is ${at30 ? '30deg' : '60deg'}. What is the length of ${askDB ? 'DB' : 'AD'}?`,
    choices,
    correctIndex,
    steps: [
      S('Tam giác ABC vuông cân: cạnh huyền bằng cạnh góc vuông nhân căn 2.', `AB = ${radText(rat(a), 2)}`),
      S(at30 ? 'Trong tam giác 30-60-90, AB đối diện góc 30° là cạnh ngắn: DB bằng cạnh ngắn nhân căn 3, AD gấp đôi cạnh ngắn.' : 'AB đối diện góc 60°: DB (đối diện góc 30°) bằng AB chia căn 3, AD gấp đôi DB.', `${askDB ? 'DB' : 'AD'} = ${correct}`),
    ],
  };
});

/** Đường tròn nội tiếp hình vuông cho biết đường chéo. */
const triCircleInSquare = mcqT('pd-d-tri-circle-in-square', 'circles', 'medium', (rng) => {
  const d = 2 * pickInt(rng, 1, 30);
  const inscribed = rng() < 0.6;
  const name = pick(rng, ['ABCD', 'PQRS', 'KLMN', 'WXYZ']);
  const coef = inscribed ? rat(d * d, 8) : rat(d * d, 4);
  const correct = piText(coef);
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(piText(inscribed ? rat(d * d, 4) : rat(d * d, 8)), inscribed ? 'used_diameter_not_radius' : null, inscribed ? 'Coi đường chéo là đường kính của đường tròn nội tiếp.' : 'Nhầm với đường tròn nội tiếp: đường tròn ngoại tiếp đi qua bốn đỉnh, đường kính là đường chéo.'),
      td(piText(rat(d * d, 2)), null, 'Dùng cả đường chéo làm bán kính.'),
      td(piText(rat(d * d, 16)), null, 'Chia thêm cho 2 một lần thừa.'),
      td(String((d * d) / 2), null, 'Đây là diện tích hình vuông.'),
      td(piText(rat(d, 2)), 'forgot_square_root', 'Quên bình phương bán kính.'),
    ],
    rng,
  );
  return {
    stem: `Square ${name} has a diagonal of length ${d}. A circle is ${inscribed ? 'inscribed in the square' : 'circumscribed about the square, passing through all four vertices'}. What is the area of the circle?`,
    choices,
    correctIndex,
    steps: inscribed
      ? [
          S('Cạnh hình vuông bằng đường chéo chia căn 2; đường kính của đường tròn nội tiếp bằng cạnh.', `s = frac(${d},sqrt(2)),   r = frac(s,2)`),
          S('Diện tích.', `π r^2 = π × frac(${d * d},8) = ${correct}`),
        ]
      : [S('Đường tròn đi qua bốn đỉnh nhận đường chéo làm đường kính.', `r = ${d / 2}`), S('Diện tích.', `π r^2 = ${correct}`)],
  };
});

/** Biết hai cạnh, chu vi nào có thể có? */
const triRomanPerimeters = mcqT('pd-d-tri-roman-perimeters', 'lines_angles_triangles', 'medium', (rng) => {
  const p = pickInt(rng, 3, 15);
  const q = p + pickInt(rng, 1, 12);
  const lo = 2 * q;
  const hi = 2 * (p + q);
  const pickP = (valid: boolean) => (valid ? pickInt(rng, lo + 1, hi - 1) : pick(rng, [lo, hi, lo - pickInt(rng, 1, 5), hi + pickInt(rng, 1, 5)]));
  const truth = [rng() < 0.5, rng() < 0.5, rng() < 0.5];
  if (!truth.includes(true)) truth[pickInt(rng, 0, 2)] = true;
  const vals = truth.map((t) => pickP(t));
  const { choices, correctIndex } = romanMcq(truth, rng);
  return {
    stem: `Two sides of a triangle have lengths ${p} and ${q}. Which of the following could be the perimeter of the triangle? I. ${vals[0]}; II. ${vals[1]}; III. ${vals[2]}`,
    choices,
    correctIndex,
    steps: [
      S('Cạnh thứ ba c thoả hiệu < c < tổng.', `${q - p} < c < ${p + q}`),
      S('Cộng thêm hai cạnh đã biết để ra khoảng của chu vi (không lấy hai đầu).', `${lo} < P < ${hi}   ⇒   ${romanLabel(truth)}`),
    ],
  };
});

/** Tam giác đều nội tiếp tam giác đều, một cạnh vuông góc với cạnh ngoài. */
const triInscribedEquilateral = mcqT('pd-d-tri-inscribed-equilateral', 'right_triangles_trig', 'hard', (rng) => {
  const s = pickInt(rng, 2, 90);
  const askArea = rng() < 0.5;
  const correct = askArea ? radText(rat(s * s, 12), 3) : radText(rat(s, 3), 3);
  const dists = askArea
    ? [
        td(radText(rat(s * s, 4), 3), null, 'Đây là diện tích tam giác ABC lớn.'),
        td(radText(rat(s * s, 6), 3), null, 'Tỉ số diện tích là 1/3, không phải 2/3.'),
        td(radText(rat(s * s, 36), 3), null, 'Lấy cạnh DEF bằng một phần ba cạnh ABC; thật ra đó là đoạn AD.'),
        td(radText(rat(s * s, 16), 3), null, 'Lấy cạnh DEF bằng một nửa cạnh ABC.'),
      ]
    : [
        td(fx(rat(s, 3)), null, 'Đây là AD, không phải ED.'),
        td(fx(rat(s, 2)), null, 'D không phải trung điểm.'),
        td(radText(rat(2 * s, 3), 3), null, 'Nhân đôi thừa.'),
        td(radText(rat(s, 2), 3), null, 'Đây là đường cao của tam giác ABC.'),
      ];
  const { choices, correctIndex } = textMcq(correct, dists, rng);
  return {
    stem: `Equilateral triangle ABC has side length ${s}. Equilateral triangle DEF is drawn inside it with D on AC, E on AB, and F on BC, so that ED is perpendicular to AC. What is the ${askArea ? 'area of triangle DEF' : 'length of ED'}?`,
    choices,
    correctIndex,
    steps: [
      S('Ba tam giác nhỏ ở ba góc bằng nhau; tam giác AED có góc A = 60°, góc D = 90°, nên là tam giác 30-60-90: AE = 2AD.', `AD + 2AD = ${s}   ⇒   AD = ${fx(rat(s, 3))}`),
      S('ED đối diện góc 60°.', `ED = ${radText(rat(s, 3), 3)}`),
      ...(askArea ? [S('Diện tích tam giác đều cạnh ED.', `frac(sqrt(3),4) × ED^2 = ${correct}`)] : []),
    ],
  };
});

/** Hai tam giác chung hai cạnh p, q: |a − b| không thể vượt 2p. */
const triTwoTrianglesDiff = mcqT('pd-d-tri-two-triangles-diff', 'lines_angles_triangles', 'hard', (rng) => {
  const p = pickInt(rng, 3, 12);
  const q = p + pickInt(rng, 0, 10);
  const bad = 2 * p + pickInt(rng, 0, 4);
  const okVals = sample(rng, range(1, 2 * p - 1), 3);
  const { choices, correctIndex } = numMcq(
    bad,
    okVals.map((v) => nd(v, null, `Có thể: a và b đều nằm trong khoảng (${q - p}, ${p + q}) và chênh nhau ${v}.`)),
    rng,
  );
  return {
    stem: `One triangle has side lengths ${p}, ${q}, and a. Another triangle has side lengths ${p}, ${q}, and b. Which of the following can NOT be the value of |a - b|?`,
    choices,
    correctIndex,
    steps: [
      S('Cả a và b đều nằm giữa hiệu và tổng của hai cạnh kia.', `${q - p} < a, b < ${p + q}`),
      S('Nên hiệu của chúng nhỏ hơn độ rộng của khoảng.', `|a - b| < ${2 * p}`),
    ],
  };
});

/** Tam giác đều dựng trên cạnh hình vuông (trong hoặc ngoài): các góc tạo thành. */
const triSquareEquilateralAngle = mcqT('pd-d-tri-square-equilateral-angle', 'lines_angles_triangles', 'hard', (rng) => {
  const start = pickInt(rng, 0, 14);
  const L = 'ABCDEFGHJKLMNPQRSTUVW'.slice(start, start + 4).split('');
  const Eletter = pick(rng, ['X', 'Y', 'Z']);
  const [A, B, C, D] = L as [string, string, string, string];
  const inside = rng() < 0.5;
  const ADE = inside ? 75 : 15;
  const EDC = 90 - ADE;
  const DEC = 180 - 2 * EDC;
  const DAE = inside ? 30 : 150;
  const asks: Array<[string, number]> = [
    [`${A}${D}${Eletter}`, ADE],
    [`${A}${Eletter}${D}`, ADE],
    [`${Eletter}${D}${C}`, EDC],
    [`${Eletter}${C}${D}`, EDC],
    [`${D}${Eletter}${C}`, DEC],
    [`${D}${A}${Eletter}`, DAE],
  ];
  const [name, ans] = pick(rng, asks);
  const pool = [15, 30, 60, 75, 150, 105, 120].filter((v) => v !== ans);
  const { choices, correctIndex } = numMcq(
    ans,
    sample(rng, pool, 3).map((v) => nd(v, null, 'Xét tam giác cân tạo bởi một cạnh hình vuông và một cạnh tam giác đều (hai cạnh bằng nhau).')),
    rng,
  );
  return {
    stem: `Square ${A}${B}${C}${D} and equilateral triangle ${A}${B}${Eletter} share side ${A}${B}, and point ${Eletter} lies ${inside ? 'inside' : 'outside'} the square. What is the measure, in degrees, of angle ${name}?`,
    choices,
    correctIndex,
    steps: [
      S(`${A}${D} = ${A}${B} = ${A}${Eletter}, nên tam giác ${A}${D}${Eletter} cân tại ${A}.`, `${D}${A}${Eletter} = 90 ${inside ? '-' : '+'} 60 = ${DAE}`),
      S('Hai góc đáy của tam giác cân bằng nhau; phần còn lại suy ra từ góc vuông và tính đối xứng.', `${A}${D}${Eletter} = ${ADE},   ${Eletter}${D}${C} = ${EDC},   ${D}${Eletter}${C} = ${DEC}`),
    ],
  };
});

/** Nửa đường tròn dựng ngoài trên cạnh trên của hình vuông. */
const triSemicircleSquare = mcqT('pd-d-tri-semicircle-square', 'right_triangles_trig', 'hard', (rng) => {
  const s = 2 * pickInt(rng, 1, 30);
  const start = pickInt(rng, 0, 9);
  const [A, B, C, D] = 'ABCDEFGHJKLMN'.slice(start, start + 4).split('') as [string, string, string, string];
  const far = rng() < 0.6;
  const correct = far ? radText(rat(s / 2), 10) : radText(rat(s / 2), 2);
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(far ? radText(rat(s / 2), 2) : radText(rat(s / 2), 10), null, 'Đo tới nhầm đỉnh.'),
      td(far ? String(s + s / 2) : String(s / 2), null, 'Chỉ lấy khoảng cách theo phương đứng.'),
      td(far ? radText(rat(s / 2), 5) : String(s), null, 'Tính sai một cạnh góc vuông.'),
      td(far ? String(2 * s) : radText(rat(s), 2), null, 'Cộng thẳng hai cạnh hoặc dùng sai cạnh.'),
    ],
    rng,
  );
  const target = far ? D : A;
  return {
    stem: `Square ${A}${B}${C}${D} has side length ${s}, with side ${A}${B} on top and ${D} directly below ${A}. A semicircle is drawn outside the square with side ${A}${B} as its diameter. Point X is the point on the semicircle farthest from ${A}${B}. What is the distance from X to ${target}?`,
    choices,
    correctIndex,
    steps: [
      S('X nằm ngay trên trung điểm của cạnh trên, cách cạnh đó một bán kính.', `r = ${s / 2}`),
      S('Dựng tam giác vuông: cạnh ngang là nửa cạnh, cạnh đứng là bán kính' + (far ? ' cộng cả cạnh hình vuông.' : '.'), far ? `sqrt(${s / 2}^2 + ${s + s / 2}^2) = ${correct}` : `sqrt(${s / 2}^2 + ${s / 2}^2) = ${correct}`),
    ],
  };
});

/** Tam giác cân có góc đỉnh đặc biệt: diện tích = ½·s²·sin B. */
const triIsoscelesSpecialArea = mcqT('pd-d-tri-isosceles-special-area', 'area_volume', 'hard', (rng) => {
  const s = pickInt(rng, 2, 60);
  const B = pick(rng, [120, 120, 150, 135, 60]);
  // ½ s² sin B
  const area = B === 120 || B === 60 ? radText(rat(s * s, 4), 3) : B === 150 ? fx(rat(s * s, 4)) : radText(rat(s * s, 4), 2);
  const alt = [radText(rat(s * s, 2), 3), fx(rat(s * s, 2)), radText(rat(s * s, 4), 2), radText(rat(s * s, 4), 3), fx(rat(s * s, 4)), radText(rat(s * s, 8), 3)];
  const { choices, correctIndex } = textMcq(
    area,
    alt.map((t) => td(t, null, 'Dựng đường cao từ A xuống đường thẳng BC để có tam giác vuông đặc biệt; đường cao phụ thuộc góc B.')),
    rng,
  );
  return {
    stem: `In triangle ABC, AB = BC = ${s} and the measure of angle B is ${dg(B)}. What is the area of triangle ABC?`,
    choices,
    correctIndex,
    steps: [
      S('Lấy BC làm đáy; hạ đường cao từ A xuống đường thẳng BC. Góc tạo bởi AB và đường thẳng BC (phía đường cao) là góc đặc biệt.', `h = ${s} × sin(${B > 90 ? 180 - B : B}deg)`),
      S('Diện tích bằng nửa đáy nhân cao.', `frac(1,2)(${s})(h) = ${area}`),
    ],
  };
});

/** Điểm có toạ độ đặc biệt → góc quay từ chiều dương trục hoành (radian). */
const triPointAngleRad = mcqT('pd-d-tri-point-angle-rad', 'right_triangles_trig', 'hard', (rng) => {
  const k = pickInt(rng, 1, 20);
  const ref = pick(rng, [6, 4, 3] as const);
  const quad = pickInt(rng, 1, 4);
  const [xa, ya] = ref === 6 ? [radText(rat(k), 3), String(k)] : ref === 4 ? [String(k), String(k)] : [String(k), radText(rat(k), 3)];
  const sx = quad === 1 || quad === 4 ? '' : '-';
  const sy = quad === 1 || quad === 2 ? '' : '-';
  const ang = (q: number) => (q === 1 ? rat(1, ref) : q === 2 ? rat(ref - 1, ref) : q === 3 ? rat(ref + 1, ref) : rat(2 * ref - 1, ref));
  const correct = piText(ang(quad));
  const { choices, correctIndex } = textMcq(
    correct,
    [1, 2, 3, 4]
      .filter((q) => q !== quad)
      .map((q) => td(piText(ang(q)), null, `Đây là góc của điểm ở góc phần tư ${q}; xét dấu của hai toạ độ.`)),
    rng,
  );
  return {
    stem: `In the xy-plane, point P has coordinates (${sx}${xa}, ${sy}${ya}). What is the measure, in radians, of the angle measured counterclockwise from the positive x-axis to segment OP, where O is the origin, if the measure is between 0 and 2π?`,
    choices,
    correctIndex,
    steps: [
      S('Tỉ số hai toạ độ (bỏ dấu) cho góc tham chiếu với trục hoành.', `góc tham chiếu = ${piText(rat(1, ref))}`),
      S(`Dấu của hai toạ độ đặt P ở góc phần tư ${quad}.`, `${correct}`),
    ],
  };
});

/** Hình vuông nội tiếp góc vuông của tam giác vuông: tam giác nhỏ đồng dạng. */
const triSquareInRight = gridT('pd-d-tri-square-in-right', 'lines_angles_triangles', 'hard', (rng) => {
  const s = pickInt(rng, 2, 15);
  const e = pickInt(rng, 1, 20);
  return {
    stem: `Right triangle OAB has its right angle at O. Square ODFE has D on OA, E on OB, and F on AB. If the side length of the square is ${s} and EB = ${e}, what is the length of DA?`,
    answer: rat(s * s, e),
    steps: [
      S('Hai tam giác nhỏ EBF và DFA đều vuông và có cạnh song song với hai cạnh góc vuông, nên đồng dạng.'),
      S('Lập tỉ lệ cạnh tương ứng.', `frac(EB,EF) = frac(DF,DA)   ⇒   frac(${e},${s}) = frac(${s},DA)`),
      S('Giải ra.', `DA = frac(${s * s},${e}) = ${fx(rat(s * s, e))}`),
    ],
  };
});

/** Hình vuông, đoạn từ một đỉnh tới cạnh đối diện cắt đường chéo. */
const triSquareDiagIntersect = mcqT('pd-d-tri-square-diag-intersect', 'lines_angles_triangles', 'hard', (rng) => {
  const a = pickInt(rng, 2, 5);
  const b = pickInt(rng, 1, a - 1);
  const k = pickInt(rng, 1, 12);
  const s = k * a * (a + b);
  const f = k * b * (a + b);
  const x = k * a * b; // = s·f/(s + f)
  const askED = rng() < 0.4;
  const correct = radText(rat(askED ? s - x : x), 2);
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(String(x), 'forgot_square_root', 'Đây là hoành độ của E; khoảng cách dọc đường chéo phải nhân căn 2.'),
      td(radText(rat(s, 2), 2), null, 'Coi E là tâm hình vuông.'),
      td(radText(rat(f), 2), null, 'Dùng BF làm cạnh của tam giác vuông cân.'),
      td(radText(rat(askED ? x : s - x), 2), null, askED ? 'Đây là BE, không phải ED.' : 'Đây là ED, phần còn lại của đường chéo.'),
      td(radText(rat(s), 2), null, 'Đây là cả đường chéo BD.'),
      td(String(2 * x), null, 'Nhân đôi thay vì nhân căn 2.'),
    ],
    rng,
  );
  return {
    stem: `Square ABCD has side length ${s}. Point F lies on side BC with BF = ${f}. Segment AF intersects diagonal BD at point E. What is the length of ${askED ? 'ED' : 'BE'}?`,
    choices,
    correctIndex,
    steps: [
      S('AD song song BF, nên tam giác EBF đồng dạng tam giác EDA.', `frac(BE,ED) = frac(BF,AD) = frac(${f},${s})`),
      S('Đường chéo dài cạnh nhân căn 2; chia theo tỉ lệ đó.', `${askED ? 'ED' : 'BE'} = frac(${askED ? s : f},${f + s}) × ${s}sqrt(2) = ${correct}`),
    ],
  };
});

/** Tam giác vuông, DE vuông góc với cạnh huyền: tam giác nhỏ đồng dạng. Điền số. */
const triAltitudeSimilar = gridT('pd-d-tri-altitude-similar', 'lines_angles_triangles', 'hard', (rng) => {
  const [a, b, c] = triple(rng, 2);
  const d = pickInt(rng, 1, Math.min(b - 1, 9));
  return {
    stem: `In right triangle ABC, angle B is a right angle, AB = ${a}, BC = ${b}, and AC = ${c}. Point D lies on AB and point E lies on AC so that DE is perpendicular to AC. If DE = ${d}, what is the length of AE?`,
    answer: rat(d * a, b),
    steps: [
      S('Tam giác AED (vuông tại E) và tam giác ABC (vuông tại B) chung góc A, nên đồng dạng.'),
      S('Trong mỗi tam giác, lấy tỉ số cạnh kề góc A với cạnh đối diện góc A.', `frac(AE,DE) = frac(AB,BC)   ⇒   AE = ${d} × frac(${a},${b}) = ${fx(rat(d * a, b))}`),
    ],
  };
});

const CH20: MathTemplate[] = [
  triPythSetup,
  triEquilateralParts,
  triSquareDiagonal,
  triBowtieSimilar,
  triThirdSideExtreme,
  triIsoscelesPerimeter,
  triRomanValid,
  triIsoscelesArea,
  triSquareEquilateral,
  triConeSlice,
  triIntegerPerimeterMax,
  triNestedParallel,
  triDegToRad,
  triSimilarPerimeter,
  triCountThirdSides,
  triRightParallelInside,
  triIsoscelesAngleBound,
  triPolesRope,
  triRightTrapezoid,
  triLegsHypPlus,
  triSquareCornerCut,
  triCoordAngleRad,
  triParallelIntercepts,
  triInscribedCentral,
  triChainSpecial,
  triCircleInSquare,
  triRomanPerimeters,
  triInscribedEquilateral,
  triTwoTrianglesDiff,
  triSquareEquilateralAngle,
  triSemicircleSquare,
  triIsoscelesSpecialArea,
  triPointAngleRad,
  triSquareInRight,
  triSquareDiagIntersect,
  triAltitudeSimilar,
];

// ================================================================ Chương 21 — Đường tròn

const POLY_LETTERS = 'ABCDEFGH';

/** Đa giác đều nội tiếp: cung nhỏ giữa hai đỉnh kề nhau = 2πr/n. */
const cirInscribedPolygonArc = mcqT('pd-d-cir-inscribed-polygon-arc', 'circles', 'easy', (rng) => {
  const n = pick(rng, [3, 4, 5, 6, 8]);
  const r = pickInt(rng, 1, 30);
  const name = POLY_LETTERS.slice(0, n);
  const arc = rat(2 * r, n);
  const { choices, correctIndex } = textMcq(
    piText(arc),
    [
      td(piText(rat(r * r, n)), 'confused_area_perimeter', 'Chia diện tích thay vì chu vi.'),
      td(piText(rat(r, n)), null, 'Dùng πr thay vì 2πr cho cả vòng tròn.'),
      td(piText(rat(2 * r)), null, 'Đây là cả chu vi.'),
      td(piText(rat(4 * r, n)), 'used_diameter_not_radius', 'Dùng đường kính thay vì bán kính trong công thức 2πr.'),
    ],
    rng,
  );
  return {
    stem: `${n === 4 ? 'Square' : n === 3 ? 'Equilateral triangle' : 'Regular polygon'} ${name} is inscribed in a circle with radius ${r}. What is the length of the minor arc between vertices ${name[0]} and ${name[1]}?`,
    choices,
    correctIndex,
    steps: [
      S(`Các đỉnh chia đường tròn thành ${n} cung bằng nhau.`, `frac(2π(${r}),${n})`),
      S('Rút gọn.', piText(arc)),
    ],
  };
});

/** n hình tròn bằng nhau nằm dọc một đường kính của hình tròn lớn. */
const cirCirclesOnDiameter = mcqT('pd-d-cir-circles-on-diameter', 'circles', 'medium', (rng) => {
  const n = pickInt(rng, 2, 5);
  const a = pickInt(rng, 1, 60);
  const big = rat((n * a) ** 2);
  const { choices, correctIndex } = textMcq(
    piText(big),
    [
      td(piText(rat(n * a * a)), null, 'Cộng diện tích các hình tròn nhỏ; hình tròn lớn còn phần trống.'),
      td(piText(rat(((n + 1) * a) ** 2)), 'off_by_one', 'Đếm thừa một bán kính.'),
      td(piText(rat((2 * n * a) ** 2)), 'used_diameter_not_radius', 'Dùng đường kính lớn làm bán kính.'),
      td(piText(rat(n * n * a)), 'forgot_square_root', 'Quên bình phương bán kính nhỏ.'),
    ],
    rng,
  );
  return {
    stem: `${n} congruent circles lie inside a larger circle. Their centers are on a diameter of the larger circle, each small circle is tangent to its neighbors, and the two outer small circles are tangent to the larger circle. If each small circle has area ${piText(rat(a * a))}, what is the area of the larger circle?`,
    choices,
    correctIndex,
    steps: [
      S('Bán kính mỗi hình tròn nhỏ.', `r = ${a}`),
      S(`Đường kính lớn gồm ${n} đường kính nhỏ nên bán kính lớn gấp ${n} lần.`, `R = ${n * a}`),
      S('Diện tích.', `π(${n * a})^2 = ${piText(big)}`),
    ],
  };
});

/** Chia hình tròn thành n hình quạt bằng nhau: chu vi một hình quạt. */
const cirSectorPerimeter = mcqT('pd-d-cir-sector-perimeter', 'circles', 'medium', (rng) => {
  const r = pickInt(rng, 2, 30);
  const n = pick(rng, [3, 4, 5, 6, 8, 10, 12]);
  const arc = rat(2 * r, n);
  const per = (lin: number, c: MathValue) => `${lin} + ${piText(c)}`;
  const { choices, correctIndex } = textMcq(
    per(2 * r, arc),
    [
      td(per(r, arc), null, 'Hình quạt có HAI bán kính làm cạnh.'),
      td(per(2 * r, rat(r * r, n)), 'confused_area_perimeter', 'Lấy phần diện tích thay vì phần cung.'),
      td(per(2 * r, rat(2 * r)), null, 'Dùng cả chu vi đường tròn thay vì một phần.'),
      td(per(4 * r, arc), 'used_diameter_not_radius', 'Dùng đường kính làm cạnh thẳng.'),
    ],
    rng,
  );
  return {
    stem: `A circle has area ${piText(rat(r * r))} and is divided into ${n} congruent sectors by segments from its center. What is the perimeter of one of these sectors?`,
    choices,
    correctIndex,
    steps: [
      S('Tìm bán kính từ diện tích.', `r^2 = ${r * r}   ⇒   r = ${r}`),
      S('Một hình quạt gồm hai bán kính và một cung bằng một phần chu vi.', `2(${r}) + frac(2π(${r}),${n}) = ${per(2 * r, arc)}`),
    ],
  };
});

/** Tâm (h, k) và diện tích → phương trình đường tròn. */
const circleEq = (h: number, k: number, rhs: number) => `${xMinus(h)}^2 + ${xMinus(k, 'y')}^2 = ${rhs}`;

const cirEquationCenterArea = mcqT('pd-d-cir-equation-center-area', 'circles', 'easy', (rng) => {
  const h = pickInt(rng, -8, 8);
  const k = pickNonZeroInt(rng, -8, 8);
  const r = pickInt(rng, 2, 12);
  const byArea = rng() < 0.6;
  const { choices, correctIndex } = textMcq(
    circleEq(h, k, r * r),
    [
      td(circleEq(-h, -k, r * r), 'sign_flip', 'Tâm (h, k) cho (x − h) và (y − k): dấu trong ngoặc ngược với dấu của toạ độ.'),
      td(circleEq(h, k, r), 'forgot_square_root', 'Vế phải là bình phương bán kính, không phải bán kính.'),
      td(circleEq(-h, -k, r), 'sign_flip', 'Sai dấu tâm và quên bình phương bán kính.'),
      td(circleEq(h, k, 2 * r), 'used_diameter_not_radius', 'Dùng đường kính.'),
    ],
    rng,
  );
  return {
    stem: `Which of the following is an equation of a circle in the xy-plane with center (${h}, ${k}) and ${byArea ? `an area of ${piText(rat(r * r))}` : `a circumference of ${piText(rat(2 * r))}`}?`,
    choices,
    correctIndex,
    steps: [
      S(byArea ? 'Diện tích πr² cho bình phương bán kính.' : 'Chu vi 2πr cho bán kính.', byArea ? `r^2 = ${r * r}` : `r = ${r},   r^2 = ${r * r}`),
      S('Dạng chuẩn (x − h)² + (y − k)² = r².', circleEq(h, k, r * r)),
    ],
  };
});

/** Góc nội tiếp θ chắn cung bằng 2θ: cung đó chiếm bao nhiêu phần chu vi? */
const cirInscribedArcFraction = mcqT('pd-d-cir-inscribed-arc-fraction', 'circles', 'medium', (rng) => {
  const theta = pick(rng, [10, 12, 15, 18, 20, 22.5, 24, 30, 36, 40, 45, 60, 72, 75, 80].filter((t) => Number.isInteger(t)));
  const [P, Q, T] = shuffleCopy(pick(rng, LETTER_SETS), rng) as [string, string, string];
  const frac = rat(theta, 180);
  const { choices, correctIndex } = numMcq(
    frac,
    [
      nd(rat(theta, 360), null, 'Quên rằng cung bị chắn gấp đôi góc nội tiếp.'),
      nd(rat(180 - theta, 180), null, 'Đây là phần của cung lớn còn lại (tính theo nửa đường tròn).'),
      nd(rat(theta, 90), null, 'Nhân đôi hai lần.'),
    ],
    rng,
  );
  return {
    stem: `In a circle, inscribed angle ${P}${T}${Q} measures ${dg(theta)}. The length of minor arc ${P}${Q} is what fraction of the circumference of the circle?`,
    choices,
    correctIndex,
    steps: [
      S('Góc nội tiếp bằng nửa số đo cung bị chắn.', `cung ${P}${Q} = 2 × ${theta} = ${2 * theta}deg`),
      S('Chia cho 360 độ.', `frac(${2 * theta},360) = ${fx(frac)}`),
    ],
  };
});

/** AC là đường kính, một dây bằng bán kính (hoặc r√3) → góc BAC. */
const cirDiameterChordAngle = gridT('pd-d-cir-diameter-chord-angle', 'circles', 'medium', (rng) => {
  const [A, B, C] = shuffleCopy(pick(rng, LETTER_SETS), rng) as [string, string, string];
  const r = pickInt(rng, 1, 20);
  const chordAB = rng() < 0.5;
  const longChord = rng() < 0.4;
  // Tam giác ABC vuông tại B. Cạnh đối diện góc BAC là BC.
  // Dây bằng r đối diện góc 30°, dây bằng r√3 đối diện góc 60°.
  const chordLen = longChord ? radText(rat(r), 3) : String(r);
  const oppAngle = longChord ? 60 : 30; // góc đối diện dây đã cho
  const ans = chordAB ? 90 - oppAngle : oppAngle;
  return {
    stem: `In a circle with radius ${r}, ${A}${C} is a diameter and ${B} is another point on the circle. If ${chordAB ? `${A}${B}` : `${B}${C}`} = ${chordLen}, what is the measure, in degrees, of angle ${B}${A}${C}?`,
    answer: rat(ans),
    steps: [
      S('Góc nội tiếp chắn nửa đường tròn là góc vuông, nên góc tại B vuông; cạnh huyền là đường kính.', `${A}${C} = ${2 * r}`),
      S(longChord ? 'Cạnh bằng nửa cạnh huyền nhân căn 3 đối diện góc 60°.' : 'Cạnh bằng nửa cạnh huyền đối diện góc 30°.', `${B}${A}${C} = ${ans}deg`),
    ],
  };
});

/** Tam giác đều nội tiếp, biết diện tích (hoặc chu vi) đường tròn → cung nhỏ AB. */
const cirEquilateralArc = mcqT('pd-d-cir-equilateral-arc', 'circles', 'medium', (rng) => {
  const r = pickInt(rng, 1, 30);
  const [A, B, C] = pick(rng, LETTER_SETS);
  const byArea = rng() < 0.6;
  const major = rng() < 0.3;
  const arc = rat((major ? 4 : 2) * r, 3);
  const { choices, correctIndex } = textMcq(
    piText(arc),
    [
      td(piText(rat((major ? 2 : 4) * r, 3)), null, major ? 'Đây là cung nhỏ.' : 'Đây là cung lớn.'),
      td(piText(rat(r * r, 3)), 'confused_area_perimeter', 'Lấy một phần ba diện tích.'),
      td(piText(rat(2 * r)), null, 'Đây là cả chu vi.'),
      td(piText(rat(r, 3)), null, 'Dùng πr thay vì 2πr.'),
    ],
    rng,
  );
  return {
    stem: `Equilateral triangle ${A}${B}${C} is inscribed in a circle. If the ${byArea ? `area of the circle is ${piText(rat(r * r))}` : `circumference of the circle is ${piText(rat(2 * r))}`}, what is the length of ${major ? 'major' : 'minor'} arc ${A}${B}?`,
    choices,
    correctIndex,
    steps: [
      S('Tìm bán kính.', `r = ${r}`),
      S('Ba đỉnh chia đường tròn thành ba cung bằng nhau.', `${major ? 2 : 1} × frac(2π(${r}),3) = ${piText(arc)}`),
    ],
  };
});

/** Biết bán kính và diện tích hình quạt → góc ở tâm bằng radian. */
const cirSectorAngleRad = mcqT('pd-d-cir-sector-angle-rad', 'circles', 'hard', (rng) => {
  const r = pickInt(rng, 2, 12);
  const theta = pick(rng, [rat(1, 6), rat(1, 4), rat(1, 3), rat(1, 2), rat(2, 3), rat(3, 4), rat(5, 6), rat(4, 9), rat(5, 9), rat(2, 5), rat(3, 5), rat(5, 8)]);
  const K = mulValue(rat(r * r, 2), theta);
  const { choices, correctIndex } = textMcq(
    piText(theta),
    [
      td(piText(divValue(K, rat(r * r))), null, 'Quên hệ số 1/2 trong công thức diện tích hình quạt.'),
      td(piText(divValue(mulValue(K, rat(2)), rat(r))), 'forgot_square_root', 'Chia cho r thay vì r².'),
      td(piText(mulValue(theta, rat(2))), null, 'Nhân đôi thừa.'),
      td(piText(divValue(K, rat(180))), null, 'Đổi nhầm sang độ.'),
    ],
    rng,
  );
  return {
    stem: `In a circle with center C and radius ${r}, the sector formed by central angle ACB has an area of ${piText(K)}. What is the measure, in radians, of angle ACB?`,
    choices,
    correctIndex,
    steps: [
      S('Diện tích hình quạt bằng phần góc trên cả vòng nhân diện tích hình tròn: A = ½r²θ (θ bằng radian).', `${piText(K)} = frac(1,2)(${r})^2 θ`),
      S('Giải ra θ.', `θ = ${piText(theta)}`),
    ],
  };
});

/** Góc ở tâm trong khoảng (α, β) radian: độ dài cung nguyên lớn nhất / nhỏ nhất. */
const cirArcIntegerRange = gridT('pd-d-cir-arc-integer-range', 'circles', 'hard', (rng) => {
  const r = pickInt(rng, 4, 15);
  const [lo, hi] = pick(rng, [[6, 4], [6, 3], [4, 2], [4, 3], [3, 2], [6, 2]] as const);
  const greatest = rng() < 0.6;
  const loLen = (Math.PI * r) / lo;
  const hiLen = (Math.PI * r) / hi;
  const ans = greatest ? Math.ceil(hiLen) - 1 : Math.floor(loLen) + 1;
  return {
    stem: `A circle has center C and radius ${r}. Points A and B lie on the circle, and the measure of central angle ACB is between frac(π,${lo}) and frac(π,${hi}) radians. If the length of minor arc AB is an integer, what is its ${greatest ? 'greatest' : 'least'} possible value?`,
    answer: rat(ans),
    steps: [
      S('Độ dài cung bằng bán kính nhân góc (radian).', `${r} × frac(π,${lo}) ≈ ${loLen.toFixed(2)},   ${r} × frac(π,${hi}) ≈ ${hiLen.toFixed(2)}`),
      S(`Số nguyên ${greatest ? 'lớn nhất' : 'nhỏ nhất'} nằm giữa hai số đó.`, `${ans}`),
    ],
  };
});

/** Vùng giữa các hình tròn tiếp xúc nhau. */
const cirTangentGap = mcqT('pd-d-cir-tangent-gap', 'circles', 'hard', (rng) => {
  const r = pickInt(rng, 1, 50);
  const kind = pick(rng, ['four', 'frame', 'three'] as const);
  const r2 = r * r;
  const minus = (a: string, b: MathValue) => `${a} - ${piText(b)}`;
  const correct = kind === 'four' ? minus(String(4 * r2), rat(r2)) : kind === 'frame' ? minus(String(16 * r2), rat(4 * r2)) : minus(radText(rat(r2), 3), rat(r2, 2));
  const dists =
    kind === 'three'
      ? [
          td(minus(radText(rat(r2), 3), rat(r2)), null, 'Mỗi góc của tam giác đều chỉ là 60°, nên ba phần hình tròn cộng lại là nửa hình tròn.'),
          td(minus(radText(rat(4 * r2), 3), rat(r2, 2)), 'used_diameter_not_radius', 'Tính diện tích tam giác đều sai: cạnh là 2r.'),
          td(minus(radText(rat(r2, 4), 3), rat(r2, 2)), null, 'Dùng cạnh r thay vì 2r.'),
          td(minus(radText(rat(r2), 3), rat(3 * r2, 2)), null, 'Trừ cả ba hình tròn.'),
        ]
      : kind === 'four'
        ? [
            td(minus(String(16 * r2), rat(4 * r2)), null, 'Đây là phần ngoài bốn hình tròn trong hình vuông bao quanh, không phải khe giữa.'),
            td(minus(String(4 * r2), rat(4 * r2)), null, 'Trừ cả bốn hình tròn; hình vuông nối bốn tâm chỉ chứa bốn phần tư hình tròn.'),
            td(minus(String(2 * r2), rat(r2)), null, 'Tính sai cạnh hình vuông nối tâm (phải là 2r).'),
            td(minus(String(4 * r2), rat(r2, 4)), null, 'Chỉ trừ một phần tư hình tròn.'),
          ]
        : [
            td(minus(String(4 * r2), rat(r2)), null, 'Đây là khe giữa bốn hình tròn, không phải phần ngoài trong hình vuông bao quanh.'),
            td(minus(String(16 * r2), rat(r2)), null, 'Chỉ trừ một hình tròn.'),
            td(minus(String(4 * r2), rat(4 * r2)), null, 'Tính sai cạnh hình vuông bao quanh (phải là 4r).'),
            td(minus(String(8 * r2), rat(4 * r2)), null, 'Tính sai diện tích hình vuông.'),
          ];
  const { choices, correctIndex } = textMcq(correct, dists, rng);
  const stem =
    kind === 'four'
      ? `Four circles, each with radius ${r}, are arranged in a 2-by-2 pattern so that each circle is tangent to the two circles next to it. What is the area of the region enclosed between the four circles (inside the square formed by joining their centers)?`
      : kind === 'frame'
        ? `Four circles, each with radius ${r}, are arranged in a 2-by-2 pattern inside a square so that each circle is tangent to two sides of the square and to the two circles next to it. What is the area of the region inside the square but outside all four circles?`
        : `Three circles, each with radius ${r}, are each tangent to the other two. What is the area of the region enclosed between the three circles (inside the triangle formed by joining their centers)?`;
  return {
    stem,
    choices,
    correctIndex,
    steps: [
      S(kind === 'three' ? 'Nối ba tâm được tam giác đều cạnh 2r; ba góc 60° chứa ba phần sáu hình tròn.' : kind === 'four' ? 'Nối bốn tâm được hình vuông cạnh 2r; mỗi góc chứa một phần tư hình tròn.' : 'Hình vuông bao quanh có cạnh 4r và chứa trọn bốn hình tròn.'),
      S('Lấy diện tích đa giác trừ phần hình tròn nằm trong nó.', correct),
    ],
  };
});

/** Diện tích toàn phần của hình trụ. */
const cirCylinderSurface = mcqT('pd-d-cir-cylinder-surface', 'area_volume', 'easy', (rng) => {
  const r = pickInt(rng, 1, 12);
  const h = pickInt(rng, 1, 20);
  const { choices, correctIndex } = textMcq(
    piText(rat(2 * r * r + 2 * r * h)),
    [
      td(piText(rat(r * r * h)), 'confused_area_perimeter', 'Đây là thể tích.'),
      td(piText(rat(2 * r * h)), 'stopped_too_early', 'Chỉ tính mặt xung quanh, thiếu hai đáy.'),
      td(piText(rat(r * r + 2 * r * h)), null, 'Chỉ cộng một đáy.'),
      td(piText(rat(2 * r * r + r * h)), null, 'Mặt xung quanh là chu vi đáy nhân chiều cao: 2πrh.'),
      td(piText(rat(2 * r * r + 4 * r * h)), 'used_diameter_not_radius', 'Dùng đường kính trong công thức chu vi đáy.'),
      td(piText(rat(r * r + r * h)), null, 'Thiếu cả hệ số 2 ở hai phần.'),
    ],
    rng,
  );
  return {
    stem: `A right circular cylinder has a base radius of ${r} and a height of ${h}. What is the total surface area of the cylinder, including both bases?`,
    choices,
    correctIndex,
    steps: [
      S('Hai đáy.', `2π(${r})^2 = ${piText(rat(2 * r * r))}`),
      S('Mặt xung quanh trải ra là hình chữ nhật: chu vi đáy nhân chiều cao.', `2π(${r})(${h}) = ${piText(rat(2 * r * h))}`),
      S('Cộng lại.', piText(rat(2 * r * r + 2 * r * h))),
    ],
  };
});

/** Hai hình tròn tiếp xúc, tam giác đều nối hai tâm với một điểm H. */
const cirTwoCirclesEquilateral = mcqT('pd-d-cir-two-circles-equilateral', 'circles', 'hard', (rng) => {
  const r = pickInt(rng, 1, 60);
  const ask = pick(rng, ['outside', 'inside', 'triangle'] as const);
  const r2 = r * r;
  const correct = ask === 'outside' ? piText(rat(5 * r2, 3)) : ask === 'inside' ? piText(rat(r2, 3)) : `${radText(rat(r2), 3)} - ${piText(rat(r2, 3))}`;
  const dists = [
    td(piText(rat(2 * r2)), null, 'Đây là diện tích hai hình tròn, chưa trừ phần nằm trong tam giác.'),
    td(piText(rat(5 * r2, 6)), null, 'Chỉ tính một hình tròn.'),
    td(piText(rat(r2, 6)), null, 'Chỉ tính một hình quạt 60°.'),
    td(piText(rat(5 * r2, 3)), null, 'Đây là phần hai hình tròn nằm NGOÀI tam giác.'),
    td(piText(rat(r2, 3)), null, 'Đây là phần hai hình tròn nằm TRONG tam giác.'),
    td(`${radText(rat(r2, 4), 3)} - ${piText(rat(r2, 3))}`, null, 'Cạnh tam giác là 2r, không phải r.'),
  ];
  const { choices, correctIndex } = textMcq(correct, dists, rng);
  const what =
    ask === 'outside'
      ? 'the total area of the two circles that lies outside triangle PHU'
      : ask === 'inside'
        ? 'the total area of the two circles that lies inside triangle PHU'
        : 'the area of the part of triangle PHU that lies outside both circles';
  return {
    stem: `Circle P and circle U each have radius ${r} and are tangent to each other. Triangle PHU is equilateral, where P and U are the centers of the circles. What is ${what}?`,
    choices,
    correctIndex,
    steps: [
      S('PU bằng hai bán kính; góc của tam giác đều tại P và U đều là 60°, mỗi góc chứa một hình quạt bằng một phần sáu hình tròn.', `2 × frac(1,6)π(${r})^2 = ${piText(rat(r2, 3))}`),
      S(ask === 'outside' ? 'Lấy diện tích hai hình tròn trừ đi phần đó.' : ask === 'inside' ? 'Đó chính là phần cần tìm.' : 'Diện tích tam giác đều cạnh 2r trừ đi phần đó.', correct),
    ],
  };
});

/** Hình quạt lớn cho biết → góc ở tâm → góc giữa hai tiếp tuyến. */
const cirTangentLinesAngle = mcqT('pd-d-cir-tangent-lines-angle', 'circles', 'hard', (rng) => {
  const r = pickInt(rng, 2, 30);
  const c = pick(rng, [40, 60, 72, 80, 90, 100, 120, 135, 144, 150]);
  const K = rat(r * r * (360 - c), 360);
  const ans = 180 - c;
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(c, null, 'Đây là góc ở tâm AOB, không phải góc giữa hai tiếp tuyến.'),
      nd(90 - c / 2 > 0 && Number.isInteger(90 - c / 2) ? 90 - c / 2 : ans + 10, null, 'Chia đôi nhầm: đây là góc OPA.'),
      nd(360 - c, null, 'Đây là số đo cung lớn.'),
    ],
    rng,
  );
  return {
    stem: `Circle O has radius ${r}. Points A and B lie on the circle, and the major sector bounded by radii OA and OB has area ${piText(K)}. The lines tangent to the circle at A and at B intersect at point P. What is the measure, in degrees, of angle APB?`,
    choices,
    correctIndex,
    steps: [
      S('Hình quạt lớn chiếm một phần của hình tròn; phần đó cho số đo cung lớn.', `frac(${fx(K)},${r * r}) × 360 = ${360 - c}   ⇒   AOB = ${c}`),
      S('Bán kính vuông góc với tiếp tuyến tại tiếp điểm, nên tứ giác OAPB có hai góc vuông.', `APB = 360 - 90 - 90 - ${c} = ${ans}`),
    ],
  };
});

/** Hai hình tròn tiếp xúc ngoài; AC tiếp xúc hình tròn B tại C. */
const cirTangentCirclesTriangle = mcqT('pd-d-cir-tangent-circles-triangle', 'circles', 'hard', (rng) => {
  const a = pickInt(rng, 1, 15);
  const b = pickInt(rng, 1, 15);
  // AB = a + b, BC = b, góc C vuông ⇒ AC = √(a² + 2ab).
  const acSq = a * a + 2 * a * b;
  const { out, inside } = simplifyRoot(acSq);
  const area = radText(rat(b * out, 2), inside);
  const { choices, correctIndex } = textMcq(
    area,
    [
      td(radText(rat(b * out), inside), null, 'Quên nhân một nửa.'),
      td(rootText((a + b) * (a + b) + b * b), null, 'Coi AB là cạnh góc vuông; thật ra góc vuông ở C (bán kính vuông góc tiếp tuyến).'),
      td(fx(rat(b * (a + b), 2)), null, 'Dùng AB làm chiều cao.'),
      td(radText(rat(a * out, 2), inside), null, 'Dùng nhầm bán kính của hình tròn A làm cạnh BC.'),
    ],
    rng,
  );
  return {
    stem: `Circle A has radius ${a} and circle B has radius ${b}, and the two circles are tangent to each other. Segment AC is tangent to circle B at point C. What is the area of triangle ABC?`,
    choices,
    correctIndex,
    steps: [
      S('Hai hình tròn tiếp xúc ngoài nên AB bằng tổng hai bán kính; BC là bán kính của B.', `AB = ${a + b},   BC = ${b}`),
      S('Bán kính vuông góc với tiếp tuyến tại C, nên góc C vuông.', `AC = sqrt(${a + b}^2 - ${b}^2) = ${rootText(acSq)}`),
      S('Diện tích bằng nửa tích hai cạnh góc vuông.', `frac(1,2)(${b})(${rootText(acSq)}) = ${area}`),
    ],
  };
});

/** Phương trình đường tròn: I, II, III mệnh đề nào đúng? */
const cirEquationRoman = mcqT('pd-d-cir-equation-roman', 'circles', 'hard', (rng) => {
  const r = pickInt(rng, 2, 7);
  const p = rng() < 0.45 ? pick(rng, [r, -r]) : pickNonZeroInt(rng, -9, 9);
  const q = rng() < 0.45 ? pick(rng, [r, -r]) : pickNonZeroInt(rng, -9, 9);
  const pool = [
    { text: `The center of the circle is at (${p}, ${q}).`, truth: true },
    { text: `The center of the circle is at (${-p}, ${-q}).`, truth: false },
    { text: 'The circle is tangent to the x-axis.', truth: Math.abs(q) === r },
    { text: 'The circle is tangent to the y-axis.', truth: Math.abs(p) === r },
    { text: 'The circle passes through the origin.', truth: p * p + q * q === r * r },
    { text: `The radius of the circle is ${r * r}.`, truth: false },
  ];
  const picks = sample(rng, pool, 3);
  if (!picks.some((s) => s.truth)) picks[pickInt(rng, 0, 2)] = pool[0]!;
  const truth = picks.map((s) => s.truth);
  const { choices, correctIndex } = romanMcq(truth, rng);
  return {
    stem: `A circle in the xy-plane has equation ${circleEq(p, q, r * r)}. Which of the following must be true? I. ${picks[0]!.text} II. ${picks[1]!.text} III. ${picks[2]!.text}`,
    choices,
    correctIndex,
    steps: [
      S('Đọc tâm và bán kính từ dạng chuẩn: tâm lấy NGƯỢC dấu với số trong ngoặc, bán kính là căn của vế phải.', `tâm (${p}, ${q}),   r = ${r}`),
      S('Tiếp xúc trục hoành khi khoảng cách từ tâm tới trục (|tung độ|) bằng bán kính; tương tự với trục tung.', romanLabel(truth)),
    ],
  };
});

const CH21: MathTemplate[] = [
  cirInscribedPolygonArc,
  cirCirclesOnDiameter,
  cirSectorPerimeter,
  cirEquationCenterArea,
  cirInscribedArcFraction,
  cirDiameterChordAngle,
  cirEquilateralArc,
  cirSectorAngleRad,
  cirArcIntegerRange,
  cirTangentGap,
  cirCylinderSurface,
  cirTwoCirclesEquilateral,
  cirTangentLinesAngle,
  cirTangentCirclesTriangle,
  cirEquationRoman,
];

// ================================================================ Chương 22 — Lượng giác

/** Tỉ số dạng thập phân nếu hữu hạn gọn, không thì phân số. */
function ratioText(v: MathValue): string {
  const d = toDecimal(v);
  const s = String(Math.round(d * 1e6) / 1e6);
  return s.length <= 6 && Math.abs(Number(s) - d) < 1e-12 ? s : fx(v);
}

/** cos θ = a → sin(90 − θ) = a (và ngược lại). */
const trigCofunctionLetter = mcqT('pd-d-trig-cofunction-letter', 'right_triangles_trig', 'easy', (rng) => {
  const t = pickInt(rng, 5, 85);
  const L = pick(rng, ['a', 'k', 'm', 'p']);
  const givenCos = rng() < 0.5;
  const [g, ask] = givenCos ? ['cos', 'sin'] : ['sin', 'cos'];
  const { choices, correctIndex } = textMcq(
    L,
    [
      td(`frac(1,${L})`, 'inverted_fraction', 'Lấy nghịch đảo — nhầm với hàm sec/csc.'),
      td(`90 - ${L}`, 'confused_supplementary_complementary', 'Trừ 90 cho giá trị của hàm; quan hệ phụ nhau áp vào GÓC, không áp vào giá trị.'),
      td(`-${L}`, 'sign_flip', 'Hai góc nhọn phụ nhau, giá trị lượng giác đều dương, không đổi dấu.'),
      td(`${L}sqrt(2)`, null, 'Không có hệ số nào sinh ra ở đây.'),
    ],
    rng,
  );
  return {
    stem: `If ${g}(${t}deg) = ${L}, what is ${ask}(${90 - t}deg) in terms of ${L}?`,
    choices,
    correctIndex,
    steps: [
      S('Hai góc phụ nhau: sin của góc này bằng cos của góc kia.', `${ask}(${90 - t}deg) = ${g}(90deg - ${90 - t}deg) = ${g}(${t}deg)`),
      S('Vậy', `${ask}(${90 - t}deg) = ${L}`),
    ],
  };
});

/** tan x = p/q → cos x (hoặc sin x) = cạnh / cạnh huyền. */
const trigTanToCos = gridT('pd-d-trig-tan-to-cos', 'right_triangles_trig', 'easy', (rng) => {
  const [a, b, c] = pick(rng, TRIPLES);
  const [opp, adj] = rng() < 0.5 ? [a, b] : [b, a];
  const x = pick(rng, ['x', 'A', 'θ']);
  const vals = { sin: rat(opp, c), cos: rat(adj, c), tan: rat(opp, adj) } as const;
  const given = pick(rng, ['tan', 'tan', 'sin', 'cos'] as const);
  const ask = pick(rng, (['sin', 'cos', 'tan'] as const).filter((f) => f !== given));
  return {
    stem: `In a right triangle, one acute angle measures ${x}${x === 'x' ? 'deg' : ''} and ${given} ${x} = ${ratioText(vals[given])}. What is the value of ${ask} ${x}?`,
    answer: vals[ask],
    steps: [
      S('Dựng tam giác vuông theo tỉ số đã cho, rồi dùng Pythagoras tìm cạnh còn thiếu.', `đối = ${opp},   kề = ${adj},   huyền = ${c}`),
      S('Lấy tỉ số cần tìm (SOH-CAH-TOA).', `${ask} = ${fx(vals[ask])}`),
    ],
  };
});

/** a·sin θ + b·cos(90° − θ) + c·cos θ + d·sin(90° − θ). */
const trigCofunctionSum = mcqT('pd-d-trig-cofunction-sum', 'right_triangles_trig', 'medium', (rng) => {
  const co = () => pick(rng, [1, 1, 2, 3, -1, -2]);
  const [a, b, c, d] = [co(), co(), co(), co()];
  const term = (k: number, f: string, first: boolean) => {
    const body = `${Math.abs(k) === 1 ? '' : Math.abs(k)}${f}`;
    return first ? `${k < 0 ? '-' : ''}${body}` : ` ${k < 0 ? '-' : '+'} ${body}`;
  };
  const combo = (s: number, cc: number) => {
    const parts: string[] = [];
    if (s !== 0) parts.push(term(s, 'sin θ', true));
    if (cc !== 0) parts.push(term(cc, 'cos θ', parts.length === 0));
    return parts.length ? parts.join('') : '0';
  };
  const stemExpr = `${term(a, 'sin θ', true)}${term(b, 'cos(90deg - θ)', false)}${term(c, 'cos θ', false)}${term(d, 'sin(90deg - θ)', false)}`;
  const { choices, correctIndex } = textMcq(
    combo(a + b, c + d),
    [
      td(combo(a + d, b + c), null, 'Đổi nhầm: cos(90° − θ) là sin θ, sin(90° − θ) là cos θ.'),
      td(combo(a - b, c - d), 'sign_flip', 'Coi cos(90° − θ) bằng âm sin θ.'),
      td(combo(a + b + c + d, 0), null, 'Gộp sin với cos như cùng một loại.'),
      td(combo(a, c), null, 'Bỏ quên hai số hạng có (90° − θ).'),
      td(combo(0, a + b + c + d), null, 'Gộp sin với cos như cùng một loại.'),
      td(combo(a + b + 1, c + d), null, 'Cộng sai hệ số của sin θ.'),
      td(combo(a + b, c + d + 1), null, 'Cộng sai hệ số của cos θ.'),
    ],
    rng,
  );
  return {
    stem: `For any angle θ, which of the following is equivalent to ${stemExpr}?`,
    choices,
    correctIndex,
    steps: [
      S('Dùng quan hệ góc phụ nhau.', 'cos(90deg - θ) = sin θ,   sin(90deg - θ) = cos θ'),
      S('Thay vào rồi gộp.', combo(a + b, c + d)),
    ],
  };
});

/** Biết cạnh huyền và cos (hoặc sin) của một góc → cạnh kề (đối). */
const trigHypSide = gridT('pd-d-trig-hyp-side', 'right_triangles_trig', 'easy', (rng) => {
  const q = pickInt(rng, 3, 12);
  const p = pickInt(rng, 1, q - 1);
  const H = q * pickInt(rng, 1, 8);
  const useCos = rng() < 0.6;
  const [A, B, C] = pick(rng, LETTER_SETS);
  const ans = rat(H * p, q);
  return {
    stem: `In right triangle ${A}${B}${C}, the measure of angle ${C} is 90deg and ${A}${B} = ${H}. If ${useCos ? 'cos' : 'sin'} ${A} = ${fx(rat(p, q))}, what is the length of ${useCos ? `${A}${C}` : `${B}${C}`}?`,
    answer: ans,
    steps: [
      S(`${A}${B} đối diện góc vuông nên là cạnh huyền. ${useCos ? `${A}${C} là cạnh kề góc ${A}` : `${B}${C} là cạnh đối góc ${A}`}.`),
      S(useCos ? 'cos = kề / huyền.' : 'sin = đối / huyền.', `${useCos ? `${A}${C}` : `${B}${C}`} = ${H} × ${fx(rat(p, q))} = ${fx(ans)}`),
    ],
  };
});

/** tan x = cm (hoặc m/c) → sin x, cos x theo m. */
const trigTanM = mcqT('pd-d-trig-tan-m', 'right_triangles_trig', 'hard', (rng) => {
  const L = pick(rng, ['m', 'k', 't', 'p']);
  const c = pickInt(rng, 1, 9);
  const form = rng() < 0.5 ? 'times' : 'over';
  const askSin = rng() < 0.5;
  const x = pick(rng, ['x', 'θ']);
  // times: tan = cL → đối cL, kề 1, huyền √(c²L² + 1); over: tan = L/c → đối L, kề c, huyền √(L² + c²).
  const cL = c === 1 ? L : `${c}${L}`;
  const sq = form === 'times' ? `${c === 1 ? '' : c * c}${L}^2 + 1` : `${L}^2 + ${c * c}`;
  const sqBad = form === 'times' ? `1 - ${c === 1 ? '' : c * c}${L}^2` : `${c * c} - ${L}^2`;
  const opp = form === 'times' ? cL : L;
  const adj = form === 'times' ? '1' : String(c);
  const correct = `frac(${askSin ? opp : adj},sqrt(${sq}))`;
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(`frac(${askSin ? adj : opp},sqrt(${sq}))`, 'used_wrong_trig_ratio', askSin ? 'Đây là cos x.' : 'Đây là sin x.'),
      td(`frac(${askSin ? opp : adj},sqrt(${sqBad}))`, 'sign_flip', 'Cạnh huyền là căn của TỔNG hai bình phương.'),
      td(`frac(sqrt(${sq}),${askSin ? opp : adj})`, 'inverted_fraction', 'Lật ngược tỉ số.'),
      td(`frac(${askSin ? adj : opp},sqrt(${sqBad}))`, null, 'Sai cả cạnh lẫn cạnh huyền.'),
    ],
    rng,
  );
  return {
    stem: `If tan ${x} = ${form === 'times' ? cL : `frac(${L},${c})`}, where 0 < ${x} < 90deg, what is ${askSin ? 'sin' : 'cos'} ${x} in terms of ${L}?`,
    choices,
    correctIndex,
    steps: [
      S('Vẽ tam giác vuông với cạnh đối và cạnh kề theo tỉ số tan.', `đối = ${opp},   kề = ${adj}`),
      S('Cạnh huyền theo Pythagoras.', `huyền = sqrt(${sq})`),
      S(askSin ? 'sin = đối / huyền.' : 'cos = kề / huyền.', correct),
    ],
  };
});

/** Tam giác vuông tại A, biết tan B → sin B + cos B. */
const trigSinPlusCos = gridT('pd-d-trig-sin-plus-cos', 'right_triangles_trig', 'medium', (rng) => {
  const [a, b, c] = pick(rng, TRIPLES);
  const [opp, adj] = rng() < 0.5 ? [a, b] : [b, a];
  const k = pickInt(rng, 1, 12);
  const minus = rng() < 0.3;
  return {
    stem: `In right triangle ABC, angle A is a right angle, AB = ${adj * k}, and tan B = ${fx(rat(opp, adj))}. What is the value of sin B ${minus ? '-' : '+'} cos B?`,
    answer: rat(minus ? opp - adj : opp + adj, c),
    steps: [
      S('Cạnh kề góc B là AB, cạnh đối là AC.', `AC = ${adj * k} × ${fx(rat(opp, adj))} = ${opp * k}`),
      S('Cạnh huyền BC.', `BC = sqrt(${opp * k}^2 + ${adj * k}^2) = ${c * k}`),
      S(minus ? 'Trừ hai tỉ số.' : 'Cộng hai tỉ số.', `frac(${opp},${c}) ${minus ? '-' : '+'} frac(${adj},${c}) = ${fx(rat(minus ? opp - adj : opp + adj, c))}`),
    ],
  };
});

/** sin x cho dưới dạng thập phân, biết cạnh đối → cạnh huyền. */
const trigSinDecimalHyp = gridT('pd-d-trig-sin-decimal-hyp', 'right_triangles_trig', 'easy', (rng) => {
  const v = pick(rng, [rat(1, 5), rat(1, 4), rat(2, 5), rat(1, 2), rat(3, 5), rat(3, 4), rat(4, 5), rat(1, 8), rat(5, 8)]);
  const useSin = rng() < 0.6;
  const side = v.num * pickInt(rng, 1, 9);
  const hyp = divValue(rat(side), v);
  const [A, B, C] = pick(rng, LETTER_SETS);
  return {
    stem: `In right triangle ${A}${B}${C}, angle ${A} is a right angle and ${useSin ? `${A}${B}` : `${A}${C}`} = ${side}. If the measure of angle ${C} is x degrees and ${useSin ? 'sin' : 'cos'} x = ${decText(v)}, what is the length of ${B}${C}?`,
    answer: hyp,
    steps: [
      S(`${B}${C} là cạnh huyền; ${useSin ? `${A}${B} là cạnh đối góc ${C}` : `${A}${C} là cạnh kề góc ${C}`}.`),
      S(useSin ? 'sin = đối / huyền nên huyền = đối / sin.' : 'cos = kề / huyền nên huyền = kề / cos.', `${B}${C} = frac(${side},${decText(v)}) = ${fx(hyp)}`),
    ],
  };
});

/** Hai tam giác vuông đồng dạng: tỉ số lượng giác của góc tương ứng bằng nhau. */
const TAN_POOL = [rat(3, 4), rat(4, 3), rat(12, 5), rat(5, 12), rat(15, 8), rat(8, 15), rat(21, 20), rat(20, 21), rat(7, 24), rat(24, 7)];

const trigSimilarTanCos = gridT('pd-d-trig-similar-tan-cos', 'right_triangles_trig', 'medium', (rng) => {
  const t = pick(rng, TAN_POOL);
  const hyp = Math.round(Math.sqrt(t.num ** 2 + t.den ** 2));
  const askCos = rng() < 0.6;
  const [A, B, C] = pick(rng, LETTER_SETS.slice(0, 2));
  const [M, Nn, O] = pick(rng, LETTER_SETS.slice(2));
  // Hỏi góc tương ứng (N) hoặc góc nhọn còn lại (O): với O, đối và kề đổi chỗ.
  const other = rng() < 0.35;
  const target = other ? O : Nn;
  const [oppT, adjT] = other ? [t.den, t.num] : [t.num, t.den];
  return {
    stem: `Right triangle ${A}${B}${C} is similar to right triangle ${M}${Nn}${O}, with vertices ${A}, ${B}, and ${C} corresponding to vertices ${M}, ${Nn}, and ${O}, respectively, and right angles at ${A} and ${M}. If tan ${B} = ${ratioText(t)}, what is the value of ${askCos ? 'cos' : 'sin'} ${target}?`,
    answer: rat(askCos ? adjT : oppT, hyp),
    steps: [
      S(`Góc ${Nn} tương ứng với góc ${B}, nên có cùng mọi tỉ số lượng giác${other ? `; góc ${O} là góc nhọn còn lại, cạnh đối và cạnh kề đổi chỗ` : ''}.`, `tan ${target} = ${fx(rat(oppT, adjT))}`),
      S('Dựng tam giác với cạnh đối và cạnh kề theo tỉ số tan; cạnh huyền theo Pythagoras.', `huyền = sqrt(${t.num}^2 + ${t.den}^2) = ${hyp}`),
      S(askCos ? 'cos = kề / huyền.' : 'sin = đối / huyền.', fx(rat(askCos ? adjT : oppT, hyp))),
    ],
  };
});

/** cos(a°) = sin((pm − q)°), 0 < m < 90 → hai góc phụ nhau. */
const trigCofunctionSolve = gridT('pd-d-trig-cofunction-solve', 'right_triangles_trig', 'medium', (rng) => {
  const p = pickInt(rng, 1, 6);
  const m = pickInt(rng, 2, 14);
  const q = pickInt(rng, 0, Math.max(0, p * m - 5));
  const inner = p * m - q;
  const a = 90 - inner;
  const cosFirst = rng() < 0.5;
  const inside = `${p === 1 ? '' : p}m${q === 0 ? '' : ` - ${q}`}`;
  return {
    stem: `In the equation ${cosFirst ? 'cos' : 'sin'}(${a}deg) = ${cosFirst ? 'sin' : 'cos'}((${inside})deg), the angle measures are in degrees. If 0 < ${inside} < 90, what is the value of m?`,
    answer: rat(m),
    steps: [
      S('sin của một góc nhọn bằng cos của góc phụ với nó, nên hai góc cộng lại bằng 90.', `${a} + ${inside} = 90`),
      S('Giải ra m.', `m = ${m}`),
    ],
  };
});

/** Tam giác vuông cho bằng toạ độ: cos của một góc nhọn. */
const trigCoordCos = mcqT('pd-d-trig-coord-cos', 'right_triangles_trig', 'medium', (rng) => {
  const [a, b, c] = triple(rng, 2);
  const x1 = pickInt(rng, -9, 3);
  const y1 = pickInt(rng, -3, 9);
  const up = rng() < 0.5;
  // B = (x1, y1 − a) hoặc (x1, y1 + a) — cạnh AB thẳng đứng dài a; C cùng tung độ với B, cách b.
  const By = up ? y1 + a : y1 - a;
  const Cx = x1 + b;
  const fn = pick(rng, ['cos', 'sin', 'tan'] as const);
  const val = fn === 'cos' ? rat(b, c) : fn === 'sin' ? rat(a, c) : rat(a, b);
  const all = [rat(b, c), rat(a, c), rat(a, b), rat(b, a), rat(c, b)];
  const { choices, correctIndex } = numMcq(
    val,
    all.filter((v) => !equalsValue(v, val)).map((v) => nd(v, 'used_wrong_trig_ratio', 'Chọn nhầm cặp cạnh: xác định cạnh đối, cạnh kề của góc C trước.')),
    rng,
  );
  return {
    stem: `In the xy-plane, right triangle ABC has vertices A(${x1}, ${y1}), B(${x1}, ${By}), and C(${Cx}, ${By}). What is the value of ${fn} C?`,
    choices,
    correctIndex,
    steps: [
      S('AB thẳng đứng, BC nằm ngang nên góc B vuông. Đọc độ dài hai cạnh góc vuông.', `AB = ${a},   BC = ${b}`),
      S('Cạnh huyền AC theo Pythagoras.', `AC = ${c}`),
      S(`Với góc C: cạnh đối là AB, cạnh kề là BC.`, `${fn} C = ${fx(val)}`),
    ],
  };
});

/** AC là đường kính (độ dài d), góc C = θ → diện tích tam giác ABC theo θ. */
const trigDiameterArea = mcqT('pd-d-trig-diameter-area', 'right_triangles_trig', 'hard', (rng) => {
  const d = pickInt(rng, 1, 20);
  const [A, B, C] = pick(rng, LETTER_SETS);
  const atC = rng() < 0.5;
  const k = rat(d * d, 2);
  const withCoef = (v: MathValue, body: string) => (v.den === 1 ? `${v.num === 1 ? '' : v.num}${body}` : `frac(${v.num === 1 ? '' : v.num}${body},${v.den})`);
  const correct = withCoef(k, 'sin θ cos θ');
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(withCoef(k, 'θ'), null, 'Dùng chính góc θ như một độ dài.'),
      td(withCoef(k, 'tan θ'), 'used_wrong_trig_ratio', 'Hai cạnh góc vuông là d·sin θ và d·cos θ, không phải tan.'),
      td(withCoef(rat(d * d), 'sin θ cos θ'), null, 'Quên nhân một nửa.'),
      td(withCoef(rat(d), 'sin θ'), null, 'Chỉ tính một cạnh.'),
    ],
    rng,
  );
  return {
    stem: `In a circle, ${A}${C} is a diameter with length ${d}, and ${B} is a point on the circle different from ${A} and ${C}. If the measure of angle ${atC ? `${A}${C}${B}` : `${C}${A}${B}`} is θ, which of the following gives the area of triangle ${A}${B}${C} in terms of θ?`,
    choices,
    correctIndex,
    steps: [
      S(`Góc nội tiếp chắn nửa đường tròn nên góc ${B} vuông, cạnh huyền là đường kính.`),
      S('Hai cạnh góc vuông là d·sin θ và d·cos θ.', `${d === 1 ? '' : d}sin θ,   ${d === 1 ? '' : d}cos θ`),
      S('Diện tích bằng nửa tích hai cạnh góc vuông.', correct),
    ],
  };
});

/** Điều kiện về dấu của sin, cos, tan → góc nằm ở góc phần tư nào. */
const QUAD_CONDS: Array<{ text: string; ok: [boolean, boolean, boolean, boolean] }> = [
  { text: 'sin θ - cos θ = 0', ok: [true, false, true, false] },
  { text: 'sin θ + cos θ = 0', ok: [false, true, false, true] },
  { text: 'tan θ > 0', ok: [true, false, true, false] },
  { text: 'tan θ < 0', ok: [false, true, false, true] },
  { text: 'sin θ > 0 and cos θ < 0', ok: [false, true, false, false] },
  { text: 'sin θ < 0', ok: [false, false, true, true] },
  { text: 'cos θ > 0', ok: [true, false, false, true] },
  { text: 'sin θ cos θ < 0', ok: [false, true, false, true] },
  { text: 'cos θ < 0 and tan θ > 0', ok: [false, false, true, false] },
];
const QUAD_RANGES = ['0 < θ < frac(π,2)', 'frac(π,2) < θ < π', 'π < θ < frac(3π,2)', 'frac(3π,2) < θ < 2π'];

const trigQuadrantRoman = mcqT('pd-d-trig-quadrant-roman', 'right_triangles_trig', 'hard', (rng) => {
  const cond = pick(rng, QUAD_CONDS);
  const trueQs = [0, 1, 2, 3].filter((q) => cond.ok[q]);
  const falseQs = [0, 1, 2, 3].filter((q) => !cond.ok[q]);
  const nTrue = pickInt(rng, 1, Math.min(3, trueQs.length));
  const chosen = shuffleCopy([...sample(rng, trueQs, nTrue), ...sample(rng, falseQs, 3 - nTrue)], rng).slice(0, 3);
  while (chosen.length < 3) chosen.push(falseQs[0]!);
  const truth = chosen.map((q) => cond.ok[q]!);
  const { choices, correctIndex } = romanMcq(truth, rng);
  return {
    stem: `Given that ${cond.text}, where θ is the radian measure of an angle, which of the following could be true? I. ${QUAD_RANGES[chosen[0]!]}; II. ${QUAD_RANGES[chosen[1]!]}; III. ${QUAD_RANGES[chosen[2]!]}`,
    choices,
    correctIndex,
    steps: [
      S('Dấu theo góc phần tư: phần tư thứ nhất cả ba dương; thứ hai chỉ sin dương; thứ ba chỉ tan dương; thứ tư chỉ cos dương.'),
      S('Đối chiếu điều kiện với từng khoảng.', romanLabel(truth)),
    ],
  };
});

const CH22: MathTemplate[] = [
  trigCofunctionLetter,
  trigTanToCos,
  trigCofunctionSum,
  trigHypSide,
  trigTanM,
  trigSinPlusCos,
  trigSinDecimalHyp,
  trigSimilarTanCos,
  trigCofunctionSolve,
  trigCoordCos,
  trigDiameterArea,
  trigQuadrantRoman,
];

// ================================================================ Chương 23 — Đọc số liệu

type Row = { label: string; cells: Array<string | number> };
const table = (caption: string, columns: string[], rows: Row[]): MathFigureSpec => ({ kind: 'data_table', caption, columns, rows });

/** Bốn ngày, thời gian đi và về: ngày nào tổng lớn nhất (nhỏ nhất)? */
const dataMaxSum = mcqT('pd-d-data-max-sum', 'one_var_data', 'easy', (rng) => {
  const who = pick(rng, NAMES);
  const days = ['A', 'B', 'C', 'D'];
  const greatest = rng() < 0.6;
  // Dựng tổng trước: một ngày thắng rõ; một ngày khác có MỘT chiều lớn nhất (bẫy).
  const sums = shuffleCopy([55, 70, 85, 100].map((v) => v + 5 * pickInt(rng, 0, 2)), rng);
  const win = sums.indexOf(greatest ? Math.max(...sums) : Math.min(...sums));
  const rows = sums.map((sum, i) => {
    const to = i === win ? Math.round(sum / 2) : i === (win + 1) % 4 ? (greatest ? sum - 10 : 10) : 15 + 5 * pickInt(rng, 0, Math.floor((sum - 30) / 5));
    return { label: `Day ${days[i]}`, cells: [to, sum - to] };
  });
  const { choices, correctIndex } = textMcq(
    `Day ${days[win]}`,
    days
      .filter((_, i) => i !== win)
      .map((dd) => td(`Day ${dd}`, null, 'Phải cộng HAI chiều của cùng một ngày rồi mới so; một chiều lớn nhất chưa chắc tổng lớn nhất.')),
    rng,
  );
  return {
    stem: `For four work days, ${who} recorded the commute time, in minutes, to work and from work. On which day was the total commute time ${greatest ? 'greatest' : 'least'}?`,
    figure: table('Commute times (minutes)', ['Day', 'To work', 'From work'], rows),
    choices,
    correctIndex,
    steps: [
      S('Cộng hai cột cho từng ngày.', rows.map((r) => `${r.label.slice(4)}: ${Number(r.cells[0]) + Number(r.cells[1])}`).join(',   ')),
      S(`Chọn tổng ${greatest ? 'lớn' : 'nhỏ'} nhất.`, `Day ${days[win]}`),
    ],
  };
});

/** Hai chuỗi số theo năm: năm nào chênh lệch nhỏ nhất? */
const dataGapSmallest = mcqT('pd-d-data-gap-smallest', 'one_var_data', 'easy', (rng) => {
  const y0 = pickInt(rng, 2004, 2016);
  const years = range(0, 5).map((i) => y0 + 2 * i);
  const gaps = shuffleCopy([3, 7, 11, 14, 18, 22], rng);
  const base = years.map(() => pickInt(rng, 30, 60));
  const rows = years.map((y, i) => ({ label: String(y), cells: [base[i]!, base[i]! + gaps[i]!] }));
  const minI = gaps.indexOf(3);
  const others = sample(rng, range(0, 5).filter((i) => i !== minI), 3);
  const { choices, correctIndex } = textMcq(
    String(years[minI]),
    others.map((i) => td(String(years[i]), null, 'Phải so KHOẢNG CÁCH giữa hai cột trong cùng một năm, không so từng cột riêng.')),
    rng,
  );
  return {
    stem: 'The table shows the percent of eligible members who voted in two kinds of club elections in several years. In which of the following years was the difference between the two percents the smallest?',
    figure: table('Turnout (percent)', ['Year', 'Board election', 'Rules vote'], rows),
    choices,
    correctIndex,
    steps: [S('Lấy hiệu hai cột từng năm.', rows.map((r) => `${r.label}: ${gaps[years.indexOf(Number(r.label))]}`).join(',   ')), S('Hiệu nhỏ nhất.', String(years[minI]))],
  };
});

/** Doanh số theo quý của hai năm: quý nào cao nhất ở CẢ HAI năm? */
const QUARTERS = ['January to March', 'April to June', 'July to September', 'October to December'];

const dataQuarterHighest = mcqT('pd-d-data-quarter-highest', 'one_var_data', 'easy', (rng) => {
  const y = pickInt(rng, 2015, 2024);
  const best = pickInt(rng, 0, 3);
  const col = () => range(0, 3).map((q) => (q === best ? 170 + pickInt(rng, 0, 20) : 110 + pickInt(rng, 0, 55)));
  const a = col();
  const b = col();
  const rows = QUARTERS.map((q, i) => ({ label: q, cells: [a[i]!, b[i]!] }));
  const { choices, correctIndex } = textMcq(
    QUARTERS[best]!,
    QUARTERS.filter((_, i) => i !== best).map((q) => td(q, null, 'Quý này không cao nhất ở cả hai năm.')),
    rng,
  );
  return {
    stem: `The table shows a snack company's sales, in thousands of dollars, in each three-month period of ${y} and ${y + 1}. During which three-month period were sales highest in both years?`,
    figure: table('Sales (thousands of dollars)', ['Period', String(y), String(y + 1)], rows),
    choices,
    correctIndex,
    steps: [S('Tìm giá trị lớn nhất ở từng cột năm.', `${Math.max(...a)} và ${Math.max(...b)}`), S('Quý đứng đầu ở cả hai cột.', QUARTERS[best]!)],
  };
});

/** Giá trị tháng X bằng bao nhiêu phần trăm giá trị tháng Y? */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const dataPercentOf = mcqT('pd-d-data-percent-of', 'percentages', 'medium', (rng) => {
  const place = pick(rng, ['a mountain town', 'a coastal city', 'a river valley', 'an island village']);
  const vals = MONTHS.map(() => 10 * pickInt(rng, 1, 40));
  const [ix, iy] = sample(rng, range(0, 11), 2) as [number, number];
  const p = pick(rng, [20, 25, 40, 50, 60, 75, 80, 125, 150]);
  const Y = 20 * pickInt(rng, 2, 18);
  vals[iy] = Y;
  vals[ix] = (Y * p) / 100;
  const { choices, correctIndex } = numMcq(
    p,
    [
      nd(rat(10000, p), 'inverted_fraction', 'Chia ngược: lấy tháng sau chia tháng trước.'),
      nd(Math.abs(100 - p) || 10, 'percent_of_wrong_base', 'Đây là phần trăm chênh lệch, không phải phần trăm "bằng".'),
      nd(rat(100 * vals[ix]!, vals[ix]! + Y), 'wrong_denominator', 'Chia cho tổng hai tháng.'),
    ],
    rng,
    (v) => `${Math.round(toDecimal(v) * 10) / 10}%`,
  );
  return {
    stem: `The table shows the total monthly rainfall, in millimeters, in ${place} last year. The rainfall in ${MONTHS[ix]} was what percent of the rainfall in ${MONTHS[iy]}?`,
    figure: table('Monthly rainfall (mm)', ['Month', 'Rainfall'], MONTHS.map((m, i) => ({ label: m, cells: [vals[i]!] }))),
    choices,
    correctIndex,
    steps: [S('Đọc hai giá trị.', `${MONTHS[ix]}: ${vals[ix]},   ${MONTHS[iy]}: ${Y}`), S('Chia rồi nhân 100.', `frac(${vals[ix]},${Y}) × 100 = ${p}%`)],
  };
});

/** Ước tính và thực tế: ước tính thấp hơn thực tế ở đâu? */
const dataUnderRoman = mcqT('pd-d-data-under-roman', 'one_var_data', 'easy', (rng) => {
  const towns = sample(rng, ['Riverton', 'Oakdale', 'Pine Hill', 'Lakeside', 'Maple Bay', 'Stonebridge'], 3);
  const truth = [rng() < 0.5, rng() < 0.5, rng() < 0.5];
  if (!truth.includes(true)) truth[pickInt(rng, 0, 2)] = true;
  const rows = towns.map((t, i) => {
    const actual = 10 * pickInt(rng, 20, 90);
    const est = truth[i] ? actual - 10 * pickInt(rng, 1, 15) : actual + 10 * pickInt(rng, 1, 15);
    return { label: t, cells: [actual, est] };
  });
  const { choices, correctIndex } = romanMcq(truth, rng);
  return {
    stem: `Researchers compared their estimates of the number of households in three towns with the actual numbers, shown in the table. For which of the towns did the researchers underestimate the number of households? I. ${towns[0]}; II. ${towns[1]}; III. ${towns[2]}`,
    figure: table('Households', ['Town', 'Actual', 'Estimated'], rows),
    choices,
    correctIndex,
    steps: [S('Ước tính thấp (underestimate) nghĩa là số ước tính NHỎ hơn số thực tế.'), S('So từng dòng.', romanLabel(truth))],
  };
});

/** Hai chuỗi đơn điệu theo năm: mô tả xu hướng. */
const dataTrend = mcqT('pd-d-data-trend', 'two_var_data', 'easy', (rng) => {
  const [n1, n2] = sample(rng, ['Northfield', 'Southport', 'Eastvale', 'Westbrook'], 2) as [string, string];
  const y0 = pickInt(rng, 2005, 2015);
  const d1 = rng() < 0.5 ? 1 : -1;
  const d2 = rng() < 0.5 ? 1 : -1;
  const series = (dir: number) => {
    let v = pickInt(rng, 20, 40);
    return range(0, 5).map(() => {
      const cur = v;
      v += dir * pickInt(rng, 1, 4);
      return cur;
    });
  };
  const s1 = series(d1);
  const s2 = series(d2);
  const word = (d: number) => (d > 0 ? 'increased' : 'decreased');
  const sentence = (a: number, b: number) =>
    a === b ? `Each year, the rate ${word(a)} in both ${n1} and ${n2}.` : `Each year, the rate ${word(a)} in ${n1} but ${word(b)} in ${n2}.`;
  const { choices, correctIndex } = textMcq(
    sentence(d1, d2),
    [
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ]
      .filter(([a, b]) => !(a === d1 && b === d2))
      .map(([a, b]) => td(sentence(a!, b!), null, 'Đọc lại chiều thay đổi của từng cột qua các năm.')),
    rng,
  );
  return {
    stem: `The table shows the number of new library cards issued per 1,000 residents in two towns from ${y0} to ${y0 + 5}. Which of the following best describes the trend in the two towns over this period?`,
    figure: table('New library cards per 1,000 residents', ['Year', n1, n2], range(0, 5).map((i) => ({ label: String(y0 + i), cells: [s1[i]!, s2[i]!] }))),
    choices,
    correctIndex,
    steps: [S('Đi dọc từng cột: mỗi năm số liệu tăng hay giảm so với năm trước.'), S('Kết luận.', sentence(d1, d2))],
  };
});

/** Biểu đồ điểm: hoành độ của điểm có tung độ nhỏ nhất (lớn nhất). */
const dataScatterArgmin = mcqT('pd-d-data-scatter-argmin', 'two_var_data', 'easy', (rng) => {
  const least = rng() < 0.6;
  const xs = sample(rng, range(2, 15).map((v) => 5 * v), 12).sort((a, b) => a - b);
  const ys = xs.map(() => pickInt(rng, 12, 18) / 2);
  const target = pickInt(rng, 0, xs.length - 1);
  ys[target] = least ? 5 : 10;
  const others = sample(rng, range(0, xs.length - 1).filter((i) => i !== target), 3);
  const { choices, correctIndex } = numMcq(
    xs[target]!,
    others.map((i) => nd(xs[i]!, null, `Điểm có hoành độ ${xs[i]} có tung độ ${ys[i]}, không phải ${least ? 'nhỏ' : 'lớn'} nhất.`)),
    rng,
  );
  return {
    stem: `In a study, researchers recorded the age, in years, of each participant and the number of hours of sleep the participant needed each night. The results are shown in the scatterplot. What is the age, in years, of the participant who needed the ${least ? 'least' : 'most'} sleep?`,
    figure: { kind: 'scatterplot', caption: 'Age and hours of sleep', xLabel: 'Age (years)', yLabel: 'Hours of sleep', points: xs.map((x, i) => ({ x, y: ys[i]! })), xRange: [0, 80], yRange: [4, 11] },
    choices,
    correctIndex,
    steps: [S(`Tìm điểm ${least ? 'thấp' : 'cao'} nhất trên biểu đồ.`, `(${xs[target]}, ${ys[target]})`), S('Đọc hoành độ của điểm đó.', `${xs[target]}`)],
  };
});

/** Khối lượng xe tải theo giờ: sức chứa tối đa là giá trị lớn nhất. */
const dataPeak = mcqT('pd-d-data-peak', 'one_var_data', 'easy', (rng) => {
  const who = pick(rng, NAMES);
  const start = pickInt(rng, 12, 18);
  const peak = start + pickInt(rng, 8, 16);
  const peakAt = pickInt(rng, 3, 6);
  const times = range(0, 10).map((i) => i / 2);
  const w = times.map((_, i) => {
    if (i <= peakAt) return start + Math.round(((peak - start) * i) / peakAt);
    return Math.max(start - 2, peak - Math.round(((peak - start + 2) * (i - peakAt)) / (10 - peakAt)));
  });
  const { choices, correctIndex } = numMcq(
    peak,
    [
      nd(start, null, 'Đây là khối lượng lúc bắt đầu (xe rỗng hàng).'),
      nd(peak - start, null, 'Đây là lượng hàng nhận thêm, không phải khối lượng tối đa của xe.'),
      nd(w[w.length - 1]!, null, 'Đây là khối lượng lúc kết thúc.'),
    ],
    rng,
  );
  return {
    stem: `Each morning, ${who} picks up packages until the delivery truck reaches its maximum capacity, then delivers all of them. The table shows the total weight of the truck, in tons, at different times. What is the maximum weight, in tons, that the truck can hold?`,
    figure: table('Weight of truck', ['Hours after start', 'Weight (tons)'], times.map((t, i) => ({ label: String(t), cells: [w[i]!] }))),
    choices,
    correctIndex,
    steps: [S('Xe nhận hàng tới khi đầy, nên khối lượng lớn nhất trong bảng chính là sức chứa tối đa.'), S('Đọc giá trị lớn nhất.', `${peak}`)],
  };
});

/** Cặp năm liên tiếp có % tăng bằng % giảm của một cặp đã cho. */
const dataMatchingPercent = mcqT('pd-d-data-matching-percent', 'percentages', 'hard', (rng) => {
  const pairs = [
    [40, 30, 20, 25],
    [50, 40, 20, 24],
    [20, 15, 12, 15],
    [30, 20, 12, 16],
    [60, 45, 16, 20],
    [25, 20, 15, 18],
    [80, 60, 28, 35],
    [45, 36, 30, 36],
  ];
  const [a, b, c, dd] = pick(rng, pairs) as [number, number, number, number];
  // % giảm a→b = (a−b)/a bằng % tăng c→dd = (dd−c)/c theo cách dựng.
  const layouts: Array<[number, number]> = [[0, 3], [0, 4], [1, 4], [3, 0], [4, 0], [4, 1], [2, 5], [5, 2], [0, 5], [5, 0]];
  const [ansIdx, decIdx] = pick(rng, layouts);
  const arr: number[] = [0, 0, 0, 0, 0, 0, 0];
  arr[ansIdx] = c;
  arr[ansIdx + 1] = dd;
  arr[decIdx] = a;
  arr[decIdx + 1] = b;
  const fill = shuffleCopy([17, 23, 29, 31, 37, 41, 43], rng);
  for (let i = 0; i < 7; i += 1) if (arr[i] === 0) arr[i] = fill.pop()!;
  const y0 = pickInt(rng, 2008, 2016);
  const years = range(0, 6).map((i) => y0 + i);
  const pct = (i: number) => rat(arr[i + 1]! - arr[i]!, arr[i]!);
  const target = rat(a - b, a);
  const candidates = range(0, 5).filter((i) => i !== decIdx && i !== ansIdx && !equalsValue(pct(i), target));
  const period = (i: number) => `${years[i]} to ${years[i + 1]}`;
  const { choices, correctIndex } = textMcq(
    period(ansIdx),
    [
      ...candidates.map((i) => td(period(i), 'percent_of_wrong_base', 'Phần trăm thay đổi của cặp này khác; nhớ chia cho giá trị năm ĐẦU của mỗi cặp.')),
      td(period(decIdx), null, 'Đây chính là cặp năm giảm đã cho.'),
    ],
    rng,
  );
  const tp = Math.round(toDecimal(target) * 1000) / 10;
  return {
    stem: `The table shows the annual production, in thousands of tons, of a mineral in a region. For which of the following pairs of consecutive years was the percent increase in production the same as the percent decrease from ${years[decIdx]} to ${years[decIdx + 1]}?`,
    figure: table('Annual production (thousands of tons)', ['Year', 'Production'], years.map((y, i) => ({ label: String(y), cells: [arr[i]!] }))),
    choices,
    correctIndex,
    steps: [
      S('Phần trăm giảm của cặp đã cho, chia cho năm đầu.', `frac(${a} - ${b},${a}) = ${tp}%`),
      S('Tìm cặp năm tăng đúng phần trăm đó.', `frac(${dd} - ${c},${c}) = ${tp}%`),
    ],
  };
});

/** A bằng bao nhiêu phần của B (điền phân số). */
const dataFractionOf = gridT('pd-d-data-fraction-of', 'ratios_rates_units', 'easy', (rng) => {
  const animals = sample(rng, ['Horse', 'Deer', 'Sheep', 'Fox', 'Rabbit', 'Goat', 'Dog'], 5);
  const vals = animals.map(() => 10 * pickInt(rng, 2, 45));
  const [i, j] = sample(rng, range(0, 4), 2) as [number, number];
  return {
    stem: `The table shows the average mass, in grams, of the heart of five kinds of animals. The average heart mass of a ${animals[i]!.toLowerCase()} is what fraction of the average heart mass of a ${animals[j]!.toLowerCase()}?`,
    figure: table('Average heart mass (grams)', ['Animal', 'Mass'], animals.map((a, k) => ({ label: a, cells: [vals[k]!] }))),
    answer: rat(vals[i]!, vals[j]!),
    steps: [S('Lấy giá trị thứ nhất chia giá trị thứ hai.', `frac(${vals[i]},${vals[j]}) = ${fx(rat(vals[i]!, vals[j]!))}`)],
  };
});

/** Số lượng × giá → doanh thu lớn nhất. */
const dataMaxRevenue = mcqT('pd-d-data-max-revenue', 'ratios_rates_units', 'medium', (rng) => {
  const letters = ['P', 'Q', 'R', 'S', 'T'];
  const units = letters.map(() => 10 * pickInt(rng, 5, 25));
  const prices = letters.map(() => 50 * pickInt(rng, 2, 6));
  const rev = units.map((u, i) => u * prices[i]!);
  let best = rev.indexOf(Math.max(...rev));
  // Bảo đảm duy nhất: nâng nhẹ người thắng.
  units[best] = units[best]! + 5;
  rev[best] = units[best]! * prices[best]!;
  best = rev.indexOf(Math.max(...rev));
  const others = sample(rng, range(0, 4).filter((i) => i !== best), 3);
  const { choices, correctIndex } = textMcq(
    `Model ${letters[best]}`,
    others.map((i) => td(`Model ${letters[i]}`, null, `Doanh thu của mẫu này là ${units[i]} × ${prices[i]} = ${rev[i]} nghìn đô la, nhỏ hơn.`)),
    rng,
  );
  return {
    stem: 'The table shows the number of units sold, in thousands, and the price per unit, in dollars, of five models of electric scooters last year. Which model generated the greatest total revenue?',
    figure: table('Scooter sales', ['Model', 'Units sold (thousands)', 'Price per unit ($)'], letters.map((l, i) => ({ label: l, cells: [units[i]!, prices[i]!] }))),
    choices,
    correctIndex,
    steps: [S('Nhân số lượng với giá cho từng mẫu.', letters.map((l, i) => `${l}: ${rev[i]}`).join(',   ')), S('Chọn tích lớn nhất.', `Model ${letters[best]}`)],
  };
});

/** Quý nào lợi nhuận X gấp đôi Y? */
const dataTwice = mcqT('pd-d-data-twice', 'ratios_rates_units', 'easy', (rng) => {
  const q = pickInt(rng, 0, 3);
  const ys = range(0, 3).map(() => pickInt(rng, 2, 12));
  const xs = ys.map((y, i) => {
    if (i === q) return 2 * y;
    const x = 2 * y + pickNonZeroInt(rng, -3, 3);
    return x < 1 ? 2 * y + 1 : x;
  });
  const { choices, correctIndex } = numMcq(
    q + 1,
    range(0, 3)
      .filter((i) => i !== q)
      .map((i) => nd(i + 1, null, `Quý ${i + 1}: ${xs[i]} so với 2 × ${ys[i]} = ${2 * ys[i]!}.`)),
    rng,
  );
  return {
    stem: 'The table shows the profit, in millions of dollars, of Company X and Company Y in each quarter of last year. In which quarter was Company X’s profit twice Company Y’s profit?',
    figure: table('Profit (millions of dollars)', ['Quarter', 'Company X', 'Company Y'], range(0, 3).map((i) => ({ label: String(i + 1), cells: [xs[i]!, ys[i]!] }))),
    choices,
    correctIndex,
    steps: [S('Nhân đôi lợi nhuận của Y ở từng quý rồi so với X.'), S('Quý khớp.', `${xs[q]} = 2 × ${ys[q]}`)],
  };
});

/** Hai loại chi tiêu: tổng cao nhất (bẫy: một loại cao nhất). */
const dataCombinedMax = mcqT('pd-d-data-combined-max', 'one_var_data', 'easy', (rng) => {
  const cities = sample(rng, ['Avon', 'Belmont', 'Carver', 'Dover', 'Easton', 'Fulton'], 4);
  const a = cities.map(() => pickInt(rng, 4, 14));
  const b = cities.map(() => pickInt(rng, 2, 10));
  const trap = pickInt(rng, 0, 3);
  a[trap] = 16;
  b[trap] = 2;
  const win = (trap + 1 + pickInt(rng, 0, 2)) % 4;
  a[win] = 12;
  b[win] = 9;
  for (let i = 0; i < 4; i += 1) if (i !== win && i !== trap && a[i]! + b[i]! >= 20) b[i] = 20 - a[i]! - 1;
  const { choices, correctIndex } = textMcq(
    cities[win]!,
    cities.filter((_, i) => i !== win).map((c) => td(c, null, 'Phải cộng hai loại chi tiêu; cột cao nhất của một loại chưa chắc cho tổng cao nhất.')),
    rng,
  );
  return {
    stem: 'The table shows the spending, in millions of dollars, on parks and on libraries in four cities last year. Which city had the highest combined spending on parks and libraries?',
    figure: table('Spending (millions of dollars)', ['City', 'Parks', 'Libraries'], cities.map((c, i) => ({ label: c, cells: [a[i]!, b[i]!] }))),
    choices,
    correctIndex,
    steps: [S('Cộng hai cột cho từng thành phố.', a.map((v, i) => `${v + b[i]!}`).join(',   ')), S('Tổng lớn nhất.', cities[win]!)],
  };
});

/** Tốc độ trên từng khoảng thời gian → tổng số lượng. */
const dataRateTotal = gridT('pd-d-data-rate-total', 'ratios_rates_units', 'medium', (rng) => {
  const who = pick(rng, NAMES);
  const cuts = [0, pickInt(rng, 1, 3), 0, 0];
  cuts[2] = cuts[1]! + pickInt(rng, 1, 3);
  cuts[3] = cuts[2]! + pickInt(rng, 1, 3);
  const rates = [pickInt(rng, 2, 12), pickInt(rng, 2, 12), pickInt(rng, 2, 12)];
  const total = rates.reduce((s, r, i) => s + r * (cuts[i + 1]! - cuts[i]!), 0);
  const rows = rates.map((r, i) => ({ label: `${cuts[i]} to ${cuts[i + 1]}`, cells: [r] }));
  return {
    stem: `${who} works a ${cuts[3]}-hour shift answering customer messages. The table shows the average number of messages answered per hour during each part of the shift. What is the total number of messages ${who} answered during the shift?`,
    figure: table('Messages answered per hour', ['Hours into shift', 'Messages per hour'], rows),
    answer: rat(total),
    steps: [
      S('Mỗi đoạn: tốc độ nhân thời lượng.', rates.map((r, i) => `${r} × ${cuts[i + 1]! - cuts[i]!}`).join(' + ')),
      S('Cộng lại.', `${total}`),
    ],
  };
});

/** Thời gian "hồi phục" sau hai bữa ăn: chênh lệch. */
const dataRecoveryDiff = mcqT('pd-d-data-recovery-diff', 'one_var_data', 'hard', (rng) => {
  const who = pick(rng, NAMES);
  const L1 = 10 * pickInt(rng, 9, 11);
  const r1 = pick(rng, [1, 1.5, 2, 2.5]);
  const s = r1 + pick(rng, [1, 1.5, 2]);
  const r2 = r1 + pick(rng, [0.5, 1, 1.5, 2]);
  const L2 = L1 + 10 * pickInt(rng, 0, 1);
  const end = s + r2 + 0.5;
  const times = range(0, Math.round(end * 2)).map((i) => i / 2);
  const level = times.map((t) => {
    if (t <= r1) return t === 0 || t === r1 ? L1 : L1 + 20 + 10 * Math.round(Math.sin((t / r1) * Math.PI) * 2);
    if (t < s) return L1 - 10;
    if (t === s) return L2;
    if (t < s + r2) return L2 + 20 + 10 * Math.round(Math.sin(((t - s) / r2) * Math.PI) * 2);
    return t === s + r2 ? L2 : L2 - 10;
  });
  const diff = r2 - r1;
  const { choices, correctIndex } = numMcq(
    rat(Math.round(diff * 2), 2),
    [
      nd(rat(Math.round((s + r2) * 2), 2), null, 'Đây là thời điểm hồi phục lần hai tính từ đầu bảng, chưa trừ thời điểm bắt đầu bữa thứ hai.'),
      nd(rat(Math.round(r2 * 2), 2), 'stopped_too_early', 'Đây là thời gian hồi phục sau bữa thứ hai; còn phải trừ thời gian sau bữa thứ nhất.'),
      nd(rat(Math.round((diff + 0.5) * 2), 2), 'off_by_one', 'Đọc lệch một mốc nửa giờ.'),
    ],
    rng,
    decText,
  );
  return {
    stem: `${who} ate breakfast at hour 0 and lunch at hour ${s}. The table shows ${who}'s blood sugar level at half-hour intervals. The recovery time after a meal is the time it takes for the level to return to the value recorded at the start of that meal. By how many hours is the recovery time after lunch greater than the recovery time after breakfast?`,
    figure: table('Blood sugar level', ['Hours', 'Level'], times.map((t, i) => ({ label: String(t), cells: [level[i]!] }))),
    choices,
    correctIndex,
    steps: [
      S('Sau bữa sáng: mức ban đầu, tìm lần đầu quay lại mức đó.', `${L1} tại giờ 0 → quay lại tại giờ ${r1}: ${r1} giờ`),
      S('Sau bữa trưa: làm tương tự, tính từ giờ bắt đầu bữa trưa.', `${L2} tại giờ ${s} → quay lại tại giờ ${s + r2}: ${r2} giờ`),
      S('Lấy hiệu.', `${r2} - ${r1} = ${decText(rat(Math.round(diff * 2), 2))}`),
    ],
  };
});

/** Bảng mức tiêu hao nhiên liệu theo tốc độ → số gallon cho một chuyến. */
const dataMileageGallons = gridT('pd-d-data-mileage-gallons', 'ratios_rates_units', 'medium', (rng) => {
  const speeds = [10, 20, 30, 40, 50, 60, 70];
  const mpg = speeds.map(() => 5 * pickInt(rng, 3, 11));
  const i = pickInt(rng, 1, 6);
  const h = pickInt(rng, 2, 8);
  const miles = speeds[i]! * h;
  return {
    stem: `The table shows the gas mileage, in miles per gallon, of a car at different constant speeds. Based on the table, how many gallons of gas are needed to drive the car for ${h} hours at a constant speed of ${speeds[i]} miles per hour?`,
    figure: table('Gas mileage', ['Speed (mph)', 'Miles per gallon'], speeds.map((v, k) => ({ label: String(v), cells: [mpg[k]!] }))),
    answer: rat(miles, mpg[i]!),
    steps: [
      S('Quãng đường bằng tốc độ nhân thời gian.', `${speeds[i]} × ${h} = ${miles}`),
      S('Chia cho số dặm đi được mỗi gallon ở tốc độ đó.', `frac(${miles},${mpg[i]}) = ${fx(rat(miles, mpg[i]!))}`),
    ],
  };
});

const CH23: MathTemplate[] = [
  dataMaxSum,
  dataGapSmallest,
  dataQuarterHighest,
  dataPercentOf,
  dataUnderRoman,
  dataTrend,
  dataScatterArgmin,
  dataPeak,
  dataMatchingPercent,
  dataFractionOf,
  dataMaxRevenue,
  dataTwice,
  dataCombinedMax,
  dataRateTotal,
  dataRecoveryDiff,
  dataMileageGallons,
];

// ================================================================ Chương 24 — Xác suất

type TwoWay = { caption: string; rows: string[]; cols: string[]; what: string; rowWord: (r: string) => string; colWord: (c: string) => string };

const TWO_WAY: TwoWay[] = [
  { caption: 'Parking tickets by vehicle and type', rows: ['Van', 'Sedan'], cols: ['Expired meter', 'No permit', 'Blocked lane'], what: 'tickets', rowWord: (r) => `given to a ${r.toLowerCase()}`, colWord: (c) => `for "${c.toLowerCase()}"` },
  { caption: 'Library loans by reader and format', rows: ['Adult', 'Teen'], cols: ['Print', 'E-book', 'Audio'], what: 'loans', rowWord: (r) => `made by a ${r.toLowerCase()} reader`, colWord: (c) => `of the ${c.toLowerCase()} format` },
  { caption: 'Repair requests by building and kind', rows: ['North', 'South'], cols: ['Plumbing', 'Electric', 'Heating'], what: 'requests', rowWord: (r) => `from the ${r} building`, colWord: (c) => `for ${c.toLowerCase()} work` },
  { caption: 'Orders by customer type and item', rows: ['Member', 'Guest'], cols: ['Coffee', 'Tea', 'Juice'], what: 'orders', rowWord: (r) => `placed by a ${r.toLowerCase()}`, colWord: (c) => `for ${c.toLowerCase()}` },
];

function twoWayTable(ctx: TwoWay, cells: number[][], withTotals = true): MathFigureSpec {
  const colT = ctx.cols.map((_, j) => cells.reduce((s, r) => s + r[j]!, 0));
  return {
    kind: 'data_table',
    caption: ctx.caption,
    columns: ['', ...ctx.cols, ...(withTotals ? ['Total'] : [])],
    rows: ctx.rows.map((r, i) => ({ label: r, cells: [...cells[i]!, ...(withTotals ? [cells[i]!.reduce((s, v) => s + v, 0)] : [])] })),
    ...(withTotals ? { totalRow: { label: 'Total', cells: [...colT, colT.reduce((s, v) => s + v, 0)] } } : {}),
  };
}

/** P(hàng | cột) — "tỉ lệ các vé loại X là của xe Y", đáp án thập phân. */
const probColGiven = mcqT('pd-d-prob-col-given', 'probability', 'medium', (rng) => {
  const ctx = pick(rng, TWO_WAY);
  const cells = [range(0, 2).map(() => pickInt(rng, 12, 90)), range(0, 2).map(() => pickInt(rng, 12, 90))];
  const i = pickInt(rng, 0, 1);
  const j = pickInt(rng, 0, 2);
  const colT = cells[0]![j]! + cells[1]![j]!;
  const rowT = cells[i]!.reduce((s, v) => s + v, 0);
  const grand = cells.flat().reduce((s, v) => s + v, 0);
  const cell = cells[i]![j]!;
  const { choices, correctIndex } = decMcq(
    rat(cell, colT),
    [
      nd(rat(cell, rowT), 'wrong_denominator', 'Chia cho tổng HÀNG; đề giới hạn trong một CỘT.'),
      nd(rat(cell, grand), 'wrong_denominator', 'Chia cho tổng cả bảng.'),
      nd(rat(colT - cell, colT), null, 'Đúng mẫu số nhưng lấy nhóm còn lại.'),
    ],
    rng,
    3,
  );
  return {
    stem: `The table summarizes ${grand} ${ctx.what} by two characteristics. Which of the following is closest to the proportion of the ${ctx.what} ${ctx.colWord(ctx.cols[j]!)} that were ${ctx.rowWord(ctx.rows[i]!)}?`,
    figure: twoWayTable(ctx, cells),
    choices,
    correctIndex,
    steps: [
      S('Nhóm đang xét là cả cột đó (đọc ô tổng cuối cột).', `mẫu số = ${colT}`),
      S('Nhóm mục tiêu là ô giao của hàng và cột.', `frac(${cell},${colT}) ≈ ${toDecimal(rat(cell, colT)).toFixed(3)}`),
    ],
  };
});

/** Bảng lớn: cho một hàng, xác suất rơi vào các cột "từ k trở lên". */
const BIG_CTX = {
  caption: 'Registered volunteers by role and years of service',
  rows: ['Coach', 'Driver', 'Cook', 'Tutor', 'Medic'],
  cols: ['1', '2', '3', '4', '5+'],
};
const withComma = (n: number) => n.toLocaleString('en-US');

function bigCells(rng: Rng): number[][] {
  return BIG_CTX.rows.map(() => BIG_CTX.cols.map(() => pickInt(rng, 1800, 9800)));
}

function bigTable(cells: number[][]): MathFigureSpec {
  const colT = BIG_CTX.cols.map((_, j) => cells.reduce((s, r) => s + r[j]!, 0));
  return {
    kind: 'data_table',
    caption: BIG_CTX.caption,
    columns: ['Role', ...BIG_CTX.cols, 'Total'],
    rows: BIG_CTX.rows.map((r, i) => ({ label: r, cells: [...cells[i]!.map(withComma), withComma(cells[i]!.reduce((s, v) => s + v, 0))] })),
    totalRow: { label: 'Total', cells: [...colT.map(withComma), withComma(colT.reduce((s, v) => s + v, 0))] },
  };
}

const probRowAtLeast = mcqT('pd-d-prob-row-atleast', 'probability', 'medium', (rng) => {
  const cells = bigCells(rng);
  const i = pickInt(rng, 0, 4);
  const k = pickInt(rng, 3, 4); // "ít nhất k năm": các cột từ chỉ số k−1 trở đi
  const part = cells[i]!.slice(k - 1).reduce((s, v) => s + v, 0);
  const rowT = cells[i]!.reduce((s, v) => s + v, 0);
  const colsT = cells.reduce((s, r) => s + r.slice(k - 1).reduce((a, v) => a + v, 0), 0);
  const { choices, correctIndex } = decMcq(
    rat(part, rowT),
    [
      nd(rat(part, colsT), 'wrong_denominator', 'Chia cho tổng các cột "ít nhất" của cả bảng — đó là câu hỏi ngược.'),
      nd(rat(cells[i]![k - 1]!, rowT), 'stopped_too_early', `Chỉ lấy cột ${k} năm, quên các cột nhiều năm hơn.`),
      nd(rat(part, cells.flat().reduce((s, v) => s + v, 0)), 'wrong_denominator', 'Chia cho tổng cả bảng.'),
    ],
    rng,
    2,
  );
  return {
    stem: `The table shows the number of registered volunteers in a region, by role and by years of service. If a ${BIG_CTX.rows[i]!.toLowerCase()} is chosen at random, which of the following is closest to the probability that the person has at least ${k} years of service?`,
    figure: bigTable(cells),
    choices,
    correctIndex,
    steps: [
      S('Nhóm đang xét: cả hàng đó.', `${withComma(rowT)}`),
      S(`Nhóm mục tiêu: các cột từ ${k} năm trở lên trong hàng đó.`, `frac(${withComma(part)},${withComma(rowT)}) ≈ ${toDecimal(rat(part, rowT)).toFixed(2)}`),
    ],
  };
});

const probReverseConditional = mcqT('pd-d-prob-reverse-conditional', 'probability', 'hard', (rng) => {
  const cells = bigCells(rng);
  const i = pickInt(rng, 0, 4);
  const k = pickInt(rng, 3, 4);
  const part = cells[i]!.slice(k - 1).reduce((s, v) => s + v, 0);
  const rowT = cells[i]!.reduce((s, v) => s + v, 0);
  const colsT = cells.reduce((s, r) => s + r.slice(k - 1).reduce((a, v) => a + v, 0), 0);
  const { choices, correctIndex } = decMcq(
    rat(part, colsT),
    [
      nd(rat(part, rowT), 'wrong_denominator', 'Đây là câu hỏi ngược: đề cho biết số năm, nên nhóm đang xét là các cột "ít nhất".'),
      nd(rat(rowT, cells.flat().reduce((s, v) => s + v, 0)), 'wrong_denominator', 'Chia tổng hàng cho tổng cả bảng — bỏ mất điều kiện về số năm.'),
      nd(rat(cells[i]![4]!, cells.reduce((s, r) => s + r[4]!, 0)), 'stopped_too_early', 'Chỉ xét cột cuối cùng.'),
    ],
    rng,
    2,
  );
  return {
    stem: `The table shows the number of registered volunteers in a region, by role and by years of service. If a volunteer with at least ${k} years of service is chosen at random, which of the following is closest to the probability that the volunteer is a ${BIG_CTX.rows[i]!.toLowerCase()}?`,
    figure: bigTable(cells),
    choices,
    correctIndex,
    steps: [
      S(`Nhóm đang xét: mọi người ở các cột từ ${k} năm trở lên.`, `${withComma(colsT)}`),
      S('Nhóm mục tiêu: phần của hàng đó trong các cột ấy.', `frac(${withComma(part)},${withComma(colsT)}) ≈ ${toDecimal(rat(part, colsT)).toFixed(2)}`),
    ],
  };
});

/** Bảng phần trăm thiếu một ô: P(A hoặc ô thiếu). */
const probMissingPercent = mcqT('pd-d-prob-missing-percent', 'probability', 'easy', (rng) => {
  const kinds = sample(rng, ['Red', 'Blue', 'Black', 'White', 'Silver', 'Green', 'Gray'], 5);
  const p = [pickInt(rng, 8, 30), pickInt(rng, 8, 30), pickInt(rng, 5, 20), pickInt(rng, 5, 20)];
  const missing = 100 - p.reduce((s, v) => s + v, 0);
  const ask = pickInt(rng, 0, 3);
  const ans = p[ask]! + missing;
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(p[ask]!, 'stopped_too_early', 'Quên ô bị thiếu: phải tính nó bằng 100% trừ tổng các ô còn lại.'),
      nd(missing, null, 'Chỉ lấy ô bị thiếu.'),
      nd(p[ask]! + p[(ask + 1) % 4]!, null, 'Cộng nhầm ô khác.'),
    ],
    rng,
    (v) => `${fx(v)}%`,
  );
  return {
    stem: `A bicycle maker produces bikes in five colors. The incomplete table shows the percent of bikes produced in each color. If a bike from the maker is chosen at random, what is the probability that its color is ${kinds[ask]!.toLowerCase()} or ${kinds[4]!.toLowerCase()}?`,
    figure: { kind: 'data_table', caption: 'Bike colors', columns: ['Color', ...kinds], rows: [{ label: 'Percent', cells: [...p.map((v) => `${v}%`), ''] }] },
    choices,
    correctIndex,
    steps: [
      S('Ô thiếu bằng 100% trừ tổng các ô đã biết.', `100 - ${p.reduce((s, v) => s + v, 0)} = ${missing}`),
      S('Cộng hai màu.', `${p[ask]} + ${missing} = ${ans}%`),
    ],
  };
});

/** 2×2 có tổng: trong một hàng, phần nào thuộc một cột? */
const RESULT_CTX = [
  { caption: 'Game results', rows: ['Favored', 'Not favored'], cols: ['Won', 'Lost'], ask: (r: string, c: string) => `In what fraction of the games in which the team was ${r.toLowerCase()} did the team ${c === 'Won' ? 'win' : 'lose'}?` },
  { caption: 'Seedlings after one month', rows: ['Watered daily', 'Watered weekly'], cols: ['Survived', 'Did not survive'], ask: (r: string, c: string) => `What fraction of the seedlings that were ${r.toLowerCase()} ${c === 'Survived' ? 'survived' : 'did not survive'}?` },
  { caption: 'Job applications', rows: ['Online', 'In person'], cols: ['Accepted', 'Rejected'], ask: (r: string, c: string) => `What fraction of the applications submitted ${r.toLowerCase()} were ${c.toLowerCase()}?` },
];

const probRowFraction = mcqT('pd-d-prob-row-fraction', 'probability', 'easy', (rng) => {
  const ctx = pick(rng, RESULT_CTX);
  const cells = [range(0, 1).map(() => pickInt(rng, 3, 45)), range(0, 1).map(() => pickInt(rng, 3, 45))];
  const i = pickInt(rng, 0, 1);
  const j = pickInt(rng, 0, 1);
  const cell = cells[i]![j]!;
  const rowT = cells[i]![0]! + cells[i]![1]!;
  const colT = cells[0]![j]! + cells[1]![j]!;
  const grand = rowT + cells[1 - i]![0]! + cells[1 - i]![1]!;
  const { choices, correctIndex } = numMcq(
    rat(cell, rowT),
    [
      nd(rat(cell, colT), 'wrong_denominator', 'Chia cho tổng cột; nhóm đang xét là một HÀNG.'),
      nd(rat(cell, grand), 'wrong_denominator', 'Chia cho tổng cả bảng.'),
      nd(rat(cells[i]![1 - j]!, rowT), null, 'Lấy nhầm ô bên cạnh.'),
    ],
    rng,
  );
  return {
    stem: `The table summarizes the results of ${grand} cases, classified by two characteristics. ${ctx.ask(ctx.rows[i]!, ctx.cols[j]!)}`,
    figure: { kind: 'data_table', caption: ctx.caption, columns: ['', ...ctx.cols, 'Total'], rows: ctx.rows.map((r, k) => ({ label: r, cells: [cells[k]![0]!, cells[k]![1]!, cells[k]![0]! + cells[k]![1]!] })), totalRow: { label: 'Total', cells: [cells[0]![0]! + cells[1]![0]!, cells[0]![1]! + cells[1]![1]!, grand] } },
    choices,
    correctIndex,
    steps: [S('Nhóm đang xét là cả hàng.', `${rowT}`), S('Chia ô cần tìm cho tổng hàng.', `frac(${cell},${rowT}) = ${fx(rat(cell, rowT))}`)],
  };
});

/** Bảng thiếu ô theo tuần: điền rồi tính phân số. */
const probIncompleteWeeks = mcqT('pd-d-prob-incomplete-weeks', 'probability', 'hard', (rng) => {
  const [r1, r2] = pick(rng, [['Desks', 'Chairs'], ['Tents', 'Sleeping bags'], ['Helmets', 'Gloves']] as const);
  const a = range(0, 3).map(() => pickInt(rng, 10, 60));
  const b = range(0, 3).map(() => pickInt(rng, 10, 70));
  const colT = a.map((v, i) => v + b[i]!);
  const aT = a.reduce((s, v) => s + v, 0);
  const bT = b.reduce((s, v) => s + v, 0);
  const [i, j] = sample(rng, [0, 1, 2, 3], 2).sort() as [number, number];
  // Ô trống: a[2], a tổng, b[3].
  const rows = [
    { label: r1, cells: [a[0]!, a[1]!, '', a[3]!, ''] as Array<string | number> },
    { label: r2, cells: [b[0]!, b[1]!, b[2]!, '', bT] as Array<string | number> },
  ];
  const ans = rat(a[i]! + a[j]!, aT);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(rat(a[i]! + a[j]!, aT + bT), 'wrong_denominator', 'Chia cho tổng của cả hai loại.'),
      nd(rat(colT[i]! + colT[j]!, aT + bT), null, 'Dùng tổng cột (cả hai loại) thay vì chỉ một loại.'),
      nd(rat(a[i]!, aT), 'stopped_too_early', 'Chỉ lấy một tuần.'),
    ],
    rng,
  );
  return {
    stem: `A store manager summarized the number of ${r1.toLowerCase()} and ${r2.toLowerCase()} sold over four weeks in the incomplete table. Weeks ${i + 1} and ${j + 1} accounted for what fraction of all ${r1.toLowerCase()} sold?`,
    figure: {
      kind: 'data_table',
      caption: 'Units sold',
      columns: ['', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Total'],
      rows,
      totalRow: { label: 'Total', cells: [...colT, aT + bT] },
    },
    choices,
    correctIndex,
    steps: [
      S('Điền ô trống bằng hiệu giữa tổng và các ô đã biết.', `tuần 3: ${colT[2]} - ${b[2]} = ${a[2]},   tổng hàng: ${aT + bT} - ${bT} = ${aT}`),
      S('Lấy hai tuần chia cho tổng của loại đó.', `frac(${a[i]} + ${a[j]},${aT}) = ${fx(ans)}`),
    ],
  };
});

/** Hàng nào cho xác suất lớn nhất của một cột? (so tỉ lệ, không so số đếm) */
const probHighestConditional = mcqT('pd-d-prob-highest-conditional', 'probability', 'medium', (rng) => {
  const teams = sample(rng, ['Falcons', 'Otters', 'Comets', 'Lynx', 'Pioneers', 'Rangers'], 4);
  const col = pickInt(rng, 0, 2);
  const cols = ['Gold', 'Silver', 'Bronze'];
  const cells = teams.map(() => cols.map(() => pickInt(rng, 5, 40)));
  // Người thắng về tỉ lệ; bẫy: đội có số đếm lớn nhất nhưng tỉ lệ thấp.
  const win = pickInt(rng, 0, 3);
  const trap = (win + 1) % 4;
  cells[win] = cols.map((_, k) => (k === col ? 20 : 8));
  cells[trap] = cols.map((_, k) => (k === col ? 30 : 40));
  const ratio = (r: number[]) => r[col]! / r.reduce((s, v) => s + v, 0);
  for (let t = 0; t < 4; t += 1) {
    if (t !== win && t !== trap) cells[t]![col] = pickInt(rng, 1, 4);
  }
  void ratio;
  const { choices, correctIndex } = textMcq(
    teams[win]!,
    teams.filter((_, t) => t !== win).map((tm) => td(tm, null, 'So TỈ LỆ trong từng hàng (chia cho tổng hàng), không so số đếm.')),
    rng,
  );
  return {
    stem: `The table shows the medals won by four teams at a regional competition. If a medalist is chosen at random from one of the teams, which team gives the highest probability of choosing a ${cols[col]!.toLowerCase()} medalist?`,
    figure: { kind: 'data_table', caption: 'Medals won', columns: ['Team', ...cols, 'Total'], rows: teams.map((tm, t) => ({ label: tm, cells: [...cells[t]!, cells[t]!.reduce((s, v) => s + v, 0)] })) },
    choices,
    correctIndex,
    steps: [
      S('Với mỗi đội: số huy chương loại đó chia cho tổng của đội.', teams.map((tm, t) => `${fx(rat(cells[t]![col]!, cells[t]!.reduce((s, v) => s + v, 0)))}`).join(',   ')),
      S('Tỉ lệ lớn nhất.', teams[win]!),
    ],
  };
});

/** Hiệu hai xác suất có điều kiện theo hàng. */
const probDifference = mcqT('pd-d-prob-difference', 'probability', 'medium', (rng) => {
  const [p1, p2] = sample(rng, ['Lake A', 'Lake B', 'River C', 'Pond D'], 2) as [string, string];
  const a1 = 100 * pickInt(rng, 1, 8);
  const b1 = 100 * pickInt(rng, 1, 12);
  const a2 = 100 * pickInt(rng, 1, 8);
  let b2 = 100 * pickInt(rng, 1, 12);
  if (a1 * b2 === a2 * b1) b2 += 100;
  const P1 = rat(a1, a1 + b1);
  const P2 = rat(a2, a2 + b2);
  const big = toDecimal(P1) >= toDecimal(P2);
  const [hi, lo, hiName, loName] = big ? [P1, P2, p1, p2] : [P2, P1, p2, p1];
  const ans = subValue(hi, lo);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(rat(Math.abs(a1 - a2), a1 + b1 + a2 + b2), 'wrong_denominator', 'Trừ số đếm rồi chia cho tổng cả bảng — không phải hiệu hai xác suất.'),
      nd(hi, 'stopped_too_early', 'Đây mới là xác suất ở một nơi.'),
      nd(rat(Math.abs(a1 - a2), a1 + a2), 'wrong_denominator', 'Chia cho tổng cột.'),
    ],
    rng,
  );
  return {
    stem: `Biologists counted two kinds of fish in two locations, as shown in the table. Assuming each fish is equally likely to be caught, the probability of catching a spotted fish in ${hiName} is how much greater than the probability of catching a spotted fish in ${loName}?`,
    figure: { kind: 'data_table', caption: 'Number of fish', columns: ['Location', 'Spotted', 'Striped'], rows: [{ label: p1, cells: [a1, b1] }, { label: p2, cells: [a2, b2] }] },
    choices,
    correctIndex,
    steps: [
      S('Xác suất ở mỗi nơi: số cá đốm chia cho tổng cá ở nơi đó.', `${hiName}: ${fx(hi)},   ${loName}: ${fx(lo)}`),
      S('Lấy hiệu.', `${fx(hi)} - ${fx(lo)} = ${fx(ans)}`),
    ],
  };
});

/** Bảng 2×2 thiếu ô có tổng: điền rồi tính phân số của một hàng. */
const probIncomplete2x2 = mcqT('pd-d-prob-incomplete-2x2', 'probability', 'hard', (rng) => {
  const [rA, rB] = sample(rng, ['East region', 'West region', 'North region', 'South region'], 2) as [string, string];
  const cA = [pickInt(rng, 10, 60), pickInt(rng, 10, 70)];
  const cB = [pickInt(rng, 10, 60), pickInt(rng, 10, 70)];
  const col2T = cA[1]! + cB[1]!;
  const grand = cA[0]! + cA[1]! + cB[0]! + cB[1]!;
  const rowA = cA[0]! + cA[1]!;
  // Hiện: A·cột2, B·cột1, tổng cột 2, tổng cả bảng. Ẩn phần còn lại.
  const ans = rat(cA[1]!, rowA);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(rat(cA[1]!, col2T), 'wrong_denominator', 'Chia cho tổng cột.'),
      nd(rat(cA[1]!, grand), 'wrong_denominator', 'Chia cho tổng cả bảng.'),
      nd(rat(cA[0]!, rowA), null, 'Lấy nhầm cột còn lại.'),
    ],
    rng,
  );
  return {
    stem: `The incomplete table summarizes the number of wildfires in two regions last year by cause. Based on the table, what fraction of all wildfires in the ${rA.toLowerCase()} were caused by people?`,
    figure: {
      kind: 'data_table',
      caption: 'Wildfires by cause',
      columns: ['', 'Lightning', 'People', 'Total'],
      rows: [
        { label: rA, cells: ['', cA[1]!, ''] },
        { label: rB, cells: [cB[0]!, '', ''] },
      ],
      totalRow: { label: 'Total', cells: ['', col2T, grand] },
    },
    choices,
    correctIndex,
    steps: [
      S('Điền dần: ô còn thiếu của cột "People" ở hàng dưới, rồi tổng hàng dưới, rồi tổng hàng trên.', `${rB}: ${col2T} - ${cA[1]} = ${cB[1]},   tổng ${rB}: ${cB[0]! + cB[1]!},   tổng ${rA}: ${grand} - ${cB[0]! + cB[1]!} = ${rowA}`),
      S('Chia cho tổng hàng trên.', `frac(${cA[1]},${rowA}) = ${fx(ans)}`),
    ],
  };
});

/** Biết thuộc cột (hỏng), xác suất thuộc hàng (dây chuyền A) — đáp án phần trăm. */
const probGivenColPercent = mcqT('pd-d-prob-given-col-percent', 'probability', 'medium', (rng) => {
  const item = pick(rng, ['fans', 'heaters', 'kettles', 'lamps']);
  const d1 = 20 * pickInt(rng, 5, 40);
  const d2 = 20 * pickInt(rng, 5, 40);
  const n1 = d1 + 100 * pickInt(rng, 20, 60);
  const n2 = d2 + 100 * pickInt(rng, 20, 60);
  const askA = rng() < 0.5;
  const cell = askA ? d1 : d2;
  const { choices, correctIndex } = decMcq(
    rat(cell, d1 + d2),
    [
      nd(rat(cell, askA ? n1 : n2), 'wrong_denominator', 'Đây là tỉ lệ hỏng của dây chuyền; đề cho biết sản phẩm ĐÃ hỏng.'),
      nd(rat(d1 + d2, n1 + n2), 'wrong_denominator', 'Đây là tỉ lệ hỏng chung.'),
      nd(rat(askA ? d2 : d1, d1 + d2), null, 'Lấy nhầm dây chuyền kia.'),
    ],
    rng,
    1,
    true,
  );
  return {
    stem: `A manufacturer makes ${item} on two assembly lines. The table shows the results of quality control. If one of the ${item} turns out to be defective, what is the probability that it was made on Line ${askA ? 'A' : 'B'}?`,
    figure: {
      kind: 'data_table',
      caption: 'Quality control',
      columns: ['', 'Defective', 'Not defective', 'Total'],
      rows: [
        { label: 'Line A', cells: [d1, n1 - d1, n1] },
        { label: 'Line B', cells: [d2, n2 - d2, n2] },
      ],
      totalRow: { label: 'Total', cells: [d1 + d2, n1 + n2 - d1 - d2, n1 + n2] },
    },
    choices,
    correctIndex,
    steps: [S('Nhóm đang xét: mọi sản phẩm hỏng (cột Defective).', `${d1 + d2}`), S('Phần thuộc dây chuyền được hỏi.', `frac(${cell},${d1 + d2}) = ${(100 * toDecimal(rat(cell, d1 + d2))).toFixed(1)}%`)],
  };
});

/** Biết thuộc một cột, xác suất thuộc vài hàng đầu (không quá k người). */
const probGivenColRows = mcqT('pd-d-prob-given-col-rows', 'probability', 'medium', (rng) => {
  const cols = ['Apartment', 'Townhouse', 'House'];
  const rowsL = ['1', '2', '3', '4 or more'];
  const cells = rowsL.map(() => cols.map(() => pickInt(rng, 2, 25)));
  const j = pickInt(rng, 0, 2);
  const k = pickInt(rng, 1, 3);
  const part = cells.slice(0, k).reduce((s, r) => s + r[j]!, 0);
  const colT = cells.reduce((s, r) => s + r[j]!, 0);
  const grand = cells.flat().reduce((s, v) => s + v, 0);
  const { choices, correctIndex } = numMcq(
    rat(part, colT),
    [
      nd(rat(part, grand), 'wrong_denominator', 'Chia cho tổng cả bảng; đề chỉ xét một loại nhà.'),
      nd(rat(cells[k - 1]![j]!, colT), 'stopped_too_early', `Chỉ lấy hàng "${k}", quên các hàng ít hơn.`),
      nd(rat(part, cells.slice(0, k).reduce((s, r) => s + r.reduce((a, v) => a + v, 0), 0)), 'wrong_denominator', 'Chia cho tổng các hàng đó (câu hỏi ngược).'),
    ],
    rng,
  );
  const colTs = cols.map((_, c) => cells.reduce((s, r) => s + r[c]!, 0));
  return {
    stem: `The table summarizes the number of residents in the homes of a neighborhood, by type of home. If a ${cols[j]!.toLowerCase()} in the neighborhood is chosen at random, what is the probability that it has no more than ${k} resident${k === 1 ? '' : 's'}?`,
    figure: {
      kind: 'data_table',
      caption: 'Homes by number of residents',
      columns: ['Residents', ...cols, 'Total'],
      rows: rowsL.map((l, i) => ({ label: l, cells: [...cells[i]!, cells[i]!.reduce((s, v) => s + v, 0)] })),
      totalRow: { label: 'Total', cells: [...colTs, grand] },
    },
    choices,
    correctIndex,
    steps: [
      S('Nhóm đang xét: cả cột loại nhà đó.', `${colT}`),
      S(`"Không quá ${k}" gồm các hàng từ 1 tới ${k}.`, `frac(${part},${colT}) = ${fx(rat(part, colT))}`),
    ],
  };
});

/** Hai nhóm với số lượng và phần trăm: tỉ lệ chung (bình quân gia quyền). */
const probWeighted = mcqT('pd-d-prob-weighted', 'probability', 'hard', (rng) => {
  const n1 = 50 * pickInt(rng, 4, 14);
  const n2 = 50 * pickInt(rng, 4, 14);
  const p1 = pickInt(rng, 2, 12);
  let p2 = pickInt(rng, 2, 12);
  if (p2 === p1) p2 += 1;
  const ans = rat(n1 * p1 + n2 * p2, 100 * (n1 + n2));
  const { choices, correctIndex } = decMcq(
    ans,
    [
      nd(rat(p1 + p2, 200), null, 'Lấy trung bình cộng hai phần trăm; hai nhóm có số mẫu khác nhau nên phải tính theo trọng số.'),
      nd(rat(p1 + p2, 100), null, 'Cộng hai phần trăm.'),
      nd(rat(n1 * p1 + n2 * p2, 100 * n1), 'wrong_denominator', 'Chia cho số mẫu của một khu.'),
    ],
    rng,
    3,
  );
  return {
    stem: `Scientists collected water samples from two ponds to test for a certain algae. Pond 1 provided ${n1} samples, of which ${p1}% contained the algae. Pond 2 provided ${n2} samples, of which ${p2}% contained the algae. Which of the following is closest to the proportion of all the samples that contained the algae?`,
    figure: { kind: 'data_table', caption: 'Water samples', columns: ['', 'Number of samples', 'Percent with algae'], rows: [{ label: 'Pond 1', cells: [n1, `${p1}%`] }, { label: 'Pond 2', cells: [n2, `${p2}%`] }] },
    choices,
    correctIndex,
    steps: [
      S('Đổi phần trăm thành số mẫu ở từng khu.', `${n1} × ${p1 / 100} = ${(n1 * p1) / 100},   ${n2} × ${p2 / 100} = ${(n2 * p2) / 100}`),
      S('Cộng lại rồi chia cho tổng số mẫu.', `frac(${(n1 * p1 + n2 * p2) / 100},${n1 + n2}) ≈ ${toDecimal(ans).toFixed(3)}`),
    ],
  };
});

/** Xét nghiệm cho kết quả sai: âm tính giả + dương tính giả. */
const probIncorrectTest = mcqT('pd-d-prob-incorrect-test', 'probability', 'medium', (rng) => {
  const fn = 10 * pickInt(rng, 1, 8);
  const fp = 10 * pickInt(rng, 1, 8);
  const tp = 10 * pickInt(rng, 20, 45);
  const tn = 1000 - fn - fp - tp;
  const ans = rat(fn + fp, 1000);
  const { choices, correctIndex } = decMcq(
    ans,
    [
      nd(rat(fp, 1000), 'stopped_too_early', 'Chỉ tính dương tính giả, quên âm tính giả.'),
      nd(rat(fn, 1000), 'stopped_too_early', 'Chỉ tính âm tính giả.'),
      nd(rat(fn + fp, fn + fp + tp), 'wrong_denominator', 'Chia cho nhóm sai mẫu số.'),
    ],
    rng,
    1,
    true,
  );
  return {
    stem: 'The table shows the results of a test designed to give a positive result for people who have a certain condition and a negative result for people who do not. According to the results, what is the probability that the test gives an incorrect result?',
    figure: {
      kind: 'data_table',
      caption: 'Test results',
      columns: ['', 'Negative', 'Positive', 'Total'],
      rows: [
        { label: 'Has condition', cells: [fn, tp, fn + tp] },
        { label: 'No condition', cells: [tn, fp, tn + fp] },
      ],
      totalRow: { label: 'Total', cells: [fn + tn, tp + fp, 1000] },
    },
    choices,
    correctIndex,
    steps: [
      S('Kết quả sai gồm hai ô: có bệnh mà âm tính, không bệnh mà dương tính.', `${fn} + ${fp} = ${fn + fp}`),
      S('Chia cho tổng số người.', `frac(${fn + fp},1000) = ${(100 * toDecimal(ans)).toFixed(1)}%`),
    ],
  };
});

/** Suy luận tỉ lệ: đề cho thông tin thừa về nhóm kia. */
const probRatioReasoning = mcqT('pd-d-prob-ratio-reasoning', 'probability', 'hard', (rng) => {
  const p = pickInt(rng, 1, 5);
  let q = pickInt(rng, 2, 9);
  if (q === p) q += 1;
  const m = pickInt(rng, 2, 5);
  const cured = m * p * pickInt(rng, 2, 6);
  const notCured = pickInt(rng, 10, 40);
  const { choices, correctIndex } = numMcq(
    rat(p, p + q),
    [
      nd(rat(p, q), 'wrong_denominator', `Tỉ số ${p} : ${q} là khỏi so với không khỏi; xác suất phải chia cho TỔNG ${p + q}.`),
      nd(rat(q, p + q), null, 'Đây là xác suất KHÔNG khỏi.'),
      nd(rat(cured, cured + notCured), null, 'Đây là xác suất khỏi của nhóm dùng thuốc thật.'),
    ],
    rng,
  );
  return {
    stem: `In a study, patients with back pain were given either a new drug or a placebo. Of the patients given the drug, ${cured} were cured and ${notCured} were not. ${m} times as many patients were cured by the drug as by the placebo, and for every ${p} patient${p === 1 ? '' : 's'} cured by the placebo, ${q} patients given the placebo were not cured. If a patient is given the placebo, what is the probability that the patient will be cured?`,
    choices,
    correctIndex,
    steps: [
      S('Trong nhóm dùng giả dược, cứ khỏi : không khỏi = p : q.', `${p} : ${q}`),
      S('Xác suất khỏi là phần khỏi trên tổng (dữ kiện về thuốc thật không cần dùng).', `frac(${p},${p} + ${q}) = ${fx(rat(p, p + q))}`),
    ],
  };
});

/** Biết P(cột 1 | hàng 2) = 1/k và một ô → tổng hàng 2. Điền số. */
const probSolveTotal = gridT('pd-d-prob-solve-total', 'probability', 'hard', (rng) => {
  const k = pickInt(rng, 2, 6);
  const C = (k - 1) * pickInt(rng, 20, 90);
  const total = (C * k) / (k - 1);
  const g1 = pickInt(rng, 50, 300);
  const c1 = pickInt(rng, 50, 300);
  return {
    stem: `A school is choosing between new sports equipment and new laptops. The incomplete table summarizes the preferences of juniors and seniors. If a senior is chosen at random, the probability that the senior prefers sports equipment is frac(1,${k}). How many seniors are at the school?`,
    figure: {
      kind: 'data_table',
      caption: 'Preferences',
      columns: ['', 'Sports equipment', 'Laptops', 'Total'],
      rows: [
        { label: 'Juniors', cells: [g1, c1, g1 + c1] },
        { label: 'Seniors', cells: ['', C, ''] },
      ],
    },
    answer: rat(total),
    steps: [
      S(`Nếu một phần ${k} số học sinh cuối cấp chọn dụng cụ thể thao, thì phần còn lại (${k - 1} phần ${k}) chọn máy tính.`, `frac(${k - 1},${k})T = ${C}`),
      S('Giải ra tổng.', `T = ${total}`),
    ],
  };
});

const CH24: MathTemplate[] = [
  probColGiven,
  probRowAtLeast,
  probReverseConditional,
  probMissingPercent,
  probRowFraction,
  probIncompleteWeeks,
  probHighestConditional,
  probDifference,
  probIncomplete2x2,
  probGivenColPercent,
  probGivenColRows,
  probWeighted,
  probIncorrectTest,
  probRatioReasoning,
  probSolveTotal,
];

// ================================================================ Chương 25 — Thống kê I

const sum = (v: readonly number[]) => v.reduce((s, x) => s + x, 0);
const meanOf = (v: readonly number[]) => sum(v) / v.length;
function medianOf(v: readonly number[]): number {
  const s = [...v].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2;
}
const sdOf = (v: readonly number[]) => {
  const m = meanOf(v);
  return Math.sqrt(sum(v.map((x) => (x - m) ** 2)) / v.length);
};
/** Bung bảng tần số thành danh sách. */
const expand = (vals: readonly number[], freq: readonly number[]) => vals.flatMap((x, i) => Array<number>(freq[i]!).fill(x));
const freqTable = (caption: string, head: string, vals: readonly number[], freq: readonly number[]): MathFigureSpec => ({
  kind: 'data_table',
  caption,
  columns: [head, 'Frequency'],
  rows: vals.map((x, i) => ({ label: String(x), cells: [freq[i]!] })),
});

/** Trung bình chung của hai nhóm có cỡ khác nhau. */
const statCombinedMean = mcqT('pd-d-stat-combined-mean', 'one_var_data', 'medium', (rng) => {
  const N = pick(rng, [10, 20, 25, 40, 50]);
  const n1 = pickInt(rng, 2, N - 2);
  const n2 = N - n1;
  const m1 = pickInt(rng, 50, 80);
  const m2 = m1 + pickNonZeroInt(rng, -12, 12);
  const what = pick(rng, ['height, in inches,', 'score on a quiz', 'number of push-ups', 'time, in minutes, spent reading']);
  const ans = rat(n1 * m1 + n2 * m2, N);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(rat(m1 + m2, 2), 'confused_mean_median', 'Lấy trung bình hai trung bình; hai nhóm có cỡ khác nhau nên phải tính theo tổng.'),
      nd(rat(n1 * m2 + n2 * m1, N), null, 'Ghép nhầm cỡ nhóm với trung bình.'),
      nd(rat(n1 * m1 + n2 * m2, N + 1), 'off_by_one', 'Chia sai số người.'),
    ],
    rng,
    decText,
  );
  return {
    stem: `The average ${what} of ${n1} students in one group is ${m1}. The average ${what} of ${n2} students in another group is ${m2}. If the two groups are combined, what is the average ${what} of all the students?`,
    choices,
    correctIndex,
    steps: [
      S('Đổi trung bình về tổng: tổng = trung bình × số người.', `${n1} × ${m1} + ${n2} × ${m2} = ${n1 * m1 + n2 * m2}`),
      S('Chia cho tổng số người.', `frac(${n1 * m1 + n2 * m2},${N}) = ${decText(ans)}`),
    ],
  };
});

/** Trung bình của n bài và của k bài cuối → trung bình các bài đầu. */
const statMeanFirstPart = mcqT('pd-d-stat-mean-first-part', 'one_var_data', 'medium', (rng) => {
  const n = pick(rng, [4, 5, 8, 10]);
  const k = pickInt(rng, 2, n - 2);
  const first = pickInt(rng, 70, 98);
  const last = pickInt(rng, 70, 98);
  const total = (n - k) * first + k * last;
  // Trung bình chung có thể lẻ: cho dưới dạng số thập phân nếu cần.
  const M = rat(total, n);
  const who = pick(rng, NAMES);
  const { choices, correctIndex } = numMcq(
    first,
    [
      nd(addValue(mulValue(M, rat(2)), rat(-last)), 'confused_mean_median', 'Coi như chỉ có hai "phần" bằng nhau; phải đổi về tổng điểm.'),
      nd(rat(total - last, n - k), null, `Trừ trung bình của ${k} bài chứ không trừ tổng của chúng.`),
      nd(rat(total - k * last, n), 'wrong_denominator', `Chia cho ${n} thay vì ${n - k}.`),
    ],
    rng,
    decText,
  );
  return {
    stem: `${who} has taken ${n} tests. The average score on all ${n} tests is ${decText(M)}. The average score on the last ${k} tests is ${last}. What is the average score on the first ${n - k} tests?`,
    choices,
    correctIndex,
    steps: [
      S('Đổi về tổng điểm.', `tổng ${n} bài = ${n} × ${decText(M)} = ${total},   tổng ${k} bài cuối = ${k * last}`),
      S('Phần còn lại chia cho số bài đầu.', `frac(${total} - ${k * last},${n - k}) = ${first}`),
    ],
  };
});

/** Bảng tần số theo khoảng: giá trị nào có thể là trung vị? */
const statHistogramMedianBin = mcqT('pd-d-stat-histogram-median-bin', 'one_var_data', 'medium', (rng) => {
  const w = pick(rng, [5, 10]);
  const bins = 6;
  const mb = pickInt(rng, 1, 4);
  // Chọn khoảng chứa trung vị trước, rồi dựng tần số của nó đủ lớn để cả hai vị trí giữa rơi vào đó.
  const freq = range(0, bins - 1).map(() => pickInt(rng, 1, 5));
  const L = sum(freq.slice(0, mb));
  const Rr = sum(freq.slice(mb + 1));
  let f = Math.abs(L - Rr) + 2;
  if ((L + f + Rr) % 2 === 1) f += 1;
  freq[mb] = f;
  const NN = sum(freq);
  const label = (i: number) => `${i * w}-${(i + 1) * w}`;
  const inBin = (i: number) => i * w + pickInt(rng, 1, w - 1);
  const others = sample(rng, range(0, bins - 1).filter((i) => i !== mb), 3);
  const { choices, correctIndex } = numMcq(
    inBin(mb),
    others.map((i) => nd(inBin(i), 'confused_mean_median', `Giá trị này thuộc khoảng ${label(i)}; hai vị trí chính giữa không nằm trong khoảng đó.`)),
    rng,
  );
  return {
    stem: `The table summarizes the number of books read last year by the ${NN} members of a book club, grouped into intervals (each interval includes its left endpoint but not its right endpoint). Which of the following could be the median number of books read by the ${NN} members?`,
    figure: { kind: 'data_table', caption: 'Books read', columns: ['Books', 'Members'], rows: range(0, bins - 1).map((i) => ({ label: label(i), cells: [freq[i]!] })) },
    choices,
    correctIndex,
    steps: [
      S(`Có ${NN} người, nên trung vị là trung bình của người thứ ${NN / 2} và ${NN / 2 + 1}.`),
      S('Cộng dồn tần số để tìm khoảng chứa hai vị trí đó.', `khoảng ${label(mb)}`),
    ],
  };
});

/** Biểu đồ chấm (bảng tần số): trung bình gần số nguyên nào nhất? */
const statDotplotMean = mcqT('pd-d-stat-dotplot-mean', 'one_var_data', 'easy', (rng) => {
  const lo = pickInt(rng, 16, 30);
  const vals = range(lo, lo + 6);
  const freq = vals.map(() => pickInt(rng, 1, 6));
  let m = sum(vals.map((x, i) => x * freq[i]!)) / sum(freq);
  const r = Math.round(m);
  if (Math.abs(m - r) > 0.35) {
    const idx = vals.indexOf(r);
    freq[idx] = freq[idx]! + Math.ceil(sum(freq) / 2);
    m = sum(vals.map((x, i) => x * freq[i]!)) / sum(freq);
  }
  const ans = Math.round(m);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(vals[freq.indexOf(Math.max(...freq))]! === ans ? ans + 2 : vals[freq.indexOf(Math.max(...freq))]!, 'confused_mean_median', 'Đây là mốt (giá trị xuất hiện nhiều nhất), không phải trung bình.'),
      nd(ans + 1, null, 'Tính trung bình mà không nhân mỗi giá trị với tần số của nó.'),
      nd(ans - 1, null, 'Cộng sai tổng.'),
    ],
    rng,
  );
  return {
    stem: `The table shows the ages, in years, of the ${sum(freq)} winners of a youth music award when they won. Based on the data, which of the following is closest to the average (arithmetic mean) age of the winners?`,
    figure: freqTable('Ages of winners', 'Age', vals, freq),
    choices,
    correctIndex,
    steps: [
      S('Nhân mỗi tuổi với tần số rồi cộng lại.', `${sum(vals.map((x, i) => x * freq[i]!))}`),
      S('Chia cho số người.', `frac(${sum(vals.map((x, i) => x * freq[i]!))},${sum(freq)}) ≈ ${m.toFixed(2)}`),
    ],
  };
});

/** Bỏ hai giá trị nào làm độ lệch chuẩn giảm nhiều nhất? */
const statSdRemoveTwo = mcqT('pd-d-stat-sd-remove-two', 'one_var_data', 'medium', (rng) => {
  const names = sample(rng, ['Alder', 'Birch', 'Cedar', 'Elm', 'Fir', 'Hazel', 'Linden', 'Maple', 'Oak', 'Pine', 'Rowan', 'Willow'], 10);
  const center = pickInt(rng, 20, 40);
  const vals = names.map(() => center + pickInt(rng, -4, 4));
  const lowI = pickInt(rng, 0, 4);
  const highI = pickInt(rng, 5, 9);
  vals[lowI] = center - pickInt(rng, 15, 20);
  vals[highI] = center + pickInt(rng, 40, 60);
  const pair = (i: number, j: number) => `${names[i]} and ${names[j]}`;
  const mids = range(0, 9).filter((i) => i !== lowI && i !== highI);
  const [m1, m2, m3, m4] = sample(rng, mids, 4) as [number, number, number, number];
  const { choices, correctIndex } = textMcq(
    pair(Math.min(lowI, highI), Math.max(lowI, highI)),
    [
      td(pair(Math.min(m1, m2), Math.max(m1, m2)), null, 'Hai giá trị gần trung bình; bỏ chúng làm dữ liệu còn lại TRẢI RỘNG hơn.'),
      td(pair(Math.min(m3, highI), Math.max(m3, highI)), null, 'Chỉ bỏ một giá trị ngoại lai; vẫn còn một giá trị cách xa.'),
      td(pair(Math.min(lowI, m4), Math.max(lowI, m4)), null, 'Chỉ bỏ một giá trị ngoại lai; giá trị ngoại lai lớn nhất vẫn còn.'),
    ],
    rng,
  );
  return {
    stem: 'The table shows the number of trail markers on 10 hiking trails in a park. Removing which of the following two trails from the data would result in the greatest decrease in the standard deviation of the number of trail markers?',
    figure: { kind: 'data_table', caption: 'Trail markers', columns: ['Trail', 'Markers'], rows: names.map((n, i) => ({ label: n, cells: [vals[i]!] })) },
    choices,
    correctIndex,
    steps: [
      S('Độ lệch chuẩn đo mức trải rộng quanh trung bình. Bỏ những giá trị xa trung bình nhất thì dữ liệu co cụm lại nhiều nhất.'),
      S('Hai giá trị ngoại lai: một rất nhỏ, một rất lớn.', `${vals[lowI]} và ${vals[highI]}`),
    ],
  };
});

/** Hai bảng tần số cùng tần số, khác độ trải của giá trị: so độ lệch chuẩn. */
const statSdCompareFreq = mcqT('pd-d-stat-sd-compare-freq', 'one_var_data', 'medium', (rng) => {
  const freq = [pickInt(rng, 2, 8), pickInt(rng, 5, 12), pickInt(rng, 5, 15), pickInt(rng, 2, 10)];
  const tightStart = pickInt(rng, 30, 60);
  const tight = [tightStart, tightStart + 1, tightStart + 3, tightStart + 4];
  const wideStart = pickInt(rng, 15, 30);
  const step = pickInt(rng, 4, 8);
  const wide = [0, 1, 2, 3].map((i) => wideStart + step * i);
  const aTight = rng() < 0.5;
  const [A, B] = aTight ? [tight, wide] : [wide, tight];
  const smaller = aTight ? 'A' : 'B';
  const S1 = (g: string) => `The standard deviation of the travel times for Route ${g} is smaller.`;
  const { choices, correctIndex } = textMcq(
    S1(smaller),
    [
      td(S1(smaller === 'A' ? 'B' : 'A'), null, 'Cùng tần số, nhưng các giá trị của tuyến kia cách xa nhau hơn — trải rộng hơn.'),
      td('The standard deviation of the travel times is the same for Route A and Route B.', null, 'Tần số giống nhau không có nghĩa độ lệch chuẩn giống nhau; phải xét khoảng cách giữa các giá trị.'),
      td('The standard deviations for Route A and Route B cannot be compared with the data provided.', null, 'Bảng tần số đủ để so mức trải rộng.'),
    ],
    rng,
  );
  return {
    stem: `The tables give the distributions of travel times, in minutes, for Route A and Route B over the same ${sum(freq)} days. Route A: ${A.map((v, i) => `${v} min (${freq[i]} days)`).join(', ')}. Route B: ${B.map((v, i) => `${v} min (${freq[i]} days)`).join(', ')}. Which of the following statements is true?`,
    choices,
    correctIndex,
    steps: [
      S('Hai tuyến có cùng tần số; chỉ khác khoảng cách giữa các giá trị.'),
      S(`Các giá trị của Route ${smaller} sát nhau hơn, nên độ lệch chuẩn nhỏ hơn.`, `${smaller}`),
    ],
  };
});

/** Hai bảng tần số (cỡ lẻ): so sánh trung vị. */
const statMedianCompare = mcqT('pd-d-stat-median-compare', 'one_var_data', 'medium', (rng) => {
  const base = pickInt(rng, 40, 60);
  const V = range(base, base + 4);
  const n = 2 * pickInt(rng, 6, 10) + 1;
  const make = (): number[] => {
    const f = [0, 0, 0, 0, 0];
    for (let i = 0; i < n; i += 1) f[pickInt(rng, 0, 4)]! += 1;
    return f;
  };
  const fa = make();
  const fb = make();
  const ma = medianOf(expand(V, fa));
  const mb = medianOf(expand(V, fb));
  const correct = ma < mb ? 'The median weight of the kayaks made by Company A is smaller.' : ma > mb ? 'The median weight of the kayaks made by Company B is smaller.' : 'The median weight of the kayaks is the same for both companies.';
  const all = [
    'The median weight of the kayaks made by Company A is smaller.',
    'The median weight of the kayaks made by Company B is smaller.',
    'The median weight of the kayaks is the same for both companies.',
    'The relationship cannot be determined from the information given.',
  ];
  const { choices, correctIndex } = textMcq(
    correct,
    all.filter((t) => t !== correct).map((t) => td(t, 'confused_mean_median', 'Tìm vị trí chính giữa của từng công ty bằng cách cộng dồn tần số.')),
    rng,
  );
  return {
    stem: `The table shows the distribution of weights, to the nearest pound, of ${n} kayaks made by Company A and ${n} kayaks made by Company B. Which of the following correctly compares the median weights of the kayaks made by the two companies?`,
    figure: { kind: 'data_table', caption: 'Number of kayaks', columns: ['Weight (pounds)', 'Company A', 'Company B'], rows: V.map((v, i) => ({ label: String(v), cells: [fa[i]!, fb[i]!] })) },
    choices,
    correctIndex,
    steps: [
      S(`Mỗi công ty có ${n} chiếc; trung vị là chiếc thứ ${(n + 1) / 2}.`),
      S('Cộng dồn tần số để tìm giá trị ở vị trí đó.', `A: ${ma},   B: ${mb}`),
    ],
  };
});

/** Bảng tần số → trung vị (điền số). */
const statFreqMedian = gridT('pd-d-stat-freq-median', 'one_var_data', 'medium', (rng) => {
  const lo = pickInt(rng, 55, 75);
  const vals = [lo, lo + pickInt(rng, 1, 2), lo + 3, lo + pickInt(rng, 5, 7), lo + 10];
  const freq = vals.map(() => pickInt(rng, 2, 11));
  const list = expand(vals, freq);
  const med = medianOf(list);
  return {
    stem: `The table gives the distribution of the low temperatures, in degrees Fahrenheit, for a town over ${list.length} days. What is the median low temperature, in degrees Fahrenheit, for these ${list.length} days?`,
    figure: freqTable('Low temperatures', 'Temperature (degrees F)', vals, freq),
    answer: rat(Math.round(med * 2), 2),
    steps: [
      S(list.length % 2 ? `Có ${list.length} ngày (lẻ): trung vị là giá trị thứ ${(list.length + 1) / 2}.` : `Có ${list.length} ngày (chẵn): trung vị là trung bình của giá trị thứ ${list.length / 2} và ${list.length / 2 + 1}.`),
      S('Cộng dồn tần số từ nhỏ đến lớn để tìm vị trí đó.', `${med}`),
    ],
  };
});

/** Trung vị bằng M: điều gì CHẮC CHẮN đúng? */
const MEDIAN_CTX = [
  { what: 'shoe sizes', who: 'customers', unit: 'inches' },
  { what: 'commute distances', who: 'employees', unit: 'miles' },
  { what: 'wait times', who: 'patients', unit: 'minutes' },
  { what: 'monthly phone bills', who: 'households', unit: 'dollars' },
];

const statMedianMust = mcqT('pd-d-stat-median-must', 'one_var_data', 'medium', (rng) => {
  const ctx = pick(rng, MEDIAN_CTX);
  const n = 10 * pickInt(rng, 3, 12);
  const M = pickInt(rng, 8, 60);
  const correct = `At least half of the ${ctx.who} in the sample have ${ctx.what} greater than or equal to ${M} ${ctx.unit}.`;
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(`The sum of all the ${ctx.what} in the sample is ${n * M} ${ctx.unit}.`, 'confused_mean_median', 'Đây sẽ đúng nếu TRUNG BÌNH bằng M, không phải trung vị.'),
      td(`The average of the smallest and the largest of the ${ctx.what} in the sample is ${M} ${ctx.unit}.`, 'confused_mean_median', 'Trung vị là giá trị ở giữa khi xếp thứ tự, không phải trung điểm của hai đầu.'),
      td(`The difference between the smallest and the largest of the ${ctx.what} in the sample is ${M} ${ctx.unit}.`, null, 'Đây là khoảng biến thiên, không liên quan tới trung vị.'),
    ],
    rng,
  );
  return {
    stem: `A random sample of ${n} ${ctx.who} was surveyed. The median of their ${ctx.what} is ${M} ${ctx.unit}. Which of the following statements must be true?`,
    choices,
    correctIndex,
    steps: [
      S('Trung vị chia dữ liệu đã xếp thứ tự thành hai nửa: ít nhất một nửa không nhỏ hơn nó, ít nhất một nửa không lớn hơn nó.'),
      S('Các lựa chọn khác nói về tổng, hai đầu mút hay khoảng biến thiên — trung vị không quyết định những thứ đó.'),
    ],
  };
});

/** Khoảng biến thiên bằng R: điều gì chắc chắn đúng? */
const RANGE_CTX = [
  { what: 'shelf life', item: 'units of a sauce', unit: 'days', verb: 'expired' },
  { what: 'battery life', item: 'phones of one model', unit: 'hours', verb: 'ran out' },
  { what: 'growing time', item: 'tomato plants', unit: 'days', verb: 'ripened' },
];

const statRangeMust = mcqT('pd-d-stat-range-must', 'one_var_data', 'medium', (rng) => {
  const ctx = pick(rng, RANGE_CTX);
  const n = 10 * pickInt(rng, 2, 10);
  const R = pickInt(rng, 2, 15);
  const correct = `The unit with the longest ${ctx.what} lasted ${R} ${ctx.unit} longer than the unit with the shortest ${ctx.what}.`;
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(`All the units ${ctx.verb} within ${R} ${ctx.unit}.`, null, 'Khoảng biến thiên là hiệu giữa lớn nhất và nhỏ nhất, không phải bản thân các giá trị.'),
      td(`The mean ${ctx.what} of the units is ${R} ${ctx.unit} more than the median.`, 'confused_mean_median', 'Khoảng biến thiên không nói gì về hiệu giữa trung bình và trung vị.'),
      td(`The median ${ctx.what} of the units is ${R} ${ctx.unit} more than the mean.`, 'confused_mean_median', 'Khoảng biến thiên không nói gì về hiệu giữa trung vị và trung bình.'),
    ],
    rng,
  );
  return {
    stem: `A research agency tested a random sample of ${n} ${ctx.item} and found that the ${ctx.what} has a range of ${R} ${ctx.unit}. Which of the following must be true about the units in the sample?`,
    choices,
    correctIndex,
    steps: [S('Khoảng biến thiên = giá trị lớn nhất − giá trị nhỏ nhất.'), S('Chỉ có một lựa chọn nói đúng điều đó.')],
  };
});

/** Bảng tần số → cặp (trung bình, khoảng biến thiên). */
const statFreqMeanRange = mcqT('pd-d-stat-freq-mean-range', 'one_var_data', 'medium', (rng) => {
  const lo = pickInt(rng, 3, 12);
  const k = pickInt(rng, 4, 6);
  const vals = range(lo, lo + k - 1);
  const N = pick(rng, [10, 20, 25]);
  const freq = vals.map(() => 1);
  for (let i = k; i < N; i += 1) freq[pickInt(rng, 0, k - 1)]! += 1;
  const mean = rat(sum(vals.map((x, i) => x * freq[i]!)), N);
  const rangeV = k - 1;
  const pairText = (m: MathValue, r: number) => `Mean = ${decText(m)}, Range = ${r}`;
  const simpleMean = rat(sum(vals), k);
  const { choices, correctIndex } = textMcq(
    pairText(mean, rangeV),
    [
      td(pairText(mean, k), 'off_by_one', 'Đếm số giá trị thay vì lấy lớn nhất trừ nhỏ nhất.'),
      td(pairText(simpleMean, rangeV), null, 'Tính trung bình của các giá trị mà không nhân tần số.'),
      td(pairText(simpleMean, k), null, 'Sai cả trung bình lẫn khoảng biến thiên.'),
      td(pairText(addValue(mean, rat(1, 2)), rangeV), null, 'Cộng sai tổng.'),
      td(pairText(addValue(mean, rat(-1, 2)), rangeV), null, 'Cộng sai tổng.'),
      td(pairText(addValue(mean, rat(1)), k), null, 'Sai cả hai số đo.'),
    ],
    rng,
  );
  return {
    stem: `The table shows the frequency distribution of a list of ${N} randomly generated integers. Which of the following correctly gives the mean and the range of the list?`,
    figure: freqTable('Randomly generated integers', 'Integer', vals, freq),
    choices,
    correctIndex,
    steps: [
      S('Trung bình: tổng (giá trị × tần số) chia số phần tử.', `frac(${sum(vals.map((x, i) => x * freq[i]!))},${N}) = ${decText(mean)}`),
      S('Khoảng biến thiên: lớn nhất trừ nhỏ nhất.', `${vals[k - 1]} - ${lo} = ${rangeV}`),
    ],
  };
});

/** Dãy điểm: I mốt > trung vị, II trung vị > trung bình, III khoảng biến thiên > T. */
const statListRoman = mcqT('pd-d-stat-list-roman', 'one_var_data', 'hard', (rng) => {
  const who = pick(rng, NAMES);
  const scores = range(0, 6).map(() => pickInt(rng, 70, 99));
  scores[pickInt(rng, 0, 6)] = scores[pickInt(rng, 0, 6)]!;
  // Bảo đảm có đúng một mốt: nhân đôi một giá trị.
  const dupFrom = pickInt(rng, 0, 6);
  let dupTo = pickInt(rng, 0, 6);
  if (dupTo === dupFrom) dupTo = (dupTo + 1) % 7;
  scores[dupTo] = scores[dupFrom]!;
  const counts = new Map<number, number>();
  scores.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));
  const maxC = Math.max(...counts.values());
  const modes = [...counts].filter(([, c]) => c === maxC).map(([v]) => v);
  if (modes.length > 1) {
    // Nhiều mốt: biến giá trị đầu tiên thành bản sao của mốt đầu.
    const keep = modes[0]!;
    const idx = scores.findIndex((s) => s !== keep && modes.includes(s));
    scores[idx] = keep;
  }
  const c2 = new Map<number, number>();
  scores.forEach((s) => c2.set(s, (c2.get(s) ?? 0) + 1));
  const mode = [...c2].sort((a, b) => b[1] - a[1])[0]![0];
  const med = medianOf(scores);
  const mean = meanOf(scores);
  const rangeV = Math.max(...scores) - Math.min(...scores);
  const T = Math.max(1, rangeV + pickNonZeroInt(rng, -6, 6));
  const truth = [mode > med, med > mean, rangeV > T];
  if (!truth.includes(true)) {
    truth[2] = true;
  }
  const T2 = truth[2] && !(rangeV > T) ? Math.max(0, rangeV - pickInt(rng, 1, 6)) : T;
  const { choices, correctIndex } = romanMcq(truth, rng);
  return {
    stem: `The table shows ${who}'s scores on seven quizzes. Which of the following are true about the scores? I. The mode is greater than the median. II. The median is greater than the mean. III. The range is greater than ${T2}.`,
    figure: { kind: 'data_table', caption: 'Quiz scores', columns: ['Quiz', ...range(1, 7).map(String)], rows: [{ label: 'Score', cells: scores }] },
    choices,
    correctIndex,
    steps: [
      S('Xếp thứ tự rồi đọc từng số đo.', `${[...scores].sort((a, b) => a - b).join(', ')}`),
      S('Mốt, trung vị, trung bình, khoảng biến thiên.', `mốt ${mode},   trung vị ${med},   trung bình ${mean.toFixed(2)},   khoảng ${rangeV}`),
      S('Đối chiếu ba mệnh đề.', romanLabel(truth)),
    ],
  };
});

/** Hai bảng tần số: so trung bình và trung vị. */
const statCompareMeanMedian = mcqT('pd-d-stat-compare-mean-median', 'one_var_data', 'hard', (rng) => {
  const V = [1, 2, 3, 4, 5];
  const kind = pick(rng, ['A', 'B', 'meanA', 'same'] as const);
  // Phân phối cơ sở có trung vị đúng bằng 3 và cỡ lẻ.
  const base = [pickInt(rng, 1, 3), pickInt(rng, 2, 4), 0, pickInt(rng, 2, 4), pickInt(rng, 1, 3)];
  const Lc = base[0]! + base[1]!;
  const Rc = base[3]! + base[4]!;
  base[2] = Math.abs(Lc - Rc) + 1 + pickInt(rng, 0, 2);
  if (sum(base) % 2 === 0) base[2] = base[2]! + 1;
  const shiftUp = (f: number[]) => [0, f[0]!, f[1]!, f[2]!, f[3]! + f[4]!];
  let fa = [...base];
  let fb = [...base];
  if (kind === 'A') fa = shiftUp(base);
  if (kind === 'B') fb = shiftUp(base);
  if (kind === 'meanA') fa = [base[0]!, base[1]!, base[2]!, 0, base[3]! + base[4]!];
  if (kind === 'same') fb = base.map((v) => 2 * v);
  const la = expand(V, fa);
  const lb = expand(V, fb);
  const [ma, mb, da, db] = [meanOf(la), meanOf(lb), medianOf(la), medianOf(lb)];
  const OPTS = {
    A: 'The mean and median number of films shown per class are both greater in School A.',
    B: 'The mean and median number of films shown per class are both greater in School B.',
    meanA: 'The mean number of films shown per class is greater in School A, but the median is the same in both schools.',
    same: 'The mean and median number of films shown per class are the same in both schools.',
  };
  const { choices, correctIndex } = textMcq(
    OPTS[kind],
    (Object.keys(OPTS) as Array<keyof typeof OPTS>).filter((k) => k !== kind).map((k) => td(OPTS[k], 'confused_mean_median', 'Tính riêng trung bình và trung vị của từng trường rồi mới so.')),
    rng,
  );
  return {
    stem: `The table shows the number of films shown during the past year in each of ${la.length} classes in School A and ${lb.length} classes in School B. Which of the following correctly compares the mean and median number of films shown per class in the two schools?`,
    figure: { kind: 'data_table', caption: 'Number of classes', columns: ['Films shown', 'School A', 'School B'], rows: V.map((v, i) => ({ label: String(v), cells: [fa[i]!, fb[i]!] })) },
    choices,
    correctIndex,
    steps: [
      S('Trung bình: tổng (giá trị × tần số) chia số lớp.', `A: ${ma.toFixed(2)},   B: ${mb.toFixed(2)}`),
      S('Trung vị: giá trị ở vị trí chính giữa sau khi cộng dồn tần số.', `A: ${da},   B: ${db}`),
    ],
  };
});

/** Thêm một giá trị: số đo nào KHÔNG đổi? */
const statAddValueRoman = mcqT('pd-d-stat-add-value-roman', 'one_var_data', 'hard', (rng) => {
  const who = pick(rng, NAMES);
  const vals = range(0, 9).map(() => 10 * pickInt(rng, 40, 70));
  const add = pick(rng, [Math.max(...vals), ...vals]);
  const after = [...vals, add];
  const modeOf = (v: number[]) => {
    const c = new Map<number, number>();
    v.forEach((x) => c.set(x, (c.get(x) ?? 0) + 1));
    const m = Math.max(...c.values());
    return [...c].filter(([, k]) => k === m).map(([x]) => x).sort((a, b) => a - b).join(',');
  };
  const rangeOf = (v: number[]) => Math.max(...v) - Math.min(...v);
  const truth = [medianOf(vals) === medianOf(after), modeOf(vals) === modeOf(after), rangeOf(vals) === rangeOf(after)];
  const { choices, correctIndex } = romanMcq(truth, rng);
  return {
    stem: `The table lists the number of calories in each of ${who}'s last 10 meals. If a ${add}-calorie meal that ${who} had today is added to the values listed, which of the following statistical measures of the data will NOT change? I. Median; II. Mode; III. Range`,
    figure: { kind: 'data_table', caption: 'Calories in meals', columns: ['Meal', ...range(1, 10).map(String)], rows: [{ label: 'Calories', cells: vals }] },
    choices,
    correctIndex,
    steps: [
      S('Tính từng số đo trước và sau khi thêm giá trị.', `trung vị: ${medianOf(vals)} → ${medianOf(after)}`),
      S('Mốt và khoảng biến thiên.', `mốt: ${modeOf(vals)} → ${modeOf(after)},   khoảng: ${rangeOf(vals)} → ${rangeOf(after)}`),
      S('Kết luận.', romanLabel(truth)),
    ],
  };
});

/** Bỏ giá trị ngoại lai lớn nhất: số đo nào giảm? */
const statRemoveOutlier = mcqT('pd-d-stat-remove-outlier', 'one_var_data', 'hard', (rng) => {
  const lo = pickInt(rng, 18, 28);
  const vals = range(lo, lo + 4);
  const freq = [pickInt(rng, 1, 4), pickInt(rng, 2, 5), pickInt(rng, 2, 5), pickInt(rng, 1, 4), pickInt(rng, 0, 2)];
  const out = lo + pickInt(rng, 8, 12);
  const before = [...expand(vals, freq), out];
  if (before.length % 2 === 0 && rng() < 0.5) freq[1] = freq[1]! + 1;
  const b = [...expand(vals, freq), out];
  const a = expand(vals, freq);
  const dMean = meanOf(a) < meanOf(b);
  const dMed = medianOf(a) < medianOf(b);
  const dSd = sdOf(a) < sdOf(b);
  const OPTS = [
    'Only the mean will decrease.',
    'Only the mean and standard deviation will decrease.',
    'Only the mean and median will decrease.',
    'The mean, median, and standard deviation will decrease.',
  ];
  const correct = dMean && dSd ? (dMed ? OPTS[3]! : OPTS[1]!) : dMean && dMed ? OPTS[2]! : OPTS[0]!;
  const { choices, correctIndex } = textMcq(
    correct,
    OPTS.filter((t) => t !== correct).map((t) => td(t, 'confused_mean_median', 'Giá trị ngoại lai kéo trung bình và độ lệch chuẩn; trung vị chỉ đổi khi vị trí chính giữa rơi sang giá trị khác.')),
    rng,
  );
  return {
    stem: `The table gives the gas mileage, in miles per gallon, of ${b.length} cars: ${vals.map((v, i) => `${freq[i]} car${freq[i] === 1 ? '' : 's'} at ${v}`).join(', ')}, and 1 car at ${out}. If the car with the greatest gas mileage is removed from the data, what will happen to the mean, median, and standard deviation of the new data set?`,
    figure: freqTable('Gas mileage', 'Miles per gallon', [...vals, out], [...freq, 1]),
    choices,
    correctIndex,
    steps: [
      S('Giá trị bị bỏ nằm xa phía trên: trung bình giảm và dữ liệu co cụm lại nên độ lệch chuẩn giảm.', `trung bình ${meanOf(b).toFixed(2)} → ${meanOf(a).toFixed(2)}`),
      S('Trung vị: xem vị trí chính giữa trước và sau.', `${medianOf(b)} → ${medianOf(a)}`),
    ],
  };
});

/** Sửa một giá trị ghi sai: số đo nào thay đổi nhiều nhất? */
const statCorrectOutlier = mcqT('pd-d-stat-correct-outlier', 'one_var_data', 'hard', (rng) => {
  const base = pickInt(rng, 40, 50);
  const vals = range(0, 16).map(() => base + pickInt(rng, 0, 20)).sort((a, b) => a - b);
  const wrong = base + pickInt(rng, 40, 60);
  const right = base + pickInt(rng, 3, 17);
  const before = [...vals, wrong];
  const after = [...vals, right];
  const dMean = Math.abs(meanOf(before) - meanOf(after));
  const dMed = Math.abs(medianOf(before) - medianOf(after));
  const rangeOf = (v: number[]) => Math.max(...v) - Math.min(...v);
  const dRange = Math.abs(rangeOf(before) - rangeOf(after));
  const opts: Array<[string, number]> = [
    ['Mean', dMean],
    ['Median', dMed],
    ['Range', dRange],
  ];
  const best = opts.reduce((m, o) => (o[1] > m[1] ? o : m));
  const { choices, correctIndex } = textMcq(
    best[0],
    [
      ...opts.filter((o) => o[0] !== best[0]).map((o) => td(o[0], 'confused_mean_median', `Số đo này đổi ${o[1].toFixed(2)}, ít hơn.`)),
      td('None of them will change.', null, 'Thay một giá trị ở đầu mút chắc chắn làm đổi ít nhất một số đo.'),
    ],
    rng,
  );
  return {
    stem: `The table lists the snowfall, to the nearest inch, in ${before.length} towns last winter. The measurement of ${wrong} inches is an error. Of the mean, median, and range of the values listed, which will change the most if the ${wrong}-inch measurement is replaced by the correct measurement of ${right} inches?`,
    figure: { kind: 'data_table', caption: 'Snowfall (inches)', columns: ['', ...range(1, 6).map(String)], rows: [0, 1, 2].map((r) => ({ label: `Row ${r + 1}`, cells: [...before.slice(6 * r, 6 * r + 6), '', '', '', '', '', ''].slice(0, 6) })) },
    choices,
    correctIndex,
    steps: [
      S('Trung bình đổi đúng (hiệu hai giá trị) / số giá trị.', `${dMean.toFixed(2)}`),
      S('Trung vị chỉ dịch một vị trí; khoảng biến thiên đổi theo cả hai đầu mút mới.', `trung vị: ${dMed},   khoảng: ${rangeOf(before)} → ${rangeOf(after)}`),
    ],
  };
});

const CH25: MathTemplate[] = [
  statCombinedMean,
  statMeanFirstPart,
  statHistogramMedianBin,
  statDotplotMean,
  statSdRemoveTwo,
  statSdCompareFreq,
  statMedianCompare,
  statFreqMedian,
  statMedianMust,
  statRangeMust,
  statFreqMeanRange,
  statListRoman,
  statCompareMeanMedian,
  statAddValueRoman,
  statRemoveOutlier,
  statCorrectOutlier,
];

// ================================================================ Chương 26 — Thống kê II

/** Đường thẳng khớp nhất đi qua hai điểm lưới đẹp: y = m x + b với m, b hữu tỉ. */
function niceLine(x0: number, x1: number, y0: number, y1: number) {
  const slope = (y1 - y0) / (x1 - x0);
  return { slope, intercept: y0 - slope * x0 };
}

/** Đếm số điểm tại x = k nằm TRÊN đường khớp nhất. */
const stat2CountAboveLine = mcqT('pd-d-stat2-count-above-line', 'two_var_data', 'easy', (rng) => {
  const line = niceLine(10, 20, pickInt(rng, 5, 8), pickInt(rng, 10, 13));
  const at = (x: number) => line.slope * x + line.intercept;
  const k = pickInt(rng, 12, 19);
  const nAt = pickInt(rng, 3, 5);
  const above = pickInt(rng, 0, nAt);
  const pts: Array<{ x: number; y: number }> = [];
  const ys = shuffleCopy(range(1, nAt).map((i) => (i <= above ? Math.ceil(at(k) + 0.1) + i - 1 : Math.floor(at(k) - 0.1) - (i - above) + 1)), rng);
  ys.forEach((y) => pts.push({ x: k, y }));
  for (let i = 0; i < 12; i += 1) {
    const x = pickInt(rng, 10, 20);
    if (x === k) continue;
    pts.push({ x, y: Math.round(at(x)) + pickInt(rng, -2, 2) });
  }
  const { choices, correctIndex } = numMcq(
    above,
    [
      nd(nAt - above, null, 'Đếm các điểm NẰM DƯỚI đường thẳng.'),
      nd(nAt, null, `Đếm mọi điểm tại x = ${k}.`),
      nd(above + 1, 'off_by_one', 'Đếm cả điểm nằm dưới sát đường thẳng.'),
    ],
    rng,
  );
  return {
    stem: `The scatterplot shows the ages, in years, and shoe sizes of a group of young people, along with the line of best fit. Based on the data, how many ${k}-year-olds had a shoe size greater than the one predicted by the line of best fit?`,
    figure: { kind: 'scatterplot', caption: 'Shoe size versus age', xLabel: 'Age (years)', yLabel: 'Shoe size', points: pts, line: { slope: line.slope, intercept: line.intercept }, xRange: [9, 21], yRange: [0, 18] },
    choices,
    correctIndex,
    steps: [
      S(`Giá trị dự đoán tại x = ${k} là tung độ của đường thẳng.`, `y ≈ ${at(k).toFixed(1)}`),
      S('Đếm các điểm có hoành độ đó nằm phía trên đường.', `${above}`),
    ],
  };
});

/** Dự đoán từ đường khớp nhất. */
const stat2LinePredict = mcqT('pd-d-stat2-line-predict', 'two_var_data', 'easy', (rng) => {
  const x0 = 30;
  const y0 = 5 * pickInt(rng, 5, 8);
  const m = pick(rng, [rat(1, 2), rat(2, 5), rat(3, 5), rat(1, 5), rat(3, 10)]);
  const b = y0 - toDecimal(m) * x0;
  const X = 10 * pickInt(rng, 5, 9);
  const pred = addValue(mulValue(m, rat(X)), rat(Math.round(b * 10), 10));
  const pts = range(0, 13).map(() => {
    const x = 5 * pickInt(rng, 6, 20);
    return { x, y: Math.round(toDecimal(m) * x + b + pickInt(rng, -15, 15)) };
  });
  const near = pts.find((p) => p.x === X);
  const { choices, correctIndex } = numMcq(
    pred,
    [
      nd(near && !equalsValue(rat(near.y), pred) ? near.y : addValue(pred, rat(10)), null, 'Đọc tung độ của một điểm dữ liệu thay vì của đường khớp nhất.'),
      nd(mulValue(m, rat(X)), 'stopped_too_early', 'Quên cộng tung độ gốc của đường thẳng.'),
      nd(addValue(pred, rat(-10)), null, 'Đọc sai một vạch chia.'),
    ],
    rng,
  );
  return {
    stem: `The scatterplot shows the number of traffic signals and the average weekly number of red-light violations in several towns, along with the line of best fit, y = ${fx(m)}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}. Based on the line of best fit, what is the predicted average weekly number of red-light violations in a town with ${X} traffic signals?`,
    figure: { kind: 'scatterplot', caption: 'Red-light violations', xLabel: 'Number of traffic signals', yLabel: 'Weekly violations', points: pts, line: { slope: toDecimal(m), intercept: b }, xRange: [25, 105], yRange: [0, 100] },
    choices,
    correctIndex,
    steps: [S('Dùng ĐƯỜNG KHỚP NHẤT, không dùng một điểm dữ liệu.', `y = ${fx(m)}(${X}) ${b < 0 ? '-' : '+'} ${Math.abs(b)}`), S('Tính.', fx(pred))],
  };
});

/** Cách khảo sát nào cho kết quả đáng tin nhất? */
const SURVEY_CTX = [
  { goal: 'the eating habits of the students in its first-year class', target: 'the first-year class', wider: 'the whole university', narrow: 'one first-year dining hall' },
  { goal: 'how residents of a town commute to work', target: 'the town', wider: 'the entire state', narrow: 'one train station in the town' },
  { goal: 'the reading habits of the members of a city library', target: 'the library’s members', wider: 'all city residents', narrow: 'the library’s mystery-book section on one day' },
  { goal: 'the screen time of the employees of a company', target: 'the company’s employees', wider: 'all workers in the region', narrow: 'the company’s software department' },
  { goal: 'how often the members of a gym exercise each week', target: 'the gym’s members', wider: 'all adults in the city', narrow: 'one early-morning class at the gym' },
  { goal: 'the favorite lunch options of the students at a high school', target: 'the high school’s students', wider: 'all students in the school district', narrow: 'one homeroom class at the high school' },
  { goal: 'the sleep habits of the nurses at a hospital', target: 'the hospital’s nurses', wider: 'all health workers in the country', narrow: 'the nurses working one night shift' },
  { goal: 'the travel plans of the ticket holders of a football club', target: 'the club’s ticket holders', wider: 'all sports fans in the region', narrow: 'the fans sitting in one section of the stadium' },
];

const stat2BestSurvey = mcqT('pd-d-stat2-best-survey', 'sample_inference', 'easy', (rng) => {
  const ctx = pick(rng, SURVEY_CTX);
  const n = 100 * pickInt(rng, 3, 30);
  const opt = (k: number, from: string) => `Selecting a random sample of ${k} people from ${from}`;
  const { choices, correctIndex } = textMcq(
    opt(n, ctx.target),
    [
      td(opt(n, ctx.wider), 'ignored_margin_of_error', 'Mẫu lấy từ tổng thể rộng hơn mục tiêu: có cả người không thuộc nhóm cần nghiên cứu.'),
      td(opt(n / 2, ctx.target), 'ignored_margin_of_error', 'Đúng tổng thể nhưng mẫu nhỏ hơn, nên sai số lớn hơn.'),
      td(opt(n, ctx.narrow), null, 'Mẫu chỉ lấy từ một nhóm con, không đại diện cho cả tổng thể.'),
    ],
    rng,
  );
  return {
    stem: `Researchers want to determine ${ctx.goal}. Which of the following survey methods is most likely to provide the most valid results?`,
    choices,
    correctIndex,
    steps: [
      S('Mẫu phải chọn NGẪU NHIÊN từ đúng tổng thể cần nghiên cứu.'),
      S('Trong các cách đúng tổng thể, mẫu lớn hơn cho sai số nhỏ hơn.'),
    ],
  };
});

/** Thăm dò: từ mẫu suy ra chênh lệch số phiếu dự kiến trong tổng thể. */
const stat2PollDifference = mcqT('pd-d-stat2-poll-difference', 'sample_inference', 'medium', (rng) => {
  const n = pick(rng, [200, 400, 500, 800, 1000]);
  const a = pickInt(rng, 2, 8) * (n / 20);
  const b = n - a;
  const P = pick(rng, [100000, 200000, 400000, 500000, 800000]);
  const diff = rat(Math.abs(b - a) * P, n);
  const [lead, trail] = b > a ? ['B', 'A'] : ['A', 'B'];
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  const { choices, correctIndex } = numMcq(
    diff,
    [
      nd(rat(big * P, n), 'stopped_too_early', 'Đây là số phiếu dự kiến của người dẫn đầu, chưa trừ.'),
      nd(rat(small * P, n), null, 'Đây là số phiếu dự kiến của người về sau.'),
      nd(big - small, 'dropped_unit_conversion', 'Đây là chênh lệch trong MẪU, chưa phóng lên tổng thể.'),
    ],
    rng,
    (v) => toDecimal(v).toLocaleString('en-US'),
  );
  return {
    stem: `Two candidates are running for mayor. In a random sample of ${n} likely voters, ${a} support Candidate A and ${b} support Candidate B. An estimated ${P.toLocaleString('en-US')} residents are expected to vote. According to the poll, Candidate ${lead} is expected to receive how many more votes than Candidate ${trail}?`,
    choices,
    correctIndex,
    steps: [
      S('Tỉ lệ chênh lệch trong mẫu.', `frac(${big} - ${small},${n})`),
      S('Nhân với tổng số cử tri.', `frac(${big - small},${n}) × ${P} = ${toDecimal(diff)}`),
    ],
  };
});

/** Ý nghĩa tung độ gốc / hệ số góc của đường khớp nhất. */
const FIT_CTX = [
  { x: 'store discount', xu: 'percent', y: 'average shopping time', yu: 'minutes', subj: 'of customers at a store', dir: 1 },
  { x: 'cash prize', xu: 'dollars', y: 'number of mistakes made', yu: 'mistakes', subj: 'by a participant completing a task', dir: -1 },
  { x: 'daily study time', xu: 'minutes', y: 'quiz score', yu: 'points', subj: 'of a student', dir: 1 },
  { x: 'outside temperature', xu: 'degrees Celsius', y: 'daily hot-drink sales', yu: 'cups', subj: 'at a cafe', dir: -1 },
  { x: 'number of volunteers', xu: 'volunteers', y: 'time to clean a beach', yu: 'hours', subj: 'for a cleanup event', dir: -1 },
];

const stat2InterceptMeaning = mcqT('pd-d-stat2-intercept-meaning', 'two_var_data', 'medium', (rng) => {
  const c = pick(rng, FIT_CTX);
  const m = c.dir * pickInt(rng, 2, 9) / 10;
  const b = pickInt(rng, 15, 60);
  const ext = pickInt(rng, 40, 100);
  const correct = `The predicted ${c.y}, in ${c.yu}, ${c.subj} when the ${c.x} is 0`;
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(`The predicted ${m > 0 ? 'increase' : 'decrease'} in the ${c.y}, in ${c.yu}, for each one-unit increase in the ${c.x}`, 'swapped_slope_intercept', 'Đây là ý nghĩa của hệ số góc.'),
      td(`The predicted ${c.x}, in ${c.xu}, when the ${c.y} is 0`, 'solved_for_wrong_var', 'Tung độ gốc là giá trị của y khi x = 0, không phải ngược lại.'),
      td(`The predicted ${c.y}, in ${c.yu}, ${c.subj} when the ${c.x} is ${ext}`, null, `Tung độ gốc ứng với x = 0, không phải x = ${ext}.`),
    ],
    rng,
  );
  return {
    stem: `A scatterplot shows the relationship between the ${c.x}, in ${c.xu}, and the ${c.y}, in ${c.yu}, ${c.subj}. The line of best fit has equation y = ${m}x + ${b}, where x is the ${c.x} and y is the ${c.y}. Which of the following is the best interpretation of the y-intercept of the line of best fit?`,
    choices,
    correctIndex,
    steps: [S('Tung độ gốc là giá trị DỰ ĐOÁN của y khi x = 0.', `x = 0   ⇒   y = ${b}`), S('Diễn đạt bằng ngữ cảnh.')],
  };
});

/** Hệ số góc khi đơn vị trục là "nghìn đô la". */
const stat2SlopeUnits = mcqT('pd-d-stat2-slope-units', 'two_var_data', 'medium', (rng) => {
  const [xn, yn] = pick(rng, [['advertising expenses', 'revenue'], ['research spending', 'sales'], ['training costs', 'profit']] as const);
  const unit = pick(rng, ['thousands', 'millions']);
  const u = unit === 'thousands' ? 'one thousand' : 'one million';
  const n = pickInt(rng, 10, 60);
  const correct = `The expected increase in ${yn} for every ${u} dollar increase in ${xn}`;
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(`The expected increase in ${yn} for every one dollar increase in ${xn}`, 'dropped_unit_conversion', `Cả hai trục đo bằng ${unit} of dollars: một đơn vị trên trục là ${u} đô la.`),
      td(`The expected increase in ${xn} for every ${u} dollar increase in ${yn}`, 'swapped_rise_run', 'Đảo vai trò hai biến.'),
      td(`The expected ${yn} of a company that has no ${xn}`, 'swapped_slope_intercept', 'Đây là ý nghĩa của tung độ gốc.'),
    ],
    rng,
  );
  return {
    stem: `A scatterplot shows the relationship between ${yn} and ${xn} for ${n} companies, both measured in ${unit} of dollars, with ${xn} on the horizontal axis. The line of best fit has a positive slope. Which of the following is the best interpretation of the slope of the line of best fit?`,
    choices,
    correctIndex,
    steps: [S('Hệ số góc là thay đổi dự đoán của y khi x tăng MỘT đơn vị của trục.'), S(`Một đơn vị ở đây là ${u} đô la.`)],
  };
});

/** Hệ số góc: dấu (tăng/giảm) và "mỗi một đơn vị" (không phải mỗi 10). */
const stat2SlopeScaled = mcqT('pd-d-stat2-slope-scaled', 'two_var_data', 'hard', (rng) => {
  const [xn, xu, yn] = pick(rng, [['movie length', 'minute', 'ticket sales'], ['song length', 'second', 'number of streams'], ['class size', 'student', 'average test score'], ['hike length', 'kilometer', 'number of hikers']] as const);
  const up = rng() < 0.5;
  const m = (up ? 1 : -1) * pickInt(rng, 2, 9) / 10;
  const b = pickInt(rng, 40, 90);
  const phrase = (inc: boolean, per10: boolean) => `The expected ${inc ? 'increase' : 'decrease'} in ${yn} per ${per10 ? `10-${xu}` : xu} increase in ${xn}`;
  const { choices, correctIndex } = textMcq(
    phrase(up, false),
    [
      td(phrase(!up, false), 'sign_flip', `Hệ số góc ${m > 0 ? 'dương' : 'âm'} nên y ${m > 0 ? 'tăng' : 'giảm'} khi x tăng.`),
      td(phrase(up, true), null, 'Hệ số góc là thay đổi cho MỖI MỘT đơn vị của x, không phải mỗi 10 đơn vị.'),
      td(phrase(!up, true), null, 'Sai cả dấu lẫn đơn vị.'),
    ],
    rng,
  );
  return {
    stem: `A scatterplot shows ${xn}, in ${xu}s, on the horizontal axis and ${yn} on the vertical axis for several cases. The line of best fit is y = ${m}x + ${b}. Which of the following is the best interpretation of the slope of the line of best fit?`,
    choices,
    correctIndex,
    steps: [S(`Hệ số góc ${m}: mỗi khi x tăng 1 ${xu}, y dự đoán ${m > 0 ? 'tăng' : 'giảm'} ${Math.abs(m)}.`)],
  };
});

/** Hệ số góc từ hai điểm trên đường khớp nhất. */
const stat2SlopeTwoPoints = mcqT('pd-d-stat2-slope-two-points', 'two_var_data', 'medium', (rng) => {
  const x1 = pickInt(rng, 15, 20);
  const dx = pickInt(rng, 2, 10);
  const m = pickInt(rng, 2, 12);
  const y1 = 10 * pickInt(rng, 30, 36);
  const x2 = x1 + dx;
  const y2 = y1 + m * dx;
  const { choices, correctIndex } = numMcq(
    m,
    [
      nd(rat(dx, m * dx), 'swapped_rise_run', 'Lấy thay đổi x chia thay đổi y.'),
      nd(m * dx, 'stopped_too_early', 'Đây là thay đổi của y, chưa chia cho thay đổi của x.'),
      nd(rat(y2, x2), null, 'Chia tung độ cho hoành độ của một điểm.'),
    ],
    rng,
  );
  return {
    stem: `A scatterplot shows the total fat, in grams, and the number of calories in several cups of frozen yogurt. The line of best fit passes through the points (${x1}, ${y1}) and (${x2}, ${y2}). Based on the line of best fit, what is the expected increase in the number of calories for each additional gram of fat?`,
    choices,
    correctIndex,
    steps: [S('Hệ số góc = thay đổi của y chia thay đổi của x.', `frac(${y2} - ${y1},${x2} - ${x1}) = ${m}`)],
  };
});

/** Điểm nào được đường khớp nhất dự đoán tốt nhất (sai lệch nhỏ nhất)? */
const stat2ClosestToLine = mcqT('pd-d-stat2-closest-to-line', 'two_var_data', 'medium', (rng) => {
  const slope = pickInt(rng, 5, 12) / 100;
  const intercept = pickInt(rng, 20, 35);
  const xs = shuffleCopy([100, 150, 200, 250, 300, 350, 400, 450], rng).slice(0, 6).sort((a, b) => a - b);
  const bestI = pickInt(rng, 0, 5);
  const offs = xs.map((_, i) => (i === bestI ? 0.5 : (rng() < 0.5 ? -1 : 1) * pickInt(rng, 4, 14)));
  const pts = xs.map((x, i) => ({ x, y: Math.round((slope * x + intercept + offs[i]!) * 2) / 2 }));
  const resid = pts.map((p) => Math.abs(p.y - (slope * p.x + intercept)));
  const win = resid.indexOf(Math.min(...resid));
  const others = sample(rng, range(0, 5).filter((i) => i !== win), 3);
  const { choices, correctIndex } = numMcq(
    xs[win]!,
    others.map((i) => nd(xs[i]!, null, `Điểm tại x = ${xs[i]} cách đường thẳng ${resid[i]!.toFixed(1)} đơn vị — xa hơn.`)),
    rng,
  );
  return {
    stem: `The scatterplot shows the amount of fertilizer applied, in pounds per acre, and the yield, in bushels per acre, for ${xs.length} fields, along with the line of best fit. Which of the following is closest to the amount of fertilizer applied to the field whose yield is best predicted by the line of best fit?`,
    figure: { kind: 'scatterplot', caption: 'Fertilizer and yield', xLabel: 'Fertilizer (pounds per acre)', yLabel: 'Yield (bushels per acre)', points: pts, line: { slope, intercept }, xRange: [0, 500], yRange: [0, 90] },
    choices,
    correctIndex,
    steps: [S('Dự đoán tốt nhất là điểm nằm GẦN đường thẳng nhất (theo phương đứng).'), S('Đọc hoành độ của điểm đó.', `${xs[win]}`)],
  };
});

/** Điểm xa đường nhất: trục y là trung bình mỗi đơn vị → tổng = x·y. */
const stat2FarthestTotal = mcqT('pd-d-stat2-farthest-total', 'two_var_data', 'hard', (rng) => {
  const slope = -pickInt(rng, 3, 8);
  const intercept = pickInt(rng, 90, 110);
  const xs = [4, 5, 6, 7, 8, 9, 10];
  const far = pickInt(rng, 1, 5);
  const pts = xs.map((x, i) => ({ x, y: Math.round(slope * x + intercept + (i === far ? (rng() < 0.5 ? 25 : -25) : pickInt(rng, -8, 8))) }));
  const resid = pts.map((p) => Math.abs(p.y - (slope * p.x + intercept)));
  const win = resid.indexOf(Math.max(...resid));
  const p = pts[win]!;
  const { choices, correctIndex } = numMcq(
    p.x * p.y,
    [
      nd(p.y, 'stopped_too_early', 'Đây là số ghế TRUNG BÌNH mỗi nhà hàng; còn phải nhân với số nhà hàng.'),
      nd(Math.round(p.x * (slope * p.x + intercept)), null, 'Dùng giá trị trên đường thẳng thay vì điểm dữ liệu.'),
      nd(pts[(win + 1) % xs.length]!.x * pts[(win + 1) % xs.length]!.y, null, 'Chọn nhầm điểm.'),
    ],
    rng,
  );
  return {
    stem: 'The scatterplot shows the number of restaurants and the average number of seats per restaurant in the food courts of several malls, along with the line of best fit. According to the data, what is the total number of seats at the food court represented by the data point that is farthest from the line of best fit?',
    figure: { kind: 'scatterplot', caption: 'Food courts', xLabel: 'Number of restaurants', yLabel: 'Average seats per restaurant', points: pts, line: { slope, intercept }, xRange: [3, 11], yRange: [0, 120] },
    choices,
    correctIndex,
    steps: [S('Tìm điểm cách đường thẳng xa nhất (theo phương đứng).', `(${p.x}, ${p.y})`), S('Tổng số ghế = số nhà hàng × số ghế trung bình.', `${p.x} × ${p.y} = ${p.x * p.y}`)],
  };
});

/** Cách phân nhóm nào là ngẫu nhiên thật sự? */
const ASSIGN_CTX = [
  { trt: 'a new vaccine', alt: 'the standard treatment', who: 'allergy patients', trait: 'Patients older than 50', trait2: 'Patients who have more than one allergy' },
  { trt: 'a new study app', alt: 'printed flash cards', who: 'students', trait: 'Students with the highest grades', trait2: 'Students who live closest to the school' },
  { trt: 'a new fertilizer', alt: 'the usual fertilizer', who: 'garden plots', trait: 'Plots that get the most sunlight', trait2: 'Plots nearest the water supply' },
];

const stat2RandomAssignment = mcqT('pd-d-stat2-random-assignment', 'statistical_claims', 'medium', (rng) => {
  const c = pick(rng, ASSIGN_CTX);
  const n = 10 * pickInt(rng, 6, 60);
  const correct = `Each of the ${c.who} is given a random number, and those with an even number are assigned to ${c.trt}.`;
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(`${c.trait} are assigned to ${c.trt}.`, 'confused_correlation_causation', 'Phân nhóm theo một đặc điểm tạo ra khác biệt sẵn có giữa hai nhóm.'),
      td(`${c.trait2} are assigned to ${c.trt}.`, 'confused_correlation_causation', 'Phân nhóm theo một đặc điểm, không ngẫu nhiên.'),
      td(`The ${c.who} divide themselves into two groups, and a coin is tossed to decide which group receives ${c.trt}.`, null, 'Nhóm do tự chia nên có thể khác nhau từ đầu; tung đồng xu chỉ chọn nhóm, không chọn TỪNG cá thể ngẫu nhiên.'),
    ],
    rng,
  );
  return {
    stem: `Researchers selected a random sample of ${n} ${c.who} to test whether ${c.trt} works better than ${c.alt}. Some will receive ${c.trt} and the rest will receive ${c.alt}. Which of the following methods of assigning treatments is most likely to lead to a reliable conclusion about the effectiveness of ${c.trt}?`,
    choices,
    correctIndex,
    steps: [S('Muốn kết luận nhân quả, mỗi cá thể phải được PHÂN NGẪU NHIÊN vào nhóm; khi đó mọi yếu tố khác được "trung hoà".'), S('Chỉ cách gán số ngẫu nhiên cho từng cá thể đáp ứng điều đó.')],
  };
});

/** Hai tuần, trung bình mẫu ± sai số: kết luận hợp lý. */
const stat2MarginCompare = mcqT('pd-d-stat2-margin-compare', 'sample_inference', 'hard', (rng) => {
  const item = pick(rng, [['basketballs', 'air pressure', 'psi'], ['bags of flour', 'weight', 'kilograms'], ['bottles of juice', 'volume', 'liters']] as const);
  const m1 = pickInt(rng, 60, 90) / 10;
  const gap = pickInt(rng, 6, 12) / 10;
  const up = rng() < 0.5;
  const m2 = Math.round((up ? m1 + gap : m1 - gap) * 10) / 10;
  const e1 = pickInt(rng, 1, 2) / 10;
  const e2 = pickInt(rng, 1, 3) / 10;
  const [hi, lo] = m1 > m2 ? ['Week 1', 'Week 2'] : ['Week 2', 'Week 1'];
  const correct = `It is very likely that the mean ${item[1]} of all the ${item[0]} produced in ${hi} was greater than the mean ${item[1]} of all the ${item[0]} produced in ${lo}.`;
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(`The mean ${item[1]} of all the ${item[0]} produced in ${hi} was exactly ${Math.round(Math.abs(m1 - m2) * 10) / 10} ${item[2]} more than in ${lo}.`, 'ignored_margin_of_error', 'Chênh lệch của hai trung bình MẪU chỉ là ước lượng, kèm sai số.'),
      td(`Most of the ${item[0]} produced in Week 1 had a ${item[1]} under ${m1} ${item[2]}.`, 'ignored_margin_of_error', 'Trung bình và sai số không cho biết phần lớn từng sản phẩm nằm dưới hay trên mức nào.'),
      td(`The number of ${item[0]} in the Week 1 sample was greater than the number in the Week 2 sample.`, null, 'Sai số nhỏ hơn không nhất thiết do mẫu lớn hơn; độ biến thiên cũng ảnh hưởng.'),
    ],
    rng,
  );
  return {
    stem: `A manufacturer selects a random sample of its ${item[0]} each week to check the ${item[1]}. In Week 1, the sample had a mean ${item[1]} of ${m1} ${item[2]} with a margin of error of ${e1} ${item[2]}. In Week 2, the sample had a mean ${item[1]} of ${m2} ${item[2]} with a margin of error of ${e2} ${item[2]}. Based on these results, which of the following is a reasonable conclusion?`,
    choices,
    correctIndex,
    steps: [
      S('Mỗi tuần cho một khoảng hợp lý cho trung bình thật.', `Week 1: ${Math.round((m1 - e1) * 10) / 10} to ${Math.round((m1 + e1) * 10) / 10};   Week 2: ${Math.round((m2 - e2) * 10) / 10} to ${Math.round((m2 + e2) * 10) / 10}`),
      S('Hai khoảng không chồng lên nhau, nên rất có thể trung bình thật của hai tuần khác nhau theo đúng chiều đó.'),
    ],
  };
});

/** Nhóm nào cho sai số nhỏ nhất? — nhóm đồng nhất nhất. */
const VAR_CTX = [
  { q: 'the mean number of servings of vegetables eaten each day', tight: 'Students who are following the same daily meal plan', loose: ['Residents of the same city', 'Customers of a certain restaurant', 'Viewers of the same television show'] },
  { q: 'the mean number of hours slept each night', tight: 'Members of a sports team who follow the same training schedule', loose: ['Residents of the same apartment building', 'Shoppers at the same mall', 'Passengers on the same train'] },
  { q: 'the mean daily step count', tight: 'Mail carriers who walk the same delivery route', loose: ['Employees of a large company', 'Visitors to a public park', 'Readers of the same newspaper'] },
];

const stat2LeastVariability = mcqT('pd-d-stat2-least-variability', 'sample_inference', 'medium', (rng) => {
  const c = pick(rng, VAR_CTX);
  const n = 10 * pickInt(rng, 5, 60);
  const { choices, correctIndex } = textMcq(
    c.tight,
    c.loose.map((l) => td(l, 'ignored_margin_of_error', 'Nhóm này rất đa dạng nên độ biến thiên lớn, sai số lớn hơn.')),
    rng,
  );
  return {
    stem: `A student will survey a random sample of ${n} people to estimate ${c.q} for a certain group. Selecting the sample from which of the following groups would most likely give the smallest margin of error?`,
    choices,
    correctIndex,
    steps: [S('Với cùng cỡ mẫu, sai số phụ thuộc độ biến thiên của dữ liệu.'), S('Nhóm có thói quen giống nhau nhất sẽ ít biến thiên nhất.')],
  };
});

/** Diễn giải khoảng tin cậy 95%. */
const CI_CTX = [
  { pop: 'blue-spotted salamanders', wider: 'salamanders', what: 'tail length', unit: 'inches' },
  { pop: 'oak trees in a certain forest', wider: 'trees in the region', what: 'trunk diameter', unit: 'centimeters' },
  { pop: 'adult honeybees in a certain hive', wider: 'bees', what: 'body length', unit: 'millimeters' },
];

const stat2CiInterpret = mcqT('pd-d-stat2-ci-interpret', 'sample_inference', 'medium', (rng) => {
  const c = pick(rng, CI_CTX);
  const n = 10 * pickInt(rng, 4, 15);
  const lo = pickInt(rng, 3, 30);
  const hi = lo + pickInt(rng, 1, 4);
  const correct = `The true mean ${c.what} of all ${c.pop} is likely between ${lo} and ${hi} ${c.unit}.`;
  const { choices, correctIndex } = textMcq(
    correct,
    [
      td(`95% of all ${c.pop} have a ${c.what} between ${lo} and ${hi} ${c.unit}.`, 'ignored_margin_of_error', 'Khoảng tin cậy nói về TRUNG BÌNH, không nói về từng cá thể.'),
      td(`95% of all ${c.wider} have a ${c.what} between ${lo} and ${hi} ${c.unit}.`, 'ignored_margin_of_error', 'Sai cả hai: nói về cá thể và mở rộng ra ngoài tổng thể được lấy mẫu.'),
      td(`The true mean ${c.what} of all ${c.wider} is likely between ${lo} and ${hi} ${c.unit}.`, 'ignored_margin_of_error', 'Mẫu chỉ lấy từ một nhóm, không khái quát cho mọi loài/cá thể.'),
    ],
    rng,
  );
  return {
    stem: `A biologist selects ${n} ${c.pop} at random and finds that the mean ${c.what} has a 95% confidence interval of ${lo} to ${hi} ${c.unit}. Which of the following conclusions is the most appropriate based on the confidence interval?`,
    choices,
    correctIndex,
    steps: [S('Khoảng tin cậy ước lượng TRUNG BÌNH THẬT của đúng tổng thể đã lấy mẫu.'), S('Nó không nói gì về từng cá thể, cũng không áp cho tổng thể rộng hơn.')],
  };
});

const CH26: MathTemplate[] = [
  stat2CountAboveLine,
  stat2LinePredict,
  stat2BestSurvey,
  stat2PollDifference,
  stat2InterceptMeaning,
  stat2SlopeUnits,
  stat2SlopeScaled,
  stat2SlopeTwoPoints,
  stat2ClosestToLine,
  stat2FarthestTotal,
  stat2RandomAssignment,
  stat2MarginCompare,
  stat2LeastVariability,
  stat2CiInterpret,
];


// ================================================================ Chương 27 — Thể tích

/** Số hữu tỉ: thập phân nếu hữu hạn, không thì phân số. */
function niceNum(v: MathValue): string {
  let d = v.den;
  let e2 = 0;
  let e5 = 0;
  while (d % 2 === 0) {
    d /= 2;
    e2 += 1;
  }
  while (d % 5 === 0) {
    d /= 5;
    e5 += 1;
  }
  return d === 1 && Math.max(e2, e5) <= 3 ? decText(v) : fx(v);
}

/** Hình trụ bị cắt thành hai mảnh bằng nhau: thể tích một mảnh. */
const volCylinderHalf = mcqT('pd-d-vol-cylinder-half', 'area_volume', 'easy', (rng) => {
  const d = 2 * pickInt(rng, 1, 10);
  const h = pickInt(rng, 2, 20);
  const r = d / 2;
  const half = rat(r * r * h, 2);
  const { choices, correctIndex } = textMcq(
    piText(half),
    [
      td(piText(rat(r * r * h)), 'stopped_too_early', 'Đây là thể tích cả khối; mỗi mảnh chỉ là một nửa.'),
      td(piText(rat(d * d * h, 2)), 'used_diameter_not_radius', 'Dùng đường kính thay cho bán kính.'),
      td(piText(rat(r * h, 2)), 'forgot_square_root', 'Quên bình phương bán kính.'),
      td(piText(rat(r * r * h, 4)), null, 'Chia đôi hai lần.'),
    ],
    rng,
  );
  return {
    stem: `A solid right circular cylinder has a base diameter of ${d} centimeters and a height of ${h} centimeters. It is cut along a slanted plane into two congruent pieces. What is the volume, in cubic centimeters, of one of the pieces?`,
    choices,
    correctIndex,
    steps: [
      S('Thể tích hình trụ = diện tích đáy × chiều cao; bán kính bằng nửa đường kính.', `π(${r})^2(${h}) = ${piText(rat(r * r * h))}`),
      S('Hai mảnh bằng nhau nên mỗi mảnh là một nửa.', piText(half)),
    ],
  };
});

/** Hộp đáy vuông: biết diện tích đáy và thể tích → diện tích toàn phần. */
const volBoxSurface = mcqT('pd-d-vol-box-surface', 'area_volume', 'medium', (rng) => {
  const s = pickInt(rng, 2, 12);
  const h = pickInt(rng, 2, 15);
  const B = s * s;
  const V = B * h;
  const SA = 2 * B + 4 * s * h;
  const { choices, correctIndex } = numMcq(
    SA,
    [
      nd(B + 4 * s * h, 'stopped_too_early', 'Chỉ tính một đáy; đề yêu cầu cả đáy trên lẫn đáy dưới.'),
      nd(4 * s * h, 'stopped_too_early', 'Chỉ tính bốn mặt bên.'),
      nd(2 * B + 2 * s * h, null, 'Chỉ tính hai mặt bên.'),
    ],
    rng,
  );
  return {
    stem: `A rectangular box has a square base with an area of ${B} square inches. The volume of the box is ${V} cubic inches. How many square inches of wrapping paper are needed to exactly cover all faces of the box, including the top and the bottom?`,
    choices,
    correctIndex,
    steps: [
      S('Cạnh đáy và chiều cao.', `s = sqrt(${B}) = ${s},   h = frac(${V},${B}) = ${h}`),
      S('Diện tích toàn phần: hai đáy và bốn mặt bên.', `2(${B}) + 4(${s})(${h}) = ${SA}`),
    ],
  };
});

/** Hình lập phương, biểu thức theo chữ: diện tích mặt ↔ thể tích ↔ cạnh. */
const volCubeSymbolic = mcqT('pd-d-vol-cube-symbolic', 'area_volume', 'medium', (rng) => {
  const k = pickInt(rng, 1, 15);
  const a = pick(rng, ['a', 'b', 'x', 't']);
  const mode = pick(rng, ['sa-to-v', 'v-to-sa', 'sa-to-edge'] as const);
  const term = (c: number, p: number) => `${c === 1 ? '' : c}${a}${p === 1 ? '' : `^${p}`}`;
  const SA = term(6 * k * k, 2);
  const V = term(k ** 3, 3);
  const E = term(k, 1);
  const given = mode === 'v-to-sa' ? `volume ${V}` : `surface area ${SA}`;
  const correct = mode === 'sa-to-v' ? V : mode === 'v-to-sa' ? SA : E;
  const pool = [term(k ** 3, 2), term(k * k, 3), term(6 * k * k, 3), term(k * k, 2), term(6 * k, 1), term(k ** 3, 3), term(6 * k * k, 2), term(k, 1), term(4 * k * k, 2), term(2 * k, 1)].filter(
    (t, i, arr) => t !== correct && arr.indexOf(t) === i,
  );
  const { choices, correctIndex } = textMcq(
    correct,
    pool.slice(0, 5).map((t) => td(t, null, 'Nhớ: diện tích toàn phần = 6 × cạnh², thể tích = cạnh³. Tìm cạnh trước.')),
    rng,
  );
  return {
    stem: `What is the ${mode === 'sa-to-v' ? 'volume' : mode === 'v-to-sa' ? 'surface area' : 'edge length'} of a cube with ${given}?`,
    choices,
    correctIndex,
    steps: [
      S('Tìm cạnh của hình lập phương.', mode === 'v-to-sa' ? `s^3 = ${V}   ⇒   s = ${E}` : `6s^2 = ${SA}   ⇒   s^2 = ${term(k * k, 2)}   ⇒   s = ${E}`),
      S('Tính đại lượng cần tìm.', correct),
    ],
  };
});

/** Thời gian bơm đầy tỉ lệ với thể tích. */
const volFillTime = mcqT('pd-d-vol-fill-time', 'area_volume', 'medium', (rng) => {
  const r1 = pickInt(rng, 2, 6);
  const h1 = pickInt(rng, 4, 10);
  const r2 = r1 + pickInt(rng, 1, 4);
  const h2 = pickInt(rng, 4, 12);
  const t = pickInt(rng, 2, 6);
  const V1 = r1 * r1 * h1;
  const V2 = r2 * r2 * h2;
  const ans = rat(t * V2, V1);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(rat(t * r2 * h2, r1 * h1), 'forgot_square_root', 'Quên bình phương bán kính khi so thể tích.'),
      nd(rat(t * V1, V2), 'inverted_fraction', 'Lật ngược tỉ số thể tích.'),
      nd(rat(t * h2, h1), null, 'Chỉ so chiều cao, bỏ qua bán kính.'),
    ],
    rng,
    niceNum,
  );
  return {
    stem: `A cylindrical water tank with a base radius of ${r1} feet and a height of ${h1} feet can be filled in ${t} hours. At the same rate, how many hours will it take to fill a cylindrical tank with a base radius of ${r2} feet and a height of ${h2} feet?`,
    choices,
    correctIndex,
    steps: [
      S('Cùng tốc độ bơm nên thời gian tỉ lệ với thể tích (π triệt tiêu).', `frac(${r2}^2 × ${h2},${r1}^2 × ${h1}) = frac(${V2},${V1})`),
      S('Nhân với thời gian ban đầu.', `${t} × frac(${V2},${V1}) = ${niceNum(ans)}`),
    ],
  };
});

/** Hộp trụ vừa khít n quả bóng: thể tích hộp. */
const volBallsCylinder = mcqT('pd-d-vol-balls-cylinder', 'area_volume', 'medium', (rng) => {
  const n = pickInt(rng, 2, 6);
  const r = pickInt(rng, 1, 30);
  const V = rat(2 * n * r ** 3);
  const { choices, correctIndex } = textMcq(
    piText(V),
    [
      td(piText(rat(4 * n * r ** 3, 3)), null, 'Đây là tổng thể tích các quả bóng, không phải thể tích hộp.'),
      td(piText(rat(n * r ** 3)), 'used_diameter_not_radius', 'Lấy chiều cao bằng n bán kính; mỗi quả bóng chiếm một ĐƯỜNG KÍNH.'),
      td(piText(rat(8 * n * r ** 3)), 'used_diameter_not_radius', 'Dùng đường kính làm bán kính đáy.'),
      td(piText(rat(2 * n * r * r)), 'forgot_square_root', 'Tính sai luỹ thừa của bán kính.'),
    ],
    rng,
  );
  return {
    stem: `A container in the shape of a right circular cylinder is just large enough to hold ${n} balls stacked in a single column, each with a radius of ${r} inches. If the container were emptied and filled to the top with water, what would be the volume of water, in cubic inches, that it holds?`,
    choices,
    correctIndex,
    steps: [
      S('Bán kính đáy bằng bán kính quả bóng; chiều cao bằng n đường kính.', `r = ${r},   h = ${n} × ${2 * r} = ${2 * n * r}`),
      S('Thể tích hình trụ.', `π(${r})^2(${2 * n * r}) = ${piText(V)}`),
    ],
  };
});

/** Thả khối đặc vào bể: mực nước dâng = thể tích / diện tích đáy. Điền số. */
const volWaterRise = gridT('pd-d-vol-water-rise', 'area_volume', 'medium', (rng) => {
  const l = 10 * pickInt(rng, 4, 10);
  const w = 5 * pickInt(rng, 4, 8);
  const H = pickInt(rng, 25, 40);
  const depth = H - pickInt(rng, 8, 12);
  const rise = pick(rng, [rat(1, 2), rat(1), rat(3, 2), rat(2), rat(5, 2), rat(3), rat(7, 2), rat(4)]);
  const V = toDecimal(mulValue(rise, rat(l * w)));
  return {
    stem: `An aquarium has a rectangular base that measures ${l} inches by ${w} inches and a height of ${H} inches. The aquarium is filled with water to a depth of ${depth} inches. If a solid block with a volume of ${V} cubic inches is completely submerged in the aquarium, by how many inches does the water level rise?`,
    answer: rise,
    steps: [
      S('Nước dâng lên chiếm đúng thể tích của khối: một lớp hình hộp có đáy bằng đáy bể.', `${l} × ${w} × Δh = ${V}`),
      S('Giải ra.', `Δh = frac(${V},${l * w}) = ${niceNum(rise)}`),
    ],
  };
});

/** Khối lập phương n×n×n sơn ngoài rồi cắt: đếm khối nhỏ theo số mặt sơn. */
const volPaintedCube = mcqT('pd-d-vol-painted-cube', 'area_volume', 'hard', (rng) => {
  const n = pickInt(rng, 3, 15);
  const s = pickInt(rng, 1, 4);
  const faces = pick(rng, [0, 0, 1, 2, 3] as const);
  const count = (f: number) => (f === 0 ? (n - 2) ** 3 : f === 1 ? 6 * (n - 2) ** 2 : f === 2 ? 12 * (n - 2) : 8);
  const ans = count(faces);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      ...[0, 1, 2, 3].filter((f) => f !== faces).map((f) => nd(count(f), null, `Đây là số khối có ${f} mặt sơn.`)),
      nd(faces === 0 ? (n - 1) ** 3 : n ** 3 - (n - 2) ** 3, 'off_by_one', 'Đếm lệch một lớp ở mỗi chiều.'),
    ],
    rng,
  );
  const what = faces === 0 ? 'do not have any paint on them' : faces === 1 ? 'have paint on exactly one face' : faces === 2 ? 'have paint on exactly two faces' : 'have paint on exactly three faces';
  return {
    stem: `A cube with an edge length of ${n * s} inches is painted on all six faces. The cube is then cut into smaller cubes, each with an edge length of ${s} inch${s === 1 ? '' : 'es'}. How many of the small cubes ${what}?`,
    choices,
    correctIndex,
    steps: [
      S('Mỗi cạnh chia thành n khối nhỏ.', `n = frac(${n * s},${s}) = ${n}`),
      S('Không mặt sơn: lõi bên trong; một mặt: phần giữa mỗi mặt; hai mặt: dọc các cạnh; ba mặt: tám góc.', `${ans}`),
    ],
  };
});

/** Hộp lập phương không nắp đựng đầy khối nhỏ: bao nhiêu khối chạm hộp? */
const volOpenBoxTouching = mcqT('pd-d-vol-open-box-touching', 'area_volume', 'hard', (rng) => {
  const c = pickInt(rng, 1, 4);
  const n = pickInt(rng, 3, 15);
  const L = n * c;
  const open = rng() < 0.6;
  const askTouch = rng() < 0.7;
  const inner = open ? (n - 2) ** 2 * (n - 1) : (n - 2) ** 3;
  const ans = askTouch ? n ** 3 - inner : inner;
  const other = open ? (n - 2) ** 3 : (n - 2) ** 2 * (n - 1);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(askTouch ? n ** 3 - other : other, null, open ? 'Coi hộp có nắp; hộp để hở phía trên nên lớp trên cùng không chạm nắp nào.' : 'Coi hộp không có nắp; hộp này đóng kín nên lớp trên cùng cũng chạm hộp.'),
      nd(askTouch ? (open ? 5 : 6) * n * n : n ** 3 - (open ? 5 : 6) * n * n, null, 'Cộng số khối trên từng mặt nhưng đếm trùng các khối ở cạnh.'),
      nd(askTouch ? inner : n ** 3 - inner, null, askTouch ? 'Đây là số khối KHÔNG chạm hộp.' : 'Đây là số khối chạm hộp.'),
      nd(n ** 3, null, 'Đây là tổng số khối.'),
    ],
    rng,
  );
  return {
    stem: `A box ${open ? 'with an open top' : 'with a closed lid'} is shaped like a cube, and each of its inside edges is ${L} inches long. The box is completely filled with identical cubes that measure ${c} inch${c === 1 ? '' : 'es'} on each edge. How many of these cubes are ${askTouch ? '' : 'not '}touching the box?`,
    choices,
    correctIndex,
    steps: [
      S('Mỗi chiều xếp được n khối; tổng số khối.', `n = ${n},   n^3 = ${n ** 3}`),
      S(open ? 'Khối KHÔNG chạm hộp: không sát bốn mặt bên và đáy (mặt trên để hở).' : 'Khối KHÔNG chạm hộp: lõi bên trong, bỏ một lớp ở cả sáu mặt.', `${open ? `(${n} - 2)^2 × (${n} - 1)` : `(${n} - 2)^3`} = ${inner}`),
      S(askTouch ? 'Lấy hiệu.' : 'Đó chính là đáp án.', `${ans}`),
    ],
  };
});

/** Khối hộp a×b×c sơn ngoài: số khối đơn vị có đúng một (hai, không) mặt sơn. */
const volBlockFaces = mcqT('pd-d-vol-block-faces', 'area_volume', 'hard', (rng) => {
  const a = pickInt(rng, 3, 8);
  const b = pickInt(rng, 3, 9);
  const c = pickInt(rng, 3, 10);
  const faces = pick(rng, [1, 1, 2, 0] as const);
  const one = 2 * ((a - 2) * (b - 2) + (b - 2) * (c - 2) + (a - 2) * (c - 2));
  const two = 4 * (a - 2 + (b - 2) + (c - 2));
  const zero = (a - 2) * (b - 2) * (c - 2);
  const ans = faces === 1 ? one : faces === 2 ? two : zero;
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd(faces === 1 ? 2 * (a * b + b * c + a * c) : faces === 2 ? 4 * (a + b + c) : a * b * c - 2 * (a * b + b * c + a * c), null, 'Không trừ phần ở cạnh và góc (các khối có nhiều mặt sơn hơn).'),
      nd(faces === 1 ? two : one, null, faces === 1 ? 'Đây là số khối có đúng hai mặt sơn.' : 'Đây là số khối có đúng một mặt sơn.'),
      nd(faces === 0 ? (a - 1) * (b - 1) * (c - 1) : 8, null, faces === 0 ? 'Chỉ bỏ một lớp ở mỗi chiều; phải bỏ lớp ở CẢ HAI phía.' : 'Đây là số khối ở góc (ba mặt sơn).'),
    ],
    rng,
  );
  const what = faces === 1 ? 'exactly one face' : faces === 2 ? 'exactly two faces' : 'no faces';
  return {
    stem: `A ${a} × ${b} × ${c} solid block is made up of 1 × 1 × 1 unit cubes. The outside surface of the block is painted. How many unit cubes have paint on ${what}?`,
    choices,
    correctIndex,
    steps: [
      S(faces === 1 ? 'Khối có đúng một mặt sơn nằm ở phần "trong" của mỗi mặt: bỏ hàng ngoài cùng ở mỗi phía.' : faces === 2 ? 'Khối có đúng hai mặt sơn nằm dọc 12 cạnh, trừ hai khối góc ở mỗi cạnh.' : 'Khối không sơn là lõi bên trong: bỏ một lớp ở cả hai phía mỗi chiều.'),
      S('Tính.', `${ans}`),
    ],
  };
});

/** Kem ốc quế: hình nón (biết đường sinh) + nửa hình cầu. */
const volConeHemisphere = mcqT('pd-d-vol-cone-hemisphere', 'area_volume', 'hard', (rng) => {
  const [p0, q0, s0] = pick(rng, TRIPLES);
  const [r0, h0] = rng() < 0.5 ? [p0, q0] : [q0, p0];
  const k = pickInt(rng, 1, 12);
  const [r, h, s] = [r0 * k, h0 * k, s0 * k];
  const treat = pick(rng, ['frozen yogurt', 'ice cream', 'gelato']);
  const cone = rat(r * r * h, 3);
  const hemi = rat(2 * r ** 3, 3);
  const total = addValue(cone, hemi);
  const { choices, correctIndex } = textMcq(
    piText(total),
    [
      td(piText(addValue(rat(r * r * s, 3), hemi)), null, 'Dùng đường sinh làm chiều cao; chiều cao phải tính bằng Pythagoras.'),
      td(piText(addValue(cone, rat(4 * r ** 3, 3))), null, 'Cộng cả hình cầu; phần kem phía trên chỉ là NỬA hình cầu.'),
      td(piText(cone), 'stopped_too_early', 'Quên phần nửa hình cầu.'),
      td(piText(addValue(rat(r * r * h), hemi)), null, 'Quên hệ số 1/3 của hình nón.'),
    ],
    rng,
  );
  return {
    stem: `A cone-shaped cup is filled with ${treat}, and a hemisphere of ${treat} sits on top of it. The right circular cone has a base radius of ${r} centimeters and a slant height of ${s} centimeters, and the hemisphere has the same radius. What is the total volume of ${treat}, in cubic centimeters?`,
    choices,
    correctIndex,
    steps: [
      S('Chiều cao hình nón theo Pythagoras.', `h = sqrt(${s}^2 - ${r}^2) = ${h}`),
      S('Thể tích nón và nửa cầu.', `frac(1,3)π(${r})^2(${h}) + frac(2,3)π(${r})^3`),
      S('Cộng lại.', piText(total)),
    ],
  };
});

/** Thùng gỗ có thành và đáy dày t, không nắp: sức chứa khối lập phương đơn vị. */
const volCrateInside = mcqT('pd-d-vol-crate-inside', 'area_volume', 'medium', (rng) => {
  const t = pickInt(rng, 1, 2);
  const L = pickInt(rng, 6, 14) + 2 * t;
  const W = pickInt(rng, 4, 10) + 2 * t;
  const H = pickInt(rng, 2, 8) + t;
  const ans = (L - 2 * t) * (W - 2 * t) * (H - t);
  const { choices, correctIndex } = numMcq(
    ans,
    [
      nd((L - 2 * t) * (W - 2 * t) * (H - 2 * t), null, 'Trừ bề dày ở cả nắp; thùng không có nắp nên chiều cao chỉ trừ một lần.'),
      nd((L - t) * (W - t) * (H - t), null, 'Chỉ trừ bề dày một bên ở mỗi chiều ngang.'),
      nd(L * W * H, null, 'Dùng kích thước bên ngoài.'),
    ],
    rng,
  );
  return {
    stem: `A crate is ${L} inches long, ${W} inches wide, and ${H} inches high, measured on the outside. It has no top, and its floor and four walls are each ${t} inch${t === 1 ? '' : 'es'} thick. How many 1-inch cubical blocks can fit inside the crate?`,
    choices,
    correctIndex,
    steps: [
      S('Kích thước bên trong: trừ hai lớp thành ở mỗi chiều ngang, một lớp đáy ở chiều cao.', `${L - 2 * t} × ${W - 2 * t} × ${H - t}`),
      S('Nhân lại.', `${ans}`),
    ],
  };
});

/** Cầu thang bê tông k bậc bằng nhau: thể tích × khối lượng riêng. */
const volStaircaseMass = mcqT('pd-d-vol-staircase-mass', 'area_volume', 'hard', (rng) => {
  const k = pickInt(rng, 2, 4);
  const L = k * pickInt(rng, 1, 3);
  const W = pickInt(rng, 2, 8);
  const rise = pick(rng, [rat(1, 5), rat(1, 4), rat(3, 10), rat(1, 2)]);
  const dens = 10 * pickInt(rng, 10, 25);
  // Thể tích = W × (L/k) × rise × (1 + 2 + … + k)
  const vol = mulValue(mulValue(rat(W * L, k), rise), rat((k * (k + 1)) / 2));
  const mass = mulValue(vol, rat(dens));
  const solid = mulValue(mulValue(rat(W * L), rise), rat(k));
  const { choices, correctIndex } = numMcq(
    mass,
    [
      nd(mulValue(solid, rat(dens)), null, 'Coi cầu thang là một khối hộp đặc cao bằng bậc trên cùng.'),
      nd(mulValue(mulValue(mulValue(rat(W * L, k), rise), rat(k)), rat(dens)), null, 'Coi mọi bậc chỉ cao một bậc.'),
      nd(divValue(vol, rat(dens)), 'inverted_fraction', 'Chia cho khối lượng riêng thay vì nhân.'),
    ],
    rng,
    (v) => niceNum(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
  );
  return {
    stem: `A concrete staircase is built on a rectangular base that is ${L} meters long and ${W} meters wide. The staircase has ${k} steps of equal dimensions; each step has a rise of ${decText(rise)} meter and extends the full width. If the density of concrete is ${dens} kilograms per cubic meter, what is the mass of the concrete staircase, in kilograms? (Density is mass divided by volume.)`,
    choices,
    correctIndex,
    steps: [
      S(`Chia chiều dài thành ${k} phần bằng nhau; cột ở phần thứ i cao i bậc.`, `mỗi phần dài ${niceNum(rat(L, k))}`),
      S('Cộng thể tích các cột.', `${W} × ${niceNum(rat(L, k))} × ${decText(rise)} × (${range(1, k).join(' + ')}) = ${niceNum(vol)}`),
      S('Nhân với khối lượng riêng.', `${niceNum(vol)} × ${dens} = ${niceNum(mass)}`),
    ],
  };
});

const CH27: MathTemplate[] = [
  volCylinderHalf,
  volBoxSurface,
  volCubeSymbolic,
  volFillTime,
  volBallsCylinder,
  volWaterRise,
  volPaintedCube,
  volOpenBoxTouching,
  volBlockFaces,
  volConeHemisphere,
  volCrateInside,
  volStaircaseMass,
];

export const PANDA_D_TEMPLATES: readonly MathTemplate[] = [
  ...CH14,
  ...CH15,
  ...CH16,
  ...CH17,
  ...CH18,
  ...CH19,
  ...CH20,
  ...CH21,
  ...CH22,
  ...CH23,
  ...CH24,
  ...CH25,
  ...CH26,
  ...CH27,
];
