import test from 'node:test';
import assert from 'node:assert/strict';

import { GENERATED_KIND_OF_UNIT, generateSetQuestions } from './generated-sets';
import { getSatRwUnitInCurriculum } from './curriculum';

/** RNG gieo hạt cố định — để test so được hai lượt với nhau. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

test('ba bài có bộ sinh đều sinh ra đủ số câu đã hứa trên thẻ', () => {
  /*
    Thẻ bài học ghi "12 câu" hay "15 câu". Sinh thiếu thì người học bấm vào một
    bộ ghi 15 câu và làm xong sau 9 câu — con số trên thẻ thành lời nói dối
    nhỏ, mà đây là chỗ dễ hụt nhất vì hai trong ba nguồn có kho hữu hạn.
  */
  for (const [unitStr, kind] of Object.entries(GENERATED_KIND_OF_UNIT)) {
    const unit = Number(unitStr);
    const meta = getSatRwUnitInCurriculum(unit)!;
    const set = meta.sets.find((s) => s.kind === 'generated')!;
    const out = generateSetQuestions(kind, unit, meta.title, set.count, seeded(7));
    assert.equal(out.length, set.count, `bài ${unit} (${kind}) sinh thiếu câu`);
  }
});

test('mỗi câu sinh ra đều đủ dữ kiện để hiện lên màn luyện', () => {
  for (const [unitStr, kind] of Object.entries(GENERATED_KIND_OF_UNIT)) {
    const unit = Number(unitStr);
    const meta = getSatRwUnitInCurriculum(unit)!;
    for (const q of generateSetQuestions(kind, unit, meta.title, 6, seeded(11))) {
      assert.ok(q.passage.length > 20, `${q.id}: đoạn văn quá ngắn`);
      assert.ok(q.stem.length > 10, `${q.id}: thiếu câu hỏi`);
      assert.equal(q.options.length, 4, `${q.id}: phải có đúng 4 phương án`);
      assert.ok(q.answerIndex >= 0 && q.answerIndex < 4, `${q.id}: đáp án trỏ ra ngoài`);
      assert.ok(q.solutionVi.length > 20, `${q.id}: thiếu lời giải`);
      assert.equal(q.unit, unit, `${q.id}: gắn sai bài`);
    }
  }
});

test('KHÔNG câu nào lặp lại trong cùng một bộ', () => {
  // Hai câu giống hệt nhau trong một bộ 12 câu là thứ nhìn phát hiện ngay, và
  // nó phá đúng lời hứa "câu mới" của bộ này.
  for (const [unitStr, kind] of Object.entries(GENERATED_KIND_OF_UNIT)) {
    const unit = Number(unitStr);
    const meta = getSatRwUnitInCurriculum(unit)!;
    const ids = generateSetQuestions(kind, unit, meta.title, 12, seeded(3)).map((q) => q.id);
    assert.equal(new Set(ids).size, ids.length, `bài ${unit} có câu lặp`);
  }
});

test('hai lượt với hạt khác nhau cho ra bộ đề KHÁC NHAU', () => {
  /*
    Đây là chính lời hứa trên thẻ: "câu mới mỗi lượt". Kiểm được trong ba phút
    bằng cách bấm hai lần, nên test phải kiểm đúng điều đó chứ không chỉ kiểm
    "chạy không lỗi".
  */
  for (const [unitStr, kind] of Object.entries(GENERATED_KIND_OF_UNIT)) {
    const unit = Number(unitStr);
    const meta = getSatRwUnitInCurriculum(unit)!;
    const a = generateSetQuestions(kind, unit, meta.title, 10, seeded(1)).map((q) => q.id);
    const b = generateSetQuestions(kind, unit, meta.title, 10, seeded(999)).map((q) => q.id);
    assert.notDeepEqual(a, b, `bài ${unit} cho ra y hệt nhau ở hai hạt giống khác nhau`);
  }
});

test('cùng hạt giống thì ra cùng bộ đề — để test còn lặp lại được', () => {
  const meta = getSatRwUnitInCurriculum(15)!;
  const a = generateSetQuestions('evidence', 15, meta.title, 8, seeded(42)).map((q) => q.stem);
  const b = generateSetQuestions('evidence', 15, meta.title, 8, seeded(42)).map((q) => q.stem);
  assert.deepEqual(a, b);
});

test('xin nhiều hơn kho thì trả hết kho, KHÔNG lặp lại câu cho đủ số', () => {
  /*
    Kho từ vựng có 43 câu, synthesis có 48. Xin 200 mà hàm nhồi câu lặp cho đủ
    thì bộ đề có cùng một câu bốn lần — tệ hơn hẳn một bộ ngắn hơn.
  */
  const meta = getSatRwUnitInCurriculum(11)!;
  const out = generateSetQuestions('words', 11, meta.title, 200, seeded(5));
  assert.ok(out.length < 200, 'kho hữu hạn mà trả đủ 200 thì chắc chắn có lặp');
  assert.equal(new Set(out.map((q) => q.id)).size, out.length);
});
