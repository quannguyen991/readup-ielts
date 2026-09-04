import { buildChoices } from '../choices';
import {
  coefTerm,
  fracOrInt,
  linearSide,
  pickInt,
  pickNonZeroInt,
  signedTerm,
  twoVarSide,
} from '../authoring';
import { rat } from '@/lib/math/value';
import type { MathSolutionStep, MathTemplate } from '@/lib/math/types';

/**
 * Năm template của domain Algebra — chiếm ~35% số câu phần Math của đề thật,
 * cùng tỉ trọng với Advanced Math và gấp đôi hai domain còn lại.
 */

/**
 * Giải phương trình bậc nhất một ẩn có ngoặc: `a(x + b) = cx + d`.
 *
 * NGHIỆM ĐƯỢC CHỌN TRƯỚC, rồi mới suy ra `d`. Làm ngược lại — bốc bốn hệ số rồi
 * giải — thì nghiệm ra phân số xấu như 47/13, mà đề thi thật không hỏi kiểu đó.
 */
const linearEquationDistribute: MathTemplate = {
  slug: 'alg-linear-one-var-distribute',
  skill: 'linear_equations_one_var',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 7);
    const cRaw = pickInt(rng, 2, 9);
    // c ≠ a, nếu không thì hệ số x triệt tiêu và phương trình hết ẩn. Đẩy lên
    // một đơn vị thay vì bốc lại, để không bao giờ phải thử lần hai.
    const c = cRaw === a ? (a === 9 ? 2 : a + 1) : cRaw;
    const b = pickNonZeroInt(rng, -9, 9);
    const x0 = pickNonZeroInt(rng, -8, 8);
    const d = a * (x0 + b) - c * x0;

    const stem = `If ${a}(x${signedTerm(b)}) = ${linearSide(c, d)}, what is the value of x?`;

    const { choices, correctIndex } = buildChoices(
      rat(x0),
      [
        // Nhân phân phối hụt: chỉ nhân a với x, quên nhân với b.
        { value: rat(d - b, a - c), errorTag: 'forgot_distribute' },
        // Chuyển cx sang trái mà cộng vào thay vì trừ đi.
        { value: rat(d - a * b, a + c), errorTag: 'moved_term_wrong_side' },
        { value: rat(-x0), errorTag: 'sign_flip' },
      ],
      rng,
    );

    const coefficient = a - c;
    const steps: MathSolutionStep[] = [
      {
        text: 'Nhân phân phối vế trái — hệ số ngoài ngoặc phải nhân với CẢ HAI số hạng bên trong.',
        expr: `${linearSide(a, a * b)} = ${linearSide(c, d)}`,
      },
      {
        text: 'Gom x về một vế, gom số về vế kia. Số hạng đổi vế thì đổi dấu.',
        expr: `${linearSide(coefficient, 0)} = ${d - a * b}`,
      },
    ];

    // Hệ số 1 thì bước cuối là "chia hai vế cho 1" — một bước rỗng in ra đúng
    // cái dòng vừa in ở trên. Hệ số -1 thì đó không phải phép chia mà là đổi
    // dấu, gọi là "chia cho -1" tuy không sai nhưng dạy sai thói quen.
    if (coefficient === -1) {
      steps.push({ text: 'Đổi dấu hai vế.', expr: `x = ${x0}` });
    } else if (coefficient !== 1) {
      steps.push({ text: `Chia hai vế cho ${coefficient}.`, expr: `x = ${x0}` });
    }

    return { format: 'mcq', stem, choices, correctIndex, steps };
  },
};

/**
 * Giao điểm của `ax + by = c` với trục tung.
 *
 * `c` dựng bằng `a·b·m` để CẢ HAI giao điểm đều là số nguyên — nhờ vậy nhiễu
 * "tìm nhầm giao điểm trục hoành" cũng là một số đẹp, trông hợp lý y như đáp án
 * đúng. Nhiễu ra phân số xấu thì người học loại trừ được mà không cần hiểu bài.
 */
