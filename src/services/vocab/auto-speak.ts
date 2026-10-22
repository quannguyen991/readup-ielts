/**
 * KHI NÀO TỰ PHÁT ÂM trong màn Học — hàm thuần (test được).
 *
 * Quy tắc: nghe từ tiếng Anh đúng MỘT lần mỗi câu, vào lúc từ đó xuất hiện trước mắt:
 *  - `show`   — từ tiếng Anh là đề (thẻ / trắc nghiệm chiều Anh → Việt): đọc ngay khi câu hiện ra;
 *  - `flip`   — thẻ chiều Việt → Anh: đọc khi lật ra từ;
 *  - `reveal` — câu mà đề CHƯA hiện từ tiếng Anh (Việt → Anh, điền chỗ trống, gõ từ): đọc khi đáp án
 *               lộ ra, đúng hay sai đều đọc từ đúng một lần;
 *  - null     — không đọc: chiều nghe đã tự đọc cả câu rồi (không đọc lại), hoặc chưa tới lúc.
 */
import type { StageKind } from './topic-study';

export type AutoSpeakWhen = 'show' | 'flip' | 'reveal' | null;
export type QuestionDirection = 'enToVi' | 'enToEn' | 'viToEn' | 'listen';

export function autoSpeakWhen(o: {
  kind: StageKind;
  dir: QuestionDirection;
  flipped: boolean;
  /** Đã chấm câu này (đáp án đang hiện). */
  revealed: boolean;
}): AutoSpeakWhen {
  const { kind, dir, flipped, revealed } = o;
  // Chiều "thấy từ tiếng Anh" (Anh → Việt, Anh → Anh): từ đã hiện trên đề, đọc ngay.
  const wordFirst = dir === 'enToVi' || dir === 'enToEn';
  if (kind === 'flash') {
    if (wordFirst) return 'show';
    if (dir === 'viToEn' && flipped) return 'flip';
    return null;
  }
  if (wordFirst && kind === 'mcq') return 'show';
  if (revealed && !(dir === 'listen' && kind !== 'fill')) return 'reveal';
  return null;
}
