import { buildChoices } from '../choices';
import { pick, pickInt, pickNonZeroInt, signedCoefTerm, signedTerm } from '../authoring';
import { formatValueMath, rat } from '@/lib/math/value';
import type { AngleCorner, MathSolutionStep, MathTemplate } from '@/lib/math/types';

/**
 * Bốn template của domain Geometry and Trigonometry (~15% số câu đề thật).
 */

/**
 * Bộ ba Pythagore. Dùng bộ ba nguyên chứ không bốc hai cạnh tuỳ ý, vì cạnh
 * huyền phải ra số nguyên: đề hỏi sin(C) mà cạnh huyền là 5√2 thì câu hỏi rẽ
 * sang một kỹ năng khác hẳn, và đáp án không còn là số hữu tỉ nữa.
 */
const TRIPLES: ReadonlyArray<readonly [number, number, number]> = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
  [12, 35, 37],
  [11, 60, 61],
  [28, 45, 53],
  [33, 56, 65],
  [16, 63, 65],
  [48, 55, 73],
];

/**
 * Cho hai cạnh góc vuông, hỏi một tỉ số lượng giác của một góc nhọn.
 *
 * HỎI TỈ SỐ chứ không hỏi độ dài cạnh huyền, vì ba nhiễu của dạng này đều là
 * sai lầm có thật và gọi tên được: lấy nhầm tỉ số kia, lấy nhầm tan, hoặc lật
 * ngược phân số. Dạng "tính cạnh huyền" thì nhiễu chỉ còn là mấy con số quanh
 * đáp án, không dạy được gì.
 *
 * BỐN TRỤC BIẾN THIÊN — bộ ba, hệ số nhân, đổi chỗ hai cạnh góc vuông, và hỏi
 * góc nào / tỉ số nào. Chỉ đổi bộ ba và hệ số thì cả template chỉ đẻ ra vài
 * chục đề, người drill một kỹ năng sẽ gặp lại đúng câu cũ trong buổi thứ hai.
 * Đổi cả góc được hỏi còn có lợi về sư phạm: buộc phải đọc xem góc nào đối với
 * cạnh nào, thay vì cắm đầu lấy "cạnh nhỏ chia cạnh lớn".
 */
const trigRatioOfAcuteAngle: MathTemplate = {
  slug: 'geo-right-triangle-trig-ratio',
  skill: 'right_triangles_trig',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const [p, q, r] = pick(rng, TRIPLES);
    // Bộ ba lớn thì không nhân thêm nữa: một tam giác có cạnh 189 cm vẽ ra vẫn
    // đúng nhưng đọc như một bài tập bịa.
    const scale = Math.max(p, q) > 24 ? 1 : pickInt(rng, 1, 3);
    const swap = rng() < 0.5;

    const ab = (swap ? q : p) * scale;
    const bc = (swap ? p : q) * scale;
    const ac = r * scale;

    const angle = rng() < 0.5 ? 'C' : 'A';
    const opposite = angle === 'C' ? ab : bc;
    const adjacent = angle === 'C' ? bc : ab;
    const oppositeName = angle === 'C' ? 'AB' : 'BC';
    const adjacentName = angle === 'C' ? 'BC' : 'AB';

    const ratio = rng() < 0.5 ? 'sin' : 'cos';
    const answer = ratio === 'sin' ? rat(opposite, ac) : rat(adjacent, ac);
    const otherRatio = ratio === 'sin' ? rat(adjacent, ac) : rat(opposite, ac);
    const numeratorName = ratio === 'sin' ? oppositeName : adjacentName;
    const numeratorValue = ratio === 'sin' ? opposite : adjacent;

    const { choices, correctIndex } = buildChoices(
      answer,
      [
        { value: otherRatio, errorTag: 'used_wrong_trig_ratio' },
        { value: rat(opposite, adjacent), errorTag: 'used_wrong_trig_ratio' },
        { value: rat(ac, numeratorValue), errorTag: 'inverted_fraction' },
      ],
      rng,
    );

    const rule =
      ratio === 'sin'
        ? 'sin của một góc nhọn bằng cạnh ĐỐI chia cạnh HUYỀN'
        : 'cos của một góc nhọn bằng cạnh KỀ chia cạnh HUYỀN';

    const steps: MathSolutionStep[] = [
      { text: `Trong tam giác vuông, ${rule}.` },
      {
        text: 'Cạnh huyền chưa cho, nên tính trước bằng định lý Pythagore.',
        expr: `AC = sqrt(${ab}^2 + ${bc}^2) = ${ac}`,
      },
      {
        text:
          `Góc ${angle} nằm ở đỉnh ${angle}: cạnh đối của nó là ${oppositeName}, ` +
          `cạnh kề là ${adjacentName}.`,
        expr: `${ratio}(${angle}) = frac(${numeratorName},AC) = frac(${numeratorValue},${ac})`,
      },
    ];

    if (answer.num !== numeratorValue || answer.den !== ac) {
      steps.push({ text: 'Rút gọn phân số.', expr: `${ratio}(${angle}) = ${formatValueMath(answer)}` });
    }

    return {
      format: 'mcq',
      stem:
        'In right triangle ABC shown below, the right angle is at B, ' +
        `AB = ${ab} cm, and BC = ${bc} cm. What is the value of ${ratio}(${angle})?`,
      figure: {
        kind: 'right_triangle',
        vertices: ['A', 'B', 'C'],
        legs: [ab, bc],
        hypotenuse: ac,
        unknown: 'hypotenuse',
        unit: 'cm',
      },
      choices,
      correctIndex,
      steps,
    };
  },
};

