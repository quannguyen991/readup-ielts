# Writing lát 1 — nền dữ liệu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng nền dữ liệu cho module Writing — kiểu dữ liệu, kiểm định biểu đồ, migration, repository đọc đề, và store lưu bài làm — để các lát sau có chỗ cắm vào.

**Architecture:** Bám đúng cách dự án đang làm với `articles`: đề bài đọc từ seed JSON tĩnh qua một repository có chữ ký ổn định (sau này đổi ruột sang Supabase mà không sửa chỗ gọi); bài làm lưu cục bộ bằng zustand + persist. Migration viết ngay dù chưa dùng, kèm một test đối chiếu enum SQL với union TypeScript để hai bên không trôi khỏi nhau.

**Tech Stack:** TypeScript, zustand + persist (AsyncStorage/localStorage), node:test qua `tsx --test`, Postgres/Supabase (migration).

**Spec:** `docs/superpowers/specs/2026-08-19-writing-module-design.md`

## Global Constraints

- Expo SDK 57 / React Native 0.86 / React 19.2.3. Trước khi viết code đụng Expo, đọc https://docs.expo.dev/versions/v57.0.0/ (yêu cầu của `AGENTS.md`).
- Chú thích trong code viết **tiếng Việt có dấu**, giải thích **vì sao** chứ không mô tả lại code — theo đúng văn phong các file hiện có.
- Commit message viết **tiếng Việt không dấu**, dạng conventional commit.
- Không sửa file bằng PowerShell `Get-Content`/`Set-Content` — hỏng UTF-8 tiếng Việt.
- Test chạy bằng `npm test` (`tsx --test "src/**/*.test.ts"`). Typecheck bằng `npm run typecheck`.
- Alias import là `@/` trỏ vào `src/`. Đã kiểm: `tsx --test` phân giải được alias này cả với import giá trị, không chỉ import type.
- `tsconfig.json` bật **`noUncheckedIndexedAccess: true`** và `strict`. Nghĩa là `arr[0]` có kiểu `T | undefined` — mọi chỗ đọc phần tử mảng theo chỉ số đều phải xử lý `undefined`, nếu không `npm run typecheck` sẽ đỏ.
- Band luôn đi qua `src/lib/band.ts`, không tự `.toFixed()`.
- Mọi bảng dữ liệu cá nhân trong migration phải có `user_id` + RLS.

---

### Task 1: Đếm từ theo luật IELTS

Đếm từ là con số hiện ngay dưới ô soạn thảo và là căn cứ cảnh báo "dưới 150 từ",
nên nó phải đúng luật IELTS chứ không phải `split(' ').length`.

**Files:**
- Create: `src/lib/writing/word-count.ts`
- Test: `src/lib/writing/word-count.test.ts`

**Interfaces:**
- Consumes: —
- Produces: `countWords(text: string): number`

- [ ] **Step 1: Viết test thất bại**

```ts
// src/lib/writing/word-count.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { countWords } from './word-count';

test('bài rỗng và bài toàn khoảng trắng đều là 0 từ', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   \n\t  '), 0);
});

test('đếm theo khoảng trắng, gộp nhiều khoảng trắng liền nhau', () => {
  assert.equal(countWords('Hello   world\n\nagain'), 3);
});

test('từ ghép nối gạch nối tính là MỘT từ, đúng luật IELTS', () => {
  assert.equal(countWords('a well-known problem'), 3);
  assert.equal(countWords('state-of-the-art'), 1);
});

test('số và phần trăm tính là một từ', () => {
  assert.equal(countWords('In 2020, sales rose by 20%.'), 6);
});

test('viết tắt có dấu nháy tính là một từ', () => {
  assert.equal(countWords("don't stop"), 2);
});

test('gạch ngang dài là dấu ngăn cách, không phải gạch nối', () => {
  // "one—two" là hai từ bị dấu gạch ngang dính vào nhau, không phải từ ghép.
  assert.equal(countWords('one—two'), 2);
  assert.equal(countWords('one – two'), 2);
});

test('dấu câu đứng một mình không được tính là từ', () => {
  assert.equal(countWords('Yes . . . no'), 2);
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó hỏng**

Run: `npx tsx --test src/lib/writing/word-count.test.ts`
Expected: FAIL — không tìm thấy module `./word-count`.

- [ ] **Step 3: Viết bản cài đặt tối thiểu**

```ts
// src/lib/writing/word-count.ts
/**
 * Đếm từ theo luật chấm của IELTS.
 *
 * Không dùng `split(' ')` được, vì luật IELTS khác trực giác ở hai chỗ: từ ghép
 * nối bằng gạch nối tính MỘT từ (`well-known` = 1), còn gạch ngang dài lại chỉ
 * là dấu ngăn cách nên `one—two` là HAI từ. Con số và phần trăm cũng tính một
 * từ, nên không được tách theo ký tự không phải chữ cái.
 */

/** Gạch ngang dài, gạch ngang ngắn và ba chấm — đều là dấu ngăn, không phải chữ. */
const SEPARATORS = /[‐‒–—―…]+/gu;

export function countWords(text: string): number {
  return text
    .replace(SEPARATORS, ' ')
    .split(/\s+/u)
    .filter(isWord).length;
}

/**
 * Một token chỉ được tính khi có ít nhất một chữ cái hoặc chữ số. Loại này bỏ
 * được dấu câu đứng lẻ (`.` `,` `...`) mà vẫn giữ `20%` và `don't`.
 */
function isWord(token: string): boolean {
  return /[\p{L}\p{N}]/u.test(token);
}
```

- [ ] **Step 4: Chạy lại test**

Run: `npx tsx --test src/lib/writing/word-count.test.ts`
Expected: PASS, 7/7.

- [ ] **Step 5: Commit**

```bash
git add src/lib/writing/word-count.ts src/lib/writing/word-count.test.ts
git commit -m "feat(writing): dem tu theo luat IELTS"
```

---

### Task 2: Kiểu dữ liệu và kiểm định `chart_data`

`chart_data` là union có discriminant. Kiểm định phải chạy được lúc sinh đề (lát
2) để một đề hỏng không bao giờ lọt vào seed.

**Files:**
- Create: `src/lib/writing/types.ts`
- Create: `src/lib/writing/chart-data.ts`
- Test: `src/lib/writing/chart-data.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - types: `WritingTask`, `Task1Chart`, `Task2Essay`, `WritingMode`, `DrillPart`, `AnalysisKey`, `ChartData`, `SimpleChartData`, `WritingPrompt`, `WritingSubmission`, `WritingAnnotation`, `WritingEvaluation`
  - `validateChartData(data: unknown): { ok: true; data: ChartData } | { ok: false; reason: string }`

