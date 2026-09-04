import { AI_MODELS } from './client';
import { AiError } from './errors';
import { withRetry } from './retry';
import type { AssetSize } from './asset-catalog';

export type GeneratedImage = {
  bytes: Uint8Array;
  contentType: string;
  model: string;
  width: number;
  height: number;
};

/**
 * Gọi endpoint images của proxy tương thích OpenAI và trả về bytes PNG.
 * Có retry cho lỗi tạm thời; lỗi cấu hình / nội dung bị chặn thì ném ngay.
 */
export async function generateImage(
  prompt: string,
  size: AssetSize,
  options: { label?: string; onRetry?: (msg: string) => void } = {},
): Promise<GeneratedImage> {
  const label = options.label ?? 'generateImage';
  const [width, height] = size.split('x').map((n) => Number(n));

  const b64 = await withRetry(
    async () => {
      /*
        Gọi bằng `fetch` THƯỜNG, không dùng SDK OpenAI.

        ai-box trả 403 "Your request was blocked" cho mọi request đến từ SDK —
        đã dựng lại đúng payload ấy bằng fetch thì máy chủ nhận bình thường, nên
        thứ bị chặn là mấy header SDK tự thêm chứ không phải nội dung. Đây là
        cùng một lý do lớp gọi chữ trong `fallback.ts` cũng đi bằng fetch.
      */
      const res = await fetch(`${imageBaseUrl()}/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${imageApiKey()}` },
        body: JSON.stringify({ model: AI_MODELS.image, prompt, size, n: 1 }),
        signal: AbortSignal.timeout(240_000),
      });

      if (!res.ok) {
        const detail = (await res.text()).slice(0, 200);
        throw new AiError('bad_response', `Sinh ảnh thất bại (HTTP ${res.status}): ${detail}`, {
          status: res.status,
          retryable: res.status >= 500 || res.status === 429,
        });
      }

      const response = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
      const first = response.data?.[0];
      const encoded = first?.b64_json;

      if (!encoded) {
        // Một số proxy trả về URL thay vì base64 — qwen-image trả URL.
        if (first?.url) return await downloadAsBase64(first.url);
        throw new AiError('bad_response', 'Phản hồi ảnh không có b64_json lẫn url.');
      }

      return encoded;
    },
    {
      label,
      attempts: 4,
      onRetry: ({ attempt, delayMs, error }) =>
        options.onRetry?.(`  ↻ ${label}: lần ${attempt} lỗi (${error.code}), thử lại sau ${delayMs}ms`),
    },
  );

  return {
    bytes: base64ToBytes(b64),
    contentType: 'image/png',
    model: AI_MODELS.image,
    width: width ?? 1024,
    height: height ?? 1024,
  };
}

async function downloadAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new AiError('bad_response', `Tải ảnh từ URL thất bại: HTTP ${res.status}`, {
      status: res.status,
      retryable: res.status >= 500,
    });
  }
  const buffer = await res.arrayBuffer();
  return bytesToBase64(new Uint8Array(buffer));
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'));

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');

  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Proxy dùng cho ảnh. Tách khỏi proxy chữ vì chỉ ai-box có model ảnh. */
function imageBaseUrl(): string {
  const url = process.env.IMAGE_BASE_URL ?? process.env.AI_PRIMARY_BASE_URL ?? process.env.OPENAI_BASE_URL;
  if (!url) throw new AiError('missing_config', 'Chưa cấu hình proxy sinh ảnh.');
  return url.replace(/\/+$/, '');
}

function imageApiKey(): string {
  const key = process.env.IMAGE_API_KEY ?? process.env.AI_PRIMARY_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!key) throw new AiError('missing_config', 'Chưa cấu hình khoá cho proxy sinh ảnh.');
  return key;
}
