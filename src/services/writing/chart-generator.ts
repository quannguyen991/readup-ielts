import { deriveAnalysisKey } from './analysis-key';
import type { FigureSpec } from './figure-specs';
import type { ChartData, LineOrBarChart, PieChart, TableChart } from '@/lib/writing/types';
import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * Bộ sinh dữ liệu biểu đồ cho đề Task 1.
 *
 * Hai nguyên tắc:
 *
 * 1. **Ràng buộc sư phạm bảo đảm bằng CẤU TRÚC, không bằng thử lại.** Số liệu
 *    dựng từ một hình dạng đã biết là đạt (hai đường đi ngược chiều thì chắc
 *    chắn cắt nhau), rồi RNG chỉ rung trong biên độ không phá được hình dạng ấy.
 *    Sinh ngẫu nhiên rồi lọc thì sẽ có hạt không bao giờ ra được đề hợp lệ.
 *
 * 2. **Mọi giá trị nằm trong `spec.range`.** Không có ràng buộc này thì trục
 *    "% hộ gia đình" chạy tới 125% — con số không tồn tại, mà người học lại
 *    phải chép đúng số liệu vào bài và sẽ bị trừ điểm vì lỗi của app.
 */

/** Vị trí trong dải giá trị, tính theo tỷ lệ 0–1 của `range`. */
function at(spec: FigureSpec, ratio: number): number {
  const [lo, hi] = spec.range;
  return lo + (hi - lo) * ratio;
}

/** Rung ±pct rồi kẹp lại trong `range`, làm tròn về số nguyên. */
function jitter(spec: FigureSpec, rng: () => number, value: number, pct: number): number {
  const [lo, hi] = spec.range;
  const shaken = value * (1 + (rng() * 2 - 1) * pct);
  return Math.round(Math.min(hi, Math.max(lo, shaken)));
}

/**
 * Biểu đồ đường: một chuỗi đi lên, một chuỗi đi xuống, bắt chéo nhau ở giữa —
 * hình dạng này bảo đảm luôn có giao cắt. Chuỗi thứ ba đi ngang ở giữa dải để
 * có nhóm "ổn định" tương phản.
 */
export function generateLineChart(spec: FigureSpec, seed: string): LineOrBarChart {
  const rng = mulberry32(hashString(`${spec.slug}:line:${seed}`));
  const n = spec.labels.length;

  const low = at(spec, 0.08 + rng() * 0.07);
  const high = at(spec, 0.76 + rng() * 0.18);

  // Rung tối đa 5%: đủ để hai đề khác hạt trông khác nhau, mà không đủ để một
  // đường đang lên bị kéo xuống dưới đường đang xuống trước điểm cắt.
  const rising = spec.labels.map((_, i) =>
    jitter(spec, rng, low + ((high - low) * i) / (n - 1), 0.05),
  );
  const falling = spec.labels.map((_, i) =>
    jitter(spec, rng, high - ((high - low) * i) / (n - 1), 0.05),
  );
  const flat = spec.labels.map(() => jitter(spec, rng, (low + high) / 2, 0.04));

  return withKey({
    kind: 'line',
    title: titleOf(spec),
    unit: spec.unit,
    xLabels: spec.labels,
    series: [
      { name: spec.subjects[0] ?? 'A', values: rising },
      { name: spec.subjects[1] ?? 'B', values: falling },
      { name: spec.subjects[2] ?? 'C', values: flat },
    ],
  });
}

/**
 * Biểu đồ cột không có trục thời gian: so sánh các hạng mục giữa hai nhóm.
 * Bậc thang 0.12 → 0.80 của dải bảo đảm cao nhất hơn thấp nhất trên gấp rưỡi
 * ngay cả khi dải không bắt đầu từ 0 (ví dụ tuổi thọ 45–90).
 */
export function generateBarChart(spec: FigureSpec, seed: string): LineOrBarChart {
  const rng = mulberry32(hashString(`${spec.slug}:bar:${seed}`));
  const levels = [0.12, 0.31, 0.53, 0.8];

  const groupA = spec.subjects.map((_, i) => jitter(spec, rng, at(spec, levels[i] ?? 0.5), 0.07));
  const groupB = spec.subjects.map((_, i) =>
    jitter(spec, rng, at(spec, levels[spec.subjects.length - 1 - i] ?? 0.5), 0.07),
  );

  const [g1, g2] = spec.groups ?? ['Group 1', 'Group 2'];
  return withKey({
    kind: 'bar',
    title: titleOf(spec),
    unit: spec.unit,
    xLabels: spec.subjects,
    series: [
      { name: g1, values: groupA },
      { name: g2, values: groupB },
    ],
  });
}

/**
 * Biểu đồ tròn hai hình. Đổi ngôi bảo đảm bằng cách đảo ngược thứ tự phân bổ
 * giữa hai mốc: lát lớn nhất ở hình 1 thành lát nhỏ nhất ở hình 2.
 */
