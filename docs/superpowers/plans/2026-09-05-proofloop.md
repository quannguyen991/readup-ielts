# ProofLoop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho ReadUp một vòng lặp học trong đó AI dựng phép thử còn bộ luật cố định ra kết luận, bắt đầu bằng lát cắt dọc cho IELTS Reading.

**Architecture:** Bốn mô-đun thuần trong `src/services/proofloop/` giữ toàn bộ quyền kết luận — phân loại trạng thái, bảng chọn phép thử, kiểm bản nháp của model, sổ mastery. Hai mô-đun gọi mạng dựng bản thể phép thử và chấm cụm từ. Giao diện chỉ hiển thị; không mô-đun giao diện nào được tự kết luận.

**Tech Stack:** TypeScript strict · Expo SDK 57 + expo-router · `node:test` chạy qua `tsx --test` · Zustand · Supabase · Claude API qua Expo Router API route (server-side)

**Spec:** `docs/superpowers/specs/2026-09-05-proofloop-design.md`

## Global Constraints

- **Lược đồ trả về của model không có trường kết luận.** Cấm các trường `state`, `diagnosis`, `mastery`, `skillLevel`, `nextLesson`, `understood`. Model trả về thì tầng kiểm loại.
- **Tên trạng thái là điều quan sát được.** Dùng `evidence-aligned` / `evidence-misaligned` / `mastery-confirmed` / `unobserved`. Cấm chữ "hiểu thật", "đoán bừa", "đã nắm được".
- **Mastery chỉ đến từ P1 Transfer trên một `articleId` khác.** Không có mức trung gian.
- **Thiếu căn cứ thì hiện "Chưa đủ dữ liệu để kết luận".** Không suy đoán bù.
- `unobserved` là trạng thái riêng, **không được gộp** vào `misaligned`.
- Mọi lời gọi có khoá chạy **server-side** (Expo Router API route). Client không đọc khoá bí mật — theo `src/lib/env.ts`.
- Test dùng `node:test` + `node:assert/strict`, tên test viết tiếng Việt, đặt cạnh tệp nguồn (`*.test.ts`).
- Đọc tài liệu Expo bản đúng phiên bản tại https://docs.expo.dev/versions/v57.0.0/ trước khi viết mã giao diện (theo `AGENTS.md`).
- Chạy test: `npm test` · kiểu: `npm run typecheck`

---

### Task 1: Kiểu dùng chung và phân loại trạng thái

**Files:**
- Create: `src/services/proofloop/types.ts`
- Create: `src/services/proofloop/state.ts`
- Test: `src/services/proofloop/state.test.ts`

**Interfaces:**
- Consumes: `GeneratedQuestion` từ `@/services/questions/types` (chỉ dùng `evidenceText`, `evidenceParagraphIndex`)
- Produces: `ProofState`, `EvidenceMark`, `Observation`, `MicroSkill`, `classify(obs: Observation): ProofState`

- [ ] **Step 1: Viết kiểu dùng chung**

`src/services/proofloop/types.ts`:

```ts
/**
 * Bốn vi-kỹ-năng. Chỉ bốn, và đều là thứ phép so bằng chứng đỡ được trực tiếp.
 * Bản đồ tám trục nghe hay nhưng với vài chục lượt làm bài thì phần lớn ô rỗng,
 * mà một bản đồ rỗng là nhiễu chứ không phải chẩn đoán.
 */
export type MicroSkill = 'locate' | 'paraphrase' | 'entailment' | 'quantifier';

/** Chỗ người học khoanh làm bằng chứng cho câu trả lời của mình. */
export type EvidenceMark = {
  paragraphIndex: number;
  phrase: string;
  startOffset: number;
  endOffset: number;
};

/**
 * Tên trạng thái là ĐIỀU QUAN SÁT ĐƯỢC, không phải điều suy ra.
 *
 * `unobserved` là trạng thái riêng, không được nhập vào `misaligned`: không đo
 * được khác với đo rồi không thấy gì.
 */
export type ProofState =
  | 'unobserved'
  | 'aligned-correct'
  | 'misaligned-correct'
  | 'aligned-wrong'
  | 'misaligned-wrong';

export type ProbeKind = 'transfer' | 'evidence-reselect' | 'entailment' | 'locate';

export type Observation = {
  answerCorrect: boolean;
  mark: EvidenceMark | null;
  /** Đoạn chứa đáp án, theo bộ đề. `null` nghĩa là câu này không có đối chứng. */
  truthParagraphIndex: number | null;
};
```

- [ ] **Step 2: Viết test thất bại**

