import { LISTENING_DECKS } from '@/data/vocab-listening';
import { VOCAB_TOPICS } from '@/data/vocab-topics';

import type { DeckOption } from './decks';

let cache: DeckOption[] | null = null;

/**
 * Mọi bộ chọn được: 50 chủ đề + các bộ từ vựng Nghe. Đây là chỗ kéo kho từ đầy đủ,
 * nên chỉ import ở màn chọn bộ, không import từ `decks.ts` (module đó nằm trong khung app).
 */
export function deckCatalog(): DeckOption[] {
  if (!cache) {
    cache = [
      ...VOCAB_TOPICS.map((t): DeckOption => ({ slug: t.slug, name: { vi: t.nameVi, en: t.name }, group: 'topic', words: t.words.length })),
      ...LISTENING_DECKS.map((t): DeckOption => ({ slug: t.slug, name: { vi: t.nameVi, en: t.name }, group: 'listening', words: t.words.length })),
    ];
  }
  return cache;
}