export function generatePieChart(spec: FigureSpec, seed: string): PieChart {
  const rng = mulberry32(hashString(`${spec.slug}:pie:${seed}`));
  const labels = spec.subjects;

  const base = [40, 28, 20, 12].slice(0, labels.length);
  const shaken = base.map((v) => Math.max(1, Math.round(v * (1 + (rng() * 2 - 1) * 0.12))));
  const first = normaliseTo100(shaken);
  const second = normaliseTo100([...shaken].reverse());

  const firstCaption = spec.labels[0] ?? 'Before';
  const lastCaption = spec.labels[spec.labels.length - 1] ?? 'After';

  const chart: PieChart = {
    kind: 'pie',
    title: titleOf(spec),
    unit: '%',
    pies: [
      { caption: firstCaption, slices: labels.map((l, i) => ({ label: l, value: first[i] ?? 0 })) },
      { caption: lastCaption, slices: labels.map((l, i) => ({ label: l, value: second[i] ?? 0 })) },
    ],
    analysisKey: EMPTY_KEY,
  };

  // Pie không có trục thời gian liên tục, nên mượn khoá của một biểu đồ đường
  // hai mốc tương đương: mỗi lát là một chuỗi đi từ giá trị hình 1 sang hình 2.
  return {
    ...chart,
    analysisKey: deriveAnalysisKey({
      kind: 'line',
      title: chart.title,
      unit: '%',
      xLabels: [firstCaption, lastCaption],
      series: labels.map((l, i) => ({ name: l, values: [first[i] ?? 0, second[i] ?? 0] })),
      analysisKey: EMPTY_KEY,
    }),
  };
}

/** Ép tổng về đúng 100 bằng cách dồn phần dư vào lát lớn nhất. */
function normaliseTo100(values: number[]): number[] {
  const total = values.reduce((s, v) => s + v, 0);
  const scaled = values.map((v) => Math.round((v / total) * 100));
  const drift = 100 - scaled.reduce((s, v) => s + v, 0);

  let maxIndex = 0;
  scaled.forEach((v, i) => {
    if (v > (scaled[maxIndex] ?? 0)) maxIndex = i;
  });
  scaled[maxIndex] = (scaled[maxIndex] ?? 0) + drift;
  return scaled;
}

/**
 * Bảng số liệu. Hai chiều đọc cho hai kết luận khác nhau: có hàng tăng và hàng
 * giảm (đọc ngang), và hạng nhất đổi giữa cột đầu với cột cuối (đọc dọc).
 */
export function generateTableChart(spec: FigureSpec, seed: string): TableChart {
  const rng = mulberry32(hashString(`${spec.slug}:table:${seed}`));
  const n = spec.labels.length;

  const rows = spec.subjects.map((name, index) => {
    // Hàng chẵn đi lên, hàng lẻ đi xuống. Hàng 0 xuất phát thấp nhất và kết
    // thúc cao nhất, hàng 1 ngược lại — đó là chỗ đổi ngôi khi đọc dọc.
    const goesUp = index % 2 === 0;
    // Hàng thứ ba trở đi thu hẹp biên độ để không tranh mất ngôi của hai hàng
    // đầu, nếu không thì phép thử "hạng nhất đổi" có thể trượt.
    const outer = index < 2 ? [0.1, 0.85] : [0.34, 0.6];
    const [lo, hi] = [outer[0] ?? 0.1, outer[1] ?? 0.85];

    const values = spec.labels.map((_, i) => {
      const t = i / (n - 1);
      const ratio = goesUp ? lo + (hi - lo) * t : hi - (hi - lo) * t;
      return jitter(spec, rng, at(spec, ratio), 0.04);
    });
    return [name, ...values] as (string | number)[];
  });

  const chart: TableChart = {
    kind: 'table',
    title: titleOf(spec),
    unit: spec.unit,
    headers: ['', ...spec.labels],
    rows,
    analysisKey: EMPTY_KEY,
  };

  return {
    ...chart,
    analysisKey: deriveAnalysisKey({
      kind: 'line',
      title: chart.title,
      unit: spec.unit,
      xLabels: spec.labels,
      series: rows.map((row) => ({ name: String(row[0]), values: row.slice(1).map(Number) })),
      analysisKey: EMPTY_KEY,
    }),
  };
}

/** Sinh hình đúng theo `spec.kind`. */
export function generateFigure(spec: FigureSpec, seed: string): ChartData {
  switch (spec.kind) {
    case 'bar':
      return generateBarChart(spec, seed);
    case 'pie':
      return generatePieChart(spec, seed);
    case 'table':
      return generateTableChart(spec, seed);
    default:
      return generateLineChart(spec, seed);
  }
}

/**
 * Tiêu đề hình = mô tả của spec viết hoa chữ đầu, cộng khoảng thời gian với
 * những loại hình có trục thời gian. Pie và bar đã tự mang mốc trong mô tả.
 */
export function titleOf(spec: FigureSpec): string {
  const s = spec.subject;
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}${periodOf(spec)}`;
}

/** Cụm ", 2000–2020" cho line và table; rỗng với bar và pie. */
export function periodOf(spec: FigureSpec): string {
  if (spec.kind !== 'line' && spec.kind !== 'table') return '';
  const first = spec.labels[0];
  const last = spec.labels[spec.labels.length - 1];
  return first && last ? `, ${first}–${last}` : '';
}

/** Chỗ giữ tạm trước khi khoá thật được suy ra. Không bao giờ lọt ra ngoài. */
const EMPTY_KEY = {
  trends: [],
  extremes: [],
  crossings: [],
  grouping: [[], []],
} as const satisfies LineOrBarChart['analysisKey'];

function withKey(chart: Omit<LineOrBarChart, 'analysisKey'>): LineOrBarChart {
  const withEmpty: LineOrBarChart = { ...chart, analysisKey: EMPTY_KEY };
  return { ...withEmpty, analysisKey: deriveAnalysisKey(withEmpty) };
}