`src/services/proofloop/state.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { classify } from './state';
import type { EvidenceMark, Observation } from './types';

function mark(paragraphIndex: number, phrase = 'always'): EvidenceMark {
  return { paragraphIndex, phrase, startOffset: 0, endOffset: phrase.length };
}

function obs(over: Partial<Observation> = {}): Observation {
  return { answerCorrect: true, mark: mark(2), truthParagraphIndex: 2, ...over };
}

test('không khoanh gì thì là unobserved, kể cả khi trả lời đúng', () => {
  assert.equal(classify(obs({ mark: null })), 'unobserved');
  assert.equal(classify(obs({ mark: null, answerCorrect: false })), 'unobserved');
});

test('câu không có đối chứng cũng là unobserved, không đoán bù', () => {
  assert.equal(classify(obs({ truthParagraphIndex: null })), 'unobserved');
});

test('đúng và khoanh đúng đoạn', () => {
  assert.equal(classify(obs()), 'aligned-correct');
});

test('đúng nhưng khoanh sai đoạn', () => {
  assert.equal(classify(obs({ mark: mark(5) })), 'misaligned-correct');
});

test('sai nhưng khoanh đúng đoạn', () => {
  assert.equal(classify(obs({ answerCorrect: false })), 'aligned-wrong');
});

test('sai và khoanh sai đoạn', () => {
  assert.equal(
    classify(obs({ answerCorrect: false, mark: mark(5) })),
    'misaligned-wrong',
  );
});
```

- [ ] **Step 3: Chạy test để chắc là nó hỏng**

Run: `npm test`
Expected: FAIL — `Cannot find module './state'`

- [ ] **Step 4: Viết bản cài đặt tối thiểu**

`src/services/proofloop/state.ts`:

```ts
import type { Observation, ProofState } from './types';

/**
 * Phân loại thuần xác định — KHÔNG gọi model.
 *
 * Đây là chỗ giữ quyền kết luận. Model không có đường nào chạm vào hàm này, và
 * đó là chủ đích: người viết tin nhắn đầu vào là người học, còn người viết bài
 * đọc là bên thứ ba — không bên nào được quyền định nghĩa "đã hiểu".
 */
export function classify(obs: Observation): ProofState {
  if (obs.mark === null) return 'unobserved';
  if (obs.truthParagraphIndex === null) return 'unobserved';

  const aligned = obs.mark.paragraphIndex === obs.truthParagraphIndex;
  if (obs.answerCorrect) return aligned ? 'aligned-correct' : 'misaligned-correct';
  return aligned ? 'aligned-wrong' : 'misaligned-wrong';
}
```

- [ ] **Step 5: Chạy test cho xanh**

Run: `npm test`
Expected: PASS — 6 test của `state.test.ts` xanh

- [ ] **Step 6: Commit**

```bash
git add src/services/proofloop/types.ts src/services/proofloop/state.ts src/services/proofloop/state.test.ts
git commit -m "ProofLoop: phân loại trạng thái từ bằng chứng người học khoanh"
```

---

### Task 2: Bảng chọn phép thử, có test khoá

**Files:**
- Create: `src/services/proofloop/probe-table.ts`
- Test: `src/services/proofloop/probe-table.test.ts`

**Interfaces:**
- Consumes: `ProofState`, `ProbeKind` từ `./types`
- Produces: `PROBE_TABLE: Readonly<Record<ProofState, ProbeKind | null>>`, `probeFor(state: ProofState): ProbeKind | null`

- [ ] **Step 1: Viết test thất bại**

`src/services/proofloop/probe-table.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { PROBE_TABLE, probeFor } from './probe-table';

test('mỗi trạng thái ánh xạ đúng một phép thử', () => {
  assert.equal(probeFor('aligned-correct'), 'transfer');
  assert.equal(probeFor('misaligned-correct'), 'evidence-reselect');
  assert.equal(probeFor('aligned-wrong'), 'entailment');
  assert.equal(probeFor('misaligned-wrong'), 'locate');
});

test('unobserved KHÔNG sinh phép thử nào', () => {
  assert.equal(probeFor('unobserved'), null);
});

/**
 * Test khoá. Bảng này được in nguyên vào hồ sơ dự thi — giám khảo đọc toàn bộ
 * logic quyết định trên một trang. Đổi bảng mà không đổi hồ sơ là để hồ sơ nói
 * sai về sản phẩm.
 */
test('bảng đúng năm dòng, không hơn không kém', () => {
  assert.deepEqual(Object.keys(PROBE_TABLE).sort(), [
    'aligned-correct',
    'aligned-wrong',
    'misaligned-correct',
    'misaligned-wrong',
    'unobserved',
  ]);
});
```

- [ ] **Step 2: Chạy test để chắc là nó hỏng**

