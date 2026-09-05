import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBlindPrompt, judgeBlindAnswer, readBlindAnswer } from './blind-check';
import type { ProbeDraft } from './draft-schema';

const DRAFT: ProbeDraft = {
  kind: 'transfer',
  stem: 'What does the passage say happens to coral once the algae leave?',
  options: ['It turns white and begins to starve', 'It darkens and grows faster', 'It splits in two'],
  correctOption: 0,
  evidenceText: 'Without the algae the coral turns white and begins to starve.',
  evidenceParagraphIndex: 1,
  decisivePhrase: 'turns white',
  whyEachWrong: ['a', 'b'],
  insufficientEvidence: false,
};

test('lời dặn KHÔNG tiết lộ rằng đây là bài kiểm chất lượng đề', () => {
  const p = buildBlindPrompt(DRAFT).toLowerCase();
  for (const tell of ['quality', 'validity', 'evaluate the question', 'is this a good question']) {
    assert.ok(!p.includes(tell), `lời dặn lộ ý đồ qua cụm "${tell}"`);
  }
});

test('lời dặn không kèm bài đọc, và có nêu đủ phương án', () => {
  const p = buildBlindPrompt(DRAFT);
  assert.ok(!p.includes(DRAFT.evidenceText), 'lộ mất câu bằng chứng thì phép thử vô nghĩa');
  for (const o of DRAFT.options) assert.ok(p.includes(o));
});

test('lời dặn cho phép nói không biết', () => {
  assert.ok(/cannot tell|null/i.test(buildBlindPrompt(DRAFT)));
});

test('đọc được JSON trần và JSON bọc trong khối mã', () => {
  assert.deepEqual(readBlindAnswer('{"choice":1,"determinable":true}', 3), {
    choice: 1,
    determinable: true,
  });
  assert.deepEqual(readBlindAnswer('```json\n{"choice":null,"determinable":false}\n```', 3), {
    choice: null,
    determinable: false,
  });
});

test('chọn ra ngoài dải là câu trả lời hỏng, không phải "không biết"', () => {
  assert.equal(readBlindAnswer('{"choice":7,"determinable":true}', 3), null);
  assert.equal(readBlindAnswer('{"choice":-1,"determinable":true}', 3), null);
});

test('không đọc nổi thì trả null chứ không đoán bù', () => {
  assert.equal(readBlindAnswer('xin lỗi tôi không chắc', 3), null);
  assert.equal(readBlindAnswer('{"choice":', 3), null);
});

/*
  Bốn kết luận, và ranh giới giữa chúng là toàn bộ giá trị của tầng này.
*/

test('che bài đi mà không trả lời được — câu tốt', () => {
  const v = judgeBlindAnswer(DRAFT, { choice: null, determinable: false });
  assert.equal(v.ok, true);
  assert.equal(v.note, 'blind-model-could-not-answer');
});

test('trả lời sai — càng chắc là phải đọc bài mới làm được', () => {
  const v = judgeBlindAnswer(DRAFT, { choice: 2, determinable: true });
  assert.equal(v.ok, true);
  assert.equal(v.note, 'blind-model-answered-wrong');
});

test('trúng VÀ nhận là xác định được — câu này không đo đọc hiểu, loại', () => {
  const v = judgeBlindAnswer(DRAFT, { choice: 0, determinable: true });
  assert.equal(v.ok, false);
  assert.equal(v.note, 'answerable-without-passage');
});

/*
  Đây là ranh giới dễ bị bào mòn nhất: loại luôn cả trường hợp đoán trúng thì
  hàng rào trông "chặt" hơn, nhưng với ba phương án nó loại oan một phần ba số
  câu tốt — và loại oan thì mọi phép thử đều rơi về "không dựng được", đúng cái
  chết mà draft-schema.ts đã cảnh báo một lần rồi.
*/
test('trúng nhưng tự nhận là đoán thì KHÔNG loại, chỉ ghi lại', () => {
  const v = judgeBlindAnswer(DRAFT, { choice: 0, determinable: false });
  assert.equal(v.ok, true);
  assert.equal(v.note, 'blind-guess-hit');
});
