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
  twoVarSide,
} from '../authoring';
import { rat } from '@/lib/math/value';
import type { MathErrorTag, MathSolutionStep, MathTemplate, MathValue } from '@/lib/math/types';

/**
 * Bộ dạng câu "pd-" phần A — chương 1 tới 13 của lộ trình ôn SAT Math:
 * luỹ thừa và căn, phần trăm, tuyến tính hay hàm mũ, tỉ lệ, tốc độ, biến đổi
 * công thức, đồng nhất hệ số, hệ phương trình, bất phương trình, bài toán có
 * lời, đường thẳng và diễn giải mô hình.
 *
 * Cùng nguyên tắc với các file domain: CHỌN ĐÁP ÁN TRƯỚC rồi dựng đề ngược từ
 * nó, để số trong đề luôn sạch như đề thật; mỗi nhiễu là kết quả của MỘT sai
 * lầm có tên. Nhiễu nào không quy được về nhãn chung thì để `errorTag: null`
 * nhưng BẮT BUỘC có `note` nói rõ người chọn nó đã nghĩ sai ở đâu.
 *
 * Mọi đề đều do tác giả tự soạn, không chép từ sách nào.
 */

/** Số âm trong phép tính ở lời giải thì bọc ngoặc: "3 + (-2)", không phải "3 + -2". */
const par = (n: number) => (n < 0 ? `(${n})` : String(n));

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

/**
 * Luỹ thừa của x ở dạng markup: `x`, `x^3`, `x^(-2)`, `x^(5/2)`, `1`.
 *
 * Rút gọn số mũ trước khi in — `x^(4/2)` trong một lựa chọn là tự tố cáo nó
 * sai, vì đáp án đúng không bao giờ viết kiểu chưa rút gọn.
 */
function powX(num: number, den: number): string {
  const v = rat(num, den);
  if (v.num === 0) return '1';
  if (v.den === 1) {
    if (v.num === 1) return 'x';
    return v.num < 0 ? `x^(${v.num})` : `x^${v.num}`;
  }
  return `x^(${v.num}/${v.den})`;
}

// ============================================================ Chương 1: luỹ thừa & căn

const SQUARE_FREE = [2, 3, 5, 6, 7, 10, 11, 13] as const;

/**
 * Rút gọn căn: `c·sqrt(k²m)` = `ck·sqrt(m)`.
 *
 * Cố ý KHÔNG đưa nhiễu "rút được một phần" (2sqrt(18) cho sqrt(72)): nó bằng
 * đúng giá trị của đề, nên câu hỏi "equivalent to" sẽ có hai đáp án đúng. Mọi
 * nhiễu ở đây đều khác giá trị thật.
 */
const simplifySqrt: MathTemplate = {
  slug: 'pd-simplify-sqrt',
  skill: 'equivalent_expressions',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const k = pickInt(rng, 2, 9);
    const m = pick(rng, SQUARE_FREE);
    const c = pickInt(rng, 1, 3);
    const n = k * k * m;
    const lead = c === 1 ? '' : String(c);
    const { choices, correctIndex } = buildTextChoices(
      `${c * k}sqrt(${m})`,
      [
        {
          display: `${c * k * k}sqrt(${m})`,
          errorTag: 'forgot_square_root',
          note: `Đưa ${k * k} ra ngoài căn nhưng quên khai căn nó thành ${k}.`,
        },
        {
          display: `${c * k * m}`,
          errorTag: null,
          note: `Đưa cả ${m} ra ngoài căn. Chỉ thừa số chính phương mới ra khỏi căn được, ${m} phải ở lại dưới căn.`,
        },
        {
          display: `${c * k}sqrt(${k * m})`,
          errorTag: null,
          note: `Mới lấy ra được một thừa số ${k}, thừa số ${k} còn lại vẫn để dưới căn — biểu thức này lớn hơn đề bài.`,
        },
      ],
      rng,
    );
    const steps: MathSolutionStep[] = [
      { text: 'Tìm thừa số chính phương lớn nhất của số dưới căn.', expr: `${n} = ${k * k} × ${m}` },
      {
        text: 'Căn của một tích bằng tích các căn; khai căn thừa số chính phương.',
        expr: `sqrt(${n}) = sqrt(${k * k}) × sqrt(${m}) = ${k}sqrt(${m})`,
      },
    ];
    if (c > 1) steps.push({ text: `Nhân với hệ số ${c} đứng trước căn.`, expr: `${c} × ${k}sqrt(${m}) = ${c * k}sqrt(${m})` });
    return {
      format: 'mcq',
      stem: `Which of the following is equivalent to ${lead}sqrt(${n})?`,
      choices,
      correctIndex,
      steps,
    };
  },
};

/**
 * Bộ ba (n, m, b): cơ số b^n, số mũ m/n, kết quả b^m. Dựng sẵn ở mức module
 * để mọi bộ đều cho số nguyên đẹp và không quá 1000 — bốc thẳng trên danh sách
 * nên không cần vòng thử lại.
 */
const RADICAL_TRIPLES: Array<[number, number, number]> = [];
for (const n of [2, 3, 4]) {
  for (let m = 1; m <= 5; m += 1) {
    if (m === n || gcd(m, n) !== 1) continue;
    for (let b = 2; b <= 10; b += 1) {
      if (b ** n <= 1000 && b ** m <= 1000) RADICAL_TRIPLES.push([n, m, b]);
    }
  }
}

/** Số mũ phân số: tính giá trị, số mũ âm, hoặc giải `x^(m/n) = V`. */
const fractionalExponent: MathTemplate = {
  slug: 'pd-fractional-exponent',
  skill: 'equivalent_expressions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const [n, m, b] = pick(rng, RADICAL_TRIPLES);
    const base = b ** n;
    const power = b ** m;
    const mode = pick(rng, ['value', 'negative', 'solve'] as const);

    if (mode === 'value') {
      const { choices, correctIndex } = buildChoices(
        rat(power),
        [
          { value: rat(b), errorTag: 'stopped_too_early', note: `Mới lấy căn bậc ${n} — còn phải nâng lên luỹ thừa ${m}.` },
          { value: rat(base * m, n), errorTag: null, note: 'Nhân cơ số với số mũ. Số mũ phân số nghĩa là lấy căn rồi nâng luỹ thừa, không phải phép nhân.' },
          { value: rat(b * m), errorTag: null, note: `Lấy căn đúng, nhưng sau đó NHÂN với ${m} thay vì nâng lên luỹ thừa ${m}.` },
        ],
        rng,
      );
      const steps: MathSolutionStep[] = [
        { text: `Mẫu ${n} của số mũ là bậc của căn: ${b} mũ ${n} bằng ${base}.`, expr: `${base}^(1/${n}) = ${b}` },
      ];
      if (m > 1) steps.push({ text: `Tử ${m} của số mũ là luỹ thừa cần nâng lên.`, expr: `${base}^(${m}/${n}) = ${b}^${m} = ${power}` });
      return {
        format: 'mcq',
        stem: `What is the value of ${base}^(${m}/${n})?`,
        choices,
        correctIndex,
        steps,
      };
    }

    if (mode === 'negative') {
      const { choices, correctIndex } = buildChoices(
        rat(1, power),
        [
          { value: rat(-power), errorTag: 'sign_flip', note: 'Số mũ âm không làm kết quả âm — nó lật thành nghịch đảo.' },
          { value: rat(power), errorTag: null, note: 'Bỏ mất dấu trừ ở số mũ. Số mũ âm nghĩa là lấy nghịch đảo.' },
          { value: rat(1, b), errorTag: 'stopped_too_early', note: `Mới lấy căn bậc ${n} rồi nghịch đảo — còn phải nâng lên luỹ thừa ${m}.` },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `What is the value of ${base}^(-${m}/${n})?`,
        choices,
        correctIndex,
        steps: [
          { text: 'Số mũ âm nghĩa là lấy nghịch đảo của luỹ thừa dương.', expr: `${base}^(-${m}/${n}) = frac(1,${base}^(${m}/${n}))` },
          { text: `Lấy căn bậc ${n} của ${base} được ${b}, rồi nâng lên luỹ thừa ${m}.`, expr: `${base}^(${m}/${n}) = ${power}` },
          { text: 'Thay vào phân số.', expr: `${base}^(-${m}/${n}) = frac(1,${power})` },
        ],
      };
    }

    const candidates: Array<{ value: MathValue; errorTag: MathErrorTag | null; note?: string }> = [
      { value: rat(power * n, m), errorTag: null, note: `Nhân ${power} với ${n}/${m} như một hệ số — phải NÂNG lên luỹ thừa ${n}/${m}.` },
      { value: rat(power * m, n), errorTag: 'inverted_fraction', note: `Vừa dùng ${m}/${n} thay cho nghịch đảo ${n}/${m}, vừa đem nó nhân như hệ số.` },
    ];
    if (m > 1) {
      candidates.unshift({ value: rat(b), errorTag: 'stopped_too_early', note: `Mới lấy căn bậc ${m} của ${power} — còn phải nâng lên luỹ thừa ${n}.` });
    }
    const { choices, correctIndex } = buildChoices(rat(base), candidates, rng);
    const steps: MathSolutionStep[] =
      m === 1
        ? [{ text: `Nâng hai vế lên luỹ thừa ${n} để khử căn bậc ${n}.`, expr: `x = ${power}^${n} = ${base}` }]
        : [
            { text: `Nâng hai vế lên luỹ thừa ${n}/${m}, nghịch đảo của số mũ ${m}/${n}.`, expr: `x = ${power}^(${n}/${m})` },
            { text: `Căn bậc ${m} của ${power} là ${b}.`, expr: `${power}^(1/${m}) = ${b}` },
            { text: `Nâng ${b} lên luỹ thừa ${n}.`, expr: `x = ${b}^${n} = ${base}` },
          ];
    return {
      format: 'mcq',
      stem: `If x^(${m}/${n}) = ${power} and x > 0, what is the value of x?`,
      choices,
      correctIndex,
      steps,
    };
  },
};

