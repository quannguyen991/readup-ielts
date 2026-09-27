import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PLAN_ORDER } from '@/lib/billing/plans';

import {
  latestWins,
  maxByKey,
  mergeRecords,
  sortByFinishedDesc,
  unionByKey,
  unionStrings,
} from './merge';
import { mergeBilling, mergeMath, mergeStudy, mergeTopicStudy, mergeVocab } from './store-merges';

/**
 * Kịch bản gốc mà mọi test dưới đây bám vào:
 *
 *   Học trên điện thoại lúc mất mạng → mở máy tính → đồng bộ.
 *
 * Buổi học trên điện thoại KHÔNG ĐƯỢC biến mất. Đó là toàn bộ lý do tồn tại của
 * `merge.ts`, và cũng là kiểu hỏng mà người dùng phát hiện muộn nhất — thường là
 * lúc họ đã mất dữ liệu của cả tuần.
 */

// -------------------------------------------------------------- hợp hai tập

test('hợp hai lịch sử: không bản ghi nào biến mất', () => {
  const phone = [{ id: 'a' }, { id: 'b' }];
  const cloud = [{ id: 'b' }, { id: 'c' }];
  const merged = unionByKey(phone, cloud, (x) => x.id);
  assert.deepEqual(merged.map((x) => x.id).sort(), ['a', 'b', 'c']);
});

test('trùng id thì giữ bản ưu tiên, không nhân đôi', () => {
  const local = [{ id: 'a', score: 9 }];
  const remote = [{ id: 'a', score: 1 }];
  const merged = unionByKey(local, remote, (x) => x.id);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.score, 9);
});

test('một trong hai bên rỗng vẫn ra đủ', () => {
  assert.equal(unionByKey([{ id: 'a' }], [], (x) => x.id).length, 1);
  assert.equal(unionByKey([], [{ id: 'a' }], (x) => x.id).length, 1);
  assert.equal(unionByKey([], [], (x: { id: string }) => x.id).length, 0);
});

test('gộp xong xếp lại mới nhất lên đầu', () => {
  const rows = [
    { id: 'a', finishedAt: '2026-08-01T00:00:00.000Z' },
    { id: 'b', finishedAt: '2026-08-22T00:00:00.000Z' },
    { id: 'c', finishedAt: '2026-08-10T00:00:00.000Z' },
  ];
  assert.deepEqual(sortByFinishedDesc(rows).map((r) => r.id), ['b', 'c', 'a']);
});

// ------------------------------------------------------------ từ điển & số

test('tiến độ đọc giữ bản xa hơn, không giữ bản ghi sau', () => {
  const local = { 'bai-1': { percent: 20 } };
  const remote = { 'bai-1': { percent: 80 } };
  const merged = mergeRecords(local, remote, (a, b) => (a.percent >= b.percent ? a : b));
  assert.equal(merged['bai-1']?.percent, 80, 'Mở lại rồi thoát ngay không được kéo tiến độ tụt.');
});

test('phút học mỗi ngày lấy số lớn hơn, KHÔNG cộng dồn', () => {
  // Cộng dồn thì đồng bộ hai lần là thành tích tự nhân đôi.
  const local = { '2026-08-22': 30 };
  const remote = { '2026-08-22': 45, '2026-08-21': 10 };
  const merged = maxByKey(local, remote);
  assert.equal(merged['2026-08-22'], 45);
  assert.equal(merged['2026-08-21'], 10);
});

test('đánh dấu bài: hợp hai danh sách, bỏ trùng', () => {
  assert.deepEqual(unionStrings(['a', 'b'], ['b', 'c']), ['a', 'b', 'c']);
});

test('cài đặt thì bên sửa sau thắng', () => {
  assert.equal(latestWins({ value: 7.5, at: 200 }, { value: 6.5, at: 100 }), 7.5);
  assert.equal(latestWins({ value: 7.5, at: 100 }, { value: 6.5, at: 200 }), 6.5);
});

// ---------------------------------------------- bộ gộp thật của từng store