const linearTwoVarIntercept: MathTemplate = {
  slug: 'alg-linear-two-var-intercept',
  skill: 'linear_equations_two_var',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 9);
    const bRaw = pickInt(rng, 2, 9);
    // a ≠ b để giao điểm trục tung và trục hoành không trùng nhau.
    const b = bRaw === a ? (a === 9 ? 2 : a + 1) : bRaw;
    const m = pickNonZeroInt(rng, -6, 6);
    const c = a * b * m;

    const yIntercept = a * m;
    const xIntercept = b * m;

    const { choices, correctIndex } = buildChoices(
      rat(yIntercept),
      [
        {
          value: rat(xIntercept),
          errorTag: 'solved_for_wrong_var',
          note: 'Đây là giao điểm với trục HOÀNH: cho y = 0. Đề hỏi trục tung, phải cho x = 0.',
        },
        { value: rat(-yIntercept), errorTag: 'sign_flip' },
        {
          value: rat(m),
          errorTag: null,
          note: `Chia ${c} cho cả hai hệ số. Chỉ được chia cho hệ số của y là ${b}.`,
        },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem:
        `The graph of ${twoVarSide(a, b)} = ${c} in the xy-plane crosses the y-axis ` +
        'at the point (0, k). What is the value of k?',
      choices,
      correctIndex,
      steps: [
        { text: 'Mọi điểm nằm trên trục tung đều có hoành độ bằng 0.', expr: 'x = 0' },
        { text: 'Thay x = 0 vào phương trình, số hạng chứa x biến mất.', expr: `${coefTerm(b, 'y')} = ${c}` },
        { text: `Chia hai vế cho ${b}.`, expr: `k = ${fracOrInt(c, b)}` },
      ],
    };
  },
};

/**
 * Đọc hàm số bậc nhất từ một BẢNG GIÁ TRỊ rồi ngoại suy ra ngoài bảng.
 *
 * Hỏi giá trị nằm NGOÀI bảng là có chủ ý: hỏi trong bảng thì chỉ cần dò mắt,
 * không cần dựng được hàm số.
 */
const linearFunctionFromTable: MathTemplate = {
  slug: 'alg-linear-function-table',
  skill: 'linear_functions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const slope = pickNonZeroInt(rng, -7, 7);
    const interceptRaw = pickNonZeroInt(rng, -9, 9);
    // b ≠ m, nếu không thì nhiễu "đảo hệ số góc với tung độ gốc" trùng đáp án.
    const intercept = interceptRaw === slope ? interceptRaw + 1 : interceptRaw;

    const first = pickInt(rng, 1, 4);
    const step = pickInt(rng, 1, 3);
    const xs = [first, first + step, first + 2 * step];
    const at = first + 4 * step; // luôn ≥ 5, nên không bao giờ là 0 hay 1
    const answer = slope * at + intercept;

    const { choices, correctIndex } = buildChoices(
      rat(answer),
      [
        { value: rat(intercept * at + slope), errorTag: 'swapped_slope_intercept' },
        { value: rat(-slope * at + intercept), errorTag: 'sign_flip' },
        // Tính hệ số góc lộn ngược: Δx/Δy thay vì Δy/Δx.
        { value: rat(at + intercept * slope, slope), errorTag: 'swapped_rise_run' },
      ],
      rng,
    );

    const [x0, x1] = xs;
    const y0 = slope * (x0 ?? 0) + intercept;
    const y1 = slope * (x1 ?? 0) + intercept;

    return {
      format: 'mcq',
      stem:
        'The table shows three values of x and their corresponding values of the linear ' +
        `function f. What is the value of f(${at})?`,
      figure: {
        kind: 'data_table',
        caption: 'Giá trị của hàm f',
        columns: ['x', 'f(x)'],
        rows: xs.map((x) => ({ label: String(x), cells: [slope * x + intercept] })),
      },
      choices,
      correctIndex,
      steps: [
        {
          text: 'Hàm bậc nhất có hệ số góc không đổi: lấy hai dòng bất kỳ trong bảng.',
          expr: `m = frac(${y1} - ${y0},${x1} - ${x0}) = ${slope}`,
        },
        {
          text: `Thay một điểm vào y = mx + b để tìm b.`,
          expr: `${y0} = ${slope} × ${x0} + b   →   b = ${intercept}`,
        },
        {
          text: `Có đủ m và b thì thay x = ${at} vào.`,
          expr: `f(${at}) = ${slope} × ${at}${signedTerm(intercept)} = ${answer}`,
        },
      ],
    };
  },
};

/**
 * Hệ hai phương trình bậc nhất, hỏi `x + y`.
 *
 * Hỏi TỔNG chứ không hỏi riêng x là có chủ ý: đề thi thật rất hay hỏi một biểu
 * thức của cả hai ẩn, và cái bẫy là giải ra x rồi khoanh luôn. Hai nhiễu mang
 * nhãn `stopped_too_early` chính là hai cách dừng sớm ấy.
 */
