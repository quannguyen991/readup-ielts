/**
 * Kiểu dữ liệu dùng chung cho module Writing.
 *
 * Mọi union ở đây phải khớp enum tương ứng trong
 * `supabase/migrations/20260819000100_writing.sql`. `enum-parity.test.ts` giữ
 * hai bên không trôi khỏi nhau — sửa một bên quên bên kia thì lỗi chỉ lộ ra
 * khi thật sự nối Supabase, có thể là vài tháng sau.
 */

export type WritingTask = 'ielts_task1' | 'ielts_task2';

export type Task1Chart = 'line' | 'bar' | 'pie' | 'table' | 'mixed' | 'process' | 'map';

export type Task2Essay =
  | 'opinion'
  | 'discussion'
  | 'advantage_disadvantage'
  | 'problem_solution'
  | 'two_part';

export type WritingMode = 'full' | 'drill';

export type DrillPart =
  | 'brainstorm'
  | 'outline'
  | 'introduction'
  | 'overview'
  | 'body'
  | 'conclusion';

export type TrendDirection = 'up' | 'down' | 'stable' | 'fluctuating';

/** Mức thay đổi tương đối so với giá trị đầu kỳ. */
export type TrendMagnitude = 'large' | 'moderate' | 'small';

export type TrendFact = {
  /** Tên chuỗi/danh mục, viết y hệt như hiện trên biểu đồ. */
  subject: string;
  direction: TrendDirection;
  magnitude: TrendMagnitude;
  from: number;
  to: number;
};

export type ExtremeFact = {
  subject: string;
  rank: 'highest' | 'lowest';
  /** Nhãn mốc, hoặc 'throughout' nếu giữ nguyên thứ hạng suốt kỳ. */
  at: string;
};

export type CrossingFact = {
  subject: string;
  other: string;
  /** Nhãn mốc gần chỗ hai đường cắt nhau nhất. */
  nearLabel: string;
};

/**
 * Khoá phân tích của một đề.
 *
 * Đây là thứ cho phép chấm drill Overview mà không gọi AI: bài của người học
 * nhắc đúng bao nhiêu `subject` và bao nhiêu `direction` thì đo được bằng đối
 * chiếu từ khoá. Vì bài viết bằng tiếng Anh nên khoá phải là dữ liệu có trường,
 * không phải câu văn tự do — câu văn thì không so được với gì cả.
 *
 * Toàn bộ khoá này do `deriveAnalysisKey()` suy ra từ chính `chartData`, không
 * viết tay: viết tay thì dữ liệu đổi mà khoá không đổi, và không ai phát hiện.
 */
export type AnalysisKey = {
  trends: TrendFact[];
  extremes: ExtremeFact[];
  crossings: CrossingFact[];
  /** Hai nhóm ứng với hai đoạn thân bài. */
  grouping: [string[], string[]];
};

export type ChartSeries = { name: string; values: number[] };
export type PieSlice = { label: string; value: number };
export type Pie = { caption: string; slices: PieSlice[] };

export type MapItem = {
  shape: 'building' | 'green' | 'water' | 'road' | 'sand' | 'plain';
  label: string;
  /** Toạ độ tương đối 0–1 so với khung, để vẽ đúng ở mọi kích thước màn hình. */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type MapPanel = { caption: string; items: MapItem[] };

type Base = { title: string; analysisKey: AnalysisKey };

export type LineOrBarChart = Base & {
  kind: 'line' | 'bar';
  unit: string;
  xLabels: string[];
  series: ChartSeries[];
};

export type PieChart = Base & { kind: 'pie'; unit: string; pies: Pie[] };

export type TableChart = Base & {
  kind: 'table';
  unit: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

export type ProcessChart = Base & { kind: 'process'; steps: string[]; isCycle: boolean };

export type MapChart = Base & { kind: 'map'; panels: MapPanel[] };

/** Mọi loại trừ `mixed` — `mixed` chỉ ghép hai hình đơn, không lồng tiếp. */
export type SimpleChartData = LineOrBarChart | PieChart | TableChart | ProcessChart | MapChart;

export type MixedChart = Base & {
  kind: 'mixed';
  parts: [SimpleChartData, SimpleChartData];
};

export type ChartData = SimpleChartData | MixedChart;

export type WritingPrompt = {
  id: string;
  task: WritingTask;
  promptText: string;
  chartKind: Task1Chart | null;
  chartData: ChartData | null;
  essayKind: Task2Essay | null;
  topicSlug: string;
  difficultyBand: number;
  timeLimitSeconds: number;
  minWords: number;
  source: 'generated' | 'official' | 'curated';
};

export type WritingSubmission = {
  id: string;
  promptId: string;
  mode: WritingMode;
  drillPart: DrillPart | null;
  bodyText: string;
  wordCount: number;
  durationSeconds: number;
  submittedAt: string;
};

export type AnnotationCategory = 'grammar' | 'lexis' | 'cohesion' | 'expression' | 'task';

export type WritingAnnotation = {
  start: number;
  end: number;
  quote: string;
  category: AnnotationCategory;
  severity: 'minor' | 'major';
  whyVi: string;
  fix: string;
};

export type WritingEvaluation = {
  submissionId: string;
  /** Luôn là khoảng — chấm AI không đủ tin cậy để trả một con số band cứng. */
  bandLow: number;
  bandHigh: number;
  taskBand: number;
  coherenceBand: number;
  lexicalBand: number;
  grammarBand: number;
  summaryVi: string;
  strengths: string[];
  improvements: string[];
  annotations: WritingAnnotation[];
  model: string | null;
  evaluatedAt: string;
};
