import test from 'node:test';
import assert from 'node:assert/strict';

import { MIN_POOL, questWords, type QuestDeck } from './quest-words';

const words = (p: string, n: number) => Array.from({ length: n }, (_, i) => ({ word: `${p}${i}`, meaningVi: `nghĩa ${p}${i}` }));
const DECKS: QuestDeck[] = [
  { slug: 'so-tu', name: 'Sổ từ của bạn', group: 'mine', words: words('nb', 6) },
  { slug: 'travel', name: 'Travel', group: 'ielts', words: words('tr', 20) },
  { slug: 'health', name: 'Health', group: 'ielts', words: words('he', 20) },
  { slug: 'work', name: 'Work', group: 'ielts', words: words('wo', 20) },
  { slug: 'sat-1', name: 'SAT 1', group: 'sat', words: words('sa', 12) },
];

test('chọn một bộ: hỏi đúng các từ của bộ đó, mỗi từ mang slug của bộ', () => {
  const r = questWords('sat-1', DECKS, {}, undefined);
  assert.equal(r.focus.length, 12);
  assert.ok(r.focus.every((w) => w.slug === 'sat-1' && w.word.startsWith('sa')));
  assert.ok(r.pool.length >= MIN_POOL, 'kho nhiễu luôn đủ lớn');
  assert.equal(r.source, 'sat-1');
});

test('ôn hôm nay: chỉ các từ đến hạn, ghi đúng bộ chứa từ đó', () => {
  const r = questWords('due', DECKS, {}, new Set(['tr1', 'nb3', 'khong-co-trong-bo-nao']));
  assert.deepEqual(r.focus.map((w) => `${w.slug}:${w.word}`).sort(), ['so-tu:nb3', 'travel:tr1']);
});

test('ôn hôm nay: không phân biệt hoa thường, từ nằm ở hai bộ chỉ hỏi một lần, không có thì rỗng', () => {
  const twice: QuestDeck[] = [
    { slug: 'a', name: 'A', group: 'ielts', words: words('x', 5) },
    { slug: 'b', name: 'B', group: 'ielts', words: words('x', 5) },
  ];
  const r = questWords('due', twice, {}, new Set(['x1', 'x2']));
  assert.deepEqual(r.focus.map((w) => `${w.slug}:${w.word}`).sort(), ['a:x1', 'a:x2']);
  assert.equal(questWords('due', DECKS, {}, undefined).focus.length, 0);
});

test('tự động: từ đang học dở; chưa học gì thì lấy ba bộ IELTS đầu', () => {
  const r = questWords('auto', DECKS, { health: { he2: 1, he5: 2 } }, undefined);
  assert.deepEqual(r.focus.map((w) => w.word).sort(), ['he2', 'he5']);
  const empty = questWords('auto', DECKS, {}, undefined);
  assert.equal(empty.focus.length, 60);
});

test('bộ đã bị xoá hoặc quá ít từ: lùi về tự động', () => {
  assert.equal(questWords('my-khong-co', DECKS, {}, undefined).source, 'auto');
});
