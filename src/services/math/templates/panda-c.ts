import { buildChoices, buildTextChoices } from '../choices';
import { coefTerm, linearSide, pick, pickInt, pickNonZeroInt, signedCoefTerm, signedTerm, twoVarSide } from '../authoring';
import { formatValueMath, rat } from '@/lib/math/value';
import type {
  MathDifficulty,
  MathErrorTag,
  MathFigureSpec,
  MathSkill,
  MathSolutionStep,
  MathTemplate,
  MathValue,
} from '@/lib/math/types';

/**
 * Bộ dạng câu "pd-c-" — dạng bài BÁM SÁCH cho chương 1 – 13 của Lộ trình SAT
 * Math (`/sat/lo-trinh`): mỗi template ứng với một kiểu bài tập cuối chương của
 * giáo trình (cùng cái cho, cùng cái hỏi, cùng phép biến đổi và cùng cái bẫy),
 * nhưng số, tên và bối cảnh là của app. Không câu chữ nào chép từ sách.
 *
 * Cùng nguyên tắc với `panda-a.ts`: CHỌN ĐÁP ÁN TRƯỚC rồi dựng đề ngược, mọi
 * phép bốc số không có vòng thử lại (bộ tham số nào cần ràng buộc thì dựng sẵn
 * thành danh sách ở mức module rồi bốc thẳng), mỗi nhiễu là kết quả của MỘT
 * sai lầm và luôn có `note` nói rõ sai ở đâu.
 *
 * Bộ kiểm chứng ở `panda-c.test.ts` đọc ngược số từ ĐỀ ĐÃ IN rồi tự giải lại.
 */

// ============================================================ tiện ích soạn đề

type Cand = { value: MathValue; errorTag: MathErrorTag | null; note?: string };
type TCand = { display: string; errorTag: MathErrorTag | null; note?: string };

/** Một nhiễu số. */
const w = (value: MathValue | number, note: string, errorTag: MathErrorTag | null = null): Cand => ({
  value: typeof value === 'number' ? toRat(value) : value,
  errorTag,
  note,
});

/** Một nhiễu chữ / biểu thức. */
const wt = (display: string, note: string, errorTag: MathErrorTag | null = null): TCand => ({ display, errorTag, note });

/** Một bước giải. Phần lời là tiếng Việt, KHÔNG chứa markup toán. */
const S = (text: string, expr?: string): MathSolutionStep => (expr === undefined ? { text } : { text, expr });

/** Số thập phân hữu hạn → phân số chính xác (tối đa 6 chữ số sau dấu phẩy). */
function toRat(n: number): MathValue {
  if (Number.isInteger(n)) return rat(n);
  return rat(Math.round(n * 1e6), 1e6);
}

/** In số gọn: bỏ đuôi 0, không có sai số dấu phẩy động, không có "-0". */
function num(n: number): string {
  const r = Math.round(n * 1e6) / 1e6;
  if (Object.is(r, -0) || r === 0) return '0';
  return String(r);
}

/** In số có dấu phẩy ngăn nghìn (như đề thật). */
function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  const [i, f] = String(r).split('.');
  const withSep = (i ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return f ? `${withSep}.${f.length === 1 ? `${f}0` : f}` : withSep;
}

/** Số âm trong phép tính thì bọc ngoặc. */
const par = (n: number) => (n < 0 ? `(${num(n)})` : num(n));

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/** Phân số tối giản dạng markup, hoặc số nguyên. */
function fr(n: number, d: number): string {
  return formatValueMath(rat(n, d));
}

type NumBuild = {
  stem: string;
  correct: MathValue | number;
  wrong: Cand[];
  steps: MathSolutionStep[];
  figure?: MathFigureSpec;
  fmt?: (v: MathValue) => string;
};
type TextBuild = { stem: string; correct: string; wrong: TCand[]; steps: MathSolutionStep[]; figure?: MathFigureSpec };
type GridBuild = { stem: string; answer: MathValue | number; steps: MathSolutionStep[]; figure?: MathFigureSpec };

function mcqNum(slug: string, skill: MathSkill, difficulty: MathDifficulty, fn: (rng: () => number) => NumBuild): MathTemplate {
  return {
    slug,
    skill,
    difficulty,
    format: 'mcq',
    build: (rng) => {
      const b = fn(rng);
      const correct = typeof b.correct === 'number' ? toRat(b.correct) : b.correct;
      const { choices, correctIndex } = buildChoices(correct, b.wrong, rng, b.fmt);
      return { format: 'mcq', stem: b.stem, choices, correctIndex, steps: b.steps, ...(b.figure ? { figure: b.figure } : {}) };
    },
  };
}

function mcqText(slug: string, skill: MathSkill, difficulty: MathDifficulty, fn: (rng: () => number) => TextBuild): MathTemplate {
  return {
    slug,
    skill,
    difficulty,
    format: 'mcq',
    build: (rng) => {
      const b = fn(rng);
      const { choices, correctIndex } = buildTextChoices(b.correct, b.wrong, rng);
      return { format: 'mcq', stem: b.stem, choices, correctIndex, steps: b.steps, ...(b.figure ? { figure: b.figure } : {}) };
    },
  };
}

function grid(slug: string, skill: MathSkill, difficulty: MathDifficulty, fn: (rng: () => number) => GridBuild): MathTemplate {
  return {
    slug,
    skill,
    difficulty,
    format: 'grid_in',
    build: (rng) => {
      const b = fn(rng);
      const answer = typeof b.answer === 'number' ? toRat(b.answer) : b.answer;
      return { format: 'grid_in', stem: b.stem, answer, steps: b.steps, ...(b.figure ? { figure: b.figure } : {}) };
    },
  };
}

/** `x^3`, `x`, `1` — luỹ thừa nguyên dương gọn. */
function pw(v: string, e: number): string {
  if (e === 0) return '1';
  if (e === 1) return v;
  return `${v}^${e}`;
}

const VARS = ['x', 'y', 't', 'w'] as const;

// ============================================================ Chương 1: luỹ thừa & căn

const ch1: MathTemplate[] = [
  mcqNum('pd-c-neg-frac-exp', 'nonlinear_equations', 'easy', (rng) => {
    const n = pick(rng, [2, 3]);
    const k = n === 2 ? pickInt(rng, 2, 15) : pickInt(rng, 2, 9);
    const v = pick(rng, ['a', 'b', 'p', 'm']);
    if (pick(rng, [true, false])) {
      return {
        stem: `If ${v}^(-frac(1,${n})) = frac(1,${k}), what is the value of ${v}?`,
        correct: k ** n,
        wrong: [
          w(rat(1, k ** n), 'Lật hai lần: số mũ âm đã lật phân số một lần rồi, kết quả là số lớn hơn 1.', 'inverted_fraction'),
          w(-(k ** n), 'Số mũ âm không làm kết quả âm.', 'sign_flip'),
          w(k * n, `Nhân ${k} với ${n} thay vì nâng lên luỹ thừa ${n}.`),
        ],
        steps: [
          S('Số mũ âm nghĩa là nghịch đảo: lật cả hai vế.', `${v}^(frac(1,${n})) = ${k}`),
          S(`Nâng hai vế lên luỹ thừa ${n}.`, `${v} = ${k}^${n} = ${k ** n}`),
        ],
      };
    }
    return {
      stem: `If ${v}^(-frac(1,${n})) = ${k}, what is the value of ${v}?`,
      correct: rat(1, k ** n),
      wrong: [
        w(-(k ** n), 'Số mũ âm không làm kết quả âm — nó chỉ lật thành nghịch đảo.', 'sign_flip'),
        w(k ** n, 'Bỏ mất dấu trừ ở số mũ: số mũ âm nghĩa là phải lấy nghịch đảo.'),
        w(rat(1, k * n), `Nhân ${k} với ${n} thay vì nâng lên luỹ thừa ${n}.`),
      ],
      steps: [
        S('Số mũ âm nghĩa là nghịch đảo của luỹ thừa dương.', `frac(1,${v}^(frac(1,${n}))) = ${k}`),
        S('Lật cả hai vế.', `${v}^(frac(1,${n})) = frac(1,${k})`),
        S(`Nâng hai vế lên luỹ thừa ${n} để khử số mũ một phần ${n}.`, `${v} = (frac(1,${k}))^${n} = frac(1,${k ** n})`),
      ],
    };
  }),

  mcqNum('pd-c-power-of-one-sum', 'equivalent_expressions', 'easy', (rng) => {
    if (pick(rng, [true, false])) {
      const s = pick(rng, [2, 3, 4, 5]);
      const m = pickInt(rng, 6, 40);
      return {
        stem: `Let n = 1^${s} + 1^${2 * s} + 1^${3 * s} + ... + 1^${s * m}. What is the value of n?`,
        correct: m,
        wrong: [
          w(s * m, `Lấy số mũ cuối cùng ${s * m} làm tổng. Mỗi số hạng đều bằng 1, nên tổng là SỐ số hạng.`),
          w(m + 1, 'Đếm dư một số hạng. Số mũ đi từ 1 lần tới đúng m lần bước nhảy.', 'off_by_one'),
          w(m - 1, 'Đếm thiếu một số hạng.', 'off_by_one'),
        ],
        steps: [
          S('Một mũ bao nhiêu cũng bằng 1, nên mỗi số hạng bằng 1.'),
          S(`Số mũ là ${s}, ${2 * s}, ${3 * s}, …, ${s * m} — tức là ${s} nhân lần lượt 1, 2, …, ${m}: có ${m} số hạng.`, `n = ${m} × 1 = ${m}`),
        ],
      };
    }
    const N = pickInt(rng, 7, 60);
    const val = N % 2 === 0 ? 0 : -1;
    return {
      stem: `Let n = (-1)^1 + (-1)^2 + (-1)^3 + ... + (-1)^${N}. What is the value of n?`,
      correct: val,
      wrong: [
        w(N, 'Coi mọi số hạng đều bằng 1. Luỹ thừa lẻ của −1 bằng −1.', 'sign_flip'),
        w(-N, 'Coi mọi số hạng đều bằng −1. Luỹ thừa chẵn của −1 bằng 1.', 'sign_flip'),
        w(val === 0 ? 1 : 0, val === 0 ? 'Số số hạng chẵn nên các cặp (−1) + 1 triệt tiêu hết, không dư số nào.' : 'Số số hạng lẻ: các cặp triệt tiêu hết nhưng còn dư số hạng cuối là −1.'),
      ],
      steps: [
        S('Luỹ thừa lẻ của −1 bằng −1, luỹ thừa chẵn bằng 1. Ghép từng cặp liên tiếp: mỗi cặp có tổng 0.'),
        S(
          N % 2 === 0 ? `Có ${N} số hạng — đúng ${N / 2} cặp, không dư.` : `Có ${N} số hạng — ${(N - 1) / 2} cặp và dư số hạng cuối, bằng −1.`,
          `n = ${val}`,
        ),
      ],
    };
  }),
];

/** Bộ (r, p, q, a, b, c, n): (r^p)^(an + b) = (r^q)^(n + c) có nghiệm nguyên dương n. */
const COMMON_BASE: Array<[number, number, number, number, number, number, number]> = [];
for (const [r, exps] of [
  [2, [2, 3, 4]],
  [3, [2, 3]],
] as const) {
  for (const p of exps)
    for (const q of exps) {
      if (p === q) continue;
      for (let a = 1; a <= 3; a += 1)
        for (let b = 1; b <= 8; b += 1)
          for (let c = 1; c <= 9; c += 1) {
            const den = p * a - q;
            if (den === 0) continue;
            const n = (q * c - p * b) / den;
            if (Number.isInteger(n) && n >= 1 && n <= 12) COMMON_BASE.push([r, p, q, a, b, c, n]);
          }
    }
}

ch1.push(
  mcqNum('pd-c-common-base-mcq', 'nonlinear_equations', 'medium', (rng) => {
    const [r, p, q, a, b, c, n] = pick(rng, COMMON_BASE);
    const v = pick(rng, ['n', 'x', 'k']);
    const left = `${coefTerm(a, v)} + ${b}`;
    const cands: Cand[] = [];
    // Cho hai số mũ bằng nhau mà chưa đổi về cùng cơ số.
    if (a !== 1) cands.push(w(rat(c - b, a - 1), `Cho ${left} = ${v} + ${c} ngay, khi hai cơ số ${r ** p} và ${r ** q} còn khác nhau.`));
    if (q * a - p !== 0) cands.push(w(rat(p * c - q * b, q * a - p), `Viết nhầm: vế trái là ${r} mũ ${q}, vế phải là ${r} mũ ${p} (đảo hai cơ số).`));
    cands.push(w(rat(q * c - b, p * a - q), `Quên nhân ${p} vào hằng số ${b} khi phá ngoặc ở số mũ.`, 'forgot_distribute'));
    return {
      stem: `If ${r ** p}^(${left}) = ${r ** q}^(${v} + ${c}), what is the value of ${v}?`,
      correct: n,
      wrong: cands,
      steps: [
        S(`Viết hai cơ số thành luỹ thừa của ${r}.`, `(${r}^${p})^(${left}) = (${r}^${q})^(${v} + ${c})`),
        S('Luỹ thừa của luỹ thừa thì nhân số mũ; cùng cơ số nên hai số mũ bằng nhau.', `${p}(${left}) = ${q}(${v} + ${c})`),
        S('Phá ngoặc.', `${linearSide(p * a, p * b, v)} = ${linearSide(q, q * c, v)}`),
        S('Gom ẩn về một vế rồi chia.', `${v} = ${n}`),
      ],
    };
  }),

  mcqText('pd-c-exp-quotient-relation', 'equivalent_expressions', 'easy', (rng) => {
    const b = pickInt(rng, 2, 9);
    const k = pickInt(rng, 2, 12);
    const mode = pick(rng, ['quot', 'prod', 'square'] as const);
    if (mode === 'quot') {
      return {
        stem: `If frac(${b}^x,${b}^y) = ${b}^${k}, then x must equal`,
        correct: `y + ${k}`,
        wrong: [
          wt(`y - ${k}`, 'Chuyển y sang vế kia mà quên đổi dấu.', 'sign_flip'),
          wt(`${k} - y`, 'Chia hai luỹ thừa thì TRỪ số mũ: x − y, không phải y − x.'),
          wt(`${k}y`, 'Chia luỹ thừa cùng cơ số là trừ số mũ, không phải chia số mũ.'),
        ],
        steps: [
          S('Chia hai luỹ thừa cùng cơ số thì trừ số mũ.', `${b}^(x - y) = ${b}^${k}`),
          S('Cùng cơ số nên số mũ bằng nhau.', `x - y = ${k}  →  x = y + ${k}`),
        ],
      };
    }
    if (mode === 'prod') {
      return {
        stem: `If ${b}^x · ${b}^y = ${b}^${k}, then x must equal`,
        correct: `${k} - y`,
        wrong: [
          wt(`y + ${k}`, 'Nhân hai luỹ thừa là CỘNG số mũ: x + y = k, nên x = k − y.', 'sign_flip'),
          wt(`frac(${k},y)`, 'Nhân luỹ thừa cùng cơ số là cộng số mũ, không phải nhân số mũ.'),
          wt(`y - ${k}`, 'Đổi dấu cả hai số hạng khi chuyển vế.', 'sign_flip'),
        ],
        steps: [
          S('Nhân hai luỹ thừa cùng cơ số thì cộng số mũ.', `${b}^(x + y) = ${b}^${k}`),
          S('Cho số mũ bằng nhau.', `x + y = ${k}  →  x = ${k} - y`),
        ],
      };
    }
    const bb = pick(rng, [2, 3]);
    return {
      stem: `If frac(${bb * bb}^x,${bb}^y) = ${bb}^${k}, then x must equal`,
      correct: `frac(y + ${k},2)`,
      wrong: [
        wt(`y + ${k}`, `Quên rằng ${bb * bb} là ${bb} mũ 2, nên tử số là ${bb} mũ 2x.`),
        wt(`frac(y - ${k},2)`, 'Chuyển y sang vế kia mà quên đổi dấu.', 'sign_flip'),
        wt(`2(y + ${k})`, 'Chia cho 2 chứ không nhân với 2 khi cô lập x.', 'inverted_fraction'),
      ],
      steps: [
        S(`Viết ${bb * bb} thành ${bb} mũ 2.`, `frac(${bb}^(2x),${bb}^y) = ${bb}^${k}`),
        S('Chia thì trừ số mũ; cùng cơ số nên số mũ bằng nhau.', `2x - y = ${k}`),
        S('Cô lập x.', `x = frac(y + ${k},2)`),
      ],
    };
  }),

  mcqNum('pd-c-exp-shift', 'equivalent_expressions', 'easy', (rng) => {
    const b = pick(rng, [2, 3, 5]);
    const k = b === 5 ? pickInt(rng, 1, 2) : pickInt(rng, 1, 3);
    const N = pickInt(rng, 2, 40);
    const v = pick(rng, VARS);
    const down = pick(rng, [true, false]);
    const bk = b ** k;
    const correct = down ? rat(N, bk) : rat(N * bk);
    return {
      stem: `If ${b}^${v} = ${N}, what is the value of ${b}^(${v} ${down ? '-' : '+'} ${k})?`,
      correct,
      wrong: [
        w(down ? N - k : N + k, `Trừ/cộng thẳng ${k} vào ${N}. Số mũ ${down ? 'trừ' : 'cộng'} ${k} nghĩa là ${down ? 'chia' : 'nhân'} cho ${b} mũ ${k}.`),
        w(down ? rat(N * bk) : rat(N, bk), down ? 'Trừ ở số mũ là CHIA, không phải nhân.' : 'Cộng ở số mũ là NHÂN, không phải chia.', 'inverted_fraction'),
        w(down ? rat(N, b * k) : rat(N * b * k), `Coi ${b} mũ ${k} là ${b} nhân ${k}.`),
      ],
      steps: [
        S('Tách số mũ thành tổng/hiệu: luỹ thừa của một tổng là tích các luỹ thừa.', down ? `${b}^(${v} - ${k}) = frac(${b}^${v},${b}^${k})` : `${b}^(${v} + ${k}) = ${b}^${v} · ${b}^${k}`),
        S(`Thay ${b} mũ ${v} bằng ${N}.`, down ? `frac(${N},${bk}) = ${fr(N, bk)}` : `${N} × ${bk} = ${N * bk}`),
      ],
    };
  }),

  mcqNum('pd-c-exp-product-combine', 'equivalent_expressions', 'medium', (rng) => {
    const a = pickInt(rng, 2, 5);
    const b = a + pickInt(rng, 1, 3);
    const P = pickInt(rng, 2, 15);
    const Q = pickInt(rng, 2, 15);
    const s = a + b;
    return {
      stem: `If x^${a}y^${b} = ${P} and x^${b}y^${a} = ${Q}, what is the value of x^${s}y^${s}?`,
      correct: P * Q,
      wrong: [
        w(P + Q, 'Cộng hai vế. Muốn cộng số MŨ thì phải NHÂN hai luỹ thừa với nhau.'),
        w(rat(P * Q, 2), 'Nhân đúng rồi lại chia đôi — không có bước chia nào cả.'),
        w(2 * (P + Q), `Cộng hai vế rồi nhân đôi, nhầm rằng mũ ${s} cần "gấp đôi".`),
      ],
      steps: [
        S('Nhân hai đẳng thức vế theo vế: nhân luỹ thừa cùng cơ số thì cộng số mũ.', `x^${a}y^${b} · x^${b}y^${a} = x^${s}y^${s}`),
        S('Vế phải là tích hai số đã cho.', `x^${s}y^${s} = ${P} × ${Q} = ${P * Q}`),
      ],
    };
  }),

  mcqText('pd-c-signed-power-compare', 'equivalent_expressions', 'medium', (rng) => {
    const c = pickInt(rng, 2, 12);
    const m = pick(rng, [2, 4, 6]);
    const [u, v] = pick(rng, [
      ['a', 'b'],
      ['m', 'n'],
      ['p', 'q'],
      ['r', 's'],
    ] as const);
    const even = pick(rng, [true, false]);
    const A = `(-${c}${u})^${v}`;
    const B = `(-${c}${u})^(${m}${v})`;
    const C = `(${c}${u})^${v}`;
    const D = `${c}${u}^(${m}${v})`;
    if (even) {
      return {
        stem: `If ${u} and ${v} are positive even integers, which of the following is greatest?`,
        correct: B,
        wrong: [
          wt(A, `Số mũ ${v} chẵn nên dấu trừ biến mất, nhưng số mũ nhỏ hơn ${m}${v} nên giá trị nhỏ hơn.`),
          wt(C, `Bằng đúng lựa chọn có dấu trừ mũ ${v} — cả hai đều nhỏ hơn khi số mũ là ${m}${v}.`),
          wt(D, `Ở đây chỉ ${u} được nâng lên luỹ thừa, hệ số ${c} đứng ngoài không bị nâng.`),
        ],
        steps: [
          S('Số mũ chẵn làm mất dấu trừ, nên cả bốn biểu thức đều dương.'),
          S(`Cơ số lớn hơn 1 thì số mũ càng lớn giá trị càng lớn: mũ ${m}${v} lớn hơn mũ ${v}.`),
          S(`Trong hai biểu thức mũ ${m}${v}, một cái nâng cả ${c}${u} lên luỹ thừa, cái kia chỉ nâng ${u} rồi nhân ${c}.`, `(${c}${u})^(${m}${v}) = ${c}^(${m}${v}) · ${u}^(${m}${v})`),
        ],
      };
    }
    return {
      stem: `If ${u} and ${v} are positive odd integers and ${u} > 1, which of the following is least?`,
      correct: A,
      wrong: [
        wt(B, `Số mũ ${m}${v} là số chẵn nên dấu trừ biến mất — kết quả dương.`),
        wt(C, 'Không có dấu trừ trong ngoặc nên kết quả dương.'),
        wt(D, `Luỹ thừa của ${u} dương, nhân ${c} vẫn dương.`),
      ],
      steps: [
        S(`Số mũ ${v} lẻ giữ nguyên dấu trừ: biểu thức có cơ số âm mũ ${v} là số âm.`),
        S('Ba biểu thức còn lại đều dương, nên số âm là nhỏ nhất.'),
      ],
    };
  }),
);

const ORD: Record<number, string> = { 2: 'square', 3: 'cube', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th', 10: '10th', 11: '11th' };
const rootWords = (n: number, inner: string) => `the ${ORD[n] ?? `${n}th`} root of ${inner}`;

/** Cặp (m, n) nguyên tố cùng nhau, m ≠ n: số mũ m/n. */
const MN_PAIRS: Array<[number, number]> = [];
for (let n = 2; n <= 9; n += 1) for (let m = 1; m <= 11; m += 1) if (m !== n && gcd(m, n) === 1) MN_PAIRS.push([m, n]);

ch1.push(
  mcqText('pd-c-frac-exp-to-root', 'equivalent_expressions', 'medium', (rng) => {
    const [m, n] = pick(rng, MN_PAIRS);
    const v = pick(rng, VARS);
    if (pick(rng, [true, false])) {
      const flipped = m === 1 ? `${pw(v, n)}` : rootWords(m, pw(v, n));
      return {
        stem: `Which of the following is equivalent to ${v}^(frac(${m},${n})), for ${v} > 0?`,
        correct: rootWords(n, pw(v, m)),
        wrong: [
          wt(flipped, 'Đảo tử và mẫu: MẪU của số mũ mới là bậc của căn, TỬ là luỹ thừa bên trong.', 'inverted_fraction'),
          wt(rootWords(n, `${m === 1 ? n : m}${v}`), m === 1 ? `Mẫu ${n} là bậc của căn, không phải hệ số nhân với ${v}.` : `Tử số ${m} là số mũ của ${v}, không phải hệ số nhân với ${v}.`),
          wt(rootWords(n, `${v}^${m + 1}`), 'Lệch số mũ bên trong căn đi một đơn vị.', 'off_by_one'),
        ],
        steps: [
          S(`Mẫu ${n} của số mũ là bậc của căn; tử ${m} là luỹ thừa bên trong.`, `${v}^(frac(${m},${n})) = (${pw(v, m)})^(frac(1,${n}))`),
          S(`Mũ một phần ${n} chính là căn bậc ${n}.`),
        ],
      };
    }
    return {
      stem: `Which of the following is equal to ${rootWords(n, pw(v, m))}, for ${v} > 0?`,
      correct: `${v}^(frac(${m},${n}))`,
      wrong: m === 1 ? [
        wt(pw(v, n), 'Căn bậc n là mũ MỘT PHẦN n, không phải mũ n.', 'inverted_fraction'),
        wt(`${v}^(-${n})`, 'Căn không phải số mũ âm — số mũ âm là nghịch đảo.'),
        wt(`frac(${v},${n})`, `Căn bậc ${n} không phải phép chia cho ${n}.`),
      ] : [
        wt(`${v}^(frac(${n},${m}))`, 'Đảo tử và mẫu: bậc của căn đi xuống MẪU số mũ.', 'inverted_fraction'),
        wt(`${v}^${m * n}`, 'Căn bậc n là mũ một phần n, không phải nhân số mũ với n.'),
        wt(m > n ? `${v}^${m - n}` : `${v}^(frac(1,${m * n}))`, m > n ? 'Căn không phải là phép trừ số mũ.' : 'Nhân tử và mẫu vào mẫu — tử số phải giữ nguyên ở trên.'),
      ],
      steps: [
        S(`Căn bậc ${n} là mũ một phần ${n}.`, `(${pw(v, m)})^(frac(1,${n}))`),
        S('Luỹ thừa của luỹ thừa thì nhân số mũ.', `${v}^(frac(${m},${n}))`),
      ],
    };
  }),

  mcqNum('pd-c-exp-equate-power', 'equivalent_expressions', 'medium', (rng) => {
    const [p, q] = pick(rng, [
      [2, 3],
      [3, 2],
      [2, 5],
      [5, 2],
      [3, 4],
      [4, 3],
      [3, 5],
      [5, 3],
    ] as const);
    const k = pickInt(rng, 2, 5);
    const c = pick(rng, [1, 2, 3, 4, 6].filter((d) => d !== k));
    const z = rat(p * k, c);
    return {
      stem: `If x^${p} = y^${q}, for what value of z does x^(${coefTerm(c, 'z')}) = y^${q * k}?`,
      correct: z,
      wrong: [
        w(rat(q * k, c), `Dùng số mũ ${q} của y thay cho số mũ ${p} của x khi đổi y mũ ${q * k} sang x.`),
        w(rat(p * k), `Quên chia cho hệ số ${c} của z.`, 'stopped_too_early'),
        w(rat(k, c), `Chỉ tìm ra "mũ ${k}" mà quên nhân với số mũ ${p} của x.`),
      ],
      steps: [
        S(`Viết y mũ ${q * k} thành (y mũ ${q}) mũ ${k}.`, `y^${q * k} = (y^${q})^${k}`),
        S(`Thay y mũ ${q} bằng x mũ ${p}.`, `(x^${p})^${k} = x^${p * k}`),
        S('Cho số mũ bằng nhau rồi giải z.', `${coefTerm(c, 'z')} = ${p * k}  →  z = ${formatValueMath(z)}`),
      ],
    };
  }),

  mcqNum('pd-c-exp-factor-out', 'equivalent_expressions', 'medium', (rng) => {
    const b = pickInt(rng, 2, 5);
    const s = b >= 4 ? pickInt(rng, 1, 2) : pickInt(rng, 1, 3);
    const m = pickInt(rng, 1, 3);
    const minus = pick(rng, [true, false]);
    const v = pick(rng, ['x', 'n', 't', 'a']);
    const bs = b ** s;
    const k = minus ? m * bs - 1 : m * bs + 1;
    const lead = m === 1 ? '' : `${m} · `;
    return {
      stem: `If ${lead}${b}^(${v} + ${s}) ${minus ? '-' : '+'} ${b}^${v} = k(${b}^${v}), what is the value of k?`,
      correct: k,
      wrong: [
        w(m * bs, `Quên số hạng ${b} mũ ${v} thứ hai: sau khi đặt nhân tử chung nó còn lại ${minus ? '−1' : '+1'}.`, 'stopped_too_early'),
        w(minus ? m * bs + 1 : m * bs - 1, 'Sai dấu của số hạng còn lại sau khi đặt nhân tử chung.', 'sign_flip'),
        w(minus ? m * b * s - 1 : m * b * s + 1, `Coi ${b} mũ ${s} là ${b} nhân ${s}.`),
      ],
      steps: [
        S('Tách luỹ thừa có số mũ là tổng.', `${b}^(${v} + ${s}) = ${b}^${s} · ${b}^${v} = ${bs} · ${b}^${v}`),
        S(`Đặt ${b} mũ ${v} làm nhân tử chung.`, `(${lead}${bs} ${minus ? '-' : '+'} 1)${b}^${v} = ${k}(${b}^${v})`),
      ],
    };
  }),

  mcqNum('pd-c-nested-radical-exp', 'equivalent_expressions', 'hard', (rng) => {
    const m = pickInt(rng, 1, 6);
    const n = pickInt(rng, 1, 7);
    const v = pick(rng, ['x', 'y', 'w']);
    const outer = pick(rng, [true, false]);
    const inner = `${pw(v, m)} sqrt(${pw(v, n)})`;
    const a = outer ? rat(2 * m + n, 4) : rat(2 * m + n, 2);
    return {
      stem: outer
        ? `If sqrt(${inner}) = ${v}^a for all ${v} > 0, what is the value of a?`
        : `If ${inner} = ${v}^a for all ${v} > 0, what is the value of a?`,
      correct: a,
      wrong: outer
        ? [
            w(rat(m + n, 2), 'Quên căn bên trong: căn của một luỹ thừa làm số mũ chia đôi.'),
            w(rat(2 * m + n, 2), 'Quên lấy căn ngoài cùng — còn phải chia số mũ cho 2 một lần nữa.', 'stopped_too_early'),
            w(rat(m * n, 4), 'Nhân các số mũ trong khi bên trong là PHÉP NHÂN hai luỹ thừa — phải cộng số mũ.'),
          ]
        : [
            w(m + n, 'Quên rằng căn bậc hai là mũ một phần hai.'),
            w(rat(m + n, 2), 'Chia cả tổng số mũ cho 2, trong khi chỉ phần dưới căn mới bị chia.'),
            w(rat(m * n, 2), 'Nhân các số mũ thay vì cộng khi nhân hai luỹ thừa.'),
          ],
      steps: outer
        ? [
            S('Viết căn trong thành số mũ một phần hai rồi cộng số mũ.', `${pw(v, m)} · ${v}^(frac(${n},2)) = ${v}^(frac(${2 * m + n},2))`),
            S('Căn ngoài cùng lại chia số mũ cho 2.', `(${v}^(frac(${2 * m + n},2)))^(frac(1,2)) = ${v}^(${formatValueMath(a)})`),
          ]
        : [S('Căn bậc hai là mũ một phần hai; nhân hai luỹ thừa cùng cơ số thì cộng số mũ.', `${pw(v, m)} · ${v}^(frac(${n},2)) = ${v}^(${formatValueMath(a)})`)],
    };
  }),
);

/** a·sqrt(x + c) = b·sqrt(d) có x dương, và mẫu a² gọn. */
const RAD_COEF: Array<[number, number, number, number]> = [];
for (const a of [2, 3, 4])
  for (let b = 1; b <= 9; b += 1)
    for (const d of [2, 3, 5, 6, 7])
      for (let c = 1; c <= 9; c += 1) {
        if (b % a === 0) continue;
        const x = (b * b * d) / (a * a) - c;
        if (x > 0 && Number.isInteger(x * 4)) RAD_COEF.push([a, b, d, c]);
      }

ch1.push(
  mcqNum('pd-c-radical-coef-solve', 'nonlinear_equations', 'medium', (rng) => {
    if (pick(rng, [true, false])) {
      const [a, b, d, c] = pick(rng, RAD_COEF);
      const x = rat(b * b * d - c * a * a, a * a);
      return {
        stem: `If ${a}sqrt(x + ${c}) = ${b === 1 ? '' : b}sqrt(${d}) and x > 0, what is the value of x?`,
        correct: x,
        wrong: [
          w(rat(b * b * d - c, a * a), `Bình phương xong quên nhân ${a * a} vào hằng số ${c} bên trong ngoặc.`, 'forgot_distribute'),
          w(rat(b * d - c * a, a), 'Không bình phương hệ số đứng trước căn: hệ số ra ngoài căn thì phải bình phương lên mới quay lại.'),
          w(rat(b * b * d + c * a * a, a * a), `Chuyển ${c} sang vế phải mà quên đổi dấu.`, 'sign_flip'),
        ],
        steps: [
          S('Bình phương hai vế — hệ số trước căn cũng được bình phương.', `${a * a}(x + ${c}) = ${b * b * d}`),
          S(`Chia cho ${a * a}.`, `x + ${c} = ${fr(b * b * d, a * a)}`),
          S(`Trừ ${c}.`, `x = ${formatValueMath(x)}`),
        ],
      };
    }
    const k = pickInt(rng, 2, 9);
    const mm = pick(rng, [2, 3, 5, 6, 7, 10]);
    const j = pick(rng, [1, 2, 3, 4, 6].filter((t) => (k * k * mm) % t === 0));
    const x = rat(k * k * mm, j);
    return {
      stem: `If ${k}sqrt(${mm}) = sqrt(${coefTerm(j)}), what is the value of x?`,
      correct: x,
      wrong: [
        w(rat(k * mm, j), `Đưa ${k} vào trong căn mà quên bình phương nó.`, 'forgot_square_root'),
        w(rat(k * k * mm * j), `Nhân với ${j} thay vì chia cho ${j}.`, 'inverted_fraction'),
        w(rat(k * mm * mm, j), `Bình phương nhầm ${mm} thay vì ${k}.`),
      ],
      steps: [
        S(`Đưa ${k} vào trong căn thành ${k * k}.`, `${k}sqrt(${mm}) = sqrt(${k * k} · ${mm}) = sqrt(${k * k * mm})`),
        S('Hai căn bằng nhau thì biểu thức bên trong bằng nhau.', `${coefTerm(j)} = ${k * k * mm}  →  x = ${formatValueMath(x)}`),
      ],
    };
  }),

  mcqNum('pd-c-exp-sum-factor', 'equivalent_expressions', 'medium', (rng) => {
    const m = pickInt(rng, 2, 9);
    const c = pickInt(rng, 2, 9);
    const N = m * c;
    const [u, v, z] = pick(rng, [
      ['a', 'b', 'c'],
      ['p', 'q', 'r'],
      ['m', 'n', 'k'],
    ] as const);
    const div = pick(rng, [true, false]);
    return {
      stem: div
        ? `If frac(x^(${u}${z}),x^(${v}${z})) = x^${N}, x > 1, and ${u} - ${v} = ${m}, what is the value of ${z}?`
        : `If x^(${u}${z}) · x^(${v}${z}) = x^${N}, x > 1, and ${u} + ${v} = ${m}, what is the value of ${z}?`,
      correct: c,
      wrong: [
        w(N - m, `Trừ ${m} khỏi ${N} thay vì chia.`),
        w(rat(m, N), 'Chia ngược: lấy tổng chia cho số mũ.', 'inverted_fraction'),
        w(N, `Quên chia cho ${m}.`, 'stopped_too_early'),
      ],
      steps: [
        S(div ? 'Chia luỹ thừa cùng cơ số thì trừ số mũ, rồi đặt nhân tử chung.' : 'Nhân luỹ thừa cùng cơ số thì cộng số mũ, rồi đặt nhân tử chung.', `x^((${u} ${div ? '-' : '+'} ${v})${z}) = x^${N}`),
        S('Cùng cơ số (x > 1) nên số mũ bằng nhau.', `${m}${z} = ${N}  →  ${z} = ${c}`),
      ],
    };
  }),

  grid('pd-c-power-system-grid', 'nonlinear_equations', 'medium', (rng) => {
    const p = pick(rng, [2, 3]);
    const gap = pick(rng, [1, 2]);
    const n = p === 2 ? pickInt(rng, 2, 60) : pickInt(rng, 2, 40);
    const K = n ** gap;
    return {
      stem: `If n^${p} = x and n^${p + gap} = ${K}x, where n > 0, what is the value of x?`,
      answer: n ** p,
      steps: [
        S(`Thay x bằng n mũ ${p} vào phương trình sau.`, `n^${p + gap} = ${K}n^${p}`),
        S(`Chia hai vế cho n mũ ${p} (n > 0).`, gap === 1 ? `n = ${K}` : `n^2 = ${K}  →  n = ${n}`),
        S('Tính x.', `x = ${n}^${p} = ${n ** p}`),
      ],
    };
  }),

  grid('pd-c-exp-quotient-combine', 'equivalent_expressions', 'medium', (rng) => {
    const a = pickInt(rng, 5, 9);
    const b = pickInt(rng, 4, 8);
    const Q = pickInt(rng, 2, 9);
    const v = pickInt(rng, 2, 300);
    const P = v * Q;
    return {
      stem: `If x^${a}y^${b} = ${P} and x^${a - 1}y^${b - 1} = ${Q}, what is the value of xy?`,
      answer: v,
      steps: [
        S('Chia đẳng thức thứ nhất cho đẳng thức thứ hai: chia luỹ thừa cùng cơ số thì trừ số mũ.', `frac(x^${a}y^${b},x^${a - 1}y^${b - 1}) = xy`),
        S('Vế phải là thương hai số đã cho.', `xy = frac(${P},${Q}) = ${v}`),
      ],
    };
  }),
);

// ============================================================ Chương 2: phần trăm

/** In phần trăm: 12.5 → "12.5%". */
const pctFmt = (v: MathValue) => `${num(v.num / v.den)}%`;

/** (Px, Py, R): x hơn z Px%, y hơn z Py%, x hơn y R%, cả ba là số nguyên. */
const PCT_CHAIN: Array<[number, number, number]> = [];
for (const Py of [10, 20, 25, 30, 40, 50, 60, 75, 80, 100, 150, 200])
  for (const R of [10, 20, 25, 30, 40, 50, 60, 75, 80, 100]) {
    const Px = ((100 + Py) * (100 + R)) / 100 - 100;
    if (Number.isInteger(Px)) PCT_CHAIN.push([Px, Py, R]);
  }

const PCT_THINGS = [
  { what: 'the price of a lamp', a: 'the price of a desk', b: 'the price of a chair' },
  { what: 'the height of a maple tree', a: 'the height of an oak tree', b: 'the height of a pine tree' },
  { what: 'the population of Town Z', a: 'the population of Town X', b: 'the population of Town Y' },
  { what: 'the number z', a: 'the number x', b: 'the number y' },
] as const;

const TABLE_CTX = [
  { cap: 'Bikes rented by type and week', rows: ['Week 1', 'Week 2'], cols: ['City', 'Mountain', 'Electric'], noun: 'rentals' },
  { cap: 'Library visits by age group and branch', rows: ['North branch', 'South branch'], cols: ['Children', 'Teens', 'Adults'], noun: 'visits' },
  { cap: 'Tickets sold by seat type and night', rows: ['Friday', 'Saturday'], cols: ['Floor', 'Balcony', 'Box'], noun: 'tickets' },
  { cap: 'Trees planted by species and season', rows: ['Spring', 'Fall'], cols: ['Oak', 'Maple', 'Birch'], noun: 'trees' },
] as const;

function twoRowTable(rng: () => number) {
  const ctx = pick(rng, TABLE_CTX);
  const first = [0, 1, 2].map(() => pickInt(rng, 12, 240));
  // Hai hàng cùng cột không bao giờ bằng nhau (câu hỏi phần trăm thay đổi mới có nghĩa).
  const second = first.map((c) => {
    const x = pickInt(rng, 12, 240);
    return Math.abs(x - c) < 8 ? c + 8 : x;
  });
  const cells = [first, second];
  const rowT = cells.map((r) => r[0]! + r[1]! + r[2]!);
  const colT = [0, 1, 2].map((j) => cells[0]![j]! + cells[1]![j]!);
  const grand = rowT[0]! + rowT[1]!;
  const figure: MathFigureSpec = {
    kind: 'data_table',
    caption: ctx.cap,
    columns: ['', ...ctx.cols, 'Total'],
    rows: [0, 1].map((i) => ({ label: ctx.rows[i]!, cells: [...cells[i]!, rowT[i]!] })),
    totalRow: { label: 'Total', cells: [...colT, grand] },
  };
  return { ctx, cells, rowT, colT, grand, figure };
}

const ch2: MathTemplate[] = [
  mcqNum('pd-c-pct-larger-than', 'percentages', 'medium', (rng) => {
    const [Px, Py, R] = pick(rng, PCT_CHAIN);
    const t = pick(rng, PCT_THINGS);
    return {
      stem: `${t.a[0]!.toUpperCase()}${t.a.slice(1)} is ${Px}% greater than ${t.what}, and ${t.b} is ${Py}% greater than ${t.what}. ${t.a[0]!.toUpperCase()}${t.a.slice(1)} is what percent greater than ${t.b}?`,
      correct: R,
      wrong: [
        w(Px - Py, 'Trừ thẳng hai phần trăm. Hai phần trăm cùng tính trên gốc z, còn câu hỏi lấy y làm gốc.', 'percent_added_instead_of_multiplied'),
        w(Math.round(((Px - Py) / (100 + Px)) * 100), 'Lấy chênh lệch chia cho x (số lớn hơn) — gốc so sánh phải là y (làm tròn).', 'percent_of_wrong_base'),
        w(Math.round((Px / Py) * 100 - 100), 'Chia hai con số phần trăm cho nhau thay vì chia hai hệ số nhân (làm tròn).'),
      ],
      fmt: pctFmt,
      steps: [
        S('Đặt gốc chung bằng 100 rồi đổi mỗi phần trăm thành một con số.', `x = ${100 + Px},  y = ${100 + Py}`),
        S('Phần trăm lớn hơn tính trên y.', `frac(${100 + Px} - ${100 + Py},${100 + Py}) × 100% = ${R}%`),
      ],
    };
  }),

  mcqText('pd-c-compound-base-expr', 'percentages', 'easy', (rng) => {
    const v = pick(rng, ['m', 'r', 'k', 'p']);
    const P = 100 * pickInt(rng, 5, 90);
    const grow = pick(rng, [true, false]);
    const thing = grow ? pick(rng, ['A savings account', 'A college fund', 'A bond']) : pick(rng, ['A used car', 'A laptop', 'A tractor']);
    return {
      stem: grow
        ? `${thing} starts with $${money(P)} and earns ${v}% interest compounded annually. Its value after t years is ${P}(b)^t dollars. Which of the following gives b in terms of ${v}?`
        : `${thing} is bought for $${money(P)} and loses ${v}% of its value each year. Its value after t years is ${P}(b)^t dollars. Which of the following gives b in terms of ${v}?`,
      correct: grow ? `1 + 0.01${v}` : `1 - 0.01${v}`,
      wrong: grow
        ? [
            wt(`1 + ${v}`, `${v}% phải đổi thành số thập phân: chia cho 100.`, 'dropped_unit_conversion'),
            wt(`0.01${v}`, 'Đây mới là phần tăng thêm; hệ số nhân phải cộng thêm 1 (giữ lại phần cũ).'),
            wt(`1 + 100${v}`, 'Đổi phần trăm sang thập phân là chia cho 100, không phải nhân.', 'inverted_fraction'),
          ]
        : [
            wt(`1 + 0.01${v}`, 'Giá trị GIẢM mỗi năm nên hệ số nhân nhỏ hơn 1: trừ đi phần mất.', 'sign_flip'),
            wt(`0.01${v}`, 'Đây là phần bị mất; phần còn lại mới là hệ số nhân.'),
            wt(`1 - ${v}`, `${v}% phải chia cho 100 trước khi trừ.`, 'dropped_unit_conversion'),
          ],
      steps: [
        S(`${v}% viết ở dạng thập phân là ${v} chia 100.`, `${v}% = 0.01${v}`),
        S(grow ? 'Mỗi năm giá trị giữ nguyên phần cũ cộng thêm phần lãi.' : 'Mỗi năm giá trị còn lại phần cũ trừ đi phần mất.', `b = ${grow ? `1 + 0.01${v}` : `1 - 0.01${v}`}`),
      ],
    };
  }),

  grid('pd-c-survey-scale-grid', 'percentages', 'medium', (rng) => {
    const x = pickInt(rng, 4, 96);
    const M = 100 * pickInt(rng, 2, 60);
    const K = (x * M) / 100;
    const n = pickInt(rng, 40, 300);
    const ctx = pick(rng, [
      ['gym members', 'would join a morning yoga class'],
      ['residents of a town', 'would use a new bike lane'],
      ['students at a college', 'read the campus newsletter'],
      ['employees of a company', 'would carpool to work'],
    ] as const);
    return {
      stem: `In a survey of ${n} randomly selected ${ctx[0]}, x% said they ${ctx[1]}. Based on the survey, it is estimated that ${money(K)} of all ${money(M)} ${ctx[0]} ${ctx[1]}. What is the value of x?`,
      answer: x,
      steps: [
        S('Tỉ lệ trong mẫu được dùng cho cả tổng thể, nên x% của tổng thể bằng số ước tính.', `frac(x,100) × ${M} = ${K}`),
        S(`Cỡ mẫu ${n} không cần dùng tới.`, `x = frac(${K} × 100,${M}) = ${x}`),
      ],
    };
  }),

  mcqNum('pd-c-pct-table-share', 'percentages', 'medium', (rng) => {
    const { ctx, cells, colT, grand, figure } = twoRowTable(rng);
    const j = pickInt(rng, 0, 2);
    if (pick(rng, [true, false])) {
      const val = Math.round((colT[j]! / grand) * 100);
      return {
        stem: `Based on the table, which of the following is closest to the percent of all ${ctx.noun} that were in the ${ctx.cols[j]} category?`,
        figure,
        correct: val,
        wrong: [
          w(Math.round((cells[0]![j]! / grand) * 100), `Chỉ lấy số của hàng "${ctx.rows[0]}" thay vì cả cột.`),
          w(Math.round((colT[j]! / (grand - colT[j]!)) * 100), 'Chia cho phần CÒN LẠI thay vì chia cho tổng.', 'wrong_denominator'),
          w(Math.round(100 / 3), 'Coi ba loại chia đều nhau.'),
          w(100 - val, 'Tính phần của các loại khác.'),
        ],
        fmt: pctFmt,
        steps: [
          S(`Tổng của cột ${ctx.cols[j]} và tổng cả bảng đọc ở hàng Total.`, `frac(${colT[j]},${grand}) ≈ ${num(colT[j]! / grand)}`),
          S('Đổi sang phần trăm và làm tròn.', `≈ ${val}%`),
        ],
      };
    }
    const i = pickInt(rng, 0, 1);
    const val = Math.round((cells[i]![j]! / colT[j]!) * 100);
    return {
      stem: `Based on the table, of the ${ctx.noun} in the ${ctx.cols[j]} category, which of the following is closest to the percent that were from ${ctx.rows[i]}?`,
      figure,
      correct: val,
      wrong: [
        w(Math.round((cells[i]![j]! / grand) * 100), 'Chia cho tổng cả bảng, trong khi câu hỏi chỉ xét trong một cột.', 'wrong_denominator'),
        w(Math.round((cells[i]![j]! / (cells[i]![0]! + cells[i]![1]! + cells[i]![2]!)) * 100), 'Chia cho tổng của HÀNG thay vì tổng của cột.', 'wrong_denominator'),
        w(100 - val, 'Lấy nhầm hàng còn lại.'),
        w(Math.round((cells[1 - i]![j]! / grand) * 100), 'Vừa lấy nhầm hàng vừa chia cho tổng cả bảng.'),
      ],
      fmt: pctFmt,
      steps: [
        S(`Chỉ xét cột ${ctx.cols[j]}: mẫu số là tổng của cột này.`, `frac(${cells[i]![j]},${colT[j]}) ≈ ${num(Math.round((cells[i]![j]! / colT[j]!) * 1000) / 1000)}`),
        S('Đổi sang phần trăm và làm tròn.', `≈ ${val}%`),
      ],
    };
  }),
];

/** Bảng mà đúng một cột chiếm gần p% của hàng đang hỏi (các cột khác cách xa ít nhất 6 điểm phần trăm). */
ch2.push(
  mcqText('pd-c-pct-table-which', 'percentages', 'medium', (rng) => {
    const { ctx, cells, figure } = twoRowTable(rng);
    const i = pickInt(rng, 0, 1);
    const row = cells[i]!;
    const tot = row[0]! + row[1]! + row[2]!;
    const pcts = row.map((c) => (c / tot) * 100);
    // Cột được hỏi: cột có tỉ lệ cách xa các cột khác nhất.
    let j = 0;
    let best = -1;
    pcts.forEach((p, k) => {
      const gap = Math.min(...pcts.filter((_, kk) => kk !== k).map((q) => Math.abs(q - p)));
      if (gap > best) {
        best = gap;
        j = k;
      }
    });
    const target = Math.round(pcts[j]!);
    const others = [0, 1, 2].filter((k) => k !== j);
    return {
      stem: `Based on the table, for ${ctx.rows[i]}, which category accounted for approximately ${target}% of the ${ctx.noun}?`,
      figure,
      correct: ctx.cols[j]!,
      wrong: [
        wt(ctx.cols[others[0]!]!, `Loại này chiếm khoảng ${Math.round(pcts[others[0]!]!)}% của hàng đó.`),
        wt(ctx.cols[others[1]!]!, `Loại này chiếm khoảng ${Math.round(pcts[others[1]!]!)}% của hàng đó.`),
        wt('None of the categories', `Có một loại chiếm ${num(Math.round(pcts[j]! * 10) / 10)}% — làm tròn ra đúng ${target}%.`),
      ],
      steps: [
        S(`Tổng của hàng ${ctx.rows[i]} là mẫu số.`, `${row[0]} + ${row[1]} + ${row[2]} = ${tot}`),
        S(`Tính tỉ lệ của loại ${ctx.cols[j]}.`, `frac(${row[j]},${tot}) ≈ ${num(Math.round(pcts[j]! * 10) / 10)}%`),
      ],
    };
  }),

  mcqNum('pd-c-pct-table-change', 'percentages', 'medium', (rng) => {
    const { ctx, cells, figure } = twoRowTable(rng);
    const j = pickInt(rng, 0, 2);
    const [a, b] = [cells[0]![j]!, cells[1]![j]!];
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    const decrease = pick(rng, [true, false]);
    // Giảm: từ số lớn xuống số nhỏ; tăng: từ số nhỏ lên số lớn. Đổi hàng cho khớp thứ tự thời gian.
    const fromRow = (decrease ? a === hi : a === lo) ? 0 : 1;
    const from = cells[fromRow]![j]!;
    const to = cells[1 - fromRow]![j]!;
    const val = Math.round((Math.abs(to - from) / from) * 100);
    return {
      stem: `Based on the table, the number of ${ctx.cols[j]} ${ctx.noun} for ${ctx.rows[1 - fromRow]} was approximately what percent ${decrease ? 'less' : 'greater'} than the number for ${ctx.rows[fromRow]}?`,
      figure,
      correct: val,
      wrong: [
        w(Math.round((Math.abs(to - from) / to) * 100), `Chia cho số của ${ctx.rows[1 - fromRow]} — gốc so sánh là ${ctx.rows[fromRow]}.`, 'percent_of_wrong_base'),
        w(Math.abs(to - from), 'Đây là chênh lệch tuyệt đối, chưa đổi ra phần trăm.', 'stopped_too_early'),
        w(Math.round((to / from) * 100), 'Đây là tỉ lệ số sau so với số trước, chưa trừ 100%.'),
      ],
      fmt: pctFmt,
      steps: [
        S(`Phần trăm thay đổi luôn chia cho giá trị làm gốc (${ctx.rows[fromRow]}).`, `frac(${hi} - ${lo},${from}) × 100%`),
        S('Tính và làm tròn.', `≈ ${val}%`),
      ],
    };
  }),
);

const KEEP_FRACTIONS: Array<[number, number, number]> = [
  // [giữ lại tử, mẫu, phần trăm mất]
  [9, 10, 10],
  [4, 5, 20],
  [3, 4, 25],
  [3, 5, 40],
  [1, 2, 50],
];

ch2.push(
  mcqNum('pd-c-pct-repeated-remove', 'percentages', 'medium', (rng) => {
    const [a, b, p] = pick(rng, KEEP_FRACTIONS);
    const n = pick(rng, [2, 3]);
    const k = pickInt(rng, 1, b === 10 ? 3 : 9);
    const S0 = k * b ** n;
    const R = k * a ** n;
    const ctx = pick(rng, [
      ['liters of water are in a tank', 'drained from the tank', 'liters'],
      ['grams of a compound are in a sample', 'broken down', 'grams'],
      ['brochures are in a stack', 'handed out', 'brochures'],
    ] as const);
    const dec2 = (x: number) => toRat(Math.round(x * 100) / 100);
    return {
      stem: `At the start of the first day, some ${ctx[0]}. Each day, ${p}% of the ${ctx[2]} present at the start of that day are ${ctx[1]}. At the end of day ${n}, ${R} ${ctx[2]} remain. How many ${ctx[2]} were there at the start of the first day?`,
      correct: S0,
      wrong: [
        w(dec2(R * (1 + p / 100) ** n), `Đi ngược bằng cách tăng ${p}% mỗi ngày. Giảm ${p}% là nhân ${num(a / b)}, nên đi ngược phải CHIA cho ${num(a / b)}.`, 'percent_of_wrong_base'),
        w(dec2(R * (1 + (p * n) / 100)), `Đi ngược bằng cách cộng thêm ${n} lần ${p}% của số còn lại — phần trăm mỗi ngày tính trên lượng đầu ngày đó.`, 'percent_added_instead_of_multiplied'),
        w(dec2(R / (a / b)), 'Mới đi ngược một ngày.', 'stopped_too_early'),
      ],
      fmt: (v) => num(v.num / v.den),
      steps: [
        S(`Mỗi ngày còn lại ${100 - p}% nên nhân với ${num(a / b)}; sau ${n} ngày là nhân ${n} lần.`, `x(${num(a / b)})^${n} = ${R}`),
        S('Chia để tìm lượng ban đầu.', `x = frac(${R},${num((a / b) ** n)}) = ${S0}`),
      ],
    };
  }),

  mcqNum('pd-c-pct-discount-tax-solve', 'percentages', 'medium', (rng) => {
    const L = 20 * pickInt(rng, 2, 40);
    const d = pick(rng, [10, 15, 20, 25, 30]);
    const x = pick(rng, [4, 5, 6, 7, 8, 9, 10]);
    const D = (L * (100 - d)) / 100;
    const T = (D * (100 + x)) / 100;
    const one = (v: number) => toRat(Math.round(v * 10) / 10);
    const item = pick(rng, ['a jacket', 'a pair of boots', 'a tent', 'a bicycle helmet', 'a desk lamp']);
    return {
      stem: `The original price of ${item} was $${money(L)}. The price was reduced by ${d}%, and then a sales tax of x% was applied to the reduced price. If the total paid was $${money(T)}, what is the value of x?`,
      correct: x,
      wrong: [
        w(one(((T - D) / L) * 100), 'Tính thuế trên giá gốc — thuế đánh trên giá ĐÃ GIẢM.', 'percent_of_wrong_base'),
        w(one((T / L) * 100 - 100 + d), 'Cộng/trừ thẳng các phần trăm thay vì nhân hệ số.', 'percent_added_instead_of_multiplied'),
        w(one(((T - D) / T) * 100), 'Chia tiền thuế cho tổng đã trả thay vì cho giá đã giảm.', 'wrong_denominator'),
      ],
      fmt: pctFmt,
      steps: [
        S(`Giá sau khi giảm ${d}%.`, `${L} × ${num((100 - d) / 100)} = ${num(D)}`),
        S('Thuế tính trên giá đã giảm.', `${num(D)}(1 + frac(x,100)) = ${num(T)}`),
        S('Giải x.', `1 + frac(x,100) = ${num(T / D)}  →  x = ${x}`),
      ],
    };
  }),

  grid('pd-c-pct-greater-reverse', 'percentages', 'easy', (rng) => {
    const p = pick(rng, [10, 15, 20, 25, 30, 40, 50, 60, 75]);
    const B = 20 * pickInt(rng, 2, 99);
    const greater = pick(rng, [true, false]);
    const A = (B * (greater ? 100 + p : 100 - p)) / 100;
    const [nA, nB] = pick(rng, [
      ['cafe A', 'cafe B'],
      ['the red team', 'the blue team'],
      ['Route 1', 'Route 2'],
      ['the first printer', 'the second printer'],
    ] as const);
    return {
      stem: `The number of customers served by ${nA} last month was ${p}% ${greater ? 'greater' : 'less'} than the number served by ${nB}. If ${nA} served ${A} customers, how many customers did ${nB} serve?`,
      answer: B,
      steps: [
        S(`Gốc so sánh là ${nB}: số của ${nA} bằng ${greater ? `${100 + p}` : `${100 - p}`}% số của ${nB}.`, `${num((greater ? 100 + p : 100 - p) / 100)}B = ${A}`),
        S('Chia để tìm B.', `B = frac(${A},${num((greater ? 100 + p : 100 - p) / 100)}) = ${B}`),
      ],
    };
  }),

  mcqNum('pd-c-pct-weighted-increase', 'percentages', 'medium', (rng) => {
    const T = pick(rng, [100, 200, 400, 500]);
    const P1 = (T / 20) * pickInt(rng, 3, 17);
    const P2 = T - P1;
    const a = pickInt(rng, 2, 30);
    let b = pickInt(rng, 2, 29);
    if (b >= a) b += 1;
    const inc = P1 * a + P2 * b;
    const val = inc / T;
    const [i1, i2] = pick(rng, [
      ['a phone plan', 'an internet plan'],
      ['a gym membership', 'a swim pass'],
      ['a bus pass', 'a parking permit'],
      ['a magazine subscription', 'a music subscription'],
    ] as const);
    return {
      stem: `Last year ${i1} cost $${money(P1)} and ${i2} cost $${money(P2)}. This year the price of ${i1} increased by ${a}% and the price of ${i2} increased by ${b}%. By what percent did the combined price of the two increase?`,
      correct: toRat(val),
      wrong: [
        w(toRat((a + b) / 2), 'Lấy trung bình cộng hai phần trăm — hai mức tăng tính trên hai giá khác nhau, phải lấy trung bình có trọng số.'),
        w(a + b, 'Cộng thẳng hai phần trăm.', 'percent_added_instead_of_multiplied'),
        w(toRat(Math.round((inc / (T + inc / 100)) * 10) / 10), 'Chia phần tăng cho tổng giá MỚI — gốc phải là tổng giá cũ (làm tròn).', 'percent_of_wrong_base'),
      ],
      fmt: pctFmt,
      steps: [
        S('Tính số tiền tăng của từng món.', `${P1} × ${num(a / 100)} + ${P2} × ${num(b / 100)} = ${num(inc / 100)}`),
        S('Chia cho tổng giá cũ.', `frac(${num(inc / 100)},${T}) × 100% = ${num(val)}%`),
      ],
    };
  }),

  mcqText('pd-c-pct-loss-gain-expr', 'percentages', 'medium', (rng) => {
    const a = pick(rng, [5, 10, 15, 20, 25, 30, 40]);
    const b = pick(rng, [5, 10, 12, 15, 20, 25, 35, 50].filter((x) => x !== a && (100 - a) * (100 + x) !== 10000));
    const v = pick(rng, ['n', 'k', 'v', 'p']);
    const down = num(1 - a / 100);
    const up = num(1 + b / 100);
    const thing = pick(rng, ['A stock', 'A painting', 'A share of a fund', 'A collectible card']);
    return {
      stem: `${thing} lost ${a}% of its value in one year and then gained ${b}% of its value the next year. If its value at the end of the second year was ${v} dollars, which of the following gives its value, in dollars, at the start of the first year?`,
      correct: `frac(${v},(${down})(${up}))`,
      wrong: [
        wt(`(${down})(${up})${v}`, 'Đi xuôi thay vì đi ngược: giá trị cuối là giá trị đầu NHÂN hai hệ số, nên giá trị đầu phải CHIA.', 'inverted_fraction'),
        wt(`frac(${v},(${num(1 + a / 100)})(${num(1 - b / 100)}))`, 'Đảo dấu hai lần thay đổi: mất là nhân hệ số nhỏ hơn 1, được là nhân hệ số lớn hơn 1.', 'sign_flip'),
        wt(`frac(${v},${num(1 - a / 100 + b / 100)})`, 'Cộng trừ thẳng hai phần trăm — lần thay đổi thứ hai tính trên giá trị đã thay đổi.', 'percent_added_instead_of_multiplied'),
      ],
      steps: [
        S(`Mất ${a}% là nhân ${down}; được ${b}% là nhân ${up}.`, `x(${down})(${up}) = ${v}`),
        S('Chia hai vế để tìm giá trị ban đầu.', `x = frac(${v},(${down})(${up}))`),
      ],
    };
  }),

  mcqNum('pd-c-pct-decline-approx', 'percentages', 'medium', (rng) => {
    const P = 1000 * pickInt(rng, 5, 90);
    const r = pickInt(rng, 2, 9);
    const t = pickInt(rng, 5, 12);
    const f = (tt: number) => Math.round(P * (1 - r / 100) ** tt);
    const thing = pick(rng, [
      ['A lake', 'fish'],
      ['A forest reserve', 'birds'],
      ['A town', 'residents'],
      ['A river', 'salmon'],
    ] as const);
    return {
      stem: `${thing[0]} had ${money(P)} ${thing[1]} at the start of a study. The number of ${thing[1]} decreased by ${r}% each year. Which of the following is closest to the number of ${thing[1]} ${t} years after the start of the study?`,
      correct: f(t),
      wrong: [
        w(Math.round(P * (1 - (r * t) / 100)), `Trừ ${r}% của số ban đầu mỗi năm (giảm tuyến tính). Mỗi năm giảm ${r}% của số HIỆN CÓ.`, 'percent_added_instead_of_multiplied'),
        w(f(t - 1), 'Lệch một năm.', 'off_by_one'),
        w(Math.round(P / (1 + r / 100) ** t), `Chia cho ${num(1 + r / 100)} mỗi năm — giảm ${r}% là nhân ${num(1 - r / 100)}, hai cách không bằng nhau.`),
      ],
      steps: [
        S(`Mỗi năm còn lại ${100 - r}%: nhân với ${num(1 - r / 100)}.`, `${P}(${num(1 - r / 100)})^${t}`),
        S('Bấm máy và làm tròn.', `≈ ${f(t)}`),
      ],
    };
  }),

  mcqText('pd-c-simple-interest-model', 'percentages', 'easy', (rng) => {
    const P = 500 * pickInt(rng, 2, 60);
    const r = pickInt(rng, 2, 9);
    const R = num(r / 100);
    const G = num(1 + r / 100);
    const simple = pick(rng, [true, false]);
    const who = pick(rng, ['A credit union', 'An investor', 'A bank', 'A family member']);
    const ps = money(P).replace(/,/g, '');
    return {
      stem: simple
        ? `${who} lends $${money(P)} at a simple interest rate of ${r}% per year. Which of the following functions gives the total amount A, in dollars, to be repaid after t years?`
        : `$${money(P)} is deposited in an account that earns ${r}% interest compounded annually. Which of the following functions gives the amount A, in dollars, in the account after t years?`,
      correct: simple ? `A = ${ps}(1 + ${R}t)` : `A = ${ps}(${G})^t`,
      wrong: simple
        ? [
            wt(`A = ${ps}(${G})^t`, 'Đây là lãi KÉP. Lãi đơn chỉ tính trên số tiền gốc, mỗi năm cộng cùng một khoản.'),
            wt(`A = ${ps}(${R}t)`, 'Chỉ có phần lãi, quên cộng tiền gốc.', 'stopped_too_early'),
            wt(`A = ${ps}(1 + ${R}^t)`, 'Lãi đơn tăng tuyến tính theo t, không có số mũ.'),
          ]
        : [
            wt(`A = ${ps}(1 + ${R}t)`, 'Đây là lãi ĐƠN. Lãi kép tính lãi trên cả tiền lãi cũ, nên là hàm mũ.'),
            wt(`A = ${ps}(${num(1 + r / 10)})^t`, `Viết ${r}% thành 0.${r} — phải là ${R}.`, 'dropped_unit_conversion'),
            wt(`A = ${ps}(${G})(${'t'})`, 'Nhân với t thay vì nâng lên luỹ thừa t.'),
          ],
      steps: simple
        ? [S(`Lãi mỗi năm là ${r}% của tiền gốc, như nhau mọi năm.`, `${ps}(${R})t`), S('Tổng phải trả là gốc cộng lãi, đặt nhân tử chung.', `A = ${ps}(1 + ${R}t)`)]
        : [S(`Mỗi năm số dư được nhân với ${G}.`, `${ps}(${G})(${G})…`), S('Sau t năm là nhân t lần.', `A = ${ps}(${G})^t`)],
    };
  }),

  grid('pd-c-pct-category-shift', 'percentages', 'medium', (rng) => {
    const pA = 5 * pickInt(rng, 2, 8);
    const pB = 5 * pickInt(rng, 2, 18 - pA / 5);
    const pC = 100 - pA - pB;
    const k = pickInt(rng, 1, 5);
    const total = 200 * k;
    const nC = (total * pC) / 100;
    const nA = (total * pA) / 100 + (total * pB) / 200;
    const ctx = pick(rng, [
      ['A delivery fleet', 'vans', 'trucks', 'cars', 'vehicles', 'converted to vans'],
      ['A garden center', 'roses', 'tulips', 'lilies', 'plants', 'replaced with roses'],
      ['A music library', 'jazz albums', 'rock albums', 'classical albums', 'albums', 'relabeled as jazz albums'],
    ] as const);
    return {
      stem: `${ctx[0]} has ${pA}% ${ctx[1]}, ${pB}% ${ctx[2]}, and the remaining ${nC} ${ctx[4]} are ${ctx[3]}. If half of the ${ctx[2]} are ${ctx[5]}, how many ${ctx[1]} will there be?`,
      answer: nA,
      steps: [
        S(`Phần còn lại chiếm ${pC}% và bằng ${nC}, nên tìm được tổng.`, `${num(pC / 100)}T = ${nC}  →  T = ${total}`),
        S('Tính từng nhóm.', `${pA}% × ${total} = ${(total * pA) / 100},  ${pB}% × ${total} = ${(total * pB) / 100}`),
        S('Cộng thêm một nửa nhóm thứ hai.', `${(total * pA) / 100} + ${(total * pB) / 200} = ${nA}`),
      ],
    };
  }),

  mcqNum('pd-c-compound-two-accounts', 'percentages', 'hard', (rng) => {
    const P1 = 500 * pickInt(rng, 2, 20);
    const P2 = 500 * pickInt(rng, 2, 20);
    const r1 = pickInt(rng, 3, 9);
    let r2 = pickInt(rng, 2, 8);
    if (r2 >= r1) r2 = r1 - 1;
    const t = pickInt(rng, 5, 15);
    const I = (P: number, r: number) => P * (1 + r / 100) ** t - P;
    const diff = Math.round(I(P1, r1) - I(P2, r2));
    const who = pick(rng, [
      ['Nadia', 'Omar'],
      ['Lucia', 'Ken'],
      ['Ravi', 'Tess'],
    ] as const);
    return {
      stem: `${who[0]} deposits $${money(P1)} in an account that earns ${r1}% interest compounded annually. ${who[1]} deposits $${money(P2)} in an account that earns ${r2}% interest compounded annually. No other deposits or withdrawals are made. To the nearest dollar, how much more interest will ${who[0]}'s account have earned than ${who[1]}'s account after ${t} years?`,
      correct: diff,
      wrong: [
        w(Math.round(P1 * (1 + r1 / 100) ** t - P2 * (1 + r2 / 100) ** t), 'Trừ hai SỐ DƯ — số dư còn chứa tiền gốc; đề hỏi tiền LÃI.', 'stopped_too_early'),
        w(Math.round((P1 * r1 * t) / 100 - (P2 * r2 * t) / 100), 'Tính theo lãi đơn.'),
        w(Math.round(I(P1, r1)), 'Đây là toàn bộ tiền lãi của tài khoản thứ nhất — còn phải trừ tiền lãi của tài khoản thứ hai.', 'stopped_too_early'),
      ],
      steps: [
        S('Tiền lãi bằng số dư trừ tiền gốc.', `${P1}(${num(1 + r1 / 100)})^${t} - ${P1} ≈ ${num(Math.round(I(P1, r1) * 100) / 100)}`),
        S('Làm tương tự với tài khoản thứ hai.', `${P2}(${num(1 + r2 / 100)})^${t} - ${P2} ≈ ${num(Math.round(I(P2, r2) * 100) / 100)}`),
        S('Lấy hiệu và làm tròn.', `≈ ${diff}`),
      ],
    };
  }),
);

// ============================================================ Chương 2 + 3: tăng/giảm theo chu kỳ k năm

const growthEveryK = mcqText('pd-c-growth-every-k', 'nonlinear_functions', 'hard', (rng) => {
  const P = 100 * pickInt(rng, 5, 400);
  const r = pickInt(rng, 3, 12);
  const k = pickInt(rng, 2, 5);
  const grow = pick(rng, [true, false]);
  const f = num(grow ? 1 + r / 100 : 1 - r / 100);
  const ps = String(P);
  const stem = grow
    ? `An investment of $${money(P)} earns ${r}% interest, compounded once every ${k} years. Which of the following gives the value V, in dollars, of the investment t years after it was made?`
    : `A wetland covered ${money(P)} acres in 2020. Its area decreases by ${r}% every ${k} years. Which of the following gives the area A, in acres, t years after 2020?`;
  const L = grow ? 'V' : 'A';
  return {
    stem,
    correct: `${L} = ${ps}(${f})^(frac(t,${k}))`,
    wrong: [
      wt(`${L} = ${ps}(${f})^(${k}t)`, `Trong t năm chỉ có t chia ${k} lần thay đổi, không phải ${k} nhân t lần.`, 'inverted_fraction'),
      wt(`${L} = ${ps}(${f})^t`, `Coi như thay đổi mỗi năm, trong khi ${r}% chỉ áp dụng mỗi ${k} năm một lần.`),
      wt(`${L} = ${ps}(${num(grow ? 1 + r / 100 / k : 1 - r / 100 / k)})^t`, `Chia ${r}% cho ${k} rồi áp dụng mỗi năm — tính mũ lên sẽ ra con số khác.`),
    ],
    steps: [
      S(`Mỗi lần thay đổi nhân với ${f}.`),
      S(`Sau t năm có t chia ${k} lần thay đổi.`, `${L} = ${ps}(${f})^(frac(t,${k}))`),
    ],
  };
});
ch2.push(growthEveryK);

// ============================================================ Chương 3: tuyến tính hay hàm mũ

type Kind = 'lin-up' | 'lin-down' | 'exp-up' | 'exp-down';
const KIND_LABEL: Record<Kind, string> = {
  'lin-up': 'Linear growth',
  'lin-down': 'Linear decay',
  'exp-up': 'Exponential growth',
  'exp-down': 'Exponential decay',
};

/**
 * Một tình huống bằng lời cho từng kiểu thay đổi. Câu chữ cố ý dùng một bộ từ
 * có kiểm soát ("of its original …", "of its current …") để bộ kiểm chứng
 * phân loại lại được độc lập. Có cả bẫy của sách: phần trăm của GIÁ TRỊ BAN
 * ĐẦU là tuyến tính.
 */
function scenario(rng: () => number, kind: Kind): { text: string; why: string } {
  const n = pickInt(rng, 3, 60);
  const p = pickInt(rng, 2, 30);
  const h = pickInt(rng, 2, 9);
  const opts: Record<Kind, Array<{ text: string; why: string }>> = {
    'lin-up': [
      { text: `A library adds ${n} new books to its collection every month.`, why: 'Mỗi tháng cộng thêm cùng một lượng.' },
      { text: `A savings jar gains ${n} dollars each week.`, why: 'Mỗi tuần cộng thêm cùng một lượng.' },
      { text: `A bamboo shoot increases in height by ${n} millimeters each day.`, why: 'Mỗi ngày cộng thêm cùng một lượng.' },
      { text: `An account earns interest equal to ${p}% of its original deposit each year.`, why: 'Phần trăm của số tiền BAN ĐẦU là một lượng cố định — cộng cùng một khoản mỗi năm.' },
    ],
    'lin-down': [
      { text: `A collector gives away ${n} stamps every month.`, why: 'Mỗi tháng bớt đi cùng một lượng.' },
      { text: `A candle decreases in height by ${n} millimeters each hour.`, why: 'Mỗi giờ bớt đi cùng một lượng.' },
      { text: `A water tank loses ${n} liters each day.`, why: 'Mỗi ngày bớt đi cùng một lượng.' },
      { text: `A machine loses ${p}% of its original value each year.`, why: 'Phần trăm của giá trị BAN ĐẦU là một lượng cố định — trừ cùng một khoản mỗi năm.' },
    ],
    'exp-up': [
      { text: `A colony of bacteria doubles in size every ${h} hours.`, why: 'Mỗi chu kỳ nhân với cùng một hệ số (2).' },
      { text: `The population of a town increases by ${p}% of its current value each year.`, why: 'Phần trăm của giá trị HIỆN TẠI: mỗi năm nhân với cùng một hệ số lớn hơn 1.' },
      { text: `Each cell in a dish splits into ${h} cells every hour.`, why: 'Mỗi giờ nhân với cùng một hệ số.' },
      { text: `The number of members of a club triples every ${h} months.`, why: 'Mỗi chu kỳ nhân với cùng một hệ số (3).' },
    ],
    'exp-down': [
      { text: `The amount of a medicine in the blood decreases by ${p}% of its current value each hour.`, why: 'Phần trăm của lượng HIỆN TẠI: mỗi giờ nhân với cùng một hệ số nhỏ hơn 1.' },
      { text: `Half of the remaining mass of a sample decays every ${h} days.`, why: 'Mỗi chu kỳ nhân với một nửa.' },
      { text: `A phone loses ${p}% of its current value each year.`, why: 'Phần trăm của giá trị HIỆN TẠI: nhân với cùng một hệ số nhỏ hơn 1.' },
    ],
  };
  return pick(rng, opts[kind]);
}

const KINDS: Kind[] = ['lin-up', 'lin-down', 'exp-up', 'exp-down'];

const EXP_R = [1.1, 1.2, 1.3, 1.4, 1.5, 0.9, 0.8, 0.7] as const;

const ch3: MathTemplate[] = [
  mcqText('pd-c-exp-model-from-two-points', 'nonlinear_functions', 'medium', (rng) => {
    const r = pick(rng, EXP_R);
    const P0 = 100 * pickInt(rng, 3, 90);
    const r2 = Math.round(r * r * 100) / 100;
    const P2 = Math.round(P0 * r2);
    const y0 = pickInt(rng, 2005, 2020);
    const noun = pick(rng, ['rabbits on an island', 'visitors to a museum', 'trees in an orchard', 'fish in a pond']);
    return {
      stem: `There were ${money(P0)} ${noun} in ${y0} and ${money(P2)} in ${y0 + 2}. If the number changes by the same percent each year, which of the following functions models the number N(t) of ${noun.split(' ')[0]} t years after ${y0}?`,
      correct: `N(t) = ${P0}(${num(r)})^t`,
      wrong: [
        wt(`N(t) = ${P0}(${num(r2)})^t`, `${num(r2)} là hệ số của HAI năm; mỗi năm hệ số là căn bậc hai của nó.`),
        wt(`N(t) = ${P0} ${P2 >= P0 ? '+' : '-'} ${num(Math.abs(P2 - P0) / 2)}t`, 'Đây là mô hình tuyến tính (cộng cùng một lượng), đề nói thay đổi cùng một PHẦN TRĂM.'),
        wt(`N(t) = ${P0}(${num(1 + (r2 - 1) / 2)})^t`, 'Chia đôi phần trăm của hai năm — phần trăm không chia đôi được vì lãi chồng lãi.', 'percent_added_instead_of_multiplied'),
      ],
      steps: [
        S('Hai năm nhân hai lần với cùng hệ số r.', `${P0}r^2 = ${P2}  →  r^2 = ${num(r2)}`),
        S('Lấy căn bậc hai.', `r = ${num(r)}`),
        S('Viết mô hình.', `N(t) = ${P0}(${num(r)})^t`),
      ],
    };
  }),

  mcqText('pd-c-linear-model-from-two-points', 'linear_functions', 'easy', (rng) => {
    const k = pick(rng, [1, 2, 4, 5]);
    const d = pickNonZeroInt(rng, -40, 60);
    const P0 = pickInt(rng, 200, 900);
    const P1 = P0 + d * k;
    const y0 = pickInt(rng, 2005, 2020);
    const noun = pick(rng, ['members of a hiking club', 'books in a classroom library', 'cars in a parking garage', 'students in a school band']);
    const lin = (a: number, b: number) => `${a} ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}t`;
    return {
      stem: `There were ${P0} ${noun} in ${y0} and ${P1} in ${y0 + k}. If the number changed linearly, which of the following functions models the number N(t) t years after ${y0}?`,
      correct: `N(t) = ${lin(P0, d)}`,
      wrong: [
        wt(`N(t) = ${lin(P1, d)}`, `${P1} là giá trị ở năm ${y0 + k}, không phải giá trị ban đầu (t = 0).`, 'swapped_slope_intercept'),
        k === 1
          ? wt(`N(t) = ${lin(P0, -d)}`, 'Sai dấu của tốc độ thay đổi.', 'sign_flip')
          : wt(`N(t) = ${lin(P0, d * k)}`, `Chênh lệch ${d * k} xảy ra trong ${k} năm — mỗi năm chỉ thay đổi ${d}.`, 'stopped_too_early'),
        wt(`N(t) = ${d} ${P0 < 0 ? '-' : '+'} ${P0}t`, 'Đảo vai trò hệ số góc và giá trị ban đầu.', 'swapped_slope_intercept'),
      ],
      steps: [
        S('Tốc độ thay đổi mỗi năm là chênh lệch chia cho số năm.', `frac(${P1} - ${P0},${k}) = ${d}`),
        S(`Giá trị ban đầu (t = 0) là số của năm ${y0}.`, `N(t) = ${lin(P0, d)}`),
      ],
    };
  }),
];
ch3.push(growthEveryK);

ch3.push(
  mcqText('pd-c-scatter-association', 'two_var_data', 'easy', (rng) => {
    const kind = pick(rng, ['pos', 'neg', 'none'] as const);
    const pts: Array<{ x: number; y: number }> = [];
    if (kind === 'none') {
      const m = 10;
      for (let i = 1; i <= 6; i += 1) {
        const y = pickInt(rng, 5, 45);
        const dx = i + pickInt(rng, 0, 2) * 0.5;
        pts.push({ x: m - dx, y }, { x: m + dx, y });
      }
    } else {
      const b = (kind === 'pos' ? 1 : -1) * pick(rng, [2, 3, 4]);
      const a = kind === 'pos' ? pickInt(rng, 2, 8) : pickInt(rng, 44, 52);
      for (let x = 1; x <= 12; x += 1) pts.push({ x: x + 2, y: Math.max(1, a + b * x + pickInt(rng, -2, 2)) });
    }
    const [xl, yl] = pick(rng, [
      ['Hours of practice', 'Mistakes made'],
      ['Temperature (°C)', 'Cups of cocoa sold'],
      ['Distance from city (km)', 'Price of land ($ per m²)'],
      ['Age of car (years)', 'Resale value ($1000s)'],
    ] as const);
    const correct = kind === 'pos' ? 'A positive linear association' : kind === 'neg' ? 'A negative linear association' : 'No apparent association';
    const all = ['A positive linear association', 'A negative linear association', 'No apparent association', 'A positive exponential association'];
    return {
      stem: `The scatterplot shows the relationship between two variables. Which of the following best describes the association between the variables?`,
      figure: { kind: 'scatterplot', caption: `${yl} versus ${xl}`, xLabel: xl, yLabel: yl, points: pts, xRange: [0, 20], yRange: [0, 60] },
      correct,
      wrong: all
        .filter((c) => c !== correct)
        .map((c) =>
          wt(
            c,
            c.startsWith('No')
              ? 'Các điểm bám khá sát một đường thẳng, nên có liên hệ.'
              : c.includes('exponential')
                ? 'Các điểm bám theo đường thẳng, không cong lên như hàm mũ.'
                : c.includes('positive')
                  ? 'Liên hệ dương là khi x tăng thì y cũng tăng.'
                  : 'Liên hệ âm là khi x tăng thì y giảm.',
          ),
        ),
      steps: [
        S(
          kind === 'none'
            ? 'Khi x tăng, y lúc lên lúc xuống, không theo xu hướng nào.'
            : kind === 'pos'
              ? 'Khi x tăng, y tăng theo và các điểm bám sát một đường thẳng dốc lên.'
              : 'Khi x tăng, y giảm và các điểm bám sát một đường thẳng dốc xuống.',
        ),
      ],
    };
  }),

  mcqText('pd-c-scenario-classify', 'nonlinear_functions', 'easy', (rng) => {
    const kind = pick(rng, KINDS);
    const sc = scenario(rng, kind);
    return {
      stem: `${sc.text} Which of the following best describes how the quantity changes over time?`,
      correct: KIND_LABEL[kind],
      wrong: KINDS.filter((k) => k !== kind).map((k) =>
        wt(
          KIND_LABEL[k],
          k.startsWith('lin') === kind.startsWith('lin')
            ? 'Đúng kiểu thay đổi nhưng sai chiều (tăng hay giảm).'
            : kind.startsWith('lin')
              ? 'Hàm mũ là NHÂN cùng một hệ số; ở đây mỗi kỳ cộng/trừ cùng một lượng.'
              : 'Tuyến tính là cộng/trừ cùng một lượng; ở đây mỗi kỳ nhân với cùng một hệ số.',
        ),
      ),
      steps: [S(sc.why), S(`Vậy đây là: ${KIND_LABEL[kind].toLowerCase()}.`)],
    };
  }),

  mcqText('pd-c-exp-model-params', 'nonlinear_functions', 'medium', (rng) => {
    const N = pickInt(rng, 2, 90) * 10;
    if (pick(rng, [true, false])) {
      const k = pickInt(rng, 2, 5);
      return {
        stem: `A lab dish starts with ${N} cells. Every hour, each cell splits into ${k} cells. The number of cells t hours later is modeled by A(t) = c · r^t. What are the values of c and r?`,
        correct: `c = ${N} and r = ${k}`,
        wrong: [
          wt(`c = ${k} and r = ${N}`, 'Đảo vai trò: c là giá trị ban đầu, r là hệ số nhân mỗi giờ.', 'swapped_slope_intercept'),
          wt(`c = ${N * k} and r = ${k}`, 'c là giá trị lúc t = 0, không phải sau một giờ.', 'off_by_one'),
          wt(`c = ${N} and r = ${k - 1 === 1 ? k + 1 : k - 1}`, `Mỗi tế bào thành ${k} tế bào nghĩa là số tế bào nhân ${k}.`),
        ],
        steps: [S('Lúc t = 0 có đúng số tế bào ban đầu: đó là c.', `A(0) = c = ${N}`), S(`Mỗi giờ số tế bào nhân ${k}: đó là r.`, `r = ${k}`)],
      };
    }
    const p = pick(rng, [10, 20, 25, 30, 40, 60, 75]);
    return {
      stem: `A sample contains ${N} grams of a substance. Each hour, ${p}% of the substance remaining at the start of that hour breaks down. The mass remaining t hours later is modeled by A(t) = c · r^t. What are the values of c and r?`,
      correct: `c = ${N} and r = ${num(1 - p / 100)}`,
      wrong: [
        wt(`c = ${N} and r = ${num(p / 100)}`, `${num(p / 100)} là phần bị mất; hệ số nhân là phần CÒN LẠI.`),
        wt(`c = ${N} and r = ${num(1 + p / 100)}`, 'Lượng chất giảm nên hệ số nhân phải nhỏ hơn 1.', 'sign_flip'),
        wt(`c = ${num(N * (1 - p / 100))} and r = ${num(1 - p / 100)}`, 'c là lượng lúc t = 0, không phải sau một giờ.', 'off_by_one'),
      ],
      steps: [S('Lúc t = 0 còn nguyên lượng ban đầu.', `c = ${N}`), S(`Mỗi giờ còn lại ${100 - p}%.`, `r = ${num(1 - p / 100)}`)],
    };
  }),

  mcqText('pd-c-scenario-pick', 'nonlinear_functions', 'medium', (rng) => {
    const target = pick(rng, KINDS);
    const scs = Object.fromEntries(KINDS.map((k) => [k, scenario(rng, k)])) as Record<Kind, { text: string; why: string }>;
    return {
      stem: `Which of the following situations is an example of ${KIND_LABEL[target].toLowerCase()}?`,
      correct: scs[target].text,
      wrong: KINDS.filter((k) => k !== target).map((k) => wt(scs[k].text, `${scs[k].why} Đây là ${KIND_LABEL[k].toLowerCase()}.`)),
      steps: [S(scs[target].why)],
    };
  }),
);

// ============================================================ Chương 4: tỉ lệ (co giãn một biến trong công thức)

/** `group`: hai biến luôn co giãn cùng nhau, cùng bậc `groupE`; `other`: biến lẻ có thể đổi kèm. */
type Formula = { q: string; rhs: string; desc: string; vars: Record<string, number>; group?: [string, string]; groupE?: number; other?: string };
const FORMULAS: Formula[] = [
  { q: 'P', rhs: 'frac(V^2,R)', desc: 'the power P used by a circuit, where V is the voltage and R is the resistance', vars: { V: 2, R: -1 } },
  { q: 'E', rhs: 'frac(1,2)mv^2', desc: 'the kinetic energy E of an object with mass m moving at speed v', vars: { m: 1, v: 2 } },
  { q: 'V', rhs: 'pi r^2h', desc: 'the volume V of a cylinder with radius r and height h', vars: { r: 2, h: 1 } },
  { q: 'F', rhs: 'frac(kab,d^2)', desc: 'the force F between two charged particles with charges a and b that are a distance d apart, where k is a constant', vars: { a: 1, b: 1, d: -2 } },
  { q: 'A', rhs: 'frac(1,2)(b + c)h', desc: 'the area A of a trapezoid with parallel sides b and c and height h', vars: { h: 1 }, group: ['b', 'c'], groupE: 1, other: 'h' },
  { q: 'a', rhs: 'frac(g(m - un),m + n)', desc: 'the acceleration a of two connected blocks with masses m and n, where g and u are constants', vars: {}, group: ['m', 'n'], groupE: 0 },
  { q: 'L', rhs: '4pi d^2s', desc: 'the total light output L of a lamp, where d is the distance from the lamp and s is the light received per unit area', vars: { d: 2, s: 1 } },
  { q: 'I', rhs: 'frac(P,4pi r^2)', desc: 'the intensity I of sound at a distance r from a speaker with power P', vars: { P: 1, r: -2 } },
  { q: 'V', rhs: 'frac(4,3)pi r^3', desc: 'the volume V of a sphere with radius r', vars: { r: 3 } },
];
const FACTORS: Array<[number, number, string]> = [
  [2, 1, 'doubled'],
  [3, 1, 'tripled'],
  [4, 1, 'quadrupled'],
  [1, 2, 'halved'],
  [1, 3, 'cut to one-third of its value'],
];

const effectFmt = (q: string) => (v: MathValue) => (v.num === v.den ? `${q} is unchanged.` : `${q} is multiplied by ${formatValueMath(v)}.`);

function ratPow(n: number, d: number, e: number): MathValue {
  return e >= 0 ? rat(n ** e, d ** e) : rat(d ** -e, n ** -e);
}
const mulR = (a: MathValue, b: MathValue) => rat(a.num * b.num, a.den * b.den);

const ch4: MathTemplate[] = [
  mcqNum('pd-c-scale-formula-effect', 'nonlinear_functions', 'medium', (rng) => {
    const F = pick(rng, FORMULAS);
    const names = Object.keys(F.vars);
    const two = F.group ? !!F.other && pick(rng, [true, false]) : names.length > 1 && pick(rng, [true, false]);
    const changes: Array<{ label: string; e: number; f: [number, number, string]; plural: boolean }> = [];
    if (F.group) {
      changes.push({ label: `both ${F.group[0]} and ${F.group[1]}`, e: F.groupE ?? 1, f: pick(rng, FACTORS), plural: true });
      if (two && F.other) changes.push({ label: F.other, e: F.vars[F.other] ?? 1, f: pick(rng, FACTORS), plural: false });
    } else {
      const first = pick(rng, names);
      changes.push({ label: first, e: F.vars[first]!, f: pick(rng, FACTORS), plural: false });
      if (two) {
        const second = names.find((nm) => nm !== first)!;
        changes.push({ label: second, e: F.vars[second]!, f: pick(rng, FACTORS), plural: false });
      }
    }
    const word = (c: (typeof changes)[number]) => (c.plural ? c.f[2].replace('its value', 'their values') : c.f[2]);
    const text = changes.map((c) => `${c.label} ${c.plural ? 'are' : 'is'} ${word(c)}`).join(' and ');
    const correct = changes.reduce((acc, c) => mulR(acc, ratPow(c.f[0], c.f[1], c.e)), rat(1));
    const linear = changes.reduce((acc, c) => mulR(acc, ratPow(c.f[0], c.f[1], Math.sign(c.e))), rat(1));
    const flipped = changes.reduce((acc, c) => mulR(acc, ratPow(c.f[0], c.f[1], -c.e)), rat(1));
    const onlyFirst = ratPow(changes[0]!.f[0], changes[0]!.f[1], changes[0]!.e);
    return {
      stem: `The formula ${F.q} = ${F.rhs} gives ${F.desc}. If ${text}, which of the following describes the effect on ${F.q}?`,
      correct,
      wrong: [
        w(linear, 'Bỏ qua số mũ: biến bình phương thì hệ số cũng phải bình phương.'),
        w(flipped, 'Đảo chiều: biến ở MẪU số tăng thì đại lượng giảm, và ngược lại.', 'inverted_fraction'),
        w(changes.length > 1 ? onlyFirst : ratPow(changes[0]!.f[0], changes[0]!.f[1], 2 * changes[0]!.e), changes.length > 1 ? 'Chỉ tính thay đổi thứ nhất, quên thay đổi thứ hai.' : 'Nhân đôi số mũ.'),
        w(mulR(correct, correct), 'Bình phương thêm một lần nữa kết quả đúng.'),
        w(rat(linear.den, linear.num), 'Vừa bỏ qua số mũ vừa đảo chiều.', 'inverted_fraction'),
        w(rat(changes[0]!.f[0], changes[0]!.f[1]), 'Coi đại lượng tỉ lệ thuận với biến vừa thay đổi — hãy thay vào công thức mà xem.'),
        w(rat(changes[0]!.f[1], changes[0]!.f[0]), 'Coi đại lượng tỉ lệ nghịch với biến vừa thay đổi.'),
        w(ratPow(changes[0]!.f[0], changes[0]!.f[1], 2), 'Bình phương hệ số thay đổi.'),
      ],
      fmt: effectFmt(F.q),
      steps: [
        S('Thay mỗi biến bằng giá trị mới (biến cũ nhân hệ số) rồi kéo các hệ số ra phía trước công thức.'),
        S('Biến mũ e thì hệ số của nó cũng mũ e; biến ở mẫu thì hệ số đi xuống mẫu.', `${changes.map((c) => `(${formatValueMath(rat(c.f[0], c.f[1]))})^(${c.e})`).join(' · ')} = ${formatValueMath(correct)}`),
      ],
    };
  }),
];

type Shape = { name: string; dims: Array<[string, number]>; measure: string };
const SHAPES: Shape[] = [
  { name: 'square', dims: [['side length', 2]], measure: 'area' },
  { name: 'cube', dims: [['edge length', 3]], measure: 'volume' },
  { name: 'circle', dims: [['radius', 2]], measure: 'area' },
  { name: 'sphere', dims: [['radius', 3]], measure: 'volume' },
  { name: 'rectangle', dims: [['length', 1], ['width', 1]], measure: 'area' },
  { name: 'right circular cylinder', dims: [['radius', 2], ['height', 1]], measure: 'volume' },
  { name: 'right circular cone', dims: [['radius', 2], ['height', 1]], measure: 'volume' },
];
const pctChange = (v: MathValue) => {
  const x = v.num / v.den;
  if (x === 0) return 'There is no change.';
  return x > 0 ? `It increases by ${num(x)}%.` : `It decreases by ${num(-x)}%.`;
};

const ROOT_K3: number[] = [];
const ROOT_K2: number[] = [];
for (let k = 2; k <= 60; k += 1) {
  if (Math.round(k ** (1 / 3)) ** 3 !== k) ROOT_K3.push(k);
  if (Math.round(Math.sqrt(k)) ** 2 !== k) ROOT_K2.push(k);
}

ch4.push(
  mcqNum('pd-c-scale-percent-change', 'percentages', 'medium', (rng) => {
    const sh = pick(rng, SHAPES);
    const ch = sh.dims.map(([nm, e]) => ({ nm, e, p: pick(rng, [10, 20, 25, 30, 40, 50]), up: pick(rng, [true, false]) }));
    const factor = ch.reduce((acc, c) => acc * (1 + (c.up ? c.p : -c.p) / 100) ** c.e, 1);
    const val = Math.round((factor - 1) * 1e6) / 1e4;
    const lin = ch.reduce((acc, c) => acc + (c.up ? c.p : -c.p) * c.e, 0);
    const clause = (c: (typeof ch)[number]) => `its ${c.nm} is ${c.up ? 'increased' : 'decreased'} by ${c.p}%`;
    const text = ch.length === 1 ? clause(ch[0]!) : `${clause(ch[0]!)} and ${clause(ch[1]!)}`;
    const first = ch[0]!;
    return {
      stem: `A ${sh.name} is changed so that ${text}. Which of the following describes the change in the ${sh.measure} of the ${sh.name}?`,
      correct: toRat(val),
      wrong: [
        w(lin, 'Cộng/nhân thẳng các phần trăm theo số mũ. Phải nhân các HỆ SỐ: (1 ± p) mũ e.', 'percent_added_instead_of_multiplied'),
        w(toRat(Math.round(((1 + (first.up ? first.p : -first.p) / 100) ** first.e - 1) * 1e6) / 1e4), ch.length > 1 ? 'Chỉ tính thay đổi của kích thước thứ nhất.' : 'Kích thước thay đổi được nâng lên luỹ thừa của công thức — ở đây quên nâng.'),
        w(ch.length > 1 ? toRat(Math.round(((1 + (first.up ? first.p : -first.p) / 100) * (1 + (ch[1]!.up ? ch[1]!.p : -ch[1]!.p) / 100) - 1) * 1e6) / 1e4) : (first.up ? first.p : -first.p), ch.length > 1 ? 'Quên bình phương hệ số của bán kính.' : 'Coi diện tích/thể tích thay đổi cùng phần trăm với cạnh.'),
        w(ch.length > 1 ? toRat(Math.round(((1 + (ch[1]!.up ? ch[1]!.p : -ch[1]!.p) / 100) ** ch[1]!.e - 1) * 1e6) / 1e4) : 2 * (first.up ? first.p : -first.p), ch.length > 1 ? 'Chỉ tính thay đổi của kích thước thứ hai.' : 'Nhân đôi phần trăm thay vì nhân hệ số.'),
      ],
      fmt: pctChange,
      steps: [
        S(`Mỗi kích thước nhân với hệ số của nó; ${sh.measure} tỉ lệ với ${ch.map((c) => `${c.nm} mũ ${c.e}`).join(' nhân ')}.`, ch.map((c) => `(${num(1 + (c.up ? c.p : -c.p) / 100)})^${c.e}`).join(' · ') + ` = ${num(factor)}`),
        S('Đổi hệ số ra phần trăm thay đổi.', `${num(factor)} - 1 = ${num(factor - 1)}  →  ${num(val)}%`),
      ],
    };
  }),

  mcqNum('pd-c-scale-root-factor', 'nonlinear_functions', 'medium', (rng) => {
    const vol = pick(rng, [true, false]);
    const K = pick(rng, vol ? ROOT_K3 : ROOT_K2);
    const sh = vol ? pick(rng, ['sphere', 'cube']) : pick(rng, ['circle', 'square']);
    const dim = sh === 'cube' || sh === 'square' ? (sh === 'cube' ? 'edge length' : 'side length') : 'radius';
    const e = vol ? 3 : 2;
    const r2 = (x: number) => toRat(Math.round(x * 100) / 100);
    return {
      stem: `The ${vol ? 'volume' : 'area'} of a ${sh} is multiplied by ${K}. To the nearest hundredth, by what factor is its ${dim} multiplied?`,
      correct: r2(K ** (1 / e)),
      wrong: [
        w(r2(K / e), `Chia ${K} cho ${e} thay vì lấy căn bậc ${e}.`),
        w(r2(K ** (1 / (5 - e))), vol ? 'Lấy căn bậc hai — thể tích tỉ lệ với LẬP PHƯƠNG kích thước.' : 'Lấy căn bậc ba — diện tích tỉ lệ với BÌNH PHƯƠNG kích thước.'),
        w(r2(K ** e > 999 ? K * e : K ** e), 'Nâng lên luỹ thừa thay vì lấy căn: đang đi ngược từ thể tích/diện tích về kích thước.', 'inverted_fraction'),
      ],
      fmt: (v) => num(v.num / v.den),
      steps: [
        S(`${vol ? 'Thể tích' : 'Diện tích'} tỉ lệ với ${dim} mũ ${e}: gọi hệ số của ${dim} là k.`, `k^${e} = ${K}`),
        S(`Lấy căn bậc ${e}.`, `k = ${K}^(frac(1,${e})) ≈ ${num(Math.round(K ** (1 / e) * 100) / 100)}`),
      ],
    };
  }),

  mcqNum('pd-c-scale-area-percent-back', 'percentages', 'medium', (rng) => {
    const up = pick(rng, [true, false]);
    const p = up ? pick(rng, [5, 10, 15, 20, 25, 30, 40, 50, 60]) : pick(rng, [5, 10, 15, 20, 25, 30, 40, 50, 60, 70]);
    const f = 1 + (up ? p : -p) / 100;
    const areaPct = Math.round(f * f * 10000) / 100;
    const sh = pick(rng, [
      ['square', 'side length'],
      ['circle', 'radius'],
      ['isosceles right triangle', 'leg length'],
      ['regular hexagon', 'side length'],
      ['equilateral triangle', 'side length'],
      ['regular octagon', 'side length'],
    ] as const);
    const changePct = Math.round(Math.abs(areaPct - 100) * 100) / 100;
    const describe = pick(rng, [true, false]);
    return {
      stem: describe
        ? `The ${sh[1]} of a ${sh[0]} is changed so that its area is ${num(areaPct)}% of the original area. By what percent was the ${sh[1]} ${up ? 'increased' : 'decreased'}?`
        : `The ${sh[1]} of a ${sh[0]} is changed so that its area ${up ? 'increases' : 'decreases'} by ${num(changePct)}%. By what percent was the ${sh[1]} ${up ? 'increased' : 'decreased'}?`,
      correct: p,
      wrong: [
        w(toRat(changePct), 'Coi cạnh thay đổi cùng phần trăm với diện tích.'),
        w(toRat(changePct / 2), 'Chia đôi phần trăm của diện tích thay vì lấy căn bậc hai hệ số.', 'percent_added_instead_of_multiplied'),
        w(toRat(Math.round(Math.sqrt(changePct) * 100) / 100), 'Lấy căn của phần trăm THAY ĐỔI thay vì căn của hệ số diện tích mới.'),
        w(100 - p, 'Tính phần còn lại thay vì phần thay đổi.'),
      ],
      fmt: pctFmt,
      steps: [
        S(`Diện tích tỉ lệ với bình phương ${sh[1]}: hệ số của diện tích là bình phương hệ số của cạnh.`, `k^2 = ${num(f * f)}`),
        S('Lấy căn bậc hai rồi đổi ra phần trăm.', `k = ${num(f)}`),
        S(`Vậy cạnh ${up ? 'tăng' : 'giảm'} ${p}%.`),
      ],
    };
  }),
);

const RATIO_SQ: Array<[number, number]> = [
  [1, 4],
  [1, 9],
  [4, 9],
  [1, 16],
  [9, 16],
  [4, 25],
  [9, 4],
  [4, 1],
  [9, 1],
  [16, 9],
  [25, 4],
  [1, 25],
];

ch4.push(
  mcqNum('pd-c-scale-solve-inverse', 'nonlinear_functions', 'hard', (rng) => {
    const ctx = pick(rng, [
      { f: 'I = frac(P,4pi r^2)', same: 'I', given: 'P', asked: 'r', e: 1 / 2, desc: 'gives the sound intensity I at a distance r from a speaker with power P', gw: 'power', aw: 'distance from the listener' },
      { f: 'E = frac(1,2)mv^2', same: 'E', given: 'm', asked: 'v', e: -1 / 2, desc: 'gives the kinetic energy E of an object with mass m moving at speed v', gw: 'mass', aw: 'speed' },
      { f: 'V = frac(1,3)pi r^2h', same: 'V', given: 'h', asked: 'r', e: -1 / 2, desc: 'gives the volume V of a cone with radius r and height h', gw: 'height', aw: 'radius' },
      { f: 'L = 4pi d^2s', same: 'L', given: 's', asked: 'd', e: -1 / 2, desc: 'gives the total light output L of a lamp, where s is the light received per unit area at a distance d', gw: 'light received per unit area', aw: 'distance' },
    ] as const);
    const [a, b] = pick(rng, RATIO_SQ);
    const sa = Math.round(Math.sqrt(a));
    const sb = Math.round(Math.sqrt(b));
    const ans = ctx.e > 0 ? rat(sa, sb) : rat(sb, sa);
    const [A, B] = pick(rng, [
      ['A', 'B'],
      ['X', 'Y'],
      ['P', 'Q'],
    ] as const);
    return {
      stem: `The formula ${ctx.f} ${ctx.desc}. Objects ${A} and ${B} have the same value of ${ctx.same}. The ${ctx.gw} for ${A} is ${fr(a, b)} times the ${ctx.gw} for ${B}. The ${ctx.aw} for ${A} is how many times the ${ctx.aw} for ${B}?`,
      correct: ans,
      wrong: [
        w(ctx.e > 0 ? rat(a, b) : rat(b, a), 'Quên lấy căn: biến được hỏi bị bình phương trong công thức.', 'forgot_square_root'),
        w(ctx.e > 0 ? rat(sb, sa) : rat(sa, sb), 'Sai chiều: xem biến được hỏi nằm cùng phía hay khác phía phân số với biến đã cho.', 'inverted_fraction'),
        w(ctx.e > 0 ? rat(b, a) : rat(a, b), 'Vừa quên lấy căn vừa sai chiều.'),
      ],
      steps: [
        S(`${ctx.same} bằng nhau nên đặt hai công thức bằng nhau; hằng số triệt tiêu.`),
        S(`Tỉ số của ${ctx.asked} là căn bậc hai của tỉ số ${ctx.given} (hoặc nghịch đảo của nó, tuỳ vị trí trong công thức).`, `frac(${ctx.asked}_A,${ctx.asked}_B) = ${formatValueMath(ans)}`),
      ],
    };
  }),
);

// ============================================================ Chương 5: tốc độ

/** Hệ số (số hữu tỉ) đứng trước một cụm chữ: 1 → "", 3 → "3", 5/2 → "frac(5,2)". */
function coefOf(v: MathValue, tail: string): string {
  if (v.num === v.den) return tail;
  if (v.den === 1) return `${v.num}${tail}`;
  return `frac(${v.num},${v.den})${tail}`;
}

const SPEED_UNITS = [
  ['miles per hour', 'hours', 'miles'],
  ['kilometers per hour', 'hours', 'kilometers'],
  ['meters per second', 'seconds', 'meters'],
] as const;
const SLOW_WORD: Record<number, string> = { 2: 'half', 3: 'one-third of', 4: 'one-fourth of', 5: 'one-fifth of' };

/** Giờ đồng hồ "h:mm a.m./p.m." từ số phút kể từ nửa đêm. */
function clock(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${h24 < 12 ? 'a.m.' : 'p.m.'}`;
}

const ch5: MathTemplate[] = [
  mcqText('pd-c-rate-two-legs-expr', 'ratios_rates_units', 'easy', (rng) => {
    const a = pickInt(rng, 2, 5);
    const k = pickInt(rng, 2, 6);
    const [unit, tu, du] = pick(rng, SPEED_UNITS);
    const who = pick(rng, ['A drone', 'A boat', 'A cyclist', 'A train']);
    const c = rat(a + k, a);
    return {
      stem: `${who} travels at x ${unit} for y ${tu}, and then travels at ${SLOW_WORD[a]} that speed for ${k} times as long. In terms of x and y, what is the total distance traveled, in ${du}?`,
      correct: coefOf(c, 'xy'),
      wrong: [
        wt(coefOf(rat(1 + k * a), 'xy'), `Nhân tốc độ với ${a} thay vì chia: tốc độ sau chỉ bằng một phần ${a}.`, 'inverted_fraction'),
        wt(coefOf(rat(1 + k), 'xy'), `Quên giảm tốc độ ở chặng sau.`),
        wt(coefOf(rat(a * k + 1, a * k), 'xy'), `Chia cả thời gian lẫn tốc độ — thời gian chặng sau DÀI GẤP ${k}, không phải ngắn đi.`),
      ],
      steps: [
        S('Chặng đầu: quãng đường bằng tốc độ nhân thời gian.', 'xy'),
        S(`Chặng sau: tốc độ bằng x chia ${a}, thời gian ${k}y.`, `frac(x,${a}) · ${k}y = ${coefOf(rat(k, a), 'xy')}`),
        S('Cộng hai chặng.', `xy + ${coefOf(rat(k, a), 'xy')} = ${coefOf(c, 'xy')}`),
      ],
    };
  }),

  grid('pd-c-rate-daily-weekly-grid', 'ratios_rates_units', 'easy', (rng) => {
    const g = pick(rng, [5, 8, 10, 12, 15, 20, 25, 30]);
    const k = pickInt(rng, 2, 6);
    const days = pick(rng, [7, 14, 30]);
    const ctx = pick(rng, [
      ['An athlete', 'grams of protein', 'shake'],
      ['A hiker', 'grams of fiber', 'granola bar'],
      ['A patient', 'milligrams of iron', 'tablet'],
      ['A gardener', 'liters of water for a hedge', 'watering can'],
    ] as const);
    return {
      stem: `${ctx[0]} needs ${g * k} ${ctx[1]} each day. Each ${ctx[2]} provides ${g} ${ctx[1]}. How many ${ctx[2]}s are needed for ${days} days?`,
      answer: k * days,
      steps: [
        S(`Mỗi ngày cần số ${ctx[2]} là nhu cầu chia cho lượng trong một ${ctx[2]}.`, `frac(${g * k},${g}) = ${k}`),
        S(`Nhân với ${days} ngày.`, `${k} × ${days} = ${k * days}`),
      ],
    };
  }),

  mcqNum('pd-c-rate-from-two-readings', 'linear_functions', 'easy', (rng) => {
    if (pick(rng, [true, false])) {
      const r = pickNonZeroInt(rng, -40, 90);
      const y1 = pickInt(rng, 1995, 2012);
      const gap = pickInt(rng, 3, 10);
      const v1 = pickInt(rng, 500, 3000);
      const v2 = v1 + r * gap;
      const noun = pick(rng, ['students enrolled at a school', 'trees in a city park', 'members of a credit union', 'books in a library']);
      return {
        stem: `The number of ${noun} was ${v1} in ${y1} and ${v2} in ${y1 + gap}. If the number changed by the same amount each year, by how much did it change each year?`,
        correct: r,
        wrong: [
          w(r * gap, 'Đây là thay đổi của cả giai đoạn — phải chia cho số năm.', 'stopped_too_early'),
          w(-r, 'Sai dấu: lấy giá trị đầu trừ giá trị sau.', 'sign_flip'),
          w(toRat(Math.round((r * gap) / (gap + 1) * 100) / 100), 'Đếm số năm cả hai đầu (lệch một).', 'off_by_one'),
        ],
        steps: [S('Thay đổi mỗi năm bằng chênh lệch chia cho số năm.', `frac(${v2} - ${v1},${y1 + gap} - ${y1}) = ${r}`)],
      };
    }
    const per = pick(rng, [5, 10, 100]);
    const rk = pickInt(rng, 2, 40);
    const d1 = pickInt(rng, 1, 6) * per;
    const gapU = pickInt(rng, 2, 8) * per;
    const p1 = pickInt(rng, 100, 400);
    const p2 = p1 + (rk * gapU) / per;
    const ctx = pick(rng, [
      ['the water pressure', 'meters below the surface', 'kilopascals', 'meters'],
      ['the air temperature inside a kiln', 'minutes after it is switched on', 'degrees Celsius', 'minutes'],
      ['the elevation of a hiking trail', 'meters from the trailhead (measured along the trail)', 'meters', 'meters'],
    ] as const);
    return {
      stem: `At ${d1} ${ctx[1]}, ${ctx[0]} is ${p1} ${ctx[2]}. At ${d1 + gapU} ${ctx[1]}, it is ${p2} ${ctx[2]}. If ${ctx[0]} increases at a constant rate, by how many ${ctx[2]} does it increase for every ${per} ${ctx[3]}?`,
      correct: rk,
      wrong: [
        w(toRat(rk / per), `Đây là mức tăng cho MỘT ${ctx[3].replace(/s$/, '')}, đề hỏi cho mỗi ${per}.`, 'stopped_too_early'),
        w(p2 - p1, 'Đây là mức tăng của cả đoạn, chưa chia.'),
        w(toRat(Math.round((p2 / (d1 + gapU)) * per * 100) / 100), 'Chia giá trị cho vị trí thay vì chia CHÊNH LỆCH cho CHÊNH LỆCH.'),
      ],
      steps: [
        S('Tốc độ tăng là chênh lệch giá trị chia chênh lệch vị trí.', `frac(${p2} - ${p1},${gapU}) = ${num(rk / per)}`),
        S(`Nhân với ${per}.`, `${num(rk / per)} × ${per} = ${rk}`),
      ],
    };
  }),

  grid('pd-c-rate-inverse-time-grid', 'ratios_rates_units', 'easy', (rng) => {
    const r2 = pickInt(rng, 2, 30);
    const r1 = pickInt(rng, 2, 30);
    const T2 = pickInt(rng, 2, 30) * (r1 / gcd(r1, r2));
    const T1 = (T2 * r2) / r1;
    const ctx = pick(rng, [
      ['A hose fills a pool', 'liters per minute', 'minutes'],
      ['A pump empties a flooded basement', 'gallons per minute', 'minutes'],
      ['A printer prints a batch of flyers', 'pages per minute', 'minutes'],
    ] as const);
    return {
      stem: `${ctx[0]} at a rate of ${r1} ${ctx[1]} in ${T1} ${ctx[2]}. At a rate of ${r2} ${ctx[1]}, how many ${ctx[2]} would the same job take?`,
      answer: T2,
      steps: [
        S('Khối lượng công việc bằng tốc độ nhân thời gian.', `${r1} × ${T1} = ${r1 * T1}`),
        S('Chia cho tốc độ mới.', `frac(${r1 * T1},${r2}) = ${T2}`),
      ],
    };
  }),

  mcqText('pd-c-rate-unit-cost-expr', 'ratios_rates_units', 'easy', (rng) => {
    const Nn = pickInt(rng, 2, 60);
    const [a, dd] = pick(rng, [
      ['a', 'd'],
      ['n', 'c'],
      ['k', 'p'],
    ] as const);
    const item = pick(rng, ['packets of seeds', 'notebooks', 'bags of rice', 'light bulbs']);
    return {
      stem: `If ${a} ${item} cost ${dd} dollars, what is the cost, in dollars, of ${Nn} ${item} at the same price per item?`,
      correct: `frac(${Nn}${dd},${a})`,
      wrong: [
        wt(`frac(${Nn}${a},${dd})`, 'Lật ngược đơn giá: giá một món là tiền chia số món.', 'inverted_fraction'),
        wt(`${Nn}${a}${dd}`, 'Nhân thay vì chia cho số món.'),
        wt(`frac(${a}${dd},${Nn})`, `Chia cho ${Nn} thay vì nhân.`, 'inverted_fraction'),
      ],
      steps: [S('Giá một món bằng tổng tiền chia số món.', `frac(${dd},${a})`), S(`Nhân với ${Nn} món.`, `${Nn} · frac(${dd},${a}) = frac(${Nn}${dd},${a})`)],
    };
  }),

  mcqText('pd-c-rate-share-expr', 'ratios_rates_units', 'easy', (rng) => {
    const k = pickInt(rng, 4, 40);
    const [n, a, b] = pick(rng, [
      ['n', 'a', 'b'],
      ['m', 'p', 'q'],
      ['k', 'r', 's'],
    ] as const);
    const ctx = pick(rng, [
      ['boxes of markers', 'markers', 'art classes', 'students', 'box'],
      ['cases of water bottles', 'bottles', 'teams', 'players', 'case'],
      ['packs of pencils', 'pencils', 'study groups', 'members', 'pack'],
    ] as const);
    return {
      stem: `A school buys ${n} ${ctx[0]}, and each ${ctx[4]} contains ${k} ${ctx[1]}. The ${ctx[1]} are shared equally among ${a} ${ctx[2]}, each with ${b} ${ctx[3]}, and every one of the ${ctx[3]} receives the same number. How many ${ctx[1]} does each of the ${ctx[3]} receive?`,
      correct: `frac(${k}${n},${a}${b})`,
      wrong: [
        wt(`frac(${k}${n},${a})`, `Mới chia cho số nhóm; mỗi nhóm còn ${b} người nữa.`, 'stopped_too_early'),
        wt(`frac(${a}${b},${k}${n})`, 'Lật ngược phép chia.', 'inverted_fraction'),
        wt(`frac(${n},${a}${b})`, `Quên rằng mỗi hộp có ${k} món.`),
      ],
      steps: [
        S('Tổng số món bằng số hộp nhân số món mỗi hộp.', `${k}${n}`),
        S('Tổng số người bằng số nhóm nhân số người mỗi nhóm.', `${a}${b}`),
        S('Chia đều.', `frac(${k}${n},${a}${b})`),
      ],
    };
  }),

  mcqNum('pd-c-rate-extrapolate', 'linear_functions', 'medium', (rng) => {
    const use = pickInt(rng, 2, 9);
    const a = pickInt(rng, 2, 6);
    const b = a + pickInt(rng, 2, 5);
    const target = b + pickInt(rng, 2, 6);
    const left = pickInt(rng, 1, 5) * use + pickInt(rng, 0, use - 1);
    const Fa = left + use * (target - a);
    const Fb = left + use * (target - b);
    const ctx = pick(rng, [
      ['A race car', 'liters of fuel', 'lap'],
      ['A snowplow', 'bags of salt', 'street'],
      ['A delivery van', 'packages', 'stop'],
    ] as const);
    return {
      stem: `${ctx[0]} uses the same amount at each ${ctx[2]}. It has ${Fa} ${ctx[1]} left after ${ctx[2]} ${a} and ${Fb} ${ctx[1]} left after ${ctx[2]} ${b}. After which ${ctx[2]} will it have exactly ${left} ${ctx[1]} left?`,
      correct: target,
      wrong: [
        w(target - 1, 'Lệch một: đếm số chặng cần thêm rồi cộng vào nhầm mốc.', 'off_by_one'),
        w(target + 1, 'Lệch một về phía sau.', 'off_by_one'),
        w(b + Math.round((Fb - left) / (Fa - Fb)), `Chia lượng cần dùng cho lượng của cả ${b - a} chặng thay vì cho lượng một chặng.`),
      ],
      steps: [
        S(`Mỗi ${ctx[2]} dùng hết chênh lệch chia số chặng.`, `frac(${Fa} - ${Fb},${b} - ${a}) = ${use}`),
        S(`Từ mốc ${b}, cần dùng thêm bao nhiêu chặng.`, `frac(${Fb} - ${left},${use}) = ${target - b}`),
        S('Cộng vào mốc.', `${b} + ${target - b} = ${target}`),
      ],
    };
  }),

  grid('pd-c-rate-clock-total', 'linear_functions', 'medium', (rng) => {
    const perHalf = pickInt(rng, 5, 60);
    const t1 = 60 * pickInt(rng, 7, 10) + 30 * pickInt(rng, 0, 1);
    const h1 = pickInt(rng, 2, 6);
    const h2 = pickInt(rng, 1, 5);
    const t2 = t1 + 30 * h1;
    const t3 = t2 + 30 * h2;
    const A = pickInt(rng, 20, 400);
    const B = A + perHalf * h1;
    const C = B + perHalf * h2;
    const ctx = pick(rng, [
      ['a crew had unloaded', 'crates'],
      ['a machine had filled', 'bottles'],
      ['volunteers had packed', 'food boxes'],
    ] as const);
    return {
      stem: `By ${clock(t1)}, ${ctx[0]} a total of ${A} ${ctx[1]}. By ${clock(t2)}, the total was ${B} ${ctx[1]}. If the work continued at the same constant rate, what was the total number of ${ctx[1]} by ${clock(t3)}?`,
      answer: C,
      steps: [
        S('Tốc độ bằng số thêm được chia thời gian trôi qua.', `frac(${B} - ${A},${num(h1 / 2)}) = ${perHalf * 2}`),
        S('Cộng thêm phần làm trong khoảng thời gian sau.', `${B} + ${perHalf * 2} × ${num(h2 / 2)} = ${C}`),
      ],
    };
  }),

  mcqText('pd-c-rate-budget-weeks-expr', 'ratios_rates_units', 'medium', (rng) => {
    const k = pickInt(rng, 2, 6);
    const M = 10 * pickInt(rng, 3, 40);
    const v = pick(rng, ['d', 'w', 'p']);
    const what = pick(rng, ['groceries', 'bus fares', 'books', 'music lessons']);
    const frac1 = k === 2 ? 'one-half' : k === 3 ? 'one-third' : k === 4 ? 'one-fourth' : k === 5 ? 'one-fifth' : 'one-sixth';
    return {
      stem: `Mina earns ${v} dollars each week and spends ${frac1} of it on ${what}. At this rate, how many weeks will it take her to spend a total of $${M} on ${what}?`,
      correct: `frac(${k * M},${v})`,
      wrong: [
        wt(`frac(${M},${k}${v})`, `Chia cho ${k} thay vì nhân: mỗi tuần chỉ tiêu một phần ${k} số tiền.`, 'inverted_fraction'),
        wt(`frac(${v},${k * M})`, 'Lật ngược phép chia.', 'inverted_fraction'),
        wt(`frac(${M},${v})`, `Quên rằng chỉ một phần ${k} thu nhập được dùng.`),
      ],
      steps: [
        S(`Mỗi tuần tiêu cho ${what}.`, `frac(${v},${k})`),
        S('Số tuần bằng tổng cần tiêu chia cho mức tiêu mỗi tuần.', `${M} ÷ frac(${v},${k}) = frac(${k * M},${v})`),
      ],
    };
  }),

  mcqText('pd-c-rate-fee-expr', 'linear_equations_two_var', 'medium', (rng) => {
    const F = 5 * pickInt(rng, 4, 40);
    const G = 5 * pickInt(rng, 2, 30);
    const ctx = pick(rng, [
      ['A software company', 'installation fee', 'monthly support fee', 'business'],
      ['A web host', 'setup fee', 'monthly hosting fee', 'client'],
      ['A security firm', 'installation fee', 'monthly monitoring fee', 'home'],
    ] as const);
    return {
      stem: `${ctx[0]} charges each ${ctx[3]} a one-time ${ctx[1]} of $${F} and a ${ctx[2]} of $${G}. Which of the following gives the total amount, in dollars, collected from c ${ctx[3]}s that each use the service for m months?`,
      correct: `${F}c + ${G}cm`,
      wrong: [
        wt(`${F} + ${G}cm`, `Phí ${F} là của MỖI khách, không phải một lần cho tất cả.`),
        wt(`${F + G}cm`, 'Cộng phí một lần vào phí hằng tháng rồi nhân cho mọi tháng.'),
        wt(`${F}c + ${G}m`, 'Phí hằng tháng cũng tính cho từng khách, phải nhân cả c.'),
      ],
      steps: [S('Phí một lần: mỗi khách một lần.', `${F}c`), S('Phí hằng tháng: mỗi khách, mỗi tháng.', `${G}cm`), S('Cộng lại.', `${F}c + ${G}cm`)],
    };
  }),

  mcqText('pd-c-rate-temp-expr', 'linear_functions', 'medium', (rng) => {
    const dd = pickInt(rng, 2, 12);
    let m = pickInt(rng, 2, 15);
    if (m === dd) m += 1;
    const c = rat(dd, m);
    const ctx = pick(rng, [
      ['The temperature of an oven', 'degrees'],
      ['The water level in a reservoir', 'centimeters'],
      ['The height of a stack of pancakes', 'millimeters'],
    ] as const);
    return {
      stem: `${ctx[0]} is t ${ctx[1]} and rises ${dd} ${ctx[1]} every ${m} minutes. Which of the following gives the reading, in ${ctx[1]}, x minutes later?`,
      correct: `t + ${coefOf(c, 'x')}`,
      wrong: [
        wt(`t + ${coefOf(rat(m, dd), 'x')}`, 'Lật ngược tốc độ: tăng bao nhiêu chia cho bao nhiêu phút.', 'inverted_fraction'),
        wt(`t + ${dd}x`, `${dd} là mức tăng mỗi ${m} phút, không phải mỗi phút.`),
        wt(`${coefOf(c, 't')} + x`, 'Nhân nhầm tốc độ vào giá trị ban đầu.', 'swapped_slope_intercept'),
        wt(`t + ${m}x`, `Dùng số phút ${m} làm mức tăng mỗi phút.`),
        wt(`t + frac(x,${dd * m})`, 'Chia cho cả mức tăng lẫn số phút.'),
      ],
      steps: [S('Tốc độ tăng mỗi phút.', `frac(${dd},${m})`), S('Sau x phút tăng thêm tốc độ nhân x.', `t + ${coefOf(c, 'x')}`)],
    };
  }),

  mcqText('pd-c-rate-discount-additional-expr', 'linear_equations_two_var', 'medium', (rng) => {
    const p = pick(rng, [10, 15, 20, 25, 30, 40, 50, 60]);
    const A = 2 * pickInt(rng, 4, 40);
    const f = num(1 - p / 100);
    const each = num((A * (100 - p)) / 100);
    const item = pick(rng, ['T-shirts', 'plants', 'concert tickets', 'phone cases']);
    return {
      stem: `A store sells ${item}. The first one costs $${A}, and each additional one costs ${p}% less than the first. Which of the following gives the cost, in dollars, of buying n of them, where n > 1?`,
      correct: `${A} + ${each}(n - 1)`,
      wrong: [
        wt(`${each}n`, 'Giảm giá cả món đầu tiên — món đầu tính nguyên giá.'),
        wt(`${A} + ${each}n`, 'Tính dư một món: sau món đầu chỉ còn n − 1 món.', 'off_by_one'),
        wt(`${A} + ${num((A * p) / 100)}(n - 1)`, `Nhân với phần được giảm (${p}%) thay vì phần phải trả (${100 - p}%).`),
        wt(`${A}n`, 'Quên giảm giá cho các món thêm.'),
      ],
      steps: [
        S(`Mỗi món thêm có giá bằng ${100 - p}% món đầu.`, `${A} × ${f} = ${each}`),
        S('Có n − 1 món thêm, cộng với món đầu.', `${A} + ${each}(n - 1)`),
      ],
    };
  }),

  mcqText('pd-c-rate-boxes-expr', 'ratios_rates_units', 'medium', (rng) => {
    const k = pickInt(rng, 2, 9);
    const D = pickInt(rng, 2, 9);
    const ctx = pick(rng, [
      ['cupcakes', 'baker'],
      ['candles', 'candle maker'],
      ['cookies', 'volunteer'],
    ] as const);
    return {
      stem: `A box holds x ${ctx[0]}. Each ${ctx[1]} makes y ${ctx[0]} per day. If ${k}x ${ctx[1]}s work for ${D} days, how many full boxes of ${ctx[0]} can be filled?`,
      correct: `${k * D}y`,
      wrong: [
        wt(`${k * D}xy`, 'Quên chia cho số bánh mỗi hộp (x).'),
        wt(`frac(${k * D}y,x)`, `Số người làm là ${k}x, nên x ở tử và mẫu triệt tiêu — không còn x ở mẫu.`),
        wt(`${k + D}y`, 'Cộng số người với số ngày thay vì nhân.'),
        wt(`frac(${k * D}x,y)`, 'Lật ngược: chia cho năng suất thay vì nhân.', 'inverted_fraction'),
      ],
      steps: [
        S('Tổng số làm được bằng số người nhân năng suất nhân số ngày.', `${k}x · y · ${D} = ${k * D}xy`),
        S('Chia cho số mỗi hộp.', `frac(${k * D}xy,x) = ${k * D}y`),
      ],
    };
  }),

  mcqText('pd-c-rate-pizza-expr', 'ratios_rates_units', 'medium', (rng) => {
    const sp = pickInt(rng, 1, 3);
    const days = pickInt(rng, 2, 6);
    const s0 = sp * days;
    const P = pick(rng, [6, 8, 10, 12, 16, 20, 24].filter((q) => q !== s0));
    const c = rat(s0, P);
    const ctx = pick(rng, [
      ['classes', 'students', 'slices of pizza', 'pizza', 'slices'],
      ['teams', 'players', 'granola bars', 'carton', 'bars'],
      ['buses', 'passengers', 'sandwich halves', 'platter', 'halves'],
      ['cabins', 'campers', 'pancakes', 'batch', 'pancakes'],
    ] as const);
    const show = (v: MathValue, tail: string) => (v.den === 1 ? coefOf(v, tail) : `frac(${v.num === 1 ? '' : v.num}${tail},${v.den})`);
    return {
      stem: `There are m ${ctx[0]} with n ${ctx[1]} each. For ${days} days, every one of the ${ctx[1]} gets ${sp} ${ctx[2]} per day, and each ${ctx[3]} provides ${P} ${ctx[4]}. How many ${ctx[3]}${ctx[3].endsWith('ch') ? 'es' : 's'} are needed?`,
      correct: show(c, 'mn'),
      wrong: [
        wt(show(rat(P, s0), 'mn'), 'Lật ngược: số khay bằng tổng số phần chia cho số phần mỗi khay.', 'inverted_fraction'),
        wt(show(rat(sp, P), 'mn'), `Quên nhân với ${days} ngày.`, 'stopped_too_early'),
        wt(show(rat(1, P), 'mn'), `Quên rằng mỗi người nhận ${s0} phần tất cả.`),
        wt(`${coefOf(rat(s0), '')}mn`.replace(/^1mn$/, 'mn'), `Quên chia cho ${P} phần mỗi khay.`),
        wt(c.den === 1 ? `${c.num}(m + n)` : c.num === 1 ? `frac(m + n,${c.den})` : `frac(${c.num}(m + n),${c.den})`, 'Cộng số nhóm với số người mỗi nhóm thay vì nhân.'),
      ],
      steps: [
        S('Tổng số phần cần: số nhóm nhân số người nhân số phần mỗi ngày nhân số ngày.', `m · n · ${sp} · ${days} = ${s0}mn`),
        S(`Chia cho ${P} phần mỗi khay.`, `frac(${s0}mn,${P}) = ${show(c, 'mn')}`),
      ],
    };
  }),

  mcqText('pd-c-pct-change-expr-power', 'percentages', 'hard', (rng) => {
    const k = pickInt(rng, 2, 10);
    const P = 100 * pickInt(rng, 2, 90);
    const vv = pick(rng, ['r', 'p', 'q']);
    const g = `(1 + frac(${vv},100))^${k}`;
    return {
      stem: `The value of an investment t years after it is made is ${P}(1 + frac(${vv},100))^t dollars, where ${vv} is a positive constant. Which of the following gives the percent increase in the value of the investment over the first ${k} years?`,
      correct: `100(${g} - 1)`,
      wrong: [
        wt(`${k}${vv}`, `Nhân ${vv}% với ${k} năm — lãi kép cho ra nhiều hơn thế.`, 'percent_added_instead_of_multiplied'),
        wt(`100${g}`, 'Chưa trừ 1: đây là giá trị mới so với cũ, chưa phải phần TĂNG.', 'stopped_too_early'),
        wt(`${g} - 1`, 'Đây là phần tăng ở dạng thập phân — còn phải nhân 100 để ra phần trăm.', 'dropped_unit_conversion'),
      ],
      steps: [
        S(`Sau ${k} năm giá trị bằng giá trị đầu nhân hệ số.`, `${P}${g}`),
        S('Phần trăm tăng bằng (hệ số − 1) × 100.', `100(${g} - 1)`),
      ],
    };
  }),

  mcqNum('pd-c-avg-speed-two-legs', 'ratios_rates_units', 'hard', (rng) => {
    const v1 = pickInt(rng, 20, 70);
    let v2 = pickInt(rng, 20, 70);
    if (v2 === v1) v2 += 7;
    const d1 = pickInt(rng, 20, 200);
    const d2 = pickInt(rng, 20, 200);
    const avg = (d1 + d2) / (d1 / v1 + d2 / v2);
    const r2 = (x: number) => toRat(Math.round(x * 100) / 100);
    return {
      stem: `A driver travels ${d1} miles at an average speed of ${v1} miles per hour and then travels ${d2} miles at an average speed of ${v2} miles per hour. To the nearest hundredth of a mile per hour, what is the driver's average speed for the whole trip?`,
      correct: r2(avg),
      wrong: [
        w(r2((v1 + v2) / 2), 'Lấy trung bình cộng hai tốc độ — hai chặng mất thời gian khác nhau nên không được.'),
        w(r2((d1 * v1 + d2 * v2) / (d1 + d2)), 'Lấy trung bình có trọng số theo QUÃNG ĐƯỜNG — trọng số đúng là THỜI GIAN.'),
        w(r2((d1 + d2) / (v1 / d1 + v2 / d2)), 'Lật ngược thời gian mỗi chặng (lấy tốc độ chia quãng đường).', 'inverted_fraction'),
      ],
      fmt: (v) => num(v.num / v.den),
      steps: [
        S('Thời gian từng chặng bằng quãng đường chia tốc độ.', `frac(${d1},${v1}) + frac(${d2},${v2}) ≈ ${num(Math.round((d1 / v1 + d2 / v2) * 10000) / 10000)}`),
        S('Tốc độ trung bình bằng tổng quãng đường chia tổng thời gian.', `frac(${d1 + d2},${num(Math.round((d1 / v1 + d2 / v2) * 10000) / 10000)}) ≈ ${num(Math.round(avg * 100) / 100)}`),
      ],
    };
  }),

  grid('pd-c-unit-convert-rate-grid', 'ratios_rates_units', 'medium', (rng) => {
    if (pick(rng, [true, false])) {
      // feet / minute → inches / second: × 12 ÷ 60 = ÷ 5
      const ans = pickInt(rng, 1, 40);
      const M = pickInt(rng, 2, 9);
      const Fe = ans * 5 * M;
      return {
        stem: `A conveyor belt moves ${Fe} feet in ${M} minutes. What is its speed in inches per second? (1 foot = 12 inches)`,
        answer: ans,
        steps: [
          S('Tốc độ theo feet mỗi phút.', `frac(${Fe},${M}) = ${Fe / M}`),
          S('Đổi feet sang inch (nhân 12) và phút sang giây (chia 60).', `${Fe / M} × frac(12,60) = ${ans}`),
        ],
      };
    }
    // meters / minute → centimeters / second: × 100 ÷ 60 = × 5/3
    const ans = 5 * pickInt(rng, 1, 30);
    const M = pickInt(rng, 2, 9);
    const Me = (ans * 3 * M) / 5;
    return {
      stem: `A robot vacuum travels ${Me} meters in ${M} minutes. What is its speed in centimeters per second? (1 meter = 100 centimeters)`,
      answer: ans,
      steps: [
        S('Tốc độ theo mét mỗi phút.', `frac(${Me},${M}) = ${num(Me / M)}`),
        S('Đổi mét sang xentimét (nhân 100) và phút sang giây (chia 60).', `${num(Me / M)} × frac(100,60) = ${ans}`),
      ],
    };
  }),

  grid('pd-c-rate-scale-time-grid', 'ratios_rates_units', 'easy', (rng) => {
    const t1 = pick(rng, [1.5, 2.5, 3.5, 4.5, 0.5]);
    const per = pickInt(rng, 20, 90);
    const W = per * t1 * 2;
    const t2 = pickInt(rng, 2, 20);
    const ctx = pick(rng, [
      ['A typist types', 'words'],
      ['A machine caps', 'bottles'],
      ['A reader reads', 'lines of text'],
    ] as const);
    return {
      stem: `${ctx[0]} ${W} ${ctx[1]} in ${num(t1)} minutes. At this rate, how many ${ctx[1]} will be done in ${t2} minutes?`,
      answer: (W / t1) * t2,
      steps: [S('Tốc độ mỗi phút.', `frac(${W},${num(t1)}) = ${W / t1}`), S(`Nhân với ${t2} phút.`, `${W / t1} × ${t2} = ${(W / t1) * t2}`)],
    };
  }),

  grid('pd-c-rate-area-growth-grid', 'ratios_rates_units', 'hard', (rng) => {
    const r1 = pickInt(rng, 2, 6);
    const k = pickInt(rng, 2, 4);
    const r2 = r1 * k;
    const t1 = pickInt(rng, 1, 9);
    const ctx = pick(rng, [
      ['An ink spot on a paper towel', 'centimeters'],
      ['A circular patch of algae on a pond', 'meters'],
      ['A circular oil spill', 'meters'],
    ] as const);
    return {
      stem: `${ctx[0]} spreads as a circle whose AREA increases at a constant rate. The radius grows from 0 to ${r1} ${ctx[1]} in ${t1} minutes. How many minutes after it started will the radius be ${r2} ${ctx[1]}?`,
      answer: t1 * k * k,
      steps: [
        S('Diện tích tăng đều nên thời gian tỉ lệ với diện tích, tức tỉ lệ với bình phương bán kính.'),
        S(`Bán kính gấp ${k} thì diện tích gấp ${k * k}.`, `${t1} × ${k * k} = ${t1 * k * k}`),
      ],
    };
  }),

  mcqText('pd-c-slow-clock', 'ratios_rates_units', 'hard', (rng) => {
    const start = 60 * pickInt(rng, 6, 10);
    const dm = pickInt(rng, 2, 9);
    const E = pickInt(rng, 3, 8);
    const shown = start + 60 * E;
    const actual = start + E * (60 + dm);
    return {
      stem: `A clock runs slow at a constant rate. It is set to the correct time at ${clock(start)}. When the clock shows ${clock(start + 60)}, the correct time is ${clock(start + 60 + dm)}. When the clock shows ${clock(shown)} later that day, what is the correct time?`,
      correct: clock(actual),
      wrong: [
        wt(clock(start + 60 * E + dm), `Chỉ cộng ${dm} phút một lần — đồng hồ chậm ${dm} phút cho MỖI giờ nó chạy.`),
        wt(clock(start + 60 * E - E * dm), 'Trừ thay vì cộng: đồng hồ chậm nên giờ thật đi TRƯỚC giờ đồng hồ.', 'sign_flip'),
        wt(clock(start + E * (60 + dm) + dm), `Lệch một giờ khi đếm số giờ đồng hồ đã chạy (${E}).`, 'off_by_one'),
      ],
      steps: [
        S(`Mỗi 60 phút trên đồng hồ ứng với ${60 + dm} phút thật.`),
        S(`Từ lúc đặt giờ, đồng hồ đã chạy ${E} giờ.`, `${E} × ${60 + dm} = ${E * (60 + dm)}`),
        S(`Cộng ${E * (60 + dm)} phút vào ${clock(start)} được ${clock(actual)}.`),
      ],
    };
  }),

  grid('pd-c-commission-grid', 'ratios_rates_units', 'medium', (rng) => {
    const c = pick(rng, [5, 8, 10, 12, 15, 20]);
    const p = pick(rng, [10, 20, 25, 40, 50]);
    const n = pickInt(rng, 3, 200);
    const C = (n * p * c) / 100;
    return {
      stem: `A salesperson earns a commission of $${c} for every $100 of merchandise sold. Each lamp sells for $${p}. How many lamps must the salesperson sell to earn a commission of $${money(C)}?`,
      answer: n,
      steps: [
        S(`Mỗi đô la bán được cho ${num(c / 100)} đô la hoa hồng.`, `frac(${c},100) × ${p} = ${num((c * p) / 100)}`),
        S('Chia tổng hoa hồng cho hoa hồng mỗi đèn.', `frac(${num(C)},${num((c * p) / 100)}) = ${n}`),
      ],
    };
  }),

  mcqNum('pd-c-rate-distance-closest', 'ratios_rates_units', 'medium', (rng) => {
    const M = pick(rng, [12.5, 14.5, 15.5, 16.5, 18.5, 22.5]);
    const D = pickInt(rng, 3, 9);
    const H = pick(rng, [2, 3, 1.5, 2.5]);
    const ans = Math.round((D * 60 * H) / M);
    return {
      stem: `A cyclist rides ${D} kilometers in ${num(M)} minutes. At this rate, which of the following is closest to the distance, in kilometers, the cyclist will ride in ${num(H)} hours?`,
      correct: ans,
      wrong: [
        w(toRat(Math.round(((D * H) / M) * 100) / 100), 'Quên đổi giờ ra phút.', 'dropped_unit_conversion'),
        w(Math.round((D * 60) / M), 'Mới tính quãng đường trong MỘT giờ.', 'stopped_too_early'),
        w(Math.round((M * 60 * H) / D / 10), 'Lật ngược tỉ lệ (phút chia km).', 'inverted_fraction'),
        w(2 * ans, 'Nhân đôi nhầm số giờ.'),
      ],
      fmt: (v) => num(v.num / v.den),
      steps: [
        S(`Đổi ${num(H)} giờ ra phút.`, `${num(H)} × 60 = ${num(60 * H)}`),
        S('Lập tỉ lệ quãng đường trên thời gian.', `frac(${D},${num(M)}) = frac(x,${num(60 * H)})  →  x ≈ ${num(Math.round(((D * 60 * H) / M) * 100) / 100)}`),
      ],
    };
  }),

  mcqNum('pd-c-unit-max-full-cups', 'ratios_rates_units', 'medium', (rng) => {
    const L = pick(rng, [1.5, 2, 2.5, 3, 4, 5]);
    const c = pick(rng, [4, 5, 6, 8, 10, 12, 16, 20]);
    const drink = pick(rng, ['juice', 'iced tea', 'lemonade', 'sparkling water', 'cider']);
    const oz = 33.8 * L;
    const exact = oz / c;
    const fl = Math.floor(exact);
    return {
      stem: `One liter is approximately 33.8 fluid ounces. A bottle holds ${num(L)} liters of ${drink}, and each cup holds ${c} fluid ounces. What is the greatest number of cups that can be completely filled from the bottle?`,
      correct: fl,
      wrong: [
        w(fl + 1, `Làm tròn lên: ${num(Math.round(exact * 100) / 100)} cốc nghĩa là cốc cuối không đầy.`, 'off_by_one'),
        w(Math.floor(33.8 / c), `Quên nhân với ${num(L)} lít — mới tính cho một lít.`),
        w(Math.floor(oz), 'Quên chia cho dung tích một cốc.', 'stopped_too_early'),
      ],
      steps: [
        S('Đổi lít sang ounce.', `${num(L)} × 33.8 = ${num(oz)}`),
        S('Chia cho dung tích một cốc rồi lấy phần nguyên — chỉ đếm cốc đầy.', `frac(${num(oz)},${c}) ≈ ${num(Math.round(exact * 100) / 100)}  →  ${fl}`),
      ],
    };
  }),

  mcqNum('pd-c-fuel-cost-mpg', 'ratios_rates_units', 'medium', (rng) => {
    const m1 = pick(rng, [20, 24, 25, 30, 32]);
    const m2 = pick(rng, [36, 40, 45, 48, 50]);
    const S0 = (m2 / gcd(m1, m2)) * pickInt(rng, 2, 12);
    const Snew = (S0 * m1) / m2;
    return {
      stem: `Theo spends $${num(S0)} each month on gas for a car that gets ${m1} miles per gallon. He buys a new car that gets ${m2} miles per gallon. If he drives the same distance each month and the price of gas does not change, how much will he spend on gas each month with the new car?`,
      correct: toRat(Snew),
      wrong: [
        w(toRat(Math.round(((S0 * m2) / m1) * 100) / 100), 'Nhân với tỉ số ngược: xe đi được xa hơn mỗi gallon thì tốn ÍT xăng hơn.', 'inverted_fraction'),
        w(toRat(Math.round(S0 * (1 - (m2 - m1) / 100) * 100) / 100), 'Coi chênh lệch số dặm là phần trăm giảm giá.'),
        w(toRat(Math.round(S0 * (1 - (m2 - m1) / m1) * 100) / 100), `Giảm theo phần trăm tăng của số dặm (tính trên ${m1}) — tiền xăng tỉ lệ NGHỊCH với số dặm mỗi gallon.`),
      ],
      fmt: (v) => `$${num(v.num / v.den)}`,
      steps: [
        S('Tiền xăng tỉ lệ nghịch với số dặm mỗi gallon (cùng quãng đường, cùng giá).', `${num(S0)} × frac(${m1},${m2})`),
        S('Tính.', `= ${num(Snew)}`),
      ],
    };
  }),

  mcqNum('pd-c-cost-prop-area', 'ratios_rates_units', 'easy', (rng) => {
    const a = pickInt(rng, 2, 9);
    const b = pickInt(rng, 3, 12);
    const k = pickInt(rng, 2, 4);
    const C = pickInt(rng, 3, 60);
    const ctx = pick(rng, [
      ['rug', 'feet'],
      ['sheet of plywood', 'feet'],
      ['wall mural', 'meters'],
      ['solar panel', 'feet'],
    ] as const);
    return {
      stem: `The cost of a rectangular ${ctx[0]} is proportional to its area. A ${ctx[0]} that is ${a} ${ctx[1]} by ${b} ${ctx[1]} costs $${C}. At this rate, how much does a ${ctx[0]} that is ${k * a} ${ctx[1]} by ${k * b} ${ctx[1]} cost?`,
      correct: C * k * k,
      wrong: [
        w(C * k, `Mỗi chiều gấp ${k} thì diện tích gấp ${k * k}, không phải ${k}.`),
        w(C * 2 * k, 'Cộng tỉ lệ của hai chiều thay vì nhân.'),
        w(C + (k * a * k * b - a * b), 'Cộng phần diện tích tăng thêm như thể mỗi đơn vị diện tích giá 1 đô.'),
      ],
      fmt: (v) => `$${num(v.num / v.den)}`,
      steps: [
        S('Tỉ số diện tích mới so với cũ.', `frac(${k * a} × ${k * b},${a} × ${b}) = ${k * k}`),
        S('Giá tỉ lệ với diện tích.', `${C} × ${k * k} = ${C * k * k}`),
      ],
    };
  }),

  grid('pd-c-buy-sell-profit-grid', 'ratios_rates_units', 'medium', (rng) => {
    const n1 = pickInt(rng, 2, 6);
    const n2 = pickInt(rng, 2, 5);
    const c1 = n1 * pickInt(rng, 1, 4) + pickInt(rng, 1, n1 - 1);
    const sellEach = Math.ceil(c1 / n1) + pickInt(rng, 1, 4);
    const c2 = sellEach * n2;
    const profitEach = rat(c2 * n1 - c1 * n2, n1 * n2);
    const t = pickInt(rng, 2, 20);
    const items = profitEach.den * t;
    const P = profitEach.num * t;
    const thing = pick(rng, ['jars of honey', 'bars of soap', 'candles', 'bags of coffee']);
    return {
      stem: `A vendor buys ${thing} at ${n1} for $${c1} and sells them at ${n2} for $${c2}. How many ${thing} must the vendor sell to make a profit of $${num(P)}?`,
      answer: items,
      steps: [
        S('Giá mua và giá bán mỗi món.', `frac(${c1},${n1}),  frac(${c2},${n2})`),
        S('Lãi mỗi món.', `frac(${c2},${n2}) - frac(${c1},${n1}) = ${formatValueMath(profitEach)}`),
        S('Chia tổng lãi cần có cho lãi mỗi món.', `${num(P)} ÷ ${formatValueMath(profitEach)} = ${items}`),
      ],
    };
  }),

  mcqNum('pd-c-rate-range-hours', 'linear_inequalities', 'medium', (rng) => {
    const r1 = pickInt(rng, 3, 9);
    const r2 = r1 + pickInt(rng, 2, 6);
    const Nn = r1 * r2 * pickInt(rng, 1, 4);
    const lo = Nn / r2;
    const hi = Nn / r1;
    const inside = lo + pickInt(rng, 0, hi - lo);
    return {
      stem: `A technician installs at least ${r1} but no more than ${r2} smoke detectors per hour. Which of the following could be the number of hours it takes the technician to install ${Nn} smoke detectors?`,
      correct: inside,
      wrong: [
        w(lo - 1 > 0 ? lo - 1 : hi + 3, `Ít hơn ${lo} giờ thì phải lắp nhanh hơn ${r2} cái mỗi giờ; nhiều hơn ${hi} giờ thì chậm hơn ${r1} cái.`),
        w(hi + 1, `Nhiều hơn ${hi} giờ thì phải lắp chậm hơn ${r1} cái mỗi giờ.`),
        w(toRat(Math.round((Nn / (r1 + r2)) * 100) / 100), 'Cộng hai tốc độ như hai người làm chung — ở đây chỉ có một người.'),
        w(hi + 2, `Nhiều hơn ${hi} giờ thì phải lắp chậm hơn ${r1} cái mỗi giờ.`),
        w(2 * hi, 'Nhân đôi số giờ chậm nhất.'),
      ],
      fmt: (v) => num(v.num / v.den),
      steps: [
        S('Nhanh nhất: lắp nhiều nhất mỗi giờ.', `frac(${Nn},${r2}) = ${num(lo)}`),
        S('Chậm nhất: lắp ít nhất mỗi giờ.', `frac(${Nn},${r1}) = ${num(hi)}`),
        S('Số giờ phải nằm giữa hai số này.', `${num(lo)} <= h <= ${num(hi)}`),
      ],
    };
  }),

  grid('pd-c-unit-chain-max-grid', 'ratios_rates_units', 'hard', (rng) => {
    const cups = pickInt(rng, 3, 30);
    const per = pick(rng, [50, 60, 75, 80, 100, 120, 150]);
    const ml = cups * 8 * 29.6;
    const ans = Math.floor(ml / per);
    return {
      stem: `One fluid ounce is approximately 29.6 milliliters, and one cup is 8 fluid ounces. A pitcher holds ${cups} cups of lemonade. If each glass must contain ${per} milliliters, what is the greatest number of glasses that can be completely filled?`,
      answer: ans,
      steps: [
        S('Đổi cốc sang ounce rồi sang mililít.', `${cups} × 8 × 29.6 = ${num(ml)}`),
        S('Chia cho lượng mỗi ly và lấy phần nguyên.', `frac(${num(ml)},${per}) ≈ ${num(Math.round((ml / per) * 100) / 100)}  →  ${ans}`),
      ],
    };
  }),

  grid('pd-c-catch-up-grid', 'ratios_rates_units', 'hard', (rng) => {
    const v1 = pickInt(rng, 1, 5);
    const gap = pickInt(rng, 1, 5);
    const v2 = v1 + gap;
    const t = pickInt(rng, 2, 30);
    const head = gap * t;
    return {
      stem: `Two robots move along the same track in the same direction. Robot A starts ${head} meters ahead of Robot B and moves at ${v1} meters per second. Robot B moves at ${v2} meters per second. Both start at the same time. How many meters will Robot B have traveled when it catches up to Robot A?`,
      answer: v2 * t,
      steps: [
        S('Mỗi giây B rút ngắn khoảng cách bằng hiệu hai tốc độ.', `${v2} - ${v1} = ${gap}`),
        S('Thời gian để đuổi kịp.', `frac(${head},${gap}) = ${t}`),
        S('Quãng đường B đi được.', `${v2} × ${t} = ${v2 * t}`),
      ],
    };
  }),
];

// ============================================================ Chương 6: biểu thức

/** Hệ số nguyên trước một cụm: 1 → "", -1 → "-". */
const cf = (n: number, tail: string) => coefTerm(n, tail) || '0';
/** Số hạng có dấu: " + 3x", " - x". */
const sg = (n: number, tail: string) => signedCoefTerm(n, tail);

const LETTER_PAIRS = [
  ['x', 'y'],
  ['a', 'b'],
  ['m', 'n'],
  ['p', 'q'],
] as const;

const ch6: MathTemplate[] = [
  mcqText('pd-c-factor-gcf', 'equivalent_expressions', 'easy', (rng) => {
    const g = pickInt(rng, 2, 9);
    const a = pickInt(rng, 1, 7);
    const b = pick(rng, [1, 2, 3, 4, 5, 6, 7].filter((t) => t !== a && gcd(a, t) === 1));
    const [u, v] = pick(rng, LETTER_PAIRS);
    const minus = pick(rng, [true, false]);
    const sB = minus ? -b : b;
    return {
      stem: `Which of the following is equivalent to ${cf(g * a, `${u}^2${v}`)}${sg(g * sB, `${u}${v}^2`)}?`,
      correct: `${g}${u}${v}(${cf(a, u)}${sg(sB, v)})`,
      wrong: [
        wt(`${g}${u}${v}(${cf(a, v)}${sg(sB, u)})`, `Đặt nhân tử chung rồi để nhầm biến trong ngoặc: số hạng đầu còn lại ${u}, không phải ${v}.`),
        wt(`${g}${u}^2${v}^2(${a}${minus ? ' - ' : ' + '}${b})`, 'Rút cả hai biến với số mũ 2 — mỗi số hạng chỉ có một biến mũ 2.'),
        wt(`${g}${u}${v}(${cf(a, `${u}^2`)}${sg(sB, `${v}^2`)})`, 'Đặt nhân tử chung nhưng không trừ bớt số mũ bên trong ngoặc.'),
      ],
      steps: [
        S(`Hệ số chung lớn nhất là ${g}; biến chung là ${u}${v}.`),
        S('Chia từng số hạng cho nhân tử chung.', `${g}${u}${v}(${cf(a, u)}${sg(sB, v)})`),
      ],
    };
  }),

  mcqText('pd-c-add-fractions-var', 'equivalent_expressions', 'easy', (rng) => {
    const k = pickInt(rng, 1, 6);
    const p = pickInt(rng, 1, 9);
    let q = pickInt(rng, 2, 11);
    if (gcd(p, q) !== 1) q += q === 11 ? -1 : 1;
    if (gcd(p, q) !== 1) q = p + 1;
    const v = pick(rng, ['a', 'x', 'n', 't']);
    return {
      stem: `Which of the following is equivalent to frac(${k},${v}) + frac(${p},${q})?`,
      correct: `frac(${k * q} + ${cf(p, v)},${q}${v})`,
      wrong: [
        wt(`frac(${k + p},${v} + ${q})`, 'Cộng tử với tử, mẫu với mẫu — phải quy đồng mẫu trước.'),
        wt(`frac(${k} + ${cf(p, v)},${q}${v})`, `Quy đồng đúng mẫu nhưng quên nhân tử ${k} với ${q}.`, 'forgot_distribute'),
        wt(`frac(${k + p},${q}${v})`, 'Quy đồng mẫu nhưng quên nhân tử số với thừa số tương ứng.', 'forgot_distribute'),
      ],
      steps: [
        S(`Mẫu chung là ${q} nhân ${v}.`, `frac(${k * q},${q}${v}) + frac(${cf(p, v)},${q}${v})`),
        S('Cộng tử số.', `frac(${k * q} + ${cf(p, v)},${q}${v})`),
      ],
    };
  }),

  mcqText('pd-c-expand-product', 'equivalent_expressions', 'easy', (rng) => {
    const a = pickInt(rng, 1, 9);
    const b = pickInt(rng, 1, 9);
    const [x, y, z] = pick(rng, [
      ['x', 'y', 'z'],
      ['a', 'b', 'c'],
      ['p', 'q', 'r'],
    ] as const);
    const X = cf(a, `${x}^2`);
    const Z = cf(b, z);
    return {
      stem: `Which of the following is equivalent to (${X} + ${y})(${y} + ${Z})?`,
      correct: `${cf(a, `${x}^2${y}`)} + ${cf(a * b, `${x}^2${z}`)} + ${y}^2 + ${cf(b, `${y}${z}`)}`,
      wrong: [
        wt(`${cf(a, `${x}^2${y}`)} + ${cf(b, `${y}${z}`)}`, 'Chỉ nhân số hạng đầu với đầu, cuối với cuối — thiếu hai tích chéo.'),
        wt(`${cf(a, `${x}^2${y}`)} + ${cf(a * b, `${x}^2${z}`)} + ${cf(b, `${y}${z}`)}`, `Quên tích ${y} nhân ${y}.`),
        wt(`${cf(a, `${x}^2${y}`)} + ${cf(a * b, `${x}^2${z}`)} + ${cf(2, y)} + ${cf(b, `${y}${z}`)}`, `${y} nhân ${y} là ${y} bình phương, không phải 2${y}.`),
      ],
      steps: [
        S('Nhân từng số hạng của ngoặc đầu với từng số hạng của ngoặc sau (bốn tích).'),
        S('Viết bốn tích.', `${cf(a, `${x}^2${y}`)} + ${cf(a * b, `${x}^2${z}`)} + ${y}^2 + ${cf(b, `${y}${z}`)}`),
      ],
    };
  }),

  mcqText('pd-c-split-fraction', 'equivalent_expressions', 'easy', (rng) => {
    const c = pickInt(rng, 2, 12);
    const a = pickInt(rng, 1, 20);
    let b = pickInt(rng, 1, 20);
    if (b === a) b += 1;
    const v = pick(rng, ['x', 'y', 'n']);
    const t1 = rat(a, c);
    const t2 = rat(b, c);
    const overV = (t: MathValue) => `frac(${t.num},${t.den === 1 ? '' : t.den}${v})`;
    const f1 = overV(t1);
    const f2 = formatValueMath(t2);
    return {
      stem: `Which of the following is equivalent to frac(${a} + ${cf(b, v)},${c}${v})?`,
      correct: `${f1} + ${f2}`,
      wrong: [
        wt(`frac(${a + b},${c})`, `Gạch ${v} ở tử với ${v} ở mẫu — chỉ gạch được khi ${v} là thừa số của CẢ tử số.`),
        wt(`${formatValueMath(t1)} + ${overV(t2)}`, `Tách nhầm: ${v} ở mẫu phải đi với số hạng KHÔNG có ${v}.`),
        wt(`${f1} + ${cf(b, v)}`, `Chỉ chia số hạng đầu cho ${c}${v}; số hạng sau cũng phải chia.`),
      ],
      steps: [
        S('Tách tử số thành tổng hai phân số cùng mẫu.', `frac(${a},${c}${v}) + frac(${cf(b, v)},${c}${v})`),
        S('Rút gọn từng phân số.', `${f1} + ${f2}`),
      ],
    };
  }),

  mcqText('pd-c-factor-fully', 'equivalent_expressions', 'medium', (rng) => {
    const k = pickInt(rng, 1, 9);
    const m = pickInt(rng, 1, 4);
    const v = pick(rng, ['x', 'y', 'a', 'z']);
    const lead = k === 1 ? '' : String(k);
    return {
      stem: `Which of the following is equivalent to ${cf(k, `${v}^4`)} - ${k * m ** 4}?`,
      correct: `${lead}(${v}^2 + ${m * m})(${v} + ${m})(${v} - ${m})`,
      wrong: [
        wt(`${lead}(${v}^2 - ${m * m})^2`, 'Hiệu hai bình phương là (A + B)(A − B), không phải (A − B) bình phương.'),
        wt(`${lead}(${v}^2 + ${m * m})(${v} - ${m})^2`, `Phân tích sai: ${v} bình phương trừ ${m * m} là (${v} + ${m})(${v} − ${m}).`),
        wt(`${lead}(${v} + ${m})^2(${v} - ${m})^2`, `${v} mũ 4 cộng/trừ không tách được thành bình phương của hai nhị thức như vậy.`),
      ],
      steps: [
        S(k === 1 ? 'Nhận dạng hiệu hai bình phương.' : `Đặt nhân tử chung ${k}, rồi nhận dạng hiệu hai bình phương.`, `${lead}((${v}^2)^2 - ${m * m}^2)`),
        S('Tách lần một.', `${lead}(${v}^2 + ${m * m})(${v}^2 - ${m * m})`),
        S('Tách tiếp nhân tử còn là hiệu hai bình phương.', `${lead}(${v}^2 + ${m * m})(${v} + ${m})(${v} - ${m})`),
      ],
    };
  }),

  mcqText('pd-c-perfect-square-sub', 'equivalent_expressions', 'medium', (rng) => {
    const a = pickNonZeroInt(rng, -6, 7);
    const b = pickNonZeroInt(rng, -6, 7);
    const X = `(x${signedTerm(a)})`;
    const Y = `(y${signedTerm(b)})`;
    const s = a + b;
    return {
      stem: `Which of the following is equivalent to ${X}^2 + 2${X}${Y} + ${Y}^2?`,
      correct: s === 0 ? '(x + y)^2' : `(x + y${signedTerm(s)})^2`,
      wrong: [
        wt(`(x + y)^2${signedTerm(s * s === 0 ? 1 : s * s)}`, 'Bình phương của tổng không tách được thành tổng các bình phương.', 'expanded_without_middle_term'),
        wt(`(x + y${signedTerm(a * b === s ? a * b + 1 : a * b)})^2`, `Nhân ${a} với ${b} thay vì cộng.`),
        wt(`x^2 + y^2${signedTerm(a * a + b * b)}`, 'Bỏ mất các số hạng chéo khi khai triển.', 'expanded_without_middle_term'),
      ],
      steps: [
        S('Đặt A là ngoặc thứ nhất, B là ngoặc thứ hai: biểu thức có dạng A bình phương cộng 2AB cộng B bình phương.', '(A + B)^2'),
        S('Thay A và B trở lại rồi gom hằng số.', s === 0 ? '(x + y)^2' : `(x + y${signedTerm(s)})^2`),
      ],
    };
  }),

  mcqText('pd-c-factor-cancel', 'equivalent_expressions', 'medium', (rng) => {
    const k = pickInt(rng, 1, 9);
    let m = pickInt(rng, 1, 9);
    if (m === k) m = k === 9 ? 1 : k + 1;
    const r = rat(k, m);
    const [u, v] = pick(rng, LETTER_PAIRS);
    const num1 = `${cf(k, `${u}${v}`)} - ${cf(k, `${u}^2`)}`;
    const den1 = `${cf(m, `${u}${v}`)} - ${cf(m, `${v}^2`)}`;
    const frac1 = (neg: boolean) => `${neg ? '-' : ''}frac(${r.num === 1 ? '' : r.num}${u},${r.den === 1 ? '' : r.den}${v})`;
    return {
      stem: `Which of the following is equivalent to frac(${num1},${den1}), for ${u} != ${v} and ${v} != 0?`,
      correct: frac1(true),
      wrong: [
        wt(frac1(false), `${v} − ${u} và ${u} − ${v} là hai số đối nhau: rút gọn phải để lại dấu trừ.`, 'sign_flip'),
        wt(`-frac(${r.num === 1 ? '' : r.num}${v},${r.den === 1 ? '' : r.den}${u})`, 'Đảo vị trí hai biến sau khi rút gọn.', 'inverted_fraction'),
        wt(`frac(${r.num === 1 ? '' : r.num}${u}^2,${r.den === 1 ? '' : r.den}${v}^2)`, 'Gạch các số hạng thay vì các THỪA SỐ.'),
      ],
      steps: [
        S('Đặt nhân tử chung ở tử và mẫu.', `frac(${cf(k, u)}(${v} - ${u}),${cf(m, v)}(${u} - ${v}))`),
        S(`Vì ${v} − ${u} bằng âm của ${u} − ${v}, gạch được và để lại dấu trừ.`, frac1(true)),
      ],
    };
  }),

  mcqText('pd-c-complex-fraction-sum', 'equivalent_expressions', 'hard', (rng) => {
    const [p, q] = pick(rng, [
      [2, 3],
      [2, 5],
      [3, 4],
      [3, 5],
      [4, 5],
      [2, 7],
      [3, 7],
    ] as const);
    const a = pickInt(rng, 1, 9);
    const b = pickInt(rng, 1, 9);
    const cst = p * b - q * a;
    const den = `${p + q}x${signedTerm(cst)}`;
    return {
      stem: `Which of the following is equivalent to frac(1,frac(x - ${a},${p}) + frac(x + ${b},${q}))?`,
      correct: `frac(${p * q},${den})`,
      wrong: [
        wt(`frac(${den},${p * q})`, 'Cộng đúng hai phân số dưới mẫu nhưng quên lật ngược khi lấy 1 chia cho nó.', 'inverted_fraction'),
        wt(`frac(${p * q},2x${signedTerm(b - a)})`, `Cộng tử số mà không nhân chéo với mẫu (${q} và ${p}).`),
        wt(`frac(${p + q},2x${signedTerm(b - a)})`, 'Lật từng phân số rồi cộng — nghịch đảo của một tổng không bằng tổng các nghịch đảo.'),
      ],
      steps: [
        S('Quy đồng hai phân số ở mẫu.', `frac(${q}(x - ${a}) + ${p}(x + ${b}),${p * q}) = frac(${den},${p * q})`),
        S('Một chia cho một phân số là nhân với phân số đảo ngược.', `frac(${p * q},${den})`),
      ],
    };
  }),

  mcqText('pd-c-complex-fraction-ratio', 'equivalent_expressions', 'hard', (rng) => {
    const k = pickInt(rng, 2, 9);
    const j = pickInt(rng, 1, 5);
    const v = pick(rng, ['x', 'y', 't']);
    const Jv = cf(j, v) === '' ? v : cf(j, v);
    return {
      stem: `Which of the following is equivalent to frac(${k} + frac(${j},${v}),${k} - frac(${j},${v})), for ${v} != 0?`,
      correct: `frac(${k}${v} + ${j},${k}${v} - ${j})`,
      wrong: [
        wt(`frac(${k} + ${j},${k} - ${j})`, `Bỏ ${v} ở mẫu các phân số nhỏ mà không nhân ${v} vào số ${k}.`),
        wt(`frac(${k}${v} - ${j},${k}${v} + ${j})`, 'Đảo dấu tử và mẫu.', 'sign_flip'),
        wt(`frac(${k} + ${Jv},${k} - ${Jv})`, `Nhân ${v} vào phân số nhỏ nhưng quên nhân vào số ${k}.`, 'forgot_distribute'),
      ],
      steps: [
        S(`Nhân cả tử và mẫu của phân số lớn với ${v}.`, `frac(${v}(${k} + frac(${j},${v})),${v}(${k} - frac(${j},${v})))`),
        S('Phân phối.', `frac(${k}${v} + ${j},${k}${v} - ${j})`),
      ],
    };
  }),

  mcqText('pd-c-poly-sum', 'equivalent_expressions', 'easy', (rng) => {
    const a = pickNonZeroInt(rng, -6, 9);
    const b = pickNonZeroInt(rng, -9, 9);
    const c = pickNonZeroInt(rng, -9, 9);
    const d = pickNonZeroInt(rng, -6, 9);
    const e = pickNonZeroInt(rng, -9, 9);
    const f = pickNonZeroInt(rng, -9, 9);
    const P = (A: number, B: number, C: number) => {
      const out = `${coefTerm(A, 'x^2')}${signedCoefTerm(B, 'x')}${signedTerm(C)}`;
      return out.startsWith(' + ') ? out.slice(3) : out.startsWith(' - ') ? `-${out.slice(3)}` : out || '0';
    };
    const sub = pick(rng, [true, false]);
    const [A2, B2, C2] = sub ? [a - d, b - e, c - f] : [a + d, b + e, c + f];
    const sumTxt = P(A2, B2, C2);
    return {
      stem: `Which of the following is equivalent to (${P(a, b, c)}) ${sub ? '-' : '+'} (${P(d, e, f)})?`,
      correct: sumTxt,
      wrong: sub
        ? [
            wt(P(a - d, b + e, c + f), 'Chỉ đổi dấu số hạng đầu của ngoặc sau — dấu trừ phải phân phối cho mọi số hạng.', 'forgot_distribute'),
            wt(P(a + d, b + e, c + f), 'Cộng thay vì trừ ngoặc sau.', 'sign_flip'),
            wt(P(a - d, b - e, c + f), 'Quên đổi dấu hằng số của ngoặc sau.', 'forgot_distribute'),
          ]
        : [
            wt(P(a + d, b + e, c - f), 'Sai dấu hằng số của ngoặc sau.', 'sign_flip'),
            wt(P(a + d, b - e, c + f), 'Trừ nhầm số hạng bậc nhất.', 'sign_flip'),
            wt(P(a - d, b - e, c - f), 'Trừ thay vì cộng.', 'sign_flip'),
          ],
      steps: [
        S(sub ? 'Bỏ ngoặc: dấu trừ đổi dấu MỌI số hạng của ngoặc sau.' : 'Bỏ ngoặc rồi gom các số hạng đồng dạng.'),
        S('Gom theo từng bậc.', sumTxt),
      ],
    };
  }),

  mcqText('pd-c-combine-radical-terms', 'equivalent_expressions', 'medium', (rng) => {
    const a = pickInt(rng, 3, 12);
    const b = pickInt(rng, 1, 9);
    const c = pickInt(rng, 1, a - 1);
    let d = pickInt(rng, 1, 9);
    if (d === b) d = b + 1;
    const v = pick(rng, ['a', 'k', 'x', 't']);
    const term = (n: number) => (n === 0 ? '' : `${n < 0 ? ' - ' : ' + '}${Math.abs(n) === 1 ? '' : Math.abs(n)}sqrt(${v})`);
    const lin = (n: number) => cf(n, v);
    return {
      stem: `Which of the following is equivalent to (${lin(a)}${term(b)}) - (${lin(c)}${term(d)})?`,
      correct: `${lin(a - c)}${term(b - d)}`,
      wrong: [
        wt(`${lin(a - c)}${term(b + d)}`, 'Dấu trừ trước ngoặc chưa được phân phối cho số hạng căn.', 'forgot_distribute'),
        wt(`${lin(a + c)}${term(b - d)}`, 'Dấu trừ trước ngoặc chưa được phân phối cho số hạng đầu.', 'forgot_distribute'),
        wt(`${a - c + b - d === 1 ? '' : a - c + b - d === 0 ? 2 : a - c + b - d}sqrt(${v})`, `Gộp ${v} với căn của ${v} — hai số hạng này không đồng dạng.`),
      ],
      steps: [
        S('Bỏ ngoặc: đổi dấu cả hai số hạng của ngoặc sau.', `${lin(a)}${term(b)} - ${lin(c)}${term(-d)}`),
        S('Gom số hạng đồng dạng.', `${lin(a - c)}${term(b - d)}`),
      ],
    };
  }),

  grid('pd-c-eval-monomial-ratio', 'equivalent_expressions', 'medium', (rng) => {
    const p = pickInt(rng, 1, 9);
    const a = pickInt(rng, 2, 6);
    const q = pickInt(rng, 1, 5);
    const b = pickInt(rng, 2, 6);
    const r = pickInt(rng, 2, 9);
    const c = pickInt(rng, 2, 5);
    const val = rat(p * a * a + q * b * b, r * c * c);
    const P = (k: number) => (k === 1 ? '' : String(k));
    return {
      stem: `If y != 0, what is the value of frac(${P(p)}(${a}y)^2 + ${P(q)}(${b}y)^2,${r}(${c}y)^2)?`,
      answer: val,
      steps: [
        S('Luỹ thừa của một tích: bình phương cả hệ số lẫn y.', `frac(${p * a * a}y^2 + ${q * b * b}y^2,${r * c * c}y^2)`),
        S('Gom tử số rồi gạch y bình phương.', `frac(${p * a * a + q * b * b},${r * c * c}) = ${formatValueMath(val)}`),
      ],
    };
  }),
];

// ============================================================ Chương 7: biến đổi & giải phương trình

type IsoFormula = { L: string; R: string; purpose: string; target: string; others: string; correct: string; wrong: TCand[]; steps: MathSolutionStep[] };

/** Các công thức "cô lập một biến" — đáp án được bộ kiểm chứng thế ngược vào công thức. */
function isoFormula(rng: () => number): IsoFormula {
  const k = pickInt(rng, 2, 9);
  const j = pickInt(rng, 1, 4);
  const J = j === 1 ? '' : String(j);
  const opts: Array<() => IsoFormula> = [
    () => {
      const n = pickInt(rng, 2, 40);
      const i = pick(rng, ['i', 'r']);
      return {
        L: 'F',
        R: `frac(p((1 + ${i})^${n} - 1),${i})`,
        purpose: `find the future value F of a savings plan with a payment of p dollars per period, an interest rate of ${i} per period, and ${n} periods`,
        target: 'p',
        others: `F and ${i}`,
        correct: `p = frac(F${i},(1 + ${i})^${n} - 1)`,
        wrong: [
          wt(`p = frac(F,${i}((1 + ${i})^${n} - 1))`, `Chia cho ${i} thay vì nhân: ${i} đang ở mẫu, chuyển sang vế kia thành phép nhân.`, 'inverted_fraction'),
          wt(`p = frac(F((1 + ${i})^${n} - 1),${i})`, 'Nhân với cụm trong ngoặc thay vì chia.', 'inverted_fraction'),
          wt(`p = F${i}((1 + ${i})^${n} - 1)`, 'Nhân cả hai thay vì chia cho cụm trong ngoặc.'),
        ],
        steps: [S(`Nhân hai vế với ${i}.`, `F${i} = p((1 + ${i})^${n} - 1)`), S('Chia hai vế cho cụm trong ngoặc.', `p = frac(F${i},(1 + ${i})^${n} - 1)`)],
      };
    },
    () => {
      const [g, place] = pick(rng, [
        [9.8, 'on Earth'],
        [3.7, 'on Mars'],
        [1.6, 'on the Moon'],
        [24.8, 'on Jupiter'],
        [8.9, 'on Venus'],
        [11.2, 'on Neptune'],
      ] as const);
      return {
        L: 'a',
        R: `frac(${g}(m - un),m + n)`,
        purpose: `find the acceleration a of two connected blocks with masses m and n ${place}, where u is the friction coefficient`,
        target: 'u',
        others: 'a, m, and n',
        correct: `u = frac(${g}m - a(m + n),${g}n)`,
        wrong: [
          wt(`u = frac(a(m + n) - ${g}m,${g}n)`, 'Sai dấu khi chuyển vế.', 'sign_flip'),
          wt(`u = frac(${g}m - a(m + n),${g})`, 'Quên chia cho n — u đứng cùng n.', 'stopped_too_early'),
          wt(`u = frac(${g}m - am + n,${g}n)`, 'Quên nhân a với cả n khi phá ngoặc.', 'forgot_distribute'),
        ],
        steps: [
          S('Nhân hai vế với mẫu rồi phá ngoặc.', `a(m + n) = ${g}m - ${g}un`),
          S('Chuyển số hạng chứa u sang một vế.', `${g}un = ${g}m - a(m + n)`),
          S('Chia.', `u = frac(${g}m - a(m + n),${g}n)`),
        ],
      };
    },
    () => ({
      L: 'S',
      R: `frac(n(a + ${k}l),${j + 1})`,
      purpose: 'compute a total S from the quantities n, a, and l',
      target: 'l',
      others: 'S, n, and a',
      correct: `l = frac(${j + 1}S - an,${k}n)`,
      wrong: [
        wt(`l = frac(${j + 1}S + an,${k}n)`, 'Sai dấu khi chuyển a sang vế kia.', 'sign_flip'),
        wt(`l = frac(${j + 1}S - a,${k}n)`, 'Quên nhân a với n (a nằm trong ngoặc được nhân với n).', 'forgot_distribute'),
        wt(`l = frac(S - an,${k * (j + 1)}n)`, `Chia cho ${j + 1} thay vì nhân ${j + 1} vào S.`, 'inverted_fraction'),
      ],
      steps: [S(`Nhân hai vế với ${j + 1} rồi chia cho n.`, `frac(${j + 1}S,n) = a + ${k}l`), S(`Trừ a rồi chia cho ${k}.`, `l = frac(${j + 1}S - an,${k}n)`)],
    }),
    () => ({
      L: 'T',
      R: `frac(${k}w + h,${J}w)`,
      purpose: 'estimate a ratio T from a width w and a height h',
      target: 'w',
      others: 'T and h',
      correct: `w = frac(h,${J}T - ${k})`,
      wrong: [
        wt(`w = frac(h,${J}T + ${k})`, 'Sai dấu khi gom các số hạng chứa w.', 'sign_flip'),
        wt(`w = frac(h,${J}T) - ${k}`, 'Không gom w về một vế trước khi chia.'),
        wt(`w = frac(${J}T - ${k},h)`, 'Lật ngược phân số khi chia.', 'inverted_fraction'),
      ],
      steps: [
        S('Nhân hai vế với mẫu số.', `${J}Tw = ${k}w + h`),
        S('Gom các số hạng chứa w rồi đặt w làm nhân tử chung.', `w(${J}T - ${k}) = h`),
        S('Chia hai vế.', `w = frac(h,${J}T - ${k})`),
      ],
    }),
    () => {
      const t = pickInt(rng, 2, 20);
      return {
        L: 'A',
        R: `P + ${t}Pr`,
        purpose: `find the amount A owed on a loan of P dollars after ${t} years of simple interest at rate r`,
        target: 'P',
        others: 'A and r',
        correct: `P = frac(A,1 + ${t}r)`,
        wrong: [
          wt(`P = frac(A,${t}r)`, 'Quên số hạng P đứng riêng: đặt P làm nhân tử chung sẽ còn lại 1.', 'stopped_too_early'),
          wt(`P = A - ${t}r`, 'Trừ thay vì đặt P làm nhân tử chung.'),
          wt(`P = frac(1 + ${t}r,A)`, 'Lật ngược phân số.', 'inverted_fraction'),
        ],
        steps: [S('Đặt P làm nhân tử chung.', `A = P(1 + ${t}r)`), S('Chia hai vế.', `P = frac(A,1 + ${t}r)`)],
      };
    },
  ];
  return pick(rng, opts)();
}

const ch7: MathTemplate[] = [
  mcqNum('pd-c-sum-power-sub', 'equivalent_expressions', 'easy', (rng) => {
    const m = pickInt(rng, 2, 7);
    const k = pickNonZeroInt(rng, -5, 6);
    const n = pick(rng, [2, 3]);
    const [a, b] = pick(rng, LETTER_PAIRS);
    return {
      stem: `If ${m}${a} + ${m}${b} = ${m * k}, what is the value of (${a} + ${b})^${n}?`,
      correct: k ** n,
      wrong: [
        w((m * k) ** n, `Quên chia cho ${m}: tổng ${a} + ${b} bằng ${k}, không phải ${m * k}.`, 'stopped_too_early'),
        w(k * n, `Nhân ${k} với ${n} thay vì nâng lên luỹ thừa.`),
        w(m * k ** n, `Nâng lên luỹ thừa rồi lại nhân ${m}.`),
      ],
      steps: [
        S(`Đặt ${m} làm nhân tử chung rồi chia hai vế cho ${m}.`, `${a} + ${b} = ${k}`),
        S('Coi cả tổng là một khối rồi nâng lên luỹ thừa.', `(${a} + ${b})^${n} = ${par(k)}^${n} = ${k ** n}`),
      ],
    };
  }),

  grid('pd-c-square-both-sides-equal', 'nonlinear_equations', 'medium', (rng) => {
    const a = pickInt(rng, 1, 12);
    let b = pickInt(rng, 1, 12);
    if (b === a) b = a === 12 ? 1 : a + 1;
    const v = pick(rng, ['n', 'x', 'k']);
    return {
      stem: `If (${v} - ${a})^2 = (${v} + ${b})^2, what is the value of ${v}?`,
      answer: rat(a - b, 2),
      steps: [
        S('Khai triển hai vế — nhớ số hạng giữa.', `${v}^2 - ${2 * a}${v} + ${a * a} = ${v}^2 + ${2 * b}${v} + ${b * b}`),
        S('Bình phương của ẩn triệt tiêu; gom ẩn về một vế.', `${a * a - b * b} = ${2 * (a + b)}${v}`),
        S('Chia.', `${v} = ${formatValueMath(rat(a - b, 2))}`),
      ],
    };
  }),

  mcqText('pd-c-product-equation-expr', 'equivalent_expressions', 'medium', (rng) => {
    const k = pickInt(rng, 1, 9);
    const m = pickInt(rng, 1, 9);
    const [a, b, c] = pick(rng, [
      ['a', 'b', 'c'],
      ['p', 'q', 'r'],
      ['x', 'y', 'z'],
    ] as const);
    const kk = k === 1 ? '' : String(k);
    const mm = m === 1 ? '' : String(m);
    return {
      stem: `If (frac(${k},${a}))(frac(${b},${c})) = ${m}, where ${a} != 0 and ${c} != 0, which of the following must be true?`,
      correct: `${kk}${b} - ${mm}${a}${c} = 0`,
      wrong: [
        wt(`${kk}${b} + ${mm}${a}${c} = 0`, 'Chuyển vế mà quên đổi dấu.', 'sign_flip'),
        wt(`${kk}${c} - ${mm}${a}${b} = 0`, `Nhân chéo nhầm: ${a} và ${c} ở MẪU, phải nhân sang vế có ${m}.`),
        wt(k * m === 1 ? `${b} - ${a}${c} = 1` : `${b} - ${k * m}${a}${c} = 0`, k * m === 1 ? 'Nhân chéo rồi để nhầm 1 ở vế phải.' : `Nhân ${k} và ${m} vào cùng một phía.`),
        wt(`${kk}${a}${b} - ${mm}${c} = 0`, `Nhân chéo nhầm: ${a} ở MẪU của phân số đầu, không lên tử được.`),
      ],
      steps: [S('Nhân hai phân số.', `frac(${kk}${b},${a}${c}) = ${m}`), S(`Nhân hai vế với ${a}${c} rồi chuyển vế.`, `${kk}${b} - ${mm}${a}${c} = 0`)],
    };
  }),

  mcqNum('pd-c-solve-then-expression', 'linear_equations_one_var', 'easy', (rng) => {
    const x0 = pickNonZeroInt(rng, -6, 7);
    if (pick(rng, [true, false])) {
      const a = pickInt(rng, 2, 6);
      const b = pickNonZeroInt(rng, -12, 12);
      const c = a * x0 + b;
      const k = pickInt(rng, 2, 4);
      const e = pickNonZeroInt(rng, -12, 12);
      const val = k * a * x0 - e;
      return {
        stem: `If ${linearSide(a, b)} = ${c}, what is the value of ${linearSide(k * a, -e)}?`,
        correct: val,
        wrong: [
          w(x0, 'Đây mới là x; đề hỏi giá trị của cả biểu thức.', 'stopped_too_early'),
          w(k * c - e, `Nhân cả hằng số ${b} theo — biểu thức sau là ${k} lần ${a}x, không phải ${k} lần cả vế trái.`, 'forgot_distribute'),
          w(k * a * x0 + e, 'Sai dấu hằng số cuối.', 'sign_flip'),
        ],
        steps: [
          S(`Tìm ${a}x trước.`, `${a}x = ${c} - ${par(b)} = ${a * x0}`),
          S(`${k * a}x là ${k} lần ${a}x.`, `${k * a}x = ${k * a * x0}`),
          S('Tính biểu thức.', `${k * a * x0} - ${par(e)} = ${val}`),
        ],
      };
    }
    const a = pickInt(rng, 2, 5);
    const b = pickNonZeroInt(rng, -9, 9);
    const c = a * x0 + b;
    const dd = pickNonZeroInt(rng, -5, 5);
    const inner = x0 + dd;
    return {
      stem: `If ${linearSide(a, b)} = ${c}, what is the value of (x${signedTerm(dd)})^3?`,
      correct: inner ** 3,
      wrong: [
        w(x0 ** 3 + dd, 'Nâng x lên lập phương rồi mới cộng — phải cộng trong ngoặc trước.'),
        w(inner * 3, 'Nhân với 3 thay vì lập phương.'),
        w((-x0 + dd) ** 3 === inner ** 3 ? inner ** 3 + 1 : (-x0 + dd) ** 3, 'Giải x sai dấu.', 'sign_flip'),
      ],
      steps: [
        S('Giải x.', `${a}x = ${c - b}  →  x = ${x0}`),
        S('Thay vào biểu thức.', `(${x0}${signedTerm(dd)})^3 = ${par(inner)}^3 = ${inner ** 3}`),
      ],
    };
  }),

  mcqNum('pd-c-frac-coef-solve', 'linear_equations_one_var', 'easy', (rng) => {
    const [p, q] = pick(rng, [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 9],
      [2, 5],
      [3, 5],
      [5, 6],
      [3, 7],
      [4, 7],
    ] as const);
    const [r, s] = pick(rng, [
      [8, 3],
      [5, 2],
      [7, 4],
      [9, 2],
      [6, 5],
      [4, 3],
      [10, 3],
    ] as const);
    const v = pick(rng, ['m', 'k', 'n', 'x']);
    return {
      stem: `If frac(${p},${q}) = frac(${r},${s})${v}, what is the value of ${v}?`,
      correct: rat(p * s, q * r),
      wrong: [
        w(rat(p * r, q * s), `Nhân với frac(${r},${s}) thay vì chia.`, 'inverted_fraction'),
        w(rat(q * r, p * s), 'Lật ngược cả kết quả.', 'inverted_fraction'),
        w(rat(p * s - q * r, q * s), 'Trừ hai phân số thay vì chia.'),
      ],
      steps: [
        S(`Nhân hai vế với nghịch đảo của ${r} phần ${s}.`, `${v} = frac(${p},${q}) · frac(${s},${r})`),
        S('Rút gọn.', `${v} = ${formatValueMath(rat(p * s, q * r))}`),
      ],
    };
  }),

  mcqText('pd-c-cross-mult-isolate', 'linear_equations_two_var', 'medium', (rng) => {
    const p = pickInt(rng, 2, 9);
    const a = pickInt(rng, 1, 9);
    const q = pickInt(rng, 2, 9);
    const v = pick(rng, ['k', 'n', 'm']);
    return {
      stem: `If frac(${p},${v} + ${a}) = frac(x,${q}), which of the following expresses ${v} in terms of x?`,
      correct: `${v} = frac(${p * q},x) - ${a}`,
      wrong: [
        wt(`${v} = frac(${p * q},x) + ${a}`, `Chuyển ${a} sang vế kia mà quên đổi dấu.`, 'sign_flip'),
        wt(`${v} = frac(x,${p * q}) - ${a}`, 'Lật ngược phân số khi chia cho x.', 'inverted_fraction'),
        wt(`${v} = frac(${p * q} - ${a},x)`, `Trừ ${a} trước khi chia cho x — ${a} không nhân với x.`),
      ],
      steps: [
        S('Nhân chéo.', `${p * q} = x(${v} + ${a})`),
        S('Chia cho x rồi trừ.', `${v} = frac(${p * q},x) - ${a}`),
      ],
    };
  }),

  grid('pd-c-square-neg-root', 'nonlinear_equations', 'easy', (rng) => {
    const a = pickInt(rng, 1, 9);
    const b = a + pickInt(rng, 1, 9);
    const neg = pick(rng, [true, false]);
    // (x − a)² = b² với x < 0 → x = a − b; (x + a)² = b² với x > 0 → x = b − a.
    const x = neg ? a - b : b - a;
    const stem = neg ? `If (x - ${a})^2 = ${b * b} and x < 0, what is the value of x^2?` : `If (x + ${a})^2 = ${b * b} and x > 0, what is the value of x^2?`;
    return {
      stem,
      answer: x * x,
      steps: [
        S('Lấy căn hai vế — nhớ có cả nghiệm âm.', neg ? `x - ${a} = ±${b}` : `x + ${a} = ±${b}`),
        S(neg ? 'Chọn nghiệm âm.' : 'Chọn nghiệm dương.', `x = ${x}`),
        S('Bình phương.', `x^2 = ${x * x}`),
      ],
    };
  }),

  mcqText('pd-c-isolate-formula', 'linear_equations_two_var', 'medium', (rng) => {
    const f = isoFormula(rng);
    return {
      stem: `The formula ${f.L} = ${f.R} is used to ${f.purpose}. Which of the following expresses ${f.target} in terms of ${f.others}?`,
      correct: f.correct,
      wrong: f.wrong,
      steps: f.steps,
    };
  }),

  mcqNum('pd-c-ratio-flip', 'equivalent_expressions', 'medium', (rng) => {
    const a = pickInt(rng, 1, 6);
    const k = pickInt(rng, 2, 9);
    const b = pickInt(rng, 1, 6);
    const A = a === 1 ? '' : String(a);
    const B = b === 1 ? '' : String(b);
    return {
      stem: `If frac(m,${A}n) = ${k}, what is the value of frac(n,${B}m)?`,
      correct: rat(1, a * b * k),
      wrong: [
        w(rat(a * k, b), 'Không lật: n chia m là nghịch đảo của m chia n.', 'inverted_fraction'),
        w(rat(1, k), `Bỏ qua các hệ số ${a} và ${b}.`),
        w(rat(a, b * k), `Đặt hệ số ${a} ở sai vị trí khi lật.`),
      ],
      steps: [
        S(`Nhân hai vế với ${A}n.`, `m = ${a * k}n`),
        S('Thay vào biểu thức cần tính.', `frac(n,${B}m) = frac(n,${b * a * k}n) = frac(1,${a * b * k})`),
      ],
    };
  }),

  mcqNum('pd-c-neg-root-solve', 'nonlinear_equations', 'easy', (rng) => {
    const r = pickInt(rng, 2, 12);
    const c = pickInt(rng, 1, r * r - 1);
    const dd = r * r - c;
    return {
      stem: `If x < 0 and x^2 - ${c} = ${dd}, what is the value of x?`,
      correct: -r,
      wrong: [
        w(r, 'Đề cho x < 0 — phải chọn nghiệm âm.', 'dropped_a_solution'),
        w(rat(-(c + dd), 2), 'Chia đôi thay vì lấy căn bậc hai.'),
        w(-(r * r), 'Quên lấy căn bậc hai.', 'forgot_square_root'),
      ],
      steps: [S('Chuyển hằng số sang vế phải.', `x^2 = ${r * r}`), S('Lấy căn; x < 0 nên chọn nghiệm âm.', `x = -${r}`)],
    };
  }),

  grid('pd-c-solve-expression-square', 'nonlinear_equations', 'easy', (rng) => {
    const a = pickInt(rng, 1, 30);
    const s0 = pickInt(rng, 2, 60);
    const b = s0 + a;
    const c = pickNonZeroInt(rng, -9, 30);
    return {
      stem: `If x^2 + ${a} = ${b}, what is the value of x^2${signedTerm(c)}?`,
      answer: s0 + c,
      steps: [
        S('Không cần tìm x: coi x bình phương là một khối.', `x^2 = ${b} - ${a} = ${s0}`),
        S('Thay vào.', `${s0}${signedTerm(c)} = ${s0 + c}`),
      ],
    };
  }),

  grid('pd-c-high-degree-solve', 'nonlinear_equations', 'hard', (rng) => {
    const r = pickInt(rng, 2, 9);
    const s0 = r * r;
    const b = pickInt(rng, 1, s0 - 1);
    const a = s0 * s0 - b * s0;
    return {
      stem: `If x^2(x^4 - ${a}) = ${cf(b, 'x^4')} and x > 0, what is the value of x?`,
      answer: r,
      steps: [
        S('x khác 0 nên chia hai vế cho x bình phương.', `x^4 - ${a} = ${cf(b, 'x^2')}`),
        S('Đặt u bằng x bình phương.', `u^2 - ${cf(b, 'u')} - ${a} = 0`),
        S('Phân tích.', `(u - ${s0})(u + ${a / s0}) = 0`),
        S('x bình phương không âm, nên u bằng nghiệm dương; lấy căn (x > 0).', `x^2 = ${s0}  →  x = ${r}`),
      ],
    };
  }),

  grid('pd-c-radical-solve-grid', 'nonlinear_equations', 'medium', (rng) => {
    const p = pickInt(rng, 2, 5);
    const q = pickInt(rng, 2, 5);
    const t = pickInt(rng, 1, 6);
    const sq = (q / gcd(p, q)) * t;
    const k = (p * sq) / q;
    const c = pickInt(rng, 1, 20);
    return {
      stem: `If frac(${p}sqrt(x + ${c}),${q}) = ${k}, what is the value of x?`,
      answer: sq * sq - c,
      steps: [
        S(`Nhân hai vế với ${q} rồi chia cho ${p}.`, `sqrt(x + ${c}) = ${sq}`),
        S('Bình phương hai vế.', `x + ${c} = ${sq * sq}`),
        S(`Trừ ${c}.`, `x = ${sq * sq - c}`),
      ],
    };
  }),

  grid('pd-c-radical-collect-grid', 'nonlinear_equations', 'medium', (rng) => {
    const [p, q] = pick(rng, [
      [1, 2],
      [2, 3],
      [1, 3],
      [3, 4],
      [1, 4],
      [2, 5],
    ] as const);
    const t = pickInt(rng, 1, 4);
    const root = q * t;
    const B = pickInt(rng, 1, 20);
    const A = B + (p + q) * t;
    return {
      stem: `If ${A} - sqrt(x) = frac(${p},${q})sqrt(x) + ${B}, what is the value of x?`,
      answer: root * root,
      steps: [
        S('Gom các số hạng chứa căn về một vế, hằng số về vế kia.', `${A - B} = frac(${p + q},${q})sqrt(x)`),
        S('Chia.', `sqrt(x) = ${root}`),
        S('Bình phương.', `x = ${root * root}`),
      ],
    };
  }),

  mcqNum('pd-c-translate-twice', 'linear_equations_one_var', 'easy', (rng) => {
    const x0 = pickNonZeroInt(rng, -12, 12);
    const b = pickInt(rng, 2, 9);
    let kk = pickInt(rng, 2, 4);
    if (kk === b) kk += 1;
    const dd = pickInt(rng, 1, 9);
    const a = kk * (x0 - dd) - b * x0;
    const word = kk === 2 ? 'twice' : kk === 3 ? 'three times' : kk === 4 ? 'four times' : 'five times';
    return {
      stem: `If ${linearSide(b, a)} is ${word} the quantity x - ${dd}, what is the value of x?`,
      correct: x0,
      wrong: [
        w(rat(a + dd, kk - b), `Chỉ nhân ${kk} với x mà quên nhân với ${dd}.`, 'forgot_distribute'),
        w(-x0, 'Sai dấu khi chuyển vế.', 'sign_flip'),
        w(rat(a - kk * dd, kk - b), 'Chuyển hằng số sang vế kia mà không đổi dấu.', 'moved_term_wrong_side'),
      ],
      steps: [
        S('Viết phương trình — "gấp k lần hiệu" thì nhân cả hiệu.', `${linearSide(b, a)} = ${kk}(x - ${dd})`),
        S('Phá ngoặc và gom x.', `${linearSide(b, a)} = ${linearSide(kk, -kk * dd)}`),
        S('Giải.', `x = ${x0}`),
      ],
    };
  }),

  mcqNum('pd-c-proportion-then-recip', 'linear_equations_one_var', 'medium', (rng) => {
    const p = pickInt(rng, 2, 9);
    const m = pickInt(rng, 2, 7);
    const q = p * m;
    const x0 = pickInt(rng, 1, 9);
    const a = (x0 * (q - p)) / p;
    const r = x0 * pickInt(rng, 1, 6);
    return {
      stem: `If frac(x,${p}) = frac(x + ${a},${q}), what is the value of frac(${r},x)?`,
      correct: rat(r, x0),
      wrong: [
        w(x0, 'Đây là x; đề hỏi một biểu thức khác.', 'stopped_too_early'),
        w(rat(x0, r), 'Lật ngược phân số cần tính.', 'inverted_fraction'),
        w(rat(r * (q + p), a * p), 'Nhân chéo sai dấu khi gom x.', 'sign_flip'),
      ],
      steps: [
        S('Nhân chéo.', `${q}x = ${p}(x + ${a})`),
        S('Gom x.', `${q - p}x = ${p * a}  →  x = ${x0}`),
        S('Tính biểu thức.', `frac(${r},${x0}) = ${formatValueMath(rat(r, x0))}`),
      ],
    };
  }),

  mcqNum('pd-c-formula-substitute-solve', 'linear_equations_one_var', 'medium', (rng) => {
    const m = pick(rng, [2, 3, 4, 5, 6]);
    const K = m * pickInt(rng, 3, 10);
    const k = pickInt(rng, 1, K / m - 1);
    const h = K / m - k;
    const ctx = pick(rng, [
      ['r', 'p', 'h', 'the recommended serving size r, in grams, of a pet food for a pet that weighs p kilograms and is h years old'],
      ['c', 'w', 'h', 'the number of cups c of fertilizer for a lawn of width w meters that has been growing for h weeks'],
      ['s', 'b', 'h', 'the number of staff s needed for b guests at an event lasting h hours'],
    ] as const);
    const [R, P, H, desc] = ctx;
    return {
      stem: `The formula ${R} = frac(${P}(${H} + ${k}),${K}) gives ${desc}. For what value of ${H} is ${R} equal to frac(1,${m}) of ${P}?`,
      correct: h,
      wrong: [
        w(K / m, `Quên trừ ${k}.`, 'stopped_too_early'),
        w(K / m + k, `Cộng ${k} thay vì trừ.`, 'sign_flip'),
        w(rat(K - k, m), `Trừ ${k} trước khi chia cho ${m}.`),
      ],
      steps: [
        S(`Thay ${R} bằng ${P} chia ${m}.`, `frac(${P},${m}) = frac(${P}(${H} + ${k}),${K})`),
        S(`Chia hai vế cho ${P} (khác 0) rồi nhân với ${K}.`, `${H} + ${k} = ${K / m}`),
        S('Giải.', `${H} = ${h}`),
      ],
    };
  }),

  mcqText('pd-c-isolate-linear-letters', 'linear_equations_two_var', 'easy', (rng) => {
    const k = pickInt(rng, 2, 9);
    const a = pickInt(rng, 2, 9);
    const mult = pick(rng, [1, 2, 3]);
    const mz = k * mult;
    const zc = mult === 1 ? 'z' : `${mult}z`;
    return {
      stem: `If ${k}(x - ${a}y) - ${mz}z = 0, which of the following expresses x in terms of y and z?`,
      correct: `x = ${a}y + ${zc}`,
      wrong: [
        wt(`x = ${a}y - ${zc}`, 'Chuyển số hạng chứa z sang vế kia mà quên đổi dấu.', 'sign_flip'),
        wt(`x = ${a * k}y + ${mz}z`, `Nhân ${k} vào ${a}y nhưng quên rằng x cũng bị nhân ${k}.`, 'forgot_distribute'),
        wt(`x = ${a}y + ${mz}z`, `Quên chia số hạng z cho ${k}.`),
      ],
      steps: [
        S(`Chia hai vế cho ${k}.`, `x - ${a}y - ${zc} = 0`),
        S('Chuyển vế.', `x = ${a}y + ${zc}`),
      ],
    };
  }),

  grid('pd-c-all-values-identity', 'equivalent_expressions', 'hard', (rng) => {
    const a = pickInt(rng, 1, 6);
    const b = pickInt(rng, 1, 6);
    const [pn, pd] = pick(rng, [
      [1, 1],
      [2, 1],
      [3, 1],
      [1, 2],
      [3, 2],
      [4, 1],
      [5, 2],
      [2, 3],
    ] as const);
    const A = a * pd;
    const B = b * pd;
    const C = a * pn;
    const D = b * pn;
    return {
      stem: `If ${cf(A, 'x')}y^2 + ${cf(B, 'x')} - ${cf(C, 'y^2')} - ${D} = 0 for all values of y, what is the value of x?`,
      answer: rat(pn, pd),
      steps: [
        S('Nhóm theo y bình phương.', `(${cf(A, 'x')} - ${C})y^2 + (${cf(B, 'x')} - ${D}) = 0`),
        S('Đúng với mọi y thì từng hệ số phải bằng 0.', `${cf(A, 'x')} - ${C} = 0  →  x = ${formatValueMath(rat(pn, pd))}`),
      ],
    };
  }),

  mcqText('pd-c-isolate-exponent-base', 'nonlinear_equations', 'hard', (rng) => {
    const t = pickInt(rng, 2, 12);
    const decay = pick(rng, [true, false]);
    const V = pick(rng, decay ? ['V', 'B', 'W'] : ['A', 'B', 'M']);
    const r = pick(rng, ['r', 'k', 'q']);
    const root = `(frac(${V},P))^(frac(1,${t}))`;
    const correct = decay ? `${r} = 1 - ${root}` : `${r} = ${root} - 1`;
    return {
      stem: decay
        ? `The formula ${V} = P(1 - ${r})^${t} is used to find the value ${V} of an item bought for P dollars that loses a fixed fraction ${r} of its value each year for ${t} years. Which of the following expresses ${r} in terms of ${V} and P?`
        : `The formula ${V} = P(1 + ${r})^${t} is used to find the balance ${V} of an account that starts at P dollars and grows at rate ${r} per year for ${t} years. Which of the following expresses ${r} in terms of ${V} and P?`,
      correct,
      wrong: [
        wt(decay ? `${r} = ${root} - 1` : `${r} = 1 - ${root}`, 'Sai dấu khi chuyển 1 sang vế kia.', 'sign_flip'),
        wt(decay ? `${r} = 1 - (frac(${V},P))^${t}` : `${r} = (frac(${V},P))^${t} - 1`, `Nâng lên luỹ thừa ${t} thay vì lấy căn bậc ${t}.`),
        wt(decay ? `${r} = 1 - frac(${V},${t}P)` : `${r} = frac(${V},${t}P) - 1`, `Chia cho ${t} thay vì lấy căn bậc ${t}.`),
      ],
      steps: [
        S('Chia hai vế cho P.', decay ? `(1 - ${r})^${t} = frac(${V},P)` : `(1 + ${r})^${t} = frac(${V},P)`),
        S(`Lấy căn bậc ${t} hai vế (nâng lên luỹ thừa 1 phần ${t}).`, decay ? `1 - ${r} = ${root}` : `1 + ${r} = ${root}`),
        S(`Cô lập ${r}.`, correct),
      ],
    };
  }),

  mcqNum('pd-c-half-life-rate-approx', 'nonlinear_equations', 'hard', (rng) => {
    const t = pickInt(rng, 2, 20);
    const thing = pick(rng, ['machine', 'delivery truck', 'printing press', 'tractor', 'boat']);
    const [fn, fd, word] = pick(rng, [
      [1, 2, 'half'],
      [1, 3, 'one-third'],
      [1, 4, 'one-fourth'],
      [2, 3, 'two-thirds'],
    ] as const);
    const r = 1 - (fn / fd) ** (1 / t);
    const r2 = (x: number) => toRat(Math.round(x * 100) / 100);
    return {
      stem: `The value of a ${thing} is modeled by V = P(1 - r)^t, where P is the purchase price and t is the number of years since purchase. If the ${thing} is worth ${word} of its purchase price after ${t} years, which of the following is closest to r?`,
      correct: r2(r),
      wrong: [
        w(r2((1 - fn / fd) / t), `Chia phần mất đi cho ${t} năm (coi như giảm tuyến tính).`, 'percent_added_instead_of_multiplied'),
        w(r2((fn / fd) ** (1 / t)), 'Đây là 1 − r, chưa trừ ra r.', 'stopped_too_early'),
        w(r2(1 - (fn / fd) ** (1 / (t + 1))), 'Lệch một năm.', 'off_by_one'),
      ],
      fmt: (v) => num(v.num / v.den),
      steps: [
        S(`Thay V bằng ${word} của P rồi chia hai vế cho P.`, `(1 - r)^${t} = frac(${fn},${fd})`),
        S(`Lấy căn bậc ${t}.`, `1 - r = (frac(${fn},${fd}))^(frac(1,${t})) ≈ ${num(Math.round((fn / fd) ** (1 / t) * 1000) / 1000)}`),
        S('Trừ ra r.', `r ≈ ${num(Math.round(r * 100) / 100)}`),
      ],
    };
  }),
];

// ============================================================ Chương 8: đồng nhất hệ số, khử mẫu

/** c/x − c/(x − a) = 1  ⇔  x² − ax + ac = 0, hai nghiệm nguyên dương. */
const RQ: Array<[number, number, number, number]> = [];
for (let a = 2; a <= 60; a += 1)
  for (let c = 1; c <= 30; c += 1) {
    const disc = a * a - 4 * a * c;
    if (disc < 0) continue;
    const sq = Math.round(Math.sqrt(disc));
    if (sq * sq !== disc || (a + sq) % 2 !== 0) continue;
    RQ.push([a, c, (a + sq) / 2, (a - sq) / 2]);
  }

/** a/(n − 1) + bn/(n + 1) = b + 1  ⇔  n² + (b − a)n − (a + b + 1) = 0: một nghiệm dương > 1, nghiệm âm khác −1. */
const RC: Array<[number, number, number]> = [];
for (let a = 1; a <= 60; a += 1)
  for (let b = 1; b <= 30; b += 1) {
    const B = b - a;
    const C = -(a + b + 1);
    const disc = B * B - 4 * C;
    const sq = Math.round(Math.sqrt(disc));
    if (sq * sq !== disc || (-B + sq) % 2 !== 0) continue;
    const pos = (-B + sq) / 2;
    const neg = (-B - sq) / 2;
    if (pos > 1 && neg !== -1) RC.push([a, b, pos]);
  }

/** A/(x + c) − B/(x − c) = 1  ⇔  x² − (A − B)x + (A + B)c − c² = 0, hai nghiệm nguyên khác nhau, khác ±c. */
const RT: Array<[number, number, number, number, number]> = [];
for (let A = 2; A <= 30; A += 1)
  for (let B = 1; B <= 15; B += 1)
    for (let c = 1; c <= 8; c += 1) {
      const s1 = A - B;
      const p1 = (A + B) * c - c * c;
      const disc = s1 * s1 - 4 * p1;
      if (disc <= 0) continue;
      const sq = Math.round(Math.sqrt(disc));
      if (sq * sq !== disc || (s1 + sq) % 2 !== 0) continue;
      const r1 = (s1 + sq) / 2;
      const r2 = (s1 - sq) / 2;
      if ([r1, r2].some((r) => r === c || r === -c)) continue;
      RT.push([A, B, c, r1, r2]);
    }

const PRIMES = [2, 3, 5, 7, 11, 13] as const;

const ch8: MathTemplate[] = [
  mcqNum('pd-c-match-coef-product', 'equivalent_expressions', 'medium', (rng) => {
    const p = pickInt(rng, 1, 5);
    const q = pickInt(rng, 1, 9);
    const r = pickInt(rng, 1, 9);
    const a = pickInt(rng, 2, 7);
    const b = q * a - p * r;
    return {
      stem: `If (${linearSide(p, q)})(ax - ${r}) = ${p * a}x^2 + bx - ${q * r} for all values of x, where a and b are constants, what is the value of b?`,
      correct: b,
      wrong: [
        w(q * a, `Chỉ lấy tích chéo ${q} nhân ax, quên tích ${p}x nhân (−${r}).`, 'stopped_too_early'),
        w(q * a + p * r, `Sai dấu tích chéo có −${r}.`, 'sign_flip'),
        w(-p * r, `Chỉ lấy tích chéo có −${r}, quên tích ${q} nhân ax.`, 'stopped_too_early'),
        w(a, 'Đây là a, không phải b.', 'solved_for_wrong_var'),
      ],
      steps: [
        S('So hệ số của x bình phương để tìm a.', `${p}a = ${p * a}  →  a = ${a}`),
        S('Hệ số của x là tổng hai tích chéo.', `b = ${q} · ${a} + ${p} · ${par(-r)} = ${b}`),
      ],
    };
  }),

  grid('pd-c-square-cross-term', 'equivalent_expressions', 'medium', (rng) => {
    const k = pickInt(rng, 1, 6);
    const c = pickNonZeroInt(rng, -9, 12);
    const askSquare = pick(rng, [true, false]);
    const K = k === 1 ? '' : String(k);
    const cst = 2 * k * c;
    return {
      stem: `If (x + ${K}y)^2 = x^2 + ${cf(k * k, 'y^2')}${signedTerm(cst)}, what is the value of ${askSquare ? 'x^2y^2' : 'xy'}?`,
      answer: askSquare ? c * c : c,
      steps: [
        S('Khai triển vế trái.', `x^2 + ${cf(2 * k, 'xy')} + ${cf(k * k, 'y^2')}`),
        S('So với vế phải: số hạng giữa phải bằng hằng số.', `${cf(2 * k, 'xy')} = ${cst}  →  xy = ${c}`),
      ].concat(askSquare ? [S('Bình phương.', `x^2y^2 = ${c * c}`)] : []),
    };
  }),

  grid('pd-c-identity-split-fraction', 'equivalent_expressions', 'medium', (rng) => {
    const k = pickInt(rng, 1, 9);
    const Nn = pickNonZeroInt(rng, -12, 30);
    const [a, b] = pick(rng, [
      ['a', 'b'],
      ['m', 'n'],
      ['k', 't'],
    ] as const);
    return {
      stem: `If frac(${cf(k, `${a}${b}`)} + ${a},${b}) = frac(${a},${b}) + ${Nn} for all nonzero values of ${b}, what is the value of ${a}?`.replace('+ -', '- '),
      answer: rat(Nn, k),
      steps: [
        S('Tách phân số vế trái.', `frac(${cf(k, `${a}${b}`)},${b}) + frac(${a},${b}) = ${cf(k, a)} + frac(${a},${b})`),
        S('So với vế phải.', `${cf(k, a)} = ${Nn}  →  ${a} = ${formatValueMath(rat(Nn, k))}`),
      ],
    };
  }),

  grid('pd-c-rational-to-quadratic', 'nonlinear_equations', 'hard', (rng) => {
    const [a, c, r1, r2] = pick(rng, RQ);
    const great = pick(rng, [true, false]);
    const v = pick(rng, ['x', 't', 'z']);
    return {
      stem: `What is the ${great ? 'greatest' : 'least'} value of ${v} that satisfies the equation frac(${c},${v}) - frac(${c},${v} - ${a}) = 1?`,
      answer: great ? r1 : r2,
      steps: [
        S(`Nhân hai vế với tích hai mẫu.`, `${c}(${v} - ${a}) - ${c}${v} = ${v}(${v} - ${a})`),
        S('Rút gọn về phương trình bậc hai.', `${v}^2 - ${a}${v} + ${a * c} = 0`),
        S('Phân tích.', `(${v} - ${r1})(${v} - ${r2}) = 0`),
        S(r1 === r2 ? 'Nghiệm kép.' : `Chọn nghiệm ${great ? 'lớn' : 'nhỏ'} hơn (cả hai đều không làm mẫu bằng 0).`, `${v} = ${great ? r1 : r2}`),
      ],
    };
  }),

  mcqNum('pd-c-perfect-square-match', 'equivalent_expressions', 'medium', (rng) => {
    const p = pickInt(rng, 1, 6);
    const q = pickInt(rng, 1, 9);
    const neg = pick(rng, [true, false]);
    const [M, Nv] = pick(rng, [
      ['m', 'n'],
      ['a', 'b'],
      ['j', 'k'],
    ] as const);
    const n = neg ? -q : q;
    const m = 2 * p * n;
    return {
      stem: `If ${cf(p * p, 'x^2')} + ${M}x + ${q * q} = (${cf(p, 'x')} + ${Nv})^2 for all values of x, where ${M} and ${Nv} are constants and ${Nv} ${neg ? '<' : '>'} 0, what is the value of ${M} + ${Nv}?`,
      correct: m + n,
      wrong: [
        w(-(m + n), `Chọn nhầm dấu của ${Nv} — đề cho ${Nv} ${neg ? 'âm' : 'dương'}.`, 'sign_flip'),
        w(m, `Đây mới là ${M}.`, 'stopped_too_early'),
        w(p * n + n, `Hệ số giữa của bình phương là 2 nhân ${p} nhân ${Nv} — quên thừa số 2.`, 'expanded_without_middle_term'),
      ],
      steps: [
        S('Khai triển vế phải.', `${cf(p * p, 'x^2')} + ${cf(2 * p, Nv)}x + ${Nv}^2`),
        S('So hằng số.', `${Nv}^2 = ${q * q}  →  ${Nv} = ${n}`),
        S('So hệ số của x.', `${M} = ${2 * p} · ${par(n)} = ${m}  →  ${M} + ${Nv} = ${m + n}`),
      ],
    };
  }),

  mcqText('pd-c-reciprocal-sum-isolate', 'equivalent_expressions', 'medium', (rng) => {
    const k = pickInt(rng, 1, 9);
    const j = pickInt(rng, 1, 5);
    const plus = pick(rng, [true, false]);
    const [x, y, pp] = pick(rng, [
      ['x', 'y', 'p'],
      ['a', 'b', 'f'],
      ['u', 'v', 'w'],
    ] as const);
    const K = k === 1 ? '' : String(k);
    const Jp = j === 1 ? pp : `${j}${pp}`;
    const den = plus ? `${y} - ${Jp}` : `${y} + ${Jp}`;
    return {
      stem: `If frac(${k},${x}) ${plus ? '+' : '-'} frac(${j},${y}) = frac(1,${pp}), which of the following expresses ${x} in terms of ${y} and ${pp}?`,
      correct: `${x} = frac(${K}${pp}${y},${den})`,
      wrong: [
        wt(`${x} = frac(${K}${pp}${y},${plus ? `${y} + ${Jp}` : `${y} - ${Jp}`})`, `Sai dấu khi chuyển phân số chứa ${y} sang vế kia.`, 'sign_flip'),
        wt(`${x} = frac(${den},${K}${pp}${y})`, 'Tìm được phân số nhưng quên lật ngược.', 'inverted_fraction'),
        wt(`${x} = ${K}(${pp} ${plus ? '-' : '+'} ${j === 1 ? y : `frac(${y},${j})`})`, 'Lật từng phân số riêng lẻ — nghịch đảo của một tổng không bằng tổng các nghịch đảo.'),
      ],
      steps: [
        S('Chuyển phân số chứa biến kia sang vế phải rồi quy đồng.', `frac(${k},${x}) = frac(${den},${pp}${y})`),
        S('Lật hai vế rồi nhân với hệ số.', `${x} = frac(${K}${pp}${y},${den})`),
      ],
    };
  }),

  mcqNum('pd-c-match-coef-two-values', 'equivalent_expressions', 'hard', (rng) => {
    const p = pickInt(rng, 1, 5);
    const q = pickInt(rng, 2, 6);
    const P = pick(rng, PRIMES);
    const C = new Set([p * P + q, p + q * P, -(p * P + q), -(p + q * P)]);
    const correct = pick(rng, [...C]);
    const pool = [P + p + q, p * q * P, p * q + P, P - p - q, p * q * (P + 1), P * (p + q) + 1, -(p * q + P), 2 * P].filter((v) => !C.has(v));
    return {
      stem: `If (${cf(p, 'x')} + a)(${cf(q, 'x')} + b) = ${cf(p * q, 'x^2')} + cx + ${P} for all values of x, where a, b, and c are integers, which of the following could be the value of c?`,
      correct,
      wrong: pool.map((v) => w(v, `Không có cặp số nguyên a, b với tích ${P} nào cho ra c bằng số này — kiểm lại bằng cách thử (a, b) là (1, ${P}), (${P}, 1), (−1, −${P}), (−${P}, −1).`)),
      steps: [
        S(`So hằng số: tích ab bằng ${P}, số nguyên tố, nên (a, b) chỉ có bốn khả năng.`),
        S(`Hệ số của x là ${p}b + ${q}a; thử từng cặp được các giá trị ${[...C].join(', ')}.`),
      ],
    };
  }),

  mcqNum('pd-c-division-remainder-match', 'equivalent_expressions', 'medium', (rng) => {
    const p = pickInt(rng, 1, 4);
    const q = pickNonZeroInt(rng, -5, 6);
    const s = pickInt(rng, 2, 8);
    const t = pickNonZeroInt(rng, -20, 20);
    let R = pickNonZeroInt(rng, -40, 60);
    if (q * t + R === 0) R += 1;
    const m = p * t + q * s;
    const Cc = q * t + R;
    const div = linearSide(p, q);
    const rem = R < 0 ? ` - frac(${-R},${div})` : ` + frac(${R},${div})`;
    return {
      stem: `The equation frac(${cf(p * s, 'x^2')} + mx${signedTerm(Cc)},${div}) = ${linearSide(s, t)}${rem} is true for all values of x for which it is defined, where m is a constant. What is the value of m?`,
      correct: m,
      wrong: [
        w(p * t - q * s, 'Sai dấu một tích chéo.', 'sign_flip'),
        w(p * t, `Quên tích ${q} nhân ${s}x.`, 'stopped_too_early'),
        w(m + R, 'Cộng nhầm số dư vào hệ số của x.'),
      ],
      steps: [
        S('Nhân hai vế với mẫu.', `${cf(p * s, 'x^2')} + mx${signedTerm(Cc)} = (${linearSide(s, t)})(${div}) + ${par(R)}`),
        S('Khai triển vế phải, so hệ số của x.', `m = ${s} · ${par(q)} + ${par(t)} · ${p} = ${m}`),
      ],
    };
  }),

  mcqNum('pd-c-cubic-product-match', 'equivalent_expressions', 'medium', (rng) => {
    const c = pickInt(rng, 1, 9);
    const d = pickNonZeroInt(rng, -5, 6);
    const k = pickNonZeroInt(rng, -6, 9);
    const e3 = k - d;
    const e2 = -k * d;
    const rhs = `x^4${signedCoefTerm(e3, 'x^3')}${signedCoefTerm(e2, 'x^2')}${signedCoefTerm(-c, 'x')}${signedTerm(c * d)}`;
    return {
      stem: `If (x^3 + kx^2 - ${c})(x${signedTerm(-d)}) = ${rhs} for all values of x, what is the value of k?`,
      correct: k,
      wrong: [
        w(e3 === k ? k + 1 : e3, `Đọc thẳng hệ số của x mũ 3 — hệ số đó là k ${d < 0 ? '+' : '−'} ${Math.abs(d)}, chưa phải k.`),
        w(-k, 'Sai dấu.', 'sign_flip'),
        w(e3 - d === k ? k + 2 : e3 - d, `Chuyển ${d} sang vế kia mà sai dấu.`, 'sign_flip'),
      ],
      steps: [
        S('Khai triển vế trái, chỉ cần hệ số của x mũ 3.', `x^4 + (k${signedTerm(-d)})x^3 + …`),
        S('So hệ số.', `k${signedTerm(-d)} = ${e3}  →  k = ${k}`),
      ],
    };
  }),

  grid('pd-c-rational-clear-grid', 'nonlinear_equations', 'hard', (rng) => {
    const [a, b, n] = pick(rng, RC);
    const v = pick(rng, ['n', 'k', 'm']);
    return {
      stem: `If frac(${a},${v} - 1) + frac(${cf(b, v)},${v} + 1) = ${b + 1} and ${v} > 0, what is the value of ${v}?`,
      answer: n,
      steps: [
        S('Nhân hai vế với tích hai mẫu.', `${a}(${v} + 1) + ${cf(b, v)}(${v} - 1) = ${b + 1}(${v}^2 - 1)`),
        S('Chuyển hết về một vế.', `${v}^2${signedCoefTerm(b - a, v)} - ${a + b + 1} = 0`),
        S('Phân tích và chọn nghiệm dương.', `${v} = ${n}`),
      ],
    };
  }),

  grid('pd-c-rational-two-roots-grid', 'nonlinear_equations', 'hard', (rng) => {
    const [A, B, c, r1, r2] = pick(rng, RT);
    const great = pick(rng, [true, false]);
    return {
      stem: `What is the ${great ? 'greater' : 'lesser'} of the two solutions to the equation frac(${A},x + ${c}) - frac(${B},x - ${c}) = 1?`,
      answer: great ? r1 : r2,
      steps: [
        S('Nhân hai vế với (x + c)(x − c).', `${A}(x - ${c}) - ${B}(x + ${c}) = x^2 - ${c * c}`),
        S('Chuyển về phương trình bậc hai.', `x^2${signedCoefTerm(-(A - B), 'x')}${signedTerm((A + B) * c - c * c)} = 0`),
        S('Phân tích.', `(x${signedTerm(-r1)})(x${signedTerm(-r2)}) = 0`),
        S('Không nghiệm nào làm mẫu bằng 0; chọn nghiệm cần tìm.', `x = ${great ? r1 : r2}`),
      ],
    };
  }),

  grid('pd-c-rational-common-den-grid', 'nonlinear_equations', 'medium', (rng) => {
    const a = pickInt(rng, 1, 9);
    const b = pickInt(rng, 1, 9);
    const c = pickInt(rng, 1, 5);
    const X = (a + b) * c + pickInt(rng, 1, 40);
    const x0 = rat(X, a + b);
    const K = X + (a - b) * c;
    return {
      stem: `If frac(${a},x - ${c}) + frac(${b},x + ${c}) = frac(${K},x^2 - ${c * c}) and x > ${c}, what is the value of x?`,
      answer: x0,
      steps: [
        S(`Mẫu chung là x bình phương trừ ${c * c}; nhân hai vế với nó.`, `${a}(x + ${c}) + ${b}(x - ${c}) = ${K}`),
        S('Rút gọn.', `${a + b}x${signedTerm((a - b) * c)} = ${K}`),
        S('Giải.', `x = ${formatValueMath(x0)}`),
      ],
    };
  }),
];

// ============================================================ Chương 9: hệ phương trình

const pair = (x: number, y: number) => `(${x}, ${y})`;

/** Ba nhiễu cặp số khác đáp án và khác nhau. */
function pairWrongs(x: number, y: number, extra: Array<[number, number, string]>): TCand[] {
  const seen = new Set([pair(x, y)]);
  const out: TCand[] = [];
  const all: Array<[number, number, string, MathErrorTag | null]> = [
    ...extra.map(([a, b, n]) => [a, b, n, null] as [number, number, string, MathErrorTag | null]),
    [y, x, 'Đảo thứ tự: cặp số viết (x, y).', null],
    [x, -y, 'Sai dấu của y.', 'sign_flip'],
    [-x, y, 'Sai dấu của x.', 'sign_flip'],
    [x + 1, y - 1, 'Lỗi tính toán ở bước cuối — thế ngược vào phương trình sẽ thấy không thoả.', null],
    [x - 2, y + 3, 'Lỗi tính toán — thế ngược vào phương trình sẽ thấy không thoả.', null],
  ];
  for (const [a, b, n, tag] of all) {
    const k = pair(a, b);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(wt(k, n, tag));
    if (out.length === 3) break;
  }
  return out;
}

const COUNT_WORDS = ['Zero', 'Exactly one', 'Exactly two', 'Infinitely many'] as const;

const ch9: MathTemplate[] = [
  mcqText('pd-c-sys-substitution-pair', 'systems_linear_two_var', 'easy', (rng) => {
    const x0 = pickNonZeroInt(rng, -9, 9);
    const y0 = pickNonZeroInt(rng, -6, 6);
    const m = pickNonZeroInt(rng, -5, 5);
    const k = x0 + m * y0;
    const a = pickNonZeroInt(rng, -6, 6);
    let b = pickNonZeroInt(rng, -6, 6);
    // Hệ phải có nghiệm duy nhất: sau khi thế, hệ số của y khác 0.
    if (b === a * m) b = b === 6 ? -6 : b + 1;
    if (b === 0) b = 7;
    const c = a * x0 + b * y0;
    return {
      stem: `If x = ${k === 0 ? coefTerm(-m, 'y') : `${k}${signedCoefTerm(-m, 'y')}`} and ${twoVarSide(a, b)} = ${c}, what is the solution (x, y) to the system?`,
      correct: pair(x0, y0),
      wrong: pairWrongs(x0, y0, []),
      steps: [
        S('Thế x từ phương trình thứ nhất vào phương trình thứ hai rồi giải y.', `y = ${y0}`),
        S('Thế y ngược lại để tìm x.', `x = ${x0}`),
      ],
    };
  }),

  mcqText('pd-c-sys-solve-pair', 'systems_linear_two_var', 'easy', (rng) => {
    const x0 = pickNonZeroInt(rng, -8, 8);
    const y0 = pickNonZeroInt(rng, -8, 8);
    if (pick(rng, [true, false])) {
      const a = pickNonZeroInt(rng, -5, 5);
      const b = pickInt(rng, 2, 7);
      let c = pickNonZeroInt(rng, -7, 7);
      if (a * c === b) c = c === 7 ? -7 : c + 1;
      if (c === 0) c = 8;
      return {
        stem: `What is the solution (x, y) to the system of equations y${signedCoefTerm(a, 'x')} = ${y0 + a * x0} and ${twoVarSide(b, c)} = ${b * x0 + c * y0}?`,
        correct: pair(x0, y0),
        wrong: pairWrongs(x0, y0, []),
        steps: [
          S('Rút y từ phương trình thứ nhất.', `y = ${linearSide(-a, y0 + a * x0)}`),
          S('Thế vào phương trình thứ hai rồi giải x; thế ngược tìm y.', `x = ${x0},  y = ${y0}`),
        ],
      };
    }
    // Dạng phải biến đổi trước: có ngoặc và ẩn nằm ở hai vế.
    const p = pickInt(rng, 2, 5);
    const q = pickNonZeroInt(rng, -4, 4);
    const r = pickInt(rng, 2, 5);
    const lhs1 = p * x0;
    const c1 = lhs1 - y0; // p·x = y + c1
    const inner = x0 + q;
    let t = pickNonZeroInt(rng, -4, 4);
    if (p * t + r === 0) t = t === 4 ? 5 : t + 1;
    if (t === 0) t = 1;
    const rhsC = r * inner + t * y0;
    return {
      stem: `What is the solution (x, y) to the system of equations ${p}x = y${signedTerm(c1)} and ${r}(x${signedTerm(q)}) = ${rhsC}${signedCoefTerm(-t, 'y')}?`,
      correct: pair(x0, y0),
      wrong: pairWrongs(x0, y0, []),
      steps: [
        S('Đưa cả hai phương trình về dạng ax + by = c.', `${p}x - y = ${c1},  ${twoVarSide(r, t)} = ${rhsC - r * q}`),
        S('Khử một ẩn rồi giải.', `x = ${x0},  y = ${y0}`),
      ],
    };
  }),

  mcqNum('pd-c-sys-combo-trick', 'systems_linear_two_var', 'medium', (rng) => {
    const x0 = pickNonZeroInt(rng, -9, 9);
    const y0 = pickNonZeroInt(rng, -9, 9);
    if (pick(rng, [true, false])) {
      const a = pickInt(rng, 2, 7);
      let b = pickInt(rng, 2, 7);
      if (b === a) b += 1;
      const A = a * x0 - b * y0;
      const B = b * x0 - a * y0;
      const ask = pick(rng, ['y - x', 'x - y'] as const);
      const val = ask === 'x - y' ? x0 - y0 : y0 - x0;
      return {
        stem: `If ${a}x - ${b}y = ${A} and ${b}x - ${a}y = ${B}, what is the value of ${ask}?`,
        correct: val,
        wrong: [w(-val, 'Sai dấu: đề hỏi hiệu theo thứ tự ngược lại.', 'sign_flip'), w(A + B, `Cộng hai phương trình nhưng quên chia cho ${a + b}.`, 'stopped_too_early'), w(A - B, 'Trừ hai phương trình — cộng mới làm hai hệ số bằng nhau.')],
        steps: [
          S('Cộng hai phương trình: hệ số của x và của y bằng nhau về độ lớn.', `${a + b}x - ${a + b}y = ${A + B}`),
          S(`Chia cho ${a + b}.`, `x - y = ${x0 - y0}`),
        ].concat(ask === 'y - x' ? [S('Đổi dấu.', `y - x = ${y0 - x0}`)] : []),
      };
    }
    const c = pickInt(rng, 1, 6);
    let dd = pickInt(rng, 1, 6);
    if (dd === c) dd += 1;
    const A = (c + 1) * x0 + (dd + 1) * y0;
    const B = c * x0 + dd * y0;
    return {
      stem: `If ${cf(c + 1, 'x')} + ${cf(dd + 1, 'y')} = ${A} and ${cf(c, 'x')} + ${cf(dd, 'y')} = ${B}, what is the value of x + y?`,
      correct: x0 + y0,
      wrong: [w(A + B, 'Cộng hai phương trình — trừ mới khử được phần chung.'), w(x0, 'Đây mới là x.', 'stopped_too_early'), w(y0, 'Đây mới là y.', 'stopped_too_early')],
      steps: [S('Trừ phương trình sau khỏi phương trình trước.', `x + y = ${A} - ${par(B)} = ${x0 + y0}`)],
    };
  }),

  mcqNum('pd-c-sys-rearrange-product', 'systems_linear_two_var', 'medium', (rng) => {
    const x0 = pickNonZeroInt(rng, -7, 8);
    const y0 = pickNonZeroInt(rng, -7, 8);
    const a = pickInt(rng, 2, 5);
    const b = pickInt(rng, 2, 5);
    const c1 = a * y0 + b * x0; // a·y = c1 − b·x
    const d = pickInt(rng, 2, 4);
    const c2 = x0 - d * y0; // x = d·y + c2
    return {
      stem: `If ${a}y = ${c1}${signedCoefTerm(-b, 'x')} and x = ${cf(d, 'y')}${signedTerm(c2)}, what is the value of xy?`,
      correct: x0 * y0,
      wrong: [w(x0 + y0, 'Cộng x với y — đề hỏi tích.'), w(-x0 * y0, 'Sai dấu một ẩn.', 'sign_flip'), w(x0 * x0 === x0 * y0 ? x0 * y0 + 2 : x0 * x0, 'Tìm được x rồi nhầm y bằng x.', 'stopped_too_early')],
      steps: [
        S('Thế x vào phương trình thứ nhất.', `${a}y = ${c1} - ${b}(${cf(d, 'y')}${signedTerm(c2)})`),
        S('Giải y, rồi thế ngược tìm x.', `y = ${y0},  x = ${x0}`),
        S('Tính tích.', `xy = ${x0 * y0}`),
      ],
    };
  }),

  mcqText('pd-c-line-parabola-count', 'nonlinear_equations', 'medium', (rng) => {
    const m = 2 * pickNonZeroInt(rng, -4, 4);
    const b = pickNonZeroInt(rng, -9, 9);
    const kind = pick(rng, [0, 1, 2]);
    // x² + c = mx + b  ⇔  x² − mx + (c − b) = 0; biệt thức m² − 4(c − b).
    const base = b + (m * m) / 4;
    const c = kind === 1 ? base : kind === 0 ? base + pickInt(rng, 1, 9) : base - pickInt(rng, 1, 9);
    const idx = kind;
    return {
      stem: `How many solutions does the system of equations y = x^2${signedTerm(c)} and y = ${linearSide(m, b)} have?`,
      correct: COUNT_WORDS[idx]!,
      wrong: COUNT_WORDS.filter((_, i) => i !== idx).map((wd) =>
        wt(wd, wd === 'Infinitely many' ? 'Một đường thẳng và một parabol không thể trùng nhau.' : 'Biệt thức của phương trình hoành độ giao điểm quyết định số nghiệm.'),
      ),
      steps: [
        S('Cho hai vế bằng nhau để được phương trình bậc hai.', `x^2${signedCoefTerm(-m, 'x')}${signedTerm(c - b)} = 0`),
        S('Tính biệt thức.', `${m * m} - 4 · ${par(c - b)} = ${m * m - 4 * (c - b)}`),
        S(kind === 0 ? 'Biệt thức âm: không có giao điểm.' : kind === 1 ? 'Biệt thức bằng 0: tiếp xúc tại đúng một điểm.' : 'Biệt thức dương: hai giao điểm.'),
      ],
    };
  }),

  mcqText('pd-c-sys-count-solutions', 'systems_linear_two_var', 'medium', (rng) => {
    const a = pickNonZeroInt(rng, -6, 6);
    const b = pickNonZeroInt(rng, -6, 6);
    const c = pickNonZeroInt(rng, -12, 12);
    const k = pick(rng, [-3, -2, 2, 3, 4]);
    const kind = pick(rng, ['one', 'none', 'inf'] as const);
    const a2 = k * a;
    let b2 = k * b;
    let c2 = k * c;
    if (kind === 'none') c2 = k * c + pickNonZeroInt(rng, -5, 5);
    if (kind === 'one') b2 = k * b + pickNonZeroInt(rng, -3, 3);
    const idx = kind === 'none' ? 0 : kind === 'one' ? 1 : 3;
    return {
      stem: `How many solutions does the system of equations ${twoVarSide(a, b)} = ${c} and ${twoVarSide(a2, b2)} = ${c2} have?`,
      correct: COUNT_WORDS[idx]!,
      wrong: COUNT_WORDS.filter((_, i) => i !== idx).map((wd) =>
        wt(
          wd,
          wd === 'Exactly two' ? 'Hai đường thẳng chỉ cắt nhau tại nhiều nhất một điểm, hoặc trùng nhau.' : 'So tỉ số hệ số của x, của y và của vế phải của hai phương trình.',
        ),
      ),
      steps: [
        S('So tỉ số các hệ số tương ứng.', `frac(${a2},${a}),  frac(${b2},${b}),  frac(${c2},${c})`),
        S(kind === 'inf' ? 'Cả ba tỉ số bằng nhau: hai phương trình là một đường thẳng.' : kind === 'none' ? 'Hệ số của x và y cùng tỉ số nhưng vế phải khác: hai đường song song.' : 'Tỉ số của x và y khác nhau: hai đường cắt nhau tại một điểm.'),
      ],
    };
  }),

  mcqNum('pd-c-sys-infinite-param', 'systems_linear_two_var', 'medium', (rng) => {
    const p = pickNonZeroInt(rng, -6, 6);
    const q = pickNonZeroInt(rng, -6, 6);
    const kk = pick(rng, [-4, -3, -2, 2, 3, 4]);
    const a = pickNonZeroInt(rng, -9, 9);
    const c = kk * a;
    return {
      stem: `In the system of equations ${twoVarSide(p, q)} = a and bx${signedCoefTerm(kk * q, 'y')} = ${c}, a and b are constants. If the system has infinitely many solutions, what is the value of a?`,
      correct: a,
      wrong: [w(kk * p, 'Đây là b, không phải a.', 'solved_for_wrong_var'), w(c * kk, `Nhân với ${kk} thay vì chia.`, 'inverted_fraction'), w(-a, 'Sai dấu của hệ số tỉ lệ.', 'sign_flip')],
      steps: [
        S('Vô số nghiệm nghĩa là phương trình sau là phương trình trước nhân một số k.', `k = frac(${kk * q},${q}) = ${kk}`),
        S('Vế phải cũng nhân k.', `${kk}a = ${c}  →  a = ${a}`),
      ],
    };
  }),

  mcqNum('pd-c-sys-one-solution-exclude', 'systems_linear_two_var', 'medium', (rng) => {
    const p = pickInt(rng, 1, 5);
    const k = pickNonZeroInt(rng, -3, 3);
    const a0 = pickNonZeroInt(rng, -6, 6);
    const t = k * p;
    const s = k * a0;
    const c1 = pickInt(rng, 1, 12);
    const c2 = pickInt(rng, 1, 30);
    return {
      stem: `The system of equations ax + ${cf(p, 'y')} = ${c1} and ${twoVarSide(s, t)} = ${c2} has exactly one solution. Which of the following CANNOT be the value of a?`,
      correct: a0,
      wrong: [w(-a0, 'Với giá trị này hai đường vẫn cắt nhau.', 'sign_flip'), w(s === a0 ? a0 + 2 : s, 'Chép hệ số của phương trình kia — hai đường vẫn cắt nhau.'), w(a0 + 1, 'Với giá trị này hai đường vẫn cắt nhau.'), w(0, 'Với a bằng 0 hai đường vẫn cắt nhau.')],
      steps: [
        S('Hệ có đúng một nghiệm khi hai đường KHÔNG song song: tỉ số hệ số x khác tỉ số hệ số y.'),
        S('Tìm a làm hai đường song song — đó là giá trị bị loại.', `frac(a,${s}) = frac(${p},${t})  →  a = ${a0}`),
      ],
    };
  }),

  mcqText('pd-c-sys-fraction-coef', 'systems_linear_two_var', 'medium', (rng) => {
    const p = pick(rng, [2, 3, 4]);
    const q = pick(rng, [2, 3, 5]);
    const x0 = p * pickNonZeroInt(rng, -4, 4);
    let m = pickNonZeroInt(rng, -4, 4);
    if (m * p === -q) m = -m;
    const y0 = q * pickNonZeroInt(rng, -4, 4);
    const b = y0 - m * x0;
    const c = x0 / p + y0 / q;
    return {
      stem: `What is the solution (x, y) to the system of equations frac(1,${p})x + frac(1,${q})y = ${c} and y = ${linearSide(m, b)}?`,
      correct: pair(x0, y0),
      wrong: pairWrongs(x0, y0, [[x0 / p, y0 / q, 'Đây là giá trị của các phân số, chưa nhân lại.']]),
      steps: [
        S(`Nhân phương trình đầu với ${p * q} để khử mẫu.`, `${q}x + ${p}y = ${c * p * q}`),
        S('Thế y từ phương trình sau vào rồi giải.', `x = ${x0},  y = ${y0}`),
      ],
    };
  }),

  grid('pd-c-sys-decimal-grid', 'systems_linear_two_var', 'medium', (rng) => {
    const [dd, mul] = pick(rng, [
      [0.5, 2],
      [0.25, 4],
      [1.5, 2],
      [2.5, 2],
      [0.2, 5],
      [0.75, 4],
    ] as const);
    const x0 = mul * pickInt(rng, -10, 20);
    const b = pickInt(rng, 1, 30);
    const y0 = dd * x0 + b;
    const e = x0 - y0;
    const askY = pick(rng, [true, false]);
    return {
      stem: `If y = ${num(dd)}x + ${b} and x - y = ${num(e)}, what is the value of ${askY ? 'y' : 'x'}?`,
      answer: toRat(askY ? y0 : x0),
      steps: [
        S('Thế y vào phương trình thứ hai.', `x - (${num(dd)}x + ${b}) = ${num(e)}`),
        S('Giải x.', `${num(1 - dd)}x = ${num(e + b)}  →  x = ${x0}`),
      ].concat(askY ? [S('Tính y.', `y = ${num(y0)}`)] : []),
    };
  }),

  mcqNum('pd-c-sys-infinite-ratio', 'systems_linear_two_var', 'hard', (rng) => {
    const p = pickInt(rng, 1, 6);
    const n0 = pickInt(rng, 2, 9);
    const c = pickNonZeroInt(rng, -9, 9);
    const k = pick(rng, [2, 3, 4, 5, -2]);
    const m = k * p;
    const [M, Nn] = pick(rng, [
      ['m', 'n'],
      ['a', 'b'],
      ['r', 's'],
    ] as const);
    return {
      stem: `In the system of equations ${M}x${signedCoefTerm(-k * n0, 'y')} = ${k * c} and ${cf(p, 'x')} - ${Nn}y = ${c}, ${M} and ${Nn} are constants. If the system has infinitely many solutions, what is the value of frac(${M},${Nn})?`,
      correct: rat(m, n0),
      wrong: [w(rat(n0, m), 'Lật ngược tỉ số.', 'inverted_fraction'), w(rat(p, n0), `Quên nhân hệ số của x với ${k}.`, 'stopped_too_early'), w(rat(m, k * n0), `Lấy hệ số của y ở phương trình đầu (${k * n0}) làm ${Nn}.`)],
      steps: [
        S('Vô số nghiệm: phương trình đầu là phương trình sau nhân k. So vế phải.', `k = frac(${k * c},${c}) = ${k}`),
        S('Suy ra từng hằng số.', `${M} = ${k} · ${p} = ${m},  ${Nn} = frac(${k * n0},${k}) = ${n0}`),
        S('Tính tỉ số.', `frac(${M},${Nn}) = ${formatValueMath(rat(m, n0))}`),
      ],
    };
  }),

  grid('pd-c-sys-radical-grid', 'nonlinear_equations', 'hard', (rng) => {
    const k = pickInt(rng, 2, 4);
    const a = pickInt(rng, 1, 9);
    const r = pickInt(rng, 1, 9);
    const b = (k - 1) * r - a;
    const askY = pick(rng, [true, false]);
    return {
      stem: `If y = sqrt(x) + ${a} and sqrt(${k * k}x) - y = ${b}, what is the value of ${askY ? 'y' : 'x'}?`,
      answer: askY ? r + a : r * r,
      steps: [
        S(`Căn của ${k * k}x bằng ${k} nhân căn x; thế y vào.`, `${k}sqrt(x) - (sqrt(x) + ${a}) = ${b}`),
        S('Giải căn x.', `${k - 1 === 1 ? '' : k - 1}sqrt(x) = ${b + a}  →  sqrt(x) = ${r}`),
        S(askY ? 'Tính y.' : 'Bình phương.', askY ? `y = ${r} + ${a} = ${r + a}` : `x = ${r * r}`),
      ],
    };
  }),

  mcqText('pd-c-sys-weights-express', 'systems_linear_two_var', 'hard', (rng) => {
    const b = pickInt(rng, 1, 4);
    const c = pickInt(rng, 1, 6);
    const kL = pickInt(rng, 2, 9);
    const a = kL * (b + 1) - b * c;
    const ok = a > 0;
    const A = ok ? a : a + (b + 1) * 3;
    const K = ok ? kL : kL + 3;
    const ctx = pick(rng, [
      ['small', 'medium', 'large', 'boxes'],
      ['bronze', 'silver', 'gold', 'coins'],
      ['red', 'blue', 'green', 'blocks'],
    ] as const);
    return {
      stem: `The weights of ${ctx[0]}, ${ctx[1]}, and ${ctx[2]} ${ctx[3]} are S, M, and L grams, respectively. They satisfy ${A}S = ${cf(b, 'M')} + L and ${cf(c, 'S')} + M = L. Which of the following expresses L in terms of S?`,
      correct: `L = ${K}S`,
      wrong: [
        wt(`L = ${K + 1}S`, 'Lỗi cộng trừ khi gom các số hạng S.'),
        wt(`L = ${A - c}S`, 'Trừ thẳng hai phương trình mà không khử M.'),
        wt(`L = ${A + b * c}S`, `Quên chia cho ${b + 1} ở bước cuối.`, 'stopped_too_early'),
        wt(`L = ${A}S`, `Bỏ qua số hạng M, coi L bằng ${A}S.`),
        wt(`L = ${K - 1}S`, 'Lỗi cộng trừ khi gom các số hạng S.'),
      ],
      steps: [
        S('Rút M từ phương trình thứ hai.', `M = L - ${cf(c, 'S')}`),
        S('Thế vào phương trình thứ nhất.', `${A}S = ${b === 1 ? '' : b}(L - ${cf(c, 'S')}) + L`),
        S('Gom L và S.', `${A + b * c}S = ${b + 1}L  →  L = ${K}S`),
      ],
    };
  }),

  mcqText('pd-c-sys-score-model', 'systems_linear_two_var', 'medium', (rng) => {
    const p = pickInt(rng, 2, 6);
    const q = pickInt(rng, 1, 3);
    const Nq = pickInt(rng, 20, 50);
    const c0 = pickInt(rng, Math.ceil(Nq / 2), Nq - 1);
    const T = p * c0 - q * (Nq - c0);
    return {
      stem: `On a quiz with ${Nq} questions, each correct answer earns ${p} points and each incorrect answer loses ${q} point${q === 1 ? '' : 's'}. A student answered every question and scored ${T} points. If c is the number of correct answers and w is the number of incorrect answers, which system of equations models this situation?`,
      correct: `c + w = ${Nq} and ${p}c - ${cf(q, 'w')} = ${T}`,
      wrong: [
        wt(`c + w = ${T} and ${p}c - ${cf(q, 'w')} = ${Nq}`, 'Đảo vai trò tổng số câu và tổng điểm.'),
        wt(`c + w = ${Nq} and ${p}c + ${cf(q, 'w')} = ${T}`, 'Câu sai bị TRỪ điểm, phải là dấu trừ.', 'sign_flip'),
        wt(`c - w = ${Nq} and ${p}c - ${cf(q, 'w')} = ${T}`, 'Tổng số câu là đúng CỘNG sai.'),
      ],
      steps: [S('Tổng số câu.', `c + w = ${Nq}`), S('Tổng điểm: câu đúng cộng, câu sai trừ.', `${p}c - ${cf(q, 'w')} = ${T}`)],
    };
  }),

  grid('pd-c-sys-darts-grid', 'systems_linear_two_var', 'medium', (rng) => {
    const A = pickInt(rng, 2, 25);
    let B = pickInt(rng, 2, 25);
    if (B === A) B += 1;
    const m = pickInt(rng, 2, 3);
    const s1 = A + m * B;
    const s2 = m * A + B;
    const askB = pick(rng, [true, false]);
    const ctx = pick(rng, [
      ['a dart board', 'the inner ring', 'the outer ring', 'darts'],
      ['an archery target', 'the gold zone', 'the red zone', 'arrows'],
      ['a beanbag toss board', 'the small hole', 'the large hole', 'beanbags'],
    ] as const);
    return {
      stem: `On ${ctx[0]}, every hit in ${ctx[1]} earns the same number of points, and every hit in ${ctx[2]} earns the same number of points. One player scored ${s1} points with 1 hit in ${ctx[1]} and ${m} hits in ${ctx[2]}. Another player scored ${s2} points with ${m} hits in ${ctx[1]} and 1 hit in ${ctx[2]}. How many points is one hit in ${askB ? ctx[2] : ctx[1]} worth?`,
      answer: askB ? B : A,
      steps: [
        S('Gọi A và B là điểm của mỗi vùng.', `A + ${m}B = ${s1},  ${m}A + B = ${s2}`),
        S('Khử một ẩn rồi giải.', `A = ${A},  B = ${B}`),
      ],
    };
  }),

  mcqNum('pd-c-sys-tables-count', 'systems_linear_two_var', 'medium', (rng) => {
    const p = pick(rng, [2, 4, 6]);
    const q = p + pick(rng, [2, 4, 6]);
    const x0 = pickInt(rng, 3, 30);
    const y0 = pickInt(rng, 3, 30);
    const T = x0 + y0;
    const P = p * x0 + q * y0;
    const ctx = pick(rng, [
      ['A theater', 'boxes', 'seats', 'guests'],
      ['A ferry', 'benches', 'spots', 'passengers'],
      ['A campground', 'tents', 'sleeping spots', 'campers'],
    ] as const);
    return {
      stem: `${ctx[0]} has ${T} ${ctx[1]}. Some ${ctx[1]} have ${p} ${ctx[2]} and the rest have ${q} ${ctx[2]}. If all ${P} ${ctx[2]} are filled by ${P} ${ctx[3]}, how many ${ctx[1]} have ${p} ${ctx[2]}?`,
      correct: x0,
      wrong: [
        w(y0, `Đây là số loại ${q} chỗ.`, 'solved_for_wrong_var'),
        w(Math.round(P / p), `Chia hết số người cho ${p} — còn loại ${q} chỗ nữa.`),
        w(T - Math.round(P / q), `Chia số người cho ${q} rồi làm tròn — phải giải hệ.`, 'rounded_too_early'),
        w(x0 + y0, 'Đây là tổng số, chưa tách hai loại.'),
      ],
      steps: [
        S('Gọi x là số loại nhỏ, y là số loại lớn.', `x + y = ${T},  ${p}x + ${q}y = ${P}`),
        S(`Nhân phương trình đầu với ${q} rồi trừ.`, `${q - p}x = ${q * T - P}  →  x = ${x0}`),
      ],
    };
  }),
];

// ============================================================ Chương 10: bất phương trình

const ROMAN = ['I', 'II', 'III'] as const;
const COMBOS: Array<{ set: number[]; text: string }> = [
  { set: [0], text: 'I only' },
  { set: [1], text: 'II only' },
  { set: [2], text: 'III only' },
  { set: [0, 1], text: 'I and II only' },
  { set: [0, 2], text: 'I and III only' },
  { set: [1, 2], text: 'II and III only' },
  { set: [0, 1, 2], text: 'I, II, and III' },
];

/** Dựng bốn lựa chọn La Mã: một tổ hợp đúng + ba tổ hợp sai. */
function romanChoices(rng: () => number, truth: boolean[]): { correct: string; wrong: TCand[] } {
  const trueSet = truth.map((t, i) => (t ? i : -1)).filter((i) => i >= 0);
  const key = trueSet.join(',');
  const correct = COMBOS.find((c) => c.set.join(',') === key);
  const others = COMBOS.filter((c) => c.set.join(',') !== key);
  // Xáo thứ tự các tổ hợp sai theo rng rồi lấy ba cái.
  const order = others.map((c) => ({ c, r: rng() })).sort((a, b) => a.r - b.r);
  return {
    correct: correct ? correct.text : 'None of them',
    wrong: order.slice(0, 3).map(({ c }) => {
      const extra = c.set.filter((i) => !truth[i]);
      const missing = trueSet.filter((i) => !c.set.includes(i));
      return wt(c.text, extra.length > 0 ? `Mệnh đề ${ROMAN[extra[0]!]} không phải lúc nào cũng đúng — thử một phản ví dụ.` : `Bỏ sót mệnh đề ${ROMAN[missing[0]!]}, mệnh đề này luôn đúng.`);
    }),
  };
}

const ch10: MathTemplate[] = [
  mcqNum('pd-c-ineq-which-solution', 'linear_inequalities', 'easy', (rng) => {
    const a = pickNonZeroInt(rng, -5, 5);
    let c = pickNonZeroInt(rng, -5, 5);
    if (c === a) c = a === 5 ? -5 : a + 1;
    const x0 = pickInt(rng, -6, 6);
    const b = pickInt(rng, -15, 15);
    const d = (a - c) * x0 + b;
    // a x + b > c x + d  ⇔  (a − c)x > (a − c)x0  ⇔  x > x0 nếu a − c > 0, x < x0 nếu âm.
    const up = a - c > 0;
    const good = up ? x0 + pickInt(rng, 1, 6) : x0 - pickInt(rng, 1, 6);
    return {
      stem: `Which of the following is a solution to the inequality ${linearSide(a, b)} > ${linearSide(c, d)}?`,
      correct: good,
      wrong: [
        w(x0, 'Đây là điểm biên — dấu lớn hơn nghiêm ngặt nên nó không thoả.', 'off_by_one'),
        ...[1, 3, 6, 10].map((k) => w(up ? x0 - k : x0 + k, 'Nằm sai phía của điểm biên — kiểm lại chiều khi chia cho hệ số âm.', 'forgot_flip_inequality')),
      ],
      steps: [S('Gom x về một vế.', `${linearSide(a - c, 0)} > ${d - b}`)].concat(
        a - c === 1 ? [] : [S(up ? 'Chia cho số dương, giữ chiều.' : 'Chia cho số âm, đổi chiều.', `x ${up ? '>' : '<'} ${x0}`)],
      ),
    };
  }),

  mcqText('pd-c-ineq-frac-coef', 'linear_inequalities', 'medium', (rng) => {
    const [p, q, r, s] = pick(rng, [
      [3, 4, 1, 2],
      [2, 3, 1, 6],
      [5, 6, 1, 3],
      [1, 2, 3, 4],
      [1, 3, 5, 6],
      [3, 5, 1, 5],
    ] as const);
    const L = q * s;
    const coefDiff = rat(p * s - r * q, L); // p/q − r/s
    const K = pickNonZeroInt(rng, -12, 12) * coefDiff.den;
    const a = pickInt(rng, 1, 15);
    const b = a - (coefDiff.num * K) / coefDiff.den; // p/q x − a > r/s x − b  ⇔  (p/q − r/s)x > a − b
    const up = coefDiff.num > 0;
    const v = pick(rng, ['x', 'n', 't']);
    return {
      stem: `If frac(${p},${q})${v} - ${a} > frac(${r},${s})${v}${signedTerm(-b)}, which of the following must be true?`,
      correct: `${v} ${up ? '>' : '<'} ${K}`,
      wrong: [
        wt(`${v} ${up ? '<' : '>'} ${K}`, 'Đổi chiều khi không cần — chỉ đổi khi nhân hoặc chia cho số âm.', 'forgot_flip_inequality'),
        wt(`${v} ${up ? '>' : '<'} ${-K}`, 'Sai dấu khi chuyển hằng số.', 'sign_flip'),
        wt(`${v} ${up ? '<' : '>'} ${-K}`, 'Vừa sai dấu vừa đổi chiều.'),
      ],
      steps: [
        S(`Nhân hai vế với ${L} để khử mẫu (số dương, giữ chiều).`),
        S('Gom ẩn về một vế rồi chia.', `${v} ${up ? '>' : '<'} ${K}`),
      ],
    };
  }),

  mcqText('pd-c-ineq-region-words', 'linear_inequalities', 'medium', (rng) => {
    if (pick(rng, [true, false])) {
      // Một đường ngang và một đường chéo qua gốc.
      const h = pickNonZeroInt(rng, -6, 6);
      const m = pickNonZeroInt(rng, -3, 3);
      const belowH = pick(rng, [true, false]);
      const aboveL = pick(rng, [true, false]);
      const solid = pick(rng, [true, false]);
      const lt = solid ? '<=' : '<';
      const gt = solid ? '>=' : '>';
      const L = coefTerm(m, 'x');
      const e1 = `y ${belowH ? lt : gt} ${h}`;
      const e2 = `y ${aboveL ? gt : lt} ${L}`;
      return {
        stem: `In the xy-plane, the graph of a system of two inequalities is a shaded region bounded by two ${solid ? 'solid' : 'dashed'} lines: the horizontal line through (0, ${h}) and the line through (0, 0) and (1, ${m}). The shaded region lies ${belowH ? 'below' : 'above'} the horizontal line and ${aboveL ? 'above' : 'below'} the other line. Which of the following could be the system?`,
        correct: `${e1} and ${e2}`,
        wrong: [
          wt(`y ${belowH ? gt : lt} ${h} and ${e2}`, 'Nhầm phía của đường ngang: "phía dưới" là y nhỏ hơn.', 'forgot_flip_inequality'),
          wt(`${e1} and y ${aboveL ? lt : gt} ${L}`, 'Nhầm phía của đường chéo: "phía trên" là y lớn hơn.', 'forgot_flip_inequality'),
          wt(`x ${belowH ? lt : gt} ${h} and ${e2}`, `Đường ngang qua (0, ${h}) có phương trình y = ${h}, không phải x = ${h}.`),
        ],
        steps: [
          S(`Đường ngang qua (0, ${h}) là y = ${h}; đường qua gốc và (1, ${m}) là y = ${L}.`),
          S(`Phía trên một đường là y lớn hơn, phía dưới là y nhỏ hơn; đường ${solid ? 'liền có dấu bằng' : 'nét đứt không có dấu bằng'}.`, `${e1},  ${e2}`),
        ],
      };
    }
    // Dải nằm giữa hai đường song song trục.
    const hi = pickInt(rng, 1, 8);
    const lo = -pickInt(rng, 1, 8);
    const vertical = pick(rng, [true, false]);
    const solid = pick(rng, [true, false]);
    const v = vertical ? 'x' : 'y';
    const u = vertical ? 'y' : 'x';
    const le = solid ? '<=' : '<';
    const ge = solid ? '>=' : '>';
    const point = (t: number) => (vertical ? `(${t}, 0)` : `(0, ${t})`);
    return {
      stem: `In the xy-plane, the graph of a system of two inequalities is the band between two ${solid ? 'solid' : 'dashed'} ${vertical ? 'vertical' : 'horizontal'} lines, one through ${point(hi)} and one through ${point(lo)}, including all points between them. Which of the following could be the system?`,
      correct: `${v} ${le} ${hi} and ${v} ${ge} ${lo}`,
      wrong: [
        wt(`${v} ${ge} ${hi} and ${v} ${le} ${lo}`, 'Đảo chiều cả hai: miền này nằm GIỮA hai đường, không phải bên ngoài.', 'forgot_flip_inequality'),
        wt(`${u} ${le} ${hi} and ${u} ${ge} ${lo}`, `Đường ${vertical ? 'dọc' : 'ngang'} có phương trình dạng ${v} = hằng số.`),
        wt(`${u} ${ge} ${hi} and ${u} ${le} ${lo}`, `Vừa nhầm trục vừa nhầm chiều.`),
      ],
      steps: [
        S(`Hai đường ${vertical ? 'dọc' : 'ngang'} là ${v} = ${hi} và ${v} = ${lo}.`),
        S('Miền nằm giữa: nhỏ hơn đường trên (phải) và lớn hơn đường dưới (trái).', `${lo} ${le} ${v} ${le} ${hi}`),
      ],
    };
  }),

  mcqText('pd-c-ineq-within-tolerance', 'linear_inequalities', 'easy', (rng) => {
    const dd = pickInt(rng, 2, 50);
    const [m, n] = pick(rng, [
      ['m', 'n'],
      ['e', 'a'],
      ['g', 'c'],
    ] as const);
    const ctx = pick(rng, ['beads in a box', 'people at a concert', 'cars in a parking lot', 'birds in a flock']);
    return {
      stem: `A player estimates that there are ${m} ${ctx}. The actual number, ${n}, is within ${dd} (inclusive) of the estimate. Which of the following inequalities represents the relationship between the estimate and the actual number?`,
      correct: `${m} - ${dd} <= ${n} <= ${m} + ${dd}`,
      wrong: [
        wt(`${n} + ${dd} <= ${m} <= ${n} - ${dd}`, 'Hai đầu bị đảo: không số nào vừa lớn hơn n + d vừa nhỏ hơn n − d.'),
        wt(`${n} <= ${m} <= ${dd}${n}`, `"Trong phạm vi ${dd}" là cộng trừ ${dd}, không phải nhân.`),
        wt(`frac(${m},${dd}) <= ${n} <= ${dd}${m}`, `"Trong phạm vi ${dd}" là cộng trừ ${dd}, không phải nhân chia.`),
      ],
      steps: [S(`Khoảng cách giữa ${n} và ${m} không quá ${dd}.`, `${m} - ${dd} <= ${n} <= ${m} + ${dd}`)],
    };
  }),

  mcqText('pd-c-ineq-supply-demand', 'linear_inequalities', 'medium', (rng) => {
    const a = pickInt(rng, 2, 15);
    const c = pickInt(rng, 1, 9);
    const K = pickInt(rng, 5, 90);
    const b = 10 * pickInt(rng, 1, 30);
    const dd = K * (a + c) + b;
    const alt = rat(dd + b, a + c);
    const altK = alt.den === 1 ? alt.num : Math.round(alt.num / alt.den);
    return {
      stem: `A factory makes backpacks according to the model M = ${a}P + ${b}, where M is the number made and P is the price of each backpack, in dollars. The number of backpacks sold is modeled by S = -${cf(c, 'P')} + ${dd}. For which prices P is the number of backpacks made greater than or equal to the number sold?`,
      correct: `P >= ${K}`,
      wrong: [
        wt(`P <= ${K}`, 'Chia cho số dương không đổi chiều.', 'forgot_flip_inequality'),
        wt(`P >= ${altK === K ? K + 2 : altK}`, `Chuyển ${b} sang vế kia mà quên đổi dấu.`, 'sign_flip'),
        wt(`P <= ${altK === K ? K + 2 : altK}`, 'Vừa sai dấu vừa đổi chiều.'),
      ],
      steps: [
        S('Lập bất phương trình.', `${a}P + ${b} >= -${cf(c, 'P')} + ${dd}`),
        S('Gom P rồi chia.', `${a + c}P >= ${dd - b}  →  P >= ${K}`),
      ],
    };
  }),

  grid('pd-c-ineq-least-integer-grid', 'linear_inequalities', 'medium', (rng) => {
    const a = pickInt(rng, 2, 6);
    const b = pickInt(rng, 1, 9);
    const c = pickInt(rng, 2, 6);
    const dd = pickInt(rng, 1, 12);
    const v = pick(rng, ['n', 'k', 'x']);
    // a(v − b) > −c(v − d)  ⇔  (a + c)v > ab + cd
    const bound = (a * b + c * dd) / (a + c);
    const ans = Math.floor(bound) + 1;
    return {
      stem: `If ${v} is an integer and ${a}(${v} - ${b}) > -${c}(${v} - ${dd}), what is the least possible value of ${v}?`,
      answer: ans,
      steps: [
        S('Phá ngoặc hai vế.', `${a}${v} - ${a * b} > -${c}${v} + ${c * dd}`),
        S('Gom ẩn rồi chia (số dương, giữ chiều).', `${a + c}${v} > ${a * b + c * dd}  →  ${v} > ${formatValueMath(rat(a * b + c * dd, a + c))}`),
        S('Số nguyên nhỏ nhất lớn hơn giá trị đó.', `${v} = ${ans}`),
      ],
    };
  }),

  mcqText('pd-c-ineq-time-budget', 'linear_inequalities', 'medium', (rng) => {
    const d1 = pickInt(rng, 2, 30);
    let d2 = pickInt(rng, 2, 40);
    if (d2 === d1) d2 += 1;
    const T = pick(rng, [1, 2, 3]);
    const [m1, m2] = pick(rng, [
      ['scooter', 'tram'],
      ['bike', 'ferry'],
      ['car', 'subway'],
    ] as const);
    return {
      stem: `To get to work, a commuter travels ${d1} miles by ${m1} and then ${d2} miles by ${m2}. The ${m1} travels at an average speed of x miles per hour and the ${m2} at an average speed of y miles per hour. If the commute never takes more than ${T} hour${T === 1 ? '' : 's'}, which of the following inequalities represents the possible average speeds?`,
      correct: `frac(${d1},x) + frac(${d2},y) <= ${T}`,
      wrong: [
        wt(`frac(${d2},x) + frac(${d1},y) <= ${T}`, 'Ghép nhầm quãng đường với tốc độ.'),
        wt(`frac(x,${d1}) + frac(y,${d2}) <= ${T}`, 'Thời gian là quãng đường CHIA tốc độ, không phải tốc độ chia quãng đường.', 'inverted_fraction'),
        wt(`${d1}x + ${d2}y <= ${T}`, 'Nhân quãng đường với tốc độ không ra thời gian.'),
      ],
      steps: [S('Thời gian mỗi chặng bằng quãng đường chia tốc độ.', `frac(${d1},x),  frac(${d2},y)`), S('Tổng thời gian không quá giới hạn.', `frac(${d1},x) + frac(${d2},y) <= ${T}`)],
    };
  }),

  mcqText('pd-c-ineq-two-rates-split', 'linear_inequalities', 'medium', (rng) => {
    const r1 = 10 * pickInt(rng, 3, 15);
    let r2 = 10 * pickInt(rng, 3, 15);
    if (r2 === r1) r2 += 10;
    const H = pickInt(rng, 6, 16);
    const Nn = 50 * pickInt(rng, 10, 40);
    const ctx = pick(rng, [
      ['cartons of juice', 'bottler'],
      ['circuit boards', 'factory'],
      ['loaves of bread', 'bakery'],
    ] as const);
    return {
      stem: `A distributor hires two ${ctx[1] === 'factory' ? 'factories' : ctx[1] === 'bakery' ? 'bakeries' : `${ctx[1]}s`} to make ${ctx[0]}. The first can make ${r1} per hour and the second can make ${r2} per hour. The distributor needs more than ${money(Nn)} ${ctx[0]} in a total of ${H} hours of contract time, and gives x of those hours to the first and the rest to the second. Which inequality gives all possible values of x?`,
      correct: `${r1}x + ${r2}(${H} - x) > ${Nn}`,
      wrong: [
        wt(`${r2}x + ${r1}(${H} - x) > ${Nn}`, 'Ghép nhầm tốc độ với số giờ: x giờ thuộc về bên thứ nhất.'),
        wt(`${r1}x + ${r2}(x - ${H}) > ${Nn}`, `Số giờ còn lại là ${H} − x, không phải x − ${H}.`, 'sign_flip'),
        wt(`frac(${r1},x) + frac(${r2},${H} - x) > ${Nn}`, 'Sản lượng bằng tốc độ NHÂN thời gian.', 'inverted_fraction'),
      ],
      steps: [S('Bên thứ nhất làm x giờ, bên thứ hai làm phần còn lại.', `${r1}x,  ${r2}(${H} - x)`), S('Tổng sản lượng phải vượt yêu cầu.', `${r1}x + ${r2}(${H} - x) > ${Nn}`)],
    };
  }),

  mcqNum('pd-c-ineq-point-constants', 'linear_inequalities', 'hard', (rng) => {
    const x0 = pickInt(rng, 1, 4);
    const m1 = pickInt(rng, 5, 20);
    const m2 = pickInt(rng, 1, m1 - 1);
    const y0 = pickInt(rng, 10, 60);
    const gap = (m1 - m2) * x0; // b − a > gap
    return {
      stem: `In the system of inequalities y > ${m1}x + a and y < ${cf(m2, 'x')} + b, a and b are constants. If (${x0}, ${y0}) is a solution to the system, which of the following could be the value of b - a?`,
      correct: gap + pickInt(rng, 1, 5),
      wrong: [
        w(gap, 'Bằng đúng biên — cả hai bất phương trình đều nghiêm ngặt nên b − a phải LỚN HƠN số này.', 'off_by_one'),
        ...[2, 4, 7].map((k) => w(gap - k, 'Nhỏ hơn giá trị tối thiểu — trừ hai bất phương trình cùng chiều là sai, phải đổi chiều một cái.', 'forgot_flip_inequality')),
      ],
      steps: [
        S('Thay điểm vào bất phương trình thứ nhất.', `${y0} > ${m1 * x0} + a  →  a < ${y0 - m1 * x0}`),
        S('Thay vào bất phương trình thứ hai.', `${y0} < ${m2 * x0} + b  →  b > ${y0 - m2 * x0}`),
        S('Trừ theo vế.', `b - a > ${y0 - m2 * x0} - ${par(y0 - m1 * x0)} = ${gap}`),
      ],
    };
  }),

  mcqText('pd-c-ineq-system-hours-earnings', 'linear_inequalities', 'hard', (rng) => {
    const [t1, t2] = pick(rng, [
      [20, 45],
      [15, 45],
      [12, 20],
      [30, 40],
      [10, 15],
      [40, 50],
    ] as const);
    const H = pickInt(rng, 10, 40);
    const e1 = 5 * pickInt(rng, 3, 10);
    const e2 = 5 * pickInt(rng, 4, 14);
    const E = 50 * pickInt(rng, 6, 30);
    const f = (t: number, v: string) => {
      const r = rat(t, 60);
      return r.num === 1 ? `frac(${v},${r.den})` : `frac(${r.num}${v},${r.den})`;
    };
    const time = `${f(t1, 'm')} + ${f(t2, 'p')}`;
    const ctx = pick(rng, [
      ['tutor', 'math lesson', 'music lesson'],
      ['stylist', 'haircut', 'coloring'],
      ['mechanic', 'oil change', 'tire rotation'],
    ] as const);
    return {
      stem: `A ${ctx[0]} works no more than ${H} hours each week. Each ${ctx[1]} takes ${t1} minutes and earns $${e1}, and each ${ctx[2]} takes ${t2} minutes and earns $${e2}. The ${ctx[0]} must earn at least $${E} each week. If m is the number of ${ctx[1]}s and p is the number of ${ctx[2]}s, which system describes the working hours and earnings?`,
      correct: `${time} <= ${H} and ${e1}m + ${e2}p >= ${E}`,
      wrong: [
        wt(`${t1}m + ${t2}p <= ${H} and ${e1}m + ${e2}p >= ${E}`, 'Quên đổi phút ra giờ.', 'dropped_unit_conversion'),
        wt(`${time} >= ${E} and ${e1}m + ${e2}p <= ${H}`, 'Đảo hai điều kiện: giờ làm mới bị giới hạn bởi số giờ.'),
        wt(`${f(t2, 'm')} + ${f(t1, 'p')} <= ${H} and ${e1}m + ${e2}p >= ${E}`, 'Ghép nhầm thời gian của hai loại việc.'),
      ],
      steps: [
        S('Đổi phút ra giờ: chia cho 60.', `frac(${t1},60) = ${formatValueMath(rat(t1, 60))},  frac(${t2},60) = ${formatValueMath(rat(t2, 60))}`),
        S('Giờ làm không quá giới hạn, thu nhập ít nhất bằng mức cần.', `${time} <= ${H},  ${e1}m + ${e2}p >= ${E}`),
      ],
    };
  }),

  mcqText('pd-c-ineq-must-be-true-compound', 'linear_inequalities', 'hard', (rng) => {
    const a = pickInt(rng, 2, 5);
    const b = pickInt(rng, 2, 20);
    const kMin = rat(-b, a - 1);
    const pool: Array<{ s: string; t: boolean }> = [
      { s: `x - ${b} <= ${a}k`, t: true },
      { s: `k >= ${formatValueMath(kMin)}`, t: true },
      { s: 'x - k >= 0', t: true },
      { s: `x <= ${a}k`, t: false },
      { s: 'k >= 0', t: false },
      { s: 'x > k', t: false },
      { s: `x - k <= ${b}`, t: false },
    ];
    // Xáo cả kho mệnh đề theo rng rồi lấy ba cái đầu.
    const three = pool
      .map((u) => ({ ...u, r: rng() }))
      .sort((u, v) => u.r - v.r)
      .slice(0, 3);
    const { correct, wrong } = romanChoices(rng, three.map((u) => u.t));
    return {
      stem: `If k <= x <= ${a}k + ${b}, which of the following must be true? I. ${three[0]!.s} II. ${three[1]!.s} III. ${three[2]!.s}`,
      correct,
      wrong,
      steps: [
        S('Tách thành hai bất phương trình: x lớn hơn hoặc bằng k, và x nhỏ hơn hoặc bằng biểu thức bên phải.'),
        S('Từ k nhỏ hơn hoặc bằng vế phải suy ra điều kiện của k.', `k <= ${a}k + ${b}  →  k >= ${formatValueMath(kMin)}`),
        S('Mệnh đề nào có phản ví dụ thì không "luôn đúng".'),
      ],
    };
  }),

  grid('pd-c-ineq-compound-grid', 'linear_inequalities', 'hard', (rng) => {
    const a = pick(rng, [2, 3, 4]);
    const b = pickInt(rng, 1, 9);
    const c = pickInt(rng, 1, 5);
    const v = pickInt(rng, -4, 6);
    const [f1n, f1d] = pick(rng, [
      [1, 3],
      [1, 2],
      [2, 3],
      [1, 4],
    ] as const);
    const [f2n, f2d] = pick(rng, [
      [1, 3],
      [1, 2],
      [3, 4],
      [1, 4],
    ] as const);
    // x − c ∈ (v − f1, v + f2)  ⇒  −ax + b ∈ (−a(c + v + f2) + b, −a(c + v − f1) + b)
    const lo = rat(-a * ((c + v) * f2d + f2n) + b * f2d, f2d);
    const hi = rat(-a * ((c + v) * f1d - f1n) + b * f1d, f1d);
    return {
      stem: `If ${formatValueMath(lo)} < -${a}x + ${b} < ${formatValueMath(hi)} and x - ${c} is an integer, what is the value of x - ${c}?`,
      answer: v,
      steps: [
        S(`Trừ ${b} ở cả ba vế rồi chia cho −${a} — nhớ đổi chiều.`),
        S(`Trừ ${c} để có khoảng của x − ${c}; khoảng này chỉ chứa một số nguyên.`, `${formatValueMath(rat((v * f1d - f1n), f1d))} < x - ${c} < ${formatValueMath(rat(v * f2d + f2n, f2d))}`),
        S('Số nguyên đó là đáp án.', `x - ${c} = ${v}`),
      ],
    };
  }),

  mcqText('pd-c-ineq-area-perimeter-system', 'linear_inequalities', 'medium', (rng) => {
    const A = 50 * pickInt(rng, 2, 20);
    const P = 10 * pickInt(rng, 3, 20);
    const thing = pick(rng, ['patio', 'dog run', 'play area', 'parking pad']);
    return {
      stem: `A rectangular ${thing} must have an area of at least ${A} square meters and a perimeter of at least ${P} meters. If the length is x meters and the width is y meters, which system of inequalities represents these requirements?`,
      correct: `xy >= ${A} and x + y >= ${P / 2}`,
      wrong: [
        wt(`xy >= ${A} and x + y >= ${P}`, 'Chu vi là 2(x + y), nên x + y chỉ cần ít nhất một nửa chu vi.'),
        wt(`xy >= ${P} and x + y >= ${A}`, 'Đảo diện tích và chu vi.', 'confused_area_perimeter'),
        wt(`xy >= ${A / 2} and x + y >= ${P / 2}`, 'Chia đôi cả diện tích — diện tích chữ nhật là xy, không có hệ số 2.'),
      ],
      steps: [S('Diện tích là xy.', `xy >= ${A}`), S('Chu vi là 2(x + y); chia hai vế cho 2.', `2(x + y) >= ${P}  →  x + y >= ${P / 2}`)],
    };
  }),

  mcqText('pd-c-ineq-must-be-true-ab', 'linear_inequalities', 'medium', (rng) => {
    const k = pickInt(rng, 2, 9);
    const c = pickInt(rng, 1, 20);
    const pool: Array<{ s: string; t: boolean }> = [
      { s: `${k}a < ${k}b`, t: true },
      { s: '-b < -a', t: true },
      { s: 'a - b < 0', t: true },
      { s: `a + ${c} < b + ${c}`, t: true },
      { s: `-${k}a > -${k}b`, t: true },
      { s: 'a^2 < b^2', t: false },
      { s: 'frac(1,a) > frac(1,b)', t: false },
      { s: '-a < -b', t: false },
      { s: 'ab > 0', t: false },
      { s: `a < ${k}b`, t: false },
    ];
    const three = pool
      .map((u) => ({ ...u, r: rng() }))
      .sort((u, v) => u.r - v.r)
      .slice(0, 3);
    const { correct, wrong } = romanChoices(rng, three.map((u) => u.t));
    return {
      stem: `If a < b, which of the following must be true? I. ${three[0]!.s} II. ${three[1]!.s} III. ${three[2]!.s}`,
      correct,
      wrong,
      steps: [
        S('Cộng/trừ cùng một số hoặc nhân với số dương: giữ chiều. Nhân với số âm: đổi chiều.'),
        S('Bình phương, nghịch đảo hay nhân hai vế với nhau thì phụ thuộc dấu — thử a âm, b dương để tìm phản ví dụ.'),
      ],
    };
  }),
];

// ============================================================ Chương 11: bài toán có lời văn

const ch11: MathTemplate[] = [
  mcqText('pd-c-translate-expression', 'equivalent_expressions', 'easy', (rng) => {
    const k = pickInt(rng, 2, 12);
    const [x, y] = pick(rng, LETTER_PAIRS);
    const kind = pickInt(rng, 0, 4);
    const T: Array<{ phrase: string; correct: string; wrong: TCand[] }> = [
      {
        phrase: `the result of subtracting ${k} times the product of ${x} and ${y} from the square of their sum`,
        correct: `(${x} + ${y})^2 - ${k}${x}${y}`,
        wrong: [
          wt(`${x}^2 + ${y}^2 - ${k}${x}${y}`, 'Bình phương của TỔNG khác tổng các bình phương.', 'expanded_without_middle_term'),
          wt(`${x}^2${y}^2 - ${k}${x}${y}`, 'Đây là bình phương của tích, không phải của tổng.'),
          wt(`(${x} + ${y})^2 - ${k}(${x} + ${y})`, 'Tích của hai số là nhân, không phải cộng.'),
        ],
      },
      {
        phrase: `${k} less than the product of ${x} and the square of ${y}`,
        correct: `${x}${y}^2 - ${k}`,
        wrong: [
          wt(`${k} - ${x}${y}^2`, `"${k} less than A" là A trừ ${k}, không phải ${k} trừ A.`, 'sign_flip'),
          wt(`(${x}${y})^2 - ${k}`, `Chỉ ${y} được bình phương, không phải cả tích.`),
          wt(`${x} + ${y}^2 - ${k}`, 'Tích là phép nhân, không phải phép cộng.'),
        ],
      },
      {
        phrase: `the square of the difference of ${x} and ${y}, divided by ${k} more than their sum`,
        correct: `frac((${x} - ${y})^2,${x} + ${y} + ${k})`,
        wrong: [
          wt(`frac(${x}^2 - ${y}^2,${x} + ${y} + ${k})`, 'Bình phương của HIỆU khác hiệu các bình phương.'),
          wt(`frac((${x} - ${y})^2,${k}(${x} + ${y}))`, `"${k} more than" là cộng ${k}, không phải nhân ${k}.`),
          wt(`frac((${x} + ${y})^2,${x} - ${y} + ${k})`, 'Đảo vị trí tổng và hiệu.'),
        ],
      },
      {
        phrase: `${k} times the sum of ${x} and the square of ${y}`,
        correct: `${k}(${x} + ${y}^2)`,
        wrong: [
          wt(`${k}${x} + ${y}^2`, `${k} nhân cả tổng, phải có ngoặc.`, 'forgot_distribute'),
          wt(`${k}(${x} + ${y})^2`, `Chỉ ${y} được bình phương, không phải cả tổng.`),
          wt(`(${k}${x} + ${y})^2`, 'Bình phương sai chỗ.'),
        ],
      },
      {
        phrase: `the sum of the squares of ${x} and ${y}, increased by ${k} times their product`,
        correct: `${x}^2 + ${y}^2 + ${k}${x}${y}`,
        wrong: [
          wt(`(${x} + ${y})^2 + ${k}${x}${y}`, 'Tổng các bình phương khác bình phương của tổng.', 'expanded_without_middle_term'),
          wt(`${x}^2 + ${y}^2 + ${k}(${x} + ${y})`, 'Tích là nhân, không phải cộng.'),
          wt(`${k}(${x}^2 + ${y}^2)${x}${y}`, `"Increased by" là cộng thêm, không phải nhân.`),
        ],
      },
    ];
    const t = T[kind]!;
    return {
      stem: `Which of the following represents ${t.phrase}?`,
      correct: t.correct,
      wrong: t.wrong,
      steps: [S('Dịch từng cụm theo đúng thứ tự: "square of the sum" là bình phương của cả tổng, "product" là tích, "less than" đảo thứ tự phép trừ.'), S('Ghép lại.', t.correct)],
    };
  }),

  grid('pd-c-number-line-distance', 'linear_equations_one_var', 'easy', (rng) => {
    const k = pickInt(rng, 2, 6);
    const a = pickInt(rng, 0, 30);
    const u = pickInt(rng, 2, 12);
    const X = a + u;
    const b = X + k * u;
    const word = k === 2 ? 'twice' : `${k} times`;
    const ctx = pick(rng, ['a hiking trail marked in kilometers', 'a number line', 'a tape measure marked in inches', 'a bike path marked in miles']);
    return {
      stem: `On ${ctx}, marks are drawn at ${a}, X, and ${b}, where ${a} < X < ${b}. The distance between the marks at X and ${b} is ${word} the distance between the marks at ${a} and X. What is the value of X?`,
      answer: X,
      steps: [
        S('Viết hai khoảng cách theo X.', `${b} - X = ${k}(X - ${a})`),
        S('Giải.', `${b + k * a} = ${k + 1}X  →  X = ${X}`),
      ],
    };
  }),

  grid('pd-c-translate-sqrt', 'nonlinear_equations', 'easy', (rng) => {
    const r = pickInt(rng, 2, 20);
    const a = pickInt(rng, 1, 15);
    const c = pickNonZeroInt(rng, -9, 15);
    const add = pick(rng, [true, false]);
    const res = add ? r + a : r - a;
    return {
      stem: add
        ? `If ${a} is added to the square root of x, the result is ${res}. What is the value of x${signedTerm(c)}?`
        : `If ${a} is subtracted from the square root of x, the result is ${res}. What is the value of x${signedTerm(c)}?`,
      answer: r * r + c,
      steps: [
        S('Dịch câu thành phương trình.', add ? `sqrt(x) + ${a} = ${res}` : `sqrt(x) - ${a} = ${res}`),
        S('Cô lập căn rồi bình phương.', `sqrt(x) = ${r}  →  x = ${r * r}`),
        S('Tính biểu thức.', `${r * r}${signedTerm(c)} = ${r * r + c}`),
      ],
    };
  }),

  grid('pd-c-two-pack-combos', 'linear_equations_two_var', 'medium', (rng) => {
    const [p, q] = pick(rng, [
      [4, 9],
      [3, 8],
      [5, 12],
      [6, 9],
      [4, 6],
      [5, 8],
      [3, 7],
    ] as const);
    const x0 = pickInt(rng, 1, 8);
    const y0 = pickInt(rng, 1, 8);
    const T = p * x0 + q * y0;
    let best = 0;
    for (let x = 1; p * x < T; x += 1) if ((T - p * x) % q === 0) best = x;
    const item = pick(rng, ['golf balls', 'eggs', 'candles', 'markers']);
    return {
      stem: `A store sells ${item} in packs of ${p} or ${q}. A customer buys x packs of ${p} and y packs of ${q}, where x >= 1 and y >= 1, for a total of ${T} ${item}. What is the greatest possible value of x?`,
      answer: best,
      steps: [
        S('Lập phương trình.', `${p}x + ${q}y = ${T}`),
        S(`Thử các giá trị x từ lớn xuống: cần phần còn lại chia hết cho ${q} và y ít nhất 1.`, `${p} · ${best} + ${q} · ${(T - p * best) / q} = ${T}`),
      ],
    };
  }),

  mcqText('pd-c-cost-annual-model', 'linear_equations_two_var', 'easy', (rng) => {
    const F = 100 * pickInt(rng, 5, 60);
    const Sal = 100 * pickInt(rng, 15, 50);
    return {
      stem: `A shop has fixed costs of $${money(F)} each month and pays each employee $${money(Sal)} each month. If the shop employs x people for an entire year, which equation gives the shop's total cost c, in dollars, for the year?`,
      correct: `c = 12(${F} + ${Sal}x)`,
      wrong: [
        wt(`c = ${F} + ${Sal}x`, 'Đây là chi phí một tháng; cả năm có 12 tháng.', 'stopped_too_early'),
        wt(`c = 12(${F}) + ${Sal}x`, 'Lương cũng trả mỗi tháng, phải nhân 12.', 'forgot_distribute'),
        wt(`c = ${F} + 12(${Sal}x)`, 'Chi phí cố định cũng tính mỗi tháng, phải nhân 12.', 'forgot_distribute'),
      ],
      steps: [S('Chi phí một tháng.', `${F} + ${Sal}x`), S('Nhân 12 tháng.', `c = 12(${F} + ${Sal}x)`)],
    };
  }),

  mcqNum('pd-c-integer-weights-cost', 'linear_equations_two_var', 'medium', (rng) => {
    const a2 = pick(rng, [5, 7, 9, 11]); // tổng giá hai miếng mỗi pound = 2 × a
    const b = pick(rng, [2, 3, 4, 6, 8].filter((t) => gcd(t, a2) === 1));
    const x0 = pickInt(rng, 1, 6);
    const y0 = pickInt(rng, 1, 9);
    const T = a2 * x0 + b * y0;
    const valid = (y: number) => y > 0 && (T - b * y) > 0 && (T - b * y) % a2 === 0;
    const cands = [y0 + 1, y0 + 2, y0 - 1, y0 + 3, y0 + 4, y0 - 2].filter((y) => y > 0 && !valid(y));
    const [fish1, fish2] = pick(rng, [
      ['walnuts', 'almonds'],
      ['beef', 'chicken'],
      ['cheddar', 'brie'],
    ] as const);
    return {
      stem: `A shopper buys 2 bags of ${fish1}, each weighing x pounds, and 1 bag of ${fish2} weighing y pounds, where x and y are integers. The ${fish1} costs $${money(a2 / 2)} per pound and the ${fish2} costs $${b} per pound. If the total cost is $${T}, which of the following could be the value of y?`,
      correct: y0,
      wrong: cands.map((y) => w(y, `Với y = ${y}, phần tiền còn lại không chia hết thành 2 miếng có trọng lượng nguyên.`)),
      steps: [
        S('Lập phương trình tổng tiền.', `2(${num(a2 / 2)})x + ${b}y = ${T}  →  ${a2}x + ${b}y = ${T}`),
        S('Thử từng lựa chọn: x phải là số nguyên dương.', `${a2}x = ${T} - ${b} · ${y0} = ${T - b * y0}  →  x = ${x0}`),
      ],
    };
  }),

  grid('pd-c-percent-equal', 'percentages', 'easy', (rng) => {
    const p = pick(rng, [15, 20, 25, 30, 40, 45, 60, 75, 80]);
    const q = pick(rng, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 85].filter((t) => t !== p));
    const n = pickInt(rng, 1, 40) * (p / gcd(p, q));
    const A = (q * n) / p;
    return {
      stem: `If ${p}% of ${A} is the same as ${q}% of n, what is the value of n?`,
      answer: n,
      steps: [S('Dịch thành phương trình.', `${num(p / 100)} × ${A} = ${num(q / 100)}n`), S('Giải.', `n = frac(${num((p * A) / 100)},${num(q / 100)}) = ${n}`)],
    };
  }),

  grid('pd-c-win-half', 'linear_equations_one_var', 'medium', (rng) => {
    const [rn, rd, word] = pick(rng, [
      [1, 2, 'exactly half'],
      [2, 3, 'exactly two-thirds'],
      [3, 4, 'exactly three-fourths'],
      [3, 5, 'exactly 60%'],
    ] as const);
    // g = rd·u trận đầu, thắng w = rn·u − (rd − rn)·v, rồi thắng thêm N = rd·v trận liền.
    const v = pickInt(rng, 1, 5);
    const u = Math.floor(((rd - rn) * v) / rn) + 1 + pickInt(rng, 0, 6);
    const g = rd * u;
    const Nn = rd * v;
    const w0 = rn * u - (rd - rn) * v;
    const team = pick(rng, ['The Hawks', 'The Comets', 'A robotics team', 'A volleyball team']);
    return {
      stem: `${team} won exactly ${w0} of the first ${g} games of the season. They then played N more games and won all of them. If they won ${word} of all the games they played, what is the value of N?`,
      answer: Nn,
      steps: [
        S('Số trận thắng chia tổng số trận bằng tỉ lệ đề cho.', `frac(${w0} + N,${g} + N) = ${fr(rn, rd)}`),
        S('Nhân chéo rồi giải.', `${rd}(${w0} + N) = ${rn}(${g} + N)  →  N = ${Nn}`),
      ],
    };
  }),

  grid('pd-c-equal-start-transfer', 'linear_equations_one_var', 'medium', (rng) => {
    const k = pickInt(rng, 2, 5);
    const t = (k - 1) * pickInt(rng, 2, 12);
    const s0 = (t * (k + 1)) / (k - 1);
    const [A, B, item] = pick(rng, [
      ['Alma', 'June', 'seed packets'],
      ['Omar', 'Pita', 'stickers'],
      ['Ines', 'Kai', 'marbles'],
    ] as const);
    const word = k === 2 ? 'twice as many' : `${k} times as many`;
    return {
      stem: `${A} and ${B} start with the same number of ${item}. After ${A} gives ${t} of her ${item} to ${B}, ${B} has ${word} ${item} as ${A}. How many ${item} did ${A} have at the start?`,
      answer: s0,
      steps: [
        S('Gọi s là số ban đầu của mỗi người.', `s + ${t} = ${k}(s - ${t})`),
        S('Giải.', `${k * t + t} = ${k - 1 === 1 ? '' : k - 1}s  →  s = ${s0}`),
      ],
    };
  }),

  mcqNum('pd-c-fractions-rest', 'linear_equations_one_var', 'medium', (rng) => {
    const [a, b, c] = pick(rng, [
      [4, 6, 8],
      [3, 4, 6],
      [2, 5, 10],
      [3, 5, 15],
      [4, 5, 10],
      [6, 8, 12],
    ] as const);
    const lcm = ([a, b, c] as number[]).reduce((x, y) => (x * y) / gcd(x, y));
    const total = lcm * pickInt(rng, 1, 12);
    const rest = total - total / a - total / b - total / c;
    const ctx = pick(rng, [
      ['a learning center', 'students', 'take debate', 'take writing', 'take science', 'take math'],
      ['a sports club', 'members', 'play soccer', 'play tennis', 'swim', 'run track'],
      ['an orchard', 'trees', 'are apple trees', 'are pear trees', 'are plum trees', 'are cherry trees'],
    ] as const);
    const dist = (x: number) => w(x, 'Nhầm khi cộng các phân số — quy đồng rồi lấy 1 trừ tổng.');
    return {
      stem: `At ${ctx[0]}, frac(1,${a}) of the ${ctx[1]} ${ctx[2]}, frac(1,${b}) ${ctx[3]}, and frac(1,${c}) ${ctx[4]}. The remaining ${rest} ${ctx[1]} ${ctx[5]}. What is the total number of ${ctx[1]}?`,
      correct: total,
      wrong: [dist(total + lcm), dist(total + 2 * lcm), w(rest * 2, 'Coi phần còn lại là một nửa.'), dist(total + 3 * lcm)],
      steps: [
        S('Phần còn lại chiếm bao nhiêu phần tổng.', `1 - frac(1,${a}) - frac(1,${b}) - frac(1,${c}) = ${fr(rest, total)}`),
        S('Chia số còn lại cho phân số đó.', `${rest} ÷ ${fr(rest, total)} = ${total}`),
      ],
    };
  }),

  mcqNum('pd-c-trade-equalize', 'linear_equations_one_var', 'medium', (rng) => {
    const m = pickInt(rng, 2, 4);
    const t = pickInt(rng, 3, 15);
    const p = pickInt(rng, 5, 40);
    const q = p + 2 * (m - 1) * t;
    const [A, B] = pick(rng, [
      ['Tariq', 'Wen'],
      ['Mia', 'Noor'],
      ['Leo', 'Ravi'],
    ] as const);
    return {
      stem: `${A} has ${p} stickers and ${B} has ${q} stickers. In each swap, ${B} gives ${A} ${m} stickers and ${A} gives ${B} 1 sticker. After how many swaps will they have the same number of stickers?`,
      correct: t,
      wrong: [
        w(rat(q - p, 2 * m), `Mỗi lần ${A} được ${m} nhưng cũng mất 1, nên chỉ tăng ${m - 1}.`),
        w(rat(q - p, m - 1), 'Khoảng cách thu hẹp từ CẢ hai phía — mỗi lần thu hẹp gấp đôi.'),
        w(rat(q - p, 2), 'Coi mỗi lần trao đổi chỉ thu hẹp 2 thẻ.'),
      ],
      steps: [
        S(`Sau t lần, ${A} có ${p} + ${m - 1}t, ${B} có ${q} − ${m - 1}t.`, `${p} + ${cf(m - 1, 't')} = ${q} - ${cf(m - 1, 't')}`),
        S('Giải.', `${cf(2 * (m - 1), 't')} = ${q - p}  →  t = ${t}`),
      ],
    };
  }),

  mcqNum('pd-c-translate-solve-expr', 'linear_equations_one_var', 'easy', (rng) => {
    const b = pickInt(rng, 2, 6);
    const e = pick(rng, [2, 3, 4]);
    const x0 = e * pickInt(rng, 1, 10);
    const a = pickInt(rng, 1, 15);
    const c = b * x0 - a;
    const dd = pickInt(rng, 1, 20);
    const ew = e === 2 ? 'half' : e === 3 ? 'one-third' : 'one-fourth';
    return {
      stem: `If ${a} is subtracted from ${b} times the number x, the result is ${c}. What is the result when ${dd} is added to ${ew} of x?`,
      correct: dd + x0 / e,
      wrong: [w(x0, 'Đây mới là x.', 'stopped_too_early'), w(dd + x0 * e, `Nhân ${e} thay vì chia.`, 'inverted_fraction'), w(dd + (c - a) / b / e, 'Chuyển vế sai dấu.', 'sign_flip')],
      steps: [S('Dịch thành phương trình và giải.', `${b}x - ${a} = ${c}  →  x = ${x0}`), S('Tính biểu thức.', `${dd} + frac(${x0},${e}) = ${dd + x0 / e}`)],
    };
  }),

  grid('pd-c-price-relation-grid', 'linear_equations_one_var', 'easy', (rng) => {
    const m = pickInt(rng, 2, 4);
    const Sh = pickInt(rng, 10, 60);
    const k = pickInt(rng, 1, Sh * m - 5);
    const T = m * Sh - k;
    const [a, b] = pick(rng, [
      ['tie', 'shirt'],
      ['phone case', 'screen protector'],
      ['lamp', 'light bulb'],
    ] as const);
    const word = m === 2 ? 'twice' : `${m} times`;
    return {
      stem: `At a store, the price of a ${a} is k dollars less than ${word} the price of a ${b}. If a ${b} costs $${Sh} and a ${a} costs $${T}, what is the value of k?`,
      answer: k,
      steps: [S('Dịch câu thành phương trình.', `${T} = ${m}(${Sh}) - k`), S('Giải.', `k = ${m * Sh} - ${T} = ${k}`)],
    };
  }),

  mcqNum('pd-c-coupon-ratio-total', 'linear_equations_one_var', 'medium', (rng) => {
    const [v1, v2, v3] = pick(rng, [
      [2, 4, 10],
      [2, 5, 10],
      [1, 2, 5],
      [5, 10, 20],
    ] as const);
    const r1 = pickInt(rng, 2, 4);
    const r2 = pickInt(rng, 2, 4);
    const t = pickInt(rng, 2, 12);
    const n2 = r2 * t;
    const total = v1 * r1 * n2 + v2 * n2 + v3 * t;
    return {
      stem: `A museum handed out gift cards worth $${v1}, $${v2}, or $${v3}. There were ${r1} times as many $${v1} cards as $${v2} cards, and ${r2} times as many $${v2} cards as $${v3} cards. The total value of all the cards was $${money(total)}. How many $${v2} cards were handed out?`,
      correct: n2,
      wrong: [w(t, `Đây là số thẻ $${v3}.`, 'solved_for_wrong_var'), w(r1 * n2, `Đây là số thẻ $${v1}.`, 'solved_for_wrong_var'), w(Math.round(total / (v1 + v2 + v3)), 'Coi số thẻ mỗi loại bằng nhau.')],
      steps: [
        S(`Gọi t là số phiếu $${v3}.`, `$${v2}: ${r2}t,  $${v1}: ${r1 * r2}t`),
        S('Tổng giá trị.', `${v1 * r1 * r2}t + ${v2 * r2}t + ${v3}t = ${total}  →  t = ${t}`),
        S(`Số phiếu $${v2}.`, `${r2} × ${t} = ${n2}`),
      ],
    };
  }),

  mcqNum('pd-c-chain-ratio', 'linear_equations_one_var', 'easy', (rng) => {
    const h = pickInt(rng, 2, 4);
    const k = pickInt(rng, 2, 5);
    const B = pickInt(rng, 3, 25);
    const S0 = (k + 1) * B;
    const [A, Bn, C] = pick(rng, [
      ['Rosa', 'Sven', 'Tomo'],
      ['Dara', 'Eli', 'Fay'],
      ['Gus', 'Hana', 'Ivo'],
    ] as const);
    const frac1 = h === 2 ? 'half' : h === 3 ? 'one-third' : 'one-fourth';
    return {
      stem: `${A}, ${Bn}, and ${C} collect postage stamps. ${Bn} has ${frac1} as many stamps as ${C}. ${A} has ${k} times as many stamps as ${Bn}. If ${A} and ${Bn} together have ${S0} stamps, how many stamps does ${C} have?`,
      correct: h * B,
      wrong: [w(B, `Đây là số của ${Bn}.`, 'solved_for_wrong_var'), w(k * B, `Đây là số của ${A}.`, 'solved_for_wrong_var'), w(rat(B, h), `${Bn} bằng một phần ${h} của ${C}, nên ${C} gấp ${h} lần ${Bn}, không phải ngược lại.`, 'inverted_fraction')],
      steps: [
        S(`Gọi b là số của ${Bn}.`, `${k}b + b = ${S0}  →  b = ${B}`),
        S(`${C} gấp ${h} lần ${Bn}.`, `${h} × ${B} = ${h * B}`),
      ],
    };
  }),
];

// ============================================================ Chương 12: đường thẳng

/** y = mx + b với m hữu tỉ, in gọn: "y = -frac(2,3)x + 4", "y = 2x", "y = -x - 1". */
function lineEq(m: MathValue, b: number, v = 'y'): string {
  const mm = m.num / m.den;
  let slope: string;
  if (mm === 0) slope = '';
  else if (m.den === 1) slope = coefTerm(m.num, 'x');
  else slope = `${m.num < 0 ? '-' : ''}frac(${Math.abs(m.num)},${m.den})x`;
  if (slope === '') return `${v} = ${b}`;
  return `${v} = ${slope}${signedTerm(b)}`;
}

const ch12: MathTemplate[] = [
  mcqText('pd-c-vertical-horizontal-line', 'linear_equations_two_var', 'easy', (rng) => {
    if (pick(rng, [true, false])) {
      const k = pickInt(rng, 1, 20);
      const vertical = pick(rng, [true, false]);
      const pos = pick(rng, [true, false]);
      const val = pos ? k : -k;
      const v = vertical ? 'x' : 'y';
      const u = vertical ? 'y' : 'x';
      return {
        stem: vertical
          ? `What is an equation of the line that is parallel to the y-axis and ${k} units to the ${pos ? 'right' : 'left'} of it?`
          : `What is an equation of the line that is parallel to the x-axis and ${k} units ${pos ? 'above' : 'below'} it?`,
        correct: `${v} = ${val}`,
        wrong: [
          wt(`${v} = ${-val}`, pos ? 'Sai phía: bên phải/phía trên là dương.' : 'Sai phía: bên trái/phía dưới là âm.', 'sign_flip'),
          wt(`${u} = ${val}`, `Đường song song với trục ${vertical ? 'y là đường dọc, có dạng x = hằng số' : 'x là đường ngang, có dạng y = hằng số'}.`),
          wt(`${u} = ${-val}`, 'Vừa sai trục vừa sai phía.'),
        ],
        steps: [S(vertical ? 'Đường song song trục y là đường dọc: mọi điểm cùng hoành độ.' : 'Đường song song trục x là đường ngang: mọi điểm cùng tung độ.', `${v} = ${val}`)],
      };
    }
    const a = pickNonZeroInt(rng, -12, 12);
    let b = pickNonZeroInt(rng, -12, 12);
    if (b === a) b = -a;
    const vertical = pick(rng, [true, false]);
    return {
      stem: `What is an equation of the ${vertical ? 'vertical' : 'horizontal'} line that passes through the point (${a}, ${b})?`,
      correct: vertical ? `x = ${a}` : `y = ${b}`,
      wrong: [
        wt(vertical ? `y = ${b}` : `x = ${a}`, vertical ? 'Đây là đường ngang qua điểm đó.' : 'Đây là đường dọc qua điểm đó.'),
        wt(vertical ? `x = ${b}` : `y = ${a}`, 'Lấy nhầm toạ độ.'),
        wt(vertical ? `y = ${a}` : `x = ${b}`, 'Vừa nhầm loại đường vừa nhầm toạ độ.'),
      ],
      steps: [S(vertical ? 'Đường dọc: mọi điểm có cùng hoành độ với điểm đã cho.' : 'Đường ngang: mọi điểm có cùng tung độ với điểm đã cho.', vertical ? `x = ${a}` : `y = ${b}`)],
    };
  }),

  mcqNum('pd-c-slope-unknown-coord', 'linear_equations_two_var', 'easy', (rng) => {
    const [mn, md] = pick(rng, [
      [1, 3],
      [2, 3],
      [1, 2],
      [3, 4],
      [-1, 2],
      [-2, 5],
      [3, 2],
      [-3, 4],
    ] as const);
    const x1 = pickInt(rng, -6, 6);
    const y1 = pickInt(rng, -6, 6);
    const t = pickNonZeroInt(rng, -3, 3);
    const x2 = x1 + md * t;
    const y2 = y1 + mn * t;
    const slope = fr(mn, md);
    if (pick(rng, [true, false])) {
      return {
        stem: `A line with a slope of ${slope} passes through the points (${x1}, ${y1}) and (${x2}, n). What is the value of n?`,
        correct: y2,
        wrong: [
          w(rat(y1 * mn + md * md * t, mn), 'Lật ngược hệ số góc (Δx chia Δy).', 'swapped_rise_run'),
          w(y1 - mn * t, 'Sai dấu của độ tăng.', 'sign_flip'),
          w(mn * t, 'Quên cộng tung độ ban đầu.', 'stopped_too_early'),
          w(y2 + mn, 'Đếm thừa một bước.', 'off_by_one'),
        ],
        steps: [
          S('Hệ số góc bằng Δy chia Δx.', `frac(n - ${par(y1)},${x2} - ${par(x1)}) = ${slope}`),
          S('Nhân chéo và giải.', `n = ${y2}`),
        ],
      };
    }
    return {
      stem: `A line with a slope of ${slope} passes through the points (${x1}, ${y1}) and (x, ${y2}). What is the value of x?`,
      correct: x2,
      wrong: [
        w(rat(x1 * md + mn * mn * t, md), 'Nhân với hệ số góc thay vì chia (lật ngược Δy chia Δx).', 'swapped_rise_run'),
        w(x1 - md * t, 'Sai dấu.', 'sign_flip'),
        w(md * t, 'Quên cộng hoành độ ban đầu.', 'stopped_too_early'),
        w(x2 + md, 'Đếm thừa một bước.', 'off_by_one'),
      ],
      steps: [
        S('Hệ số góc bằng Δy chia Δx.', `frac(${y2} - ${par(y1)},x - ${par(x1)}) = ${slope}`),
        S('Nhân chéo và giải.', `x = ${x2}`),
      ],
    };
  }),

  mcqText('pd-c-point-on-line', 'linear_equations_two_var', 'medium', (rng) => {
    const dx = pickInt(rng, 1, 5);
    const dy = pickNonZeroInt(rng, -5, 5);
    const x1 = pickInt(rng, -6, 4);
    const y1 = pickInt(rng, -6, 8);
    const k = pickInt(rng, 2, 3);
    const P = [x1 + dx * k, y1 + dy * k] as const;
    const bad1 = [x1 + dy, y1 + dx] as const;
    const bad2 = [x1 + dx * k, y1 - dy * k] as const;
    const bad3 = [x1 + dx * k, y1 + dy * k + 1] as const;
    const bad4 = [x1 - dx, y1 + dy] as const;
    const on = (p: readonly [number, number]) => (p[1] - y1) * dx === dy * (p[0] - x1);
    const cands = [
      wt(pair(bad1[0], bad1[1]), 'Dùng nghịch đảo của hệ số góc khi bước từ điểm này sang điểm kia.', 'swapped_rise_run'),
      wt(pair(bad2[0], bad2[1]), 'Bước sai chiều theo trục y.', 'sign_flip'),
      wt(pair(bad3[0], bad3[1]), 'Lệch một đơn vị theo trục y.', 'off_by_one'),
      wt(pair(bad4[0], bad4[1]), 'Lùi sang trái nhưng vẫn cộng độ tăng — sang trái thì y đổi ngược.', 'sign_flip'),
    ].filter((c) => {
      const mm = c.display.match(/^\((-?\d+), (-?\d+)\)$/)!;
      return !on([Number(mm[1]), Number(mm[2])]);
    });
    return {
      stem: `In the xy-plane, the points (${x1}, ${y1}) and (${x1 + dx}, ${y1 + dy}) lie on line l. Which of the following points also lies on line l?`,
      correct: pair(P[0], P[1]),
      wrong: cands,
      steps: [
        S('Hệ số góc.', `frac(${dy},${dx})`),
        S(`Từ điểm đầu, đi sang phải ${dx * k} đơn vị thì y thay đổi ${dy * k}.`, pair(P[0], P[1])),
      ],
    };
  }),

  mcqText('pd-c-parallel-from-intercepts', 'linear_equations_two_var', 'medium', (rng) => {
    const a = pickNonZeroInt(rng, -6, 6);
    const b = pickNonZeroInt(rng, -8, 8);
    const m = rat(-b, a);
    let c = pickInt(rng, -9, 9);
    if (c === b) c += 1;
    return {
      stem: `Line l crosses the x-axis at (${a}, 0) and the y-axis at (0, ${b}). Which of the following is an equation of a line that is parallel to line l?`,
      correct: lineEq(m, c),
      wrong: [
        wt(lineEq(rat(b, a), c), 'Sai dấu hệ số góc: tính Δy chia Δx từ hai giao điểm.', 'sign_flip'),
        wt(lineEq(rat(-a, b), c), 'Lấy Δx chia Δy.', 'swapped_rise_run'),
        wt(lineEq(rat(a, b), c), 'Đây là hệ số góc của đường VUÔNG GÓC.'),
        wt(lineEq(m, b), 'Đây chính là đường l — đường song song phải là một đường KHÁC, cùng hệ số góc nhưng khác tung độ gốc.'),
        wt(lineEq(rat(-2 * b, a), c), 'Nhân đôi hệ số góc.'),
      ],
      steps: [
        S('Hệ số góc của l qua hai giao điểm.', `frac(${b} - 0,0 - ${par(a)}) = ${formatValueMath(m)}`),
        S('Đường song song có cùng hệ số góc (tung độ gốc tuỳ ý).', lineEq(m, c)),
      ],
    };
  }),

  mcqNum('pd-c-lines-intersect-params', 'systems_linear_two_var', 'medium', (rng) => {
    const p = pickInt(rng, 1, 5);
    const b = p * pickNonZeroInt(rng, -9, 9);
    const q = -b * p;
    const a = (q - b) / p;
    const askA = pick(rng, [true, false]);
    return {
      stem: `In the xy-plane, the lines y = ax + b and y = -bx intersect at the point (${p}, ${q}), where a and b are constants. What is the value of ${askA ? 'a' : 'b'}?`,
      correct: askA ? a : b,
      wrong: askA
        ? [w(b, 'Đây là b.', 'solved_for_wrong_var'), w((q + b) / p, 'Sai dấu của b khi thế vào.', 'sign_flip'), w(rat(q, p), 'Bỏ qua b khi tính a.')]
        : [w(-b, 'Quên dấu trừ trong y = −bx.', 'sign_flip'), w(a, 'Đây là a.', 'solved_for_wrong_var'), w(rat(p, q), 'Lật ngược phép chia.', 'inverted_fraction')],
      steps: [
        S('Thay điểm vào phương trình thứ hai.', `${q} = -b(${p})  →  b = ${b}`),
        S('Thay vào phương trình thứ nhất.', `${q} = ${p}a + ${par(b)}  →  a = ${a}`),
      ],
    };
  }),

  mcqNum('pd-c-slope-from-intercepts', 'linear_equations_two_var', 'easy', (rng) => {
    const a = pickNonZeroInt(rng, -9, 9);
    const b = pickNonZeroInt(rng, -9, 9);
    return {
      stem: `Line m passes through the points (0, ${b}) and (${a}, 0). What is the slope of line m?`,
      correct: rat(-b, a),
      wrong: [
        w(rat(b, a), 'Sai dấu: y giảm từ b về 0 khi x tăng từ 0 tới a (hoặc ngược lại).', 'sign_flip'),
        w(rat(-a, b), 'Lấy Δx chia Δy.', 'swapped_rise_run'),
        w(rat(a, b), 'Vừa lật vừa sai dấu.'),
      ],
      steps: [S('Hệ số góc bằng Δy chia Δx.', `frac(0 - ${par(b)},${a} - 0) = ${formatValueMath(rat(-b, a))}`)],
    };
  }),

  mcqText('pd-c-sign-slope-intercept', 'linear_functions', 'medium', (rng) => {
    const p = pickNonZeroInt(rng, -9, 9);
    const q = pickNonZeroInt(rng, -9, 9);
    // y = mx + b với b = q, m = −q/p ⇒ mb = −q²/p: dấu ngược với p.
    const sign = -Math.sign(p);
    const L = pick(rng, ['l', 'k', 'n']);
    const all = ['mb > 0', 'mb < 0', 'mb = 0', 'mb = 1'];
    const correct = sign > 0 ? 'mb > 0' : 'mb < 0';
    return {
      stem: `In the xy-plane, line ${L} crosses the x-axis at (${p}, 0) and the y-axis at (0, ${q}). If line ${L} has equation y = mx + b, which of the following must be true?`,
      correct,
      wrong: all
        .filter((c) => c !== correct)
        .map((c) => wt(c, c === 'mb = 0' ? 'Tích bằng 0 chỉ khi đường đi qua gốc hoặc nằm ngang.' : c === 'mb = 1' ? 'Không có lý do gì để tích bằng đúng 1.' : 'Xét dấu: b là tung độ giao điểm với trục y; m cùng dấu hay trái dấu với b tuỳ vào phía của giao điểm với trục x.')),
      steps: [
        S('Tung độ gốc b là tung độ giao điểm với trục y.', `b = ${q}`),
        S('Hệ số góc qua hai giao điểm.', `m = frac(${q} - 0,0 - ${par(p)}) = ${formatValueMath(rat(-q, p))}`),
        S('Xét dấu tích.', `mb ${sign > 0 ? '>' : '<'} 0`),
      ],
    };
  }),

  mcqText('pd-c-perp-same-intercept', 'linear_equations_two_var', 'medium', (rng) => {
    const [mn, md] = pick(rng, [
      [-2, 1],
      [3, 1],
      [1, 2],
      [-3, 4],
      [2, 5],
      [-1, 3],
      [4, 1],
      [5, 2],
    ] as const);
    const b = pickNonZeroInt(rng, -9, 9);
    const m = rat(mn, md);
    const perp = rat(-md, mn);
    return {
      stem: `The line ${lineEq(m, b)} is perpendicular to line l. If the two lines have the same y-intercept, which of the following could be an equation of line l?`,
      correct: lineEq(perp, b),
      wrong: [
        wt(lineEq(m, b), 'Đây chính là đường đã cho.'),
        wt(lineEq(rat(md, mn), b), 'Lấy nghịch đảo nhưng quên đổi dấu.', 'sign_flip'),
        wt(lineEq(rat(-mn, md), b), 'Đổi dấu nhưng quên lấy nghịch đảo.'),
      ],
      steps: [
        S('Hai đường vuông góc có tích hệ số góc bằng −1: lấy nghịch đảo và đổi dấu.', `${formatValueMath(m)} → ${formatValueMath(perp)}`),
        S('Giữ nguyên tung độ gốc.', lineEq(perp, b)),
      ],
    };
  }),

  mcqText('pd-c-linear-constant-deduce', 'linear_functions', 'hard', (rng) => {
    const a = pickInt(rng, -5, 3);
    const c = a + pickInt(rng, 2, 4);
    const k = c + pickInt(rng, 2, 6);
    const V = pickNonZeroInt(rng, -20, 20);
    const [f] = pick(rng, [['f'], ['g'], ['h']] as const);
    return {
      stem: `If ${f} is a linear function such that ${f}(${a}) <= ${f}(${a + 1}), ${f}(${c}) >= ${f}(${c + 1}), and ${f}(${k}) = ${V}, which of the following must be true?`,
      correct: `${f}(0) = ${V}`,
      wrong: [
        wt(`${f}(0) = 0`, 'Không có lý do gì để đường thẳng đi qua gốc.'),
        wt(`${f}(0) ${V > 0 ? '>' : '<'} ${V}`, 'Hai điều kiện đầu buộc hệ số góc vừa không âm vừa không dương.'),
        wt(`${f}(${a + 1}) < ${f}(0) < ${f}(${c})`, 'Hàm hằng thì mọi giá trị bằng nhau, không có bất đẳng thức nghiêm ngặt nào đúng.'),
      ],
      steps: [
        S(`${f}(${a}) nhỏ hơn hoặc bằng ${f}(${a + 1}) nên hệ số góc không âm; ${f}(${c}) lớn hơn hoặc bằng ${f}(${c + 1}) nên hệ số góc không dương.`),
        S('Hệ số góc bằng 0: hàm hằng, mọi giá trị đều bằng nhau.', `${f}(0) = ${f}(${k}) = ${V}`),
      ],
    };
  }),

  mcqText('pd-c-perp-slope-range', 'linear_functions', 'hard', (rng) => {
    const k = pickInt(rng, 1, 15);
    const [a, b, dd, e] = pick(rng, [
      ['a', 'b', 'd', 'e'],
      ['p', 'q', 'r', 's'],
      ['j', 'k', 'm', 'n'],
    ] as const);
    const K = String(k);
    const inv = k === 1 ? '1' : `frac(1,${k})`;
    const S1 = `frac(${a},${b})`;
    const S2 = `frac(${dd},${e})`;
    const mode = pickInt(rng, 0, 3);
    const given = [`0 < ${S1} < ${inv}`, `${S1} > ${K}`, `-${inv} < ${S1} < 0`, `${S1} < -${K}`][mode]!;
    const options = [`${S2} < -${K}`, `-${inv} < ${S2} < 0`, `${S2} > ${K}`, `0 < ${S2} < ${inv}`];
    const correct = options[mode]!;
    return {
      stem: `The lines y = ${S1}x + c and y = ${S2}x + c are perpendicular, where ${a}, ${b}, c, ${dd}, and ${e} are nonzero constants. If ${given}, which of the following must be true?`,
      correct,
      wrong: options
        .filter((o) => o !== correct)
        .map((o) => wt(o, 'Hệ số góc vuông góc là nghịch đảo ĐỔI DẤU: số nhỏ thành số lớn, dương thành âm.')),
      steps: [
        S('Hai đường vuông góc nên hệ số góc thứ hai bằng âm nghịch đảo của hệ số góc thứ nhất.', `${S2} = -frac(${b},${a})`),
        S('Lấy nghịch đảo đảo chiều độ lớn (nhỏ hơn 1 thành lớn hơn 1), rồi đổi dấu.', correct),
      ],
    };
  }),
];

// ============================================================ Chương 13: diễn giải mô hình tuyến tính

type LinCtx = { Y: string; X: string; desc: string; ys: string; yu: string; xu: string; xus: string; dir: 1 | -1; lo: number; hi: number };
const LIN_CTX: LinCtx[] = [
  { Y: 'h', X: 'd', desc: 'the depth h, in inches, of water in a rain barrel d days after the last rainfall', ys: 'the depth of the water', yu: 'inches', xu: 'day', xus: 'days', dir: -1, lo: 60, hi: 150 },
  { Y: 'b', X: 't', desc: 'the number of concert programs b remaining at a table t minutes after the doors open', ys: 'the number of programs remaining', yu: 'programs', xu: 'minute', xus: 'minutes', dir: -1, lo: 120, hi: 400 },
  { Y: 's', X: 'k', desc: 'the number of grams of salt s recommended for a pot of soup that already has k tablespoons of soy sauce', ys: 'the recommended salt', yu: 'grams', xu: 'tablespoon of soy sauce', xus: 'tablespoons of soy sauce', dir: -1, lo: 6, hi: 14 },
  { Y: 'p', X: 's', desc: 'the estimated number of daily bus riders p in a town that has s bus routes', ys: 'the estimated number of riders', yu: 'riders', xu: 'bus route', xus: 'bus routes', dir: 1, lo: 5000, hi: 30000 },
  { Y: 'H', X: 'c', desc: 'the number of hours H a phone battery lasts when the screen brightness is set to c percent', ys: 'the battery life', yu: 'hours', xu: 'percent of brightness', xus: 'percent of brightness', dir: -1, lo: 80, hi: 160 },
  { Y: 'V', X: 'n', desc: 'the number of weekly visitors V to a website that has n posted articles', ys: 'the number of weekly visitors', yu: 'visitors', xu: 'article', xus: 'articles', dir: 1, lo: 300, hi: 2000 },
  { Y: 'W', X: 'm', desc: 'the weight W, in grams, of a candle that has burned for m minutes', ys: 'the weight of the candle', yu: 'grams', xu: 'minute', xus: 'minutes', dir: -1, lo: 200, hi: 600 },
];

const ch13: MathTemplate[] = [
  mcqText('pd-c-model-slope-meaning', 'linear_functions', 'easy', (rng) => {
    const c = pick(rng, LIN_CTX);
    const b = pickInt(rng, c.lo, c.hi);
    const m = pickInt(rng, 2, Math.max(3, Math.floor(c.lo / 10)));
    const mm = m === b ? m + 1 : m;
    const eq = `${c.Y} = ${b} ${c.dir < 0 ? '-' : '+'} ${mm}${c.X}`;
    const up = c.dir > 0;
    if (pick(rng, [true, false])) {
      return {
        stem: `The equation ${eq} models ${c.desc}. Based on the model, how does ${c.ys} change for each additional ${c.xu}?`,
        correct: `It ${up ? 'increases' : 'decreases'} by ${mm} ${c.yu}.`,
        wrong: [
          wt(`It ${up ? 'decreases' : 'increases'} by ${mm} ${c.yu}.`, 'Sai chiều: xem dấu của hệ số góc.', 'sign_flip'),
          wt(`It ${up ? 'increases' : 'decreases'} by ${b} ${c.yu}.`, `${b} là giá trị ban đầu (tung độ gốc), không phải mức thay đổi.`, 'swapped_slope_intercept'),
          wt(`It ${up ? 'decreases' : 'increases'} by ${b} ${c.yu}.`, 'Vừa nhầm tung độ gốc vừa sai chiều.'),
        ],
        steps: [S(`Trong dạng y = mx + b, hệ số của ${c.X} là mức thay đổi của ${c.Y} khi ${c.X} tăng 1.`), S(`Hệ số là ${up ? '' : 'âm '}${mm}: ${up ? 'tăng' : 'giảm'} ${mm} mỗi đơn vị.`)],
      };
    }
    return {
      stem: `The equation ${eq} models ${c.desc}. What is the best interpretation of the number ${mm} in this model?`,
      correct: `For each additional ${c.xu}, ${c.ys} ${up ? 'increases' : 'decreases'} by ${mm} ${c.yu}.`,
      wrong: [
        wt(`When ${c.X} is 0, ${c.ys} is ${mm} ${c.yu}.`, 'Giá trị khi biến bằng 0 là tung độ gốc, không phải hệ số góc.', 'swapped_slope_intercept'),
        wt(`For each additional ${mm} ${c.xus}, ${c.ys} changes by 1 ${c.yu.replace(/s$/, '')}.`, 'Đảo ngược tỉ lệ: hệ số góc là thay đổi của y khi x tăng 1.', 'inverted_fraction'),
        wt(`The total change in ${c.ys} is ${mm} ${c.yu}.`, 'Hệ số góc là thay đổi cho MỖI đơn vị, không phải tổng thay đổi.'),
      ],
      steps: [S(`${mm} là hệ số của ${c.X}: mức thay đổi của ${c.Y} khi ${c.X} tăng thêm 1.`), S(`Dấu ${up ? 'cộng' : 'trừ'} nghĩa là ${up ? 'tăng' : 'giảm'}.`)],
    };
  }),

  mcqText('pd-c-model-intercept-meaning', 'linear_functions', 'medium', (rng) => {
    if (pick(rng, [true, false])) {
      const b = 50 * pickInt(rng, 2, 30);
      const m = 10 * pickInt(rng, 2, 40);
      const ctx = pick(rng, [
        ['A community garden recruits helpers. The number of vegetable beds planted, m, can be estimated by', 'm', 'v', 'the number of helpers who signed up', 'beds', 'helper', 'helpers'],
        ['A food bank collects donations. The number of families served, f, can be estimated by', 'f', 'k', 'the number of volunteers working that week', 'families', 'volunteer', 'volunteers'],
        ['A theater sells season passes. The number of passes sold, p, can be estimated by', 'p', 'a', 'the number of advertisements placed', 'passes', 'advertisement', 'advertisements'],
      ] as const);
      const [intro, Y, X, xdesc, yu, xu, xus] = ctx;
      return {
        stem: `${intro} the equation ${Y} = ${b} + ${m}${X}, where ${X} is ${xdesc}. Based on the equation, which of the following statements is true?`,
        correct: `There would be about ${b} ${yu} with no ${xus}.`,
        wrong: [
          wt(`For every one additional ${xu}, there are ${b} more ${yu}.`, `${b} là giá trị khi ${X} = 0, không phải mức tăng mỗi đơn vị.`, 'swapped_slope_intercept'),
          wt(`There were initially ${m} ${xus}.`, `${m} là mức tăng mỗi ${xu}, không phải số ${xus} ban đầu.`),
          wt(`There are ${b} more ${yu} for every ${m} additional ${xus}.`, 'Ghép hai con số thành một tỉ lệ không có trong mô hình.'),
        ],
        steps: [S(`Tung độ gốc là giá trị của ${Y} khi ${X} = 0.`, `${Y} = ${b} + ${m}(0) = ${b}`), S(`Vậy khi không có ${xus}, có khoảng ${b} ${yu}.`)],
      };
    }
    const rateTxt = pick(rng, ['0.92', '0.85', '1.25', '0.78', '1.3', '7.5', '110']);
    const fee = num(pickInt(rng, 2, 40) / 4);
    const [from, to] = pick(rng, [
      ['Australian dollars', 'Japanese yen'],
      ['Canadian dollars', 'British pounds'],
      ['euros', 'Swiss francs'],
    ] as const);
    return {
      stem: `A currency exchange uses the equation y = ${rateTxt}x - ${fee} to convert x ${from} into y ${to}. Which of the following is the best interpretation of the number ${fee} in the equation?`,
      correct: `The exchange charges a fee of ${fee} ${to}.`,
      wrong: [
        wt(`The exchange charges a fee of ${fee} ${from}.`, `Số bị trừ nằm cùng đơn vị với y (${to}), không phải đơn vị của x.`, 'dropped_unit_conversion'),
        wt(`One ${from.replace(/s$/, '')} is worth ${fee} ${to}.`, `Tỉ giá là hệ số của x (${rateTxt}), không phải hằng số trừ đi.`, 'swapped_slope_intercept'),
        wt(`One ${to.replace(/s$/, '')} is worth ${fee} ${from}.`, 'Hằng số trừ đi không phải một tỉ giá.'),
      ],
      steps: [S('Hằng số bị trừ không phụ thuộc số tiền đổi: đó là một khoản phí cố định.'), S(`Vì bị trừ khỏi y, khoản phí tính bằng đơn vị của y (${to}).`)],
    };
  }),

  mcqText('pd-c-model-product-coef', 'linear_functions', 'medium', (rng) => {
    const F = 100 * pickInt(rng, 5, 30);
    const K = 10 * pickInt(rng, 3, 300);
    const ctx = pick(rng, [
      ['The monthly pay of a travel agent', 'x is the agent’s commission rate and c is the number of cruises booked', 'The average price of a cruise booked', 'The base monthly pay', 'The average monthly commission', 'The average number of cruises booked each month'],
      ['The weekly pay of a tutor at a learning center', 'x is the fraction of each session fee the tutor keeps and c is the number of sessions taught', 'The fee charged for each session', 'The base weekly pay', 'The average weekly amount the tutor keeps', 'The number of sessions taught each week'],
      ['The monthly income of a real estate agent', 'x is the agent’s commission rate and c is the number of homes sold', 'The average price of a home sold', 'The base monthly income', 'The average monthly commission', 'The number of homes sold each month'],
    ] as const);
    const [who, vars, right, w1, w2, w3] = ctx;
    return {
      stem: `${who}, in dollars, is given by the expression ${F} + ${K}xc, where ${vars}. Which of the following is the best interpretation of the number ${K} in this context?`,
      correct: right,
      wrong: [wt(w1, `${F} mới là phần cố định.`, 'swapped_slope_intercept'), wt(w2, `Hoa hồng là ${K} nhân x nhân c, không phải riêng ${K}.`), wt(w3, `c mới là số lượng bán.`)],
      steps: [S(`Tiền hoa hồng cho mỗi món là tỉ lệ x nhân với giá của món đó, rồi nhân với số món c.`), S(`Vậy ${K} phải là giá (trung bình) của mỗi món.`)],
    };
  }),

  mcqText('pd-c-model-time-left', 'linear_functions', 'hard', (rng) => {
    const P0 = 50 * pickInt(rng, 4, 60);
    const r = pickInt(rng, 2, 25);
    const ctx = pick(rng, [
      ['During a phone-a-thon, the number of pledges P can be modeled by', 'P', 't', 'the number of minutes left in the phone-a-thon', 'The number of pledges at the end of the phone-a-thon', 'The number of pledges when the phone-a-thon started', 'The number of pledges received each minute', 'The number of minutes the phone-a-thon lasted'],
      ['During a fundraiser, the total amount raised A, in dollars, can be modeled by', 'A', 'm', 'the number of minutes left before the fundraiser ends', 'The total amount raised by the end of the fundraiser', 'The amount raised when the fundraiser started', 'The amount raised each minute', 'The length of the fundraiser, in minutes'],
      ['As a train approaches its destination, its distance D, in kilometers, from the starting station can be modeled by', 'D', 'm', 'the number of minutes left before it arrives', 'The distance from the starting station to the destination', 'The distance traveled in the first minute', 'The speed of the train, in kilometers per minute', 'The number of minutes the trip takes'],
    ] as const);
    const [intro, Y, X, xdesc, right, w1, w2, w3] = ctx;
    return {
      stem: `${intro} the equation ${Y} = ${P0} - ${r}${X}, where ${X} is ${xdesc}. According to the model, what is the meaning of the ${P0} in the equation?`,
      correct: right,
      wrong: [
        wt(w1, `${X} là thời gian CÒN LẠI: ${X} = 0 là lúc kết thúc, không phải lúc bắt đầu.`, 'swapped_slope_intercept'),
        wt(w2, `Mức thay đổi mỗi đơn vị là ${r}, không phải ${P0}.`, 'swapped_slope_intercept'),
        wt(w3, `${P0} có đơn vị của ${Y}, không phải đơn vị thời gian.`),
      ],
      steps: [S(`${P0} là giá trị của ${Y} khi ${X} = 0.`), S(`${X} đếm thời gian còn lại, nên ${X} = 0 là thời điểm kết thúc.`)],
    };
  }),

  grid('pd-c-model-rate-per-unit', 'linear_functions', 'medium', (rng) => {
    if (pick(rng, [true, false])) {
      const c = pick(rng, [2, 4, 5, 8, 10]);
      const a = pickInt(rng, 1, 9);
      const b = pickInt(rng, 1, 20);
      const ctx = pick(rng, [
        ['the time t, in seconds, it takes to upload a photo album with x photos', 'each photo increase the upload time', 't'],
        ['the cost C, in dollars, of printing a booklet with x pages', 'each page increase the cost', 'C'],
        ['the height h, in centimeters, of a stack of x books', 'each book increase the height', 'h'],
      ] as const);
      return {
        stem: `The equation ${ctx[2]} = frac(${cf(a, 'x')} + ${b},${c}) models ${ctx[0]}. Based on the model, by how much does ${ctx[1]}?`,
        answer: rat(a, c),
        steps: [S('Tách phân số thành dạng y = mx + b.', `${ctx[2]} = frac(${a},${c})x + frac(${b},${c})`), S('Mức tăng mỗi đơn vị là hệ số của x.', `frac(${a},${c}) = ${num(a / c)}`)],
      };
    }
    const m = pickInt(rng, 2, 30);
    const b = pickInt(rng, 20, 80);
    const k = pick(rng, [15, 20, 30, 45, 90]);
    const ctx = pick(rng, [
      ['A slow cooker warms a stew. The temperature T, in degrees Fahrenheit, of the stew h hours after the cooker is turned on is modeled by', 'T', 'the temperature increase, in degrees Fahrenheit'],
      ['A tank is being filled. The volume V, in liters, of water in the tank h hours after filling begins is modeled by', 'V', 'the increase in volume, in liters'],
      ['A candle maker pours wax. The number of candles N finished h hours after the start of a shift is modeled by', 'N', 'the increase in the number of finished candles'],
    ] as const);
    return {
      stem: `${ctx[0]} ${ctx[1]} = ${b} + ${m}h. Based on the model, what is ${ctx[2]} for every ${k} minutes?`,
      answer: rat(m * k, 60),
      steps: [S(`Hệ số ${m} là mức tăng mỗi giờ (60 phút).`), S(`Đổi ${k} phút ra giờ rồi nhân.`, `${m} × frac(${k},60) = ${formatValueMath(rat(m * k, 60))}`)],
    };
  }),

  mcqText('pd-c-model-profit-table', 'linear_functions', 'medium', (rng) => {
    const m = pickInt(rng, 2, 30);
    const k = pickInt(rng, 3, 20);
    const C = m * k;
    const xs = [2, 4, 6, 8, 10].map((x, i) => x + (i === 0 ? pickInt(rng, 0, 1) : 0));
    const item = pick(rng, [
      ['smoothie', 'smoothies', 'a juice bar'],
      ['bouquet', 'bouquets', 'a flower stand'],
      ['pizza', 'pizzas', 'a food truck'],
    ] as const);
    const figure: MathFigureSpec = {
      kind: 'data_table',
      caption: `Daily profit of ${item[2]}`,
      columns: [`${item[1][0]!.toUpperCase()}${item[1].slice(1)} sold, x`, 'Daily profit, y (dollars)'],
      rows: xs.map((x) => ({ label: String(x), cells: [m * x - C] })),
    };
    const intro = `The table shows the daily profit y, in dollars, of ${item[2]} when it sells x ${item[1]} in a day. The relationship between x and y is linear.`;
    const mode = pickInt(rng, 0, 2);
    if (mode === 0) {
      return {
        stem: `${intro} What does the slope of the line through these points represent?`,
        figure,
        correct: `The profit generated from each ${item[0]} sold`,
        wrong: [
          wt(`The price of each ${item[0]}`, 'Lợi nhuận mỗi món là giá bán trừ chi phí — không phải giá bán.'),
          wt(`The daily profit generated from all the ${item[1]} that were sold`, 'Đó là y, không phải hệ số góc.'),
          wt(`The number of ${item[1]} that need to be sold to make a daily profit of 100 dollars`, 'Hệ số góc là thay đổi của y khi x tăng 1.'),
        ],
        steps: [S('Hệ số góc là mức thay đổi của lợi nhuận khi bán thêm một món.', `frac(${m * xs[2]! - C} - ${par(m * xs[1]! - C)},${xs[2]} - ${xs[1]}) = ${m}`)],
      };
    }
    if (mode === 1) {
      return {
        stem: `${intro} Which of the following is the best interpretation of the y-intercept of the line through these points?`,
        figure,
        correct: `The daily costs of running ${item[2]}, which are lost if no ${item[1]} are sold`,
        wrong: [
          wt(`The price of each ${item[0]}`, 'Giá mỗi món liên quan tới hệ số góc, không phải tung độ gốc.'),
          wt(`The cost of making each ${item[0]}`, 'Chi phí cho MỖI món thay đổi theo x; tung độ gốc là phần không phụ thuộc x.'),
          wt(`The daily cost of the ${item[1]} that were not sold`, 'Tung độ gốc là lợi nhuận khi bán 0 món: phần chi phí cố định bị lỗ.'),
        ],
        steps: [S('Tung độ gốc là lợi nhuận khi x = 0.', `y = ${m}(0) - ${C} = -${C}`), S('Bán 0 món vẫn lỗ khoản này: đó là chi phí cố định mỗi ngày.')],
      };
    }
    return {
      stem: `${intro} What does it mean that (${k}, 0) lies on the line through these points?`,
      figure,
      correct: `${item[2][0]!.toUpperCase()}${item[2].slice(1)} needs to sell ${k} ${item[1]} per day to cover its daily expenses.`,
      wrong: [
        wt(`Each ${item[0]} must be sold for at least ${k} dollars to cover the cost of making it.`, `${k} là số món (trục x), không phải số tiền.`),
        wt(`It costs ${k} dollars to make each ${item[0]}.`, `${k} là số món (trục x), không phải chi phí.`),
        wt(`Each day, the first ${k} ${item[1]} are given away for free.`, 'Lợi nhuận bằng 0 là hoà vốn, không phải cho không.'),
      ],
      steps: [S(`Điểm (${k}, 0): bán ${k} món thì lợi nhuận bằng 0.`), S('Lợi nhuận bằng 0 là hoà vốn: vừa đủ bù chi phí.')],
    };
  }),

  mcqText('pd-c-model-roman', 'linear_functions', 'hard', (rng) => {
    const a = pickInt(rng, 1, 5);
    let b = pickInt(rng, 1, 5);
    if (b === a) b = a === 5 ? 1 : a + 1;
    const c = pickInt(rng, 5, 40);
    const ctx = pick(rng, [
      ['liters of water', 'goldfish', 'goldfish', 'liter of water'],
      ['cups of seed', 'birds', 'bird', 'cup of seed'],
      ['square feet of shelf space', 'plants', 'plant', 'square foot of shelf space'],
    ] as const);
    const [yu, xs, x1, y1] = ctx;
    const slope = rat(b, a); // y tăng b/a mỗi x
    const inv = rat(a, b);
    const pool = [
      { s: `One additional ${x1} requires ${formatValueMath(slope)} more ${yu}.`, t: true },
      { s: `One additional ${x1} requires ${formatValueMath(inv)} more ${yu}.`, t: false },
      { s: `One additional ${y1} can support ${formatValueMath(inv)} more ${xs}.`, t: true },
      { s: `One additional ${y1} can support ${formatValueMath(slope)} more ${xs}.`, t: false },
    ];
    const three = pool
      .map((u) => ({ ...u, r: rng() }))
      .sort((u, v) => u.r - v.r)
      .slice(0, 3);
    const { correct, wrong } = romanChoices(rng, three.map((u) => u.t));
    return {
      stem: `A pet store uses the equation ${cf(a, 'y')} - ${cf(b, 'x')} = ${c} to find the total amount y, in ${yu}, needed for x ${xs}. Based on the equation, which of the following must be true? I. ${three[0]!.s} II. ${three[1]!.s} III. ${three[2]!.s}`,
      correct,
      wrong,
      steps: [
        S('Đưa về dạng y theo x.', `y = frac(${b},${a})x + frac(${c},${a})`),
        S('Mỗi đơn vị x thêm cần thêm hệ số góc đơn vị y; ngược lại mỗi đơn vị y thêm nuôi thêm được nghịch đảo của hệ số góc.', `frac(${b},${a})  và  frac(${a},${b})`),
      ],
    };
  }),

  mcqNum('pd-c-model-inverse-change', 'linear_functions', 'medium', (rng) => {
    const m = pick(rng, [0.5, 1.25, 1.5, 2, 2.5, 4, 5]);
    const F = num(pickInt(rng, 2, 30) / 2);
    const t = pickInt(rng, 2, 12);
    const D = m * t;
    const ctx = pick(rng, [
      ['A courier service', 'the cost C, in dollars, of shipping a crate that weighs x pounds', 'pounds', 'shipping cost'],
      ['A parking garage', 'the cost C, in dollars, of parking for x hours', 'hours', 'parking cost'],
      ['A print shop', 'the cost C, in dollars, of printing x posters', 'posters', 'printing cost'],
    ] as const);
    return {
      stem: `${ctx[0]} uses the equation C = ${F} + ${num(m)}x to find ${ctx[1]}. An increase of ${num(D)} dollars in the ${ctx[3]} corresponds to an increase of how many ${ctx[2]}?`,
      correct: t,
      wrong: [
        w(toRat(D * m), `Nhân với ${num(m)} thay vì chia.`, 'inverted_fraction'),
        w(toRat(Math.round(((D - Number(F)) / m) * 100) / 100), `Trừ phí cố định ${F} — phí cố định không ảnh hưởng tới phần THAY ĐỔI.`),
        w(toRat(D), 'Đây là mức tăng chi phí, chưa đổi ra số đơn vị.', 'stopped_too_early'),
      ],
      fmt: (v) => num(v.num / v.den),
      steps: [S(`Mỗi đơn vị x làm C tăng ${num(m)} đô la.`), S('Chia mức tăng chi phí cho mức tăng mỗi đơn vị.', `frac(${num(D)},${num(m)}) = ${t}`)],
    };
  }),
];

export const PANDA_C_TEMPLATES: readonly MathTemplate[] = [...ch1, ...ch2, ...ch3.filter((t) => t !== growthEveryK), ...ch4, ...ch5, ...ch6, ...ch7, ...ch8, ...ch9, ...ch10, ...ch11, ...ch12, ...ch13];
