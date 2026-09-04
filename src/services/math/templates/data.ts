import { buildChoices, buildTextChoices } from '../choices';
import { fracOrInt, pick, pickInt, pickNonZeroInt, signedTerm } from '../authoring';
import { formatValue, formatValueMath, rat } from '@/lib/math/value';
import type { MathTemplate } from '@/lib/math/types';

/**
 * Bảy template của domain Problem-Solving and Data Analysis.
 *
 * Domain này có NHIỀU KỸ NĂNG NHẤT (7) nhưng tỉ trọng chỉ ~15% số câu, nên mỗi
 * kỹ năng chỉ gặp chừng một câu trong cả đề. Đó cũng là lý do bài chẩn đoán chỉ
 * dành được 3 câu cho cả domain: đọc kết quả ở đây phải dè dặt hơn hẳn Algebra.
 */

const GOODS = ['jacket', 'bicycle', 'backpack', 'pair of headphones', 'desk lamp', 'winter coat'];

/**
 * Biết giá sau giảm và tỉ lệ giảm, tìm giá gốc — dạng grid-in.
 *
 * Chọn dạng "tìm ngược giá gốc" chứ không phải "tìm giá sau giảm" vì đó mới là
 * chỗ người học hay sai: phần trăm giảm tính trên giá GỐC, nên không cộng ngược
 * phần trăm ấy vào giá đã giảm để quay về được.
 *
 * GIÁ GỐC LÀ BỘI CỦA 20 và tỉ lệ giảm là bội của 5 — hai điều kiện này bảo đảm
 * giá sau giảm luôn là số nguyên. Nếu không thì đề sẽ hỏi giá gốc của một món
 * hàng bán 43,7 đô, mà đề thi thật không viết như vậy.
 */
const percentDiscountOriginal: MathTemplate = {
  slug: 'psda-percent-discount-original',
  skill: 'percentages',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const item = pick(rng, GOODS);
    const percentOff = pick(rng, [5, 10, 15, 20, 25, 40, 50, 60, 75, 80]);
    const original = 20 * pickInt(rng, 3, 50);
    const remaining = 100 - percentOff;
    const sale = (original * remaining) / 100;

    return {
      format: 'grid_in',
      stem:
        `A store sells a ${item} at a discount of ${percentOff}% off the original price. ` +
        `The sale price is $${sale}. What was the original price, in dollars?`,
      answer: rat(original),
      steps: [
        {
          text: `Giảm ${percentOff}% nghĩa là giá bán chỉ còn ${remaining}% giá gốc.`,
          expr: `${sale} = frac(${remaining},100) × P`,
        },
        {
          text: 'Muốn tìm P thì làm ngược lại: nhân 100 rồi chia cho phần trăm còn lại.',
          expr: `P = frac(${sale} × 100,${remaining})`,
        },
        { text: 'Ra giá gốc.', expr: `P = ${original}` },
        {
          text:
            `Lỗi hay gặp: cộng ${percentOff}% của GIÁ ĐÃ GIẢM vào ${sale}. ` +
            'Phần trăm giảm tính trên giá gốc, nên cộng ngược kiểu đó không bao giờ quay lại đúng giá gốc.',
        },
      ],
    };
  },
};

const MACHINES = [
  { noun: 'bottles', verb: 'fills' },
  { noun: 'labels', verb: 'prints' },
  { noun: 'envelopes', verb: 'seals' },
  { noun: 'tiles', verb: 'cuts' },
];

/**
 * Tốc độ theo phút, hỏi tổng theo giờ — dạng grid-in.
 *
 * Cả câu hỏi chỉ có một cái bẫy duy nhất và nó nằm ở ĐƠN VỊ: nhân thẳng tốc độ
 * với số giờ là ra một con số nhỏ hơn đáp án đúng đúng 60 lần. Đề thi thật cài
 * bẫy này rất nhiều, và nó không phải bẫy về tính toán.
 */
const rateUnitConversion: MathTemplate = {
  slug: 'psda-rate-unit-conversion',
  skill: 'ratios_rates_units',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const machine = pick(rng, MACHINES);
    const perMinute = pickInt(rng, 3, 9);
    const hours = pickInt(rng, 2, 8);
    const total = perMinute * 60 * hours;

    return {
      format: 'grid_in',
      stem:
        `A machine ${machine.verb} ${perMinute} ${machine.noun} per minute. ` +
        `At this rate, how many ${machine.noun} will the machine ${machine.verb.replace(/s$/, '')} ` +
        `in ${hours} hours?`,
      answer: rat(total),
      steps: [
        {
          text: 'Tốc độ cho theo PHÚT còn thời gian cho theo GIỜ — phải đưa về cùng đơn vị trước.',
          expr: `${hours} giờ = ${hours} × 60 = ${hours * 60} phút`,
        },
        {
          text: 'Nhân tốc độ với số phút.',
          expr: `${perMinute} × ${hours * 60} = ${total}`,
        },
        {
          text:
            `Lỗi hay gặp: nhân thẳng ${perMinute} × ${hours} = ${perMinute * hours}. ` +
            'Kết quả ấy nhỏ hơn đáp án đúng đúng 60 lần, vì đã bỏ mất bước đổi giờ sang phút.',
        },
      ],
    };
  },
};

const SURVEY_SUBJECTS = [
  { what: 'books', who: 'students', verb: 'read last month' },
  { what: 'pets', who: 'households', verb: 'own' },
  { what: 'trips', who: 'employees', verb: 'took last year' },
];

