import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateFallbackQuestionSet, generateOfflineQuestionSet } from './offline-generator';
import type { Article } from '@/data/articles';

/**
 * Bài văn xuôi kiểu passage IELTS Academic: đoạn đủ dài, mỗi đoạn từ ba câu trở
 * lên, có số liệu và từ dài để khoét.
 */
const PARAGRAPHS = [
  'The Great Barrier Reef stretches along the northeastern coastline of Australia and comprises thousands of separate reef structures. Marine biologists describe the system as the largest living formation visible from orbit. Its scale complicates every attempt at coordinated environmental protection.',
  'Rising ocean temperatures have triggered repeated bleaching episodes throughout the northern sections. Corals expel the symbiotic algae that supply them with nutrients whenever heat stress becomes prolonged. Recovery demands several undisturbed years, a condition increasingly difficult to guarantee.',
  'Tourism generates substantial revenue for coastal communities that depend on visiting divers. Operators argue that visitor fees finance monitoring programmes no government budget would otherwise sustain. Conservationists counter that concentrated boat traffic damages precisely the habitats those programmes measure.',
  'Regulators have experimented with rotating closures that suspend access to particular sections. Preliminary surveys suggest that closed areas accumulate juvenile fish faster than continuously open ones. Whether such gains survive the next prolonged heatwave remains genuinely uncertain.',
];

function article(overrides: Partial<Article> = {}): Article {
  return {
    id: 'article-1',
    externalId: 'ext-1',
    title: 'The Great Barrier Reef',
    slug: 'great-barrier-reef',
    sourceName: 'Wikipedia',
    sourceUrl: 'https://example.org/a',
    topic: 'environment',
    track: 'academic',
    exam: 'ielts',
    satTextType: null,
    passageTier: 'ielts_passage_2',
    licenseType: 'cc_by_sa',
    attribution: null,
    publishedAt: null,
    summary: null,
    thumbnailUrl: null,
    cefrLevel: 'B2',
    bandRange: '6-7',
    wordCount: 200,
    estMinutes: 3,
    readabilityScore: 11,
    rareWordRatio: 0.3,
    chunk: 0,
    bodyText: PARAGRAPHS.join('\n\n'),
    paragraphs: PARAGRAPHS,
    ...overrides,
  } as Article;
}

const BODY = PARAGRAPHS.join('\n\n');

test('sinh được câu hỏi cho một passage IELTS bình thường', () => {
  const set = generateOfflineQuestionSet(article());
  assert.ok(set.questions.length > 0, 'không sinh được câu nào');
});

/*
  SÁU BÀI KIỂM DƯỚI ĐÂY SOI ĐƯỜNG LÙI, KHÔNG SOI CỬA CHÍNH.

  Đề IELTS nay dựng theo bản thiết kế passage nên có đủ TFNG, điền từ, nối thông
  tin — đúng những dạng mà đường lùi bị cấm sinh. Ràng buộc cũ vẫn còn giá trị,
  nhưng nó là ràng buộc CỦA ĐƯỜNG LÙI: bộ ấy chỉ dựng được trắc nghiệm khoét từ,
  và nếu có ngày nó lén sinh Matching Headings trở lại thì vẫn phải kêu.
*/
test('đường lùi KHÔNG sinh lại bốn dạng giải được bằng đối chiếu chuỗi', () => {
  // Matching Headings lấy 9 từ đầu đoạn, Sentence Completion chép nguyên câu,
  // Short Answer chép lại con số, True/False/Not Given lộ mẹo "chèn not".
  for (const q of generateFallbackQuestionSet(article()).questions) {
    assert.notEqual(q.type, 'matching_headings');
    assert.notEqual(q.type, 'sentence_completion');
    assert.notEqual(q.type, 'short_answer');
    assert.notEqual(q.type, 'true_false_not_given');
  }
});

test('đường lùi: mọi câu đều là trắc nghiệm đúng 4 lựa chọn, không trùng nhau', () => {
  for (const q of generateFallbackQuestionSet(article()).questions) {
    assert.ok(q.options, `câu ${q.id} không có lựa chọn`);
    assert.equal(q.options!.length, 4, `câu ${q.id} có ${q.options!.length} lựa chọn`);
    assert.equal(new Set(q.options).size, 4, 'lựa chọn bị trùng nhau');
  }
});

test('đường lùi: đáp án đúng luôn nằm trong danh sách lựa chọn', () => {
  for (const q of generateFallbackQuestionSet(article()).questions) {
    assert.ok(q.options!.includes(q.correctAnswer), `đáp án của ${q.id} không có trong lựa chọn`);
  }
});

test('đường lùi: đáp án kiểm chứng được từ chính bài đọc', () => {
  for (const q of generateFallbackQuestionSet(article()).questions) {
    assert.ok(BODY.includes(q.correctAnswer), `đáp án "${q.correctAnswer}" không có trong bài`);
    assert.match(q.prompt, /______/, 'câu hỏi phải có chỗ trống');
  }
});

