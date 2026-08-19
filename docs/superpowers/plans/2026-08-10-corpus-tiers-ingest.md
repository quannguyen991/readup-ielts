# Kho bài theo tier + Ingest rộng — Implementation Plan (Phần A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cào ~1000 bài đọc, cắt mỗi bài về đúng khổ passage IELTS, gán tier Passage 1/2/3, và tách kho bài thành index + chunk để bundle không phình.

**Architecture:** Thêm một lớp thuần (`tiers.ts`, `quality-gate.ts`) đứng giữa nguồn và seed: nguồn trả văn bản thô → gate loại rác → chấm độ khó trên mẫu 800 từ → gán tier → cắt theo khổ tier → chấm lại lần cuối. Ingest ghi ra `index.json` (metadata, bundle sẵn) + `bodies/chunk-NN.json` (body, nạp lười qua `require()` đồng bộ) + `bodies/registry.ts` (map tĩnh cho Metro thấy được lúc build).

**Tech Stack:** TypeScript strict · tsx (chạy script + test) · node:test (không thêm dependency) · Expo SDK 57 / Metro · Supabase (migration, chưa cần key để chạy)

## Global Constraints

- **Expo SDK 57.** Đọc doc đúng phiên bản tại https://docs.expo.dev/versions/v57.0.0/ trước khi viết code liên quan Expo (yêu cầu trong `AGENTS.md`).
- **Không thêm dependency mới.** Test dùng `node:test` chạy qua `tsx`.
- **TypeScript strict.** `npm run typecheck` phải sạch sau mỗi task, **trừ hai chỗ cố ý dưới đây** — đó là hệ quả của việc đổi kiểu công khai ở task này và sửa chỗ tiêu thụ ở task sau, không phải lỗi:
  - Sau **Task 3** (đổi kiểu trả về của `normalizeArticle`): đỏ ở `scripts/ingest.ts`, xanh lại ở Task 7.
  - Sau **Task 9** (index không còn `bodyText`): đỏ ở `app/read/[id].tsx` và có thể ở `app/library.tsx`, xanh lại ở Task 10.

  Ở hai task đó, việc cần làm là **ghi lại danh sách lỗi** rồi đi tiếp, không phải chữa cháy bằng `any` hay `@ts-expect-error`. Mọi task khác: typecheck sạch là điều kiện xong.
- **`npm test` phải xanh sau MỌI task**, kể cả Task 3 và Task 9. Test không phụ thuộc chỗ tiêu thụ nên không có ngoại lệ nào ở đây.
- **Bản quyền — bất khả xâm phạm:** bài `licenseType === 'headline_only'` phải luôn có `bodyText === null` và `sourceUrl` khác rỗng. DB có CHECK constraint chặn; code không được tìm cách lách.
- **Wikimedia User-Agent phải có email liên hệ thật**, đổi qua env `INGEST_CONTACT`, mặc định trong `src/services/ingest/http.ts`. Thiếu sẽ bị 429.
- **Ngưỡng tier (copy đúng từ spec A1):** `p1` min 650 / target 750 · `p2` min 800 / target 900 · `p3` min 950 / target 1050 · `short_academic` 150–649 · dưới 150 từ thì loại bỏ.
- **`exlimit` của Wikipedia bị hạ xuống 1** cho extract toàn bài — không gộp nhiều bài trong một request. Đừng tốn thời gian thử batch.
- **Test command:** `npx tsx --test "src/**/*.test.ts"` (dấu ngoặc kép bắt buộc; truyền thư mục trần sẽ hỏng vì test runner của Node không nhận `.ts`).

---

## File Structure

**Tạo mới:**

| File | Trách nhiệm |
|---|---|
| `src/services/ingest/tiers.ts` | `PassageTier`, `TIER_SPECS`, `assignTier`, `truncateToTier`, `countWords` |
| `src/services/ingest/tiers.test.ts` | test cho trên |
| `src/services/ingest/quality-gate.ts` | `checkQuality` — loại trang định hướng / List of / stub / bảng biểu |
| `src/services/ingest/quality-gate.test.ts` | test cho trên |
| `src/services/ingest/sources/category-map.ts` | map 10 chủ đề → category Wikipedia (en + simple) |
| `src/services/ingest/sources/official-practice.ts` | 5 mục đề official, danh sách tĩnh, không gọi mạng |
| `src/services/ingest/seed-writer.ts` | `buildSeedBundle`, `renderRegistry`, `writeSeedBundle` |
| `src/services/ingest/seed-writer.test.ts` | test cho trên |
| `src/data/article-repository.ts` | `getArticleBody(id)` đồng bộ, memo hoá theo chunk |
| `supabase/migrations/20260810000100_passage_tier.sql` | thêm `passage_tier`, cho `evidence_paragraph_index` nullable |

**Sửa:**

| File | Sửa gì |
|---|---|
| `src/types/database.ts` | thêm `PassageTier`, thêm `passage_tier` vào `Article` row |
| `src/services/ingest/types.ts` | `RawArticle.passageTier?`, `IngestedArticle.passageTier` |
| `src/services/ingest/http.ts` | thêm `mapWithConcurrency` |
| `src/services/ingest/pipeline.ts` | `normalizeArticle` trả union ok/rejected, áp gate + tier + cắt |
| `src/services/ingest/sources/wikipedia.ts` | tách `fetchExtract`, thêm `fetchWikipediaCategories` |
| `src/services/ingest/sources/science.ts` | PLOS `rows` 4→25, arXiv `max_results` 4→25 |
| `src/services/ingest/sources/feeds.ts` | chuyển CDC sang `HEADLINE_FEEDS` |
| `scripts/ingest.ts` | checkpoint/resume, dùng `seed-writer`, push `passage_tier` |
| `src/data/articles.ts` | đọc `index.json`, `ArticleMeta` vs `Article`, sửa `isReadable` |
| `src/store/useUserArticleStore.ts` | bài tự dán thêm `passageTier: null` |
| `app/read/[id].tsx` | lấy body qua `getArticleBody` thay vì từ object |
| `package.json` | thêm script `test` |

---

### Task 1: Mô hình tier (hàm thuần)

**Files:**
- Create: `src/services/ingest/tiers.ts`
- Test: `src/services/ingest/tiers.test.ts`
- Modify: `src/types/database.ts` (khai `PassageTier` — **một nguồn chân lý duy nhất**)

**Interfaces:**
- Consumes: `extractWords`, `splitSentences` từ `src/services/ingest/readability.ts` (đã có); `CefrLevel` từ `@/types/database`
- Produces:
  - `type PassageTier` — khai trong `src/types/database.ts`, `tiers.ts` chỉ import rồi re-export. Đừng khai lại ở hai chỗ.
  - `TIER_SPECS: readonly PassageTierSpec[]`
  - `SHORT_ACADEMIC_MIN_WORDS: 150`
  - `assignTier(availableWords: number, cefr: CefrLevel | null): PassageTier | null`
  - `truncateToTier(paragraphs: string[], tier: PassageTier): string[]`
  - `countWords(text: string): number`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/ingest/tiers.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { assignTier, countWords, truncateToTier } from './tiers';

/** n từ, mỗi từ là "alpha" — countWords đếm được đúng n. */
const para = (n: number): string => Array.from({ length: n }, () => 'alpha').join(' ');

/** Câu 50 từ, bắt đầu bằng chữ hoa để splitSentences tách được. */
const sentence50 = `Alpha ${para(49)}.`;

test('assignTier: dưới 150 từ thì loại bỏ', () => {
  assert.equal(assignTier(149, 'B1'), null);
  assert.equal(assignTier(0, null), null);
});

test('assignTier: ngắn hơn mọi passage thành short_academic', () => {
  assert.equal(assignTier(150, 'B2'), 'short_academic');
  assert.equal(assignTier(649, 'C1'), 'short_academic');
});

test('assignTier: không có khoảng hở giữa short_academic và p1', () => {
  assert.equal(assignTier(649, 'B1'), 'short_academic');
  assert.equal(assignTier(650, 'B1'), 'p1');
});

test('assignTier: CEFR chọn tier trong số ứng viên', () => {
  assert.equal(assignTier(1200, 'B1'), 'p1');
  assert.equal(assignTier(1200, 'B2'), 'p2');
  assert.equal(assignTier(1200, 'C2'), 'p3');
});

test('assignTier: CEFR không khớp ứng viên nào thì lấy tier lớn nhất khả thi', () => {
  // 700 từ chỉ đủ p1. C2 không nằm trong dải p1 nhưng vẫn ra p1 vì đó là
  // tier lớn nhất khả thi — độ khó thật vẫn lưu riêng ở cefrLevel.
  assert.equal(assignTier(700, 'C2'), 'p1');
});

test('assignTier: không biết CEFR thì lấy tier lớn nhất khả thi', () => {
  assert.equal(assignTier(1200, null), 'p3');
  assert.equal(assignTier(820, null), 'p2');
  assert.equal(assignTier(700, null), 'p1');
});

test('truncateToTier: cắt tại ranh giới đoạn, không vượt khổ', () => {
  const paragraphs = Array.from({ length: 20 }, () => para(100));
  const kept = truncateToTier(paragraphs, 'p1');
  const total = kept.reduce((sum, p) => sum + countWords(p), 0);

  assert.ok(kept.length < 20, 'phải bỏ bớt đoạn');
  assert.ok(total <= 750, `tổng ${total} không được vượt target 750`);
  assert.ok(total >= 650, `tổng ${total} phải đạt min của p1`);
});

test('truncateToTier: luôn giữ ít nhất một đoạn', () => {
  assert.equal(truncateToTier([para(5000)], 'p1').length, 1);
});

test('truncateToTier: một đoạn dài quá khổ thì cắt tiếp theo câu', () => {
  const huge = Array.from({ length: 40 }, () => sentence50).join(' ');
  const kept = truncateToTier([huge], 'p1');

  assert.equal(kept.length, 1);
  assert.ok(countWords(kept[0]!) <= 800, `còn ${countWords(kept[0]!)} từ, phải ≈≤750`);
});

test('truncateToTier: tier không phải passage thì giữ nguyên', () => {
  const paragraphs = [para(100), para(100)];
  assert.deepEqual(truncateToTier(paragraphs, 'short_academic'), paragraphs);
  assert.deepEqual(truncateToTier(paragraphs, 'headline'), paragraphs);
});
```

- [ ] **Step 2: Chạy test để chắc là nó fail**

Run: `npx tsx --test "src/services/ingest/tiers.test.ts"`
Expected: FAIL — `Cannot find module './tiers'`

- [ ] **Step 3a: Khai PassageTier ở một chỗ duy nhất**

Trong `src/types/database.ts`, thêm ngay dưới dòng `export type ArticleTrack = 'academic' | 'general_training';`:

```ts
/**
 * Tier bám cấu trúc Reading của IELTS: 3 passage tăng dần độ dài và độ khó,
 * cộng ba loại ngoài đề thi.
 *
 * Danh sách này phải khớp đúng enum `passage_tier` trong
 * supabase/migrations/20260810000100_passage_tier.sql (Task 8).
 */
