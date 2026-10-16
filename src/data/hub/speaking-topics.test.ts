import test from 'node:test';
import assert from 'node:assert/strict';

import { SPEAKING_TOPICS, questionCount, topicById } from './speaking-topics';

test('mỗi chủ đề có id duy nhất và đủ tiêu đề', () => {
  const ids = SPEAKING_TOPICS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const t of SPEAKING_TOPICS) {
    assert.ok(t.title.trim() && t.titleVi.trim() && t.tipVi.trim(), `thiếu tiêu đề: ${t.id}`);
  }
});

test('đủ ba phần của bài thi: Part 1 ba câu, cue card bốn gợi ý, Part 3 hai câu', () => {
  for (const t of SPEAKING_TOPICS) {
    assert.equal(t.part1.length, 3, `Part 1 của ${t.id}`);
    assert.equal(t.part2.bullets.length, 4, `gợi ý Part 2 của ${t.id}`);
    assert.equal(t.part3.length, 2, `Part 3 của ${t.id}`);
    assert.match(t.part2.prompt, /^Describe /, `đề Part 2 của ${t.id} phải bắt đầu bằng "Describe"`);
  }
});

test('không có câu hỏi hay gợi ý rỗng', () => {
  for (const t of SPEAKING_TOPICS) {
    for (const line of [...t.part1, ...t.part3, ...t.part2.bullets, t.part2.prompt]) {
      assert.ok(line.trim().length > 3, `dòng rỗng trong ${t.id}`);
    }
  }
});

test('tra cứu và đếm câu', () => {
  assert.equal(topicById('travel')?.titleVi, 'Du lịch');
  assert.equal(topicById('không-có'), undefined);
  for (const t of SPEAKING_TOPICS) assert.equal(questionCount(t), 6);
});
