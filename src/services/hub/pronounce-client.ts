import type { Assessment } from './pronunciation-service';

/** Đổi mảng byte thành base64 để gửi trong JSON (không dùng Buffer phía trình duyệt). */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export type DetailedResult =
  | { ok: true; assessment: Assessment }
  | { ok: false; reason: 'not_configured' | 'signed_out' | 'quota' | 'error'; message: string };

/** Gửi WAV lên máy chủ để chấm chi tiết. Không có khoá dịch vụ thì báo `not_configured`. */
export async function requestDetailed(referenceText: string, wav: Uint8Array, token: string | null): Promise<DetailedResult> {
  if (!token) return { ok: false, reason: 'signed_out', message: 'Đăng nhập để chấm chi tiết.' };
  try {
    const res = await fetch('/api/hub/pronounce', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceText, wavBase64: toBase64(wav) }),
    });
    const data = (await res.json().catch(() => ({}))) as { assessment?: Assessment; code?: string; error?: string };
    if (res.ok && data.assessment) return { ok: true, assessment: data.assessment };
    if (res.status === 503 || data.code === 'not_configured') return { ok: false, reason: 'not_configured', message: data.error ?? 'Chưa bật.' };
    if (res.status === 429 || data.code === 'quota_exceeded') return { ok: false, reason: 'quota', message: data.error ?? 'Hết lượt chấm hôm nay.' };
    return { ok: false, reason: 'error', message: data.error ?? 'Không chấm được, thử lại sau.' };
  } catch {
    return { ok: false, reason: 'error', message: 'Mất kết nối, thử lại sau.' };
  }
}