test('Math: lần đầu đăng nhập thì dữ liệu trên máy được mang lên tài khoản', () => {
  // `remote = null` nghĩa là tài khoản chưa có gì. Trả về rỗng ở đây là xoá
  // sạch công sức người dùng ngay lần đăng nhập đầu tiên.
  const local = { sessions: [{ id: 's1', finishedAt: '2026-08-22T00:00:00.000Z' }] };
  const merged = mergeMath(local, null) as typeof local;
  assert.equal(merged.sessions.length, 1);
  assert.equal(merged.sessions[0]?.id, 's1');
});

test('Math: hai máy hai lượt làm bài thì giữ cả hai', () => {
  const phone = { sessions: [{ id: 's1', finishedAt: '2026-08-22T10:00:00.000Z' }] };
  const cloud = { sessions: [{ id: 's2', finishedAt: '2026-08-21T10:00:00.000Z' }] };
  const merged = mergeMath(phone, cloud) as typeof phone;
  assert.deepEqual(merged.sessions.map((s) => s.id), ['s1', 's2']);
});

test('Study: tiến độ, chuỗi ngày và đánh dấu đều được giữ từ cả hai bên', () => {
  const local = {
    sessions: [{ id: 'x', finishedAt: '2026-08-22T00:00:00.000Z' }],
    progress: { a: { lastReadAt: '2026-08-22', percentCompleted: 30 } },
    daily: { '2026-08-22': { minutes: 20, questions: 5, wordsReviewed: 0 } },
    bookmarks: ['b1'],
    targetBand: 7.5,
    dailyGoalMinutes: 60,
    readingWpm: [180],
  };
  const remote = {
    sessions: [{ id: 'y', finishedAt: '2026-08-20T00:00:00.000Z' }],
    progress: { a: { lastReadAt: '2026-08-20', percentCompleted: 90 } },
    daily: { '2026-08-22': { minutes: 45, questions: 2, wordsReviewed: 3 } },
    bookmarks: ['b2'],
    targetBand: 6.5,
    dailyGoalMinutes: 30,
    readingWpm: [150],
  };

  const merged = mergeStudy(local, remote) as typeof local;

  assert.deepEqual(merged.sessions.map((s) => s.id), ['x', 'y'], 'Mất lượt làm bài.');
  assert.equal(merged.progress.a?.percentCompleted, 90, 'Tiến độ đọc bị kéo tụt.');
  assert.equal(merged.daily['2026-08-22']?.minutes, 45, 'Phút học lấy sai bên.');
  assert.equal(merged.daily['2026-08-22']?.questions, 5, 'Số câu lấy sai bên.');
  assert.deepEqual(merged.bookmarks.sort(), ['b1', 'b2']);
  assert.equal(merged.targetBand, 7.5, 'Cài đặt phải theo máy đang dùng.');
});

test('Study: tài khoản trống thì lấy nguyên bản cục bộ', () => {
  const local = {
    sessions: [{ id: 'x', finishedAt: '2026-08-22T00:00:00.000Z' }],
    progress: {},
    daily: {},
    bookmarks: [],
    targetBand: 7,
    dailyGoalMinutes: 60,
    readingWpm: [],
  };
  assert.deepEqual(mergeStudy(local, null), local);
});

test('Vocab: thẻ FSRS giữ bản ôn gần đây hơn', () => {
  // Chọn nhầm là lịch ôn lùi về quá khứ và thẻ hiện lại ngay hôm sau.
  const local = { entries: {}, cards: { k: { last_review: '2026-08-10' } }, wordStatus: {}, reviewLog: [] };
  const remote = { entries: {}, cards: { k: { last_review: '2026-08-22' } }, wordStatus: {}, reviewLog: [] };
  const merged = mergeVocab(local, remote) as typeof local;
  assert.equal((merged.cards.k as { last_review: string }).last_review, '2026-08-22');
});

