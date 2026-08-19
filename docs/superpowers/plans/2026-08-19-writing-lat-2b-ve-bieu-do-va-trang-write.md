# Writing lát 2B — vẽ biểu đồ và trang /write Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hiển thị được kho đề 60 bài lên màn hình: vẽ bốn loại biểu đồ Task 1 bằng SVG, và dựng trang `/write` để duyệt và lọc đề.

**Architecture:** Toàn bộ phần tính toán hình học (chia vạch trục, quy giá trị ra toạ độ) tách thành module thuần có test; component chỉ nhận số đã tính rồi vẽ. Vẽ bằng `react-native-svg` để web và mobile giống hệt nhau — quyết định đã có sẵn ở `src/components/charts/index.tsx`.

**Tech Stack:** React 19, react-native-svg, NativeWind, Expo Router v57.

**Spec:** `docs/superpowers/specs/2026-08-19-writing-module-design.md`

## Global Constraints

- Đọc https://docs.expo.dev/versions/v57.0.0/ trước khi viết code Expo (`AGENTS.md`).
- Chú thích tiếng Việt có dấu, giải thích **vì sao**. Commit message tiếng Việt không dấu.
- `strict` + `noUncheckedIndexedAccess`: `arr[0]` có kiểu `T | undefined`.
- **Không** dùng victory-native / recharts. Chỉ `react-native-svg`.
- Component React **không** unit-test được ở đây (chưa có react-test-renderer trong dự án). Nên mọi logic đáng test phải nằm ngoài component, ở module thuần.
- Kiểm chứng phần nhìn bằng dev server + ảnh chụp, không chỉ bằng test.
- Màu lấy từ `@/theme/tokens`, không viết mã màu thẳng vào component.

---

### Task 1: Hình học biểu đồ (module thuần)

Phần dễ sai nhất khi vẽ biểu đồ là chia vạch trục: chia đều máy móc ra những
con số như 33.33, và trục bắt đầu từ giá trị nhỏ nhất thay vì từ 0 làm cột trông
sai tỷ lệ. Tách ra để test được.

**Files:**
- Create: `src/services/writing/chart-scale.ts`
- Test: `src/services/writing/chart-scale.test.ts`

**Interfaces:**
- Produces:
  - `niceTicks(min: number, max: number, target?: number): number[]`
  - `seriesExtent(series: Array<{ values: number[] }>): { min: number; max: number }`
  - `pieSlices(slices: Array<{ label: string; value: number }>): Array<{ label: string; value: number; startAngle: number; endAngle: number }>`

- [ ] **Step 1: Viết test thất bại**

```ts
// src/services/writing/chart-scale.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { niceTicks, pieSlices, seriesExtent } from './chart-scale';

test('vạch trục là số tròn, không phải số lẻ dài', () => {
  for (const t of niceTicks(0, 155)) {
    assert.equal(t, Math.round(t * 100) / 100, `vạch ${t} không tròn`);
  }
});

test('vạch đầu không lớn hơn min và vạch cuối không nhỏ hơn max', () => {
  const ticks = niceTicks(12, 155);
  assert.ok((ticks[0] ?? 0) <= 12);
  assert.ok((ticks[ticks.length - 1] ?? 0) >= 155);
});

test('vạch tăng đều và không trùng nhau', () => {
  const ticks = niceTicks(0, 97);
  const step = (ticks[1] ?? 0) - (ticks[0] ?? 0);
  assert.ok(step > 0);
  for (let i = 1; i < ticks.length; i += 1) {
    assert.equal((ticks[i] ?? 0) - (ticks[i - 1] ?? 0), step);
  }
});

test('số vạch nằm trong khoảng dùng được, không quá dày cũng không quá thưa', () => {
  for (const [lo, hi] of [[0, 1], [0, 9], [0, 100], [0, 12345], [40, 41]] as const) {
    const n = niceTicks(lo, hi).length;
    assert.ok(n >= 3 && n <= 8, `khoảng ${lo}-${hi} ra ${n} vạch`);
  }
});

test('min bằng max vẫn ra trục dùng được, không chia cho 0', () => {
  const ticks = niceTicks(50, 50);
  assert.ok(ticks.length >= 2);
  assert.ok(ticks.every((t) => Number.isFinite(t)));
});

test('biên độ lấy từ mọi chuỗi, và luôn kéo về 0 khi mọi giá trị đều dương', () => {
  // Trục cắt ở giá trị nhỏ nhất làm cột thấp trông như bằng 0 — sai tỷ lệ.
  const e = seriesExtent([{ values: [45, 68] }, { values: [95, 40] }]);
  assert.equal(e.min, 0);
  assert.equal(e.max, 95);
});

test('có giá trị âm thì không ép trục về 0', () => {
  const e = seriesExtent([{ values: [-4, 18] }]);
  assert.ok(e.min <= -4);
  assert.equal(e.max, 18);
});

test('góc các lát bánh nối tiếp nhau và phủ trọn vòng tròn', () => {
  const slices = pieSlices([
    { label: 'A', value: 50 },
    { label: 'B', value: 30 },
    { label: 'C', value: 20 },
  ]);
  assert.equal(slices.length, 3);
  assert.equal(slices[0]?.startAngle, 0);
  for (let i = 1; i < slices.length; i += 1) {
    assert.equal(slices[i]?.startAngle, slices[i - 1]?.endAngle);
  }
  assert.equal(Math.round(slices[slices.length - 1]?.endAngle ?? 0), 360);
});

test('lát có giá trị 0 không làm hỏng phép chia', () => {
  const slices = pieSlices([
    { label: 'A', value: 100 },
    { label: 'B', value: 0 },
  ]);
  assert.equal(slices[1]?.startAngle, slices[1]?.endAngle);
});

test('tổng bằng 0 thì trả mảng rỗng chứ không ném lỗi', () => {
  assert.deepEqual(pieSlices([{ label: 'A', value: 0 }]), []);
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó hỏng**

Run: `npx tsx --test src/services/writing/chart-scale.test.ts`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết bản cài đặt**

```ts
// src/services/writing/chart-scale.ts
/**
 * Hình học biểu đồ, tách khỏi component để test được.
 *
 * Component React trong dự án này chưa có bộ test nào chạy được (không có
 * react-test-renderer), nên mọi thứ đáng kiểm phải nằm ở đây. Phần còn lại của
 * component chỉ là nhận số đã tính rồi vẽ.
 */

