import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getStaticDeck } from './study-decks';
import { OXFORD_TOPIC_DECKS } from './oxford-topics-decks';
import { SAT_VOCAB_LESSONS } from './lessons/vocab-lessons';
import { VOCAB_TOPICS, GLOBAL_SUCCESS_DECKS } from './vocab-topics';
import { clozeOf } from '@/services/vocab/topic-study';
import { headword } from './study-deck-fill';

/**
 * Mỗi bộ từ phải đủ bốn dạng câu của màn Học. Dạng Điền chỗ trống chỉ hiện khi câu ví dụ
 * chứa đúng từ, nên mọi từ trong bộ phải khoét được chỗ trống.
 */

function allSlugs(): string[] {
  return [
    ...VOCAB_TOPICS.map((t) => t.slug),
    ...GLOBAL_SUCCESS_DECKS.map((t) => t.slug),
    ...OXFORD_TOPIC_DECKS.map((d) => d.slug),
    ...SAT_VOCAB_LESSONS.map((l) => l.slug),
  ];
}

test('mọi từ của mọi bộ khoét được chỗ trống (dạng Điền chỗ trống không bị mất lặng lẽ)', () => {
  const missing: string[] = [];
  for (const slug of new Set(allSlugs())) {
    const deck = getStaticDeck(slug);
    if (!deck) continue;
    for (const w of deck.words) {
      if (!clozeOf(w.example ?? '', w.word)) missing.push(`${slug}: ${w.word}`);
    }
  }
  assert.deepEqual(missing, [], `còn ${missing.length} từ thiếu câu ví dụ`);
});

test('tên mục không còn phần chú thích kiểu "(n)", "=", "➔", "#"', () => {
  const messy: string[] = [];
  for (const slug of new Set(allSlugs())) {
    const deck = getStaticDeck(slug);
    if (!deck) continue;
    for (const w of deck.words) {
      if (/[=➔#]|\(\w+\.?\)/.test(w.word)) messy.push(`${slug}: ${w.word}`);
    }
  }
  assert.deepEqual(messy, []);
});

test('không có hai mục trùng tên trong cùng một bộ sau khi làm sạch', () => {
  const dupes: string[] = [];
  for (const slug of new Set(allSlugs())) {
    const deck = getStaticDeck(slug);
    if (!deck) continue;
    const seen = new Set<string>();
    for (const w of deck.words) {
      const k = w.word.toLowerCase();
      if (seen.has(k)) dupes.push(`${slug}: ${w.word}`);
      seen.add(k);
    }
  }
  assert.deepEqual(dupes, []);
});
