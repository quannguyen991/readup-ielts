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

/**
 * Khoá phân tích của một đề.
 *
 * Đây là thứ cho phép chấm drill Overview mà không gọi AI: bài của người học
 * bắt đúng bao nhiêu mục trong `trends` và `crossings` thì đo được bằng đối
 * chiếu từ khoá, không cần model. Nhờ vậy người học lặp lại bao nhiêu lần cũng
 * được mà không tốn token.
 */
export type AnalysisKey = {
  trends: string[];
  extremes: string[];
  crossings: string[];
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
