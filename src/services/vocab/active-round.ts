/**
 * VÒNG HỌC ĐANG DỞ của màn Học — luật cập nhật thuần (store chỉ gọi hàm này).
 *
 * Mỗi lần lưu gắn mốc giờ `at`, vì phép gộp đồng bộ giữa các máy chọn bản MỚI HƠN. Ba điều làm cho phép gộp đúng:
 *  - mở lại màn mà chưa trả lời thêm câu nào thì KHÔNG đóng dấu giờ mới (nếu không, bản cũ ở máy này thắng bản học tiếp
 *    ở máy kia chỉ vì được mở sau);
 *  - vòng xong không xoá hẳn mục mà để lại dấu `cleared` có `at` (nếu xoá, lần gộp sau lấy lại vòng cũ từ máy kia);
 *  - đã có dấu thì không đóng dấu lại.
 */
export type RoundLike = { words: string[]; asked: number; step: number; at?: number; cleared?: boolean };

/** Trả về bảng vòng mới, hoặc `null` nếu không có gì thay đổi (để store không phát lại cập nhật). */
export function nextRounds<R extends RoundLike>(
  rounds: Record<string, R>,
  slug: string,
  round: R | null,
  nowMs: number,
  clearedMark: R,
): Record<string, R> | null {
  const cur = rounds[slug];
  if (round) {
    if (cur && !cur.cleared && cur.asked === round.asked && cur.step === round.step && cur.words.length === round.words.length) return null;
    return { ...rounds, [slug]: { ...round, at: nowMs } };
  }
  if (!cur || cur.cleared) return null;
  return { ...rounds, [slug]: { ...clearedMark, at: nowMs } };
}

/** Bỏ hẳn vòng của một bộ (xoá tiến độ bộ đó; dấu xoá `resets` lo phần các máy khác). */
export function withoutRound<R>(rounds: Record<string, R>, slug: string): Record<string, R> {
  const out = { ...rounds };
  delete out[slug];
  return out;
}