Run: `npm test`
Expected: FAIL — `Cannot find module './probe-table'`

- [ ] **Step 3: Viết bản cài đặt**

`src/services/proofloop/probe-table.ts`:

```ts
import type { ProbeKind, ProofState } from './types';

/**
 * TRẠNG THÁI → LOẠI PHÉP THỬ. Cố định, công bố, không do model chọn.
 *
 * Nguyên tắc đặt bảng: mỗi phép thử chỉ được cô lập ĐÚNG MỘT biến. Đó là chỗ
 * chữ "thiết kế thí nghiệm" thành thật chứ không phải mỹ từ.
 *
 *   aligned-correct     → transfer          cô lập: nội dung
 *   misaligned-correct  → evidence-reselect cô lập: định vị bằng chứng
 *   aligned-wrong       → entailment        cô lập: quan hệ suy ra
 *   misaligned-wrong    → locate            cô lập: định vị
 *   unobserved          → không có          chưa quan sát được gì để thử
 */
export const PROBE_TABLE: Readonly<Record<ProofState, ProbeKind | null>> = Object.freeze({
  'unobserved': null,
  'aligned-correct': 'transfer',
  'misaligned-correct': 'evidence-reselect',
  'aligned-wrong': 'entailment',
  'misaligned-wrong': 'locate',
});

export function probeFor(state: ProofState): ProbeKind | null {
  return PROBE_TABLE[state];
}
```

- [ ] **Step 4: Chạy test cho xanh**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/proofloop/probe-table.ts src/services/proofloop/probe-table.test.ts
git commit -m "ProofLoop: bảng trạng thái sang loại phép thử, có test khoá"
```

---

### Task 3: Kiểm bản nháp của model

**Files:**
- Create: `src/services/proofloop/draft-schema.ts`
- Test: `src/services/proofloop/draft-schema.test.ts`

**Interfaces:**
- Consumes: `ProbeKind` từ `./types`
- Produces: `ProbeDraft`, `DraftRejection`, `validateDraft(raw: unknown, ctx: DraftContext): { ok: true; draft: ProbeDraft } | { ok: false; reason: DraftRejection }`, `DraftContext = { passage: string; expectedKind: ProbeKind }`

- [ ] **Step 1: Viết test thất bại**

`src/services/proofloop/draft-schema.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateDraft } from './draft-schema';
import type { ProbeKind } from './types';

const PASSAGE = 'Hymns are sung by the whole congregation. Anthems are always performed by a trained choir.';

function raw(over: Record<string, unknown> = {}) {
  return {
    kind: 'entailment' as ProbeKind,
    stem: 'Bài đọc đỡ mệnh đề nào?',
    options: ['A', 'B', 'C'],
    correctOption: 0,
    evidenceText: 'Anthems are always performed by a trained choir.',
    evidenceParagraphIndex: 0,
    decisivePhrase: 'always',
    whyEachWrong: ['sai vì...', 'sai vì...'],
    insufficientEvidence: false,
    ...over,
  };
}

const ctx = { passage: PASSAGE, expectedKind: 'entailment' as ProbeKind };

test('bản nháp hợp lệ thì nhận', () => {
  const out = validateDraft(raw(), ctx);
  assert.equal(out.ok, true);
});

test('loại nếu evidenceText không có nguyên văn trong bài', () => {
  const out = validateDraft(raw({ evidenceText: 'Anthems are sung by everyone.' }), ctx);
  assert.equal(out.ok, false);
  assert.equal(out.ok === false && out.reason, 'evidence-not-verbatim');
});

test('loại nếu decisivePhrase không nằm trong evidenceText', () => {
  const out = validateDraft(raw({ decisivePhrase: 'congregation' }), ctx);
  assert.equal(out.ok, false);
  assert.equal(out.ok === false && out.reason, 'phrase-not-in-evidence');
});

test('loại nếu số lời giải thích sai không khớp số phương án', () => {
  const out = validateDraft(raw({ whyEachWrong: ['chỉ một'] }), ctx);
  assert.equal(out.ok, false);
  assert.equal(out.ok === false && out.reason, 'why-count-mismatch');
});

test('loại nếu correctOption nằm ngoài khoảng', () => {
  const out = validateDraft(raw({ correctOption: 3 }), ctx);
  assert.equal(out.ok, false);
  assert.equal(out.ok === false && out.reason, 'correct-option-out-of-range');
});

test('loại nếu model tự đổi loại phép thử', () => {
  const out = validateDraft(raw({ kind: 'transfer' }), ctx);
  assert.equal(out.ok, false);
  assert.equal(out.ok === false && out.reason, 'kind-mismatch');
});

