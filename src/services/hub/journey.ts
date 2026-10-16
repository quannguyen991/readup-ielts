import { PHONEMES } from './phonemes';
import { ALL_LESSONS } from './grammar-course';
import { ROLEPLAYS } from './roleplay';

/**
 * Tiến độ "Hành trình" trên màn Hôm nay: một con số ước lượng từ việc luyện tập,
 * không phải kết quả thi. Trọng số thiên về phát âm (nền của nói), rồi ngữ pháp, rồi nhập vai.
 */
export const PHONEME_TOTAL = PHONEMES.length;
export const GRAMMAR_TOTAL = ALL_LESSONS.length;
export const ROLEPLAY_TOTAL = ROLEPLAYS.length;

export function journeyRatio(input: { phonemesMastered: number; lessonsPassed: number; roleplaysPassed: number }): number {
  const part = (done: number, total: number) => Math.min(1, Math.max(0, done) / total);
  const r = 0.5 * part(input.phonemesMastered, PHONEME_TOTAL) + 0.3 * part(input.lessonsPassed, GRAMMAR_TOTAL) + 0.2 * part(input.roleplaysPassed, ROLEPLAY_TOTAL);
  return Math.round(r * 1000) / 1000;
}
