import { buildChoices, buildTextChoices } from '../choices';
import { coefTerm, pick, pickInt, pickNonZeroInt, quadraticSide, signedCoefTerm, signedTerm } from '../authoring';
import { formatValueMath, rat } from '@/lib/math/value';
import type { MathErrorTag, MathTemplate } from '@/lib/math/types';

/**
 * Ba template của domain Advanced Math — cùng tỉ trọng ~35% với Algebra, nên
 * mỗi kỹ năng ở đây gánh nhiều câu hơn hẳn một kỹ năng của hai domain kia.
 */

/**
 * Khai triển bình phương của một nhị thức.
 *
 * Lựa chọn ở đây là BIỂU THỨC chứ không phải số, nên dùng `buildTextChoices`:
 * chống trùng theo chuỗi hiển thị, và template phải tự bảo đảm ba nhiễu khác
 * nhau — không có "số cạnh đáp án" nào để bù vào như với câu hỏi số.
 *
 * Ba nhiễu là ba cách hỏng khác nhau của cùng một phép khai triển: mất hẳn số
 * hạng giữa, số hạng giữa quên nhân đôi, và số hạng giữa sai dấu.
 */
const expandBinomialSquare: MathTemplate = {
  slug: 'adv-expand-binomial-square',
  skill: 'equivalent_expressions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const p = pickInt(rng, 2, 12);
    const q = pickNonZeroInt(rng, -12, 12);

    const square = p * p;
    const middle = 2 * p * q;
    const constant = q * q;

    const { choices, correctIndex } = buildTextChoices(
      quadraticSide(square, middle, constant),
      [
        {
          display: quadraticSide(square, 0, constant),
          errorTag: 'expanded_without_middle_term',
        },
        {
          display: quadraticSide(square, p * q, constant),
          errorTag: null,
          note: `Số hạng giữa là 2·${p}·(${q}) = ${middle}, phải nhân đôi vì có hai tích chéo giống nhau.`,
        },
        {
          display: quadraticSide(square, -middle, constant),
          errorTag: 'sign_flip',
        },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem: `Which of the following expressions is equivalent to (${p}x${signedTerm(q)})^2?`,
      choices,
      correctIndex,
      steps: [
        {
          text: 'Bình phương một tổng là nhân hai ngoặc giống nhau, không phải bình phương từng số hạng.',
          expr: `(${p}x${signedTerm(q)})^2 = (${p}x${signedTerm(q)})(${p}x${signedTerm(q)})`,
        },
        {
          text: 'Nhân từng cặp: hai tích chéo giống hệt nhau nên cộng lại thành gấp đôi.',
          expr: `${square}x^2 + (${p} × ${q})x + (${q} × ${p})x + ${constant}`,
        },
        {
          text: 'Gộp hai tích chéo lại.',
          expr: `${quadraticSide(square, middle, constant)}`,
        },
      ],
    };
  },
};

/**
 * Phương trình bậc hai, hỏi nghiệm dương.
 *
 * HAI NGHIỆM ĐƯỢC CHỌN TRƯỚC, một dương một âm, rồi mới suy ra hệ số. Nhờ vậy
 * phương trình luôn phân tích được thành nhân tử với hệ số nguyên, và luôn có
 * ĐÚNG MỘT nghiệm dương nên câu hỏi không nhập nhằng.
 */
const quadraticPositiveRoot: MathTemplate = {
  slug: 'adv-quadratic-positive-root',
  skill: 'nonlinear_equations',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const positive = pickInt(rng, 2, 20);
    const negative = -pickInt(rng, 1, 20);

    const b = -(positive + negative);
    const c = positive * negative;

    return {
      format: 'grid_in',
      stem:
        `The equation ${quadraticSide(1, b, c)} = 0 has two solutions. ` +
        'What is the value of the positive solution?',
      answer: rat(positive),
      steps: [
        {
          text: `Tìm hai số có TÍCH bằng ${c} và TỔNG bằng ${b}. Tích âm nghĩa là hai số trái dấu.`,
          expr: `${positive} × (${negative}) = ${c},   ${positive} + (${negative}) = ${-b}`,
        },
        {
          text: 'Từ hai số đó viết ra dạng nhân tử.',
          expr: `(x${signedTerm(-positive)})(x${signedTerm(-negative)}) = 0`,
        },
        {
          text: 'Tích bằng 0 thì một trong hai thừa số bằng 0.',
          expr: `x = ${positive}   hoặc   x = ${negative}`,
        },
        {
          text: `Đề hỏi nghiệm DƯƠNG, nên bỏ ${negative} và lấy ${positive}.`,
        },
      ],
    };
  },
};