export type PassageTier =
  | 'p1'
  | 'p2'
  | 'p3'
  | 'short_academic'
  | 'headline'
  | 'official_practice';
```

- [ ] **Step 3b: Viết implementation tối thiểu**

Tạo `src/services/ingest/tiers.ts`:

```ts
import { extractWords, splitSentences } from './readability';
import type { CefrLevel, PassageTier } from '@/types/database';

/**
 * Ba tier cộng lại ≈ 2700 từ. Lưu ý: ielts.org KHÔNG công bố tổng số từ của
 * một đề — 2700 là con số hiệu chỉnh trong spec, không phải chuẩn official.
 */
export type { PassageTier };

export type PassageTierSpec = {
  tier: 'p1' | 'p2' | 'p3';
  /** Số từ tối thiểu để tier này thành ứng viên. */
  minWords: number;
  /** Khổ mục tiêu sau khi cắt. */
  targetWords: number;
  /** Dải CEFR kỳ vọng, dùng để chọn giữa các ứng viên. */
  cefr: CefrLevel[];
};

/** Xếp tăng dần theo minWords — assignTier dựa vào thứ tự này. */
export const TIER_SPECS: readonly PassageTierSpec[] = [
  { tier: 'p1', minWords: 650, targetWords: 750, cefr: ['A1', 'A2', 'B1'] },
  { tier: 'p2', minWords: 800, targetWords: 900, cefr: ['B2'] },
  { tier: 'p3', minWords: 950, targetWords: 1050, cefr: ['C1', 'C2'] },
];

export const SHORT_ACADEMIC_MIN_WORDS = 150;

export function countWords(text: string): number {
  return extractWords(text).length;
}

export function tierSpec(tier: PassageTier): PassageTierSpec | null {
  return TIER_SPECS.find((s) => s.tier === tier) ?? null;
}

/**
 * Độ dài lọc ra tier khả thi, độ khó chọn trong số đó.
 * Trả null nghĩa là bài quá ngắn, nên loại bỏ hẳn.
 */
export function assignTier(availableWords: number, cefr: CefrLevel | null): PassageTier | null {
  if (availableWords < SHORT_ACADEMIC_MIN_WORDS) return null;

  const candidates = TIER_SPECS.filter((s) => availableWords >= s.minWords);
  if (candidates.length === 0) return 'short_academic';

  if (cefr) {
    const matched = candidates.find((s) => s.cefr.includes(cefr));
    if (matched) return matched.tier;
  }

  return candidates[candidates.length - 1]!.tier;
}

/** Cắt tại ranh giới đoạn cho tới khi đạt khổ mục tiêu của tier. */
export function truncateToTier(paragraphs: string[], tier: PassageTier): string[] {
  const spec = tierSpec(tier);
  if (!spec) return paragraphs;

  const target = spec.targetWords;
  const kept: string[] = [];
  let total = 0;

  for (const paragraph of paragraphs) {
    const n = countWords(paragraph);
    // Luôn nhận đoạn đầu, kể cả khi nó đã vượt khổ — không để passage rỗng.
    if (kept.length > 0 && total + n > target) break;
    kept.push(paragraph);
    total += n;
    if (total >= target) break;
  }

  // Wikipedia đôi khi có một đoạn cực dài. Cắt tiếp theo câu để giữ hợp đồng tier.
  if (kept.length === 1 && countWords(kept[0]!) > target * 1.5) {
    kept[0] = truncateBySentence(kept[0]!, target);
  }

  return kept;
}

function truncateBySentence(paragraph: string, target: number): string {
  const kept: string[] = [];
  let total = 0;

  for (const sentence of splitSentences(paragraph)) {
    const n = countWords(sentence);
    if (kept.length > 0 && total + n > target) break;
    kept.push(sentence);
    total += n;
    if (total >= target) break;
  }

  return kept.join(' ');
}
```

- [ ] **Step 4: Chạy test để chắc là nó pass**

Run: `npx tsx --test "src/services/ingest/tiers.test.ts"`
Expected: PASS — 10 test

- [ ] **Step 5: Thêm script test rồi commit**

Sửa `package.json`, thêm vào `"scripts"`:

```json
"test": "tsx --test \"src/**/*.test.ts\""
```

Run: `npm test` → PASS. Run: `npm run typecheck` → sạch.

```bash
git add package.json src/services/ingest/tiers.ts src/services/ingest/tiers.test.ts
git commit -m "feat(ingest): mo hinh tier passage 1/2/3 + cat bai theo kho"
```

---

### Task 2: Quality gate

**Files:**
- Create: `src/services/ingest/quality-gate.ts`
- Test: `src/services/ingest/quality-gate.test.ts`

**Interfaces:**
- Consumes: `extractWords` từ `./readability`
- Produces:
  - `type RejectReason = 'disambiguation' | 'list_article' | 'too_few_paragraphs' | 'low_prose_ratio' | 'non_latin_heavy' | 'too_short'`
  - `type QualityVerdict = { ok: true } | { ok: false; reason: RejectReason }`
  - `checkQuality(title: string, paragraphs: string[]): QualityVerdict`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/ingest/quality-gate.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { checkQuality } from './quality-gate';

const goodParagraph = (i: number): string =>
  `Paragraph number ${i} discusses the topic in reasonable prose with enough words to count as real content for a reader.`;

const goodParagraphs = (): string[] => [1, 2, 3, 4, 5].map(goodParagraph);

test('checkQuality: bài prose bình thường thì lọt', () => {
  assert.deepEqual(checkQuality('Photosynthesis', goodParagraphs()), { ok: true });
});

test('checkQuality: loại bài "List of ..."', () => {
  const verdict = checkQuality('List of countries by population', goodParagraphs());
  assert.deepEqual(verdict, { ok: false, reason: 'list_article' });
});

test('checkQuality: loại trang định hướng theo tiêu đề', () => {
  const verdict = checkQuality('Mercury (disambiguation)', goodParagraphs());
  assert.deepEqual(verdict, { ok: false, reason: 'disambiguation' });
});

test('checkQuality: loại trang định hướng theo cụm "may refer to"', () => {
  const paragraphs = ['Mercury may refer to several different things in science and myth.', ...goodParagraphs()];
  const verdict = checkQuality('Mercury', paragraphs);
  assert.deepEqual(verdict, { ok: false, reason: 'disambiguation' });
});

test('checkQuality: loại bài dưới 4 đoạn', () => {
  const verdict = checkQuality('Stub article', [goodParagraph(1), goodParagraph(2)]);
  assert.deepEqual(verdict, { ok: false, reason: 'too_few_paragraphs' });
});

test('checkQuality: loại bài đủ đoạn nhưng quá ít từ', () => {
  const verdict = checkQuality('Tiny', ['one two three', 'four five six', 'seven eight nine', 'ten eleven twelve']);
  assert.deepEqual(verdict, { ok: false, reason: 'too_short' });
});

test('checkQuality: loại nội dung toàn số liệu / bảng biểu', () => {
  const row = '1990 | 12.4 | 33.1 | 8.09 | 45.2 | 77.7 | 12.4 | 33.1 | 8.09 | 45.2 | 1991 | 13.5';
  const verdict = checkQuality('Statistics table', [row, row, row, row, row]);
  assert.deepEqual(verdict, { ok: false, reason: 'low_prose_ratio' });
});
```

- [ ] **Step 2: Chạy test để chắc là nó fail**

Run: `npx tsx --test "src/services/ingest/quality-gate.test.ts"`
Expected: FAIL — `Cannot find module './quality-gate'`

- [ ] **Step 3: Viết implementation tối thiểu**

Tạo `src/services/ingest/quality-gate.ts`:

```ts
import { extractWords } from './readability';

/**
 * Chặn rác trước khi vào kho bài. Cần thiết vì crawl theo category Wikipedia
 * trả về cả trang định hướng, trang danh sách và stub — đã kiểm thật:
 * Category:Climate_change có mục "1st Special Envoy for Drought and climate
 * change of Somalia".
 */
export type RejectReason =
  | 'disambiguation'
  | 'list_article'
  | 'too_few_paragraphs'
  | 'low_prose_ratio'
  | 'non_latin_heavy'
  | 'too_short';

export type QualityVerdict = { ok: true } | { ok: false; reason: RejectReason };

const MIN_PARAGRAPHS = 4;
const MIN_WORDS = 150;
/** Tỉ lệ ký tự là chữ cái trên tổng ký tự không phải khoảng trắng. */
const MIN_PROSE_RATIO = 0.75;
const MAX_NON_LATIN_RATIO = 0.15;

export function checkQuality(title: string, paragraphs: string[]): QualityVerdict {
  if (/^list of /i.test(title.trim())) return { ok: false, reason: 'list_article' };
  if (/\(disambiguation\)/i.test(title)) return { ok: false, reason: 'disambiguation' };

  const text = paragraphs.join('\n\n');

  // "may refer to" chỉ tính khi nằm ở đầu bài — giữa bài có thể là câu bình thường.
  if (/\bmay refer to\b/i.test(text.slice(0, 400))) {
    return { ok: false, reason: 'disambiguation' };
  }

  if (paragraphs.length < MIN_PARAGRAPHS) return { ok: false, reason: 'too_few_paragraphs' };

  if (extractWords(text).length < MIN_WORDS) return { ok: false, reason: 'too_short' };

  const nonSpace = text.replace(/\s/g, '').length;
  if (nonSpace > 0) {
    const letters = (text.match(/[A-Za-z]/g) ?? []).length;
    if (letters / nonSpace < MIN_PROSE_RATIO) return { ok: false, reason: 'low_prose_ratio' };

    const nonLatin = (text.match(/[^ -ɏ\s]/g) ?? []).length;
    if (nonLatin / nonSpace > MAX_NON_LATIN_RATIO) {
      return { ok: false, reason: 'non_latin_heavy' };
    }
  }

  return { ok: true };
}
```

- [ ] **Step 4: Chạy test để chắc là nó pass**

Run: `npx tsx --test "src/services/ingest/quality-gate.test.ts"`
Expected: PASS — 7 test

- [ ] **Step 5: Commit**

```bash
git add src/services/ingest/quality-gate.ts src/services/ingest/quality-gate.test.ts
git commit -m "feat(ingest): quality gate loai trang dinh huong, list, stub, bang bieu"
```

---

### Task 3: Nối tier + gate vào normalizeArticle

**Files:**
- Modify: `src/types/database.ts` (thêm `PassageTier` re-export và `passage_tier` vào `Article`)
- Modify: `src/services/ingest/types.ts`
- Modify: `src/services/ingest/pipeline.ts:8-44`
- Test: `src/services/ingest/pipeline.test.ts` (tạo mới)