/**
 * Trung vị đọc từ BẢNG TẦN SỐ.
 *
 * Đọc từ bảng tần số chứ không từ một dãy số liệt kê sẵn, vì đó mới là chỗ sai:
 * dãy đã liệt kê thì chỉ cần đếm, còn bảng tần số thì phải nhân ra rồi mới đếm.
 * Nhiễu "lấy giá trị ở giữa CỘT GIÁ TRỊ" chính là cách sai đó.
 *
 * Tổng tần số luôn LẺ để trung vị rơi đúng vào một giá trị, không phải trung
 * bình của hai giá trị giữa — ca ấy đáng dạy riêng chứ không trộn vào đây.
 */
const medianFromFrequencyTable: MathTemplate = {
  slug: 'psda-median-frequency-table',
  skill: 'one_var_data',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const subject = pick(rng, SURVEY_SUBJECTS);
    const base = pickInt(rng, 0, 5);
    const values = [base, base + 1, base + 2, base + 3];
    const frequencies = [
      pickInt(rng, 2, 9),
      pickInt(rng, 2, 9),
      pickInt(rng, 2, 9),
      pickInt(rng, 2, 9),
    ];

    // Tổng lẻ trước, rồi mới tách mốt cho duy nhất — cộng 2 giữ nguyên tính
    // chẵn lẻ nên hai bước không phá nhau, và không phải bốc lại lần nào.
    if (frequencies.reduce((s, f) => s + f, 0) % 2 === 0) frequencies[0] = (frequencies[0] ?? 0) + 1;
    const peak = Math.max(...frequencies);
    if (frequencies.filter((f) => f === peak).length > 1) {
      frequencies[frequencies.indexOf(peak)] = peak + 2;
    }

    const total = frequencies.reduce((s, f) => s + f, 0);
    const position = (total + 1) / 2;

    let running = 0;
    let medianIndex = 0;
    for (let i = 0; i < values.length; i += 1) {
      running += frequencies[i] ?? 0;
      if (running >= position) {
        medianIndex = i;
        break;
      }
    }
    const median = values[medianIndex] ?? 0;

    const weightedSum = values.reduce((s, v, i) => s + v * (frequencies[i] ?? 0), 0);
    const mode = values[frequencies.indexOf(Math.max(...frequencies))] ?? 0;

    const { choices, correctIndex } = buildChoices(
      rat(median),
      [
        { value: rat(weightedSum, total), errorTag: 'confused_mean_median' },
        { value: rat(mode), errorTag: 'confused_mean_median' },
        {
          // Giữa CỘT GIÁ TRỊ, tức là bỏ qua tần số hoàn toàn.
          value: rat(values[1]! + values[2]!, 2),
          errorTag: null,
          note: 'Đây là giá trị nằm giữa cột bên trái. Trung vị phải đếm theo TẦN SỐ, không đếm theo số dòng của bảng.',
        },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem:
        `The frequency table summarizes the number of ${subject.what} that ${total} ${subject.who} ` +
        `${subject.verb}. What is the median number of ${subject.what}?`,
      figure: {
        kind: 'data_table',
        caption: `Số ${subject.what} — bảng tần số`,
        columns: [`Number of ${subject.what}`, 'Frequency'],
        rows: values.map((v, i) => ({ label: String(v), cells: [frequencies[i] ?? 0] })),
        totalRow: { label: 'Total', cells: [total] },
      },
      choices,
      correctIndex,
      steps: [
        {
          text: `Tổng tần số là ${total}, số lẻ, nên trung vị là giá trị đứng thứ ${position} khi xếp toàn bộ số liệu tăng dần.`,
          expr: `frac(${total} + 1,2) = ${position}`,
        },
        {
          text: 'Cộng dồn tần số từ trên xuống cho tới khi vượt qua vị trí đó.',
          expr: values
            .map((v, i) => `${v}: ${frequencies.slice(0, i + 1).reduce((s, f) => s + f, 0)}`)
            .join(',   '),
        },
        {
          text: `Vị trí ${position} rơi vào nhóm giá trị ${median}.`,
          expr: `trung vị = ${median}`,
        },
      ],
    };
  },
};

const SCATTER_CONTEXTS = [
  { x: 'Number of practice sessions', y: 'Test score', unit: 'points' },
  { x: 'Hours of sunlight per day', y: 'Plant height', unit: 'centimeters' },
  { x: 'Years of experience', y: 'Projects completed', unit: 'projects' },
];

/**
 * Dự đoán bằng ĐƯỜNG THẲNG PHÙ HỢP NHẤT, không phải bằng điểm dữ liệu.
 *
 * Cái bẫy trung tâm nằm ở nhiễu thứ ba: người học nhìn scatterplot, tìm điểm có
 * hoành độ gần nhất rồi đọc tung độ của nó. Đề hỏi giá trị DỰ ĐOÁN, mà dự đoán
 * thì luôn đọc trên đường, không đọc trên điểm.
 */