/**
 * Thể tích khối lập phương suy từ DIỆN TÍCH TOÀN PHẦN — dạng grid-in.
 *
 * Đi vòng qua cạnh chứ không cho thẳng cạnh, vì đó là chỗ dạy được: diện tích
 * toàn phần là SÁU mặt vuông, nên phải chia 6 rồi mới khai căn. Bỏ số 6 hoặc bỏ
 * bước khai căn đều ra một con số trông rất hợp lý.
 */
const LENGTH_UNITS = [
  { one: 'centimeter', square: 'square centimeters', cubic: 'cubic centimeters' },
  { one: 'inch', square: 'square inches', cubic: 'cubic inches' },
  { one: 'meter', square: 'square meters', cubic: 'cubic meters' },
  { one: 'foot', square: 'square feet', cubic: 'cubic feet' },
  { one: 'yard', square: 'square yards', cubic: 'cubic yards' },
];

const cubeVolumeFromSurfaceArea: MathTemplate = {
  slug: 'geo-cube-volume-from-surface',
  skill: 'area_volume',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const unit = pick(rng, LENGTH_UNITS);
    // Cạnh tới 25 thì thể tích là 15625 — vẫn đúng 5 ký tự, vừa ô grid-in.
    const side = pickInt(rng, 2, 25);
    const surface = 6 * side * side;
    const volume = side ** 3;

    // Hỏi cả hai chiều. Chiều nào cũng phải đi qua cạnh, nhưng một chiều đòi
    // khai căn còn chiều kia đòi khai căn bậc ba — hai thao tác khác nhau, và
    // hỏi mãi một chiều thì người học nhớ đường đi chứ không hiểu quan hệ.
    const fromSurface = rng() < 0.5;

    if (fromSurface) {
      return {
        format: 'grid_in',
        stem:
          `The surface area of a cube is ${surface} ${unit.square}. ` +
          `What is the volume of the cube, in ${unit.cubic}?`,
        answer: rat(volume),
        steps: [
          {
            text: 'Khối lập phương có SÁU mặt, mỗi mặt là một hình vuông cạnh s. Chia diện tích toàn phần cho 6 để ra diện tích một mặt.',
            expr: `s^2 = frac(${surface},6) = ${side * side}`,
          },
          { text: 'Khai căn để ra độ dài cạnh.', expr: `s = sqrt(${side * side}) = ${side}` },
          { text: 'Thể tích là cạnh mũ ba.', expr: `V = ${side}^3 = ${volume}` },
          {
            text:
              `Hai chỗ hay hụt: quên chia 6, hoặc dừng lại ở ${side * side} vì tưởng đó đã là cạnh — ` +
              'đó mới là diện tích MỘT MẶT.',
          },
        ],
      };
    }

    return {
      format: 'grid_in',
      stem:
        `The volume of a cube is ${volume} ${unit.cubic}. ` +
        `What is the surface area of the cube, in ${unit.square}?`,
      answer: rat(surface),
      steps: [
        {
          text: 'Thể tích khối lập phương là cạnh mũ ba, nên lấy căn bậc ba để ra cạnh.',
          expr: `s^3 = ${volume}   →   s = ${side}`,
        },
        {
          text: 'Một mặt là hình vuông cạnh s.',
          expr: `${side}^2 = ${side * side}`,
        },
        {
          text: 'Có sáu mặt như vậy.',
          expr: `S = 6 × ${side * side} = ${surface}`,
        },
        {
          text: `Chỗ hay hụt: dừng ở ${side * side} — đó là diện tích một mặt, chưa phải diện tích toàn phần.`,
        },
      ],
    };
  },
};