**Interfaces:**
- Consumes: `assignTier`, `truncateToTier`, `countWords` (Task 1); `checkQuality`, `RejectReason` (Task 2); `analyzeText` từ `./readability`
- Produces:
  - `type NormalizeResult = { ok: true; article: IngestedArticle } | { ok: false; reason: RejectReason }`
  - `normalizeArticle(raw: RawArticle, commonWords: ReadonlySet<string>): NormalizeResult` — **đổi kiểu trả về**, `scripts/ingest.ts` phải cập nhật ở Task 7
  - `IngestedArticle.passageTier: PassageTier | null`
  - `RawArticle.passageTier?: PassageTier` — nguồn nào biết trước tier của mình thì tự khai (dùng ở Task 5)

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/ingest/pipeline.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeArticle } from './pipeline';
import { countWords } from './tiers';
import type { RawArticle } from './types';

const COMMON = new Set(['the', 'and', 'of', 'a', 'to', 'in', 'is', 'that', 'it', 'for']);

const prose = (i: number): string =>
  `Section ${i} explains the subject in plain language for a general reader, with several clauses and enough words that the paragraph counts as genuine prose rather than a fragment of a table.`;

function raw(overrides: Partial<RawArticle> = {}): RawArticle {
  return {
    externalId: 'test-1',
    title: 'A Reasonable Article',
    sourceName: 'Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Test',
    topic: 'science',
    track: 'academic',
    licenseType: 'cc_by_sa',
    bodyText: Array.from({ length: 40 }, (_, i) => prose(i)).join('\n\n'),
    ...overrides,
  };
}

test('normalizeArticle: bài dài bị cắt về khổ tier, không giữ nguyên văn', () => {
  const original = raw();
  const originalWords = countWords(original.bodyText!);
  const result = normalizeArticle(original, COMMON);

  assert.equal(result.ok, true);
  if (!result.ok) return;

  const article = result.article;
  assert.ok(article.passageTier === 'p1' || article.passageTier === 'p2' || article.passageTier === 'p3');
  assert.ok(article.wordCount! < originalWords, 'phải cắt ngắn hơn bản gốc');
  assert.ok(article.wordCount! <= 1200, `còn ${article.wordCount} từ, vượt khổ p3`);
  // bodyText và paragraphs phải khớp nhau sau khi cắt.
  assert.equal(article.paragraphs.join('\n\n'), article.bodyText);
});

test('normalizeArticle: metadata chấm lại trên văn bản ĐÃ cắt', () => {
  const result = normalizeArticle(raw(), COMMON);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.article.wordCount, countWords(result.article.bodyText!));
});

test('normalizeArticle: bài Loại B không body thì tier là headline', () => {
  const result = normalizeArticle(
    raw({ bodyText: null, licenseType: 'headline_only', sourceName: 'BBC News' }),
    COMMON,
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.article.passageTier, 'headline');
  assert.equal(result.article.bodyText, null);
  assert.deepEqual(result.article.paragraphs, []);
  assert.equal(result.article.wordCount, null);
});

test('normalizeArticle: nguồn tự khai tier thì tôn trọng lời khai', () => {
  const result = normalizeArticle(
    raw({ bodyText: null, licenseType: 'headline_only', passageTier: 'official_practice' }),
    COMMON,
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.article.passageTier, 'official_practice');
});

test('normalizeArticle: bài bị gate loại thì trả lý do', () => {
  const result = normalizeArticle(raw({ title: 'List of test cases' }), COMMON);
  assert.deepEqual(result, { ok: false, reason: 'list_article' });
});

test('normalizeArticle: bài quá ngắn thì bị loại', () => {
  const result = normalizeArticle(
    raw({ bodyText: [prose(1), prose(2), prose(3), prose(4)].join('\n\n') }),
    COMMON,
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'too_short');
});

test('normalizeArticle: id ổn định giữa các lần chạy', () => {
  const a = normalizeArticle(raw(), COMMON);
  const b = normalizeArticle(raw(), COMMON);
  assert.equal(a.ok && b.ok && a.article.id === b.article.id, true);
});
```

- [ ] **Step 2: Chạy test để chắc là nó fail**

Run: `npx tsx --test "src/services/ingest/pipeline.test.ts"`
Expected: FAIL — `normalizeArticle` trả `IngestedArticle` chứ không có `.ok`, và `passageTier` chưa tồn tại

- [ ] **Step 3: Thêm passage_tier vào Article row**

`PassageTier` đã khai ở Task 1 Step 3a — **không khai lại**. Ở đây chỉ thêm field vào row type.

Trong `src/types/database.ts`, trong `export type Article = {` thêm một field cạnh `track`:

```ts
  passage_tier: PassageTier | null;
```

Sửa `src/services/ingest/types.ts`:

- Trong `RawArticle`, thêm sau `track`:

```ts
  /** Nguồn nào biết trước tier của mình thì khai ở đây (đề official, headline). */
  passageTier?: PassageTier;
```

- Trong `IngestedArticle`, thêm sau `track`:

```ts
  passageTier: PassageTier | null;
```

- Sửa dòng import đầu file thành:

```ts
import type { ArticleTrack, CefrLevel, LicenseType, PassageTier } from '@/types/database';
```

- [ ] **Step 4: Viết lại normalizeArticle**

Thay toàn bộ `normalizeArticle` trong `src/services/ingest/pipeline.ts` (dòng 1–44) bằng:

```ts
import { checkQuality, type RejectReason } from './quality-gate';
import { analyzeText } from './readability';
import { assignTier, countWords, truncateToTier } from './tiers';
import type { IngestedArticle, RawArticle } from './types';

export type NormalizeResult =
  | { ok: true; article: IngestedArticle }
  | { ok: false; reason: RejectReason };

/** Số từ dùng để chấm độ khó — mẫu cố định nên bài dài không bị lệch điểm. */
const SCORING_SAMPLE_WORDS = 800;

/**
 * Chuẩn hoá bài thô. Thứ tự bắt buộc:
 * gate → chấm mẫu → gán tier → cắt theo tier → chấm lại trên bản đã cắt.
 * Bài Loại B không có body nên bỏ qua toàn bộ phần chấm điểm.
 */
export function normalizeArticle(
  raw: RawArticle,
  commonWords: ReadonlySet<string>,
): NormalizeResult {
  const base = {
    id: stableId(raw.externalId),
    externalId: raw.externalId,
    title: raw.title.trim(),
    slug: slugify(raw.title),
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    topic: raw.topic,
    track: raw.track,
    licenseType: raw.licenseType,
    attribution: raw.attribution ?? null,
    publishedAt: raw.publishedAt ?? null,
    summary: raw.summary?.trim() ?? null,
    thumbnailUrl: raw.thumbnailUrl ?? null,
  };

  if (!raw.bodyText) {
    return {
      ok: true,
      article: {
        ...base,
        passageTier: raw.passageTier ?? 'headline',
        bodyText: null,
        paragraphs: [],
        cefrLevel: null,
        bandRange: null,
        wordCount: null,
        estMinutes: null,
        readabilityScore: null,
        rareWordRatio: null,
      },
    };
  }

  const paragraphs = raw.bodyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const gate = checkQuality(base.title, paragraphs);
  if (!gate.ok) return { ok: false, reason: gate.reason };

  const sampleCefr = analyzeText(sampleForScoring(paragraphs), commonWords).cefr;
  const tier = raw.passageTier ?? assignTier(countWords(raw.bodyText), sampleCefr);
  if (tier === null) return { ok: false, reason: 'too_short' };

  const kept = truncateToTier(paragraphs, tier);
  const bodyText = kept.join('\n\n');
  const analysis = analyzeText(bodyText, commonWords);

  return {
    ok: true,
    article: {
      ...base,
      passageTier: tier,
      bodyText,
      paragraphs: kept,
      cefrLevel: analysis.cefr,
      bandRange: analysis.bandRange,
      wordCount: analysis.wordCount,
      estMinutes: analysis.estMinutes,
      readabilityScore: analysis.fkGrade,
      rareWordRatio: analysis.rareWordRatio,
    },
  };
}

function sampleForScoring(paragraphs: string[]): string {
  const kept: string[] = [];
  let total = 0;

  for (const paragraph of paragraphs) {
    kept.push(paragraph);
    total += countWords(paragraph);
    if (total >= SCORING_SAMPLE_WORDS) break;
  }

  return kept.join('\n\n');
}
```

Giữ nguyên `dedupe`, `slugify`, `stableId`, `fnv1a128` ở phần dưới file — chỉ xoá dòng `import { analyzeText } from './readability';` cũ ở đầu file để không import trùng.

- [ ] **Step 5: Chạy test để chắc là nó pass**

Run: `npx tsx --test "src/services/ingest/pipeline.test.ts"`
Expected: PASS — 7 test

`npm run typecheck` sẽ **báo lỗi ở `scripts/ingest.ts`** vì `normalizeArticle` đổi kiểu trả về. Đúng như dự kiến, sửa ở Task 7. Ghi lại lỗi đó rồi đi tiếp.

- [ ] **Step 6: Commit**

```bash
git add src/types/database.ts src/services/ingest/types.ts src/services/ingest/pipeline.ts src/services/ingest/pipeline.test.ts
git commit -m "feat(ingest): normalizeArticle ap gate + gan tier + cat theo kho tier"
```

---

### Task 4: Crawl theo category Wikipedia

**Files:**
- Modify: `src/services/ingest/http.ts` (thêm `mapWithConcurrency`)
- Modify: `src/services/ingest/sources/wikipedia.ts`
- Create: `src/services/ingest/sources/category-map.ts`

**Interfaces:**
- Consumes: `fetchJson`, `sleep` từ `../http`; `FetchContext`, `RawArticle`, `SourceResult` từ `../types`
- Produces:
  - `mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]>`
  - `TOPIC_CATEGORIES: ReadonlyArray<{ topic: string; en: string[]; simple: string[] }>`
  - `fetchWikipediaCategories(ctx: FetchContext, variant: 'en' | 'simple'): Promise<SourceResult>`
  - `fetchExtract(host: string, title: string): Promise<{ pageid?: number; title?: string; extract?: string; thumbnail?: { source?: string } } | null>` (export từ `wikipedia.ts` để tái dùng)

- [ ] **Step 1: Thêm helper chạy song song có giới hạn**

Thêm vào cuối `src/services/ingest/http.ts`:

```ts
/**
 * Chạy fn trên từng item với tối đa `limit` việc song song.
 * Giữ đúng thứ tự kết quả theo thứ tự item đầu vào.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  const worker = async (): Promise<void> => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index]!, index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker),
  );

  return results;
}
```

- [ ] **Step 2: Tạo map chủ đề → category**

Tạo `src/services/ingest/sources/category-map.ts`:

```ts
/**
 * Map 10 chủ đề của app → category Wikipedia. Đây là file DUY NHẤT phải sửa
 * khi muốn thêm/bớt chủ đề hoặc mở rộng kho bài.
 *
 * Tên category phải viết đúng như trên Wikipedia (phân biệt chữ hoa, dùng dấu
 * cách chứ không gạch dưới — code tự encode).
 */
