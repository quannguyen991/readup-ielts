# Writing lát 2A — sinh kho đề Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sinh ra một kho đề Writing thật — đề Task 1 có dữ liệu biểu đồ đạt ràng buộc sư phạm, đề Task 2 phủ 5 dạng luận × 10 chủ đề — ghi xuống seed JSON để lát 2B có thứ để hiển thị.

**Architecture:** Ba bộ sinh thuần (không I/O, không AI) cộng một script ghi seed. Khoá phân tích của mỗi đề được **suy ra từ chính dữ liệu** chứ không viết tay, nên hai bên không thể lệch nhau. Bộ sinh dùng RNG có hạt cố định (`mulberry32` đã có trong dự án) để cùng một hạt luôn ra cùng một đề — chạy lại script không làm xáo trộn kho đề cũ.

**Tech Stack:** TypeScript thuần, `node:test` qua `tsx --test`, `src/services/questions/rng.ts` (đã có).

**Spec:** `docs/superpowers/specs/2026-08-19-writing-module-design.md`

## Global Constraints

- Chú thích trong code viết **tiếng Việt có dấu**, giải thích **vì sao**.
- Commit message viết **tiếng Việt không dấu**, dạng conventional commit.
- `tsconfig` bật `strict` + `noUncheckedIndexedAccess`: `arr[0]` có kiểu `T | undefined`.
- Test bằng `npm test`, typecheck bằng `npx tsc --noEmit`. Cả hai phải sạch trước mỗi commit.
- Không import `@/store/useWritingStore` từ file test — nó kéo theo react-native.
- Mọi `chartData` sinh ra **phải qua được `validateChartData`** trước khi ghi seed.
- Nội dung đề viết bằng **tiếng Anh**, vì đó là thứ người học đọc trong phòng thi.

---

### Task 1: Sửa `AnalysisKey` thành dữ liệu có cấu trúc

`AnalysisKey` tồn tại để chấm drill Overview mà không gọi AI: đối chiếu bài viết
**tiếng Anh** của người học với các ý mà đề bắt buộc phải nêu. Bản hiện tại là
mảng chuỗi tiếng Việt tự do (`"Country A tang lien tuc suot ky"`) — không đối
chiếu được với chữ tiếng Anh, và cũng không máy nào đọc được. Phải là dữ liệu có
trường rõ ràng thì mới so được `subject` với tên chuỗi trong bài và `direction`
với động từ xu hướng người học dùng.

**Files:**
- Modify: `src/lib/writing/types.ts`
- Modify: `src/lib/writing/chart-data.ts`
- Modify: `src/lib/writing/chart-data.test.ts`
- Modify: `src/data/seed/writing/index.json`

**Interfaces:**
- Produces: `TrendDirection`, `TrendMagnitude`, `TrendFact`, `ExtremeFact`, `CrossingFact`, và `AnalysisKey` phiên bản mới

- [ ] **Step 1: Thay định nghĩa `AnalysisKey` trong `types.ts`**

Thay nguyên khối `export type AnalysisKey = {...}` bằng:

```ts
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
```

- [ ] **Step 2: Sửa `checkAnalysisKey` trong `chart-data.ts`**

Thay nguyên hàm `checkAnalysisKey` bằng:

```ts
const DIRECTIONS = new Set(['up', 'down', 'stable', 'fluctuating']);

function checkAnalysisKey(key: unknown): string | null {
  if (!isRecord(key)) return 'Thiếu analysisKey.';

  for (const field of ['trends', 'extremes', 'crossings'] as const) {
    if (!Array.isArray(key[field])) return `analysisKey.${field} phải là mảng.`;
  }

  const trends = key.trends as unknown[];
  if (trends.length === 0) {
    return 'analysisKey.trends rỗng — đề không có xu hướng nào để mô tả.';
  }
  for (const t of trends) {
    if (!isRecord(t) || typeof t.subject !== 'string' || t.subject.trim() === '') {
      return 'Có phần tử trong analysisKey.trends thiếu subject.';
    }
    if (typeof t.direction !== 'string' || !DIRECTIONS.has(t.direction)) {
      return `Xu hướng của "${String(t.subject)}" có direction không hợp lệ.`;
    }
  }

  for (const e of key.extremes as unknown[]) {
    if (!isRecord(e) || typeof e.subject !== 'string') {
      return 'Có phần tử trong analysisKey.extremes thiếu subject.';
    }
    if (e.rank !== 'highest' && e.rank !== 'lowest') {
      return `Cực trị của "${String(e.subject)}" có rank không hợp lệ.`;
    }
  }

  const grouping = key.grouping;
  if (!Array.isArray(grouping) || grouping.length !== 2) {
    return 'analysisKey.grouping phải có đúng hai nhóm, vì hai nhóm là hai đoạn thân bài.';
  }
  if (!grouping.every((g) => Array.isArray(g) && g.length > 0)) {
    return 'analysisKey.grouping có nhóm rỗng.';
  }
  return null;
}
```

- [ ] **Step 3: Sửa hằng `KEY` trong `chart-data.test.ts` và thêm test cho khoá mới**

Thay khối `const KEY: AnalysisKey = {...}` bằng:

```ts
const KEY: AnalysisKey = {
  trends: [{ subject: 'A', direction: 'up', magnitude: 'large', from: 45, to: 68 }],
  extremes: [{ subject: 'A', rank: 'highest', at: 'throughout' }],
  crossings: [],
  grouping: [['A'], ['B']],
};
```

Thêm hai test vào cuối file:

