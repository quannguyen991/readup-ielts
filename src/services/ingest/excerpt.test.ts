import { test } from 'node:test';
import assert from 'node:assert/strict';

import { pickExcerpts, stripGutenbergBoilerplate, toProseParagraphs } from './excerpt';
import { countWords, truncateToTier } from './tiers';

/** Đoạn văn n từ, kết bằng dấu chấm và mở đầu bằng chữ hoa. */
const para = (n: number, seed = 'alpha'): string =>
  `Beta ${Array.from({ length: Math.max(0, n - 2) }, () => seed).join(' ')} gamma.`;

const book = (paragraphCount: number, wordsEach = 90): string[] =>
  Array.from({ length: paragraphCount }, () => para(wordsEach));

test('stripGutenbergBoilerplate: bỏ giấy phép đầu và cuối', () => {
  const raw = [
    'The Project Gutenberg eBook of Something',
    'This eBook is for the use of anyone anywhere at no cost.',
    '*** START OF THE PROJECT GUTENBERG EBOOK SOMETHING ***',
    'REAL BODY TEXT',
    '*** END OF THE PROJECT GUTENBERG EBOOK SOMETHING ***',
    'Updated editions will replace the previous one.',
  ].join('\n\n');

  const body = stripGutenbergBoilerplate(raw);

  assert.ok(body.includes('REAL BODY TEXT'));
  assert.equal(body.includes('This eBook is for the use'), false);
  assert.equal(body.includes('Updated editions'), false);
});

test('stripGutenbergBoilerplate: không có mốc thì trả nguyên văn', () => {
  assert.equal(stripGutenbergBoilerplate('chỉ có nội dung'), 'chỉ có nội dung');
});

test('toProseParagraphs: nối dòng gãy trong cùng một đoạn', () => {
  const text = 'It is a truth universally acknowledged,\nthat a single man in possession\nof a good fortune, must be in want of a wife.';
  const paragraphs = toProseParagraphs(text);

  assert.equal(paragraphs.length, 1);
  assert.equal(paragraphs[0]!.includes('\n'), false);
  assert.match(paragraphs[0]!, /acknowledged, that a single man/);
});

test('toProseParagraphs: loại tiêu đề chương, mục lục, chú thích hình', () => {
  const text = [
    'CHAPTER I',
    'Chapter II. The second one',
    'CONTENTS . . . . . . . . 17',
    'The Wedding Party ....... 42',
    '[Illustration: The heroine at the window]',
    para(40),
    'ALL CAPS HEADING THAT IS FAIRLY LONG AND SHOUTY INDEED FRIENDS',
  ].join('\n\n');

  const paragraphs = toProseParagraphs(text);

  assert.equal(paragraphs.length, 1, `còn lại: ${JSON.stringify(paragraphs)}`);
  assert.match(paragraphs[0]!, /^Beta /);
});

test('toProseParagraphs: bỏ ghi chú của người số hoá nằm trong phần thân', () => {
  // Đúng bốn đoạn đã lọt vào passage "The Declaration of Independence".
  const text = [
    'The resulting document has several misspellings removed from those parchment facsimiles I used back in 1971, including Brittain.',
    '[RO, Aug 2025: The original fully-justified columns of text in the plain text version have been restored for the introduction.]',
    'NOTE: This file contains the original contents of the very first eBook in the Project Gutenberg collection, the Declaration of Independence.',
    'All of the original Project Gutenberg Etexts from the 1970s were produced in ALL CAPS, no lower case at all whatsoever.',
    'When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another.',
  ].join('\n\n');

  const paragraphs = toProseParagraphs(text);

  assert.equal(paragraphs.length, 1, `còn lại: ${JSON.stringify(paragraphs)}`);
  assert.match(paragraphs[0]!, /^When in the Course of human events/);
});

test('toProseParagraphs: bỏ gạch dưới đánh dấu chữ nghiêng', () => {
  const [paragraph] = toProseParagraphs(`She read the whole of _Middlemarch_ that winter, and thought about it for a long time afterwards indeed.`);
  assert.match(paragraph!, /the whole of Middlemarch that winter/);
});

test('pickExcerpts: rải đều dọc tác phẩm, không dồn về đầu', () => {
  const excerpts = pickExcerpts(book(200), {
    count: 4,
    targetWords: 130,
    minWords: 25,
    maxWords: 150,
  });

  assert.equal(excerpts.length, 4);

  const starts = excerpts.map((e) => e.startIndex);
  assert.deepEqual([...starts].sort((a, b) => a - b), starts, 'phải tăng dần');
  assert.ok(starts[3]! - starts[0]! > 100, `mới cách nhau ${starts[3]! - starts[0]!} đoạn`);
});

test('pickExcerpts: bỏ phần đầu và phần cuối tác phẩm', () => {
  const total = 200;
  const excerpts = pickExcerpts(book(total), {
    count: 5,
    targetWords: 130,
    minWords: 25,
    maxWords: 150,
  });

  for (const e of excerpts) {
    assert.ok(e.startIndex >= total * 0.12, `bắt đầu ở đoạn ${e.startIndex}, còn trong phần bìa`);
    assert.ok(e.startIndex < total * 0.92, `bắt đầu ở đoạn ${e.startIndex}, đã sang phụ lục`);
  }
});