test('câu hỏi không chứa sẵn đáp án hay đáp án nhiễu', () => {
  // Thấy đáp án nằm ngay trong đề là chọn được mà không cần hiểu nghĩa.
  for (const q of generateFallbackQuestionSet(article()).questions) {
    // Dạng Paragraph Completion lấy nhiễu là cả câu, nên chỉ soi dạng khoét từ.
    if (!q.id.includes('-wic-')) continue;

    for (const option of q.options!) {
      assert.equal(
        q.prompt.toLowerCase().includes(option.toLowerCase()),
        false,
        `lựa chọn "${option}" đã nằm sẵn trong câu hỏi`,
      );
    }
  }
});

test('câu hỏi KHÔNG đi theo thứ tự đoạn trong bài', () => {
  // Đây là điểm dễ nhất của bản cũ: hỏi đoạn 1, rồi đoạn 2, rồi đoạn 3 — người
  // học chỉ việc đọc lần lượt từ trên xuống, không cần định vị thông tin.
  const indexes = generateFallbackQuestionSet(article()).questions.map(
    (q) => q.evidenceParagraphIndex,
  );

  const ascending = indexes.every((v, i) => i === 0 || v >= indexes[i - 1]!);
  assert.equal(ascending, false, `câu hỏi vẫn chạy theo thứ tự đoạn: ${indexes.join(', ')}`);
});

test('xếp tăng dần: đoán từ trong câu trước, nắm mạch cả đoạn sau', () => {
  const set = generateFallbackQuestionSet(article());
  const lastWordGap = set.questions.map((q) => q.id.includes('-wic-')).lastIndexOf(true);
  const firstParagraph = set.questions.map((q) => q.id.includes('-pc-')).indexOf(true);

  if (lastWordGap === -1 || firstParagraph === -1) return;
  assert.ok(lastWordGap < firstParagraph, 'câu khó đã chen lên trước câu dễ');
});

test('evidenceText có thật trong bài và trỏ đúng đoạn, để màn Review tô sáng đúng', () => {
  for (const q of generateOfflineQuestionSet(article()).questions) {
    assert.ok(q.evidenceText.length > 0);
    const paragraph = PARAGRAPHS[q.evidenceParagraphIndex];
    assert.ok(paragraph, `chỉ số đoạn ${q.evidenceParagraphIndex} nằm ngoài bài`);
    assert.ok(paragraph!.includes(q.evidenceText), 'dẫn chứng không nằm trong đoạn được trỏ');
  }
});

test('đường lùi: mọi câu đều có giải thích và bài học rút ra', () => {
  // Đây là thứ người học đọc sau khi nộp bài; thiếu là màn Review rỗng.
  for (const q of generateFallbackQuestionSet(article()).questions) {
    assert.ok(q.explanation.length > 20, `câu ${q.id} giải thích quá sơ sài`);
    assert.ok(q.lessonTip && q.lessonTip.length > 20, `câu ${q.id} thiếu lesson tip`);
  }
});

test('sinh xác định: cùng bài ra đúng bộ đề đó', () => {
  const a = generateOfflineQuestionSet(article());
  const b = generateOfflineQuestionSet(article());

  assert.deepEqual(
    a.questions.map((q) => [q.prompt, q.correctAnswer]),
    b.questions.map((q) => [q.prompt, q.correctAnswer]),
  );
});

test('id bài quyết định thứ tự lựa chọn, để hai người không thấy cùng vị trí đáp án', () => {
  const a = generateFallbackQuestionSet(article({ id: 'article-1' }));
  const b = generateFallbackQuestionSet(article({ id: 'article-9' }));

  const sameOrder = a.questions.every(
    (q, i) => JSON.stringify(q.options) === JSON.stringify(b.questions[i]?.options),
  );
  assert.equal(sameOrder, false, 'đổi id mà thứ tự lựa chọn y hệt thì hạt giống không có tác dụng');
});

test('orderIndex đánh số liên tục từ 0', () => {
  const set = generateOfflineQuestionSet(article());
  assert.deepEqual(
    set.questions.map((q) => q.orderIndex),
    set.questions.map((_, i) => i),
  );
});

test('bài quá ngắn thì trả bộ rỗng, không ném lỗi', () => {
  const set = generateOfflineQuestionSet(
    article({ paragraphs: ['Too short.'], bodyText: 'Too short.' }),
  );
  assert.deepEqual(set.questions, []);
});

test('bài SAT vẫn đi qua bộ sinh đề SAT chứ không rơi vào bộ IELTS', () => {
  const set = generateOfflineQuestionSet(article({ exam: 'sat', passageTier: 'sat_long' }));

  assert.ok(set.questions.length > 0);
  for (const q of set.questions) {
    assert.ok(q.type.startsWith('sat_'), `bài SAT ra dạng IELTS: ${q.type}`);
  }
});