```ts
test('xu hướng thiếu subject thì không qua', () => {
  const r = validateChartData({
    ...line,
    analysisKey: { ...KEY, trends: [{ direction: 'up', magnitude: 'large', from: 1, to: 2 }] },
  });
  assert.equal(r.ok, false);
  assert.match(r.ok === false ? r.reason : '', /subject/);
});

test('direction lạ thì không qua', () => {
  const r = validateChartData({
    ...line,
    analysisKey: { ...KEY, trends: [{ ...KEY.trends[0], direction: 'sideways' }] },
  });
  assert.equal(r.ok, false);
  assert.match(r.ok === false ? r.reason : '', /direction/);
});
```

- [ ] **Step 4: Sửa `analysisKey` của đề mẫu trong seed**

Trong `src/data/seed/writing/index.json`, thay khối `analysisKey` của
`w-t1-line-petrol-001` bằng:

```json
"analysisKey": {
  "trends": [
    { "subject": "Country A", "direction": "up", "magnitude": "large", "from": 45, "to": 155 },
    { "subject": "Country B", "direction": "stable", "magnitude": "small", "from": 60, "to": 70 },
    { "subject": "Country C", "direction": "down", "magnitude": "large", "from": 95, "to": 40 }
  ],
  "extremes": [
    { "subject": "Country C", "rank": "highest", "at": "2000" },
    { "subject": "Country A", "rank": "lowest", "at": "2000" },
    { "subject": "Country A", "rank": "highest", "at": "2020" },
    { "subject": "Country C", "rank": "lowest", "at": "2020" }
  ],
  "crossings": [
    { "subject": "Country A", "other": "Country C", "nearLabel": "2010" },
    { "subject": "Country A", "other": "Country B", "nearLabel": "2005" }
  ],
  "grouping": [["Country A", "Country C"], ["Country B"]]
}
```

- [ ] **Step 5: Chạy test và typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: toàn bộ xanh. Test `mọi đề Task 1 đều có chartData hợp lệ` trong
`writing-repository.test.ts` là chỗ bắt được nếu seed sửa sai.

- [ ] **Step 6: Commit**

```bash
git add src/lib/writing/types.ts src/lib/writing/chart-data.ts src/lib/writing/chart-data.test.ts src/data/seed/writing/index.json
git commit -m "refactor(writing): analysisKey thanh du lieu co cau truc"
```

---

### Task 2: Suy khoá phân tích từ dữ liệu biểu đồ

**Files:**
- Create: `src/services/writing/analysis-key.ts`
- Test: `src/services/writing/analysis-key.test.ts`

**Interfaces:**
- Consumes: `LineOrBarChart`, `AnalysisKey`, `TrendFact`, `ExtremeFact`, `CrossingFact` từ `@/lib/writing/types`
- Produces: `deriveAnalysisKey(chart: LineOrBarChart): AnalysisKey`

- [ ] **Step 1: Viết test thất bại**