- [ ] **Step 1: Viết file kiểu dữ liệu**

```ts
// src/lib/writing/types.ts
/**
 * Kiểu dữ liệu dùng chung cho module Writing.
 *
 * Mọi union ở đây phải khớp enum tương ứng trong
 * `supabase/migrations/20260819000100_writing.sql`. Task 3 có test giữ hai bên
 * không trôi khỏi nhau.
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
 * Khoá phân tích của một đề Task 1.
 *
 * Đây là thứ cho phép chấm drill Overview mà không gọi AI: bài của người học
 * bắt đúng bao nhiêu mục trong `trends` và `crossings` thì đo được bằng đối
 * chiếu từ khoá, không cần model.
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
  /** Toạ độ tương đối 0–1 so với khung, để vẽ ở mọi kích thước màn hình. */
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

export type MixedChart = Base & { kind: 'mixed'; parts: [SimpleChartData, SimpleChartData] };

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
  /** Luôn là khoảng — không bịa một con số band cứng. */
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
```

- [ ] **Step 2: Viết test thất bại cho bộ kiểm định**

```ts
// src/lib/writing/chart-data.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateChartData } from './chart-data';
import type { AnalysisKey } from './types';

const KEY: AnalysisKey = {
  trends: ['A tăng'],
  extremes: ['A cao nhất'],
  crossings: [],
  grouping: [['A'], ['B']],
};

const line = {
  kind: 'line',
  title: 'Petrol prices',
  unit: 'cents',
  xLabels: ['2000', '2005'],
  series: [{ name: 'A', values: [45, 68] }],
  analysisKey: KEY,
};

test('biểu đồ đường hợp lệ thì qua', () => {
  const r = validateChartData(line);
  assert.equal(r.ok, true);
});

test('số điểm dữ liệu phải khớp số nhãn trục X', () => {
  const r = validateChartData({ ...line, series: [{ name: 'A', values: [45] }] });
  assert.equal(r.ok, false);
  assert.match(r.ok === false ? r.reason : '', /nhãn trục X/);
});

test('cần ít nhất hai mốc trên trục X, một mốc thì không có gì để mô tả', () => {
  const r = validateChartData({ ...line, xLabels: ['2000'], series: [{ name: 'A', values: [1] }] });
  assert.equal(r.ok, false);
});

test('lát của một hình tròn phải cộng lại xấp xỉ 100', () => {
  const r = validateChartData({
    kind: 'pie',
    title: 'Energy',
    unit: '%',
    pies: [{ caption: '1995', slices: [{ label: 'Coal', value: 52 }, { label: 'Gas', value: 20 }] }],
    analysisKey: KEY,
  });
  assert.equal(r.ok, false);
  assert.match(r.ok === false ? r.reason : '', /100/);
});

test('mọi hàng của bảng phải đủ số cột như tiêu đề', () => {
  const r = validateChartData({
    kind: 'table',
    title: 'Water',
    unit: 'litres',
    headers: ['Country', '2000', '2010'],
    rows: [['Australia', 340]],
    analysisKey: KEY,
  });
  assert.equal(r.ok, false);
});

test('sơ đồ quy trình cần ít nhất ba bước', () => {
  const r = validateChartData({
    kind: 'process',
    title: 'Coffee',
    steps: ['hái', 'sấy'],
    isCycle: false,
    analysisKey: KEY,
  });
  assert.equal(r.ok, false);
});

test('ô trên bản đồ phải nằm gọn trong khung 0–1', () => {
  // Phải đủ hai khung, nếu không test sẽ đỏ vì lý do khác (thiếu khung) và
  // không còn kiểm được điều nó định kiểm.
  const ok = { shape: 'green', label: 'Forest', x: 0.1, y: 0.1, w: 0.3, h: 0.3 };
  const r = validateChartData({
    kind: 'map',
    title: 'Island',
    panels: [
      { caption: '1990', items: [ok] },
      { caption: '2020', items: [{ ...ok, label: 'Hotel', x: 0.8, w: 0.5 }] },
    ],
    analysisKey: KEY,
  });
  assert.equal(r.ok, false);
  assert.match(r.ok === false ? r.reason : '', /ngoài khung/);
});

test('đề kết hợp phải có đúng hai hình và không được lồng tiếp mixed', () => {
  const bad = { kind: 'mixed', title: 'X', parts: [line], analysisKey: KEY };
  assert.equal(validateChartData(bad).ok, false);

  const nested = { kind: 'mixed', title: 'X', parts: [line, { ...line, kind: 'mixed' }], analysisKey: KEY };
  assert.equal(validateChartData(nested).ok, false);
});

test('analysisKey phải có đủ hai nhóm, vì hai nhóm là hai đoạn thân bài', () => {
  const r = validateChartData({ ...line, analysisKey: { ...KEY, grouping: [['A']] } });
  assert.equal(r.ok, false);
});

test('kind lạ thì trả lỗi chứ không ném ngoại lệ', () => {
  assert.equal(validateChartData({ kind: 'donut' }).ok, false);
  assert.equal(validateChartData(null).ok, false);
});
```

- [ ] **Step 3: Chạy test để chắc chắn nó hỏng**

Run: `npx tsx --test src/lib/writing/chart-data.test.ts`
Expected: FAIL — không tìm thấy module `./chart-data`.

- [ ] **Step 4: Viết bộ kiểm định**

