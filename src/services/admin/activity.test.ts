import test from 'node:test';
import assert from 'node:assert/strict';

import { summarizeUserState, type UserStateRow } from './activity';

const row = (store_key: string, payload: unknown, updated_at = '2026-09-12T16:59:00.000Z'): UserStateRow => ({
  store_key,
  payload,
  updated_at,
});

/** Đúng hình dạng đọc được từ CSDL thật ngày 13/09/2026. */
const REAL: UserStateRow[] = [
  row('study', {
    daily: {
      '2026-08-11': { date: '2026-08-11', minutes: 2, questions: 20, wordsReviewed: 0 },
      '2026-08-12': { date: '2026-08-12', minutes: 45, questions: 13 },
    },
    progress: {
      a1: { articleId: 'a1', percentCompleted: 100 },
      a2: { articleId: 'a2', percentCompleted: 42 },
    },
    sessions: [{ id: 's1' }, { id: 's2' }],
    bookmarks: ['a1'],
  }),
  row('vocab', { entries: { v1: {}, v2: {} }, cards: { 'v1:cloze': {}, 'v1:mc': {}, 'v2:cloze': {} } }),
  row('math', { sessions: [{ id: 'm1' }] }, '2026-09-13T02:00:00.000Z'),
  row('billing', { plan: 'pro', source: 'trial' }),
];

test('gộp đủ bốn kho thành một bản tóm tắt', () => {
  const out = summarizeUserState(REAL);
  assert.equal(out.activeDays, 2);
  assert.equal(out.minutes, 47);
  assert.equal(out.questions, 33);
  assert.equal(out.firstDay, '2026-08-11');
  assert.equal(out.lastDay, '2026-08-12');
  assert.equal(out.readingSessions, 2);
  assert.equal(out.mathSessions, 1);
  assert.equal(out.articlesRead, 2);
  assert.equal(out.articlesFinished, 1, 'chỉ bài đọc hết 100% mới tính là xong');
  assert.equal(out.vocabWords, 2);
  assert.equal(out.fsrsCards, 3);
  assert.equal(out.bookmarks, 1);
  assert.equal(out.planOnDevice, 'pro');
});

test('lần đồng bộ cuối là mốc MỚI NHẤT trong các kho, không phải kho đầu tiên', () => {
  assert.equal(summarizeUserState(REAL).lastSyncAt, '2026-09-13T02:00:00.000Z');
  assert.deepEqual(summarizeUserState(REAL).syncedStores, ['billing', 'math', 'study', 'vocab']);
});

test('đếm được cả kho lưu dạng mảng lẫn dạng object theo id', () => {
  const asArray = summarizeUserState([row('vocab', { entries: [{}, {}, {}], cards: [{}] })]);
  assert.equal(asArray.vocabWords, 3);
  assert.equal(asArray.fsrsCards, 1);
});

test('tài khoản chưa đồng bộ lần nào: tất cả bằng 0, không ném lỗi', () => {
  const out = summarizeUserState([]);
  assert.equal(out.lastSyncAt, null);
  assert.equal(out.activeDays, 0);
  assert.equal(out.vocabWords, 0);
  assert.deepEqual(out.syncedStores, []);
});

test('payload méo không làm đổ trang quản trị', () => {
  const out = summarizeUserState([
    row('study', null),
    row('vocab', 'khong phai json object'),
    row('math', { sessions: 'hong' }),
    row('billing', { plan: 42 }),
  ]);
  assert.equal(out.minutes, 0);
  assert.equal(out.mathSessions, 0);
  assert.equal(out.planOnDevice, null, 'gói không phải chuỗi thì coi như không biết');
});

test('số phút hỏng trong một ngày không kéo tổng thành NaN', () => {
  const out = summarizeUserState([
    row('study', { daily: { '2026-09-01': { minutes: 'nhieu', questions: 5 }, '2026-09-02': { minutes: 10 } } }),
  ]);
  assert.equal(out.minutes, 10);
  assert.equal(out.questions, 5);
});