export const TOPIC_CATEGORIES: ReadonlyArray<{
  topic: string;
  en: string[];
  simple: string[];
}> = [
  {
    topic: 'environment',
    en: ['Climate change', 'Conservation biology', 'Renewable energy', 'Pollution', 'Ecology'],
    simple: ['Environment', 'Climate', 'Energy'],
  },
  {
    topic: 'technology',
    en: ['Artificial intelligence', 'Computer science', 'Robotics', 'Telecommunications'],
    simple: ['Technology', 'Computer science'],
  },
  {
    topic: 'education',
    en: ['Education', 'Educational psychology', 'Language education'],
    simple: ['Education', 'Schools'],
  },
  {
    topic: 'health',
    en: ['Public health', 'Nutrition', 'Epidemiology', 'Human diseases and disorders'],
    simple: ['Health', 'Medicine', 'Diseases'],
  },
  {
    topic: 'science',
    en: ['Physics', 'Astronomy', 'Geology', 'Botany', 'Zoology'],
    simple: ['Science', 'Biology', 'Physics', 'Astronomy'],
  },
  {
    topic: 'business',
    en: ['Economics', 'International trade', 'Management', 'Marketing'],
    simple: ['Economics', 'Business'],
  },
  {
    topic: 'society',
    en: ['Sociology', 'Urban planning', 'Transport', 'Demography'],
    simple: ['Society', 'Transport', 'Cities'],
  },
  {
    topic: 'culture',
    en: ['Cultural heritage', 'Archaeology', 'Music genres', 'Visual arts'],
    simple: ['Culture', 'Art', 'Music'],
  },
  {
    topic: 'history',
    en: ['Ancient history', 'Industrial Revolution', 'History of science', 'Historical eras'],
    simple: ['History', 'Ancient history'],
  },
  {
    topic: 'psychology',
    en: ['Cognitive psychology', 'Memory', 'Motivation', 'Sleep'],
    simple: ['Psychology', 'Human behaviour'],
  },
];
```

- [ ] **Step 3: Tách fetchExtract rồi thêm fetchWikipediaCategories**

Trong `src/services/ingest/sources/wikipedia.ts`:

a) Sửa import đầu file:

```ts
import { fetchJson, mapWithConcurrency, sleep } from '../http';
import { TOPIC_CATEGORIES } from './category-map';
import type { FetchContext, RawArticle, SourceResult } from '../types';
```

b) Thêm hàm `fetchExtract` (tách phần gọi API ra khỏi `fetchWikipedia` để dùng chung — không xoá `fetchWikipedia`, nó vẫn là sàn chất lượng):

```ts
export type WikiPage = {
  pageid?: number;
  title?: string;
  extract?: string;
  missing?: boolean | string;
  thumbnail?: { source?: string };
};

/** Lấy extract toàn bài cho MỘT tiêu đề. exlimit bị hạ xuống 1 nên không gộp được. */
export async function fetchExtract(host: string, title: string): Promise<WikiPage | null> {
  const url =
    `https://${host}/w/api.php?action=query&format=json&formatversion=2` +
    `&prop=extracts|pageimages&explaintext=1&exsectionformat=plain&piprop=thumbnail&pithumbsize=800` +
    `&redirects=1&titles=${encodeURIComponent(title)}`;

  const json = await fetchJson<unknown>(url);
  const pages = normalizePages(json);
  const page = pages[0];

  if (!page || page.missing || !page.extract) return null;
  return page;
}
```

c) Thêm hàm crawl vào cuối file:

```ts
/** Số thành viên lấy tối đa từ mỗi category trước khi lọc. */
const CATEGORY_MEMBER_LIMIT = 500;
/** Nhịp gọi: 400ms giữa hai request, 2 request song song. */
const FETCH_CONCURRENCY = 2;
const FETCH_SPACING_MS = 400;

type CategoryMembersResponse = {
  query?: { categorymembers?: Array<{ title?: string }> };
  continue?: { cmcontinue?: string };
};

async function fetchCategoryTitles(host: string, category: string): Promise<string[]> {
  const titles: string[] = [];
  let cmcontinue: string | undefined;

  do {
    const url =
      `https://${host}/w/api.php?action=query&format=json&formatversion=2` +
      `&list=categorymembers&cmnamespace=0&cmlimit=${CATEGORY_MEMBER_LIMIT}` +
      `&cmtitle=${encodeURIComponent(`Category:${category}`)}` +
      (cmcontinue ? `&cmcontinue=${encodeURIComponent(cmcontinue)}` : '');

    const json = await fetchJson<CategoryMembersResponse>(url);
    for (const member of json.query?.categorymembers ?? []) {
      if (member.title) titles.push(member.title);
    }

    cmcontinue = json.continue?.cmcontinue;
    if (cmcontinue) await sleep(FETCH_SPACING_MS);
  } while (cmcontinue && titles.length < CATEGORY_MEMBER_LIMIT);

  return titles;
}

/**
 * Crawl theo category để lấy số lượng lớn. Quality gate ở pipeline mới là chỗ
 * loại rác — hàm này chỉ lo lấy về và gắn đúng chủ đề.
 */