```ts
// src/lib/writing/chart-data.ts
import type { AnalysisKey, ChartData, SimpleChartData } from './types';

/**
 * Kiểm định `chart_data` trước khi nó vào kho đề.
 *
 * Đề hỏng mà lọt vào seed thì lỗi chỉ lộ ra lúc vẽ, trên máy người học, và
 * không có cách nào sửa ngoài việc chạy lại toàn bộ ingest. Rẻ hơn nhiều là
 * chặn ngay tại chỗ sinh — nên hàm này trả lý do bằng tiếng Việt để log ingest
 * đọc được luôn.
 */

export type ValidationResult =
  | { ok: true; data: ChartData }
  | { ok: false; reason: string };

const fail = (reason: string): ValidationResult => ({ ok: false, reason });

export function validateChartData(data: unknown): ValidationResult {
  if (!isRecord(data)) return fail('chart_data không phải object.');

  const keyError = checkAnalysisKey(data.analysisKey);
  if (keyError) return fail(keyError);

  if (typeof data.title !== 'string' || data.title.trim() === '') {
    return fail('Thiếu title.');
  }

  if (data.kind === 'mixed') {
    if (!Array.isArray(data.parts) || data.parts.length !== 2) {
      return fail('Đề kết hợp phải có đúng hai hình.');
    }
    for (const part of data.parts) {
      if (isRecord(part) && part.kind === 'mixed') {
        return fail('Đề kết hợp không được lồng tiếp mixed.');
      }
      const inner = validateChartData(part);
      if (!inner.ok) return fail(`Hình con không hợp lệ: ${inner.reason}`);
    }
    return { ok: true, data: data as unknown as ChartData };
  }

  const simple = checkSimple(data);
  if (simple) return fail(simple);
  return { ok: true, data: data as unknown as SimpleChartData };
}

function checkSimple(data: Record<string, unknown>): string | null {
  switch (data.kind) {
    case 'line':
    case 'bar': {
      const labels = data.xLabels;
      const series = data.series;
      if (!Array.isArray(labels) || labels.length < 2) {
        return 'Cần ít nhất hai mốc trên trục X.';
      }
      if (!Array.isArray(series) || series.length === 0) return 'Cần ít nhất một chuỗi dữ liệu.';
      for (const s of series) {
        if (!isRecord(s) || typeof s.name !== 'string') return 'Chuỗi dữ liệu thiếu tên.';
        if (!Array.isArray(s.values) || s.values.length !== labels.length) {
          return `Chuỗi "${String(s.name)}" có số điểm dữ liệu không khớp số nhãn trục X.`;
        }
        if (s.values.some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
          return `Chuỗi "${String(s.name)}" có giá trị không phải số.`;
        }
      }
      return null;
    }

    case 'pie': {
      const pies = data.pies;
      if (!Array.isArray(pies) || pies.length === 0) return 'Cần ít nhất một hình tròn.';
      for (const pie of pies) {
        if (!isRecord(pie) || !Array.isArray(pie.slices) || pie.slices.length < 2) {
          return 'Mỗi hình tròn cần ít nhất hai lát.';
        }
        let total = 0;
        for (const slice of pie.slices) {
          if (!isRecord(slice) || typeof slice.value !== 'number') return 'Lát thiếu giá trị số.';
          total += slice.value;
        }
        // Cho lệch 1 điểm vì đề thật hay làm tròn từng lát.
        if (Math.abs(total - 100) > 1) {
          return `Hình tròn "${String(pie.caption)}" có tổng ${total}, phải xấp xỉ 100.`;
        }
      }
      return null;
    }

    case 'table': {
      const headers = data.headers;
      const rows = data.rows;
      if (!Array.isArray(headers) || headers.length < 2) return 'Bảng cần ít nhất hai cột.';
      if (!Array.isArray(rows) || rows.length < 2) return 'Bảng cần ít nhất hai hàng.';
      for (const row of rows) {
        if (!Array.isArray(row) || row.length !== headers.length) {
          return 'Có hàng không đủ số cột như tiêu đề.';
        }
      }
      return null;
    }

    case 'process': {
      const steps = data.steps;
      if (!Array.isArray(steps) || steps.length < 3) return 'Quy trình cần ít nhất ba bước.';
      if (steps.some((s) => typeof s !== 'string' || s.trim() === '')) return 'Có bước để trống.';
      if (typeof data.isCycle !== 'boolean') return 'Thiếu isCycle.';
      return null;
    }

    case 'map': {
      const panels = data.panels;
      if (!Array.isArray(panels) || panels.length < 2) return 'Bản đồ cần ít nhất hai khung.';
      for (const panel of panels) {
        if (!isRecord(panel) || !Array.isArray(panel.items) || panel.items.length === 0) {
          return 'Khung bản đồ không có ô nào.';
        }
        for (const item of panel.items) {
          if (!isRecord(item)) return 'Ô bản đồ không hợp lệ.';
          const { x, y, w, h } = item as Record<string, unknown>;
          if ([x, y, w, h].some((n) => typeof n !== 'number')) return 'Ô bản đồ thiếu toạ độ.';
          if (
            (x as number) < 0 ||
            (y as number) < 0 ||
            (x as number) + (w as number) > 1.0001 ||
            (y as number) + (h as number) > 1.0001
          ) {
            return `Ô "${String(item.label)}" nằm ngoài khung 0–1.`;
          }
        }
      }
      return null;
    }

    default:
      return `kind không hợp lệ: ${String(data.kind)}`;
  }
}

function checkAnalysisKey(key: unknown): string | null {
  if (!isRecord(key)) return 'Thiếu analysisKey.';
  for (const field of ['trends', 'extremes', 'crossings'] as const) {
    if (!Array.isArray(key[field])) return `analysisKey.${field} phải là mảng.`;
  }
  const grouping = key.grouping;
  if (!Array.isArray(grouping) || grouping.length !== 2) {
    return 'analysisKey.grouping phải có đúng hai nhóm, vì hai nhóm là hai đoạn thân bài.';
  }
  if (!grouping.every((g) => Array.isArray(g) && g.length > 0)) {
    return 'analysisKey.grouping có nhóm rỗng.';
  }
  if ((key.trends as unknown[]).length === 0) {
    return 'analysisKey.trends rỗng — đề không có xu hướng nào để mô tả.';
  }
  return null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
```

- [ ] **Step 5: Chạy test và typecheck**

Run: `npx tsx --test src/lib/writing/chart-data.test.ts && npm run typecheck`
Expected: PASS 10/10, typecheck không báo lỗi.

