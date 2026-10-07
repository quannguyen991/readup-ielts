import type { VfiDeck } from './vocab-for-ielts';
import units from './seed/vocab-for-ielts-advanced/index.json';

/**
 * "Vocabulary for IELTS Advanced" — 20 bộ theo 20 unit của cuốn nâng cao, mỗi bộ
 * gồm từ theo danh sách unit và thêm 15 từ mở rộng (`more: true`).
 *
 * Cùng khuôn với `vocab-for-ielts.ts` (bản thường): cùng kiểu `VfiDeck`, slug có
 * tiền tố `vfia-`, `getVocabTopic()` tìm được nên mọi màn học chạy ngay. Dữ liệu
 * sinh bằng `node scripts/vfi/build.mjs` từ `scripts/vfi/units-adv/*.txt`.
 */

export const VFIA_PREFIX = 'vfia-';

export const VFIA_DECKS: VfiDeck[] = units as unknown as VfiDeck[];

export function getVfiaDeck(slug: string): VfiDeck | undefined {
  return VFIA_DECKS.find((d) => d.slug === slug);
}

export const VFIA_TOTALS = {
  decks: VFIA_DECKS.length,
  words: VFIA_DECKS.reduce((sum, d) => sum + d.words.length, 0),
  extra: VFIA_DECKS.reduce((sum, d) => sum + d.words.filter((w) => w.more).length, 0),
};