const scatterplotPrediction: MathTemplate = {
  slug: 'psda-scatterplot-prediction',
  skill: 'two_var_data',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const context = pick(rng, SCATTER_CONTEXTS);
    const slope = pickInt(rng, 2, 6);
    const intercept = pickInt(rng, 3, 20);
    const at = pickInt(rng, 9, 14);

    // Điểm dữ liệu rải quanh đường, lệch tối đa 3 đơn vị — đủ để thấy đây là dữ
    // liệu thật chứ không phải một đường thẳng, mà không che mất xu hướng.
    const points = Array.from({ length: 9 }, (_, i) => {
      const x = i + 1;
      return { x, y: slope * x + intercept + pickInt(rng, -3, 3) };
    });

    const answer = slope * at + intercept;
    const nearest = points[points.length - 1];

    const { choices, correctIndex } = buildChoices(
      rat(answer),
      [
        { value: rat(intercept * at + slope), errorTag: 'swapped_slope_intercept' },
        { value: rat(-slope * at + intercept), errorTag: 'sign_flip' },
        {
          value: rat(nearest?.y ?? 0),
          errorTag: null,
          note: 'Đây là tung độ của một ĐIỂM DỮ LIỆU trên biểu đồ. Giá trị dự đoán phải đọc trên ĐƯỜNG phù hợp nhất.',
        },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem:
        `The scatterplot shows the relationship between ${context.x.toLowerCase()} and ` +
        `${context.y.toLowerCase()} for nine observations. The line of best fit is given by ` +
        `y = ${slope}x + ${intercept}. Based on this line, what is the predicted ${context.y.toLowerCase()} ` +
        `when x = ${at}?`,
      figure: {
        kind: 'scatterplot',
        caption: `${context.y} theo ${context.x.toLowerCase()}`,
        xLabel: context.x,
        yLabel: `${context.y} (${context.unit})`,
        points,
        line: { slope, intercept },
        xRange: [0, 15],
        yRange: [0, slope * 15 + intercept + 4],
      },
      choices,
      correctIndex,
      steps: [
        {
          text: 'Đề đã cho sẵn phương trình đường phù hợp nhất, nên không phải đọc gì trên biểu đồ.',
          expr: `y = ${slope}x + ${intercept}`,
        },
        { text: `Thay x = ${at} vào.`, expr: `y = ${slope} × ${at} + ${intercept} = ${answer}` },
        {
          text: 'Các điểm chấm quanh đường chỉ là số liệu quan sát. Dự đoán luôn đọc trên đường, không đọc trên điểm.',
        },
      ],
    };
  },
};

const TABLE_CONTEXTS = [
  {
    rowTitle: 'Grade',
    rows: ['Grade 11', 'Grade 12'],
    colTitle: 'Choice',
    cols: ['Chose art', 'Chose music'],
    unit: 'students',
  },
  {
    rowTitle: 'Shift',
    rows: ['Morning shift', 'Evening shift'],
    colTitle: 'Response',
    cols: ['Prefers remote', 'Prefers on-site'],
    unit: 'employees',
  },
];

/**
 * Xác suất có điều kiện đọc từ BẢNG HAI CHIỀU.
 *
 * Cả hai nhiễu mang nhãn `wrong_denominator` là hai cách lấy sai mẫu số, và đó
 * đúng là toàn bộ nội dung của kỹ năng này: câu "chọn ngẫu nhiên trong số những
 * người thuộc hàng X" giới hạn không gian mẫu về một hàng, chứ không phải cả
 * bảng. Người học đọc lướt sẽ lấy tổng cả bảng.
 */
const twoWayTableConditional: MathTemplate = {
  slug: 'psda-two-way-table-conditional',
  skill: 'probability',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const context = pick(rng, TABLE_CONTEXTS);
    const cells = [
      [pickInt(rng, 12, 60), pickInt(rng, 12, 60)],
      [pickInt(rng, 12, 60), pickInt(rng, 12, 60)],
    ];

    const rowIndex = rng() < 0.5 ? 0 : 1;
    const colIndex = rng() < 0.5 ? 0 : 1;

    const cell = cells[rowIndex]![colIndex]!;
    const rowTotal = cells[rowIndex]!.reduce((s, n) => s + n, 0);
    const colTotal = (cells[0]![colIndex] ?? 0) + (cells[1]![colIndex] ?? 0);
    const grandTotal = cells.flat().reduce((s, n) => s + n, 0);

    const { choices, correctIndex } = buildChoices(
      rat(cell, rowTotal),
      [
        {
          value: rat(cell, grandTotal),
          errorTag: 'wrong_denominator',
          note: `Lấy tổng CẢ BẢNG (${grandTotal}) làm mẫu. Đề đã giới hạn trong ${context.rows[rowIndex]}, nên mẫu là ${rowTotal}.`,
        },
        {
          value: rat(cell, colTotal),
          errorTag: 'wrong_denominator',
          note: `Lấy tổng theo CỘT (${colTotal}) làm mẫu. Điều kiện của đề nằm ở hàng, không nằm ở cột.`,
        },
        {
          value: rat(rowTotal - cell, rowTotal),
          errorTag: null,
          note: 'Đây là xác suất của trường hợp CÒN LẠI trong cùng hàng — đúng mẫu nhưng lấy nhầm tử.',
        },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem:
        `The table shows the results of a survey of ${grandTotal} ${context.unit}. ` +
        `If one of the ${context.unit} in ${context.rows[rowIndex]!.toLowerCase()} is selected at random, ` +
        `what is the probability that the selected ${context.unit.replace(/s$/, '')} ` +
        `${context.cols[colIndex]!.toLowerCase()}?`,
      figure: {
        kind: 'data_table',
        caption: `${context.rowTitle} × ${context.colTitle}`,
        columns: ['', ...context.cols, 'Total'],
        rows: context.rows.map((label, i) => ({
          label,
          cells: [...cells[i]!, cells[i]!.reduce((s, n) => s + n, 0)],
        })),
        totalRow: {
          label: 'Total',
          cells: [
            (cells[0]![0] ?? 0) + (cells[1]![0] ?? 0),
            (cells[0]![1] ?? 0) + (cells[1]![1] ?? 0),
            grandTotal,
          ],
        },
      },
      choices,
      correctIndex,
      steps: [
        {
          text:
            `"Chọn ngẫu nhiên trong số ${context.rows[rowIndex]}" thu hẹp không gian mẫu về ĐÚNG HÀNG ĐÓ. ` +
            'Đây là chỗ quyết định cả bài.',
          expr: `mẫu số = ${rowTotal}`,
        },
        {
          text: `Trong hàng ấy, số ${context.unit} ${context.cols[colIndex]!.toLowerCase()} là ${cell}.`,
          expr: `tử số = ${cell}`,
        },
        {
          text: 'Lập tỉ số rồi rút gọn.',
          expr: `frac(${cell},${rowTotal}) = ${formatValue(rat(cell, rowTotal))}`,
        },
      ],
    };
  },
};