- [ ] **Step 6: Commit**

```bash
git add src/lib/writing/types.ts src/lib/writing/chart-data.ts src/lib/writing/chart-data.test.ts
git commit -m "feat(writing): kieu du lieu va bo kiem dinh chart_data"
```

---

### Task 3: Migration và test chống trôi enum

Migration chưa dùng tới ngay, nhưng viết luôn để chốt hình dạng dữ liệu. Kèm một
test đọc thẳng file `.sql` rồi đối chiếu với union TypeScript — dự án đã có tiền
lệ lo đúng chuyện này (xem chú thích trong `20260810000300_sat_question_types.sql`).

**Files:**
- Create: `supabase/migrations/20260819000100_writing.sql`
- Create: `src/lib/writing/enum-parity.test.ts`

**Interfaces:**
- Consumes: các union trong `src/lib/writing/types.ts` (Task 2)
- Produces: — (chỉ là migration + test)

- [ ] **Step 1: Viết migration**

```sql
-- supabase/migrations/20260819000100_writing.sql
-- ============================================================================
-- Module Writing — IELTS Task 1/2.
--
-- Chưa dùng tới khi app còn chạy hoàn toàn cục bộ (đề nằm ở seed JSON, bài làm
-- nằm trong zustand + persist). Viết trước để chốt hình dạng dữ liệu, đúng như
-- đã làm với `articles`.
-- ============================================================================

create type writing_task as enum ('ielts_task1', 'ielts_task2');

create type task1_chart as enum ('line', 'bar', 'pie', 'table', 'mixed', 'process', 'map');

create type task2_essay as enum (
  'opinion',
  'discussion',
  'advantage_disadvantage',
  'problem_solution',
  'two_part'
);

create type writing_mode as enum ('full', 'drill');

create type drill_part as enum (
  'brainstorm',
  'outline',
  'introduction',
  'overview',
  'body',
  'conclusion'
);

-- ---------------------------------------------------------------------------
-- writing_prompts — đề bài, dùng chung Task 1 và Task 2
-- ---------------------------------------------------------------------------
create table writing_prompts (
  id uuid primary key default gen_random_uuid(),
  task writing_task not null,
  prompt_text text not null,
  chart_kind task1_chart,
  chart_data jsonb,
  essay_kind task2_essay,
  topic_slug text not null references topics (slug),
  difficulty_band numeric(2, 1) not null check (difficulty_band between 4.0 and 9.0),
  time_limit_seconds int not null check (time_limit_seconds > 0),
  min_words int not null check (min_words > 0),
  source text not null check (source in ('generated', 'official', 'curated')),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Biểu đồ chỉ có nghĩa với Task 1, và kind với data phải đi cùng nhau: có
  -- kind mà thiếu data thì màn hình vẽ ra khung rỗng, người học không làm được.
  constraint writing_prompts_chart_pair check (
    (chart_kind is null) = (chart_data is null)
  ),
  constraint writing_prompts_chart_only_task1 check (
    chart_kind is null or task = 'ielts_task1'
  ),
  constraint writing_prompts_task1_needs_chart check (
    task <> 'ielts_task1' or chart_kind is not null
  ),
  constraint writing_prompts_essay_only_task2 check (
    essay_kind is null or task = 'ielts_task2'
  ),
  constraint writing_prompts_task2_needs_essay check (
    task <> 'ielts_task2' or essay_kind is not null
  )
);

create trigger writing_prompts_updated_at
before update on writing_prompts
for each row execute function set_updated_at();

-- Người học chọn task trước, rồi mới lọc tiếp — đây là cột đầu của mọi truy vấn.
create index writing_prompts_task_idx on writing_prompts (task) where is_published;
create index writing_prompts_topic_idx on writing_prompts (topic_slug);

-- ---------------------------------------------------------------------------
-- writing_submissions — bài làm
-- ---------------------------------------------------------------------------
create table writing_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid not null references writing_prompts (id) on delete cascade,
  mode writing_mode not null,
  drill_part drill_part,
  body_text text not null,
  word_count int not null check (word_count >= 0),
  duration_seconds int not null check (duration_seconds >= 0),
  submitted_at timestamptz not null default now(),

  -- drill_part có mặt khi và chỉ khi đang ở chế độ drill. Cho phép lệch thì
  -- màn kết quả không biết nên chấm theo tiêu chí cả bài hay tiêu chí một phần.
  constraint writing_submissions_drill_part_matches_mode check (
    (mode = 'drill') = (drill_part is not null)
  )
);

create index writing_submissions_user_idx on writing_submissions (user_id, submitted_at desc);
create index writing_submissions_prompt_idx on writing_submissions (prompt_id);

-- ---------------------------------------------------------------------------
-- writing_evaluations — kết quả chấm, mỗi bài làm nhiều nhất một bản
-- ---------------------------------------------------------------------------
create table writing_evaluations (
  submission_id uuid primary key references writing_submissions (id) on delete cascade,
  band_low numeric(2, 1) not null check (band_low between 1.0 and 9.0),
  band_high numeric(2, 1) not null check (band_high between 1.0 and 9.0),
  task_band numeric(2, 1) not null,
  coherence_band numeric(2, 1) not null,
  lexical_band numeric(2, 1) not null,
  grammar_band numeric(2, 1) not null,
  summary_vi text not null,
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  annotations jsonb not null default '[]'::jsonb,
  model text,
  evaluated_at timestamptz not null default now(),

  -- Band luôn là một khoảng. Chấm AI không đủ tin cậy để trả một số cứng, nên
  -- lược đồ không cho phép biểu diễn "một số cứng" ngay từ đầu.
  constraint writing_evaluations_band_range check (band_low <= band_high)
);

-- ---------------------------------------------------------------------------
-- writing_model_essays — bài mẫu do AI soạn, đã chấm ngược
-- ---------------------------------------------------------------------------
create table writing_model_essays (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references writing_prompts (id) on delete cascade,
  target_band numeric(2, 1) not null check (target_band between 4.0 and 9.0),
  body_text text not null,
  notes jsonb not null default '[]'::jsonb,
  verified_band_low numeric(2, 1),
  verified_band_high numeric(2, 1),
  generated_at timestamptz not null default now(),

  unique (prompt_id, target_band)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table writing_prompts enable row level security;
alter table writing_submissions enable row level security;
alter table writing_evaluations enable row level security;
alter table writing_model_essays enable row level security;

create policy writing_prompts_read_published on writing_prompts
  for select using (is_published);

create policy writing_model_essays_read on writing_model_essays
  for select using (
    exists (
      select 1 from writing_prompts p
      where p.id = writing_model_essays.prompt_id and p.is_published
    )
  );

create policy writing_submissions_own on writing_submissions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Bản chấm đi theo bài làm: ai sở hữu bài thì thấy bản chấm của bài đó.
create policy writing_evaluations_own on writing_evaluations
  for all using (
    exists (
      select 1 from writing_submissions s
      where s.id = writing_evaluations.submission_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from writing_submissions s
      where s.id = writing_evaluations.submission_id and s.user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Viết test đối chiếu enum SQL với union TypeScript**

```ts
// src/lib/writing/enum-parity.test.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/**
 * Enum trong migration và union trong types.ts là hai bản chép của cùng một
 * danh sách. Sửa một bên quên bên kia thì lỗi chỉ lộ ra khi thật sự nối
 * Supabase — có thể là vài tháng sau. Test này bắt ngay lúc chạy `npm test`.
 */