test('Vocab: từ đã lưu ở hai máy đều còn', () => {
  const local = { entries: { a: 1 }, cards: {}, wordStatus: {}, reviewLog: [] };
  const remote = { entries: { b: 2 }, cards: {}, wordStatus: {}, reviewLog: [] };
  const merged = mergeVocab(local, remote) as typeof local;
  assert.deepEqual(Object.keys(merged.entries).sort(), ['a', 'b']);
});

test('Gói: đồng bộ KHÔNG BAO GIỜ hạ gói của người dùng', () => {
  // Mua Max trên điện thoại rồi mở máy tính đang Free — kéo về Free là mất tiền oan.
  const phone = { plan: 'max', expiresAt: '2027-01-01T00:00:00.000Z', source: 'server', usage: {} };
  const cloud = { plan: 'free', expiresAt: null, source: 'local', usage: {} };
  const merged = mergeBilling(phone, cloud) as typeof phone;
  assert.equal(merged.plan, 'max');
  assert.equal(merged.expiresAt, '2027-01-01T00:00:00.000Z', 'Hạn phải đi theo gói thắng.');

  // Và đúng như vậy ở chiều ngược lại.
  assert.equal((mergeBilling(cloud, phone) as typeof phone).plan, 'max');
});

test('Gói: mọi cặp gói liền kề đều gộp ra bên CAO HƠN', () => {
  /*
    Test này bắt đúng một lỗi đã từng có thật: thứ hạng gói là một object chép
    tay, nên khi bảng giá đổi từ free/standard/vip sang free/plus/pro/max thì mọi
    gói mới xếp hạng 0 và ĐỒNG BỘ HẠ CẤP người đã trả tiền xuống Free. Duyệt cả
    PLAN_ORDER thì thêm bậc mới không bao giờ lọt nữa.
  */
  for (let i = 1; i < PLAN_ORDER.length; i += 1) {
    const lower = { plan: PLAN_ORDER[i - 1], expiresAt: null, source: 'local', usage: {} };
    const upper = { plan: PLAN_ORDER[i], expiresAt: null, source: 'server', usage: {} };
    assert.equal((mergeBilling(lower, upper) as typeof upper).plan, PLAN_ORDER[i]);
    assert.equal((mergeBilling(upper, lower) as typeof upper).plan, PLAN_ORDER[i]);
  }
});

test('Gói: số lượt đã dùng lấy bên CAO HƠN, đổi máy không reset được hạn mức', () => {
  const a = { plan: 'free', expiresAt: null, source: 'local', usage: { reading_per_day: { count: 4, periodKey: '2026-08-23' } } };
  const b = { plan: 'free', expiresAt: null, source: 'local', usage: { reading_per_day: { count: 1, periodKey: '2026-08-23' } } };
  const merged = mergeBilling(a, b) as typeof a;
  assert.equal(merged.usage.reading_per_day?.count, 4);
});

test('Gói: bộ đếm của chu kỳ CŨ không đè lên chu kỳ hiện tại', () => {
  const today = { plan: 'free', expiresAt: null, source: 'local', usage: { reading_per_day: { count: 1, periodKey: '2026-08-23' } } };
  const yesterday = { plan: 'free', expiresAt: null, source: 'local', usage: { reading_per_day: { count: 5, periodKey: '2026-08-22' } } };
  const merged = mergeBilling(today, yesterday) as typeof today;
  assert.equal(merged.usage.reading_per_day?.periodKey, '2026-08-23');
  assert.equal(merged.usage.reading_per_day?.count, 1, 'Số của hôm qua không được tính vào hôm nay.');
});

test('TopicStudy: lần đầu đăng nhập thì dữ liệu trên máy được mang lên tài khoản', () => {
  const local = {
    stages: { 'environment-nature': { forest: 2 } },
    scores: { 'environment-nature': [{ score: 100, at: '2026-09-27T10:00:00.000Z' }] },
    starred: { 'environment-nature': ['forest'] },
    lapses: { 'environment-nature': { forest: 1 } },
    mistakeLog: [{ kind: 'confused_meaning', word: 'forest', slug: 'environment-nature', at: '2026-09-27T10:00:00.000Z' }],
    learnSettings: {},
    lastAt: { 'environment-nature': '2026-09-27T10:00:00.000Z' },
  };
  const merged = mergeTopicStudy(local, null);
  assert.deepEqual(merged.stages, local.stages);
  assert.deepEqual(merged.scores, local.scores);
  assert.deepEqual(merged.starred, local.starred);
});

