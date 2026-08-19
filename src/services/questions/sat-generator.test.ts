import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateSatQuestionSet } from './sat-generator';
import { SAT_QUESTION_TYPES } from './types';
import type { Article } from '@/data/articles';

/**
 * Đoạn văn xuôi thật, đủ từ dài để khoét chỗ trống và đủ câu để làm nhiễu.
 * Dùng văn phong giải thích giống passage khoa học của SAT.
 */
const PARAGRAPHS = [
  'Researchers examining migration patterns discovered that certain songbirds navigate using magnetic fields. The mechanism depends on specialized proteins located within the retina. Scientists remain divided about whether these proteins operate independently of visual perception.',
  'Subsequent experiments introduced artificial magnetic disturbance into controlled enclosures. Birds exposed to disturbance consistently selected incorrect directions during departure. Investigators concluded that magnetic information contributes substantially to orientation.',
  'Critics emphasize that laboratory enclosures eliminate landmarks available in natural environments. They suggest magnetic sensitivity supplements rather than replaces conventional navigation. Resolving disagreement requires tracking individuals across complete migratory journeys.',
];

function article(overrides: Partial<Article> = {}): Article {
  return {
    id: 'article-1',
    externalId: 'ext-1',
    title: 'Songbird navigation',
    slug: 'songbird-navigation',
    sourceName: 'Project Gutenberg',
    sourceUrl: 'https://example.org/a',
    topic: 'science',
    track: 'academic',
    exam: 'sat',
    satTextType: 'science',
    passageTier: 'sat_long',
    licenseType: 'public_domain',
    attribution: null,
    publishedAt: null,
    summary: null,
    thumbnailUrl: null,
    cefrLevel: 'C1',
    bandRange: null,
    wordCount: 120,
    estMinutes: 1,
    readabilityScore: 12,
    rareWordRatio: 0.3,
    chunk: 0,
    bodyText: PARAGRAPHS.join('\n\n'),
    paragraphs: PARAGRAPHS,
    ...overrides,
  } as Article;
}

test('chỉ sinh dạng câu của SAT, không lẫn dạng IELTS', () => {
  const set = generateSatQuestionSet(article());

  assert.ok(set.questions.length > 0);
  for (const q of set.questions) {
    assert.ok(SAT_QUESTION_TYPES.includes(q.type), `dạng lạ: ${q.type}`);
  }
});

test('mọi câu đều là trắc nghiệm đúng 4 lựa chọn', () => {
  // Đây là khác biệt cấu trúc lớn nhất giữa SAT và IELTS.
  for (const q of generateSatQuestionSet(article()).questions) {
    assert.ok(q.options, `câu ${q.type} không có lựa chọn`);
    assert.equal(q.options!.length, 4, `câu ${q.type} có ${q.options!.length} lựa chọn`);
    assert.equal(new Set(q.options).size, 4, 'lựa chọn bị trùng nhau');
  }
});

test('đáp án đúng luôn nằm trong danh sách lựa chọn', () => {
  for (const q of generateSatQuestionSet(article()).questions) {
    assert.ok(q.options!.includes(q.correctAnswer), `đáp án của ${q.id} không có trong lựa chọn`);
  }
});

test('đáp án kiểm chứng được từ chính bài đọc', () => {
  const body = PARAGRAPHS.join('\n\n');

  for (const q of generateSatQuestionSet(article()).questions) {
    if (q.type === 'sat_words_in_context') {
      assert.ok(body.includes(q.correctAnswer), `từ "${q.correctAnswer}" không có trong bài`);
      assert.match(q.prompt, /______/, 'câu hỏi phải có chỗ trống');
    }
    if (q.type === 'sat_inference') {
      assert.ok(body.includes(q.correctAnswer), 'câu kết phải là câu có thật trong bài');
      assert.match(q.prompt, /______$/, 'chỗ trống phải ở cuối');
    }
  }
});

test('evidenceText là chuỗi có thật trong bài, để màn Review tô sáng đúng', () => {
  const body = PARAGRAPHS.join('\n\n');

  for (const q of generateSatQuestionSet(article()).questions) {
    assert.ok(q.evidenceText.length > 0);
    assert.ok(body.includes(q.evidenceText), `không tìm thấy dẫn chứng: "${q.evidenceText}"`);
  }
});

test('evidenceParagraphIndex trỏ đúng đoạn chứa dẫn chứng', () => {
  for (const q of generateSatQuestionSet(article()).questions) {
    const paragraph = PARAGRAPHS[q.evidenceParagraphIndex];
    assert.ok(paragraph, `chỉ số đoạn ${q.evidenceParagraphIndex} nằm ngoài bài`);
    assert.ok(paragraph!.includes(q.evidenceText), 'dẫn chứng không nằm trong đoạn được trỏ');
  }
});

