import type { TranscriptSentence } from './transcript';

/** Số từ tối đa của một lượt chép. Câu dài hơn được chia đều thành nhiều lượt. */
export const MAX_DRILL_WORDS = 9;

/**
 * Một lượt chép. Lượt là một đoạn của câu phụ đề, nên giữ thêm `parent` để
 * tìm lại câu gốc (bản dịch, danh sách câu).
 */
export type DictationDrill = TranscriptSentence & {
  /** Vị trí câu gốc trong danh sách phụ đề. */
  parent: number;
  /** `true` khi lượt là nguyên câu gốc, khi đó bản dịch của câu áp dụng được. */
  whole: boolean;
};

/*
  Chia câu dài thành lượt. Số lượt là số nguyên nhỏ nhất để không lượt nào quá
  9 từ, rồi chia số từ đều cho các lượt, nên lệch nhau tối đa một từ. Thời gian
  của từng lượt nội suy theo tỉ lệ số từ, vì phụ đề YouTube không có mốc theo từ.
*/
export function splitForDictation(sentences: TranscriptSentence[], maxWords = MAX_DRILL_WORDS): DictationDrill[] {
  return sentences.flatMap((sentence, parent): DictationDrill[] => {
    const words = sentence.text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return [{ ...sentence, parent, whole: true }];

    const count = Math.ceil(words.length / maxWords);
    const base = Math.floor(words.length / count);
    const extra = words.length % count;
    const span = sentence.end - sentence.start;
    let offset = 0;

    return Array.from({ length: count }, (_, part) => {
      const from = offset;
      offset += base + (part < extra ? 1 : 0);
      return {
        start: sentence.start + span * (from / words.length),
        end: sentence.start + span * (offset / words.length),
        text: words.slice(from, offset).join(' '),
        parent,
        whole: false,
      };
    });
  });
}
