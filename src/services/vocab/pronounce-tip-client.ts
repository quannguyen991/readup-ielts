import { parsePronounceTip, type PronounceTip, type PronounceTipInput } from './pronounce-tip';

/**
 * Gọi `/api/vocab/pronounce-tip` từ trình duyệt. Quá 15 giây thì bỏ: người học đã đọc lại
 * rồi, lời giải thích đến muộn không còn đúng lúc. Mọi lỗi đều thành một thông báo, không ném ra.
 */

export type PronounceTipResult = { ok: true; tip: PronounceTip } | { ok: false; message: string };

const TIMEOUT_MS = 15_000;

export async function requestPronounceTip(
  input: PronounceTipInput,
  opts: { token: string | null; signal?: AbortSignal; fallbackMessage: string },
): Promise<PronounceTipResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const cancel = () => controller.abort();
  opts.signal?.addEventListener('abort', cancel);
  try {
    const res = await fetch('/api/vocab/pronounce-tip', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as { tip?: unknown; error?: unknown };
    const tip = res.ok ? parsePronounceTip(body.tip, input.word) : null;
    if (tip) return { ok: true, tip };
    return { ok: false, message: typeof body.error === 'string' ? body.error : opts.fallbackMessage };
  } catch {
    return { ok: false, message: opts.fallbackMessage };
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', cancel);
  }
}
