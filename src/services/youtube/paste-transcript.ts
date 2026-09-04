import { groupIntoSentences, usableSentences, type TranscriptSentence } from './transcript';

/**
 * Đọc transcript người dùng DÁN VÀO từ nút "Show transcript" của YouTube.
 *
 * VÌ SAO CẦN ĐƯỜNG NÀY: YouTube đã khoá việc lấy phụ đề từ máy chủ — đường dẫn
 * phụ đề nay gắn chữ ký theo phiên trình duyệt, gọi từ nơi khác trả về rỗng
 * (đo ngày 04/09/2026: mọi client InnerTube đều trả 0 track, mọi định dạng
 * timedtext đều trả 0 byte). Route tự động vẫn giữ vì có video còn lấy được,
 * nhưng không thể là đường duy nhất.
 *
 * Dán lại KHÔNG phải giải pháp chắp vá: nó còn sạch hơn về bản quyền, vì nội
 * dung do chính người xem lấy từ trang họ đang mở, app không đi lấy hộ.
 *
 * YouTube dán ra theo hai kiểu, phải nuốt được cả hai:
 *
 *   0:12                        mốc thời gian đứng riêng một dòng
 *   Hello and welcome
 *
 *   0:12 Hello and welcome      mốc thời gian đứng đầu dòng
 */

const TIMESTAMP_ONLY = /^\s*(?:\d{1,2}:)?\d{1,2}:\d{2}\s*$/;
const LEADING_TIMESTAMP = /^\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+/;

/** "1:02:03" → 3723 giây. */
function toSeconds(hours: string | undefined, minutes: string, seconds: string): number {
  return Number(hours ?? 0) * 3600 + Number(minutes) * 60 + Number(seconds);
}

export function parsePastedTranscript(raw: string): TranscriptSentence[] {
  const lines = raw.split(/\r?\n/);
  const cues: { start: number; duration: number; text: string }[] = [];

  let pendingStart: number | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Kiểu 1: dòng chỉ có mốc thời gian — nhớ lại, chờ dòng chữ kế tiếp.
    if (TIMESTAMP_ONLY.test(trimmed)) {
      const parts = trimmed.split(':');
      pendingStart =
        parts.length === 3
          ? toSeconds(parts[0], parts[1]!, parts[2]!)
          : toSeconds(undefined, parts[0]!, parts[1]!);
      continue;
    }

    // Kiểu 2: mốc thời gian đứng đầu dòng, chữ theo ngay sau.
    const inline = trimmed.match(LEADING_TIMESTAMP);
    let text = trimmed;
    let start = pendingStart ?? (cues.length > 0 ? cues[cues.length - 1]!.start + 3 : 0);

    if (inline) {
      start = toSeconds(inline[1], inline[2]!, inline[3]!);
      text = trimmed.slice(inline[0].length).trim();
    }

    pendingStart = null;
    if (!text) continue;

    cues.push({ start, duration: 0, text });
  }

  // Suy ra độ dài mỗi mẩu từ mốc bắt đầu của mẩu kế tiếp — người dán không có
  // thông tin ấy, nhưng màn hình cần nó để tua đúng đoạn.
  for (let i = 0; i < cues.length; i += 1) {
    const next = cues[i + 1];
    cues[i]!.duration = next ? Math.max(0.5, next.start - cues[i]!.start) : 4;
  }

  return usableSentences(groupIntoSentences(cues));
}