const CITIES = ['Brookfield', 'Ashford', 'Redmont', 'Camden'];

/**
 * Kết luận đúng từ một ước lượng có SAI SỐ BIÊN.
 *
 * Lựa chọn là câu văn, nên đáp án đúng vẫn phải KIỂM CHỨNG ĐƯỢC: khoảng
 * [M − E, M + E] tính thẳng từ hai số in trong đề, và bộ kiểm chứng trong test
 * đọc ngược lại đúng hai số ấy.
 *
 * Ba nhiễu là ba cách hiểu sai khác hẳn nhau, không phải ba cách nói vòng vo
 * của cùng một cái sai: coi ước lượng là con số chính xác, áp kết luận về
 * TRUNG BÌNH lên TỪNG CÁ NHÂN, và suy rộng ra ngoài tổng thể đã lấy mẫu.
 */
const marginOfErrorConclusion: MathTemplate = {
  slug: 'psda-margin-of-error-conclusion',
  skill: 'sample_inference',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const city = pick(rng, CITIES);
    const sampleSize = pick(rng, [180, 240, 320, 400, 500]);
    const mean = pickInt(rng, 4, 12);
    const tenths = pickInt(rng, 1, 9);
    const marginTenths = pickInt(rng, 2, 8);

    const meanText = `${mean}.${tenths}`;
    const marginText = `0.${marginTenths}`;
    const low = ((mean * 10 + tenths - marginTenths) / 10).toFixed(1);
    const high = ((mean * 10 + tenths + marginTenths) / 10).toFixed(1);

    const { choices, correctIndex } = buildTextChoices(
      `It is plausible that the mean number of hours for all residents of ${city} is between ${low} and ${high}.`,
      [
        {
          display: `The mean number of hours for all residents of ${city} is exactly ${meanText}.`,
          errorTag: 'ignored_margin_of_error',
        },
        {
          display: `Every resident of ${city} spent between ${low} and ${high} hours.`,
          errorTag: null,
          note: 'Khoảng tin cậy nói về TRUNG BÌNH của cả tổng thể, không nói gì về từng người một.',
        },
        {
          display: `It is plausible that the mean number of hours for all residents of the country is between ${low} and ${high}.`,
          errorTag: null,
          note: `Mẫu chỉ lấy trong ${city}, nên kết luận cũng chỉ được nói về ${city}.`,
        },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem:
        `A researcher surveyed a random sample of ${sampleSize} residents of ${city}. ` +
        `Based on the sample, the estimated mean number of hours per week that residents of ${city} ` +
        `spend exercising is ${meanText} hours, with an associated margin of error of ${marginText} hours. ` +
        'Which of the following is the most appropriate conclusion?',
      choices,
      correctIndex,
      steps: [
        {
          text: 'Ước lượng từ mẫu không bao giờ là con số chính xác của tổng thể. Sai số biên biến nó thành một KHOẢNG.',
          expr: `${meanText} ± ${marginText}`,
        },
        { text: 'Cộng và trừ sai số biên để ra hai đầu khoảng.', expr: `${low}   →   ${high}` },
        {
          text:
            'Hai giới hạn của kết luận: nó nói về TRUNG BÌNH chứ không nói về từng người, ' +
            `và chỉ nói về ${city} — đúng bằng tổng thể mà mẫu được lấy ra.`,
        },
      ],
    };
  },
};

const STUDY_TOPICS = [
  { treatment: 'a new study technique', outcome: 'higher test scores', group: 'students' },
  { treatment: 'a daily walking program', outcome: 'lower resting heart rates', group: 'adults' },
  { treatment: 'a revised training module', outcome: 'faster task completion', group: 'employees' },
  { treatment: 'a mindfulness app', outcome: 'lower reported stress', group: 'volunteers' },
  { treatment: 'a bilingual reading program', outcome: 'stronger vocabulary growth', group: 'children' },
  { treatment: 'a standing desk', outcome: 'fewer reported back problems', group: 'office workers' },
  { treatment: 'a plant-based meal plan', outcome: 'lower cholesterol readings', group: 'participants' },
  { treatment: 'an earlier school start time', outcome: 'more reported fatigue', group: 'teenagers' },
];

/**
 * Kết luận nào rút ra được từ một nghiên cứu — phụ thuộc vào THIẾT KẾ.
 *
 * Template tự bốc một trong hai thiết kế rồi sinh đáp án đúng tương ứng, nên
 * không học vẹt được: cùng một lựa chọn "X gây ra Y" là ĐÚNG với thí nghiệm
 * phân nhóm ngẫu nhiên và SAI với nghiên cứu quan sát. Đây chính là ranh giới
 * mà đề thi thật kiểm tra.
 */