const systemTwoVarSum: MathTemplate = {
  slug: 'alg-system-two-var-sum',
  skill: 'systems_linear_two_var',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const y0 = pickNonZeroInt(rng, -7, 7);
    let x0 = pickNonZeroInt(rng, -8, 8);
    // x = 2y làm nhiễu "dừng ở y" trùng nhiễu "hiệu hai nghiệm".
    if (x0 === 2 * y0) x0 = x0 === 8 ? 7 : x0 + 1;

    const a1 = pickInt(rng, 1, 6);
    const b1 = pickInt(rng, 1, 6);
    // Định thức bằng ±(a1² + b1²) nên KHÔNG BAO GIỜ bằng 0 — hệ luôn có nghiệm
    // duy nhất mà không phải kiểm lại lần nào.
    const flip = rng() < 0.5;
    const a2 = flip ? b1 : -b1;
    const b2 = flip ? -a1 : a1;

    const c1 = a1 * x0 + b1 * y0;
    const c2 = a2 * x0 + b2 * y0;

    const { choices, correctIndex } = buildChoices(
      rat(x0 + y0),
      [
        { value: rat(x0 - y0), errorTag: 'sign_flip' },
        {
          value: rat(x0),
          errorTag: 'stopped_too_early',
          note: 'Đây mới là x. Đề hỏi x + y, còn thiếu một bước cộng.',
        },
        {
          value: rat(y0),
          errorTag: 'stopped_too_early',
          note: 'Đây mới là y. Đề hỏi x + y, còn thiếu một bước cộng.',
        },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem:
        `The system of equations ${twoVarSide(a1, b1)} = ${c1} and ` +
        `${twoVarSide(a2, b2)} = ${c2} has the solution (x, y). What is the value of x + y?`,
      choices,
      correctIndex,
      steps: [
        {
          text:
            `Khử y: nhân phương trình đầu với ${b2} (hệ số y của phương trình sau) và ` +
            `phương trình sau với ${b1}, rồi trừ vế theo vế.`,
          expr: `(${a1} × ${b2} - ${a2} × ${b1})x = ${c1} × ${b2} - ${c2} × ${b1}`,
        },
        {
          text: 'Rút gọn hai vế.',
          expr: `${coefTerm(a1 * b2 - a2 * b1)} = ${c1 * b2 - c2 * b1}   →   x = ${x0}`,
        },
        {
          text: 'Thay x vừa tìm được vào phương trình đầu để có y.',
          expr: `${coefTerm(b1, 'y')} = ${c1} - ${a1} × ${x0} = ${c1 - a1 * x0}   →   y = ${y0}`,
        },
        {
          text: 'Đề hỏi TỔNG hai ẩn, không hỏi riêng ẩn nào — còn một bước cộng nữa.',
          expr: `x + y = ${x0}${signedTerm(y0)} = ${x0 + y0}`,
        },
      ],
    };
  },
};

/**
 * Bất phương trình bậc nhất, hỏi số nguyên lớn nhất (hoặc nhỏ nhất) thoả mãn.
 *
 * NGƯỠNG LUÔN LÀ SỐ KHÔNG NGUYÊN, dựng bằng `n + r/|a|` với `0 < r < |a|`. Nhờ
 * vậy tránh hẳn ca biên "dấu < hay ≤" — ca ấy đáng dạy riêng, nhưng trộn vào
 * đây thì người học sai mà không biết mình sai vì lý do nào trong hai lý do.
 *
 * Hệ số âm thì đổi luôn câu hỏi sang "nhỏ nhất": chia hai vế cho số âm là đổi
 * chiều bất phương trình, nên tập nghiệm lật sang phía kia và không còn số
 * nguyên lớn nhất nữa. Đây chính là chỗ `forgot_flip_inequality` xảy ra.
 */