/** `(r^p)^(x + c1) = (r^q)^(x + c2)` — đưa về cùng cơ số rồi cân số mũ. */
const exponentSolveHard: MathTemplate = {
  slug: 'pd-exponent-solve-hard',
  skill: 'nonlinear_equations',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const r = pick(rng, [2, 3]);
    const exps = r === 2 ? [2, 3, 4, 5] : [2, 3, 4];
    // Bốc hai chỉ số khác nhau không cần thử lại: chỉ số thứ hai lệch đi 1..len-1.
    const i = pickInt(rng, 0, exps.length - 1);
    const j = (i + pickInt(rng, 1, exps.length - 1)) % exps.length;
    const p = exps[i] ?? 2;
    const q = exps[j] ?? 3;
    const x0 = pickInt(rng, -6, 9);
    // p(x0 + c1) = q(x0 + c2): đặt x0 + c1 = q·t và x0 + c2 = p·t là hai vế tự bằng nhau.
    const t = pickNonZeroInt(rng, -3, 3);
    const c1 = q * t - x0;
    const c2 = p * t - x0;
    const e = (c: number) => (c === 0 ? 'x' : `(x${signedTerm(c)})`);
    const coefE = (k: number, c: number) => (c === 0 ? `${k}x` : `${k}(x${signedTerm(c)})`);
    return {
      format: 'grid_in',
      stem: `If ${r ** p}^${e(c1)} = ${r ** q}^${e(c2)}, what is the value of x?`,
      answer: rat(x0),
      steps: [
        { text: `Viết cả hai cơ số thành luỹ thừa của ${r}.`, expr: `(${r}^${p})^${e(c1)} = (${r}^${q})^${e(c2)}` },
        {
          text: 'Luỹ thừa của luỹ thừa thì nhân số mũ. Hai vế cùng cơ số nên hai số mũ phải bằng nhau.',
          expr: `${coefE(p, c1)} = ${coefE(q, c2)}`,
        },
        { text: 'Nhân phân phối.', expr: `${linearSide(p, p * c1)} = ${linearSide(q, q * c2)}` },
        { text: 'Gom x về một vế rồi chia.', expr: `x = ${x0}` },
      ],
    };
  },
};

// ============================================================ Chương 2: phần trăm

const DEPOSITORS = ['Amir', 'Lena', 'Tomas', 'Priya', 'Kofi', 'Mei'] as const;

/** Lãi đơn: số dư cuối kỳ = vốn + vốn × r% × t. */
const simpleInterest: MathTemplate = {
  slug: 'pd-simple-interest',
  skill: 'percentages',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const P = 100 * pickInt(rng, 5, 50);
    const r = pickInt(rng, 2, 9);
    const t = pickInt(rng, 2, 8);
    const yearly = (P * r) / 100;
    const interest = yearly * t;
    const name = pick(rng, DEPOSITORS);
    const { choices, correctIndex } = buildChoices(
      rat(P + interest),
      [
        { value: rat(interest), errorTag: 'stopped_too_early', note: 'Đây mới là tiền lãi; đề hỏi SỐ DƯ, phải cộng thêm tiền gốc.' },
        { value: rat(P + yearly), errorTag: null, note: `Chỉ tính lãi của một năm, trong khi tiền nằm trong tài khoản ${t} năm.` },
        {
          value: rat(P + r * t),
          errorTag: 'percent_added_instead_of_multiplied',
          note: `Cộng thẳng ${r} × ${t} đô la — ${r}% phải nhân với số tiền gốc.`,
        },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `${name} deposits $${P} in an account that earns simple interest at an annual rate of ${r}%. No other deposits or withdrawals are made. What will the account balance be, in dollars, at the end of ${t} years?`,
      choices,
      correctIndex,
      steps: [
        { text: `Lãi đơn mỗi năm là ${r}% của tiền gốc.`, expr: `${P} × 0.0${r} = ${yearly}` },
        { text: `Lãi đơn không nhập vào gốc, nên ${t} năm là ${t} lần cùng một khoản lãi.`, expr: `${yearly} × ${t} = ${interest}` },
        { text: 'Số dư bằng gốc cộng lãi.', expr: `${P} + ${interest} = ${P + interest}` },
      ],
    };
  },
};

const COMPOUNDING = [
  { n: 2, word: 'semiannually' },
  { n: 4, word: 'quarterly' },
  { n: 12, word: 'monthly' },
] as const;

