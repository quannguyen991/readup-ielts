import test from 'node:test';
import assert from 'node:assert/strict';

import { buildReminder, reminderFacts, testReminder, vnTodayKey } from './build';

const TODAY = '2026-10-01';

const day = (date: string, minutes: number) => ({ date, minutes, questions: 0 });

/** Một người có `n` từ trong bộ `slug`, đến hạn vào `due`. */
function reviews(slug: string, n: number, due: string) {
  const words: Record<string, { box: number; due: string; last: string }> = {};
  for (let i = 0; i < n; i++) words[`w${i}`] = { box: 1, due, last: '2026-09-29' };
  return { [slug]: words };
}

test('không có gì đến hạn, không có chuỗi → null (không spam)', () => {
  assert.equal(buildReminder({}, TODAY, 'vi'), null);
  assert.equal(
    buildReminder({ topic_study: { reviews: reviews('travel', 5, '2026-10-05') } }, TODAY, 'vi'),
    null,
  );
});

test('đã học hôm nay và không có từ đến hạn → null', () => {
  const study = { daily: { '2026-09-29': day('2026-09-29', 10), '2026-09-30': day('2026-09-30', 10), [TODAY]: day(TODAY, 5) } };
  assert.equal(buildReminder({ study }, TODAY, 'vi'), null);
});

test('chuỗi 1 ngày (chỉ học hôm qua) chưa đáng nhắc', () => {
  const study = { daily: { '2026-09-30': day('2026-09-30', 10) } };
  assert.equal(buildReminder({ study }, TODAY, 'vi'), null);
});

test('có từ đến hạn → báo số từ, link thẳng tới bài ôn của bộ đó', () => {
  const r = buildReminder({ topic_study: { reviews: reviews('travel', 12, '2026-09-30') } }, TODAY, 'vi');
  assert.ok(r);
  assert.equal(r.title, 'Hôm nay bạn còn 12 từ cần ôn');
  assert.equal(r.url, 'https://9band.com/vocabulary/topic/travel/quiz?only=due');
});

test('từ đến hạn ở nhiều bộ → cộng dồn, link về danh sách bộ', () => {
  const rv = { ...reviews('travel', 3, TODAY), ...reviews('health', 4, '2026-09-20') };
  const r = buildReminder({ topic_study: { reviews: rv } }, TODAY, 'vi');
  assert.ok(r);
  assert.match(r.title, /7 từ/u);
  assert.equal(r.url, 'https://9band.com/vocabulary/topics');
});

test('học liền 15 ngày tới hôm qua, hôm nay chưa học → nhắc giữ chuỗi', () => {
  const daily: Record<string, ReturnType<typeof day>> = {};
  for (let i = 1; i <= 15; i++) {
    const d = new Date(Date.UTC(2026, 9, 1 - i)).toISOString().slice(0, 10);
    daily[d] = day(d, 20);
  }
  const r = buildReminder({ study: { daily } }, TODAY, 'vi');
  assert.ok(r);
  assert.equal(r.title, 'Chuỗi 15 ngày sắp đứt');
  assert.match(r.body, /5 phút/u);
  assert.equal(r.url, 'https://9band.com/dashboard');
});

test('chuỗi gặp nguy kèm từ đến hạn → một lời nhắc gộp, không hai', () => {
  const study = { daily: { '2026-09-29': day('2026-09-29', 10), '2026-09-30': day('2026-09-30', 10) } };
  const r = buildReminder({ study, topic_study: { reviews: reviews('travel', 3, TODAY) } }, TODAY, 'vi');
  assert.ok(r);
  assert.equal(r.title, 'Chuỗi 2 ngày sắp đứt');
  assert.match(r.body, /3 từ/u);
  assert.match(r.url, /quiz\?only=due$/u);
});

test('ngày giữ chuỗi đã mua tính như đã học: hôm nay được giữ thì không nhắc chuỗi', () => {
  const study = { daily: { '2026-09-29': day('2026-09-29', 10), '2026-09-30': day('2026-09-30', 10) } };
  assert.equal(buildReminder({ study, reward: { frozenDays: [TODAY] } }, TODAY, 'vi'), null);
  // Ngày giữ chuỗi ở giữa nối hai đoạn lại.
  const gap = { daily: { '2026-09-28': day('2026-09-28', 10), '2026-09-30': day('2026-09-30', 10) } };
  assert.equal(reminderFacts({ study: gap, reward: { frozenDays: ['2026-09-29'] } }, TODAY).streak, 3);
});

test('tiếng Anh: số ít / số nhiều và câu chuỗi', () => {
  const one = buildReminder({ topic_study: { reviews: reviews('travel', 1, TODAY) } }, TODAY, 'en');
  assert.equal(one?.title, 'You have 1 word to review today');
  const many = buildReminder({ topic_study: { reviews: reviews('travel', 12, TODAY) } }, TODAY, 'en');
  assert.equal(many?.title, 'You have 12 words to review today');
  const study = { daily: { '2026-09-29': day('2026-09-29', 10), '2026-09-30': day('2026-09-30', 10) } };
  const s = buildReminder({ study }, TODAY, 'en');
  assert.equal(s?.title, 'Your 2-day streak is about to break');
  assert.doesNotMatch(s?.body ?? '', /[À-ỹ]/u);
});