/**
 * Hoành độ đỉnh parabol, cho ở dạng nhân tử.
 *
 * Cho dạng NHÂN TỬ chứ không cho dạng khai triển là có chủ ý: ở dạng này đỉnh
 * nằm đúng giữa hai nghiệm, nên câu hỏi kiểm tra hiểu tính đối xứng của parabol
 * chứ không phải kiểm tra thuộc công thức −b/2a.
 */
const parabolaVertexFromRoots: MathTemplate = {
  slug: 'adv-parabola-vertex-from-roots',
  skill: 'nonlinear_functions',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const lead = pickNonZeroInt(rng, -4, 4);
    const first = pickNonZeroInt(rng, -9, 9);

    // Bốc KHOẢNG CÁCH giữa hai nghiệm thay vì bốc thẳng nghiệm thứ hai. Bốc
    // thẳng rồi vá từng ràng buộc một là cách đã hỏng thật: vá "tổng khác 0"
    // bằng cách cộng 1 vào nghiệm thứ hai có lúc đẩy nó thành 0, và `(x - 0)`
    // in ra thành "(x)" — một cái ngoặc rỗng giữa đề bài.
    //
    // Ba ràng buộc, tất cả đều bảo đảm bằng cấu trúc:
    //   hai nghiệm khác nhau  — khoảng cách luôn ≥ 1
    //   nghiệm thứ hai khác 0 — rơi trúng 0 thì lật sang phía bên kia
    //   tổng khác 0           — đỉnh ở x = 0 làm nhiễu "đổi dấu" trùng đáp án
    let gap = pickInt(rng, 1, 12);
    if (2 * first + gap === 0) gap += 1;
    let second = first + gap;
    if (second === 0) second = first - gap;

    const sum = first + second;
    const answer = rat(sum, 2);

    const { choices, correctIndex } = buildChoices(
      answer,
      [
        {
          value: rat(sum),
          errorTag: 'stopped_too_early',
          note: 'Đây mới là tổng hai nghiệm. Đỉnh nằm ở TRUNG ĐIỂM, nên còn phải chia đôi.',
        },
        { value: rat(-sum, 2), errorTag: 'sign_flip' },
        {
          value: rat(first * second),
          errorTag: null,
          note: 'Đây là TÍCH hai nghiệm. Trung điểm dùng tổng, không dùng tích.',
        },
      ],
      rng,
    );

    const leadText = lead === 1 ? '' : lead === -1 ? '-' : String(lead);

    return {
      format: 'mcq',
      stem:
        `The function f is defined by f(x) = ${leadText}(x${signedTerm(-first)})(x${signedTerm(-second)}). ` +
        'What is the x-coordinate of the vertex of the graph of y = f(x) in the xy-plane?',
      choices,
      correctIndex,
      steps: [
        {
          text: 'Cho f(x) = 0 để tìm hai giao điểm với trục hoành.',
          expr: `x = ${first}   hoặc   x = ${second}`,
        },
        {
          text: 'Parabol đối xứng, nên đỉnh nằm chính giữa hai nghiệm — lấy trung bình cộng.',
          expr: `x = frac(${first}${signedTerm(second)},2) = frac(${sum},2)`,
        },
        {
          text:
            `Hệ số ${lead} phía trước chỉ kéo giãn và lật parabol, KHÔNG làm dịch trục đối xứng, ` +
            'nên nó không tham gia phép tính này.',
        },
      ],
    };
  },
};