test('chỗ trống không để lộ đáp án ở chỗ khác trong cùng câu', () => {
  for (const q of generateSatQuestionSet(article()).questions) {
    if (q.type !== 'sat_words_in_context') continue;
    assert.equal(
      q.prompt.toLowerCase().includes(q.correctAnswer.toLowerCase()),
      false,
      `câu hỏi còn chứa nguyên đáp án "${q.correctAnswer}"`,
    );
  }
});

test('số câu bám khổ bài: đoạn ngắn ít câu hơn đoạn dài', () => {
  // Đề SAT số hoá thật cho mỗi đoạn ngắn đúng một câu hỏi; nhồi 10 câu vào
  // đoạn 130 từ là hỏng nhịp luyện.
  const short = generateSatQuestionSet(article({ passageTier: 'sat_short' }));
  const long = generateSatQuestionSet(article({ passageTier: 'sat_long' }));

  assert.equal(short.questions.length, 3);
  assert.ok(long.questions.length > short.questions.length);
});

test('sinh xác định: cùng bài ra đúng bộ đề đó', () => {
  const a = generateSatQuestionSet(article());
  const b = generateSatQuestionSet(article());

  assert.deepEqual(
    a.questions.map((q) => [q.type, q.prompt, q.correctAnswer]),
    b.questions.map((q) => [q.type, q.prompt, q.correctAnswer]),
  );
});

test('bài khác nội dung ra bộ đề khác nhau', () => {
  // Cùng một bài văn thì ra cùng bộ câu hỏi, kể cả id khác — chỗ id tác động
  // là thứ tự lựa chọn và việc chọn đáp án nhiễu, không phải chọn câu nào để
  // khoét. Thứ quyết định đề là NỘI DUNG.
  const other = [
    'Coastal cities increasingly rely on constructed wetlands to absorb storm surges. Engineers estimate that restored marshland reduces flooding damage substantially. Municipal budgets, however, rarely accommodate long maintenance timelines.',
    'Opponents contend that wetlands occupy land needed for housing development. Planners respond that flooded neighbourhoods generate expenses far exceeding construction savings. Negotiations continue across several waterfront districts.',
  ];

  const a = generateSatQuestionSet(article());
  const b = generateSatQuestionSet(
    article({ id: 'article-2', paragraphs: other, bodyText: other.join('\n\n') }),
  );

  assert.notDeepEqual(
    a.questions.map((q) => q.prompt),
    b.questions.map((q) => q.prompt),
  );
});

test('id bài quyết định thứ tự lựa chọn, để hai người không thấy cùng vị trí đáp án', () => {
  const a = generateSatQuestionSet(article({ id: 'article-1' }));
  const b = generateSatQuestionSet(article({ id: 'article-9' }));

  const sameOrder = a.questions.every(
    (q, i) => JSON.stringify(q.options) === JSON.stringify(b.questions[i]?.options),
  );
  assert.equal(sameOrder, false, 'đổi id mà thứ tự lựa chọn y hệt thì hạt giống không có tác dụng');
});

test('orderIndex đánh số liên tục từ 0', () => {
  const set = generateSatQuestionSet(article());
  assert.deepEqual(
    set.questions.map((q) => q.orderIndex),
    set.questions.map((_, i) => i),
  );
});

test('KHÔNG sinh dạng giải được bằng đối chiếu chuỗi', () => {
  // Command of Evidence dựng offline thì nhận định gần như chép lại đáp án,
  // người học so chuỗi là ra. Dạng đó chỉ nhánh Claude mới làm được tử tế.
  for (const q of generateSatQuestionSet(article()).questions) {
    assert.notEqual(q.type, 'sat_command_of_evidence');
    assert.notEqual(q.type, 'sat_central_idea');
    assert.notEqual(q.type, 'sat_text_structure');
  }
});

test('không đáp án nhiễu nào xuất hiện sẵn trong chính câu hỏi', () => {
  // Nhiễu nằm ngay trong câu là tự loại được mà không cần hiểu nghĩa.
  for (const q of generateSatQuestionSet(article()).questions) {
    if (q.type !== 'sat_words_in_context') continue;
    for (const option of q.options!) {
      if (option === q.correctAnswer) continue;
      assert.equal(
        q.prompt.toLowerCase().includes(option.toLowerCase()),
        false,
        `nhiễu "${option}" đã nằm sẵn trong câu hỏi`,
      );
    }
  }
});

test('bài quá ngắn thì trả bộ rỗng, không ném lỗi', () => {
  const set = generateSatQuestionSet(
    article({ paragraphs: ['Too short.'], bodyText: 'Too short.' }),
  );
  assert.deepEqual(set.questions, []);
});
