import { buildChoices, buildTextChoices } from '../choices';
import { pick, pickInt } from '../authoring';
import { rat } from '@/lib/math/value';
import type { MathTemplate } from '@/lib/math/types';

/**
 * Dạng câu thứ ba và thứ tư cho bảy kỹ năng Problem-Solving & Data Analysis.
 *
 * Ba dạng cuối (diễn giải hệ số, kết luận từ thí nghiệm, kết luận từ khảo sát)
 * có đáp án là CÂU CHỮ. Bảng ngữ cảnh của chúng được xuất ra để bộ kiểm chứng
 * đọc lại từ đề và tự dựng câu trả lời đúng, không tin vào lựa chọn của template.
 */

function oxfordList(values: number[]): string {
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
}

const RATIO_CONTEXTS = [
  { a: 'red marbles', b: 'blue marbles', whole: 'marbles in a bag', where: 'in the bag' },
  { a: 'cats', b: 'dogs', whole: 'animals at a shelter', where: 'at the shelter' },
  { a: 'fiction books', b: 'nonfiction books', whole: 'books on a shelf', where: 'on the shelf' },
  { a: 'juniors', b: 'seniors', whole: 'students in a club', where: 'in the club' },
] as const;

/** Tỉ lệ phần–phần, hỏi một phần khi biết tổng. */
const ratioPartWhole: MathTemplate = {
  slug: 'psda-ratio-part-whole',
  skill: 'ratios_rates_units',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const a = pickInt(rng, 1, 9);
    const bRaw = pickInt(rng, 1, 9);
    const b = bRaw === a ? (a === 9 ? 1 : a + 1) : bRaw;
    const m = pickInt(rng, 2, 12);
    const total = (a + b) * m;
    const ctx = pick(rng, RATIO_CONTEXTS);
    return {
      format: 'grid_in',
      stem: `There are ${total} ${ctx.whole}. The ratio of ${ctx.a} to ${ctx.b} is ${a} to ${b}. How many ${ctx.a} are ${ctx.where}?`,
      answer: rat(a * m),
      steps: [
        { text: `Tỉ lệ ${a} : ${b} nghĩa là cứ ${a + b} phần thì ${a} phần thuộc nhóm đầu.`, expr: `${a} + ${b} = ${a + b}` },
        { text: 'Mỗi phần ứng với bao nhiêu đơn vị?', expr: `${total} ÷ ${a + b} = ${m}` },
        { text: `Nhóm đầu có ${a} phần.`, expr: `${a} × ${m} = ${a * m}` },
      ],
    };
  },
};

/** Tốc độ không đổi: quãng đường tỉ lệ với thời gian. */
const speedDistance: MathTemplate = {
  slug: 'psda-speed-distance',
  skill: 'ratios_rates_units',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const s = pickInt(rng, 20, 75);
    const t1 = pickInt(rng, 2, 6);
    const t2Raw = pickInt(rng, 2, 9);
    const t2 = t2Raw === t1 ? t1 + 1 : t2Raw;
    const d = s * t1;
    const { choices, correctIndex } = buildChoices(
      rat(s * t2),
      [
        { value: rat(d * t1, t2), errorTag: 'inverted_fraction', note: 'Lập tỉ lệ ngược: thời gian nhiều hơn thì quãng đường phải dài hơn.' },
        { value: rat(s), errorTag: 'stopped_too_early', note: 'Đây là quãng đường MỘT giờ — còn phải nhân với số giờ.' },
        { value: rat(d + t2), errorTag: null, note: 'Cộng thời gian vào quãng đường không có nghĩa: hai đại lượng khác đơn vị.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A car travels ${d} miles in ${t1} hours at a constant speed. At this speed, how many miles will the car travel in ${t2} hours?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Tìm tốc độ: quãng đường chia thời gian.', expr: `${d} ÷ ${t1} = ${s}` },
        { text: 'Nhân tốc độ với thời gian mới.', expr: `${s} × ${t2} = ${s * t2}` },
      ],
    };
  },
};

const NICE_PERCENTS = [10, 20, 25, 40, 50, 60, 75, 80] as const;