/** Bước nhảy "đẹp" theo mắt người: 1, 2, 2.5, 5 rồi nhân 10. */
const NICE_STEPS = [1, 2, 2.5, 5, 10];

/**
 * Chia vạch trục thành những con số tròn.
 *
 * Chia đều máy móc `(max - min) / 5` ra những vạch kiểu 33.33 — người đọc phải
 * dừng lại nhẩm, mà biểu đồ trong đề thi thì phải liếc là thấy.
 */
export function niceTicks(min: number, max: number, target = 5): number[] {
  // Min bằng max (mọi giá trị như nhau) thì không có biên độ nào để chia.
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    const base = Number.isFinite(max) ? max : 0;
    return [base, base + 1];
  }

  const raw = (max - min) / target;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const step =
    (NICE_STEPS.find((m) => m * magnitude >= raw) ?? NICE_STEPS[NICE_STEPS.length - 1] ?? 10) *
    magnitude;

  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  // Cộng dồn bằng phép nhân chỉ số thay vì cộng liên tiếp: cộng dồn số thực
  // tích luỹ sai số và ra những vạch kiểu 0.30000000000000004.
  const count = Math.round((hi - lo) / step);
  for (let i = 0; i <= count; i += 1) {
    ticks.push(round(lo + step * i));
  }
  return ticks;
}