const SQL = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260819000100_writing.sql'),
  'utf8',
);

const TYPES = readFileSync(join(process.cwd(), 'src/lib/writing/types.ts'), 'utf8');

/** Đọc các giá trị của `create type <name> as enum (...)`. */
function sqlEnum(name: string): string[] {
  const m = SQL.match(new RegExp(`create type ${name} as enum \\(([^)]*)\\)`, 'i'));
  const body = m?.[1];
  assert.ok(body, `Không tìm thấy enum ${name} trong migration.`);
  return [...body.matchAll(/'([^']+)'/g)].map((x) => x[1] ?? '').sort();
}

/** Đọc các chuỗi literal của `export type X = 'a' | 'b'` (có thể xuống dòng). */
function tsUnion(name: string): string[] {
  const m = TYPES.match(new RegExp(`export type ${name} =([^;]*);`));
  const body = m?.[1];
  assert.ok(body, `Không tìm thấy union ${name} trong types.ts.`);
  return [...body.matchAll(/'([^']+)'/g)].map((x) => x[1] ?? '').sort();
}

const PAIRS: Array<[string, string]> = [
  ['writing_task', 'WritingTask'],
  ['task1_chart', 'Task1Chart'],
  ['task2_essay', 'Task2Essay'],
  ['writing_mode', 'WritingMode'],
  ['drill_part', 'DrillPart'],
];

for (const [sqlName, tsName] of PAIRS) {
  test(`enum ${sqlName} khớp union ${tsName}`, () => {
    assert.deepEqual(tsUnion(tsName), sqlEnum(sqlName));
  });
}
```

- [ ] **Step 3: Chạy test**

Run: `npx tsx --test src/lib/writing/enum-parity.test.ts`
Expected: PASS 5/5. Nếu hỏng thì sửa cho hai bên khớp nhau rồi chạy lại.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260819000100_writing.sql src/lib/writing/enum-parity.test.ts
git commit -m "feat(writing): migration 4 bang + test chong troi enum"
```

---

### Task 4: Seed mẫu và repository đọc đề

Repository giữ chữ ký ổn định để lát sau đổi nguồn sang Supabase mà không phải
sửa chỗ gọi — đúng cách `article-repository.ts` đang làm.

**Files:**
- Create: `src/data/seed/writing/index.json`
- Create: `src/data/writing-repository.ts`
- Test: `src/data/writing-repository.test.ts`

**Interfaces:**
- Consumes: `WritingPrompt`, `Task1Chart`, `Task2Essay`, `WritingTask` từ `@/lib/writing/types`
- Produces:
  - `WRITING_PROMPTS: WritingPrompt[]`
  - `getWritingPromptById(id: string): WritingPrompt | undefined`
  - `filterWritingPrompts(filters?: WritingPromptFilters): WritingPrompt[]`
  - `type WritingPromptFilters = { task?: WritingTask; chartKind?: Task1Chart; essayKind?: Task2Essay; topicSlug?: string; maxBand?: number; search?: string }`
  - `writingLibraryStats(): { total: number; byTask: Record<WritingTask, number> }`

- [ ] **Step 1: Tạo seed mẫu ba đề**

```json
[
  {
    "id": "w-t2-opinion-transport-001",
    "task": "ielts_task2",
    "promptText": "Some people think that governments should spend more money on public transport, while others believe that improving roads for cars is more important. Discuss both views and give your own opinion.",
    "chartKind": null,
    "chartData": null,
    "essayKind": "discussion",
    "topicSlug": "society",
    "difficultyBand": 6.5,
    "timeLimitSeconds": 2400,
    "minWords": 250,
    "source": "curated"
  },
  {
    "id": "w-t2-opinion-education-001",
    "task": "ielts_task2",
    "promptText": "In many countries, young people are encouraged to work or travel for a year before they start university. Do the advantages of this outweigh the disadvantages?",
    "chartKind": null,
    "chartData": null,
    "essayKind": "advantage_disadvantage",
    "topicSlug": "education",
    "difficultyBand": 6.5,
    "timeLimitSeconds": 2400,
    "minWords": 250,
    "source": "curated"
  },
  {
    "id": "w-t1-line-petrol-001",
    "task": "ielts_task1",
    "promptText": "The line graph below shows the average price of petrol in three countries between 2000 and 2020.",
    "chartKind": "line",
    "chartData": {
      "kind": "line",
      "title": "Average price of petrol in three countries, 2000-2020",
      "unit": "US cents per litre",
      "xLabels": ["2000", "2005", "2010", "2015", "2020"],
      "series": [
        { "name": "Country A", "values": [45, 68, 95, 120, 155] },
        { "name": "Country B", "values": [60, 72, 78, 74, 70] },
        { "name": "Country C", "values": [95, 88, 70, 52, 40] }
      ],
      "analysisKey": {
        "trends": [
          "Country A tang lien tuc suot ky",
          "Country C giam lien tuc suot ky",
          "Country B gan nhu phang"
        ],
        "extremes": [
          "Country C dat nhat dau ky",
          "Country A re nhat dau ky",
          "Country A dat nhat cuoi ky"
        ],
        "crossings": ["Country A va Country C doi cho cho nhau trong khoang 2008"],
        "grouping": [["Country A", "Country C"], ["Country B"]]
      }
    },
    "essayKind": null,
    "topicSlug": "environment",
    "difficultyBand": 7.0,
    "timeLimitSeconds": 1200,
    "minWords": 150,
    "source": "curated"
  }
]
```

