import test from 'node:test';
import assert from 'node:assert/strict';

import { applyOutcome, emptyLedger, statusOf, type ProbeOutcome } from './mastery';

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
  const l = emptyLedger();
  for (const skill of ['locate', 'paraphrase', 'entailment', 'quantifier'] as const) {
    assert.equal(statusOf(l, skill), 'not-confirmed');
  }
});

test('vượt transfer trên bài KHÁC thì xác nhận', () => {
  assert.equal(statusOf(applyOutcome(emptyLedger(), outcome()), 'paraphrase'), 'confirmed');
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
 * §2.3: mastery CHỈ đến từ transfer.
 *
 * Vượt P2 hay P3 nghĩa là đã làm rõ được một điều chưa biết — không phải đã
 * chuyển hoá thành kỹ năng. Hạ chuẩn ở đây để bảng trông đẹp hơn chính là thứ
 * ràng buộc này sinh ra để chặn.
 */
test('vượt evidence-reselect, entailment hay locate đều KHÔNG xác nhận', () => {
  for (const kind of ['evidence-reselect', 'entailment', 'locate'] as const) {
    const l = applyOutcome(emptyLedger(), outcome({ kind }));
    assert.equal(statusOf(l, 'paraphrase'), 'not-confirmed', `${kind} không được sinh mastery`);
  }
});

test('xác nhận kỹ năng này không lây sang kỹ năng khác', () => {
  const l = applyOutcome(emptyLedger(), outcome({ skill: 'paraphrase' }));
  assert.equal(statusOf(l, 'entailment'), 'not-confirmed');
  assert.equal(statusOf(l, 'locate'), 'not-confirmed');
  assert.equal(statusOf(l, 'quantifier'), 'not-confirmed');
});

/**
 * Mastery là phát biểu về hiện tại, không phải huy chương đã trao.
 */
test('đã xác nhận rồi mà trượt lần sau thì mất xác nhận', () => {
  let l = applyOutcome(emptyLedger(), outcome());
  assert.equal(statusOf(l, 'paraphrase'), 'confirmed');
  l = applyOutcome(l, outcome({ passed: false, probeArticleId: 'bai-thu-ba' }));
  assert.equal(statusOf(l, 'paraphrase'), 'not-confirmed');
});

test('applyOutcome không sửa sổ cũ, trả về sổ mới', () => {
  const truoc = emptyLedger();
  const sau = applyOutcome(truoc, outcome());
  assert.equal(statusOf(truoc, 'paraphrase'), 'not-confirmed');
  assert.equal(statusOf(sau, 'paraphrase'), 'confirmed');
});
