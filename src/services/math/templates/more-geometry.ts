import { buildChoices } from '../choices';
import { pick, pickInt } from '../authoring';
import { rat } from '@/lib/math/value';
import type { MathTemplate } from '@/lib/math/types';

/**
 * Dạng câu thứ ba và thứ tư cho bốn kỹ năng Geometry & Trigonometry.
 *
 * Bộ ba Pitago dùng chung cho hai dạng tam giác vuông: chọn bộ ba NGUYÊN THỦY
 * rồi nhân hệ số, nên mọi cạnh là số nguyên và mọi tỉ số lượng giác là phân số
 * tối giản — đúng kiểu số đề thật dùng.
 */

const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
] as const;

const NAMES = [
  ['A', 'B', 'C'],
  ['P', 'Q', 'R'],
  ['X', 'Y', 'Z'],
  ['D', 'E', 'F'],
] as const;

/** Hình chữ nhật đổi kích thước — bẫy là cộng trừ thẳng vào diện tích, hoặc tính chu vi. */
const rectAreaChange: MathTemplate = {
  slug: 'geo-rect-area-change',
  skill: 'area_volume',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const L = pickInt(rng, 5, 20);
    const W = pickInt(rng, 3, 15);
    const a = pickInt(rng, 1, 6);
    const b = pickInt(rng, 1, W - 1);
    const area = (L + a) * (W - b);
    const inches = (n: number) => `${n} ${n === 1 ? 'inch' : 'inches'}`;
    const { choices, correctIndex } = buildChoices(
      rat(area),
      [
        { value: rat(L * W + a - b), errorTag: null, note: 'Cộng trừ thẳng phần thay đổi vào diện tích cũ. Phải tính kích thước mới trước rồi mới nhân.' },
        { value: rat(2 * (L + a + W - b)), errorTag: 'confused_area_perimeter' },
        { value: rat((L + a) * (W + b)), errorTag: 'sign_flip', note: 'Chiều rộng bị GIẢM, không phải tăng.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `A rectangle has a length of ${L} inches and a width of ${W} inches. If the length is increased by ${inches(a)} and the width is decreased by ${inches(b)}, what is the area, in square inches, of the new rectangle?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Tính kích thước mới trước.', expr: `${L} + ${a} = ${L + a}   và   ${W} - ${b} = ${W - b}` },
        { text: 'Diện tích bằng dài nhân rộng.', expr: `${L + a} × ${W - b} = ${area}` },
      ],
    };
  },
};

/** Hộp chữ nhật: biết thể tích và hai cạnh, tìm chiều cao. */
const boxMissingHeight: MathTemplate = {
  slug: 'geo-box-missing-height',
  skill: 'area_volume',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const l = pickInt(rng, 2, 15);
    const w = pickInt(rng, 2, 15);
    const h = pickInt(rng, 2, 15);
    const V = l * w * h;
    return {
      format: 'grid_in',
      stem: `A rectangular box has a volume of ${V} cubic centimeters, a length of ${l} centimeters, and a width of ${w} centimeters. What is the height, in centimeters, of the box?`,
      answer: rat(h),
      steps: [
        { text: 'Thể tích hộp chữ nhật bằng dài nhân rộng nhân cao.', expr: `${V} = ${l} × ${w} × h` },
        { text: `Chia thể tích cho ${l * w}.`, expr: `h = ${V} ÷ ${l * w} = ${h}` },
      ],
    };
  },
};

/** Tam giác cân: biết góc ở đỉnh tìm góc đáy, hoặc ngược lại. */
const isoscelesAngle: MathTemplate = {
  slug: 'geo-isosceles-angle',
  skill: 'lines_angles_triangles',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const [A, B, C] = pick(rng, NAMES);
    const askBase = rng() < 0.5;
    if (askBase) {
      const vertex = 2 * pickInt(rng, 10, 80);
      const base = (180 - vertex) / 2;
      return {
        format: 'grid_in',
        stem: `In isosceles triangle ${A}${B}${C}, angle ${B} and angle ${C} have equal measures. If the measure of angle ${A} is ${vertex}°, what is the measure, in degrees, of angle ${B}?`,
        answer: rat(base),
        steps: [
          { text: 'Hai góc còn lại chia nhau phần còn thiếu để đủ 180°.', expr: `180 - ${vertex} = ${180 - vertex}` },
          { text: 'Hai góc đáy bằng nhau nên chia đôi.', expr: `${180 - vertex} ÷ 2 = ${base}` },
        ],
      };
    }
    const base = pickInt(rng, 20, 85);
    const vertex = 180 - 2 * base;
    return {
      format: 'grid_in',
      stem: `In isosceles triangle ${A}${B}${C}, angle ${B} and angle ${C} have equal measures. If the measure of angle ${B} is ${base}°, what is the measure, in degrees, of angle ${A}?`,
      answer: rat(vertex),
      steps: [
        { text: `Góc ${C} bằng góc ${B}, nên hai góc đáy cộng lại gấp đôi.`, expr: `2 × ${base} = ${2 * base}` },
        { text: 'Tổng ba góc là 180°.', expr: `180 - ${2 * base} = ${vertex}` },
      ],
    };
  },
};