test('model báo thiếu bằng chứng thì trả về đúng lý do đó', () => {
  const out = validateDraft(raw({ insufficientEvidence: true }), ctx);
  assert.equal(out.ok, false);
  assert.equal(out.ok === false && out.reason, 'insufficient-evidence');
});

/**
 * Ràng buộc bất biến: model KHÔNG có chỗ để ghi kết luận. Nếu nó cố nhét thêm
 * trường thì bản nháp bị loại, không phải bị lọc im lặng — lọc im lặng nghĩa là
 * lần sau prompt đổi thì không ai biết.
 */
test('loại nếu model nhét thêm trường kết luận', () => {
  for (const field of ['state', 'diagnosis', 'mastery', 'skillLevel', 'nextLesson', 'understood']) {
    const out = validateDraft(raw({ [field]: 'bất kỳ' }), ctx);
    assert.equal(out.ok, false, `phải loại khi có trường ${field}`);
    assert.equal(out.ok === false && out.reason, 'forbidden-field');
  }
});
```

- [ ] **Step 2: Chạy test để chắc là nó hỏng**

Run: `npm test`
Expected: FAIL — `Cannot find module './draft-schema'`

- [ ] **Step 3: Viết bản cài đặt**

`src/services/proofloop/draft-schema.ts`:

```ts
import type { ProbeKind } from './types';

export type ProbeDraft = {
  kind: ProbeKind;
  stem: string;
  options: string[];
  correctOption: number;
  evidenceText: string;
  evidenceParagraphIndex: number;
  decisivePhrase: string;
  whyEachWrong: string[];
  insufficientEvidence: boolean;
};

export type DraftRejection =
  | 'not-an-object'
  | 'forbidden-field'
  | 'shape-invalid'
  | 'kind-mismatch'
  | 'evidence-not-verbatim'
  | 'phrase-not-in-evidence'
  | 'why-count-mismatch'
  | 'correct-option-out-of-range'
  | 'insufficient-evidence';

export type DraftContext = { passage: string; expectedKind: ProbeKind };

/**
 * Sáu trường model KHÔNG BAO GIỜ được ghi.
 *
 * Nếu model được phép ghi "đã hiểu", một lời giải thích trôi chảy sẽ tự phong
 * cho mình là bằng chứng học tập. Quyền kết luận nằm ở bộ luật.
 */
const FORBIDDEN = ['state', 'diagnosis', 'mastery', 'skillLevel', 'nextLesson', 'understood'] as const;