/** Góc chéo góc qua giao điểm — hai góc đối đỉnh thì bằng nhau. */
const OPPOSITE_CORNER: Record<AngleCorner, AngleCorner> = {
  upper_left: 'lower_right',
  upper_right: 'lower_left',
  lower_left: 'upper_right',
  lower_right: 'upper_left',
};

const CORNERS: AngleCorner[] = ['upper_left', 'upper_right', 'lower_left', 'lower_right'];

/**
 * Hai đường thẳng song song bị một cát tuyến cắt.
 *
 * QUAN HỆ GIỮA HAI GÓC ĐƯỢC SUY RA TỪ VỊ TRÍ, không phải bốc sẵn: hai góc bằng
 * nhau khi chúng ở cùng vị trí góc hoặc ở hai vị trí đối đỉnh, còn lại thì bù
 * nhau. Nhờ vậy đề hỏi được cả tám góc mà đáp án vẫn tự động đúng, và người học
 * không đoán được theo kiểu "câu này chắc lấy 180 trừ đi".
 *
 * Số đo góc bốc từ danh sách đã loại 30°, 45° và 60° — ba giá trị làm nhiễu
 * trùng nhau (ví dụ ở 60° thì 2x và 180 − x cùng bằng 120).
 */
const parallelLinesAngle: MathTemplate = {
  slug: 'geo-parallel-lines-angle',
  skill: 'lines_angles_triangles',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const degrees = pick(rng, [25, 28, 35, 38, 42, 48, 52, 55, 58, 62, 65, 68, 72, 75, 78]);
    const knownCorner = pick(rng, CORNERS);
    const askedCorner = pick(rng, CORNERS);
    const knownLine = rng() < 0.5 ? 0 : 1;
    const askedLine: 0 | 1 = rng() < 0.5 ? 0 : 1;

    // Cùng vị trí (đồng vị hoặc so le) hoặc đối đỉnh thì bằng nhau; kề nhau thì bù nhau.
    const equal = askedCorner === knownCorner || askedCorner === OPPOSITE_CORNER[knownCorner];
    // Hai góc ở cùng một giao điểm và cùng một vị trí thì là chính nó — vô nghĩa
    // khi đem hỏi, nên đẩy sang giao điểm còn lại.
    const sameAngle = askedLine === knownLine && askedCorner === knownCorner;
    const finalAskedLine: 0 | 1 = sameAngle ? (knownLine === 0 ? 1 : 0) : askedLine;

    const answer = equal ? degrees : 180 - degrees;
    const other = equal ? 180 - degrees : degrees;

    const { choices, correctIndex } = buildChoices(
      rat(answer),
      [
        {
          value: rat(other),
          errorTag: null,
          note: equal
            ? 'Hai góc này BẰNG nhau (đồng vị hoặc đối đỉnh), không bù nhau — không phải lấy 180° trừ đi.'
            : 'Hai góc này KỀ nhau nên BÙ nhau, cộng lại bằng 180° — không phải bằng nhau.',
        },
        { value: rat(90 - degrees), errorTag: 'confused_supplementary_complementary' },
        {
          value: rat(2 * degrees),
          errorTag: null,
          note: 'Nhân đôi số đo đã cho. Không có quan hệ nào giữa hai góc ở đây cho ra gấp đôi.',
        },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem:
        'In the figure below, lines ℓ and m are parallel and are intersected by transversal t. ' +
        `If the measure of ∠1 is ${degrees}°, what is the measure of ∠2, in degrees?`,
      figure: {
        kind: 'parallel_lines',
        lineLabels: ['ℓ', 'm'],
        transversalLabel: 't',
        known: { line: knownLine, corner: knownCorner, label: '1', degrees },
        asked: { line: finalAskedLine, corner: askedCorner, label: '2' },
      },
      choices,
      correctIndex,
      steps: [
        {
          text: 'Cát tuyến cắt hai đường song song tạo ra tám góc, nhưng chỉ có HAI giá trị khác nhau, và hai giá trị ấy bù nhau.',
          expr: `${degrees}°   và   ${180 - degrees}°`,
        },
        {
          text: equal
            ? 'Góc 1 và góc 2 nằm cùng phía cát tuyến ở cùng vị trí (hoặc đối đỉnh nhau), nên chúng BẰNG nhau.'
            : 'Góc 1 và góc 2 kề nhau dọc một đường thẳng, nên chúng BÙ nhau.',
          expr: equal ? `∠2 = ∠1 = ${degrees}°` : `∠2 = 180° - ${degrees}° = ${answer}°`,
        },
        {
          text: 'Mẹo kiểm nhanh: nhìn hình xem góc đang hỏi TRÔNG nhọn hay tù. Nhọn thì đáp án phải nhỏ hơn 90°.',
        },
      ],
    };
  },
};