const linearInequalityBound: MathTemplate = {
  slug: 'alg-linear-inequality-bound',
  skill: 'linear_inequalities',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const magnitude = pickInt(rng, 2, 7);
    const negative = rng() < 0.5;
    const a = negative ? -magnitude : magnitude;
    const n = pickInt(rng, -9, 9);
    const r = pickInt(rng, 1, magnitude - 1);
    const b = pickNonZeroInt(rng, -9, 9);

    // Ngưỡng t = n + r/magnitude, luôn nằm hẳn giữa hai số nguyên.
    const c = negative ? b - magnitude * n - r : b + magnitude * n + r;
    const answer = negative ? n + 1 : n;

    const threshold = `${n} + frac(${r},${magnitude})`;

    return {
      format: 'grid_in',
      stem:
        `What is the ${negative ? 'least' : 'greatest'} integer value of x that satisfies ` +
        `${linearSide(a, b)} < ${c}?`,
      answer: rat(answer),
      steps: [
        {
          text: 'Chuyển hằng số sang vế phải.',
          expr: `${coefTerm(a)} < ${c - b}`,
        },
        {
          text: negative
            ? `Chia hai vế cho ${a}. Chia cho số ÂM thì phải ĐỔI CHIỀU bất phương trình.`
            : `Chia hai vế cho ${a}.`,
          expr: `x ${negative ? '>' : '<'} ${threshold}`,
        },
        {
          // KHÔNG nhét markup toán vào `text`: trường này vẽ bằng Text thường,
          // nên `frac(1,6)` sẽ hiện nguyên si ra màn hình. Công thức đi vào
          // `expr`, còn `text` chỉ nói bằng lời.
          text: negative
            ? `Ngưỡng vừa tìm nằm giữa ${n} và ${n + 1}, mà x phải LỚN HƠN nó, nên số nguyên nhỏ nhất thoả mãn là ${answer}.`
            : `Ngưỡng vừa tìm nằm giữa ${n} và ${n + 1}, mà x phải NHỎ HƠN nó, nên số nguyên lớn nhất thoả mãn là ${answer}.`,
          expr: `x = ${answer}`,
        },
      ],
    };
  },
};


const linearWordRentalFee: MathTemplate = {
  slug: 'alg-linear-word-rental-fee',
  skill: 'linear_equations_one_var',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const f = pickInt(rng, 20, 200); // phí cố định ($)
    const r = pickInt(rng, 2, 20); // đơn giá theo ngày ($/ngày), r >= 2 để các phương án nhiễu không trùng nghiệm đúng
    const x0 = pickInt(rng, 2, 12); // NGHIỆM CHỌN TRƯỚC: số ngày thuê
    const total = f + r * x0; // tổng chi phí suy TỪ nghiệm đã chọn — luôn khớp

    const stem = `A moving company charges a flat fee of $${f} plus $${r} per day to rent a truck. If the total cost to rent the truck for x days was $${total}, what is the value of x?`;

    const { choices, correctIndex } = buildChoices(
      rat(x0),
      [
        { value: rat(total, r), errorTag: 'moved_term_wrong_side', note: 'Quên trừ phí cố định trước khi chia cho đơn giá.' },
        { value: rat(f - total, r), errorTag: 'sign_flip' },
        { value: rat(total - f), errorTag: 'stopped_too_early', note: 'Trừ được phí cố định nhưng quên chia cho đơn giá mỗi ngày.' },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem,
      choices,
      correctIndex,
      steps: [
        { text: 'Lập phương trình: phí cố định cộng đơn giá nhân số ngày bằng tổng chi phí.', expr: `${f} + ${r}x = ${total}` },
        { text: 'Trừ phí cố định ở cả hai vế.', expr: `${r}x = ${total - f}` },
        { text: 'Chia cả hai vế cho đơn giá mỗi ngày để tìm x.', expr: `x = ${x0}` },
      ],
    };
  },
};


const rideshareFixedRateContext: MathTemplate = {
  slug: 'alg-linear-two-var-rate-fee-context',
  skill: 'linear_equations_two_var',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const R = pickInt(rng, 2, 9); // don gia moi dam
    const F = pickInt(rng, 5, 50); // phi co dinh
    const n = pickInt(rng, 3, 30); // so dam duoc hoi

    const correct = F + R * n;

    const stem = `A rideshare service charges $${R} per mile driven plus a flat booking fee of $${F}. The total cost y, in dollars, for a ride of x miles is given by y = ${linearSide(R, F, 'x')}. What is the total cost, in dollars, for a ride of ${n} miles?`;

    const { choices, correctIndex } = buildChoices(
      rat(correct),
      [
        { value: rat(R * n), errorTag: null, note: 'Quên cộng phí cố định, chỉ nhân đơn giá với số dặm.' },
        { value: rat(F + R * (n - 1)), errorTag: 'off_by_one' },
        { value: rat(R + F * n), errorTag: 'swapped_slope_intercept', note: 'Đổi vai trò đơn giá và phí cố định cho nhau.' },
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
          text: 'Trong ngữ cảnh này, hệ số góc là đơn giá mỗi dặm, còn tung độ gốc là phí cố định ban đầu.',
          expr: `y = ${linearSide(R, F, 'x')}`,
        },
        {
          text: `Thay x = ${n} (số dặm của chuyến đi) vào phương trình rồi tính y.`,
          expr: `y = ${R}(${n})${signedTerm(F)} = ${correct}`,
        },
      ],
    };
  },
};


