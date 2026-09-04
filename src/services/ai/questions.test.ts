import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dedupe, locateEvidence, pickTypes, planBatches } from './questions';
import type { GeneratedQuestion } from '@/services/questions/types';

// ------------------------------------------------------------------ pickTypes

test('lọc rỗng nghĩa là "gì cũng được", không phải "không dạng nào"', () => {
  // Chỗ này mà trả về mảng rỗng thì đề sinh ra không có câu nào, và triệu chứng
  // hiện ra tận màn đọc bài chứ không phải ở đây.
  assert.ok(pickTypes(undefined, 'ielts').length > 0);
  assert.ok(pickTypes([], 'ielts').length > 0);
});

test('bỏ dạng không thuộc kỳ thi đang làm', () => {
  const got = pickTypes(['true_false_not_given', 'sat_inference'], 'ielts');
  assert.deepEqual(got, ['true_false_not_given']);
});

test('dạng SAT không lọt vào đề IELTS và ngược lại', () => {
  assert.ok(pickTypes(undefined, 'sat').every((t) => t.startsWith('sat_')));
  assert.ok(pickTypes(undefined, 'ielts').every((t) => !t.startsWith('sat_')));
});

test('lọc toàn dạng sai thì quay về bộ mặc định chứ không ra đề rỗng', () => {
  assert.ok(pickTypes(['sat_inference'], 'ielts').length > 0);
});

// ----------------------------------------------------------------- planBatches

test('tổng số câu các lô đúng bằng số câu đặt', () => {
  for (const count of [1, 3, 4, 5, 8, 11, 12, 13, 20]) {
    const total = planBatches(count, ['multiple_choice', 'true_false_not_given']).reduce(
      (sum, b) => sum + b.count,
      0,
    );
    assert.equal(total, count, `đặt ${count} câu`);
  }
});

test('không lô nào rỗng', () => {
  for (const count of [1, 2, 7, 13]) {
    assert.ok(planBatches(count, ['multiple_choice']).every((b) => b.count > 0));
  }
});

test('mỗi lô luôn có ít nhất một dạng để làm', () => {
  // Nhiều lô hơn số dạng thì phép chia vòng để lại lô trống — lô đó phải được
  // phát lại cả bộ dạng, nếu không model nhận đơn hàng không có dạng nào.
  const batches = planBatches(20, ['multiple_choice']);
  assert.ok(batches.every((b) => b.types.length > 0));
});

test('chia vòng phủ hết các dạng đã đặt', () => {
  const types = ['true_false_not_given', 'matching_headings', 'sentence_completion'] as const;
  const covered = new Set(planBatches(12, [...types]).flatMap((b) => b.types));
  for (const t of types) assert.ok(covered.has(t), `thiếu dạng ${t}`);
});

// ---------------------------------------------------------------------- dedupe

function q(prompt: string, id = 'x'): GeneratedQuestion {
  return {
    id,
    orderIndex: 0,
    type: 'multiple_choice',
    prompt,
    instruction: null,
    options: null,
    correctAnswer: 'a',
    evidenceText: 'e',
    evidenceParagraphIndex: 0,
    explanation: '',
    lessonTip: null,
  };
}

test('hai lô ra cùng một câu thì chỉ giữ một', () => {
  assert.equal(dedupe([q('Rạn san hô đang chết dần?'), q('rạn san hô đang chết dần')]).length, 1);
});

test('khác dấu câu vẫn tính là trùng', () => {
  assert.equal(dedupe([q('Nhiệt độ tăng bao nhiêu?'), q('Nhiệt độ tăng bao nhiêu')]).length, 1);
});

test('id và thứ tự được đánh lại nên không trùng giữa các lô', () => {
  const out = dedupe([q('Câu một', 'a-ai-0'), q('Câu hai', 'b-ai-0')]);
  assert.equal(new Set(out.map((x) => x.id)).size, 2);
  assert.deepEqual(
    out.map((x) => x.orderIndex),
    [0, 1],
  );
});

// -------------------------------------------------------------- locateEvidence

const PARAS = [
  'The Great Barrier Reef is the world’s largest coral reef system.',
  'Rising sea temperatures have caused widespread bleaching events — three since 2016.',
];

test('tìm được trích dẫn chép đúng nguyên văn', () => {
  assert.equal(locateEvidence('largest coral reef system', PARAS), 0);
  assert.equal(locateEvidence('widespread bleaching events', PARAS), 1);
});

test('đổi loại nháy hay gạch ngang vẫn khớp', () => {
  // Model hay "sửa" dấu khi chép lại: ’ thành ', — thành -. Bắt bẻ chuyện đó thì
  // loại oan những câu vốn trích đúng.
  assert.equal(locateEvidence("world's largest coral reef", PARAS), 0);
  assert.equal(locateEvidence('bleaching events - three since 2016', PARAS), 1);
});

test('thừa khoảng trắng hay xuống dòng vẫn khớp', () => {
  assert.equal(locateEvidence('  largest   coral\n  reef  ', PARAS), 0);
});

test('trích dẫn model tự nghĩ ra thì trả về -1', () => {
  assert.equal(locateEvidence('Tourism revenue fell by forty percent', PARAS), -1);
});

test('trích dẫn quá ngắn bị từ chối', () => {
  // "reef" có trong bài thật, nhưng tô sáng bốn chữ cái thì vô nghĩa, và chuỗi
  // ngắn dễ khớp nhầm chỗ khác.
  assert.equal(locateEvidence('reef', PARAS), -1);
});

test('bài không có đoạn nào thì không tìm ra gì', () => {
  assert.equal(locateEvidence('largest coral reef system', []), -1);
});