function normalise(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function validateDraft(
  raw: unknown,
  ctx: DraftContext,
): { ok: true; draft: ProbeDraft } | { ok: false; reason: DraftRejection } {
  if (typeof raw !== 'object' || raw === null) return { ok: false, reason: 'not-an-object' };
  const d = raw as Record<string, unknown>;

  for (const field of FORBIDDEN) {
    if (field in d) return { ok: false, reason: 'forbidden-field' };
  }

  if (d.insufficientEvidence === true) return { ok: false, reason: 'insufficient-evidence' };

  const shapeOk =
    typeof d.kind === 'string' &&
    typeof d.stem === 'string' &&
    Array.isArray(d.options) &&
    d.options.every((o) => typeof o === 'string') &&
    d.options.length >= 2 &&
    typeof d.correctOption === 'number' &&
    typeof d.evidenceText === 'string' &&
    typeof d.evidenceParagraphIndex === 'number' &&
    typeof d.decisivePhrase === 'string' &&
    Array.isArray(d.whyEachWrong) &&
    d.whyEachWrong.every((w) => typeof w === 'string');
  if (!shapeOk) return { ok: false, reason: 'shape-invalid' };

  const draft = d as unknown as ProbeDraft;

  if (draft.kind !== ctx.expectedKind) return { ok: false, reason: 'kind-mismatch' };

  if (!normalise(ctx.passage).includes(normalise(draft.evidenceText))) {
    return { ok: false, reason: 'evidence-not-verbatim' };
  }

  if (!normalise(draft.evidenceText).includes(normalise(draft.decisivePhrase))) {
    return { ok: false, reason: 'phrase-not-in-evidence' };
  }

  if (draft.whyEachWrong.length !== draft.options.length - 1) {
    return { ok: false, reason: 'why-count-mismatch' };
  }

  if (draft.correctOption < 0 || draft.correctOption >= draft.options.length) {
    return { ok: false, reason: 'correct-option-out-of-range' };
  }

  return { ok: true, draft };
}
```

- [ ] **Step 4: Chạy test cho xanh**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/proofloop/draft-schema.ts src/services/proofloop/draft-schema.test.ts
git commit -m "ProofLoop: bảy luật kiểm bản nháp của model"
```

---

### Task 4: Sổ mastery

**Files:**
- Create: `src/services/proofloop/mastery.ts`
- Test: `src/services/proofloop/mastery.test.ts`

**Interfaces:**
- Consumes: `MicroSkill`, `ProbeKind` từ `./types`
- Produces: `MasteryLedger`, `ProbeOutcome`, `emptyLedger(): MasteryLedger`, `applyOutcome(ledger: MasteryLedger, outcome: ProbeOutcome): MasteryLedger`, `statusOf(ledger: MasteryLedger, skill: MicroSkill): 'confirmed' | 'not-confirmed'`

- [ ] **Step 1: Viết test thất bại**

`src/services/proofloop/mastery.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { applyOutcome, emptyLedger, statusOf } from './mastery';
import type { ProbeOutcome } from './mastery';

function outcome(over: Partial<ProbeOutcome> = {}): ProbeOutcome {
  return {
    skill: 'paraphrase',
    kind: 'transfer',
    passed: true,
    sourceArticleId: 'bai-goc',
    probeArticleId: 'bai-khac',
    ...over,
  };
}

test('sổ rỗng thì mọi kỹ năng đều chưa xác nhận', () => {
  assert.equal(statusOf(emptyLedger(), 'paraphrase'), 'not-confirmed');
});

test('vượt transfer trên bài KHÁC thì xác nhận', () => {
  const l = applyOutcome(emptyLedger(), outcome());
  assert.equal(statusOf(l, 'paraphrase'), 'confirmed');
});

test('vượt transfer nhưng CÙNG bài thì KHÔNG xác nhận', () => {
  const l = applyOutcome(emptyLedger(), outcome({ probeArticleId: 'bai-goc' }));
  assert.equal(statusOf(l, 'paraphrase'), 'not-confirmed');
});

test('trượt transfer thì không xác nhận', () => {
  const l = applyOutcome(emptyLedger(), outcome({ passed: false }));
  assert.equal(statusOf(l, 'paraphrase'), 'not-confirmed');
});

/**
 * §2.3: mastery CHỈ đến từ transfer. Vượt P2 hay P3 nghĩa là đã làm rõ được một
 * điều chưa biết — không phải đã chuyển hoá thành kỹ năng.
 */
test('vượt evidence-reselect hay entailment đều KHÔNG xác nhận', () => {
  for (const kind of ['evidence-reselect', 'entailment', 'locate'] as const) {
    const l = applyOutcome(emptyLedger(), outcome({ kind }));
    assert.equal(statusOf(l, 'paraphrase'), 'not-confirmed', `${kind} không được sinh mastery`);
  }
});

test('xác nhận kỹ năng này không lây sang kỹ năng khác', () => {
  const l = applyOutcome(emptyLedger(), outcome({ skill: 'paraphrase' }));
  assert.equal(statusOf(l, 'entailment'), 'not-confirmed');
});

test('đã xác nhận rồi thì một lần trượt sau đó gỡ lại xác nhận', () => {
  let l = applyOutcome(emptyLedger(), outcome());
  l = applyOutcome(l, outcome({ passed: false, probeArticleId: 'bai-thu-ba' }));
  assert.equal(statusOf(l, 'paraphrase'), 'not-confirmed');
});
```

- [ ] **Step 2: Chạy test để chắc là nó hỏng**

Run: `npm test`
Expected: FAIL — `Cannot find module './mastery'`

- [ ] **Step 3: Viết bản cài đặt**

`src/services/proofloop/mastery.ts`:

```ts
import type { MicroSkill, ProbeKind } from './types';

export type ProbeOutcome = {
  skill: MicroSkill;
  kind: ProbeKind;
  passed: boolean;
  /** Bài đọc nơi lỗi xuất hiện. */
  sourceArticleId: string;
  /** Bài đọc của chính phép thử. */
  probeArticleId: string;
};

export type MasteryLedger = Readonly<Record<MicroSkill, boolean>>;

export function emptyLedger(): MasteryLedger {
  return { locate: false, paraphrase: false, entailment: false, quantifier: false };
}

/**
 * Chỉ `transfer` trên một bài KHÁC mới sinh ra mastery (§2.3).
 *
 * Vượt P2 hay P3 nghĩa là đã làm rõ được một điều chưa biết — không phải đã
 * chuyển hoá thành kỹ năng. Hạ chuẩn ở đây để bảng trông đẹp hơn chính là thứ
 * ràng buộc này sinh ra để chặn.
 *
 * Một lần trượt sau đó gỡ lại xác nhận: mastery là phát biểu về hiện tại, không
 * phải huy chương đã trao.
 */
export function applyOutcome(ledger: MasteryLedger, outcome: ProbeOutcome): MasteryLedger {
  if (outcome.kind !== 'transfer') return ledger;
  if (outcome.probeArticleId === outcome.sourceArticleId) return ledger;
  return { ...ledger, [outcome.skill]: outcome.passed };
}

export function statusOf(ledger: MasteryLedger, skill: MicroSkill): 'confirmed' | 'not-confirmed' {
  return ledger[skill] ? 'confirmed' : 'not-confirmed';
}
```

- [ ] **Step 4: Chạy test cho xanh**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/proofloop/mastery.ts src/services/proofloop/mastery.test.ts
git commit -m "ProofLoop: sổ mastery, chỉ phép thử chuyển giao mới xác nhận"
```

---

### Task 5: Prompt và bộ dựng phép thử

**Files:**
- Create: `src/services/proofloop/prompts/probe.ts`
- Create: `src/services/proofloop/build-probe.ts`
- Test: `src/services/proofloop/build-probe.test.ts`

**Interfaces:**
- Consumes: `validateDraft`, `ProbeDraft`, `DraftRejection` từ `./draft-schema`; `ProbeKind` từ `./types`
- Produces: `buildProbePrompt(input: ProbeInput): string`, `parseProbeResponse(text: string, ctx: DraftContext)`, `ProbeInput`

Bộ dựng tách làm hai nửa: nửa thuần (dựng prompt, phân tích chuỗi trả về) có test; nửa gọi mạng nằm ở API route Task 6. Tách thế này để test được phần quan trọng mà không cần khoá API.

- [ ] **Step 1: Viết test thất bại**

`src/services/proofloop/build-probe.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProbePrompt, parseProbeResponse } from './build-probe';