const studyDesignConclusion: MathTemplate = {
  slug: 'psda-study-design-conclusion',
  skill: 'statistical_claims',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const topic = pick(rng, STUDY_TOPICS);
    const size = pick(rng, [96, 120, 144, 180, 200, 250, 300, 360, 420, 480]);
    const randomized = rng() < 0.5;

    const causal = `${capitalize(topic.treatment)} caused ${topic.outcome} for the ${topic.group} in the study.`;
    const association = `There is an association between ${topic.treatment} and ${topic.outcome}, but the study does not show that one caused the other.`;
    const everyone = `Any ${topic.group.replace(/s$/, '')} who uses ${topic.treatment} will have ${topic.outcome}.`;
    const nationwide = `${capitalize(topic.treatment)} causes ${topic.outcome} for all ${topic.group}, everywhere.`;

    const { choices, correctIndex } = buildTextChoices(
      randomized ? causal : association,
      randomized
        ? [
            {
              display: association,
              errorTag: null,
              note: 'Nghiên cứu này CÓ phân nhóm ngẫu nhiên, nên kết luận nhân quả là hợp lệ. Dừng ở "có liên hệ" là kết luận yếu hơn mức dữ liệu cho phép.',
            },
            {
              display: everyone,
              errorTag: null,
              note: 'Kết quả trung bình của một nhóm không bảo đảm điều gì cho từng cá nhân.',
            },
            {
              display: nationwide,
              errorTag: null,
              note: `Mẫu chỉ gồm ${size} người tham gia nghiên cứu, không suy rộng ra mọi ${topic.group} được.`,
            },
          ]
        : [
            { display: causal, errorTag: 'confused_correlation_causation' },
            {
              display: nationwide,
              errorTag: 'confused_correlation_causation',
              note: 'Vừa kết luận nhân quả từ dữ liệu quan sát, vừa suy rộng ra ngoài tổng thể đã lấy mẫu — sai hai lần.',
            },
            {
              display: everyone,
              errorTag: null,
              note: 'Kết quả trung bình của một nhóm không bảo đảm điều gì cho từng cá nhân.',
            },
          ],
      rng,
    );

    return {
      format: 'mcq',
      stem: randomized
        ? `In a study, ${size} ${topic.group} were randomly assigned to one of two groups. ` +
          `One group used ${topic.treatment} and the other did not. The group that used ` +
          `${topic.treatment} showed ${topic.outcome}. Which conclusion is best supported by this study?`
        : `A researcher surveyed ${size} ${topic.group} and recorded whether each one used ` +
          `${topic.treatment}. Those who reported using ${topic.treatment} also reported ` +
          `${topic.outcome}. Which conclusion is best supported by this study?`,
      choices,
      correctIndex,
      steps: [
        {
          text: randomized
            ? 'Đề nói "randomly assigned" — người tham gia được PHÂN NHÓM ngẫu nhiên. Đó là thí nghiệm.'
            : 'Đề nói "surveyed" và "reported" — người tham gia tự có sẵn thói quen, không ai phân nhóm họ. Đó là nghiên cứu quan sát.',
        },
        {
          text: randomized
            ? 'Phân nhóm ngẫu nhiên làm hai nhóm tương đương nhau ở mọi mặt khác, nên khác biệt còn lại quy được cho can thiệp. Kết luận NHÂN QUẢ hợp lệ.'
            : 'Không phân nhóm thì hai nhóm có thể khác nhau sẵn ở nhiều thứ khác. Chỉ kết luận được là CÓ LIÊN HỆ.',
        },
        {
          text: `Dù thiết kế nào, kết luận cũng chỉ nói được về ${size} người trong nghiên cứu, không nói về mọi ${topic.group}.`,
        },
      ],
    };
  },
};

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}


const scaleDrawingProportion: MathTemplate = {
  slug: 'psda-scale-drawing-proportion',
  skill: 'ratios_rates_units',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 2, 6); // inches in the given scale pair
    const b = pickInt(rng, 8, 45); // feet corresponding to a inches
    const k = pickInt(rng, 2, 9); // multiplier used to build the second inch value
    const d = a * k; // second inch value — built as a multiple of a so x comes out a clean integer
    const answer = b * k; // x = b*d/a = b*(a*k)/a = b*k, derived straight from the chosen parameters

    const stem = `On a certain scale drawing, ${a} inches represent ${b} feet. At the same scale, ${d} inches represent how many feet?`;

    const { choices, correctIndex } = buildChoices(
      rat(answer),
      [
        { value: rat(a * a * k, b), errorTag: 'inverted_fraction' },
        { value: rat(b * d), errorTag: null, note: 'Nhân b với d nhưng quên chia cho a khi lập tỉ lệ thức.' },
        { value: rat(b + d - a), errorTag: null, note: 'Cộng thêm phần chênh lệch (d - a) thay vì nhân theo tỉ lệ — nhầm quan hệ tỉ lệ thuận với quan hệ cộng tuyến tính.' },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem,
      choices,
      correctIndex,
      steps: [
        { text: 'Lập tỉ lệ thức giữa số inch và số feet, giữ đúng thứ tự trên dưới ở hai vế.', expr: `frac(${a},${b}) = frac(${d},x)` },
        { text: 'Nhân chéo hai vế.', expr: `${a}x = ${b * d}` },
        { text: 'Chia cả hai vế cho hệ số của x để tìm đáp án.', expr: `x = frac(${b * d},${a}) = ${answer}` },
      ],
    };
  },
};