/** Phần trăm của phần trăm. */
const percentOfPercent: MathTemplate = {
  slug: 'psda-percent-of-percent',
  skill: 'percentages',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const p = pick(rng, NICE_PERCENTS);
    const q = pick(rng, NICE_PERCENTS);
    let k = pickInt(rng, 1, 20);
    // Cần p·q·k chia hết cho 100 để kết quả nguyên; nhích k lên tới khi được.
    while ((p * q * k) % 100 !== 0) k += 1;
    const n = k * 100;
    const answer = (p * q * k) / 100;
    return {
      format: 'grid_in',
      stem: `What is ${p}% of ${q}% of ${n}?`,
      answer: rat(answer),
      steps: [
        { text: `Làm từ trong ra: ${q}% của ${n} trước.`, expr: `${q}% × ${n} = ${(q * n) / 100}` },
        { text: `Rồi lấy ${p}% của kết quả đó.`, expr: `${p}% × ${(q * n) / 100} = ${answer}` },
      ],
    };
  },
};

const PRICED_ITEMS = ['jacket', 'bicycle', 'desk', 'camera', 'guitar'] as const;

/** Tăng giá theo phần trăm, hỏi giá MỚI. */
const percentIncreaseNew: MathTemplate = {
  slug: 'psda-percent-increase-new',
  skill: 'percentages',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const P = pickInt(rng, 2, 40) * 20;
    const p = pick(rng, [5, 10, 15, 20, 25, 30, 40, 50]);
    const item = pick(rng, PRICED_ITEMS);
    const rise = (P * p) / 100;
    const { choices, correctIndex } = buildChoices(
      rat(P + rise),
      [
        { value: rat(rise), errorTag: 'stopped_too_early', note: 'Đây mới là phần TĂNG THÊM, chưa cộng vào giá cũ.' },
        { value: rat(P + p), errorTag: 'percent_added_instead_of_multiplied' },
        { value: rat(P - rise), errorTag: 'sign_flip', note: 'Đề nói giá TĂNG, không phải giảm.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The price of a ${item} was $${P}. The price was then increased by ${p}%. What is the new price, in dollars?`,
      choices,
      correctIndex,
      steps: [
        { text: `Phần tăng bằng ${p}% của giá cũ.`, expr: `${p}% × ${P} = ${rise}` },
        { text: 'Cộng phần tăng vào giá cũ.', expr: `${P} + ${rise} = ${P + rise}` },
      ],
    };
  },
};

/** Biết trung bình, tìm số còn thiếu. */
const meanMissingValue: MathTemplate = {
  slug: 'psda-mean-missing-value',
  skill: 'one_var_data',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const n = pickInt(rng, 4, 6);
    const M = pickInt(rng, 10, 60);
    let values: number[] = [];
    let last = 0;
    for (let tries = 0; tries < 60 && !(last > 0 && last < 1000); tries += 1) {
      values = Array.from({ length: n - 1 }, () => pickInt(rng, Math.max(1, M - 15), M + 15));
      last = n * M - values.reduce((s, v) => s + v, 0);
    }
    if (!(last > 0 && last < 1000)) {
      values = Array.from({ length: n - 1 }, () => M);
      last = M;
    }
    const sum = values.reduce((s, v) => s + v, 0);
    return {
      format: 'grid_in',
      stem: `The mean of ${n} numbers is ${M}. If ${n - 1} of the numbers are ${oxfordList(values)}, what is the remaining number?`,
      answer: rat(last),
      steps: [
        { text: 'Trung bình nhân với số lượng là tổng của cả nhóm.', expr: `${M} × ${n} = ${n * M}` },
        { text: 'Trừ đi tổng các số đã biết.', expr: `${n * M} - ${sum} = ${last}` },
      ],
    };
  },
};

