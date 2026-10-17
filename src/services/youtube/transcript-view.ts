import type { TranscriptSentence } from './transcript';

/**
 * Các hàm thuần cho màn phụ đề của video luyện nghe: chia lô để dịch, và tìm câu
 * đang phát theo thời gian của trình phát.
 */

/** Số câu mỗi lượt gọi dịch. Mười câu là hai lô dịch phía máy chủ, vừa trong giới hạn thời gian một lượt. */
export const LINES_PER_REQUEST = 10;

export function chunkLines(lines: string[], size: number = LINES_PER_REQUEST): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < lines.length; i += size) out.push(lines.slice(i, i + size));
  return out;
}

/**
 * Câu đang phát ở thời điểm `seconds`: câu cuối cùng có `start` không vượt quá thời điểm đó.
 * Trước câu đầu thì trả về 0, để dòng đầu luôn được tô khi video chưa chạy.
 */
export function indexAt(sentences: TranscriptSentence[], seconds: number): number {
  if (sentences.length === 0 || !Number.isFinite(seconds)) return 0;
  let lo = 0;
  let hi = sentences.length - 1;
  let found = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if ((sentences[mid]?.start ?? 0) <= seconds) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/** `75` → "1:15". Dùng cho nhãn thời gian của từng câu. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
