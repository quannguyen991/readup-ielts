import type { VocabTopic } from './vocab-topics';
import listening from './seed/vocab-listening/index.json';

/**
 * Bộ từ vựng hay gặp trong phần NGHE của IELTS, chia theo tình huống.
 *
 * VÌ SAO TÁCH KHỎI `vocab-topics.ts`: 50 bộ chủ đề kia là kho cho Reading/Writing/
 * Speaking và có test cứng "đúng 50 bộ × 50 từ". Từ vựng nghe khác tính chất — nó
 * theo tình huống của đề (đặt phòng, hỏi đường, bài giảng…) và gồm cả những từ dễ
 * viết sai chính tả. Gộp chung sẽ làm vỡ cả test lẫn lối dẫn của Lộ trình học.
 *
 * Cùng khuôn `VocabTopic` nên mọi màn học (Lật thẻ, Quiz, Nghe chép, Bóng bay,
 * Kiểm tra, lịch ôn) chạy được ngay: `getVocabTopic()` tìm cả hai kho, nên chỉ
 * cần slug không trùng — mọi slug ở đây đều có tiền tố `listening-`.
 */

/** Phần của bài thi Nghe mà bộ từ chủ yếu xuất hiện; `tips` là bộ dùng cho cả 4 phần. */
export type ListeningSection = 1 | 2 | 3 | 4 | 'tips';

export type ListeningDeck = VocabTopic & { section: ListeningSection };

export const LISTENING_PREFIX = 'listening-';

export const LISTENING_DECKS: ListeningDeck[] = listening as unknown as ListeningDeck[];

export const LISTENING_SECTIONS: {
  key: ListeningSection;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
}[] = [
  { key: 1, title: 'Section 1', titleEn: 'Section 1', subtitle: 'Hội thoại đời thường: đặt chỗ, điền biểu mẫu', subtitleEn: 'Everyday conversation: bookings and forms' },
  { key: 2, title: 'Section 2', titleEn: 'Section 2', subtitle: 'Một người nói: giới thiệu nơi chốn, bản đồ', subtitleEn: 'One speaker: places, tours and maps' },
  { key: 3, title: 'Section 3', titleEn: 'Section 3', subtitle: 'Thảo luận học thuật giữa sinh viên và thầy cô', subtitleEn: 'Academic discussion between students and tutors' },
  { key: 4, title: 'Section 4', titleEn: 'Section 4', subtitle: 'Bài giảng đại học một chiều', subtitleEn: 'A university lecture' },
  { key: 'tips', title: 'Mẹo & số', titleEn: 'Tips & numbers', subtitle: 'Số, ngày, tiền và cụm báo hiệu đổi đáp án', subtitleEn: 'Numbers, dates, money and correction phrases' },
];

export function getListeningDeck(slug: string): ListeningDeck | undefined {
  return LISTENING_DECKS.find((d) => d.slug === slug);
}

export const LISTENING_TOTALS = {
  decks: LISTENING_DECKS.length,
  words: LISTENING_DECKS.reduce((sum, d) => sum + d.words.length, 0),
};
