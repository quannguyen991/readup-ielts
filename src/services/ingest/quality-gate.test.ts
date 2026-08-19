import { test } from 'node:test';
import assert from 'node:assert/strict';

import { checkQuality } from './quality-gate';

const goodParagraph = (i: number): string =>
  `Paragraph number ${i} discusses the topic in reasonable prose with enough words to count as real content for a reader who wants to learn more about the subject matter in considerable depth and detail about various topics that matter for understanding the world better and improving knowledge across diverse fields of study and research endeavors throughout history and science.`;

const goodParagraphs = (): string[] => [1, 2, 3, 4, 5].map(goodParagraph);

test('checkQuality: bài prose bình thường thì lọt', () => {
  assert.deepEqual(checkQuality('Photosynthesis', goodParagraphs()), { ok: true });
});

test('checkQuality: ngưỡng nới cho passage SAT ngắn thì một đoạn cũng lọt', () => {
  const satShort = [goodParagraph(1)];

  assert.deepEqual(checkQuality('An excerpt', satShort), {
    ok: false,
    reason: 'too_few_paragraphs',
  });
  assert.deepEqual(checkQuality('An excerpt', satShort, { minParagraphs: 1, minWords: 25 }), {
    ok: true,
  });
});

test('checkQuality: nới ngưỡng độ dài KHÔNG nới các kiểm tra rác', () => {
  const limits = { minParagraphs: 1, minWords: 25 };
  // Đủ 30 từ để qua ngưỡng độ dài đã nới, nhưng phần lớn ký tự là số —
  // đúng dạng bảng biểu mà gate phải chặn.
  const tableRow = [
    Array.from({ length: 30 }, () => 'Year').join(' '),
    Array.from({ length: 80 }, (_, i) => `${1900 + i}.${i}`).join(' | '),
  ].join(' ');

  assert.deepEqual(checkQuality('List of things', [goodParagraph(1)], limits), {
    ok: false,
    reason: 'list_article',
  });
  assert.deepEqual(checkQuality('Numbers', [tableRow], limits), {
    ok: false,
    reason: 'low_prose_ratio',
  });
});

test('checkQuality: loại bài "List of ..."', () => {
  const verdict = checkQuality('List of countries by population', goodParagraphs());
  assert.deepEqual(verdict, { ok: false, reason: 'list_article' });
});

test('checkQuality: loại trang định hướng theo tiêu đề', () => {
  const verdict = checkQuality('Mercury (disambiguation)', goodParagraphs());
  assert.deepEqual(verdict, { ok: false, reason: 'disambiguation' });
});

test('checkQuality: loại trang định hướng theo cụm "may refer to"', () => {
  const paragraphs = ['Mercury may refer to several different things in science and myth.', ...goodParagraphs()];
  const verdict = checkQuality('Mercury', paragraphs);
  assert.deepEqual(verdict, { ok: false, reason: 'disambiguation' });
});

test('checkQuality: loại bài dưới 4 đoạn', () => {
  const verdict = checkQuality('Stub article', [goodParagraph(1), goodParagraph(2)]);
  assert.deepEqual(verdict, { ok: false, reason: 'too_few_paragraphs' });
});

test('checkQuality: loại bài đủ đoạn nhưng quá ít từ', () => {
  const verdict = checkQuality('Tiny', ['one two three', 'four five six', 'seven eight nine', 'ten eleven twelve']);
  assert.deepEqual(verdict, { ok: false, reason: 'too_short' });
});

test('checkQuality: loại nội dung toàn số liệu / bảng biểu', () => {
  // Mỗi hàng chứa đủ từ nhưng chủ yếu là số và ký tự đặc biệt, không có prose
  const row = 'year|1990|data|12.4|results|33.1|values|8.09|indices|45.2|numbers|77.7|statistics|1991|records|13.5|years|2000|total|55|average|22.3|median|18.9|mode|15.4|range|50|variance|200|deviation|14|sample|100|measurement|101|calculation|102|result|103|outcome|104|summary|105|aggregate|106|count|107|index|108|ratio|109|rate|110|factor|111|multiplier|112|percent|113|basis|114|point|115|value|116|number|117|figure|118|amount|119|total|120|score|121|performance|122|metric|123|estimation|124|approximation|125';
  const verdict = checkQuality('Statistics table', [row, row, row, row]);
  assert.deepEqual(verdict, { ok: false, reason: 'low_prose_ratio' });
});

test('checkQuality: loại nội dung ký tự non-Latin quá nhiều', () => {
  // Tạo fixture với đủ đoạn (4+) và đủ từ (150+) để vượt qua các gate trước,
  // nhưng ký tự hầu hết là non-Latin script.
  // extractWords chỉ match /[a-z][a-z'-]*/ nên ký tự non-Latin không tính là từ.
  const paragraphs = [
    'This article discusses important topics in computer science and technology innovation including software engineering systems architecture database design network protocols programming languages and frameworks used for building modern applications and technical implementations systems for research and analysis studies.',
    'Another paragraph covers different aspects of research methodology analysis techniques statistical computation machine learning artificial intelligence deep learning neural networks pattern recognition feature extraction and other computational approaches to solve problems effectively and efficiently with demonstrated success in various real world applications and scenarios.',
    'Additional content explores business applications market analysis financial systems economic trends international commerce trade relations competitive strategies operational efficiency resource management quality assurance process improvement and organizational development through various methods for success and achievement in modern enterprises.',
    'Привет мир 你好世界 العالم مرحبا здравствуй мир こんにちは世界 안녕하세요 세계 مرحبا שלום עולם Γeία σας κόσмος 😀🎉🌟💫✨ Привет мир 你好世界 العالم مрحبا здравствуй мир こんにちは世界 安寧 🌍🌏🌎 Привет мир 你好世界 العالم مرحبا здравствуй мир こんにちは世界 안녕하세요 세계 Привет мир 你好世界 العالم Привет мир 你好This paragraph contains many non-Latin characters with just enough words: test content verification purposes demonstration testing framework validation parameters checking results assessment completion and finalization implementation requirements specifications development planning execution process and management.',
  ];
  const verdict = checkQuality('Heavy non-Latin', paragraphs);
  assert.deepEqual(verdict, { ok: false, reason: 'non_latin_heavy' });
});
