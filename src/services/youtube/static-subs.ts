import type { TranscriptSentence } from './transcript';

/**
 * Phụ đề tiếng Anh dựng sẵn của video trong thư viện: tệp tĩnh `/video-subs/<id>.json`
 * (tạo bằng `scripts/video/fetch_subs.py`). Vào luyện là có ngay, không phải dán phụ đề hay gọi máy chủ.
 *
 * Hàm thuần theo `fetchFn` để test được; lỗi mạng / 404 / dữ liệu hỏng đều trả null (rơi xuống đường dán phụ đề cũ).
 */
/** `vi`: bản dịch tiếng Việt cùng thứ tự với `sentences` (chỉ có khi đã dịch xong và đúng số câu). */
export type StaticSubs = { sentences: TranscriptSentence[]; auto: boolean; vi?: string[] };

type Fetch = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

export function parseStaticSubs(raw: unknown): StaticSubs | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as { source?: unknown; sentences?: unknown; vi?: unknown };
  if (!Array.isArray(o.sentences)) return null;
  const sentences: TranscriptSentence[] = [];
  for (const s of o.sentences) {
    const x = s as { start?: unknown; end?: unknown; text?: unknown };
    if (typeof x.start === 'number' && typeof x.end === 'number' && typeof x.text === 'string' && x.text.trim()) {
      sentences.push({ start: x.start, end: x.end, text: x.text.trim() });
    }
  }
  if (sentences.length < 3) return null;
  // Bản dịch chỉ nhận khi KHỚP SỐ CÂU gốc (app ghép theo vị trí); lệch thì bỏ để không dịch sai chỗ.
  const vi =
    Array.isArray(o.vi) && sentences.length === (o.sentences as unknown[]).length && o.vi.length === sentences.length && o.vi.every((x) => typeof x === 'string' && x.trim())
      ? (o.vi as string[]).map((x) => x.trim())
      : undefined;
  return { sentences, auto: o.source === 'auto', ...(vi ? { vi } : null) };
}

export async function fetchStaticSubs(videoId: string, fetchFn?: Fetch): Promise<StaticSubs | null> {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
  const f = fetchFn ?? (typeof fetch === 'function' ? (fetch as unknown as Fetch) : null);
  if (!f) return null;
  try {
    const res = await f(`/video-subs/${videoId}.json`);
    if (!res.ok) return null;
    return parseStaticSubs(await res.json());
  } catch {
    return null;
  }
}