const percentTwoStepChange: MathTemplate = {
  slug: 'psda-two-step-percent-change',
  skill: 'percentages',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    // Hai lần thay đổi phần trăm liên tiếp: tăng/giảm a%, rồi tăng/giảm b%.
    // Chọn a = 10m, b = 10n (m, n nguyên) để tích hai hệ số nhân luôn chia hết cho 100,
    // đảm bảo phần trăm cuối cùng luôn là SỐ NGUYÊN — không cần thử lại.
    // Dải rộng (2..9, thay vì 2..6 trước đây) để 200 hạt ra đủ đa dạng câu hỏi.
    const m = pickInt(rng, 2, 9); // a = 20..90
    let n = pickInt(rng, 2, 9); // b = 20..90
    // n != m BẰNG CẤU TRÚC: nếu trùng và cùng dấu tăng/giảm thì hai hệ số nhân
    // ở bước 1 và bước 2 ra CÙNG một phân số (ví dụ cả hai đều "tăng 40%"),
    // khiến bước giải thứ hai in lại y hệt bước giải thứ nhất — trông như bước
    // đó không làm gì cả. Đẩy n sang giá trị khác m loại bỏ hẳn khả năng này.
    if (n === m) n = m === 9 ? 2 : m + 1;
    const s1 = pick(rng, [1, -1]);
    const s2 = pick(rng, [1, -1]);
    const a = 10 * m;
    const b = 10 * n;
    const dir1 = s1 === 1 ? 'increased' : 'decreased';
    const dir2 = s2 === 1 ? 'increased' : 'decreased';

    // Hệ số nhân của từng bước, tính theo phần trăm (ví dụ tăng 40% -> hệ số 140/100).
    const firstFactorPercent = 100 + s1 * a; // luôn dương vì a <= 60
    const secondFactorPercent = 100 + s2 * b; // luôn dương vì b <= 60

    // Đáp án đúng = tích hai hệ số, đổi lại thành phần trăm của giá trị ban đầu.
    // (100 + s1*a)(100 + s2*b) / 100 = 100 + s1*a + s2*b + s1*s2*m*n  -> luôn nguyên.
    const correctPercent = (firstFactorPercent * secondFactorPercent) / 100;

    // Nhiễu bắt buộc: CỘNG THẲNG hai phần trăm thay vì nhân hai hệ số liên tiếp.
    const naivePercent = 100 + s1 * a + s2 * b;
    // Nhiễu: đảo chiều lần thay đổi thứ hai (coi tăng thành giảm hoặc ngược lại).
    const signFlipPercent = 100 + s1 * a - s2 * b - s1 * s2 * m * n;
    // Nhiễu: dừng lại sau bước đầu, quên áp dụng lần thay đổi thứ hai.
    const stoppedEarlyPercent = firstFactorPercent;

    const stem = `A quantity is first ${dir1} by ${a}% and then ${dir2} by ${b}%. The resulting quantity is what percent of the original quantity?`;

    const { choices, correctIndex } = buildTextChoices(
      `${correctPercent}%`,
      [
        { display: `${naivePercent}%`, errorTag: 'percent_added_instead_of_multiplied' },
        { display: `${signFlipPercent}%`, errorTag: 'sign_flip' },
        { display: `${stoppedEarlyPercent}%`, errorTag: 'stopped_too_early' },
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
          text: 'Đổi lần thay đổi thứ nhất thành hệ số nhân so với giá trị ban đầu.',
          expr: `frac(${firstFactorPercent},100)`,
        },
        {
          text: 'Đổi lần thay đổi thứ hai thành hệ số nhân — hệ số này áp dụng lên giá trị SAU lần thứ nhất, không phải giá trị ban đầu.',
          expr: `frac(${secondFactorPercent},100)`,
        },
        {
          text: 'Nhân hai hệ số này lại rồi đổi kết quả thành phần trăm — tuyệt đối không được cộng thẳng hai phần trăm ban đầu với nhau.',
          expr: `frac(${firstFactorPercent},100) × frac(${secondFactorPercent},100) × 100 = ${correctPercent}`,
        },
      ],
    };
  },
};


const meanAfterAddingValue: MathTemplate = {
  slug: 'psda-mean-after-adding-value',
  skill: 'one_var_data',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const n = pickInt(rng, 4, 10); // số học sinh ban đầu
    const mean0 = pickInt(rng, 60, 95); // điểm trung bình ban đầu
    const newRaw = pickInt(rng, 50, 93);
    const newStudentScore = newRaw === mean0 ? newRaw + 7 : newRaw; // đảm bảo khác mean0, vẫn nằm trong 50-100

    const sum0 = n * mean0; // tổng điểm ban đầu = số học sinh x trung bình
    const sumNew = sum0 + newStudentScore; // tổng điểm sau khi thêm học sinh mới
    const nPlus1 = n + 1;

    const stem = `A group of ${n} students has a mean quiz score of ${mean0} points. A new student joins the group and scores ${newStudentScore} points on the same quiz. What is the mean quiz score of all ${nPlus1} students in the group?`;

    const { choices, correctIndex } = buildChoices(
      rat(sumNew, nPlus1),
      [
        { value: rat(sumNew, n), errorTag: 'off_by_one', note: 'Quên tăng số học sinh lên khi chia (vẫn chia cho n thay vì n + 1).' },
        { value: rat(mean0 + newStudentScore, 2), errorTag: 'wrong_denominator', note: 'Lấy trung bình cộng của điểm trung bình cũ và điểm mới như thể chỉ có 2 số liệu.' },
        { value: rat(sum0, nPlus1), errorTag: null, note: 'Quên cộng điểm của học sinh mới vào tổng trước khi chia cho số học sinh mới.' },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem,
      choices,
      correctIndex,
      steps: [
        { text: 'Tính tổng điểm của nhóm học sinh ban đầu bằng số học sinh nhân với điểm trung bình.', expr: `${n} * ${mean0} = ${sum0}` },
        { text: 'Cộng thêm điểm của học sinh mới vào tổng đó.', expr: `${sum0} + ${newStudentScore} = ${sumNew}` },
        { text: 'Chia tổng điểm mới cho tổng số học sinh (đã tăng thêm 1) để được điểm trung bình mới.', expr: `frac(${sumNew},${nPlus1}) = ${fracOrInt(sumNew, nPlus1)}` },
      ],
    };
  },
};