test('TopicStudy: gộp stages lấy chặng cao hơn, scores lấy top 5, starred hợp hai bên, lapses lấy max', () => {
  const local = {
    stages: {
      topicA: { word1: 1, word2: 2 },
      topicB: { word3: 0 },
    },
    scores: {
      topicA: [
        { score: 80, at: '2026-09-27T08:00:00.000Z' },
        { score: 60, at: '2026-09-27T07:00:00.000Z' },
      ],
    },
    starred: { topicA: ['word1'] },
    lapses: { topicA: { word1: 2, word2: 1 } },
    mistakeLog: [],
    learnSettings: { autoAdvance: true },
    lastAt: { topicA: '2026-09-27T08:00:00.000Z' },
  };

  const remote = {
    stages: {
      topicA: { word1: 2, word2: 1 },
      topicC: { word4: 2 },
    },
    scores: {
      topicA: [
        { score: 95, at: '2026-09-27T09:00:00.000Z' },
        { score: 80, at: '2026-09-27T08:00:00.000Z' }, // trùng
        { score: 70, at: '2026-09-27T06:00:00.000Z' },
      ],
    },
    starred: { topicA: ['word2'], topicC: ['word4'] },
    lapses: { topicA: { word1: 1, word2: 3 } },
    mistakeLog: [],
    learnSettings: { autoAdvance: false },
    lastAt: { topicA: '2026-09-27T09:00:00.000Z', topicC: '2026-09-27T07:00:00.000Z' },
  };

  const merged = mergeTopicStudy(local, remote);

  // stages: word1 lấy 2 (remote), word2 lấy 2 (local), word3: 0, word4: 2
  assert.equal(merged.stages.topicA?.word1, 2);
  assert.equal(merged.stages.topicA?.word2, 2);
  assert.equal(merged.stages.topicB?.word3, 0);
  assert.equal(merged.stages.topicC?.word4, 2);

  // scores: 95, 80, 70, 60 (không nhân đôi 80)
  assert.deepEqual(
    merged.scores.topicA?.map((s) => s.score),
    [95, 80, 70, 60],
  );

  // starred: hợp hai bên
  assert.deepEqual(merged.starred.topicA?.sort(), ['word1', 'word2']);
  assert.deepEqual(merged.starred.topicC, ['word4']);

  // lapses: word1 lấy 2, word2 lấy 3
  assert.equal(merged.lapses.topicA?.word1, 2);
  assert.equal(merged.lapses.topicA?.word2, 3);

  // lastAt: lấy mốc mới hơn
  assert.equal(merged.lastAt.topicA, '2026-09-27T09:00:00.000Z');
  assert.equal(merged.lastAt.topicC, '2026-09-27T07:00:00.000Z');
});

test('mọi store đều chịu được payload thiếu trường', () => {
  // Bản cũ trên máy chủ có thể thiếu trường mới thêm sau này, và bản trên máy
  // có thể là của một phiên bản app cũ hơn.
  const merges: Array<[string, (a: unknown, b: unknown | null) => unknown]> = [
    ['math', mergeMath],
    ['study', mergeStudy],
    ['vocab', mergeVocab],
    ['billing', mergeBilling],
    ['topic_study', mergeTopicStudy],
  ];
  for (const [name, merge] of merges) {
    assert.doesNotThrow(() => merge({}, {}), `${name} nổ với payload rỗng`);
    assert.doesNotThrow(() => merge({}, null), `${name} nổ khi remote null`);
    assert.doesNotThrow(() => merge(null, null), `${name} nổ khi cả hai null`);
  }
});
