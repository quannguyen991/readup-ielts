import assert from 'node:assert/strict';
import { test } from 'node:test';

import { backupLeitner, dueLoadByDay, dueTopicWords, gradeTopicWord, leitnerToFsrs, spreadDue, topicEntryId, topicWordInfo, type VocabSlice } from './topic-fsrs';
import { cardKey } from './schedule';

const empty: VocabSlice = { entries: {}, cards: {} };
const WORD = 'accounting';
const SLUG = 'vfia-unit-05';

test('mã mục ổn định, không phân biệt hoa thường', () => {
  assert.equal(topicEntryId(SLUG, ' Academic '), `topic_${SLUG}_academic`);
});

test('trả lời sai thì ngày ôn gần hơn trả lời đúng', () => {
  if (!topicWordInfo(SLUG, WORD)) return;
  const now = new Date('2026-10-24T08:00:00Z');
  const id = topicEntryId(SLUG, WORD);
  const right = gradeTopicWord(empty, SLUG, WORD, true, now);
  const wrong = gradeTopicWord(empty, SLUG, WORD, false, now);
  const dueRight = new Date(right.cards[cardKey(id, 'word_to_meaning')]!.due).getTime();
  const dueWrong = new Date(wrong.cards[cardKey(id, 'word_to_meaning')]!.due).getTime();
  assert.ok(dueWrong < dueRight);
});

test('một lần trả lời chấm đủ bốn dạng thẻ với cùng một ngày ôn', () => {
  if (!topicWordInfo(SLUG, WORD)) return;
  const id = topicEntryId(SLUG, WORD);
  const out = gradeTopicWord(empty, SLUG, WORD, true, new Date('2026-10-24T08:00:00Z'));
  const kinds = ['word_to_meaning', 'meaning_to_word', 'cloze', 'multiple_choice'] as const;
  const dues = kinds.map((k) => out.cards[cardKey(id, k)]!.due);
  assert.equal(new Set(dues).size, 1);
});

test('từ không có trong dữ liệu bộ thì giữ nguyên trạng thái', () => {
  assert.equal(gradeTopicWord(empty, SLUG, 'zzqxwvk', true, new Date()), empty);
});

test('dueTopicWords chỉ lấy từ đã đến hạn của đúng bộ', () => {
  if (!topicWordInfo(SLUG, WORD)) return;
  const now = new Date('2026-10-24T08:00:00Z');
  const state = gradeTopicWord(empty, SLUG, WORD, false, now);
  assert.equal(dueTopicWords(state, SLUG, now).size, 0);
  assert.equal(dueTopicWords(state, 'other', now).size, 0);
  const later = new Date(now.getTime() + 30 * 86_400_000);
  assert.ok(dueTopicWords(state, SLUG, later).has(WORD));
});

test('chuyển Leitner sang FSRS: từ chưa có mục được đặt đúng ngày đã xếp', () => {
  if (!topicWordInfo(SLUG, WORD)) return;
  const reviews = { [SLUG]: { [WORD]: { box: 1, due: '2026-11-02', last: '2026-10-24' } } };
  const out = leitnerToFsrs(empty, reviews, {}, new Date('2026-10-24T08:00:00Z'));
  const card = out.cards[cardKey(topicEntryId(SLUG, WORD), 'word_to_meaning')]!;
  assert.ok(card.due.startsWith('2026-11-02'));
});

test('sao lưu: không có bộ nhớ thì không chuyển; có thì ghi và không đè bản đầu trong ngày', () => {
  const data = new Map<string, string>();
  const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
  assert.equal(backupLeitner({}, {}, '2026-10-24', null), false);
  assert.equal(backupLeitner({ a: {} }, {}, '2026-10-24', storage), true);
  const first = data.get('readup:backup:leitner:2026-10-24');
  assert.equal(backupLeitner({ b: {} }, {}, '2026-10-24', storage), true);
  assert.equal(data.get('readup:backup:leitner:2026-10-24'), first);
});

test('ngày đầy thì lùi sang ngày còn chỗ; ngày còn chỗ thì giữ nguyên', () => {
  const now = new Date('2026-10-24T08:00:00');
  const ideal = new Date('2026-10-26T08:00:00');
  const full = { '2026-10-26': 40 };
  assert.equal(spreadDue(ideal, full, now, 40).getDate(), 27);
  assert.equal(spreadDue(ideal, { '2026-10-26': 39 }, now, 40).getDate(), 26);
});

test('quá hạn thì tính từ hôm nay', () => {
  const now = new Date('2026-10-24T08:00:00');
  const overdue = new Date('2026-10-20T08:00:00');
  assert.equal(spreadDue(overdue, {}, now).getDate(), 24);
});

test('tải theo ngày không tính chính từ đang xếp', () => {
  const cards = {
    'a:word_to_meaning': { due: '2026-10-26T08:00:00.000Z' },
    'b:word_to_meaning': { due: '2026-10-26T08:00:00.000Z' },
    'b:cloze': { due: '2026-10-26T08:00:00.000Z' },
  };
  const load = dueLoadByDay(cards as never, 'a');
  assert.equal(Object.values(load).reduce((x, y) => x + y, 0), 1);
});