```ts
// src/services/writing/analysis-key.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { deriveAnalysisKey } from './analysis-key';
import type { LineOrBarChart } from '@/lib/writing/types';

function chart(series: Array<{ name: string; values: number[] }>): LineOrBarChart {
  return {
    kind: 'line',
    title: 'T',
    unit: 'u',
    xLabels: ['2000', '2010', '2020'],
    series,
    // deriveAnalysisKey không đọc trường này, nhưng kiểu bắt phải có.
    analysisKey: { trends: [], extremes: [], crossings: [], grouping: [[], []] },
  };
}

test('nhận ra chiều tăng, giảm và đứng yên', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'Up', values: [10, 50, 90] },
      { name: 'Down', values: [90, 50, 10] },
      { name: 'Flat', values: [50, 51, 50] },
    ]),
  );
  const dir = (name: string) => key.trends.find((t) => t.subject === name)?.direction;
  assert.equal(dir('Up'), 'up');
  assert.equal(dir('Down'), 'down');
  assert.equal(dir('Flat'), 'stable');
});

test('đường lên rồi xuống được xếp là dao động, không phải tăng', () => {
  const key = deriveAnalysisKey(chart([{ name: 'Wave', values: [10, 90, 12] }]));
  assert.equal(key.trends[0]?.direction, 'fluctuating');
});

test('mức thay đổi tính theo tỷ lệ so với đầu kỳ', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'Big', values: [10, 50, 100] },
      { name: 'Small', values: [100, 102, 105] },
    ]),
  );
  assert.equal(key.trends.find((t) => t.subject === 'Big')?.magnitude, 'large');
  assert.equal(key.trends.find((t) => t.subject === 'Small')?.magnitude, 'small');
});

test('from và to lấy đúng giá trị đầu và cuối kỳ', () => {
  const key = deriveAnalysisKey(chart([{ name: 'A', values: [45, 95, 155] }]));
  assert.equal(key.trends[0]?.from, 45);
  assert.equal(key.trends[0]?.to, 155);
});

test('cực trị ghi cả đầu kỳ và cuối kỳ', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'A', values: [10, 50, 90] },
      { name: 'B', values: [90, 50, 10] },
    ]),
  );
  const at = (label: string, rank: 'highest' | 'lowest') =>
    key.extremes.find((e) => e.at === label && e.rank === rank)?.subject;
  assert.equal(at('2000', 'highest'), 'B');
  assert.equal(at('2000', 'lowest'), 'A');
  assert.equal(at('2020', 'highest'), 'A');
  assert.equal(at('2020', 'lowest'), 'B');
});

test('giữ hạng nhất suốt kỳ thì ghi throughout thay vì ghi hai lần', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'Top', values: [90, 92, 95] },
      { name: 'Low', values: [10, 12, 15] },
    ]),
  );
  assert.ok(key.extremes.some((e) => e.subject === 'Top' && e.rank === 'highest' && e.at === 'throughout'));
  assert.ok(key.extremes.some((e) => e.subject === 'Low' && e.rank === 'lowest' && e.at === 'throughout'));
  assert.equal(key.extremes.filter((e) => e.subject === 'Top').length, 1);
});

test('tìm được chỗ hai đường cắt nhau', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'A', values: [10, 50, 90] },
      { name: 'B', values: [90, 50, 10] },
    ]),
  );
  assert.equal(key.crossings.length, 1);
  const c = key.crossings[0];
  assert.ok(c);
  assert.deepEqual([c.subject, c.other].sort(), ['A', 'B']);
});

test('hai đường song song thì không có giao cắt nào', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'A', values: [10, 20, 30] },
      { name: 'B', values: [50, 60, 70] },
    ]),
  );
  assert.equal(key.crossings.length, 0);
});

test('nhóm theo chiều xu hướng khi có cả tăng lẫn giảm', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'U1', values: [10, 50, 90] },
      { name: 'U2', values: [20, 40, 80] },
      { name: 'D1', values: [90, 50, 10] },
    ]),
  );
  assert.deepEqual(key.grouping[0].sort(), ['U1', 'U2']);
  assert.deepEqual(key.grouping[1], ['D1']);
});

test('mọi chuỗi cùng chiều thì nhóm theo mức thay đổi, không để một nhóm rỗng', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'Fast', values: [10, 60, 120] },
      { name: 'Slow', values: [100, 103, 106] },
      { name: 'Mid', values: [50, 70, 95] },
    ]),
  );
  assert.ok(key.grouping[0].length > 0);
  assert.ok(key.grouping[1].length > 0);
  assert.equal(key.grouping[0].length + key.grouping[1].length, 3);
});

test('một chuỗi duy nhất vẫn phải ra hai nhóm không rỗng thì mới hợp lệ — nên báo bằng ngoại lệ', () => {
  // Đề một chuỗi không chia được hai đoạn thân bài. Bộ sinh không được phép tạo
  // ra đề như vậy, nên ở đây ném lỗi để lộ ngay lúc sinh chứ không lặng lẽ ra
  // grouping rỗng rồi bị validateChartData chặn ở tận cuối.
  assert.throws(() => deriveAnalysisKey(chart([{ name: 'Only', values: [1, 2, 3] }])), /hai nhóm/);
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó hỏng**

Run: `npx tsx --test src/services/writing/analysis-key.test.ts`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết bản cài đặt**

```ts
// src/services/writing/analysis-key.ts
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
 * không có gì báo. Suy ra từ dữ liệu thì hai bên không thể lệch.
 */

/** Dưới ngưỡng này coi như đứng yên — dao động 5% là nhiễu, không phải xu hướng. */
const STABLE_RATIO = 0.05;
/** Từ ngưỡng này trở lên coi là thay đổi lớn. */
const LARGE_RATIO = 0.4;
/**
 * Một chuỗi bị coi là dao động khi nó đảo chiều đủ mạnh giữa chừng: đỉnh (hoặc
 * đáy) giữa kỳ lệch khỏi cả hai đầu quá ngưỡng này so với biên độ chung.
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
  const span = Math.max(max - min, 1e-9);

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
 * Chỉ so dấu hiệu ở hai đầu mỗi khoảng, không giải phương trình: cái cần cho
 * người học là "hai đường này có cắt nhau, quanh mốc nào", không phải toạ độ
 * chính xác của giao điểm.
 */
