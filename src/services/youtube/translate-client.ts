import { chunkLines } from './transcript-view';

export type TranslateOutcome =
  | { ok: true; lines: string[] }
  | { ok: false; reason: 'signed_out' | 'quota' | 'failed'; message: string };

/**
 * Dịch cả danh sách câu của một video, lô nào xong báo tiến độ lô đó.
 *
 * Làm tuần tự chứ không song song: mỗi lô đốt một lượt AI, và song song chỉ làm tăng
 * số lượt bị từ chối khi gần hết hạn mức mà không nhanh hơn đáng kể.
 */
export async function translateAllLines(
  lines: string[],
  token: string | null,
  onProgress?: (done: number, total: number) => void,
): Promise<TranslateOutcome> {
  if (!token) return { ok: false, reason: 'signed_out', message: 'Đăng nhập để dịch phụ đề.' };

  const out: string[] = [];
  for (const part of chunkLines(lines)) {
    let res: Response;
    try {
      res = await fetch('/api/youtube/translate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: part }),
      });
    } catch {
      return { ok: false, reason: 'failed', message: 'Mất kết nối. Thử lại khi có mạng.' };
    }

    const data = (await res.json().catch(() => ({}))) as { lines?: unknown; error?: string };
    if (res.status === 429) return { ok: false, reason: 'quota', message: data.error ?? 'Đã hết lượt AI của tháng này.' };
    if (!res.ok || !Array.isArray(data.lines)) {
      return { ok: false, reason: 'failed', message: data.error ?? 'Dịch chưa được, thử lại sau.' };
    }

    for (let j = 0; j < part.length; j += 1) out.push(String(data.lines[j] ?? ''));
    onProgress?.(out.length, lines.length);
  }
  return { ok: true, lines: out };
}