/** Lãi kép nhiều kỳ mỗi năm: chọn hàm mô hình đúng. */
const compoundInterest: MathTemplate = {
  slug: 'pd-compound-interest',
  skill: 'percentages',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const P = 500 * pickInt(rng, 2, 20);
    const r = pickInt(rng, 2, 9);
    const { n, word } = pick(rng, COMPOUNDING);
    const rate = `0.0${r}`;
    const correct = `V(t) = ${P}(1 + frac(${rate},${n}))^(${n}t)`;
    const third = pick(rng, [
      {
        display: `V(t) = ${P}(1 + ${rate})^(${n}t)`,
        errorTag: null,
        note: `Lãi suất mỗi kỳ chỉ là ${r}% chia cho ${n}; ${r}% là lãi của cả năm.`,
      },
      {
        display: `V(t) = ${P}(1 + frac(0.${r},${n}))^(${n}t)`,
        errorTag: 'dropped_unit_conversion' as const,
        note: `${r}% viết thành số thập phân là 0.0${r}, không phải 0.${r}.`,
      },
    ]);
    const { choices, correctIndex } = buildTextChoices(
      correct,
      [
        {
          display: `V(t) = ${P}(1 + ${rate}t)`,
          errorTag: 'percent_added_instead_of_multiplied',
          note: 'Đây là lãi ĐƠN — tiền lãi không được nhập vào gốc để sinh lãi tiếp.',
        },
        {
          display: `V(t) = ${P}(1 + frac(${rate},${n}))^t`,
          errorTag: null,
          note: `Mỗi năm có ${n} kỳ ghép lãi, nên sau t năm số mũ là ${n}t chứ không phải t.`,
        },
        third,
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A savings account is opened with a deposit of $${P}. The account earns ${r}% annual interest, compounded ${word}, and no other deposits or withdrawals are made. Which of the following functions gives the balance V(t), in dollars, of the account t years after it is opened?`,
      choices,
      correctIndex,
      steps: [
        { text: `Lãi năm ${r}% chia đều cho ${n} kỳ, nên mỗi kỳ lãi suất là ${r}% chia ${n}.`, expr: `frac(${rate},${n})` },
        { text: 'Mỗi kỳ số dư được nhân với 1 cộng lãi suất kỳ.', expr: `1 + frac(${rate},${n})` },
        { text: `Sau t năm có ${n}t kỳ ghép lãi.`, expr: correct },
      ],
    };
  },
};

// ============================================================ Chương 3: tuyến tính hay hàm mũ

/** Nhìn bảng bốn giá trị, nhận ra tuyến tính (hiệu không đổi) hay mũ (tỉ số không đổi). */
const linearVsExp: MathTemplate = {
  slug: 'pd-linear-vs-exp-identify',
  skill: 'nonlinear_functions',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const kind = pick(rng, ['linear', 'exponential'] as const);
    const up = pick(rng, [true, false]);
    const x0 = pickInt(rng, 0, 1);
    let ys: number[];
    let step: MathSolutionStep;
    if (kind === 'linear') {
      const dAbs = pickInt(rng, 1, 9);
      const d = up ? dAbs : -dAbs;
      // Giảm dần thì bắt đầu đủ cao để cả bốn giá trị còn dương, như số đếm thật.
      const y0 = up ? pickInt(rng, 1, 30) : 3 * dAbs + pickInt(rng, 1, 20);
      ys = [0, 1, 2, 3].map((i) => y0 + i * d);
      step = {
        text: 'Lấy hiệu của hai giá trị y liên tiếp: hiệu không đổi nên đây là quan hệ tuyến tính.',
        expr: `${ys[1]} - ${ys[0]} = ${ys[2]} - ${ys[1]} = ${ys[3]} - ${ys[2]} = ${d}`,
      };
    } else {
      const f = pick(rng, [2, 3]);
      if (up) {
        const y0 = f === 2 ? pickInt(rng, 1, 12) : pickInt(rng, 1, 6);
        ys = [0, 1, 2, 3].map((i) => y0 * f ** i);
      } else {
        // Giảm theo hệ số 1/f: bắt đầu từ bội của f³ để cả bốn giá trị còn nguyên.
        const s = f === 2 ? pickInt(rng, 1, 12) : pickInt(rng, 1, 4);
        ys = [0, 1, 2, 3].map((i) => s * f ** (3 - i));
      }
      step = {
        text: 'Hiệu giữa các giá trị y thay đổi, nhưng tỉ số của hai giá trị liên tiếp thì không đổi — đó là hàm mũ.',
        expr: `${ys[1]} ÷ ${ys[0]} = ${ys[2]} ÷ ${ys[1]} = ${ys[3]} ÷ ${ys[2]} = ${up ? f : `frac(1,${f})`}`,
      };
    }
    const dir = (u: boolean) => (u ? 'Increasing' : 'Decreasing');
    const other = kind === 'linear' ? 'exponential' : 'linear';
    const { choices, correctIndex } = buildTextChoices(
      `${dir(up)} ${kind}`,
      [
        {
          display: `${dir(!up)} ${kind}`,
          errorTag: null,
          note: `Đúng loại hàm nhưng sai chiều: y ở dòng cuối ${up ? 'lớn hơn' : 'nhỏ hơn'} y ở dòng đầu.`,
        },
        {
          display: `${dir(up)} ${other}`,
          errorTag: null,
          note:
            kind === 'linear'
              ? 'Hiệu giữa hai giá trị y liên tiếp không đổi — dấu hiệu của hàm tuyến tính. Hàm mũ thì TỈ SỐ mới không đổi.'
              : 'Hiệu giữa hai giá trị y liên tiếp thay đổi, nên không thể là tuyến tính. Tỉ số không đổi mới là dấu hiệu của hàm mũ.',
        },
        { display: `${dir(!up)} ${other}`, errorTag: null, note: 'Sai cả loại hàm lẫn chiều biến thiên.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: 'The table shows four values of x and the corresponding values of y. Which of the following best describes the relationship between x and y?',
      figure: {
        kind: 'data_table',
        caption: 'Values of x and y',
        columns: ['x', 'y'],
        rows: ys.map((y, i) => ({ label: String(x0 + i), cells: [y] })),
      },
      choices,
      correctIndex,
      steps: [
        step,
        { text: `Giá trị y ${up ? 'tăng' : 'giảm'} khi x tăng, nên quan hệ là ${up ? 'đồng biến' : 'nghịch biến'}.` },
      ],
    };
  },
};

/** Hệ số tăng mỗi kỳ ở dạng phân số tối giản [tử, mẫu]; phần trăm tăng luôn nguyên. */
const GROWTH_FACTORS: Array<[number, number]> = [
  [11, 10],
  [6, 5],
  [5, 4],
  [3, 2],
  [21, 20],
  [13, 10],
  [7, 5],
  [8, 5],
  [2, 1],
  [26, 25],
];

const GROWTH_CONTEXTS = [
  { noun: 'bacteria in a lab culture', unit: 'hour' },
  { noun: 'residents of a small town', unit: 'year' },
  { noun: 'subscribers to an online newsletter', unit: 'month' },
  { noun: 'rabbits on an island', unit: 'year' },
] as const;

/** Biết số đầu và số sau t kỳ, tìm phần trăm tăng mỗi kỳ — phải khai căn bậc t. */
const expGrowthModelHard: MathTemplate = {
  slug: 'pd-exp-growth-model-hard',
  skill: 'nonlinear_functions',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const [num, den] = pick(rng, GROWTH_FACTORS);
    const t = den ** 3 <= 1000 ? pick(rng, [2, 3]) : 2;
    const denT = den ** t;
    // Mẫu quá nhỏ (hệ số nguyên) thì nhân thêm 100 để số đầu trông như một số đếm thật.
    const s = pickInt(rng, 2, 9) * (denT < 20 ? 100 : 1);
    const A = denT * s;
    const F = num ** t * s;
    const p = ((num - den) * 100) / den;
    const ctx = pick(rng, GROWTH_CONTEXTS);
    return {
      format: 'grid_in',
      stem: `The number of ${ctx.noun} increased by p% each ${ctx.unit}, where p is a constant. At the start of a study the count was ${A}, and exactly ${t} ${ctx.unit}s later it was ${F}. What is the value of p?`,
      answer: rat(p),
      steps: [
        { text: 'Tăng p% mỗi kỳ nghĩa là mỗi kỳ nhân với cùng một hệ số.', expr: `${A}(1 + frac(p,100))^${t} = ${F}` },
        {
          text: 'Chia hai vế cho số ban đầu rồi rút gọn.',
          expr: `(1 + frac(p,100))^${t} = frac(${F},${A}) = frac(${num ** t},${denT})`,
        },
        { text: `Lấy căn bậc ${t} hai vế: tử và mẫu đều là luỹ thừa bậc ${t}.`, expr: `1 + frac(p,100) = ${fracOrInt(num, den)}` },
        { text: 'Trừ 1 rồi nhân 100.', expr: `p = ${p}` },
      ],
    };
  },
};

// ============================================================ Chương 4: tỉ lệ

const COPRIME_PAIRS: Array<[number, number]> = [];
for (let a = 1; a <= 6; a += 1) {
  for (let b = 1; b <= 6; b += 1) {
    if (a !== b && gcd(a, b) === 1) COPRIME_PAIRS.push([a, b]);
  }
}

const INVERSE_SQUARE_CONTEXTS = [
  { q: 'intensity', what: 'light from a lamp', source: 'lamp', unit: 'lux', dist: 'meters' },
  { q: 'strength', what: 'the signal from a radio beacon', source: 'beacon', unit: 'units', dist: 'kilometers' },
] as const;

/**
 * Tỉ lệ nghịch với BÌNH PHƯƠNG khoảng cách.
 *
 * d1 = g·a, d2 = g·b với a, b nguyên tố cùng nhau; I1 = b²·s nên I2 = a²·s
 * luôn nguyên.
 */
const proportionInverse: MathTemplate = {
  slug: 'pd-proportion-inverse',
  skill: 'ratios_rates_units',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const [a, b] = pick(rng, COPRIME_PAIRS);
    const g = pickInt(rng, 1, 4);
    const s = pickInt(rng, 1, 9);
    const d1 = g * a;
    const d2 = g * b;
    const I1 = b * b * s;
    const I2 = a * a * s;
    const K = I1 * d1 * d1;
    const ctx = pick(rng, INVERSE_SQUARE_CONTEXTS);
    const { choices, correctIndex } = buildChoices(
      rat(I2),
      [
        { value: rat(I1 * d1, d2), errorTag: 'forgot_square_root', note: 'Dùng tỉ lệ nghịch bậc nhất — quên bình phương khoảng cách.' },
        { value: rat(I1 * d2 * d2, d1 * d1), errorTag: 'inverted_fraction', note: 'Lật ngược tỉ số khoảng cách: xa hơn thì phải YẾU đi, không mạnh lên.' },
        { value: rat(I1 * d2, d1), errorTag: null, note: 'Coi đại lượng tỉ lệ THUẬN với khoảng cách — ngược hẳn với đề.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The ${ctx.q} of ${ctx.what} is inversely proportional to the square of the distance from the ${ctx.source}. At a distance of ${d1} ${ctx.dist}, the ${ctx.q} is ${I1} ${ctx.unit}. What is the ${ctx.q}, in ${ctx.unit}, at a distance of ${d2} ${ctx.dist}?`,
      choices,
      correctIndex,
      steps: [
        {
          text: 'Tỉ lệ nghịch với bình phương khoảng cách nghĩa là tích của đại lượng với bình phương khoảng cách không đổi.',
          expr: `k = ${I1} × ${d1}^2 = ${K}`,
        },
        { text: 'Chia hằng số ấy cho bình phương khoảng cách mới.', expr: `frac(${K},${d2}^2) = frac(${K},${d2 * d2}) = ${I2}` },
      ],
    };
  },
};