const bestFitSlopeFromPoints: MathTemplate = {
  slug: 'psda-best-fit-slope-from-points',
  skill: 'two_var_data',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    // Dựng hai điểm dữ liệu TRƯỚC (không cho sẵn phương trình đường), rồi suy hệ số góc
    // từ chính hai điểm ấy, rồi ngoại suy tới một hoành độ thứ ba.
    const x1 = pickInt(rng, -6, 8);
    const step = pickInt(rng, 2, 6); // x2 - x1, luôn dương nên hai điểm không trùng hoành độ
    const y1 = pickInt(rng, -15, 15);
    const dy = pickNonZeroInt(rng, -12, 12); // y2 - y1, khác 0 để đường không nằm ngang tuyệt đối trong bài toán này
    const k = pickInt(rng, 1, 4); // số "bước" x kể từ điểm dữ liệu thứ hai tới hoành độ cần dự đoán

    const x2 = x1 + step;
    const y2 = y1 + dy;
    const x3 = x2 + k * step; // luôn khác x1, x2 vì step, k đều dương

    const y3 = y2 + k * dy; // đáp án đúng: đi thêm k bước, mỗi bước y đổi dy

    const stem = `A line of best fit for a set of data passes near the points (${x1}, ${y1}) and (${x2}, ${y2}). Based on this line of best fit, what is the predicted value of y when x = ${x3}?`;

    const { choices, correctIndex } = buildChoices(
      rat(y3),
      [
        // Đếm thiếu một bước x: dùng (k-1) bước thay vì k bước kể từ điểm dữ liệu thứ hai.
        { value: rat(y2 + (k - 1) * dy), errorTag: 'off_by_one' },
        // Đổi dấu bước thay đổi khi ngoại suy (lùi thay vì tiến theo xu hướng).
        { value: rat(y2 - k * dy), errorTag: 'sign_flip' },
        // Đảo ngược hệ số góc (lấy độ thay đổi x chia độ thay đổi y) rồi mới nhân với khoảng cách x.
        { value: rat(k * step * step, dy), errorTag: 'swapped_rise_run' },
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
          text: 'Suy hệ số góc (độ dốc) của đường phù hợp nhất bằng thương của độ thay đổi y và độ thay đổi x giữa hai điểm dữ liệu đã cho.',
          expr: `m = ${fracOrInt(dy, step)}`,
        },
        {
          text: 'Từ điểm dữ liệu thứ hai, dùng hệ số góc vừa tìm để cộng dồn độ thay đổi y ứng với số bước x cần đi thêm, ra giá trị y tại hoành độ được hỏi.',
          expr: `y = ${y2}${signedTerm(k * dy)} = ${y3}`,
        },
      ],
    };
  },
};


const independentEventsMultiply: MathTemplate = {
  slug: 'psda-independent-events-multiply',
  skill: 'probability',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const events = [
      'a spinner lands on the red section',
      'a randomly selected part from a factory is defective',
      'a coin flip lands on heads',
      'a customer arrives at a store within the first minute it opens',
      'a weather station predicts rain on a given day',
      'a student answers a multiple-choice question correctly by guessing',
    ];

    // Chọn hai biến cố KHÁC NHAU bằng cấu trúc offset — không cần vòng lặp thử lại.
    const idx1 = pickInt(rng, 0, events.length - 1);
    const offset = pickInt(rng, 1, events.length - 1);
    const idx2 = (idx1 + offset) % events.length;
    const event1 = events[idx1];
    const event2 = events[idx2];

    // Mẫu số từ 3..8, tử số luôn nằm chặt giữa 0 và mẫu số => xác suất hợp lệ, không cần lọc lại.
    const q1 = pickInt(rng, 3, 8);
    const p1 = pickInt(rng, 1, q1 - 1);
    const q2 = pickInt(rng, 3, 8);
    const p2 = pickInt(rng, 1, q2 - 1);

    const correct = rat(p1 * p2, q1 * q2);

    const stem = `The probability that ${event1} is frac(${p1},${q1}). Independently, the probability that ${event2} is frac(${p2},${q2}). What is the probability that both events occur?`;

    const { choices, correctIndex } = buildChoices(
      correct,
      [
        {
          value: rat(p1 * q2 + p2 * q1, q1 * q2),
          errorTag: null,
          note: 'Cộng hai xác suất theo mẫu số chung thay vì nhân chúng lại — sai vì hai biến cố độc lập phải nhân xác suất.',
        },
        { value: rat(p1 * p2, q1 + q2), errorTag: 'wrong_denominator' },
        { value: rat(p1, q1), errorTag: 'stopped_too_early' },
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
          text: 'Hai biến cố này độc lập với nhau, nên xác suất cả hai cùng xảy ra bằng tích hai xác suất riêng lẻ.',
          expr: `frac(${p1},${q1}) * frac(${p2},${q2}) = frac(${p1 * p2},${q1 * q2})`,
        },
        {
          text: 'Rút gọn phân số kết quả nếu có thể.',
          expr: `frac(${p1 * p2},${q1 * q2}) = ${formatValueMath(correct)}`,
        },
      ],
    };
  },
};