const foilBinomialProduct: MathTemplate = {
  slug: 'adv-foil-binomial-product',
  skill: 'equivalent_expressions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const p = pickInt(rng, 2, 6);
    let r = pickInt(rng, 2, 6);
    if (p === 2 && r === 2) r = 3; // tránh p+r trùng p*r (chỉ xảy ra khi p=r=2)
    const q = pickNonZeroInt(rng, -9, 9);
    const s = pickNonZeroInt(rng, -9, 9);

    const a = p * r; // hệ số x^2 đúng
    const bCorrect = p * s + q * r; // hệ số x đúng (tổng hai tích chéo)
    const cConst = q * s; // hằng số đúng

    const stem = `Which of the following is equivalent to (${coefTerm(p, 'x')}${signedTerm(q)})(${coefTerm(r, 'x')}${signedTerm(s)})?`;

    const correct = quadraticSide(a, bCorrect, cConst);
    const distractors: Array<{ display: string; errorTag: MathErrorTag | null; note?: string }> = [
      {
        display: quadraticSide(a, p * s, cConst),
        errorTag: 'forgot_distribute',
        note: 'Quên cộng tích chéo còn lại (chỉ giữ p·s, bỏ mất q·r).',
      },
      {
        display: quadraticSide(a, p * s - q * r, cConst),
        errorTag: 'sign_flip',
        note: 'Trừ nhầm dấu của một tích chéo thay vì cộng.',
      },
      {
        display: quadraticSide(p + r, bCorrect, cConst),
        errorTag: null,
        note: 'Cộng p và r thay vì nhân để ra hệ số bậc hai (nhân sai hệ số dẫn đầu).',
      },
    ];

    const { choices, correctIndex } = buildTextChoices(correct, distractors, rng);

    return {
      format: 'mcq',
      stem,
      choices,
      correctIndex,
      steps: [
        {
          text: 'Nhân từng cặp hạng tử theo quy tắc FOIL: đầu-đầu, đầu-cuối, ngoài-trong, cuối-cuối.',
          expr: `${coefTerm(a, 'x^2')}${signedCoefTerm(p * s, 'x')}${signedCoefTerm(q * r, 'x')}${signedTerm(cConst)}`,
        },
        {
          text: 'Cộng hai hạng tử bậc nhất cùng loại lại với nhau để được dạng chuẩn.',
          expr: correct,
        },
      ],
    };
  },
};


const linearQuadraticSystemSum: MathTemplate = {
  slug: 'adv-system-linear-quadratic-sum',
  skill: 'nonlinear_equations',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    // CHỌN GIAO ĐIỂM TRƯỚC: x1, x2 là hai nghiệm x của hệ, chọn trước rồi suy ngược hệ số.
    const x1 = pickInt(rng, -4, 4);
    const d = pickNonZeroInt(rng, 1, 3); // khoảng cách giữa hai nghiệm, luôn khác 0 -> x1 != x2 chắc chắn
    const x2 = x1 + d;
    const k = pickNonZeroInt(rng, -5, 5); // hệ số tự do của đường thẳng y = x + k

    // Muốn x^2 + bx + c = x + k  <=>  x^2 + (b-1)x + (c-k) = 0  có đúng hai nghiệm x1, x2:
    //   tổng nghiệm: -(b-1) = x1 + x2  =>  b = 1 - (x1 + x2)
    //   tích nghiệm: (c-k) = x1 * x2   =>  c = k + x1 * x2
    const b = 1 - (x1 + x2);
    const c = k + x1 * x2;

    const sumX = x1 + x2;
    const sumY = sumX + 2 * k; // (x1+k) + (x2+k)

    const line = `y = x${signedTerm(k)}`;
    const quad = `y = ${quadraticSide(1, b, c)}`;
    const stem = `${line}\n${quad}\n\nIn the system of equations above, (x_1, y_1) and (x_2, y_2) are the two distinct solutions. What is the value of y_1 + y_2?`;

    const { choices, correctIndex } = buildChoices(
      rat(sumY),
      [
        { value: rat(sumX), errorTag: 'solved_for_wrong_var', note: 'Tính tổng hai nghiệm x rồi dừng lại, quên cộng thêm k để ra tung độ y.' },
        { value: rat(sumX - 2 * k), errorTag: 'sign_flip', note: 'Cộng nhầm dấu của k khi chuyển từ x sang y.' },
        { value: rat(b + 2 * k), errorTag: 'moved_term_wrong_side', note: 'Lấy nhầm hệ số b làm tổng hai nghiệm x thay vì 1 - b.' },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem,
      choices,
      correctIndex,
      steps: [
        {
          text: 'Thay y từ phương trình đường thẳng vào phương trình parabol để đưa hệ về một phương trình bậc hai theo x.',
          expr: `${quadraticSide(1, b, c)} = x${signedTerm(k)}`,
        },
        {
          text: 'Chuyển tất cả các số hạng về một vế, đưa phương trình về dạng chuẩn.',
          expr: `${quadraticSide(1, b - 1, c - k)} = 0`,
        },
        {
          text: 'Áp dụng định lý Vi-ét: tổng hai nghiệm x bằng đối của hệ số bậc nhất chia hệ số bậc hai.',
          expr: `x_1 + x_2 = ${sumX}`,
        },
        {
          text: 'Mỗi nghiệm y bằng nghiệm x tương ứng cộng thêm k, nên tổng hai tung độ bằng tổng hai hoành độ cộng 2k.',
          expr: `y_1 + y_2 = (x_1 + x_2)${signedTerm(2 * k)} = ${sumY}`,
        },
      ],
    };
  },
};