test('payload hỏng hoặc thiếu trường không làm sập', () => {
  assert.equal(buildReminder({ topic_study: null, study: 'x', reward: { frozenDays: 'nope' } }, TODAY, 'vi'), null);
  assert.equal(buildReminder({ topic_study: { reviews: [] }, study: { daily: [] } }, TODAY, 'vi'), null);
});

test('gửi thử luôn có nội dung, kể cả khi lời nhắc thật im lặng', () => {
  const t = testReminder({}, TODAY, 'vi');
  assert.match(t.title, /Band 9/u);
  assert.equal(t.url, 'https://9band.com/settings');
  const real = testReminder({ topic_study: { reviews: reviews('travel', 2, TODAY) } }, TODAY, 'vi');
  assert.match(real.title, /2 từ/u);
});

test('ngày Việt Nam: +7 giờ cố định, đổi ngày lúc 17:00 UTC', () => {
  assert.equal(vnTodayKey(Date.parse('2026-10-01T16:59:59Z')), '2026-10-01');
  assert.equal(vnTodayKey(Date.parse('2026-10-01T17:00:00Z')), '2026-10-02');
  // Cron chạy 13:00 UTC = 20:00 giờ Việt Nam, cùng ngày.
  assert.equal(vnTodayKey(Date.parse('2026-10-01T13:00:00Z')), '2026-10-01');
  // Qua năm mới.
  assert.equal(vnTodayKey(Date.parse('2026-12-31T17:30:00Z')), '2027-01-01');
});

/** Payload `vocab` kiểu FSRS: `n` từ của bộ `slug`, mọi thẻ đến hạn vào `due`. */
function fsrsVocab(items: { id: string; articleId: string | null; due: string }[]) {
  const entries: Record<string, unknown> = {};
  const cards: Record<string, unknown> = {};
  for (const it of items) {
    entries[it.id] = { id: it.id, word: it.id, lemma: it.id, articleId: it.articleId };
    for (const kind of ['word_to_meaning', 'meaning_to_word', 'cloze', 'multiple_choice']) cards[`${it.id}:${kind}`] = { due: it.due };
  }
  return { entries, cards };
}

test('FSRS: từ đến hạn lấy từ thẻ FSRS, đến hạn muộn trong ngày (giờ VN) vẫn tính', () => {
  const vocab = fsrsVocab([
    { id: 'topic_travel_a', articleId: 'travel', due: '2026-10-01T15:00:00+07:00' },
    { id: 'topic_travel_b', articleId: 'travel', due: '2026-09-25T08:00:00+07:00' },
    { id: 'topic_travel_c', articleId: 'travel', due: '2026-10-02T00:30:00+07:00' },
  ]);
  const r = buildReminder({ vocab }, TODAY, 'vi');
  assert.ok(r);
  assert.equal(r.title, 'Hôm nay bạn còn 2 từ cần ôn');
  assert.equal(r.url, 'https://9band.com/vocabulary/topic/travel/quiz?only=due');
});

test('FSRS thắng lịch Leitner cũ khi cả hai cùng có: số từ không lấy từ Leitner đứng yên', () => {
  const vocab = fsrsVocab([{ id: 'topic_travel_a', articleId: 'travel', due: '2026-09-30T08:00:00+07:00' }]);
  const r = buildReminder({ vocab, topic_study: { reviews: reviews('health', 40, '2026-09-20') } }, TODAY, 'vi');
  assert.equal(r?.title, 'Hôm nay bạn còn 1 từ cần ôn');
});

test('FSRS: từ lưu lúc đọc bài (không phải mục bộ) gộp vào sổ từ, link về danh sách', () => {
  const vocab = fsrsVocab([
    { id: 'topic_travel_a', articleId: 'travel', due: '2026-09-30T08:00:00+07:00' },
    { id: 'word_x', articleId: 'article-9', due: '2026-09-30T08:00:00+07:00' },
  ]);
  const r = buildReminder({ vocab }, TODAY, 'vi');
  assert.match(r?.title ?? '', /2 từ/u);
  assert.equal(r?.url, 'https://9band.com/vocabulary/topics');
});

test('FSRS: chưa có mục nào thì quay về lịch Leitner cũ', () => {
  const r = buildReminder({ vocab: { entries: {}, cards: {} }, topic_study: { reviews: reviews('travel', 5, TODAY) } }, TODAY, 'vi');
  assert.match(r?.title ?? '', /5 từ/u);
});

test('FSRS: payload vocab hỏng không làm sập', () => {
  assert.equal(buildReminder({ vocab: { entries: 'x', cards: [] } }, TODAY, 'vi'), null);
  assert.equal(buildReminder({ vocab: { entries: { a: { id: 'a' } }, cards: { 'a:cloze': { due: '2026-09-01T00:00:00Z' } } } }, TODAY, 'vi')?.title, 'Hôm nay bạn còn 1 từ cần ôn');
});