/** Trung vị của một dãy CHƯA sắp xếp — bẫy là lấy luôn số ở giữa dãy. */
const medianOfList: MathTemplate = {
  slug: 'psda-median-of-list',
  skill: 'one_var_data',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const count = pick(rng, [7, 9, 11]);
    const values = Array.from({ length: count }, () => pickInt(rng, 1, 40));
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[(count - 1) / 2]!;
    const sum = values.reduce((s, v) => s + v, 0);
    const { choices, correctIndex } = buildChoices(
      rat(median),
      [
        { value: rat(values[(count - 1) / 2]!), errorTag: null, note: 'Lấy số ở giữa dãy khi CHƯA sắp xếp. Phải xếp theo thứ tự trước.' },
        { value: rat(sum, count), errorTag: 'confused_mean_median' },
        { value: rat(sorted[count - 1]! - sorted[0]!), errorTag: null, note: 'Đây là khoảng biến thiên (lớn nhất trừ nhỏ nhất).' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `What is the median of the data set ${values.join(', ')}?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Sắp xếp dãy theo thứ tự tăng dần.', expr: sorted.join(', ') },
        { text: `Có ${count} số, trung vị là số thứ ${(count + 1) / 2}.`, expr: `median = ${median}` },
      ],
    };
  },
};

/** Số thập phân một chữ số, không bao giờ in "2.0". */
function oneDecimal(tenths: number): string {
  return (tenths / 10).toFixed(1);
}

/** Dự đoán từ đường thẳng xu hướng. */
const lineOfFitPredict: MathTemplate = {
  slug: 'psda-line-of-fit-predict',
  skill: 'two_var_data',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    let m10 = pickInt(rng, 11, 59);
    if (m10 % 10 === 0) m10 += 1;
    const b = pickInt(rng, 5, 80);
    const x = pickInt(rng, 1, 9) * 10;
    const mx = (m10 * x) / 10;
    const { choices, correctIndex } = buildChoices(
      rat(mx + b),
      [
        { value: rat(mx), errorTag: null, note: 'Quên cộng tung độ gốc.' },
        { value: rat(b), errorTag: 'swapped_slope_intercept', note: 'Đây là giá trị dự đoán khi x = 0.' },
        { value: rat(m10 * x + b), errorTag: null, note: 'Bỏ sót dấu thập phân của độ dốc.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The line of best fit for a data set is y = ${oneDecimal(m10)}x + ${b}. Based on the line of best fit, what is the predicted value of y when x = ${x}?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Thay x vào phương trình đường thẳng xu hướng.', expr: `y = ${oneDecimal(m10)} × ${x} + ${b}` },
        { text: 'Nhân trước, cộng sau.', expr: `y = ${mx} + ${b} = ${mx + b}` },
      ],
    };
  },
};

/**
 * Ngữ cảnh cho câu "diễn giải hệ số". Xuất ra để bộ kiểm chứng tự dựng câu
 * trả lời đúng từ đề.
 */
export const FIT_CONTEXTS = [
  {
    model: 'height y, in centimeters, of a plant x weeks after it was planted',
    y: 'height of the plant, in centimeters,',
    start: 'when it was planted',
    unit: 'week',
  },
  {
    model: 'amount y, in dollars, in a savings account x months after it was opened',
    y: 'amount in the account, in dollars,',
    start: 'when it was opened',
    unit: 'month',
  },
  {
    model: 'length y, in millimeters, of a fish x days after it hatched',
    y: 'length of the fish, in millimeters,',
    start: 'when it hatched',
    unit: 'day',
  },
] as const;

export function fitAnswers(ctx: (typeof FIT_CONTEXTS)[number]) {
  return {
    intercept: `The estimated ${ctx.y} ${ctx.start}`,
    slope: `The estimated increase in the ${ctx.y} each ${ctx.unit}`,
    afterOne: `The estimated ${ctx.y} after 1 ${ctx.unit}`,
    total: `The estimated total increase in the ${ctx.y} over the whole period`,
  };
}

/** Ý nghĩa của hệ số góc hoặc tung độ gốc trong mô hình tuyến tính. */
const fitCoefficientMeaning: MathTemplate = {
  slug: 'psda-fit-coefficient-meaning',
  skill: 'two_var_data',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const ctx = pick(rng, FIT_CONTEXTS);
    let m10 = pickInt(rng, 11, 49);
    if (m10 % 10 === 0) m10 += 1;
    const b = pickInt(rng, 5, 90);
    const askIntercept = rng() < 0.5;
    const asked = askIntercept ? String(b) : oneDecimal(m10);
    const ans = fitAnswers(ctx);
    const { choices, correctIndex } = buildTextChoices(
      askIntercept ? ans.intercept : ans.slope,
      askIntercept
        ? [
            { display: ans.slope, errorTag: 'swapped_slope_intercept' },
            { display: ans.afterOne, errorTag: null, note: 'Sau 1 đơn vị thì phải cộng thêm độ dốc một lần.' },
            { display: ans.total, errorTag: null, note: 'Hằng số cộng thêm không đo sự thay đổi nào cả.' },
          ]
        : [
            { display: ans.intercept, errorTag: 'swapped_slope_intercept' },
            { display: ans.afterOne, errorTag: null, note: 'Giá trị sau 1 đơn vị là độ dốc CỘNG tung độ gốc.' },
            { display: ans.total, errorTag: null, note: 'Độ dốc là mức tăng cho MỖI đơn vị, không phải cả quãng.' },
          ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The equation y = ${oneDecimal(m10)}x + ${b} models the ${ctx.model}. What is the best interpretation of ${asked} in this context?`,
      choices,
      correctIndex,
      steps: askIntercept
        ? [{ text: 'Tung độ gốc là giá trị của y khi x = 0, tức là lúc bắt đầu.', expr: `x = 0  ⇒  y = ${b}` }]
        : [{ text: 'Hệ số của x là mức thay đổi của y khi x tăng thêm 1.', expr: `m = ${oneDecimal(m10)}` }],
    };
  },
};

/** Xác suất biến cố bù: "KHÔNG phải màu xanh". */
const probabilityNotColor: MathTemplate = {
  slug: 'psda-probability-not-color',
  skill: 'probability',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const r = pickInt(rng, 2, 12);
    const bl = pickInt(rng, 2, 12);
    const g = pickInt(rng, 2, 12);
    const total = r + bl + g;
    return {
      format: 'grid_in',
      stem: `A bag contains ${r} red marbles, ${bl} blue marbles, and ${g} green marbles. If one marble is selected at random, what is the probability that it is NOT blue?`,
      answer: rat(r + g, total),
      steps: [
        { text: 'Tổng số bi trong túi.', expr: `${r} + ${bl} + ${g} = ${total}` },
        { text: 'Số bi KHÔNG phải màu xanh dương là bi đỏ cộng bi xanh lá.', expr: `P = frac(${r + g},${total})` },
      ],
    };
  },
};