- [ ] **Step 2: Viết test thất bại**

```ts
// src/data/writing-repository.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  WRITING_PROMPTS,
  filterWritingPrompts,
  getWritingPromptById,
  writingLibraryStats,
} from './writing-repository';
import { validateChartData } from '@/lib/writing/chart-data';

test('kho đề nạp được và không rỗng', () => {
  assert.ok(WRITING_PROMPTS.length >= 3);
});

test('mọi đề Task 1 đều có chartData hợp lệ', () => {
  for (const p of WRITING_PROMPTS.filter((x) => x.task === 'ielts_task1')) {
    assert.ok(p.chartData, `${p.id} thiếu chartData`);
    const r = validateChartData(p.chartData);
    assert.equal(r.ok, true, `${p.id}: ${r.ok === false ? r.reason : ''}`);
  }
});

test('mọi đề Task 2 đều có essayKind và không có biểu đồ', () => {
  for (const p of WRITING_PROMPTS.filter((x) => x.task === 'ielts_task2')) {
    assert.ok(p.essayKind, `${p.id} thiếu essayKind`);
    assert.equal(p.chartKind, null);
    assert.equal(p.chartData, null);
  }
});

test('id là duy nhất', () => {
  const ids = WRITING_PROMPTS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('tra theo id', () => {
  const first = WRITING_PROMPTS[0];
  // `noUncheckedIndexedAccess` bật nên phần tử mảng có thể undefined — phải chặn
  // trước khi dùng, không được dùng dấu `!`.
  assert.ok(first);
  assert.equal(getWritingPromptById(first.id)?.id, first.id);
  assert.equal(getWritingPromptById('khong-co-that'), undefined);
});

test('lọc theo task', () => {
  const t1 = filterWritingPrompts({ task: 'ielts_task1' });
  assert.ok(t1.length > 0);
  assert.ok(t1.every((p) => p.task === 'ielts_task1'));
});

test('lọc theo band tối đa lấy cả đề dễ hơn', () => {
  const easy = filterWritingPrompts({ maxBand: 6.5 });
  assert.ok(easy.every((p) => p.difficultyBand <= 6.5));
});

test('tìm theo chữ, không phân biệt hoa thường', () => {
  const found = filterWritingPrompts({ search: 'PUBLIC TRANSPORT' });
  assert.ok(found.some((p) => p.id === 'w-t2-opinion-transport-001'));
});

test('không truyền bộ lọc thì trả toàn bộ', () => {
  assert.equal(filterWritingPrompts().length, WRITING_PROMPTS.length);
});

test('thống kê đếm đúng theo task', () => {
  const stats = writingLibraryStats();
  assert.equal(stats.total, WRITING_PROMPTS.length);
  assert.equal(
    stats.byTask.ielts_task1 + stats.byTask.ielts_task2,
    WRITING_PROMPTS.length,
  );
});
```

- [ ] **Step 3: Chạy test để chắc chắn nó hỏng**

Run: `npx tsx --test src/data/writing-repository.test.ts`
Expected: FAIL — không tìm thấy module `./writing-repository`.

- [ ] **Step 4: Viết repository**

```ts
// src/data/writing-repository.ts
import seed from './seed/writing/index.json';
import type {
  Task1Chart,
  Task2Essay,
  WritingPrompt,
  WritingTask,
} from '@/lib/writing/types';

/**
 * Kho đề Writing.
 *
 * Nguồn hiện tại là seed JSON tĩnh, cùng lý do như kho bài đọc: app dùng được
 * ngay cả khi chưa cấu hình Supabase. Khi chuyển sang Supabase thì chỉ ruột các
 * hàm dưới đây đổi, chữ ký giữ nguyên — nên màn hình không phải sửa gì.
 */

export const WRITING_PROMPTS: WritingPrompt[] = seed as unknown as WritingPrompt[];

export type WritingPromptFilters = {
  task?: WritingTask;
  chartKind?: Task1Chart;
  essayKind?: Task2Essay;
  topicSlug?: string;
  /** Lấy mọi đề có band mục tiêu không vượt quá mức này. */
  maxBand?: number;
  search?: string;
};

export function getWritingPromptById(id: string): WritingPrompt | undefined {
  return WRITING_PROMPTS.find((p) => p.id === id);
}

export function filterWritingPrompts(filters: WritingPromptFilters = {}): WritingPrompt[] {
  const search = filters.search?.trim().toLowerCase();

  return WRITING_PROMPTS.filter((p) => {
    if (filters.task && p.task !== filters.task) return false;
    if (filters.chartKind && p.chartKind !== filters.chartKind) return false;
    if (filters.essayKind && p.essayKind !== filters.essayKind) return false;
    if (filters.topicSlug && p.topicSlug !== filters.topicSlug) return false;
    if (filters.maxBand != null && p.difficultyBand > filters.maxBand) return false;
    if (search && !p.promptText.toLowerCase().includes(search)) return false;
    return true;
  });
}

export function writingLibraryStats(): {
  total: number;
  byTask: Record<WritingTask, number>;
} {
  const byTask: Record<WritingTask, number> = { ielts_task1: 0, ielts_task2: 0 };
  for (const p of WRITING_PROMPTS) byTask[p.task] += 1;
  return { total: WRITING_PROMPTS.length, byTask };
}
```

- [ ] **Step 5: Chạy test và typecheck**

Run: `npx tsx --test src/data/writing-repository.test.ts && npm run typecheck`
Expected: PASS 10/10, typecheck sạch.

Nếu typecheck báo lỗi nạp JSON, kiểm `tsconfig.json` đã bật `resolveJsonModule`
chưa (kho bài đọc đã nạp `seed/index.json` nên gần như chắc là đã bật).

