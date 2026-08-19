import assert from 'node:assert/strict';
import { test } from 'node:test';

import { generateSatWritingQuestions } from './sat-writing-generator';
import { OPTIONS_PER_QUESTION } from './text-utils';
import type { Article } from '@/data/articles';

function article(paragraphs: string[], id = 'a1'): Article {
  return {
    id,
    slug: id,
    title: 'T',
    paragraphs,
  } as unknown as Article;
}

/** Đoạn có đủ chất liệu cho cả ba dạng sinh offline. */
const RICH = article([
  'The committee approved the plan in March. However, the funding was delayed until the following year. The delay was caused by a dispute over the budget; the two departments could not agree on the allocation.',
  'Researchers collected samples from the river. Moreover, they measured the temperature at three depths. The results were surprising, and the team published them in a leading journal.',
  'She was appointed director in 2019. Therefore, the restructuring began almost immediately. Its effect on staff morale was studied carefully.',
]);

test('mọi câu đều có đúng bốn lựa chọn', () => {
  for (const q of generateSatWritingQuestions(RICH)) {
    assert.ok(q.options);
    assert.equal(q.options.length, OPTIONS_PER_QUESTION);
  }
});

test('đáp án đúng luôn nằm trong danh sách lựa chọn', () => {
  for (const q of generateSatWritingQuestions(RICH)) {
    assert.ok(q.options?.includes(q.correctAnswer), `${q.type}: đáp án không có trong options`);
  }
});

test('không lựa chọn nào bị trùng nhau', () => {
  for (const q of generateSatWritingQuestions(RICH)) {
    assert.equal(new Set(q.options).size, q.options?.length, `${q.type}: có lựa chọn trùng`);
  }
});

test('chỉ sinh ba dạng kiểm chứng được, KHÔNG sinh rhetorical synthesis', () => {
  // Dạng đó cho gạch đầu dòng ghi chú chứ không phải văn xuôi; rút máy móc từ
  // prose sẽ ra ghi chú vô nghĩa hoặc lộ đáp án. Để cho nhánh AI.
  const types = new Set(generateSatWritingQuestions(RICH).map((q) => q.type));
  assert.ok(!types.has('sat_rhetorical_synthesis'));
  for (const t of types) {
    assert.ok(
      ['sat_transitions', 'sat_boundaries', 'sat_form_structure_sense'].includes(t),
      `dạng lạ: ${t}`,
    );
  }
});

test('sinh được cả ba dạng khi đoạn văn đủ chất liệu', () => {
  const types = new Set(generateSatWritingQuestions(RICH).map((q) => q.type));
  assert.ok(types.has('sat_transitions'), 'thiếu transitions');
  assert.ok(types.has('sat_boundaries'), 'thiếu boundaries');
  assert.ok(types.has('sat_form_structure_sense'), 'thiếu form/structure/sense');
});

test('đáp án của Transitions là từ nối CÓ THẬT trong bài', () => {
  const text = RICH.paragraphs.join(' ').toLowerCase();
  for (const q of generateSatWritingQuestions(RICH).filter((x) => x.type === 'sat_transitions')) {
    assert.ok(text.includes(q.correctAnswer.toLowerCase()), `"${q.correctAnswer}" không có trong bài`);
  }
});

test('nhiễu của Transitions thuộc quan hệ logic KHÁC đáp án', () => {
  // Nhiễu cùng quan hệ với đáp án thì câu hỏi có hai đáp án đúng.
  for (const q of generateSatWritingQuestions(RICH).filter((x) => x.type === 'sat_transitions')) {
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.explanation.length > 0);
  }
});

test('chỗ trống không để lộ đáp án ở chỗ khác trong cùng câu hỏi', () => {
  for (const q of generateSatWritingQuestions(RICH)) {
    const promptOnly = q.prompt.replace(/_{2,}/g, ' ');
    assert.ok(
      !promptOnly.toLowerCase().includes(q.correctAnswer.toLowerCase()),
      `${q.type}: đáp án "${q.correctAnswer}" lộ ngay trong đề`,
    );
  }
});

test('mọi câu đều có dẫn chứng trỏ đúng đoạn có thật', () => {
  for (const q of generateSatWritingQuestions(RICH)) {
    assert.ok(q.evidenceParagraphIndex >= 0);
    assert.ok(q.evidenceParagraphIndex < RICH.paragraphs.length);
    assert.ok(
      RICH.paragraphs[q.evidenceParagraphIndex]?.includes(q.evidenceText),
      `${q.type}: dẫn chứng không nằm trong đoạn đã trỏ`,
    );
  }
});

test('sinh xác định: cùng bài ra đúng bộ câu đó', () => {
  assert.deepEqual(generateSatWritingQuestions(RICH), generateSatWritingQuestions(RICH));
});

test('bài khác nội dung ra bộ câu khác nhau', () => {
  const other = article(['A different passage entirely. However, it shares one connective.'], 'a2');
  assert.notDeepEqual(generateSatWritingQuestions(RICH), generateSatWritingQuestions(other));
});

test('orderIndex đánh số liên tục từ 0', () => {
  const qs = generateSatWritingQuestions(RICH);
  assert.deepEqual(
    qs.map((q) => q.orderIndex),
    qs.map((_, i) => i),
  );
});

test('bài quá ngắn thì trả bộ rỗng, không ném lỗi', () => {
  assert.deepEqual(generateSatWritingQuestions(article(['Short.'])), []);
  assert.deepEqual(generateSatWritingQuestions(article([])), []);
});
