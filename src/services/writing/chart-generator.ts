import { deriveAnalysisKey } from './analysis-key';
import type { LineOrBarChart, PieChart, TableChart } from '@/lib/writing/types';
import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * Bộ sinh dữ liệu biểu đồ cho đề Task 1.
 *
 * Ràng buộc sư phạm được bảo đảm bằng CẤU TRÚC chứ không bằng thử lại: số liệu
 * dựng từ một hình dạng đã biết là đạt (hai đường đi ngược chiều nhau thì chắc
 * chắn cắt nhau), rồi RNG chỉ rung trong biên độ không phá được hình dạng ấy.
 * Sinh ngẫu nhiên rồi lọc thì sẽ có hạt không bao giờ ra được đề hợp lệ, và lỗi
 * đó chỉ lộ khi chạy thật.
 */

export type ChartTopic = {
  slug: string;
  title: string;
  unit: string;
  /** Tên các đối tượng so sánh. Cần ít nhất 4 để dùng được cho cả pie lẫn table. */
  subjects: string[];
  /** Nhãn trục X cho line/table. Bar không trục thời gian thì dùng `subjects`. */
  labels: string[];
};

export const CHART_TOPICS: ChartTopic[] = [
  {
    slug: 'environment',
    title: 'Average price of petrol in four countries',
    unit: 'US cents per litre',
    subjects: ['Country A', 'Country B', 'Country C', 'Country D'],
    labels: ['2000', '2005', '2010', '2015', '2020'],
  },
  {
    slug: 'technology',
    title: 'Households with internet access',
    unit: '% of households',
    subjects: ['Japan', 'Germany', 'Brazil', 'Kenya'],
    labels: ['2005', '2010', '2015', '2020'],
  },
  {
    slug: 'education',
    title: 'Students enrolled in higher education',
    unit: 'thousands of students',
    subjects: ['Asia', 'Europe', 'Africa', 'South America'],
    labels: ['2010', '2014', '2018', '2022'],
  },
  {
    slug: 'health',
    title: 'Daily water consumption per person',
    unit: 'litres per person',
    subjects: ['Australia', 'United States', 'China', 'Ethiopia'],
    labels: ['2000', '2010', '2020'],
  },
  {
    slug: 'business',
    title: 'Sales of four types of beverage',
    unit: 'million litres',
    subjects: ['Bottled water', 'Fruit juice', 'Soft drinks', 'Tea'],
    labels: ['2015', '2017', '2019', '2021'],
  },
  {
    slug: 'society',
    title: 'People using four leisure facilities',
    unit: '% of residents',
    subjects: ['Gyms', 'Libraries', 'Parks', 'Cinemas'],
    labels: ['2010', '2015', '2020'],
  },
];

/** Rung một giá trị trong khoảng ±pct, làm tròn về số nguyên dương. */
function jitter(rng: () => number, value: number, pct: number): number {
  return Math.max(1, Math.round(value * (1 + (rng() * 2 - 1) * pct)));
}

/**
 * Biểu đồ đường: một chuỗi đi lên, một chuỗi đi xuống, bắt chéo nhau ở giữa —
 * hình dạng này bảo đảm luôn có giao cắt. Chuỗi thứ ba đi ngang ở giữa dải để
 * có nhóm "ổn định" tương phản.
 */
export function generateLineChart(topic: ChartTopic, seed: string): LineOrBarChart {
  const rng = mulberry32(hashString(`${topic.slug}:line:${seed}`));
  const labels = topic.labels;
  const n = labels.length;

  const low = 20 + Math.floor(rng() * 20);
  const high = low * (4 + Math.floor(rng() * 3));

  // Rung tối đa 6%: đủ để hai đề khác hạt trông khác nhau, mà không đủ để một
  // đường đang lên bị kéo xuống dưới đường đang xuống trước điểm cắt.
  const rising = Array.from({ length: n }, (_, i) =>
    jitter(rng, low + ((high - low) * i) / (n - 1), 0.06),
  );
  const falling = Array.from({ length: n }, (_, i) =>
    jitter(rng, high - ((high - low) * i) / (n - 1), 0.06),
  );
  const mid = Math.round((low + high) / 2);
  const flat = Array.from({ length: n }, () => jitter(rng, mid, 0.04));

  return withKey({
    kind: 'line',
    title: `${topic.title}, ${labels[0]}-${labels[n - 1]}`,
    unit: topic.unit,
    xLabels: labels,
    series: [
      { name: topic.subjects[0] ?? 'A', values: rising },
      { name: topic.subjects[1] ?? 'B', values: falling },
      { name: topic.subjects[2] ?? 'C', values: flat },
    ],
  });
}