- [ ] **Step 6: Commit**

```bash
git add src/data/seed/writing/index.json src/data/writing-repository.ts src/data/writing-repository.test.ts
git commit -m "feat(writing): seed mau va repository doc de"
```

---

### Task 5: Store lưu bản nháp và bài đã nộp

Store giữ ba thứ: bản nháp đang gõ (để đóng tab không mất bài), lịch sử bài đã
nộp, và bản chấm. Phần tính toán tách khỏi zustand để test được mà không cần
dựng React.

**Files:**
- Create: `src/store/writing-history.ts`
- Create: `src/store/useWritingStore.ts`
- Test: `src/store/writing-history.test.ts`

**Interfaces:**
- Consumes: `WritingSubmission`, `WritingEvaluation`, `WritingMode`, `DrillPart` từ `@/lib/writing/types`; `countWords` từ `@/lib/writing/word-count`; `averageBand`, `bandDelta` từ `@/lib/band`
- Produces:
  - `addSubmission(list, submission): WritingSubmission[]`
  - `submissionsForPrompt(list, promptId): WritingSubmission[]`
  - `writingProgress(list, evaluations): { totalSubmissions: number; totalWords: number; averageBand: number | null; latestDelta: number | null }`
  - `useWritingStore` với state `{ drafts, submissions, evaluations }` và action `saveDraft`, `clearDraft`, `submit`, `saveEvaluation`

- [ ] **Step 1: Viết test thất bại**

```ts
// src/store/writing-history.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addSubmission, submissionsForPrompt, writingProgress } from './writing-history';
import type { WritingEvaluation, WritingSubmission } from '@/lib/writing/types';

function sub(id: string, promptId: string, words: number, at: string): WritingSubmission {
  return {
    id,
    promptId,
    mode: 'full',
    drillPart: null,
    bodyText: 'x '.repeat(words).trim(),
    wordCount: words,
    durationSeconds: 1200,
    submittedAt: at,
  };
}

function evaluation(submissionId: string, low: number, high: number): WritingEvaluation {
  return {
    submissionId,
    bandLow: low,
    bandHigh: high,
    taskBand: low,
    coherenceBand: low,
    lexicalBand: low,
    grammarBand: low,
    summaryVi: '',
    strengths: [],
    improvements: [],
    annotations: [],
    model: null,
    evaluatedAt: '2026-08-19T00:00:00Z',
  };
}

test('bài mới nhất nằm đầu danh sách', () => {
  const list = addSubmission(
    addSubmission([], sub('a', 'p1', 200, '2026-08-18T10:00:00Z')),
    sub('b', 'p1', 210, '2026-08-19T10:00:00Z'),
  );
  assert.deepEqual(list.map((s) => s.id), ['b', 'a']);
});

test('nộp lại cùng một bài thì thay bản cũ, không nhân đôi', () => {
  const first = addSubmission([], sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  const again = addSubmission(first, sub('a', 'p1', 250, '2026-08-18T11:00:00Z'));
  assert.equal(again.length, 1);
  assert.equal(again[0].wordCount, 250);
});

test('lọc bài theo đề', () => {
  let list: WritingSubmission[] = [];
  list = addSubmission(list, sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  list = addSubmission(list, sub('b', 'p2', 200, '2026-08-18T11:00:00Z'));
  assert.deepEqual(submissionsForPrompt(list, 'p1').map((s) => s.id), ['a']);
});

test('tiến độ: tổng bài, tổng từ, band trung bình lấy điểm giữa khoảng', () => {
  let list: WritingSubmission[] = [];
  list = addSubmission(list, sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  list = addSubmission(list, sub('b', 'p2', 300, '2026-08-19T10:00:00Z'));

  const p = writingProgress(list, [evaluation('a', 6.0, 6.5), evaluation('b', 6.5, 7.0)]);
  assert.equal(p.totalSubmissions, 2);
  assert.equal(p.totalWords, 500);
  // Điểm giữa: 6.25 và 6.75 → trung bình 6.5.
  assert.equal(p.averageBand, 6.5);
});

test('chưa bài nào được chấm thì band trung bình là null, không phải 0', () => {
  const list = addSubmission([], sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  assert.equal(writingProgress(list, []).averageBand, null);
});

test('chênh lệch so với bài trước, tính trên điểm giữa khoảng', () => {
  let list: WritingSubmission[] = [];
  list = addSubmission(list, sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  list = addSubmission(list, sub('b', 'p2', 200, '2026-08-19T10:00:00Z'));
  const p = writingProgress(list, [evaluation('a', 6.0, 6.0), evaluation('b', 6.5, 6.5)]);
  assert.equal(p.latestDelta, 0.5);
});

test('chỉ có một bài được chấm thì không có gì để so', () => {
  const list = addSubmission([], sub('a', 'p1', 200, '2026-08-18T10:00:00Z'));
  assert.equal(writingProgress(list, [evaluation('a', 6.0, 6.5)]).latestDelta, null);
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó hỏng**

Run: `npx tsx --test src/store/writing-history.test.ts`
Expected: FAIL — không tìm thấy module `./writing-history`.

- [ ] **Step 3: Viết phần tính toán thuần**

```ts
// src/store/writing-history.ts
import { averageBand, bandDelta } from '@/lib/band';
import type { WritingEvaluation, WritingSubmission } from '@/lib/writing/types';

/**
 * Phần tính toán của lịch sử Writing, tách khỏi zustand.
 *
 * Để riêng vì đây là chỗ dễ sai nhất (thứ tự, trùng bài, band null) mà lại là
 * chỗ duy nhất test được mà không phải dựng React.
 */

