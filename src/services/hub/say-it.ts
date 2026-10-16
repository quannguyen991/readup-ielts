import { gradeDictation, type DictationToken } from '@/services/sentence/dictation-grade';

/**
 * Chấm một cụm từ người học vừa nói, từng từ một — kiểu phản hồi "đúng, thiếu, thừa"
 * của các app luyện phát âm.
 *
 * Dùng lại bộ so khớp chuỗi con chung dài nhất của chép chính tả, nên một từ phát âm
 * lệch nhẹ về hoa/thường hay dấu câu không bị tính là sai. Đây là chấm theo CHỮ, không
 * phải theo âm: nó bắt được từ bị bỏ sót hay nói thừa, không đo được việc phát âm sai
 * một nguyên âm. Chấm theo âm là việc của Azure (`pronunciation-service.ts`).
 */

/** Đủ 90% số từ của cụm mẫu thì tính là đọc đúng — cùng mức "đúng cả câu" của chép chính tả. */
export const SAY_PASS = 0.9;

export type SayResult = {
  /** Theo thứ tự cụm mẫu, kèm các từ người học nói thừa tại đúng vị trí. */
  tokens: DictationToken[];
  /** 0–1, trên tổng số từ của cụm mẫu. */
  accuracy: number;
  correct: number;
  total: number;
  passed: boolean;
};

export function scoreSaying(target: string, transcript: string): SayResult {
  const grade = gradeDictation(target, transcript.trim());
  return {
    tokens: grade.tokens,
    accuracy: grade.accuracy,
    correct: grade.correctCount,
    total: grade.totalSourceWords,
    passed: grade.accuracy >= SAY_PASS,
  };
}

/** Điểm hiển thị (0–100), làm tròn. */
export function percentOf(result: SayResult): number {
  return Math.round(result.accuracy * 100);
}
