import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NOTEBOOK_SLUG } from '@/data/study-decks';
import { NOTEBOOK_DECK } from './fsrs-due';
import { dueByBaseDeckToday, dueBySlugToday, dueEntriesToday, dueLemmasToday, entryInWords, forecastFsrs, studiedLemmas, type VocabSlice } from './topic-fsrs';

const NOW = new Date(2026, 9, 30, 9, 0, 0); // 30/10/2026 09:00 giờ máy
const at = (dayOffset: number, hour: number) => new Date(2026, 9, 30 + dayOffset, hour, 0, 0).toISOString();

function slice(items: { id: string; word: string; articleId: string | null; due: string; reps?: number }[]): VocabSlice {
  const entries: Record<string, unknown> = {};
  const cards: Record<string, unknown> = {};
  for (const it of items) {
    entries[it.id] = { id: it.id, word: it.word, lemma: it.word, articleId: it.articleId };
    for (const kind of ['word_to_meaning', 'meaning_to_word', 'cloze', 'multiple_choice']) cards[`${it.id}:${kind}`] = { due: it.due, reps: it.reps ?? 0 };
  }
  return { entries, cards } as unknown as VocabSlice;
}

const isDeck = (s: string) => s.startsWith('edu');

test('đến hạn muộn trong hôm nay vẫn tính là hôm nay; sáng mai thì không', () => {
  const s = slice([
    { id: 'a', word: 'alpha', articleId: 'edu--B1', due: at(0, 20) },
    { id: 'b', word: 'beta', articleId: 'edu--B1', due: at(1, 7) },
  ]);
  assert.deepEqual(dueEntriesToday(s, NOW).map((e) => e.id), ['a']);
});

test('từ quá hạn nhiều ngày vẫn đến hạn hôm nay', () => {
  const s = slice([{ id: 'a', word: 'alpha', articleId: 'edu--B1', due: at(-5, 8) }]);
  assert.equal(dueEntriesToday(s, NOW).length, 1);
});

test('chỉ cần một thẻ đến hạn là cả từ đến hạn', () => {
  const s = slice([{ id: 'a', word: 'alpha', articleId: 'edu--B1', due: at(3, 8) }]);
  (s.cards as Record<string, { due: string }>)['a:cloze']!.due = at(0, 10);
  assert.equal(dueEntriesToday(s, NOW).length, 1);
});

test('gom theo bộ; từ không thuộc bộ học được (lưu lúc đọc bài) vào sổ từ', () => {
  const s = slice([
    { id: 'a', word: 'alpha', articleId: 'edu--B1', due: at(0, 8) },
    { id: 'b', word: 'beta', articleId: 'edu--B1', due: at(0, 8) },
    { id: 'c', word: 'gamma', articleId: 'article-42', due: at(0, 8) },
    { id: 'd', word: 'delta', articleId: null, due: at(0, 8) },
  ]);
  const by = dueBySlugToday(s, NOW, isDeck);
  assert.equal(by['edu--B1']?.length, 2);
  assert.equal(by['so-tu']?.length, 2);
});

test('khớp theo từ của bộ, không theo mã bộ ghi trên mục: từ lưu từ bài đọc vẫn thuộc bộ khi từ nằm trong bộ', () => {
  const s = slice([
    { id: 'a', word: 'Degree', articleId: 'article-42', due: at(0, 8) },
    { id: 'b', word: 'campus', articleId: 'edu--B1', due: at(2, 8) },
  ]);
  const due = dueLemmasToday(s, NOW);
  assert.equal(due.has('degree'), true);
  assert.equal(due.has('campus'), false);
  const deckWords = new Set(['degree', 'campus']);
  assert.deepEqual(Object.values(s.entries).filter((e) => entryInWords(e, deckWords)).map((e) => e.id).sort(), ['a', 'b']);
});

test('đã học: chỉ tính từ có thẻ đã ôn (reps > 0), mục mới lưu chưa trả lời thì không', () => {
  const s = slice([
    { id: 'a', word: 'alpha', articleId: 'article-1', due: at(0, 8), reps: 2 },
    { id: 'b', word: 'beta', articleId: 'edu--B1', due: at(0, 8), reps: 0 },
  ]);
  assert.deepEqual([...studiedLemmas(s)], ['alpha']);
});

test('dự báo: quá hạn vào hôm nay, hôm sau vào đúng ngày, quá 7 ngày bị bỏ', () => {
  const s = slice([
    { id: 'a', word: 'a', articleId: 'edu--B1', due: at(-2, 8) },
    { id: 'b', word: 'b', articleId: 'edu--B1', due: at(1, 8) },
    { id: 'c', word: 'c', articleId: 'edu--B1', due: at(1, 15) },
    { id: 'd', word: 'd', articleId: 'edu--B1', due: at(9, 8) },
  ]);
  const f = forecastFsrs(s, NOW, 7);
  assert.equal(f.length, 7);
  assert.equal(f[0]!.count, 1);
  assert.equal(f[1]!.count, 2);
  assert.equal(f.reduce((a, x) => a + x.count, 0), 3);
});

test('mã sổ từ ở module thuần khớp mã ở dữ liệu bộ từ', () => {
  assert.equal(NOTEBOOK_DECK, NOTEBOOK_SLUG);
});

test('theo bộ gốc: gộp các cấp, bỏ từ trùng, bỏ mục không thuộc bộ nào', () => {
  const s = slice([
    { id: 'a', word: 'degree', articleId: 'education--B1', due: at(0, 8) },
    { id: 'b', word: 'Degree', articleId: 'education--all', due: at(0, 8) },
    { id: 'c', word: 'campus', articleId: 'education--B2', due: at(0, 8) },
    { id: 'd', word: 'gamma', articleId: 'article-42', due: at(0, 8) },
  ]);
  const by = dueByBaseDeckToday(s, NOW);
  assert.deepEqual(Object.keys(by), ['education']);
  assert.deepEqual([...by.education!].sort(), ['campus', 'degree']);
});
