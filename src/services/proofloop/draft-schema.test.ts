import test from 'node:test';
import assert from 'node:assert/strict';

import { validateDraft } from './draft-schema';
import type { ProbeKind } from './types';

const PASSAGE =
  'Hymns are sung by the whole congregation. Anthems are always performed by a trained choir.';

function raw(over: Record<string, unknown> = {}) {
  return {
    kind: 'entailment' as ProbeKind,
    stem: 'Bài đọc đỡ mệnh đề nào?',
    options: ['Chỉ ca đoàn hát anthem.', 'Ai cũng hát anthem.', 'Bài không nói.'],
    correctOption: 0,
    evidenceText: 'Anthems are always performed by a trained choir.',
    evidenceParagraphIndex: 0,
    decisivePhrase: 'always',
    whyEachWrong: ['bài nói ngược lại', 'bài có nói, nên không phải không xác định'],
    insufficientEvidence: false,
    ...over,
  };
}

const ctx = { passage: PASSAGE, expectedKind: 'entailment' as ProbeKind };

function reasonOf(out: ReturnType<typeof validateDraft>): string | null {
  return out.ok ? null : out.reason;
}

test('bản nháp hợp lệ thì nhận', () => {
  assert.equal(validateDraft(raw(), ctx).ok, true);
});

test('loại nếu evidenceText không có nguyên văn trong bài', () => {
  const out = validateDraft(raw({ evidenceText: 'Anthems are sung by everyone.' }), ctx);
  assert.equal(reasonOf(out), 'evidence-not-verbatim');
});

test('loại nếu decisivePhrase không nằm trong evidenceText', () => {
  const out = validateDraft(raw({ decisivePhrase: 'congregation' }), ctx);
  assert.equal(reasonOf(out), 'phrase-not-in-evidence');
});

test('loại nếu số lời giải thích sai không khớp số phương án', () => {
  assert.equal(reasonOf(validateDraft(raw({ whyEachWrong: ['chỉ một'] }), ctx)), 'why-count-mismatch');
});

test('loại nếu correctOption nằm ngoài khoảng', () => {
  assert.equal(reasonOf(validateDraft(raw({ correctOption: 3 }), ctx)), 'correct-option-out-of-range');
  assert.equal(reasonOf(validateDraft(raw({ correctOption: -1 }), ctx)), 'correct-option-out-of-range');
});

test('loại nếu model tự đổi loại phép thử', () => {
  assert.equal(reasonOf(validateDraft(raw({ kind: 'transfer' }), ctx)), 'kind-mismatch');
});

test('model báo thiếu bằng chứng thì trả về đúng lý do đó', () => {
  assert.equal(reasonOf(validateDraft(raw({ insufficientEvidence: true }), ctx)), 'insufficient-evidence');
});

/**
 * Ràng buộc bất biến §2.1: model KHÔNG có chỗ để ghi kết luận.
 *
 * Cố nhét thêm trường thì bản nháp bị LOẠI, không phải bị lọc im lặng. Lọc im
 * lặng nghĩa là lần sau prompt đổi hoặc model đổi thì không ai biết.
 */
test('loại nếu model nhét thêm trường kết luận', () => {
  for (const field of ['state', 'diagnosis', 'mastery', 'skillLevel', 'nextLesson', 'understood']) {
    const out = validateDraft(raw({ [field]: 'bất kỳ' }), ctx);
    assert.equal(reasonOf(out), 'forbidden-field', `phải loại khi có trường ${field}`);
  }
});

test('loại thứ không phải đối tượng', () => {
  assert.equal(reasonOf(validateDraft(null, ctx)), 'not-an-object');
  assert.equal(reasonOf(validateDraft('chuỗi', ctx)), 'not-an-object');
});

test('loại nếu hình dạng sai kiểu', () => {
  assert.equal(reasonOf(validateDraft(raw({ options: 'không phải mảng' }), ctx)), 'shape-invalid');
  assert.equal(reasonOf(validateDraft(raw({ stem: 42 }), ctx)), 'shape-invalid');
});

test('loại nếu chỉ có một phương án — không có gì để chọn', () => {
  const out = validateDraft(raw({ options: ['một mình'], whyEachWrong: [] }), ctx);
  assert.equal(reasonOf(out), 'shape-invalid');
});

/**
 * Model hay trả lại chữ có khoảng trắng thừa hoặc khác hoa thường so với bài
 * gốc. Đó không phải bịa — không được loại oan vì chuyện đó.
 */
test('so nguyên văn bỏ qua khoảng trắng thừa và hoa thường', () => {
  const out = validateDraft(
    raw({ evidenceText: '  anthems   are ALWAYS performed by a trained choir.  ' }),
    ctx,
  );
  assert.equal(out.ok, true);
});