const PASSAGE = 'Anthems are always performed by a trained choir.';

const INPUT = {
  kind: 'entailment' as const,
  passage: PASSAGE,
  questionPrompt: 'Anthems are sung by everyone.',
  correctAnswer: 'FALSE',
  truthEvidenceText: 'Anthems are always performed by a trained choir.',
  learnerPhrase: 'performed',
};

test('prompt có nêu đúng loại phép thử được giao', () => {
  const p = buildProbePrompt(INPUT);
  assert.ok(p.includes('entailment'));
});

test('prompt cấm model trả về trường kết luận', () => {
  const p = buildProbePrompt(INPUT);
  for (const field of ['state', 'diagnosis', 'mastery', 'nextLesson']) {
    assert.ok(p.includes(field), `prompt phải nêu tên trường bị cấm: ${field}`);
  }
});

test('prompt có nêu lối thoát khi thiếu bằng chứng', () => {
  assert.ok(buildProbePrompt(INPUT).includes('insufficientEvidence'));
});

test('đọc được JSON nằm trong khối mã', () => {
  const body = JSON.stringify({
    kind: 'entailment',
    stem: 'Bài đỡ mệnh đề nào?',
    options: ['A', 'B'],
    correctOption: 0,
    evidenceText: PASSAGE,
    evidenceParagraphIndex: 0,
    decisivePhrase: 'always',
    whyEachWrong: ['sai vì...'],
    insufficientEvidence: false,
  });
  const out = parseProbeResponse('Đây nhé:\n```json\n' + body + '\n```\n', {
    passage: PASSAGE,
    expectedKind: 'entailment',
  });
  assert.equal(out.ok, true);
});

test('trả về chuỗi không phải JSON thì báo lỗi chứ không ném', () => {
  const out = parseProbeResponse('xin lỗi, tôi không làm được', {
    passage: PASSAGE,
    expectedKind: 'entailment',
  });
  assert.equal(out.ok, false);
  assert.equal(out.ok === false && out.reason, 'not-json');
});
```

- [ ] **Step 2: Chạy test để chắc là nó hỏng**

Run: `npm test`
Expected: FAIL — `Cannot find module './build-probe'`

- [ ] **Step 3: Viết prompt**

`src/services/proofloop/prompts/probe.ts`:

```ts
import type { ProbeKind } from '../types';

/** Việc mỗi phép thử phải làm — viết cho model, một câu, không diễn giải thêm. */
export const PROBE_BRIEF: Readonly<Record<ProbeKind, string>> = Object.freeze({
  transfer:
    'Build ONE new question testing the same micro-skill on DIFFERENT content. Do not reuse the original wording.',
  'evidence-reselect':
    'Do NOT explain the answer. Build ONE question that asks the learner to identify which sentence actually supports the correct answer.',
  entailment:
    'Give the evidence sentence, then three claims: exactly one entailed by it, one contradicted by it, and one not determinable from it.',
  locate:
    'Do NOT ask for the answer. Ask only which paragraph contains the information needed.',
});