export async function fetchWikipediaCategories(
  ctx: FetchContext,
  variant: 'en' | 'simple' = 'en',
): Promise<SourceResult> {
  const host = variant === 'simple' ? 'simple.wikipedia.org' : 'en.wikipedia.org';
  const sourceName = variant === 'simple' ? 'Simple Wikipedia' : 'Wikipedia';
  const errors: string[] = [];

  // Gom tiêu đề theo chủ đề, chia đều hạn mức cho các chủ đề.
  const perTopic = Math.max(1, Math.ceil(ctx.limit / TOPIC_CATEGORIES.length));
  const wanted: Array<{ topic: string; title: string }> = [];
  const seen = new Set<string>();

  for (const entry of TOPIC_CATEGORIES) {
    const categories = variant === 'simple' ? entry.simple : entry.en;
    const collected: string[] = [];

    for (const category of categories) {
      if (collected.length >= perTopic) break;
      try {
        for (const title of await fetchCategoryTitles(host, category)) {
          if (collected.length >= perTopic) break;
          if (seen.has(title)) continue;
          seen.add(title);
          collected.push(title);
        }
      } catch (err) {
        errors.push(
          `${sourceName} category "${category}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      await sleep(FETCH_SPACING_MS);
    }

    for (const title of collected) wanted.push({ topic: entry.topic, title });
  }

  ctx.log(`  · ${sourceName}: ${wanted.length} tiêu đề từ category, bắt đầu tải extract`);

  const fetched = await mapWithConcurrency(wanted, FETCH_CONCURRENCY, async (item, index) => {
    // Giãn nhịp theo chỉ số để hai worker không bắn cùng lúc.
    await sleep(FETCH_SPACING_MS * (index % FETCH_CONCURRENCY === 0 ? 1 : 2));

    try {
      const page = await fetchExtract(host, item.title);
      if (!page) return null;

      const pageUrl = `https://${host}/wiki/${encodeURIComponent((page.title ?? item.title).replace(/ /g, '_'))}`;

      const article: RawArticle = {
        externalId: `${variant}-wiki-${page.pageid ?? item.title}`,
        title: page.title ?? item.title,
        sourceName,
        sourceUrl: pageUrl,
        topic: item.topic,
        track: 'academic',
        licenseType: 'cc_by_sa',
        attribution: `Nguồn: ${sourceName}, bài "${page.title ?? item.title}", giấy phép CC BY-SA 4.0. ${pageUrl}`,
        bodyText: page.extract ?? null,
        summary: null,
        ...(page.thumbnail?.source ? { thumbnailUrl: page.thumbnail.source } : {}),
      };

      return article;
    } catch (err) {
      errors.push(`${sourceName} "${item.title}": ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  });

  const articles = fetched.filter((a): a is RawArticle => a !== null);
  ctx.log(`  ✓ ${sourceName}: ${articles.length} bài có nội dung`);

  return { source: sourceName, articles, errors };
}
```

d) `cleanExtract` **không dùng nữa cho nhánh crawl** — việc cắt đã chuyển sang `truncateToTier` trong pipeline. Giữ `cleanExtract` cho `fetchWikipedia` (nhánh curated) nhưng bỏ giới hạn cứng 14 đoạn: đổi dòng `if (kept.length >= 14) break;` thành `if (kept.length >= 60) break;` để pipeline có đủ đoạn mà cắt.

- [ ] **Step 4: Kiểm tra bằng một lần chạy thật, giới hạn nhỏ**

Run:

```bash
npx tsx -e "import{fetchWikipediaCategories}from'./src/services/ingest/sources/wikipedia';const r=await fetchWikipediaCategories({limit:12,log:console.log},'simple');console.log('bài:',r.articles.length,'lỗi:',r.errors.length);console.log(r.articles.slice(0,3).map(a=>a.title+' / '+a.topic))"
```

Expected: in ra ≥8 bài kèm chủ đề khác nhau, không throw. Nếu gặp `HTTP 429` thì nâng `FETCH_SPACING_MS` lên 800 rồi chạy lại.

- [ ] **Step 5: Commit**

```bash
git add src/services/ingest/http.ts src/services/ingest/sources/wikipedia.ts src/services/ingest/sources/category-map.ts
git commit -m "feat(ingest): crawl theo category wikipedia, chay 2 luong co gian nhip"
```

---

### Task 5: Sửa nguồn — CDC, PLOS/arXiv, đề official

**Files:**
- Modify: `src/services/ingest/sources/feeds.ts:39-47` (chuyển CDC)
- Modify: `src/services/ingest/sources/science.ts:43` và `:99`
- Create: `src/services/ingest/sources/official-practice.ts`

**Interfaces:**
- Consumes: `FetchContext`, `RawArticle`, `SourceResult` từ `../types`
- Produces: `fetchOfficialPractice(ctx: FetchContext): SourceResult` — **đồng bộ, không async**, vì đây là danh sách tĩnh

- [ ] **Step 1: Chuyển CDC sang feed chỉ tiêu đề**

Trong `src/services/ingest/sources/feeds.ts`, **cắt** khối `{ key: 'cdc', ... }` ra khỏi `FULL_TEXT_FEEDS` và **dán** vào đầu `HEADLINE_FEEDS`, đổi hai field:

```ts
  {
    key: 'cdc',
    name: 'CDC',
    url: 'https://tools.cdc.gov/api/v2/resources/media/132608.rss',
    topic: 'health',
    // Feed này KHÔNG có content:encoded và description chỉ ~14 từ — đã kiểm
    // thật: HTTP 200 với 1836 item nhưng 0 bài lọt ngưỡng 180 từ. Nó là feed
    // media/embed, bản chất chỉ có tiêu đề, nên thuộc Loại B.
    fullText: false,
    license: 'headline_only',
  },
```

Xoá dòng `attribution` của CDC — bài Loại B không cần attribution vì không lưu nội dung.

`FULL_TEXT_FEEDS` giờ chỉ còn NASA. Sửa comment đầu file cho khớp: bỏ `NIH, ScienceDaily` khỏi danh sách Loại A vì chúng không phải Loại A.

- [ ] **Step 2: Nâng hạn mức PLOS và arXiv**

`src/services/ingest/sources/science.ts` dòng 43: `rows: '4'` → `rows: '25'`

Cùng file dòng 99: `max_results: '4'` → `max_results: '25'`

- [ ] **Step 3: Thêm nguồn đề official**

Tạo `src/services/ingest/sources/official-practice.ts`:

```ts
import type { FetchContext, RawArticle, SourceResult } from '../types';

/**
 * Đề luyện chính thức miễn phí của ielts.org và British Council.
 *
 * Danh sách TĨNH, không crawl, không tải PDF, không parse nội dung — chỉ lưu
 * tiêu đề + link + mô tả để app mở bằng expo-web-browser. Đây là Loại B:
 * licenseType 'headline_only' nên CHECK constraint ở DB tự chặn nếu ai đó
 * lỡ gán bodyText.
 */
const ITEMS: ReadonlyArray<{
  key: string;
  title: string;
  url: string;
  track: RawArticle['track'];
  summary: string;
}> = [
  {
    key: 'academic-reading-sample-tasks',
    title: 'IELTS Academic Reading — sample tasks (official)',
    url: 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test',
    track: 'academic',
    summary: 'Bộ đề mẫu Academic Reading do IELTS phát hành, PDF 46 trang, kèm answer sheet.',
  },
  {
    key: 'general-training-reading-sample-tasks',
    title: 'IELTS General Training Reading — sample tasks (official)',
    url: 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test',
    track: 'general_training',
    summary: 'Bộ đề mẫu General Training Reading do IELTS phát hành, PDF 33 trang, kèm answer sheet.',
  },
  {
    key: 'british-council-reading-academic',
    title: 'British Council — Academic Reading practice test',
    url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/reading/academic',
    track: 'academic',
    summary: 'Đề Academic Reading luyện online miễn phí, có bản tải về để làm trên giấy.',
  },
  {
    key: 'british-council-reading-general',
    title: 'British Council — General Training Reading practice test',
    url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/reading/general-training',
    track: 'general_training',
    summary: 'Đề General Training Reading luyện online miễn phí, có bản tải về.',
  },
  {
    key: 'british-council-all-practice-tests',
    title: 'British Council — toàn bộ đề luyện 4 kỹ năng',
    url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests',
    track: 'academic',
    summary: 'Trang tổng hợp đề luyện miễn phí cho cả bốn kỹ năng.',
  },
];

export function fetchOfficialPractice(ctx: FetchContext): SourceResult {
  const articles: RawArticle[] = ITEMS.map((item) => ({
    externalId: `official-${item.key}`,
    title: item.title,
    sourceName: 'IELTS Official',
    sourceUrl: item.url,
    topic: 'education',
    track: item.track,
    licenseType: 'headline_only',
    passageTier: 'official_practice',
    summary: item.summary,
    bodyText: null,
  }));

  ctx.log(`  ✓ IELTS Official: ${articles.length} mục (link ra ngoài, không lưu nội dung)`);
  return { source: 'IELTS Official', articles, errors: [] };
}
```

- [ ] **Step 4: Kiểm tra CDC giờ ra bài, và official ra 5 mục**

Run:

```bash
npx tsx -e "import{HEADLINE_FEEDS,FULL_TEXT_FEEDS,fetchFeed}from'./src/services/ingest/sources/feeds';import{fetchOfficialPractice}from'./src/services/ingest/sources/official-practice';const ctx={limit:6,log:console.log};console.log('FULL_TEXT_FEEDS:',FULL_TEXT_FEEDS.map(f=>f.key));const cdc=HEADLINE_FEEDS.find(f=>f.key==='cdc');const r=await fetchFeed(cdc,ctx);console.log('CDC bài:',r.articles.length,'body phải null:',r.articles.every(a=>a.bodyText===null));console.log('official:',fetchOfficialPractice(ctx).articles.length)"
```

Expected: `FULL_TEXT_FEEDS: [ 'nasa' ]` · `CDC bài: 6` · `body phải null: true` · `official: 5`

- [ ] **Step 5: Commit**

```bash
git add src/services/ingest/sources/feeds.ts src/services/ingest/sources/science.ts src/services/ingest/sources/official-practice.ts
git commit -m "fix(ingest): CDC la nguon chi tieu de; nang han muc PLOS/arXiv; them de official"
```

---

### Task 6: Seed writer — tách index và chunk

**Files:**
- Create: `src/services/ingest/seed-writer.ts`
- Test: `src/services/ingest/seed-writer.test.ts`

**Interfaces:**
- Consumes: `IngestedArticle` từ `./types`
- Produces:
  - `CHUNK_SIZE: 50`
  - `type ArticleBody = { bodyText: string; paragraphs: string[] }`
  - `type SeedIndexEntry = Omit<IngestedArticle, 'bodyText' | 'paragraphs'> & { chunk: number | null }`
  - `buildSeedBundle(articles: IngestedArticle[]): { index: SeedIndexEntry[]; chunks: Array<Record<string, ArticleBody>> }`
  - `renderRegistry(chunkCount: number): string`
  - `writeSeedBundle(seedDir: string, articles: IngestedArticle[]): { chunkCount: number; indexCount: number }`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/ingest/seed-writer.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CHUNK_SIZE, buildSeedBundle, renderRegistry } from './seed-writer';
import type { IngestedArticle } from './types';

function article(i: number, withBody = true): IngestedArticle {
  return {
    id: `id-${i}`,
    externalId: `ext-${i}`,
    title: `Article ${i}`,
    slug: `article-${i}`,
    sourceName: 'Wikipedia',
    sourceUrl: 'https://example.org/a',
    topic: 'science',
    track: 'academic',
    licenseType: withBody ? 'cc_by_sa' : 'headline_only',
    passageTier: withBody ? 'p1' : 'headline',
    attribution: null,
    publishedAt: null,
    summary: 'summary',
    bodyText: withBody ? `body of ${i}\n\nsecond paragraph` : null,
    paragraphs: withBody ? [`body of ${i}`, 'second paragraph'] : [],
    thumbnailUrl: null,
    cefrLevel: withBody ? 'B1' : null,
    bandRange: withBody ? 'Band 5–6' : null,
    wordCount: withBody ? 5 : null,
    estMinutes: withBody ? 1 : null,
    readabilityScore: withBody ? 8 : null,
    rareWordRatio: withBody ? 0.1 : null,
  };
}

test('buildSeedBundle: index KHÔNG chứa bodyText hay paragraphs', () => {
  const { index } = buildSeedBundle([article(1)]);
  const entry = index[0]! as Record<string, unknown>;

  assert.equal('bodyText' in entry, false, 'index không được mang bodyText');
  assert.equal('paragraphs' in entry, false, 'index không được mang paragraphs');
  assert.equal(entry.title, 'Article 1');
  assert.equal(entry.passageTier, 'p1');
});

test('buildSeedBundle: body nằm trong chunk, tra được theo id', () => {
  const { index, chunks } = buildSeedBundle([article(1)]);
  const chunkIndex = index[0]!.chunk!;

  assert.equal(typeof chunkIndex, 'number');
  assert.deepEqual(chunks[chunkIndex]!['id-1'], {
    bodyText: 'body of 1\n\nsecond paragraph',
    paragraphs: ['body of 1', 'second paragraph'],
  });
});

test('buildSeedBundle: bài không có body thì chunk là null', () => {
  const { index, chunks } = buildSeedBundle([article(1, false)]);

  assert.equal(index[0]!.chunk, null);
  assert.equal(chunks.length, 0, 'không sinh chunk rỗng');
});

test('buildSeedBundle: chia chunk theo CHUNK_SIZE', () => {
  const articles = Array.from({ length: CHUNK_SIZE + 3 }, (_, i) => article(i));
  const { index, chunks } = buildSeedBundle(articles);

  assert.equal(chunks.length, 2);
  assert.equal(Object.keys(chunks[0]!).length, CHUNK_SIZE);
  assert.equal(Object.keys(chunks[1]!).length, 3);
  assert.equal(index[CHUNK_SIZE]!.chunk, 1);
});

test('buildSeedBundle: bài không body không chiếm slot chunk', () => {
  const articles = [article(0, false), article(1), article(2, false), article(3)];
  const { index, chunks } = buildSeedBundle(articles);

  assert.equal(chunks.length, 1);
  assert.deepEqual(Object.keys(chunks[0]!).sort(), ['id-1', 'id-3']);
  assert.equal(index[0]!.chunk, null);
  assert.equal(index[1]!.chunk, 0);
});

test('renderRegistry: sinh require() TĨNH cho Metro thấy được lúc build', () => {
  const code = renderRegistry(2);

  assert.match(code, /require\('\.\/chunk-00\.json'\)/);
  assert.match(code, /require\('\.\/chunk-01\.json'\)/);
  // Không được dùng template string trong require — Metro không phân tích được.
  assert.equal(/require\(`/.test(code), false);
});

test('renderRegistry: 0 chunk vẫn ra file hợp lệ', () => {
  const code = renderRegistry(0);
  assert.match(code, /export const CHUNKS/);
});
```

- [ ] **Step 2: Chạy test để chắc là nó fail**

Run: `npx tsx --test "src/services/ingest/seed-writer.test.ts"`
Expected: FAIL — `Cannot find module './seed-writer'`

- [ ] **Step 3: Viết implementation tối thiểu**

Tạo `src/services/ingest/seed-writer.ts`:

```ts
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { IngestedArticle } from './types';

/**
 * Kho bài chia làm hai phần:
 * - index.json  : metadata mọi bài, bundle sẵn để Library duyệt/lọc tức thì
 * - bodies/chunk-NN.json : body, nạp lười qua require() nên hoãn được phần parse
 *
 * Lý do: src/data/articles.ts từng import cả kho bài vào JS bundle. 126 bài đã
 * 1.8MB; 1000 bài sẽ ~14MB.
 */
export const CHUNK_SIZE = 50;

export type ArticleBody = { bodyText: string; paragraphs: string[] };

export type SeedIndexEntry = Omit<IngestedArticle, 'bodyText' | 'paragraphs'> & {
  /** null khi bài không có body (Loại B, đề official). */
  chunk: number | null;
};

export function buildSeedBundle(articles: IngestedArticle[]): {
  index: SeedIndexEntry[];
  chunks: Array<Record<string, ArticleBody>>;
} {
  const index: SeedIndexEntry[] = [];
  const chunks: Array<Record<string, ArticleBody>> = [];
  let withBody = 0;

  for (const article of articles) {
    const { bodyText, paragraphs, ...meta } = article;

    if (bodyText === null) {
      index.push({ ...meta, chunk: null });
      continue;
    }

    const chunkIndex = Math.floor(withBody / CHUNK_SIZE);
    if (!chunks[chunkIndex]) chunks[chunkIndex] = {};
    chunks[chunkIndex][article.id] = { bodyText, paragraphs };

    index.push({ ...meta, chunk: chunkIndex });
    withBody += 1;
  }

  return { index, chunks };
}

/** Map phải TĨNH: Metro chỉ thấy require() có chuỗi literal lúc build. */
export function renderRegistry(chunkCount: number): string {
  const lines = Array.from(
    { length: chunkCount },
    (_, i) => `  ${i}: () => require('./chunk-${String(i).padStart(2, '0')}.json'),`,
  );

  return [
    '// FILE NÀY DO scripts/ingest.ts SINH RA. ĐỪNG SỬA TAY.',
    '// require() phải là chuỗi literal để Metro phân tích được lúc build.',
    '',
    'export const CHUNKS: Record<number, () => unknown> = {',
    ...lines,
    '};',
    '',
  ].join('\n');
}

export function writeSeedBundle(
  seedDir: string,
  articles: IngestedArticle[],
): { chunkCount: number; indexCount: number } {
  const { index, chunks } = buildSeedBundle(articles);
  const bodiesDir = join(seedDir, 'bodies');

  mkdirSync(bodiesDir, { recursive: true });

  // Xoá chunk cũ, tránh để lại file mồ côi khi kho bài co lại.
  for (const name of readdirSync(bodiesDir)) {
    if (/^chunk-\d+\.json$/.test(name)) rmSync(join(bodiesDir, name));
  }

  writeFileSync(join(seedDir, 'index.json'), JSON.stringify(index, null, 2), 'utf8');

  chunks.forEach((chunk, i) => {
    const name = `chunk-${String(i).padStart(2, '0')}.json`;
    writeFileSync(join(bodiesDir, name), JSON.stringify(chunk), 'utf8');
  });

  writeFileSync(join(bodiesDir, 'registry.ts'), renderRegistry(chunks.length), 'utf8');

  return { chunkCount: chunks.length, indexCount: index.length };
}
```

- [ ] **Step 4: Chạy test để chắc là nó pass**

Run: `npx tsx --test "src/services/ingest/seed-writer.test.ts"`
Expected: PASS — 7 test

- [ ] **Step 5: Commit**

```bash
git add src/services/ingest/seed-writer.ts src/services/ingest/seed-writer.test.ts
git commit -m "feat(ingest): tach seed thanh index + chunk body + registry tinh"
```

---

### Task 7: Ingest orchestration — checkpoint, resume, nguồn mới

**Files:**
- Modify: `scripts/ingest.ts` (viết lại `main`, `parseArgs`, phần ghi seed và push)

**Interfaces:**
- Consumes: `normalizeArticle`/`NormalizeResult` (Task 3), `fetchWikipediaCategories` (Task 4), `fetchOfficialPractice` (Task 5), `writeSeedBundle` (Task 6), `RejectReason` (Task 2)
- Produces: CLI `npm run ingest` với cờ `--limit`, `--only`, `--push`, `--replace`, `--rescore`, `--resume`; ghi `src/data/seed/.ingest-state.json`

- [ ] **Step 1: Thêm cờ --resume và state file**

Trong `scripts/ingest.ts`, sửa `parseArgs`:

```ts
function parseArgs(argv: string[]) {
  const args = {
    limit: 12,
    push: false,
    replace: false,
    rescore: false,
    resume: false,
    only: [] as string[],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--limit') args.limit = Math.max(1, Number(argv[++i]) || 12);
    else if (arg === '--push') args.push = true;
    else if (arg === '--replace') args.replace = true;
    else if (arg === '--rescore') args.rescore = true;
    else if (arg === '--resume') args.resume = true;
    else if (arg === '--only') args.only.push(String(argv[++i]));
  }

  return args;
}
```

Thêm hằng số cạnh `SEED_PATH` và đổi `SEED_PATH` thành thư mục:

```ts
const SEED_DIR = resolve(ROOT, 'src/data/seed');
const INDEX_PATH = resolve(SEED_DIR, 'index.json');
const STATE_PATH = resolve(SEED_DIR, '.ingest-state.json');
```

Thêm hai hàm quản lý state ở cuối file:

```ts
type IngestState = { doneSources: string[] };

function loadState(resume: boolean): IngestState {
  if (!resume || !existsSync(STATE_PATH)) return { doneSources: [] };
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8')) as IngestState;
  } catch {
    return { doneSources: [] };
  }
}

function saveState(state: IngestState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}
```

- [ ] **Step 2: Viết lại main để checkpoint sau từng nguồn**

Thay phần thân `main` từ dòng `const results: SourceResult[] = [];` tới trước `if (args.push)` bằng:

```ts
  const state = loadState(args.resume);
  const rejected: Record<string, number> = {};
  let collected: IngestedArticle[] = args.replace ? [] : loadExistingIndex();

  /** Chạy một nguồn rồi ghi seed ngay — job dài 5-8 phút nên không được mất giữa đường. */
  const runSource = async (
    key: string,
    label: string,
    run: () => Promise<SourceResult> | SourceResult,
  ): Promise<void> => {
    if (!matches(args.only, key)) return;
    if (state.doneSources.includes(key)) {
      log(`\n▸ ${label} — bỏ qua, đã xong ở lần chạy trước (--resume)`);
      return;
    }

    log(`\n▸ ${label}`);

    let result: SourceResult;
    try {
      result = await run();
    } catch (err) {
      log(`  ✗ ${label} lỗi hẳn: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    for (const raw of result.articles) {
      const normalized = normalizeArticle(raw, commonWords);
      if (!normalized.ok) {
        rejected[normalized.reason] = (rejected[normalized.reason] ?? 0) + 1;
        continue;
      }
      collected.push(normalized.article);
    }

    collected = dedupe(collected);
    writeSeedBundle(SEED_DIR, collected);

    state.doneSources.push(key);
    saveState(state);

    for (const e of result.errors.slice(0, 5)) log(`  - ${e}`);
    log(`  ✓ ${label}: kho bài hiện ${collected.length} bài (đã ghi seed)`);
  };

  await runSource('wikipedia', 'Wikipedia — tiêu đề curated (sàn chất lượng)', () =>
    fetchWikipedia(ctx, 'en'),
  );
  await runSource('simple-wikipedia', 'Simple Wikipedia — tiêu đề curated', () =>
    fetchWikipedia({ ...ctx, limit: Math.ceil(args.limit / 2) }, 'simple'),
  );
  await runSource('wikipedia-categories', 'Wikipedia — crawl theo category', () =>
    fetchWikipediaCategories(ctx, 'en'),
  );
  await runSource('simple-wikipedia-categories', 'Simple Wikipedia — crawl theo category', () =>
    fetchWikipediaCategories(ctx, 'simple'),
  );
  await runSource('feeds', 'NASA (public domain)', async () => {
    const results = await Promise.all(FULL_TEXT_FEEDS.map((feed) => fetchFeed(feed, ctx)));
    return mergeResults('Loại A qua RSS', results);
  });
  await runSource('plos', 'PLOS ONE (CC BY)', () => fetchPlos(ctx));
  await runSource('arxiv', 'arXiv abstracts', () => fetchArxiv(ctx));
  await runSource('official', 'Đề chính thức IELTS / British Council', () =>
    fetchOfficialPractice(ctx),
  );
  await runSource('headlines', 'Loại B — CHỈ tiêu đề + link gốc', async () => {
    const results = await Promise.all(
      HEADLINE_FEEDS.map((feed) => fetchFeed(feed, { ...ctx, limit: Math.min(args.limit, 6) })),
    );
    return mergeResults('Loại B', results);
  });

  const written = writeSeedBundle(SEED_DIR, collected);

  log('\n── Kết quả ──');
  log(`Kho bài: ${written.indexCount} bài · ${written.chunkCount} chunk body`);
  log(`Có toàn văn: ${collected.filter((a) => a.bodyText).length}`);
  log(`Chỉ tiêu đề:  ${collected.filter((a) => !a.bodyText).length}`);
  log(`Phân bố tier: ${JSON.stringify(countBy(collected, (a) => a.passageTier ?? 'null'))}`);
  log(`Phân bố CEFR: ${JSON.stringify(countBy(collected, (a) => a.cefrLevel ?? 'null'))}`);

  if (Object.keys(rejected).length > 0) {
    log(`\nBài bị loại theo lý do: ${JSON.stringify(rejected)}`);
  }
```

Thêm ba helper ở cuối file:

```ts
function mergeResults(label: string, results: SourceResult[]): SourceResult {
  return {
    source: label,
    articles: results.flatMap((r) => r.articles),
    errors: results.flatMap((r) => r.errors),
  };
}

function loadExistingIndex(): IngestedArticle[] {
  // Index không mang body, nên bài cũ được nạp lại dưới dạng metadata rỗng body.
  // Chạy lại nguồn sẽ ghi đè bằng bản đầy đủ; bài không chạy lại vẫn giữ metadata.
  if (!existsSync(INDEX_PATH)) return [];
  try {
    const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8')) as Array<
      Record<string, unknown>
    >;
    return index.map((entry) => {
      const { chunk: _chunk, ...meta } = entry;
      return { ...meta, bodyText: null, paragraphs: [] } as unknown as IngestedArticle;
    });
  } catch {
    return [];
  }
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}
```

- [ ] **Step 3: Sửa import và phần --rescore, --push**

Đầu file, sửa import:

```ts
import { dedupe, normalizeArticle } from '../src/services/ingest/pipeline';
import { writeSeedBundle } from '../src/services/ingest/seed-writer';
import { fetchOfficialPractice } from '../src/services/ingest/sources/official-practice';
import {
  fetchWikipedia,
  fetchWikipediaCategories,
} from '../src/services/ingest/sources/wikipedia';
```

Trong nhánh `args.rescore`, đổi `SEED_PATH` → `INDEX_PATH` và `writeSeed(rescored)` → bỏ nhánh này đi kèm ghi chú, vì index không còn body nên rescore mất ý nghĩa:

```ts
  if (args.rescore) {
    log(
      'Cờ --rescore đã bỏ: body giờ nằm trong chunk, không nằm trong index.\n' +
        'Muốn chấm lại thì chạy lại nguồn tương ứng, ví dụ: npm run ingest -- --only wikipedia-categories',
    );
    return;
  }
```

Trong `pushToSupabase`, thêm một dòng vào `rows`:

```ts
    passage_tier: a.passageTier,
```

- [ ] **Step 4: Chạy thử với hạn mức nhỏ**

Run:

```bash
npm run ingest -- --limit 4 --replace --only official --only plos
```

Expected: in ra `Đề chính thức IELTS`, `PLOS ONE`, rồi bảng kết quả có `Phân bố tier` chứa `official_practice: 5` và `short_academic`. Kiểm tra file sinh ra:

```bash
ls src/data/seed src/data/seed/bodies
```

Expected: `index.json`, `.ingest-state.json`, `bodies/chunk-00.json`, `bodies/registry.ts`

- [ ] **Step 5: Kiểm tra --resume bỏ qua nguồn đã xong**

Run: `npm run ingest -- --limit 4 --resume --only official --only plos`
Expected: cả hai nguồn in `bỏ qua, đã xong ở lần chạy trước`

- [ ] **Step 6: Commit**

```bash
git add scripts/ingest.ts
git commit -m "feat(ingest): checkpoint sau tung nguon + --resume + nguon moi + bao cao tier"
```

---

### Task 8: Migration Supabase

**Files:**
- Create: `supabase/migrations/20260810000100_passage_tier.sql`

**Interfaces:**
- Consumes: bảng `articles` và `questions` từ `supabase/migrations/20260809000100_init.sql`
- Produces: cột `articles.passage_tier`; `questions.evidence_paragraph_index` cho phép null

- [ ] **Step 1: Đọc phần liên quan của migration gốc**

Run:

```bash
grep -n "passage\|evidence_paragraph_index\|create type\|article_track" supabase/migrations/20260809000100_init.sql | head -20
```

Ghi lại tên type enum đang dùng cho `track` — migration mới phải theo đúng quy ước đó (dùng enum hay dùng text + CHECK).

- [ ] **Step 2: Viết migration**

Tạo `supabase/migrations/20260810000100_passage_tier.sql`:

```sql
-- Tier passage bám cấu trúc Reading của IELTS: 3 passage tăng dần độ dài/độ khó,
-- cộng ba loại ngoài đề thi (abstract ngắn, tin tức chỉ tiêu đề, đề official).
create type passage_tier as enum (
  'p1',
  'p2',
  'p3',
  'short_academic',
  'headline',
  'official_practice'
);

alter table articles
  add column passage_tier passage_tier;

-- Lọc theo tier là truy vấn chính của màn Library.
create index articles_passage_tier_idx on articles (passage_tier);
create index articles_track_tier_idx on articles (track, passage_tier);

-- Bài không có toàn văn thì không thể là passage: chặn ở tầng DB cho chắc,
-- cùng tinh thần với CHECK constraint bản quyền đã có.
alter table articles
  add constraint articles_tier_needs_body check (
    passage_tier is null
    or passage_tier in ('headline', 'official_practice')
    or body_text is not null
  );

-- Câu hỏi sinh từ sổ từ (spec C) không có đoạn văn nào để trỏ tới, nên
-- evidence_paragraph_index phải cho phép null.
alter table questions
  alter column evidence_paragraph_index drop not null;
```

- [ ] **Step 3: Kiểm tra cú pháp**

Nếu có Docker và Supabase CLI:

Run: `npx supabase db reset --local`
Expected: chạy hết mọi migration không lỗi.

Nếu không có Docker, kiểm bằng mắt hai điều: (a) tên type `passage_tier` khớp đúng danh sách trong `src/types/database.ts`; (b) `questions.evidence_paragraph_index` trong migration gốc thật sự đang `not null` — nếu vốn đã nullable thì **xoá** câu `alter column` cuối để migration không lỗi.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260810000100_passage_tier.sql
git commit -m "feat(db): cot passage_tier + cho evidence_paragraph_index nullable"
```

---

### Task 9: Repository đọc body + sửa articles.ts

**Files:**
- Create: `src/data/article-repository.ts`
- Test: `src/data/article-repository.test.ts`
- Modify: `src/data/articles.ts`
- Modify: `src/store/useUserArticleStore.ts:41-63`

**Interfaces:**
- Consumes: `ArticleBody`, `SeedIndexEntry` từ `@/services/ingest/seed-writer`; `CHUNKS` từ `./seed/bodies/registry`
- Produces:
  - `type ArticleMeta = SeedIndexEntry`
  - `type Article = ArticleMeta & ArticleBody` — shape đầy đủ, dùng ở màn đọc và bài tự dán
  - `getArticleBody(id: string): ArticleBody | null` — **đồng bộ**, `require()` trong Metro là đồng bộ nên không cần async
  - `hydrate(meta: ArticleMeta): Article | null`
  - `articles.ts` giữ nguyên tên hàm: `filterArticles`, `getArticleById`, `isReadable`, `libraryStats`, `topicLabel`, `topicLabelVi`, `TOPICS`, `CEFR_LEVELS`, `ARTICLES`

**Lưu ý quan trọng:** `isReadable` hiện kiểm `Boolean(article.bodyText)` — index không có `bodyText` nên hàm này **vỡ**. Phải đổi sang kiểm `licenseType`.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/data/article-repository.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { chunkOf, pickBody } from './article-repository';
import type { ArticleBody } from '@/services/ingest/seed-writer';

const chunk: Record<string, ArticleBody> = {
  'id-1': { bodyText: 'first body', paragraphs: ['first body'] },
};

test('pickBody: tra được body theo id trong chunk', () => {
  assert.deepEqual(pickBody(chunk, 'id-1'), { bodyText: 'first body', paragraphs: ['first body'] });
});

test('pickBody: id không có trong chunk thì trả null, không throw', () => {
  assert.equal(pickBody(chunk, 'id-999'), null);
});

test('pickBody: chunk hỏng kiểu thì trả null', () => {
  assert.equal(pickBody(null, 'id-1'), null);
  assert.equal(pickBody('not an object' as unknown as Record<string, ArticleBody>, 'id-1'), null);
});

test('chunkOf: bài không có chunk thì trả null', () => {
  assert.equal(chunkOf(null), null);
});
```

- [ ] **Step 2: Chạy test để chắc là nó fail**

Run: `npx tsx --test "src/data/article-repository.test.ts"`
Expected: FAIL — `Cannot find module './article-repository'`

- [ ] **Step 3: Viết repository**

Tạo `src/data/article-repository.ts`:

```ts
import { CHUNKS } from './seed/bodies/registry';
import type { ArticleBody, SeedIndexEntry } from '@/services/ingest/seed-writer';

/**
 * Đọc body bài theo yêu cầu.
 *
 * require() trong Metro là ĐỒNG BỘ — nó hoãn phần parse JSON tới lần gọi đầu,
 * chứ không trả Promise. Nên hàm này đồng bộ được, và màn đọc không cần trạng
 * thái loading. Đổi sang Supabase về sau thì phải chuyển thành async.
 */
export type ArticleMeta = SeedIndexEntry;
export type { ArticleBody };

const loaded = new Map<number, Record<string, ArticleBody> | null>();

export function chunkOf(chunkIndex: number | null): Record<string, ArticleBody> | null {
  if (chunkIndex === null) return null;
  if (loaded.has(chunkIndex)) return loaded.get(chunkIndex) ?? null;

  const loader = CHUNKS[chunkIndex];
  let value: Record<string, ArticleBody> | null = null;

  if (loader) {
    try {
      value = loader() as Record<string, ArticleBody>;
    } catch {
      // Chunk thiếu hoặc hỏng: không làm sập app, màn đọc sẽ hiện thông báo.
      value = null;
    }
  }

  loaded.set(chunkIndex, value);
  return value;
}

export function pickBody(
  chunk: Record<string, ArticleBody> | null,
  id: string,
): ArticleBody | null {
  if (!chunk || typeof chunk !== 'object') return null;
  const body = chunk[id];
  if (!body || typeof body.bodyText !== 'string' || !Array.isArray(body.paragraphs)) return null;
  return body;
}

export function getArticleBody(meta: Pick<ArticleMeta, 'id' | 'chunk'>): ArticleBody | null {
  return pickBody(chunkOf(meta.chunk), meta.id);
}
```

- [ ] **Step 4: Chạy test để chắc là nó pass**

Run: `npx tsx --test "src/data/article-repository.test.ts"`
Expected: PASS — 4 test

- [ ] **Step 5: Sửa articles.ts đọc index**

Trong `src/data/articles.ts`:

a) Đổi hai dòng đầu:

```ts
import index from './seed/index.json';
import { getArticleBody, type ArticleBody, type ArticleMeta } from './article-repository';
import type { ArticleTrack, CefrLevel, PassageTier } from '@/types/database';
```

b) Đổi khai báo type và `ARTICLES`:

```ts
/** Metadata bài đọc — thứ Library dùng để duyệt và lọc. Không mang body. */
export type { ArticleMeta };
/** Bài đọc đầy đủ, đã có body. Màn đọc và bài tự dán dùng shape này. */
export type Article = ArticleMeta & ArticleBody;

export const ARTICLES: ArticleMeta[] = index as unknown as ArticleMeta[];
```

c) Đổi `isReadable` — **đây là chỗ vỡ nếu bỏ sót**:

```ts
/**
 * Đọc được trong app hay không. Trước đây kiểm Boolean(bodyText), nhưng index
 * không mang bodyText nữa. Kiểm giấy phép là đúng bản chất hơn: Loại B và đề
 * official đều dùng 'headline_only' và chỉ mở link ra ngoài.
 */
export function isReadable(article: Pick<ArticleMeta, 'licenseType'>): boolean {
  return article.licenseType !== 'headline_only';
}
```

d) Đổi chữ ký `getArticleById` và thêm `getArticleWithBody`:

```ts
export function getArticleById(id: string): ArticleMeta | undefined {
  return ARTICLES.find((a) => a.id === id);
}

/** Metadata + body, dùng ở màn đọc. Trả undefined nếu không có bài hoặc mất chunk. */
export function getArticleWithBody(id: string): Article | undefined {
  const meta = getArticleById(id);
  if (!meta) return undefined;

  const body = getArticleBody(meta);
  if (!body) return undefined;

  return { ...meta, ...body };
}
```

e) Trong `ArticleFilters` thêm `tier`, và trong `filterArticles` thêm một dòng lọc ngay sau dòng `if (topic && ...)`:

```ts
    if (tier && tier !== 'all' && a.passageTier !== tier) return false;
```

Khai báo trong type và destructure:

```ts
  tier?: PassageTier | 'all';
```
```ts
  const { search, topic, track = 'all', level = 'all', kind = 'all', tier = 'all', sort = 'newest' } = filters;
```

f) Đổi kiểu tham số của `sortArticles` từ `Article[]` sang `ArticleMeta[]` và giá trị trả về tương ứng; `filterArticles` trả `ArticleMeta[]`.

- [ ] **Step 6: Cho bài tự dán có chunk**

**Đã đổi trong lúc thực thi:** `passageTier: null` đã được thêm ở **Task 3**, không phải ở đây. Lý do: Task 3 làm `passageTier` thành field bắt buộc của `IngestedArticle`, nên `useUserArticleStore` vỡ typecheck ngay tại Task 3 chứ không chờ được tới Task 9 — đây là lỗi thứ tự trong bản nháp plan. Đã xác minh `useUserArticleStore.ts` là chỗ construct `IngestedArticle` duy nhất còn lại ngoài `pipeline.ts`.

Nên ở task này chỉ còn **một** field phải thêm vào object `article` trong `src/store/useUserArticleStore.ts`:

```ts
          chunk: null,
```

Kiểm trước khi sửa: nếu `passageTier: null` chưa có ở đó thì Task 3 đã làm sai — thêm cả hai và ghi vào report.

- [ ] **Step 7: Kiểm tra typecheck và test**

Run: `npm run typecheck`

Expected: chỉ còn lỗi ở `app/read/[id].tsx` (sửa ở Task 10) và có thể ở `app/library.tsx` nếu nó dùng `Article` chỗ cần `ArticleMeta`. Ghi lại danh sách lỗi.

Run: `npm test` → PASS toàn bộ.

- [ ] **Step 8: Commit**

```bash
git add src/data/article-repository.ts src/data/article-repository.test.ts src/data/articles.ts src/store/useUserArticleStore.ts
git commit -m "feat(data): repository doc body theo chunk, articles.ts doc index, isReadable theo license"
```

---

### Task 10: Màn đọc lấy body qua repository

**Files:**
- Modify: `app/read/[id].tsx:12` và `:26`
- Modify: `app/library.tsx` (nếu Task 9 báo lỗi typecheck ở đây)

**Interfaces:**
- Consumes: `getArticleWithBody`, `getArticleById`, `isReadable` từ `@/data/articles`
- Produces: không có API mới — chỉ sửa chỗ tiêu thụ

- [ ] **Step 1: Sửa import**

`app/read/[id].tsx` dòng 12:

```ts
import { getArticleById, getArticleWithBody, isReadable, topicLabel } from '@/data/articles';
```

- [ ] **Step 2: Sửa chỗ lấy bài**

Thay dòng 24–26 bằng:

```ts
  const userArticle = useUserArticleStore((s) => (id ? s.articles[id] : undefined));

  // Ba trường hợp: bài seed đọc được (có body trong chunk), bài seed chỉ tiêu đề
  // (không có chunk — nhánh isReadable phía dưới xử lý), và bài tự dán.
  const article = useMemo(() => {
    if (!id) return userArticle;

    const withBody = getArticleWithBody(id);
    if (withBody) return withBody;

    const meta = getArticleById(id);
    if (meta) return { ...meta, bodyText: null, paragraphs: [] as string[] };

    return userArticle;
  }, [id, userArticle]);
```

- [ ] **Step 3: Chạy typecheck, sửa hết lỗi còn lại**

Run: `npm run typecheck`

Nếu `app/library.tsx` báo lỗi vì dùng `Article` ở chỗ giờ là `ArticleMeta`, đổi import và annotation trong file đó sang `ArticleMeta`. Library không cần body nên không phải sửa logic.

Nếu `src/components/article/ArticleCard.tsx` báo lỗi cùng lý do, đổi prop type sang `ArticleMeta`.

Expected sau khi sửa: `npm run typecheck` sạch hoàn toàn.

- [ ] **Step 4: Chạy app xem màn đọc còn hoạt động**

Run: `npm run web`

Kiểm bằng tay: mở Library → chọn một bài Loại A → thấy đủ nội dung, tô màu được, chạm từ ra WordSheet. Rồi mở một bài Loại B → thấy màn "mở link gốc", không crash.

- [ ] **Step 5: Commit**

```bash
git add app/read/\[id\].tsx app/library.tsx src/components/article/ArticleCard.tsx
git commit -m "feat(reader): lay body qua repository, xu ly bai chi tieu de"
```

---

### Task 11: Chạy ingest thật và kiểm phân bố

**Files:**
- Modify: `src/data/seed/index.json` và `src/data/seed/bodies/*` (do script sinh)
- Modify: `README.md` (cập nhật mục "Cào bài đọc")

**Interfaces:**
- Consumes: toàn bộ Task 1–10
- Produces: kho bài thật, phân bố tier kiểm được

- [ ] **Step 1: Chạy ingest đầy đủ**

Run:

```bash
npm run ingest -- --limit 120 --replace
```

Job này chạy 5–8 phút. Nếu bị ngắt, chạy lại với `--resume` thay cho `--replace`.

Expected: bảng kết quả in ra `Phân bố tier` có cả `p1`, `p2`, `p3`.

- [ ] **Step 2: Kiểm phân bố bằng script**

Run:

```bash
npx tsx -e "
const idx=require('./src/data/seed/index.json');
const by=(k)=>idx.reduce((m,x)=>{const v=x[k]??'null';m[v]=(m[v]||0)+1;return m},{});
console.log('tổng:',idx.length);
console.log('tier:',by('passageTier'));
console.log('cefr:',by('cefrLevel'));
console.log('track:',by('track'));
const p=idx.filter(x=>['p1','p2','p3'].includes(x.passageTier));
console.log('passage:',p.length);
for(const t of ['p1','p2','p3']){
  const w=p.filter(x=>x.passageTier===t).map(x=>x.wordCount);
  if(w.length) console.log(t,'n='+w.length,'min='+Math.min(...w),'max='+Math.max(...w),'tb='+Math.round(w.reduce((a,b)=>a+b,0)/w.length));
}
console.log('index KHÔNG có bodyText:', idx.every(x=>!('bodyText' in x)));
"
```

Expected — đây là tiêu chí đỗ của cả plan:
- `tổng` ≥ 600 (đặt `--limit` cao hơn nếu thấp hơn)
- `tier` có cả ba `p1`/`p2`/`p3`, mỗi cái ≥ 40 bài
- `p1` max ≤ 900 từ · `p2` max ≤ 1050 · `p3` max ≤ 1250 (khổ + dung sai)
- `index KHÔNG có bodyText: true`

Nếu một tier dưới 40 bài, thêm category vào `category-map.ts` cho chủ đề tương ứng rồi chạy `npm run ingest -- --only wikipedia-categories --only simple-wikipedia-categories`.

- [ ] **Step 3: Kiểm dung lượng bundle giảm thật**

Run:

```bash
npx tsx -e "
const fs=require('fs');
const kb=(p)=>Math.round(fs.statSync(p).size/1024);
console.log('index.json:', kb('src/data/seed/index.json'),'KB');
const dir='src/data/seed/bodies';
const chunks=fs.readdirSync(dir).filter(f=>/^chunk-\d+\.json$/.test(f));
console.log('chunk:',chunks.length,'file, tổng',chunks.reduce((s,f)=>s+kb(dir+'/'+f),0),'KB');
"
```

Expected: `index.json` dưới 1500 KB — đây là phần duy nhất parse lúc khởi động. Nếu vượt, tăng `CHUNK_SIZE` không giúp; cần bỏ field không dùng khỏi index (ví dụ `attribution`).

- [ ] **Step 4: Chạy toàn bộ kiểm tra**

Run: `npm test` → PASS
Run: `npm run typecheck` → sạch
Run: `npm run web` → mở Library, lọc thử từng tier, mở một bài mỗi tier

- [ ] **Step 5: Cập nhật README**

Trong `README.md`, mục **Cào bài đọc (bước 3)**, thay khối lệnh bằng:

```bash
npm run ingest                     # cào tất cả nguồn, ghi index.json + bodies/
npm run ingest -- --limit 120      # số bài tối đa mỗi nguồn
npm run ingest -- --resume         # chạy tiếp sau khi bị ngắt
npm run ingest -- --replace        # bỏ kho cũ, cào lại từ đầu
npm run ingest -- --only wikipedia-categories
npm run ingest -- --push           # đẩy tiếp lên Supabase (cần service key)
```

Thêm một đoạn dưới đó:

```markdown
Kho bài chia làm `src/data/seed/index.json` (metadata, bundle sẵn) và
`src/data/seed/bodies/chunk-NN.json` (toàn văn, nạp lười qua `require()`).
`bodies/registry.ts` do script sinh — đừng sửa tay.

Mỗi bài được cắt về đúng khổ passage IELTS và gán tier `p1`/`p2`/`p3`. Ba tier
cộng lại ≈ 2700 từ. Lưu ý: ielts.org không công bố tổng số từ của một đề, nên
con số này là hiệu chỉnh chứ không phải chuẩn official.
```

Sửa dòng tiến độ **Bước 3** cho khớp số thật vừa đo được.

- [ ] **Step 6: Commit**

```bash
git add src/data/seed README.md
git commit -m "feat(ingest): chay ingest that, kho bai chia 3 tier passage"
```

---

## Self-Review

**Spec coverage:**

| Mục spec | Task |
|---|---|
| A1 mô hình tier + thuật toán 5 bước | 1, 3 |
| A1 migration `passage_tier` + map trong push | 8, 7 |
| A2 giữ `TOPIC_TITLES` làm sàn chất lượng | 7 (vẫn gọi `fetchWikipedia`) |
| A2 `category-map.ts` | 4 |
| A2 `fetchWikipediaCategories` phân trang `cmcontinue` | 4 |
| A2 `quality-gate.ts` | 2 |
| A2 PLOS `rows` 25 · arXiv `max_results` 25 | 5 |
| A2 CDC sang `HEADLINE_FEEDS` | 5 |
| A2 nguồn đề official | 5 |
| A2 checkpoint + `--resume` | 7 |
| A2 nhịp 400ms, concurrency 2 | 4 |
| A3 index + chunk + registry tĩnh | 6 |
| A3 `article-repository` | 9 |
| A3 sửa `read/[id].tsx` | 10 |
| Lỗi: try/catch theo từng bài | 4 (trong `mapWithConcurrency`), 7 (theo nguồn) |
| Lỗi: báo cáo số bài bị loại theo lý do | 7 |
| Lỗi: mất chunk thì không crash | 9 (`chunkOf` bọc try/catch) |
| Test 1–4 trong spec | 1, 2, 6, 9 |

**Hai chỗ spec nói khác plan, đã chỉnh có chủ ý:**

1. **Spec viết `getArticleBody` là async + màn đọc cần loading state.** Plan làm **đồng bộ**, vì `require()` trong Metro đồng bộ — nó hoãn parse, không trả Promise. Bỏ được toàn bộ phần refactor async, tức bỏ được chỗ rủi ro nhất của phần A. Đổi lại: chuyển sang Supabase về sau sẽ phải sửa thành async. Đúng với lựa chọn H1 thuần của bạn.
2. **Spec không nhắc `isReadable`.** Hàm này kiểm `Boolean(article.bodyText)` nên **vỡ ngay** khi index không còn `bodyText`. Task 9 đổi sang kiểm `licenseType !== 'headline_only'` — đúng bản chất hơn, và bao luôn `official_practice`.

**Ba mục spec KHÔNG có trong plan này, có chủ ý:**

- Cờ `--rescore` bị bỏ (Task 7 Step 3) vì index không còn body để chấm lại. Thay bằng chạy lại nguồn.
- Test "merge index ∪ overlay" và "chọn P1/P2/P3 cho Exam" thuộc phần B.
- Toàn bộ B1–B4 (track/tier UI, 13 dạng câu, Guided, Exam) là plan riêng, viết sau khi Task 11 chạy xong — vì cần dữ liệu tier thật mới test được.

**Placeholder scan:** không còn "TBD"/"tuỳ tình huống"/"xử lý lỗi phù hợp". Mọi step có code đều có code thật.

**Type consistency:** `PassageTier` khai **đúng một lần** ở `src/types/database.ts` (Task 1 Step 3a); `tiers.ts` chỉ `export type { PassageTier }`, Task 3 chỉ thêm field vào row. Bản nháp đầu của plan này khai nó ở cả hai file — đã sửa trong self-review, vì hai nguồn chân lý cho cùng một union sẽ lệch nhau ngay lần thêm giá trị thứ bảy. Enum SQL ở Task 8 là chỗ thứ ba phải khớp, nên Task 1 và Task 8 đều có comment trỏ sang nhau. `ArticleBody` khai ở `seed-writer.ts` (Task 6), dùng lại ở `article-repository.ts` (Task 9) và `articles.ts` (Task 9) — cùng một tên, không tạo bản sao. `normalizeArticle` đổi kiểu trả về ở Task 3 và chỗ tiêu thụ sửa ở Task 7 — Task 3 Step 5 đã cảnh báo typecheck sẽ đỏ giữa hai task.