/**
 * Biểu đồ cột không có trục thời gian: so sánh các đối tượng giữa hai nhóm.
 * Bậc thang nhân 1.6 mỗi nấc nên cao nhất luôn hơn thấp nhất trên bốn lần.
 */
export function generateBarChart(topic: ChartTopic, seed: string): LineOrBarChart {
  const rng = mulberry32(hashString(`${topic.slug}:bar:${seed}`));
  const subjects = topic.subjects.slice(0, 4);
  const base = 10 + Math.floor(rng() * 10);

  const groupA = subjects.map((_, i) => jitter(rng, base * Math.pow(1.6, i), 0.08));
  const groupB = subjects.map((_, i) => jitter(rng, base * Math.pow(1.6, 3 - i), 0.08));

  return withKey({
    kind: 'bar',
    title: topic.title,
    unit: topic.unit,
    xLabels: subjects,
    series: [
      { name: 'Group 1', values: groupA },
      { name: 'Group 2', values: groupB },
    ],
  });
}

/**
 * Biểu đồ tròn hai hình. Đổi ngôi được bảo đảm bằng cách đảo ngược thứ tự phân
 * bổ giữa hai mốc: lát lớn nhất ở hình 1 thành lát nhỏ nhất ở hình 2.
 */
export function generatePieChart(topic: ChartTopic, seed: string): PieChart {
  const rng = mulberry32(hashString(`${topic.slug}:pie:${seed}`));
  const labels = topic.subjects.slice(0, 4);

  const shares = [40, 28, 20, 12].map((v) => jitter(rng, v, 0.12));
  const first = normaliseTo100(shares);
  const second = normaliseTo100([...shares].reverse());

  const firstCaption = topic.labels[0] ?? 'Before';
  const lastCaption = topic.labels[topic.labels.length - 1] ?? 'After';

  const chart: PieChart = {
    kind: 'pie',
    title: topic.title,
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
export function generateTableChart(topic: ChartTopic, seed: string): TableChart {
  const rng = mulberry32(hashString(`${topic.slug}:table:${seed}`));
  const labels = topic.labels;
  const subjects = topic.subjects.slice(0, 4);

  const low = 20 + Math.floor(rng() * 30);
  const high = low * (3 + Math.floor(rng() * 3));

  const rows = subjects.map((name, index) => {
    // Hàng chẵn đi lên, hàng lẻ đi xuống. Hàng 0 xuất phát thấp nhất và kết
    // thúc cao nhất, hàng 1 ngược lại — đó là chỗ đổi ngôi khi đọc dọc.
    const goesUp = index % 2 === 0;
    // Hàng thứ ba trở đi thu hẹp biên độ để không tranh mất ngôi của hai hàng
    // đầu, nếu không thì phép thử "hạng nhất đổi" có thể trượt.
    const damp = index < 2 ? 1 : 0.45;

    const values = labels.map((_, i) => {
      const t = i / (labels.length - 1);
      const raw = goesUp ? low + (high - low) * t : high - (high - low) * t;
      return jitter(rng, low + (raw - low) * damp, 0.05);
    });
    return [name, ...values] as Array<string | number>;
  });

  const chart: TableChart = {
    kind: 'table',
    title: topic.title,
    unit: topic.unit,
    headers: ['', ...labels],
    rows,
    analysisKey: EMPTY_KEY,
  };

  return {
    ...chart,
    analysisKey: deriveAnalysisKey({
      kind: 'line',
      title: chart.title,
      unit: topic.unit,
      xLabels: labels,
      series: rows.map((row) => ({ name: String(row[0]), values: row.slice(1).map(Number) })),
      analysisKey: EMPTY_KEY,
    }),
  };
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