export const FORBIDDEN_FIELDS = ['state', 'diagnosis', 'mastery', 'skillLevel', 'nextLesson', 'understood'];
```

- [ ] **Step 4: Viết bộ dựng**

`src/services/proofloop/build-probe.ts`:

```ts
import { validateDraft, type DraftContext, type DraftRejection, type ProbeDraft } from './draft-schema';
import { FORBIDDEN_FIELDS, PROBE_BRIEF } from './prompts/probe';
import type { ProbeKind } from './types';

export type ProbeInput = {
  kind: ProbeKind;
  passage: string;
  questionPrompt: string;
  correctAnswer: string;
  truthEvidenceText: string;
  /** Cụm người học đã khoanh, nếu có. */
  learnerPhrase: string | null;
};

export function buildProbePrompt(input: ProbeInput): string {
  return [
    'You build ONE diagnostic probe for an IELTS Reading learner.',
    '',
    `PROBE KIND (assigned, do not change): ${input.kind}`,
    `TASK: ${PROBE_BRIEF[input.kind]}`,
    '',
    'PASSAGE:',
    input.passage,
    '',
    `ORIGINAL QUESTION: ${input.questionPrompt}`,
    `CORRECT ANSWER: ${input.correctAnswer}`,
    `SENTENCE THAT SUPPORTS IT: ${input.truthEvidenceText}`,
    input.learnerPhrase ? `LEARNER MARKED: ${input.learnerPhrase}` : 'LEARNER MARKED: nothing',
    '',
    'Return ONE JSON object and nothing else:',
    '{"kind":string,"stem":string,"options":string[],"correctOption":number,',
    '"evidenceText":string,"evidenceParagraphIndex":number,"decisivePhrase":string,',
    '"whyEachWrong":string[],"insufficientEvidence":boolean}',
    '',
    'HARD RULES:',
    `1. "kind" must be exactly "${input.kind}".`,
    '2. "evidenceText" must be copied VERBATIM from the passage.',
    '3. "decisivePhrase" must be a substring of "evidenceText".',
    '4. "whyEachWrong" must have exactly one entry per WRONG option.',
    `5. Never output these fields: ${FORBIDDEN_FIELDS.join(', ')}. You do not decide what the learner understands.`,
    '6. If the passage does not support a fair probe, set "insufficientEvidence": true and leave the rest empty.',
  ].join('\n');
}