/** Danh sách luôn xếp mới nhất trước. Nộp lại cùng id thì thay, không nhân đôi. */
export function addSubmission(
  list: WritingSubmission[],
  submission: WritingSubmission,
): WritingSubmission[] {
  const rest = list.filter((s) => s.id !== submission.id);
  return [submission, ...rest].sort(
    (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
  );
}

export function submissionsForPrompt(
  list: WritingSubmission[],
  promptId: string,
): WritingSubmission[] {
  return list.filter((s) => s.promptId === promptId);
}

/**
 * Quy một khoảng band về một số để tính trung bình.
 *
 * Lấy điểm giữa chứ không lấy cận dưới: cận dưới làm mọi con số tiến độ thấp
 * hơn thực tế một cách hệ thống, mà người học nhìn tiến độ để biết mình có đi
 * lên hay không.
 */
function midpoint(e: WritingEvaluation): number {
  return (e.bandLow + e.bandHigh) / 2;
}

export function writingProgress(
  submissions: WritingSubmission[],
  evaluations: WritingEvaluation[],
): {
  totalSubmissions: number;
  totalWords: number;
  averageBand: number | null;
  latestDelta: number | null;
} {
  const byId = new Map(evaluations.map((e) => [e.submissionId, e]));

  // Theo thứ tự bài đã nộp (mới nhất trước) để `latestDelta` so đúng hai bài
  // liền kề gần nhất *có chấm*, chứ không phải hai bản chấm bất kỳ.
  const graded = submissions
    .map((s) => byId.get(s.id))
    .filter((e): e is WritingEvaluation => e != null)
    .map(midpoint);

  return {
    totalSubmissions: submissions.length,
    totalWords: submissions.reduce((sum, s) => sum + s.wordCount, 0),
    averageBand: averageBand(graded),
    latestDelta: graded.length >= 2 ? bandDelta(graded[0], graded[1]) : null,
  };
}
```

- [ ] **Step 4: Chạy lại test**

Run: `npx tsx --test src/store/writing-history.test.ts`
Expected: PASS 7/7.

- [ ] **Step 5: Viết store zustand**

```ts
// src/store/useWritingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { addSubmission, submissionsForPrompt, writingProgress } from './writing-history';
import { STORAGE_PREFIX, storage, uid } from './persist';
import { countWords } from '@/lib/writing/word-count';
import type {
  DrillPart,
  WritingEvaluation,
  WritingMode,
  WritingSubmission,
} from '@/lib/writing/types';

/**
 * Bài viết của người học: bản nháp đang gõ, bài đã nộp, và bản chấm.
 *
 * Lưu cục bộ vì dự án chưa có đăng nhập. Bản nháp lưu riêng theo đề để mở lại
 * đúng bài dở, và chỉ xoá khi nộp — đóng tab giữa chừng không được mất bài.
 */

type DraftKey = string;

type WritingState = {
  drafts: Record<DraftKey, { text: string; updatedAt: string }>;
  submissions: WritingSubmission[];
  evaluations: WritingEvaluation[];

  saveDraft: (promptId: string, drillPart: DrillPart | null, text: string) => void;
  getDraft: (promptId: string, drillPart: DrillPart | null) => string;
  clearDraft: (promptId: string, drillPart: DrillPart | null) => void;

  submit: (input: {
    promptId: string;
    mode: WritingMode;
    drillPart: DrillPart | null;
    bodyText: string;
    durationSeconds: number;
  }) => WritingSubmission;

  saveEvaluation: (evaluation: WritingEvaluation) => void;
};

const draftKey = (promptId: string, drillPart: DrillPart | null): DraftKey =>
  drillPart ? `${promptId}:${drillPart}` : promptId;

export const useWritingStore = create<WritingState>()(
  persist(
    (set, get) => ({
      drafts: {},
      submissions: [],
      evaluations: [],

      saveDraft: (promptId, drillPart, text) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [draftKey(promptId, drillPart)]: { text, updatedAt: new Date().toISOString() },
          },
        })),

      getDraft: (promptId, drillPart) =>
        get().drafts[draftKey(promptId, drillPart)]?.text ?? '',

      clearDraft: (promptId, drillPart) =>
        set((s) => {
          const next = { ...s.drafts };
          delete next[draftKey(promptId, drillPart)];
          return { drafts: next };
        }),

      submit: (input) => {
        const submission: WritingSubmission = {
          id: uid(),
          promptId: input.promptId,
          mode: input.mode,
          drillPart: input.drillPart,
          bodyText: input.bodyText,
          wordCount: countWords(input.bodyText),
          durationSeconds: input.durationSeconds,
          submittedAt: new Date().toISOString(),
        };
        set((s) => ({ submissions: addSubmission(s.submissions, submission) }));
        get().clearDraft(input.promptId, input.drillPart);
        return submission;
      },

      saveEvaluation: (evaluation) =>
        set((s) => ({
          evaluations: [
            evaluation,
            ...s.evaluations.filter((e) => e.submissionId !== evaluation.submissionId),
          ],
        })),
    }),
    { name: `${STORAGE_PREFIX}writing`, storage: storage() },
  ),
);

/** Chọn lọc dùng ở màn Progress và Dashboard. */
export const selectWritingProgress = (s: WritingState) =>
  writingProgress(s.submissions, s.evaluations);

export const selectSubmissionsForPrompt = (promptId: string) => (s: WritingState) =>
  submissionsForPrompt(s.submissions, promptId);
```

- [ ] **Step 6: Kiểm tra `persist.ts` có xuất đúng những thứ đang dùng**

Run: `grep -nE '^export' src/store/persist.ts`
Expected: thấy `STORAGE_PREFIX`, `storage`, `uid`. Nếu tên khác thì sửa import
trong `useWritingStore.ts` cho khớp, đừng đổi `persist.ts`.

- [ ] **Step 7: Chạy toàn bộ test và typecheck**

Run: `npm test && npm run typecheck`
Expected: toàn bộ test cũ vẫn xanh (127 test trước đó) cộng thêm test mới; typecheck sạch.

- [ ] **Step 8: Commit**

```bash
git add src/store/writing-history.ts src/store/writing-history.test.ts src/store/useWritingStore.ts
git commit -m "feat(writing): store luu ban nhap va bai da nop"
```

---

## Kiểm tra cuối lát 1

- [ ] `npm test` — toàn bộ xanh, có thêm khoảng 39 test mới.
- [ ] `npm run typecheck` — sạch.
- [ ] `git log --oneline` — thấy 5 commit của lát 1.
- [ ] Không file nào của lát này đụng vào luồng Reading đang có.

Xong lát 1 thì lát 2 (kho đề + bộ sinh đề Task 1 + trang `/write`) có đủ chỗ để cắm vào.