// ============================================================ Chương 5: tốc độ

/** Đổi đơn vị qua HAI bước: xu → bạc → vàng, hoặc kilolit → lit → phút → giờ. */
const conversionChain: MathTemplate = {
  slug: 'pd-conversion-chain',
  skill: 'ratios_rates_units',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    if (pick(rng, ['coins', 'pump'] as const) === 'coins') {
      const g = pickInt(rng, 2, 12);
      const s = pickInt(rng, 2, 20);
      const G = pickInt(rng, 2, 30);
      const N = G * g * s;
      return {
        format: 'grid_in',
        stem: `In a board game, 1 gold coin is worth ${g} silver coins, and 1 silver coin is worth ${s} bronze coins. A player exchanges ${N} bronze coins for gold coins. How many gold coins does the player receive?`,
        answer: rat(G),
        steps: [
          { text: `Đổi đồng sang bạc: cứ ${s} đồng được 1 bạc.`, expr: `${N} ÷ ${s} = ${N / s}` },
          { text: `Đổi bạc sang vàng: cứ ${g} bạc được 1 vàng.`, expr: `${N / s} ÷ ${g} = ${G}` },
        ],
      };
    }
    // q·60 chia hết cho 1000 với mọi q trong danh sách, nên số kilolit luôn nguyên.
    const q = pick(rng, [50, 100, 250, 500]);
    const H = pickInt(rng, 1, 12);
    const L = (q * 60 * H) / 1000;
    return {
      format: 'grid_in',
      stem: `A pump moves water at a constant rate of ${q} liters per minute. At this rate, how many hours will it take the pump to move ${L} kiloliters of water? (1 kiloliter = 1,000 liters)`,
      answer: rat(H),
      steps: [
        { text: 'Đổi kilolit sang lit.', expr: `${L} × 1000 = ${L * 1000}` },
        { text: 'Chia cho tốc độ để ra số phút.', expr: `${L * 1000} ÷ ${q} = ${(L * 1000) / q}` },
        { text: 'Đổi phút sang giờ.', expr: `${(L * 1000) / q} ÷ 60 = ${H}` },
      ],
    };
  },
};

function divisors(n: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= n; d += 1) if (n % d === 0) out.push(d);
  return out;
}

const WORK_CONTEXTS = [
  { A: 'pump A', B: 'pump B', both: 'pumps A and B', task: 'fill a tank', same: 'fill the same tank', again: 'fill the tank' },
  { A: 'printer A', B: 'printer B', both: 'printers A and B', task: 'print a batch of flyers', same: 'print the same batch', again: 'print the batch' },
  { A: 'crew A', B: 'crew B', both: 'crews A and B', task: 'paint a fence', same: 'paint the same fence', again: 'paint the fence' },
] as const;

/**
 * Hai vòi cùng chảy. Dựng ngược từ T: a = T + u, b = T + v với u·v = T² thì
 * 1/a + 1/b = 1/T đúng chính xác — mọi số đều nguyên.
 */
const rateCombinedWork: MathTemplate = {
  slug: 'pd-rate-combined-work',
  skill: 'ratios_rates_units',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    const T = pickInt(rng, 2, 12);
    const u = pick(rng, divisors(T * T));
    const v = (T * T) / u;
    const a = T + u;
    const b = T + v;
    const ctx = pick(rng, WORK_CONTEXTS);
    if (pick(rng, ['together', 'alone'] as const) === 'together') {
      return {
        format: 'grid_in',
        stem: `Working alone at a constant rate, ${ctx.A} can ${ctx.task} in ${a} hours. Working alone at a constant rate, ${ctx.B} can ${ctx.same} in ${b} hours. If both work together at these rates, how many hours will it take them to ${ctx.again}?`,
        answer: rat(T),
        steps: [
          { text: `Mỗi giờ ${ctx.A} làm được một phần ${a} công việc, ${ctx.B} làm được một phần ${b}; cùng làm thì cộng hai tốc độ.`, expr: `frac(1,${a}) + frac(1,${b}) = frac(${a + b},${a * b})` },
          { text: 'Thời gian là nghịch đảo của tốc độ chung.', expr: `frac(${a * b},${a + b}) = ${T}` },
        ],
      };
    }
    return {
      format: 'grid_in',
      stem: `Working together at constant rates, ${ctx.both} can ${ctx.task} in ${T} hours. Working alone, ${ctx.A} can ${ctx.again} in ${a} hours. How many hours would it take ${ctx.B}, working alone, to ${ctx.again}?`,
      answer: rat(b),
      steps: [
        { text: `Tốc độ của ${ctx.B} bằng tốc độ chung trừ tốc độ của ${ctx.A}.`, expr: `frac(1,${T}) - frac(1,${a}) = frac(${a - T},${a * T})` },
        { text: 'Thời gian là nghịch đảo của tốc độ ấy.', expr: `frac(${a * T},${a - T}) = ${b}` },
      ],
    };
  },
};

// ============================================================ Chương 7: biến đổi công thức

const SUM_CONTEXTS = [
  { Y: 'C', U: 'n', V: 'p', intro: (a: number, b: number) => `The total cost C, in dollars, of buying n notebooks and p pens is given by the equation C = ${a}n + ${b}p.` },
  { Y: 'S', U: 'g', V: 'k', intro: (a: number, b: number) => `In a video game, the score S earned by collecting g gems and k keys is given by the equation S = ${a}g + ${b}k.` },
] as const;