const linearFunctionWordTwoPoints: MathTemplate = {
  slug: 'alg-linear-fn-draining-tank',
  skill: 'linear_functions',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const r = pickInt(rng, 3, 12); // toc do xa nuoc, gallons/phut
    const t1 = pickInt(rng, 2, 6);
    const d1 = pickInt(rng, 3, 8); // t2 - t1
    const d2 = pickInt(rng, 3, 8); // t3 - t2
    const t2 = t1 + d1;
    const t3 = t2 + d2;

    const V1 = pickInt(rng, 300, 900); // the tich tai t1
    const V2 = V1 - r * d1; // the tich tai t2, luon duong vi r*d1 <= 12*8 = 96 < 300
    const V3 = V2 - r * d2; // dap an dung: the tich tai t3, luon duong vi r*(d1+d2) <= 12*16 = 192 < 300

    const stem = `A water tank is being drained at a constant rate. After ${t1} minutes, the tank holds ${V1} gallons of water. After ${t2} minutes, the tank holds ${V2} gallons of water. Assuming the volume of water in the tank is a linear function of time, how many gallons of water are in the tank after ${t3} minutes?`;

    const { choices, correctIndex } = buildChoices(
      rat(V3),
      [
        { value: rat(V2 + r * d2), errorTag: 'sign_flip', note: 'Cộng nhầm thay vì trừ, coi như bể đang được bơm thêm nước.' },
        { value: rat(V1 - r * d2), errorTag: null, note: 'Lấy nhầm mốc thể tích ban đầu (tại phút thứ nhất) làm điểm xuất phát để trừ, thay vì dùng mốc gần hơn (tại phút thứ hai).' },
        { value: rat(V2 - r * (d1 + d2)), errorTag: 'off_by_one', note: 'Tính khoảng thời gian từ mốc đầu đến mốc cuối rồi trừ thêm một lần nữa vào thể tích ở mốc giữa, làm đoạn thời gian đầu bị trừ lặp.' },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem,
      choices,
      correctIndex,
      steps: [
        { text: 'Tính tốc độ xả nước: lấy chênh lệch thể tích chia cho chênh lệch thời gian giữa hai mốc đã cho.', expr: `frac(${V1} - ${V2}, ${t2} - ${t1}) = ${r}` },
        { text: 'Từ mốc thời gian thứ hai, xả thêm đến mốc thứ ba nghĩa là trừ tiếp lượng nước bằng tốc độ nhân với số phút chênh lệch.', expr: `${V2} - ${r}(${t3} - ${t2}) = ${V3}` },
      ],
    };
  },
};


