/**
 * ĐIỂM DỰ ĐOÁN TRUNG THỰC — một KHOẢNG, không phải một con số ảo.
 *
 * Các app luyện thi hay in "điểm dự đoán: 1420" sau vài chục câu — một con số
 * trông chắc chắn mà thật ra sai số cả trăm điểm. Ở đây:
 *
 * - Mỗi mảng kiến thức có một phân phối Beta(1 + đúng, 1 + sai) cho tỉ lệ làm
 *   đúng. Mảng chưa làm câu nào giữ Beta(1,1) — "chưa biết gì", rất rộng.
 * - Gộp các mảng theo tỉ trọng của đề thật; phương sai gộp theo bình phương tỉ
 *   trọng. Lấy khoảng tin cậy 80% (±1,28 độ lệch chuẩn).
 * - Quy tỉ lệ đúng ra thang 200–800 THẲNG (200 + 600·p) — College Board không
 *   công bố bảng quy đổi cho luyện tập, nên không bịa một đường cong.
 * - Nói luôn cần làm thêm bao nhiêu câu, ở mảng nào, để khoảng hẹp lại.
 *
 * Hàm thuần.
 */

export type Tally = { correct: number; total: number };

export type Prediction = {
  low: number;
  mid: number;
  high: number;
  /** Nửa bề rộng khoảng, điểm. */
  halfWidth: number;
  answered: number;
  /** Mảng đang làm khoảng rộng nhất (thiếu dữ liệu nhất theo tỉ trọng). */
  widestDomain: string | null;
  /** Số câu cần làm thêm (chia theo tỉ trọng) để nửa khoảng ≤ mục tiêu. 0 = đã đạt. */
  needMore: number | null;
  /** Để cộng hai phần thi: trung bình và độ lệch chuẩn của tỉ lệ đúng. */
  p: number;
  sd: number;
};

const Z80 = 1.2816;
const MIN_ANSWERED = 10;

export const toScore = (p: number) => 200 + 600 * Math.min(1, Math.max(0, p));
const round10 = (x: number) => Math.round(x / 10) * 10;

function moments(t: Tally, extra = 0): { mean: number; variance: number } {
  const a = 1 + t.correct;
  const b = 1 + (t.total - t.correct);
  const mean = a / (a + b);
  // Làm thêm `extra` câu với cùng tỉ lệ đúng: độ tin cậy tăng, trung bình giữ nguyên.
  const n = a + b + extra;
  return { mean, variance: (mean * (1 - mean)) / (n + 1) };
}

export function predictSection(
  tallies: Readonly<Record<string, Tally>>,
  weights: Readonly<Record<string, number>>,
  targetHalfWidth = 30,
): Prediction | null {
  const domains = Object.keys(weights);
  const answered = domains.reduce((s, d) => s + (tallies[d]?.total ?? 0), 0);
  if (answered < MIN_ANSWERED) return null;

  const spread = (extra: number) => {
    let mu = 0;
    let variance = 0;
    let widest: string | null = null;
    let widestVar = -1;
    for (const d of domains) {
      const w = weights[d]!;
      const m = moments(tallies[d] ?? { correct: 0, total: 0 }, extra * w);
      mu += w * m.mean;
      const v = w * w * m.variance;
      variance += v;
      if (v > widestVar) {
        widestVar = v;
        widest = d;
      }
    }
    return { mu, sd: Math.sqrt(variance), widest };
  };

  const { mu, sd, widest } = spread(0);
  const half = 600 * Z80 * sd;
  let needMore: number | null = half <= targetHalfWidth ? 0 : null;
  if (needMore === null) {
    for (let k = 10; k <= 2000; k += 10) {
      if (600 * Z80 * spread(k).sd <= targetHalfWidth) {
        needMore = k;
        break;
      }
    }
  }
  return {
    low: round10(Math.max(200, toScore(mu - Z80 * sd))),
    mid: round10(toScore(mu)),
    high: round10(Math.min(800, toScore(mu + Z80 * sd))),
    halfWidth: Math.round(half),
    answered,
    widestDomain: widest,
    needMore,
    p: mu,
    sd,
  };
}

/** Tổng điểm hai phần thi (400–1600): cộng trung bình, gộp phương sai. */
export function combineTotal(math: Prediction, verbal: Prediction): { low: number; mid: number; high: number } {
  const sd = 600 * Math.sqrt(math.sd ** 2 + verbal.sd ** 2);
  const mid = toScore(math.p) + toScore(verbal.p);
  return {
    low: round10(Math.max(400, mid - Z80 * sd)),
    mid: round10(mid),
    high: round10(Math.min(1600, mid + Z80 * sd)),
  };
}

/** Tỉ trọng các mảng của đề SAT số hoá (College Board). */
export const MATH_WEIGHTS = { algebra: 0.35, advanced_math: 0.35, problem_solving_data: 0.15, geometry_trig: 0.15 };
export const VERBAL_WEIGHTS = {
  'Craft and Structure': 0.28,
  'Information and Ideas': 0.26,
  'Standard English Conventions': 0.26,
  'Expression of Ideas': 0.2,
};