const QUOTIENT_CONTEXTS = [
  { Y: 'D', U: 'm', V: 'v', intro: (a: number) => `A lab uses the formula D = frac(${a}m,v) to compute a quantity D from positive measurements m and v.` },
  { Y: 'R', U: 'w', V: 'h', intro: (a: number) => `An engineer uses the formula R = frac(${a}w,h) to compute a rating R from positive measurements w and h.` },
] as const;

const PRODUCT_CONTEXTS = [
  { Y: 'F', U: 'L', V: 'W', intro: (a: number, b: number) => `A builder uses the equation F = ${a}(L + ${b}W) to estimate the length F of trim needed for a frame.` },
  { Y: 'T', U: 'h', V: 'r', intro: (a: number, b: number) => `A coach uses the equation T = ${a}(h + ${b}r) to plan the total training time T for a week.` },
] as const;

/** Rút một biến ra khỏi công thức — ba khuôn, mỗi nhiễu là một bước biến đổi sai. */
const isolateVariable: MathTemplate = {
  slug: 'pd-isolate-variable',
  skill: 'equivalent_expressions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 9);
    const b = pickInt(rng, 2, 9);
    const shape = pick(rng, ['sum', 'quotient', 'product'] as const);

    if (shape === 'sum') {
      const { Y, U, V, intro } = pick(rng, SUM_CONTEXTS);
      const { choices, correctIndex } = buildTextChoices(
        `${V} = frac(${Y} - ${a}${U},${b})`,
        [
          { display: `${V} = frac(${Y} + ${a}${U},${b})`, errorTag: 'sign_flip', note: `Chuyển ${a}${U} sang vế kia mà không đổi dấu.` },
          { display: `${V} = frac(${Y},${b}) - ${a}${U}`, errorTag: 'forgot_distribute', note: `Chỉ chia ${Y} cho ${b}, quên chia cả ${a}${U}.` },
          { display: `${V} = frac(${b},${Y} - ${a}${U})`, errorTag: 'inverted_fraction' },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `${intro(a, b)} Which of the following correctly expresses ${V} in terms of ${Y} and ${U}?`,
        choices,
        correctIndex,
        steps: [
          { text: `Trừ ${a}${U} ở hai vế.`, expr: `${Y} - ${a}${U} = ${b}${V}` },
          { text: `Chia hai vế cho ${b}.`, expr: `${V} = frac(${Y} - ${a}${U},${b})` },
        ],
      };
    }

    if (shape === 'quotient') {
      const { Y, U, V, intro } = pick(rng, QUOTIENT_CONTEXTS);
      const { choices, correctIndex } = buildTextChoices(
        `${V} = frac(${a}${U},${Y})`,
        [
          { display: `${V} = frac(${Y},${a}${U})`, errorTag: 'inverted_fraction' },
          { display: `${V} = ${a}${U}${Y}`, errorTag: null, note: `Nhân hai vế với ${Y} thay vì nhân với ${V} rồi chia cho ${Y}.` },
          { display: `${V} = frac(${a}${Y},${U})`, errorTag: 'solved_for_wrong_var', note: `Đổi chỗ ${U} và ${Y} — đây là cách rút ${U} chứ không phải ${V}.` },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `${intro(a)} Which of the following correctly expresses ${V} in terms of ${Y} and ${U}?`,
        choices,
        correctIndex,
        steps: [
          { text: `Nhân hai vế với ${V}.`, expr: `${Y}${V} = ${a}${U}` },
          { text: `Chia hai vế cho ${Y}.`, expr: `${V} = frac(${a}${U},${Y})` },
        ],
      };
    }

    const { Y, U, V, intro } = pick(rng, PRODUCT_CONTEXTS);
    const { choices, correctIndex } = buildTextChoices(
      `${U} = frac(${Y},${a}) - ${b}${V}`,
      [
        { display: `${U} = frac(${Y} - ${b}${V},${a})`, errorTag: 'forgot_distribute', note: `Quên rằng ${a} nhân cả ${b}${V} trong ngoặc.` },
        { display: `${U} = frac(${Y},${a}) + ${b}${V}`, errorTag: 'sign_flip' },
        { display: `${U} = ${a}${Y} - ${b}${V}`, errorTag: 'inverted_fraction', note: `Nhân với ${a} thay vì chia cho ${a}.` },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `${intro(a, b)} Which of the following correctly expresses ${U} in terms of ${Y} and ${V}?`,
      choices,
      correctIndex,
      steps: [
        { text: `Chia hai vế cho ${a}.`, expr: `frac(${Y},${a}) = ${U} + ${b}${V}` },
        { text: `Trừ ${b}${V} ở hai vế.`, expr: `${U} = frac(${Y},${a}) - ${b}${V}` },
      ],
    };
  },
};

// ============================================================ Chương 8: đồng nhất hệ số, khử mẫu

/** `(ax + b)(x + c) = ax² + kx + bc` — tìm hệ số giữa. */
const matchCoefEasy: MathTemplate = {
  slug: 'pd-match-coef-easy',
  skill: 'equivalent_expressions',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const a = pickInt(rng, 2, 6);
    const b = pickNonZeroInt(rng, -9, 9);
    const c = pickNonZeroInt(rng, -9, 9);
    const k = a * c + b;
    return {
      format: 'grid_in',
      stem: `The expression (${a}x${signedTerm(b)})(x${signedTerm(c)}) is equivalent to ${a}x^2 + kx${signedTerm(b * c)}, where k is a constant. What is the value of k?`,
      answer: rat(k),
      steps: [
        { text: 'Nhân từng số hạng của ngoặc đầu với từng số hạng của ngoặc sau.', expr: `${a}x^2${signedCoefTerm(a * c, 'x')}${signedCoefTerm(b, 'x')}${signedTerm(b * c)}` },
        { text: 'Gộp hai số hạng chứa x; hệ số của chúng chính là k.', expr: `k = ${a * c} + ${par(b)} = ${k}` },
      ],
    };
  },
};

/**
 * `mx(x + a) - k(x + b) = mx² + ex - f` đúng với MỌI x — tìm k.
 *
 * Hai vế là cùng một đa thức nên từng hệ số phải khớp; hằng số cho k ngay,
 * hệ số của x dùng để kiểm lại.
 */
const matchingCoefficients: MathTemplate = {
  slug: 'pd-matching-coefficients',
  skill: 'equivalent_expressions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const m = pickInt(rng, 2, 5);
    const k = pickInt(rng, 2, 9);
    const aRaw = pickInt(rng, 1, 9);
    // m·a = k thì hệ số của x triệt tiêu và nhiễu "chuyển nhầm vế" mất nghĩa.
    const a = m * aRaw === k ? aRaw + 1 : aRaw;
    const b = pickInt(rng, 2, 9);
    const e = m * a - k;
    const f = k * b;
    const { choices, correctIndex } = buildChoices(
      rat(k),
      [
        { value: rat(-k), errorTag: 'sign_flip' },
        { value: rat(f), errorTag: 'stopped_too_early', note: `${f} là hằng số -k·${b} đổi dấu; còn phải chia cho ${b}.` },
        { value: rat(m * a + e), errorTag: 'moved_term_wrong_side', note: `Từ ${m * a} - k = ${e}, chuyển ${e} sang nhầm vế nên ra k = ${m * a} + ${par(e)}.` },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The equation ${m}x(x + ${a}) - k(x + ${b}) = ${m}x^2${signedCoefTerm(e, 'x')} - ${f} is true for all values of x, where k is a constant. What is the value of k?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Khai triển vế trái.', expr: `${m}x^2 + ${m * a}x - kx - ${b}k` },
        { text: 'Đúng với mọi x nên hằng số ở hai vế phải bằng nhau.', expr: `-${b}k = -${f}` },
        { text: `Chia hai vế cho -${b}.`, expr: `k = ${k}` },
        { text: 'Kiểm lại bằng hệ số của x.', expr: `${m * a} - ${k} = ${e}` },
      ],
    };
  },
};