const systemsTicketPrice: MathTemplate = {
  slug: 'alg-systems-ticket-prices',
  skill: 'systems_linear_two_var',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    // Dựng số lượng vé TRƯỚC, theo cấu trúc bảo đảm định thức khác 0:
    // a = số vé người lớn ngày Sáu, b = số vé học sinh ngày Sáu (b = a + lệch, lệch != 0)
    // c = số vé người lớn ngày Bảy = b + k, d = số vé học sinh ngày Bảy = a + k (k > 0)
    // => det = a*d - b*c = (a-b)(a+b+k), khác 0 vì a != b và a+b+k > 0. Không cần thử-lại.
    const a = pickInt(rng, 5, 10);
    const diffAB = pickNonZeroInt(rng, -3, 3); // != 0, nên a != b luôn đúng
    const b = a + diffAB; // >= 5-3 = 2, luôn >= 2 (số nhiều, tránh "1 vé")
    const k = pickInt(rng, 2, 6);
    const c = b + k; // >= 4
    const d = a + k; // >= 7

    const det = a * d - b * c; // = (a-b)(a+b+k), khác 0 theo cấu trúc

    // Chọn giá vé TRƯỚC rồi suy tổng tiền — không bốc tổng tiền rồi giải ngược.
    const x0 = pickInt(rng, 8, 20); // giá vé người lớn (đô la) — ẨN ĐƯỢC HỎI
    const y0 = pickInt(rng, 4, 15); // giá vé học sinh (đô la)

    const T1 = a * x0 + b * y0; // tổng tiền ngày Sáu
    const T2 = c * x0 + d * y0; // tổng tiền ngày Bảy

    const stem = `A community theater sold ${a} adult tickets and ${b} student tickets on Friday for a total of $${T1}. On Saturday, it sold ${c} adult tickets and ${d} student tickets for a total of $${T2}. Every adult ticket has the same price, and every student ticket has the same price. What is the price, in dollars, of one adult ticket?`;

    const { choices, correctIndex } = buildChoices(
      rat(x0),
      [
        { value: rat(y0), errorTag: 'solved_for_wrong_var', note: 'Đây là giá vé học sinh (y), không phải giá vé người lớn (x) mà đề hỏi.' },
        { value: rat(-x0), errorTag: 'sign_flip' },
        {
          value: rat(T1, a + b),
          errorTag: null,
          note: 'Lấy tổng tiền ngày Sáu chia cho tổng số vé ngày Sáu, coi nhầm là giá vé người lớn (bỏ qua việc hai loại vé có giá khác nhau).',
        },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem,
      choices,
      correctIndex,
      steps: [
        { text: 'Gọi x là giá một vé người lớn, y là giá một vé học sinh (đơn vị: đô la).' },
        { text: 'Lập phương trình từ số liệu ngày Sáu:', expr: `${twoVarSide(a, b)} = ${T1}` },
        { text: 'Lập phương trình từ số liệu ngày Bảy:', expr: `${twoVarSide(c, d)} = ${T2}` },
        {
          text: 'Giải hệ theo x bằng quy tắc Cramer (nhân chéo rồi trừ để khử y):',
          expr: `x = frac(${d}×${T1} - ${b}×${T2}, ${a}×${d} - ${b}×${c})`,
        },
        { text: `Rút gọn ra x = ${x0} đô la.` },
      ],
    };
  },
};


const budgetMaxItemsInequality: MathTemplate = {
  slug: 'alg-budget-max-items-inequality',
  skill: 'linear_inequalities',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const p = pickInt(rng, 3, 12); // giá mỗi món, USD
    const f = pickInt(rng, 2, 20); // phí cố định, USD
    const x0 = pickInt(rng, 3, 15); // số món tối đa MUỐN có (chọn trước)
    const r = pickInt(rng, 1, p - 1); // phần dư 0<r<p để phép chia không tròn, đảm bảo floor((C-f)/p) = x0 đúng bằng cấu trúc
    const C = p * x0 + r + f; // ngân sách suy ngược từ x0, không bốc rồi kiểm

    const stem = `A customer plans to buy identical items at a store. Each item costs $${p}, and the store charges a one-time delivery fee of $${f}. If the customer has $${C} to spend in total, what is the maximum number of items the customer can buy without exceeding this budget?`;

    const roundUpValue = rat(x0 + 1);
    const ignoreFeeValue = rat(Math.floor(C / p));
    const addFeeValue = rat(Math.floor((C + f) / p));

    const { choices, correctIndex } = buildChoices(
      rat(x0),
      [
        { value: roundUpValue, errorTag: 'off_by_one', note: 'Làm tròn lên thay vì làm tròn xuống.' },
        { value: ignoreFeeValue, errorTag: null, note: 'Quên trừ phí cố định trước khi chia cho giá mỗi món.' },
        { value: addFeeValue, errorTag: 'moved_term_wrong_side', note: 'Chuyển phí cố định sai dấu, cộng thay vì trừ.' },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem,
      choices,
      correctIndex,
      steps: [
        { text: 'Đặt x là số món hàng, viết bất phương trình theo ngân sách.', expr: `${p}x + ${f} <= ${C}` },
        { text: 'Trừ phí cố định khỏi hai vế.', expr: `${p}x <= ${C - f}` },
        { text: 'Chia hai vế cho giá mỗi món.', expr: `x <= ${fracOrInt(C - f, p)}` },
        { text: 'Số món phải là số nguyên nên lấy phần nguyên của kết quả (làm tròn xuống).', expr: `x = ${x0}` },
      ],
    };
  },
};

export const ALGEBRA_TEMPLATES: MathTemplate[] = [
  linearEquationDistribute,
  linearTwoVarIntercept,
  linearFunctionFromTable,
  systemTwoVarSum,
  linearInequalityBound,
  linearWordRentalFee,
  rideshareFixedRateContext,
  linearFunctionWordTwoPoints,
  systemsTicketPrice,
  budgetMaxItemsInequality,
];
