import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BILINGUAL_ARTICLES,
  bilingualStats,
  filterBilingualArticles,
  getBilingualArticleById,
} from './bilingual-repository';

test('kho có đủ 34 bài, id không trùng', () => {
  assert.equal(BILINGUAL_ARTICLES.length, 34);
  const ids = new Set(BILINGUAL_ARTICLES.map((a) => a.id));
  assert.equal(ids.size, 34, 'có id bị trùng');
});

test('mọi bài đều có đủ hai thứ tiếng ở tiêu đề và sapo', () => {
  for (const a of BILINGUAL_ARTICLES) {
    assert.ok(a.titleEn.trim(), `${a.id} thiếu tiêu đề tiếng Anh`);
    assert.ok(a.titleVi.trim(), `${a.id} thiếu tiêu đề tiếng Việt`);
    assert.ok(a.standfirstEn.trim(), `${a.id} thiếu sapo tiếng Anh`);
    assert.ok(a.standfirstVi.trim(), `${a.id} thiếu sapo tiếng Việt`);
  }
});

test('mỗi đoạn đều có cả bản Anh lẫn bản Việt — không đoạn nào lệch', () => {
  for (const a of BILINGUAL_ARTICLES) {
    assert.ok(a.paragraphs.length > 0, `${a.id} không có đoạn nào`);
    a.paragraphs.forEach((p, i) => {
      assert.ok(p.en.trim(), `${a.id} đoạn ${i + 1} thiếu bản tiếng Anh`);
      assert.ok(p.vi.trim(), `${a.id} đoạn ${i + 1} thiếu bản tiếng Việt`);
    });
  }
});

test('không còn thẻ HTML lọt vào phần lời giải thích', () => {
  for (const a of BILINGUAL_ARTICLES) {
    for (const q of a.questions) {
      assert.ok(!/<[a-z/]/i.test(q.whyVi), `${a.id} còn thẻ HTML trong lời giải: ${q.whyVi}`);
      assert.ok(!/&[a-z]+;/i.test(q.whyVi), `${a.id} còn thực thể HTML chưa giải mã`);
    }
  }
});

test('đáp án của mọi câu hỏi đều trỏ vào một phương án có thật', () => {
  for (const a of BILINGUAL_ARTICLES) {
    for (const q of a.questions) {
      assert.ok(q.options.length >= 2, `${a.id} câu "${q.q}" có dưới hai phương án`);
      assert.ok(
        q.answerIndex >= 0 && q.answerIndex < q.options.length,
        `${a.id} câu "${q.q}" có đáp án ngoài khoảng`,
      );
    }
  }
});

test('số phút đọc ước lượng luôn dương và khớp số từ', () => {
  for (const a of BILINGUAL_ARTICLES) {
    assert.ok(a.wordCount > 0, `${a.id} không đếm được số từ`);
    assert.ok(a.estMinutes >= 1, `${a.id} có số phút đọc bằng 0`);
    assert.equal(a.estMinutes, Math.ceil(a.wordCount / 200), `${a.id} lệch nhịp 200 từ/phút`);
  }
});

test('tra theo id trả về đúng bài, id lạ trả về undefined', () => {
  const first = BILINGUAL_ARTICLES[0]!;
  assert.equal(getBilingualArticleById(first.id)?.titleEn, first.titleEn);
  assert.equal(getBilingualArticleById('không-có-bài-này'), undefined);
});

test('lọc theo chủ đề và trình độ thu hẹp đúng kho', () => {
  const all = filterBilingualArticles();
  assert.equal(all.length, 34);

  const topic = BILINGUAL_ARTICLES[0]!.topic;
  const byTopic = filterBilingualArticles({ topic });
  assert.ok(byTopic.length > 0);
  assert.ok(byTopic.every((a) => a.topic === topic));

  const level = BILINGUAL_ARTICLES[0]!.level;
  const byLevel = filterBilingualArticles({ level });
  assert.ok(byLevel.every((a) => a.level === level));
});

test('tìm kiếm bắt được cả tên tiếng Việt lẫn tên tiếng Anh', () => {
  const article = BILINGUAL_ARTICLES[0]!;
  assert.ok(
    filterBilingualArticles({ search: article.titleVi.slice(0, 10) }).some(
      (a) => a.id === article.id,
    ),
  );
  assert.ok(
    filterBilingualArticles({ search: article.titleEn.slice(0, 10) }).some(
      (a) => a.id === article.id,
    ),
  );
});

test('thống kê đếm khớp với dữ liệu thật', () => {
  const stats = bilingualStats();
  assert.equal(stats.articles, 34);
  assert.equal(
    stats.paragraphs,
    BILINGUAL_ARTICLES.reduce((n, a) => n + a.paragraphs.length, 0),
  );
  assert.ok(stats.vocab > 0);
  assert.ok(stats.questions > 0);
});