/**
 * Phương trình chứa ẩn ở mẫu có một nghiệm NGOẠI LAI.
 *
 * frac(x, x - a) + frac(c, x) = frac(a², x(x - a)) với c = -(a + r): khử mẫu
 * ra (x - a)(x - r) = 0, nhưng x = a làm mẫu bằng 0 nên chỉ còn x = r.
 */
const clearingDenominators: MathTemplate = {
  slug: 'pd-clearing-denominators',
  skill: 'nonlinear_equations',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const a = pickNonZeroInt(rng, -9, 9);
    let r = pickNonZeroInt(rng, -9, 9);
    // r = a thì không còn nghiệm nào; r = -a thì c = 0 và phân số thứ hai biến mất.
    if (r === a) r = a > 0 ? a + 1 : a - 1;
    if (r === -a) r = a > 0 ? -a - 1 : -a + 1;
    const c = -(a + r);
    const den = `x${signedTerm(-a)}`;
    const cAbs = Math.abs(c);
    const cTerm = `${c > 0 ? ' + ' : ' - '}frac(${cAbs},x)`;
    const [lo, hi] = a < r ? [a, r] : [r, a];
    const { choices, correctIndex } = buildTextChoices(
      `${r}`,
      [
        { display: `${a}`, errorTag: null, note: `x = ${a} làm mẫu số bằng 0 — đó là nghiệm ngoại lai phải loại, còn nghiệm thật thì bị bỏ.` },
        { display: `${lo} and ${hi}`, errorTag: null, note: `Giải đúng phương trình bậc hai nhưng quên loại x = ${a}, giá trị làm mẫu bằng 0.` },
        { display: `${-r}`, errorTag: 'sign_flip', note: 'Phân tích nhân tử đúng nhưng đọc nghiệm sai dấu.' },
      ],
      rng,
    );
    const cleared = `x^2${c > 0 ? ' + ' : ' - '}${cAbs === 1 ? '' : cAbs}(${den}) = ${a * a}`;
    return {
      format: 'mcq',
      stem: `What are all values of x that satisfy the equation frac(x,${den})${cTerm} = frac(${a * a},x(${den}))?`,
      choices,
      correctIndex,
      steps: [
        { text: `Mẫu chung là tích của x và ${den}; điều kiện là x khác 0 và khác ${a}.`, expr: `x ≠ 0, x ≠ ${a}` },
        { text: 'Nhân hai vế với mẫu chung để khử mẫu.', expr: cleared },
        { text: 'Khai triển và chuyển hết về một vế.', expr: `${quadraticSide(1, c, a * r)} = 0` },
        { text: 'Phân tích thành nhân tử.', expr: `(x${signedTerm(-a)})(x${signedTerm(-r)}) = 0` },
        { text: `x = ${a} làm mẫu bằng 0 nên bị loại; chỉ còn một nghiệm.`, expr: `x = ${r}` },
      ],
    };
  },
};

// ============================================================ Chương 9: hệ phương trình

/** Hệ số của y đối nhau sẵn — cộng hai phương trình là khử được y. */
const systemEliminationEasy: MathTemplate = {
  slug: 'pd-system-elimination-easy',
  skill: 'systems_linear_two_var',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const x0 = pickInt(rng, -6, 9);
    const y0 = pickInt(rng, -6, 9);
    const a = pickInt(rng, 1, 6);
    const d = pickInt(rng, 1, 6);
    const b = pickInt(rng, 1, 9);
    const c = a * x0 + b * y0;
    const e = d * x0 - b * y0;
    const ask = pick(rng, ['x', 'y'] as const);
    const steps: MathSolutionStep[] = [
      { text: 'Hệ số của y ở hai phương trình đối nhau: cộng vế theo vế để khử y.', expr: `${coefTerm(a + d)} = ${c + e}` },
      { text: `Chia hai vế cho ${a + d}.`, expr: `x = ${x0}` },
    ];
    if (ask === 'y') {
      steps.push({ text: 'Thay x vào phương trình đầu.', expr: `${a * x0}${signedCoefTerm(b, 'y')} = ${c}` });
      if (b !== 1) steps.push({ text: `Chuyển ${a * x0} sang vế phải.`, expr: `${coefTerm(b, 'y')} = ${c - a * x0}` });
      steps.push({ text: b === 1 ? `Chuyển ${a * x0} sang vế phải.` : `Chia hai vế cho ${b}.`, expr: `y = ${y0}` });
    }
    return {
      format: 'grid_in',
      stem: `If ${twoVarSide(a, b)} = ${c} and ${twoVarSide(d, -b)} = ${e}, what is the value of ${ask}?`,
      answer: rat(ask === 'x' ? x0 : y0),
      steps,
    };
  },
};

// ============================================================ Chương 10: bất phương trình

const flipOp = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' } as const;

/** `ax + b ⋚ c` với a dương — không đổi chiều. */
const inequalitySolveEasy: MathTemplate = {
  slug: 'pd-inequality-solve-easy',
  skill: 'linear_inequalities',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 9);
    const k = pickNonZeroInt(rng, -9, 9);
    const bb = pickNonZeroInt(rng, -12, 12);
    const c = a * k + bb;
    const op = pick(rng, ['<', '<=', '>', '>='] as const);
    const rev = flipOp[op];
    const wrongSign = fracOrInt(c + bb, a);
    const { choices, correctIndex } = buildTextChoices(
      `x ${op} ${k}`,
      [
        { display: `x ${op} ${wrongSign}`, errorTag: 'sign_flip', note: `Chuyển ${Math.abs(bb)} sang vế phải mà không đổi dấu.` },
        { display: `x ${op} ${a * k}`, errorTag: 'stopped_too_early', note: `Mới được ${a}x — còn phải chia hai vế cho ${a}.` },
        { display: `x ${rev} ${k}`, errorTag: null, note: `Chia cho số DƯƠNG ${a} thì giữ nguyên chiều bất đẳng thức.` },
        { display: `x ${rev} ${wrongSign}`, errorTag: null, note: 'Vừa sai dấu khi chuyển vế, vừa đổi chiều không cần thiết.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Which of the following is the solution to the inequality ${a}x${signedTerm(bb)} ${op} ${c}?`,
      choices,
      correctIndex,
      steps: [
        { text: `${bb > 0 ? 'Trừ' : 'Cộng'} ${Math.abs(bb)} ở hai vế.`, expr: `${a}x ${op} ${c - bb}` },
        { text: `Chia hai vế cho ${a}. Số dương nên giữ nguyên chiều.`, expr: `x ${op} ${k}` },
      ],
    };
  },
};

/**
 * Điểm nào thoả HỆ hai bất phương trình.
 *
 * Dựng ngược: chọn điểm đúng (p, q) rồi đặt hai đường biên cách nó g1, g2 đơn
 * vị theo phương đứng. Ba nhiễu được dựng để mỗi cái SAI đúng một cách có tên:
 * nằm trên cả hai đường (thoả bất phương trình đầu, trượt cái sau), nằm dưới
 * cả hai (trượt cái đầu), và nằm ngay trên đường biên của bất đẳng thức nghiêm
 * ngặt.
 */
