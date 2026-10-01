import type { RoadChapter } from './types';

/**
 * Chương 1 – 14 của lộ trình (theo thứ tự chủ đề của giáo trình). Lý thuyết,
 * ví dụ tự viết. Đáp án ví dụ được kiểm lại ở `chapters.test.ts`.
 */
export const CHAPTERS_A: RoadChapter[] = [
  {
    n: 1,
    id: 'exponents-radicals',
    title: { vi: 'Luỹ thừa & căn thức', en: 'Exponents & Radicals' },
    phase: 1,
    art: 'rocket',
    bookPages: [7, 14],
    subtopics: [
      { vi: 'Các quy tắc luỹ thừa', en: 'Laws of exponents' },
      { vi: 'Cơ số âm và thứ tự phép tính', en: 'Negative bases and order of operations' },
      { vi: 'Tách số mũ, đưa về cùng cơ số', en: 'Splitting exponents and matching bases' },
      { vi: 'Số mũ phân số và căn', en: 'Fractional exponents and roots' },
      { vi: 'Rút gọn căn bậc hai', en: 'Simplifying square roots' },
      { vi: 'Giải phương trình có căn', en: 'Solving equations with radicals' },
    ],
    theory: [
      {
        title: { vi: 'Mũ 1 và mũ 0', en: 'Power of one and power of zero' },
        body: {
          vi: 'Số nào mũ 1 cũng bằng chính nó; số khác 0 nào mũ 0 cũng bằng 1. Hệ quả: 1 mũ bao nhiêu vẫn là 1.',
          en: 'Any number to the first power is itself; any nonzero number to the zero power is 1. So 1 to any power is still 1.',
        },
        formula: 'x^1 = x    x^0 = 1',
      },
      {
        title: { vi: 'Nhân, chia, luỹ thừa của luỹ thừa', en: 'Multiply, divide, power of a power' },
        body: {
          vi: 'Cùng cơ số: nhân thì CỘNG số mũ, chia thì TRỪ số mũ. Nâng một luỹ thừa lên luỹ thừa nữa thì NHÂN hai số mũ.',
          en: 'Same base: multiplying ADDS exponents, dividing SUBTRACTS them. Raising a power to another power MULTIPLIES the exponents.',
        },
        formula: 'x^m · x^n = x^(m+n)    frac(x^m,x^n) = x^(m-n)    (x^m)^n = x^(mn)',
      },
      {
        title: { vi: 'Luỹ thừa của tích, của thương; số mũ âm', en: 'Power of a product or quotient; negative exponents' },
        body: {
          vi: 'Số mũ ngoài ngoặc áp cho TỪNG thừa số trong ngoặc (kể cả hệ số). Số mũ âm nghĩa là lấy nghịch đảo — không làm kết quả âm.',
          en: 'An exponent outside parentheses applies to EVERY factor inside (including the coefficient). A negative exponent means reciprocal — it does not make the result negative.',
        },
        formula: '(xy)^m = x^my^m    (frac(x,y))^m = frac(x^m,y^m)    x^(-m) = frac(1,x^m)',
      },
      {
        title: { vi: 'Cơ số âm: ngoặc quyết định', en: 'Negative bases: parentheses decide' },
        body: {
          vi: 'Có ngoặc thì dấu trừ nằm trong cơ số và bị nâng lên luỹ thừa; không có ngoặc thì tính luỹ thừa trước rồi mới đặt dấu trừ. Mũ chẵn làm mất dấu trừ của cơ số, mũ lẻ giữ nguyên — nên (−1) mũ chẵn là 1, mũ lẻ là −1.',
          en: 'With parentheses the minus sign is part of the base and gets raised to the power; without them the power is applied first and the minus comes after. Even powers remove the sign of a negative base, odd powers keep it — so (−1) to an even power is 1 and to an odd power is −1.',
        },
        formula: '(-4)^2 = 16    -4^2 = -16    (-2)^3 = -2^3 = -8',
      },
      {
        title: { vi: 'Tách số mũ để khỏi phải tìm ẩn', en: 'Split the exponent instead of solving for x' },
        body: {
          vi: 'Khi đề cho một luỹ thừa có số mũ dạng x cộng/trừ hằng số, tách thành tích (hoặc thương) của hai luỹ thừa. Biết giá trị của một luỹ thừa là suy ra luỹ thừa kia mà không cần tìm x.',
          en: 'When a power has an exponent like x plus or minus a constant, split it into a product (or quotient) of two powers. Knowing one power then gives the other without solving for x.',
        },
        formula: '5^(x+3) = 5^x · 5^3    5^(x-3) = frac(5^x,5^3)',
      },
      {
        title: { vi: 'Cùng cơ số thì số mũ bằng nhau', en: 'Same base, equal exponents' },
        body: {
          vi: 'Nếu hai vế cùng cơ số (khác 0, 1 và −1) thì hai số mũ phải bằng nhau. Cơ số khác nhau thì viết cả hai thành luỹ thừa của một cơ số chung (4 là 2 mũ 2, 27 là 3 mũ 3…) trước khi so số mũ.',
          en: 'If both sides have the same base (not 0, 1 or −1), the exponents must be equal. With different bases, rewrite both as powers of a common base (4 is 2 squared, 27 is 3 cubed…) before comparing exponents.',
        },
        formula: 'frac(8^a,2^b) = frac(2^(3a),2^b) = 2^(3a-b)',
      },
      {
        title: { vi: 'Số mũ phân số là căn', en: 'Fractional exponents are roots' },
        body: {
          vi: 'Mẫu của số mũ là bậc của căn, tử là luỹ thừa: x mũ m/n là căn bậc n của x mũ m. Làm căn trước hay luỹ thừa trước đều được; căn bậc hai là mũ một phần hai.',
          en: 'The denominator of the exponent is the index of the root and the numerator is the power: x to the m/n is the n-th root of x to the m. You may take the root or the power first; a square root is the one-half power.',
        },
        formula: 'x^(frac(1,2)) = sqrt(x)    x^(frac(m,n)) = (x^m)^(frac(1,n)) = (x^(frac(1,n)))^m',
      },
      {
        title: { vi: 'Rút gọn căn bậc hai', en: 'Simplifying square roots' },
        body: {
          vi: 'Phân tích số dưới căn, mỗi CẶP thừa số giống nhau đưa được một thừa số ra ngoài. Nhanh hơn: tách ra thừa số chính phương lớn nhất. Đi ngược thì bình phương hệ số rồi đưa vào trong căn.',
          en: 'Factor the number under the root; every PAIR of equal factors brings one factor outside. Faster: split off the largest perfect-square factor. To go backwards, square the outside number and move it under the root.',
        },
        formula: 'sqrt(98) = sqrt(49 · 2) = 7sqrt(2)    5sqrt(3) = sqrt(25 · 3) = sqrt(75)',
      },
      {
        title: { vi: 'Phương trình có căn', en: 'Equations with radicals' },
        body: {
          vi: 'Hai cách: đưa hệ số vào trong căn rồi so phần trong căn, hoặc bình phương cả hai vế (bình phương cả hệ số đứng trước căn).',
          en: 'Two ways: move the coefficient under the root and compare what is inside, or square both sides (squaring the coefficient in front of the root too).',
        },
        formula: '3sqrt(5) = sqrt(5x)  →  45 = 5x  →  x = 9',
      },
    ],
    examples: [
      {
        problem: 'If 5^(x+3) = y, what is the value of 5^x in terms of y?',
        steps: [
          { vi: 'Tách số mũ: 5 mũ (x + 3) bằng 5 mũ x nhân 125.', en: 'Split the exponent: 5 to the (x + 3) equals 5 to the x times 125.' },
          { vi: 'Vậy 125 · 5^x = y, suy ra 5^x = y/125.', en: 'So 125 · 5^x = y, giving 5^x = y/125.' },
        ],
        answer: 'frac(y,125)',
      },
      {
        problem: 'If 2^(3n - 1) = 2^(n + 9), what is the value of n?',
        steps: [
          { vi: 'Cùng cơ số 2 nên hai số mũ bằng nhau: 3n − 1 = n + 9.', en: 'Same base 2, so the exponents are equal: 3n − 1 = n + 9.' },
          { vi: '2n = 10, n = 5.', en: '2n = 10, n = 5.' },
        ],
        answer: '5',
      },
      {
        problem: 'If 3a - b = 5, what is the value of frac(8^a,2^b)?',
        steps: [
          { vi: 'Viết 8 thành 2 mũ 3: tử số là 2 mũ 3a.', en: 'Write 8 as 2 cubed: the numerator is 2 to the 3a.' },
          { vi: 'Chia thì trừ số mũ: 2 mũ (3a − b) = 2 mũ 5 = 32.', en: 'Dividing subtracts exponents: 2 to the (3a − b) = 2 to the 5 = 32.' },
        ],
        answer: '32',
      },
      {
        problem: 'Which of the following is equal to the cube root of x^7, for x > 0?',
        steps: [
          { vi: 'Căn bậc 3 là mũ một phần ba; bậc căn xuống mẫu, số mũ 7 lên tử.', en: 'A cube root is the one-third power; the index goes to the denominator and the 7 to the numerator.' },
          { vi: 'Kết quả: x mũ 7/3.', en: 'Result: x to the 7/3.' },
        ],
        answer: 'x^(frac(7,3))',
      },
      {
        problem: 'If 3sqrt(5) = sqrt(5x), what is the value of x?',
        steps: [
          { vi: 'Đưa 3 vào trong căn thành 9: căn của 45.', en: 'Move the 3 inside the root as 9: the square root of 45.' },
          { vi: 'So phần trong căn: 5x = 45, x = 9.', en: 'Compare the insides: 5x = 45, x = 9.' },
        ],
        answer: '9',
      },
    ],
    traps: [
      { vi: 'Nhân hai luỹ thừa mà nhân số mũ (phải cộng).', en: 'Multiplying powers and multiplying the exponents (you add them).' },
      { vi: 'Nhầm (−4)² = 16 với −4² = −16.', en: 'Confusing (−4)² = 16 with −4² = −16.' },
      { vi: 'Nghĩ số mũ âm làm kết quả âm (nó chỉ lấy nghịch đảo).', en: 'Thinking a negative exponent makes the answer negative (it only takes the reciprocal).' },
      { vi: 'Đưa hệ số vào trong căn mà quên bình phương nó.', en: 'Moving a coefficient under the root without squaring it.' },
      { vi: 'So số mũ khi hai cơ số chưa được đưa về cùng một cơ số.', en: 'Equating exponents before the two bases have been rewritten as the same base.' },
    ],
    templates: {
      easy: ['pd-c-neg-frac-exp', 'pd-c-power-of-one-sum', 'pd-c-exp-quotient-relation', 'pd-c-exp-shift', 'adv-exponent-rules', 'pd-simplify-sqrt'],
      medium: [
        'pd-c-common-base-mcq',
        'pd-c-exp-product-combine',
        'pd-c-signed-power-compare',
        'pd-c-frac-exp-to-root',
        'pd-c-exp-equate-power',
        'pd-c-exp-factor-out',
        'pd-c-radical-coef-solve',
        'pd-fractional-exponent',
        'adv-exponential-equation',
      ],
      hard: ['pd-c-nested-radical-exp', 'pd-c-exp-sum-factor', 'pd-c-power-system-grid', 'pd-c-exp-quotient-combine', 'pd-exponent-solve-hard'],
    },
    bookSet: [
      { slug: 'pd-c-neg-frac-exp', calc: false },
      { slug: 'pd-c-power-of-one-sum', calc: false },
      { slug: 'pd-c-common-base-mcq', calc: false },
      { slug: 'pd-c-exp-quotient-relation', calc: false },
      { slug: 'pd-c-exp-shift', calc: false },
      { slug: 'pd-c-exp-product-combine', calc: false },
      { slug: 'pd-c-signed-power-compare', calc: false },
      { slug: 'pd-c-frac-exp-to-root', calc: false },
      { slug: 'pd-c-exp-equate-power', calc: false },
      { slug: 'pd-c-exp-factor-out', calc: false },
      { slug: 'pd-c-nested-radical-exp', calc: false },
      { slug: 'pd-c-radical-coef-solve', calc: false },
      { slug: 'pd-c-exp-sum-factor', calc: false },
      { slug: 'pd-c-power-system-grid', calc: true },
      { slug: 'pd-c-exp-quotient-combine', calc: true },
    ],
  },
  {
    n: 2,
    id: 'percent',
    title: { vi: 'Phần trăm', en: 'Percent' },
    phase: 1,
    art: 'calculator',
    bookPages: [15, 23],
    subtopics: [
      { vi: 'Phần trăm của một tổng gộp', en: 'Percent of a combined total' },
      { vi: 'Đọc bảng và ước lượng cho tổng thể', en: 'Tables and estimating a larger population' },
      { vi: 'Chuỗi thay đổi phần trăm (hệ số nhân)', en: 'A series of percent changes (multipliers)' },
      { vi: 'Lãi kép', en: 'Compound interest' },
      { vi: 'Ghép lãi nhiều lần mỗi năm', en: 'Compounding more than once a year' },
      { vi: 'Lãi đơn', en: 'Simple interest' },
      { vi: 'Đi ngược về giá trị ban đầu', en: 'Working backwards to the original value' },
      { vi: 'Phần trăm thay đổi', en: 'Percent change' },
      { vi: 'Phần trăm của phần trăm', en: 'Percent of a percent' },
    ],
    theory: [
      {
        title: { vi: 'Gộp nhiều nhóm: cộng phần, cộng tổng', en: 'Combining groups: add parts, add totals' },
        body: {
          vi: 'Không lấy trung bình hai con số phần trăm. Đổi từng phần trăm ra số lượng, cộng các số lượng, rồi chia cho tổng của tất cả.',
          en: 'Do not average two percents. Turn each percent into a count, add the counts, then divide by the combined total.',
        },
        formula: 'frac(0.6 × 40 + 0.85 × 60,40 + 60) = frac(75,100) = 75%',
      },
      {
        title: { vi: 'Bảng số liệu: đúng mẫu số', en: 'Two-way tables: the right denominator' },
        body: {
          vi: 'Câu hỏi "trong số A, bao nhiêu phần trăm là B" thì mẫu số là tổng của A (một hàng hoặc một cột), không phải tổng cả bảng. Muốn ước lượng cho một tổng thể lớn hơn, áp đúng tỉ lệ của mẫu lên tổng thể.',
          en: 'For "of the A, what percent are B", the denominator is the total of A (one row or column), not the whole table. To estimate for a larger population, apply the sample proportion to the population total.',
        },
        formula: 'estimate = frac(part,sample total) × population total',
      },
      {
        title: { vi: 'Hệ số nhân và chuỗi thay đổi', en: 'Multipliers and series of changes' },
        body: {
          vi: 'Tăng p% là nhân (1 + p/100), giảm p% là nhân (1 − p/100). Nhiều lần thay đổi liên tiếp thì NHÂN các hệ số — không cộng trừ các con số phần trăm, và không tính giá ở từng bước.',
          en: 'Increasing by p% multiplies by (1 + p/100); decreasing multiplies by (1 − p/100). For successive changes, MULTIPLY the multipliers — never add the percents, and no need to compute each intermediate price.',
        },
        formula: 'p × 1.3 × 0.5 × 1.4 = 0.91p',
      },
      {
        title: { vi: 'Lãi kép', en: 'Compound interest' },
        body: {
          vi: 'Lãi kép tính lãi trên cả tiền lãi đã có: mỗi kỳ số dư nhân với (1 + r). Sau t kỳ là nhân t lần.',
          en: 'Compound interest earns interest on earlier interest: each period the balance is multiplied by (1 + r). After t periods it is multiplied t times.',
        },
        formula: 'A = P(1 + r)^t',
      },
      {
        title: { vi: 'Ghép lãi n lần mỗi năm', en: 'Compounding n times a year' },
        body: {
          vi: 'Lãi suất năm chia đều cho n kỳ, còn số kỳ sau t năm là nt. Ghép lãi càng nhiều lần thì cuối cùng càng được nhiều hơn một chút.',
          en: 'The yearly rate is split evenly over n periods, and there are nt periods in t years. The more often interest is compounded, the slightly larger the final amount.',
        },
        formula: 'A = P(1 + frac(r,n))^(nt)',
      },
      {
        title: { vi: 'Lãi đơn', en: 'Simple interest' },
        body: {
          vi: 'Lãi đơn chỉ tính trên tiền gốc: mỗi năm cộng cùng một khoản, nên số dư tăng tuyến tính.',
          en: 'Simple interest is earned only on the original amount: the same amount is added every year, so the balance grows linearly.',
        },
        formula: 'A = P(1 + rt)',
      },
      {
        title: { vi: 'Đi ngược về giá trị ban đầu', en: 'Working backwards' },
        body: {
          vi: 'Giá trị mới bằng giá trị cũ nhân hệ số, nên muốn tìm giá trị cũ thì CHIA cho hệ số. Giảm 25% rồi muốn quay lại thì phải chia 0.75 (tức là tăng khoảng 33.3%), không phải tăng 25%.',
          en: 'New value = old value × multiplier, so to find the old value DIVIDE by the multiplier. After a 25% decrease, getting back means dividing by 0.75 (about a 33.3% increase), not adding 25%.',
        },
        formula: '0.75x = k  →  x = frac(k,0.75) = frac(4,3)k',
      },
      {
        title: { vi: 'Phần trăm thay đổi', en: 'Percent change' },
        body: {
          vi: 'Luôn chia cho giá trị GỐC — giá trị mà ta so sánh "từ đó". Dương là tăng, âm là giảm.',
          en: 'Always divide by the ORIGINAL value — the one you compare "from". Positive means an increase, negative a decrease.',
        },
        formula: 'percent change = frac(new - old,old) × 100',
      },
      {
        title: { vi: 'Phần trăm của phần trăm: chọn tổng bằng 100', en: 'Percent of a percent: pick 100' },
        body: {
          vi: 'Khi không biết tổng, tự đặt tổng bằng 100 rồi tính lần lượt từng phần trăm.',
          en: 'When the total is unknown, make it 100 and apply each percent in turn.',
        },
        formula: '30% of 100 = 30,  40% of 30 = 12  →  12%',
      },
    ],
    examples: [
      {
        problem: 'A student answered 60% of a 40-question quiz and 85% of a 60-question quiz correctly. What percent of all the questions did the student answer correctly?',
        steps: [
          { vi: 'Số câu đúng: 24 và 51, tổng 75.', en: 'Correct answers: 24 and 51, total 75.' },
          { vi: 'Tổng số câu 100, nên đúng 75%.', en: 'There are 100 questions in all, so 75%.' },
        ],
        answer: '75%',
      },
      {
        problem: 'A price is increased by 30%, then decreased by 50%, then increased by 40%. The final price is what percent of the original price?',
        steps: [
          { vi: 'Nhân các hệ số: 1.3 × 0.5 × 1.4 = 0.91.', en: 'Multiply the multipliers: 1.3 × 0.5 × 1.4 = 0.91.' },
          { vi: 'Giá cuối bằng 91% giá ban đầu.', en: 'The final price is 91% of the original.' },
        ],
        answer: '91%',
      },
      {
        problem: 'An account starts with $600 and earns 6% annual interest compounded quarterly. Which expression gives the balance after t years?',
        steps: [
          { vi: 'Mỗi quý lãi 6% chia 4 = 1.5%.', en: 'Each quarter earns 6% ÷ 4 = 1.5%.' },
          { vi: 'Sau t năm có 4t quý.', en: 'There are 4t quarters in t years.' },
        ],
        answer: '600(1.015)^(4t)',
      },
      {
        problem: 'This year a farm harvested 25% fewer apples than last year. If it harvested 1,800 kilograms this year, how many kilograms did it harvest last year?',
        steps: [
          { vi: 'Năm nay = 0.75 × năm ngoái.', en: 'This year = 0.75 × last year.' },
          { vi: 'Năm ngoái = 1800 ÷ 0.75 = 2400.', en: 'Last year = 1800 ÷ 0.75 = 2400.' },
        ],
        answer: '2,400',
      },
      {
        problem: 'Sales rose from 250 units one week to 340 units the next. What was the percent increase?',
        steps: [
          { vi: 'Chênh lệch 90, chia cho giá trị gốc 250.', en: 'The difference is 90; divide by the original 250.' },
          { vi: '90 ÷ 250 = 0.36, tức tăng 36%.', en: '90 ÷ 250 = 0.36, an increase of 36%.' },
        ],
        answer: '36%',
      },
    ],
    traps: [
      { vi: 'Lấy trung bình hai phần trăm của hai nhóm có kích thước khác nhau.', en: 'Averaging two percents from groups of different sizes.' },
      { vi: 'Tăng 20% rồi giảm 20% không trở về giá ban đầu.', en: 'Up 20% then down 20% does not return to the original.' },
      { vi: 'Chia cho giá trị mới thay vì giá trị gốc khi tính phần trăm thay đổi.', en: 'Dividing by the new value instead of the original in a percent change.' },
      { vi: 'Ghép lãi nhiều lần mỗi năm mà quên chia lãi suất cho n (hoặc quên nhân số mũ với n).', en: 'Compounding n times a year but forgetting to divide the rate by n (or to multiply the exponent by n).' },
      { vi: 'Đi ngược một lần giảm p% bằng cách tăng p%.', en: 'Undoing a p% decrease by adding p%.' },
    ],
    templates: {
      easy: ['pd-c-compound-base-expr', 'pd-c-pct-greater-reverse', 'pd-c-simple-interest-model', 'psda-percent-increase-new', 'pd-simple-interest'],
      medium: [
        'pd-c-pct-larger-than',
        'pd-c-survey-scale-grid',
        'pd-c-pct-table-share',
        'pd-c-pct-table-which',
        'pd-c-pct-table-change',
        'pd-c-pct-repeated-remove',
        'pd-c-pct-discount-tax-solve',
        'pd-c-pct-weighted-increase',
        'pd-c-pct-loss-gain-expr',
        'pd-c-pct-decline-approx',
        'pd-c-pct-category-shift',
        'psda-two-step-percent-change',
        'psda-percent-of-percent',
      ],
      hard: ['pd-c-compound-two-accounts', 'pd-c-growth-every-k', 'pd-compound-interest', 'hard-percent-reverse-compound'],
    },
    bookSet: [
      { slug: 'pd-c-pct-larger-than', calc: true },
      { slug: 'pd-c-compound-base-expr', calc: true },
      { slug: 'pd-c-survey-scale-grid', calc: true },
      { slug: 'pd-c-pct-table-which', calc: true },
      { slug: 'pd-c-pct-table-share', calc: true },
      { slug: 'pd-c-pct-table-share', calc: true },
      { slug: 'pd-c-pct-table-change', calc: true },
      { slug: 'psda-two-step-percent-change', calc: true },
      { slug: 'pd-c-pct-repeated-remove', calc: true },
      { slug: 'pd-c-pct-discount-tax-solve', calc: true },
      { slug: 'pd-c-pct-greater-reverse', calc: true },
      { slug: 'pd-c-pct-weighted-increase', calc: true },
      { slug: 'pd-c-pct-loss-gain-expr', calc: true },
      { slug: 'pd-c-pct-decline-approx', calc: true },
      { slug: 'pd-c-simple-interest-model', calc: true },
      { slug: 'pd-c-pct-category-shift', calc: true },
      { slug: 'pd-c-compound-two-accounts', calc: true },
      { slug: 'pd-c-growth-every-k', calc: true },
    ],
  },
  {
    n: 3,
    id: 'exponential-vs-linear',
    title: { vi: 'Tăng trưởng mũ và tuyến tính', en: 'Exponential vs. Linear Growth' },
    phase: 1,
    art: 'rocket',
    bookPages: [24, 29],
    subtopics: [
      { vi: 'Tăng trưởng theo hàm mũ', en: 'Exponential growth' },
      { vi: 'Suy giảm theo hàm mũ', en: 'Exponential decay' },
      { vi: 'Tăng tuyến tính', en: 'Linear growth' },
      { vi: 'Giảm tuyến tính', en: 'Linear decay' },
      { vi: 'Tương quan nghịch', en: 'Negative association' },
      { vi: 'Tương quan thuận', en: 'Positive association' },
    ],
    theory: [
      {
        title: { vi: 'Tăng theo hàm mũ: nhân cùng một hệ số', en: 'Exponential growth: multiply by the same factor' },
        body: {
          vi: 'Mỗi kỳ đại lượng được NHÂN với cùng một số lớn hơn 1. Đồ thị lúc đầu thoai thoải rồi dựng đứng dần. Tăng r% mỗi kỳ thì hệ số là 1 + r.',
          en: 'Each period the quantity is MULTIPLIED by the same number greater than 1. The graph starts flat and gets steeper and steeper. Growing r% per period means the factor is 1 + r.',
        },
        formula: 'y = a · b^t,  b > 1',
      },
      {
        title: { vi: 'Suy giảm theo hàm mũ', en: 'Exponential decay' },
        body: {
          vi: 'Hệ số nhân nằm giữa 0 và 1: mỗi kỳ mất cùng một TỈ LỆ của lượng đang có, nên lượng mất đi nhỏ dần và đồ thị tiến sát trục ngang mà không chạm.',
          en: 'The factor is between 0 and 1: each period the same FRACTION of the current amount is lost, so the losses shrink and the graph approaches the horizontal axis without touching it.',
        },
        formula: 'y = a · b^t,  0 < b < 1',
      },
      {
        title: { vi: 'Thay đổi mỗi k năm một lần', en: 'Changes that happen every k years' },
        body: {
          vi: 'Nếu tỉ lệ chỉ áp dụng mỗi k đơn vị thời gian thì số lần thay đổi sau t đơn vị là t chia k, nên số mũ là t/k.',
          en: 'If the rate applies only every k time units, the number of changes after t units is t divided by k, so the exponent is t/k.',
        },
        formula: 'y = a(1 - r)^(frac(t,k))',
      },
      {
        title: { vi: 'Tuyến tính: cộng/trừ cùng một lượng', en: 'Linear: add or subtract the same amount' },
        body: {
          vi: 'Mỗi kỳ cộng (hay trừ) CÙNG MỘT LƯỢNG, đồ thị là đường thẳng; hệ số góc là lượng đó. Chú ý: tăng p% của GIÁ TRỊ BAN ĐẦU mỗi năm vẫn là tuyến tính, vì lượng cộng thêm không đổi.',
          en: 'Each period the SAME AMOUNT is added (or subtracted) and the graph is a line whose slope is that amount. Careful: growing by p% of the ORIGINAL value each year is still linear, because the amount added never changes.',
        },
        formula: 'y = mt + b',
      },
      {
        title: { vi: 'Nhận dạng từ số liệu', en: 'Telling them apart from data' },
        body: {
          vi: 'Hiệu giữa các giá trị liên tiếp không đổi → tuyến tính. Thương giữa các giá trị liên tiếp không đổi → hàm mũ. Biết giá trị ở hai thời điểm cách nhau k kỳ thì hệ số mũ là căn bậc k của tỉ số.',
          en: 'Constant differences between consecutive values → linear. Constant ratios → exponential. Knowing values k periods apart, the exponential factor is the k-th root of their ratio.',
        },
        formula: 'P_0 b^2 = P_2  →  b = sqrt(frac(P_2,P_0))',
      },
      {
        title: { vi: 'Tương quan thuận, nghịch', en: 'Positive and negative association' },
        body: {
          vi: 'Trên biểu đồ phân tán: x tăng mà y có xu hướng tăng là tương quan thuận; y có xu hướng giảm là tương quan nghịch. Các điểm càng bám sát một đường thì tương quan càng mạnh.',
          en: 'On a scatterplot: if y tends to rise as x rises, the association is positive; if y tends to fall, negative. The closer the points hug a line or curve, the stronger the association.',
        },
      },
    ],
    examples: [
      {
        problem: 'A town had 2,500 residents in 2020 and 3,025 residents in 2022. If the population grows by the same percent each year, which function gives the population t years after 2020?',
        steps: [
          { vi: 'Hai năm nhân hai lần với b: b² = 3025 ÷ 2500 = 1.21.', en: 'Two years means multiplying by b twice: b² = 3025 ÷ 2500 = 1.21.' },
          { vi: 'b = 1.1, nên P(t) = 2500(1.1)^t.', en: 'b = 1.1, so P(t) = 2500(1.1)^t.' },
        ],
        answer: 'P(t) = 2500(1.1)^t',
      },
      {
        problem: 'A forest covers 900 acres and loses 8% of its area every 3 years. Which expression gives its area after t years?',
        steps: [
          { vi: 'Mỗi lần còn lại 92%: hệ số 0.92.', en: 'Each time 92% remains: factor 0.92.' },
          { vi: 'Sau t năm có t/3 lần thay đổi.', en: 'After t years there are t/3 changes.' },
        ],
        answer: '900(0.92)^(frac(t,3))',
      },
      {
        problem: 'A collector owns 240 stamps and gives away 6 stamps every month. Is the number of stamps changing linearly or exponentially?',
        steps: [
          { vi: 'Mỗi tháng bớt cùng một lượng (6).', en: 'The same amount (6) is removed every month.' },
          { vi: 'Đó là giảm tuyến tính.', en: 'That is linear decay.' },
        ],
        answer: 'Linear decay',
      },
    ],
    traps: [
      { vi: 'Viết 5000(0.04)^t cho mức tăng 4% — hệ số phải là 1.04.', en: 'Writing 5000(0.04)^t for 4% growth — the factor must be 1.04.' },
      { vi: 'Dùng thẳng tỉ số của hai năm làm hệ số mỗi năm (quên lấy căn).', en: 'Using the two-year ratio as the yearly factor (forgetting the root).' },
      { vi: 'Coi "p% của giá trị ban đầu mỗi năm" là hàm mũ — thật ra là tuyến tính.', en: 'Treating "p% of the original value each year" as exponential — it is linear.' },
      { vi: 'Thay đổi mỗi k năm mà để số mũ là t hoặc kt thay vì t/k.', en: 'For a change every k years, using t or kt instead of t/k as the exponent.' },
    ],
    templates: {
      easy: ['pd-c-linear-model-from-two-points', 'pd-c-scatter-association', 'pd-c-scenario-classify', 'pd-linear-vs-exp-identify', 'alg-linear-fn-rate-change'],
      medium: ['pd-c-exp-model-from-two-points', 'pd-c-exp-model-params', 'pd-c-scenario-pick', 'adv-exponential-growth-value', 'adv-doubling-growth', 'adv-exponential-decay-percent'],
      hard: ['pd-c-growth-every-k', 'pd-exp-growth-model-hard', 'hard-exp-from-two-values', 'hard-exp-model-period'],
    },
    bookSet: [
      { slug: 'pd-c-exp-model-from-two-points', calc: false },
      { slug: 'pd-c-linear-model-from-two-points', calc: false },
      { slug: 'pd-c-growth-every-k', calc: false },
      { slug: 'pd-c-scatter-association', calc: true },
      { slug: 'pd-c-scenario-classify', calc: true },
      { slug: 'pd-c-scenario-classify', calc: true },
      { slug: 'pd-c-exp-model-params', calc: true },
      { slug: 'pd-c-scenario-pick', calc: true },
    ],
  },
  {
    n: 4,
    id: 'proportion',
    title: { vi: 'Tỉ lệ thức', en: 'Proportion' },
    phase: 1,
    art: 'pencil',
    bookPages: [30, 33],
    subtopics: [
      { vi: 'Co giãn một biến trong công thức', en: 'Scaling one variable in a formula' },
      { vi: 'Kích thước tăng theo phần trăm', en: 'Percent changes in dimensions' },
      { vi: 'Hai biến cùng thay đổi', en: 'Two variables changing at once' },
      { vi: 'Hằng số không ảnh hưởng', en: 'Constants do not matter' },
      { vi: 'Đi ngược: từ đại lượng về kích thước', en: 'Working backwards: from the result to the dimension' },
    ],
    theory: [
      {
        title: { vi: 'Thay biến bằng bản đã co giãn', en: 'Replace the variable with its scaled version' },
        body: {
          vi: 'Muốn biết một đại lượng thay đổi thế nào khi một biến bị nhân k lần: thay biến đó bằng (k lần biến) trong công thức, rồi kéo hệ số ra phía trước. Biến mũ e thì hệ số thành k mũ e; biến ở mẫu thì hệ số đi xuống mẫu.',
          en: 'To see how a quantity changes when a variable is multiplied by k: replace the variable with (k times the variable) in the formula and pull the factor out in front. A variable to the e-th power gives k to the e; a variable in the denominator sends the factor to the denominator.',
        },
        formula: 'A = frac(1,2)(2b)h = 2 · frac(1,2)bh',
      },
      {
        title: { vi: 'Phần trăm thay đổi của kích thước', en: 'Percent change in a dimension' },
        body: {
          vi: 'Tăng p% nghĩa là nhân (1 + p/100). Luôn đặt CẢ biểu thức mới trong ngoặc trước khi bình phương hay lập phương.',
          en: 'A p% increase multiplies by (1 + p/100). Always put the WHOLE new expression in parentheses before squaring or cubing.',
        },
        formula: 'pi(1.3r)^2 = 1.69 pi r^2  →  area up 69%',
      },
      {
        title: { vi: 'Hai biến cùng đổi: nhân các hệ số', en: 'Two variables change: multiply the factors' },
        body: {
          vi: 'Dài tăng 30% còn rộng giảm 30% thì diện tích nhân 1.3 × 0.7 = 0.91 — giảm 9%, không phải giữ nguyên.',
          en: 'If the length rises 30% and the width falls 30%, the area is multiplied by 1.3 × 0.7 = 0.91 — a 9% decrease, not unchanged.',
        },
        formula: '(1.3L)(0.7W) = 0.91LW',
      },
      {
        title: { vi: 'Hằng số không đổi thì không cần quan tâm', en: 'Constants never change the ratio' },
        body: {
          vi: 'Các hằng số (như k, pi, 1/2) giữ nguyên ở cả trước và sau, nên triệt tiêu khi so sánh. Chỉ cần theo dõi các biến bị thay đổi.',
          en: 'Constants (like k, pi, 1/2) are the same before and after, so they cancel in the comparison. Track only the variables that change.',
        },
        formula: 'F = frac(kab,d^2):  d → 2d  ⇒  F → frac(F,4)',
      },
      {
        title: { vi: 'Đi ngược: lấy căn', en: 'Backwards: take a root' },
        body: {
          vi: 'Nếu biết đại lượng đã nhân K lần và nó tỉ lệ với kích thước mũ e, thì kích thước đã nhân căn bậc e của K. Thể tích gấp 5 → cạnh gấp khoảng 1.71 (tăng 71%). Diện tích còn 81% → cạnh còn 90% (giảm 10%).',
          en: 'If the quantity was multiplied by K and it varies with a dimension to the e-th power, the dimension was multiplied by the e-th root of K. Volume times 5 → side about 1.71 times (up 71%). Area at 81% → side at 90% (down 10%).',
        },
        formula: 'k^3 = 5  →  k = 5^(frac(1,3)) ≈ 1.71',
      },
    ],
    examples: [
      {
        problem: 'The base of a triangle is doubled and its height is cut in half. How does its area change?',
        steps: [
          { vi: 'Thay b bằng 2b và h bằng h/2: A mới = (1/2)(2b)(h/2) = (1/2)bh.', en: 'Replace b with 2b and h with h/2: new A = (1/2)(2b)(h/2) = (1/2)bh.' },
          { vi: 'Hai hệ số 2 và 1/2 triệt tiêu: diện tích không đổi.', en: 'The factors 2 and 1/2 cancel: the area is unchanged.' },
        ],
        answer: 'It is unchanged.',
      },
      {
        problem: 'The radius of a circle is increased by 30%. By what percent does its area increase?',
        steps: [
          { vi: 'Bán kính mới 1.3r; diện tích mới pi(1.3r)² = 1.69 pi r².', en: 'New radius 1.3r; new area pi(1.3r)² = 1.69 pi r².' },
          { vi: 'Tăng 69%.', en: 'An increase of 69%.' },
        ],
        answer: '69%',
      },
      {
        problem: 'The volume of a cube is multiplied by 5. To the nearest percent, by what percent does its edge length increase?',
        steps: [
          { vi: 'Thể tích tỉ lệ với cạnh mũ 3: k³ = 5.', en: 'Volume varies with the edge cubed: k³ = 5.' },
          { vi: 'k = căn bậc ba của 5 ≈ 1.71: tăng khoảng 71%.', en: 'k = cube root of 5 ≈ 1.71: an increase of about 71%.' },
        ],
        answer: '71%',
      },
    ],
    traps: [
      { vi: 'Quên bình phương/lập phương hệ số của kích thước (bán kính tăng 10% → diện tích tăng 21%, không phải 10%).', en: 'Forgetting to square or cube the factor (radius up 10% → area up 21%, not 10%).' },
      { vi: 'Nghĩ tăng 20% và giảm 20% triệt tiêu nhau.', en: 'Thinking a 20% increase and a 20% decrease cancel.' },
      { vi: 'Biến ở mẫu số mà vẫn cho đại lượng thay đổi cùng chiều.', en: 'Making the quantity change in the same direction when the variable is in the denominator.' },
      { vi: 'Đi ngược bằng cách chia phần trăm thay vì lấy căn.', en: 'Working backwards by dividing the percent instead of taking a root.' },
    ],
    templates: {
      easy: ['psda-ratio-part-whole', 'psda-scale-drawing-proportion'],
      medium: ['pd-c-scale-formula-effect', 'pd-c-scale-percent-change', 'pd-c-scale-root-factor', 'pd-c-scale-area-percent-back'],
      hard: ['pd-c-scale-solve-inverse', 'pd-proportion-inverse'],
    },
    bookSet: [
      { slug: 'pd-c-scale-formula-effect', calc: true },
      { slug: 'pd-c-scale-percent-change', calc: true },
      { slug: 'pd-c-scale-percent-change', calc: true },
      { slug: 'pd-c-scale-formula-effect', calc: true },
      { slug: 'pd-c-scale-root-factor', calc: true },
      { slug: 'pd-c-scale-area-percent-back', calc: true },
      { slug: 'pd-c-scale-formula-effect', calc: true },
      { slug: 'pd-c-scale-solve-inverse', calc: true },
    ],
  },
  {
    n: 5,
    id: 'rates',
    title: { vi: 'Tốc độ & đổi đơn vị', en: 'Rates' },
    phase: 1,
    art: 'clock',
    bookPages: [34, 41],
    subtopics: [
      { vi: 'Tổng, tốc độ và thời gian', en: 'Total, rate and time' },
      { vi: 'Tốc độ từ hai lần đo', en: 'A rate from two readings' },
      { vi: 'Đếm món trọn vẹn: làm tròn xuống', en: 'Counting whole items: round down' },
      { vi: 'Hệ số đổi đơn vị', en: 'Conversion factors' },
      { vi: 'Bắt đầu từ đơn vị đề hỏi', en: 'Start from what the question asks' },
      { vi: 'So sánh hai phương án', en: 'Comparing two options' },
      { vi: 'Tốc độ viết bằng chữ', en: 'Rates written with variables' },
    ],
    theory: [
      {
        title: { vi: 'Công thức tốc độ', en: 'The rate formula' },
        body: {
          vi: 'Tổng = tốc độ × thời gian (quãng đường, sản lượng, tiền…). Muốn thời gian thì lấy tổng chia tốc độ. Cùng một công việc, tốc độ gấp đôi thì thời gian còn một nửa.',
          en: 'Total = rate × time (distance, output, money…). For the time, divide the total by the rate. For the same job, doubling the rate halves the time.',
        },
        formula: 'time = frac(total,rate)',
      },
      {
        title: { vi: 'Tốc độ từ hai lần đo', en: 'Rate from two readings' },
        body: {
          vi: 'Nếu đại lượng thay đổi đều, tốc độ bằng chênh lệch giá trị chia chênh lệch thời gian (hoặc vị trí). Từ đó cộng thêm để dự đoán một thời điểm khác.',
          en: 'If the quantity changes at a constant rate, the rate is the change in value divided by the change in time (or position). Then add on to predict another time.',
        },
        formula: 'rate = frac(value_2 - value_1,time_2 - time_1)',
      },
      {
        title: { vi: 'Món trọn vẹn: làm tròn xuống', en: 'Whole items: round down' },
        body: {
          vi: 'Khi hỏi số hộp đầy, số cốc đầy, số món mua được… thì lấy phần nguyên — phần lẻ không đủ thành một món.',
          en: 'When asked for full boxes, full cups, items you can afford…, keep only the whole-number part — a fraction is not enough for another item.',
        },
      },
      {
        title: { vi: 'Hệ số đổi đơn vị', en: 'Conversion factors' },
        body: {
          vi: 'Viết mỗi quan hệ đơn vị thành một phân số bằng 1, xếp sao cho đơn vị cũ nằm ở mẫu để triệt tiêu. Đơn vị còn lại cuối cùng phải là đơn vị đề hỏi.',
          en: 'Write each unit relationship as a fraction equal to 1, arranged so the old unit is in the denominator and cancels. The unit left at the end must be the one asked for.',
        },
        formula: 'frac(90 feet,1 minute) × frac(12 inches,1 foot) × frac(1 minute,60 seconds) = 18 inches per second',
      },
      {
        title: { vi: 'Bắt đầu từ đơn vị đề hỏi', en: 'Start from what is asked' },
        body: {
          vi: 'Đề hỏi "bao nhiêu mét trong một giờ" thì bắt đầu bằng 1 giờ, đổi ra giây, rồi nhân với tốc độ mét mỗi giây. Đi theo đơn vị sẽ không lạc.',
          en: 'For "how many meters in one hour", start with 1 hour, convert to seconds, then multiply by the meters-per-second rate. Following the units keeps you on track.',
        },
        formula: '1 hour × frac(3600 seconds,1 hour) × frac(1 meter,40 seconds) = 90 meters',
      },
      {
        title: { vi: 'So sánh hai phương án', en: 'Comparing two options' },
        body: {
          vi: 'Tính cùng một đại lượng (thời gian, chi phí) cho từng phương án rồi trừ nhau. Tốc độ trung bình của cả chuyến là TỔNG quãng đường chia TỔNG thời gian — không phải trung bình cộng các tốc độ.',
          en: 'Compute the same quantity (time, cost) for each option, then subtract. The average speed of a whole trip is TOTAL distance over TOTAL time — not the average of the speeds.',
        },
        formula: 'average speed = frac(d_1 + d_2,frac(d_1,v_1) + frac(d_2,v_2))',
      },
      {
        title: { vi: 'Tốc độ bằng chữ', en: 'Rates with letters' },
        body: {
          vi: 'Làm y như với số: viết đơn vị cạnh từng chữ, đổi đơn vị (đô la ra xu, tuần ra ngày), nhân chia sao cho đơn vị triệt tiêu. Có thể thử bằng số cụ thể để kiểm tra lựa chọn.',
          en: 'Work exactly as with numbers: attach units to each letter, convert units (dollars to cents, weeks to days), and multiply or divide so units cancel. Plugging in simple numbers checks the choices.',
        },
        formula: 'frac(100d cents,frac(c cents,4 pages) × p pages) = frac(400d,cp)',
      },
      {
        title: { vi: 'Đuổi kịp: tốc độ tương đối', en: 'Catching up: relative speed' },
        body: {
          vi: 'Hai vật cùng chiều thì khoảng cách giữa chúng thu hẹp với tốc độ bằng hiệu hai tốc độ. Thời gian đuổi kịp = khoảng cách ban đầu chia hiệu tốc độ.',
          en: 'For two objects moving the same way, the gap closes at the difference of their speeds. Catch-up time = starting gap ÷ difference in speeds.',
        },
        formula: 't = frac(gap,v_2 - v_1)',
      },
    ],
    examples: [
      {
        problem: 'A pump moves 45 liters of water per minute. How many minutes will it take to move 1,800 liters?',
        steps: [
          { vi: 'Thời gian = tổng chia tốc độ.', en: 'Time = total ÷ rate.' },
          { vi: '1800 ÷ 45 = 40 phút.', en: '1800 ÷ 45 = 40 minutes.' },
        ],
        answer: '40',
      },
      {
        problem: 'A robot moves 1 meter every 40 seconds. At this rate, how many meters does it move in one hour?',
        steps: [
          { vi: 'Bắt đầu từ 1 giờ = 3600 giây.', en: 'Start with 1 hour = 3600 seconds.' },
          { vi: '3600 ÷ 40 = 90 mét.', en: '3600 ÷ 40 = 90 meters.' },
        ],
        answer: '90',
      },
      {
        problem: 'Printing costs c cents for every 4 pages. Each booklet has p pages. How many booklets can be printed for d dollars?',
        steps: [
          { vi: 'Đổi d đô la thành 100d xu.', en: 'Convert d dollars to 100d cents.' },
          { vi: 'Một cuốn tốn (c/4)p xu, nên số cuốn là 100d ÷ (cp/4) = 400d/(cp).', en: 'One booklet costs (c/4)p cents, so the number is 100d ÷ (cp/4) = 400d/(cp).' },
        ],
        answer: 'frac(400d,cp)',
      },
      {
        problem: 'A cyclist rides 30 miles at 15 miles per hour and then 30 miles at 10 miles per hour. What is the average speed for the whole ride?',
        steps: [
          { vi: 'Thời gian: 2 giờ và 3 giờ, tổng 5 giờ.', en: 'Times: 2 hours and 3 hours, 5 hours in all.' },
          { vi: 'Tốc độ trung bình = 60 ÷ 5 = 12 (không phải 12.5).', en: 'Average speed = 60 ÷ 5 = 12 (not 12.5).' },
        ],
        answer: '12',
      },
    ],
    traps: [
      { vi: 'Lấy trung bình cộng các tốc độ thay vì tổng quãng đường chia tổng thời gian.', en: 'Averaging the speeds instead of total distance over total time.' },
      { vi: 'Làm tròn lên khi đề hỏi số món trọn vẹn.', en: 'Rounding up when the question asks for complete items.' },
      { vi: 'Đặt hệ số đổi đơn vị ngược, để đơn vị cũ không triệt tiêu.', en: 'Flipping a conversion factor so the old unit does not cancel.' },
      { vi: 'Quên đổi đô la ra xu, giờ ra phút trong bài có chữ.', en: 'Forgetting to convert dollars to cents or hours to minutes in letter problems.' },
    ],
    templates: {
      easy: [
        'pd-c-rate-two-legs-expr',
        'pd-c-rate-daily-weekly-grid',
        'pd-c-rate-from-two-readings',
        'pd-c-rate-inverse-time-grid',
        'pd-c-rate-unit-cost-expr',
        'pd-c-rate-share-expr',
        'pd-c-rate-scale-time-grid',
        'pd-c-cost-prop-area',
        'psda-speed-distance',
      ],
      medium: [
        'pd-c-rate-extrapolate',
        'pd-c-rate-clock-total',
        'pd-c-rate-budget-weeks-expr',
        'pd-c-rate-fee-expr',
        'pd-c-rate-temp-expr',
        'pd-c-rate-discount-additional-expr',
        'pd-c-rate-boxes-expr',
        'pd-c-rate-pizza-expr',
        'pd-c-unit-convert-rate-grid',
        'pd-c-commission-grid',
        'pd-c-rate-distance-closest',
        'pd-c-unit-max-full-cups',
        'pd-c-fuel-cost-mpg',
        'pd-c-buy-sell-profit-grid',
        'pd-c-rate-range-hours',
        'pd-conversion-chain',
        'psda-rate-unit-conversion',
      ],
      hard: [
        'pd-c-pct-change-expr-power',
        'pd-c-avg-speed-two-legs',
        'pd-c-rate-area-growth-grid',
        'pd-c-slow-clock',
        'pd-c-unit-chain-max-grid',
        'pd-c-catch-up-grid',
        'pd-rate-combined-work',
        'hard-ratio-square-units',
      ],
    },
    bookSet: [
      { slug: 'pd-c-rate-two-legs-expr', calc: false },
      { slug: 'pd-c-rate-daily-weekly-grid', calc: false },
      { slug: 'pd-c-rate-from-two-readings', calc: false },
      { slug: 'pd-c-rate-from-two-readings', calc: false },
      { slug: 'pd-c-rate-inverse-time-grid', calc: false },
      { slug: 'pd-c-rate-unit-cost-expr', calc: false },
      { slug: 'pd-c-rate-share-expr', calc: false },
      { slug: 'pd-c-rate-extrapolate', calc: false },
      { slug: 'pd-c-rate-clock-total', calc: false },
      { slug: 'pd-c-rate-budget-weeks-expr', calc: false },
      { slug: 'pd-c-rate-fee-expr', calc: false },
      { slug: 'pd-c-rate-temp-expr', calc: false },
      { slug: 'pd-c-rate-discount-additional-expr', calc: false },
      { slug: 'pd-c-rate-boxes-expr', calc: false },
      { slug: 'pd-c-rate-pizza-expr', calc: false },
      { slug: 'pd-c-pct-change-expr-power', calc: false },
      { slug: 'pd-c-avg-speed-two-legs', calc: true },
      { slug: 'pd-c-unit-convert-rate-grid', calc: true },
      { slug: 'pd-c-rate-scale-time-grid', calc: true },
      { slug: 'pd-c-rate-area-growth-grid', calc: true },
      { slug: 'pd-c-slow-clock', calc: true },
      { slug: 'pd-c-commission-grid', calc: true },
      { slug: 'pd-c-rate-distance-closest', calc: true },
      { slug: 'pd-c-unit-max-full-cups', calc: true },
      { slug: 'pd-c-fuel-cost-mpg', calc: true },
      { slug: 'pd-c-cost-prop-area', calc: true },
      { slug: 'pd-c-buy-sell-profit-grid', calc: true },
      { slug: 'pd-c-rate-range-hours', calc: true },
      { slug: 'pd-c-unit-chain-max-grid', calc: true },
      { slug: 'pd-c-catch-up-grid', calc: true },
    ],
  },
  {
    n: 6,
    id: 'expressions',
    title: { vi: 'Biểu thức', en: 'Expressions' },
    phase: 2,
    art: 'notebook',
    bookPages: [42, 48],
    subtopics: [
      { vi: 'Thu gọn số hạng đồng dạng', en: 'Combining like terms' },
      { vi: 'Khai triển và phân tích nhân tử', en: 'Expanding and factoring' },
      { vi: 'Cộng phân thức', en: 'Combining fractions' },
      { vi: 'Chia phân thức (lật ngược)', en: 'Dividing fractions (flipping)' },
      { vi: 'Tách phân thức', en: 'Splitting fractions' },
    ],
    theory: [
      {
        title: { vi: 'Số hạng đồng dạng', en: 'Like terms' },
        body: {
          vi: 'Chỉ gộp được các số hạng có PHẦN BIẾN giống hệt nhau (cùng biến, cùng số mũ). b² + b không thành b³; a + ab không thành 2ab. Phá ngoặc (nhớ phân phối dấu trừ) rồi mới gộp.',
          en: 'Only terms with IDENTICAL variable parts (same letters, same exponents) combine. b² + b is not b³; a + ab is not 2ab. Remove parentheses (distributing any minus sign) before combining.',
        },
        formula: '3a^2b^2 - a^2b^2 + 2b^2 = 2a^2b^2 + 2b^2',
      },
      {
        title: { vi: 'Phân phối và nhân hai nhị thức', en: 'Distributing and multiplying binomials' },
        body: {
          vi: 'Hệ số ngoài ngoặc nhân vào MỌI số hạng trong ngoặc — nhưng chỉ vào một thừa số của một tích. Nhân hai ngoặc: mỗi số hạng của ngoặc này nhân với mỗi số hạng của ngoặc kia.',
          en: 'A factor outside parentheses multiplies EVERY term inside — but only one factor of a product. Multiplying two parentheses: each term of one times each term of the other.',
        },
        formula: '(a + b)(c + d) = ac + ad + bc + bd',
      },
      {
        title: { vi: 'Ba hằng đẳng thức', en: 'Three identities' },
        body: {
          vi: 'Dùng cả hai chiều: khai triển và nhận ra để phân tích. Hiệu hai bình phương dùng được cho mọi "bình phương trừ bình phương", kể cả luỹ thừa bậc cao; có khi phải dùng hai lần.',
          en: 'Use them both ways: expanding and recognizing to factor. Difference of squares works for any "square minus square", including higher powers; sometimes you apply it twice.',
        },
        formula: '(a + b)^2 = a^2 + 2ab + b^2    (a - b)^2 = a^2 - 2ab + b^2    a^2 - b^2 = (a + b)(a - b)',
      },
      {
        title: { vi: 'Phân tích triệt để', en: 'Factoring completely' },
        body: {
          vi: 'Đặt nhân tử chung trước, rồi xem phần còn lại có phải hằng đẳng thức không, và lặp lại tới khi không phân tích được nữa.',
          en: 'Take out the common factor first, then check whether what remains is an identity, and repeat until nothing more factors.',
        },
        formula: '2x^4 - 32 = 2(x^2 + 4)(x + 2)(x - 2)',
      },
      {
        title: { vi: 'Cộng phân thức: quy đồng', en: 'Adding fractions: common denominator' },
        body: {
          vi: 'Nhân tử và mẫu của mỗi phân thức với phần còn thiếu của mẫu chung, rồi cộng tử.',
          en: 'Multiply the top and bottom of each fraction by whatever its denominator is missing from the common denominator, then add the numerators.',
        },
        formula: 'frac(2,x + 3) + frac(1,x - 3) = frac(3x - 3,(x + 3)(x - 3))',
      },
      {
        title: { vi: 'Chia phân thức: lật ngược', en: 'Dividing fractions: flip' },
        body: {
          vi: 'Chia cho một phân thức là nhân với nghịch đảo của nó. Phân thức chồng tầng: nhân cả tử lớn và mẫu lớn với mẫu chung của các phân thức nhỏ.',
          en: 'Dividing by a fraction means multiplying by its reciprocal. For a stacked fraction, multiply the big numerator and big denominator by the common denominator of the small fractions.',
        },
        formula: 'frac(frac(a,b),c) = frac(a,bc)    frac(a,frac(b,c)) = frac(ac,b)',
      },
      {
        title: { vi: 'Tách phân thức', en: 'Splitting fractions' },
        body: {
          vi: 'Tử là một tổng thì tách được thành các phân thức cùng mẫu. Mẫu là một tổng thì KHÔNG tách được.',
          en: 'A sum in the numerator can be split into fractions with the same denominator. A sum in the denominator can NOT be split.',
        },
        formula: 'frac(24 + k,8) = 3 + frac(k,8)',
      },
    ],
    examples: [
      {
        problem: 'Which of the following is equivalent to 9x^4 - 16y^2?',
        steps: [
          { vi: '9x⁴ là (3x²)², 16y² là (4y)².', en: '9x⁴ is (3x²)² and 16y² is (4y)².' },
          { vi: 'Hiệu hai bình phương: (3x² + 4y)(3x² − 4y).', en: 'Difference of squares: (3x² + 4y)(3x² − 4y).' },
        ],
        answer: '(3x^2 + 4y)(3x^2 - 4y)',
      },
      {
        problem: 'Which of the following is equivalent to frac(2,x + 3) + frac(1,x - 3)?',
        steps: [
          { vi: 'Mẫu chung (x + 3)(x − 3).', en: 'Common denominator (x + 3)(x − 3).' },
          { vi: 'Tử: 2(x − 3) + (x + 3) = 3x − 3.', en: 'Numerator: 2(x − 3) + (x + 3) = 3x − 3.' },
        ],
        answer: 'frac(3x - 3,(x + 3)(x - 3))',
      },
      {
        problem: 'Which of the following is equivalent to frac(x,frac(1,x - 2) + frac(1,x + 2))?',
        steps: [
          { vi: 'Cộng dưới mẫu: (x + 2 + x − 2)/((x − 2)(x + 2)) = 2x/(x² − 4).', en: 'Add the bottom: (x + 2 + x − 2)/((x − 2)(x + 2)) = 2x/(x² − 4).' },
          { vi: 'Chia là nhân với nghịch đảo: x · (x² − 4)/(2x) = (x² − 4)/2.', en: 'Dividing multiplies by the reciprocal: x · (x² − 4)/(2x) = (x² − 4)/2.' },
        ],
        answer: 'frac(x^2 - 4,2)',
      },
    ],
    traps: [
      { vi: 'Gộp các số hạng không đồng dạng (b² + b thành b³).', en: 'Combining unlike terms (b² + b becoming b³).' },
      { vi: 'Khai triển (a + b)² quên số hạng giữa 2ab.', en: 'Expanding (a + b)² and dropping the middle term 2ab.' },
      { vi: 'Dấu trừ trước ngoặc chỉ đổi dấu số hạng đầu.', en: 'A minus sign before parentheses changing only the first term.' },
      { vi: 'Tách một phân thức có tổng ở MẪU.', en: 'Splitting a fraction whose DENOMINATOR is a sum.' },
      { vi: 'Gạch số hạng thay vì gạch thừa số khi rút gọn.', en: 'Canceling terms instead of factors when simplifying.' },
    ],
    templates: {
      easy: ['pd-c-factor-gcf', 'pd-c-add-fractions-var', 'pd-c-expand-product', 'pd-c-split-fraction', 'pd-c-poly-sum', 'adv-difference-of-squares'],
      medium: [
        'pd-c-factor-fully',
        'pd-c-perfect-square-sub',
        'pd-c-factor-cancel',
        'pd-c-combine-radical-terms',
        'pd-c-eval-monomial-ratio',
        'adv-foil-binomial-product',
        'adv-expand-binomial-square',
        'adv-factor-trinomial',
        'adv-poly-subtract-coef',
      ],
      hard: ['pd-c-complex-fraction-sum', 'pd-c-complex-fraction-ratio', 'adv-rational-simplify'],
    },
    bookSet: [
      { slug: 'pd-c-factor-gcf', calc: false },
      { slug: 'pd-c-add-fractions-var', calc: false },
      { slug: 'pd-c-expand-product', calc: false },
      { slug: 'pd-c-split-fraction', calc: false },
      { slug: 'pd-c-factor-fully', calc: false },
      { slug: 'pd-c-perfect-square-sub', calc: false },
      { slug: 'pd-c-factor-cancel', calc: false },
      { slug: 'pd-c-complex-fraction-sum', calc: false },
      { slug: 'pd-c-complex-fraction-ratio', calc: false },
      { slug: 'pd-c-poly-sum', calc: true },
      { slug: 'pd-c-combine-radical-terms', calc: true },
      { slug: 'pd-c-eval-monomial-ratio', calc: true },
    ],
  },
  {
    n: 7,
    id: 'solving-equations',
    title: { vi: 'Biến đổi & giải phương trình', en: 'Manipulating & Solving Equations' },
    phase: 2,
    art: 'pencil',
    bookPages: [49, 61],
    subtopics: [
      { vi: 'Thu gọn trước khi giải', en: 'Combine like terms first' },
      { vi: 'Bình phương và khai căn đúng cách', en: 'Squaring and square-rooting correctly' },
      { vi: 'Nhân chéo', en: 'Cross-multiplying' },
      { vi: 'Cô lập biến bằng đặt nhân tử chung', en: 'Isolating a variable by factoring' },
      { vi: 'Coi một cụm là một ẩn', en: 'Treating an expression as a single unit' },
      { vi: 'Tìm thẳng giá trị một biểu thức', en: 'Solving for an expression directly' },
      { vi: 'Đoán và thử', en: 'Guess and check' },
    ],
    theory: [
      {
        title: { vi: 'Làm cùng một phép ở hai vế', en: 'Do the same thing to both sides' },
        body: {
          vi: 'Mỗi phép biến đổi áp cho CẢ HAI VẾ, và khi nhân/chia thì áp cho MỌI số hạng. Phá ngoặc, gom số hạng đồng dạng trước — nhiều khi biến tự triệt tiêu.',
          en: 'Every operation applies to BOTH SIDES, and when multiplying or dividing, to EVERY term. Expand and combine like terms first — often a variable cancels on its own.',
        },
      },
      {
        title: { vi: 'Bình phương cả vế, không phải từng số hạng', en: 'Square the whole side, not each term' },
        body: {
          vi: 'Bình phương hai vế thì bình phương CẢ vế: (a − b)² chứ không phải a² − b². Có căn thì cô lập căn trước rồi mới bình phương. Khai căn phương trình x² = k cho HAI nghiệm ±; còn ký hiệu căn luôn cho số không âm.',
          en: 'Squaring both sides squares the WHOLE side: (a − b)², not a² − b². Isolate a radical before squaring. Taking the root of x² = k gives TWO solutions ±; the radical symbol itself is always nonnegative.',
        },
        formula: '(x - 2)^2 = 81  →  x - 2 = ±9  →  x = 11 or x = -7',
      },
      {
        title: { vi: 'Nhân chéo', en: 'Cross-multiplying' },
        body: {
          vi: 'Hai phân số bằng nhau thì tử này nhân mẫu kia bằng nhau. Dùng được cả khi mẫu có chứa ẩn.',
          en: 'If two fractions are equal, each numerator times the other denominator are equal. Works even when the denominators contain the variable.',
        },
        formula: 'frac(a,b) = frac(c,d)  →  ad = bc',
      },
      {
        title: { vi: 'Cô lập một biến trong công thức', en: 'Isolating a variable in a formula' },
        body: {
          vi: 'Coi các chữ khác như số. Gom mọi số hạng chứa biến cần tìm về một vế, đặt nó làm nhân tử chung, rồi chia. Nhóm số hạng cũng là cách phân tích phương trình bậc cao.',
          en: 'Treat the other letters as numbers. Gather every term containing the target variable on one side, factor it out, then divide. Grouping terms is also how to factor higher-degree equations.',
        },
        formula: 'y = frac(x,2x + k)  →  2xy + ky = x  →  x(2y - 1) = -ky  →  x = frac(ky,1 - 2y)',
      },
      {
        title: { vi: 'Coi một cụm là một ẩn', en: 'Treat a messy chunk as one unit' },
        body: {
          vi: 'Cụm lặp lại (như x + 1, hay x²) có thể coi là một ẩn mới u. Giải theo u rồi quay về x. Biểu thức rối trong công thức cũng coi như một khối khi chuyển vế.',
          en: 'A repeated chunk (like x + 1, or x²) can be renamed u. Solve for u, then go back to x. A complicated expression in a formula can also be moved around as one block.',
        },
        formula: '(x + 1)^2 - 5(x + 1) + 6 = 0  →  u^2 - 5u + 6 = 0',
      },
      {
        title: { vi: 'Tìm thẳng biểu thức đề hỏi', en: 'Solve for the expression that is asked' },
        body: {
          vi: 'Đề hỏi giá trị của một biểu thức (x + 3y, 6x − 7, x² + 3…) thì thường chỉ cần nhân/chia hay cộng trừ phương trình đã cho, không cần tìm từng ẩn.',
          en: 'When the question asks for an expression (x + 3y, 6x − 7, x² + 3…), usually you only need to scale or shift the given equation, not find each variable.',
        },
        formula: '4x + 12y = 20  →  x + 3y = 5',
      },
      {
        title: { vi: 'Đoán và thử', en: 'Guess and check' },
        body: {
          vi: 'Với phương trình bậc cao hay có căn mà đề chỉ hỏi một nghiệm dương, thử các số nguyên nhỏ (1, 2, 3…) thường nhanh hơn giải tổng quát. Luôn thế lại để kiểm tra.',
          en: 'For a high-degree or radical equation that asks for one positive solution, trying small integers (1, 2, 3…) is often faster than solving in general. Always substitute back to check.',
        },
      },
    ],
    examples: [
      {
        problem: 'If a = b - 2c and 3(a - b) + 6c = k, what is the value of k?',
        steps: [
          { vi: 'Phá ngoặc: 3a − 3b + 6c.', en: 'Expand: 3a − 3b + 6c.' },
          { vi: 'Thay a: 3b − 6c − 3b + 6c = 0.', en: 'Substitute a: 3b − 6c − 3b + 6c = 0.' },
        ],
        answer: '0',
      },
      {
        problem: 'If (x - 4)^2 = 49, what is the sum of the two solutions?',
        steps: [
          { vi: 'x − 4 = 7 hoặc x − 4 = −7.', en: 'x − 4 = 7 or x − 4 = −7.' },
          { vi: 'x = 11 hoặc x = −3, tổng bằng 8.', en: 'x = 11 or x = −3; the sum is 8.' },
        ],
        answer: '8',
      },
      {
        problem: 'If frac(4,x - 3) - frac(2,x + 3) = 0, what is the value of x?',
        steps: [
          { vi: 'Chuyển vế rồi nhân chéo: 4(x + 3) = 2(x − 3).', en: 'Move a term and cross-multiply: 4(x + 3) = 2(x − 3).' },
          { vi: '4x + 12 = 2x − 6, x = −9.', en: '4x + 12 = 2x − 6, x = −9.' },
        ],
        answer: '-9',
      },
      {
        problem: 'If 2x + 8y = 10, what is the value of x + 4y?',
        steps: [{ vi: 'Chia hai vế cho 2.', en: 'Divide both sides by 2.' }, { vi: 'x + 4y = 5.', en: 'x + 4y = 5.' }],
        answer: '5',
      },
    ],
    traps: [
      { vi: 'Bình phương từng số hạng: (a − b)² thành a² − b².', en: 'Squaring term by term: (a − b)² becoming a² − b².' },
      { vi: 'Quên nghiệm âm khi khai căn x² = k.', en: 'Forgetting the negative solution when taking the root of x² = k.' },
      { vi: 'Nhân hai vế với mẫu nhưng quên nhân số hạng không có mẫu.', en: 'Multiplying by the denominator but forgetting the term without one.' },
      { vi: 'Cô lập biến mà không đặt nhân tử chung khi biến xuất hiện ở hai số hạng.', en: 'Trying to isolate a variable that appears in two terms without factoring it out.' },
    ],
    templates: {
      easy: [
        'pd-c-sum-power-sub',
        'pd-c-solve-then-expression',
        'pd-c-frac-coef-solve',
        'pd-c-square-neg-root',
        'pd-c-neg-root-solve',
        'pd-c-solve-expression-square',
        'pd-c-translate-twice',
        'pd-c-isolate-linear-letters',
        'alg-linear-one-var-fraction',
      ],
      medium: [
        'pd-c-square-both-sides-equal',
        'pd-c-product-equation-expr',
        'pd-c-cross-mult-isolate',
        'pd-c-isolate-formula',
        'pd-c-ratio-flip',
        'pd-c-radical-solve-grid',
        'pd-c-radical-collect-grid',
        'pd-c-proportion-then-recip',
        'pd-c-formula-substitute-solve',
        'pd-isolate-variable',
        'alg-linear-one-var-distribute',
      ],
      hard: ['pd-c-high-degree-solve', 'pd-c-all-values-identity', 'pd-c-isolate-exponent-base', 'pd-c-half-life-rate-approx', 'alg-linear-one-var-infinite', 'hard-lin1-two-fractions'],
    },
    bookSet: [
      { slug: 'pd-c-sum-power-sub', calc: false },
      { slug: 'pd-c-square-both-sides-equal', calc: false },
      { slug: 'pd-c-product-equation-expr', calc: false },
      { slug: 'pd-c-solve-then-expression', calc: false },
      { slug: 'pd-c-frac-coef-solve', calc: false },
      { slug: 'pd-c-solve-then-expression', calc: false },
      { slug: 'pd-c-cross-mult-isolate', calc: false },
      { slug: 'pd-c-square-neg-root', calc: false },
      { slug: 'pd-c-isolate-formula', calc: false },
      { slug: 'pd-c-ratio-flip', calc: false },
      { slug: 'pd-c-neg-root-solve', calc: false },
      { slug: 'pd-c-solve-expression-square', calc: false },
      { slug: 'pd-c-high-degree-solve', calc: false },
      { slug: 'pd-c-radical-solve-grid', calc: false },
      { slug: 'pd-c-radical-collect-grid', calc: false },
      { slug: 'pd-c-translate-twice', calc: true },
      { slug: 'pd-c-proportion-then-recip', calc: true },
      { slug: 'pd-c-formula-substitute-solve', calc: true },
      { slug: 'pd-c-isolate-linear-letters', calc: true },
      { slug: 'pd-c-all-values-identity', calc: true },
      { slug: 'pd-c-isolate-formula', calc: true },
      { slug: 'pd-c-scale-formula-effect', calc: true },
      { slug: 'pd-c-isolate-exponent-base', calc: true },
      { slug: 'pd-c-half-life-rate-approx', calc: true },
    ],
  },
  {
    n: 8,
    id: 'equation-strategies',
    title: { vi: 'Thêm chiến thuật giải phương trình', en: 'More Equation Solving Strategies' },
    phase: 2,
    art: 'bulb',
    bookPages: [62, 66],
    subtopics: [
      { vi: 'Đồng nhất hệ số', en: 'Matching coefficients' },
      { vi: 'Khử mẫu', en: 'Clearing denominators' },
    ],
    theory: [
      {
        title: { vi: 'Đồng nhất hệ số', en: 'Matching coefficients' },
        body: {
          vi: 'Hai đa thức bằng nhau VỚI MỌI x thì hệ số của từng luỹ thừa của x ở hai vế phải bằng nhau (cả hằng số). Khai triển vế có ngoặc rồi so từng bậc.',
          en: 'If two polynomials are equal FOR ALL x, the coefficients of each power of x (including the constants) must match. Expand the side with parentheses, then compare power by power.',
        },
        formula: '(x + a)^2 = x^2 + kx + b  →  2a = k,  a^2 = b',
      },
      {
        title: { vi: 'So hệ số để tìm một tích', en: 'Matching to find a product' },
        body: {
          vi: 'Nhiều khi không cần từng ẩn: so số hạng giữa của một bình phương cho luôn giá trị của tích (như xy), từ đó tính biểu thức đề hỏi.',
          en: 'Often you do not need each unknown: matching the middle term of a square gives the product (such as xy) directly, and from it the requested value.',
        },
        formula: '(x + 2y)^2 = x^2 + 4y^2 + 20  →  4xy = 20',
      },
      {
        title: { vi: 'Khử mẫu', en: 'Clearing denominators' },
        body: {
          vi: 'Nhân hai vế với tích (hoặc bội chung nhỏ nhất) của các mẫu để mất hết phân số — kể cả mẫu có chứa ẩn. Phương trình thường thành bậc hai; giải rồi LOẠI nghiệm làm mẫu bằng 0 và nghiệm trái với điều kiện đề cho.',
          en: 'Multiply both sides by the product (or least common multiple) of the denominators so every fraction disappears — including denominators with the variable. The result is often a quadratic; solve it, then REJECT any solution that makes a denominator zero or breaks a given condition.',
        },
        formula: 'frac(3,x) - frac(3,x - 12) = 1  →  3(x - 12) - 3x = x(x - 12)  →  x^2 - 12x + 36 = 0',
      },
      {
        title: { vi: 'Kết hợp hai kỹ thuật', en: 'Combining the two' },
        body: {
          vi: 'Đẳng thức có phân thức đúng với mọi x: khử mẫu trước, rồi đồng nhất hệ số. Phép chia đa thức có dư cũng vậy: nhân ngược thương với số chia rồi cộng dư, so với số bị chia.',
          en: 'For a rational identity true for all x: clear the denominators first, then match coefficients. The same works for polynomial division with a remainder: multiply the quotient by the divisor, add the remainder, and compare with the dividend.',
        },
        formula: 'frac(P(x),D(x)) = Q(x) + frac(R,D(x))  →  P(x) = Q(x)D(x) + R',
      },
    ],
    examples: [
      {
        problem: 'If (x + a)^2 = x^2 + 10x + b for all values of x, what is the value of b?',
        steps: [
          { vi: 'Khai triển: x² + 2ax + a².', en: 'Expand: x² + 2ax + a².' },
          { vi: '2a = 10 nên a = 5; b = a² = 25.', en: '2a = 10 so a = 5; b = a² = 25.' },
        ],
        answer: '25',
      },
      {
        problem: 'What is the greatest value of x that satisfies frac(2,x) - frac(2,x - 9) = 1?',
        steps: [
          { vi: 'Nhân hai vế với x(x − 9): 2(x − 9) − 2x = x(x − 9).', en: 'Multiply by x(x − 9): 2(x − 9) − 2x = x(x − 9).' },
          { vi: '−18 = x² − 9x, tức x² − 9x + 18 = 0 = (x − 3)(x − 6). Không nghiệm nào làm mẫu bằng 0; lớn nhất là 6.', en: '−18 = x² − 9x, so x² − 9x + 18 = 0 = (x − 3)(x − 6). Neither makes a denominator zero; the greatest is 6.' },
        ],
        answer: '6',
      },
      {
        problem: 'If frac(ax^2 + 5,x - 1) = 3x + 3 + frac(8,x - 1) for all x != 1, what is the value of a?',
        steps: [
          { vi: 'Nhân ngược: ax² + 5 = (3x + 3)(x − 1) + 8 = 3x² + 5.', en: 'Multiply back: ax² + 5 = (3x + 3)(x − 1) + 8 = 3x² + 5.' },
          { vi: 'So hệ số x²: a = 3.', en: 'Match the x² coefficient: a = 3.' },
        ],
        answer: '3',
      },
    ],
    traps: [
      { vi: 'Quên loại nghiệm làm mẫu bằng 0.', en: 'Keeping a solution that makes a denominator zero.' },
      { vi: 'Khai triển bình phương quên hệ số 2 của số hạng giữa.', en: 'Expanding a square and forgetting the 2 in the middle term.' },
      { vi: 'Nhân hai vế với mẫu nhưng bỏ sót một số hạng không có mẫu.', en: 'Multiplying by the denominators but skipping a term that had none.' },
      { vi: 'Đồng nhất hệ số khi đẳng thức chỉ đúng với MỘT giá trị x (phải đúng với mọi x).', en: 'Matching coefficients when the equation holds for only ONE value of x (it must hold for all x).' },
    ],
    templates: {
      easy: ['pd-match-coef-easy', 'pd-c-match-coef-product', 'pd-c-identity-split-fraction'],
      medium: [
        'pd-c-square-cross-term',
        'pd-c-perfect-square-match',
        'pd-c-reciprocal-sum-isolate',
        'pd-c-division-remainder-match',
        'pd-c-cubic-product-match',
        'pd-c-rational-common-den-grid',
        'pd-matching-coefficients',
      ],
      hard: ['pd-c-rational-to-quadratic', 'pd-c-match-coef-two-values', 'pd-c-rational-clear-grid', 'pd-c-rational-two-roots-grid', 'pd-clearing-denominators'],
    },
    bookSet: [
      { slug: 'pd-c-match-coef-product', calc: false },
      { slug: 'pd-c-square-cross-term', calc: false },
      { slug: 'pd-c-identity-split-fraction', calc: false },
      { slug: 'pd-c-rational-to-quadratic', calc: false },
      { slug: 'pd-c-perfect-square-match', calc: false },
      { slug: 'pd-c-reciprocal-sum-isolate', calc: false },
      { slug: 'pd-c-match-coef-two-values', calc: false },
      { slug: 'pd-c-division-remainder-match', calc: false },
      { slug: 'pd-c-cubic-product-match', calc: false },
      { slug: 'pd-c-rational-clear-grid', calc: false },
      { slug: 'pd-c-rational-two-roots-grid', calc: false },
      { slug: 'pd-c-rational-common-den-grid', calc: false },
    ],
  },
  {
    n: 9,
    id: 'systems',
    title: { vi: 'Hệ phương trình', en: 'Systems of Equations' },
    phase: 2,
    art: 'calculator',
    bookPages: [67, 78],
    subtopics: [
      { vi: 'Phương pháp thế', en: 'Substitution' },
      { vi: 'Phương pháp cộng đại số', en: 'Elimination' },
      { vi: 'Tìm thẳng một tổng/hiệu các ẩn', en: 'Solving for a combination directly' },
      { vi: 'Hệ vô nghiệm', en: 'Systems with no solution' },
      { vi: 'Hệ vô số nghiệm', en: 'Systems with infinitely many solutions' },
      { vi: 'Bài toán có lời', en: 'Word problems' },
      { vi: 'Hệ phức tạp hơn', en: 'More complicated systems' },
      { vi: 'Nghiệm của hệ trên đồ thị', en: 'Solutions as intersection points' },
    ],
    theory: [
      {
        title: { vi: 'Thế', en: 'Substitution' },
        body: {
          vi: 'Rút một ẩn từ phương trình dễ (thường là ẩn có hệ số 1) rồi thay vào phương trình kia. Giải xong ẩn thứ nhất thì thế ngược để tìm ẩn còn lại.',
          en: 'Solve the easier equation for one variable (usually one with coefficient 1) and plug it into the other. After finding one variable, substitute back for the other.',
        },
        formula: 'x = 7 - 2y,  3x + y = 1  →  3(7 - 2y) + y = 1',
      },
      {
        title: { vi: 'Cộng đại số', en: 'Elimination' },
        body: {
          vi: 'Nhân một (hoặc cả hai) phương trình để hệ số của một ẩn bằng nhau hoặc đối nhau, rồi trừ hoặc cộng để ẩn đó biến mất. Khi cả hai phương trình đã ở dạng ax + by = c, cộng đại số thường nhanh hơn.',
          en: 'Multiply one (or both) equations so one variable has equal or opposite coefficients, then subtract or add to eliminate it. When both equations are in ax + by = c form, elimination is usually faster.',
        },
        formula: '2x + 3y = 12,  4x - y = 10  →  (2x + 3y) × 2 - (4x - y) = 14  →  y = 2',
      },
      {
        title: { vi: 'Đề hỏi một tổng hay hiệu', en: 'When the question asks for a combination' },
        body: {
          vi: 'Nếu đề hỏi x + y, x − y… hãy thử cộng hoặc trừ nguyên hai phương trình trước: nhiều khi ra ngay bội số của biểu thức cần tìm.',
          en: 'If the question asks for x + y, x − y…, try adding or subtracting the whole equations first: you often get a multiple of the target directly.',
        },
        formula: '5x + 2y = 17,  2x + 5y = 11  →  7x + 7y = 28  →  x + y = 4',
      },
      {
        title: { vi: 'Vô nghiệm', en: 'No solution' },
        body: {
          vi: 'Hệ hai phương trình bậc nhất vô nghiệm khi vế trái của phương trình này là bội của vế trái phương trình kia nhưng vế phải KHÔNG theo cùng bội — hai đường song song. Tìm tham số bằng cách cho tỉ số các hệ số x và y bằng nhau.',
          en: 'A linear system has no solution when one left side is a multiple of the other but the right side is NOT the same multiple — the lines are parallel. Find a parameter by setting the ratios of the x- and y-coefficients equal.',
        },
        formula: 'frac(a_1,a_2) = frac(b_1,b_2) != frac(c_1,c_2)',
      },
      {
        title: { vi: 'Vô số nghiệm', en: 'Infinitely many solutions' },
        body: {
          vi: 'Vô số nghiệm khi một phương trình là bội của phương trình kia (kể cả vế phải) — hai đường trùng nhau. Tìm hệ số tỉ lệ từ cặp số đã biết rồi áp cho các hằng số chưa biết.',
          en: 'Infinitely many solutions when one equation is a multiple of the other (right side included) — the lines coincide. Find the scale factor from a known pair and apply it to the unknown constants.',
        },
        formula: 'frac(a_1,a_2) = frac(b_1,b_2) = frac(c_1,c_2)',
      },
      {
        title: { vi: 'Bài toán có lời: hai ẩn, hai phương trình', en: 'Word problems: two unknowns, two equations' },
        body: {
          vi: 'Dạng hay gặp: một phương trình đếm số lượng (x + y = tổng số món), một phương trình tính giá trị (giá × số lượng cộng lại = tổng tiền hoặc tổng điểm).',
          en: 'The usual pattern: one equation counts items (x + y = total count), another adds up values (price × quantity summed = total money or points).',
        },
        formula: 'x + y = 24,  2x + 6y = 88',
      },
      {
        title: { vi: 'Hệ có phương trình phi tuyến', en: 'Systems with a nonlinear equation' },
        body: {
          vi: 'Thế phương trình bậc nhất vào phương trình bậc hai (hay có căn) để được phương trình một ẩn; nhớ loại nghiệm không thoả điều kiện. Có khi nhân hoặc chia các phương trình với nhau cho kết quả nhanh hơn.',
          en: 'Substitute the linear equation into the quadratic (or radical) one to get a single-variable equation; discard solutions that break a condition. Sometimes multiplying or dividing the equations together is faster.',
        },
      },
      {
        title: { vi: 'Nghiệm là giao điểm', en: 'Solutions are intersection points' },
        body: {
          vi: 'Mỗi nghiệm của hệ là một giao điểm của hai đồ thị. Hai đường thẳng: cắt nhau → 1 nghiệm, song song → 0, trùng nhau → vô số. Đường thẳng và parabol: đưa về phương trình bậc hai, dấu của biệt thức cho số giao điểm (0, 1 hoặc 2).',
          en: 'Each solution of a system is an intersection point of the graphs. Two lines: crossing → 1 solution, parallel → 0, the same line → infinitely many. A line and a parabola: reduce to a quadratic; the sign of the discriminant gives 0, 1 or 2 intersections.',
        },
        formula: 'b^2 - 4ac > 0: 2,  = 0: 1,  < 0: 0',
      },
    ],
    examples: [
      {
        problem: 'What is the solution (x, y) to the system x = 7 - 2y and 3x + y = 1?',
        steps: [
          { vi: 'Thế: 3(7 − 2y) + y = 1 → 21 − 5y = 1 → y = 4.', en: 'Substitute: 3(7 − 2y) + y = 1 → 21 − 5y = 1 → y = 4.' },
          { vi: 'x = 7 − 8 = −1.', en: 'x = 7 − 8 = −1.' },
        ],
        answer: '(-1, 4)',
      },
      {
        problem: 'If 5x + 2y = 17 and 2x + 5y = 11, what is the value of x + y?',
        steps: [{ vi: 'Cộng hai phương trình: 7x + 7y = 28.', en: 'Add the equations: 7x + 7y = 28.' }, { vi: 'x + y = 4.', en: 'x + y = 4.' }],
        answer: '4',
      },
      {
        problem: 'For what value of k does the system 3x - ky = 4 and 6x + 8y = 5 have no solution?',
        steps: [
          { vi: 'Hệ số x gấp đôi, nên hệ số y cũng phải gấp đôi: −2k = 8.', en: 'The x-coefficient doubles, so the y-coefficient must too: −2k = 8.' },
          { vi: 'k = −4; vế phải 8 khác 5 nên vô nghiệm.', en: 'k = −4; the right sides 8 and 5 differ, so there is no solution.' },
        ],
        answer: '-4',
      },
      {
        problem: 'A ferry has 24 benches. Some seat 2 people and the rest seat 6. If 88 passengers fill every seat, how many 2-seat benches are there?',
        steps: [
          { vi: 'x + y = 24 và 2x + 6y = 88.', en: 'x + y = 24 and 2x + 6y = 88.' },
          { vi: 'Nhân phương trình đầu với 6 rồi trừ: 4x = 56, x = 14.', en: 'Multiply the first by 6 and subtract: 4x = 56, x = 14.' },
        ],
        answer: '14',
      },
    ],
    traps: [
      { vi: 'Tìm được y rồi dừng trong khi đề hỏi x (hay x + y).', en: 'Finding y and stopping when the question asks for x (or x + y).' },
      { vi: 'Hệ vô số nghiệm mà chỉ cho các hệ số tỉ lệ, quên vế phải.', en: 'For infinitely many solutions, matching the coefficients but forgetting the right side.' },
      { vi: 'Nhân một phương trình mà quên nhân vế phải.', en: 'Scaling an equation but forgetting to scale its right side.' },
      { vi: 'Đếm "hai nghiệm" cho hai đường thẳng — hai đường chỉ có 0, 1 hoặc vô số điểm chung.', en: 'Counting "two solutions" for two lines — lines share 0, 1 or infinitely many points.' },
    ],
    templates: {
      easy: ['pd-c-sys-substitution-pair', 'pd-c-sys-solve-pair', 'pd-system-elimination-easy'],
      medium: [
        'pd-c-sys-combo-trick',
        'pd-c-sys-rearrange-product',
        'pd-c-line-parabola-count',
        'pd-c-sys-count-solutions',
        'pd-c-sys-infinite-param',
        'pd-c-sys-one-solution-exclude',
        'pd-c-sys-fraction-coef',
        'pd-c-sys-decimal-grid',
        'pd-c-sys-score-model',
        'pd-c-sys-darts-grid',
        'pd-c-sys-tables-count',
        'alg-system-substitution-y',
        'alg-systems-ticket-prices',
      ],
      hard: ['pd-c-sys-infinite-ratio', 'pd-c-sys-radical-grid', 'pd-c-sys-weights-express', 'alg-system-no-solution-k', 'adv-system-linear-quadratic-sum', 'hard-system-no-solution-product'],
    },
    bookSet: [
      { slug: 'pd-c-sys-substitution-pair', calc: false },
      { slug: 'pd-c-sys-solve-pair', calc: false },
      { slug: 'pd-c-sys-combo-trick', calc: false },
      { slug: 'pd-c-sys-combo-trick', calc: false },
      { slug: 'pd-c-sys-rearrange-product', calc: false },
      { slug: 'pd-c-line-parabola-count', calc: false },
      { slug: 'pd-c-sys-solve-pair', calc: false },
      { slug: 'pd-c-sys-count-solutions', calc: false },
      { slug: 'pd-c-sys-infinite-param', calc: false },
      { slug: 'pd-c-sys-one-solution-exclude', calc: false },
      { slug: 'pd-c-sys-fraction-coef', calc: false },
      { slug: 'pd-c-sys-decimal-grid', calc: false },
      { slug: 'alg-system-no-solution-k', calc: false },
      { slug: 'pd-c-sys-count-solutions', calc: false },
      { slug: 'pd-c-sys-infinite-ratio', calc: false },
      { slug: 'pd-c-sys-radical-grid', calc: false },
      { slug: 'pd-c-sys-weights-express', calc: true },
      { slug: 'pd-c-sys-score-model', calc: true },
      { slug: 'pd-c-sys-darts-grid', calc: true },
      { slug: 'pd-c-sys-tables-count', calc: true },
    ],
  },
  {
    n: 10,
    id: 'inequalities',
    title: { vi: 'Bất phương trình', en: 'Inequalities' },
    phase: 2,
    art: 'magnifier',
    bookPages: [79, 89],
    subtopics: [
      { vi: 'Giải bất phương trình', en: 'Solving inequalities' },
      { vi: 'Bất phương trình kép', en: 'Compound inequalities' },
      { vi: 'Bài toán có lời', en: 'Inequality word problems' },
      { vi: 'Đồ thị bất phương trình', en: 'Graphing inequalities' },
      { vi: 'Hệ bất phương trình', en: 'Systems of inequalities' },
    ],
    theory: [
      {
        title: { vi: 'Đổi chiều khi nhân/chia số âm', en: 'Flip when multiplying or dividing by a negative' },
        body: {
          vi: 'Giải như phương trình, NHƯNG nhân hoặc chia hai vế cho một số âm thì đổi chiều dấu. Chia một số âm cho số dương (−12 ÷ 3) thì KHÔNG đổi chiều — chỉ số chia mới quyết định.',
          en: 'Solve like an equation, BUT when you multiply or divide both sides by a negative number, flip the sign. Dividing a negative number by a positive one (−12 ÷ 3) does NOT flip — only the divisor matters.',
        },
        formula: '-3x > 12  →  x < -4',
      },
      {
        title: { vi: 'Kiểm một giá trị có là nghiệm', en: 'Checking whether a value is a solution' },
        body: {
          vi: 'Thay giá trị vào hai vế rồi so. Với câu hỏi số nguyên lớn nhất/nhỏ nhất, giải ra biên rồi chọn số nguyên gần biên nhất nằm đúng phía (dấu nghiêm ngặt thì không lấy chính biên).',
          en: 'Substitute the value into both sides and compare. For the greatest/least integer, solve for the boundary, then take the nearest integer on the correct side (a strict sign excludes the boundary itself).',
        },
      },
      {
        title: { vi: 'Bất phương trình kép', en: 'Compound inequalities' },
        body: {
          vi: 'Làm cùng một phép cho cả BA vế. Nếu thấy rối, tách thành hai bất phương trình rồi giải riêng.',
          en: 'Do the same operation to all THREE parts. If it gets messy, split into two inequalities and solve each.',
        },
        formula: '-7 < 2x + 1 < 9  →  -4 < x < 4',
      },
      {
        title: { vi: 'Câu chữ → dấu', en: 'Words → symbols' },
        body: {
          vi: '"Ít nhất" là ≥, "nhiều nhất / không quá" là ≤, "hơn" là >, "kém hơn" là <. "Nằm trong khoảng d quanh m" là m − d ≤ n ≤ m + d. Nhớ đổi đơn vị (phút ra giờ) trước khi lập bất phương trình.',
          en: '"At least" is ≥, "at most / no more than" is ≤, "more than" is >, "less than" is <. "Within d of m" is m − d ≤ n ≤ m + d. Convert units (minutes to hours) before writing the inequality.',
        },
        formula: '20 minutes = frac(1,3) hour',
      },
      {
        title: { vi: 'Đồ thị: phía trên, phía dưới', en: 'Graphs: above and below' },
        body: {
          vi: 'y > (hoặc ≥) một biểu thức là miền PHÍA TRÊN đường thẳng; y < là miền phía dưới. Dấu nghiêm ngặt thì vẽ nét đứt, có dấu bằng thì nét liền. Đường ngang qua (0, h) là y = h; đường dọc qua (h, 0) là x = h.',
          en: 'y > (or ≥) an expression is the region ABOVE the line; y < is below. Strict signs are drawn dashed, signs with "or equal" solid. The horizontal line through (0, h) is y = h; the vertical line through (h, 0) is x = h.',
        },
      },
      {
        title: { vi: 'Hệ bất phương trình', en: 'Systems of inequalities' },
        body: {
          vi: 'Nghiệm của hệ là phần CHỒNG LÊN NHAU của các miền: một điểm là nghiệm khi thoả mọi bất phương trình. Giá trị lớn nhất/nhỏ nhất của một ẩn thường nằm ở giao điểm của hai đường biên.',
          en: 'The solution of a system is the OVERLAP of the regions: a point is a solution if it satisfies every inequality. The greatest or least value of a variable usually occurs where the boundary lines intersect.',
        },
        formula: 'y >= 2x,  x + y >= 240  →  y = 2x,  x + y = 240  →  (80, 160)',
      },
    ],
    examples: [
      {
        problem: 'What is the greatest integer x that satisfies 7 - 3x > 2x - 18?',
        steps: [
          { vi: 'Gom x: −5x > −25.', en: 'Collect x: −5x > −25.' },
          { vi: 'Chia cho −5, đổi chiều: x < 5; số nguyên lớn nhất là 4.', en: 'Divide by −5 and flip: x < 5; the greatest integer is 4.' },
        ],
        answer: '4',
      },
      {
        problem: 'A shelter must have at least four times as many volunteers v as dogs d, and the dogs and volunteers must total at least 250. What is the minimum number of volunteers?',
        steps: [
          { vi: 'Hệ: v ≥ 4d và v + d ≥ 250.', en: 'System: v ≥ 4d and v + d ≥ 250.' },
          { vi: 'Nhỏ nhất tại giao điểm: v = 4d, 5d = 250 → d = 50, v = 200.', en: 'The minimum is at the intersection: v = 4d, 5d = 250 → d = 50, v = 200.' },
        ],
        answer: '200',
      },
      {
        problem: 'Which quadrants contain solutions to the system y > 2x + 1 and y > -x + 4?',
        steps: [
          { vi: 'Miền nằm phía trên cả hai đường; hai đường cắt nhau tại (1, 3).', en: 'The region lies above both lines, which meet at (1, 3).' },
          { vi: 'Phía trên cả hai đường có điểm ở góc phần tư I và II (ví dụ (1, 10) và (−1, 10)), không có điểm nào ở III hay IV.', en: 'Above both lines there are points in quadrants I and II (such as (1, 10) and (−1, 10)), and none in III or IV.' },
        ],
        answer: 'I and II',
      },
    ],
    traps: [
      { vi: 'Quên đổi chiều khi chia cho số âm.', en: 'Forgetting to flip when dividing by a negative.' },
      { vi: 'Đổi chiều khi chỉ có SỐ BỊ CHIA âm.', en: 'Flipping when only the number being divided is negative.' },
      { vi: 'Nhầm "ít nhất" với "nhiều nhất".', en: 'Mixing up "at least" and "at most".' },
      { vi: 'Nhầm nét đứt/nét liền, hoặc nhầm phía trên với phía dưới.', en: 'Mixing up dashed/solid lines or above/below.' },
      { vi: 'Bình phương hay nghịch đảo hai vế mà vẫn giữ chiều (phụ thuộc dấu).', en: 'Squaring or taking reciprocals of both sides and keeping the direction (it depends on signs).' },
    ],
    templates: {
      easy: ['pd-c-ineq-which-solution', 'pd-c-ineq-within-tolerance', 'pd-inequality-solve-easy', 'alg-linear-inequality-bound'],
      medium: [
        'pd-c-ineq-frac-coef',
        'pd-c-ineq-region-words',
        'pd-c-ineq-supply-demand',
        'pd-c-ineq-least-integer-grid',
        'pd-c-ineq-time-budget',
        'pd-c-ineq-two-rates-split',
        'pd-c-ineq-area-perimeter-system',
        'pd-c-ineq-must-be-true-ab',
        'pd-inequality-system-region',
        'alg-inequality-negative-coef',
        'alg-inequality-min-score',
        'alg-budget-max-items-inequality',
      ],
      hard: ['pd-c-ineq-point-constants', 'pd-c-ineq-system-hours-earnings', 'pd-c-ineq-must-be-true-compound', 'pd-c-ineq-compound-grid', 'hard-ineq-compound-count'],
    },
    bookSet: [
      { slug: 'pd-c-ineq-which-solution', calc: true },
      { slug: 'pd-c-ineq-frac-coef', calc: true },
      { slug: 'pd-c-ineq-region-words', calc: true },
      { slug: 'pd-c-ineq-within-tolerance', calc: true },
      { slug: 'pd-c-ineq-supply-demand', calc: true },
      { slug: 'pd-c-ineq-least-integer-grid', calc: true },
      { slug: 'pd-c-ineq-region-words', calc: true },
      { slug: 'pd-c-ineq-time-budget', calc: true },
      { slug: 'pd-c-ineq-two-rates-split', calc: true },
      { slug: 'pd-inequality-system-region', calc: true },
      { slug: 'pd-c-ineq-point-constants', calc: true },
      { slug: 'pd-c-ineq-system-hours-earnings', calc: true },
      { slug: 'pd-c-ineq-must-be-true-compound', calc: true },
      { slug: 'pd-c-ineq-compound-grid', calc: true },
      { slug: 'pd-c-ineq-area-perimeter-system', calc: true },
      { slug: 'pd-c-ineq-must-be-true-ab', calc: true },
    ],
  },
  {
    n: 11,
    id: 'word-problems',
    title: { vi: 'Bài toán có lời văn', en: 'Word Problems' },
    phase: 2,
    art: 'chat',
    bookPages: [90, 98],
    subtopics: [
      { vi: 'Chọn ẩn cho khéo', en: 'Choosing what the variable stands for' },
      { vi: 'Dịch câu chữ thành phương trình', en: 'Translating sentences into equations' },
      { vi: 'Tuổi, tốc độ, hai giai đoạn', en: 'Ages, rates and two-stage problems' },
      { vi: 'Phân số của một tổng', en: 'Fractions of a total' },
      { vi: 'Hai ẩn: chia tiền, thừa thiếu', en: 'Two unknowns: splitting a cost' },
      { vi: 'Tỉ lệ thay đổi: bớt ra, chuyển qua', en: 'Changing ratios: removing and transferring' },
    ],
    theory: [
      {
        title: { vi: 'Đặt ẩn là thứ chưa biết', en: 'Let the variable be an unknown' },
        body: {
          vi: 'Đặt ẩn cho một đại lượng chưa biết, ghi rõ nó là gì. Chọn khéo để khỏi có phân số: "số này gấp 3 số kia" thì đặt số NHỎ là x (số lớn là 3x). Thường tiện nhất là đặt ẩn đúng thứ đề hỏi. Ba số nguyên liên tiếp: x, x + 1, x + 2.',
          en: 'Let a variable stand for an unknown quantity and say exactly what it is. Choose to avoid fractions: for "one number is 3 times another", let the SMALLER be x (the larger is 3x). Often it is easiest to make the variable the thing asked for. Three consecutive integers: x, x + 1, x + 2.',
        },
        formula: 'x + (x + 1) + (x + 2) = 81  →  x = 26',
      },
      {
        title: { vi: 'Dịch từng cụm', en: 'Translate phrase by phrase' },
        body: {
          vi: '"k less than A" là A − k; "the square of the sum" là (a + b)²; "p% of" là nhân p/100; "is" là dấu bằng. Sau khi giải, đọc lại xem đề hỏi đại lượng nào — hay bị dừng ở đại lượng trung gian.',
          en: '"k less than A" is A − k; "the square of the sum" is (a + b)²; "p% of" is multiply by p/100; "is" is the equals sign. After solving, reread what is asked — it is easy to stop at an intermediate quantity.',
        },
        formula: 'x^2 = 0.064 · frac(1,x)  →  x^3 = 0.064  →  x = 0.4',
      },
      {
        title: { vi: 'Tuổi và hai giai đoạn', en: 'Ages and two-stage situations' },
        body: {
          vi: 'Tuổi: mọi người cùng thêm (hoặc bớt) số năm như nhau. Chuyển động hai giai đoạn: quãng đường giai đoạn đầu cộng giai đoạn sau với thời gian còn lại (t − 10…).',
          en: 'Ages: everyone gains (or loses) the same number of years. Two-stage motion: the first stage distance plus the second stage over the remaining time (t − 10…).',
        },
        formula: 'x + 4 = 2(x - 5 + 4)',
      },
      {
        title: { vi: 'Phân số của một tổng', en: 'Fractions of a total' },
        body: {
          vi: 'Đặt tổng là x; mỗi nhóm là một phân số của x. Nhân hai vế với mẫu chung để khử phân số. Phần "còn lại" là x trừ các phần đã biết.',
          en: 'Let the total be x; each group is a fraction of x. Multiply by the common denominator to clear fractions. The "rest" is x minus the known parts.',
        },
        formula: 'frac(x,4) + frac(x,3) + frac(x,6) = 36  →  3x + 4x + 2x = 432',
      },
      {
        title: { vi: 'Thừa thiếu: hai phương trình', en: 'Too much / too little: two equations' },
        body: {
          vi: 'Mỗi người góp a thì thừa e₁, góp b thì thiếu e₂: tổng chi phí c = an − e₁ = bn + e₂. Cho hai biểu thức bằng nhau để tìm số người n.',
          en: 'If paying a each leaves e₁ extra and paying b each leaves e₂ short, the cost c = an − e₁ = bn + e₂. Set the two expressions equal to find n.',
        },
        formula: '140n - 20 = 125n + 40  →  n = 4',
      },
      {
        title: { vi: 'Tỉ lệ thay đổi', en: 'Changing ratios' },
        body: {
          vi: 'Bớt ra một phần thì TỔNG cũng giảm — không thể chỉ trừ phần trăm. Viết phân số (phần còn lại)/(tổng còn lại) bằng tỉ lệ mới rồi nhân chéo. Chuyển đồ qua lại: có thể làm ngược từ cuối về đầu, hoặc đặt hai ẩn cho số ban đầu.',
          en: 'Removing items also shrinks the TOTAL — you cannot just subtract percents. Write (part left)/(total left) = new ratio and cross-multiply. For transfers, work backwards from the end or use two variables for the starting amounts.',
        },
        formula: 'frac(180 - x,240 - x) = frac(3,5)  →  x = 90',
      },
    ],
    examples: [
      {
        problem: 'The sum of three consecutive integers is 81. What is the greatest of the three?',
        steps: [
          { vi: 'Đặt số nhỏ nhất là x: 3x + 3 = 81, x = 26.', en: 'Let the smallest be x: 3x + 3 = 81, x = 26.' },
          { vi: 'Số lớn nhất là 28.', en: 'The greatest is 28.' },
        ],
        answer: '28',
      },
      {
        problem: 'Nora is 5 years older than Theo. In 4 years, Nora will be twice as old as Theo. How old is Nora now?',
        steps: [
          { vi: 'Đặt tuổi Nora là x; Theo là x − 5. Bốn năm nữa: x + 4 = 2(x − 1).', en: 'Let Nora be x; Theo is x − 5. In 4 years: x + 4 = 2(x − 1).' },
          { vi: 'x + 4 = 2x − 2, x = 6.', en: 'x + 4 = 2x − 2, x = 6.' },
        ],
        answer: '6',
      },
      {
        problem: 'Friends split the cost of a boat rental. If each pays $140, they have $20 too much; if each pays $125, they are $40 short. What is the cost?',
        steps: [
          { vi: '140n − 20 = 125n + 40 → n = 4.', en: '140n − 20 = 125n + 40 → n = 4.' },
          { vi: 'Chi phí 140 · 4 − 20 = 540.', en: 'Cost 140 · 4 − 20 = 540.' },
        ],
        answer: '540',
      },
      {
        problem: 'A bag has 240 marbles, 75% of them blue. How many blue marbles must be removed so that 60% of the remaining marbles are blue?',
        steps: [
          { vi: 'Có 180 bi xanh. Bớt x viên: (180 − x)/(240 − x) = 3/5.', en: 'There are 180 blue. Remove x: (180 − x)/(240 − x) = 3/5.' },
          { vi: '900 − 5x = 720 − 3x, x = 90.', en: '900 − 5x = 720 − 3x, x = 90.' },
        ],
        answer: '90',
      },
    ],
    traps: [
      { vi: 'Trả lời đại lượng trung gian (số nhỏ) thay vì đại lượng đề hỏi (số lớn).', en: 'Answering an intermediate quantity (the smaller number) instead of the one asked.' },
      { vi: 'Dịch "k less than A" thành k − A.', en: 'Translating "k less than A" as k − A.' },
      { vi: 'Bớt ra mà quên tổng cũng giảm theo.', en: 'Removing items without reducing the total as well.' },
      { vi: 'Cộng tuổi cho một người mà quên người kia cũng già thêm.', en: 'Adding years to one person but not the other.' },
    ],
    templates: {
      easy: [
        'pd-c-translate-expression',
        'pd-c-number-line-distance',
        'pd-c-translate-sqrt',
        'pd-c-cost-annual-model',
        'pd-c-percent-equal',
        'pd-c-translate-solve-expr',
        'pd-c-price-relation-grid',
        'pd-c-chain-ratio',
        'alg-linear-word-rental-fee',
      ],
      medium: [
        'pd-c-two-pack-combos',
        'pd-c-integer-weights-cost',
        'pd-c-win-half',
        'pd-c-equal-start-transfer',
        'pd-c-coupon-ratio-total',
        'alg-linear-fn-draining-tank',
      ],
      hard: ['pd-word-age-or-consecutive', 'pd-c-trade-equalize', 'pd-c-fractions-rest'],
    },
    bookSet: [
      { slug: 'pd-c-translate-expression', calc: false },
      { slug: 'pd-c-number-line-distance', calc: false },
      { slug: 'pd-c-translate-sqrt', calc: false },
      { slug: 'pd-c-two-pack-combos', calc: false },
      { slug: 'pd-c-cost-annual-model', calc: false },
      { slug: 'pd-c-integer-weights-cost', calc: false },
      { slug: 'pd-c-percent-equal', calc: true },
      { slug: 'pd-c-win-half', calc: true },
      { slug: 'pd-c-equal-start-transfer', calc: true },
      { slug: 'pd-c-fractions-rest', calc: true },
      { slug: 'pd-c-trade-equalize', calc: true },
      { slug: 'pd-c-translate-solve-expr', calc: true },
      { slug: 'pd-c-price-relation-grid', calc: true },
      { slug: 'pd-c-coupon-ratio-total', calc: true },
      { slug: 'pd-c-chain-ratio', calc: true },
    ],
  },
  {
    n: 12,
    id: 'lines',
    title: { vi: 'Đường thẳng', en: 'Lines' },
    phase: 2,
    art: 'pencil',
    bookPages: [99, 108],
    subtopics: [
      { vi: 'Hệ số góc', en: 'Slope' },
      { vi: 'Giao điểm với các trục', en: 'x- and y-intercepts' },
      { vi: 'Dạng hệ số góc và dạng điểm – hệ số góc', en: 'Slope-intercept and point-slope form' },
      { vi: 'Giao điểm của hai đường', en: 'Where two lines intersect' },
      { vi: 'Song song và vuông góc', en: 'Parallel and perpendicular lines' },
      { vi: 'Đường ngang và đường dọc', en: 'Horizontal and vertical lines' },
    ],
    theory: [
      {
        title: { vi: 'Hệ số góc', en: 'Slope' },
        body: {
          vi: 'Hệ số góc = độ tăng (Δy) chia độ chạy (Δx) giữa hai điểm. Dương: đi lên từ trái sang phải; âm: đi xuống. Hệ số góc 2/3 nghĩa là sang phải 3 thì lên 2 (hoặc sang trái 3 thì xuống 2) — dùng để "bước" tới các điểm khác trên đường. Đường qua gốc và (a, b) có hệ số góc b/a.',
          en: 'Slope = rise (Δy) over run (Δx) between two points. Positive: up from left to right; negative: down. A slope of 2/3 means right 3, up 2 (or left 3, down 2) — use it to "walk" to other points on the line. A line through the origin and (a, b) has slope b/a.',
        },
        formula: 'm = frac(y_2 - y_1,x_2 - x_1)',
      },
      {
        title: { vi: 'Toạ độ chưa biết từ hệ số góc', en: 'An unknown coordinate from the slope' },
        body: {
          vi: 'Biết hệ số góc và một toạ độ bị ẩn, lập tỉ số Δy/Δx bằng hệ số góc rồi nhân chéo.',
          en: 'Given the slope and a missing coordinate, set Δy/Δx equal to the slope and cross-multiply.',
        },
        formula: 'frac((k + 4) - 2,6 - k) = 3  →  k = 4',
      },
      {
        title: { vi: 'Giao với trục', en: 'Intercepts' },
        body: {
          vi: 'Giao điểm với trục x: cho y = 0. Giao điểm với trục y: cho x = 0.',
          en: 'x-intercept: set y = 0. y-intercept: set x = 0.',
        },
        formula: '3x + 4y = 24:  (8, 0) and (0, 6)',
      },
      {
        title: { vi: 'Hai dạng phương trình', en: 'Two forms of a line' },
        body: {
          vi: 'y = mx + b cho ngay hệ số góc m và tung độ gốc b. Biết một điểm và hệ số góc thì dùng dạng điểm – hệ số góc rồi biến đổi về y = mx + b nếu cần. Đọc đồ thị: b là chỗ cắt trục y, m đếm ô lên/xuống trên ô sang phải.',
          en: 'y = mx + b shows the slope m and y-intercept b. With a point and a slope, use point-slope form and rearrange to y = mx + b if needed. From a graph: b is where it crosses the y-axis, m counts squares up/down per square right.',
        },
        formula: 'y - y_1 = m(x - x_1)',
      },
      {
        title: { vi: 'Giao điểm hai đường', en: 'Intersection of two lines' },
        body: {
          vi: 'Đưa cả hai về dạng y = … rồi cho bằng nhau (thực chất là giải hệ bằng phép thế). Điểm giao thoả cả hai phương trình — thế toạ độ vào để tìm hằng số chưa biết.',
          en: 'Put both in y = … form and set them equal (really, substitution). The intersection point satisfies both equations — plug its coordinates in to find unknown constants.',
        },
        formula: '2x + 1 = -x + 10  →  x = 3,  y = 7',
      },
      {
        title: { vi: 'Song song và vuông góc', en: 'Parallel and perpendicular' },
        body: {
          vi: 'Song song: cùng hệ số góc (khác tung độ gốc). Vuông góc: tích hai hệ số góc bằng −1, tức nghịch đảo và đổi dấu. Hệ số góc nhỏ (giữa 0 và 1) thì hệ số góc vuông góc nhỏ hơn −1.',
          en: 'Parallel: equal slopes (different intercepts). Perpendicular: slopes multiply to −1 — the negative reciprocal. A small slope (between 0 and 1) has a perpendicular slope below −1.',
        },
        formula: 'm_1 · m_2 = -1',
      },
      {
        title: { vi: 'Đường ngang, đường dọc', en: 'Horizontal and vertical lines' },
        body: {
          vi: 'Đường dọc qua x = c có phương trình x = c (song song trục y, hệ số góc không xác định). Đường ngang qua y = c có phương trình y = c (song song trục x, hệ số góc 0).',
          en: 'The vertical line through x = c is x = c (parallel to the y-axis, undefined slope). The horizontal line through y = c is y = c (parallel to the x-axis, slope 0).',
        },
        formula: 'x = c    y = c',
      },
    ],
    examples: [
      {
        problem: 'Line m passes through (k, 2) and (6, k + 4). If the slope of line m is 3, what is the value of k?',
        steps: [
          { vi: 'Δy/Δx = ((k + 4) − 2)/(6 − k) = 3.', en: 'Δy/Δx = ((k + 4) − 2)/(6 − k) = 3.' },
          { vi: 'k + 2 = 18 − 3k, k = 4.', en: 'k + 2 = 18 − 3k, k = 4.' },
        ],
        answer: '4',
      },
      {
        problem: 'Line l passes through (-1, 2) and (3, 10). What is the y-intercept of line l?',
        steps: [
          { vi: 'Hệ số góc (10 − 2)/(3 + 1) = 2.', en: 'Slope (10 − 2)/(3 + 1) = 2.' },
          { vi: 'y − 10 = 2(x − 3) → y = 2x + 4: tung độ gốc 4.', en: 'y − 10 = 2(x − 3) → y = 2x + 4: y-intercept 4.' },
        ],
        answer: '4',
      },
      {
        problem: 'Line n is perpendicular to a line with slope frac(3,4) and passes through (6, 1). What is an equation of line n?',
        steps: [
          { vi: 'Hệ số góc vuông góc: −4/3.', en: 'Perpendicular slope: −4/3.' },
          { vi: 'y − 1 = −(4/3)(x − 6) → y = −(4/3)x + 9.', en: 'y − 1 = −(4/3)(x − 6) → y = −(4/3)x + 9.' },
        ],
        answer: 'y = -frac(4,3)x + 9',
      },
    ],
    traps: [
      { vi: 'Đảo tử mẫu khi tính hệ số góc (Δx/Δy).', en: 'Computing Δx/Δy instead of Δy/Δx.' },
      { vi: 'Lấy nghịch đảo nhưng quên đổi dấu cho đường vuông góc.', en: 'Taking the reciprocal but forgetting the sign change for a perpendicular line.' },
      { vi: 'Nhầm x = c (đường dọc) với y = c (đường ngang).', en: 'Mixing up x = c (vertical) and y = c (horizontal).' },
      { vi: 'Chọn chính đường đã cho khi đề hỏi một đường song song khác.', en: 'Choosing the given line itself when asked for a different parallel line.' },
    ],
    templates: {
      easy: ['pd-c-vertical-horizontal-line', 'pd-c-slope-unknown-coord', 'pd-c-slope-from-intercepts', 'alg-linear-two-var-intercept', 'alg-two-var-point-on-line'],
      medium: [
        'pd-c-point-on-line',
        'pd-c-parallel-from-intercepts',
        'pd-c-lines-intersect-params',
        'pd-c-sign-slope-intercept',
        'pd-c-perp-same-intercept',
        'alg-two-var-slope-standard',
        'alg-linear-fn-two-points',
        'alg-linear-function-table',
      ],
      hard: ['pd-c-linear-constant-deduce', 'pd-c-perp-slope-range', 'pd-perpendicular-line', 'hard-two-var-param-slope'],
    },
    bookSet: [
      { slug: 'pd-c-vertical-horizontal-line', calc: false },
      { slug: 'pd-c-slope-unknown-coord', calc: false },
      { slug: 'pd-c-point-on-line', calc: false },
      { slug: 'pd-c-parallel-from-intercepts', calc: false },
      { slug: 'pd-c-lines-intersect-params', calc: false },
      { slug: 'pd-c-slope-from-intercepts', calc: true },
      { slug: 'pd-c-sign-slope-intercept', calc: true },
      { slug: 'pd-c-perp-same-intercept', calc: true },
      { slug: 'pd-perpendicular-line', calc: true },
      { slug: 'pd-c-slope-unknown-coord', calc: true },
      { slug: 'pd-c-linear-constant-deduce', calc: true },
      { slug: 'pd-c-perp-slope-range', calc: true },
    ],
  },
  {
    n: 13,
    id: 'linear-models',
    title: { vi: 'Diễn giải mô hình tuyến tính', en: 'Interpreting Linear Models' },
    phase: 2,
    art: 'magnifier',
    bookPages: [109, 114],
    subtopics: [
      { vi: 'Tung độ gốc: giá trị ban đầu', en: 'The y-intercept: the starting value' },
      { vi: 'Hệ số góc: tốc độ thay đổi có đơn vị', en: 'The slope: a rate with units' },
      { vi: 'Thay đổi khi biến tăng 1, và chiều ngược lại', en: 'Change per one unit, and the reverse' },
      { vi: 'Thay đổi qua nhiều đơn vị', en: 'Change over several units' },
    ],
    theory: [
      {
        title: { vi: 'Tung độ gốc là giá trị khi biến bằng 0', en: 'The intercept is the value when the variable is 0' },
        body: {
          vi: 'Trong y = mx + b, b là y khi x = 0: phí ban đầu, lượng ban đầu, giá trị ở năm gốc. Cẩn thận khi x đếm thời gian CÒN LẠI: x = 0 là lúc KẾT THÚC, nên b là giá trị cuối cùng. Hằng số bị trừ (như −1.50) có đơn vị của y.',
          en: 'In y = mx + b, b is y when x = 0: the starting fee, the initial amount, the value in the base year. Careful when x counts time REMAINING: x = 0 is the END, so b is the final value. A subtracted constant (like −1.50) is in the units of y.',
        },
        formula: 'V = 180000 - 4000T:  T = 0  →  V = 180000',
      },
      {
        title: { vi: 'Hệ số góc là tốc độ, có đơn vị', en: 'The slope is a rate, with units' },
        body: {
          vi: 'm là lượng y thay đổi khi x tăng 1 — đơn vị "y trên mỗi x", dấu cho biết tăng hay giảm. Đọc kỹ tên biến để loại những lựa chọn nghe hợp lý nhưng sai đại lượng (số nhà bán được, giá mỗi mét vuông…). Nếu hệ số là tích của nhiều chữ và số, hỏi xem cần thêm đại lượng gì để các đơn vị khớp.',
          en: 'm is how much y changes when x increases by 1 — units "y per x", with the sign telling increase or decrease. Read the variable names to rule out choices that sound right but describe another quantity (homes sold, price per square foot…). If a term multiplies several letters and a number, ask what that number must be for the units to work.',
        },
        formula: 'h = frac(3x + 8,4) = frac(3,4)x + 2',
      },
      {
        title: { vi: 'Chiều ngược lại: nghịch đảo hệ số góc', en: 'The reverse direction: reciprocal of the slope' },
        body: {
          vi: 'Muốn biết x phải tăng bao nhiêu để y tăng 1, lấy nghịch đảo của hệ số góc (tức giải x theo y). Muốn y tăng D thì x tăng D chia m — hằng số b không ảnh hưởng.',
          en: 'To find how much x must increase for y to rise by 1, take the reciprocal of the slope (i.e., solve for x in terms of y). For y to rise by D, x rises by D divided by m — the constant b plays no part.',
        },
        formula: 'x = frac(4,3)h - frac(8,3)',
      },
      {
        title: { vi: 'Thay đổi qua k đơn vị', en: 'Change over k units' },
        body: {
          vi: 'Qua k đơn vị của x, y thay đổi k nhân m. Đổi đơn vị trước nếu đề hỏi theo đơn vị khác (phút thay vì giờ).',
          en: 'Over k units of x, y changes by k times m. Convert units first if the question uses a different unit (minutes instead of hours).',
        },
        formula: 'T = 72 - 4m:  5 minutes  →  5 × 4 = 20 degrees',
      },
      {
        title: { vi: 'Giao điểm với trục x trong bối cảnh', en: 'The x-intercept in context' },
        body: {
          vi: 'Điểm (k, 0) nghĩa là khi x = k thì y = 0 — với lợi nhuận là điểm hoà vốn: bán đúng k món thì vừa đủ bù chi phí.',
          en: 'The point (k, 0) means y = 0 when x = k — for profit, the break-even point: selling exactly k items just covers the costs.',
        },
      },
    ],
    examples: [
      {
        problem: 'The value V, in dollars, of a boat t years after 2015 is V = 36000 - 1800t. What does 1800 represent?',
        steps: [
          { vi: '1800 là hệ số của t, dấu trừ: giá trị GIẢM 1800 mỗi năm.', en: '1800 is the coefficient of t with a minus sign: the value DECREASES by 1800 each year.' },
          { vi: '36000 là giá trị năm 2015 (t = 0).', en: '36000 is the value in 2015 (t = 0).' },
        ],
        answer: 'The yearly decrease in the value of the boat',
      },
      {
        problem: 'The height h, in centimeters, of a seedling given x milliliters of plant food is h = frac(3x + 8,4). How many more milliliters raise the height by exactly one centimeter?',
        steps: [
          { vi: 'Hệ số góc là 3/4 cm mỗi mililít.', en: 'The slope is 3/4 cm per milliliter.' },
          { vi: 'Muốn tăng 1 cm cần nghịch đảo: 4/3 mililít.', en: 'For one centimeter, take the reciprocal: 4/3 milliliters.' },
        ],
        answer: 'frac(4,3)',
      },
      {
        problem: 'The temperature of a drink in a freezer is T = 72 - 4m, where m is minutes. By how many degrees does it drop every 5 minutes?',
        steps: [{ vi: 'Mỗi phút giảm 4 độ.', en: 'It drops 4 degrees per minute.' }, { vi: '5 phút giảm 20 độ.', en: 'In 5 minutes it drops 20 degrees.' }],
        answer: '20',
      },
    ],
    traps: [
      { vi: 'Nhầm hệ số góc (tốc độ) với tung độ gốc (giá trị ban đầu).', en: 'Mixing up the slope (rate) and the intercept (starting value).' },
      { vi: 'Coi b là giá trị ban đầu khi x là thời gian CÒN LẠI (lúc đó b là giá trị cuối).', en: 'Calling b the starting value when x is the time REMAINING (then b is the final value).' },
      { vi: 'Chọn lựa chọn đúng số nhưng sai đại lượng hoặc sai đơn vị.', en: 'Picking a choice with the right number but the wrong quantity or unit.' },
      { vi: 'Đi ngược (y tăng 1 thì x tăng bao nhiêu) mà vẫn dùng hệ số góc thay vì nghịch đảo.', en: 'Going backwards (x change for a 1-unit rise in y) with the slope instead of its reciprocal.' },
    ],
    templates: {
      easy: ['pd-c-model-slope-meaning', 'alg-linear-two-var-rate-fee-context'],
      medium: [
        'pd-c-model-intercept-meaning',
        'pd-c-model-product-coef',
        'pd-c-model-rate-per-unit',
        'pd-c-model-profit-table',
        'pd-c-model-inverse-change',
        'psda-fit-coefficient-meaning',
      ],
      hard: ['pd-c-model-time-left', 'pd-c-model-roman', 'pd-model-interpret-hard', 'hard-linfn-shift-rate'],
    },
    bookSet: [
      { slug: 'pd-c-model-slope-meaning', calc: false },
      { slug: 'pd-c-model-slope-meaning', calc: false },
      { slug: 'pd-c-model-intercept-meaning', calc: false },
      { slug: 'pd-c-model-slope-meaning', calc: false },
      { slug: 'pd-c-model-product-coef', calc: false },
      { slug: 'pd-c-model-slope-meaning', calc: false },
      { slug: 'pd-c-model-slope-meaning', calc: false },
      { slug: 'pd-c-model-time-left', calc: false },
      { slug: 'pd-c-model-intercept-meaning', calc: false },
      { slug: 'pd-c-model-rate-per-unit', calc: true },
      { slug: 'pd-c-model-profit-table', calc: true },
      { slug: 'pd-c-model-profit-table', calc: true },
      { slug: 'pd-c-model-profit-table', calc: true },
      { slug: 'pd-c-model-rate-per-unit', calc: true },
      { slug: 'pd-c-model-roman', calc: true },
      { slug: 'pd-c-model-inverse-change', calc: true },
    ],
  },
  {
    n: 14,
    id: 'functions',
    title: { vi: 'Hàm số', en: 'Functions' },
    phase: 3,
    art: 'star',
    bookPages: [115, 125],
    subtopics: [
      { vi: 'Hàm số là gì', en: 'What is a function?' },
      { vi: 'Khi nào hàm không xác định', en: 'When is a function undefined?' },
      { vi: 'Hàm hợp', en: 'Composite functions' },
      { vi: 'f(x) là tung độ: đọc hàm từ đồ thị và bảng', en: 'f(x) is the y-value: reading functions from graphs and tables' },
      { vi: 'Nghiệm của f(x) = k và f(x) = g(x)', en: 'Solutions of f(x) = k and f(x) = g(x)' },
      { vi: 'Nhận dạng đồ thị hàm', en: 'Identifying function graphs' },
    ],
    theory: [
      {
        title: { vi: 'Hàm số như một cỗ máy', en: 'A function is a machine' },
        body: {
          vi: 'Mỗi đầu vào x cho ĐÚNG MỘT đầu ra f(x). Tính f(a): thay mọi chữ x bằng a, đặt trong ngoặc (nhất là khi a âm hoặc là một biểu thức). f(2x), f(x − 1), 3f(x) + 1 đều theo cùng một cách: cái gì nằm trong ngoặc của f thì thay vào chỗ x.',
          en: 'Each input x gives EXACTLY ONE output f(x). To find f(a), replace every x with a, in parentheses (especially when a is negative or an expression). f(2x), f(x − 1) and 3f(x) + 1 all work the same way: whatever sits inside the parentheses of f replaces x.',
        },
        formula: 'f(x) = x^2 - 3x  →  f(-2) = (-2)^2 - 3(-2) = 10',
      },
      {
        title: { vi: 'Khi nào hàm không xác định', en: 'When a function is undefined' },
        body: {
          vi: 'Hàm không xác định tại giá trị làm MẪU SỐ bằng 0 — tử số không liên quan. Với số thực, căn bậc hai của số âm cũng không xác định. Phân tích mẫu thành nhân tử để tìm mọi giá trị bị loại.',
          en: 'A function is undefined where its DENOMINATOR is 0 — the numerator does not matter. For real numbers, the square root of a negative is also undefined. Factor the denominator to find every excluded value.',
        },
        formula: 'f(x) = frac(x + 1,x^2 - 4)  →  x != 2,  x != -2',
      },
      {
        title: { vi: 'Hàm hợp', en: 'Composite functions' },
        body: {
          vi: 'f(g(x)): tính g trước, lấy kết quả làm đầu vào của f — làm từ trong ra ngoài. Thứ tự quan trọng: f(g(2)) thường khác g(f(2)). Với bảng giá trị, đọc g ở hàng x = 2 rồi đi tìm hàng có x bằng kết quả đó để đọc f.',
          en: 'f(g(x)): compute g first, then use the result as the input of f — work from the inside out. Order matters: f(g(2)) is usually not g(f(2)). With a table, read g in the row x = 2, then find the row whose x is that result and read f.',
        },
        formula: 'f(g(2)):  g(2) = 5  →  f(5)',
      },
      {
        title: { vi: 'f(x) chính là tung độ', en: 'f(x) is the y-value' },
        body: {
          vi: 'Điểm (a, b) nằm trên đồ thị y = f(x) nghĩa là f(a) = b. Vì vậy: đọc f(a) là nhìn tung độ tại x = a; biết một điểm thuộc đồ thị thì thay toạ độ vào công thức để tìm hệ số chưa biết. Điểm cao nhất của đồ thị cho giá trị lớn nhất của f.',
          en: 'A point (a, b) on the graph of y = f(x) means f(a) = b. So reading f(a) means looking at the y-value above x = a, and knowing a point on the graph lets you plug its coordinates into the formula to find an unknown constant. The highest point on the graph gives the maximum value of f.',
        },
        formula: '(a, b) trên đồ thị  ⇔  f(a) = b',
      },
      {
        title: { vi: 'Nghiệm, giao điểm, số nghiệm', en: 'Zeros, intersections, number of solutions' },
        body: {
          vi: 'Nghiệm (zero) của f là x làm f(x) = 0 — chính là giao điểm với trục hoành. Số nghiệm của f(x) = k bằng số lần đồ thị cắt đường nằm ngang y = k. Nghiệm của f(x) = g(x) là hoành độ các giao điểm của hai đồ thị; muốn biết số giao điểm thì chuyển về một vế rồi xét phương trình đó.',
          en: 'A zero of f is an x with f(x) = 0 — an x-intercept of the graph. The number of solutions of f(x) = k is the number of times the graph crosses the horizontal line y = k. Solutions of f(x) = g(x) are the x-coordinates where the two graphs meet; to count them, move everything to one side and study that equation.',
        },
      },
      {
        title: { vi: 'Nhận dạng đồ thị bằng cách thay điểm', en: 'Identify a graph by plugging in points' },
        body: {
          vi: 'Muốn biết công thức nào khớp đồ thị hay bảng: thay những điểm dễ (x = 0 cho tung độ gốc, các giao điểm với trục hoành) vào từng lựa chọn và loại dần. Phải thử ĐỦ các điểm — một công thức có thể khớp hai điểm mà sai ở điểm thứ ba. Giao điểm với trục hoành mà đồ thị chỉ chạm rồi quay lại là nghiệm kép (thừa số bình phương).',
          en: 'To match a formula to a graph or table, plug easy points (x = 0 for the y-intercept, the x-intercepts) into each choice and eliminate. Test ALL the points — a formula can match two points and miss the third. An x-intercept where the graph only touches and turns back is a double root (a squared factor).',
        },
      },
    ],
    examples: [
      {
        problem: 'If f(x) = 2x + 1 and g(x) = x^2 - 3, what is f(g(3))?',
        steps: [
          { vi: 'Tính g trước: g(3) = 9 − 3 = 6.', en: 'Inside first: g(3) = 9 − 3 = 6.' },
          { vi: 'f(6) = 13.', en: 'f(6) = 13.' },
        ],
        answer: '13',
      },
      {
        problem: 'For what values of x is f(x) = frac(x + 5,x^2 - 9) not defined?',
        steps: [
          { vi: 'Cho mẫu bằng 0: x² − 9 = 0.', en: 'Set the denominator to 0: x² − 9 = 0.' },
          { vi: 'x = 3 hoặc x = −3.', en: 'x = 3 or x = −3.' },
        ],
        answer: '3 and -3',
      },
      {
        problem: 'The graph of y = ax^2 + 4 passes through the point (2, -8). What is the value of a?',
        steps: [
          { vi: 'Điểm thuộc đồ thị: thay x = 2, y = −8.', en: 'The point is on the graph: plug in x = 2, y = −8.' },
          { vi: '−8 = 4a + 4, nên a = −3.', en: '−8 = 4a + 4, so a = −3.' },
        ],
        answer: '-3',
      },
      {
        problem: 'The function g is defined by g(x) = f(2x) - 1, where f(x) = x^2 + x. What is g(3)?',
        steps: [
          { vi: 'Đầu vào của f là 2 · 3 = 6.', en: 'The input of f is 2 · 3 = 6.' },
          { vi: 'f(6) = 42, nên g(3) = 41.', en: 'f(6) = 42, so g(3) = 41.' },
        ],
        answer: '41',
      },
    ],
    traps: [
      { vi: 'Tính f trước rồi mới tới g (làm ngược thứ tự hàm hợp).', en: 'Applying f first and then g (reversing the composition).' },
      { vi: 'Tìm chỗ không xác định bằng cách cho TỬ số bằng 0.', en: 'Setting the NUMERATOR to 0 to find where a function is undefined.' },
      { vi: 'Thay số âm mà không đặt trong ngoặc: −3² thay vì (−3)².', en: 'Plugging in a negative without parentheses: −3² instead of (−3)².' },
      { vi: 'Chỉ thử một hai điểm khi so công thức với bảng hay đồ thị.', en: 'Checking only one or two points when matching a formula to a table or graph.' },
      { vi: 'Nhầm f(2x) với 2f(x).', en: 'Confusing f(2x) with 2f(x).' },
    ],
    templates: {
      easy: ['pd-d-fn-table-formula', 'pd-d-fn-piecewise-equal', 'pd-d-fn-eval-rational', 'pd-d-fn-table-scaled-solve', 'pd-d-fn-point-not-on', 'pd-d-fn-sqrt-solve', 'pd-d-fn-table-lookup-back', 'pd-d-fn-linear-fraction-solve', 'adv-evaluate-quadratic'],
      medium: ['pd-d-fn-intersection-count', 'pd-d-fn-level-count', 'pd-d-fn-even-check', 'pd-d-fn-inner-scale', 'pd-d-fn-table-ax2b', 'pd-d-fn-square-below', 'pd-d-fn-compose-quad', 'pd-d-fn-sqrt-diff', 'pd-d-fn-table-compose', 'pd-d-fn-table-inner', 'pd-d-fn-linear-match', 'pd-d-fn-line-shift-xint', 'adv-function-composition'],
      hard: ['pd-d-fn-intercepts-formula', 'pd-d-fn-level-count-grid', 'pd-d-fn-parabola-distance', 'pd-d-fn-cubic-three', 'pd-d-fn-line-point-a', 'pd-function-undefined-or-inverse', 'hard-transform-vertex'],
    },
    bookSet: [
      { slug: 'pd-d-fn-table-formula', calc: false },
      { slug: 'pd-d-fn-intersection-count', calc: false },
      { slug: 'pd-d-fn-piecewise-equal', calc: false },
      { slug: 'pd-d-fn-level-count', calc: false },
      { slug: 'pd-d-fn-even-check', calc: false },
      { slug: 'pd-d-fn-inner-scale', calc: false },
      { slug: 'pd-d-fn-eval-rational', calc: false },
      { slug: 'pd-d-fn-table-ax2b', calc: false },
      { slug: 'pd-d-fn-square-below', calc: false },
      { slug: 'pd-d-fn-intercepts-formula', calc: false },
      { slug: 'pd-d-fn-compose-quad', calc: false },
      { slug: 'pd-d-fn-level-count-grid', calc: false },
      { slug: 'pd-d-fn-table-scaled-solve', calc: false },
      { slug: 'pd-d-fn-sqrt-diff', calc: false },
      { slug: 'pd-d-fn-point-not-on', calc: true },
      { slug: 'pd-d-fn-sqrt-solve', calc: true },
      { slug: 'pd-d-fn-table-compose', calc: true },
      { slug: 'pd-d-fn-table-lookup-back', calc: true },
      { slug: 'pd-d-fn-linear-fraction-solve', calc: true },
      { slug: 'pd-d-fn-table-inner', calc: true },
      { slug: 'pd-d-fn-linear-match', calc: true },
      { slug: 'pd-d-fn-parabola-distance', calc: true },
      { slug: 'pd-d-fn-line-shift-xint', calc: true },
      { slug: 'pd-d-fn-cubic-three', calc: true },
      { slug: 'pd-d-fn-line-point-a', calc: true },
    ],
  },
];