function findCrossings(chart: LineOrBarChart): CrossingFact[] {
  const out: CrossingFact[] = [];

  for (let i = 0; i < chart.series.length; i += 1) {
    for (let j = i + 1; j < chart.series.length; j += 1) {
      const a = chart.series[i];
      const b = chart.series[j];
      if (!a || !b) continue;

      for (let k = 0; k + 1 < chart.xLabels.length; k += 1) {
        const d1 = (a.values[k] ?? 0) - (b.values[k] ?? 0);
        const d2 = (a.values[k + 1] ?? 0) - (b.values[k + 1] ?? 0);
        if (d1 === 0 || d1 * d2 >= 0) continue;

        // Mốc nào gần giao điểm hơn thì lấy mốc đó làm nhãn.
        const nearer = Math.abs(d1) <= Math.abs(d2) ? k : k + 1;
        out.push({
          subject: a.name,
          other: b.name,
          nearLabel: chart.xLabels[nearer] ?? '',
        });
        break; // Một cặp chỉ ghi một lần, dù cắt nhau nhiều lần.
      }
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
  return [
    sorted.slice(0, half).map((t) => t.subject),
    sorted.slice(half).map((t) => t.subject),
  ];
}

function ratio(t: TrendFact): number {
  return Math.abs(t.to - t.from) / Math.max(Math.abs(t.from), 1);
}
```

- [ ] **Step 4: Chạy test và typecheck**

Run: `npx tsx --test src/services/writing/analysis-key.test.ts && npx tsc --noEmit`
Expected: PASS 11/11, typecheck sạch.

- [ ] **Step 5: Commit**

```bash
git add src/services/writing/analysis-key.ts src/services/writing/analysis-key.test.ts
git commit -m "feat(writing): suy khoa phan tich tu du lieu bieu do"
```

---

### Task 3: Bộ sinh dữ liệu biểu đồ Task 1

**Files:**
- Create: `src/services/writing/chart-generator.ts`
- Test: `src/services/writing/chart-generator.test.ts`

**Interfaces:**
- Consumes: `deriveAnalysisKey` (Task 2); `mulberry32`, `hashString` từ `@/services/questions/rng`; `validateChartData` từ `@/lib/writing/chart-data`
- Produces:
  - `type ChartTopic = { slug: string; title: string; unit: string; subjects: string[]; labels: string[] }`
  - `CHART_TOPICS: ChartTopic[]`
  - `generateLineChart(topic: ChartTopic, seed: string): LineOrBarChart`
  - `generateBarChart(topic: ChartTopic, seed: string): LineOrBarChart`
  - `generatePieChart(topic: ChartTopic, seed: string): PieChart`
  - `generateTableChart(topic: ChartTopic, seed: string): TableChart`

- [ ] **Step 1: Viết test thất bại**

```ts
// src/services/writing/chart-generator.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CHART_TOPICS,
  generateBarChart,
  generateLineChart,
  generatePieChart,
  generateTableChart,
} from './chart-generator';
import { validateChartData } from '@/lib/writing/chart-data';

/** Mỗi chủ đề × 6 hạt = đủ mẫu để bắt lỗi chỉ xuất hiện với một số hạt. */
const SEEDS = ['s0', 's1', 's2', 's3', 's4', 's5'];
const CASES = CHART_TOPICS.flatMap((topic) => SEEDS.map((seed) => ({ topic, seed })));

test('có ít nhất năm chủ đề để kho đề không nhàm', () => {
  assert.ok(CHART_TOPICS.length >= 5);
});

test('mọi biểu đồ đường sinh ra đều qua được bộ kiểm định', () => {
  for (const { topic, seed } of CASES) {
    const r = validateChartData(generateLineChart(topic, seed));
    assert.equal(r.ok, true, `${topic.slug}/${seed}: ${r.ok === false ? r.reason : ''}`);
  }
});

test('mọi biểu đồ đường đều có ít nhất một cặp đường cắt nhau', () => {
  // Đề không có giao cắt thì mất hẳn ý overview mạnh nhất (đổi ngôi).
  for (const { topic, seed } of CASES) {
    const chart = generateLineChart(topic, seed);
    assert.ok(
      chart.analysisKey.crossings.length >= 1,
      `${topic.slug}/${seed} không có giao cắt nào`,
    );
  }
});

test('biểu đồ cột không có trục thời gian thì có cực trị rõ rệt', () => {
  for (const { topic, seed } of CASES) {
    const chart = generateBarChart(topic, seed);
    const r = validateChartData(chart);
    assert.equal(r.ok, true, `${topic.slug}/${seed}: ${r.ok === false ? r.reason : ''}`);

    const all = chart.series.flatMap((s) => s.values);
    const max = Math.max(...all);
    const min = Math.min(...all);
    // Cao nhất phải hơn thấp nhất ít nhất gấp rưỡi thì mới đáng so sánh.
    assert.ok(max >= min * 1.5, `${topic.slug}/${seed}: chênh lệch quá nhạt`);
  }
});

test('biểu đồ tròn hai hình luôn có đổi ngôi giữa hai mốc', () => {
  for (const { topic, seed } of CASES) {
    const chart = generatePieChart(topic, seed);
    const r = validateChartData(chart);
    assert.equal(r.ok, true, `${topic.slug}/${seed}: ${r.ok === false ? r.reason : ''}`);
    assert.equal(chart.pies.length, 2);

    const rank = (i: number) =>
      [...(chart.pies[i]?.slices ?? [])].sort((a, b) => b.value - a.value).map((s) => s.label);
    assert.notDeepEqual(rank(0), rank(1), `${topic.slug}/${seed}: thứ hạng không đổi`);
  }
});

test('mỗi hình tròn có tổng đúng 100', () => {
  for (const { topic, seed } of CASES) {
    for (const pie of generatePieChart(topic, seed).pies) {
      const total = pie.slices.reduce((s, x) => s + x.value, 0);
      assert.equal(total, 100, `${topic.slug}/${seed}/${pie.caption} tổng ${total}`);
    }
  }
});

test('bảng đọc ngang và đọc dọc cho hai kết luận khác nhau', () => {
  for (const { topic, seed } of CASES) {
    const chart = generateTableChart(topic, seed);
    const r = validateChartData(chart);
    assert.equal(r.ok, true, `${topic.slug}/${seed}: ${r.ok === false ? r.reason : ''}`);

    // Đọc ngang: phải có hàng tăng và hàng giảm.
    const dirs = chart.rows.map((row) => {
      const nums = row.slice(1).map(Number);
      return Math.sign((nums[nums.length - 1] ?? 0) - (nums[0] ?? 0));
    });
    assert.ok(dirs.includes(1) && dirs.includes(-1), `${topic.slug}/${seed}: mọi hàng cùng chiều`);

    // Đọc dọc: hạng nhất ở cột đầu và cột cuối phải khác nhau.
    const top = (col: number) =>
      chart.rows.reduce((best, row) =>
        Number(row[col] ?? 0) > Number(best[col] ?? 0) ? row : best,
      )[0];
    assert.notEqual(top(1), top(chart.headers.length - 1), `${topic.slug}/${seed}: hạng nhất không đổi`);
  }
});

test('cùng một hạt luôn ra cùng một biểu đồ', () => {
  const topic = CHART_TOPICS[0];
  assert.ok(topic);
  assert.deepEqual(generateLineChart(topic, 'x'), generateLineChart(topic, 'x'));
  assert.notDeepEqual(generateLineChart(topic, 'x'), generateLineChart(topic, 'y'));
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó hỏng**

Run: `npx tsx --test src/services/writing/chart-generator.test.ts`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết bản cài đặt**

Điểm khó duy nhất: ràng buộc sư phạm phải **đúng theo cấu trúc**, không phải
sinh ngẫu nhiên rồi thử lại tới khi may mắn đạt. Cách làm: dựng số liệu từ hình
dạng đã biết là đạt ràng buộc, rồi mới cho RNG rung nhẹ trong biên độ không phá
được hình dạng đó.

```ts
// src/services/writing/chart-generator.ts
import { deriveAnalysisKey } from './analysis-key';
import type { LineOrBarChart, PieChart, TableChart } from '@/lib/writing/types';
import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * Bộ sinh dữ liệu biểu đồ cho đề Task 1.
 *
 * Ràng buộc sư phạm được bảo đảm bằng CẤU TRÚC chứ không bằng thử lại: số liệu
 * dựng từ một hình dạng đã biết là đạt (ví dụ hai đường đi ngược chiều nhau thì
 * chắc chắn cắt nhau), rồi RNG chỉ rung trong biên độ không phá được hình dạng
 * ấy. Sinh ngẫu nhiên rồi lọc thì có hạt sẽ không bao giờ ra được đề hợp lệ, và
 * lỗi đó chỉ lộ khi chạy thật.
 */

export type ChartTopic = {
  slug: string;
  title: string;
  unit: string;
  /** Tên các đối tượng so sánh. Cần ít nhất 4 để dùng được cho cả pie và table. */
  subjects: string[];
  /** Nhãn trục X cho line/table. Bar không trục thời gian dùng `subjects`. */
  labels: string[];
};

export const CHART_TOPICS: ChartTopic[] = [
  {
    slug: 'environment',
    title: 'Average price of petrol in three countries',
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
    title: 'Sales of three types of beverage',
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

/** Rung một giá trị trong khoảng ±pct, làm tròn về số nguyên. */
function jitter(rng: () => number, value: number, pct: number): number {
  return Math.max(1, Math.round(value * (1 + (rng() * 2 - 1) * pct)));
}

/**
 * Biểu đồ đường: một chuỗi đi lên, một chuỗi đi xuống, bắt chéo nhau ở giữa.
 * Hình dạng này bảo đảm luôn có giao cắt.
 */
export function generateLineChart(topic: ChartTopic, seed: string): LineOrBarChart {
  const rng = mulberry32(hashString(`${topic.slug}:line:${seed}`));
  const labels = topic.labels;
  const n = labels.length;

  const low = 20 + Math.floor(rng() * 20);
  const high = low * (4 + Math.floor(rng() * 3));

  const rising = Array.from({ length: n }, (_, i) =>
    jitter(rng, low + ((high - low) * i) / (n - 1), 0.06),
  );
  const falling = Array.from({ length: n }, (_, i) =>
    jitter(rng, high - ((high - low) * i) / (n - 1), 0.06),
  );
  // Chuỗi thứ ba đi ngang ở giữa dải, để có nhóm "ổn định" tương phản.
  const mid = Math.round((low + high) / 2);
  const flat = Array.from({ length: n }, () => jitter(rng, mid, 0.05));

  const series = [
    { name: topic.subjects[0] ?? 'A', values: rising },
    { name: topic.subjects[1] ?? 'B', values: falling },
    { name: topic.subjects[2] ?? 'C', values: flat },
  ];

  const chart: LineOrBarChart = {
    kind: 'line',
    title: `${topic.title}, ${labels[0]}-${labels[n - 1]}`,
    unit: topic.unit,
    xLabels: labels,
    series,
    analysisKey: { trends: [], extremes: [], crossings: [], grouping: [[], []] },
  };
  return { ...chart, analysisKey: deriveAnalysisKey(chart) };
}

/**
 * Biểu đồ cột không có trục thời gian: so sánh các đối tượng ở hai nhóm.
 * Bảo đảm cực trị rõ bằng cách ép giá trị lớn nhất gấp ít nhất đôi nhỏ nhất.
 */
export function generateBarChart(topic: ChartTopic, seed: string): LineOrBarChart {
  const rng = mulberry32(hashString(`${topic.slug}:bar:${seed}`));
  const subjects = topic.subjects.slice(0, 4);

  const base = 10 + Math.floor(rng() * 10);
  // Bậc thang nhân 1.6 mỗi nấc: cao nhất luôn hơn thấp nhất trên bốn lần.
  const groupA = subjects.map((_, i) => jitter(rng, base * Math.pow(1.6, i), 0.08));
  const groupB = subjects.map((_, i) => jitter(rng, base * Math.pow(1.6, 3 - i), 0.08));

  const chart: LineOrBarChart = {
    kind: 'bar',
    title: topic.title,
    unit: topic.unit,
    xLabels: subjects,
    series: [
      { name: 'Group 1', values: groupA },
      { name: 'Group 2', values: groupB },
    ],
    analysisKey: { trends: [], extremes: [], crossings: [], grouping: [[], []] },
  };
  return { ...chart, analysisKey: deriveAnalysisKey(chart) };
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

  const chart: PieChart = {
    kind: 'pie',
    title: topic.title,
    unit: '%',
    pies: [
      { caption: topic.labels[0] ?? 'Before', slices: labels.map((l, i) => ({ label: l, value: first[i] ?? 0 })) },
      {
        caption: topic.labels[topic.labels.length - 1] ?? 'After',
        slices: labels.map((l, i) => ({ label: l, value: second[i] ?? 0 })),
      },
    ],
    analysisKey: { trends: [], extremes: [], crossings: [], grouping: [[], []] },
  };

  // Pie không có trục thời gian liên tục nên mượn khoá của một biểu đồ đường
  // hai mốc tương đương: mỗi lát là một chuỗi đi từ giá trị hình 1 sang hình 2.
  const asLine: LineOrBarChart = {
    kind: 'line',
    title: chart.title,
    unit: '%',
    xLabels: [chart.pies[0]?.caption ?? '', chart.pies[1]?.caption ?? ''],
    series: labels.map((l, i) => ({ name: l, values: [first[i] ?? 0, second[i] ?? 0] })),
    analysisKey: { trends: [], extremes: [], crossings: [], grouping: [[], []] },
  };
  return { ...chart, analysisKey: deriveAnalysisKey(asLine) };
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
    // thúc cao nhất, hàng 1 thì ngược lại — đó là chỗ đổi ngôi khi đọc dọc.
    const goesUp = index % 2 === 0;
    const values = labels.map((_, i) => {
      const t = i / (labels.length - 1);
      const raw = goesUp ? low + (high - low) * t : high - (high - low) * t;
      // Hàng thứ ba trở đi thu hẹp biên độ để không tranh mất ngôi của hai hàng đầu.
      const damp = index < 2 ? 1 : 0.5;
      return jitter(rng, low + (raw - low) * damp, 0.06);
    });
    return [name, ...values] as Array<string | number>;
  });

  const chart: TableChart = {
    kind: 'table',
    title: topic.title,
    unit: topic.unit,
    headers: ['', ...labels],
    rows,
    analysisKey: { trends: [], extremes: [], crossings: [], grouping: [[], []] },
  };

  const asLine: LineOrBarChart = {
    kind: 'line',
    title: chart.title,
    unit: topic.unit,
    xLabels: labels,
    series: rows.map((row) => ({
      name: String(row[0]),
      values: row.slice(1).map(Number),
    })),
    analysisKey: { trends: [], extremes: [], crossings: [], grouping: [[], []] },
  };
  return { ...chart, analysisKey: deriveAnalysisKey(asLine) };
}
```

- [ ] **Step 4: Chạy test**

Run: `npx tsx --test src/services/writing/chart-generator.test.ts`
Expected: PASS 8/8.

Nếu test ràng buộc sư phạm đỏ ở một vài hạt, **đừng nới lỏng test** — sửa công
thức dựng số liệu cho đúng cấu trúc. Test đó chính là thứ giữ cho kho đề không
nhàm.

- [ ] **Step 5: Typecheck và commit**

```bash
npx tsc --noEmit
git add src/services/writing/chart-generator.ts src/services/writing/chart-generator.test.ts
git commit -m "feat(writing): bo sinh du lieu bieu do Task 1"
```

---

### Task 4: Bộ sinh đề Task 2 và script ghi seed

**Files:**
- Create: `src/services/writing/task2-generator.ts`
- Test: `src/services/writing/task2-generator.test.ts`
- Create: `scripts/generate-writing-prompts.ts`
- Modify: `package.json` (thêm script `writing:prompts`)
- Modify: `src/data/seed/writing/index.json` (do script ghi đè)

**Interfaces:**
- Consumes: các bộ sinh ở Task 3; `WritingPrompt`, `Task2Essay` từ `@/lib/writing/types`
- Produces:
  - `TASK2_THEMES: Array<{ topicSlug: string; noun: string; context: string }>`
  - `generateTask2Prompts(): WritingPrompt[]`
  - `generateTask1Prompts(): WritingPrompt[]`

- [ ] **Step 1: Viết test thất bại**

```ts
// src/services/writing/task2-generator.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { generateTask1Prompts, generateTask2Prompts } from './task2-generator';
import { validateChartData } from '@/lib/writing/chart-data';

const ESSAY_KINDS = [
  'opinion',
  'discussion',
  'advantage_disadvantage',
  'problem_solution',
  'two_part',
];

test('sinh đủ năm dạng luận', () => {
  const kinds = new Set(generateTask2Prompts().map((p) => p.essayKind));
  for (const k of ESSAY_KINDS) assert.ok(kinds.has(k as never), `thiếu dạng ${k}`);
});

test('kho đề Task 2 đủ lớn để không lặp lại trong 45 ngày', () => {
  assert.ok(generateTask2Prompts().length >= 30);
});

test('mọi đề Task 2 đúng hình dạng của Task 2', () => {
  for (const p of generateTask2Prompts()) {
    assert.equal(p.task, 'ielts_task2');
    assert.equal(p.chartKind, null);
    assert.equal(p.chartData, null);
    assert.ok(p.essayKind);
    assert.equal(p.minWords, 250);
    assert.equal(p.timeLimitSeconds, 2400);
    assert.ok(p.promptText.length > 40, `đề quá ngắn: ${p.id}`);
  }
});

test('câu lệnh đề khớp dạng luận', () => {
  for (const p of generateTask2Prompts()) {
    const text = p.promptText.toLowerCase();
    if (p.essayKind === 'discussion') assert.match(text, /discuss both/);
    if (p.essayKind === 'advantage_disadvantage') assert.match(text, /advantages|disadvantages/);
    if (p.essayKind === 'problem_solution') assert.match(text, /problems|solutions|causes/);
    if (p.essayKind === 'opinion') assert.match(text, /agree or disagree|to what extent/);
  }
});

test('mọi đề Task 1 đúng hình dạng và có chartData hợp lệ', () => {
  const prompts = generateTask1Prompts();
  assert.ok(prompts.length >= 20);
  for (const p of prompts) {
    assert.equal(p.task, 'ielts_task1');
    assert.equal(p.essayKind, null);
    assert.ok(p.chartKind);
    assert.equal(p.minWords, 150);
    assert.equal(p.timeLimitSeconds, 1200);
    const r = validateChartData(p.chartData);
    assert.equal(r.ok, true, `${p.id}: ${r.ok === false ? r.reason : ''}`);
  }
});

test('id không trùng nhau trên toàn kho', () => {
  const ids = [...generateTask1Prompts(), ...generateTask2Prompts()].map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('chạy hai lần ra kết quả giống hệt', () => {
  assert.deepEqual(generateTask1Prompts(), generateTask1Prompts());
  assert.deepEqual(generateTask2Prompts(), generateTask2Prompts());
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó hỏng**

Run: `npx tsx --test src/services/writing/task2-generator.test.ts`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết bộ sinh**

```ts
// src/services/writing/task2-generator.ts
import {
  CHART_TOPICS,
  generateBarChart,
  generateLineChart,
  generatePieChart,
  generateTableChart,
} from './chart-generator';
import type { Task1Chart, Task2Essay, WritingPrompt } from '@/lib/writing/types';

/**
 * Bộ sinh đề.
 *
 * Đề IELTS là dữ kiện chứ không phải tác phẩm: cùng một dạng luận ghép với một
 * chủ đề thì ra một đề hợp lệ. Nên sinh theo công thức là đủ, và tránh hẳn
 * chuyện cào nguyên văn đề của bên khác.
 *
 * Không dùng RNG ở đây: danh sách chủ đề × dạng luận đã cố định, nên thứ tự đề
 * cũng cố định. Chạy lại script không xáo trộn kho đề cũ, và người học không
 * thấy đề tự nhiên đổi chỗ.
 */

type Theme = {
  topicSlug: string;
  /** Cụm danh từ đứng làm chủ đề của câu lệnh. */
  subject: string;
  /** Vế bổ sung, dùng cho dạng cần hai mặt đối lập. */
  counterpoint: string;
};

export const TASK2_THEMES: Theme[] = [
  { topicSlug: 'environment', subject: 'reducing plastic waste', counterpoint: 'investing in cleaner energy' },
  { topicSlug: 'environment', subject: 'protecting endangered species', counterpoint: 'developing new farmland' },
  { topicSlug: 'technology', subject: 'working from home', counterpoint: 'working in an office' },
  { topicSlug: 'technology', subject: 'children using smartphones', counterpoint: 'children playing outdoors' },
  { topicSlug: 'education', subject: 'studying abroad', counterpoint: 'studying in one’s own country' },
  { topicSlug: 'education', subject: 'learning a second language at primary school', counterpoint: 'starting at secondary school' },
  { topicSlug: 'health', subject: 'taxing sugary drinks', counterpoint: 'educating people about diet' },
  { topicSlug: 'health', subject: 'building more public sports facilities', counterpoint: 'funding hospitals' },
  { topicSlug: 'business', subject: 'starting a business at a young age', counterpoint: 'gaining experience first' },
  { topicSlug: 'society', subject: 'living in a city', counterpoint: 'living in the countryside' },
  { topicSlug: 'society', subject: 'spending public money on the arts', counterpoint: 'spending it on public transport' },
  { topicSlug: 'science', subject: 'funding space exploration', counterpoint: 'solving problems on Earth' },
];

const TEMPLATES: Record<Task2Essay, (t: Theme) => string> = {
  opinion: (t) =>
    `Some people believe that ${t.subject} is the most effective way to improve modern life. To what extent do you agree or disagree?`,
  discussion: (t) =>
    `Some people think that ${t.subject} should be a priority, while others believe that ${t.counterpoint} matters more. Discuss both views and give your own opinion.`,
  advantage_disadvantage: (t) =>
    `In many countries, ${t.subject} has become increasingly common. Do the advantages of this development outweigh the disadvantages?`,
  problem_solution: (t) =>
    `Despite growing awareness, ${t.subject} remains difficult to achieve. What are the main causes of this, and what solutions can you suggest?`,
  two_part: (t) =>
    `Today more people are choosing ${t.subject} rather than ${t.counterpoint}. Why is this happening, and is it a positive or a negative development?`,
};

const ESSAY_KINDS = Object.keys(TEMPLATES) as Task2Essay[];

/** Band gợi ý xoay vòng để kho đề có cả đề dễ lẫn đề khó. */
const BANDS = [6.0, 6.5, 7.0];

export function generateTask2Prompts(): WritingPrompt[] {
  const out: WritingPrompt[] = [];

  TASK2_THEMES.forEach((theme, themeIndex) => {
    ESSAY_KINDS.forEach((kind, kindIndex) => {
      // Mỗi chủ đề chỉ lấy 3 trong 5 dạng, lệch nhau theo chủ đề — lấy đủ 5 thì
      // 5 đề cùng một chủ đề đọc lên rất giống nhau.
      if ((kindIndex + themeIndex) % 5 >= 3) return;

      out.push({
        id: `w-t2-${theme.topicSlug}-${themeIndex}-${kind}`,
        task: 'ielts_task2',
        promptText: TEMPLATES[kind](theme),
        chartKind: null,
        chartData: null,
        essayKind: kind,
        topicSlug: theme.topicSlug,
        difficultyBand: BANDS[(themeIndex + kindIndex) % BANDS.length] ?? 6.5,
        timeLimitSeconds: 2400,
        minWords: 250,
        source: 'generated',
      });
    });
  });

  return out;
}

/** Câu lệnh chuẩn của Task 1, khác nhau theo loại hình. */
const TASK1_LEAD: Record<Task1Chart, string> = {
  line: 'The line graph below shows',
  bar: 'The bar chart below shows',
  pie: 'The pie charts below show',
  table: 'The table below shows',
  mixed: 'The charts below show',
  process: 'The diagram below shows',
  map: 'The maps below show',
};

const TASK1_KINDS: Task1Chart[] = ['line', 'bar', 'pie', 'table'];

export function generateTask1Prompts(): WritingPrompt[] {
  const out: WritingPrompt[] = [];

  CHART_TOPICS.forEach((topic, topicIndex) => {
    TASK1_KINDS.forEach((kind, kindIndex) => {
      const seed = `v1-${topicIndex}`;
      const chartData =
        kind === 'line'
          ? generateLineChart(topic, seed)
          : kind === 'bar'
            ? generateBarChart(topic, seed)
            : kind === 'pie'
              ? generatePieChart(topic, seed)
              : generateTableChart(topic, seed);

      out.push({
        id: `w-t1-${topic.slug}-${kind}-${topicIndex}`,
        task: 'ielts_task1',
        promptText: `${TASK1_LEAD[kind]} ${lowerFirst(chartData.title)}.`,
        chartKind: kind,
        chartData,
        essayKind: null,
        topicSlug: topic.slug,
        difficultyBand: BANDS[(topicIndex + kindIndex) % BANDS.length] ?? 6.5,
        timeLimitSeconds: 1200,
        minWords: 150,
        source: 'generated',
      });
    });
  });

  return out;
}

function lowerFirst(s: string): string {
  return s.length === 0 ? s : s[0]!.toLowerCase() + s.slice(1);
}
```

Lưu ý: `s[0]!` là chỗ duy nhất trong lát này dùng dấu `!`, và đã có `s.length === 0`
chặn trước nên an toàn. Nếu muốn tránh hẳn thì dùng `s.charAt(0)`.

- [ ] **Step 4: Chạy test**

Run: `npx tsx --test src/services/writing/task2-generator.test.ts`
Expected: PASS 7/7.

- [ ] **Step 5: Viết script ghi seed**

```ts
// scripts/generate-writing-prompts.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { validateChartData } from '../src/lib/writing/chart-data';
import { generateTask1Prompts, generateTask2Prompts } from '../src/services/writing/task2-generator';

/**
 * Sinh kho đề Writing xuống seed JSON.
 *
 * Chạy: `npm run writing:prompts`
 *
 * Mọi đề Task 1 phải qua `validateChartData` trước khi ghi. Đề hỏng thì dừng
 * hẳn chứ không ghi một phần: seed ghi dở còn khó lần ra hơn là không ghi.
 */

const OUT = join(process.cwd(), 'src/data/seed/writing/index.json');

function main(): void {
  const task1 = generateTask1Prompts();
  const task2 = generateTask2Prompts();

  const bad: string[] = [];
  for (const p of task1) {
    const r = validateChartData(p.chartData);
    if (!r.ok) bad.push(`${p.id}: ${r.reason}`);
  }
  if (bad.length > 0) {
    console.error('Có đề Task 1 không hợp lệ, KHÔNG ghi seed:');
    for (const line of bad) console.error('  -', line);
    process.exit(1);
  }

  const all = [...task1, ...task2];
  const ids = new Set(all.map((p) => p.id));
  if (ids.size !== all.length) {
    console.error('Có id trùng nhau, KHÔNG ghi seed.');
    process.exit(1);
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(all, null, 2)}\n`, 'utf8');

  const byKind = new Map<string, number>();
  for (const p of task1) byKind.set(p.chartKind ?? '?', (byKind.get(p.chartKind ?? '?') ?? 0) + 1);

  console.log(`Đã ghi ${all.length} đề vào ${OUT}`);
  console.log(`  Task 1: ${task1.length} (${[...byKind].map(([k, v]) => `${k} ${v}`).join(', ')})`);
  console.log(`  Task 2: ${task2.length}`);
}

main();
```

- [ ] **Step 6: Thêm script vào `package.json`**

Trong khối `"scripts"`, thêm sau dòng `"ingest"`:

```json
"writing:prompts": "tsx scripts/generate-writing-prompts.ts"
```

- [ ] **Step 7: Chạy script và kiểm kết quả**

Run: `npm run writing:prompts`
Expected: in ra số đề Task 1 và Task 2, không có dòng lỗi nào.

Run: `npm test && npx tsc --noEmit`
Expected: toàn bộ xanh. `writing-repository.test.ts` giờ chạy trên kho đề thật,
nên nó là chỗ bắt được nếu script ghi ra dữ liệu sai hình dạng.

- [ ] **Step 8: Commit**

```bash
git add src/services/writing/task2-generator.ts src/services/writing/task2-generator.test.ts scripts/generate-writing-prompts.ts package.json src/data/seed/writing/index.json
git commit -m "feat(writing): bo sinh de Task 2 va script ghi seed"
```

---

## Kiểm tra cuối lát 2A

- [ ] `npm run writing:prompts` chạy sạch, ghi ra kho đề.
- [ ] `npm test` toàn bộ xanh.
- [ ] `npx tsc --noEmit` sạch.
- [ ] Kho đề có ít nhất 20 đề Task 1 (4 loại hình × 6 chủ đề) và 30 đề Task 2.
- [ ] Không đụng file nào của luồng Reading.

Xong 2A thì 2B (vẽ biểu đồ + trang `/write`) có dữ liệu thật để hiển thị.
