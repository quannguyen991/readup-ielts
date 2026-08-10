import { AI_MODELS, getOpenAI } from './client';
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
      const client = getOpenAI();
      const response = await client.images.generate({
        model: AI_MODELS.image,
        prompt,
        size,
        n: 1,
      });

      const first = response.data?.[0];
      const encoded = first?.b64_json;

      if (!encoded) {
        // Một số proxy trả về URL thay vì base64.
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
