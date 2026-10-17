import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DICTATION_SETS,
  DICTATION_SET_LEVELS,
  DICTATION_SET_TOPICS,
  dictationSetStats,
  dictationTopicLabel,
  filterDictationSets,
  getDictationSet,
} from './dictation-sets';

test('kho có đủ 54 bộ, 648 câu, id và số thứ tự không trùng', () => {
  assert.equal(DICTATION_SETS.length, 54);
  assert.equal(new Set(DICTATION_SETS.map((s) => s.id)).size, 54, 'có id bị trùng');
  assert.equal(new Set(DICTATION_SETS.map((s) => s.order)).size, 54, 'có số thứ tự bị trùng');
  assert.equal(dictationSetStats().sentences, 648);
});

test('số thứ tự nguồn phủ kín 1..54, không hụt bài nào', () => {
  const orders = DICTATION_SETS.map((s) => s.order).sort((a, b) => a - b);
  orders.forEach((order, i) => {
    assert.equal(order, i + 1, `thiếu bài số ${i + 1}`);
  });
});

test('mỗi bộ đúng 12 câu, câu nào cũng có cả hai thứ tiếng', () => {
  for (const set of DICTATION_SETS) {
    assert.equal(set.sentences.length, 12, `${set.id} không có đủ 12 câu`);
    for (const [i, sentence] of set.sentences.entries()) {
      assert.ok(sentence.en.trim(), `${set.id} câu ${i + 1} thiếu tiếng Anh`);
      assert.ok(sentence.vi.trim(), `${set.id} câu ${i + 1} thiếu bản dịch`);
    }
  }
});

/**
 * Câu phải kết thúc bằng dấu câu.
 *
 * Không phải chuyện hình thức: bộ đọc TTS ngắt nhịp theo dấu câu, thiếu dấu thì
 * nó đọc trôi tuột sang câu sau và người học không biết câu đã hết.
 */
test('mọi câu đều kết thúc bằng dấu câu để TTS ngắt nhịp đúng', () => {
  for (const set of DICTATION_SETS) {
    for (const sentence of set.sentences) {
      assert.match(sentence.en, /[.!?]$/, `${set.id}: "${sentence.en}" không có dấu kết câu`);
    }
  }
});

test('không có câu tiếng Anh nào bị lặp giữa các bộ', () => {
  const seen = new Map<string, string>();
  for (const set of DICTATION_SETS) {
    for (const sentence of set.sentences) {
      const key = sentence.en.toLowerCase().replace(/\s+/g, ' ').trim();
      const previous = seen.get(key);
      assert.ok(!previous, `${set.id} lặp lại câu của ${previous}: "${sentence.en}"`);
      seen.set(key, set.id);
    }
  }
});

test('bản dịch đúng là tiếng Việt, không phải chép lại tiếng Anh', () => {
  for (const set of DICTATION_SETS) {
    for (const sentence of set.sentences) {
      assert.notEqual(sentence.vi.trim(), sentence.en.trim(), `${set.id} có bản dịch trùng bản gốc`);
      assert.match(
        sentence.vi,
        /[àáâãèéêìíòóôõùúýăđĩũơưạ-ỹ]/i,
        `${set.id}: "${sentence.vi}" không có dấu tiếng Việt`,
      );
    }
  }
});

test('độ khó không giảm khi số bài tăng', () => {
  const rank: Record<string, number> = { A2: 0, B1: 1, B2: 2, C1: 3 };
  let previous = -1;
  for (const set of DICTATION_SETS) {
    const current = rank[set.level];
    assert.ok(current !== undefined, `${set.id} có trình độ lạ: ${set.level}`);
    assert.ok(current! >= previous, `${set.id} (${set.level}) dễ hơn bài đứng trước nó`);
    previous = current!;
  }
});

test('mỗi bộ đều có tiêu đề, mô tả và gợi ý giọng', () => {
  for (const set of DICTATION_SETS) {
    assert.ok(set.title.trim(), `${set.id} thiếu tiêu đề`);
    assert.ok(set.blurb.trim(), `${set.id} thiếu mô tả`);
    assert.ok(set.topic.trim(), `${set.id} thiếu chủ đề`);
    assert.ok(set.accentHint.trim(), `${set.id} thiếu gợi ý giọng`);
  }
});

test('lọc theo trình độ và chủ đề thu hẹp đúng kho', () => {
  assert.equal(filterDictationSets().length, 54);

  for (const level of DICTATION_SET_LEVELS) {
    const got = filterDictationSets({ level });
    assert.ok(got.length > 0, `trình độ ${level} không có bài nào`);
    assert.ok(got.every((s) => s.level === level));
  }

  const topic = DICTATION_SET_TOPICS[0]!;
  assert.ok(filterDictationSets({ topic }).every((s) => s.topic === topic));
});

test('tra theo id trả về đúng bộ, id lạ trả về undefined', () => {
  assert.equal(getDictationSet('set-01')?.order, 1);
  assert.equal(getDictationSet('không-có-bộ-này'), undefined);
});

test('mọi chủ đề chép chính tả đều có tên tiếng Anh', () => {
  for (const topic of DICTATION_SET_TOPICS) {
    const en = dictationTopicLabel(topic, true);
    assert.notEqual(en, topic, `chủ đề "${topic}" chưa có bản tiếng Anh`);
    assert.match(en, /^[A-Za-z ]+$/);
  }
  assert.equal(dictationTopicLabel('Ẩm thực', false), 'Ẩm thực');
});