/**
 * Bán kính đường tròn từ phương trình dạng khai triển.
 *
 * Phải VUÔNG HOÁ mới ra bán kính, và hai nhiễu đầu là hai chỗ dừng sai giữa
 * chừng: dừng ở r² vì quên khai căn, hoặc nhân đôi thành đường kính.
 *
 * Tâm và bán kính chọn trước rồi mới suy ra hệ số, nên hệ số luôn nguyên và bán
 * kính luôn nguyên — đề thi thật cũng dựng theo hướng đó.
 */
const circleEquationRadius: MathTemplate = {
  slug: 'geo-circle-equation-radius',
  skill: 'circles',
  difficulty: 'hard',
  format: 'mcq',
  build: (rng) => {
    const h = pickNonZeroInt(rng, -6, 6);
    const k = pickNonZeroInt(rng, -6, 6);
    // r ≥ 3 để nhiễu "2r" không trùng nhiễu "r²" (chúng bằng nhau đúng tại r = 2).
    const r = pickInt(rng, 3, 9);

    const dCoef = -2 * h;
    const eCoef = -2 * k;
    const constant = r * r - h * h - k * k;

    const { choices, correctIndex } = buildChoices(
      rat(r),
      [
        { value: rat(r * r), errorTag: 'forgot_square_root' },
        { value: rat(2 * r), errorTag: 'used_diameter_not_radius' },
        {
          value: rat(Math.abs(h) + Math.abs(k)),
          errorTag: null,
          note: `${Math.abs(h)} và ${Math.abs(k)} là hai toạ độ TÂM. Tâm và bán kính là hai thứ khác nhau.`,
        },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem:
        `The equation of a circle in the xy-plane is x^2 + y^2${signedCoefTerm(dCoef, 'x')}` +
        `${signedCoefTerm(eCoef, 'y')} = ${constant}. ` +
        'What is the radius of the circle?',
      choices,
      correctIndex,
      steps: [
        {
          text: 'Vuông hoá theo x: lấy nửa hệ số của x rồi bình phương, cộng vào CẢ HAI vế.',
          expr: `x^2${signedCoefTerm(dCoef, 'x')} + ${h * h} = (x${signedTerm(-h)})^2`,
        },
        {
          text: 'Làm y y hệt như vậy.',
          expr: `y^2${signedCoefTerm(eCoef, 'y')} + ${k * k} = (y${signedTerm(-k)})^2`,
        },
        {
          text: 'Hai số vừa cộng vào vế trái phải cộng luôn sang vế phải.',
          expr: `(x${signedTerm(-h)})^2 + (y${signedTerm(-k)})^2 = ${constant} + ${h * h} + ${k * k} = ${r * r}`,
        },
        {
          text: 'Vế phải là r BÌNH PHƯƠNG, nên còn một bước khai căn nữa mới ra bán kính.',
          expr: `r = sqrt(${r * r}) = ${r}`,
        },
      ],
    };
  },
};


const cylinderVolumeHeight: MathTemplate = {
  slug: 'geo-cylinder-volume-height',
  skill: 'area_volume',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const units = ['inches', 'centimeters', 'meters', 'feet'];
    const unit = pick(rng, units);
    const r = pickInt(rng, 2, 6);
    const h = pickInt(rng, 2, 10);
    const k = r * r * h; // coefficient of pi in V = pi r^2 h, derived from r and h chosen above
    const direction = pick(rng, ['volume', 'height']);

    if (direction === 'volume') {
      const stem = `A right circular cylinder has a radius of ${r} ${unit} and a height of ${h} ${unit}. The volume of the cylinder can be written as k pi cubic ${unit}, where k is a constant. What is the value of k?`;
      return {
        format: 'grid_in',
        stem,
        answer: rat(k),
        steps: [
          { text: 'Diện tích đáy của hình trụ là diện tích một hình tròn bán kính r.', expr: `A = pi × ${r}^2 = ${r * r} pi` },
          { text: 'Thể tích hình trụ bằng diện tích đáy nhân với chiều cao: V = A × h.', expr: `V = ${r * r} pi × ${h} = ${k} pi` },
        ],
      };
    }

    const stem = `A right circular cylinder has a radius of ${r} ${unit}. The volume of the cylinder is ${k} pi cubic ${unit}. What is the height of the cylinder, in ${unit}?`;
    return {
      format: 'grid_in',
      stem,
      answer: rat(h),
      steps: [
        { text: 'Viết công thức thể tích hình trụ.', expr: 'V = pi r^2 h' },
        { text: 'Thay thể tích và bán kính đã cho vào công thức.', expr: `${k} pi = pi × ${r}^2 × h` },
        { text: 'Chia hai vế cho pi nhân bình phương bán kính để tính chiều cao.', expr: `h = frac(${k},${r * r}) = ${h}` },
      ],
    };
  },
};


