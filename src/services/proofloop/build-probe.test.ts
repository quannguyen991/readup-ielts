import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProbePrompt, parseProbeResponse, retryNoteFor, type ProbeInput } from './build-probe';

const PASSAGE = 'Anthems are always performed by a trained choir.';

function input(over: Partial<ProbeInput> = {}): ProbeInput {
  return {
    kind: 'entailment',
    passage: PASSAGE,
    questionPrompt: 'Anthems are sung by everyone.',
    correctAnswer: 'FALSE',
    truthEvidenceText: 'Anthems are always performed by a trained choir.',
    learnerPhrase: 'performed',
    ...over,
  };
}

function draftBody(over: Record<string, unknown> = {}) {
  return JSON.stringify({
    kind: 'entailment',
    stem: 'Bài đỡ mệnh đề nào?',
    options: ['Chỉ ca đoàn hát.', 'Ai cũng hát.'],
    correctOption: 0,
    evidenceText: PASSAGE,
    evidenceParagraphIndex: 0,
    decisivePhrase: 'always',
    whyEachWrong: ['bài nói ngược lại'],
    insufficientEvidence: false,
    ...over,
  });
}

const ctx = { passage: PASSAGE, expectedKind: 'entailment' as const };

test('prompt nêu đúng loại phép thử được giao', () => {
  assert.ok(buildProbePrompt(input()).includes('entailment'));
});

test('prompt cấm model trả về trường kết luận, nêu đích danh từng trường', () => {
  const p = buildProbePrompt(input());
  for (const field of ['state', 'diagnosis', 'mastery', 'skillLevel', 'nextLesson', 'understood']) {
    assert.ok(p.includes(field), `prompt phải nêu tên trường bị cấm: ${field}`);
  }
});

test('prompt nêu lối thoát khi bài không đủ căn cứ', () => {
  assert.ok(buildProbePrompt(input()).includes('insufficientEvidence'));
});

test('prompt của evidence-reselect phải cấm giải thích trước', () => {
  const p = buildProbePrompt(input({ kind: 'evidence-reselect' }));
  assert.ok(/do not explain/i.test(p));
});

test('không khoanh gì thì prompt nói rõ là không có, chứ không bỏ trống', () => {
  const p = buildProbePrompt(input({ learnerPhrase: null }));
  assert.ok(/nothing/i.test(p));
});

test('đọc được JSON trần', () => {
  assert.equal(parseProbeResponse(draftBody(), ctx).ok, true);
});

test('đọc được JSON nằm trong khối mã', () => {
  const out = parseProbeResponse('Đây nhé:\n```json\n' + draftBody() + '\n```\nXong.', ctx);
  assert.equal(out.ok, true);
});

test('trả về chuỗi không phải JSON thì báo lỗi chứ không ném', () => {
  const out = parseProbeResponse('xin lỗi, tôi không làm được', ctx);
  assert.equal(out.ok, false);
  assert.equal(out.ok === false && out.reason, 'not-json');
});

test('JSON hỏng cú pháp cũng báo not-json chứ không ném', () => {
  const out = parseProbeResponse('{"kind": "entailment", thiếu ngoặc', ctx);
  assert.equal(out.ok, false);
  assert.equal(out.ok === false && out.reason, 'not-json');
});

/** Đọc được không có nghĩa là nhận: luật kiểm ở draft-schema vẫn chạy. */
test('JSON đọc được nhưng vi phạm luật thì vẫn bị loại', () => {
  const out = parseProbeResponse(draftBody({ decisivePhrase: 'không có trong câu' }), ctx);
  assert.equal(out.ok, false);
  assert.equal(out.ok === false && out.reason, 'phrase-not-in-evidence');
});

/*
  Vòng phản hồi khi thử lại.

  Đo thật trên bài rừng ngập mặn: hàng rào bịt mắt loại cả ba lần liên tiếp với
  đúng một kiểu lỗi. Thử lại mà không nói vì sao trượt thì chỉ là quay xúc xắc
  thêm lượt nữa với đúng lời dặn cũ.
*/

test('lời dặn thử lại nói rõ lần trước hỏng vì sao', () => {
  const base = buildProbePrompt(input());
  const retry = buildProbePrompt({ ...input(), retryBecause: 'answerable-without-passage' });

  assert.ok(!base.includes('REJECTED'), 'lần đầu chưa có gì để sửa');
  assert.ok(retry.includes('REJECTED'));
  assert.ok(/without reading the passage/i.test(retry));
});

test('lời dặn sửa lỗi đứng TRƯỚC bài đọc', () => {
  const retry = buildProbePrompt({ ...input(), retryBecause: 'stem-leaks-decisive-phrase' });
  assert.ok(
    retry.indexOf('REJECTED') < retry.indexOf('PASSAGE:'),
    'nằm cuối một prompt dài thì model hay bỏ qua, mà đây là câu quan trọng nhất của lần thử này',
  );
});

test('chỉ những lý do nói lại được mới sinh ra lời dặn', () => {
  assert.ok(retryNoteFor('answerable-without-passage'));
  assert.ok(retryNoteFor('evidence-not-verbatim'));
  // Bài không đủ căn cứ thì nói lại cũng vô ích: model không có thêm thông tin nào.
  assert.equal(retryNoteFor('insufficient-evidence'), null);
  assert.equal(retryNoteFor('transfer-same-source'), null);
});