const ciMarginOrPointEstimateGridIn: MathTemplate = {
  slug: 'psda-ci-margin-or-point-estimate',
  skill: 'sample_inference',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const contexts = [
      'the mean number of minutes students spend on homework each night',
      'the mean weight, in pounds, of packages shipped by a warehouse',
      'the mean number of hours per week employees spend commuting',
      'the mean number of pages in novels sold at a bookstore',
    ];
    const noun = pick(rng, contexts);
    const askMargin = pick(rng, [true, false]);

    // Dựng tham số trước: điểm ước lượng và sai số biên, rồi SUY hai đầu mút khoảng tin cậy từ đó.
    const pointEstimate = pickInt(rng, 30, 90);
    const marginOfError = pickInt(rng, 2, 15);
    const lower = pointEstimate - marginOfError; // luôn dương vì pointEstimate >= 30 > 15 >= marginOfError
    const upper = pointEstimate + marginOfError;

    const targetPhrase = askMargin ? 'margin of error' : 'point estimate';
    const stem = `Based on a random sample, researchers constructed a 95 percent confidence interval for ${noun}. The interval extends from ${lower} to ${upper}. What is the ${targetPhrase} of this confidence interval?`;

    const answer = askMargin ? rat(marginOfError) : rat(pointEstimate);
    const steps = askMargin
      ? [
          {
            text: 'Sai số biên (margin of error) bằng một nửa độ rộng của khoảng tin cậy, tức là nửa khoảng cách giữa hai đầu mút.',
            expr: `frac(${upper - lower},2) = ${marginOfError}`,
          },
        ]
      : [
          {
            text: 'Điểm ước lượng (point estimate) chính là trung điểm của khoảng tin cậy, tức trung bình cộng của hai đầu mút.',
            expr: `frac(${lower} + ${upper},2) = ${pointEstimate}`,
          },
        ];

    return { format: 'grid_in', stem, steps, answer };
  },
};


const samplingBiasConclusion: MathTemplate = {
  slug: 'psda-sampling-bias-conclusion',
  skill: 'statistical_claims',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const scenarios = [
      {
        population: 'adults in the city of Fairview',
        sampleGroup: 'shoppers',
        sampleFrame: 'at the Fairview Mall on a Saturday afternoon',
        topic: 'support building a new public library',
      },
      {
        population: 'students at Lincoln High School',
        sampleGroup: 'students',
        sampleFrame: 'in the cafeteria during the first lunch period',
        topic: 'want the school day to start later',
      },
      {
        population: 'employees of Nexlar Corporation',
        sampleGroup: 'employees',
        sampleFrame: "who attended the company's annual holiday party",
        topic: 'are satisfied with the new health insurance plan',
      },
      {
        population: 'residents of Oakdale County',
        sampleGroup: 'residents',
        sampleFrame: 'who called in to a local radio show',
        topic: 'favor the proposed highway expansion',
      },
      {
        population: 'customers of GreenLeaf Grocery',
        sampleGroup: 'customers',
        sampleFrame: "who follow the store's social media page",
        topic: 'would buy a new organic produce line',
      },
    ];
    const scenario = pick(rng, scenarios);
    const { population, sampleGroup, sampleFrame, topic } = scenario;

    // Dựng tham số trước: p là chục phần trăm (2..8 -> 20%..80%), q là chục của cỡ mẫu (1..10 -> 10..100).
    // percent = 10p, n = 10q, k = p*q luôn là số nguyên và k < n vì p < 10.
    const p = pickInt(rng, 2, 8);
    const q = pickInt(rng, 1, 10);
    const percent = 10 * p;
    const n = 10 * q;
    const k = p * q;

    const stem = `A researcher wants to know what proportion of ${population} ${topic}. The researcher surveyed ${n} ${sampleGroup} ${sampleFrame} and found that ${k} of the ${n} people surveyed said they ${topic}. Which of the following is the most appropriate conclusion based on these survey results?`;

    const correct = `Exactly ${percent}% of the ${n} ${sampleGroup} surveyed ${sampleFrame} said they ${topic}, but this result cannot be generalized to all ${population} because the sample was not randomly selected from the entire population.`;

    const distractors = [
      {
        display: `Exactly ${percent}% of all ${population} ${topic}.`,
        errorTag: null,
        note: 'Overgeneralizes a result from a non-random sample to the entire population.',
      },
      {
        display: `Since the survey included ${n} people, which is a large enough sample size, the result can be generalized to all ${population}.`,
        errorTag: null,
        note: 'Assumes a large sample size alone guarantees a representative sample, ignoring that the sampling method was not random.',
      },
      {
        display: `Surveying additional ${sampleGroup} ${sampleFrame} would produce results that accurately represent all ${population}.`,
        errorTag: null,
        note: 'Assumes that surveying more people from the same biased source would eliminate the sampling bias.',
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
          text: 'Tính tỉ lệ trong nhóm được khảo sát.',
          expr: `frac(${k},${n}) = frac(${percent},100)`,
        },
        {
          text: 'Nhóm được khảo sát chỉ đến từ một nơi/thời điểm hẹp và không được chọn ngẫu nhiên từ toàn bộ tổng thể, nên tỉ lệ vừa tính chỉ đúng cho chính nhóm đó. Dù mẫu có lớn hơn hay khảo sát thêm người trong cùng nhóm hẹp ấy, kết quả vẫn không thể suy rộng thành kết luận cho toàn bộ tổng thể.',
        },
      ],
    };
  },
};

export const DATA_TEMPLATES: MathTemplate[] = [
  percentDiscountOriginal,
  rateUnitConversion,
  medianFromFrequencyTable,
  scatterplotPrediction,
  twoWayTableConditional,
  marginOfErrorConclusion,
  studyDesignConclusion,
  scaleDrawingProportion,
  percentTwoStepChange,
  meanAfterAddingValue,
  bestFitSlopeFromPoints,
  independentEventsMultiply,
  ciMarginOrPointEstimateGridIn,
  samplingBiasConclusion,
];