const triangleExteriorAngle: MathTemplate = {
  slug: 'geo-triangle-exterior-angle',
  skill: 'lines_angles_triangles',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const a = pickInt(rng, 20, 70); // angle A, độ
    const b = pickInt(rng, 20, 70); // angle B, độ
    // Định lý góc ngoài: góc ngoài tại C (ACD) = tổng hai góc trong không kề = a + b.
    // Vì a,b trong [20,70] nên a+b <= 140 < 180, tam giác luôn hợp lệ (góc C trong = 180-a-b > 0).
    const exterior = a + b;
    const interiorC = 180 - a - b;

    const stem = `In triangle ABC, the measure of angle A is ${a}deg and the measure of angle B is ${b}deg. Side BC is extended through C to point D. What is the measure of exterior angle ACD?`;

    const { choices, correctIndex } = buildChoices(
      rat(exterior),
      [
        { value: rat(interiorC), errorTag: null, note: 'Nhầm góc ngoài ACD với góc trong còn lại của tam giác (180° trừ hai góc kia), thay vì cộng hai góc không kề.' },
        { value: rat(180 - a), errorTag: null, note: 'Chỉ lấy góc bù của một góc A (180° − A), quên cộng thêm góc B.' },
        { value: rat(Math.abs(a - b)), errorTag: null, note: 'Trừ hai góc trong cho nhau thay vì cộng lại theo định lý góc ngoài.' },
      ],
      rng,
    );

    return {
      format: 'mcq',
      stem,
      choices,
      correctIndex,
      steps: [
        { text: 'Theo định lý góc ngoài của tam giác, góc ngoài tại một đỉnh bằng tổng hai góc trong không kề với nó.', expr: 'ACD = A + B' },
        { text: 'Thay số đã cho vào và cộng lại để tìm số đo góc ngoài.', expr: `${a}deg + ${b}deg = ${exterior}deg` },
      ],
    };
  },
};