/** Tổng ba góc tam giác, với số đo cho bằng biểu thức theo x. */
const triangleAngleAlgebra: MathTemplate = {
  slug: 'geo-triangle-angle-algebra',
  skill: 'lines_angles_triangles',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const x = pickInt(rng, 10, 40);
    const a = pickInt(rng, 1, 20);
    const b = pickInt(rng, 1, Math.min(20, 2 * x - 5));
    const c = 180 - (x + a) - (2 * x - b);
    const { choices, correctIndex } = buildChoices(
      rat(x),
      [
        { value: rat(360 - c - a + b, 3), errorTag: null, note: 'Tổng ba góc của tam giác là 180°, không phải 360°.' },
        { value: rat(x + a), errorTag: 'stopped_too_early', note: 'Đây là số đo góc thứ nhất, không phải x.' },
        { value: rat(180 - c - a - b, 3), errorTag: 'sign_flip', note: `Chuyển vế số hạng trừ ${b} mà quên đổi dấu.` },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `The measures of the three angles of a triangle are (x + ${a})°, (2x - ${b})°, and ${c}°. What is the value of x?`,
      choices,
      correctIndex,
      steps: [
        { text: 'Tổng ba góc bằng 180°.', expr: `(x + ${a}) + (2x - ${b}) + ${c} = 180` },
        { text: 'Gom x và gom số.', expr: `3x + ${a - b + c} = 180` },
        { text: 'Giải ra x.', expr: `x = ${x}` },
      ],
    };
  },
};

/** Định lý Pitago: tìm cạnh huyền hoặc cạnh góc vuông. */
const pythagoreanSide: MathTemplate = {
  slug: 'geo-pythagorean-side',
  skill: 'right_triangles_trig',
  difficulty: 'easy',
  format: 'grid_in',
  build: (rng) => {
    const [p, q, r] = pick(rng, TRIPLES);
    const k = pickInt(rng, 1, 10);
    const [a, b, c] = [p * k, q * k, r * k];
    const swap = rng() < 0.5;
    const [leg1, leg2] = swap ? [b, a] : [a, b];
    if (rng() < 0.5) {
      return {
        format: 'grid_in',
        stem: `A right triangle has legs of lengths ${leg1} and ${leg2}. What is the length of the hypotenuse of the triangle?`,
        answer: rat(c),
        steps: [
          { text: 'Bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.', expr: `c^2 = ${leg1}^2 + ${leg2}^2 = ${c * c}` },
          { text: 'Lấy căn bậc hai.', expr: `c = ${c}` },
        ],
      };
    }
    return {
      format: 'grid_in',
      stem: `A right triangle has a hypotenuse of length ${c} and one leg of length ${leg1}. What is the length of the other leg?`,
      answer: rat(leg2),
      steps: [
        { text: 'Bình phương cạnh góc vuông còn lại bằng bình phương cạnh huyền trừ bình phương cạnh đã biết.', expr: `b^2 = ${c}^2 - ${leg1}^2 = ${leg2 * leg2}` },
        { text: 'Lấy căn bậc hai.', expr: `b = ${leg2}` },
      ],
    };
  },
};

