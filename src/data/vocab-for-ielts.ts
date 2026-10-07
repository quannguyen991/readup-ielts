import type { VocabTopic, VocabTopicWord } from './vocab-topics';
import units from './seed/vocab-for-ielts/index.json';

/**
 * "Vocabulary for IELTS" — 20 bộ từ theo 20 unit, mỗi bộ gồm từ theo danh sách
 * unit và thêm 20 từ mở rộng (`more: true`).
 *
 * VÌ SAO TÁCH KHỎI `vocab-topics.ts`: 50 bộ chủ đề kia là kho theo chủ đề ra đề và
 * có test cứng "đúng 50 bộ × 50 từ". Phần này đi theo thứ tự unit của giáo trình
 * người học đang dùng, bộ dài hơn (60–110 từ) và có từ nằm ở nhiều unit — gộp
 * chung sẽ làm vỡ test lẫn lối dẫn của Lộ trình học. Cùng khuôn `VocabTopic` nên
 * mọi màn học (Lật thẻ, Quiz, Nghe chép, Bóng bay, Kiểm tra, lịch ôn) chạy ngay:
 * `getVocabTopic()` tìm cả ba kho, chỉ cần slug không trùng — mọi slug ở đây đều
 * có tiền tố `vfi-`.
 *
 * Nội dung (nghĩa, định nghĩa, câu ví dụ, collocation) do app tự soạn; chỉ danh
 * sách từ đi theo thứ tự unit. Dữ liệu sinh bằng `node scripts/vfi/build.mjs`.
 */

export type VfiWord = VocabTopicWord & {
  /** Từ bổ sung thêm ngoài danh sách unit. */
  more?: true;
};

export type VfiDeck = Omit<VocabTopic, 'words'> & { unit: number; words: VfiWord[] };

export const VFI_PREFIX = 'vfi-';

export const VFI_DECKS: VfiDeck[] = units as unknown as VfiDeck[];

export function getVfiDeck(slug: string): VfiDeck | undefined {
  return VFI_DECKS.find((d) => d.slug === slug);
}

export const VFI_TOTALS = {
  decks: VFI_DECKS.length,
  words: VFI_DECKS.reduce((sum, d) => sum + d.words.length, 0),
  extra: VFI_DECKS.reduce((sum, d) => sum + d.words.filter((w) => w.more).length, 0),
};