const rightTriangleSpecialAngleSide: MathTemplate = {
  slug: 'geo-special-angle-missing-side',
  skill: 'right_triangles_trig',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const letterSets = [
      ['A', 'B', 'C'],
      ['P', 'Q', 'R'],
      ['D', 'E', 'F'],
      ['X', 'Y', 'Z'],
      ['J', 'K', 'L'],
      ['M', 'N', 'O'],
    ];
    const perms = [
      [0, 1, 2],
      [1, 0, 2],
      [0, 2, 1],
      [2, 0, 1],
      [1, 2, 0],
      [2, 1, 0],
    ];
    const triple = pick(rng, letterSets);
    const perm = pick(rng, perms);
    const angleLabel = triple[perm[0]!]; // đỉnh mang góc đặc biệt
    const otherLabel = triple[perm[1]!]; // đỉnh nhọn còn lại
    const rightLabel = triple[perm[2]!]; // đỉnh vuông góc

    const theta = pick(rng, [30, 60]); // sin(30°) = cos(60°) = 1/2, tỉ số luôn đẹp
    const direction = pick(rng, ['given_hyp', 'given_leg']);
    const m = pickInt(rng, 2, 30); // cạnh góc vuông liên quan, luôn là số nguyên

    const hypName = `${angleLabel}${otherLabel}`;
    const legOpposite = `${otherLabel}${rightLabel}`; // đối diện góc đã cho, dùng khi theta = 30
    const legAdjacent = `${angleLabel}${rightLabel}`; // kề góc đã cho, dùng khi theta = 60
    const relevantLeg = theta === 30 ? legOpposite : legAdjacent;

    let knownSide;
    let knownVal;
    let askSide;
    let answer;
    if (direction === 'given_hyp') {
      knownSide = hypName;
      knownVal = 2 * m;
      askSide = relevantLeg;
      answer = m;
    } else {
      knownSide = relevantLeg;
      knownVal = m;
      askSide = hypName;
      answer = 2 * m;
    }

    const stem = `In right triangle ${angleLabel}${otherLabel}${rightLabel}, angle ${rightLabel} = 90deg and angle ${angleLabel} = ${theta}deg. If ${knownSide} = ${knownVal}, what is the length of ${askSide}?`;

    const ratioExpr = theta === 30 ? `sin(30deg) = frac(1,2)` : `cos(60deg) = frac(1,2)`;
    const relationText = direction === 'given_hyp'
      ? 'Cạnh cần tìm bằng một nửa cạnh huyền đã cho.'
      : 'Cạnh huyền cần tìm gấp đôi cạnh góc vuông đã cho.';
    const computeExpr = direction === 'given_hyp'
      ? `${askSide} = frac(${knownVal},2) = ${answer}`
      : `${askSide} = ${knownVal} × 2 = ${answer}`;

    const { choices, correctIndex } = buildChoices(
      rat(answer),
      direction === 'given_hyp'
        ? [
            { value: rat(knownVal), errorTag: 'used_wrong_trig_ratio', note: 'Lấy luôn cạnh huyền làm cạnh góc vuông, quên nhân tỉ số 1/2.' },
            { value: rat(4 * m), errorTag: 'inverted_fraction' },
            { value: rat(m + 1), errorTag: 'off_by_one' },
          ]
        : [
            { value: rat(m), errorTag: 'used_wrong_trig_ratio', note: 'Quên nhân đôi, để nguyên cạnh góc vuông làm cạnh huyền.' },
            { value: rat(m, 2), errorTag: 'inverted_fraction' },
            { value: rat(2 * m + 1), errorTag: 'off_by_one' },
          ],
      rng,
    );

    return {
      format: 'mcq',
      stem,
      choices,
      correctIndex,
      steps: [
        { text: `Với góc đặc biệt ${theta} độ, tỉ số lượng giác cho một phân số đẹp.`, expr: ratioExpr },
        { text: relationText, expr: computeExpr },
      ],
    };
  },
};