/** Biết cạnh huyền và sin, tìm cạnh đối. */
const trigOppositeSide: MathTemplate = {
  slug: 'geo-trig-opposite-side',
  skill: 'right_triangles_trig',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const [p, q, r] = pick(rng, TRIPLES);
    const [A, B, C] = pick(rng, NAMES);
    const k = pickInt(rng, 1, 10);
    const oppFirst = rng() < 0.5;
    const opp = oppFirst ? p : q;
    const adj = oppFirst ? q : p;
    const H = r * k;
    const { choices, correctIndex } = buildChoices(
      rat(opp * k),
      [
        { value: rat(adj * k), errorTag: 'used_wrong_trig_ratio', note: `Đây là cạnh KỀ góc ${A} (cạnh ${A}${C}).` },
        { value: rat(H * r, opp), errorTag: 'inverted_fraction' },
        { value: rat(H), errorTag: null, note: 'Đây là cạnh huyền, đề đã cho sẵn.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `In right triangle ${A}${B}${C}, angle ${C} is a right angle, ${A}${B} = ${H}, and sin ${A} = frac(${opp},${r}). What is the length of ${B}${C}?`,
      choices,
      correctIndex,
      steps: [
        { text: `Góc ${C} vuông nên ${A}${B} là cạnh huyền, ${B}${C} là cạnh đối diện góc ${A}.`, expr: `sin ${A} = frac(${B}${C},${A}${B})` },
        { text: 'Thay số rồi nhân chéo.', expr: `${B}${C} = frac(${opp},${r}) × ${H} = ${opp * k}` },
      ],
    };
  },
};

const LENGTH_UNITS = ['units', 'inches', 'feet', 'meters'] as const;

/** Chuyển qua lại giữa diện tích, chu vi và đường kính hình tròn. */
const circleCircumferenceArea: MathTemplate = {
  slug: 'geo-circle-circumference-area',
  skill: 'circles',
  difficulty: 'medium',
  format: 'mcq',
  build: (rng) => {
    const r = pickInt(rng, 2, 60);
    const unit = pick(rng, LENGTH_UNITS);
    const mode = pick(rng, ['areaToCirc', 'circToArea', 'diamToArea'] as const);
    if (mode === 'areaToCirc') {
      const { choices, correctIndex } = buildChoices(
        rat(2 * r),
        [
          { value: rat(r), errorTag: null, note: 'Đây là bán kính. Chu vi là 2 nhân pi nhân bán kính.' },
          { value: rat(r * r), errorTag: 'confused_area_perimeter', note: 'Đây là hệ số của diện tích, đề đã cho sẵn.' },
          { value: rat(4 * r), errorTag: 'used_diameter_not_radius' },
        ],
        rng,
      );
      return {
        format: 'mcq',
        stem: `The area of a circle is ${r * r} pi square ${unit}. The circumference of the circle is k pi ${unit}, where k is a constant. What is the value of k?`,
        choices,
        correctIndex,
        steps: [
          { text: 'Diện tích bằng pi nhân bình phương bán kính. Tìm bán kính.', expr: `r^2 = ${r * r}   ⇒   r = ${r}` },
          { text: 'Chu vi bằng 2 pi r.', expr: `C = 2 pi × ${r} = ${2 * r} pi` },
        ],
      };
    }
    const given = mode === 'circToArea' ? `The circumference of a circle is ${2 * r} pi ${unit}.` : `A circle has a diameter of ${2 * r} ${unit}.`;
    const { choices, correctIndex } = buildChoices(
      rat(r * r),
      [
        { value: rat(4 * r * r), errorTag: 'used_diameter_not_radius' },
        { value: rat(2 * r), errorTag: 'confused_area_perimeter', note: 'Đây là hệ số của chu vi, không phải diện tích.' },
        { value: rat(r), errorTag: null, note: 'Quên bình phương bán kính.' },
      ],
      rng,
    );
    return {
      format: 'mcq',
      stem: `${given} The area of the circle is k pi square ${unit}, where k is a constant. What is the value of k?`,
      choices,
      correctIndex,
      steps: [
        { text: mode === 'circToArea' ? 'Chu vi bằng 2 pi r, nên bán kính bằng nửa hệ số của pi.' : 'Bán kính bằng nửa đường kính.', expr: `r = ${r}` },
        { text: 'Diện tích bằng pi nhân bình phương bán kính.', expr: `A = pi × ${r}^2 = ${r * r} pi` },
      ],
    };
  },
};

/** Bán kính = khoảng cách từ tâm tới một điểm trên đường tròn. */
const circleRadiusFromPoint: MathTemplate = {
  slug: 'geo-circle-radius-from-point',
  skill: 'circles',
  difficulty: 'medium',
  format: 'grid_in',
  build: (rng) => {
    const [p, q, r] = pick(rng, TRIPLES.slice(0, 3));
    const k = pickInt(rng, 1, 3);
    const h = pickInt(rng, -6, 6);
    const c = pickInt(rng, -6, 6);
    const swap = rng() < 0.5;
    const dx = (swap ? q : p) * k * (rng() < 0.5 ? -1 : 1);
    const dy = (swap ? p : q) * k * (rng() < 0.5 ? -1 : 1);
    const [px, py] = [h + dx, c + dy];
    return {
      format: 'grid_in',
      stem: `A circle in the xy-plane has its center at (${h}, ${c}) and passes through the point (${px}, ${py}). What is the radius of the circle?`,
      answer: rat(r * k),
      steps: [
        { text: 'Bán kính là khoảng cách từ tâm tới một điểm bất kỳ trên đường tròn. Tính chênh lệch tọa độ.', expr: `Δx = ${Math.abs(dx)},   Δy = ${Math.abs(dy)}` },
        { text: 'Dùng công thức khoảng cách (định lý Pitago).', expr: `r = sqrt(${dx * dx} + ${dy * dy}) = ${r * k}` },
      ],
    };
  },
};

export const MORE_GEOMETRY_TEMPLATES: MathTemplate[] = [
  rectAreaChange,
  boxMissingHeight,
  isoscelesAngle,
  triangleAngleAlgebra,
  pythagoreanSide,
  trigOppositeSide,
  circleCircumferenceArea,
  circleRadiusFromPoint,
];