const inequalitySystemRegion: MathTemplate = {
  slug: 'pd-inequality-system-region',
  skill: 'linear_inequalities',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const m1 = pickNonZeroInt(rng, -3, 3);
    const m2Raw = pickNonZeroInt(rng, -3, 3);
    const m2 = m2Raw === m1 ? -m1 : m2Raw;
    const p = pickInt(rng, -4, 4);
    const q = pickInt(rng, -6, 6);
    const b1 = q - m1 * p - pickInt(rng, 1, 4);
    const b2 = q - m2 * p + pickInt(rng, 1, 4);
    const L1 = (x: number) => m1 * x + b1;
    const L2 = (x: number) => m2 * x + b2;
    const strict = pick(rng, [1, 2] as const);
    const op1 = strict === 1 ? '>' : pick(rng, ['>', '>='] as const);
    const op2 = strict === 2 ? '<' : pick(rng, ['<', '<='] as const);

    const pt = (x: number, y: number) => `(${x}, ${y})`;
    const p1 = pickInt(rng, -4, 4);
    const p2 = pickInt(rng, -4, 4);
    const p3 = pickInt(rng, -4, 4);
    const above = Math.max(L1(p1), L2(p1)) + pickInt(rng, 1, 3);
    const below = Math.min(L1(p2), L2(p2)) - pickInt(rng, 1, 3);
    const boundary = strict === 1 ? L1(p3) : L2(p3);
    const { choices, correctIndex } = buildTextChoices(
      pt(p, q),
      [
        { display: pt(p1, above), errorTag: null, note: 'Điểm này thoả bất phương trình đầu nhưng nằm phía trên đường thứ hai, nên trượt bất phương trình sau.' },
        { display: pt(p2, below), errorTag: null, note: 'Điểm này thoả bất phương trình sau nhưng nằm dưới đường thứ nhất, nên trượt bất phương trình đầu.' },
        { display: pt(p3, boundary), errorTag: null, note: 'Điểm này nằm ĐÚNG trên đường biên, mà bất đẳng thức ở đó là nghiêm ngặt — điểm trên biên không được tính.' },
        { display: pt(p, L2(p) + 1), errorTag: null, note: 'Điểm này nằm phía trên đường thứ hai, nên trượt bất phương trình sau.' },
        { display: pt(p, L1(p) - 1), errorTag: null, note: 'Điểm này nằm dưới đường thứ nhất, nên trượt bất phương trình đầu.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Which of the following points (x, y) satisfies the system of inequalities y ${op1} ${linearSide(m1, b1)} and y ${op2} ${linearSide(m2, b2)}?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Thay từng điểm vào CẢ HAI bất phương trình; điểm đúng phải thoả cả hai. Với điểm đúng, bất phương trình đầu:', expr: `${q} ${op1} ${L1(p)}` },
        { text: 'Bất phương trình sau:', expr: `${q} ${op2} ${L2(p)}` },
      ],
    };
  },
};

// ============================================================ Chương 11: bài toán có lời

const SIBLINGS = ['Maya', 'Lucia', 'Hana', 'Zara'] as const;

/** Tuổi hai chị em, hoặc tổng các số nguyên liên tiếp. */
const wordAgeOrConsecutive: MathTemplate = {
  slug: 'pd-word-age-or-consecutive',
  skill: 'linear_equations_one_var',
  difficulty: 'hard',
  format: 'grid_in',
  build: (rng) => {
    if (pick(rng, ['age', 'consecutive'] as const) === 'age') {
      // mB + y = n(B + y) ⇔ (m - n)B = (n - 1)y. Đặt B = (n-1)t, y = (m-n)t là khớp ngay.
      const n = pick(rng, [2, 3]);
      const m = n + pickInt(rng, 1, 3);
      const t = pickInt(rng, 1, 6);
      const B = (n - 1) * t;
      const y = (m - n) * t;
      const name = pick(rng, SIBLINGS);
      const askSister = pick(rng, [true, false]);
      const steps: MathSolutionStep[] = [
        { text: `Gọi tuổi hiện nay của em trai là b; tuổi của ${name} là ${m}b. Sau ${y} năm cả hai cùng thêm ${y} tuổi.`, expr: `${m}b + ${y} = ${n}(b + ${y})` },
      ];
      if (m - n !== 1) steps.push({ text: 'Khai triển rồi gom b về một vế.', expr: `${m - n}b = ${(n - 1) * y}` });
      steps.push({ text: m - n === 1 ? 'Khai triển rồi gom b về một vế.' : `Chia hai vế cho ${m - n}.`, expr: `b = ${B}` });
      if (askSister) steps.push({ text: `Đề hỏi tuổi của ${name}, gấp ${m} lần.`, expr: `${m} × ${B} = ${m * B}` });
      return {
        format: 'grid_in',
        stem: `${name} is ${m} times as old as her brother. In ${y} years, ${name} will be ${n} times as old as her brother. How old is ${askSister ? name : 'her brother'} now, in years?`,
        answer: rat(askSister ? m * B : B),
        steps,
      };
    }
    const kind = pick(rng, ['odd', 'even', 'plain'] as const);
    const gap = kind === 'plain' ? 1 : 2;
    const k = pickInt(rng, 3, 7);
    const first = kind === 'odd' ? 2 * pickInt(rng, -5, 20) + 1 : kind === 'even' ? 2 * pickInt(rng, -5, 20) : pickInt(rng, -10, 40);
    const extra = (gap * k * (k - 1)) / 2;
    const S = k * first + extra;
    const last = first + gap * (k - 1);
    const askGreatest = pick(rng, [true, false]);
    const label = kind === 'plain' ? 'integers' : `${kind} integers`;
    return {
      format: 'grid_in',
      stem: `The sum of ${k} consecutive ${label} is ${S}. What is the ${askGreatest ? 'greatest' : 'least'} of these integers?`,
      answer: rat(askGreatest ? last : first),
      steps: [
        { text: `Gọi số nhỏ nhất là n; các số sau lần lượt hơn nhau ${gap}. Cộng ${k} số lại.`, expr: `${k}n + ${extra} = ${S}` },
        { text: `Trừ ${extra} rồi chia cho ${k}.`, expr: `n = ${first}` },
        ...(askGreatest ? [{ text: `Số lớn nhất hơn số nhỏ nhất ${gap * (k - 1)}.`, expr: `${first} + ${gap * (k - 1)} = ${last}` }] : []),
      ],
    };
  },
};

// ============================================================ Chương 12: đường thẳng