const circleArcSectorPi: MathTemplate = {
  slug: 'geo-circle-arc-sector-pi',
  skill: 'circles',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    // Bảng góc ở tâm đã rút gọn thành phân số của 360°, mẫu số nhỏ (2,3,4,6,8,12)
    // để khi bán kính r = mẫu số * m thì kết quả luôn là BỘI NGUYÊN của pi.
    // Mười một mục (thay vì bảy) để cùng với dải m rộng hơn, 200 hạt ra đủ đa
    // dạng câu hỏi — bảng bảy mục + m hẹp trước đây chỉ có 35 tổ hợp.
    const ANGLE_TABLE = [
      { deg: 30, num: 1, den: 12 },
      { deg: 45, num: 1, den: 8 },
      { deg: 60, num: 1, den: 6 },
      { deg: 90, num: 1, den: 4 },
      { deg: 120, num: 1, den: 3 },
      { deg: 150, num: 5, den: 12 },
      { deg: 180, num: 1, den: 2 },
      { deg: 210, num: 7, den: 12 },
      { deg: 240, num: 2, den: 3 },
      { deg: 270, num: 3, den: 4 },
      { deg: 300, num: 5, den: 6 },
    ];
    const entry = pick(rng, ANGLE_TABLE);
    const isArea = pick(rng, [false, true]);
    // r = den * m đảm bảo BẰNG CẤU TRÚC rằng num/den * (2r hoặc r^2) luôn nguyên,
    // không cần vòng lặp thử lại.
    const m = isArea ? pickInt(rng, 1, 5) : pickInt(rng, 1, 10);
    const r = entry.den * m;

    if (isArea) {
      const k = entry.num * entry.den * m * m; // (num/den) * r^2 = num*den*m^2
      const stem = `A circle has a radius of ${r} units. A sector of the circle has a central angle that measures ${entry.deg} deg. The area of the sector can be written as k pi square units, where k is a constant. What is the value of k?`;
      return {
        format: 'grid_in',
        stem,
        answer: rat(k),
        steps: [
          { text: 'Tính tỉ lệ góc ở tâm so với cả vòng tròn 360 độ.', expr: `frac(${entry.deg},360) = frac(${entry.num},${entry.den})` },
          { text: 'Nhân tỉ lệ đó với diện tích cả hình tròn để ra diện tích hình quạt.', expr: `frac(${entry.num},${entry.den}) . pi ${r}^2 = ${k} pi` },
        ],
      };
    }

    const k = 2 * entry.num * m; // (num/den) * 2r = 2*num*m
    const stem = `A circle has a radius of ${r} units. An arc of the circle is intercepted by a central angle that measures ${entry.deg} deg. The length of the arc can be written as k pi units, where k is a constant. What is the value of k?`;
    return {
      format: 'grid_in',
      stem,
      answer: rat(k),
      steps: [
        { text: 'Tính tỉ lệ góc ở tâm so với cả vòng tròn 360 độ.', expr: `frac(${entry.deg},360) = frac(${entry.num},${entry.den})` },
        { text: 'Nhân tỉ lệ đó với chu vi cả đường tròn 2 pi r để ra độ dài cung.', expr: `frac(${entry.num},${entry.den}) . 2 pi ${r} = ${k} pi` },
      ],
    };
  },
};

export const GEOMETRY_TEMPLATES: MathTemplate[] = [
  trigRatioOfAcuteAngle,
  cubeVolumeFromSurfaceArea,
  parallelLinesAngle,
  circleEquationRadius,
  cylinderVolumeHeight,
  triangleExteriorAngle,
  rightTriangleSpecialAngleSide,
  circleArcSectorPi,
];
