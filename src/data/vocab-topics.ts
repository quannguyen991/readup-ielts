import topics from './seed/vocab-topics/index.json';
import { LISTENING_DECKS } from './vocab-listening';
import { VFI_DECKS } from './vocab-for-ielts';
import { VFIA_DECKS } from './vocab-for-ielts-advanced';
import globalSuccessDecks from './seed/vocab-global-success/index.json';

/**
 * Bộ từ vựng IELTS soạn sẵn theo chủ đề.
 *
 * VÌ SAO CÓ: sổ từ của app vốn chỉ đầy lên khi người học chạm vào từ trong lúc
 * đọc — tức là nó TRỐNG TRƠN ở ngày đầu tiên. Người mới mở app, vào Sổ từ, thấy
 * số 0 và một dòng chữ bảo họ đi chỗ khác trước đã. Năm mươi bộ này cho họ thứ
 * để bắt đầu ngay, và cho người sắp thi một danh sách để rà theo chủ đề.
 *
 * Dữ liệu nằm trong bundle (không gọi mạng): 2.500 từ dạng JSON là vài trăm KB,
 * rẻ hơn nhiều so với việc bắt người dùng chờ một lời gọi API để xem danh sách.
 */

export type VocabTopicWord = {
  word: string;
  pos: string;
  ipa: string;
  meaningVi: string;
  definitionEn: string;
  example: string;
  collocation: string;
  band: '5-6' | '6-7' | '7-8' | '8+';
  /** Đồng nghĩa cùng nghĩa, cùng từ loại (soạn tay, máy kiểm khi gộp). Không có thì bỏ trống. */
  synonyms?: string[];
  antonyms?: string[];
  origin?: 'source-list' | 'original-advanced';
};

export type VocabTopic = {
  slug: string;
  name: string;
  nameVi: string;
  blurb: string;
  words: VocabTopicWord[];
  /** Present on Global Success vocabulary decks. */
  grade?: number;
  unit?: number;
  sourceUrl?: string;
};

export const VOCAB_TOPICS: VocabTopic[] = topics as unknown as VocabTopic[];
/** Bộ từ nâng cao tự biên soạn theo chủ điểm Global Success; không thay cho danh sách nguyên văn trong sách. */
export const GLOBAL_SUCCESS_DECKS: VocabTopic[] = globalSuccessDecks as unknown as VocabTopic[];

/**
 * Tìm bộ theo slug — cả 50 chủ đề lẫn các bộ từ vựng Nghe (`listening-*`, xem
 * `vocab-listening.ts`) và các bộ Vocabulary for IELTS (`vfi-*`, `vfia-*`, xem `vocab-for-ielts.ts` và `vocab-for-ielts-advanced.ts`). Các màn học chỉ gọi hàm này nên bộ Nghe chạy chung được
 * mà `VOCAB_TOPICS` (và test "50 × 50") vẫn giữ nguyên.
 */
export function getVocabTopic(slug: string): VocabTopic | undefined {
  return VOCAB_TOPICS.find((t) => t.slug === slug) ?? GLOBAL_SUCCESS_DECKS.find((d) => d.slug === slug) ?? LISTENING_DECKS.find((d) => d.slug === slug) ?? VFI_DECKS.find((d) => d.slug === slug) ?? VFIA_DECKS.find((d) => d.slug === slug);
}

export const VOCAB_TOPIC_TOTALS = {
  topics: VOCAB_TOPICS.length,
  words: VOCAB_TOPICS.reduce((sum, t) => sum + t.words.length, 0),
};

/** Nhóm từ của một chủ đề theo mức band, giữ nguyên thứ tự dễ → khó. */
export const BAND_ORDER: VocabTopicWord['band'][] = ['5-6', '6-7', '7-8', '8+'];

export function groupByBand(words: VocabTopicWord[]): Array<{
  band: VocabTopicWord['band'];
  words: VocabTopicWord[];
}> {
  return BAND_ORDER.map((band) => ({ band, words: words.filter((w) => w.band === band) })).filter(
    (g) => g.words.length > 0,
  );
}
