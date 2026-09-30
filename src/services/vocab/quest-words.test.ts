import test from 'node:test';
import assert from 'node:assert/strict';

import { MIN_POOL, dueCount, questWords, type QuestDeck } from './quest-words';

const words = (p: string, n: number) => Array.from({ length: n }, (_, i) => ({ word: `${p}${i}`, meaningVi: `nghĩa ${p}${i}` }));
const DECKS: QuestDeck[] = [
  { slug: 'so-tu', name: 'Sổ từ của bạn', group: 'mine', words: words('nb', 6) },
  { slug: 'travel', name: 'Travel', group: 'ielts', words: words('tr', 20) },
  { slug: 'health', name: 'Health', group: 'ielts', words: words('he', 20) },
  { slug: 'work', name: 'Work', group: 'ielts', words: words('wo', 20) },
  { slug: 'sat-1', name: 'SAT 1', group: 'sat', words: words('sa', 12) },
];
const TODAY = '2026-10-01';

test('chọn một bộ: hỏi đúng các từ của bộ đó, mỗi từ mang slug của bộ', () => {
  const r = questWords('sat-1', DECKS, {}, {}, TODAY);
  assert.equal(r.focus.length, 12);
  assert.ok(r.focus.every((w) => w.slug === 'sat-1' && w.word.startsWith('sa')));
  assert.ok(r.pool.length >= MIN_POOL, 'kho nhiễu luôn đủ lớn');
  assert.equal(r.source, 'sat-1');
});

test('ôn hôm nay: chỉ các từ đến hạn, ghi đúng bộ gốc', () => {
  const reviews = {
    travel: { tr1: { box: 1, due: '2026-09-30', last: '2026-09-28' }, tr2: { box: 2, due: '2026-10-05', last: '2026-09-30' } },
    'so-tu': { nb3: { box: 0, due: TODAY, last: '2026-09-30' } },
  };
  const r = questWords('due', DECKS, {}, reviews, TODAY);
  assert.deepEqual(r.focus.map((w) => `${w.slug}:${w.word}`).sort(), ['so-tu:nb3', 'travel:tr1']);
  assert.equal(dueCount(reviews, TODAY), 2);
});

test('tự động: từ đang học dở; chưa học gì thì lấy ba bộ IELTS đầu', () => {
  const r = questWords('auto', DECKS, { health: { he2: 1, he5: 2 } }, {}, TODAY);
  assert.deepEqual(r.focus.map((w) => w.word).sort(), ['he2', 'he5']);
  const empty = questWords('auto', DECKS, {}, {}, TODAY);
  assert.equal(empty.focus.length, 60);
});

test('bộ đã bị xoá hoặc quá ít từ: lùi về tự động', () => {
  assert.equal(questWords('my-khong-co', DECKS, {}, {}, TODAY).source, 'auto');
});