test('pickExcerpts: mọi trích đoạn nằm trong khổ đã khai', () => {
  const excerpts = pickExcerpts(book(300, 60), {
    count: 6,
    targetWords: 130,
    minWords: 25,
    maxWords: 150,
  });

  assert.ok(excerpts.length > 0);
  for (const e of excerpts) {
    assert.equal(e.wordCount, e.paragraphs.reduce((s, p) => s + countWords(p), 0));
    assert.ok(e.wordCount >= 25 && e.wordCount <= 150, `${e.wordCount} từ, ngoài khổ 25–150`);
  }
});

test('pickExcerpts: các trích đoạn không chồng lấn nhau', () => {
  const excerpts = pickExcerpts(book(120, 40), {
    count: 8,
    targetWords: 130,
    minWords: 25,
    maxWords: 150,
  });

  let previousEnd = -1;
  for (const e of excerpts) {
    assert.ok(e.startIndex > previousEnd, `đoạn ${e.startIndex} lấn vào trích đoạn trước`);
    previousEnd = e.startIndex + e.paragraphs.length - 1;
  }
});

test('pickExcerpts: đoạn dài quá khổ thì cắt theo câu, không cắt giữa câu', () => {
  const longParagraph = Array.from({ length: 10 }, (_, i) => `Sentence ${i} ${para(30)}`).join(' ');
  const excerpts = pickExcerpts([longParagraph, ...book(30)], {
    count: 1,
    targetWords: 130,
    minWords: 25,
    maxWords: 150,
  });

  assert.equal(excerpts.length, 1);
  assert.ok(excerpts[0]!.wordCount <= 150);
  assert.match(excerpts[0]!.paragraphs[0]!.trim(), /\.$/, 'phải kết thúc ở cuối một câu');
});

test('pickExcerpts: gom nhiều đoạn cho khổ dài', () => {
  const excerpts = pickExcerpts(book(200, 120), {
    count: 3,
    targetWords: 720,
    minWords: 500,
    maxWords: 750,
  });

  assert.equal(excerpts.length, 3);
  for (const e of excerpts) {
    assert.ok(e.paragraphs.length >= 4, `chỉ gom được ${e.paragraphs.length} đoạn`);
    assert.ok(e.wordCount >= 500 && e.wordCount <= 750, `${e.wordCount} từ, ngoài khổ 500–750`);
  }
});

test('pickExcerpts: tác phẩm quá ngắn cho khổ yêu cầu thì trả rỗng', () => {
  const excerpts = pickExcerpts(book(3, 30), {
    count: 3,
    targetWords: 720,
    minWords: 500,
    maxWords: 750,
  });

  assert.deepEqual(excerpts, []);
});

test('pickExcerpts: tác phẩm ngắn không bị cắt đầu đuôi', () => {
  // Một bài diễn văn 10 đoạn: bỏ 12% đầu + 8% cuối sẽ ăn mất nội dung thật.
  const excerpts = pickExcerpts(book(10, 60), {
    count: 2,
    targetWords: 130,
    minWords: 25,
    maxWords: 150,
  });

  assert.equal(excerpts.length, 2);
  assert.equal(excerpts[0]!.startIndex, 0);
});

test('pickExcerpts: avoid chặn trích đoạn ngắn nằm lọt trong trích đoạn dài', () => {
  const paragraphs = book(200, 90);

  const long = pickExcerpts(paragraphs, {
    count: 2,
    targetWords: 720,
    minWords: 500,
    maxWords: 750,
  });
  const used = long.map((e) => ({ start: e.startIndex, end: e.startIndex + e.paragraphs.length }));

  const short = pickExcerpts(paragraphs, {
    count: 5,
    targetWords: 130,
    minWords: 25,
    maxWords: 150,
    avoid: used,
  });

  assert.ok(short.length > 0);
  for (const e of short) {
    const from = e.startIndex;
    const to = e.startIndex + e.paragraphs.length;
    for (const range of used) {
      assert.ok(
        to <= range.start || from >= range.end,
        `trích đoạn ${from}–${to} chồng lên vùng đã dùng ${range.start}–${range.end}`,
      );
    }
  }
});

test('pickExcerpts: trích đoạn đi qua truncateToTier không bị xén thêm', () => {
  // Đây là bất biến quan trọng nhất của module: bài do pickExcerpts cắt còn
  // phải qua truncateToTier một lần nữa trong pipeline. Hai luật gom đoạn lệch
  // nhau là lần cắt thứ hai xén mất phần đầu bài (đã gặp: 139 từ còn 39).
  const uneven = [40, 110, 55, 130, 70, 95, 45, 120, 60, 105, 80, 90].flatMap((n) => [
    para(n),
    para(n + 30),
  ]);

  for (const [tier, spec] of [
    ['sat_short', { count: 5, targetWords: 130, minWords: 60, maxWords: 150 }],
    ['sat_long', { count: 2, targetWords: 720, minWords: 500, maxWords: 750 }],
  ] as const) {
    for (const excerpt of pickExcerpts([...uneven, ...uneven, ...uneven], spec)) {
      assert.deepEqual(
        truncateToTier(excerpt.paragraphs, tier),
        excerpt.paragraphs,
        `${tier}: truncateToTier xén lại trích đoạn ${excerpt.wordCount} từ`,
      );
    }
  }
});

test('pickExcerpts: không mở đầu bằng đoạn cụt hay câu nói dở', () => {
  const excerpts = pickExcerpts(
    ['short bit.', 'said she, turning away quickly.', ...book(60)],
    { count: 2, targetWords: 130, minWords: 25, maxWords: 150 },
  );

  for (const e of excerpts) {
    assert.match(e.paragraphs[0]!, /^["'“‘(]?[A-Z]/);
    assert.ok(countWords(e.paragraphs[0]!) >= 20);
  }
});