const DEFECT_ITEMS = [
  { one: 'light bulb', many: 'bulbs' },
  { one: 'phone case', many: 'phone cases' },
  { one: 'battery', many: 'batteries' },
] as const;

/** Số lượng kỳ vọng = xác suất × số lần. */
const expectedCount: MathTemplate = {
  slug: 'psda-expected-count',
  skill: 'probability',
  difficulty: 'easy',
  format: 'mcq',
  build: (rng) => {
    const p = pick(rng, [2, 4, 5, 6, 8, 10, 12, 15]);
    const N = pickInt(rng, 1, 20) * 100;
    const item = pick(rng, DEFECT_ITEMS);
    const expected = (N * p) / 100;
    // 0.1 chứ không phải 0.10 — đề thật không in số 0 thừa.
    const decimal = String(p / 100);
    const { choices, correctIndex } = buildChoices(
      rat(expected),
      [
        { value: rat(N - expected), errorTag: 'percent_of_wrong_base', note: 'Đây là số sản phẩm KHÔNG bị lỗi.' },
        { value: rat(p), errorTag: null, note: 'Đổi xác suất ra phần trăm rồi dừng — còn phải nhân với số sản phẩm.' },
        { value: rat(expected * 10), errorTag: null, note: 'Dời dấu phẩy thập phân sai một chữ số.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The probability that a randomly selected ${item.one} from a factory is defective is ${decimal}. Based on this probability, how many defective ${item.many} are expected in a shipment of ${N} ${item.many}?`,
      choices,
      correctIndex,
      steps: [{ text: 'Số lượng kỳ vọng bằng xác suất nhân với số lần thử.', expr: `${decimal} × ${N} = ${expected}` }],
    };
  },
};

/** Suy từ mẫu ngẫu nhiên ra cả tổng thể. */
const sampleEstimate: MathTemplate = {
  slug: 'psda-sample-estimate-population',
  skill: 'sample_inference',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const n = pick(rng, [40, 50, 80, 100, 120, 200, 250]);
    const k = pickInt(rng, 5, n - 5);
    const N = n * pickInt(rng, 3, 40);
    const estimate = (k * N) / n;
    return {
      format: 'grid_in',
      stem: `In a random sample of ${n} students at a school, ${k} students said they walk to school. There are ${N} students at the school. Based on the sample, what is the best estimate of the number of students at the school who walk to school?`,
      answer: rat(estimate),
      steps: [
        { text: 'Mẫu ngẫu nhiên đại diện cho cả trường: tỉ lệ trong mẫu là ước lượng cho tỉ lệ cả trường.', expr: `frac(${k},${n})` },
        { text: 'Nhân tỉ lệ đó với số học sinh cả trường.', expr: `frac(${k},${n}) × ${N} = ${estimate}` },
      ],
    };
  },
};

export const MARGIN_ANSWER = 'Surveying a larger random sample of adults in the city';

/** Cái gì làm biên sai số nhỏ lại. */
const marginSampleSize: MathTemplate = {
  slug: 'psda-margin-sample-size',
  skill: 'sample_inference',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const n = pickInt(rng, 40, 400) * 5;
    const p = pickInt(rng, 20, 80);
    const moe = pickInt(rng, 2, 7);
    const { choices, correctIndex } = buildTextChoices(
      MARGIN_ANSWER,
      [
        { display: 'Surveying a smaller random sample of adults in the city', errorTag: null, note: 'Mẫu nhỏ hơn thì biên sai số LỚN hơn.' },
        { display: 'Surveying only adults who use public transportation', errorTag: null, note: 'Mẫu không còn ngẫu nhiên: kết quả bị lệch, chứ biên sai số không nhỏ đi.' },
        { display: 'Reporting the percent as a whole number of adults instead', errorTag: 'ignored_margin_of_error', note: 'Đổi cách ghi kết quả không làm ước lượng chính xác hơn.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A survey of a random sample of ${n} adults in a city found that ${p}% of the adults use public transportation, with an associated margin of error of ${moe}%. Which of the following changes would most likely DECREASE the margin of error?`,
      choices,
      correctIndex,
      steps: [{ text: 'Với cùng một cách chọn mẫu ngẫu nhiên, mẫu càng lớn thì ước lượng càng ổn định, nên biên sai số càng nhỏ.' }],
    };
  },
};

/** Ngữ cảnh thí nghiệm / khảo sát cho hai câu kết luận thống kê. */
export const STUDY_CONTEXTS = [
  { people: 'volunteers', treatment: 'using a vocabulary app', assign: 'use a vocabulary app', outcome: 'higher test scores', group: 'students' },
  { people: 'volunteers', treatment: 'doing a new stretching routine', assign: 'do a new stretching routine', outcome: 'fewer muscle injuries', group: 'runners' },
  { people: 'volunteers', treatment: 'following a bedtime reading program', assign: 'follow a bedtime reading program', outcome: 'more hours of sleep', group: 'teenagers' },
] as const;

export function experimentAnswers(ctx: (typeof STUDY_CONTEXTS)[number]) {
  return {
    correct: `${cap(ctx.treatment)} likely caused ${ctx.outcome} among ${ctx.group} similar to the ${ctx.people} in the study.`,
    overreach: `${cap(ctx.treatment)} will cause ${ctx.outcome} for all ${ctx.group} in the country.`,
    noCause: `There is an association, but no cause-and-effect conclusion can be drawn.`,
    noEffect: `${cap(ctx.treatment)} had no effect on the ${ctx.group} in the study.`,
  };
}

export function surveyAnswers(ctx: (typeof STUDY_CONTEXTS)[number]) {
  return {
    correct: `Among ${ctx.group} in the city, ${ctx.treatment} is associated with ${ctx.outcome}, but a cause-and-effect relationship cannot be concluded.`,
    causes: `${cap(ctx.treatment)} causes ${ctx.outcome} among ${ctx.group} in the city.`,
    reverse: `${cap(ctx.outcome)} cause ${ctx.group} to start ${ctx.treatment}.`,
    none: `There is no association between ${ctx.treatment} and ${ctx.outcome}.`,
  };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Thí nghiệm có phân nhóm ngẫu nhiên trên TÌNH NGUYỆN VIÊN: kết luận nhân quả, nhưng không khái quát ra tổng thể. */
const experimentCausal: MathTemplate = {
  slug: 'psda-experiment-causal-scope',
  skill: 'statistical_claims',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const ctx = pick(rng, STUDY_CONTEXTS);
    const n = pickInt(rng, 20, 150) * 2;
    const weeks = pickInt(rng, 3, 12);
    const a = experimentAnswers(ctx);
    const { choices, correctIndex } = buildTextChoices(
      a.correct,
      [
        { display: a.overreach, errorTag: null, note: 'Người tham gia là tình nguyện viên, không phải mẫu ngẫu nhiên của cả nước — không khái quát ra tổng thể được.' },
        { display: a.noCause, errorTag: 'confused_correlation_causation', note: 'Có phân nhóm NGẪU NHIÊN thì kết luận nhân quả được — đó chính là mục đích của thí nghiệm.' },
        { display: a.noEffect, errorTag: null, note: 'Đề cho thấy nhóm được can thiệp có kết quả tốt hơn rõ rệt.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `Researchers randomly assigned ${n} ${ctx.group} who were ${ctx.people} to two equal groups. For ${weeks} weeks, one group was assigned to ${ctx.assign} and the other group was not. The group assigned to ${ctx.assign} showed significantly ${ctx.outcome}. Which of the following conclusions is best supported by the study?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Phân nhóm ngẫu nhiên cho phép kết luận nhân quả.' },
        { text: 'Nhưng người tham gia là tình nguyện viên, không được chọn ngẫu nhiên từ tổng thể, nên kết luận chỉ áp dụng cho những người giống họ.' },
      ],
    };
  },
};

/** Khảo sát quan sát trên MẪU NGẪU NHIÊN: khái quát được, nhưng chỉ là liên hệ, không phải nhân quả. */
const surveyAssociation: MathTemplate = {
  slug: 'psda-survey-association-only',
  skill: 'statistical_claims',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const ctx = pick(rng, STUDY_CONTEXTS);
    const n = pickInt(rng, 30, 300) * 5;
    const a = surveyAnswers(ctx);
    const { choices, correctIndex } = buildTextChoices(
      a.correct,
      [
        { display: a.causes, errorTag: 'confused_correlation_causation' },
        { display: a.reverse, errorTag: 'confused_correlation_causation', note: 'Nghiên cứu quan sát không cho biết chiều nhân quả nào cả, kể cả chiều ngược lại.' },
        { display: a.none, errorTag: null, note: 'Khảo sát tìm thấy một liên hệ rõ, nên không thể nói là không có liên hệ.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A survey of a random sample of ${n} ${ctx.group} in a city found that those who reported ${ctx.treatment} tended to have ${ctx.outcome} than those who did not. Which of the following conclusions is best supported by the survey?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Mẫu ngẫu nhiên từ thành phố nên kết quả khái quát được cho cả thành phố.' },
        { text: 'Nhưng đây là quan sát, không phải thí nghiệm có phân nhóm ngẫu nhiên, nên chỉ kết luận được liên hệ, không kết luận được nhân quả.' },
      ],
    };
  },
};

export const MORE_DATA_TEMPLATES: MathTemplate[] = [
  ratioPartWhole,
  speedDistance,
  percentOfPercent,
  percentIncreaseNew,
  meanMissingValue,
  medianOfList,
  lineOfFitPredict,
  fitCoefficientMeaning,
  probabilityNotColor,
  expectedCount,
  sampleEstimate,
  marginSampleSize,
  experimentCausal,
  surveyAssociation,
];