/** Lấy JSON ra khỏi câu trả lời, kể cả khi model bọc nó trong khối mã. */
function extractJson(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function parseProbeResponse(
  text: string,
  ctx: DraftContext,
): { ok: true; draft: ProbeDraft } | { ok: false; reason: DraftRejection | 'not-json' } {
  const raw = extractJson(text);
  if (raw === null) return { ok: false, reason: 'not-json' };
  return validateDraft(raw, ctx);
}
```

- [ ] **Step 5: Chạy test cho xanh**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/proofloop/prompts/probe.ts src/services/proofloop/build-probe.ts src/services/proofloop/build-probe.test.ts
git commit -m "ProofLoop: prompt dựng phép thử và bộ đọc bản nháp"
```

---

### Task 6: API route dựng phép thử

**Files:**
- Create: `app/api/proofloop/probe+api.ts`
- Read first: `app/api/questions+api.ts` (theo đúng khuôn gọi model, xử lỗi và trả mã trạng thái của repo)

**Interfaces:**
- Consumes: `buildProbePrompt`, `parseProbeResponse` từ `@/services/proofloop/build-probe`; `probeFor` từ `@/services/proofloop/probe-table`; `classify` từ `@/services/proofloop/state`
- Produces: `POST /api/proofloop/probe` nhận `{ observation, passage, questionPrompt, correctAnswer, truthEvidenceText }`, trả `{ state, kind, draft }` hoặc `{ state, kind: null, reason }`

- [ ] **Step 1: Đọc khuôn có sẵn**

Run: `sed -n '1,80p' app/api/questions+api.ts`
Mục đích: chép đúng cách repo tạo client, đọc biến môi trường, bắt lỗi và trả mã trạng thái. Không tự nghĩ khuôn mới.

- [ ] **Step 2: Viết route**

Route phải làm đúng thứ tự này, và **không được đảo**:

1. `classify(observation)` → trạng thái. Thuần, không gọi model.
2. `probeFor(state)` → loại phép thử. Nếu `null` (tức `unobserved`) thì **trả về ngay**, không gọi model.
3. `buildProbePrompt` với loại đã định.
4. Gọi model theo đúng khuôn của `app/api/questions+api.ts`.
5. `parseProbeResponse`. Hỏng thì thử lại **đúng một lần**. Hỏng lần hai thì trả `reason` để giao diện hiện "Chưa đủ dữ liệu để kết luận".

- [ ] **Step 3: Kiểm kiểu**

Run: `npm run typecheck`
Expected: không lỗi

- [ ] **Step 4: Commit**

```bash
git add app/api/proofloop/probe+api.ts
git commit -m "ProofLoop: route dựng phép thử, luật chọn loại trước khi gọi model"
```

---

### Task 7: Đánh dấu bằng chứng ở màn đọc

**Files:**
- Modify: `app/read/[id].tsx`
- Create: `src/components/reader/EvidenceMarker.tsx`
- Read first: `src/components/reader/useTextSelection.ts`, `src/components/reader/PassageView.tsx`

**Interfaces:**
- Consumes: `useTextSelection`, `sentenceAround`, `PASSAGE_CONTAINER_ID` đã có
- Produces: `EvidenceMarker` gọi `onMark(mark: EvidenceMark)`

Màn đọc đã có `phraseMode`, `phraseAnchor` và `useTextSelection`. Dùng lại, **đừng dựng máy chọn chữ thứ hai**.

- [ ] **Step 1: Đọc máy chọn chữ có sẵn**

Run: `sed -n '1,60p' src/components/reader/useTextSelection.ts`

- [ ] **Step 2: Dựng `EvidenceMarker`**

Một nút cạnh mỗi câu hỏi: *"Khoanh câu đỡ đáp án này"*. Bật lên thì lần chọn chữ tiếp theo trong bài trở thành `EvidenceMark` cho đúng câu đó, lấy `paragraphIndex` và offset từ máy chọn chữ có sẵn.

- [ ] **Step 3: Nối vào trạng thái màn đọc**

Thêm `evidenceMarks: Record<string, EvidenceMark>` cạnh `answers` (`app/read/[id].tsx:88`). Chỉ bắt buộc khoanh ở chế độ ProofLoop; chế độ luyện thường giữ nguyên, theo §10.

- [ ] **Step 4: Kiểm kiểu và chạy thử trên web**

Run: `npm run typecheck`
Sau đó mở màn đọc, khoanh thử một câu, xác nhận `evidenceMarks` nhận đúng số đoạn.

- [ ] **Step 5: Commit**

```bash
git add "app/read/[id].tsx" src/components/reader/EvidenceMarker.tsx
git commit -m "ProofLoop: khoanh bằng chứng cho từng câu ở màn đọc"
```

---

### Task 8: Bảng phép thử và bảng Proof

**Files:**
- Create: `src/components/reader/ProbePanel.tsx`
- Modify: `app/review/[sessionId].tsx`

**Interfaces:**
- Consumes: `POST /api/proofloop/probe`; `statusOf`, `emptyLedger` từ `@/services/proofloop/mastery`
- Produces: giao diện hiện trạng thái, phép thử, và mastery

- [ ] **Step 1: Dựng `ProbePanel`**

Hiện phép thử, nhận câu trả lời, rồi mới hiện lời giải thích kèm `evidenceText`. Với `evidence-reselect` thì **không hiện lời giải thích trước** — đúng §3.4.

- [ ] **Step 2: Khoảnh khắc "đúng nhưng chưa chắc hiểu"**

Với `misaligned-correct`, hiện đúng câu này trước khi mở phép thử:

> Đáp án đúng, nhưng đoạn bạn khoanh chưa đỡ được đáp án đó. Chưa ghi nhận là đã hiểu. Làm một phép thử ngắn nhé.

- [ ] **Step 3: Bảng Proof ở màn review**

Mỗi vi-kỹ-năng một dòng: trạng thái · phép thử đã chạy · mastery. Bản này **mọi dòng mastery đều là "chưa xác nhận"**, và giao diện phải nói đúng như vậy kèm lý do — theo §7.1. Không để trống cho người dùng tự hiểu.

- [ ] **Step 4: Kiểm kiểu**

Run: `npm run typecheck`

- [ ] **Step 5: Commit**

```bash
git add src/components/reader/ProbePanel.tsx "app/review/[sessionId].tsx"
git commit -m "ProofLoop: bảng phép thử và bảng Proof ở màn review"
```

---

## Sau khi xong lát cắt

Chạy `npm test` và `npm run typecheck` cho sạch, rồi triển khai lên Vercel — vì
web đang chạy chính là bằng chứng cho hồ sơ ngày 15/9.

Việc đo ở §6.3 của spec (tính hợp lệ của phép thử, độ chuẩn của việc chấm cụm
từ) là kế hoạch riêng, làm sau khi lát cắt chạy được — không có số thì hồ sơ
không được khẳng định.
