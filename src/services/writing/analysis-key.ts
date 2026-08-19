import type {
  AnalysisKey,
  CrossingFact,
  ExtremeFact,
  LineOrBarChart,
  TrendDirection,
  TrendFact,
  TrendMagnitude,
} from '@/lib/writing/types';

/**
 * Suy khoá phân tích từ chính dữ liệu biểu đồ.
 *
 * Viết tay khoá này là sai lầm chờ sẵn: sửa số liệu mà quên sửa khoá thì phần
 * chấm drill Overview sẽ bắt người học nêu một xu hướng không còn tồn tại, mà
 * không có gì báo. Suy ra từ dữ liệu thì hai bên không thể lệch nhau.
 */

/** Dưới ngưỡng này coi như đứng yên — dao động 5% là nhiễu, không phải xu hướng. */
const STABLE_RATIO = 0.05;
/** Từ ngưỡng này trở lên coi là thay đổi lớn. */
const LARGE_RATIO = 0.4;
/**
 * Một chuỗi bị coi là dao động khi đỉnh (hoặc đáy) giữa kỳ lệch khỏi cả hai đầu
 * quá ngưỡng này so với biên độ chung — tức là nó đã đổi chiều giữa chừng.
 */
const REVERSAL_RATIO = 0.35;

export function deriveAnalysisKey(chart: LineOrBarChart): AnalysisKey {
  const trends = chart.series.map(toTrend);
  return {
    trends,
    extremes: findExtremes(chart),
    crossings: findCrossings(chart),
    grouping: groupSeries(trends),
  };
}

function toTrend(series: { name: string; values: number[] }): TrendFact {
  const values = series.values;
  const from = values[0] ?? 0;
  const to = values[values.length - 1] ?? 0;
  const base = Math.max(Math.abs(from), 1);
  const netRatio = Math.abs(to - from) / base;

  return {
    subject: series.name,
    direction: directionOf(values, from, to, netRatio),
    magnitude: magnitudeOf(netRatio),
    from,
    to,
  };
}

function directionOf(
  values: number[],
  from: number,
  to: number,
  netRatio: number,
): TrendDirection {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const base = Math.max(Math.abs(from), 1);

  // Xét "có nhúc nhích đáng kể không" TRƯỚC khi xét đổi chiều. Nếu không, một
  // chuỗi phẳng như 50-51-50 sẽ bị coi là dao động: biên độ chung chỉ bằng 1
  // nên gợn 1 đơn vị chiếm tới 100% biên độ.
  if (span / base < STABLE_RATIO) return 'stable';

  // Đỉnh hoặc đáy nằm ở giữa và lệch xa cả hai đầu → đường đổi chiều giữa kỳ.
  const overshoot = Math.max(max - Math.max(from, to), Math.min(from, to) - min);
  if (overshoot / span > REVERSAL_RATIO) return 'fluctuating';

  if (netRatio < STABLE_RATIO) return 'stable';
  return to > from ? 'up' : 'down';
}

function magnitudeOf(netRatio: number): TrendMagnitude {
  if (netRatio >= LARGE_RATIO) return 'large';
  if (netRatio >= STABLE_RATIO * 2) return 'moderate';
  return 'small';
}

/**
 * Cực trị ở đầu kỳ và cuối kỳ. Ai giữ nguyên hạng ở cả hai đầu thì ghi một dòng
 * `throughout` — ghi hai dòng cho cùng một sự thật làm phần chấm drill đếm
 * trùng, và đọc lên cũng thừa.
 */