function round(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

/**
 * Biên độ chung của mọi chuỗi.
 *
 * Ép trục về 0 khi mọi giá trị đều dương: trục cắt ở giá trị nhỏ nhất làm cột
 * thấp trông như bằng 0, và đó là kiểu bóp méo tỷ lệ mà đề thi thật không có.
 */
export function seriesExtent(series: Array<{ values: number[] }>): {
  min: number;
  max: number;
} {
  const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
  if (all.length === 0) return { min: 0, max: 1 };

  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  return { min: rawMin >= 0 ? 0 : rawMin, max: rawMax };
}

export type PieArc = {
  label: string;
  value: number;
  /** Độ, tính từ 12 giờ theo chiều kim đồng hồ. */
  startAngle: number;
  endAngle: number;
};

export function pieSlices(slices: Array<{ label: string; value: number }>): PieArc[] {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return [];

  const out: PieArc[] = [];
  let angle = 0;
  for (const slice of slices) {
    const sweep = (Math.max(0, slice.value) / total) * 360;
    out.push({
      label: slice.label,
      value: slice.value,
      startAngle: round(angle),
      endAngle: round(angle + sweep),
    });
    angle += sweep;
  }
  return out;
}
```

- [ ] **Step 4: Chạy test và typecheck**

Run: `npx tsx --test src/services/writing/chart-scale.test.ts && npx tsc --noEmit`
Expected: PASS 10/10, typecheck sạch.

- [ ] **Step 5: Commit**

```bash
git add src/services/writing/chart-scale.ts src/services/writing/chart-scale.test.ts
git commit -m "feat(writing): hinh hoc bieu do tach khoi component"
```

---

### Task 2: Component vẽ bốn loại biểu đồ

**Files:**
- Create: `src/components/writing/ChartFigure.tsx`

**Interfaces:**
- Consumes: `niceTicks`, `seriesExtent`, `pieSlices` (Task 1); `ChartData` từ `@/lib/writing/types`; `chartPalette`, `color` từ `@/theme/tokens`
- Produces: `ChartFigure({ data, width }: { data: ChartData; width?: number })`

Một file cho cả bốn loại, đúng khuôn `src/components/charts/index.tsx` đã có.

Yêu cầu bắt buộc của từng loại:

| Loại | Phải có |
|---|---|
| line / bar | trục Y có vạch số tròn và nhãn đơn vị, trục X có nhãn mốc, chú giải tên chuỗi |
| pie | hai hình tròn cạnh nhau, mỗi lát ghi %, chú giải dùng chung |
| table | hàng tiêu đề nổi bật, hàng lẻ có nền, cột đầu căn trái |
| mixed | vẽ hai hình con xếp dọc |

Điểm phải cẩn thận:
- Nhãn trục X dài (`Bottled water`) sẽ chồng lên nhau ở bar chart — xoay hoặc
  cắt bớt, đừng để đè.
- `title` và `unit` phải hiện, vì đề thi thật luôn có; thiếu thì người học không
  biết đơn vị và sẽ viết sai dữ liệu.
- Component nhận `width` để trang gọi truyền bề rộng thật; mặc định 640.

- [ ] **Step 1: Viết component** — xem code trong commit, dựng theo bảng yêu cầu trên.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sạch.

- [ ] **Step 3: Commit**

```bash
git add src/components/writing/ChartFigure.tsx
git commit -m "feat(writing): component ve bon loai bieu do Task 1"
```

---

### Task 3: Trang `/write` và mục điều hướng

**Files:**
- Create: `app/write/index.tsx`
- Modify: `src/navigation/nav-items.ts`

**Interfaces:**
- Consumes: `filterWritingPrompts`, `writingLibraryStats` từ `@/data/writing-repository`; `ChartFigure` (Task 2)

Trang gồm:
- Ba tab: `Task 1` / `Task 2` / `SAT Writing`. Tab SAT hiện thông báo "đang làm ở
  lát 6" — nói rõ còn thiếu gì tốt hơn là giấu tab đi rồi người dùng tưởng không có.
- Ô tìm kiếm, chip lọc theo chủ đề và theo band mục tiêu.
- Thẻ đề: câu lệnh, badge dạng, thời gian, số từ tối thiểu; đề Task 1 hiện luôn
  biểu đồ thu nhỏ.
- Nút mở phòng viết trỏ tới `/write/[promptId]` — lát 3 mới dựng, nên lát này
  chỉ cần route tồn tại và không nổ.

- [ ] **Step 1: Thêm mục nav**

Trong `src/navigation/nav-items.ts`, chèn sau mục `practice`:

```ts
{ key: 'writing', label: 'Writing', href: '/write', icon: 'note', inTopNav: true, inBottomTabs: true },
```

Giữ `pencil` cho `practice` — đổi icon của mục đang có là đụng vào phần việc của
nhánh khác mà không có lý do.

- [ ] **Step 2: Viết trang**

- [ ] **Step 3: Chạy dev server và kiểm chứng bằng mắt**

Run: mở preview qua `.claude/launch.json` (đã có sẵn trong repo), vào `/write`.
Kiểm: ba tab đổi được, lọc ra đúng số đề, biểu đồ vẽ ra không đè chữ, và không
có lỗi nào trong console.

- [ ] **Step 4: Typecheck, test, commit**

```bash
npx tsc --noEmit && npm test
git add app/write/index.tsx src/navigation/nav-items.ts
git commit -m "feat(writing): trang kho de /write"
```

---

## Kiểm tra cuối lát 2B

- [ ] `/write` mở được, ba tab hoạt động, lọc đúng.
- [ ] Cả bốn loại biểu đồ vẽ ra đọc được, không đè chữ, có đơn vị.
- [ ] Console không có lỗi.
- [ ] `npm test` và `npx tsc --noEmit` sạch.