const exponentialGrowthValue: MathTemplate = {
  slug: 'adv-exponential-growth-value',
  skill: 'nonlinear_functions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    // Ba bối cảnh tăng trưởng/phân rã mũ với cơ số hữu tỉ đơn giản: 2 (nhân đôi),
    // 3 (nhân ba), 1/2 (giảm một nửa) — đúng như đề bài yêu cầu.
    const scenarios = [
      { bNum: 2, bDen: 1, timeUnit: 'hour', desc: 'a population of bacteria doubles every hour' },
      { bNum: 3, bDen: 1, timeUnit: 'year', desc: 'a population of insects triples every year' },
      { bNum: 1, bDen: 2, timeUnit: 'day', desc: 'a sample of a radioactive isotope is cut in half every day' },
    ];
    const scenario = pick(rng, scenarios);
    // Dải rộng để 200 hạt ra đủ đa dạng câu hỏi (>100 câu khác nhau) — dải hẹp
    // trước đó (k: 2-9, t: 2-4) chỉ có tối đa 64 tổ hợp, 200 hạt bốc lặp lại rất nhanh.
    const k = pickInt(rng, 2, 30);
    // t >= 2 để tránh trường hợp suy biến t = 1 (khi đó "nhân hệ số với t" và
    // "luỹ thừa bậc t" trùng giá trị); giới hạn nhỏ hơn cho cơ số 3 để số không quá lớn.
    const t = scenario.bNum === 3 ? pickInt(rng, 2, 3) : pickInt(rng, 2, 5);

    // Dựng P0 TỪ t và b sao cho kết quả f(t) = P0 * (bNum/bDen)^t luôn là SỐ NGUYÊN sạch:
    // P0 = k * bDen^t  =>  f(t) = k * bNum^t (nguyên).
    const P0 = k * Math.pow(scenario.bDen, t);
    const answerNum = k * Math.pow(scenario.bNum, t);
    const answer = rat(answerNum, 1);

    const bBase = scenario.bDen === 1 ? `${scenario.bNum}` : `frac(${scenario.bNum},${scenario.bDen})`;
    const stem = `A quantity's value is modeled by the function f(t) = ${P0} * ${bBase}^t, where t is the number of ${scenario.timeUnit}s elapsed since t = 0. This models a situation in which ${scenario.desc}. What is f(${t})?`;

    // Nhiễu 1: nhầm tăng trưởng mũ thành tăng trưởng tuyến tính (nhân hệ số với t thay vì luỹ thừa t).
    const linearMisuse = rat(P0 * scenario.bNum * t, scenario.bDen);
    // Nhiễu 2: lệch số mũ đi 1 (dùng t + 1 thay vì t).
    const offByOne = rat(P0 * Math.pow(scenario.bNum, t + 1), Math.pow(scenario.bDen, t + 1));
    // Nhiễu 3: quên nhân với giá trị ban đầu P0 (coi như P0 = 1).
    const forgotP0 = rat(Math.pow(scenario.bNum, t), Math.pow(scenario.bDen, t));

    const { choices, correctIndex } = buildChoices(
      answer,
      [
        { value: linearMisuse, errorTag: null, note: 'Nhân hệ số tăng trưởng với t thay vì tính luỹ thừa bậc t (nhầm mô hình tuyến tính với mô hình mũ).' },
        { value: offByOne, errorTag: 'off_by_one', note: 'Dùng số mũ t + 1 thay vì t.' },
        { value: forgotP0, errorTag: null, note: 'Quên nhân với giá trị ban đầu P0, chỉ tính luỹ thừa của hệ số tăng trưởng.' },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem,
      choices,
      correctIndex,
      steps: [
        { text: 'Thay giá trị t đã cho vào công thức hàm số mũ.', expr: `f(${t}) = ${P0} * ${bBase}^${t}` },
        { text: 'Tính luỹ thừa của hệ số tăng trưởng rồi nhân với giá trị ban đầu để ra kết quả cuối cùng.', expr: `f(${t}) = ${formatValueMath(answer)}` },
      ],
    };
  },
};

export const ADVANCED_TEMPLATES: MathTemplate[] = [
  expandBinomialSquare,
  quadraticPositiveRoot,
  parabolaVertexFromRoots,
  foilBinomialProduct,
  linearQuadraticSystemSum,
  exponentialGrowthValue,
];