function findExtremes(chart: LineOrBarChart): ExtremeFact[] {
  const firstLabel = chart.xLabels[0] ?? '';
  const lastLabel = chart.xLabels[chart.xLabels.length - 1] ?? '';
  const lastIndex = chart.xLabels.length - 1;

  const rank = (index: number, kind: 'highest' | 'lowest'): string => {
    const pick = chart.series.reduce((best, s) => {
      const v = s.values[index] ?? 0;
      const bv = best.values[index] ?? 0;
      return kind === 'highest' ? (v > bv ? s : best) : v < bv ? s : best;
    });
    return pick.name;
  };

  const out: ExtremeFact[] = [];
  for (const kind of ['highest', 'lowest'] as const) {
    const atStart = rank(0, kind);
    const atEnd = rank(lastIndex, kind);
    if (atStart === atEnd) {
      out.push({ subject: atStart, rank: kind, at: 'throughout' });
    } else {
      out.push({ subject: atStart, rank: kind, at: firstLabel });
      out.push({ subject: atEnd, rank: kind, at: lastLabel });
    }
  }
  return out;
}

/**
 * Cặp đường đổi ngôi cho nhau trong kỳ.
 *
 * Chỉ so dấu hiệu ở hai đầu mỗi khoảng, không giải phương trình: cái người học
 * cần là "hai đường này có cắt nhau, quanh mốc nào", không phải toạ độ chính
 * xác của giao điểm.
 */
function findCrossings(chart: LineOrBarChart): CrossingFact[] {
  const out: CrossingFact[] = [];

  for (let i = 0; i < chart.series.length; i += 1) {
    for (let j = i + 1; j < chart.series.length; j += 1) {
      const a = chart.series[i];
      const b = chart.series[j];
      if (!a || !b) continue;

      // Xét dấu của hiệu trên CẢ chuỗi, không so từng cặp mốc liền nhau: hai
      // đường có thể chạm nhau đúng tại một mốc (hiệu bằng 0), và khi đó phép
      // so từng cặp sẽ bỏ sót vì tích hai hiệu bằng 0 chứ không âm.
      const diffs = chart.xLabels.map((_, k) => (a.values[k] ?? 0) - (b.values[k] ?? 0));
      const firstIndex = diffs.findIndex((d) => d !== 0);
      if (firstIndex === -1) continue; // Hai đường trùng khít nhau.

      const firstSign = Math.sign(diffs[firstIndex] ?? 0);
      const flipIndex = diffs.findIndex((d) => d !== 0 && Math.sign(d) !== firstSign);
      if (flipIndex === -1) continue; // Không bao giờ đổi bên.

      // Nhãn lấy ở mốc mà hai đường gần nhau nhất trong đoạn vừa đổi bên.
      let nearest = firstIndex;
      for (let k = firstIndex; k <= flipIndex; k += 1) {
        if (Math.abs(diffs[k] ?? 0) < Math.abs(diffs[nearest] ?? 0)) nearest = k;
      }
      out.push({ subject: a.name, other: b.name, nearLabel: chart.xLabels[nearest] ?? '' });
    }
  }
  return out;
}

/**
 * Chia hai nhóm ứng với hai đoạn thân bài.
 *
 * Ưu tiên chia theo chiều xu hướng (cách phổ biến nhất trong bài thi thật). Khi
 * mọi chuỗi cùng chiều thì chiều không phân biệt được gì nữa, chuyển sang chia
 * theo mức thay đổi — đúng cách người viết band 7 xử lý đề "mọi thứ đều tăng".
 */
function groupSeries(trends: TrendFact[]): [string[], string[]] {
  if (trends.length < 2) {
    throw new Error('Đề phải có ít nhất hai chuỗi để chia được hai nhóm thân bài.');
  }

  const rising = trends.filter((t) => t.direction === 'up').map((t) => t.subject);
  const others = trends.filter((t) => t.direction !== 'up').map((t) => t.subject);
  if (rising.length > 0 && others.length > 0) return [rising, others];

  // Mọi chuỗi cùng chiều: chia theo mức thay đổi, cắt ở giữa danh sách đã xếp.
  const sorted = [...trends].sort((x, y) => ratio(y) - ratio(x));
  const half = Math.ceil(sorted.length / 2);
  return [sorted.slice(0, half).map((t) => t.subject), sorted.slice(half).map((t) => t.subject)];
}

function ratio(t: TrendFact): number {
  return Math.abs(t.to - t.from) / Math.max(Math.abs(t.from), 1);
}