/** Đường thẳng vuông góc qua một điểm — hỏi tung độ gốc. */
const perpendicularLine: MathTemplate = {
  slug: 'pd-perpendicular-line',
  skill: 'linear_functions',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const a = pickNonZeroInt(rng, -6, 6);
    const bRaw = pickInt(rng, 1, 6);
    // |a| = b làm hệ số góc thành ±1, và nhiễu "quên nghịch đảo" trùng đáp án.
    const b = bRaw === Math.abs(a) ? (bRaw % 6) + 1 : bRaw;
    const c = pickNonZeroInt(rng, -20, 20);
    const s = pickNonZeroInt(rng, -3, 3);
    const p = a * s;
    const q = pickInt(rng, -9, 9);
    const answer = q - b * s;
    const { choices, correctIndex } = buildChoices(
      rat(answer),
      [
        { value: rat(q * b + a * a * s, b), errorTag: null, note: 'Dùng lại hệ số góc của đường đã cho — đó là đường SONG SONG, không phải vuông góc.' },
        { value: rat(q + b * s), errorTag: 'sign_flip', note: 'Lấy nghịch đảo nhưng quên đổi dấu hệ số góc.' },
        { value: rat(q * b - a * a * s, b), errorTag: null, note: 'Đổi dấu hệ số góc nhưng quên lấy nghịch đảo.' },
      ],
      rng,
    );
    const slope2 = fracOrInt(b, a);
    return {
      format: 'mcq',
      stem: `In the xy-plane, line ℓ passes through the point (${p}, ${q}) and is perpendicular to the line with equation ${twoVarSide(a, b)} = ${c}. What is the y-coordinate of the y-intercept of line ℓ?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Đưa phương trình đã cho về dạng y = mx + b để đọc hệ số góc.', expr: `m_1 = ${fracOrInt(-a, b)}` },
        { text: 'Hai đường vuông góc có tích hệ số góc bằng -1: lấy nghịch đảo rồi đổi dấu.', expr: `m_2 = ${slope2}` },
        { text: 'Thay điểm đã cho vào y = mx + c để tìm tung độ gốc c.', expr: `${q} = ${slope2} × ${par(p)} + c` },
        { text: 'Giải ra c.', expr: `c = ${q} - ${par(b * s)} = ${answer}` },
      ],
    };
  },
};

// ============================================================ Chương 13: diễn giải mô hình

const ASSETS = ['used car', 'delivery van', 'laptop', 'tractor'] as const;

/**
 * Diễn giải hệ số khi đơn vị trong mô hình KHÁC đơn vị trong câu hỏi, hoặc
 * diễn giải tung độ gốc của một phương trình dạng chuẩn.
 */
const modelInterpretHard: MathTemplate = {
  slug: 'pd-model-interpret-hard',
  skill: 'linear_functions',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    if (pick(rng, ['units', 'intercept'] as const) === 'units') {
      const b = 10 * pickInt(rng, 5, 40);
      const life = pickInt(rng, 3, 8);
      // a > 12b·life nên giá trị luôn dương trong miền đã nêu; và a - 12b ≥ 24b nên
      // nhiễu "giá trị sau 12 tháng" không bao giờ trùng đáp án.
      const a = 12 * b * life + 10 * pickInt(rng, 1, 99);
      const thing = pick(rng, ASSETS);
      const { choices, correctIndex } = buildTextChoices(
        `The value decreases by $${12 * b} each year.`,
        [
          { display: `The value decreases by $${b} each year.`, errorTag: 'dropped_unit_conversion', note: `${b} là lượng giảm mỗi THÁNG, vì t đo bằng tháng.` },
          { display: `The value decreases by $${a - 12 * b} each year.`, errorTag: null, note: 'Đây là GIÁ TRỊ còn lại sau 12 tháng, không phải lượng giảm.' },
          { display: `The value increases by $${12 * b} each year.`, errorTag: 'sign_flip', note: 'Hệ số của t mang dấu trừ, nên giá trị giảm chứ không tăng.' },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `The equation V = ${a} - ${b}t models the value V, in dollars, of a ${thing} t months after it was purchased, for 0 <= t <= ${12 * life}. Which of the following statements is true according to the model?`,
        choices,
        correctIndex,
        steps: [
          { text: `Hệ số của t cho biết mỗi tháng giá trị giảm ${b} đô la — t đo bằng THÁNG, không phải năm.`, expr: `-${b}` },
          { text: 'Một năm có 12 tháng.', expr: `12 × ${b} = ${12 * b}` },
        ],
      };
    }
    const p = pickInt(rng, 2, 9);
    const qRaw = pickInt(rng, 2, 9);
    const q = qRaw === p ? (p === 9 ? 2 : p + 1) : qRaw;
    const w = pickInt(rng, 2, 12);
    const T = p * q * w;
    const { choices, correctIndex } = buildTextChoices(
      `If the store sold no small boxes, it sold ${T / q} large boxes.`,
      [
        { display: `If the store sold no large boxes, it sold ${T / p} small boxes.`, errorTag: 'solved_for_wrong_var', note: 'Đây là giao điểm với trục x, không phải trục y.' },
        { display: `If the store sold no small boxes, it sold ${T / p} large boxes.`, errorTag: null, note: `Chia tổng tiền cho giá hộp nhỏ ${p} — hộp lớn có giá ${q}.` },
        { display: `Each large box costs $${q}.`, errorTag: 'swapped_slope_intercept', note: 'Đây là hệ số của y, không phải tung độ gốc.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A store sells small gift boxes for $${p} each and large gift boxes for $${q} each. On one day, the store's revenue from selling x small boxes and y large boxes was $${T}, as modeled by the equation ${p}x + ${q}y = ${T}. If this equation is graphed in the xy-plane, which of the following is the best interpretation of the y-intercept of the graph?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Tung độ gốc là điểm có x = 0, tức là cửa hàng không bán hộp nhỏ nào.', expr: `${q}y = ${T}` },
        { text: `Chia cho giá hộp lớn ${q}.`, expr: `y = ${T / q}` },
      ],
    };
  },
};

// ============================================================ Hai dạng thêm

/** Giao điểm với trục x của đường thẳng qua hai điểm. */
const extraXIntercept: MathTemplate = {
  slug: 'pd-a-extra-1',
  skill: 'linear_equations_two_var',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    // y = (s/r)(x - X): chọn giao điểm X và độ dốc trước, rồi rải hai điểm trên đường.
    const r = pickInt(rng, 1, 4);
    const s = pickNonZeroInt(rng, -6, 6);
    const X = pickInt(rng, -9, 9);
    const t1 = pickNonZeroInt(rng, -3, 3);
    const t2Raw = pickNonZeroInt(rng, -3, 3);
    const t2 = t2Raw === t1 ? -t1 : t2Raw;
    const [x1, y1] = [X + r * t1, s * t1];
    const [x2, y2] = [X + r * t2, s * t2];
    const slope = fracOrInt(s, r);
    const slopeTerm = s > 0 ? ` + ${slope}` : ` - ${fracOrInt(-s, r)}`;
    return {
      format: 'grid_in',
      stem: `A line in the xy-plane passes through the points (${x1}, ${y1}) and (${x2}, ${y2}). What is the x-coordinate of the point where the line crosses the x-axis?`,
      answer: rat(X),
      steps: [
        { text: 'Tính hệ số góc từ hai điểm.', expr: `m = frac(${y2} - ${par(y1)},${x2} - ${par(x1)}) = ${slope}` },
        { text: 'Giao với trục x khi y = 0. Viết phương trình qua điểm đầu rồi cho y = 0.', expr: `0 = ${y1}${slopeTerm}(x${signedTerm(-x1)})` },
        { text: 'Giải ra x.', expr: `x = ${X}` },
      ],
    };
  },
};

/** Luỹ thừa có căn: frac(x^a·sqrt(x^c), x^b) hoặc căn nằm dưới mẫu. */
const extraRadicalPower: MathTemplate = {
  slug: 'pd-a-extra-2',
  skill: 'equivalent_expressions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 9);
    const b = pickInt(rng, 2, 7);
    const c = pick(rng, [1, 3, 5]);
    const inTop = pick(rng, [true, false]);
    const sigma = inTop ? 1 : -1;
    const sq = c === 1 ? 'sqrt(x)' : `sqrt(x^${c})`;
    const expr = inTop ? `frac(x^${a} ${sq},x^${b})` : `frac(x^${a},x^${b} ${sq})`;
    // Số mũ nhân đôi để luôn làm việc với số nguyên: E = (2a - 2b + σc) / 2.
    const correct = powX(2 * a - 2 * b + sigma * c, 2);
    const { choices, correctIndex } = buildTextChoices(
      correct,
      [
        { display: powX(2 * a + 2 * b + sigma * c, 2), errorTag: 'sign_flip', note: `Chia cho x mũ ${b} thì TRỪ số mũ, không cộng.` },
        { display: powX(a - b + sigma * 2 * c, 1), errorTag: null, note: 'Căn bậc hai ứng với số mũ 1/2, không phải nhân đôi số mũ.' },
        { display: powX(a - b + sigma * c, 1), errorTag: 'forgot_square_root', note: 'Bỏ qua dấu căn, coi như không có căn bậc hai.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `For x > 0, which of the following is equivalent to ${expr}?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Căn bậc hai là luỹ thừa với số mũ một phần hai.', expr: `${sq} = ${powX(c, 2)}` },
        {
          text: 'Nhân thì cộng số mũ, chia thì trừ số mũ.',
          expr: inTop ? `x^(${a} + ${c}/2 - ${b}) = ${correct}` : `x^(${a} - ${b} - ${c}/2) = ${correct}`,
        },
      ],
    };
  },
};

export const PANDA_A_TEMPLATES: readonly MathTemplate[] = [
  simplifySqrt,
  fractionalExponent,
  exponentSolveHard,
  simpleInterest,
  compoundInterest,
  linearVsExp,
  expGrowthModelHard,
  proportionInverse,
  conversionChain,
  rateCombinedWork,
  isolateVariable,
  matchCoefEasy,
  matchingCoefficients,
  clearingDenominators,
  systemEliminationEasy,
  inequalitySolveEasy,
  inequalitySystemRegion,
  wordAgeOrConsecutive,
  perpendicularLine,
  modelInterpretHard,
  extraXIntercept,
  extraRadicalPower,
];
